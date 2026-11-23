import { Check, Compass, Globe, Radio } from 'lucide-react';
import { useState } from 'react';

interface LanguageSelectScreenProps {
  onSelectLanguage: (lang: 'en' | 'hi') => void;
  currentLang?: 'en' | 'hi';
}

export function LanguageSelectScreen({
  onSelectLanguage,
  currentLang = 'en',
}: LanguageSelectScreenProps) {
  const [selected, setSelected] = useState<'en' | 'hi'>(currentLang);

  const handleConfirm = () => {
    onSelectLanguage(selected);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between overflow-x-hidden bg-[#07090e] text-white font-sans select-none">
      {/* 1. TOP TICKER */}
      <div className="bg-[#CCFF00] text-black font-mono font-black text-[10.5px] sm:text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between tracking-wider uppercase shrink-0 border-b border-black">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-black animate-ping" />
          <span>72 LIVE BUSES • AVLS GPS — REAL-TIME DELHI TRANSIT STACK</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px]">
          <span>LANGUAGE SELECTION</span>
          <span>•</span>
          <span>भाषा चयन</span>
          <span>•</span>
          <span>98.4% GPS SYNC</span>
        </div>
        <span className="font-mono text-[10px] font-black">DELHI NCT ↗</span>
      </div>

      {/* 2. HEADER */}
      <header className="w-full bg-[#0c0e14] border-b border-[#1c2232] sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-[62px] flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold text-slate-300 bg-[#121620] border border-[#232a3d]">
              <Radio className="w-3.5 h-3.5 text-[#CCFF00] animate-pulse" />
              <span>72 LIVE BUSES</span>
            </span>
          </div>
        </div>
      </header>

      {/* 3. MAIN CENTER SELECTION MODAL */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full rounded-3xl bg-[#0d1017] border-2 border-[#22293a] shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-6 sm:p-10 space-y-7 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(204,255,0,0.12) 0%, transparent 70%)',
            }}
          />

          {/* Heading */}
          <div className="text-center space-y-2 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#151a26] border border-[#263147] text-[#CCFF00] flex items-center justify-center mx-auto shadow-inner">
              <Globe className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-2">
              SELECT LANGUAGE / भाषा चुनें
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Please choose your preferred language before entering SmartTransit Delhi.
              <br />
              <span className="text-slate-300 font-medium">दिल्ली ट्रांजिट में आगे बढ़ने के लिए अपनी भाषा चुनें।</span>
            </p>
          </div>

          {/* Language Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {/* 1. English Option */}
            <div
              onClick={() => setSelected('en')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                selected === 'en'
                  ? 'bg-[#151a26] border-[#CCFF00] shadow-[0_0_25px_rgba(204,255,0,0.2)]'
                  : 'bg-[#10131c] border-[#222a3d] hover:border-[#333e59] hover:bg-[#131722]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#CCFF00] uppercase">
                    PRIMARY
                  </span>
                  <h2 className="text-xl font-black text-white">English</h2>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected === 'en'
                      ? 'border-[#CCFF00] bg-[#CCFF00] text-black font-black'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {selected === 'en' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Full transit planner in English with real-time AVLS GPS, DTC bus tracking, and Kalman delay predictions.
              </p>

              <div className="pt-1 text-[11px] font-mono text-slate-500">
                <span>Default NCT Transit Format</span>
              </div>
            </div>

            {/* 2. Hindi Option */}
            <div
              onClick={() => setSelected('hi')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                selected === 'hi'
                  ? 'bg-[#151a26] border-[#CCFF00] shadow-[0_0_25px_rgba(204,255,0,0.2)]'
                  : 'bg-[#10131c] border-[#222a3d] hover:border-[#333e59] hover:bg-[#131722]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#CCFF00] uppercase">
                    देवनागरी
                  </span>
                  <h2 className="text-xl font-black text-white font-sans">हिन्दी (Hindi)</h2>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected === 'hi'
                      ? 'border-[#CCFF00] bg-[#CCFF00] text-black font-black'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {selected === 'hi' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                हिंदी में दिल्ली बस रूट, लाइव जीपीएस ट्रैकिंग, मेट्रो स्टेशन और किराया जानकारी देखें।
              </p>

              <div className="pt-1 text-[11px] font-mono text-slate-500">
                <span>दिल्ली-एनसीआर अनुकूलित</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-3 relative z-10 pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl bg-[#CCFF00] hover:bg-[#d8ff33] text-black font-sans font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(204,255,0,0.35)] hover:shadow-[0_0_35px_rgba(204,255,0,0.55)] cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] border-2 border-black"
            >
              <span>
                {selected === 'hi' ? 'आगे बढ़ें / ENTER TRANSIT' : 'CONTINUE TO TRANSIT / आगे बढ़ें'}
              </span>
              <span className="font-mono text-base font-black">↗</span>
            </button>

            <p className="text-center text-[11px] font-mono text-slate-400">
              {selected === 'hi'
                ? 'भाषा को कभी भी ऊपर दिए गए मेनू (ENG/हिन्दी) से बदला जा सकता है।'
                : 'You can switch languages anytime from the header toggle.'}
            </p>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="py-4 px-6 text-center text-xs font-mono text-slate-400 border-t border-[#1c2232] bg-[#0c0e14]">
        <span>SMARTTRANSIT AI DELHI • OFFICIAL TRANSPORT DATA STACK &copy; 2026</span>
      </footer>
    </div>
  );
}
