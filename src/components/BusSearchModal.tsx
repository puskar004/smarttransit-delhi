import {
  AlertTriangle,
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
import { DELHI_ROUTES, STOP_BY_ID } from '../data/delhiNetwork';
import type { SimulatedBus } from '../types/transit';

interface BusSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: SimulatedBus[];
  onSelectBusForTracking: (bus: SimulatedBus) => void;
}

type FilterOption = 'ALL' | 'ON_TIME' | 'DELAYED' | 'LOW_CROWD' | 'ELECTRIC';

export function BusSearchModal({
  isOpen,
  onClose,
  buses,
  onSelectBusForTracking,
}: BusSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');

  // Filter & match buses
  const filteredBuses = useMemo(() => {
    const q = query.trim().toLowerCase();

    return buses.filter((bus) => {
      // 1. Text Search matching route number, vehicle plate, or stop names
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

      // 2. Filter chips
      const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
      const isOnTime = Math.abs(bus.delayVsScheduleSec) <= 60;
      const isDelayed = bus.delayVsScheduleSec > 60;

      if (activeFilter === 'ON_TIME' && !isOnTime) return false;
      if (activeFilter === 'DELAYED' && !isDelayed) return false;
      if (activeFilter === 'LOW_CROWD' && occ >= 50) return false;
      if (activeFilter === 'ELECTRIC' && bus.operator !== 'DTC_ELECTRIC') return false;

      return true;
    });
  }, [buses, query, activeFilter]);

  // Group by Route Short Name for clean organization
  const groupedByRoute = useMemo(() => {
    const map = new Map<string, SimulatedBus[]>();
    for (const bus of filteredBuses) {
      const list = map.get(bus.routeShortName) ?? [];
      list.push(bus);
      map.set(bus.routeShortName, list);
    }
    return Array.from(map.entries());
  }, [filteredBuses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#0E0E0E] border-2 border-[#262626] shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#1F1F1F] flex items-center justify-between gap-3 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#CCFF00] text-black font-black flex items-center justify-center">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-white leading-tight">
                DELHI BUS SEARCH &amp; LIVE TRACKING
              </h2>
              <p className="text-[10.5px] font-mono text-[#8E8E93]">
                REAL-TIME AVLS GPS SENSORS OF {buses.length} ACTIVE CORRIDOR BUSES
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-[#141414] hover:bg-[#CCFF00] hover:text-black border border-[#262626] text-[#8E8E93] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#1F1F1F] space-y-3 bg-[#0E0E0E]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#666666] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by bus number (e.g. 534, 429, 764) or stop (e.g. AIIMS, Okhla Ph-III, Nehru Place)..."
              autoFocus
              className="w-full pl-11 pr-10 py-2.5 bg-[#141414] border border-[#262626] focus:border-[#CCFF00] focus:outline-none text-xs text-white placeholder:text-[#555555] transition-all font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips (SNKS Brutalist Style) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[#666666] flex items-center gap-1 font-mono uppercase text-[10.5px] shrink-0">
              <Filter className="w-3 h-3" /> FILTERS:
            </span>

            {[
              { id: 'ALL', label: `ALL BUSES (${buses.length})` },
              { id: 'ON_TIME', label: 'ON TIME' },
              { id: 'DELAYED', label: 'DELAYED' },
              { id: 'LOW_CROWD', label: 'SEATS FREE' },
              { id: 'ELECTRIC', label: 'AC ELECTRIC' },
            ].map((f) => {
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id as FilterOption)}
                  className={`px-3 py-1 font-mono font-bold uppercase tracking-wider text-[10.5px] whitespace-nowrap transition-all cursor-pointer border ${
                    active
                      ? 'bg-[#CCFF00] text-black border-[#CCFF00]'
                      : 'bg-[#141414] text-[#8E8E93] hover:text-white border-[#262626]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {filteredBuses.length === 0 ? (
            <div className="py-12 text-center text-[#666666] space-y-2">
              <Search className="w-10 h-10 mx-auto text-[#333333] stroke-[1.5]" />
              <p className="text-xs font-bold uppercase tracking-wider text-white">No buses found matching "{query}"</p>
              <p className="text-xs text-[#555555]">
                Try searching for route numbers like <b className="text-[#CCFF00]">534</b> or <b className="text-[#CCFF00]">429</b>.
              </p>
            </div>
          ) : (
            groupedByRoute.map(([routeShortName, routeBuses]) => {
              const routeMeta = DELHI_ROUTES.find((r) => r.shortName === routeShortName);

              return (
                <div
                  key={routeShortName}
                  className="bg-[#111111] border border-[#222222] overflow-hidden"
                >
                  {/* Route Header Banner */}
                  <div className="px-4 py-2 bg-[#161616] border-b border-[#222222] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#CCFF00] text-black font-black text-xs uppercase tracking-wider">
                        BUS {routeShortName}
                      </span>
                      <span className="text-xs font-bold uppercase text-white truncate">
                        {routeMeta?.longName ?? `Route ${routeShortName}`}
                      </span>
                    </div>

                    <span className="text-[10.5px] font-mono text-[#8E8E93] uppercase">
                      {routeBuses.length} ACTIVE
                    </span>
                  </div>

                  {/* List of active buses on this route */}
                  <div className="divide-y divide-[#1C1C1C]">
                    {routeBuses.map((bus) => {
                      const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
                      const delaySec = bus.delayVsScheduleSec;
                      const delayMin = Math.round(Math.abs(delaySec) / 60);
                      const isOnTime = Math.abs(delaySec) <= 60;
                      const isDelayed = delaySec > 60;

                      const crowdLabel =
                        occ < 40 ? 'LOW CROWD' : occ < 75 ? 'MODERATE' : 'HEAVY LOAD';
                      const seatChance = Math.max(5, Math.min(98, 100 - Math.round(occ * 0.95)));

                      return (
                        <div
                          key={bus.vehicleId}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161616] transition-all"
                        >
                          {/* Bus Info & Telemetry */}
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-white">
                                {bus.vehicleId}
                              </span>

                              {/* On-Time / Delay Badge (NO RED!) */}
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase inline-flex items-center gap-1 ${
                                  isOnTime
                                    ? 'bg-[#CCFF00] text-black'
                                    : isDelayed
                                      ? 'bg-[#FFB800] text-black'
                                      : 'bg-white text-black'
                                }`}
                              >
                                {isOnTime ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-black stroke-[3]" />
                                    <span>ON TIME</span>
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

                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1C1C1C] text-[#8E8E93] border border-[#2E2E2E] uppercase">
                                {bus.isDwelling ? 'BOARDING' : `${bus.speedKmh.toFixed(0)} KM/H`}
                              </span>
                            </div>

                            {/* Approaching stop & crowd meter */}
                            <div className="flex items-center gap-3 text-[11px] font-mono text-[#8E8E93] flex-wrap">
                              <span className="flex items-center gap-1 text-white">
                                <Navigation className="w-3 h-3 text-[#CCFF00]" />
                                NEXT: <b className="uppercase">{bus.nextStopName}</b> (~
                                {Math.max(1, Math.round(bus.etaNextStopSec / 60))}M)
                              </span>

                              <span>•</span>

                              <span className="flex items-center gap-1 text-[#CCFF00]">
                                <Users className="w-3 h-3" />
                                <span>{occ}% {crowdLabel}</span>
                              </span>

                              <span>•</span>

                              <span className="flex items-center gap-1 text-white">
                                <Sparkles className="w-3 h-3 text-[#CCFF00]" />
                                <span>{seatChance}% SEATS</span>
                              </span>
                            </div>
                          </div>

                          {/* Action Button: LIVE TRACK */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectBusForTracking(bus);
                                onClose();
                              }}
                              className="w-full sm:w-auto px-4 py-1.5 bg-[#CCFF00] hover:bg-[#B8E600] text-black text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Live Track ↗</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1F1F1F] bg-[#0A0A0A] flex items-center justify-between text-[11px] font-mono text-[#8E8E93]">
          <span>
            SHOWING <b className="text-white">{filteredBuses.length}</b> BUSES
          </span>
          <span className="text-[#CCFF00] font-bold">
            KALMAN GPS FUSED TELEMETRY
          </span>
        </div>
      </div>
    </div>
  );
}
