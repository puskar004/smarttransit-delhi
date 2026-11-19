import { DELHI_ROUTES, DELHI_SEGMENTS, SEGMENT_BY_ID } from '../data/delhiNetwork';
import type { BusOperator, GpsPing, SegmentTrafficState } from '../types/transit';
import { interpolatePolyline } from './geo';
import { mapMatchGpsPing } from './mapMatcher';
import { BusTrafficModel } from './trafficModel';

export interface IngestionReport {
  sourceFormat: 'CSV_GPS' | 'GTFS_RT_JSON';
  totalRecords: number;
  matchedRecords: number;
  rejectedRecords: number;
  updatedSegmentIds: string[];
  avgMatchErrorMeters: number;
}

const ROUTE_BY_SHORT: Record<string, { id: string; operator: BusOperator }> = Object.fromEntries(
  DELHI_ROUTES.map((r) => [r.shortName, { id: r.id, operator: r.operator }])
);

/**
 * Parse a Delhi AVLS / OTD GPS CSV file and ingest directly into the BusTrafficModel.
 * Expected header: vehicle_id,route_id,lat,lng,bearing,speed_kmh,timestamp
 */
export function ingestGpsCsvText(
  csvText: string,
  model: BusTrafficModel,
  fallbackNowMs = Date.now()
): IngestionReport {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      sourceFormat: 'CSV_GPS',
      totalRecords: 0,
      matchedRecords: 0,
      rejectedRecords: 0,
      updatedSegmentIds: [],
      avgMatchErrorMeters: 0,
    };
  }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const idxVehicle = header.findIndex((h) => h.includes('vehicle'));
  const idxRoute = header.findIndex((h) => h.includes('route'));
  const idxLat = header.findIndex((h) => h === 'lat' || h.includes('latitude'));
  const idxLng = header.findIndex((h) => h === 'lng' || h === 'lon' || h.includes('longitude'));
  const idxBearing = header.findIndex((h) => h.includes('bearing') || h.includes('heading'));
  const idxSpeed = header.findIndex((h) => h.includes('speed'));
  const idxTs = header.findIndex((h) => h.includes('time') || h === 'ts');

  const pings: GpsPing[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const lat = Number(cols[idxLat >= 0 ? idxLat : 2]);
    const lng = Number(cols[idxLng >= 0 ? idxLng : 3]);
    const speed = Number(cols[idxSpeed >= 0 ? idxSpeed : 5]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(speed)) continue;

    const rawRoute = cols[idxRoute >= 0 ? idxRoute : 1] ?? '534';
    const mappedRoute = ROUTE_BY_SHORT[rawRoute];
    const bearing = Number(cols[idxBearing >= 0 ? idxBearing : 4]);
    const tsRaw = cols[idxTs >= 0 ? idxTs : 6];
    const parsedTs = tsRaw ? (Number.isFinite(Number(tsRaw)) ? Number(tsRaw) : Date.parse(tsRaw)) : fallbackNowMs;

    pings.push({
      pingId: `EXT-CSV-${i}`,
      vehicleId: cols[idxVehicle >= 0 ? idxVehicle : 0] || `DL-EXT-${i}`,
      routeId: mappedRoute?.id ?? rawRoute,
      routeShortName: rawRoute,
      operator: mappedRoute?.operator ?? 'DTC_ELECTRIC',
      direction: 0,
      rawLat: lat,
      rawLng: lng,
      bearingDeg: Number.isFinite(bearing) ? bearing : 0,
      reportedSpeedKmh: speed,
      timestampMs: Number.isFinite(parsedTs) ? parsedTs : fallbackNowMs,
    });
  }

  return ingestGpsPings(pings, 'CSV_GPS', model);
}

/**
 * Parse a GTFS-RT JSON FeedMessage (standard `entity[].vehicle` schema used by Delhi OTD).
 */
export function ingestGtfsRtJson(
  jsonText: string,
  model: BusTrafficModel,
  fallbackNowMs = Date.now()
): IngestionReport {
  const parsed = JSON.parse(jsonText) as {
    entity?: Array<{
      id?: string;
      vehicle?: {
        trip?: { route_id?: string; direction_id?: number };
        vehicle?: { id?: string; label?: string };
        position?: { latitude?: number; longitude?: number; bearing?: number; speed?: number };
        timestamp?: number;
      };
    }>;
  };

  const entities = parsed.entity ?? [];
  const pings: GpsPing[] = [];

  for (let i = 0; i < entities.length; i++) {
    const v = entities[i]?.vehicle;
    const pos = v?.position;
    if (!pos || typeof pos.latitude !== 'number' || typeof pos.longitude !== 'number') continue;

    const rawRoute = String(v?.trip?.route_id ?? '534').replace(/^RT_/, '');
    const mappedRoute = ROUTE_BY_SHORT[rawRoute];
    // GTFS-RT speed is in m/s; convert to km/h
    const speedKmh = typeof pos.speed === 'number' ? pos.speed * 3.6 : 18;
    const tsMs = typeof v?.timestamp === 'number' ? v.timestamp * 1000 : fallbackNowMs;

    pings.push({
      pingId: `EXT-RT-${i}`,
      vehicleId: v?.vehicle?.label ?? v?.vehicle?.id ?? `DL-GTFSRT-${i}`,
      routeId: mappedRoute?.id ?? `RT_${rawRoute}`,
      routeShortName: rawRoute,
      operator: mappedRoute?.operator ?? 'DTC_ELECTRIC',
      direction: v?.trip?.direction_id === 1 ? 1 : 0,
      rawLat: pos.latitude,
      rawLng: pos.longitude,
      bearingDeg: typeof pos.bearing === 'number' ? pos.bearing : 0,
      reportedSpeedKmh: Math.round(speedKmh * 10) / 10,
      timestampMs: tsMs,
    });
  }

  return ingestGpsPings(pings, 'GTFS_RT_JSON', model);
}

