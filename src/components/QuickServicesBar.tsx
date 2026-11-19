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
      title: 'All Available Buses',
      subtitle: 'See on-time/delay & live track',
      icon: Bus,
      badge: '72 LIVE',
      badgeColor: '#10B981',
      bgLight: '#ECFDF5',
      accentColor: '#059669',
      borderLight: '#A7F3D0',
      onClick: onOpenLiveTrackSearch,
    },
    {
      id: 'PLANNER',
      title: 'Journey Planner',
      subtitle: 'Fastest vs Guaranteed Seats',
      icon: RouteIcon,
      badge: 'AI TOP PICK',
      badgeColor: '#7C3AED',
      bgLight: '#F5F3FF',
      accentColor: '#7C3AED',
      borderLight: '#DDD6FE',
      onClick: onOpenPlanner,
    },
    {
      id: 'STOP_ARRIVALS',
      title: 'Stop Arrivals ("Ye Bus")',
      subtitle: 'Next buses at Delhi stops',
      icon: Clock,
      badge: 'GPS SYNCED',
      badgeColor: '#0284C7',
      bgLight: '#F0F9FF',
      accentColor: '#0284C7',
      borderLight: '#BAE6FD',
      onClick: onOpenStopArrivals,
    },
    {
      id: 'CROWD_RADAR',
      title: 'Crowd Radar',
      subtitle: 'Seats vs Crush Load',
      icon: Users,
      badge: 'PROBLEM 02',
      badgeColor: '#D97706',
      bgLight: '#FFFBEB',
      accentColor: '#D97706',
      borderLight: '#FDE68A',
      onClick: onOpenCrowdRadar,
    },
    {
      id: 'JAM_SIMULATOR',
      title: 'Traffic & Delay Model',
      subtitle: 'Shockwaves & bottleneck ETA',
      icon: Flame,
      badge: 'PROBLEM 01',
      badgeColor: '#DC2626',
      bgLight: '#FEF2F2',
      accentColor: '#DC2626',
      borderLight: '#FECACA',
      onClick: onOpenJamSimulator,
    },
    {
      id: 'API_DATA',
      title: 'Delhi APIs & Data',
      subtitle: 'Zero API key needed to demo',
      icon: Database,
      badge: 'OPEN DATA',
      badgeColor: '#9333EA',
      bgLight: '#FAF5FF',
      accentColor: '#9333EA',
      borderLight: '#E9D5FF',
      onClick: onOpenApiGuide,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200/80 px-3 sm:px-6 py-2 overflow-x-auto shrink-0 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-max">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 hidden xl:inline">
          TRANSIT SERVICES:
        </span>

        {services.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl text-left transition-all cursor-pointer group border ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 border-violet-600'
                  : 'hover:shadow-xs'
              }`}
              style={{
                backgroundColor: isActive ? undefined : item.bgLight,
                borderColor: isActive ? undefined : item.borderLight,
              }}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'bg-white/20 text-white' : ''
                }`}
                style={{
                  backgroundColor: isActive ? undefined : `${item.accentColor}20`,
                  color: isActive ? '#FFFFFF' : item.accentColor,
                }}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[12px] font-bold leading-tight block ${
                      isActive ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span
                    className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      isActive ? 'bg-white/25 text-white' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? undefined : `${item.badgeColor}20`,
                      color: isActive ? '#FFFFFF' : item.badgeColor,
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
                <span
                  className={`text-[10px] leading-tight block ${
                    isActive ? 'text-violet-100' : 'text-slate-500'
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
