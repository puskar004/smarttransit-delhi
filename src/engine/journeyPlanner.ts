import {
  DELHI_ROUTES,
  DELHI_STOPS,
  SEGMENT_BY_ID,
  STOP_BY_ID,
  segmentIdFor,
} from '../data/delhiNetwork';
import type {
  BusOperator,
  BusRoute,
  CrowdLevel,
  JourneyBottleneck,
  JourneyLeg,
  JourneyPreference,
  JourneySegmentDetail,
  PlannedJourney,
  SimulatedBus,
} from '../types/transit';
import { haversineMeters } from './geo';
import { BusTrafficModel } from './trafficModel';

const WALK_SPEED_MPS = 1.25; // ~4.5 km/h urban walking speed
const MAX_TRANSFER_WALK_METERS = 900; // allows cross-junction hub transfers (e.g. Nehru Place <-> Kalkaji)

function computeCrowdMetrics(params: {
  operators: BusOperator[];
  stopIds: string[];
  simHour: number;
  delayDeltaSec: number;
  transfers: number;
  liveBus?: SimulatedBus;
}): {
  crowdLevel: CrowdLevel;
  occupancyPercent: number;
  seatProbabilityPercent: number;
  comfortScore: number;
  hasAc: boolean;
} {
  const { operators, stopIds, simHour, delayDeltaSec, transfers, liveBus } = params;
  const isMorningPeak = simHour >= 8.5 && simHour <= 10.8;
  const isEveningPeak = simHour >= 17.5 && simHour <= 20.8;
  const isPeak = isMorningPeak || isEveningPeak;

  // Base stop demand along route
  let stopDemandSum = 0;
  for (const sId of stopIds) {
    const s = STOP_BY_ID[sId];
    stopDemandSum += s?.peakDemandFactor ?? 1.5;
  }
  const avgStopDemand = stopDemandSum / Math.max(1, stopIds.length);

  // Operator capacity: EV & AC buses manage boarding flow better
  const hasAc = operators.some((op) => op === 'DTC_AC' || op === 'DTC_ELECTRIC');
  const isCluster = operators.some((op) => op === 'DIMTS_CLUSTER');

  // Base occupancy from time of day + stop demand
  let baseOcc = isPeak ? 68 + (avgStopDemand - 1.5) * 22 : 36 + (avgStopDemand - 1.2) * 16;
  if (isCluster) baseOcc += 8; // cluster non-AC routes in Delhi are notoriously packed
  if (hasAc && !isPeak) baseOcc -= 6;

  // Bunching delay penalty: when a bus is delayed, passenger accumulation on stops grows!
  const delayMin = Math.max(0, delayDeltaSec / 60);
  baseOcc += Math.min(22, delayMin * 2.8);

  // If we have live bus passenger telemetry, blend it in
  if (liveBus && liveBus.passengersEst) {
    const capacity = 60;
    const liveOcc = (liveBus.passengersEst / capacity) * 100;
    baseOcc = baseOcc * 0.4 + liveOcc * 0.6;
  }

  const occupancyPercent = Math.max(18, Math.min(98, Math.round(baseOcc)));

  let crowdLevel: CrowdLevel;
  if (occupancyPercent < 45) {
    crowdLevel = 'LOW';
  } else if (occupancyPercent < 72) {
    crowdLevel = 'MEDIUM';
  } else if (occupancyPercent < 88) {
    crowdLevel = 'HIGH';
  } else {
    crowdLevel = 'CRUSH_LOAD';
  }

  // Seat probability estimation
  let seatProb: number;
  if (occupancyPercent <= 40) {
    seatProb = Math.round(92 - (occupancyPercent - 20) * 0.6);
  } else if (occupancyPercent <= 65) {
    seatProb = Math.round(75 - (occupancyPercent - 40) * 1.5);
  } else if (occupancyPercent <= 85) {
    seatProb = Math.round(38 - (occupancyPercent - 65) * 1.4);
  } else {
    seatProb = Math.max(4, Math.round(12 - (occupancyPercent - 85) * 0.8));
  }

  // Comfort Score: 0..100
  const comfortScore = Math.max(
    15,
    Math.min(
      99,
      Math.round(
        (100 - occupancyPercent) * 0.5 +
          seatProb * 0.25 +
          (hasAc ? 18 : 6) -
          transfers * 8
      )
    )
  );

  return {
    crowdLevel,
    occupancyPercent,
    seatProbabilityPercent: seatProb,
    comfortScore,
    hasAc,
  };
}

