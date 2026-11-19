import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Navigation,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DELHI_ROUTES, OPERATOR_META, STOP_BY_ID } from '../data/delhiNetwork';
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
    <div className="h-full flex flex-col bg-[#0F131F] text-white overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#202738] bg-[#141926] space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-bold uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE AVLS GPS TELEMETRY</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              All Available Delhi Buses
            </h2>
            <p className="text-xs text-slate-400">
              Live punctuality, delay in minutes, crowd occupancy &amp; 1-click live tracking
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToPlanner}
            className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all cursor-pointer hidden sm:inline-flex items-center gap-1.5"
          >
            <span>Plan Route →</span>
          </button>
        </div>

        {/* Quick Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by bus number (e.g. 534, 429, 764) or stop name..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#1B2133] border border-[#2B3550] focus:border-[#38BDF8] focus:bg-[#20273D] text-xs sm:text-sm text-white placeholder:text-slate-400 transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          {[
            { id: 'ALL', label: `All Buses (${buses.length})` },
            { id: 'ON_TIME', label: `🟢 On Time (${onTimeCount})` },
            { id: 'DELAYED', label: `🔴 Delayed (${delayedCount})` },
            { id: 'SEATS_FREE', label: `💺 Seats Free (${seatsFreeCount})` },
            { id: 'ELECTRIC', label: '⚡ DTC Electric' },
          ].map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as FilterOption)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer text-[11px] ${
                  active
                    ? 'bg-[#1D54B5] text-white shadow-sm'
                    : 'bg-[#1A2033] text-slate-300 hover:bg-[#222B45] border border-[#2B3552]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List of Buses */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {filteredBuses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Bus className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
            <p className="text-sm font-bold text-white">No buses found matching "{searchQuery}"</p>
            <p className="text-xs text-slate-500">
              Try searching for bus numbers like <b className="text-cyan-400">534</b> or{' '}
              <b className="text-cyan-400">429</b>.
            </p>
          </div>
        ) : (
          filteredBuses.map((bus) => {
            const routeMeta = DELHI_ROUTES.find((r) => r.shortName === bus.routeShortName);
            const opMeta = OPERATOR_META[bus.operator];
            const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
            const delaySec = bus.delayVsScheduleSec;
            const delayMin = Math.round(Math.abs(delaySec) / 60);
            const isOnTime = Math.abs(delaySec) <= 60;
            const isDelayed = delaySec > 60;

            const crowdLabel =
              occ < 40 ? 'Low Crowd · Seats Free' : occ < 75 ? 'Moderate' : 'High Crowd · Standing Only';
            const crowdColor = occ < 40 ? '#10B981' : occ < 75 ? '#F59E0B' : '#E50914';
            const seatChance = Math.max(5, Math.min(98, 100 - Math.round(occ * 0.95)));

            return (
              <div
                key={bus.vehicleId}
                className="bg-[#141926] hover:bg-[#1A2031] border border-[#232B40] hover:border-[#38BDF8]/60 rounded-2xl p-3.5 sm:p-4 transition-all shadow-sm space-y-2.5"
              >
                {/* Top Row: Route Badge & Punctuality Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-lg font-black text-xs"
                      style={{
                        backgroundColor: `${opMeta.color}20`,
                        color: opMeta.color,
                        border: `1.5px solid ${opMeta.color}`,
                      }}
                    >
                      BUS {bus.routeShortName}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-300">
                      {bus.vehicleId}
                    </span>
                    {bus.operator === 'DTC_ELECTRIC' && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9.5px] font-bold border border-emerald-500/30">
                        ⚡ Electric AC
                      </span>
                    )}
                  </div>

                  {/* Punctuality Badge (Super prominent user requirement) */}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      isOnTime
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isDelayed
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isOnTime ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>On Time (+0m)</span>
                      </>
                    ) : isDelayed ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Delayed {delayMin} min</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{delayMin}m Early</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Corridor Route Name */}
                <div className="text-xs text-slate-200 font-semibold truncate">
                  {routeMeta?.longName ?? `Delhi Corridor ${bus.routeShortName}`}
                </div>

                {/* Metrics Row: Next Stop, Speed, Crowd Meter */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="bg-[#1C2235] p-2 rounded-xl border border-[#26314D] flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 block text-[9.5px]">NEXT STOP</span>
                      <strong className="text-white truncate block">{bus.nextStopName}</strong>
                    </div>
                  </div>

                  <div className="bg-[#1C2235] p-2 rounded-xl border border-[#26314D] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 shrink-0" style={{ color: crowdColor }} />
                    <div className="truncate">
                      <span className="text-slate-400 block text-[9.5px]">CROWD LOAD</span>
                      <strong style={{ color: crowdColor }} className="truncate block font-bold">
                        {occ}% · {crowdLabel}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-[#1C2235] p-2 rounded-xl border border-[#26314D] flex items-center gap-1.5 col-span-2 sm:col-span-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-slate-400 block text-[9.5px]">SEAT CHANCE</span>
                      <strong className="text-emerald-400 truncate block">
                        {seatChance}% Probability
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Action Row: Live Track Button */}
                <div className="pt-1 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-slate-400">
                    Live Speed: <strong className="text-white">{bus.speedKmh.toFixed(0)} km/h</strong> •
                    ETA: ~{Math.max(1, Math.round(bus.etaNextStopSec / 60))}m
                  </span>

                  <button
                    type="button"
                    onClick={() => onLiveTrackBus(bus.vehicleId)}
                    className="px-4 py-2 rounded-xl bg-[#F26419] hover:bg-[#E05309] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Live Track on Map</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#202738] bg-[#141926] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span>
          Showing <b>{filteredBuses.length}</b> buses in Delhi
        </span>
        <span className="text-cyan-400 font-semibold">Continuous Kalman GPS Filtering</span>
      </div>
    </div>
  );
}
