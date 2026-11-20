import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Lock,
  Phone,
  Radio,
  Ticket,
  User,
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
    <div className="min-h-screen w-screen flex flex-col justify-between overflow-x-hidden bg-[#000000] text-white selection:bg-[#CCFF00] selection:text-black font-sans select-none">
      {/* 1. TOP MARQUEE TICKER */}
      <div className="bg-[#CCFF00] text-black font-mono font-black text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between tracking-wider uppercase shrink-0 border-b border-black">
        <div className="flex items-center gap-2">
          <Bus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>DELHI TRANSPORT STACK — REAL-TIME BUS TRACKING</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px]">
          <span>72 ACTIVE BUSES</span>
          <span>•</span>
          <span>AVLS GPS</span>
        </div>
        <span className="font-mono text-[10px]">SECURE LOGIN ↗</span>
      </div>

      {/* 2. MINIMAL TOP HEADER */}
      <header className="w-full bg-[#000000] border-b border-[#222222] sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-[64px] flex items-center justify-between gap-4">
          {/* Brand Mark with Prominent Bus Icon */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#CCFF00] text-black font-black flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.4)]">
              <Bus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-[22px] tracking-tighter uppercase text-white leading-none">
                SmartTransit<span className="text-[#CCFF00]">AI</span>
              </span>
              <span className="ml-2 px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-wider uppercase bg-[#141414] text-[#CCFF00] border border-[#333333]">
                DELHI
              </span>
            </div>
          </div>

          <div className="text-xs font-mono text-[#8E8E93] uppercase hidden sm:block">
            AUTHENTICATION PORTAL
          </div>
        </div>
      </header>

      {/* 3. CLEAN & MINIMAL LOGIN CARD (Prominent Bus Emblem, No Clutter, No Demo) */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 relative">
        <div className="max-w-md w-full relative z-10 text-center space-y-6">
          {/* Prominent Center Bus Symbol */}
          <div className="space-y-3">
            <div className="w-16 h-16 bg-[#CCFF00] text-black flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(204,255,0,0.35)]">
              <Bus className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              DELHI TRANSIT SIGN IN
            </h1>
            <p className="text-[#8E8E93] text-xs font-medium">
              Enter your pass credentials to track buses live &amp; plan journeys.
            </p>
          </div>

          {/* Clean Card */}
          <div className="bg-[#0E0E0E] border-2 border-[#222222] p-6 sm:p-7 text-left space-y-4 shadow-2xl">
            {/* Minimal Role Selector: Commuter vs Operations */}
            <div className="grid grid-cols-2 p-1 bg-[#141414] border border-[#262626] text-xs">
              <button
                type="button"
                onClick={() => setSelectedRole('commuter')}
                className={`py-2 uppercase font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'commuter'
                    ? 'bg-[#CCFF00] text-black'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Commuter</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('operations')}
                className={`py-2 uppercase font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'operations'
                    ? 'bg-[#CCFF00] text-black'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Operations</span>
              </button>
            </div>

            {/* Tab: Sign In vs Create Pass */}
            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3 text-xs">
              <span className="font-mono text-[10.5px] uppercase font-bold text-[#8E8E93]">
                ROLE: <strong className="text-white">{selectedRole.toUpperCase()}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab('signin')}
                  className={`text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                    tab === 'signin' ? 'text-[#CCFF00] underline' : 'text-[#666666] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <span className="text-[#333333]">|</span>
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className={`text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                    tab === 'signup' ? 'text-[#CCFF00] underline' : 'text-[#666666] hover:text-white'
                  }`}
                >
                  Create Pass
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div>
                <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase text-[#8E8E93] mb-1">
                  <User className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Verma"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#141414] border border-[#262626] focus:border-[#CCFF00] text-xs font-semibold text-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase text-[#8E8E93] mb-1">
                  <Phone className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Phone or Email</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="9871234560"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#141414] border border-[#262626] focus:border-[#CCFF00] text-xs font-semibold text-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10.5px] font-mono font-bold uppercase text-[#8E8E93] mb-1">
                  <Ticket className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Pass ID</span>
                </label>
                <input
                  type="text"
                  value={passId}
                  onChange={(e) => setPassId(e.target.value)}
                  placeholder="DL-DTC-84920"
                  className="w-full px-3.5 py-2.5 bg-[#141414] border border-[#262626] focus:border-[#CCFF00] text-xs font-mono font-bold text-white uppercase outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 shadow-sm"
              >
                <span>
                  {tab === 'signup'
                    ? 'Generate Pass & Enter ↗'
                    : 'Sign In to Delhi Transit ↗'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <div className="pt-2 text-center text-[10.5px] font-mono text-[#555555] flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>OFFICIAL DELHI TRANSPORT STACK ENCRYPTION</span>
            </div>
          </div>
        </div>
      </main>

      {/* 4. CELEBRATORY "WELCOME TO DELHI" TRANSITION MODAL */}
      {showWelcome && welcomeUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#0E0E0E] border-2 border-[#CCFF00] p-6 text-center space-y-4 shadow-[0_0_35px_rgba(204,255,0,0.3)] animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto bg-[#CCFF00] text-black flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[9.5px] font-mono font-black tracking-widest text-black uppercase bg-[#CCFF00] px-2.5 py-0.5">
                AUTHENTICATED
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase mt-2.5 tracking-tight">
                Welcome to Delhi! 🇮🇳
              </h2>
              <p className="text-xs text-[#8E8E93] mt-1">
                Connected as <strong className="text-white">{welcomeUser.name}</strong> ({welcomeUser.passId}).
              </p>
            </div>

            <div className="pt-2">
              <div className="w-full bg-[#1C1C1C] h-1.5 overflow-hidden">
                <div className="bg-[#CCFF00] h-full w-full animate-[progress_1s_ease-in-out]"></div>
              </div>
              <span className="text-[10px] font-mono text-[#666666] mt-2 inline-block uppercase">
                Loading live Delhi transit map...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full bg-[#000000] border-t border-[#222222] py-3.5 px-6 text-center text-xs font-mono text-[#666666]">
        <span>© 2026 PRAVAAH · DELHI TRANSPORT STACK</span>
      </footer>
    </div>
  );
}
