import {
  CheckCircle2,
  Copy,
  Download,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { UserProfile } from './AuthScreen';

export interface TicketConfig {
  route?: string;
  from?: string;
  to?: string;
  fare?: number;
  vehicleId?: string;
  type?: 'single' | 'pink' | 'daily' | 'pass';
}

interface DigitalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialConfig?: TicketConfig | null;
  lang?: 'en' | 'hi';
}

export function DigitalTicketModal({
  isOpen,
  onClose,
  currentUser,
  initialConfig,
  lang = 'en',
}: DigitalTicketModalProps) {
  const [ticketType, setTicketType] = useState<'single' | 'pink' | 'daily' | 'pass'>(
    initialConfig?.type ?? 'single'
  );
  const [issuedTime, setIssuedTime] = useState<string>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Generate realistic Delhi ETM ticket details
  useEffect(() => {
    if (isOpen) {
      if (initialConfig?.type) {
        setTicketType(initialConfig.type);
      }
      const now = new Date();
      setIssuedTime(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
          ', ' +
          now.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
      );
      const randomTicketSeq = Math.floor(100000 + Math.random() * 900000);
      setTicketNumber(`DL-DTC-ETM-${randomTicketSeq}`);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const routeName = initialConfig?.route || '534';
  const fromStop = initialConfig?.from || 'IIIT Delhi (Okhla Ph-III)';
  const toStop = initialConfig?.to || 'AIIMS Ring Road';
  const vehiclePlate = initialConfig?.vehicleId || 'DL51EV-1557';
  const baseFare = initialConfig?.fare ?? (routeName.startsWith('EXP') ? 25 : 15);

  const fareAmount =
    ticketType === 'pink' ? 0 : ticketType === 'daily' ? 50 : ticketType === 'pass' ? 0 : baseFare;

  const handleRefreshQr = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const randomTicketSeq = Math.floor(100000 + Math.random() * 900000);
      setTicketNumber(`DL-DTC-ETM-${randomTicketSeq}`);
      setIsRefreshing(false);
    }, 450);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(
      `DTC DIGITAL TICKET: ${ticketNumber} | Route: ${routeName} | From: ${fromStop} to ${toStop} | Fare: ₹${fareAmount}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans">
      <div className="w-full max-w-lg bg-[#0E1015] border-2 border-[#262c3e] shadow-[0_0_50px_rgba(0,0,0,0.95)] rounded-2xl overflow-hidden flex flex-col text-white animate-in zoom-in-95 duration-200 max-h-[94vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#1c2232] flex items-center justify-between bg-[#0a0c10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00] text-black font-black flex items-center justify-center shadow-[0_0_12px_rgba(204,255,0,0.4)]">
              <Ticket className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white leading-tight">
                {lang === 'hi' ? 'डीटीसी डिजिटल ई-टिकट एवं पास' : 'DTC DIGITAL E-TICKET & PASS'}
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                GOVT. OF NCT OF DELHI • TRANSPORT DEPARTMENT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#141824] hover:bg-[#CCFF00] hover:text-black border border-[#242c3e] text-slate-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Ticket Type Selector Tabs */}
          <div className="grid grid-cols-4 p-1 bg-[#121622] rounded-xl border border-[#222a3d] text-[10.5px] font-mono font-black">
            <button
              type="button"
              onClick={() => setTicketType('single')}
              className={`py-2 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                ticketType === 'single'
                  ? 'bg-[#CCFF00] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'hi' ? 'ई-टिकट' : 'E-TICKET'}
            </button>
            <button
              type="button"
              onClick={() => setTicketType('pink')}
              className={`py-2 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                ticketType === 'pink'
                  ? 'bg-[#f472b6] text-black shadow-sm'
                  : 'text-slate-400 hover:text-[#f472b6]'
              }`}
            >
              {lang === 'hi' ? 'गुलाबी टिकट' : 'PINK PASS'}
            </button>
            <button
              type="button"
              onClick={() => setTicketType('daily')}
              className={`py-2 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                ticketType === 'daily'
                  ? 'bg-[#38bdf8] text-black shadow-sm'
                  : 'text-slate-400 hover:text-[#38bdf8]'
              }`}
            >
              {lang === 'hi' ? 'दैनिक पास' : 'DAILY PASS'}
            </button>
            <button
              type="button"
              onClick={() => setTicketType('pass')}
              className={`py-2 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                ticketType === 'pass'
                  ? 'bg-[#CCFF00] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'hi' ? 'स्मार्ट कार्ड' : 'SMART ID'}
            </button>
          </div>

          {/* Ticket Card Component */}
          <div
            className={`relative rounded-2xl border-2 overflow-hidden shadow-2xl transition-all ${
              ticketType === 'pink'
                ? 'bg-[#150a12] border-[#f472b6] shadow-[0_0_30px_rgba(244,114,182,0.2)]'
                : ticketType === 'daily'
                ? 'bg-[#08121a] border-[#38bdf8] shadow-[0_0_30px_rgba(56,189,248,0.2)]'
                : 'bg-[#0a0d14] border-[#CCFF00] shadow-[0_0_30px_rgba(204,255,0,0.18)]'
            }`}
          >
            {/* Top Security Shimmer Banner */}
            <div
              className={`px-4 py-2 flex items-center justify-between text-[10px] font-mono font-black uppercase tracking-wider ${
                ticketType === 'pink'
                  ? 'bg-[#f472b6] text-black'
                  : ticketType === 'daily'
                  ? 'bg-[#38bdf8] text-black'
                  : 'bg-[#CCFF00] text-black'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                {ticketType === 'pink'
                  ? 'DELHI GOVT. PINK PASS • FREE TRAVEL FOR WOMEN'
                  : ticketType === 'daily'
                  ? 'DTC ALL-ROUTE DAILY PASS • 24 HOURS'
                  : ticketType === 'pass'
                  ? 'DELHI COMMUTER SMART CARD PASS'
                  : 'VALID DTC / DIMTS SINGLE JOURNEY TICKET'}
              </span>
              <span className="font-bold">ETM VERIFIED ✓</span>
            </div>

            {/* Inner Ticket Body */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Route & Price Row */}
              <div className="flex items-center justify-between border-b border-[#222838] pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-md ${
                      ticketType === 'pink'
                        ? 'bg-[#f472b6] text-black'
                        : ticketType === 'daily'
                        ? 'bg-[#38bdf8] text-black'
                        : 'bg-[#CCFF00] text-black'
                    }`}
                  >
                    {ticketType === 'daily' ? 'ALL' : routeName}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">
                      {ticketType === 'pink'
                        ? 'MAHILA YATRA PASS (DTC & CLUSTER)'
                        : ticketType === 'daily'
                        ? 'ALL AC & NON-AC BUSES'
                        : `BUS ROUTE ${routeName}`}
                    </span>
                    <strong className="text-sm font-mono font-bold text-white">
                      {vehiclePlate} • LOW-FLOOR EV
                    </strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9.5px] font-mono text-slate-400 block uppercase">
                    {ticketType === 'pink' ? 'CONCESSION FARE' : 'FARE CHARGED'}
                  </span>
                  <div
                    className={`text-2xl sm:text-3xl font-black font-mono leading-none ${
                      ticketType === 'pink'
                        ? 'text-[#f472b6]'
                        : ticketType === 'daily'
                        ? 'text-[#38bdf8]'
                        : 'text-[#CCFF00]'
                    }`}
                  >
                    {ticketType === 'pink' ? '₹0' : `₹${fareAmount}`}
                  </div>
                  {ticketType === 'pink' && (
                    <span className="text-[9px] font-mono text-[#f472b6] font-bold block mt-0.5">
                      100% Free Concession
                    </span>
                  )}
                </div>
              </div>

              {/* Origin -> Destination Route Details */}
              <div className="bg-[#121622] rounded-xl p-3 border border-[#222a3d] space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0" />
                  <span className="text-slate-400 text-[10px] uppercase shrink-0">BOARDING:</span>
                  <strong className="text-white truncate">{fromStop}</strong>
                </div>
                <div className="border-l border-dashed border-slate-600 ml-1.25 h-2" />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span className="text-slate-400 text-[10px] uppercase shrink-0">DESTINATION:</span>
                  <strong className="text-white truncate">{toStop}</strong>
                </div>
              </div>

              {/* High-Contrast Dynamic QR Code with Animated Scan Indicator */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                <div className="relative p-3.5 bg-white rounded-xl shadow-xl border-2 border-black inline-block group">
                  <div className="w-32 h-32 flex flex-col items-center justify-center text-black space-y-1 relative overflow-hidden">
                    <QrCode
                      className={`w-28 h-28 stroke-[1.8] transition-transform ${
                        isRefreshing ? 'scale-90 opacity-40' : 'scale-100'
                      }`}
                    />
                    {/* Animated Scanning Line */}
                    <div className="absolute inset-x-0 h-1 bg-emerald-500 shadow-[0_0_8px_#10B981] animate-bounce pointer-events-none opacity-80" />
                    <span className="text-[7.5px] font-mono font-bold tracking-widest uppercase">
                      SCAN ON DTC CONDUCTOR ETM
                    </span>
                  </div>
                </div>

                {/* ETM & Ticket Audit Breakdown */}
                <div className="flex-1 space-y-1.5 text-xs font-mono text-slate-400 w-full">
                  <div className="flex justify-between border-b border-[#1c2232] pb-1">
                    <span>TICKET ID:</span>
                    <strong className="text-white">{ticketNumber}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1c2232] pb-1">
                    <span>PASSENGER:</span>
                    <strong className="text-white uppercase">{currentUser.name || 'Rahul Verma'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1c2232] pb-1">
                    <span>ISSUED AT:</span>
                    <strong className="text-white">{issuedTime || 'Just Now'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1c2232] pb-1">
                    <span>VALIDITY:</span>
                    <strong
                      className={
                        ticketType === 'daily'
                          ? 'text-[#38bdf8]'
                          : ticketType === 'pink'
                          ? 'text-[#f472b6]'
                          : 'text-[#CCFF00]'
                      }
                    >
                      {ticketType === 'daily'
                        ? 'UNTIL MIDNIGHT (23:59)'
                        : 'VALID FOR 2.5 HOURS'}
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-[#1c2232] pb-1">
                    <span>ETM / DEPOT:</span>
                    <strong className="text-white">DTC-OKH-489 • DEPOT-04</strong>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span>SECURITY HASH:</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      SHA256: 8f4b-c912-dtc✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Watermark & Anti-fraud badge */}
              <div className="p-2.5 rounded-xl bg-[#0a0c10] border border-[#1e2536] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
                  <span>NCT DELHI GOVT. CERTIFIED TRANSIT TICKET</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">● ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={handleRefreshQr}
              className="p-2.5 rounded-xl bg-[#141824] hover:bg-[#1e2538] border border-[#242c3e] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Generate fresh ticket token"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#CCFF00]' : ''}`}
              />
              <span>Refresh QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-[#141824] hover:bg-[#1e2538] border border-[#242c3e] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Copy Ticket Details"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Info</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                window.print?.();
              }}
              className="p-2.5 rounded-xl bg-[#141824] hover:bg-[#1e2538] border border-[#242c3e] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Print or Save PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Save / Print</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1c2232] flex items-center justify-between bg-[#0a0c10]">
          <span className="text-[10.5px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#CCFF00]" />
            Valid across all DTC, DIMTS &amp; Cluster AC/Non-AC fleets
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#bfe600] text-black font-sans font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {lang === 'hi' ? 'पूर्ण / बंद करें' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
