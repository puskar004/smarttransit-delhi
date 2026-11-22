import {
  AlertCircle,
  ArrowUpDown,
  Bus,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Footprints,
  Loader2,
  RotateCcw,
  Shield,
  Snowflake,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { STOP_BY_ID } from '../data/delhiNetwork';
import type { JourneyPreference, PlannedJourney, SimulatedBus } from '../types/transit';
import {
  formatDistanceKm,
  formatDurationMin,
  formatEtaTime,
  formatMinutesOnly,
} from '../utils/format';
import { RouteBadge } from './RouteBadge';
import { StationAutocomplete } from './StationAutocomplete';

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
  { label: 'Okhla Ph-III ↔ AIIMS', from: 'iiit_delhi', to: 'aiims' },
  { label: 'Nehru Place ↔ Anand Vihar', from: 'nehru_place', to: 'anand_vihar' },
  { label: 'Hauz Khas ↔ Connaught Place', from: 'hauz_khas', to: 'connaught_place' },
  { label: 'Kashmere Gate ↔ Saket', from: 'kashmere_gate', to: 'saket' },
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
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // Check for same-origin error
  const isSameEndpoint = Boolean(
    originStopId && destinationStopId && originStopId === destinationStopId
  );
  const originStop = STOP_BY_ID[originStopId];
  const destStop = STOP_BY_ID[destinationStopId];

  // Brief smooth loading indicator when inputs change
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setIsCalculating(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [originStopId, destinationStopId, preference]);

  const topPick = journeys.find((j) => j.isAiTopPick) ?? journeys[0];

  // Active buses on the selected journey route
  const activeRouteIds = useMemo(() => {
    return new Set(
      (topPick ?? journeys[0])?.legs
        .filter((l) => l.type === 'BUS' && l.routeId)
        .map((l) => l.routeId) ?? []
    );
  }, [topPick, journeys]);

  const routeBuses = useMemo(
    () => buses.filter((b) => activeRouteIds.has(b.routeId)),
    [buses, activeRouteIds]
  );

  const handleSwap = () => {
    setIsSwapping(true);
    onSwapEndpoints();
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleReset = () => {
    onChangeOrigin('iiit_delhi');
    onChangeDestination('aiims');
    onChangePreference('COMFORT');
  };

  return (
    <div className="flex flex-col h-full bg-[#07090e] text-white font-sans select-none overflow-hidden">
      {/* 1. SEARCH & ENDPOINTS PANEL */}
      <div className="p-3.5 sm:p-5 bg-[#0c0e14] border-b border-[#1c2232] space-y-3.5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#CCFF00] uppercase">
                THE TRANSIT RADAR / 002
              </span>
              <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-[#151923] text-[#CCFF00] font-mono font-bold border border-[#252c3e] uppercase">
                CROWD + DELAY FUSION
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
              PLAN COMMUTE.
            </h2>
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="Reset to default stops"
            aria-label="Reset search to defaults"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold text-slate-400 hover:text-white bg-[#121620] hover:bg-[#181d2a] border border-[#232a3d] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>

        {/* Origin / Destination Accessible Inputs + Swap Button */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 space-y-2.5">
              {/* Origin Autocomplete */}
              <StationAutocomplete
                label="FROM (ORIGIN)"
                sublabel={originStop?.zone}
                value={originStopId}
                onChange={onChangeOrigin}
                isOrigin={true}
                placeholder="Type starting stop or metro station..."
                error={
                  isSameEndpoint
                    ? 'Origin and destination cannot be the same'
                    : undefined
                }
              />

              {/* Destination Autocomplete */}
              <StationAutocomplete
                label="TO (DESTINATION)"
                sublabel={destStop?.zone}
                value={destinationStopId}
                onChange={onChangeDestination}
                isOrigin={false}
                placeholder="Type arrival stop or metro station..."
                error={
                  isSameEndpoint
                    ? 'Please choose a different arrival stop'
                    : undefined
                }
              />
            </div>

            {/* Swap Button (Min 44px for Mobile Touch Accessibility) */}
            <div className="flex sm:flex-col items-center justify-center shrink-0 pt-1 sm:pt-5">
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap starting and destination stops"
                title="Swap Origin and Destination"
                className={`w-full sm:w-11 h-11 rounded-xl border border-[#262c3e] hover:border-[#CCFF00] bg-[#121620] hover:bg-[#181e2b] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
                  isSwapping ? 'rotate-180 scale-105' : ''
                }`}
              >
                <ArrowUpDown className="w-4 h-4 text-[#CCFF00]" />
                <span className="sm:hidden ml-2 text-xs font-mono font-bold text-white uppercase">
                  Swap Stops
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Route Presets */}
        <div className="space-y-1.5 pt-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            POPULAR COMMUTE CORRIDORS
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_DELHI_TRIPS.map((preset) => {
              const isActive =
                originStopId === preset.from && destinationStopId === preset.to;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChangeOrigin(preset.from);
                    onChangeDestination(preset.to);
                  }}
                  aria-pressed={isActive}
                  className={`text-[10.5px] px-3 py-1.5 rounded-full font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer min-h-[32px] flex items-center ${
                    isActive
                      ? 'bg-[#CCFF00] border-[#CCFF00] text-black font-black shadow-sm'
                      : 'bg-[#121620] border-[#222a3d] text-slate-300 hover:text-white hover:border-[#38435d]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preference Filter Category Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span>ROUTING PREFERENCE</span>
            <span className="text-[#CCFF00]">KALMAN OPTIMIZED</span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#121620] border border-[#222838] text-[11px]">
            {(
              [
                { id: 'FASTEST', label: '⚡ FASTEST' },
                { id: 'COMFORT', label: '💺 COMFORT' },
                { id: 'AC_ONLY', label: '❄️ AC EV' },
                { id: 'DIRECT', label: '🚌 DIRECT' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangePreference(item.id)}
                aria-pressed={preference === item.id}
                className={`py-2 rounded-lg transition-all text-center font-mono font-bold uppercase tracking-wider cursor-pointer text-xs ${
                  preference === item.id
                    ? 'bg-[#CCFF00] text-black font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. ACTIVE TRAFFIC ALERT BAR (Warm Amber — NO RED) */}
      {activeJamCount > 0 && (
        <div className="mx-3.5 sm:mx-4 mt-3 px-3.5 py-2.5 rounded-xl bg-[#18150d] border border-[#f59e0b]/50 flex items-center justify-between gap-2 text-xs text-white shrink-0">
          <span className="inline-flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#f59e0b] shrink-0" />
            <span>
              <strong className="text-[#f59e0b]">{activeJamCount} active Delhi bottleneck{activeJamCount > 1 ? 's' : ''}</strong> auto-rerouted
            </span>
          </span>
          <button
            type="button"
            onClick={onOpenTrafficMode}
            className="text-[11px] font-mono font-black uppercase text-[#CCFF00] hover:underline shrink-0 cursor-pointer"
          >
            Radar Map ↗
          </button>
        </div>
      )}

      {/* 3. RESULTS STREAM WITH ERROR & LOADING STATES */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 no-scrollbar">
        {/* Loading State */}
        {isCalculating ? (
          <div className="py-14 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#CCFF00] animate-spin mx-auto" />
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Finding Optimal Transit Routes...
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Analyzing DTC bus live loads &amp; road speeds
            </p>
          </div>
        ) : isSameEndpoint ? (
          /* Error State: Same Origin & Destination */
          <div className="p-6 rounded-2xl bg-[#18150d] border border-[#f59e0b]/60 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                Identical Starting &amp; Arrival Stop
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Origin and destination are both set to <strong className="text-white">{originStop?.name || 'the same stop'}</strong>.
                Please select a different arrival station or choose a recommended trip below.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => onChangeDestination('aiims')}
                className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-mono font-bold text-xs uppercase cursor-pointer hover:bg-[#d8ff33]"
              >
                Go to AIIMS Ring Road ↗
              </button>
              <button
                type="button"
                onClick={() => onChangeDestination('nehru_place')}
                className="px-4 py-2 rounded-xl bg-[#181d2a] border border-[#2b3348] text-white font-mono font-bold text-xs uppercase cursor-pointer hover:border-[#CCFF00]"
              >
                Go to Nehru Place ↗
              </button>
            </div>
          </div>
        ) : journeys.length === 0 ? (
          /* Empty / No Route Found State */
          <div className="p-6 sm:p-8 rounded-2xl bg-[#10141e] border border-[#222a3d] text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#181e2c] text-slate-400 flex items-center justify-center mx-auto">
              <Compass className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                No Direct or 1-Transfer Route Found
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                No modeled DTC bus route connects <strong className="text-white">{originStop?.name}</strong> to <strong className="text-white">{destStop?.name}</strong> directly.
              </p>
              <p className="text-[11px] font-mono text-slate-400 pt-1">
                Tip: Try routing through major multi-modal transit hubs like <strong className="text-[#CCFF00]">Nehru Place</strong>, <strong className="text-[#CCFF00]">Ashram Chowk</strong>, or <strong className="text-[#CCFF00]">Kashmere Gate</strong>.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-[#CCFF00] text-black font-mono font-black text-xs uppercase cursor-pointer hover:bg-[#d8ff33]"
              >
                Load Recommended Route (Okhla ↔ AIIMS)
              </button>
            </div>
          </div>
        ) : (
          /* Route Results Cards */
          <>
            {/* FEATURED: AI SMART RECOMMENDATION HERO BILLBOARD */}
            {topPick && (
              <div
                onClick={() => onSelectJourney(topPick.id)}
                className="relative overflow-hidden rounded-2xl bg-[#10141e] hover:bg-[#131824] border-2 border-[#CCFF00] p-4 sm:p-5 cursor-pointer transition-all shadow-[0_0_25px_rgba(204,255,0,0.18)]"
              >
                <div className="space-y-3">
                  {/* Top Match Tag & Live Status Indicator */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CCFF00] text-black text-[10.5px] font-black tracking-wider uppercase">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      TOP PICK · {topPick.matchScorePercent}% MATCH
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1b2b1e] text-[#4ade80] border border-[#2a4d31]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                        LIVE GPS CALIBRATED
                      </span>
                      <div className="text-[11.5px] font-mono font-bold text-[#CCFF00] flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {topPick.seatProbabilityPercent}% SEAT CHANCE
                      </div>
                    </div>
                  </div>

                  {/* Big Route Headline */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {topPick.routeBadges.map((rb, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1">
                            {idx > 0 && <span className="text-slate-500 text-sm">→</span>}
                            <RouteBadge shortName={rb.shortName} operator={rb.operator} size="md" />
                          </span>
                        ))}
                        {topPick.hasAc && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-[#CCFF00] bg-[#1a2130] px-2 py-0.5 rounded-full border border-[#2d3852] font-mono font-bold uppercase">
                            <Snowflake className="w-3 h-3" /> AC ELECTRIC
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {topPick.transfers === 0 ? 'DIRECT (0 TRANSFERS)' : '1 TRANSFER'}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                        {topPick.summaryTitle}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-3xl font-black leading-none text-white tracking-tighter">
                        {formatMinutesOnly(topPick.predictedTotalSec)}
                        <span className="text-xs font-bold text-slate-400 ml-0.5">MIN</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase">
                        ARRIVES {formatEtaTime(simTimeMs, topPick.predictedTotalSec)}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation Reasoning Card */}
                  {topPick.aiRecommendationReason && (
                    <div className="p-3 rounded-xl bg-[#141824] border border-[#232b3d] text-xs leading-relaxed text-slate-200">
                      <span className="text-[#CCFF00] font-black mr-1 inline-flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" /> REASON:
                      </span>
                      {topPick.aiRecommendationReason}
                    </div>
                  )}

                  {/* Metrics Bar: Crowd Meter + Fare + Distance */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="bg-[#141824] p-2.5 rounded-xl border border-[#222a3d]">
                      <div className="text-[9px] uppercase font-mono font-bold text-slate-400">CROWD LOAD</div>
                      <div className="font-bold mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            topPick.crowdLevel === 'LOW'
                              ? 'bg-[#CCFF00]'
                              : topPick.crowdLevel === 'MEDIUM'
                                ? 'bg-[#f59e0b]'
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
                        <span className="text-slate-400 font-mono">({topPick.occupancyPercent}%)</span>
                      </div>
                    </div>

                    <div className="bg-[#141824] p-2.5 rounded-xl border border-[#222a3d]">
                      <div className="text-[9px] uppercase font-mono font-bold text-slate-400">NEXT BUS WAIT</div>
                      <div className="font-bold mt-0.5 text-[#CCFF00] font-mono uppercase text-[10.5px]">
                        IN {formatDurationMin(topPick.nextBusWaitSec)}
                      </div>
                    </div>

                    <div className="bg-[#141824] p-2.5 rounded-xl border border-[#222a3d] text-right">
                      <div className="text-[9px] uppercase font-mono font-bold text-slate-400">DTC FARE · DIST</div>
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
                    className="w-full mt-2.5 py-3 rounded-xl bg-[#CCFF00] hover:bg-[#d8ff33] text-black font-sans font-black uppercase tracking-wider text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <Compass className="w-4 h-4 stroke-[2.5]" />
                    <span>Live Track Bus on Delhi Map ↗</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE SENSORS: BUSES ACTIVE ON THIS ROUTE */}
            {routeBuses.length > 0 && (
              <div className="bg-[#0e1118] border border-[#222a3d] rounded-2xl p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
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
                        className="p-3 rounded-xl bg-[#121620] border border-[#222838] flex items-center justify-between gap-3 hover:border-[#CCFF00] transition-all"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white">
                              BUS {bus.routeShortName} ({bus.vehicleId})
                            </span>
                            <span
                              className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                                isOnTime
                                  ? 'bg-[#1b2b1e] text-[#4ade80] border border-[#2a4d31]'
                                  : isDelayed
                                    ? 'bg-[#2b2413] text-[#f59e0b] border border-[#4d3d19]'
                                    : 'bg-[#151923] text-white border border-[#283248]'
                              }`}
                            >
                              {isOnTime ? 'ON TIME' : isDelayed ? `+${delayMin}M LATE` : `EARLY`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
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
                          className="px-3.5 py-1.5 rounded-lg bg-[#CCFF00] hover:bg-[#d8ff33] text-black text-[11px] font-sans font-black uppercase tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer shrink-0"
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

            {/* ALTERNATIVE ITINERARIES */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 uppercase tracking-wider font-mono">
                <span>ALTERNATIVE ITINERARIES ({journeys.length})</span>
                <span className="text-[10px] text-slate-500">SORTED: {preference}</span>
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
                        ? 'bg-[#121622] border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]'
                        : 'bg-[#0e1118] border-[#222a3d] hover:border-[#38435d]'
                    }`}
                  >
                    <div className="p-3.5 sm:p-4 space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {j.routeBadges.map((rb, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1">
                                {idx > 0 && <span className="text-slate-500 text-xs">→</span>}
                                <RouteBadge shortName={rb.shortName} operator={rb.operator} size="sm" />
                              </span>
                            ))}

                            <span className="text-[10px] font-mono font-bold text-black bg-[#CCFF00] px-2 py-0.5 rounded-full uppercase">
                              {j.matchScorePercent}% MATCH
                            </span>

                            {j.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9.5px] font-mono uppercase text-slate-300 bg-[#151923] px-2 py-0.5 rounded-full border border-[#273045]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-slate-400 truncate uppercase">{j.summaryTitle}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black text-white leading-none tracking-tight">
                            {formatMinutesOnly(j.predictedTotalSec)}
                            <span className="text-xs font-normal text-slate-400 ml-0.5">MIN</span>
                          </div>
                          <div
                            className={`text-[10px] font-mono mt-1 font-bold uppercase ${
                              isDelay ? 'text-[#f59e0b]' : 'text-[#4ade80]'
                            }`}
                          >
                            {isDelay
                              ? `+${Math.round(j.delayDeltaSec / 60)}M DELAY`
                              : 'ON SCHEDULE'}
                          </div>
                        </div>
                      </div>

                      {/* Crowdedness Meter Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 flex items-center gap-1.5 uppercase font-medium">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                j.crowdLevel === 'LOW'
                                  ? 'bg-[#CCFF00]'
                                  : j.crowdLevel === 'MEDIUM'
                                    ? 'bg-[#f59e0b]'
                                    : 'bg-white'
                              }`}
                            />
                            <b>{j.crowdLevel === 'LOW' ? 'Low Crowd' : j.crowdLevel === 'MEDIUM' ? 'Moderate' : 'Heavy Load'}</b>
                            <span className="text-slate-500 font-mono">({j.occupancyPercent}%)</span>
                          </span>

                          <span className="text-[#CCFF00] font-mono font-bold text-[10.5px]">
                            💺 {j.seatProbabilityPercent}% SEAT CHANCE
                          </span>
                        </div>

                        <div className="h-1.5 bg-[#181d2a] rounded-full overflow-hidden flex">
                          <div
                            style={{
                              width: `${j.occupancyPercent}%`,
                              backgroundColor:
                                j.crowdLevel === 'LOW'
                                  ? '#CCFF00'
                                  : j.crowdLevel === 'MEDIUM'
                                    ? '#f59e0b'
                                    : '#FFFFFF',
                            }}
                            className="h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>

                      {/* Bottom Quick Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1c2232] text-[11px] font-mono text-slate-400">
                        <span>NEXT: <b className="text-white">{formatDurationMin(j.nextBusWaitSec)}</b></span>
                        <span>FARE: <b className="text-white">₹{j.totalFareInr}</b></span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJourney(j.id);
                            setExpandedId(isExpanded ? null : j.id);
                          }}
                          className="text-[11px] font-mono font-bold uppercase text-[#CCFF00] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          {isExpanded ? 'HIDE STOPS' : 'SHOW STOPS'}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Step-by-Step Breakdown */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-[#1c2232] bg-[#0b0e14] rounded-b-2xl space-y-2 text-xs">
                        {j.legs.map((leg, lIdx) => (
                          <div key={lIdx}>
                            {leg.type === 'WAIT' && (
                              <div className="flex items-center justify-between text-slate-300 py-1 font-mono text-[11px]">
                                <span className="inline-flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-[#CCFF00]" />
                                  BOARD AT <b className="text-white uppercase">{leg.fromStopName}</b>
                                </span>
                                <span className="text-white">{formatDurationMin(leg.durationSec)}</span>
                              </div>
                            )}

                            {leg.type === 'TRANSFER_WALK' && (
                              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#18150d] text-[#f59e0b] border border-[#f59e0b]/40 font-mono text-[11px]">
                                <span className="inline-flex items-center gap-1.5 font-bold uppercase">
                                  <Footprints className="w-3.5 h-3.5" />
                                  CHANGE BUS AT {leg.fromStopName}
                                </span>
                                <span>{formatDurationMin(leg.durationSec)}</span>
                              </div>
                            )}

                            {leg.type === 'BUS' && leg.segments && (
                              <div className="bg-[#111520] border border-[#222a3d] rounded-xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1.5 font-bold uppercase text-white">
                                    <Bus className="w-3.5 h-3.5 text-[#CCFF00]" />
                                    ROUTE {leg.routeShortName} ({leg.stopCount} STOPS)
                                  </span>
                                  <span className="font-mono text-white text-[11px]">{formatDurationMin(leg.durationSec)}</span>
                                </div>

                                <div className="pl-2 space-y-1 border-l-2 border-[#2b3348] ml-1.5">
                                  {leg.segments.map((seg) => (
                                    <div key={seg.segmentId} className="flex items-center justify-between text-[10.5px] pl-2 text-slate-400 font-mono">
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
