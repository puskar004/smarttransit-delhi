import { describe, expect, it } from 'vitest';
import {
  DELHI_TRANSIT_OD_MATRIX,
  METRO_AND_BUS_CROWDING_PROFILES,
  METRO_FEEDER_NETWORK_500_EV,
  TRANSPORT_STACK_DATASETS,
} from '../transportStackHackathon';

describe('Delhi Transport Stack Hackathon 2026 Engine', () => {
  it('verifies official datasets cover all 5 hackathon problem statements', () => {
    expect(TRANSPORT_STACK_DATASETS.length).toBeGreaterThanOrEqual(3);

    const problemIdsCovered = new Set<number>();
    for (const ds of TRANSPORT_STACK_DATASETS) {
      for (const pid of ds.problemIds) {
        problemIdsCovered.add(pid);
      }
      expect(ds.downloadUrl).toMatch(/^https?:\/\//);
      expect(ds.unpackedSize).toBeDefined();
    }

    // Verify all 5 problems have official datasets mapped
    expect(problemIdsCovered.has(1)).toBe(true);
    expect(problemIdsCovered.has(2)).toBe(true);
    expect(problemIdsCovered.has(3)).toBe(true);
    expect(problemIdsCovered.has(4)).toBe(true);
    expect(problemIdsCovered.has(5)).toBe(true);
  });

  it('Problem 3: verifies Public Transit OD Matrix extrapolation factor and bounds', () => {
    expect(DELHI_TRANSIT_OD_MATRIX.length).toBeGreaterThan(3);

    for (const od of DELHI_TRANSIT_OD_MATRIX) {
      expect(od.sampleTicketsObserved).toBeGreaterThan(0);
      expect(od.expansionFactor).toBeGreaterThan(25); // ~3.5% bus sample expansion factor (~28.5)
      expect(od.expansionFactor).toBeLessThan(35);
      expect(od.estimatedDailyTrips).toBeGreaterThan(od.sampleTicketsObserved * 20);
      expect(od.confidenceIntervalPct).toBeLessThan(15); // Standard error bounded under 15%
      expect(od.avgTravelTimeMin).toBeGreaterThan(10);
    }
  });

  it('Problem 4: strictly verifies Metro Feeder 500 EV bus constraints', () => {
    let totalEvFleetAllocated = 0;

    for (const feeder of METRO_FEEDER_NETWORK_500_EV) {
      // Constraint 1: Maximum route length of 7 km (local service only)
      expect(feeder.routeLengthKm).toBeLessThanOrEqual(7.0);
      expect(feeder.routeLengthKm).toBeGreaterThan(3.0);

      // Constraint 2: Use only roads wider than 6 metres on each side
      expect(feeder.minRoadWidthMeters).toBeGreaterThan(6.0);

      // Constraint 3: Depot charging schedule and compliance flag
      expect(feeder.compliesWithAllConstraints).toBe(true);
      expect(feeder.chargingWindowDepot).toContain('Charge');
      expect(feeder.coveragePopulationScore).toBeGreaterThan(75);

      totalEvFleetAllocated += feeder.evBusFleetAllocated;
    }

    // Constraint 4: Fleet of exactly 500 electric buses allocated across target metro stations
    expect(totalEvFleetAllocated).toBe(500);
  });

  it('Problem 5: validates Metro and Bus AFC Crowding Profile bounds and crush detection', () => {
    expect(METRO_AND_BUS_CROWDING_PROFILES.length).toBeGreaterThanOrEqual(5);

    for (const profile of METRO_AND_BUS_CROWDING_PROFILES) {
      expect(profile.morningPeakOccupancyPct).toBeGreaterThan(profile.afternoonOccupancyPct);
      expect(profile.eveningPeakOccupancyPct).toBeGreaterThan(profile.nightOccupancyPct);
      expect(profile.morningPeakOccupancyPct).toBeLessThanOrEqual(100);
      expect(profile.paxCapacityLimit).toBeGreaterThan(50);
      expect(profile.crushLoadBottleneckSegment.length).toBeGreaterThan(5);
    }
  });
});
