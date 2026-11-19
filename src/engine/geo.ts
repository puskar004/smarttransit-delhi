import type { LatLng } from '../types/transit';

const EARTH_RADIUS_M = 6371000;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeBearingDeg(from: LatLng, to: LatLng): number {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function angularDiffDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function polylineLengthMeters(points: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineMeters(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Interpolate a position and bearing at progress t in [0, 1] along a polyline.
 */
export function interpolatePolyline(
  points: LatLng[],
  t: number
): { lat: number; lng: number; bearingDeg: number } {
  if (points.length === 0) return { lat: 28.56, lng: 77.23, bearingDeg: 0 };
  if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng, bearingDeg: 0 };

  const clamped = Math.max(0, Math.min(1, t));
  const segLengths: number[] = [];
  let totalLen = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = haversineMeters(points[i], points[i + 1]);
    segLengths.push(len);
    totalLen += len;
  }

  if (totalLen <= 0.01) {
    return { lat: points[0].lat, lng: points[0].lng, bearingDeg: 0 };
  }

  let targetDist = clamped * totalLen;
  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (targetDist <= segLen || i === segLengths.length - 1) {
      const localT = segLen > 0 ? Math.min(1, targetDist / segLen) : 0;
      const p0 = points[i];
      const p1 = points[i + 1];
      return {
        lat: p0.lat + (p1.lat - p0.lat) * localT,
        lng: p0.lng + (p1.lng - p0.lng) * localT,
        bearingDeg: computeBearingDeg(p0, p1),
      };
    }
    targetDist -= segLen;
  }

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return { lat: last.lat, lng: last.lng, bearingDeg: computeBearingDeg(prev, last) };
}

/**
 * Project a geographic point onto the closest point on a polyline.
 * Returns snapped coordinate, perpendicular distance (meters), normalized progress [0..1], and local segment bearing.
 */
export function projectPointToPolyline(
  point: LatLng,
  polyline: LatLng[]
): {
  snapped: LatLng;
  distanceMeters: number;
  progressRatio: number;
  bearingDeg: number;
} {
  const cosLat = Math.cos(toRad(point.lat));
  let bestDist = Infinity;
  let bestSnapped = polyline[0];
  let bestProgress = 0;
  let bestBearing = 0;

  let cumulativeDist = 0;
  const totalLen = polylineLengthMeters(polyline) || 1;

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const segLen = haversineMeters(a, b);

    // Local tangent plane projection (high accuracy within Delhi urban scale)
    const ax = (a.lng - point.lng) * cosLat;
    const ay = a.lat - point.lat;
    const bx = (b.lng - point.lng) * cosLat;
    const by = b.lat - point.lat;

    const dx = bx - ax;
    const dy = by - ay;
    const denom = dx * dx + dy * dy;

    let u = 0;
    if (denom > 1e-12) {
      u = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / denom));
    }

    const snapped: LatLng = {
      lat: a.lat + (b.lat - a.lat) * u,
      lng: a.lng + (b.lng - a.lng) * u,
    };

    const dist = haversineMeters(point, snapped);
    if (dist < bestDist) {
      bestDist = dist;
      bestSnapped = snapped;
      bestProgress = (cumulativeDist + segLen * u) / totalLen;
      bestBearing = computeBearingDeg(a, b);
    }

    cumulativeDist += segLen;
  }

  return {
    snapped: bestSnapped,
    distanceMeters: bestDist,
    progressRatio: Math.max(0, Math.min(1, bestProgress)),
    bearingDeg: bestBearing,
  };
}
