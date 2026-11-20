import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  Clock,
  Compass,
  Navigation,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DELHI_ROUTES, STOP_BY_ID } from '../data/delhiNetwork';
import type { SimulatedBus } from '../types/transit';

interface AllBusesViewProps {
  buses: SimulatedBus[];
  onLiveTrackBus: (vehicleId: string) => void;
  onGoToPlanner: () => void;
}

type FilterOption = 'ALL' | 'ON_TIME' | 'DELAYED' | 'SEATS_FREE' | 'ELECTRIC';

export function AllBusesView({
  buses,
  onLiveTrackBus,
  onGoToPlanner,
}: AllBusesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');

  const filteredBuses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return buses.filter((bus) => {
      // Search matching
      if (q) {
        const routeMatch = bus.routeShortName.toLowerCase().includes(q);
        const plateMatch = bus.vehicleId.toLowerCase().includes(q);
        const stopMatch =
          bus.nextStopName.toLowerCase().includes(q) ||
          bus.stopSequence.some((sId) =>
            (STOP_BY_ID[sId]?.name ?? '').toLowerCase().includes(q)
          );
        if (!routeMatch && !plateMatch && !stopMatch) return false;
      }

      // Filter matching
      const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
      const isOnTime = Math.abs(bus.delayVsScheduleSec) <= 60;
      const isDelayed = bus.delayVsScheduleSec > 60;

      if (activeFilter === 'ON_TIME' && !isOnTime) return false;
      if (activeFilter === 'DELAYED' && !isDelayed) return false;
      if (activeFilter === 'SEATS_FREE' && occ >= 45) return false;
      if (activeFilter === 'ELECTRIC' && bus.operator !== 'DTC_ELECTRIC') return false;

      return true;
    });
  }, [buses, searchQuery, activeFilter]);

  // Summary counts
  const onTimeCount = useMemo(
    () => buses.filter((b) => Math.abs(b.delayVsScheduleSec) <= 60).length,
    [buses]
  );
  const delayedCount = useMemo(
    () => buses.filter((b) => b.delayVsScheduleSec > 60).length,
    [buses]
  );
  const seatsFreeCount = useMemo(
    () => buses.filter((b) => Math.round(((b.passengersEst ?? 30) / 60) * 100) < 45).length,
    [buses]
  );

  return (
    <div className="h-full flex flex-col bg-[#000000] text-white overflow-hidden font-sans select-none">
      {/* Editorial Streetwear Style Header */}
      <div className="p-4 sm:p-6 border-b border-[#222222] bg-[#0A0A0A] space-y-4 shrink-0">
        <div>
          <div className="text-[11px] font-mono font-bold tracking-widest text-[#CCFF00] uppercase mb-1 flex items-center gap-2">
            <span>THE FULL FLEET ROTATION / 072</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
          </div>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white">
              ALL THE BUSES.
            </h1>
            <button
              type="button"
              onClick={onGoToPlanner}
              className="px-3.5 py-1.5 border border-[#333333] hover:border-[#CCFF00] bg-[#111111] hover:text-[#CCFF00] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Plan Journey ↗</span>
            </button>
          </div>
          <p className="text-xs text-[#8E8E93] mt-1 max-w-xl">
            Delhi live AVLS GPS tracking. Real-time delay model and crowd telemetry for every active corridor.
          </p>
        </div>

        {/* Filter Pills — Exact SNKS "ALL BRANDS" Style */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: `ALL BUSES (${buses.length})` },
            { id: 'ON_TIME', label: `ON TIME (${onTimeCount})` },
            { id: 'DELAYED', label: `DELAYED (${delayedCount})` },
            { id: 'SEATS_FREE', label: `SEATS FREE (${seatsFreeCount})` },
            { id: 'ELECTRIC', label: 'AC ELECTRIC' },
          ].map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as FilterOption)}
                className={`px-3.5 py-1.5 uppercase font-black tracking-wider text-[11px] transition-all cursor-pointer whitespace-nowrap border ${
                  active
                    ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                    : 'bg-[#111111] text-[#8E8E93] hover:text-white border-[#262626] hover:border-[#444444]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Secondary Controls (Find your pair aesthetic) */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#1C1C1C]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find your route or stop (e.g. 534, 429, Okhla)..."
              className="w-full pl-9 pr-9 py-2 bg-[#111111] border border-[#262626] focus:border-[#CCFF00] text-xs text-white placeholder:text-[#555555] transition-all outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#111111] border border-[#262626] text-[11px] font-mono text-[#8E8E93] whitespace-nowrap">
            <span className="text-[#CCFF00] font-bold">{filteredBuses.length}</span> BUSES SHOWN
          </div>
        </div>
      </div>

      {/* Bus Cards Grid / Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {filteredBuses.length === 0 ? (
          <div className="py-16 text-center text-[#666666] space-y-2">
            <Bus className="w-10 h-10 mx-auto text-[#333333] stroke-[1.5]" />
            <p className="text-sm font-bold uppercase tracking-wider text-white">No buses found</p>
            <p className="text-xs text-[#666666]">
              Try searching for bus numbers like <b className="text-[#CCFF00]">534</b> or <b className="text-[#CCFF00]">429</b>.
            </p>
          </div>
        ) : (
          filteredBuses.map((bus, idx) => {
            const routeMeta = DELHI_ROUTES.find((r) => r.shortName === bus.routeShortName);
            const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
            const delaySec = bus.delayVsScheduleSec;
            const delayMin = Math.round(Math.abs(delaySec) / 60);
            const isOnTime = Math.abs(delaySec) <= 60;
            const isDelayed = delaySec > 60;

            const crowdLabel =
              occ < 40 ? 'LOW CROWD · SEATS FREE' : occ < 75 ? 'MODERATE LOAD' : 'HIGH LOAD · STANDING';
            const seatChance = Math.max(5, Math.min(98, 100 - Math.round(occ * 0.95)));
            const indexStr = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={bus.vehicleId}
                className="bg-[#0E0E0E] hover:bg-[#141414] border border-[#222222] hover:border-[#CCFF00] p-4 transition-all duration-150 space-y-3 group"
              >
                {/* Header Row: Route, Status Badge, Monospace Index */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {/* Route Badge */}
                    <span className="px-2.5 py-0.5 bg-[#CCFF00] text-black font-black text-xs uppercase tracking-wider border border-[#CCFF00]">
                      BUS {bus.routeShortName}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#8E8E93]">
                      {bus.vehicleId}
                    </span>
                    {bus.operator === 'DTC_ELECTRIC' && (
                      <span className="px-1.5 py-0.5 bg-[#1A1A1A] text-[#CCFF00] text-[10px] font-mono font-bold border border-[#333333] uppercase">
                        ⚡ ELECTRIC
                      </span>
                    )}
                  </div>

                  {/* Punctuality Badge (SNKS Discount Tag style: NO RED!) */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 inline-flex items-center gap-1 ${
                        isOnTime
                          ? 'bg-[#CCFF00] text-black border border-[#CCFF00]'
                          : isDelayed
                            ? 'bg-[#FFB800] text-black border border-[#FFB800]'
                            : 'bg-white text-black border border-white'
                      }`}
                    >
                      {isOnTime ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-black stroke-[3]" />
                          <span>ON TIME (+0M)</span>
                        </>
                      ) : isDelayed ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-black stroke-[3]" />
                          <span>DELAYED +{delayMin}M</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-black stroke-[3]" />
                          <span>{delayMin}M EARLY</span>
                        </>
                      )}
                    </span>

                    {/* Numerical Index (like 01, 02 in SNKS template) */}
                    <span className="font-mono text-xs text-[#555555] font-bold">
                      /{indexStr}
                    </span>
                  </div>
                </div>

                {/* Corridor Route Name */}
                <div className="text-xs text-[#E1E1E6] font-semibold truncate uppercase tracking-wide">
                  {routeMeta?.longName ?? `Delhi Corridor ${bus.routeShortName}`}
                </div>

                {/* Metrics Row: Next Stop, Speed, Crowd Meter */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="bg-[#141414] p-2.5 border border-[#222222] flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                    <div className="truncate">
                      <span className="text-[#666666] block text-[9px] font-mono uppercase tracking-wider">NEXT STOP</span>
                      <strong className="text-white truncate block text-[11px]">{bus.nextStopName}</strong>
                    </div>
                  </div>

                  <div className="bg-[#141414] p-2.5 border border-[#222222] flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                    <div className="truncate">
                      <span className="text-[#666666] block text-[9px] font-mono uppercase tracking-wider">CROWD LOAD</span>
                      <strong className="text-white truncate block text-[11px] font-bold">
                        {occ}% · {crowdLabel}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-[#141414] p-2.5 border border-[#222222] flex items-center gap-2 col-span-2 sm:col-span-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                    <div className="truncate">
                      <span className="text-[#666666] block text-[9px] font-mono uppercase tracking-wider">SEAT PROBABILITY</span>
                      <strong className="text-[#CCFF00] truncate block text-[11px] font-black">
                        {seatChance}% CHANCE
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Row: Live Track Button */}
                <div className="pt-1 flex items-center justify-between gap-3 border-t border-[#1C1C1C]">
                  <span className="text-[11px] font-mono text-[#8E8E93]">
                    SPEED: <strong className="text-white">{bus.speedKmh.toFixed(0)} KM/H</strong> •
                    ETA: ~{Math.max(1, Math.round(bus.etaNextStopSec / 60))}M
                  </span>

                  <button
                    type="button"
                    onClick={() => onLiveTrackBus(bus.vehicleId)}
                    className="px-4 py-1.5 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Live Track ↗</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#222222] bg-[#0A0A0A] flex items-center justify-between text-[11px] font-mono text-[#666666] shrink-0">
        <span>
          SHOWING <b className="text-white">{filteredBuses.length}</b> OF {buses.length} BUSES
        </span>
        <span className="text-[#CCFF00] font-bold">GPS AVLS STREAMING ACTIVE</span>
      </div>
    </div>
  );
}
