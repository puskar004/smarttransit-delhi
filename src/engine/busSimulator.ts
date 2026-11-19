import {
  DEFAULT_INCIDENTS,
  DELHI_ROUTES,
  SEGMENT_BY_ID,
  STOP_BY_ID,
  segmentIdFor,
} from '../data/delhiNetwork';
import type {
  BusOperator,
  GpsPing,
  SimulatedBus,
  TrafficIncident,
} from '../types/transit';
import { interpolatePolyline } from './geo';
import { mapMatchGpsPing } from './mapMatcher';
import { BusTrafficModel, getDiurnalFactor } from './trafficModel';

interface InternalBus extends SimulatedBus {
  segmentEntryTimeMs: number;
  isFullSegmentTraversal: boolean;
  segmentPredPravaahSec: number;
  segmentPredGtfsSec: number;
  segmentPredLastPingSec: number;
  driverSpeedBias: number; // slight per-driver variation (0.93..1.07)
}

/** Deterministic seeded PRNG (Mulberry32) so tests & demo runs are reproducible and smooth */
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePlate(operator: BusOperator, index: number): string {
  const num = 1420 + ((index * 137) % 8400);
  switch (operator) {
    case 'DTC_ELECTRIC':
      return `DL51EV-${num}`;
    case 'DTC_AC':
      return `DL1PC-${num}`;
    case 'DTC_NON_AC':
      return `DL1PB-${num}`;
    case 'DIMTS_CLUSTER':
      return `DL1PD-${num}`;
  }
}

export class DelhiTransitSimulator {
  private buses: InternalBus[] = [];
  private incidents: TrafficIncident[] = [];
  private model: BusTrafficModel;
  private rng: () => number;
  private simTimeMs: number;
  private pingCounter = 0;
  private recentPings: GpsPing[] = [];
  private totalPingsProcessed = 0;
  private matchedPingsCount = 0;
  /** Slowly evolving per-corridor latent traffic drift (unknown to model; discovered via GPS!) */
  private corridorLatentFactor = new Map<string, number>();

  constructor(model: BusTrafficModel, initialSimHour = 18.25, seed = 20261124) {
    this.model = model;
    this.rng = createRng(seed);
    this.incidents = DEFAULT_INCIDENTS.map((inc) => ({ ...inc }));

    const baseDay = new Date();
    baseDay.setHours(Math.floor(initialSimHour), Math.round((initialSimHour % 1) * 60), 0, 0);
    this.simTimeMs = baseDay.getTime();

    this.initFleet();
    // Warm up 150 ticks (~10 minutes of simulated Delhi GPS telemetry) so model & benchmarks start populated
    this.warmup(150, 4);
  }

  private initFleet(): void {
    this.buses = [];
    let plateIdx = 1;

    for (const route of DELHI_ROUTES) {
      for (const direction of [0, 1] as const) {
        const stopSeq = direction === 0 ? [...route.stopIds] : [...route.stopIds].reverse();
        const busesPerDir = 3;

        for (let b = 0; b < busesPerDir; b++) {
          const totalSegments = stopSeq.length - 1;
          const rawPos = ((b + 0.15 + this.rng() * 0.25) / busesPerDir) * totalSegments;
          const segIdx = Math.min(totalSegments - 1, Math.floor(rawPos));
          const progress = rawPos - segIdx;

          const fromId = stopSeq[segIdx];
          const toId = stopSeq[segIdx + 1];
          const segId = segmentIdFor(fromId, toId);
          const seg = SEGMENT_BY_ID[segId];
          if (!seg) continue;

          const pos = interpolatePolyline(seg.waypoints, progress);
          const st = this.model.getState(segId);
          const initSpeed = st ? st.currentSpeedKmh : seg.scheduledSpeedKmh;

          this.buses.push({
            vehicleId: makePlate(route.operator, plateIdx++),
            routeId: route.id,
            routeShortName: route.shortName,
            operator: route.operator,
            direction,
            stopSequence: stopSeq,
            currentStopIdx: segIdx,
            currentSegmentId: segId,
            progressOnSegment: progress,
            lat: pos.lat,
            lng: pos.lng,
            bearingDeg: pos.bearingDeg,
            speedKmh: initSpeed,
            dwellRemainingSec: 0,
            isDwelling: false,
            nextStopId: toId,
            nextStopName: STOP_BY_ID[toId]?.name ?? toId,
            etaNextStopSec: Math.round(((1 - progress) * seg.lengthMeters) / (initSpeed / 3.6)),
            delayVsScheduleSec: Math.round((this.rng() - 0.3) * 180),
            passengersEst: Math.round(22 + this.rng() * 44),
            segmentEntryTimeMs: this.simTimeMs,
            isFullSegmentTraversal: false,
            segmentPredPravaahSec: st?.predictedRunTimeSec ?? 160,
            segmentPredGtfsSec: st?.scheduledRunTimeSec ?? 150,
            segmentPredLastPingSec: st?.scheduledRunTimeSec ?? 150,
            driverSpeedBias: 0.94 + this.rng() * 0.12,
          });
        }
      }
    }
  }

