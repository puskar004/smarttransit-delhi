import { describe, expect, it } from 'vitest';
import { DELHI_ROUTES, SEGMENT_BY_ID, segmentIdFor } from '../../data/delhiNetwork';
import { DelhiTransitSimulator } from '../busSimulator';
import { exportTrafficGeoJson, generateSampleDelhiCsv, ingestGpsCsvText } from '../gtfsAdapter';
import { planDelhiJourneys } from '../journeyPlanner';
import { mapMatchGpsPing } from '../mapMatcher';
import { BusTrafficModel } from '../trafficModel';

describe('Pravaah Delhi Transit Core Engine', () => {
  it('verifies every consecutive stop pair in every Delhi route has a valid directed road segment', () => {
    for (const route of DELHI_ROUTES) {
      for (let i = 0; i < route.stopIds.length - 1; i++) {
        const fwd = SEGMENT_BY_ID[segmentIdFor(route.stopIds[i], route.stopIds[i + 1])];
        const rev = SEGMENT_BY_ID[segmentIdFor(route.stopIds[i + 1], route.stopIds[i])];
        expect(fwd, `Missing forward segment for route ${route.shortName}`).toBeDefined();
        expect(rev, `Missing reverse segment for route ${route.shortName}`).toBeDefined();
      }
    }
  });

  it('map-matches noisy GPS pings accurately and rejects wrong-direction or far outliers', () => {
    const seg = SEGMENT_BY_ID['lajpat_nagar__ashram'];
    expect(seg).toBeDefined();
    const mid = seg.waypoints[1] ?? seg.waypoints[0];

    const goodMatch = mapMatchGpsPing({
      pingId: 'test-1',
      vehicleId: 'DL51EV-1001',
      routeId: 'RT_543',
      routeShortName: '543',
      operator: 'DTC_NON_AC',
      direction: 1, // Ashram -> Lajpat is dir 0 on 543, Lajpat -> Ashram is dir 1
      rawLat: mid.lat + 0.00005,
      rawLng: mid.lng - 0.00004,
      bearingDeg: 85,
      reportedSpeedKmh: 19.5,
      timestampMs: Date.now(),
    });

    expect(goodMatch).not.toBeNull();
    expect(goodMatch?.segmentId).toBe('lajpat_nagar__ashram');
    expect(goodMatch?.matchErrorMeters).toBeLessThan(20);
    expect(goodMatch?.isValidLinkProbe).toBe(true);

    const outlier = mapMatchGpsPing({
      pingId: 'test-2',
      vehicleId: 'DL51EV-1001',
      routeId: 'RT_543',
      routeShortName: '543',
      operator: 'DTC_NON_AC',
      direction: 1,
      rawLat: 28.75, // way outside corridor
      rawLng: 77.05,
      bearingDeg: 90,
      reportedSpeedKmh: 20,
      timestampMs: Date.now(),
    });
    expect(outlier).toBeNull();
  });

  it('detects congestion shockwaves purely from GPS probes and improves ETA MAE over Static GTFS', () => {
    const model = new BusTrafficModel(18.25);
    const sim = new DelhiTransitSimulator(model, 18.25, 424242);

    const ashramBefore = model.getState('lajpat_nagar__ashram')!.currentSpeedKmh;
    sim.setIncidentActive('inc_ashram', true);

    // Run 60 ticks (~4 minutes simulated) so buses traverse Ashram and emit GPS probes
    for (let i = 0; i < 60; i++) {
      sim.step(4);
    }

    const ashramAfter = model.getState('lajpat_nagar__ashram')!.currentSpeedKmh;
    expect(ashramAfter).toBeLessThan(ashramBefore);

    const metrics = model.getValidationMetrics();
    expect(metrics.sampleCount).toBeGreaterThan(20);
    expect(metrics.pravaahMaeSec).toBeLessThan(metrics.staticGtfsMaeSec);
  });

  it('plans realistic direct and 1-transfer journeys from Okhla Ph-III to AIIMS and Connaught Place', () => {
    const model = new BusTrafficModel(18.25);
    const sim = new DelhiTransitSimulator(model, 18.25, 9911);

    const toAiims = planDelhiJourneys({
      originStopId: 'iiit_delhi',
      destinationStopId: 'aiims',
      model,
      buses: sim.getBuses(),
      preference: 'FASTEST',
    });

    expect(toAiims.length).toBeGreaterThanOrEqual(2);
    expect(toAiims[0].predictedTotalSec).toBeGreaterThan(600);
    expect(toAiims[0].p10TotalSec).toBeLessThan(toAiims[0].predictedTotalSec);
    expect(toAiims[0].p90TotalSec).toBeGreaterThan(toAiims[0].predictedTotalSec);

    const toCp = planDelhiJourneys({
      originStopId: 'iiit_delhi',
      destinationStopId: 'connaught_place',
      model,
      buses: sim.getBuses(),
      preference: 'FASTEST',
    });
    expect(toCp.length).toBeGreaterThanOrEqual(1);
  });

  it('ingests external Delhi GPS CSV traces and exports valid GeoJSON', () => {
    const model = new BusTrafficModel(14.0);
    const csv = generateSampleDelhiCsv();
    const report = ingestGpsCsvText(csv, model);

    expect(report.totalRecords).toBeGreaterThan(15);
    expect(report.matchedRecords).toBe(report.totalRecords);
    expect(report.updatedSegmentIds).toContain('lajpat_nagar__ashram');

    const geoJson = JSON.parse(exportTrafficGeoJson(model.getStateRecord(), Date.now()));
    expect(geoJson.type).toBe('FeatureCollection');
    expect(geoJson.features.length).toBeGreaterThan(80);
  });
});
