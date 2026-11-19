import { MapPin, Radio, X } from 'lucide-react';
import {
  DELHI_ROUTES,
  SEGMENT_BY_ID,
  STOP_BY_ID,
  segmentIdFor,
} from '../data/delhiNetwork';
import { trafficLevelColor, trafficLevelLabel } from '../engine/trafficModel';
import type { SegmentTrafficState, SimulatedBus } from '../types/transit';
import { formatDistanceKm, formatDurationMin } from '../utils/format';
import { DiurnalChart, ProbeKalmanChart } from './DiurnalChart';
import { RouteBadge } from './RouteBadge';

interface SegmentInspectorCardProps {
  segmentId: string;
  state: SegmentTrafficState;
  simHour: number;
  onClose: () => void;
}

export function SegmentInspectorCard({
  segmentId,
  state,
  simHour,
  onClose,
}: SegmentInspectorCardProps) {
  const seg = SEGMENT_BY_ID[segmentId];
  if (!seg) return null;

  const color = trafficLevelColor(state.level);
  const deltaMin = Math.round((state.predictedRunTimeSec - state.scheduledRunTimeSec) / 60);

  return (
    <div className="w-[372px] max-w-[calc(100vw-24px)] bg-[#151821]/95 backdrop-blur-md border border-[#2B3142] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[#242938] flex items-start justify-between gap-2 bg-[#12141C]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              {trafficLevelLabel(state.level)}
            </span>
            <span className="text-[11.5px] text-[#94A3B8]">
              {formatDistanceKm(seg.lengthMeters)} road stretch
            </span>
          </div>
          <h3 className="text-[14px] font-extrabold text-white mt-1 leading-snug">
            {seg.shortLabel}
          </h3>
          <div className="text-[11px] text-[#94A3B8]">{seg.corridorName}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#252A3A] text-[#94A3B8] hover:text-white cursor-pointer"
          aria-label="Close road details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#1B1E29] rounded-xl p-2.5 border border-[#272D3D]">
            <div className="text-[10px] font-bold text-[#94A3B8]">Live Speed</div>
            <div className="text-[18px] font-black text-white font-mono-tabular mt-0.5">
              {state.currentSpeedKmh.toFixed(0)}{' '}
              <span className="text-[10.5px] font-normal text-[#94A3B8]">km/h</span>
            </div>
          </div>
          <div className="bg-[#1B1E29] rounded-xl p-2.5 border border-[#272D3D]">
            <div className="text-[10px] font-bold text-[#94A3B8]">Historical</div>
            <div className="text-[18px] font-black text-[#94A3B8] font-mono-tabular mt-0.5">
              {state.historicalSpeedKmh.toFixed(0)}{' '}
              <span className="text-[10.5px] font-normal text-[#94A3B8]">km/h</span>
            </div>
          </div>
          <div className="bg-[#1B1E29] rounded-xl p-2.5 border border-[#272D3D]">
            <div className="text-[10px] font-bold text-[#00E5FF]">Bus Traversal</div>
            <div className="text-[18px] font-black text-[#00E5FF] font-mono-tabular mt-0.5">
              {Math.max(1, Math.round(state.predictedRunTimeSec / 60))}m
            </div>
            <div className="text-[9.5px] text-[#94A3B8]">
              {deltaMin > 0 ? `+${deltaMin}m delay` : 'on time'}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-[#CBD5E1] bg-[#1A1F2C] border border-[#2A3144] rounded-xl px-3 py-2 flex items-center justify-between">
          <span>Observed from <b>{state.recentProbeCount}</b> bus GPS pings</span>
          <span className="font-bold text-[#00E5FF]">Stop dwell: {state.estimatedDwellSec}s</span>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-white">24h Pattern &amp; +60m Forecast</span>
            <span className="text-[#94A3B8] font-mono-tabular">
              +30m: {state.forecastSpeedsKmh[1].toFixed(0)} km/h
            </span>
          </div>
          <div className="bg-[#10121A] rounded-xl p-2 border border-[#222736]">
            <DiurnalChart segment={seg} state={state} simHour={simHour} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-white">Raw GPS Probes vs Kalman Filter</span>
            <span className="text-[10px] text-[#94A3B8]">Adaptive Noise Fusion</span>
          </div>
          <div className="bg-[#10121A] rounded-xl p-2 border border-[#222736]">
            <ProbeKalmanChart state={state} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StopPisCardProps {
  stopId: string;
  buses: SimulatedBus[];
  trafficStates: Record<string, SegmentTrafficState>;
  onSetOrigin: (stopId: string) => void;
  onSetDestination: (stopId: string) => void;
  onClose: () => void;
}

export function StopPisCard({
  stopId,
  buses,
  trafficStates,
  onSetOrigin,
  onSetDestination,
  onClose,
}: StopPisCardProps) {
  const stop = STOP_BY_ID[stopId];
  if (!stop) return null;

  const arrivals: Array<{
    vehicleId: string;
    routeShortName: string;
    operator: SimulatedBus['operator'];
    destinationName: string;
    etaSec: number;
    occupancyPercent: number;
  }> = [];

  for (const bus of buses) {
    const targetIdx = bus.stopSequence.indexOf(stopId);
    if (targetIdx === -1 || targetIdx <= bus.currentStopIdx) continue;
    const stopsAway = targetIdx - bus.currentStopIdx;
    if (stopsAway > 5) continue;

    let etaSec = bus.dwellRemainingSec;
    for (let i = bus.currentStopIdx; i < targetIdx; i++) {
      const sId = segmentIdFor(bus.stopSequence[i], bus.stopSequence[i + 1]);
      const st = trafficStates[sId];
      if (!st) continue;
      const frac = i === bus.currentStopIdx ? 1 - bus.progressOnSegment : 1;
      etaSec += st.predictedRunTimeSec * frac + (i > bus.currentStopIdx ? st.estimatedDwellSec : 0);
    }

    const destId = bus.stopSequence[bus.stopSequence.length - 1];
    arrivals.push({
      vehicleId: bus.vehicleId,
      routeShortName: bus.routeShortName,
      operator: bus.operator,
      destinationName: STOP_BY_ID[destId]?.name ?? destId,
      etaSec: Math.max(30, Math.round(etaSec)),
      occupancyPercent: Math.round(((bus.passengersEst ?? 30) / 60) * 100),
    });
  }

  arrivals.sort((a, b) => a.etaSec - b.etaSec);
  const servingRoutes = DELHI_ROUTES.filter((r) => r.stopIds.includes(stopId));

  return (
    <div className="w-[348px] max-w-[calc(100vw-24px)] bg-[#151821]/95 backdrop-blur-md border border-[#2B3142] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white overflow-hidden">
      <div className="px-4 py-3.5 border-b border-[#242938] flex items-start justify-between gap-2 bg-[#12141C]">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#00E5FF]">
            <MapPin className="w-3.5 h-3.5" />
            <span>PIS LIVE ARRIVAL BOARD</span>
          </div>
          <h3 className="text-[15px] font-extrabold text-white mt-0.5">{stop.name}</h3>
          <div className="text-[11.5px] text-[#94A3B8]">{stop.corridor}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#252A3A] text-[#94A3B8] hover:text-white cursor-pointer"
          aria-label="Close stop board"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3.5">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSetOrigin(stop.id)}
            className="h-9 rounded-xl bg-[#00E5FF]/20 hover:bg-[#00E5FF]/30 text-[#00E5FF] border border-[#00E5FF]/30 text-[12px] font-bold cursor-pointer transition-colors"
          >
            Start Here
          </button>
          <button
            type="button"
            onClick={() => onSetDestination(stop.id)}
            className="h-9 rounded-xl bg-[#E50914] hover:bg-[#B80710] text-white text-[12px] font-bold cursor-pointer transition-colors shadow-[0_0_12px_rgba(229,9,20,0.4)]"
          >
            Go Here
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-[#94A3B8] mb-2 uppercase tracking-wide">
            <span className="inline-flex items-center gap-1.5 text-[#10B981]">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Approaching Buses
            </span>
            <span>Live ETA &amp; Crowd</span>
          </div>

          {arrivals.length === 0 ? (
            <div className="text-[12px] text-[#94A3B8] py-4 text-center bg-[#10121A] rounded-xl border border-[#232736]">
              No buses within 5 stops right now.
            </div>
          ) : (
            <div className="divide-y divide-[#202535] border border-[#272D3D] rounded-xl overflow-hidden bg-[#10121A]">
              {arrivals.slice(0, 4).map((arr) => (
                <div
                  key={`${arr.vehicleId}-${arr.routeShortName}`}
                  className="px-3 py-2.5 flex items-center justify-between gap-2 text-[12px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <RouteBadge shortName={arr.routeShortName} operator={arr.operator} size="xs" />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        to {arr.destinationName}
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">
                        Load: <b className={arr.occupancyPercent >= 75 ? 'text-[#E50914]' : 'text-[#10B981]'}>{arr.occupancyPercent}%</b>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono-tabular font-bold text-[#00E5FF] shrink-0">
                    {formatDurationMin(arr.etaSec)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="text-[10.5px] text-[#94A3B8] mr-1">Routes:</span>
          {servingRoutes.map((r) => (
            <RouteBadge key={r.id} shortName={r.shortName} operator={r.operator} size="xs" />
          ))}
        </div>
      </div>
    </div>
  );
}
