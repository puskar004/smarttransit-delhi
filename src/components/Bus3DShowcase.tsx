import {
  ContactShadows,
  Float,
  OrbitControls,
  RoundedBox,
  Text,
  useGLTF,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ArrowUpRight,
  Clock,
  Compass,
  Layers,
  Radio,
  RotateCw,
  Sparkles,
  Users,
} from 'lucide-react';
import React, { Component, Suspense, useRef, useState } from 'react';
import * as THREE from 'three';

// --- WebGL Error Boundary ---
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('WebGL / R3F Canvas caught error, displaying fallback 2D tilt UI:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// --- Procedural 3D Delhi Electric Transit Bus Model ---
export function ElectricBusModel() {
  const busGroup = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (busGroup.current) {
      busGroup.current.position.y = Math.sin(t * 1.5) * 0.06;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.25;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -t * 0.15;
    }
  });

  return (
    <group position={[0, -0.3, 0]}>
      {/* 3D Electric Delhi Bus Group */}
      <group ref={busGroup} rotation={[0, -Math.PI / 4.5, 0]}>
        {/* Main Bus Body */}
        <RoundedBox args={[4.4, 1.35, 1.55]} radius={0.14} smoothness={4} position={[0, 0.85, 0]}>
          <meshStandardMaterial color="#181b1f" metalness={0.85} roughness={0.2} />
        </RoundedBox>

        {/* Glowing Neon Lime Roof Cantrail Strip */}
        <RoundedBox args={[4.2, 0.14, 1.58]} radius={0.04} smoothness={2} position={[0, 1.46, 0]}>
          <meshStandardMaterial color="#ccff00" emissive="#ccff00" emissiveIntensity={1.6} />
        </RoundedBox>

        {/* Side Passenger Tinted Panoramic Windows */}
        <RoundedBox args={[3.5, 0.62, 1.57]} radius={0.06} smoothness={2} position={[-0.1, 0.92, 0]}>
          <meshPhysicalMaterial
            color="#090d11"
            metalness={0.1}
            roughness={0.05}
            transmission={0.5}
            opacity={0.9}
            transparent
          />
        </RoundedBox>

        {/* Front Panoramic Windshield */}
        <RoundedBox args={[0.12, 0.72, 1.38]} radius={0.04} smoothness={2} position={[2.18, 0.96, 0]}>
          <meshPhysicalMaterial
            color="#0b0f14"
            metalness={0.2}
            roughness={0.05}
            transparent
            opacity={0.85}
          />
        </RoundedBox>

        {/* LED Front Destination Board: "DELHI TRANSIT" */}
        <Text
          position={[2.25, 1.18, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.11}
          color="#ccff00"
          anchorX="center"
          anchorY="middle"
        >
          DELHI TRANSIT
        </Text>

        {/* Side Destination LED: "SMARTTRANSIT AI • EV" */}
        <Text
          position={[0.2, 1.33, 0.8]}
          fontSize={0.09}
          color="#ccff00"
          anchorX="center"
          anchorY="middle"
        >
          SMARTTRANSIT AI • EV
        </Text>

        {/* Left LED Headlight */}
        <mesh position={[2.21, 0.48, 0.52]}>
          <boxGeometry args={[0.05, 0.1, 0.26]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>

        {/* Right LED Headlight */}
        <mesh position={[2.21, 0.48, -0.52]}>
          <boxGeometry args={[0.05, 0.1, 0.26]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>

        {/* Lower Front Neon Volt Bumper Strip */}
        <mesh position={[2.21, 0.36, 0]}>
          <boxGeometry args={[0.05, 0.04, 0.9]} />
          <meshStandardMaterial color="#ccff00" emissive="#ccff00" emissiveIntensity={1.8} />
        </mesh>

        {/* 4 Wheels with Glowing Neon Volt Hub Accents */}
        {[
          [1.35, 0.32, 0.78],
          [-1.35, 0.32, 0.78],
          [1.35, 0.32, -0.78],
          [-1.35, 0.32, -0.78],
        ].map(([x, y, z], index) => (
          <group key={index} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 32]} />
            <meshStandardMaterial color="#0d0f12" roughness={0.6} />
            <cylinderGeometry args={[0.19, 0.19, 0.24, 24]} />
            <meshStandardMaterial color="#ccff00" emissive="#ccff00" emissiveIntensity={0.9} />
          </group>
        ))}
      </group>

      {/* Holographic Concentric Radar Rings */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[2.5, 2.56, 64]} />
        <meshBasicMaterial color="#ccff00" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <ringGeometry args={[3.1, 3.13, 64]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Contact Shadow on Floor */}
      <ContactShadows position={[0, -0.01, 0]} opacity={0.65} scale={10} blur={2.4} far={4} />
    </group>
  );
}

