import { DELHI_SEGMENTS, SEGMENT_BY_ID, STOP_BY_ID } from '../data/delhiNetwork';
import type {
  MapMatchedObservation,
  ModelValidationMetrics,
  RoadSegment,
  SegmentTrafficState,
  TrafficLevel,
  ValidationSample,
} from '../types/transit';

/**
 * Interpolate diurnal speed multiplier smoothly for any fractional hour (e.g. 18.25 = 6:15 PM).
 */
export function getDiurnalFactor(diurnal: number[], simHour: number): number {
  const normalized = ((simHour % 24) + 24) % 24;
  const h0 = Math.floor(normalized);
  const h1 = (h0 + 1) % 24;
  const frac = normalized - h0;
  return diurnal[h0] * (1 - frac) + diurnal[h1] * frac;
}

export function classifyTrafficLevel(congestionIndex: number): TrafficLevel {
  if (congestionIndex < 0.28) return 'FREE_FLOW';
  if (congestionIndex < 0.50) return 'MODERATE';
  if (congestionIndex < 0.70) return 'HEAVY';
  return 'SEVERE';
}

export function trafficLevelColor(level: TrafficLevel): string {
  switch (level) {
    case 'FREE_FLOW':
      return '#1A7A4A';
    case 'MODERATE':
      return '#C88A04';
    case 'HEAVY':
      return '#D45815';
    case 'SEVERE':
      return '#C4272F';
  }
}

export function trafficLevelLabel(level: TrafficLevel): string {
  switch (level) {
    case 'FREE_FLOW':
      return 'Free Flow';
    case 'MODERATE':
      return 'Moderate';
    case 'HEAVY':
      return 'Heavy';
    case 'SEVERE':
      return 'Severe';
  }
}

/**
 * Pravaah Hybrid Real-Time Bus Traffic Model.
 *
 * Turns continuous noisy bus GPS probes into a city-scale directed road-segment traffic model:
 * 1. Per-segment 1D Kalman Filter fusing incoming map-matched bus probes with adaptive noise R
 * 2. Staleness mean-reversion toward the segment's historical diurnal speed profile
 * 3. Spatial graph spillback propagation from downstream bottlenecks to upstream links
 * 4. Separate bus-stop dwell time estimation (prevents boarding stops from corrupting link speed)
 * 5. Short-term (+15m..+60m) exponentially damped anomaly horizon forecasting
 * 6. Live empirical validation benchmark (Static GTFS vs Last-Ping vs Pravaah)
 */
export class BusTrafficModel {
  private states = new Map<string, SegmentTrafficState>();
  private recentProbeTimestamps = new Map<string, number[]>();
  private validationSamples: ValidationSample[] = [];
  private simHour: number;

  // Kalman & spatial model hyperparameters
  private readonly processNoiseQ = 0.65; // (km/h)^2 per minute of drift
  private readonly probeNoiseR = 7.5; // (km/h)^2 measurement variance of single bus GPS probe
  private readonly stalenessHalfLifeMin = 8.0;
  private readonly forecastDecayTauMin = 38.0;
  private readonly spillbackAlpha = 0.16;

  constructor(initialSimHour = 18.25, initialNowMs = Date.now()) {
    this.simHour = initialSimHour;
    this.reset(initialSimHour, initialNowMs);
  }

