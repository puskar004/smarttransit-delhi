import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Compass,
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
    }, 1300);
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

  // Quick 1-Click Demo Profiles (Styled in high-end brutalist aesthetic)
  const demoProfiles: Array<UserProfile & { avatar: string; title: string; desc: string }> = [
    {
      name: 'Rahul Verma',
      emailOrPhone: '9871234560',
      passId: 'DL-DTC-84920',
      role: 'commuter',
      corridor: 'Okhla Ph-III ↔ AIIMS Ring Road',
      avatar: '👨‍💼',
      title: 'Daily Commuter (Ring Road Corridor)',
      desc: 'Corridor: Okhla Ph-III ↔ AIIMS Ring Road',
    },
    {
      name: 'Dr. Pooja Sharma',
      emailOrPhone: '9810987654',
      passId: 'DL-DTC-31042',
      role: 'staff',
      corridor: 'South Delhi Hospital Corridor',
      avatar: '👩‍⚕️',
      title: 'Medical Staff (Comfort & Seat Priority)',
      desc: 'Prefers guaranteed seats & low crowd over rush buses',
    },
    {
      name: 'Transit Operations Lead',
      emailOrPhone: 'operations@transportstack.in',
      passId: 'DL-OPS-2026',
      role: 'operations',
      corridor: 'Citywide 72 Bus Fleet',
      avatar: '⚡',
      title: 'Fleet Operations Desk (Citywide)',
      desc: 'Live telemetry, Kalman delay model & crowd radar',
    },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between overflow-x-hidden bg-[#000000] text-white selection:bg-[#CCFF00] selection:text-black font-sans select-none">
      {/* 1. TOP MARQUEE TICKER (Exact SNKS Neon Volt Style) */}
      <div className="bg-[#CCFF00] text-black font-mono font-black text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between tracking-wider uppercase shrink-0 border-b border-black">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-black animate-ping" />
          <span>⚡ LIVE DELHI TRANSIT STACK — DIGITAL PASS &amp; TELEMETRY ACCESS</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px]">
          <span>72 ACTIVE BUSES</span>
          <span>•</span>
          <span>AVLS GPS TRACKING</span>
          <span>•</span>
          <span>CROWD TELEMETRY</span>
        </div>
        <span className="font-mono text-[10.5px]">AUTHENTICATION / 001 ↗</span>
      </div>

      {/* 2. TOP NAVIGATION BAR */}
      <header className="w-full bg-[#000000] border-b border-[#222222] sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-4">
          {/* Brand Mark with Bold Grotesque Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#CCFF00] text-black font-black flex items-center justify-center text-sm shadow-[0_0_15px_rgba(204,255,0,0.4)]">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[22px] tracking-tighter uppercase text-white leading-none">
                  SmartTransit<span className="text-[#CCFF00]">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold tracking-wider uppercase bg-[#141414] text-[#CCFF00] border border-[#333333]">
                  DELHI
                </span>
              </div>
              <p className="text-[10px] font-mono font-bold text-[#666666] tracking-wider uppercase">
                DELHI TRANSPORT STACK
              </p>
            </div>
          </div>

          {/* Center Links (Pill Style) */}
          <nav className="hidden lg:flex items-center bg-[#111111] border border-[#262626] rounded-full p-1 gap-1 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-[#CCFF00] text-black font-black uppercase text-[11px] flex items-center gap-1">
              <Bus className="w-3.5 h-3.5 stroke-[2.5]" /> LIVE BUSES
            </span>
            <span className="px-3 py-1.5 rounded-full text-[#8E8E93] hover:text-white font-bold uppercase text-[11px] flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> PLANNER
            </span>
            <span className="px-3 py-1.5 rounded-full text-[#8E8E93] hover:text-white font-bold uppercase text-[11px] flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> CROWD RADAR
            </span>
          </nav>

          {/* Right Action: Volt Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => triggerLogin(demoProfiles[0])}
              className="px-5 py-2 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Instant Demo Login ↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN HERO SECTION (Editorial Brutalist Layout) */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 sm:py-14 px-4 sm:px-6 relative">
        <div className="max-w-[820px] w-full relative z-10 text-center space-y-7">
          {/* Tag & Huge Headline */}
          <div>
            <div className="text-[11px] font-mono font-bold tracking-widest text-[#CCFF00] uppercase mb-1">
              THE ACCESS GATEWAY / 001
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none">
              DELHI TRANSIT STACK.
            </h1>
            <p className="text-[#8E8E93] text-xs sm:text-sm mt-3 max-w-lg mx-auto leading-relaxed">
              Enter with your verified Digital Transit Pass or access live fleet telemetry across Delhi's 72 bus corridors.
            </p>
          </div>

          {/* ROLE SELECTION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            {/* Card 1: Commuter */}
            <div
              onClick={() => setSelectedRole('commuter')}
              className={`p-5 transition-all cursor-pointer border ${
                selectedRole === 'commuter'
                  ? 'bg-[#0E0E0E] border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.2)] ring-1 ring-[#CCFF00]'
                  : 'bg-[#0E0E0E] hover:bg-[#141414] border-[#222222] hover:border-[#444444]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-[#141414] border border-[#333333] text-[#CCFF00] flex items-center justify-center font-bold">
                  <User className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="px-2 py-0.5 text-[9.5px] font-mono font-black tracking-wider uppercase bg-[#CCFF00] text-black">
                  PASSENGER PASS
                </span>
              </div>

              <h3 className="text-base font-black uppercase tracking-tight text-white leading-snug">
                Login as Daily Commuter
              </h3>
              <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
                Live bus arrival countdowns, multimodal routes, avoid crush-loads &amp; guaranteed seats.
              </p>

              {/* Corridor Selection Pills */}
              <div className="mt-4 pt-3 border-t border-[#1C1C1C] space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] block">
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
                      className={`px-2.5 py-1 text-[10.5px] uppercase font-bold tracking-wider border transition-all ${
                        selectedCorridor.includes(corridor.split(' ')[0])
                          ? 'bg-[#CCFF00] text-black border-[#CCFF00] font-black'
                          : 'bg-[#141414] text-[#8E8E93] border-[#262626] hover:text-white'
                      }`}
                    >
                      {corridor}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Fleet Operations */}
            <div
              onClick={() => setSelectedRole('operations')}
              className={`p-5 transition-all cursor-pointer border ${
                selectedRole === 'operations'
                  ? 'bg-[#0E0E0E] border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.2)] ring-1 ring-[#CCFF00]'
                  : 'bg-[#0E0E0E] hover:bg-[#141414] border-[#222222] hover:border-[#444444]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-[#141414] border border-[#333333] text-[#CCFF00] flex items-center justify-center font-bold">
                  <Radio className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="px-2 py-0.5 text-[9.5px] font-mono font-black tracking-wider uppercase bg-[#CCFF00] text-black">
                  OPERATIONS DESK
                </span>
              </div>

              <h3 className="text-base font-black uppercase tracking-tight text-white leading-snug">
                Login as Fleet Operations
              </h3>
              <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
                72 live AVLS GPS bus telemetry nodes, Kalman delay model, ETM ticketing &amp; crowd radar.
              </p>

              <div className="mt-4 pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-xs text-[#8E8E93]">
                <span className="font-mono text-[#CCFF00] uppercase font-bold">DTC &amp; DIMTS Telemetry</span>
                <span className="font-mono text-[10px] bg-[#141414] border border-[#333333] px-2 py-0.5 text-white font-bold">
                  72 BUSES
                </span>
              </div>
            </div>
          </div>

          {/* SIGN IN CARD */}
          <div className="bg-[#0E0E0E] border border-[#222222] p-6 sm:p-8 max-w-xl mx-auto text-left space-y-4">
            {/* Header with Role Pill */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1C1C1C] flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#CCFF00] bg-[#1A1A1A] px-2.5 py-0.5 border border-[#333333] inline-block mb-1">
                  SIGNING IN AS {selectedRole === 'commuter' ? 'DAILY COMMUTER' : 'FLEET OPERATIONS'}
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">Enter Credentials</h2>
              </div>

              {/* Tab Toggle: Sign In vs Create Pass */}
              <div className="flex bg-[#141414] border border-[#262626] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className={`px-3 py-1 font-black uppercase tracking-wider transition-all cursor-pointer ${
                    tab === 'signin' ? 'bg-[#CCFF00] text-black' : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className={`px-3 py-1 font-black uppercase tracking-wider transition-all cursor-pointer ${
                    tab === 'signup' ? 'bg-[#CCFF00] text-black' : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Create Pass
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  <User className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="w-full px-4 py-2.5 bg-[#141414] border border-[#262626] focus:border-[#CCFF00] text-xs font-semibold text-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Phone Number or Email</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 9871234560"
                  required
                  className="w-full px-4 py-2.5 bg-[#141414] border border-[#262626] focus:border-[#CCFF00] text-xs font-semibold text-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>Delhi Transit Pass ID (ETM)</span>
                  </span>
                  <span className="text-[10px] text-black font-black bg-[#CCFF00] px-1.5 py-0.2">
                    ACTIVE PASS
                  </span>
                </label>
                <input
                  type="text"
                  value={passId}
                  onChange={(e) => setPassId(e.target.value)}
                  placeholder="DL-DTC-84920"
                  className="w-full px-4 py-2.5 bg-[#141414] border border-[#262626] focus:border-[#CCFF00] text-xs font-mono font-bold text-white uppercase outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>
                  {tab === 'signup'
                    ? 'Generate Pass & Continue ↗'
                    : 'Sign In to Delhi Transit Stack ↗'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Quick 1-Click Demo Profiles */}
            <div className="mt-6 pt-5 border-t border-[#1C1C1C]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#666666] block mb-2.5">
                QUICK 1-CLICK DEMO PROFILES:
              </span>
              <div className="space-y-2">
                {demoProfiles.map((p) => (
                  <button
                    key={p.passId}
                    type="button"
                    onClick={() => triggerLogin(p)}
                    className="w-full p-2.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#CCFF00] flex items-center justify-between gap-3 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg p-1 bg-black border border-[#333333]">
                        {p.avatar}
                      </span>
                      <div>
                        <span className="text-xs font-black uppercase text-white group-hover:text-[#CCFF00] block leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[10.5px] font-mono text-[#8E8E93] leading-tight block">
                          {p.title} · <strong className="text-white">{p.passId}</strong>
                        </span>
                      </div>
                    </div>
                    <span className="text-[10.5px] font-mono font-black uppercase text-black bg-[#CCFF00] px-2.5 py-1 shrink-0">
                      Login ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. CELEBRATORY "WELCOME TO DELHI" TRANSITION MODAL */}
      {showWelcome && welcomeUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0E0E0E] border-2 border-[#CCFF00] p-8 text-center space-y-5 shadow-[0_0_35px_rgba(204,255,0,0.3)] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto bg-[#CCFF00] text-black flex items-center justify-center font-black">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-mono font-black tracking-widest text-black uppercase bg-[#CCFF00] px-3 py-1">
                AUTHENTICATION VERIFIED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase mt-3 tracking-tight">
                Welcome to Delhi! 🇮🇳
              </h2>
              <p className="text-xs text-[#8E8E93] mt-1.5 leading-relaxed">
                Namaste, <strong className="text-white">{welcomeUser.name}</strong>. Connected to
                Delhi’s 72 live buses, crowd telemetry &amp; journey planner.
              </p>
            </div>

            <div className="bg-[#141414] p-3.5 border border-[#222222] text-xs text-left space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">PASS ID:</span>
                <span className="font-bold text-[#CCFF00]">{welcomeUser.passId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">CORRIDOR:</span>
                <span className="font-bold text-white uppercase">{welcomeUser.corridor || 'Delhi Bus Network'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">TELEMETRY:</span>
                <span className="font-bold text-[#CCFF00]">72 DTC &amp; DIMTS GPS NODES</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full bg-[#1C1C1C] h-1.5 overflow-hidden">
                <div className="bg-[#CCFF00] h-full w-full animate-[progress_1.2s_ease-in-out]"></div>
              </div>
              <span className="text-[11px] font-mono text-[#666666] mt-2 inline-block uppercase">
                Entering Delhi Transit Hub...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full bg-[#000000] border-t border-[#222222] py-4 px-6 text-center text-xs font-mono text-[#666666]">
        <span>© 2026 PRAVAAH · DELHI TRANSPORT STACK · SUSTAINABLE MOBILITY</span>
      </footer>
    </div>
  );
}
