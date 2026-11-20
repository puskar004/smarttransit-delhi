import {
  Compass,
  LogOut,
  QrCode,
  Ticket,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { UserProfile } from './AuthScreen';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSignOut: () => void;
  onSwitchUser: (user: UserProfile) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
  onSwitchUser,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'pass' | 'stats' | 'security'>('pass');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans">
      <div className="w-full max-w-2xl bg-[#0E0E0E] border-2 border-[#262626] shadow-[0_0_35px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#CCFF00] text-black font-black flex items-center justify-center">
              <User className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-white leading-tight">
                COMMUTER PROFILE &amp; PASS
              </h2>
              <p className="text-[10.5px] font-mono text-[#8E8E93]">
                DELHI TRANSPORT STACK • VERIFIED PASSENGER ID
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-[#141414] hover:bg-[#CCFF00] hover:text-black border border-[#262626] text-[#8E8E93] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* User Hero Banner */}
          <div className="p-5 bg-[#141414] border border-[#262626] flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative">
              <div className="w-16 h-16 bg-[#CCFF00] text-black font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                {currentUser.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-black border-2 border-[#CCFF00] text-[#CCFF00] flex items-center justify-center text-[10px] font-black">
                ✓
              </span>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-xl font-black uppercase text-white tracking-tight">{currentUser.name}</h3>
                <span className="px-2 py-0.5 text-[9.5px] font-mono font-black uppercase tracking-wider bg-[#CCFF00] text-black">
                  VERIFIED PASSENGER
                </span>
              </div>

              <p className="text-xs font-mono text-[#8E8E93]">
                CONTACT: <strong className="text-white">{currentUser.emailOrPhone}</strong> •
                PASS: <strong className="text-[#CCFF00]">{currentUser.passId}</strong>
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-[#8E8E93] pt-1 flex-wrap">
                <span className="flex items-center gap-1 bg-[#0A0A0A] px-2 py-0.5 border border-[#262626]">
                  <Compass className="w-3.5 h-3.5 text-[#CCFF00]" />
                  CORRIDOR: <b className="text-white uppercase">{currentUser.corridor || 'Okhla Ph-III ↔ AIIMS'}</b>
                </span>
                <span className="flex items-center gap-1 bg-[#0A0A0A] px-2 py-0.5 border border-[#262626]">
                  <Wallet className="w-3.5 h-3.5 text-[#CCFF00]" />
                  WALLET: <b className="text-[#CCFF00]">₹58.78</b>
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-3 p-1 bg-[#141414] border border-[#262626] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('pass')}
              className={`py-2 uppercase font-black tracking-wider transition-all cursor-pointer ${
                activeTab === 'pass'
                  ? 'bg-[#CCFF00] text-black'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Digital Pass (QR)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`py-2 uppercase font-black tracking-wider transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-[#CCFF00] text-black'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Transit Stats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-2 uppercase font-black tracking-wider transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#CCFF00] text-black'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              Switch Persona
            </button>
          </div>

          {/* TAB 1: DIGITAL TRANSIT PASS */}
          {activeTab === 'pass' && (
            <div className="p-6 bg-[#0A0A0A] border-2 border-[#CCFF00] text-white space-y-4 shadow-[0_0_20px_rgba(204,255,0,0.15)]">
              <div className="flex items-center justify-between border-b border-[#222222] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#CCFF00] text-black flex items-center justify-center font-bold">
                    <Ticket className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black text-[#CCFF00] block tracking-wider uppercase">
                      DELHI DIGITAL TRANSIT CARD
                    </span>
                    <strong className="text-sm font-mono text-white">{currentUser.passId}</strong>
                  </div>
                </div>
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 bg-[#141414] text-[#CCFF00] border border-[#333333] uppercase">
                  ETM VALIDATED
                </span>
              </div>

              {/* QR Code Simulation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                <div className="p-3 bg-white border-2 border-[#CCFF00] inline-block">
                  <div className="w-32 h-32 flex flex-col items-center justify-center text-black space-y-1">
                    <QrCode className="w-24 h-24 stroke-[1.8]" />
                    <span className="text-[8px] font-mono font-bold tracking-widest uppercase">
                      SCAN ON DTC ETM
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs font-mono text-[#8E8E93]">
                  <div className="flex justify-between border-b border-[#1C1C1C] pb-1">
                    <span>CARD HOLDER:</span>
                    <strong className="text-white uppercase">{currentUser.name}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1C1C1C] pb-1">
                    <span>PASS STATUS:</span>
                    <strong className="text-[#CCFF00]">ACTIVE UNLIMITED</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1C1C1C] pb-1">
                    <span>VALID TILL:</span>
                    <strong className="text-white">31 DEC 2026</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1C1C1C] pb-1">
                    <span>CROWD PRIORITY:</span>
                    <strong className="text-[#CCFF00]">SEATS &amp; COMFORT</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>AVAILABLE WALLET:</span>
                    <strong className="text-lg font-black text-[#CCFF00]">₹58.78</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSIT STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-3 font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#141414] border border-[#222222]">
                  <span className="text-[9.5px] uppercase text-[#666666] block">TOTAL TRIPS TAKEN</span>
                  <strong className="text-2xl font-black text-white mt-0.5 block">48</strong>
                  <span className="text-[10px] text-[#CCFF00]">This Month</span>
                </div>
                <div className="p-3.5 bg-[#141414] border border-[#222222]">
                  <span className="text-[9.5px] uppercase text-[#666666] block">HOURS SAVED</span>
                  <strong className="text-2xl font-black text-[#CCFF00] mt-0.5 block">14.2h</strong>
                  <span className="text-[10px] text-[#8E8E93]">Via Delay Model</span>
                </div>
                <div className="p-3.5 bg-[#141414] border border-[#222222] col-span-2 sm:col-span-1">
                  <span className="text-[9.5px] uppercase text-[#666666] block">SEATS GUARANTEED</span>
                  <strong className="text-2xl font-black text-white mt-0.5 block">89%</strong>
                  <span className="text-[10px] text-[#CCFF00]">Comfort Routes</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#141414] border border-[#222222] text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#666666] block">
                  FREQUENT CORRIDORS:
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-white">
                    <span>1. Okhla Phase-III ↔ AIIMS</span>
                    <span className="text-[#CCFF00]">28 Trips</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>2. Nehru Place ↔ Anand Vihar</span>
                    <span className="text-[#CCFF00]">14 Trips</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>3. Hauz Khas ↔ Connaught Place</span>
                    <span className="text-[#CCFF00]">6 Trips</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SWITCH PERSONA */}
          {activeTab === 'security' && (
            <div className="space-y-2 font-mono">
              <span className="text-[10px] uppercase font-bold text-[#666666] block">
                SWITCH ACTIVE COMMUTER / STAFF PERSONA:
              </span>
              {[
                {
                  name: 'Rahul Verma',
                  emailOrPhone: '9871234560',
                  passId: 'DL-DTC-84920',
                  role: 'commuter' as const,
                  corridor: 'Okhla Ph-III ↔ AIIMS Ring Road',
                },
                {
                  name: 'Dr. Pooja Sharma',
                  emailOrPhone: '9810987654',
                  passId: 'DL-DTC-31042',
                  role: 'staff' as const,
                  corridor: 'South Delhi Hospital Corridor',
                },
                {
                  name: 'Transit Operations Lead',
                  emailOrPhone: 'operations@transportstack.in',
                  passId: 'DL-OPS-2026',
                  role: 'operations' as const,
                  corridor: 'Citywide 72 Bus Fleet',
                },
              ].map((user) => (
                <button
                  key={user.passId}
                  type="button"
                  onClick={() => onSwitchUser(user)}
                  className="w-full p-3 bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] hover:border-[#CCFF00] flex items-center justify-between text-left transition-all cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-black uppercase text-white block">
                      {user.name} ({user.role})
                    </span>
                    <span className="text-[10.5px] text-[#8E8E93] block">
                      Pass: <strong className="text-white">{user.passId}</strong> • {user.corridor}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-bold text-black bg-[#CCFF00] px-2 py-0.5 uppercase">
                    Select ↗
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#1F1F1F] flex items-center justify-between bg-[#0A0A0A]">
          <button
            type="button"
            onClick={onSignOut}
            className="px-3.5 py-1.5 border border-[#333333] hover:border-[#CCFF00] text-xs font-mono font-bold text-[#8E8E93] hover:text-[#CCFF00] inline-flex items-center gap-1.5 transition-all cursor-pointer uppercase"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