interface RouteDirectionInstance {
  route: BusRoute;
  direction: 0 | 1;
  stopIds: string[];
  stopIndexMap: Map<string, number>;
}

const ROUTE_INSTANCES: RouteDirectionInstance[] = DELHI_ROUTES.flatMap((route) => {
  const dir0 = [...route.stopIds];
  const dir1 = [...route.stopIds].reverse();
  return [
    {
      route,
      direction: 0 as const,
      stopIds: dir0,
      stopIndexMap: new Map(dir0.map((id, idx) => [id, idx])),
    },
    {
      route,
      direction: 1 as const,
      stopIds: dir1,
      stopIndexMap: new Map(dir1.map((id, idx) => [id, idx])),
    },
  ];
});

/**
 * Estimate live wait time for the next approaching bus of a given route/direction at `boardStopId`.
 * Uses actual live bus positions along the route when departing now (departureOffsetMin <= 5);
 * falls back to headway-based expected wait for future departures.
 */
function estimateLiveNextBus(
  inst: RouteDirectionInstance,
  boardStopIdx: number,
  buses: SimulatedBus[],
  model: BusTrafficModel,
  departureOffsetMin: number
): {
  waitSec: number;
  vehicleId?: string;
  distanceKm?: number;
  headwaySec: number;
} {
  const simHour = (model.getSimHour() + departureOffsetMin / 60) % 24;
  const isPeak = (simHour >= 8 && simHour <= 11) || (simHour >= 17 && simHour <= 20.5);
  const headwayMin = isPeak ? inst.route.headwayPeakMin : inst.route.headwayOffPeakMin;
  const headwaySec = headwayMin * 60;

  // For future scheduled queries (> 8 min ahead), use expected half-headway + congestion buffer
  if (departureOffsetMin > 8) {
    return {
      waitSec: Math.round(headwaySec * 0.52),
      headwaySec,
    };
  }

  // Scan live buses on this exact route + direction that are upstream of boardStopIdx
  let bestEtaSec = Infinity;
  let bestBus: SimulatedBus | undefined;
  let bestDistMeters = 0;

  for (const bus of buses) {
    if (bus.routeId !== inst.route.id || bus.direction !== inst.direction) continue;
    if (bus.currentStopIdx >= boardStopIdx) continue;

    // Sum remaining time from bus's current position to boardStopIdx using live TrafficModel
    let etaSec = bus.dwellRemainingSec;
    let distMeters = 0;

    for (let idx = bus.currentStopIdx; idx < boardStopIdx; idx++) {
      const sId = segmentIdFor(inst.stopIds[idx], inst.stopIds[idx + 1]);
      const seg = SEGMENT_BY_ID[sId];
      const st = model.getState(sId);
      if (!seg || !st) continue;

      const fraction = idx === bus.currentStopIdx ? 1 - bus.progressOnSegment : 1;
      etaSec += st.predictedRunTimeSec * fraction;
      distMeters += seg.lengthMeters * fraction;
      if (idx > bus.currentStopIdx) {
        etaSec += st.estimatedDwellSec;
      }
    }

    if (etaSec < bestEtaSec) {
      bestEtaSec = etaSec;
      bestBus = bus;
      bestDistMeters = distMeters;
    }
  }

  if (bestBus && bestEtaSec < headwaySec * 2.2) {
    return {
      waitSec: Math.max(45, Math.round(bestEtaSec)),
      vehicleId: bestBus.vehicleId,
      distanceKm: Math.round((bestDistMeters / 1000) * 10) / 10,
      headwaySec,
    };
  }

  return {
    waitSec: Math.round(headwaySec * 0.55),
    headwaySec,
  };
}

/**
 * Evaluate riding a route from `fromIdx` to `toIdx` starting at `startOffsetMin` from now.
 * Uses time-dependent predicted segment speeds + stop dwell times + uncertainty propagation!
 */
