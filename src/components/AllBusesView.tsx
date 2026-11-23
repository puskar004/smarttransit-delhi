import {
  ChevronLeft,
  Search,
  Ticket,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DELHI_ROUTES, STOP_BY_ID } from '../data/delhiNetwork';
import type { SimulatedBus } from '../types/transit';

interface AllBusesViewProps {
  buses: SimulatedBus[];
  onLiveTrackBus: (vehicleId: string) => void;
  onGoToPlanner?: () => void;
  onOpenTicket?: (config?: { route?: string; vehicleId?: string; fare?: number }) => void;
  onClose?: () => void;
  lang?: 'en' | 'hi';
}

type FilterOption = 'ALL' | 'ON_TIME' | 'DELAYED';

export function AllBusesView({
  buses,
  onLiveTrackBus,
  onGoToPlanner: _onGoToPlanner,
  onOpenTicket,
  onClose,
  lang = 'en',
}: AllBusesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');

  // Summary counts
  const onTimeCount = useMemo(
    () => buses.filter((b) => Math.abs(b.delayVsScheduleSec) <= 60).length,
    [buses]
  );
  const delayedCount = useMemo(
    () => buses.filter((b) => b.delayVsScheduleSec > 60).length,
    [buses]
  );

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
      const isOnTime = Math.abs(bus.delayVsScheduleSec) <= 60;
      const isDelayed = bus.delayVsScheduleSec > 60;

      if (activeFilter === 'ON_TIME' && !isOnTime) return false;
      if (activeFilter === 'DELAYED' && !isDelayed) return false;

      return true;
    });
  }, [buses, searchQuery, activeFilter]);

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] text-white font-sans select-none overflow-y-auto">
      {/* 1. Sleek Compact Sticky Header Bar */}
      <div className="sticky top-0 z-30 px-3.5 sm:px-5 py-2.5 bg-[#0c0e14]/95 backdrop-blur-md border-b border-[#1c2232] flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
          <h2 className="text-sm font-black uppercase tracking-tight text-white leading-none">
            {lang === 'hi' ? 'सभी बसें' : 'ALL THE BUSES'}
          </h2>
          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
            {buses.length} LIVE
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse bus list inside"
            title="Slide / Collapse list inside"
            className="px-2.5 py-1 rounded-lg bg-[#151923] hover:bg-[#CCFF00] hover:text-black border border-[#273045] text-slate-300 hover:border-black flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="text-[10px] font-mono font-bold uppercase">
              {lang === 'hi' ? 'अंदर करें' : 'COLLAPSE'}
            </span>
          </button>
        )}
      </div>

      {/* 2. Main Header Details (Big Title, Subtitle, Filter Pills, Search Bar - scrolls naturally!) */}
      <div className="p-4 sm:p-5 border-b border-[#1c2232] bg-[#0d1017] space-y-3.5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
            {lang === 'hi' ? 'सभी बसें' : 'ALL THE BUSES'}
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-1">
            {lang === 'hi' ? 'दिल्ली सक्रिय फ्लीट रोटेशन' : 'THE FULL FLEET ROTATION'}
          </p>
        </div>

        {/* Filter Pills — Exact Screenshot: All (72), On Time (18), Delayed (43) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          {[
            { id: 'ALL', label: `All (${buses.length})` },
            { id: 'ON_TIME', label: `On Time (${onTimeCount})` },
            { id: 'DELAYED', label: `Delayed (${delayedCount})` },
          ].map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as FilterOption)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#CCFF00] text-black shadow-sm font-black'
                    : 'bg-[#151923] text-slate-300 hover:text-white border border-[#273045]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar — Rounded Capsule */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bus number or route..."
            className="w-full pl-9 pr-8 py-2 bg-[#121620] border border-[#242c3e] focus:border-[#CCFF00] rounded-full text-xs text-white placeholder:text-slate-500 transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Bus Cards Stream (Flows naturally as part of the full drawer!) */}
      <div className="p-3.5 sm:p-4 space-y-3 pb-12">
        {filteredBuses.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400">No buses matching filter</p>
          </div>
        ) : (
          filteredBuses.map((bus) => {
            const routeMeta = DELHI_ROUTES.find((r) => r.shortName === bus.routeShortName);
            const occ = Math.round(((bus.passengersEst ?? 30) / 60) * 100);
            const delaySec = bus.delayVsScheduleSec;
            const delayMin = Math.round(Math.abs(delaySec) / 60);
            const isOnTime = Math.abs(delaySec) <= 60;

            const crowdShort = occ < 45 ? 'Low' : occ < 75 ? 'Med' : 'Heavy';
            const seatChance = Math.max(8, Math.min(96, 100 - Math.round(occ * 0.95)));

            // Route endpoints formatted cleanly
            const stops = routeMeta?.stopIds ?? bus.stopSequence;
            const firstStopName = (STOP_BY_ID[stops[0]]?.name ?? 'ORIGIN').toUpperCase();
            const lastStopName = (STOP_BY_ID[stops[stops.length - 1]]?.name ?? 'DESTINATION').toUpperCase();
            const routeHeadline = `BUS ${bus.routeShortName} • ${firstStopName} ↔ ${lastStopName}`;

            return (
              <div
                key={bus.vehicleId}
                className="bg-[#121620] hover:bg-[#151a26] border border-[#232a3d] hover:border-[#38435d] rounded-2xl p-3.5 transition-all duration-150 space-y-2.5 shadow-sm"
              >
                {/* Header Row: Route & Status Pill */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-mono font-bold text-xs text-white truncate max-w-[240px]"
                    title={routeHeadline}
                  >
                    {routeHeadline}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider shrink-0 ${
                      isOnTime
                        ? 'bg-[#1b2b1e] text-[#4ade80] border border-[#2a4d31]'
                        : 'bg-[#2b2413] text-[#f59e0b] border border-[#4d3d19]'
                    }`}
                  >
                    {isOnTime ? 'on time' : `delayed +${delayMin}m`}
                  </span>
                </div>

                {/* 3-Column Metrics Box */}
                <div className="grid grid-cols-3 gap-2 bg-[#0c0f16] rounded-xl p-2.5 border border-[#1b2130] text-left">
                  <div className="truncate">
                    <span className="text-[8.5px] font-mono uppercase text-slate-400 block tracking-wider">
                      NEXT STOP
                    </span>
                    <strong className="text-[11px] font-mono font-bold text-white truncate block">
                      {bus.nextStopName}
                    </strong>
                  </div>

                  <div className="truncate">
                    <span className="text-[8.5px] font-mono uppercase text-slate-400 block tracking-wider">
                      CROWD LOAD
                    </span>
                    <strong className="text-[11px] font-mono font-bold text-white truncate block">
                      {occ}% • {crowdShort}
                    </strong>
                  </div>

                  <div className="truncate">
                    <span className="text-[8.5px] font-mono uppercase text-slate-400 block tracking-wider">
                      SEAT PROB...
                    </span>
                    <strong className="text-[11px] font-mono font-bold text-white truncate block">
                      {seatChance}% Chance
                    </strong>
                  </div>
                </div>

                {/* Action Buttons: Solid Neon Volt Live Track + ETM Ticket */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onLiveTrackBus(bus.vehicleId)}
                    className="col-span-2 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#bfe600] active:scale-[0.98] text-black font-sans font-black text-xs tracking-wider uppercase transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 border border-black"
                  >
                    <span>LIVE TRACK</span>
                    <span className="font-mono text-sm font-black">↗</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenTicket?.({
                        route: bus.routeShortName,
                        vehicleId: bus.vehicleId,
                        fare: 15,
                      })
                    }
                    className="py-2.5 rounded-xl bg-[#141824] hover:bg-[#1f273d] active:scale-[0.98] text-[#CCFF00] border border-[#27324c] hover:border-[#CCFF00] font-mono font-bold text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                    title={lang === 'hi' ? 'ई-टिकट लें' : 'Get E-Ticket'}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'टिकट' : 'TICKET'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
