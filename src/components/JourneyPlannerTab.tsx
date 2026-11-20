import {
  AlertCircle,
  ArrowUpDown,
  Bus,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Footprints,
  Shield,
  Snowflake,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { DELHI_STOPS } from '../data/delhiNetwork';
import type { JourneyPreference, PlannedJourney, SimulatedBus } from '../types/transit';
import {
  formatDistanceKm,
  formatDurationMin,
  formatEtaTime,
  formatMinutesOnly,
} from '../utils/format';
import { RouteBadge } from './RouteBadge';

interface JourneyPlannerTabProps {
  originStopId: string;
  destinationStopId: string;
  preference: JourneyPreference;
  journeys: PlannedJourney[];
  selectedJourneyId: string | null;
  simTimeMs: number;
  activeJamCount: number;
  buses: SimulatedBus[];
  onChangeOrigin: (id: string) => void;
  onChangeDestination: (id: string) => void;
  onSwapEndpoints: () => void;
  onChangePreference: (pref: JourneyPreference) => void;
  onSelectJourney: (id: string) => void;
  onOpenTrafficMode: () => void;
  onLiveTrackBus?: (vehicleId: string) => void;
}

const SORTED_STOPS = [...DELHI_STOPS].sort((a, b) => a.name.localeCompare(b.name));

const POPULAR_DELHI_TRIPS = [
  { label: 'Okhla Ph-III ↔ AIIMS', from: 'iiit_delhi', to: 'aiims' },
  { label: 'Nehru Place ↔ Anand Vihar', from: 'nehru_place', to: 'anand_vihar_isbt' },
  { label: 'Hauz Khas ↔ Connaught Place', from: 'iit_main_gate', to: 'connaught_place' },
  { label: 'Kashmere Gate ↔ Saket', from: 'kashmere_gate_isbt', to: 'saket_metro' },
];

export function JourneyPlannerTab({
  originStopId,
  destinationStopId,
  preference,
  journeys,
  selectedJourneyId,
  simTimeMs,
  activeJamCount,
  buses,
  onChangeOrigin,
  onChangeDestination,
  onSwapEndpoints,
  onChangePreference,
  onSelectJourney,
  onOpenTrafficMode,
  onLiveTrackBus,
}: JourneyPlannerTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topPick = journeys.find((j) => j.isAiTopPick) ?? journeys[0];

  // Active buses on the selected journey route
  const activeRouteIds = new Set(
    (topPick ?? journeys[0])?.legs
      .filter((l) => l.type === 'BUS' && l.routeId)
      .map((l) => l.routeId) ?? []
  );
  const routeBuses = buses.filter((b) => activeRouteIds.has(b.routeId));

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white font-sans select-none">
      {/* 1. Sleek Search Header (Streetwear / Editorial Brutalist) */}
      <div className="p-4 sm:p-5 bg-[#0A0A0A] border-b border-[#222222] space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#CCFF00] uppercase">
                THE TRANSIT RADAR / 002
              </span>
              <span className="text-[9.5px] px-1.5 py-0.2 bg-[#1C1C1C] text-[#CCFF00] font-mono font-bold border border-[#333333] uppercase">
                CROWD + ETA FUSION
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mt-0.5">
              PLAN COMMUTE.
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#8E8E93]">
            DELHI AVLS GPS
          </span>
        </div>

        {/* Input Pair */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 shrink-0 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00]" />
            <span className="w-0.5 h-6 bg-[#333333]" />
            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]" />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <select
              aria-label="Starting stop"
              value={originStopId}
              onChange={(e) => onChangeOrigin(e.target.value)}
              className="w-full h-9.5 px-3 text-xs font-semibold bg-[#111111] hover:bg-[#161616] border border-[#262626] focus:border-[#CCFF00] text-white focus:outline-none transition-colors truncate cursor-pointer uppercase tracking-wide"
            >
              {SORTED_STOPS.map((stop) => (
                <option key={stop.id} value={stop.id} className="bg-[#111111] text-white">
                  FROM: {stop.name.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              aria-label="Destination stop"
              value={destinationStopId}
              onChange={(e) => onChangeDestination(e.target.value)}
              className="w-full h-9.5 px-3 text-xs font-semibold bg-[#111111] hover:bg-[#161616] border border-[#262626] focus:border-[#CCFF00] text-white focus:outline-none transition-colors truncate cursor-pointer uppercase tracking-wide"
            >
              {SORTED_STOPS.map((stop) => (
                <option key={stop.id} value={stop.id} className="bg-[#111111] text-white">
                  TO: {stop.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onSwapEndpoints}
            title="Swap Origin and Destination"
            className="h-10 w-10 shrink-0 border border-[#262626] bg-[#111111] hover:border-[#CCFF00] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Route Presets (SNKS pill style) */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_DELHI_TRIPS.map((preset) => {
            const isActive = originStopId === preset.from && destinationStopId === preset.to;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChangeOrigin(preset.from);
                  onChangeDestination(preset.to);
                }}
                className={`text-[10.5px] px-2.5 py-1 uppercase font-bold tracking-wider border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#CCFF00] border-[#CCFF00] text-black font-black'
                    : 'bg-[#111111] border-[#262626] text-[#8E8E93] hover:text-white hover:border-[#444444]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Filter Modes (Category Toggles) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#111111] border border-[#262626] text-[11px]">
          {(
            [
              { id: 'FASTEST', label: '⚡ FASTEST' },
              { id: 'COMFORT', label: '💺 COMFORT' },
              { id: 'AC_ONLY', label: '❄️ AC ONLY' },
              { id: 'DIRECT', label: '🚌 DIRECT' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangePreference(item.id)}
              className={`py-1.5 transition-all text-center font-black uppercase tracking-wider cursor-pointer ${
                preference === item.id
                  ? 'bg-[#CCFF00] text-black shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Traffic Alert Bar (NO RED — Warm Amber) */}
      {activeJamCount > 0 && (
        <div className="mx-4 mt-3 px-3.5 py-2.5 bg-[#141414] border border-[#FFB800] flex items-center justify-between gap-2 text-xs text-white">
          <span className="inline-flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-[#FFB800] shrink-0" />
            <span className="text-[#FFB800]">{activeJamCount} active Delhi bottleneck{activeJamCount > 1 ? 's' : ''}</span> auto-rerouted
          </span>
          <button
            type="button"
            onClick={onOpenTrafficMode}
            className="text-[11px] font-black uppercase text-[#CCFF00] hover:underline shrink-0 cursor-pointer"
          >
            Radar Map ↗
          </button>
        </div>
      )}

      {/* Results Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {journeys.length === 0 ? (
          <div className="bg-[#0E0E0E] border border-[#222222] p-8 text-center text-xs text-[#8E8E93] uppercase font-bold tracking-wider">
            Select two distinct Delhi stops to see AI-optimized routes.
          </div>
        ) : (
          <>
            {/* FEATURED: AI SMART RECOMMENDATION HERO BILLBOARD */}
            {topPick && (
              <div
                onClick={() => onSelectJourney(topPick.id)}
                className="relative overflow-hidden bg-[#0E0E0E] border-2 border-[#CCFF00] p-4.5 cursor-pointer transition-all hover:bg-[#141414] shadow-[0_0_25px_rgba(204,255,0,0.18)]"
              >
                <div className="space-y-3">
                  {/* Top Match Tag */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#CCFF00] text-black text-[10.5px] font-black tracking-wider uppercase">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      TOP PICK · {topPick.matchScorePercent}% MATCH
                    </div>

                    <div className="text-[11.5px] font-mono font-bold text-[#CCFF00] flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      {topPick.seatProbabilityPercent}% SEAT CHANCE
                    </div>
                  </div>

                  {/* Big Route Headline */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {topPick.routeBadges.map((rb, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1">
                            {idx > 0 && <span className="text-[#666666] text-sm">→</span>}
                            <RouteBadge shortName={rb.shortName} operator={rb.operator} size="md" />
                          </span>
                        ))}
                        {topPick.hasAc && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-[#CCFF00] bg-[#1A1A1A] px-2 py-0.5 border border-[#333333] font-mono font-bold uppercase">
                            <Snowflake className="w-3 h-3" /> AC ELECTRIC
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black uppercase tracking-tight text-white mt-1.5">
                        {topPick.summaryTitle}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-3xl font-black leading-none text-white tracking-tighter">
                        {formatMinutesOnly(topPick.predictedTotalSec)}
                        <span className="text-xs font-bold text-[#8E8E93] ml-0.5">MIN</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8E8E93] mt-0.5 uppercase">
                        ARRIVES {formatEtaTime(simTimeMs, topPick.predictedTotalSec)}
                      </div>
                    </div>
                  </div>

                  {/* AI Decision Reasoning Card */}
                  {topPick.aiRecommendationReason && (
                    <div className="p-3 bg-[#141414] border border-[#222222] text-xs leading-relaxed text-[#D1D1D6]">
                      <span className="text-[#CCFF00] font-black mr-1 inline-flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" /> REASON:
                      </span>
                      {topPick.aiRecommendationReason}
                    </div>
                  )}

                  {/* Metrics Bar: Crowd Meter + Fare */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="bg-[#141414] p-2 border border-[#222222]">
                      <div className="text-[9px] uppercase font-mono font-bold text-[#666666]">CROWD LOAD</div>
                      <div className="font-bold mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            topPick.crowdLevel === 'LOW'
                              ? 'bg-[#CCFF00]'
                              : topPick.crowdLevel === 'MEDIUM'
                                ? 'bg-[#FFB800]'
                                : 'bg-white'
                          }`}
                        />
                        <span className="text-white uppercase font-bold text-[10.5px]">
                          {topPick.crowdLevel === 'LOW'
                            ? 'Seats Free'
                            : topPick.crowdLevel === 'MEDIUM'
                              ? 'Moderate'
                              : 'High Load'}
                        </span>
                        <span className="text-[#666666] font-mono">({topPick.occupancyPercent}%)</span>
                      </div>
                    </div>

                    <div className="bg-[#141414] p-2 border border-[#222222]">
                      <div className="text-[9px] uppercase font-mono font-bold text-[#666666]">NEXT BUS</div>
                      <div className="font-bold mt-0.5 text-[#CCFF00] font-mono uppercase text-[10.5px]">
                        IN {formatDurationMin(topPick.nextBusWaitSec)}
                      </div>
                    </div>

                    <div className="bg-[#141414] p-2 border border-[#222222] text-right">
                      <div className="text-[9px] uppercase font-mono font-bold text-[#666666]">FARE · DIST</div>
                      <div className="font-bold mt-0.5 text-white font-mono uppercase text-[10.5px]">
                        ₹{topPick.totalFareInr} · {formatDistanceKm(topPick.totalDistanceMeters)}
                      </div>
                    </div>
                  </div>

                  {/* PROMINENT ACTION: LIVE TRACK RECOMMENDED BUS */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const bestBus = routeBuses[0] ?? buses[0];
                      if (bestBus && onLiveTrackBus) {
                        onLiveTrackBus(bestBus.vehicleId);
                      }
                    }}
                    className="w-full mt-2.5 py-2.5 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black uppercase tracking-wider text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Compass className="w-4 h-4 stroke-[2.5]" />
                    <span>Live Track Bus on Delhi Map ↗</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE SECTION: BUSES RUNNING RIGHT NOW ON THIS ROUTE */}
            {routeBuses.length > 0 && (
              <div className="bg-[#0E0E0E] border border-[#222222] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      CORRIDOR BUSES ACTIVE NOW
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#CCFF00]">
                    {routeBuses.length} LIVE SENSORS
                  </span>
                </div>

                <div className="space-y-2">
                  {routeBuses.slice(0, 3).map((bus) => {
                    const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
                    const delaySec = bus.delayVsScheduleSec;
                    const delayMin = Math.round(Math.abs(delaySec) / 60);
                    const isOnTime = Math.abs(delaySec) <= 60;
                    const isDelayed = delaySec > 60;

                    return (
                      <div
                        key={bus.vehicleId}
                        className="p-3 bg-[#141414] border border-[#222222] flex items-center justify-between gap-3 hover:border-[#CCFF00] transition-all"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs text-white">
                              BUS {bus.routeShortName} ({bus.vehicleId})
                            </span>
                            <span
                              className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 uppercase ${
                                isOnTime
                                  ? 'bg-[#CCFF00] text-black'
                                  : isDelayed
                                    ? 'bg-[#FFB800] text-black'
                                    : 'bg-white text-black'
                              }`}
                            >
                              {isOnTime ? 'ON TIME' : isDelayed ? `+${delayMin}M LATE` : `EARLY`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#8E8E93]">
                            <span>
                              NEXT: <b className="text-white uppercase">{bus.nextStopName}</b> (~{Math.max(1, Math.round(bus.etaNextStopSec / 60))}M)
                            </span>
                            <span>•</span>
                            <span className="text-[#CCFF00] font-bold">
                              {occ}% LOAD
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onLiveTrackBus && onLiveTrackBus(bus.vehicleId)}
                          className="px-3.5 py-1.5 bg-[#CCFF00] hover:bg-[#B8E600] text-black text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer shrink-0"
                        >
                          <Compass className="w-3 h-3 stroke-[2.5]" />
                          <span>Track ↗</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CATEGORY RAIL: ALL AVAILABLE OPTIONS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#8E8E93] px-1 uppercase tracking-wider font-mono">
                <span>ALTERNATIVE ITINERARIES</span>
                <span className="text-[10px] text-[#555555]">SORTED: {preference}</span>
              </div>

              {journeys.map((j) => {
                const isSelected = j.id === selectedJourneyId;
                const isExpanded = expandedId === j.id;
                const isDelay = Math.round(j.delayDeltaSec / 60) >= 3;

                return (
                  <div
                    key={j.id}
                    onClick={() => onSelectJourney(j.id)}
                    className={`transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#141414] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]'
                        : 'bg-[#0E0E0E] border-[#222222] hover:border-[#444444]'
                    }`}
                  >
                    <div className="p-3.5 space-y-3">
                      {/* Card Header: Route + Match + Time */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {j.routeBadges.map((rb, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1">
                                {idx > 0 && <span className="text-[#666666] text-xs">→</span>}
                                <RouteBadge shortName={rb.shortName} operator={rb.operator} size="sm" />
                              </span>
                            ))}

                            <span className="text-[10px] font-mono font-bold text-black bg-[#CCFF00] px-1.5 py-0.2 uppercase">
                              {j.matchScorePercent}% MATCH
                            </span>

                            {j.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9.5px] font-mono uppercase text-[#8E8E93] bg-[#161616] px-1.5 py-0.2 border border-[#262626]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-[#8E8E93] truncate uppercase">{j.summaryTitle}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black text-white leading-none tracking-tight">
                            {formatMinutesOnly(j.predictedTotalSec)}
                            <span className="text-xs font-normal text-[#8E8E93] ml-0.5">MIN</span>
                          </div>
                          <div
                            className={`text-[10px] font-mono mt-1 font-bold uppercase ${
                              isDelay ? 'text-[#FFB800]' : 'text-[#CCFF00]'
                            }`}
                          >
                            {isDelay
                              ? `+${Math.round(j.delayDeltaSec / 60)}M DELAY`
                              : 'ON SCHEDULE'}
                          </div>
                        </div>
                      </div>

                      {/* Passenger Crowdedness Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8E8E93] flex items-center gap-1.5 uppercase font-medium">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                j.crowdLevel === 'LOW'
                                  ? 'bg-[#CCFF00]'
                                  : j.crowdLevel === 'MEDIUM'
                                    ? 'bg-[#FFB800]'
                                    : 'bg-white'
                              }`}
                            />
                            <b>{j.crowdLevel === 'LOW' ? 'Low Crowd' : j.crowdLevel === 'MEDIUM' ? 'Moderate' : 'Heavy Load'}</b>
                            <span className="text-[#555555] font-mono">({j.occupancyPercent}%)</span>
                          </span>
                          <span className="text-[#CCFF00] font-mono font-bold text-[10.5px]">
                            💺 {j.seatProbabilityPercent}% SEAT CHANCE
                          </span>
                        </div>

                        <div className="h-1.5 bg-[#1C1C1C] overflow-hidden flex">
                          <div
                            style={{
                              width: `${j.occupancyPercent}%`,
                              backgroundColor:
                                j.crowdLevel === 'LOW'
                                  ? '#CCFF00'
                                  : j.crowdLevel === 'MEDIUM'
                                    ? '#FFB800'
                                    : '#FFFFFF',
                            }}
                            className="h-full transition-all duration-500"
                          />
                        </div>
                      </div>

                      {/* Bottom Quick Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1C1C1C] text-[11px] font-mono text-[#8E8E93]">
                        <span>NEXT: <b className="text-white">{formatDurationMin(j.nextBusWaitSec)}</b></span>
                        <span>FARE: <b className="text-white">₹{j.totalFareInr}</b></span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJourney(j.id);
                            setExpandedId(isExpanded ? null : j.id);
                          }}
                          className="text-[11px] font-black uppercase text-[#CCFF00] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          {isExpanded ? 'LESS' : 'STOPS'}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Step-by-Step Breakdown */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#222222] bg-[#0A0A0A] space-y-2 text-xs">
                        {j.legs.map((leg, lIdx) => (
                          <div key={lIdx}>
                            {leg.type === 'WAIT' && (
                              <div className="flex items-center justify-between text-[#8E8E93] py-1 font-mono text-[11px]">
                                <span className="inline-flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-[#CCFF00]" />
                                  BOARD AT <b className="text-white uppercase">{leg.fromStopName}</b>
                                </span>
                                <span className="text-white">{formatDurationMin(leg.durationSec)}</span>
                              </div>
                            )}

                            {leg.type === 'TRANSFER_WALK' && (
                              <div className="flex items-center justify-between px-3 py-1.5 bg-[#141414] text-[#FFB800] border border-[#333333] font-mono text-[11px]">
                                <span className="inline-flex items-center gap-1.5 font-bold uppercase">
                                  <Footprints className="w-3.5 h-3.5" />
                                  CHANGE BUS AT {leg.fromStopName}
                                </span>
                                <span>{formatDurationMin(leg.durationSec)}</span>
                              </div>
                            )}

                            {leg.type === 'BUS' && leg.segments && (
                              <div className="bg-[#111111] border border-[#262626] p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1.5 font-black uppercase text-white">
                                    <Bus className="w-3.5 h-3.5 text-[#CCFF00]" />
                                    ROUTE {leg.routeShortName} ({leg.stopCount} STOPS)
                                  </span>
                                  <span className="font-mono text-white text-[11px]">{formatDurationMin(leg.durationSec)}</span>
                                </div>

                                <div className="pl-2 space-y-1 border-l border-[#333333] ml-1.5">
                                  {leg.segments.map((seg) => (
                                    <div key={seg.segmentId} className="flex items-center justify-between text-[10.5px] pl-2 text-[#8E8E93] font-mono">
                                      <span className="truncate uppercase">{seg.toStopName}</span>
                                      <span className="text-white ml-2">
                                        {seg.speedKmh.toFixed(0)} KM/H
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
