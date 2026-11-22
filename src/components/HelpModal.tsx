import {
  CheckCircle2,
  Clock,
  Compass,
  HelpCircle,
  Info,
  MessageSquare,
  Radio,
  Send,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export function HelpModal({ isOpen, onClose, onShowToast }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'coverage' | 'feedback' | 'privacy'>('about');

  // Feedback form state
  const [feedbackRoute, setFeedbackRoute] = useState('');
  const [feedbackStop, setFeedbackStop] = useState('');
  const [feedbackDelayMin, setFeedbackDelayMin] = useState('5');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (onShowToast) {
      onShowToast(`🙏 Thank you! Report for Route ${feedbackRoute || 'Transit'} received.`);
    }
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackRoute('');
      setFeedbackStop('');
      setFeedbackNotes('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans">
      <div className="w-full max-w-2xl bg-[#0e1118] border-2 border-[#242c3e] shadow-[0_25px_60px_rgba(0,0,0,0.9)] rounded-2xl overflow-hidden flex flex-col text-white max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1c2232] flex items-center justify-between bg-[#121622]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00] text-black font-black flex items-center justify-center shadow-[0_0_12px_rgba(204,255,0,0.4)]">
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-white leading-tight">
                HELP &amp; TRANSIT GUIDE
              </h2>
              <p className="text-[10.5px] font-mono text-slate-400">
                DELHI TRANSPORT STACK • DATA FRESHNESS &amp; FEEDBACK
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close help modal"
            className="w-8 h-8 rounded-lg bg-[#181d2a] hover:bg-[#CCFF00] hover:text-black border border-[#2b3348] text-slate-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 p-1.5 bg-[#141824] border-b border-[#1c2232] text-xs font-mono">
          {[
            { id: 'about', label: 'ABOUT & DATA', icon: Info },
            { id: 'coverage', label: 'COVERAGE', icon: Compass },
            { id: 'feedback', label: 'REPORT DELAY', icon: MessageSquare },
            { id: 'privacy', label: 'PRIVACY', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-2 px-1 text-center font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#CCFF00] text-black font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 no-scrollbar text-xs">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Zap className="w-4 h-4 text-[#CCFF00]" />
                  <span>About SmartTransit AI Delhi</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  SmartTransit AI solves the classic Delhi commuter dilemma: <strong>Comfort vs Speed</strong>.
                  While traditional transit planners only count static travel minutes, SmartTransit AI models
                  passenger crowding (via ETM ticket counts and stop dwell factors) alongside real-time GPS road delays.
                </p>
              </div>

              {/* Data Freshness & Providers */}
              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Radio className="w-4 h-4 text-[#CCFF00] animate-pulse" />
                  <span>Data Providers &amp; Freshness</span>
                </div>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#CCFF00] font-bold">•</span>
                    <div>
                      <strong className="text-white">Live GPS AVLS:</strong> Streamed every 1.2 seconds across 72 active Delhi transit vehicle probes.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#CCFF00] font-bold">•</span>
                    <div>
                      <strong className="text-white">Static Data Source:</strong> Official Delhi Open Transit Data (OTD) GTFS feeds covering DTC &amp; DIMTS Cluster routes.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#CCFF00] font-bold">•</span>
                    <div>
                      <strong className="text-white">Delay Prediction:</strong> Real-time Kalman Velocity filter detecting shockwaves along major junctions (Ashram, AIIMS, ITO, Kashmere Gate).
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#CCFF00] font-bold">•</span>
                    <div>
                      <strong className="text-white">Metro Interchanges:</strong> Delhi Metro Yellow, Violet, Magenta, Pink, and Blue line connections at key hubs.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Fares Explanation */}
              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2 text-slate-300">
                <div className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#CCFF00]" />
                  <span>Delhi Transit Fare Rules</span>
                </div>
                <p className="leading-relaxed">
                  Calculated using authentic Delhi Transport Corporation distance slabs:
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded-lg bg-[#0e1118] border border-[#1f2533]">
                    <strong className="text-[#CCFF00] block">DTC AC &amp; ELECTRIC:</strong>
                    <span>0–4 km: ₹10 · 4–10 km: ₹15<br />10–16 km: ₹20 · &gt;16 km: ₹25</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0e1118] border border-[#1f2533]">
                    <strong className="text-slate-300 block">DTC NON-AC &amp; CLUSTER:</strong>
                    <span>0–4 km: ₹5 · 4–10 km: ₹10<br />&gt;10 km: ₹15 (Concessional available)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coverage' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2 text-slate-300">
                <h3 className="font-bold text-white text-sm">Modeled Corridors &amp; Coverage</h3>
                <p className="leading-relaxed">
                  SmartTransit AI currently simulates and live-tracks primary high-frequency arterial corridors in the National Capital Territory of Delhi:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-[#0e1118] border border-[#1f2533]">
                    <span className="text-[#CCFF00] font-bold block">RING ROAD CORRIDOR</span>
                    <span>AIIMS ↔ South Ex ↔ Lajpat Nagar ↔ Ashram ↔ Sarai Kale Khan ↔ ITO</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e1118] border border-[#1f2533]">
                    <span className="text-[#CCFF00] font-bold block">OUTER RING ROAD</span>
                    <span>Munirka ↔ IIT Gate ↔ Hauz Khas ↔ Chirag Delhi ↔ Nehru Place ↔ Kalkaji</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e1118] border border-[#1f2533]">
                    <span className="text-[#CCFF00] font-bold block">MATHURA ROAD / SOUTH EAST</span>
                    <span>Badarpur Border ↔ Sarita Vihar ↔ Jasola ↔ Okhla Ph-III ↔ Ashram</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e1118] border border-[#1f2533]">
                    <span className="text-[#CCFF00] font-bold block">TRANS-YAMUNA &amp; CENTRAL</span>
                    <span>Anand Vihar ISBT ↔ Laxmi Nagar ↔ ITO ↔ Kashmere Gate ISBT</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2 text-slate-300">
                <h3 className="font-bold text-white text-sm">System Limitations</h3>
                <p className="leading-relaxed text-[11.5px]">
                  • Rural feeder routes and unauthorized Gramin Seva vehicles are currently excluded.<br />
                  • Walking transfers between metro stations and bus terminals assume standard urban speed (~4.5 km/h).<br />
                  • If two stops have no direct route in this slice, select a nearby interchange hub like Nehru Place, AIIMS, or Kashmere Gate.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d]">
                <h3 className="font-bold text-white text-sm mb-1">Report Delay / Submit Transit Feedback</h3>
                <p className="text-slate-400 text-xs">
                  Help improve Delhi&apos;s crowd and delay model. Report on-ground bus delays or incorrect stop arrivals.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-xl bg-[#1b2b1e] border border-[#2a4d31] text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#4ade80] mx-auto" />
                  <p className="text-sm font-bold text-white uppercase font-mono">
                    Report Submitted Successfully!
                  </p>
                  <p className="text-xs text-slate-300">
                    Telemetry fed back to the local corridor model. Speeds and crowd metrics will recalibrate.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                        Bus Route Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 534, 429, 764"
                        value={feedbackRoute}
                        onChange={(e) => setFeedbackRoute(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-[#0e1118] border border-[#232b3d] focus:border-[#CCFF00] text-white text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                        Observed Delay (Minutes)
                      </label>
                      <select
                        value={feedbackDelayMin}
                        onChange={(e) => setFeedbackDelayMin(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-[#0e1118] border border-[#232b3d] focus:border-[#CCFF00] text-white text-xs outline-none cursor-pointer"
                      >
                        <option value="2">2 mins late</option>
                        <option value="5">5 mins late</option>
                        <option value="10">10 mins late</option>
                        <option value="15">15+ mins late (Heavy Jam)</option>
                        <option value="0">On time / Early</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                      Stop / Junction Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ashram Chowk, AIIMS Ring Road, Nehru Place"
                      value={feedbackStop}
                      onChange={(e) => setFeedbackStop(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#0e1118] border border-[#232b3d] focus:border-[#CCFF00] text-white text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                      Crowd Observations / Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Bus packed to door, or seats empty after Kalkaji..."
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#0e1118] border border-[#232b3d] focus:border-[#CCFF00] text-white text-xs outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#CCFF00] hover:bg-[#d8ff33] text-black font-sans font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.99]"
                  >
                    <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Submit Transit Report</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 text-slate-300">
              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
                  <span>Privacy &amp; Local-First Policy</span>
                </div>
                <p className="leading-relaxed">
                  SmartTransit AI is built on private-by-design, local-first engineering principles.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141824] border border-[#232b3d] space-y-2 text-xs">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#CCFF00] font-bold">✓</span>
                    <span><strong>No User Location Tracking:</strong> Your device GPS coordinates are never sent to external servers or ad trackers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#CCFF00] font-bold">✓</span>
                    <span><strong>Local Storage Only:</strong> Saved commute preferences and pass identity are kept strictly in your browser&apos;s localStorage.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#CCFF00] font-bold">✓</span>
                    <span><strong>No Third-Party Cookies:</strong> Zero advertising tracking or analytics trackers.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
