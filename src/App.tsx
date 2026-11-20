import {
  Activity,
  BookOpen,
  Bus,
  Compass,
  Pause,
  Play,
  Route as RouteIcon,
  Search,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AllBusesView } from './components/AllBusesView';
import { ApiGuideModal } from './components/ApiGuideModal';
import { AuthScreen, type UserProfile } from './components/AuthScreen';
import { BusSearchModal } from './components/BusSearchModal';
import { DelhiMap } from './components/DelhiMap';
import { HowItWorksView } from './components/HowItWorksView';
import { JourneyPlannerTab } from './components/JourneyPlannerTab';
import { LiveBusTrackerHud } from './components/LiveBusTrackerHud';
import { SegmentInspectorCard, StopPisCard } from './components/MapInspectors';
import { QuickServicesBar } from './components/QuickServicesBar';
import { TrafficModelTab } from './components/TrafficModelTab';
import { UserProfileModal } from './components/UserProfileModal';
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

const TIME_SLOTS = [
  { label: 'Morning Peak', hour: 9.0 },
  { label: 'Afternoon', hour: 14.0 },
  { label: 'Evening Rush', hour: 18.25 },
];

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
  const [page, setPage] = useState<AppPage>('PLANNER');

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

  const handleSetTimeSlot = useCallback(
    (hour: number) => {
      simRef.current!.setSimHour(hour);
      simRef.current!.warmup(10, 4);
      syncFromEngine();
    },
    [syncFromEngine]
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
    const bus = buses.find((b) => b.vehicleId === vehicleId);
    if (bus) {
      showToast(`🎯 Live tracking Bus ${bus.routeShortName} (${bus.vehicleId}) on Delhi Map!`);
    }
  };

  // If user hasn't signed in yet, render the dedicated SmartLearn-style Login / Onboarding screen!
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleUserLogin} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#000000] text-white font-sans select-none">
      {/* 1. TOP MARQUEE TICKER (SNKS Neon Volt Style) */}
      <div className="bg-[#CCFF00] text-black font-mono font-black text-[10.5px] sm:text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between tracking-wider uppercase shrink-0 border-b border-black select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-black animate-ping" />
          <span>⚡ LIVE DELHI TRANSIT STACK — REAL-TIME GPS BUS TRACKING</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px]">
          <span>72 ACTIVE ELECTRIC &amp; CNG BUSES</span>
          <span>•</span>
          <span>KALMAN DELAY MODEL</span>
          <span>•</span>
          <span>SEAT RADAR</span>
        </div>
        <button
          type="button"
          onClick={() => setIsApiGuideOpen(true)}
          className="hover:underline flex items-center gap-1 font-black cursor-pointer"
        >
          <span>GET API ACCESS ↗</span>
        </button>
      </div>

      {/* 2. BRUTALIST TOP NAVBAR (64px) */}
      <header className="h-[64px] bg-[#000000] border-b border-[#222222] px-4 sm:px-8 flex items-center justify-between gap-3 shrink-0 z-30 text-white select-none">
        {/* Brand Logo with Heavy Bold Grotesque Wordmark (SNKS Style) */}
        <button
          type="button"
          onClick={() => {
            setPage('PLANNER');
            setTrackedBusId(null);
          }}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 bg-[#CCFF00] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.4)] group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[22px] tracking-tighter uppercase text-white leading-none">
                SmartTransit<span className="text-[#CCFF00]">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-wider uppercase bg-[#141414] text-[#CCFF00] border border-[#333333]">
                DELHI
              </span>
            </div>
          </div>
        </button>

        {/* Global Bus & Route Search Bar */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-[#111111] hover:bg-[#161616] border border-[#262626] hover:border-[#CCFF00] text-left transition-all cursor-pointer w-60 lg:w-76 group"
        >
          <Search className="w-3.5 h-3.5 text-[#666666] group-hover:text-[#CCFF00] transition-colors" />
          <span className="text-xs text-[#8E8E93] group-hover:text-white font-medium truncate">
            Find your bus or stop (e.g. 534)...
          </span>
          <kbd className="hidden lg:inline text-[9px] font-mono bg-[#1A1A1A] px-1.5 py-0.5 text-[#8E8E93] ml-auto border border-[#333333] font-bold">
            ⌘K
          </kbd>
        </button>

        {/* 4 Main Navigation Tabs (SNKS Pill Container Style) */}
        <nav className="flex items-center bg-[#111111] border border-[#262626] rounded-full p-1 gap-1">
          {(
            [
              { id: 'PLANNER', label: 'JOURNEY PLANNER', icon: RouteIcon },
              { id: 'ALL_BUSES', label: 'ALL BUSES', icon: Bus },
              { id: 'TRAFFIC', label: 'TRANSIT RADAR', icon: Activity },
              { id: 'ABOUT', label: 'DATA STACK', icon: BookOpen },
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
                }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#CCFF00] text-black shadow-sm'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden w-8 h-8 bg-[#111111] text-white hover:text-[#CCFF00] flex items-center justify-center border border-[#262626]"
            title="Search Buses"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Time of Day Slots */}
          <div className="hidden xl:flex items-center bg-[#111111] border border-[#262626] p-0.5 gap-1">
            {TIME_SLOTS.map((slot) => {
              const isNear = Math.abs(simHour - slot.hour) < 1.3;
              return (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => handleSetTimeSlot(slot.hour)}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    isNear
                      ? 'bg-[#CCFF00] text-black'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>

          {/* Wallet / Pass Pill (Matches BAG 0 from SNKS screenshot) */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#111111] border border-[#262626] text-xs font-mono font-bold text-white">
            <span className="text-[#8E8E93]">WALLET</span>
            <span className="bg-[#CCFF00] text-black font-black px-1.5 py-0.2 rounded-full text-[10.5px]">
              ₹ 58.78
            </span>
          </div>

          {/* Clickable User Profile Pill */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 bg-[#111111] hover:bg-[#161616] border border-[#262626] hover:border-[#CCFF00] px-2.5 py-1 text-[11px] transition-all cursor-pointer group"
            title="View Commuter Profile & Pass"
          >
            <div className="w-6 h-6 bg-[#CCFF00] text-black flex items-center justify-center font-black text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-white group-hover:text-[#CCFF00] font-black uppercase text-[11px] leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[9px] text-[#8E8E93] font-mono font-bold leading-tight">
                {currentUser.passId}
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* COMMUTER SESSION BANNER */}
      <div className="bg-[#0A0A0A] text-white px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#1F1F1F] shrink-0 font-mono">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#141414] border border-[#333333] text-[#CCFF00] text-[9.5px] font-black uppercase tracking-wider mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse"></span>
            <span>DELHI TRANSIT STACK • LIVE SESSION</span>
          </div>
          <div className="text-xs sm:text-[13px] font-bold">
            WELCOME, <span className="text-[#CCFF00] uppercase">{currentUser.name}</span>
            <span className="text-[#8E8E93] font-normal text-xs ml-2 hidden sm:inline">
              PASS: <strong className="text-white font-mono">{currentUser.passId}</strong> •
              CORRIDOR: {currentUser.corridor || 'Okhla Phase-III ↔ AIIMS'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setPage('ALL_BUSES');
              setIsSearchOpen(true);
            }}
            className="px-4 py-1.5 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Search Buses &amp; Live Track ↗</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#161616] text-white border border-[#262626] hover:border-[#CCFF00] text-xs font-mono font-bold uppercase inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Profile / Pass</span>
          </button>
        </div>
      </div>

      {/* QUICK SERVICES DOCK (SmartLearn Pastel Palette) */}
      <QuickServicesBar
        activeTab={page}
        onOpenPlanner={() => {
          setPage('PLANNER');
          setTrackedBusId(null);
        }}
        onOpenLiveTrackSearch={() => {
          setPage('ALL_BUSES');
          setIsSearchOpen(true);
        }}
        onOpenStopArrivals={() => {
          setSelectedStopId('iiit_delhi');
          setPage('TRAFFIC');
          showToast('Opened Live Passenger Information System (PIS) for Okhla Ph-III stop.');
        }}
        onOpenCrowdRadar={() => {
          setPage('PLANNER');
          setPreference('COMFORT');
          showToast('Switched to Crowd Radar & Comfort Mode (Problem 02).');
        }}
        onOpenJamSimulator={() => {
          setPage('TRAFFIC');
          handleToggleIncident('inc_ashram');
        }}
        onOpenApiGuide={() => setIsApiGuideOpen(true)}
      />

      {/* BODY CONTENT */}
      {page === 'ABOUT' ? (
        <HowItWorksView
          metrics={validationMetrics}
          busCount={buses.length}
          lastIngestion={lastIngestion}
          onGoToPlanner={() => setPage('PLANNER')}
          onGoToTraffic={() => setPage('TRAFFIC')}
          onIngestFileText={handleIngestFileText}
          onRunSampleCsv={handleRunSampleCsv}
          onDownloadSampleCsv={handleDownloadSampleCsv}
          onExportGeoJson={handleExportGeoJson}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel */}
          <aside className="w-full lg:w-[450px] h-[52vh] lg:h-full shrink-0 border-b lg:border-b-0 lg:border-r border-[#222736] bg-[#0B0C10] overflow-hidden z-20">
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
              />
            ) : page === 'ALL_BUSES' ? (
              <AllBusesView
                buses={buses}
                onLiveTrackBus={handleTrackBus}
                onGoToPlanner={() => setPage('PLANNER')}
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
              />
            )}
          </aside>

          {/* Map Main View */}
          <main className="flex-1 relative min-h-[48vh] lg:min-h-0">
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

            {/* Floating Top Telemetry Pill */}
            <div className="absolute top-4 left-4 z-[500] bg-[#0E0E0E]/95 backdrop-blur-md border border-[#262626] px-3.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.8)] flex items-center gap-2.5 text-[11.5px] font-mono">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                title={isPlaying ? 'Pause telemetry' : 'Resume telemetry'}
                className="w-6 h-6 bg-[#CCFF00] text-black flex items-center justify-center cursor-pointer shadow-[0_0_8px_rgba(204,255,0,0.6)] font-bold"
              >
                {isPlaying ? <Pause className="w-3 h-3 stroke-[3]" /> : <Play className="w-3 h-3 stroke-[3]" />}
              </button>
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_6px_#CCFF00]" />
                {formatSimClock(simTimeMs)} IST
              </span>
              <span className="text-[#333333]">|</span>
              <span className="text-[#8E8E93] text-[10.5px] uppercase font-bold hidden sm:inline">
                {trackedBus
                  ? `LIVE TRACKING BUS ${trackedBus.routeShortName} (${trackedBus.vehicleId})`
                  : page === 'PLANNER'
                    ? 'ROUTE BUSES & LIVE LOADS'
                    : page === 'ALL_BUSES'
                      ? '72 BUSES ACTIVE ON DELHI CORRIDORS'
                      : `${buses.length} LIVE DELHI GPS SENSORS STREAMING`}
              </span>
            </div>

            {/* LIVE BUS TRACKING FLOATING HUD */}
            {trackedBus && (
              <div className="absolute top-16 left-4 z-[520]">
                <LiveBusTrackerHud
                  bus={trackedBus}
                  trafficStates={trafficStates}
                  onClose={() => setTrackedBusId(null)}
                  onCenterOnBus={() => {
                    setTrackedBusId(null);
                    setTimeout(() => setTrackedBusId(trackedBus.vehicleId), 20);
                  }}
                  onSelectAnotherBus={() => setIsSearchOpen(true)}
                />
              </div>
            )}

            {/* Toast Notification */}
            {toastMsg && (
              <div className="absolute top-4 right-4 z-[520] bg-[#0E0E0E] text-white text-[12px] font-mono font-bold px-4 py-2.5 shadow-2xl border border-[#CCFF00] max-w-md animate-in fade-in duration-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00]" />
                <span>{toastMsg}</span>
              </div>
            )}

            {/* Bottom-Left Traffic & Crowd Legend (NO RED!) */}
            <div className="absolute bottom-4 left-4 z-[500] bg-[#0E0E0E]/95 backdrop-blur-md border border-[#262626] px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.8)] flex items-center gap-3 text-[10.5px] font-mono font-bold text-[#8E8E93] uppercase">
              <span className="text-white inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#CCFF00]" /> CROWD:
              </span>
              <span className="inline-flex items-center gap-1 text-[#CCFF00]">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_6px_#CCFF00]" /> LOW
              </span>
              <span className="inline-flex items-center gap-1 text-[#FFB800]">
                <span className="w-2 h-2 rounded-full bg-[#FFB800]" /> MODERATE
              </span>
              <span className="inline-flex items-center gap-1 text-white">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_white]" /> HEAVY LOAD
              </span>
            </div>

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
        onSwitchUser={(user) => {
          setCurrentUser(user);
          try {
            localStorage.setItem('smarttransit_user', JSON.stringify(user));
          } catch {}
          showToast(`Switched active profile to ${user.name}`);
        }}
      />

      {/* Delhi Open Data & API Guide Modal */}
      <ApiGuideModal
        isOpen={isApiGuideOpen}
        onClose={() => setIsApiGuideOpen(false)}
        onRunSampleCsv={handleRunSampleCsv}
        onDownloadSampleCsv={handleDownloadSampleCsv}
        onExportGeoJson={handleExportGeoJson}
      />
    </div>
  );
}

export default App;
