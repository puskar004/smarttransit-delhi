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
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col text-slate-900 animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <User className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Commuter Profile &amp; Digital Pass
              </h2>
              <p className="text-[11px] text-slate-500">
                Delhi Transport Stack • Verified Passenger ID
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Hero Banner (SmartLearn /profile exact style) */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-50 via-indigo-50/60 to-fuchsia-50/40 border border-violet-100 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                {currentUser.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                ✓
              </span>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-xl font-black text-slate-900">{currentUser.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white">
                  VERIFIED PASSENGER
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Contact: <strong className="text-slate-800">{currentUser.emailOrPhone}</strong> •
                Pass ID: <strong className="font-mono text-violet-700">{currentUser.passId}</strong>
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-500 pt-1 flex-wrap">
                <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  <Compass className="w-3.5 h-3.5 text-violet-600" />
                  Corridor: <b>{currentUser.corridor || 'Okhla Ph-III ↔ AIIMS'}</b>
                </span>
                <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  Wallet: <b className="text-emerald-700">₹58.78</b>
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('pass')}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'pass'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Digital Pass (QR)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Transit Stats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Switch Persona
            </button>
          </div>

          {/* TAB 1: DIGITAL TRANSIT PASS */}
          {activeTab === 'pass' && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-[#1A2138] text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center font-bold">
                    <Ticket className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-violet-400 block tracking-wider uppercase">
                      DELHI DIGITAL TRANSIT CARD
                    </span>
                    <strong className="text-sm font-mono text-white">{currentUser.passId}</strong>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ● ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">PASSENGER NAME</span>
                  <strong className="text-white text-sm">{currentUser.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">PRIMARY CORRIDOR</span>
                  <strong className="text-white text-xs">{currentUser.corridor || 'South Delhi Ring Corridor'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">OPERATOR FLEET</span>
                  <strong className="text-slate-200">DTC Electric + DIMTS</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">EXPIRY / VALIDITY</span>
                  <strong className="text-emerald-400 font-mono">31 DEC 2026</strong>
                </div>
              </div>

              {/* QR Code Simulation */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <span>Scan at ETM Machine</span>
                    <span className="block text-[10px] text-slate-400">Automatic fare deduction &amp; seat reservation</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">BALANCE</span>
                  <strong className="text-lg font-bold text-emerald-400">₹58.78</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSIT STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100">
                  <span className="text-2xl font-black text-violet-700 block">42</span>
                  <span className="text-[11px] font-bold text-slate-600">Monthly Trips</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-2xl font-black text-emerald-700 block">94%</span>
                  <span className="text-[11px] font-bold text-slate-600">On-Time Rate</span>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100">
                  <span className="text-2xl font-black text-sky-700 block">18.5 kg</span>
                  <span className="text-[11px] font-bold text-slate-600">CO₂ Avoided</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>AI Crowd Preference</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Guaranteed Seat Active
                  </span>
                </div>
                <p className="text-[11.5px] leading-relaxed">
                  SmartTransit AI automatically routes you to buses with &lt;40% crowd occupancy,
                  prioritizing comfort and seating availability.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SWITCH PERSONA */}
          {activeTab === 'security' && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                SWITCH TO ANOTHER DEMO PROFILE:
              </span>

              <div className="space-y-2">
                {[
                  {
                    name: 'Rahul Verma',
                    emailOrPhone: '9871234560',
                    passId: 'DL-DTC-84920',
                    role: 'commuter' as const,
                    corridor: 'Okhla Ph-III ↔ AIIMS Ring Road',
                    title: 'Daily Commuter',
                    avatar: '👨‍💼',
                  },
                  {
                    name: 'Dr. Pooja Sharma',
                    emailOrPhone: '9810987654',
                    passId: 'DL-DTC-31042',
                    role: 'staff' as const,
                    corridor: 'South Delhi Hospital Corridor',
                    title: 'Medical Staff (Comfort Priority)',
                    avatar: '👩‍⚕️',
                  },
                  {
                    name: 'Transit Operations Lead',
                    emailOrPhone: 'operations@transportstack.in',
                    passId: 'DL-OPS-2026',
                    role: 'operations' as const,
                    corridor: 'Citywide 72 Bus Fleet',
                    title: 'Fleet Operations Desk',
                    avatar: '⚡',
                  },
                ].map((p) => (
                  <button
                    key={p.passId}
                    type="button"
                    onClick={() => {
                      onSwitchUser(p);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                      currentUser.passId === p.passId
                        ? 'bg-violet-50 border-violet-300 ring-2 ring-violet-500/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.avatar}</span>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block leading-tight">
                          {p.name}
                        </strong>
                        <span className="text-[11px] text-slate-500 leading-tight block">
                          {p.title} · <code className="font-bold text-violet-700">{p.passId}</code>
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded-full">
                      {currentUser.passId === p.passId ? 'Current' : 'Switch →'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Sign Out */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out &amp; Return to Login</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-violet-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
