export type BusOperator = 'DTC_ELECTRIC' | 'DTC_AC' | 'DTC_NON_AC' | 'DIMTS_CLUSTER';

export type TrafficLevel = 'FREE_FLOW' | 'MODERATE' | 'HEAVY' | 'SEVERE';

export type CrowdLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRUSH_LOAD';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BusStop {
  id: string;
  code: string; // e.g. "DL-NP-01"
  name: string;
  zone: string; // e.g. "South Delhi", "Central Delhi", "East Delhi"
  corridor: string;
  lat: number;
  lng: number;
  isHub?: boolean;
  metroInterchange?: string; // e.g. "Violet Line", "Magenta / Violet"
  baseDwellSec: number; // typical stop dwell time off-peak
  peakDemandFactor: number; // multiplier during morning/evening rush
  typicalBoardingPerHour?: number; // ETM historical boarding volume
}

/**
 * Directed road segment between two consecutive stops along a Delhi arterial corridor.
 * Multiple bus routes share overlapping segments — allowing probe fusion across routes!
 */
export interface RoadSegment {
  id: string; // e.g. "SEG_ASHRAM_LAJPAT"
  fromStopId: string;
  toStopId: string;
  corridorName: string; // e.g. "Ring Road (Mahatma Gandhi Marg)"
  shortLabel: string; // e.g. "Ashram Chowk → Lajpat Nagar"
  waypoints: LatLng[]; // polyline vertices including from/to stops for clean map rendering
  lengthMeters: number;
  freeFlowSpeedKmh: number;
  scheduledSpeedKmh: number;
  signalCount: number;
  /** 24-element hourly speed factor (0.25 .. 1.0) relative to freeFlowSpeedKmh */
  diurnalFactor: number[];
  /** Upstream segment IDs feeding into this segment (for congestion spillback modeling) */
  upstreamSegmentIds: string[];
}

export interface BusRoute {
  id: string;
  shortName: string; // e.g. "534", "429", "764"
  longName: string; // e.g. "Mehrauli Terminal — Anand Vihar ISBT"
  operator: BusOperator;
  fareMinInr: number;
  fareMaxInr: number;
  headwayPeakMin: number;
  headwayOffPeakMin: number;
  /** Ordered sequence of stop IDs for direction 0 (outbound). Inbound is reversed. */
  stopIds: string[];
}

/**
 * GTFS-RT compatible VehiclePosition ping (raw GPS telemetry from Delhi OTD / AVLS).
 */
export interface GpsPing {
  pingId: string;
  vehicleId: string; // e.g. "DL1PC-8421"
  routeId: string;
  routeShortName: string;
  operator: BusOperator;
  direction: 0 | 1;
  rawLat: number; // includes realistic urban GPS jitter
  rawLng: number;
  bearingDeg: number;
  reportedSpeedKmh: number;
  timestampMs: number;
  isDwellingAtStopId?: string;
}

export interface MapMatchedObservation {
  ping: GpsPing;
  segmentId: string;
  snappedLat: number;
  snappedLng: number;
  matchErrorMeters: number;
  progressRatio: number; // 0..1 along segment
  isDwelling: boolean;
  isValidLinkProbe: boolean;
  effectiveSpeedKmh: number;
}

export interface SegmentProbeRecord {
  timestampMs: number;
  vehicleId: string;
  routeShortName: string;
  observedSpeedKmh: number;
  filteredSpeedKmh: number;
  matchErrorMeters: number;
}

/**
 * Live modeled traffic state for a single directed road segment.
 */
export interface SegmentTrafficState {
  segmentId: string;
  /** Kalman + EWMA filtered real-time speed (km/h) */
  currentSpeedKmh: number;
  /** Raw unsmoothed latest probe speed */
  lastRawProbeSpeedKmh: number | null;
  /** Historical diurnal baseline speed for current time of day (km/h) */
  historicalSpeedKmh: number;
  /** Free-flow reference speed (km/h) */
  freeFlowSpeedKmh: number;
  /** Estimated uncertainty variance (km/h)^2 */
  speedVariance: number;
  /** Standard deviation of speed estimate (km/h) */
  speedStdKmh: number;
  /** Congestion index 0 (free flow) -> 1 (gridlock) */
  congestionIndex: number;
  level: TrafficLevel;
  /** Estimated travel time across this segment right now (seconds), excluding end-stop dwell */
  predictedRunTimeSec: number;
  /** Scheduled static GTFS travel time (seconds) */
  scheduledRunTimeSec: number;
  /** Estimated bus stop dwell time at fromStop (seconds) */
  estimatedDwellSec: number;
  /** Active probes observed in last 10 minutes */
  recentProbeCount: number;
  /** Timestamp of most recent bus GPS probe */
  lastProbeTimestampMs: number | null;
  /** Active incident multiplier (1.0 = normal, < 1.0 = incident slow-down) */
  incidentFactor: number;
  incidentLabel: string | null;
  /** Short-term forecast speeds at +15m, +30m, +45m, +60m */
  forecastSpeedsKmh: [number, number, number, number];
  /** Recent probe history for the segment inspector */
  probeHistory: SegmentProbeRecord[];
}