  public reset(simHour: number, nowMs: number): void {
    this.simHour = simHour;
    this.states.clear();
    this.recentProbeTimestamps.clear();
    this.validationSamples = [];

    for (const seg of DELHI_SEGMENTS) {
      const histSpeed = this.computeHistoricalSpeed(seg, simHour);
      const stop = STOP_BY_ID[seg.fromStopId];
      const dwellSec = this.estimateStopDwellSec(stop?.baseDwellSec ?? 22, stop?.peakDemandFactor ?? 1.5, simHour);
      const ci = Math.max(0, Math.min(0.95, 1 - histSpeed / seg.freeFlowSpeedKmh));
      const predRunSec = Math.round((seg.lengthMeters / 1000 / histSpeed) * 3600);
      const schedRunSec = Math.round((seg.lengthMeters / 1000 / seg.scheduledSpeedKmh) * 3600);

      this.states.set(seg.id, {
        segmentId: seg.id,
        currentSpeedKmh: round1(histSpeed),
        lastRawProbeSpeedKmh: null,
        historicalSpeedKmh: round1(histSpeed),
        freeFlowSpeedKmh: seg.freeFlowSpeedKmh,
        speedVariance: 10.5,
        speedStdKmh: round1(Math.sqrt(10.5)),
        congestionIndex: round2(ci),
        level: classifyTrafficLevel(ci),
        predictedRunTimeSec: predRunSec,
        scheduledRunTimeSec: schedRunSec,
        estimatedDwellSec: dwellSec,
        recentProbeCount: 0,
        lastProbeTimestampMs: null,
        incidentFactor: 1.0,
        incidentLabel: null,
        forecastSpeedsKmh: this.computeForecast(seg, histSpeed, simHour),
        probeHistory: [],
      });
      this.recentProbeTimestamps.set(seg.id, []);
    }

    // Seed an initial light warmup timestamp check
    void nowMs;
  }

  public setSimHour(simHour: number): void {
    this.simHour = ((simHour % 24) + 24) % 24;
    for (const seg of DELHI_SEGMENTS) {
      const st = this.states.get(seg.id);
      if (!st) continue;
      const newHist = this.computeHistoricalSpeed(seg, this.simHour);
      const ratio = st.historicalSpeedKmh > 0 ? st.currentSpeedKmh / st.historicalSpeedKmh : 1;
      const updatedSpeed = clampSpeed(newHist * ratio, seg.freeFlowSpeedKmh);
      st.historicalSpeedKmh = round1(newHist);
      st.currentSpeedKmh = round1(updatedSpeed);
      this.refreshDerivedFields(seg, st);
    }
  }

  public getSimHour(): number {
    return this.simHour;
  }

  public computeHistoricalSpeed(seg: RoadSegment, hour: number): number {
    const factor = getDiurnalFactor(seg.diurnalFactor, hour);
    return Math.max(6, seg.freeFlowSpeedKmh * factor);
  }

  public estimateStopDwellSec(baseDwell: number, peakDemand: number, hour: number): number {
    const isMorningPeak = hour >= 8.0 && hour <= 10.8;
    const isEveningPeak = hour >= 17.0 && hour <= 20.5;
    const multiplier = isMorningPeak || isEveningPeak ? peakDemand : hour >= 11 && hour <= 16.5 ? 1.15 : 0.85;
    return Math.round(baseDwell * multiplier);
  }

