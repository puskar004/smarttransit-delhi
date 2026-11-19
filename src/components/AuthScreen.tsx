import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Compass,
  FileText,
  Phone,
  Radio,
  Ticket,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export interface UserProfile {
  name: string;
  emailOrPhone: string;
  passId: string;
  role: 'commuter' | 'operations' | 'staff';
  corridor?: string;
}

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [selectedRole, setSelectedRole] = useState<'commuter' | 'operations'>('commuter');
  const [selectedCorridor, setSelectedCorridor] = useState('Corridor 1: Okhla Ph-III ↔ AIIMS');
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('Rahul Verma');
  const [contact, setContact] = useState('9871234560');
  const [passId, setPassId] = useState('DL-DTC-84920');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<UserProfile | null>(null);

  const triggerLogin = (user: UserProfile) => {
    setWelcomeUser(user);
    setShowWelcome(true);
    setTimeout(() => {
      onLoginSuccess(user);
    }, 1400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: UserProfile = {
      name: name.trim() || 'Rahul Verma',
      emailOrPhone: contact.trim() || '9871234560',
      passId: passId.trim().toUpperCase() || 'DL-DTC-84920',
      role: selectedRole,
      corridor: selectedCorridor,
    };
    triggerLogin(user);
  };

  // Quick 1-Click Demo Profiles (Styled after SmartLearn personas)
  const demoProfiles: Array<UserProfile & { avatar: string; title: string; desc: string }> = [
    {
      name: 'Rahul Verma',
      emailOrPhone: '9871234560',
      passId: 'DL-DTC-84920',
      role: 'commuter',
      corridor: 'Okhla Ph-III ↔ AIIMS Ring Road',
      avatar: '👨‍💼',
      title: 'Daily Commuter',
      desc: 'Corridor: Okhla Ph-III ↔ AIIMS Ring Road',
    },
    {
      name: 'Dr. Pooja Sharma',
      emailOrPhone: '9810987654',
      passId: 'DL-DTC-31042',
      role: 'staff',
      corridor: 'South Delhi Hospital Corridor',
      avatar: '👩‍⚕️',
      title: 'Medical Staff (Comfort Priority)',
      desc: 'Prefers guaranteed seats & low crowd over rush buses',
    },
    {
      name: 'Transit Operations Lead',
      emailOrPhone: 'operations@transportstack.in',
      passId: 'DL-OPS-2026',
      role: 'operations',
      corridor: 'Citywide 72 Bus Fleet',
      avatar: '⚡',
      title: 'Fleet Operations Desk',
      desc: 'Live telemetry, Kalman delay model & crowd radar',
    },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between overflow-x-hidden bg-[#FAFAFE] text-slate-900 selection:bg-violet-500/20">
      {/* =====================================================================
           TOP NAVIGATION BAR (Exact SmartLearn / CurioSphere Style)
           ===================================================================== */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-4">
          {/* Brand Mark with SmartLearn Vibrant Gradient Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Compass className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[21px] tracking-tight text-slate-900">
                  SmartTransit<span className="text-violet-600">AI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-violet-50 text-violet-700 border border-violet-100">
                  DELHI
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">
                DELHI TRANSPORT STACK
              </p>
            </div>
          </div>

          {/* Center Links (SmartLearn Style Nav) */}
          <nav className="hidden lg:flex items-center gap-6 text-[13.5px] font-semibold text-slate-600">
            <span className="text-violet-600 flex items-center gap-1 cursor-pointer">
              <Bus className="w-4 h-4" /> Live Buses
            </span>
            <span className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer">
              <Compass className="w-4 h-4" /> Journey Planner
            </span>
            <span className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer">
              <Users className="w-4 h-4" /> Crowd Radar
            </span>
            <span className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer">
              <FileText className="w-4 h-4" /> Transit Stack
            </span>
          </nav>

          {/* Right Action: SmartLearn Gradient CTA */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => triggerLogin(demoProfiles[0])}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-[13px] shadow-lg shadow-violet-500/25 transition-all flex items-center gap-2 cursor-pointer hover:shadow-violet-500/40"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Instant Demo Login →</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
           MAIN HERO SECTION (Exact SmartLearn / CurioSphere /login & /sign-in Layout)
           ===================================================================== */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 sm:py-14 px-4 sm:px-6 relative">
        {/* Subtle Ambient Violet Gradient Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-violet-200/40 via-fuchsia-100/30 to-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[820px] w-full relative z-10 text-center space-y-7">
          {/* Center Brand Badge (SmartLearn Floating Icon Style) */}
          <div className="inline-flex p-3 rounded-2xl bg-white shadow-xl shadow-violet-500/10 border border-violet-100 mb-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 flex items-center justify-center text-white shadow-md">
              <Bus className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-slate-900 tracking-tight leading-tight">
              Welcome to SmartTransit Delhi
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mt-2.5 max-w-lg mx-auto leading-relaxed">
              Choose how you want to continue. Sign in with your Digital Transit Pass or access live
              fleet telemetry across Delhi's bus corridors.
            </p>
          </div>

          {/* =================================================================
               ROLE SELECTION CARDS (Exact match to SmartLearn Student vs Teacher)
               ================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            {/* Card 1: Login as Commuter */}
            <div
              onClick={() => setSelectedRole('commuter')}
              className={`p-5 rounded-3xl transition-all cursor-pointer border ${
                selectedRole === 'commuter'
                  ? 'bg-white border-violet-500 shadow-xl shadow-violet-500/15 ring-4 ring-violet-500/10'
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <User className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-violet-50 text-violet-700 border border-violet-200">
                  PASSENGER PASS
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Login as Daily Commuter
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Live bus arrival countdowns, multimodal routes, avoid crush-loads &amp; guaranteed seats.
              </p>

              {/* Corridor Selection Pills (Matches SmartLearn Class 10 / 11 / 12) */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Select Corridor:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Okhla Ph-III ↔ AIIMS',
                    'Nehru Place ↔ Anand Vihar',
                    'Central Ring Road',
                  ].map((corridor) => (
                    <button
                      key={corridor}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCorridor(corridor);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        selectedCorridor.includes(corridor.split(' ')[0])
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {corridor}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Login as Fleet Operations */}
            <div
              onClick={() => setSelectedRole('operations')}
              className={`p-5 rounded-3xl transition-all cursor-pointer border ${
                selectedRole === 'operations'
                  ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-500/15 ring-4 ring-indigo-500/10'
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Radio className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                  OPERATIONS DESK
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Login as Fleet Operations
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                72 live AVLS GPS bus telemetry nodes, Kalman delay model, ETM ticketing &amp; crowd radar.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-indigo-600">DTC &amp; DIMTS Telemetry</span>
                <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">
                  72 BUSES
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================
               SIGN IN CARD (Clean White Container with SmartLearn Accents)
               ================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-500/10 border border-slate-200/80 max-w-xl mx-auto text-left">
            {/* Header with Role Pill */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100 inline-block mb-1">
                  SIGNING IN AS {selectedRole === 'commuter' ? 'DAILY COMMUTER' : 'FLEET OPERATIONS'}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">Enter Credentials</h2>
              </div>

              {/* Tab Toggle: Sign In vs Create Pass */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    tab === 'signin' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    tab === 'signup' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Create Pass
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  <User className="w-3.5 h-3.5 text-violet-600" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-violet-600" />
                  <span>Phone Number or Email</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 9871234560"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-violet-600" />
                    <span>Delhi Transit Pass ID (ETM)</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ✓ ACTIVE PASS
                  </span>
                </label>
                <input
                  type="text"
                  value={passId}
                  onChange={(e) => setPassId(e.target.value)}
                  placeholder="DL-DTC-84920"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-500/10 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>
                  {tab === 'signup'
                    ? 'Generate Pass & Continue →'
                    : 'Sign In to Delhi Transit Stack →'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Demo Profiles (SmartLearn Clean List Pattern) */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                QUICK 1-CLICK DEMO PROFILES:
              </span>
              <div className="space-y-2">
                {demoProfiles.map((p) => (
                  <button
                    key={p.passId}
                    type="button"
                    onClick={() => triggerLogin(p)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-violet-50/70 border border-slate-200 hover:border-violet-300 flex items-center justify-between gap-3 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-1 bg-white rounded-xl shadow-xs border border-slate-100">
                        {p.avatar}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-violet-700 block leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-slate-500 leading-tight block">
                          {p.title} · <strong className="font-mono text-slate-700">{p.passId}</strong>
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-violet-700 bg-violet-100/70 px-2.5 py-1 rounded-full shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-all">
                      Login →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================================
           CELEBRATORY "WELCOME TO DELHI" TRANSITION MODAL (SmartLearn Style)
           ===================================================================== */}
      {showWelcome && welcomeUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-violet-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10.5px] font-black tracking-widest text-violet-700 uppercase bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                AUTHENTICATION VERIFIED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tracking-tight">
                Welcome to Delhi! 🇮🇳
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Namaste, <strong className="text-slate-900">{welcomeUser.name}</strong>. Connected to
                Delhi’s 72 live buses, crowd telemetry &amp; journey planner.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Pass ID:</span>
                <span className="font-mono font-bold text-violet-700">{welcomeUser.passId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Corridor:</span>
                <span className="font-bold text-slate-800">{welcomeUser.corridor || 'Delhi Bus Network'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Telemetry Feed:</span>
                <span className="font-bold text-emerald-600">72 DTC &amp; DIMTS GPS Nodes</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full w-full animate-[progress_1.2s_ease-in-out]"></div>
              </div>
              <span className="text-xs text-slate-400 mt-2 inline-block font-medium">
                Entering Delhi Transit Hub...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-100 py-4 px-6 text-center text-xs text-slate-500">
        <span>© 2026 SmartTransitAI · Delhi Transport Stack · Sustainable City Mobility</span>
      </footer>
    </div>
  );
}