// Optional GLB Custom Model Loader (supports public/models/delhi-transit-3d-bus.glb)
export function CustomGLBBus() {
  const { scene } = useGLTF('./models/delhi-transit-3d-bus.glb');
  return <primitive object={scene} scale={1.2} position={[0, -0.3, 0]} />;
}

// --- Interactive 3D Tilt Card Fallback Component ---
interface VisualTiltCardProps {
  onOpenMap?: () => void;
  onToggleTo3D?: () => void;
}

export function VisualTiltCard({ onOpenMap, onToggleTo3D }: VisualTiltCardProps) {
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

    const rX = -((y - centerY) / centerY) * 12; // tilt max 12 deg
    const rY = ((x - centerX) / centerX) * 14;

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
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* 3D Tilt Wrapper */}
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
        className="relative max-w-xl w-full rounded-3xl bg-[#0f1219] border border-[#232a3d] p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] cursor-pointer group overflow-hidden"
      >
        {/* Dynamic Glare Reflection Overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(204, 255, 0, 0.18) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 80%)`,
            opacity: isHovered ? 1 : 0.4,
          }}
        />

        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#181d2a] border border-[#2a344d] text-[11px] font-mono font-bold text-[#ccff00]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HIGH-RES AI RENDER · DELHI EV</span>
          </div>

          {onToggleTo3D && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTo3D();
              }}
              className="px-3 py-1 rounded-full bg-[#ccff00] text-black text-[10.5px] font-mono font-black uppercase hover:bg-[#d8ff33] transition-all cursor-pointer shadow-sm"
            >
              SWITCH TO 3D MODEL ↺
            </button>
          )}
        </div>

        {/* Bus Image Visual with Fallbacks */}
        <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-[#0a0c10] border border-[#1a2030] flex items-center justify-center">
          <img
            src="./images/delhi-bus-3d.png"
            alt="Delhi Transit Electric Bus 3D Render"
            onError={(e) => {
              // Fallback to absolute or placeholder if relative path fails
              const target = e.currentTarget;
              if (target.src.indexOf('delhi-bus-3d.png') !== -1 && !target.dataset.triedFallback) {
                target.dataset.triedFallback = 'true';
                target.src = '/images/delhi-bus-3d.png';
              }
            }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Holographic Pedestal Glow */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0c10] via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Metadata Footer */}
        <div className="mt-4 flex items-center justify-between text-xs font-mono relative z-10">
          <div>
            <div className="text-white font-bold uppercase tracking-wider">
              DELHI TRANSIT 2026 ELECTRIC FLEET
            </div>
            <div className="text-slate-400 text-[11px]">
              Interactive Tilt UI • Gyro &amp; Pointer Perspective
            </div>
          </div>

          {onOpenMap && (
            <button
              type="button"
              onClick={onOpenMap}
              className="px-4 py-2 rounded-xl bg-[#ccff00] hover:bg-[#d8ff33] text-black font-black text-xs uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)]"
            >
              <span>OPEN MAP</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Bus3DShowcase Component ---
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
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState<'3D_MODEL' | '2D_TILT'>('3D_MODEL');

  return (
    <div className="relative w-full h-full min-h-[540px] bg-[#0a0c10] overflow-hidden flex flex-col justify-between select-none">
      {/* Ambient Neon Volt Radial Depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(204, 255, 0, 0.12) 0%, rgba(10, 12, 16, 0) 65%)',
        }}
      />

      {/* Top Floating Telemetry & View Mode Toggle */}
      <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 pointer-events-none gap-2 flex-wrap">
        {/* Left: 72 ACTIVE FLEET */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#121620]/90 border border-white/10 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.6)] pointer-events-auto">
          <Users className="w-4 h-4 text-[#ccff00]" />
          <span className="text-xs font-mono font-bold tracking-wider text-white">
            <span className="text-[#ccff00] font-black">{activeBusCount}</span> ACTIVE FLEET
          </span>
        </div>

        {/* Right: View Mode Toggle (3D Model vs 2D Tilt) + 98.4% GPS SYNC */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mode Toggle Button: View 3D Model vs 2D Tilt Visual */}
          <div className="flex items-center bg-[#121620]/90 border border-white/10 rounded-full p-0.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewMode('3D_MODEL')}
              className={`px-3 py-1.5 rounded-full text-[10.5px] font-mono font-bold uppercase transition-all cursor-pointer ${
                viewMode === '3D_MODEL'
                  ? 'bg-[#ccff00] text-black shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="View Interactive 3D Bus Model"
            >
              3D MODEL
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2D_TILT')}
              className={`px-3 py-1.5 rounded-full text-[10.5px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === '2D_TILT'
                  ? 'bg-[#ccff00] text-black shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="View 2D Render Tilt Card Fallback"
            >
              <Layers className="w-3 h-3" />
              <span>2D TILT</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#121620]/90 border border-white/10 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
            <Radio className="w-3.5 h-3.5 text-[#ccff00]" />
            <span className="text-xs font-mono font-bold tracking-wider text-white">
              <span className="text-[#ccff00] font-black">{gpsSyncPercent}%</span> GPS SYNC
            </span>
          </div>

          {viewMode === '3D_MODEL' && (
            <button
              type="button"
              onClick={() => setAutoRotate((r) => !r)}
              className={`p-2 rounded-full border border-white/10 bg-[#121620]/90 backdrop-blur-md text-slate-300 hover:text-[#ccff00] hover:border-[#ccff00] transition-colors cursor-pointer ${
                autoRotate ? 'text-[#ccff00] border-[#ccff00]/60' : ''
              }`}
              title={autoRotate ? 'Pause Auto-Spin' : 'Auto-Spin 360°'}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Stage: 3D Canvas OR 2D Tilt Card */}
      {viewMode === '3D_MODEL' ? (
        <div className="relative flex-1 w-full cursor-grab active:cursor-grabbing">
          <WebGLErrorBoundary
            fallback={
              <VisualTiltCard
                onOpenMap={handleOpenMap}
                onToggleTo3D={() => setViewMode('3D_MODEL')}
              />
            }
          >
            <Canvas camera={{ position: [0, 2.4, 6.2], fov: 42 }}>
              <ambientLight intensity={0.9} color="#e2e8f0" />
              <directionalLight position={[5, 8, 5]} intensity={2.2} color="#ffffff" />
              <directionalLight position={[-5, 4, -4]} intensity={1.2} color="#38bdf8" />
              <pointLight position={[-4, 3, -3]} intensity={1.8} color="#ccff00" />
              <pointLight position={[3, 1, 3]} intensity={1.2} color="#ccff00" />

              <Suspense fallback={null}>
                <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
                  <ElectricBusModel />
                </Float>
              </Suspense>

              <OrbitControls
                enablePan={false}
                autoRotate={autoRotate}
                autoRotateSpeed={1.2}
                minDistance={4.0}
                maxDistance={8.5}
                maxPolarAngle={Math.PI / 2.05}
              />
            </Canvas>
          </WebGLErrorBoundary>

          {/* Drag Instruction Cue */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121620]/80 border border-white/10 backdrop-blur-md absolute bottom-4 left-6 pointer-events-none text-[10.5px] font-mono text-slate-400">
            <Compass className="w-3.5 h-3.5 text-[#ccff00] animate-spin" />
            <span>360° DRAG TO ROTATE BUS • WHEEL TO ZOOM</span>
          </div>

          {/* Bottom-Right Floating Pill: REAL-TIME AI ETA */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[#121620]/90 border border-white/10 backdrop-blur-md absolute bottom-4 right-6 pointer-events-none">
            <Clock className="w-4 h-4 text-[#ccff00]" />
            <span className="text-xs font-mono font-bold tracking-wider text-white">
              REAL-TIME AI ETA
            </span>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 w-full">
          <VisualTiltCard
            onOpenMap={handleOpenMap}
            onToggleTo3D={() => setViewMode('3D_MODEL')}
          />
        </div>
      )}

      {/* Bottom CTA Hero Dock */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pb-7 pt-2 pointer-events-auto">
        <button
          type="button"
          onClick={handleOpenMap}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#ccff00] hover:bg-[#d8ff33] text-black font-sans font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-[0_0_25px_rgba(204,255,0,0.4)] hover:shadow-[0_0_35px_rgba(204,255,0,0.6)] cursor-pointer border-2 border-black active:scale-95"
        >
          <span>OPEN LIVE DELHI MAP</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        </button>
        <p className="mt-2.5 text-xs text-zinc-400 max-w-md font-sans">
          Launch real-time tracking, live delay models, and crowd telemetry in a full-screen view.
        </p>
      </div>
    </div>
  );
}

// Re-export as Rotatable3DBusStage to keep full compatibility with App.tsx
export { Bus3DShowcase as Rotatable3DBusStage };
export default Bus3DShowcase;
