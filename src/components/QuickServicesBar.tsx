import {
  Bus,
  Clock,
  Database,
  Flame,
  Route as RouteIcon,
  Users,
} from 'lucide-react';

interface QuickServicesBarProps {
  activeTab: string;
  onOpenPlanner: () => void;
  onOpenLiveTrackSearch: () => void;
  onOpenStopArrivals: () => void;
  onOpenCrowdRadar: () => void;
  onOpenJamSimulator: () => void;
  onOpenApiGuide: () => void;
}

export function QuickServicesBar({
  activeTab,
  onOpenPlanner,
  onOpenLiveTrackSearch,
  onOpenStopArrivals,
  onOpenCrowdRadar,
  onOpenJamSimulator,
  onOpenApiGuide,
}: QuickServicesBarProps) {
  const services = [
    {
      id: 'ALL_BUSES',
      num: '01',
      title: 'ALL AVAILABLE BUSES',
      subtitle: 'On-time, delay & live track',
      icon: Bus,
      badge: '72 LIVE',
      onClick: onOpenLiveTrackSearch,
    },
    {
      id: 'PLANNER',
      num: '02',
      title: 'JOURNEY PLANNER',
      subtitle: 'Fastest vs guaranteed seats',
      icon: RouteIcon,
      badge: 'SMART AI',
      onClick: onOpenPlanner,
    },
    {
      id: 'STOP_ARRIVALS',
      num: '03',
      title: 'STOP ARRIVALS ("YE BUS")',
      subtitle: 'Next buses at Delhi stops',
      icon: Clock,
      badge: 'PIS AVLS',
      onClick: onOpenStopArrivals,
    },
    {
      id: 'CROWD_RADAR',
      num: '04',
      title: 'CROWD RADAR',
      subtitle: 'Seats vs crush load routing',
      icon: Users,
      badge: 'PROBLEM 02',
      onClick: onOpenCrowdRadar,
    },
    {
      id: 'JAM_SIMULATOR',
      num: '05',
      title: 'TRAFFIC & DELAY MODEL',
      subtitle: 'Kalman shockwaves & ETA',
      icon: Flame,
      badge: 'PROBLEM 01',
      onClick: onOpenJamSimulator,
    },
    {
      id: 'API_DATA',
      num: '06',
      title: 'DELHI APIS & OPEN DATA',
      subtitle: 'Real Delhi GTFS & AVLS feeds',
      icon: Database,
      badge: 'OPEN STACK',
      onClick: onOpenApiGuide,
    },
  ];

  return (
    <div className="bg-[#000000] border-b border-[#222222] px-3 sm:px-6 py-2 overflow-x-auto shrink-0 select-none">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-max">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#666666] mr-1 hidden xl:inline">
          DOCKS /
        </span>

        {services.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`flex items-center gap-2.5 px-3 py-1.5 text-left transition-all cursor-pointer group border ${
                isActive
                  ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.25)]'
                  : 'bg-[#0E0E0E] hover:bg-[#141414] text-white border-[#242424] hover:border-[#CCFF00]'
              }`}
            >
              <div
                className={`w-7 h-7 flex items-center justify-center shrink-0 border ${
                  isActive
                    ? 'bg-black text-[#CCFF00] border-black'
                    : 'bg-[#161616] text-[#CCFF00] border-[#333333] group-hover:border-[#CCFF00]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider leading-tight block ${
                      isActive ? 'text-black' : 'text-white'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span
                    className={`text-[8.5px] font-mono font-black px-1.5 py-0.2 uppercase tracking-wider ${
                      isActive
                        ? 'bg-black text-[#CCFF00]'
                        : 'bg-[#1C1C1C] text-[#CCFF00] border border-[#333333]'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <span
                  className={`text-[9.5px] leading-tight block font-medium truncate ${
                    isActive ? 'text-black/80 font-semibold' : 'text-[#888888]'
                  }`}
                >
                  {item.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