  /**
   * Ingest a map-matched bus GPS observation and run a 1D Kalman measurement update.
   */
  public ingestObservation(obs: MapMatchedObservation): void {
    const seg = SEGMENT_BY_ID[obs.segmentId];
    const st = this.states.get(obs.segmentId);
    if (!seg || !st) return;

    const nowMs = obs.ping.timestampMs;

    // Record active probe count within 10-minute rolling window
    const timestamps = this.recentProbeTimestamps.get(seg.id) ?? [];
    timestamps.push(nowMs);
    const cutoff = nowMs - 10 * 60 * 1000;
    const pruned = timestamps.filter((t) => t >= cutoff);
    this.recentProbeTimestamps.set(seg.id, pruned);
    st.recentProbeCount = pruned.length;

    if (!obs.isValidLinkProbe) {
      // Dwelling probe informs stop dwell model without polluting road-link traffic speed
      st.estimatedDwellSec = Math.round(st.estimatedDwellSec * 0.92 + 32 * 0.08);
      return;
    }

    // Time-elapsed prediction step prior to measurement fusion
    const dtMin = st.lastProbeTimestampMs
      ? Math.max(0.05, Math.min(15, (nowMs - st.lastProbeTimestampMs) / 60000))
      : 1.0;

    // Prior variance grows with time since last observation
    const predictedVar = Math.min(24, st.speedVariance + this.processNoiseQ * dtMin);

    // Adaptive measurement noise: higher map-match offset -> slightly lower trust
    const matchPenalty = 1 + (obs.matchErrorMeters / 40) * 0.6;
    const adaptiveR = this.probeNoiseR * matchPenalty;

    // Kalman gain K = P / (P + R)
    const kalmanGain = predictedVar / (predictedVar + adaptiveR);
    const innovation = obs.effectiveSpeedKmh - st.currentSpeedKmh;

    // Fast shockwave reactivity: if probe shows sharp congestion drop (> 7 km/h below estimate),
    // elevate gain slightly so incidents surface within 2-3 pings instead of lagging
    const shockBoost = innovation < -7 ? Math.min(0.55, kalmanGain * 1.45) : kalmanGain;

    const nextSpeed = clampSpeed(st.currentSpeedKmh + shockBoost * innovation, seg.freeFlowSpeedKmh);
    const nextVar = Math.max(2.2, (1 - shockBoost) * predictedVar);

    st.currentSpeedKmh = round1(nextSpeed);
    st.lastRawProbeSpeedKmh = round1(obs.effectiveSpeedKmh);
    st.speedVariance = round2(nextVar);
    st.lastProbeTimestampMs = nowMs;

    // Append to probe history (keep latest 28 points for inspector chart)
    st.probeHistory.push({
      timestampMs: nowMs,
      vehicleId: obs.ping.vehicleId,
      routeShortName: obs.ping.routeShortName,
      observedSpeedKmh: round1(obs.effectiveSpeedKmh),
      filteredSpeedKmh: st.currentSpeedKmh,
      matchErrorMeters: obs.matchErrorMeters,
    });
    if (st.probeHistory.length > 28) {
      st.probeHistory.shift();
    }

    this.refreshDerivedFields(seg, st);
  }

  /**
   * Periodic time-step decay + spatial upstream spillback propagation across the road graph.
   * Called every simulation/update cycle (dtSimSec = simulated seconds elapsed).
   */
  public stepDecayAndSpillback(nowMs: number, dtSimSec: number): void {
    const dtMin = dtSimSec / 60;
    const decayRate = Math.LN2 / this.stalenessHalfLifeMin;

    // 1. Staleness mean-reversion toward historical prior for unprobed segments
    for (const seg of DELHI_SEGMENTS) {
      const st = this.states.get(seg.id);
      if (!st) continue;

      const histSpeed = this.computeHistoricalSpeed(seg, this.simHour);
      st.historicalSpeedKmh = round1(histSpeed);

      const ageMin = st.lastProbeTimestampMs
        ? Math.max(0, (nowMs - st.lastProbeTimestampMs) / 60000)
        : 10;

      if (ageMin > 1.2) {
        const revertWeight = 1 - Math.exp(-decayRate * dtMin);
        st.currentSpeedKmh = round1(
          clampSpeed(
            st.currentSpeedKmh + (histSpeed - st.currentSpeedKmh) * revertWeight,
            seg.freeFlowSpeedKmh
          )
        );
        st.speedVariance = round2(Math.min(22, st.speedVariance + this.processNoiseQ * dtMin * 0.6));
      }

      // Prune stale probe timestamps
      const timestamps = this.recentProbeTimestamps.get(seg.id) ?? [];
      const cutoff = nowMs - 10 * 60 * 1000;
      const pruned = timestamps.filter((t) => t >= cutoff);
      this.recentProbeTimestamps.set(seg.id, pruned);
      st.recentProbeCount = pruned.length;
    }

    // 2. Spatial spillback: when a downstream segment is severely congested, apply damped
    // drag to its upstream feeding segments (helps sparse segments react before a bus finishes them)
    for (const seg of DELHI_SEGMENTS) {
      const st = this.states.get(seg.id);
      if (!st) continue;
      if (st.congestionIndex < 0.62) continue;

      const downstreamRatio = st.currentSpeedKmh / Math.max(1, st.historicalSpeedKmh);
      if (downstreamRatio >= 0.8) continue;

      for (const upId of seg.upstreamSegmentIds) {
        const upSeg = SEGMENT_BY_ID[upId];
        const upState = this.states.get(upId);
        if (!upSeg || !upState) continue;

        // Only nudge upstream if upstream hasn't been probed in the last 30s
        const upAgeSec = upState.lastProbeTimestampMs
          ? (nowMs - upState.lastProbeTimestampMs) / 1000
          : 999;
        if (upAgeSec < 30) continue;

        const targetSpillSpeed = upState.historicalSpeedKmh * (1 - (1 - downstreamRatio) * 0.45);
        if (targetSpillSpeed < upState.currentSpeedKmh) {
          upState.currentSpeedKmh = round1(
            clampSpeed(
              upState.currentSpeedKmh * (1 - this.spillbackAlpha * dtMin) +
                targetSpillSpeed * (this.spillbackAlpha * dtMin),
              upSeg.freeFlowSpeedKmh
            )
          );
        }
      }
    }

    // 3. Recompute derived metrics & horizon forecasts
    for (const seg of DELHI_SEGMENTS) {
      const st = this.states.get(seg.id);
      if (st) this.refreshDerivedFields(seg, st);
    }
  }

