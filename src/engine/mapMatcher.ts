import { DELHI_SEGMENTS, ROUTE_BY_ID, SEGMENT_BY_ID, STOP_BY_ID, segmentIdFor } from '../data/delhiNetwork';
import type { GpsPing, MapMatchedObservation, RoadSegment } from '../types/transit';
import { angularDiffDeg, haversineMeters, projectPointToPolyline } from './geo';

const MAX_SNAP_DISTANCE_METERS = 85;
const MAX_BEARING_DIFF_DEG = 65;
const STOP_DWELL_RADIUS_METERS = 55;
const DWELL_SPEED_THRESHOLD_KMH = 4.2;

/**
 * Candidate segments belonging to a route (in its active direction), falling back to full network
 * when an external GPS ping carries an unknown route_id.
 */
function getCandidateSegments(ping: GpsPing): RoadSegment[] {
  const route = ROUTE_BY_ID[ping.routeId];
  if (!route) return DELHI_SEGMENTS;

  // Check both outbound & inbound route segments; directional bearing alignment resolves carriageway
  const candidates: RoadSegment[] = [];
  for (let i = 0; i < route.stopIds.length - 1; i++) {
    const fwd = SEGMENT_BY_ID[segmentIdFor(route.stopIds[i], route.stopIds[i + 1])];
    const rev = SEGMENT_BY_ID[segmentIdFor(route.stopIds[i + 1], route.stopIds[i])];
    if (fwd) candidates.push(fwd);
    if (rev) candidates.push(rev);
  }
  return candidates.length > 0 ? candidates : DELHI_SEGMENTS;
}

/**
 * Spatial Map-Matcher & Probe Filter.
 *
 * Maps noisy urban GPS pings onto directed Delhi arterial road segments using:
 * 1. Route topology candidate pruning (when route_id is known)
 * 2. Perpendicular polyline projection distance
 * 3. Directional bearing alignment penalty (prevents snapping to opposite carriageway)
 * 4. Stop-proximity dwell classification (separates boarding dwell from link traffic speed)
 */
export function mapMatchGpsPing(ping: GpsPing): MapMatchedObservation | null {
  const candidates = getCandidateSegments(ping);
  const point = { lat: ping.rawLat, lng: ping.rawLng };

  let bestSeg: RoadSegment | null = null;
  let bestScore = Infinity;
  let bestProjection: ReturnType<typeof projectPointToPolyline> | null = null;

  for (const seg of candidates) {
    const proj = projectPointToPolyline(point, seg.waypoints);
    if (proj.distanceMeters > MAX_SNAP_DISTANCE_METERS) continue;

    const bearingPenalty =
      ping.reportedSpeedKmh > 3
        ? angularDiffDeg(ping.bearingDeg, proj.bearingDeg)
        : 0;

    if (bearingPenalty > MAX_BEARING_DIFF_DEG) continue;

    // Combined spatial + heading alignment score
    const score = proj.distanceMeters + bearingPenalty * 0.45;
    if (score < bestScore) {
      bestScore = score;
      bestSeg = seg;
      bestProjection = proj;
    }
  }

  if (!bestSeg || !bestProjection) {
    return null;
  }

  // Classify whether the bus is dwelling at either endpoint bus stop
  const fromStop = STOP_BY_ID[bestSeg.fromStopId];
  const toStop = STOP_BY_ID[bestSeg.toStopId];
  const distFrom = fromStop ? haversineMeters(bestProjection.snapped, fromStop) : Infinity;
  const distTo = toStop ? haversineMeters(bestProjection.snapped, toStop) : Infinity;
  const nearStop = Math.min(distFrom, distTo) <= STOP_DWELL_RADIUS_METERS;

  const isDwelling =
    Boolean(ping.isDwellingAtStopId) ||
    (nearStop && ping.reportedSpeedKmh < DWELL_SPEED_THRESHOLD_KMH);

  // Reject impossible GPS spikes (> 68 km/h for a Delhi urban bus) or dwelling stops from link speed
  const plausibleSpeed = Math.max(2.5, Math.min(62, ping.reportedSpeedKmh));
  const isValidLinkProbe =
    !isDwelling &&
    bestProjection.distanceMeters <= MAX_SNAP_DISTANCE_METERS &&
    ping.reportedSpeedKmh >= 1.5 &&
    ping.reportedSpeedKmh <= 68;

  return {
    ping,
    segmentId: bestSeg.id,
    snappedLat: bestProjection.snapped.lat,
    snappedLng: bestProjection.snapped.lng,
    matchErrorMeters: Math.round(bestProjection.distanceMeters * 10) / 10,
    progressRatio: bestProjection.progressRatio,
    isDwelling,
    isValidLinkProbe,
    effectiveSpeedKmh: plausibleSpeed,
  };
}