function evaluateBusLeg(
  inst: RouteDirectionInstance,
  fromIdx: number,
  toIdx: number,
  startOffsetMin: number,
  model: BusTrafficModel
): {
  leg: JourneyLeg;
  varianceSec2: number;
  bottlenecks: JourneyBottleneck[];
} {
  let predictedSec = 0;
  let scheduledSec = 0;
  let totalDist = 0;
  let totalVarianceSec2 = 0;

  const segments: JourneySegmentDetail[] = [];
  const bottlenecks: JourneyBottleneck[] = [];
  const stopTimeline: NonNullable<JourneyLeg['stopTimeline']> = [
    {
      stopId: inst.stopIds[fromIdx],
      stopName: STOP_BY_ID[inst.stopIds[fromIdx]]?.name ?? inst.stopIds[fromIdx],
      etaOffsetSec: 0,
      scheduledOffsetSec: 0,
    },
  ];

  for (let i = fromIdx; i < toIdx; i++) {
    const aId = inst.stopIds[i];
    const bId = inst.stopIds[i + 1];
    const segId = segmentIdFor(aId, bId);
    const seg = SEGMENT_BY_ID[segId];
    const st = model.getState(segId);
    if (!seg || !st) continue;

    // Time-dependent speed lookup at the exact minute the bus will reach this segment!
    const arrivalOffsetMin = startOffsetMin + predictedSec / 60;
    const speedKmh = model.predictSpeedAtOffset(segId, arrivalOffsetMin);
    const runSec = Math.round((seg.lengthMeters / 1000 / Math.max(4.5, speedKmh)) * 3600);
    const schedRunSec = st.scheduledRunTimeSec;
    const dwellSec = i > fromIdx ? st.estimatedDwellSec : 0;
    const schedDwellSec = i > fromIdx ? 20 : 0;

    predictedSec += runSec + dwellSec;
    scheduledSec += schedRunSec + schedDwellSec;
    totalDist += seg.lengthMeters;

    // Propagate speed variance -> travel time variance via first-order Taylor delta method:
    // Var(L/v) ≈ (L / v^2)^2 * Var(v)
    const speedMps = Math.max(1.5, speedKmh / 3.6);
    const stdMps = st.speedStdKmh / 3.6;
    const segTimeStd = (seg.lengthMeters / (speedMps * speedMps)) * stdMps;
    totalVarianceSec2 += segTimeStd * segTimeStd + (i > fromIdx ? 64 : 0);

    const segDetail: JourneySegmentDetail = {
      segmentId: segId,
      fromStopId: aId,
      fromStopName: STOP_BY_ID[aId]?.name ?? aId,
      toStopId: bId,
      toStopName: STOP_BY_ID[bId]?.name ?? bId,
      corridorName: seg.corridorName,
      predictedSec: runSec + dwellSec,
      scheduledSec: schedRunSec + schedDwellSec,
      speedKmh,
      level: st.level,
      incidentLabel: st.incidentLabel,
    };
    segments.push(segDetail);

    const delaySec = runSec - schedRunSec;
    if (delaySec >= 40 || st.level === 'SEVERE' || st.incidentLabel) {
      bottlenecks.push({
        segmentId: segId,
        label: st.incidentLabel ? `${st.incidentLabel} (${seg.shortLabel})` : seg.shortLabel,
        corridorName: seg.corridorName,
        delaySec: Math.max(0, delaySec),
        speedKmh,
        level: st.level,
      });
    }

    stopTimeline.push({
      stopId: bId,
      stopName: STOP_BY_ID[bId]?.name ?? bId,
      etaOffsetSec: predictedSec,
      scheduledOffsetSec: scheduledSec,
    });
  }

  // Authentic Delhi DTC / Cluster fare slab by distance
  const distKm = totalDist / 1000;
  const fareInr =
    inst.route.operator === 'DTC_AC' || inst.route.operator === 'DTC_ELECTRIC'
      ? distKm <= 4
        ? 10
        : distKm <= 10
          ? 15
          : distKm <= 16
            ? 20
            : 25
      : distKm <= 4
        ? 5
        : distKm <= 10
          ? 10
          : 15;

  const leg: JourneyLeg = {
    type: 'BUS',
    routeId: inst.route.id,
    routeShortName: inst.route.shortName,
    operator: inst.route.operator,
    direction: inst.direction,
    fromStopId: inst.stopIds[fromIdx],
    fromStopName: STOP_BY_ID[inst.stopIds[fromIdx]]?.name ?? inst.stopIds[fromIdx],
    toStopId: inst.stopIds[toIdx],
    toStopName: STOP_BY_ID[inst.stopIds[toIdx]]?.name ?? inst.stopIds[toIdx],
    durationSec: predictedSec,
    scheduledDurationSec: scheduledSec,
    distanceMeters: totalDist,
    stopCount: toIdx - fromIdx,
    fareInr,
    segments,
    stopTimeline,
  };

  return { leg, varianceSec2: totalVarianceSec2, bottlenecks };
}