  /**
   * Annotate known incident labels for display/explainability (note: traffic speed itself
   * is still estimated from bus GPS probes!).
   */
  public syncIncidentMetadata(activeIncidents: Array<{ label: string; factor: number; segmentIds: string[] }>): void {
    for (const st of this.states.values()) {
      st.incidentFactor = 1.0;
      st.incidentLabel = null;
    }
    for (const inc of activeIncidents) {
      for (const segId of inc.segmentIds) {
        const st = this.states.get(segId);
        if (st && inc.factor < st.incidentFactor) {
          st.incidentFactor = inc.factor;
          st.incidentLabel = inc.label;
        }
      }
    }
  }

  /**
   * Predict traversal speed for a segment at `offsetMinutes` in the future.
   */
  public predictSpeedAtOffset(segmentId: string, offsetMinutes: number): number {
    const seg = SEGMENT_BY_ID[segmentId];
    const st = this.states.get(segmentId);
    if (!seg || !st) return 20;
    if (offsetMinutes <= 1) return st.currentSpeedKmh;

    const futureHour = (this.simHour + offsetMinutes / 60) % 24;
    const futureHist = this.computeHistoricalSpeed(seg, futureHour);
    const anomalyRatio = st.historicalSpeedKmh > 0 ? st.currentSpeedKmh / st.historicalSpeedKmh : 1;
    const dampedRatio = 1 + (anomalyRatio - 1) * Math.exp(-offsetMinutes / this.forecastDecayTauMin);
    return round1(clampSpeed(futureHist * dampedRatio, seg.freeFlowSpeedKmh));
  }

  /**
   * Record a completed ground-truth bus traversal across a segment to continuously benchmark
   * Static GTFS vs Last-Ping vs Pravaah Traffic Model accuracy.
   */
  public recordValidationSample(sample: ValidationSample): void {
    this.validationSamples.push(sample);
    if (this.validationSamples.length > 240) {
      this.validationSamples.shift();
    }
  }