  public warmup(ticks: number, dtSimSec: number): void {
    for (let i = 0; i < ticks; i++) {
      this.step(dtSimSec);
    }
  }

  public setSimHour(hour: number): void {
    const normalized = ((hour % 24) + 24) % 24;
    const d = new Date(this.simTimeMs);
    d.setHours(Math.floor(normalized), Math.round((normalized % 1) * 60), 0, 0);
    this.simTimeMs = d.getTime();
    this.model.setSimHour(normalized);
  }

  public getSimTimeMs(): number {
    return this.simTimeMs;
  }

  public getSimHour(): number {
    const d = new Date(this.simTimeMs);
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }

  public getIncidents(): TrafficIncident[] {
    return this.incidents;
  }

  public toggleIncident(incidentId: string): TrafficIncident[] {
    this.incidents = this.incidents.map((inc) =>
      inc.id === incidentId ? { ...inc, active: !inc.active } : inc
    );
    this.syncModelIncidents();
    return this.incidents;
  }

  public setIncidentActive(incidentId: string, active: boolean): TrafficIncident[] {
    this.incidents = this.incidents.map((inc) =>
      inc.id === incidentId ? { ...inc, active } : inc
    );
    this.syncModelIncidents();
    return this.incidents;
  }

  private syncModelIncidents(): void {
    const activeList = this.incidents
      .filter((i) => i.active)
      .map((i) => ({
        label: i.title,
        factor: i.speedMultiplier,
        segmentIds: i.affectedSegmentIds,
      }));
    this.model.syncIncidentMetadata(activeList);
  }

  /**
   * True physical speed on a segment (hidden ground truth).
   * Combines diurnal profile, latent real-world traffic anomaly, active incidents, and signal jitter.
   */
  private getGroundTruthSegmentSpeed(segmentId: string, simHour: number): number {
    const seg = SEGMENT_BY_ID[segmentId];
    if (!seg) return 20;

    const diurnal = getDiurnalFactor(seg.diurnalFactor, simHour);
    let base = seg.freeFlowSpeedKmh * diurnal;

    // Slowly varying corridor-level real-world congestion wave (0.82 .. 1.12)
    let latent = this.corridorLatentFactor.get(seg.corridorName);
    if (latent === undefined) {
      latent = 0.86 + this.rng() * 0.24;
      this.corridorLatentFactor.set(seg.corridorName, latent);
    }
    base *= latent;

    // Active Delhi incidents drastically cut physical speed on affected segments
    for (const inc of this.incidents) {
      if (inc.active && inc.affectedSegmentIds.includes(segmentId)) {
        base *= inc.speedMultiplier;
      }
    }

    // Signalized intersection variance
    const signalNoise = (this.rng() - 0.5) * (2.6 + seg.signalCount * 0.8);
    return Math.max(4.8, Math.min(seg.freeFlowSpeedKmh * 1.04, base + signalNoise));
  }

