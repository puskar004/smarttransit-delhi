import {
  Bus,
  Clock,
  Flame,
  Route as RouteIcon,
  Ticket,
  Users,
} from 'lucide-react';

interface QuickServicesBarProps {
  activeTab: string;
  onOpenAllBuses: () => void;
  onOpenPlanner: () => void;
  onOpenStopArrivals: () => void;
  onOpenCrowdRadar: () => void;
  onOpenTrafficDelay: () => void;
  onOpenTicket?: () => void;
  lang?: 'en' | 'hi';
}

export function QuickServicesBar({
  activeTab,
  onOpenAllBuses,
  onOpenPlanner,
  onOpenStopArrivals,
  onOpenCrowdRadar,
  onOpenTrafficDelay,
  onOpenTicket,
  lang = 'en',
}: QuickServicesBarProps) {
  const pills = [
    {
      id: 'DIGITAL_TICKET',
      title: lang === 'hi' ? 'ई-टिकट एवं पास' : 'DIGITAL TICKET & PASS',
      badge: 'ETM QR',
      icon: Ticket,
      highlight: true,
      onClick: onOpenTicket,
    },
    {
      id: 'ALL_BUSES',
      title: lang === 'hi' ? 'सभी लाइव बसें' : 'ALL AVAILABLE BUSES',
      badge: '72 Live',
      icon: Bus,
      onClick: onOpenAllBuses,
    },
    {
      id: 'PLANNER',
      title: lang === 'hi' ? 'यात्रा योजना' : 'JOURNEY PLANNER',
      icon: RouteIcon,
      onClick: onOpenPlanner,
    },
    {
      id: 'STOP_ARRIVALS',
      title: lang === 'hi' ? 'स्टॉप आगमन' : 'STOP ARRIVALS',
      icon: Clock,
      onClick: onOpenStopArrivals,
    },
    {
      id: 'CROWD_RADAR',
      title: lang === 'hi' ? 'भीड़ रडार' : 'CROWD RADAR',
      icon: Users,
      onClick: onOpenCrowdRadar,
    },
    {
      id: 'TRAFFIC_DELAY',
      title: lang === 'hi' ? 'ट्रैफिक एवं देरी' : 'TRAFFIC & DELAY',
      icon: Flame,
      onClick: onOpenTrafficDelay,
    },
  ];

  return (
    <div className="bg-[#0b0d13] border-b border-[#1c202d] px-4 sm:px-8 py-2.5 overflow-x-auto shrink-0 select-none no-scrollbar">
      <div className="flex items-center gap-2 sm:gap-3 min-w-max">
        {pills.map((item) => {
          const Icon = item.icon;
          const isActive =
            (activeTab === 'ALL_BUSES' && item.id === 'ALL_BUSES') ||
            (activeTab === 'PLANNER' && item.id === 'PLANNER') ||
            (activeTab === 'TRAFFIC' && (item.id === 'TRAFFIC_DELAY' || item.id === 'STOP_ARRIVALS'));

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                item.highlight
                  ? 'bg-[#181f2f] text-[#CCFF00] border-[#CCFF00]/50 hover:border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.2)]'
                  : isActive
                  ? 'bg-[#181d2a] text-[#CCFF00] border-[#384259] shadow-sm'
                  : 'bg-[#12151e] text-slate-400 hover:text-white border-[#222838] hover:border-[#384259]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
              <span>{item.title}</span>
              {item.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-[#CCFF00] text-black">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