  public getValidationMetrics(): ModelValidationMetrics {
    const n = this.validationSamples.length;
    if (n === 0) {
      return {
        sampleCount: 0,
        staticGtfsMaeSec: 0,
        staticGtfsRmseSec: 0,
        staticGtfsMapePct: 0,
        lastPingMaeSec: 0,
        lastPingRmseSec: 0,
        lastPingMapePct: 0,
        pravaahMaeSec: 0,
        pravaahRmseSec: 0,
        pravaahMapePct: 0,
        improvementVsGtfsPct: 0,
      };
    }

    let gtfsAbs = 0;
    let gtfsSq = 0;
    let gtfsPct = 0;
    let pingAbs = 0;
    let pingSq = 0;
    let pingPct = 0;
    let pravAbs = 0;
    let pravSq = 0;
    let pravPct = 0;

    for (const s of this.validationSamples) {
      const actual = Math.max(15, s.actualTravelSec);
      const eGtfs = Math.abs(s.staticGtfsPredSec - actual);
      const ePing = Math.abs(s.lastPingPredSec - actual);
      const ePrav = Math.abs(s.pravaahPredSec - actual);

      gtfsAbs += eGtfs;
      gtfsSq += eGtfs * eGtfs;
      gtfsPct += (eGtfs / actual) * 100;

      pingAbs += ePing;
      pingSq += ePing * ePing;
      pingPct += (ePing / actual) * 100;

      pravAbs += ePrav;
      pravSq += ePrav * ePrav;
      pravPct += (ePrav / actual) * 100;
    }

    const staticGtfsMaeSec = round1(gtfsAbs / n);
    const pravaahMaeSec = round1(pravAbs / n);
    const improvement =
      staticGtfsMaeSec > 0
        ? round1(((staticGtfsMaeSec - pravaahMaeSec) / staticGtfsMaeSec) * 100)
        : 0;

    return {
      sampleCount: n,
      staticGtfsMaeSec,
      staticGtfsRmseSec: round1(Math.sqrt(gtfsSq / n)),
      staticGtfsMapePct: round1(gtfsPct / n),
      lastPingMaeSec: round1(pingAbs / n),
      lastPingRmseSec: round1(Math.sqrt(pingSq / n)),
      lastPingMapePct: round1(pingPct / n),
      pravaahMaeSec,
      pravaahRmseSec: round1(Math.sqrt(pravSq / n)),
      pravaahMapePct: round1(pravPct / n),
      improvementVsGtfsPct: improvement,
    };
  }

  public getState(segmentId: string): SegmentTrafficState | undefined {
    return this.states.get(segmentId);
  }

  public getAllStates(): SegmentTrafficState[] {
    return Array.from(this.states.values());
  }

  public getStateRecord(): Record<string, SegmentTrafficState> {
    return Object.fromEntries(this.states.entries());
  }

  private computeForecast(
    seg: RoadSegment,
    currentSpeed: number,
    hour: number
  ): [number, number, number, number] {
    const baseNow = this.computeHistoricalSpeed(seg, hour);
    const ratio = baseNow > 0 ? currentSpeed / baseNow : 1;
    const offsets = [15, 30, 45, 60] as const;
    return offsets.map((mins) => {
      const fHist = this.computeHistoricalSpeed(seg, (hour + mins / 60) % 24);
      const damped = 1 + (ratio - 1) * Math.exp(-mins / this.forecastDecayTauMin);
      return round1(clampSpeed(fHist * damped, seg.freeFlowSpeedKmh));
    }) as [number, number, number, number];
  }

  private refreshDerivedFields(seg: RoadSegment, st: SegmentTrafficState): void {
    const stop = STOP_BY_ID[seg.fromStopId];
    st.speedStdKmh = round1(Math.sqrt(Math.max(1, st.speedVariance)));
    st.congestionIndex = round2(Math.max(0, Math.min(0.95, 1 - st.currentSpeedKmh / seg.freeFlowSpeedKmh)));
    st.level = classifyTrafficLevel(st.congestionIndex);
    st.predictedRunTimeSec = Math.round((seg.lengthMeters / 1000 / Math.max(4, st.currentSpeedKmh)) * 3600);
    st.scheduledRunTimeSec = Math.round((seg.lengthMeters / 1000 / seg.scheduledSpeedKmh) * 3600);
    st.estimatedDwellSec = this.estimateStopDwellSec(
      stop?.baseDwellSec ?? 22,
      stop?.peakDemandFactor ?? 1.5,
      this.simHour
    );
    st.forecastSpeedsKmh = this.computeForecast(seg, st.currentSpeedKmh, this.simHour);
  }
}

function clampSpeed(speed: number, freeFlow: number): number {
  return Math.max(4.5, Math.min(freeFlow * 1.05, speed));
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}