  /**
   * Advance the Delhi bus fleet simulation by `dtSimSec` seconds, emit realistic noisy GTFS-RT
   * GPS pings, map-match them, and feed them into the TrafficModel.
   */
  public step(dtSimSec: number): GpsPing[] {
    this.simTimeMs += dtSimSec * 1000;
    const simHour = this.getSimHour();
    this.model.setSimHour(simHour);
    this.syncModelIncidents();

    // Gently evolve latent corridor traffic drift (Ornstein-Uhlenbeck random walk)
    for (const [corridor, val] of this.corridorLatentFactor.entries()) {
      const next = val + (0.97 - val) * 0.015 + (this.rng() - 0.5) * 0.025;
      this.corridorLatentFactor.set(corridor, Math.max(0.72, Math.min(1.16, next)));
    }

    const emittedPings: GpsPing[] = [];

    for (const bus of this.buses) {
      const seg = SEGMENT_BY_ID[bus.currentSegmentId];
      if (!seg) continue;

      if (bus.dwellRemainingSec > 0) {
        bus.dwellRemainingSec = Math.max(0, bus.dwellRemainingSec - dtSimSec);
        bus.isDwelling = bus.dwellRemainingSec > 0;
        bus.speedKmh = bus.isDwelling ? Math.round(this.rng() * 1.8 * 10) / 10 : 8;
      } else {
        bus.isDwelling = false;
        const trueRoadSpeed = this.getGroundTruthSegmentSpeed(seg.id, simHour);
        const busSpeed = Math.max(4.5, trueRoadSpeed * bus.driverSpeedBias);
        bus.speedKmh = Math.round(busSpeed * 10) / 10;

        const distMoved = (busSpeed / 3.6) * dtSimSec;
        const nextProgress = bus.progressOnSegment + distMoved / seg.lengthMeters;

        if (nextProgress >= 1.0) {
          // Bus reached end of segment — record ground-truth traversal for live validation!
          const actualTraversalSec = Math.max(
            20,
            (this.simTimeMs - bus.segmentEntryTimeMs) / 1000
          );

          // Only validate true full-segment traversals (never initial mid-segment spawn)
          if (bus.isFullSegmentTraversal && actualTraversalSec > 25 && actualTraversalSec < 1800) {
            this.model.recordValidationSample({
              timestampMs: this.simTimeMs,
              segmentId: seg.id,
              routeShortName: bus.routeShortName,
              actualTravelSec: actualTraversalSec,
              staticGtfsPredSec: bus.segmentPredGtfsSec,
              lastPingPredSec: bus.segmentPredLastPingSec,
              pravaahPredSec: bus.segmentPredPravaahSec,
            });
          }

          // Update bus schedule delay
          bus.delayVsScheduleSec = Math.round(
            Math.max(-180, Math.min(1200, bus.delayVsScheduleSec + (actualTraversalSec - seg.lengthMeters / (seg.scheduledSpeedKmh / 3.6))))
          );

          // Trigger stop dwell at arrived stop (coupled with peak hour + slight bunching delay!)
          const arrivedStop = STOP_BY_ID[seg.toStopId];
          const baseDwell = this.model.estimateStopDwellSec(
            arrivedStop?.baseDwellSec ?? 22,
            arrivedStop?.peakDemandFactor ?? 1.5,
            simHour
          );
          const bunchingExtra = bus.delayVsScheduleSec > 180 ? Math.min(18, bus.delayVsScheduleSec * 0.03) : 0;
          bus.dwellRemainingSec = Math.round(baseDwell * (0.75 + this.rng() * 0.5) + bunchingExtra);
          bus.isDwelling = true;

          // Advance to next segment (or turn around at terminal)
          let nextIdx = bus.currentStopIdx + 1;
          if (nextIdx >= bus.stopSequence.length - 1) {
            bus.direction = bus.direction === 0 ? 1 : 0;
            bus.stopSequence = [...bus.stopSequence].reverse();
            nextIdx = 0;
            bus.delayVsScheduleSec = Math.round((this.rng() - 0.4) * 60);
          }

          const newFrom = bus.stopSequence[nextIdx];
          const newTo = bus.stopSequence[nextIdx + 1];
          const newSegId = segmentIdFor(newFrom, newTo);
          const newSeg = SEGMENT_BY_ID[newSegId];

          if (newSeg) {
            bus.currentStopIdx = nextIdx;
            bus.currentSegmentId = newSegId;
            bus.progressOnSegment = 0.01;
            bus.nextStopId = newTo;
            bus.nextStopName = STOP_BY_ID[newTo]?.name ?? newTo;
            bus.segmentEntryTimeMs = this.simTimeMs + bus.dwellRemainingSec * 1000;
            bus.isFullSegmentTraversal = true;

            // Snapshot pre-entry predictions from all 3 competing models!
            const modelSt = this.model.getState(newSegId);
            bus.segmentPredPravaahSec = modelSt?.predictedRunTimeSec ?? 160;
            bus.segmentPredGtfsSec = modelSt?.scheduledRunTimeSec ?? 150;
            const rawSpeed = modelSt?.lastRawProbeSpeedKmh ?? newSeg.scheduledSpeedKmh;
            bus.segmentPredLastPingSec = Math.round((newSeg.lengthMeters / 1000 / Math.max(5, rawSpeed)) * 3600);
          }
        } else {
          bus.progressOnSegment = nextProgress;
        }
      }

      // Recompute clean position along current segment
      const activeSeg = SEGMENT_BY_ID[bus.currentSegmentId];
      if (activeSeg) {
        const pos = interpolatePolyline(activeSeg.waypoints, bus.progressOnSegment);
        bus.lat = pos.lat;
        bus.lng = pos.lng;
        bus.bearingDeg = pos.bearingDeg;

        const remainingMeters = (1 - bus.progressOnSegment) * activeSeg.lengthMeters;
        const estSpeed = Math.max(6, this.model.getState(activeSeg.id)?.currentSpeedKmh ?? bus.speedKmh);
        bus.etaNextStopSec = Math.round(bus.dwellRemainingSec + remainingMeters / (estSpeed / 3.6));
      }

      // Emit realistic noisy GPS ping (~35% of fleet per step to mirror 5-15s AVLS polling intervals)
      if (this.rng() < 0.36) {
        const latJitter = (this.rng() - 0.5) * 0.00018; // ~±10 meters urban canyon GPS jitter
        const lngJitter = (this.rng() - 0.5) * 0.00018;
        const speedNoise = bus.isDwelling ? 0 : (this.rng() - 0.5) * 4.2;

        const ping: GpsPing = {
          pingId: `PNG-${++this.pingCounter}`,
          vehicleId: bus.vehicleId,
          routeId: bus.routeId,
          routeShortName: bus.routeShortName,
          operator: bus.operator,
          direction: bus.direction,
          rawLat: Number((bus.lat + latJitter).toFixed(6)),
          rawLng: Number((bus.lng + lngJitter).toFixed(6)),
          bearingDeg: Math.round(bus.bearingDeg),
          reportedSpeedKmh: Math.max(0, Math.round((bus.speedKmh + speedNoise) * 10) / 10),
          timestampMs: this.simTimeMs,
          isDwellingAtStopId: bus.isDwelling ? bus.stopSequence[bus.currentStopIdx] : undefined,
        };

        emittedPings.push(ping);
        this.totalPingsProcessed++;

        const matched = mapMatchGpsPing(ping);
        if (matched) {
          this.matchedPingsCount++;
          this.model.ingestObservation(matched);
        }
      }
    }

    // Run traffic model time-step decay & upstream spillback propagation
    this.model.stepDecayAndSpillback(this.simTimeMs, dtSimSec);

    // Keep latest 45 pings for live telemetry stream inspector
    if (emittedPings.length > 0) {
      this.recentPings = [...emittedPings.slice(0, 12), ...this.recentPings].slice(0, 45);
    }

    return emittedPings;
  }

  public getBuses(): SimulatedBus[] {
    return this.buses;
  }

  public getRecentPings(): GpsPing[] {
    return this.recentPings;
  }

  public getTelemetryStats(): {
    totalPingsProcessed: number;
    matchedPingsCount: number;
    matchRatePct: number;
  } {
    const rate =
      this.totalPingsProcessed > 0
        ? Math.round((this.matchedPingsCount / this.totalPingsProcessed) * 1000) / 10
        : 100;
    return {
      totalPingsProcessed: this.totalPingsProcessed,
      matchedPingsCount: this.matchedPingsCount,
      matchRatePct: rate,
    };
  }
}
