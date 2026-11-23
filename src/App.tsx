import {
  Activity,
  BookOpen,
  Bus,
  ChevronLeft,
  ChevronRight,
  Compass,
  HelpCircle,
  Menu,
  Pause,
  Play,
  Route as RouteIcon,
  Search,
  Ticket,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AllBusesView } from './components/AllBusesView';
import { ApiGuideModal } from './components/ApiGuideModal';
import { AuthScreen, type UserProfile } from './components/AuthScreen';
import { BusSearchModal } from './components/BusSearchModal';
import { DelhiMap } from './components/DelhiMap';
import { DigitalTicketModal, type TicketConfig } from './components/DigitalTicketModal';
import { HelpModal } from './components/HelpModal';
import { JourneyPlannerTab } from './components/JourneyPlannerTab';
import { LanguageSelectScreen } from './components/LanguageSelectScreen';
import { LiveBusTrackerHud } from './components/LiveBusTrackerHud';
import { SegmentInspectorCard, StopPisCard } from './components/MapInspectors';
import { QuickServicesBar } from './components/QuickServicesBar';
import { Rotatable3DBusStage } from './components/Rotatable3DBusStage';
import { TrafficModelTab } from './components/TrafficModelTab';
import { TransportStackHackathonView } from './components/TransportStackHackathonView';
import { UserProfileModal } from './components/UserProfileModal';
import { STOP_BY_ID } from './data/delhiNetwork';
import { DelhiTransitSimulator } from './engine/busSimulator';
import {
  exportTrafficGeoJson,
  generateSampleDelhiCsv,
  ingestGpsCsvText,
  ingestGtfsRtJson,
  type IngestionReport,
} from './engine/gtfsAdapter';
import { planDelhiJourneys } from './engine/journeyPlanner';
import { BusTrafficModel } from './engine/trafficModel';
import type {
  JourneyPreference,
  ModelValidationMetrics,
  SegmentTrafficState,
  SimulatedBus,
  TrafficIncident,
} from './types/transit';
import { formatSimClock } from './utils/format';

type AppPage = 'PLANNER' | 'ALL_BUSES' | 'TRAFFIC' | 'ABOUT';