function ingestGpsPings(
  pings: GpsPing[],
  sourceFormat: IngestionReport['sourceFormat'],
  model: BusTrafficModel
): IngestionReport {
  let matched = 0;
  let errorSum = 0;
  const updated = new Set<string>();

  for (const ping of pings) {
    const obs = mapMatchGpsPing(ping);
    if (obs) {
      matched++;
      errorSum += obs.matchErrorMeters;
      updated.add(obs.segmentId);
      model.ingestObservation(obs);
    }
  }

  return {
    sourceFormat,
    totalRecords: pings.length,
    matchedRecords: matched,
    rejectedRecords: pings.length - matched,
    updatedSegmentIds: Array.from(updated),
    avgMatchErrorMeters: matched > 0 ? Math.round((errorSum / matched) * 10) / 10 : 0,
  };
}

/**
 * Generates a realistic Delhi OTD GPS Trace CSV snippet simulating severe slow-down
 * along Ring Road (Ashram–Lajpat–Moolchand) and free flow on Outer Ring Road so judges
 * can immediately test external file upload & ingestion.
 */
export function generateSampleDelhiCsv(nowMs = Date.now()): string {
  const rows = ['vehicle_id,route_id,lat,lng,bearing,speed_kmh,timestamp'];
  const targets: Array<{ segId: string; route: string; speedKmh: number; plate: string }> = [
    { segId: 'lajpat_nagar__ashram', route: '543', speedKmh: 7.4, plate: 'DL1PB-4410' },
    { segId: 'lajpat_nagar__ashram', route: '429', speedKmh: 6.8, plate: 'DL1PD-8902' },
    { segId: 'ashram__sarai_kale_khan', route: '534', speedKmh: 9.2, plate: 'DL51EV-3021' },
    { segId: 'nehru_place__kalkaji_mandir', route: '764', speedKmh: 28.5, plate: 'DL1PC-7712' },
    { segId: 'kalkaji_mandir__iiit_delhi', route: '534', speedKmh: 26.8, plate: 'DL51EV-4120' },
    { segId: 'hauz_khas__chirag_delhi', route: '534', speedKmh: 31.2, plate: 'DL51EV-5509' },
    { segId: 'ito__laxmi_nagar', route: '543', speedKmh: 10.6, plate: 'DL1PB-6190' },
    { segId: 'aiims__south_ex', route: '620', speedKmh: 24.4, plate: 'DL51EV-2204' },
  ];

  let idx = 0;
  for (const t of targets) {
    const seg = SEGMENT_BY_ID[t.segId];
    if (!seg) continue;
    for (const prog of [0.25, 0.55, 0.8]) {
      const pos = interpolatePolyline(seg.waypoints, prog);
      const ts = new Date(nowMs - (3 - idx % 3) * 15000).toISOString();
      rows.push(
        `${t.plate},${t.route},${pos.lat.toFixed(6)},${pos.lng.toFixed(6)},${Math.round(pos.bearingDeg)},${t.speedKmh},${ts}`
      );
      idx++;
    }
  }

  return rows.join('\n');
}

/**
 * Export the current modeled Delhi road traffic graph as an open-source GeoJSON FeatureCollection
 * compatible with QGIS, MapLibre, and Delhi Transport Stack downstream APIs.
 */
export function exportTrafficGeoJson(
  states: Record<string, SegmentTrafficState>,
  simTimeMs: number
): string {
  const features = DELHI_SEGMENTS.map((seg) => {
    const st = states[seg.id];
    return {
      type: 'Feature',
      properties: {
        segment_id: seg.id,
        corridor: seg.corridorName,
        label: seg.shortLabel,
        length_m: seg.lengthMeters,
        current_speed_kmh: st?.currentSpeedKmh ?? seg.scheduledSpeedKmh,
        historical_speed_kmh: st?.historicalSpeedKmh ?? seg.scheduledSpeedKmh,
        free_flow_speed_kmh: seg.freeFlowSpeedKmh,
        congestion_index: st?.congestionIndex ?? 0,
        traffic_level: st?.level ?? 'FREE_FLOW',
        predicted_travel_sec: st?.predictedRunTimeSec ?? 120,
        scheduled_travel_sec: st?.scheduledRunTimeSec ?? 120,
        estimated_dwell_sec: st?.estimatedDwellSec ?? 22,
        speed_std_kmh: st?.speedStdKmh ?? 3.0,
        recent_probes_10m: st?.recentProbeCount ?? 0,
        forecast_15m_kmh: st?.forecastSpeedsKmh?.[0] ?? null,
        forecast_30m_kmh: st?.forecastSpeedsKmh?.[1] ?? null,
        forecast_60m_kmh: st?.forecastSpeedsKmh?.[3] ?? null,
      },
      geometry: {
        type: 'LineString',
        coordinates: seg.waypoints.map((w) => [w.lng, w.lat]),
      },
    };
  });

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      metadata: {
        generator: 'Pravaah · Delhi Bus Traffic Model (Delhi Transport Stack)',
        generated_at: new Date(simTimeMs).toISOString(),
        segment_count: features.length,
      },
      features,
    },
    null,
    2
  );
}
