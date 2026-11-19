import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Navigation,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { OPERATOR_META, STOP_BY_ID } from '../data/delhiNetwork';
import type { SegmentTrafficState, SimulatedBus } from '../types/transit';

interface LiveBusTrackerHudProps {
  bus: SimulatedBus;
  trafficStates: Record<string, SegmentTrafficState>;
  onClose: () => void;
  onCenterOnBus: () => void;
  onSelectAnotherBus: () => void;
}

export function LiveBusTrackerHud({
  bus,
  trafficStates,
  onClose,
  onCenterOnBus,
  onSelectAnotherBus,
}: LiveBusTrackerHudProps) {
  const meta = OPERATOR_META[bus.operator];
  const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);

  // Status & Delay classification
  const delaySec = bus.delayVsScheduleSec;
  const delayMin = Math.round(Math.abs(delaySec) / 60);
  const isOnTime = Math.abs(delaySec) <= 60;
  const isDelayed = delaySec > 60;

  // Crowd classification
  const crowdLabel = occ < 40 ? 'Low Crowd' : occ < 75 ? 'Moderate Crowd' : 'Crush Load';
  const crowdColor = occ < 40 ? '#10B981' : occ < 75 ? '#F59E0B' : '#E50914';
  const seatChance = Math.max(5, Math.min(98, 100 - Math.round(occ * 0.95)));

  // Current segment traffic speed
  const currentSeg = trafficStates[bus.currentSegmentId];
  const segSpeed = currentSeg ? Math.round(currentSeg.currentSpeedKmh) : Math.round(bus.speedKmh);

  // Upcoming stop list (next 4 stops)
  const remainingStops = bus.stopSequence.slice(bus.currentStopIdx + 1, bus.currentStopIdx + 5);

  return (
    <div className="w-[360px] sm:w-[410px] bg-[#121520]/95 backdrop-blur-xl border border-[#2B3246] rounded-2xl p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.8)] text-white space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Header: Badge, Bus Number, Status Pill & Close */}
      <div className="flex items-start justify-between gap-3 border-b border-[#222736] pb-3.5">
        <div className="flex items-center gap-3">
          {/* Operator colored icon box */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-[18px] shadow-[0_0_16px_rgba(0,0,0,0.6)]"
            style={{
              backgroundColor: `${meta.color}20`,
              color: meta.color,
              border: `2px solid ${meta.color}`,
            }}
          >
            {bus.routeShortName}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tabular font-bold text-[14px] text-white">
                {bus.vehicleId}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{
                  backgroundColor: `${meta.color}25`,
                  color: meta.color,
                  border: `1px solid ${meta.color}50`,
                }}
              >
                {meta.label}
              </span>
            </div>
            <div className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 mt-0.5">
              <span>Route {bus.routeShortName}</span>
              <span>·</span>
              <span className="text-[#00E5FF] font-semibold">Live Telemetry Active</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-[#1B202D] hover:bg-[#2A3144] text-[#94A3B8] hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Exit live tracking"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* On-Time / Delay Banner (Punctuality Status) */}
      <div
        className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-[12px] font-bold ${
          isOnTime
            ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#34D399]'
            : isDelayed
              ? 'bg-[#E50914]/15 border-[#E50914]/40 text-[#FF5A65]'
              : 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#FBBF24]'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnTime ? (
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          ) : isDelayed ? (
            <AlertTriangle className="w-4 h-4 text-[#E50914]" />
          ) : (
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          )}
          <span>
            {isOnTime
              ? '🟢 On Time (+0 min delay)'
              : isDelayed
                ? `🔴 Delayed by ${delayMin} min vs schedule`
                : `🟡 Running ${delayMin} min early`}
          </span>
        </div>
        <span className="text-[10px] font-mono-tabular opacity-80 uppercase tracking-wider">
          GPS AVLS
        </span>
      </div>

      {/* 3 Telemetry Cards Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Speed */}
        <div className="bg-[#181B26] border border-[#262C3E] rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-[#38BDF8]" /> Speed
          </div>
          <div className="text-[18px] font-black font-mono-tabular text-white mt-0.5">
            {bus.isDwelling ? (
              <span className="text-[#F59E0B] text-[13px] font-bold">BOARDING</span>
            ) : (
              <>
                {segSpeed}{' '}
                <span className="text-[10px] font-normal text-[#94A3B8]">km/h</span>
              </>
            )}
          </div>
          <div className="text-[9px] text-[#64748B] mt-0.5 truncate">
            {bus.isDwelling ? 'At bus stop' : 'Moving in traffic'}
          </div>
        </div>

        {/* Crowdedness */}
        <div className="bg-[#181B26] border border-[#262C3E] rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase flex items-center justify-center gap-1">
            <Users className="w-3 h-3 text-[#10B981]" /> Crowd
          </div>
          <div
            className="text-[18px] font-black font-mono-tabular mt-0.5"
            style={{ color: crowdColor }}
          >
            {occ}%
          </div>
          <div className="text-[9px] font-semibold text-[#94A3B8] truncate">
            {crowdLabel}
          </div>
        </div>

        {/* Seat Probability */}
        <div className="bg-[#181B26] border border-[#262C3E] rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00E5FF]" /> Seat Chance
          </div>
          <div className="text-[18px] font-black font-mono-tabular text-[#00E5FF] mt-0.5">
            {seatChance}%
          </div>
          <div className="text-[9px] text-[#64748B] mt-0.5 truncate">
            {seatChance > 70 ? 'High chance' : 'Standee likely'}
          </div>
        </div>
      </div>

      {/* Next Stop Arrival Countdown */}
      <div className="bg-[#181B26] border border-[#262C3E] rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
              APPROACHING STOP
            </div>
            <div className="text-[13px] font-bold text-white truncate">
              {bus.nextStopName}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[16px] font-black font-mono-tabular text-[#00E5FF]">
            {Math.max(1, Math.round(bus.etaNextStopSec / 60))} min
          </div>
          <div className="text-[9px] text-[#64748B]">estimated ETA</div>
        </div>
      </div>

      {/* Upcoming Stops Timeline */}
      {remainingStops.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
            <span>Upcoming Stops on Route</span>
            <span className="text-[#64748B] font-mono-tabular">Real-Time Snapped</span>
          </div>

          <div className="bg-[#161924] rounded-xl p-2.5 border border-[#222736] space-y-2">
            {remainingStops.map((stopId, idx) => {
              const stop = STOP_BY_ID[stopId];
              if (!stop) return null;
              const estMins = Math.max(1, Math.round((bus.etaNextStopSec + (idx + 1) * 190) / 60));
              return (
                <div key={stopId} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shrink-0" />
                    <span className="text-[#CBD5E1] truncate font-medium">{stop.name}</span>
                  </div>
                  <span className="text-[#94A3B8] font-mono-tabular shrink-0">
                    +{estMins}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons: Center on Bus / Switch Bus / Exit */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onCenterOnBus}
          className="flex-1 py-2 rounded-xl bg-[#222738] hover:bg-[#2C344A] text-white text-[12px] font-bold inline-flex items-center justify-center gap-1.5 border border-[#353E55] transition-all cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Center on Bus</span>
        </button>

        <button
          type="button"
          onClick={onSelectAnotherBus}
          className="flex-1 py-2 rounded-xl bg-[#E50914] hover:bg-[#B80710] text-white text-[12px] font-bold inline-flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(229,9,20,0.5)] transition-all cursor-pointer"
        >
          <span>Search Buses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