/**
 * Plan multi-route real-time traffic-aware Delhi bus journeys (Direct + 1-Transfer).
 */
export function planDelhiJourneys(params: {
  originStopId: string;
  destinationStopId: string;
  model: BusTrafficModel;
  buses: SimulatedBus[];
  departureOffsetMin?: number;
  preference?: JourneyPreference;
  maxResults?: number;
}): PlannedJourney[] {
  const {
    originStopId,
    destinationStopId,
    model,
    buses,
    departureOffsetMin = 0,
    preference = 'FASTEST',
    maxResults = 5,
  } = params;

  if (!originStopId || !destinationStopId || originStopId === destinationStopId) {
    return [];
  }

  const candidates: PlannedJourney[] = [];
  const seenKeys = new Set<string>();

  // 1. Direct (0-transfer) bus routes
  for (const inst of ROUTE_INSTANCES) {
    const oIdx = inst.stopIndexMap.get(originStopId);
    const dIdx = inst.stopIndexMap.get(destinationStopId);
    if (oIdx === undefined || dIdx === undefined || oIdx >= dIdx) continue;

    const key = `DIRECT_${inst.route.id}_${inst.direction}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const waitInfo = estimateLiveNextBus(inst, oIdx, buses, model, departureOffsetMin);
    const ride = evaluateBusLeg(
      inst,
      oIdx,
      dIdx,
      departureOffsetMin + waitInfo.waitSec / 60,
      model
    );

    const waitLeg: JourneyLeg = {
      type: 'WAIT',
      routeId: inst.route.id,
      routeShortName: inst.route.shortName,
      operator: inst.route.operator,
      fromStopId: originStopId,
      fromStopName: STOP_BY_ID[originStopId]?.name ?? originStopId,
      toStopId: originStopId,
      toStopName: STOP_BY_ID[originStopId]?.name ?? originStopId,
      durationSec: waitInfo.waitSec,
      scheduledDurationSec: Math.round(waitInfo.headwaySec * 0.5),
      distanceMeters: 0,
      approachingVehicleId: waitInfo.vehicleId,
      approachingDistanceKm: waitInfo.distanceKm,
    };

    const predictedTotalSec = waitLeg.durationSec + ride.leg.durationSec;
    const scheduledTotalSec = waitLeg.scheduledDurationSec + ride.leg.scheduledDurationSec;
    const stdSec = Math.sqrt(ride.varianceSec2 + Math.pow(waitInfo.headwaySec * 0.14, 2));
    const p10TotalSec = Math.max(Math.round(predictedTotalSec * 0.82), Math.round(predictedTotalSec - 1.28 * stdSec));
    const p90TotalSec = Math.round(predictedTotalSec + 1.28 * stdSec);

    const cov = stdSec / Math.max(120, predictedTotalSec);
    const severeCount = ride.bottlenecks.filter((b) => b.level === 'SEVERE').length;
    const reliabilityScore = Math.max(
      34,
      Math.min(98, Math.round(97 - cov * 135 - severeCount * 9))
    );

    const avgSpeedKmh =
      ride.leg.durationSec > 0
        ? Math.round((ride.leg.distanceMeters / 1000 / (ride.leg.durationSec / 3600)) * 10) / 10
        : 0;

    const crowd = computeCrowdMetrics({
      operators: [inst.route.operator],
      stopIds: inst.stopIds.slice(oIdx, dIdx + 1),
      simHour: model.getSimHour(),
      delayDeltaSec: predictedTotalSec - scheduledTotalSec,
      transfers: 0,
    });

    candidates.push({
      id: key,
      summaryTitle: `Route ${inst.route.shortName} · Direct`,
      routeBadges: [{ shortName: inst.route.shortName, operator: inst.route.operator }],
      transfers: 0,
      predictedTotalSec,
      scheduledTotalSec,
      delayDeltaSec: predictedTotalSec - scheduledTotalSec,
      p10TotalSec,
      p90TotalSec,
      reliabilityScore,
      totalFareInr: ride.leg.fareInr ?? 10,
      totalDistanceMeters: ride.leg.distanceMeters,
      avgSpeedKmh,
      nextBusWaitSec: waitInfo.waitSec,
      legs: [waitLeg, ride.leg],
      bottlenecks: ride.bottlenecks.sort((a, b) => b.delaySec - a.delaySec).slice(0, 3),
      tags: ['Direct'],
      crowdLevel: crowd.crowdLevel,
      occupancyPercent: crowd.occupancyPercent,
      seatProbabilityPercent: crowd.seatProbabilityPercent,
      comfortScore: crowd.comfortScore,
      hasAc: crowd.hasAc,
      matchScorePercent: 90,
    });
  }

  // 2. 1-Transfer journeys (including same-stop and short walking hub transfers)
  const originRoutes = ROUTE_INSTANCES.filter((inst) => inst.stopIndexMap.has(originStopId));
  const destRoutes = ROUTE_INSTANCES.filter((inst) => inst.stopIndexMap.has(destinationStopId));

  // Precompute walkable stop pairs for hub transfers
  const nearbyStops = new Map<string, Array<{ stopId: string; walkMeters: number }>>();
  for (const sA of DELHI_STOPS) {
    const list: Array<{ stopId: string; walkMeters: number }> = [{ stopId: sA.id, walkMeters: 0 }];
    for (const sB of DELHI_STOPS) {
      if (sA.id === sB.id) continue;
      const dist = haversineMeters(sA, sB);
      if (dist <= MAX_TRANSFER_WALK_METERS) {
        list.push({ stopId: sB.id, walkMeters: Math.round(dist) });
      }
    }
    nearbyStops.set(sA.id, list);
  }

  const bestPerRoutePair = new Map<string, PlannedJourney>();

  for (const r1 of originRoutes) {
    const oIdx = r1.stopIndexMap.get(originStopId)!;
    for (const r2 of destRoutes) {
      if (r1.route.id === r2.route.id) continue;
      const dIdx = r2.stopIndexMap.get(destinationStopId)!;

      // Find best transfer stop along r1 after oIdx that connects to r2 before dIdx
      for (let t1 = oIdx + 1; t1 < r1.stopIds.length; t1++) {
        const stop1Id = r1.stopIds[t1];
        const transfersFromStop1 = nearbyStops.get(stop1Id) ?? [];

        for (const xfer of transfersFromStop1) {
          const t2 = r2.stopIndexMap.get(xfer.stopId);
          if (t2 === undefined || t2 >= dIdx) continue;
          if (xfer.stopId === originStopId || stop1Id === destinationStopId) continue;

          const wait1 = estimateLiveNextBus(r1, oIdx, buses, model, departureOffsetMin);
          const leg1 = evaluateBusLeg(
            r1,
            oIdx,
            t1,
            departureOffsetMin + wait1.waitSec / 60,
            model
          );

          const walkSec = xfer.walkMeters > 0 ? Math.round(xfer.walkMeters / WALK_SPEED_MPS) + 45 : 75;
          const arriveTransferMin =
            departureOffsetMin + (wait1.waitSec + leg1.leg.durationSec + walkSec) / 60;

          const wait2 = estimateLiveNextBus(r2, t2, buses, model, arriveTransferMin);
          const leg2 = evaluateBusLeg(
            r2,
            t2,
            dIdx,
            arriveTransferMin + wait2.waitSec / 60,
            model
          );

          const predictedTotalSec =
            wait1.waitSec + leg1.leg.durationSec + walkSec + wait2.waitSec + leg2.leg.durationSec;
          const scheduledTotalSec =
            Math.round(wait1.headwaySec * 0.5) +
            leg1.leg.scheduledDurationSec +
            walkSec +
            Math.round(wait2.headwaySec * 0.5) +
            leg2.leg.scheduledDurationSec;

          const pairKey = `${r1.route.id}_${r2.route.id}`;
          const existing = bestPerRoutePair.get(pairKey);
          if (existing && existing.predictedTotalSec <= predictedTotalSec) continue;

          const totalVar =
            leg1.varianceSec2 +
            leg2.varianceSec2 +
            Math.pow(wait1.headwaySec * 0.14, 2) +
            Math.pow(wait2.headwaySec * 0.18, 2);
          const stdSec = Math.sqrt(totalVar);
          const p10TotalSec = Math.max(
            Math.round(predictedTotalSec * 0.8),
            Math.round(predictedTotalSec - 1.28 * stdSec)
          );
          const p90TotalSec = Math.round(predictedTotalSec + 1.28 * stdSec);

          const allBottlenecks = [...leg1.bottlenecks, ...leg2.bottlenecks]
            .sort((a, b) => b.delaySec - a.delaySec)
            .slice(0, 3);
          const severeCount = allBottlenecks.filter((b) => b.level === 'SEVERE').length;
          const cov = stdSec / Math.max(180, predictedTotalSec);
          const reliabilityScore = Math.max(
            30,
            Math.min(94, Math.round(92 - cov * 130 - severeCount * 9 - 4))
          );

          const totalDist = leg1.leg.distanceMeters + xfer.walkMeters + leg2.leg.distanceMeters;
          const busDuration = leg1.leg.durationSec + leg2.leg.durationSec;
          const avgSpeedKmh =
            busDuration > 0
              ? Math.round(((leg1.leg.distanceMeters + leg2.leg.distanceMeters) / 1000 / (busDuration / 3600)) * 10) / 10
              : 0;

          const transferStopName = STOP_BY_ID[stop1Id]?.name ?? stop1Id;
          const legs: JourneyLeg[] = [
            {
              type: 'WAIT',
              routeId: r1.route.id,
              routeShortName: r1.route.shortName,
              operator: r1.route.operator,
              fromStopId: originStopId,
              fromStopName: STOP_BY_ID[originStopId]?.name ?? originStopId,
              toStopId: originStopId,
              toStopName: STOP_BY_ID[originStopId]?.name ?? originStopId,
              durationSec: wait1.waitSec,
              scheduledDurationSec: Math.round(wait1.headwaySec * 0.5),
              distanceMeters: 0,
              approachingVehicleId: wait1.vehicleId,
              approachingDistanceKm: wait1.distanceKm,
            },
            leg1.leg,
            {
              type: 'TRANSFER_WALK',
              fromStopId: stop1Id,
              fromStopName: transferStopName,
              toStopId: xfer.stopId,
              toStopName: STOP_BY_ID[xfer.stopId]?.name ?? xfer.stopId,
              durationSec: walkSec + wait2.waitSec,
              scheduledDurationSec: walkSec + Math.round(wait2.headwaySec * 0.5),
              distanceMeters: xfer.walkMeters,
            },
            leg2.leg,
          ];

          const crowd = computeCrowdMetrics({
            operators: [r1.route.operator, r2.route.operator],
            stopIds: [...r1.stopIds.slice(oIdx, t1 + 1), ...r2.stopIds.slice(t2, dIdx + 1)],
            simHour: model.getSimHour(),
            delayDeltaSec: predictedTotalSec - scheduledTotalSec,
            transfers: 1,
          });

          bestPerRoutePair.set(pairKey, {
            id: `XFER_${pairKey}_${stop1Id}`,
            summaryTitle: `${r1.route.shortName} → ${r2.route.shortName} via ${transferStopName}`,
            routeBadges: [
              { shortName: r1.route.shortName, operator: r1.route.operator },
              { shortName: r2.route.shortName, operator: r2.route.operator },
            ],
            transfers: 1,
            predictedTotalSec,
            scheduledTotalSec,
            delayDeltaSec: predictedTotalSec - scheduledTotalSec,
            p10TotalSec,
            p90TotalSec,
            reliabilityScore,
            totalFareInr: (leg1.leg.fareInr ?? 10) + (leg2.leg.fareInr ?? 10),
            totalDistanceMeters: totalDist,
            avgSpeedKmh,
            nextBusWaitSec: wait1.waitSec,
            legs,
            bottlenecks: allBottlenecks,
            tags: ['1 Transfer'],
            crowdLevel: crowd.crowdLevel,
            occupancyPercent: crowd.occupancyPercent,
            seatProbabilityPercent: crowd.seatProbabilityPercent,
            comfortScore: crowd.comfortScore,
            hasAc: crowd.hasAc,
            matchScorePercent: 88,
          });
        }
      }
    }
  }

  candidates.push(...bestPerRoutePair.values());

  // Filter wildly suboptimal detours (> 1.75x fastest total duration)
  if (candidates.length === 0) return [];
  const minTime = Math.min(...candidates.map((c) => c.predictedTotalSec));
  const pruned = candidates.filter((c) => c.predictedTotalSec <= minTime * 1.75 + 240);

  // Compute AI Match Score & Recommendation Engine
  for (const c of pruned) {
    const timeRatio = c.predictedTotalSec / Math.max(1, minTime);
    const speedScore = Math.max(0, 100 - (timeRatio - 1) * 75);
    const crowdScore = 100 - c.occupancyPercent;
    // Composite AI match score (Netflix-style percentage e.g. 98% Match)
    const match = Math.round(
      speedScore * 0.45 +
        crowdScore * 0.3 +
        c.reliabilityScore * 0.15 +
        (c.hasAc ? 7 : 0) +
        (c.transfers === 0 ? 3 : 0)
    );
    c.matchScorePercent = Math.max(76, Math.min(99, match));
  }

  // Rank by active user preference
  pruned.sort((a, b) => {
    if (preference === 'COMFORT') {
      const scoreA = b.comfortScore * 1.5 - a.predictedTotalSec / 60;
      const scoreB = a.comfortScore * 1.5 - b.predictedTotalSec / 60;
      return scoreB - scoreA;
    }
    if (preference === 'AC_ONLY') {
      if (a.hasAc !== b.hasAc) return a.hasAc ? -1 : 1;
      return a.predictedTotalSec - b.predictedTotalSec;
    }
    if (preference === 'RELIABLE') {
      const scoreA = a.predictedTotalSec / 60 - a.reliabilityScore * 0.35;
      const scoreB = b.predictedTotalSec / 60 - b.reliabilityScore * 0.35;
      return scoreA - scoreB;
    }
    if (preference === 'DIRECT') {
      if (a.transfers !== b.transfers) return a.transfers - b.transfers;
      return a.predictedTotalSec - b.predictedTotalSec;
    }
    // Default FASTEST
    return a.predictedTotalSec - b.predictedTotalSec;
  });

  const top = pruned.slice(0, maxResults);

  // Identify Fastest and Highest Comfort
  const fastest = [...top].sort((a, b) => a.predictedTotalSec - b.predictedTotalSec)[0];
  const mostComfortable = [...top].sort((a, b) => b.comfortScore - a.comfortScore)[0];
  const highestMatch = [...top].sort((a, b) => b.matchScorePercent - a.matchScorePercent)[0];

  // Pick the definitive AI Top Pick (Netflix Featured Route)
  const aiPick =
    preference === 'COMFORT'
      ? mostComfortable
      : preference === 'FASTEST'
        ? fastest
        : highestMatch ?? top[0];

  for (const j of top) {
    const tags: string[] = [];
    if (aiPick && j.id === aiPick.id) {
      j.isAiTopPick = true;
      tags.push('AI Best Choice');
    }
    if (fastest && j.id === fastest.id) tags.push('Fastest');
    if (j.crowdLevel === 'LOW') tags.push('Seats Available');
    if (j.hasAc) tags.push('AC Bus');
    if (j.transfers === 0) tags.push('Direct');
    if (j.bottlenecks.length === 0 && top.some((other) => other.bottlenecks.length > 0)) {
      tags.push('Avoids Jams');
    }
    j.tags = tags;

    // AI generated plain-English recommendation reasoning
    if (j.id === aiPick?.id) {
      const timeDiffMin = Math.round((j.predictedTotalSec - fastest.predictedTotalSec) / 60);
      if (timeDiffMin > 1 && fastest.occupancyPercent >= 75 && j.occupancyPercent <= 55) {
        j.aiRecommendationReason = `Board ${j.routeBadges.map((r) => r.shortName).join(' + ')} right now. Even though Route ${fastest.routeBadges[0]?.shortName} is ${timeDiffMin} min faster, it has crush load (${fastest.occupancyPercent}% full). This bus guarantees a seat (${j.seatProbabilityPercent}% seat chance)!`;
      } else if (timeDiffMin <= 2) {
        j.aiRecommendationReason = `Top Pick: Optimal mix of speed and comfort. Board Bus ${j.routeBadges.map((r) => r.shortName).join(' + ')} with ${j.occupancyPercent}% occupancy and ${j.seatProbabilityPercent}% seat availability.`;
      } else {
        j.aiRecommendationReason = `Recommended for maximum comfort: Low crowd (${j.occupancyPercent}% load), air-conditioned, and smooth traffic flow.`;
      }
    }
  }

  return top;
}
