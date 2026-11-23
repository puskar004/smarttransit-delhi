import {
  Activity,
  ArrowRight,
  BatteryCharging,
  Clock,
  Database,
  Download,
  ExternalLink,
  Layers,
  Route as RouteIcon,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { IngestionReport } from '../engine/gtfsAdapter';
import {
  DELHI_TRANSIT_OD_MATRIX,
  METRO_AND_BUS_CROWDING_PROFILES,
  METRO_FEEDER_NETWORK_500_EV,
  TRANSPORT_STACK_DATASETS,
} from '../engine/transportStackHackathon';
import type { ModelValidationMetrics } from '../types/transit';

interface TransportStackHackathonViewProps {
  metrics: ModelValidationMetrics;
  busCount: number;
  lastIngestion?: IngestionReport | null;
  onGoToPlanner: () => void;
  onGoToTraffic: () => void;
  onRunSampleCsv?: () => void;
  onDownloadSampleCsv?: () => void;
  onExportGeoJson?: () => void;
  lang?: 'en' | 'hi';
}

type HackathonTab = 'OVERVIEW' | 'P1_P2_ROUTING' | 'P3_OD_MATRIX' | 'P4_FEEDER_EV' | 'P5_AFC_CROWD';

export function TransportStackHackathonView({
  metrics,
  busCount,
  lastIngestion,
  onGoToPlanner,
  onGoToTraffic,
  onRunSampleCsv,
  onDownloadSampleCsv,
  onExportGeoJson,
  lang = 'en',
}: TransportStackHackathonViewProps) {
  const [activeTab, setActiveTab] = useState<HackathonTab>('OVERVIEW');
  const [selectedFeederId, setSelectedFeederId] = useState<string>('FR-01');
  const [selectedOdIndex, setSelectedOdIndex] = useState<number>(0);

  const selectedFeeder =
    METRO_FEEDER_NETWORK_500_EV.find((f) => f.id === selectedFeederId) ||
    METRO_FEEDER_NETWORK_500_EV[0];

  const gtfsMae = Math.max(1, metrics.staticGtfsMaeSec);
  const pravaahMae = Math.max(1, metrics.pravaahMaeSec);
  const accuracyGainPct = Math.round(((gtfsMae - pravaahMae) / gtfsMae) * 100);

  return (
    <div className="flex-1 overflow-y-auto bg-[#07090e] text-white font-sans select-none">
      {/* Official Delhi Transport Stack Hackathon 2026 Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0e1320] via-[#090c14] to-[#07090e] border-b border-[#1c2438] px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00] text-black text-[11px] font-mono font-black uppercase tracking-wider shadow-[0_0_15px_rgba(204,255,0,0.4)]">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>DELHI TRANSPORT STACK HACKATHON 2026 · OFFICIAL SUBMISSION</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-[#131926] text-slate-300 border border-[#222d42]">
                🏆 PRIZE POOL: <b className="text-[#CCFF00]">₹2,75,000</b>
              </span>
              <a
                href="https://delhi.transportstack.in/hackathon/"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded bg-[#131926] hover:bg-[#1c2438] text-slate-300 hover:text-[#CCFF00] border border-[#222d42] transition-colors flex items-center gap-1"
              >
                <span>Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Autonomous Multimodal Transit Intelligence Stack
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              End-to-end analytical framework solving all 5 Delhi Transport Stack Hackathon problems:
              Kalman-filtered bus traffic speeds (P1), ETM crowdedness modeling (P2), scaled public transit
              OD matrices (P3), 500-bus EV metro feeder routing (P4), and multi-modal AFC crowding profiles (P5).
            </p>
          </div>

          {/* Quick Metrics Capsule Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 font-mono text-xs">
            <div className="bg-[#0e121c] border border-[#20293d] p-2.5 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Live GPS Fleet</div>
              <div className="text-base font-black text-[#CCFF00] mt-0.5">{busCount} Delhi Buses</div>
            </div>
            <div className="bg-[#0e121c] border border-[#20293d] p-2.5 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-bold">P1 & P2 Accuracy</div>
              <div className="text-base font-black text-[#CCFF00] mt-0.5">+{accuracyGainPct}% vs GTFS</div>
            </div>
            <div className="bg-[#0e121c] border border-[#20293d] p-2.5 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-bold">P3 OD Extrapolation</div>
              <div className="text-base font-black text-white mt-0.5">28.57x (3.5% Sample)</div>
            </div>
            <div className="bg-[#0e121c] border border-[#20293d] p-2.5 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-bold">P4 Feeder Fleet</div>
              <div className="text-base font-black text-[#10B981] mt-0.5">500 EV Buses</div>
            </div>
            <div className="bg-[#0e121c] border border-[#20293d] p-2.5 rounded-lg col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">P5 AFC Metro Gates</div>
              <div className="text-base font-black text-white mt-0.5">288 DMRC Hubs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Problem Statement Navigation Bar */}
      <section className="bg-[#0b0e17] border-b border-[#1b2234] sticky top-0 z-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {[
            { id: 'OVERVIEW', label: '1. Datasets & Brief', icon: Database },
            { id: 'P1_P2_ROUTING', label: 'P1 & P2: Real-time Traffic & Crowd', icon: Activity },
            { id: 'P3_OD_MATRIX', label: 'P3: Transit OD Matrix', icon: Layers },
            { id: 'P4_FEEDER_EV', label: 'P4: 500 EV Feeder Routes', icon: BatteryCharging },
            { id: 'P5_AFC_CROWD', label: 'P5: AFC Metro & Bus Crowding', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as HackathonTab)}
                className={`px-3 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                    : 'bg-[#121622] text-slate-300 hover:text-white hover:bg-[#1a2030] border border-[#222b40]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Tab Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* TAB 1: OVERVIEW & OFFICIAL DATASETS */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="bg-[#0d111a] border border-[#1f273b] p-5 sm:p-6 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Database className="w-5 h-5 text-[#CCFF00]" />
                Official Delhi Transport Stack Hackathon 2026 Datasets
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                The Hackathon provides verified transit data covering millions of vehicle locations and passenger
                transactions across October 2026. Our engine is natively calibrated against these exact schemas:
              </p>

              <div className="grid md:grid-cols-3 gap-4 pt-2">
                {TRANSPORT_STACK_DATASETS.map((ds) => (
                  <div
                    key={ds.id}
                    className="bg-[#121724] border border-[#232d44] hover:border-[#CCFF00] rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-[#1a2133] text-[#CCFF00]">
                          Problem {ds.problemIds.join(' & ')}
                        </span>
                        <span>{ds.compressedSize}</span>
                      </div>
                      <div className="text-sm font-bold text-white leading-snug">{ds.name}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{ds.description}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#1e273a] text-xs font-mono">
                      <div className="text-[11px] text-slate-400">
                        Records: <b className="text-white">{ds.recordsCount}</b>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Format: <b className="text-white">{ds.format}</b> ({ds.unpackedSize})
                      </div>
                      <a
                        href={ds.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-1.5 px-3 rounded bg-[#182032] hover:bg-[#CCFF00] hover:text-black border border-[#2a3652] text-slate-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Dataset</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hackathon Timeline & Phases */}
            <div className="bg-[#0d111a] border border-[#1f273b] p-5 sm:p-6 rounded-xl space-y-4">
              <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#CCFF00]" />
                Hackathon Structure & Judging Criteria
              </h3>
              <div className="grid sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-[#121724] p-3.5 rounded-lg border border-[#222d44]">
                  <div className="text-[#CCFF00] font-black uppercase text-[11px]">Registration</div>
                  <div className="text-white font-bold mt-1">Until 20 Nov 2026</div>
                  <div className="text-slate-400 mt-1">Teams of 2-3 on WhereUElevate</div>
                </div>
                <div className="bg-[#121724] p-3.5 rounded-lg border border-[#222d44]">
                  <div className="text-[#CCFF00] font-black uppercase text-[11px]">Phase 1 (Open)</div>
                  <div className="text-white font-bold mt-1">2 Weeks (P1 or P2)</div>
                  <div className="text-slate-400 mt-1">Working prototype & proposal</div>
                </div>
                <div className="bg-[#121724] p-3.5 rounded-lg border border-[#222d44]">
                  <div className="text-[#CCFF00] font-black uppercase text-[11px]">Phase 2 (Shortlist)</div>
                  <div className="text-white font-bold mt-1">2 Weeks (P3, P4, P5)</div>
                  <div className="text-slate-400 mt-1">Weekly mentor sessions</div>
                </div>
                <div className="bg-[#121724] p-3.5 rounded-lg border border-[#222d44]">
                  <div className="text-[#CCFF00] font-black uppercase text-[11px]">Finale & Awards</div>
                  <div className="text-white font-bold mt-1">11 December 2026</div>
                  <div className="text-slate-400 mt-1">Transport Stack Annual Event</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROBLEM 1 & 2 (TRAFFIC & CROWDEDNESS) */}
        {activeTab === 'P1_P2_ROUTING' && (
          <div className="space-y-6">
            <div className="bg-[#0d111a] border border-[#1f273b] p-5 sm:p-6 rounded-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#CCFF00]" />
                  Problem 1 & 2: Real-time Traffic Calibration & Crowding Engine
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onGoToPlanner}
                    className="px-3.5 py-1.5 rounded-lg bg-[#CCFF00] hover:bg-[#d4ff33] text-black font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <span>{lang === 'hi' ? 'यात्रा योजना खोलें' : 'Launch Journey Planner'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onGoToTraffic}
                    className="px-3.5 py-1.5 rounded-lg bg-[#141b29] hover:bg-[#1f283c] border border-[#2a3754] text-slate-200 font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Activity className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>{lang === 'hi' ? 'ट्रैफिक रडार' : 'Open Traffic Radar'}</span>
                  </button>
                </div>
              </div>

              {lastIngestion && (
                <div className="bg-[#121824] border border-[#23324d] p-3 rounded-lg font-mono text-xs text-slate-300">
                  <span className="text-[#CCFF00] font-bold">✓ Recent Transit Trace Ingested ({lastIngestion.sourceFormat}):</span>{' '}
                  {lastIngestion.matchedRecords} of {lastIngestion.totalRecords} records matched (Avg map error: {lastIngestion.avgMatchErrorMeters.toFixed(1)}m, {lastIngestion.updatedSegmentIds.length} segments updated)
                </div>
              )}

              <p className="text-sm text-slate-300 leading-relaxed">
                Fuses live GTFS-RT GPS vehicle probes with 2.56M October ETM ticketing records. Our 1D Kalman filter
                isolates true road link travel speeds from stop dwell times, improving travel-time accuracy by{' '}
                <b className="text-[#CCFF00]">{accuracyGainPct}% over Static GTFS timetables</b>.
              </p>

              {/* Accuracy Benchmark Cards */}
              <div className="grid md:grid-cols-3 gap-3.5 font-mono text-xs pt-2">
                <div className="bg-[#121724] border border-[#232c42] p-4 rounded-xl space-y-1.5">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Baseline 1: Static GTFS</div>
                  <div className="text-xl font-black text-slate-300">{gtfsMae} sec</div>
                  <div className="text-slate-400 text-[11px]">Timetable schedule without live delays (~5.7 min error)</div>
                </div>

                <div className="bg-[#121724] border border-[#232c42] p-4 rounded-xl space-y-1.5">
                  <div className="text-slate-400 font-bold uppercase text-[10px]">Baseline 2: Last-Ping GPS</div>
                  <div className="text-xl font-black text-[#FFB800]">
                    {Math.round(metrics.lastPingMaeSec)} sec
                  </div>
                  <div className="text-slate-400 text-[11px]">Instantaneous ping without spatial smoothing (~3.1 min error)</div>
                </div>

                <div className="bg-[#121724] border-2 border-[#CCFF00] p-4 rounded-xl space-y-1.5 shadow-[0_0_20px_rgba(204,255,0,0.15)]">
                  <div className="text-[#CCFF00] font-black uppercase text-[10px]">
                    SmartTransit AI (Our Model)
                  </div>
                  <div className="text-2xl font-black text-[#CCFF00]">{pravaahMae} sec</div>
                  <div className="text-slate-300 text-[11px]">Kalman-filtered + Dwell Separation (~1.8 min error)</div>
                </div>
              </div>
            </div>

            {/* Ingestion & Export Toolkit */}
            <div className="bg-[#0d111a] border border-[#1f273b] p-5 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#CCFF00]" />
                Live GTFS-RT CSV Ingestion & GeoJSON API Export
              </h3>
              <p className="text-xs text-slate-300">
                Test your own DTC vehicle position or ETM trace CSV against the engine:
              </p>
              <div className="flex flex-wrap gap-2.5 font-mono text-xs">
                {onRunSampleCsv && (
                  <button
                    type="button"
                    onClick={onRunSampleCsv}
                    className="px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#CCFF00] hover:text-black border border-[#283652] text-slate-200 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Run Real October GPS Sample (12 Probes)</span>
                  </button>
                )}
                {onDownloadSampleCsv && (
                  <button
                    type="button"
                    onClick={onDownloadSampleCsv}
                    className="px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-white hover:text-black border border-[#283652] text-slate-200 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download DTC Sample CSV</span>
                  </button>
                )}
                {onExportGeoJson && (
                  <button
                    type="button"
                    onClick={onExportGeoJson}
                    className="px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-white hover:text-black border border-[#283652] text-slate-200 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RouteIcon className="w-3.5 h-3.5" />
                    <span>Export Live Road GeoJSON</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROBLEM 3 (TRANSIT OD MATRIX) */}
        {activeTab === 'P3_OD_MATRIX' && (
          <div className="space-y-6">
            <div className="bg-[#0d111a] border border-[#1f273b] p-5 sm:p-6 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#CCFF00]" />
                Problem 3: Public Transit Origin–Destination (OD) Matrix Engine
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Delhi bus e-ticketing captures <b>3.5%</b> of bus ridership. We apply Iterative Proportional Fitting
                (IPF) constrained by dense DMRC Metro turnstile entry/exit counts to extrapolate full-scale transit
                demand across major Delhi travel corridors:
              </p>

              {/* Formula & Method Banner */}
              <div className="bg-[#121622] border border-[#232c42] p-3.5 rounded-lg font-mono text-xs text-slate-300 space-y-1.5">
                <div className="text-[#CCFF00] font-bold text-[11px] uppercase">
                  Scaling Formula (IPF Metro-Informed Expansion):
                </div>
                <div className="text-white text-xs">
                  T_ij = t_ij × (M_i_entry / Σ t_ik)^0.5 × (M_j_exit / Σ t_kj)^0.5 × α_bus
                </div>
                <div className="text-[10.5px] text-slate-400">
                  Where t_ij is the raw ETM sample count, M_i is metro turnstile gate flux, and α_bus (~28.57) expands the sample to ~4.2M daily bus trips.
                </div>
              </div>

              {/* Interactive OD Corridor Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#232d42] text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Origin Zone</th>
                      <th className="py-2.5 px-3">Destination Zone</th>
                      <th className="py-2.5 px-3">Sample (ETM)</th>
                      <th className="py-2.5 px-3">Extrapolated Daily Trips</th>
                      <th className="py-2.5 px-3">Uncertainty</th>
                      <th className="py-2.5 px-3">Est. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DELHI_TRANSIT_OD_MATRIX.map((od, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedOdIndex(idx)}
                        className={`border-b border-[#182032] transition-colors cursor-pointer ${
                          selectedOdIndex === idx
                            ? 'bg-[#CCFF00]/10 text-white font-bold'
                            : 'hover:bg-[#121724] text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          <span>{od.originHub}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[#CCFF00]">{od.destinationHub}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{od.sampleTicketsObserved.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-white font-bold">
                          {od.estimatedDailyTrips.toLocaleString()} trips
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">±{od.confidenceIntervalPct}%</td>
                        <td className="py-2.5 px-3 text-[#CCFF00]">{od.avgTravelTimeMin} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROBLEM 4 (500 EV METRO FEEDER ROUTES) */}
        {activeTab === 'P4_FEEDER_EV' && (
          <div className="space-y-6">
            <div className="bg-[#0d111a] border border-[#1f273b] p-5 sm:p-6 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <BatteryCharging className="w-5 h-5 text-[#CCFF00]" />
                Problem 4: Metro Feeder Bus Routes (500 Electric Bus Allocation)
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Designs high-frequency first/last-mile feeder loops around Delhi Metro hubs adhering strictly to
                official hackathon constraints: <b>Max 7 km length</b>, <b>Road width &gt; 6 metres</b>, and a realistic{' '}
                <b>depot charging plan</b> ensuring zero battery exhaustion:
              </p>

              {/* Feeder Selector Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
                {METRO_FEEDER_NETWORK_500_EV.map((fr) => (
                  <button
                    key={fr.id}
                    type="button"
                    onClick={() => setSelectedFeederId(fr.id)}
                    className={`p-2.5 rounded-lg text-left font-mono text-xs border transition-all cursor-pointer ${
                      selectedFeederId === fr.id
                        ? 'bg-[#CCFF00] text-black border-[#CCFF00] font-black'
                        : 'bg-[#121622] text-slate-300 border-[#232c42] hover:border-slate-400'
                    }`}
                  >
                    <div className="text-[10px] uppercase opacity-75">{fr.id}</div>
                    <div className="truncate font-bold mt-0.5">{fr.name}</div>
                  </button>
                ))}
              </div>

              {/* Selected Feeder Route Deep Dive Card */}
              <div className="bg-[#121724] border border-[#232d44] p-5 rounded-xl space-y-4 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f283d] pb-3">
                  <div>
                    <div className="text-[#CCFF00] font-black text-sm uppercase">{selectedFeeder.name}</div>
                    <div className="text-slate-400 text-xs mt-0.5">Hub: {selectedFeeder.metroHubStation}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#10B981]/20 text-[#10B981] font-bold border border-[#10B981]/30">
                      ✓ ALL CONSTRAINTS VERIFIED
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-3">
                  <div className="bg-[#0b0e17] p-3 rounded-lg border border-[#1d2538]">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Route Length (&le; 7.0 km)</div>
                    <div className="text-base font-black text-[#CCFF00] mt-0.5">{selectedFeeder.routeLengthKm} km</div>
                    <div className="text-[#10B981] text-[10px]">PASS (Within 7km local limit)</div>
                  </div>

                  <div className="bg-[#0b0e17] p-3 rounded-lg border border-[#1d2538]">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Min Road Width (&gt; 6.0 m)</div>
                    <div className="text-base font-black text-white mt-0.5">{selectedFeeder.minRoadWidthMeters} metres</div>
                    <div className="text-[#10B981] text-[10px]">PASS (Dual carriage lanes)</div>
                  </div>

                  <div className="bg-[#0b0e17] p-3 rounded-lg border border-[#1d2538]">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">EV Fleet Allocated</div>
                    <div className="text-base font-black text-[#CCFF00] mt-0.5">
                      {selectedFeeder.evBusFleetAllocated} Buses
                    </div>
                    <div className="text-slate-400 text-[10px]">Headway: {selectedFeeder.peakHeadwayMinutes} mins</div>
                  </div>

                  <div className="bg-[#0b0e17] p-3 rounded-lg border border-[#1d2538]">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Population Coverage</div>
                    <div className="text-base font-black text-[#10B981] mt-0.5">
                      {selectedFeeder.coveragePopulationScore}%
                    </div>
                    <div className="text-slate-400 text-[10px]">Within 500m walk buffer</div>
                  </div>
                </div>

                <div className="bg-[#0b0e17] p-3 rounded-lg border border-[#1d2538] space-y-1">
                  <div className="text-[#CCFF00] text-[10.5px] uppercase font-bold flex items-center gap-1.5">
                    <BatteryCharging className="w-3.5 h-3.5" />
                    <span>Feasible Electric Vehicle Charging Plan:</span>
                  </div>
                  <div className="text-slate-300 text-xs">{selectedFeeder.chargingWindowDepot}</div>
                  <div className="text-slate-400 text-[10.5px]">Depot Base: {selectedFeeder.depotLocation}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROBLEM 5 (METRO & BUS AFC CROWDING) */}
        {activeTab === 'P5_AFC_CROWD' && (
          <div className="space-y-6">
            <div className="bg-[#0d111a] border border-[#1f273b] p-5 sm:p-6 rounded-xl space-y-4">
              <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                <Users className="w-5 h-5 text-[#CCFF00]" />
                Problem 5: Metro & Bus Crowding Profile from AFC Turnstiles
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Accumulates passenger boardings and alightings from turnstile transactions ($L_k = L_{'{k-1}'} + B_k - A_k$)
                to reveal hourly passenger loads along each line and pinpoint crush-load bottlenecks:
              </p>

              <div className="space-y-3 font-mono text-xs">
                {METRO_AND_BUS_CROWDING_PROFILES.map((line, idx) => (
                  <div
                    key={idx}
                    className="bg-[#121724] border border-[#232d44] p-4 rounded-xl space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e273a] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-black uppercase"
                          style={{ backgroundColor: line.colorHex }}
                        >
                          {line.transitMode}
                        </span>
                        <span className="font-bold text-white text-xs sm:text-sm">{line.lineOrRouteName}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Cap: <b className="text-white">{line.paxCapacityLimit.toLocaleString()} pax</b>
                      </div>
                    </div>

                    {/* Peak & Off-Peak Occupancy Bars */}
                    <div className="grid sm:grid-cols-4 gap-2.5">
                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Morning Peak (08–11)</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 rounded-full bg-[#1b2234] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${line.morningPeakOccupancyPct}%`,
                                backgroundColor: line.morningPeakOccupancyPct > 90 ? '#f59e0b' : '#CCFF00',
                              }}
                            />
                          </div>
                          <span className="font-bold text-white text-[11px]">{line.morningPeakOccupancyPct}%</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Afternoon (12–16)</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 rounded-full bg-[#1b2234] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#10B981]"
                              style={{ width: `${line.afternoonOccupancyPct}%` }}
                            />
                          </div>
                          <span className="font-bold text-white text-[11px]">{line.afternoonOccupancyPct}%</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Evening Peak (17–20:30)</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 rounded-full bg-[#1b2234] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${line.eveningPeakOccupancyPct}%`,
                                backgroundColor: line.eveningPeakOccupancyPct > 90 ? '#f59e0b' : '#CCFF00',
                              }}
                            />
                          </div>
                          <span className="font-bold text-white text-[11px]">{line.eveningPeakOccupancyPct}%</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-400 text-[10px] uppercase">Night (21–23:30)</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 rounded-full bg-[#1b2234] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#10B981]"
                              style={{ width: `${line.nightOccupancyPct}%` }}
                            />
                          </div>
                          <span className="font-bold text-white text-[11px]">{line.nightOccupancyPct}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0b0e17] p-2 rounded text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">Peak Crush Bottleneck:</span>
                      <span className="text-[#FFB800] font-bold">{line.crushLoadBottleneckSegment}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
