import {
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileCode,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

interface ApiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSampleCsv: () => void;
  onDownloadSampleCsv: () => void;
  onExportGeoJson: () => void;
}

export function ApiGuideModal({
  isOpen,
  onClose,
  onRunSampleCsv,
  onDownloadSampleCsv,
  onExportGeoJson,
}: ApiGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#11131C] border border-[#272C3D] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222736] flex items-center justify-between gap-3 bg-[#161925]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A855F7] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)]">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-[18px] font-black text-white leading-tight">
                Delhi Transport Stack: APIs & Data Guide
              </h2>
              <p className="text-[11px] text-[#94A3B8]">
                Where to get live APIs, official datasets, and how this prototype processes them
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#222738] hover:bg-[#2C344A] text-[#94A3B8] hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Quick Clear Answer in Hindi & English */}
          <div className="p-4 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 space-y-2">
            <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-[13px]">
              <Sparkles className="w-4 h-4" />
              <span>API kahan se milti hai? (Direct Answer)</span>
            </div>
            <p className="text-[12.5px] text-[#CBD5E1] leading-relaxed">
              Delhi Transit ecosystem me <b>2 official sources</b> se API milti hai:
              <br />
              <b>1. Delhi Government OTD (Open Transit Data):</b>{' '}
              <a
                href="https://otd.delhi.gov.in"
                target="_blank"
                rel="noreferrer"
                className="text-[#00E5FF] underline inline-flex items-center gap-1 font-semibold"
              >
                otd.delhi.gov.in <ExternalLink className="w-3 h-3" />
              </a>{' '}
              par free account banta hai aur turant API key milti hai jisme live bus GPS feed aati hai.
              <br />
              <b>2. Delhi Transport Stack Portal:</b> Authorities (Delhi Transport Stack, DTC) registered partners ko
              official API endpoint aur AFC ticketing dataset dete hain (delhi.transportstack.in).
            </p>
          </div>

          {/* Built-in Engine Feature: Zero API Key required for demo! */}
          <div className="p-4 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 space-y-2">
            <div className="flex items-center gap-2 text-[#10B981] font-bold text-[13px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Prototype Demo ke liye API Key ki zarurat nahi hai! (Built-In Engine)</span>
            </div>
            <p className="text-[12px] text-[#94A3B8] leading-relaxed">
              Humare is prototype me <b>Delhi Transit Engine</b> pehle se integrated hai! Ye real-time
              me <b>72 authentic DTC electric & DIMTS buses</b> ke continuous GPS coordinates, speed,
              aur ETM passenger crowd telemetry generate karta hai. Aap bina kisi external API ke
              bhi judges ko poora live prototype dikha sakte hain!
            </p>
          </div>

          {/* 3 Steps: How real Delhi Transit pipeline works */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-black uppercase tracking-wider text-white">
              Complete Transit Stack Pipeline (Problem 1 &amp; 2)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
              <div className="p-3.5 rounded-xl bg-[#161925] border border-[#232838] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center font-bold">
                  1
                </div>
                <div className="font-bold text-white">OTD Live GPS Ingestion</div>
                <div className="text-[11px] text-[#94A3B8] leading-tight">
                  GPS coordinates of 7,000+ Delhi buses snapped to directed road polylines via Kalman filter.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161925] border border-[#232838] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center font-bold">
                  2
                </div>
                <div className="font-bold text-white">ETM Crowdedness Model</div>
                <div className="text-[11px] text-[#94A3B8] leading-tight">
                  Electronic ticketing machine boarding & alighting records compute real-time bus passenger loads.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161925] border border-[#232838] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold">
                  3
                </div>
                <div className="font-bold text-white">AI Multi-Criteria Router</div>
                <div className="text-[11px] text-[#94A3B8] leading-tight">
                  Suggests the best balance: fastest route vs guaranteed seat comfort with clear explanations.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions: Sample CSV, Ingest & Export */}
          <div className="p-4 rounded-2xl bg-[#181B28] border border-[#293043] space-y-3">
            <h4 className="text-[12px] font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#A855F7]" />
              <span>Test with Custom Datasets or Export</span>
            </h4>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onRunSampleCsv();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-[#00E5FF] text-black font-bold text-[12px] inline-flex items-center gap-1.5 hover:bg-[#38BDF8] transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Inject Sample Delhi GPS Pings</span>
              </button>

              <button
                type="button"
                onClick={onDownloadSampleCsv}
                className="px-3.5 py-2 rounded-xl bg-[#222738] text-white hover:bg-[#2C344A] border border-[#353E55] font-bold text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Download Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={onExportGeoJson}
                className="px-3.5 py-2 rounded-xl bg-[#222738] text-white hover:bg-[#2C344A] border border-[#353E55] font-bold text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Export Live GeoJSON API</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#222736] bg-[#161925] flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span>Official resources for Delhi Transport Stack</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#CCFF00] text-black font-black uppercase text-xs cursor-pointer hover:bg-[#B8E600]"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
