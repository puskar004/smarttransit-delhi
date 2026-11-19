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

const POPULAR_DELHI_TRIPS = [
  { label: 'Okhla Ph-III → AIIMS', from: 'iiit_delhi', to: 'aiims' },
  { label: 'Okhla Ph-III → Connaught Pl', from: 'iiit_delhi', to: 'connaught_place' },
  { label: 'Nehru Place → Anand Vihar', from: 'nehru_place', to: 'anand_vihar' },
  { label: 'Hauz Khas → Kashmere Gate', from: 'iit_delhi', to: 'kashmere_gate' },
];

const SORTED_STOPS = [...DELHI_STOPS].sort((a, b) => a.name.localeCompare(b.name));

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
    <div className="flex flex-col h-full bg-[#0B0C10] text-[#FFFFFF]">
      {/* 1. Sleek Search Header */}
      <div className="p-4 bg-[#12141C] border-b border-[#222736] space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-[#E50914] uppercase">
                SmartTransit AI · Delhi
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] font-semibold border border-[#00E5FF]/20">
                Problem 02 Unified
              </span>
            </div>
            <h2 className="text-[18px] font-extrabold tracking-tight text-white mt-0.5">
              Plan Next Commute
            </h2>
          </div>
          <span className="text-[11.5px] font-mono-tabular text-[#94A3B8]">
            ETM &amp; GPS Fusion
          </span>
        </div>

        {/* Input Pair */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 shrink-0 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
            <span className="w-0.5 h-6 bg-[#2B3245]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] shadow-[0_0_8px_#E50914]" />
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <select
              aria-label="Starting stop"
              value={originStopId}
              onChange={(e) => onChangeOrigin(e.target.value)}
              className="w-full h-9.5 px-3 text-[13px] font-medium bg-[#1A1E29] hover:bg-[#222735] border border-[#2D3447] rounded-xl text-white focus:outline-none focus:border-[#E50914] transition-colors truncate cursor-pointer"
            >
              {SORTED_STOPS.map((stop) => (
                <option key={stop.id} value={stop.id} className="bg-[#151821] text-white">
                  From: {stop.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Destination stop"
              value={destinationStopId}
              onChange={(e) => onChangeDestination(e.target.value)}
              className="w-full h-9.5 px-3 text-[13px] font-medium bg-[#1A1E29] hover:bg-[#222735] border border-[#2D3447] rounded-xl text-white focus:outline-none focus:border-[#E50914] transition-colors truncate cursor-pointer"
            >
              {SORTED_STOPS.map((stop) => (
                <option key={stop.id} value={stop.id} className="bg-[#151821] text-white">
                  To: {stop.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onSwapEndpoints}
            title="Swap Origin and Destination"
            className="h-10 w-10 shrink-0 rounded-xl border border-[#2D3447] bg-[#1A1E29] hover:bg-[#262C3D] text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Route Presets */}
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
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold shadow-[0_0_12px_rgba(229,9,20,0.3)]'
                    : 'bg-[#181B26] border-[#2B3142] text-[#94A3B8] hover:border-[#434D68]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Filter Modes (Netflix Category Toggles) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#161922] rounded-xl border border-[#252A3A] text-[11.5px]">
          {(
            [
              { id: 'FASTEST', label: '⚡ Fastest' },
              { id: 'COMFORT', label: '💺 Comfort' },
              { id: 'AC_ONLY', label: '❄️ AC Only' },
              { id: 'DIRECT', label: '🚌 Direct' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangePreference(item.id)}
              className={`py-1.5 rounded-lg transition-all text-center font-semibold cursor-pointer ${
                preference === item.id
                  ? 'bg-[#E50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Traffic Alert Bar */}
      {activeJamCount > 0 && (
        <div className="mx-4 mt-3 px-3.5 py-2.5 rounded-xl bg-[#2A1115] border border-[#7F1D1D] flex items-center justify-between gap-2 text-[12px] text-[#FCA5A5]">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
            {activeJamCount} active Delhi traffic jam{activeJamCount > 1 ? 's' : ''} auto-avoided
          </span>
          <button
            type="button"
            onClick={onOpenTrafficMode}
            className="text-[11.5px] font-bold text-[#FF5A65] hover:underline shrink-0 cursor-pointer"
          >
            View Map
          </button>
        </div>
      )}

      {/* 2. Netflix-Style Results Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {journeys.length === 0 ? (
          <div className="bg-[#151821] rounded-2xl border border-[#272B38] p-8 text-center text-[13px] text-[#94A3B8]">
            Select two distinct Delhi stops to see AI-optimized routes.
          </div>
        ) : (
          <>
            {/* FEATURED: AI SMART RECOMMENDATION HERO BILLBOARD */}
            {topPick && (
              <div
                onClick={() => onSelectJourney(topPick.id)}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E2333] via-[#161924] to-[#12141D] border-2 border-[#E50914] shadow-[0_0_30px_rgba(229,9,20,0.22)] p-4 cursor-pointer transition-all hover:scale-[1.01]"
              >
                {/* Glowing Background Watermark */}
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-[#E50914]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-3">
                  {/* Top Match Tag */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E50914] text-white text-[11px] font-black tracking-wide uppercase">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      TOP PICK FOR YOU · {topPick.matchScorePercent}% MATCH
                    </div>

                    <div className="text-[12px] font-mono-tabular font-bold text-[#10B981] flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      {topPick.seatProbabilityPercent}% Seat Chance
                    </div>
                  </div>

                  {/* Big Route Headline */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {topPick.routeBadges.map((rb, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1">
                            {idx > 0 && <span className="text-[#64748B] text-sm">→</span>}
                            <RouteBadge shortName={rb.shortName} operator={rb.operator} size="md" />
                          </span>
                        ))}
                        {topPick.hasAc && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded-full border border-[#38BDF8]/20 font-semibold">
                            <Snowflake className="w-3 h-3" /> AC Bus
                          </span>
                        )}
                      </div>
                      <h3 className="text-[16px] font-extrabold text-white mt-1.5">
                        {topPick.summaryTitle}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[28px] font-black leading-none text-white tracking-tight">
                        {formatMinutesOnly(topPick.predictedTotalSec)}
                        <span className="text-[13px] font-semibold text-[#94A3B8] ml-0.5">m</span>
                      </div>
                      <div className="text-[11px] font-mono-tabular text-[#94A3B8] mt-0.5">
                        Arrives {formatEtaTime(simTimeMs, topPick.predictedTotalSec)}
                      </div>
                    </div>
                  </div>

                  {/* AI Decision Reasoning Card */}
                  {topPick.aiRecommendationReason && (
                    <div className="p-3 rounded-xl bg-[#0B0D14]/80 border border-[#2B3245] text-[12px] leading-relaxed text-[#CBD5E1]">
                      <span className="text-[#00E5FF] font-bold mr-1 inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" /> AI Smart Reason:
                      </span>
                      {topPick.aiRecommendationReason}
                    </div>
                  )}

                  {/* Metrics Bar: Crowd Meter + Fare */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11.5px]">
                    <div className="bg-[#12151F] rounded-lg p-2 border border-[#252B3B]">
                      <div className="text-[10px] uppercase font-bold text-[#94A3B8]">Crowd Level</div>
                      <div className="font-bold mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            topPick.crowdLevel === 'LOW'
                              ? 'bg-[#10B981]'
                              : topPick.crowdLevel === 'MEDIUM'
                                ? 'bg-[#F59E0B]'
                                : 'bg-[#E50914]'
                          }`}
                        />
                        <span className="text-white">
                          {topPick.crowdLevel === 'LOW'
                            ? 'Comfortable'
                            : topPick.crowdLevel === 'MEDIUM'
                              ? 'Moderate'
                              : 'High Crowd'}
                        </span>
                        <span className="text-[#64748B] font-mono-tabular">({topPick.occupancyPercent}%)</span>
                      </div>
                    </div>

                    <div className="bg-[#12151F] rounded-lg p-2 border border-[#252B3B]">
                      <div className="text-[10px] uppercase font-bold text-[#94A3B8]">Next Bus</div>
                      <div className="font-bold mt-0.5 text-[#38BDF8] font-mono-tabular">
                        in {formatDurationMin(topPick.nextBusWaitSec)}
                      </div>
                    </div>

                    <div className="bg-[#12151F] rounded-lg p-2 border border-[#252B3B] text-right">
                      <div className="text-[10px] uppercase font-bold text-[#94A3B8]">Fare · Dist</div>
                      <div className="font-bold mt-0.5 text-white font-mono-tabular">
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
                    className="w-full mt-2.5 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#00E5FF] hover:opacity-95 text-black font-extrabold text-[12.5px] inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-black" />
                    <span>Live Track Recommended Bus on Delhi Map</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE SECTION: BUSES RUNNING RIGHT NOW ON THIS ROUTE */}
            {routeBuses.length > 0 && (
              <div className="bg-[#131622] rounded-2xl border border-[#262D42] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[12px] font-black uppercase tracking-wider text-white">
                      Buses Running Right Now on This Corridor
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#00E5FF]">
                    {routeBuses.length} Live Buses
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
                        className="p-3 rounded-xl bg-[#1B1F2E] border border-[#273046] flex items-center justify-between gap-3 hover:border-[#00E5FF]/60 transition-all"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-tabular font-extrabold text-[13px] text-white">
                              Bus {bus.routeShortName} ({bus.vehicleId})
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isOnTime
                                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                                  : isDelayed
                                    ? 'bg-[#E50914]/20 text-[#FF5A65] border border-[#E50914]/40'
                                    : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                              }`}
                            >
                              {isOnTime ? '🟢 On Time' : isDelayed ? `🔴 Delayed ${delayMin}m` : `🟡 Early`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-[11px] text-[#94A3B8]">
                            <span>
                              Next: <b>{bus.nextStopName}</b> (~{Math.max(1, Math.round(bus.etaNextStopSec / 60))}m)
                            </span>
                            <span>·</span>
                            <span
                              className={
                                occ < 45
                                  ? 'text-[#10B981] font-bold'
                                  : occ < 75
                                    ? 'text-[#F59E0B] font-bold'
                                    : 'text-[#E50914] font-bold'
                              }
                            >
                              {occ}% Crowd {occ < 45 ? '(Seats Free)' : '(Crowded)'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onLiveTrackBus && onLiveTrackBus(bus.vehicleId)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#E50914] hover:bg-[#FF1E28] text-white text-[11.5px] font-bold inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Live Track</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CATEGORY RAIL: ALL AVAILABLE OPTIONS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-[12px] font-bold text-[#94A3B8] px-1 uppercase tracking-wider">
                <span>All Alternative Itineraries</span>
                <span className="text-[11px] text-[#64748B]">Sorted by {preference}</span>
              </div>

              {journeys.map((j) => {
                const isSelected = j.id === selectedJourneyId;
                const isExpanded = expandedId === j.id;
                const isDelay = Math.round(j.delayDeltaSec / 60) >= 3;

                return (
                  <div
                    key={j.id}
                    onClick={() => onSelectJourney(j.id)}
                    className={`rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1A1E2B] border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.18)]'
                        : 'bg-[#14161F] border-[#222736] hover:border-[#384055]'
                    }`}
                  >
                    <div className="p-3.5 space-y-3">
                      {/* Card Header: Route + Match + Time */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {j.routeBadges.map((rb, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1">
                                {idx > 0 && <span className="text-[#64748B] text-xs">→</span>}
                                <RouteBadge shortName={rb.shortName} operator={rb.operator} size="sm" />
                              </span>
                            ))}

                            <span className="text-[11px] font-bold text-[#46D369] bg-[#46D369]/10 px-2 py-0.5 rounded-full border border-[#46D369]/20">
                              {j.matchScorePercent}% Match
                            </span>

                            {j.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-semibold text-[#94A3B8] bg-[#1E2230] px-2 py-0.5 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="text-[12.5px] text-[#94A3B8] truncate">{j.summaryTitle}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[22px] font-extrabold text-white leading-none">
                            {formatMinutesOnly(j.predictedTotalSec)}
                            <span className="text-[12px] font-normal text-[#94A3B8] ml-0.5">m</span>
                          </div>
                          <div
                            className={`text-[10.5px] font-mono-tabular mt-1 font-semibold ${
                              isDelay ? 'text-[#F87171]' : 'text-[#34D399]'
                            }`}
                          >
                            {isDelay
                              ? `+${Math.round(j.delayDeltaSec / 60)}m delay`
                              : 'Smooth traffic'}
                          </div>
                        </div>
                      </div>

                      {/* Problem 02: Passenger Crowdedness Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#94A3B8] flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                j.crowdLevel === 'LOW'
                                  ? 'bg-[#10B981]'
                                  : j.crowdLevel === 'MEDIUM'
                                    ? 'bg-[#F59E0B]'
                                    : 'bg-[#E50914]'
                              }`}
                            />
                            <b>{j.crowdLevel === 'LOW' ? 'Low Crowd' : j.crowdLevel === 'MEDIUM' ? 'Moderate' : 'Heavy Rush'}</b>
                            <span className="text-[#64748B]">({j.occupancyPercent}% load)</span>
                          </span>
                          <span className="text-[#38BDF8] font-semibold">
                            💺 {j.seatProbabilityPercent}% Seat Chance
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-[#1E2333] overflow-hidden flex">
                          <div
                            style={{
                              width: `${j.occupancyPercent}%`,
                              backgroundColor:
                                j.crowdLevel === 'LOW'
                                  ? '#10B981'
                                  : j.crowdLevel === 'MEDIUM'
                                    ? '#F59E0B'
                                    : '#E50914',
                            }}
                            className="h-full rounded-full transition-all duration-500 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Bottom Quick Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1F2432] text-[11.5px] text-[#94A3B8]">
                        <span>Next bus: <b className="text-white">{formatDurationMin(j.nextBusWaitSec)}</b></span>
                        <span>Fare: <b className="text-white">₹{j.totalFareInr}</b></span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJourney(j.id);
                            setExpandedId(isExpanded ? null : j.id);
                          }}
                          className="text-[11.5px] font-bold text-[#00E5FF] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          {isExpanded ? 'Hide' : 'Stops'}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Step-by-Step Breakdown */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#222736] bg-[#0E1017] rounded-b-2xl space-y-2.5 text-[12px]">
                        {j.legs.map((leg, lIdx) => (
                          <div key={lIdx}>
                            {leg.type === 'WAIT' && (
                              <div className="flex items-center justify-between text-[#94A3B8] py-1">
                                <span className="inline-flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
                                  Board at <b className="text-white">{leg.fromStopName}</b>
                                </span>
                                <span className="font-mono-tabular text-white">{formatDurationMin(leg.durationSec)}</span>
                              </div>
                            )}

                            {leg.type === 'TRANSFER_WALK' && (
                              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#241B12] text-[#F59E0B] border border-[#503512]">
                                <span className="inline-flex items-center gap-1.5 font-bold">
                                  <Footprints className="w-3.5 h-3.5" />
                                  Change bus at {leg.fromStopName}
                                </span>
                                <span className="font-mono-tabular">{formatDurationMin(leg.durationSec)}</span>
                              </div>
                            )}

                            {leg.type === 'BUS' && leg.segments && (
                              <div className="bg-[#151822] border border-[#272B3A] rounded-xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1.5 font-bold text-white">
                                    <Bus className="w-3.5 h-3.5 text-[#00E5FF]" />
                                    Take Route {leg.routeShortName} ({leg.stopCount} stops)
                                  </span>
                                  <span className="font-bold text-white">{formatDurationMin(leg.durationSec)}</span>
                                </div>

                                <div className="pl-2 space-y-1 border-l-2 border-[#2B3145] ml-1.5">
                                  {leg.segments.map((seg) => (
                                    <div key={seg.segmentId} className="flex items-center justify-between text-[11px] pl-2 text-[#94A3B8]">
                                      <span className="truncate">{seg.toStopName}</span>
                                      <span className="font-mono-tabular text-[#CBD5E1] ml-2">
                                        {seg.speedKmh.toFixed(0)} km/h
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
