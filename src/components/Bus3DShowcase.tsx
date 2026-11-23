import {
  ArrowUpRight,
  Clock,
  Users,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

export interface Bus3DShowcaseProps {
  onOpenLiveMap?: () => void;
  onOpenMap?: () => void;
  activeBusCount?: number;
  gpsSyncPercent?: number;
}

export function Bus3DShowcase({
  onOpenLiveMap,
  onOpenMap,
  activeBusCount = 72,
  gpsSyncPercent = 98.4,
}: Bus3DShowcaseProps) {
  const handleOpenMap = onOpenLiveMap || onOpenMap || (() => {});

  // Interactive 3D Perspective Tilt on Mouse Movement
  const stageRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Gentle 3D perspective tilt
    const rX = -((y - centerY) / centerY) * 7;
    const rY = ((x - centerX) / centerX) * 9;

    setRotateX(rX);
    setRotateY(rY);
    setGlareX((x / rect.width) * 100);
    setGlareY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <div className="relative w-full h-full min-h-[540px] bg-[#0a0c10] overflow-hidden flex flex-col justify-between select-none">
      {/* Background Holographic Glow Gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(204, 255, 0, 0.12) 0%, rgba(10, 12, 16, 0) 65%)',
        }}
      />

      {/* Top Floating Telemetry Badges (Exact Reference Placement) */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 pointer-events-none">
        {/* Left: 72 ACTIVE FLEET */}
        <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#121620]/90 border border-[#232a3d] backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.6)] pointer-events-auto">
          <div className="w-5 h-5 rounded-full bg-[#ccff00]/15 flex items-center justify-center text-[#ccff00]">
            <Users className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider text-white">
            <span className="text-[#ccff00] font-black">{activeBusCount}</span> ACTIVE FLEET
          </span>
        </div>

        {/* Right: 98.4% GPS SYNC */}
        <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#121620]/90 border border-[#232a3d] backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.6)] pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse shadow-[0_0_8px_#ccff00]" />
          <span className="text-xs font-mono font-bold tracking-wider text-white">
            <span className="text-[#ccff00] font-black">{gpsSyncPercent}%</span> GPS SYNC
          </span>
        </div>
      </div>

      {/* Center Stage: High-Fidelity Bus Visual with Holographic Radar Pedestal */}
      <div
        className="relative flex-1 w-full flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Concentric Animated Radar Floor Disc (Background beneath the bus) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer Radar Ring with Degree Ticks */}
          <div className="w-[380px] sm:w-[500px] lg:w-[600px] h-[380px] sm:h-[500px] lg:h-[600px] rounded-full border border-[#ccff00]/25 relative animate-[spin_80s_linear_infinite]">
            <div className="absolute inset-3 rounded-full border border-[#38bdf8]/20 border-dashed" />
            <div className="absolute inset-10 rounded-full border border-[#ccff00]/30" />
            <div className="absolute inset-20 rounded-full border border-[#38bdf8]/25 border-dotted" />
            <div className="absolute inset-28 rounded-full border border-[#ccff00]/40" />
          </div>

          {/* Holographic Concentric Pulse Radiance */}
          <div className="absolute w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] rounded-full bg-gradient-to-r from-[#ccff00]/10 via-[#38bdf8]/10 to-[#ccff00]/10 blur-xl" />
        </div>

        {/* 3D Perspective Tilt Stage Container */}
        <div
          ref={stageRef}
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${
              isHovered ? 1.02 : 1
            }, ${isHovered ? 1.02 : 1}, 1)`,
            transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
          }}
          className="relative max-w-2xl w-full flex items-center justify-center z-10 cursor-pointer group"
          onClick={handleOpenMap}
          title="Click to open full-screen Delhi Live Map"
        >
          {/* Dynamic Glare Reflection Overlay on Hover */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300 z-20"
            style={{
              background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(204, 255, 0, 0.15) 0%, transparent 60%)`,
              opacity: isHovered ? 1 : 0.2,
            }}
          />

          {/* The Exact High-Resolution Delhi Electric Bus Image */}
          <div className="relative w-full flex items-center justify-center">
            <img
              src="./images/delhi-bus-3d.png"
              alt="Delhi Transit Electric Bus 3D Render"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.indexOf('delhi-bus-3d.png') !== -1 && !target.dataset.triedFallback) {
                  target.dataset.triedFallback = 'true';
                  target.src = '/images/delhi-bus-3d.png';
                }
              }}
              className="w-full max-h-[380px] sm:max-h-[440px] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* Bottom-Right Floating Pill: REAL-TIME AI ETA */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#121620]/90 border border-[#232a3d] backdrop-blur-md absolute bottom-12 right-6 lg:right-10 pointer-events-none z-20 shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
          <Clock className="w-3.5 h-3.5 text-[#ccff00]" />
          <span className="text-xs font-mono font-bold tracking-wider text-white">
            REAL-TIME AI ETA
          </span>
        </div>
      </div>

      {/* Bottom CTA Hero Dock (Exact Button & Subtitle) */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 sm:px-6 pb-6 sm:pb-8 pt-2 pointer-events-auto bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/90 to-transparent">
        <button
          type="button"
          onClick={handleOpenMap}
          className="group flex items-center gap-2 px-8 sm:px-9 py-3 sm:py-3.5 rounded-full bg-[#ccff00] hover:bg-[#d8ff33] text-black font-sans font-black text-xs sm:text-[13px] tracking-wider uppercase transition-all duration-200 shadow-[0_0_25px_rgba(204,255,0,0.4)] hover:shadow-[0_0_35px_rgba(204,255,0,0.65)] cursor-pointer border-2 border-black active:scale-95"
        >
          <span>OPEN LIVE DELHI MAP</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
        <p className="mt-2 text-[11px] sm:text-xs text-slate-400 max-w-md font-sans">
          Launch real-time tracking, live delay models, and crowd telemetry in a full-screen view.
        </p>
      </div>
    </div>
  );
}

// Re-export as Rotatable3DBusStage to keep full compatibility
export { Bus3DShowcase as Rotatable3DBusStage };
export default Bus3DShowcase;
