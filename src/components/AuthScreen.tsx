import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Compass,
  Lock,
  Phone,
  Radio,
  Ticket,
  User,
  Users,
  Zap,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

export interface UserProfile {
  name: string;
  emailOrPhone: string;
  passId: string;
  role: 'commuter' | 'operations' | 'staff';
  corridor?: string;
}

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  lang?: 'en' | 'hi';
  onChangeLang?: (l: 'en' | 'hi') => void;
}

export function AuthScreen({ onLoginSuccess, lang = 'en', onChangeLang }: AuthScreenProps) {
  const [selectedRole, setSelectedRole] = useState<'commuter' | 'operations'>('commuter');
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('Rahul Verma');
  const [contact, setContact] = useState('9871234560');
  const [passId, setPassId] = useState('DL-DTC-84920');
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<UserProfile | null>(null);

  // Perspective Tilt effect on mouse movement
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(-((y - centerY) / centerY) * 8);
    setRotateY(((x - centerX) / centerX) * 10);
    setGlareX((x / rect.width) * 100);
    setGlareY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const triggerLogin = (user: UserProfile) => {
    setWelcomeUser(user);
    setShowWelcome(true);
    setTimeout(() => {
      onLoginSuccess(user);
    }, 1200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: UserProfile = {
      name: name.trim() || 'Rahul Verma',
      emailOrPhone: contact.trim() || '9871234560',
      passId: passId.trim().toUpperCase() || 'DL-DTC-84920',
      role: selectedRole,
      corridor: 'Okhla Phase-III ↔ AIIMS Ring Road',
    };
    triggerLogin(user);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between overflow-x-hidden bg-[#07090e] text-white selection:bg-[#CCFF00] selection:text-black font-sans select-none">
      {/* 1. TOP MARQUEE TICKER (Matching Top Metrics) */}
      <div className="bg-[#CCFF00] text-black font-mono font-black text-[10.5px] sm:text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between tracking-wider uppercase shrink-0 border-b border-black">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-black animate-ping" />
          <span>72 LIVE BUSES • AVLS GPS — REAL-TIME DELHI TRANSIT STACK</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px]">
          <span>KALMAN DELAY MODEL</span>
          <span>•</span>
          <span>SEAT RADAR</span>
          <span>•</span>
          <span>98.4% GPS SYNC</span>
        </div>
        <span className="font-mono text-[10px] font-black">SECURE COMMUTER ACCESS ↗</span>
      </div>

      {/* 2. TOP HEADER */}
      <header className="w-full bg-[#0c0e14] border-b border-[#1c2232] sticky top-0 z-40">
        <div className="max-w-[1380px] mx-auto px-5 sm:px-8 h-[62px] flex items-center justify-between gap-4">
          {/* Brand Mark with Neon Volt Compass Icon */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.4)]">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-sans font-black text-lg sm:text-[19px] tracking-tight uppercase text-white leading-none">
                SmartTransit<span className="text-[#CCFF00]">AI</span>
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-[#151923] text-slate-300 border border-[#252c3e]">
                DELHI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onChangeLang && (
              <button
                type="button"
                onClick={() => onChangeLang(lang === 'en' ? 'hi' : 'en')}
                aria-label="Toggle language between English and Hindi"
                title="Switch between English and Hindi"
                className="px-2.5 py-1 rounded-full bg-[#121620] hover:bg-[#1a2130] text-xs font-mono font-bold text-slate-300 hover:text-[#CCFF00] border border-[#242c3e] transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'हिन्दी' : 'ENG'}
              </button>
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold text-slate-300 bg-[#121620] border border-[#232a3d]">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span>72 LIVE BUSES • AVLS GPS</span>
            </span>
          </div>
        </div>
      </header>

      {/* 3. SPLIT-SCREEN DASHBOARD VIEW */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-10 px-4 sm:px-8">
        <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT SIDE: Exact High-Resolution Delhi Bus Visual Showcase */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-left space-y-4">
            {/* Top Telemetry Capsule: 72 LIVE BUSES • AVLS GPS */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121620] border border-[#252c3e] text-xs font-mono font-bold text-[#ccff00] shadow-sm">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#ccff00]" />
              <span className="text-white">
                <strong className="text-[#ccff00]">72 LIVE BUSES</strong> • AVLS GPS ACTIVE
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
                DELHI TRANSIT STACK
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl">
                Real-time AVLS GPS streaming, crowd telemetry, and Kalman delay prediction for every
                Delhi electric &amp; CNG transit route.
              </p>
            </div>

            {/* Showcase Box with Exact Delhi Electric Bus Image */}
            <div className="relative w-full rounded-2xl bg-[#0e1118] border border-[#222a3d] p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7)] group overflow-hidden">
              {/* Dynamic Neon Volt Glow Background */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{
                  background:
                    'radial-gradient(circle at 50% 40%, rgba(204, 255, 0, 0.14) 0%, transparent 70%)',
                }}
              />

              {/* Floating Status Badges Over Visual */}
              <div className="flex items-center justify-between gap-2 mb-2 relative z-10 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#141924]/90 border border-[#252f44] text-[11px] font-mono font-bold text-[#ccff00] pointer-events-auto">
                  <Users className="w-3.5 h-3.5" />
                  <span>72 ACTIVE FLEET</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#141924]/90 border border-[#252f44] text-[11px] font-mono font-bold text-white pointer-events-auto">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                  <span>98.4% GPS SYNC</span>
                </div>
              </div>

              {/* High-Resolution Delhi Electric Bus Showcase with Perspective Tilt */}
              <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${
                    isHovered ? 1.02 : 1
                  }, ${isHovered ? 1.02 : 1}, 1)`,
                  transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
                }}
                className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#07090e] border border-[#1b2232] flex items-center justify-center cursor-pointer group"
              >
                {/* Dynamic Glare Reflection Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-300 z-20"
                  style={{
                    background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(204, 255, 0, 0.15) 0%, transparent 60%)`,
                    opacity: isHovered ? 1 : 0.2,
                  }}
                />

                <img
                  src="./images/delhi-bus-3d.png"
                  alt="Delhi Transit 3D Electric Bus"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.indexOf('delhi-bus-3d.png') !== -1 && !target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      target.src = '/images/delhi-bus-3d.png';
                    }
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0e1118] via-transparent to-transparent pointer-events-none" />

                {/* Subtitle tag */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-[#262c3e] text-[10px] font-mono text-slate-300 pointer-events-none">
                  <Zap className="w-3 h-3 text-[#ccff00]" />
                  <span>DELHI TRANSIT EV · TATA STARBUS AI FLEET</span>
                </div>
              </div>

              {/* Bottom Feature Grid */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#1a2130] text-[11px] font-mono">
                <div className="bg-[#121622] p-2 rounded-lg border border-[#1d2638]">
                  <span className="text-slate-400 block text-[9px] uppercase">DELHI CORRIDORS</span>
                  <strong className="text-white block font-bold">14 ROUTES</strong>
                </div>
                <div className="bg-[#121622] p-2 rounded-lg border border-[#1d2638]">
                  <span className="text-slate-400 block text-[9px] uppercase">PUNCTUALITY</span>
                  <strong className="text-[#4ade80] block font-bold">96.8% ON TIME</strong>
                </div>
                <div className="bg-[#121622] p-2 rounded-lg border border-[#1d2638]">
                  <span className="text-slate-400 block text-[9px] uppercase">CROWD SENSORS</span>
                  <strong className="text-[#ccff00] block font-bold">REAL-TIME</strong>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Authentication Form Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-[#0e1118] border border-[#232a3d] rounded-2xl p-6 sm:p-7 text-left space-y-4 shadow-2xl">
              {/* Header inside card */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#1c2332]">
                <div className="w-10 h-10 rounded-xl bg-[#ccff00] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.35)] shrink-0">
                  <Bus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                    COMMUTER AUTHENTICATION
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    Delhi Transit Pass &amp; Operations Sign In
                  </p>
                </div>
              </div>

              {/* Role Selector: Commuter vs Operations */}
              <div className="grid grid-cols-2 p-1 bg-[#131722] border border-[#222a3d] rounded-xl text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedRole('commuter')}
                  className={`py-2 rounded-lg uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedRole === 'commuter'
                      ? 'bg-[#ccff00] text-black font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Commuter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('operations')}
                  className={`py-2 rounded-lg uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedRole === 'operations'
                      ? 'bg-[#ccff00] text-black font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Operations</span>
                </button>
              </div>

              {/* Tab: Sign In vs Create Pass */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-mono text-[10.5px] uppercase font-bold text-slate-400">
                  ROLE: <strong className="text-white">{selectedRole.toUpperCase()}</strong>
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('signin')}
                    className={`text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                      tab === 'signin' ? 'text-[#ccff00] underline' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <span className="text-[#333333]">|</span>
                  <button
                    type="button"
                    onClick={() => setTab('signup')}
                    className={`text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                      tab === 'signup' ? 'text-[#ccff00] underline' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Create Pass
                  </button>
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-1">
                <div>
                  <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase text-slate-400 mb-1">
                    <User className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Verma"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121622] border border-[#232a3d] focus:border-[#ccff00] text-xs font-semibold text-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase text-slate-400 mb-1">
                    <Phone className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>Phone or Email</span>
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="9871234560"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121622] border border-[#232a3d] focus:border-[#ccff00] text-xs font-semibold text-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase text-slate-400 mb-1">
                    <Ticket className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>Pass ID</span>
                  </label>
                  <input
                    type="text"
                    value={passId}
                    onChange={(e) => setPassId(e.target.value)}
                    placeholder="DL-DTC-84920"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121622] border border-[#232a3d] focus:border-[#ccff00] text-xs font-mono font-bold text-white uppercase outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#ccff00] hover:bg-[#d8ff33] text-black font-sans font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 shadow-[0_0_20px_rgba(204,255,0,0.35)] active:scale-98 border border-black"
                >
                  <span>
                    {tab === 'signup'
                      ? 'Generate Pass & Enter ↗'
                      : 'Sign In to Delhi Transit ↗'}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>

              <div className="pt-2 text-center text-[10.5px] font-mono text-slate-500 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>OFFICIAL DELHI TRANSPORT STACK ENCRYPTION</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. CELEBRATORY "WELCOME TO DELHI" TRANSITION MODAL */}
      {showWelcome && welcomeUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-2xl bg-[#0e1118] border-2 border-[#ccff00] p-6 text-center space-y-4 shadow-[0_0_35px_rgba(204,255,0,0.35)] animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#ccff00] text-black flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.5)]">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[9.5px] font-mono font-black tracking-widest text-black uppercase bg-[#ccff00] px-2.5 py-0.5 rounded-full">
                AUTHENTICATED
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase mt-2.5 tracking-tight">
                Welcome to Delhi! 🇮🇳
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Connected as <strong className="text-white">{welcomeUser.name}</strong> ({welcomeUser.passId}).
              </p>
            </div>

            <div className="pt-2">
              <div className="w-full bg-[#1b2232] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#ccff00] h-full w-full animate-[progress_1s_ease-in-out]"></div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-2 inline-block uppercase">
                Loading live Delhi transit map...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full bg-[#0c0e14] border-t border-[#1c2232] py-3.5 px-6 text-center text-xs font-mono text-slate-500">
        <span>© 2026 PRAVAAH · DELHI TRANSPORT STACK</span>
      </footer>
    </div>
  );
}
