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

  // Crowd classification (NO RED)
  const crowdLabel = occ < 40 ? 'LOW CROWD' : occ < 75 ? 'MODERATE' : 'HEAVY LOAD';
  const crowdColor = occ < 40 ? '#CCFF00' : occ < 75 ? '#FFB800' : '#FFFFFF';
  const seatChance = Math.max(5, Math.min(98, 100 - Math.round(occ * 0.95)));

  // Current segment traffic speed
  const currentSeg = trafficStates[bus.currentSegmentId];
  const segSpeed = currentSeg ? Math.round(currentSeg.currentSpeedKmh) : Math.round(bus.speedKmh);

  // Upcoming stop list (next 4 stops)
  const remainingStops = bus.stopSequence.slice(bus.currentStopIdx + 1, bus.currentStopIdx + 5);

  return (
    <div className="w-[360px] sm:w-[410px] bg-[#0E0E0E] border-2 border-[#CCFF00] p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.9)] text-white space-y-3.5 animate-in fade-in slide-in-from-bottom-4 duration-200 font-sans select-none">
      {/* Top Header: Badge, Bus Number, Status Pill & Close */}
      <div className="flex items-start justify-between gap-3 border-b border-[#222222] pb-3">
        <div className="flex items-center gap-3">
          {/* Operator colored icon box */}
          <div className="w-11 h-11 bg-[#CCFF00] text-black font-black text-base flex items-center justify-center uppercase">
            {bus.routeShortName}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-white">
                {bus.vehicleId}
              </span>
              <span className="text-[9.5px] font-mono font-black px-2 py-0.5 uppercase bg-[#1A1A1A] text-[#CCFF00] border border-[#333333]">
                {meta.label}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#8E8E93] flex items-center gap-1.5 mt-0.5">
              <span>ROUTE {bus.routeShortName}</span>
              <span>•</span>
              <span className="text-[#CCFF00] font-bold">AVLS GPS ACTIVE</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 bg-[#141414] hover:bg-[#CCFF00] hover:text-black border border-[#262626] text-[#8E8E93] flex items-center justify-center transition-all cursor-pointer"
          title="Exit live tracking"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* On-Time / Delay Banner (Punctuality Status — NO RED!) */}
      <div
        className={`px-3 py-2 border flex items-center justify-between text-xs font-mono font-bold uppercase ${
          isOnTime
            ? 'bg-[#141414] border-[#CCFF00] text-[#CCFF00]'
            : isDelayed
              ? 'bg-[#141414] border-[#FFB800] text-[#FFB800]'
              : 'bg-[#141414] border-white text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnTime ? (
            <CheckCircle2 className="w-4 h-4 text-[#CCFF00] stroke-[2.5]" />
          ) : isDelayed ? (
            <AlertTriangle className="w-4 h-4 text-[#FFB800] stroke-[2.5]" />
          ) : (
            <Clock className="w-4 h-4 text-white stroke-[2.5]" />
          )}
          <span>
            {isOnTime
              ? 'ON TIME (+0 MIN DELAY)'
              : isDelayed
                ? `DELAYED BY ${delayMin} MIN`
                : `RUNNING ${delayMin} MIN EARLY`}
          </span>
        </div>
        <span className="text-[9.5px] opacity-75">
          GPS VERIFIED
        </span>
      </div>

      {/* 3 Telemetry Cards Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Speed */}
        <div className="bg-[#141414] border border-[#222222] p-2 text-center font-mono">
          <div className="text-[9.5px] font-bold text-[#666666] uppercase flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-[#CCFF00]" /> SPEED
          </div>
          <div className="text-base font-black text-white mt-0.5">
            {bus.isDwelling ? (
              <span className="text-[#FFB800] text-xs">BOARDING</span>
            ) : (
              <>
                {segSpeed} <span className="text-[9.5px] text-[#666666]">KM/H</span>
              </>
            )}
          </div>
        </div>

        {/* Crowdedness */}
        <div className="bg-[#141414] border border-[#222222] p-2 text-center font-mono">
          <div className="text-[9.5px] font-bold text-[#666666] uppercase flex items-center justify-center gap-1">
            <Users className="w-3 h-3 text-[#CCFF00]" /> CROWD
          </div>
          <div className="text-base font-black mt-0.5" style={{ color: crowdColor }}>
            {occ}%
          </div>
          <div className="text-[8.5px] text-[#8E8E93] truncate uppercase">
            {crowdLabel}
          </div>
        </div>

        {/* Seat Probability */}
        <div className="bg-[#141414] border border-[#222222] p-2 text-center font-mono">
          <div className="text-[9.5px] font-bold text-[#666666] uppercase flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-[#CCFF00]" /> SEATS
          </div>
          <div className="text-base font-black text-[#CCFF00] mt-0.5">
            {seatChance}%
          </div>
          <div className="text-[8.5px] text-[#8E8E93] truncate uppercase">
            PROBABILITY
          </div>
        </div>
      </div>

      {/* Next Stop Arrival Countdown */}
      <div className="bg-[#141414] border border-[#222222] p-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className="w-4 h-4 text-[#CCFF00] shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] font-mono text-[#666666] uppercase">
              APPROACHING STOP
            </div>
            <div className="text-xs font-bold text-white truncate uppercase">
              {bus.nextStopName}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-mono font-black text-[#CCFF00]">
            {Math.max(1, Math.round(bus.etaNextStopSec / 60))} MIN
          </div>
          <div className="text-[9px] font-mono text-[#666666]">ESTIMATED</div>
        </div>
      </div>

      {/* Upcoming Stops Timeline */}
      {remainingStops.length > 0 && (
        <div className="space-y-1 font-mono">
          <div className="text-[9.5px] uppercase font-bold text-[#666666] flex items-center justify-between">
            <span>UPCOMING STOPS</span>
            <span>SNAPPED</span>
          </div>

          <div className="bg-[#141414] p-2 border border-[#222222] space-y-1.5 text-xs">
            {remainingStops.map((stopId, idx) => {
              const stop = STOP_BY_ID[stopId];
              if (!stop) return null;
              const estMins = Math.max(1, Math.round((bus.etaNextStopSec + (idx + 1) * 190) / 60));
              return (
                <div key={stopId} className="flex items-center justify-between text-[10.5px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1 h-1 bg-[#CCFF00] shrink-0" />
                    <span className="text-[#8E8E93] truncate uppercase">{stop.name}</span>
                  </div>
                  <span className="text-white shrink-0 font-bold">
                    +{estMins}M
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
          className="flex-1 py-2 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#CCFF00] text-white text-xs font-mono font-bold uppercase inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-[#CCFF00]" />
          <span>Center ↗</span>
        </button>

        <button
          type="button"
          onClick={onSelectAnotherBus}
          className="flex-1 py-2 bg-[#CCFF00] hover:bg-[#B8E600] text-black text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Search Buses</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