export interface SimulatedBus {
  vehicleId: string;
  routeId: string;
  routeShortName: string;
  operator: BusOperator;
  direction: 0 | 1;
  stopSequence: string[];
  currentStopIdx: number; // index of segment start stop in stopSequence
  currentSegmentId: string;
  progressOnSegment: number; // 0..1
  lat: number;
  lng: number;
  bearingDeg: number;
  speedKmh: number;
  dwellRemainingSec: number;
  isDwelling: boolean;
  nextStopId: string;
  nextStopName: string;
  etaNextStopSec: number;
  delayVsScheduleSec: number;
  passengersEst: number; // lightweight capacity indicator for dwell-time coupling
}

export interface TrafficIncident {
  id: string;
  title: string;
  description: string;
  corridor: string;
  affectedSegmentIds: string[];
  speedMultiplier: number; // e.g. 0.32 means 68% speed drop
  active: boolean;
}

export interface ValidationSample {
  timestampMs: number;
  segmentId: string;
  routeShortName: string;
  actualTravelSec: number;
  staticGtfsPredSec: number;
  lastPingPredSec: number;
  pravaahPredSec: number;
}

export interface ModelValidationMetrics {
  sampleCount: number;
  staticGtfsMaeSec: number;
  staticGtfsRmseSec: number;
  staticGtfsMapePct: number;
  lastPingMaeSec: number;
  lastPingRmseSec: number;
  lastPingMapePct: number;
  pravaahMaeSec: number;
  pravaahRmseSec: number;
  pravaahMapePct: number;
  improvementVsGtfsPct: number;
}

export type JourneyPreference = 'FASTEST' | 'RELIABLE' | 'COMFORT' | 'AC_ONLY' | 'DIRECT';

export interface JourneySegmentDetail {
  segmentId: string;
  fromStopId: string;
  fromStopName: string;
  toStopId: string;
  toStopName: string;
  corridorName: string;
  predictedSec: number;
  scheduledSec: number;
  speedKmh: number;
  level: TrafficLevel;
  incidentLabel: string | null;
}

export interface JourneyLeg {
  type: 'WAIT' | 'BUS' | 'TRANSFER_WALK';
  routeId?: string;
  routeShortName?: string;
  operator?: BusOperator;
  direction?: 0 | 1;
  fromStopId: string;
  fromStopName: string;
  toStopId: string;
  toStopName: string;
  durationSec: number;
  scheduledDurationSec: number;
  distanceMeters: number;
  stopCount?: number;
  approachingVehicleId?: string;
  approachingDistanceKm?: number;
  fareInr?: number;
  segments?: JourneySegmentDetail[];
  stopTimeline?: Array<{
    stopId: string;
    stopName: string;
    etaOffsetSec: number;
    scheduledOffsetSec: number;
  }>;
}

export interface JourneyBottleneck {
  segmentId: string;
  label: string;
  corridorName: string;
  delaySec: number;
  speedKmh: number;
  level: TrafficLevel;
}

export interface PlannedJourney {
  id: string;
  summaryTitle: string; // e.g. "534 Direct" or "429 → 543 via Ashram Chowk"
  routeBadges: Array<{ shortName: string; operator: BusOperator }>;
  transfers: number;
  predictedTotalSec: number;
  scheduledTotalSec: number;
  delayDeltaSec: number;
  /** P10–P90 travel time uncertainty bounds (seconds) */
  p10TotalSec: number;
  p90TotalSec: number;
  /** 0..100 reliability score accounting for variance & bunching */
  reliabilityScore: number;
  totalFareInr: number;
  totalDistanceMeters: number;
  avgSpeedKmh: number;
  nextBusWaitSec: number;
  legs: JourneyLeg[];
  bottlenecks: JourneyBottleneck[];
  tags: string[]; // e.g. ["Fastest Live", "Avoids Ashram Bottleneck"]

  // Problem 02: Crowdedness & Comfort metrics
  crowdLevel: CrowdLevel;
  occupancyPercent: number; // 0..100%
  seatProbabilityPercent: number; // 0..100%
  comfortScore: number; // 0..100 composite comfort index
  hasAc: boolean;
  matchScorePercent: number; // Netflix-style match % (e.g. 98% Match)
  aiRecommendationReason?: string; // AI generated concise reasoning
  isAiTopPick?: boolean; // Highlighted as Netflix "Top Pick For You"
}