export function App() {
  // Commuter authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('smarttransit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const modelRef = useRef<BusTrafficModel | null>(null);
  const simRef = useRef<DelhiTransitSimulator | null>(null);

  if (!modelRef.current) {
    modelRef.current = new BusTrafficModel(18.25);
  }
  if (!simRef.current) {
    simRef.current = new DelhiTransitSimulator(modelRef.current, 18.25, 20261124);
  }

  const [trafficStates, setTrafficStates] = useState<Record<string, SegmentTrafficState>>(() =>
    modelRef.current!.getStateRecord()
  );
  const [buses, setBuses] = useState<SimulatedBus[]>(() => [...simRef.current!.getBuses()]);
  const [incidents, setIncidents] = useState<TrafficIncident[]>(() => [
    ...simRef.current!.getIncidents(),
  ]);
  const [validationMetrics, setValidationMetrics] = useState<ModelValidationMetrics>(() =>
    modelRef.current!.getValidationMetrics()
  );
  const [simTimeMs, setSimTimeMs] = useState<number>(() => simRef.current!.getSimTimeMs());
  const [simHour, setSimHour] = useState<number>(() => simRef.current!.getSimHour());

  const [isPlaying, setIsPlaying] = useState(true);
  const [page, setPage] = useState<AppPage>('ALL_BUSES');
  const [showMapInAllBuses, setShowMapInAllBuses] = useState(false);

  // Journey Planner State (Defaults to Okhla Phase-III -> AIIMS)
  const [originStopId, setOriginStopId] = useState('iiit_delhi');
  const [destinationStopId, setDestinationStopId] = useState('aiims');
  const [preference, setPreference] = useState<JourneyPreference>('COMFORT');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

  // Map Inspector State
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  // Live Bus Tracking & Modals State
  const [trackedBusId, setTrackedBusId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isApiGuideOpen, setIsApiGuideOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [hasChosenLanguage, setHasChosenLanguage] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);

  const [lastIngestion, setLastIngestion] = useState<IngestionReport | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 4000);
  }, []);

  const syncFromEngine = useCallback(() => {
    const model = modelRef.current!;
    const sim = simRef.current!;
    setTrafficStates(model.getStateRecord());
    setBuses(sim.getBuses().map((b) => ({ ...b })));
    setValidationMetrics(model.getValidationMetrics());
    setSimTimeMs(sim.getSimTimeMs());
    setSimHour(sim.getSimHour());
  }, []);

  // Gentle 1.2s simulation tick
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      simRef.current!.step(4);
      syncFromEngine();
    }, 1200);
    return () => window.clearInterval(timer);
  }, [isPlaying, syncFromEngine]);

  const journeys = useMemo(() => {
    return planDelhiJourneys({
      originStopId,
      destinationStopId,
      model: modelRef.current!,
      buses,
      departureOffsetMin: 0,
      preference,
      maxResults: 4,
    });
  }, [originStopId, destinationStopId, preference, buses, trafficStates]);

  const activeJourney = useMemo(() => {
    if (journeys.length === 0) return null;
    return journeys.find((j) => j.id === selectedJourneyId) ?? journeys[0];
  }, [journeys, selectedJourneyId]);

  const trackedBus = useMemo(() => {
    if (!trackedBusId) return null;
    return buses.find((b) => b.vehicleId === trackedBusId) ?? null;
  }, [buses, trackedBusId]);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketModalConfig, setTicketModalConfig] = useState<TicketConfig | null>(null);

  const handleOpenTicketModal = useCallback(
    (cfg?: TicketConfig) => {
      setTicketModalConfig(
        cfg ?? {
          route: activeJourney?.routeBadges[0]?.shortName ?? '534',
          from: STOP_BY_ID[originStopId]?.name ?? 'IIIT Delhi (Okhla Ph-III)',
          to: STOP_BY_ID[destinationStopId]?.name ?? 'AIIMS Ring Road',
          fare: activeJourney?.totalFareInr ?? 15,
          vehicleId: trackedBus?.vehicleId ?? 'DL51EV-1557',
          type: 'single',
        }
      );
      setIsTicketModalOpen(true);
    },
    [activeJourney, originStopId, destinationStopId, trackedBus]
  );

  const avgNetworkSpeed = useMemo(() => {
    const all = Object.values(trafficStates);
    if (all.length === 0) return 0;
    return all.reduce((acc, st) => acc + st.currentSpeedKmh, 0) / all.length;
  }, [trafficStates]);

  const activeJamCount = useMemo(
    () => incidents.filter((i) => i.active).length,
    [incidents]
  );

  const handleToggleIncident = useCallback(
    (incidentId: string) => {
      const updated = simRef.current!.toggleIncident(incidentId);
      setIncidents([...updated]);
      for (let i = 0; i < 8; i++) {
        simRef.current!.step(5);
      }
      syncFromEngine();
      const target = updated.find((i) => i.id === incidentId);
      if (target) {
        showToast(
          target.active
            ? `⚠️ Jam active: ${target.title} — AI re-routing commuters!`
            : `✅ Cleared: ${target.title} — speeds recovering.`
        );
      }
    },
    [syncFromEngine, showToast]
  );

  const handleIngestFileText = useCallback(
    (filename: string, text: string) => {
      try {
        const model = modelRef.current!;
        const isJson = filename.toLowerCase().endsWith('.json') || text.trim().startsWith('{');
        const report = isJson
          ? ingestGtfsRtJson(text, model, simRef.current!.getSimTimeMs())
          : ingestGpsCsvText(text, model, simRef.current!.getSimTimeMs());
        setLastIngestion(report);
        syncFromEngine();
        showToast(
          `🎉 Snapped ${report.matchedRecords} bus GPS pings across ${report.updatedSegmentIds.length} Delhi roads!`
        );
      } catch {
        showToast('Could not read file. Please upload a valid CSV or GTFS-RT JSON file.');
      }
    },
    [syncFromEngine, showToast]
  );

  const handleRunSampleCsv = useCallback(() => {
    const csv = generateSampleDelhiCsv(simRef.current!.getSimTimeMs());
    handleIngestFileText('delhi_sample.csv', csv);
  }, [handleIngestFileText]);

  const handleDownloadSampleCsv = useCallback(() => {
    const csv = generateSampleDelhiCsv(simRef.current!.getSimTimeMs());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delhi_bus_gps_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportGeoJson = useCallback(() => {
    const geoJson = exportTrafficGeoJson(
      modelRef.current!.getStateRecord(),
      simRef.current!.getSimTimeMs()
    );
    const blob = new Blob([geoJson], { type: 'application/geo+json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smarttransit_delhi_${formatSimClock(simRef.current!.getSimTimeMs()).replace(':', '')}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded live Delhi transit traffic & crowd model as GeoJSON.');
  }, [showToast]);

  const handleUserLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('smarttransit_user', JSON.stringify(user));
    } catch {}
    showToast(`🇮🇳 Connected to Delhi Transit Stack as ${user.name}`);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('smarttransit_user');
    } catch {}
    showToast('Signed out of Delhi Transit session.');
  };

  const handleTrackBus = (vehicleId: string) => {
    setTrackedBusId(vehicleId);
    setShowMapInAllBuses(true);
    setIsHudMinimized(false);
    const bus = buses.find((b) => b.vehicleId === vehicleId);
    if (bus) {
      showToast(`🎯 Live tracking Bus ${bus.routeShortName} (${bus.vehicleId}) on Delhi Map!`);
    }
  };

  // 1. Language Selection Gate (Audit requirement: user gets language option first before entering app)
  if (!hasChosenLanguage) {
    return (
      <LanguageSelectScreen
        currentLang={lang}
        onSelectLanguage={(chosen) => {
          setLang(chosen);
          setHasChosenLanguage(true);
        }}
      />
    );
  }

  // 2. Commuter Auth Gate
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={handleUserLogin}
        lang={lang}
        onChangeLang={(chosen) => setLang(chosen)}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#07090e] text-white font-sans select-none">
      {/* 1. TOP NAVBAR (Exact Screenshot Header) */}
      <header className="h-[62px] bg-[#0c0e14] border-b border-[#1c2232] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-30 text-white select-none">
        {/* Left: Neon Volt Rounded Square Logo + SMARTTRANSITAI + DELHI Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setPage('ALL_BUSES');
              setShowMapInAllBuses(false);
              setTrackedBusId(null);
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.4)] group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-lg sm:text-[19px] tracking-tight uppercase text-white leading-none">
                SMARTTRANSIT<span className="text-[#CCFF00]">AI</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-[#151923] text-slate-300 border border-[#252c3e]">
                DELHI
              </span>
              <button
                type="button"
                onClick={() => setPage('ABOUT')}
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-[#141b29] hover:bg-[#CCFF00] text-slate-300 hover:text-black border border-[#26354f] transition-all cursor-pointer shadow-sm"
                title="View Transport Stack Hackathon 2026 Datasets & Solutions"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                <span>HACKATHON 2026</span>
              </button>
            </div>
          </button>

          {/* Capsule Search Input: "Find your bus or stop..." */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-[#121620] hover:bg-[#161c2b] border border-[#242c3e] hover:border-[#CCFF00] rounded-full text-left transition-all cursor-pointer w-52 lg:w-68 group ml-1"
          >
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#CCFF00] transition-colors" />
            <span className="text-xs text-slate-400 group-hover:text-white font-medium truncate">
              Find your bus or stop...
            </span>
          </button>
        </div>

        {/* Center: 4 Navigation Tabs */}
        <nav className="flex items-center bg-[#121620] border border-[#242c3e] rounded-full p-1 gap-1">
          {(
            [
              { id: 'PLANNER', label: lang === 'hi' ? 'यात्रा योजना' : 'JOURNEY PLANNER', icon: RouteIcon },
              { id: 'ALL_BUSES', label: lang === 'hi' ? 'सभी बसें' : 'ALL BUSES', icon: Bus },
              { id: 'TRAFFIC', label: lang === 'hi' ? 'ट्रांजिट रडार' : 'TRANSIT RADAR', icon: Activity },
              { id: 'ABOUT', label: lang === 'hi' ? 'हैकथॉन स्टैक' : 'HACKATHON STACK', icon: BookOpen },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = page === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPage(tab.id);
                  setSelectedSegmentId(null);
                  setSelectedStopId(null);
                  if (tab.id === 'ALL_BUSES') {
                    setShowMapInAllBuses(false);
                  }
                  setIsSidebarOpen(true);
                }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#CCFF00] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: User Profile & Controls Capsule */}
        <div className="flex items-center gap-2">
          {/* Language Toggle: EN / हिन्दी */}
          <button
            type="button"
            onClick={() => {
              const next = lang === 'en' ? 'hi' : 'en';
              setLang(next);
              showToast(next === 'hi' ? 'हिन्दी भाषा सक्रिय की गई।' : 'Switched to English.');
            }}
            aria-label="Toggle language between English and Hindi"
            title="English / हिन्दी"
            className="px-2.5 py-1 rounded-full bg-[#121620] hover:bg-[#1a2130] text-xs font-mono font-bold text-slate-300 hover:text-[#CCFF00] border border-[#242c3e] transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'हिन्दी' : 'ENG'}
          </button>

          {/* Mobile Search Icon */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden w-8 h-8 rounded-full bg-[#121620] text-slate-300 hover:text-[#CCFF00] flex items-center justify-center border border-[#242c3e]"
            title="Search Buses"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Help & Guide Button */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            aria-label="Open Help & Transit Guide"
            title="Help, Data Freshness & Feedback"
            className="w-8 h-8 rounded-full bg-[#121620] hover:bg-[#1a2130] text-slate-300 hover:text-[#CCFF00] flex items-center justify-center border border-[#242c3e] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Prominent Ticket / E-Pass Capsule Button */}
          <button
            type="button"
            onClick={() => handleOpenTicketModal()}
            className="flex items-center gap-1.5 bg-[#141b2a] hover:bg-[#1f283c] border border-[#2e3b56] hover:border-[#CCFF00] px-3 py-1 rounded-full text-xs transition-all cursor-pointer group text-[#CCFF00] shadow-sm active:scale-95"
            title={lang === 'hi' ? 'डीटीसी ई-टिकट एवं पास खोलें' : 'Open DTC Digital Bus Ticket & Pass'}
          >
            <Ticket className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="font-mono font-bold tracking-wider text-xs text-white group-hover:text-[#CCFF00]">
              {lang === 'hi' ? 'टिकट' : 'TICKET'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse hidden sm:inline-block" />
          </button>

          {/* User Profile Pill */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 bg-[#121620] hover:bg-[#161c2b] border border-[#242c3e] hover:border-[#CCFF00] px-3 py-1 rounded-full text-xs transition-all cursor-pointer group"
            title="View Commuter Profile & Pass"
          >
            <div className="w-6 h-6 rounded-full bg-[#CCFF00] text-black flex items-center justify-center font-black text-xs">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-left font-mono">
              <span className="text-white group-hover:text-[#CCFF00] font-bold text-xs leading-none">
                {currentUser.name || 'Rahul Verma'}
              </span>
              <span className="text-[10px] text-slate-400 font-normal leading-none">
                • {currentUser.passId || 'DL-DTC-84920'}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* 2. SUBHEADER CAPSULE BAR (6 Pills matching Screenshot) */}
      <QuickServicesBar
        activeTab={page}
        onOpenTicket={() => handleOpenTicketModal()}
        onOpenAllBuses={() => {
          setPage('ALL_BUSES');
          setShowMapInAllBuses(false);
          setIsSidebarOpen(true);
        }}
        onOpenPlanner={() => {
          setPage('PLANNER');
          setTrackedBusId(null);
          setIsSidebarOpen(true);
        }}
        onOpenStopArrivals={() => {
          setSelectedStopId('iiit_delhi');
          setPage('TRAFFIC');
          setIsSidebarOpen(true);
          showToast('Opened Live Stop Arrivals for Okhla Ph-III stop.');
        }}
        onOpenCrowdRadar={() => {
          setPage('PLANNER');
          setPreference('COMFORT');
          setIsSidebarOpen(true);
          showToast('Switched to Crowd Radar & Comfort Routing.');
        }}
        onOpenTrafficDelay={() => {
          setPage('TRAFFIC');
          handleToggleIncident('inc_ashram');
          setIsSidebarOpen(true);
        }}
        lang={lang}
      />

      {/* 3. MAIN BODY CONTENT */}
      {page === 'ABOUT' ? (
        <TransportStackHackathonView
          metrics={validationMetrics}
          busCount={buses.length}
          lastIngestion={lastIngestion}
          onGoToPlanner={() => setPage('PLANNER')}
          onGoToTraffic={() => setPage('TRAFFIC')}
          onRunSampleCsv={handleRunSampleCsv}
          onDownloadSampleCsv={handleDownloadSampleCsv}
          onExportGeoJson={handleExportGeoJson}
          lang={lang}
        />
      ) : (
        <div className="flex-1 min-h-0 relative flex overflow-hidden">
          {/* Mobile backdrop overlay when drawer is open */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-[550] bg-black/60 backdrop-blur-xs lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Left Panel Drawer (Slides inside completely; opens via Side Menu Bar or Nav Tabs) */}
          <aside
            className={`absolute inset-y-0 left-0 z-[600] w-full sm:w-[420px] xl:w-[450px] h-full shrink-0 border-r border-[#1c2232] bg-[#0b0e14] shadow-[0_0_60px_rgba(0,0,0,0.95)] transition-transform duration-300 ease-in-out flex flex-col ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
            }`}
          >
            {/* Docked Edge Collapse Handle */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              title={lang === 'hi' ? 'साइडबार बंद करें' : 'Collapse Sidebar'}
              className="hidden sm:flex absolute top-4 -right-8 w-8 h-12 bg-[#0b0e14] border-y border-r border-[#1c2232] rounded-r-xl items-center justify-center text-slate-400 hover:text-[#CCFF00] hover:bg-[#121620] cursor-pointer shadow-xl transition-colors z-50 pointer-events-auto"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {page === 'PLANNER' ? (
              <JourneyPlannerTab
                originStopId={originStopId}
                destinationStopId={destinationStopId}
                preference={preference}
                journeys={journeys}
                selectedJourneyId={activeJourney?.id ?? null}
                simTimeMs={simTimeMs}
                activeJamCount={activeJamCount}
                buses={buses}
                onChangeOrigin={setOriginStopId}
                onChangeDestination={setDestinationStopId}
                onSwapEndpoints={() => {
                  setOriginStopId(destinationStopId);
                  setDestinationStopId(originStopId);
                }}
                onChangePreference={setPreference}
                onSelectJourney={setSelectedJourneyId}
                onOpenTrafficMode={() => setPage('TRAFFIC')}
                onLiveTrackBus={handleTrackBus}
                onOpenTicket={handleOpenTicketModal}
                onClose={() => setIsSidebarOpen(false)}
                lang={lang}
              />
            ) : page === 'ALL_BUSES' ? (
              <AllBusesView
                buses={buses}
                onLiveTrackBus={handleTrackBus}
                onGoToPlanner={() => setPage('PLANNER')}
                onOpenTicket={handleOpenTicketModal}
                onClose={() => setIsSidebarOpen(false)}
                lang={lang}
              />
            ) : (
              <TrafficModelTab
                trafficStates={trafficStates}
                incidents={incidents}
                selectedSegmentId={selectedSegmentId}
                avgNetworkSpeed={avgNetworkSpeed}
                simHour={simHour}
                onToggleIncident={handleToggleIncident}
                onSelectSegment={(id) => {
                  setSelectedSegmentId(id);
                  setSelectedStopId(null);
                }}
                onGoToPlanner={() => setPage('PLANNER')}
                onClose={() => setIsSidebarOpen(false)}
              />
            )}
          </aside>

          {/* Right Main View: Rotatable 3D Bus Stage OR Interactive Delhi Map */}
          <main className="flex-1 relative w-full h-full bg-[#0a0c10] overflow-hidden">
            {/* Dedicated Docked Side Menu Bar Button (Visible when sidebar is closed) */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title={lang === 'hi' ? 'लाइव बसें सूची खोलें' : 'Open Live Buses List'}
                className="absolute top-20 left-0 z-30 group flex items-center gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-r-2xl bg-[#0e121a]/95 backdrop-blur-md border-y border-r border-[#262c3e] hover:border-[#CCFF00] shadow-[0_8px_30px_rgba(0,0,0,0.85)] cursor-pointer transition-all hover:translate-x-1 active:scale-95"
              >
                <div className="w-8 h-8 rounded-xl bg-[#CCFF00] text-black flex items-center justify-center font-black shadow-[0_0_12px_rgba(204,255,0,0.4)]">
                  <Menu className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex flex-col text-left pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                    <span className="text-xs font-mono font-black uppercase text-white tracking-wider group-hover:text-[#CCFF00]">
                      {lang === 'hi' ? 'लाइव बसें' : 'LIVE BUSES'}
                    </span>
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30">
                      {buses.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {page === 'PLANNER'
                      ? (lang === 'hi' ? 'यात्रा योजना खोलें' : 'Open Route Planner')
                      : page === 'TRAFFIC'
                      ? (lang === 'hi' ? 'ट्रैफिक रडार खोलें' : 'Open Radar Details')
                      : (lang === 'hi' ? 'पैनल खोलने के लिए क्लिक करें' : 'Click to View Fleet')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#CCFF00] transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {page === 'ALL_BUSES' && !showMapInAllBuses ? (
              <Rotatable3DBusStage
                onOpenLiveMap={() => setShowMapInAllBuses(true)}
                activeBusCount={buses.length}
                gpsSyncPercent={98.4}
              />
            ) : (
              <>
                <DelhiMap
                  mode={page === 'ALL_BUSES' ? 'PLANNER' : page}
                  trafficStates={trafficStates}
                  buses={buses}
                  activeJourney={page === 'PLANNER' ? activeJourney : null}
                  originStopId={originStopId}
                  destinationStopId={destinationStopId}
                  selectedSegmentId={selectedSegmentId}
                  trackedBusId={trackedBusId}
                  onSelectSegment={(id) => {
                    setSelectedSegmentId(id);
                    setSelectedStopId(null);
                  }}
                  onSelectStop={(id) => {
                    setSelectedStopId(id);
                    setSelectedSegmentId(null);
                  }}
                  onSelectBus={(vehicleId) => {
                    handleTrackBus(vehicleId);
                  }}
                />

                {/* If in ALL_BUSES and viewing map, provide easy button to toggle back to 3D Bus Stage */}
                {page === 'ALL_BUSES' && showMapInAllBuses && (
                  <button
                    type="button"
                    onClick={() => setShowMapInAllBuses(false)}
                    className="absolute top-4 right-4 z-[500] px-4 py-2 rounded-full bg-[#121620]/95 backdrop-blur-md border border-[#262c3e] hover:border-[#CCFF00] text-[#CCFF00] font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xl transition-all"
                  >
                    <span>SHOWCASE BUS VIEW ↺</span>
                  </button>
                )}

                {/* Floating Top Telemetry Pill */}
                <div className={`absolute top-4 ${isSidebarOpen ? 'left-4 lg:left-[470px]' : 'left-4'} z-[500] bg-[#121620]/95 backdrop-blur-md border border-[#262c3e] rounded-full px-3.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.8)] flex items-center gap-2.5 text-[11.5px] font-mono transition-all duration-300`}>
                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    title={isPlaying ? 'Pause telemetry' : 'Resume telemetry'}
                    className="w-5 h-5 rounded-full bg-[#CCFF00] text-black flex items-center justify-center cursor-pointer shadow-[0_0_8px_rgba(204,255,0,0.6)] font-bold"
                  >
                    {isPlaying ? <Pause className="w-2.5 h-2.5 stroke-[3]" /> : <Play className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_6px_#CCFF00]" />
                    {formatSimClock(simTimeMs)} IST
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300 text-[10.5px] uppercase font-bold hidden sm:inline">
                    {trackedBus
                      ? `LIVE TRACKING BUS ${trackedBus.routeShortName} (${trackedBus.vehicleId})`
                      : page === 'PLANNER'
                        ? 'ROUTE BUSES & LIVE LOADS'
                        : page === 'ALL_BUSES'
                          ? '72 BUSES ACTIVE ON DELHI CORRIDORS'
                          : `${buses.length} LIVE DELHI GPS SENSORS STREAMING`}
                  </span>
                </div>

                {/* LIVE BUS TRACKING FLOATING HUD (With on/off minimize toggle) */}
                {trackedBus && (
                  <div className={`absolute top-16 ${isSidebarOpen ? 'left-4 lg:left-[470px]' : 'left-4'} z-[520] transition-all duration-300`}>
                    {isHudMinimized ? (
                      /* Compact Minimized Tracking Bar (Commuter can reopen anytime!) */
                      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#0b0e14]/95 backdrop-blur-md border-2 border-[#CCFF00] shadow-[0_12px_36px_rgba(0,0,0,0.95)] font-mono text-white select-none animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="w-8 h-8 rounded-lg bg-[#CCFF00] text-black font-black flex items-center justify-center text-sm shadow-[0_0_12px_rgba(204,255,0,0.5)]">
                          {trackedBus.routeShortName}
                        </div>
                        <div className="flex flex-col text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">BUS {trackedBus.routeShortName}</span>
                            <span className="text-[10px] text-slate-400">({trackedBus.vehicleId})</span>
                            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                          </div>
                          <div className="text-[10.5px] text-[#CCFF00] font-bold">
                            {trackedBus.isDwelling ? 'Boarding at stop' : `${Math.round(trackedBus.speedKmh)} km/h`} • {trackedBus.nextStopName}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsHudMinimized(false)}
                          className="ml-2 px-3 py-1.5 rounded-lg bg-[#CCFF00] hover:bg-white text-black font-black text-[10.5px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-md hover:scale-105 active:scale-95"
                          title={lang === 'hi' ? 'पूरा विवरण खोलें' : 'Expand full bus telemetry details'}
                        >
                          <span>{lang === 'hi' ? 'विवरण खोलें ▲' : 'EXPAND DETAILS ▲'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrackedBusId(null)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title={lang === 'hi' ? 'ट्रैकिंग बंद करें' : 'Stop tracking bus'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      /* Full Telemetry HUD with on/off minimize option */
                      <LiveBusTrackerHud
                        bus={trackedBus}
                        trafficStates={trafficStates}
                        originStopId={originStopId}
                        destinationStopId={destinationStopId}
                        onMinimize={() => setIsHudMinimized(true)}
                        onClose={() => setTrackedBusId(null)}
                        onCenterOnBus={() => {
                          setTrackedBusId(null);
                          setTimeout(() => setTrackedBusId(trackedBus.vehicleId), 20);
                        }}
                        onSelectAnotherBus={() => setIsSearchOpen(true)}
                        onOpenTicket={handleOpenTicketModal}
                        lang={lang}
                      />
                    )}
                  </div>
                )}

                {/* Floating Inspector Card */}
                <div className="absolute bottom-4 right-4 z-[510]">
                  {selectedSegmentId && trafficStates[selectedSegmentId] && (
                    <SegmentInspectorCard
                      segmentId={selectedSegmentId}
                      state={trafficStates[selectedSegmentId]}
                      simHour={simHour}
                      onClose={() => setSelectedSegmentId(null)}
                    />
                  )}

                  {selectedStopId && (
                    <StopPisCard
                      stopId={selectedStopId}
                      buses={buses}
                      trafficStates={trafficStates}
                      onSetOrigin={(id) => {
                        setOriginStopId(id);
                        setPage('PLANNER');
                        setSelectedStopId(null);
                      }}
                      onSetDestination={(id) => {
                        setDestinationStopId(id);
                        setPage('PLANNER');
                        setSelectedStopId(null);
                      }}
                      onClose={() => setSelectedStopId(null)}
                    />
                  )}
                </div>

                {/* Bottom-Left Traffic & Crowd Legend */}
                <div className="absolute bottom-4 left-4 z-[500] bg-[#121620]/95 backdrop-blur-md border border-[#262c3e] rounded-full px-3.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.8)] flex items-center gap-3 text-[10.5px] font-mono font-bold text-slate-400 uppercase">
                  <span className="text-white">CROWD:</span>
                  <span className="inline-flex items-center gap-1 text-[#CCFF00]">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_6px_#CCFF00]" /> LOW
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#FFB800]">
                    <span className="w-2 h-2 rounded-full bg-[#FFB800]" /> MODERATE
                  </span>
                  <span className="inline-flex items-center gap-1 text-white">
                    <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_white]" /> HEAVY
                  </span>
                </div>
              </>
            )}

            {/* Toast Notification */}
            {toastMsg && (
              <div className="absolute top-4 right-4 z-[520] bg-[#121620] text-white text-[12px] font-mono font-bold px-4 py-2.5 rounded-full shadow-2xl border border-[#CCFF00] max-w-md animate-in fade-in duration-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                <span>{toastMsg}</span>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Bus Search & Live Track Modal */}
      <BusSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        buses={buses}
        onSelectBusForTracking={(bus) => {
          handleTrackBus(bus.vehicleId);
        }}
      />

      {/* User Profile & Digital Pass Modal (SmartLearn /profile exact match) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onSignOut={handleUserLogout}
        onOpenFullTicket={() => handleOpenTicketModal()}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          try {
            localStorage.setItem('smarttransit_user', JSON.stringify(user));
          } catch {}
          showToast(`Switched active profile to ${user.name}`);
        }}
      />

      {/* DTC E-Ticket & Digital Transit Pass Modal */}
      <DigitalTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        currentUser={currentUser}
        initialConfig={ticketModalConfig}
        lang={lang}
      />

      {/* Delhi Open Data & API Guide Modal */}
      <ApiGuideModal
        isOpen={isApiGuideOpen}
        onClose={() => setIsApiGuideOpen(false)}
        onRunSampleCsv={handleRunSampleCsv}
        onDownloadSampleCsv={handleDownloadSampleCsv}
        onExportGeoJson={handleExportGeoJson}
      />

      {/* Help, Feedback & Transit Guide Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}

export default App;
