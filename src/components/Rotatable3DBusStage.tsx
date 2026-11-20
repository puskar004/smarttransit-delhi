import { ContactShadows, Float, OrbitControls, RoundedBox, Text } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { ArrowUpRight, Clock, Compass, Radio, RotateCw, Users } from 'lucide-react';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';

function ElectricBusModel() {
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

export interface Rotatable3DBusStageProps {
  onOpenLiveMap?: () => void;
  onOpenMap?: () => void;
  activeBusCount?: number;
  gpsSyncPercent?: number;
}

export function Rotatable3DBusStage({
  onOpenLiveMap,
  onOpenMap,
  activeBusCount = 72,
  gpsSyncPercent = 98.4,
}: Rotatable3DBusStageProps) {
  const handleOpenMap = onOpenLiveMap || onOpenMap || (() => {});
  const [autoRotate, setAutoRotate] = useState(true);

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

      {/* Top Floating Telemetry Badges */}
      <div className="relative z-10 flex items-center justify-between p-5 sm:p-6 pointer-events-none">
        {/* Left: 72 ACTIVE FLEET */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#121620]/90 border border-white/10 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.6)] pointer-events-auto">
          <Users className="w-4 h-4 text-[#ccff00]" />
          <span className="text-xs font-mono font-bold tracking-wider text-white">
            <span className="text-[#ccff00] font-black">{activeBusCount}</span> ACTIVE FLEET
          </span>
        </div>

        {/* Right: 98.4% GPS SYNC + Auto-spin toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#121620]/90 border border-white/10 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
            <Radio className="w-4 h-4 text-[#ccff00]" />
            <span className="text-xs font-mono font-bold tracking-wider text-white">
              <span className="text-[#ccff00] font-black">{gpsSyncPercent}%</span> GPS SYNC
            </span>
          </div>

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
        </div>
      </div>

      {/* 3D Canvas Stage */}
      <div className="relative flex-1 w-full cursor-grab active:cursor-grabbing">
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

        {/* Drag Instruction Cue */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121620]/80 border border-white/10 backdrop-blur-md absolute bottom-4 left-6 pointer-events-none text-[10.5px] font-mono text-slate-400">
          <Compass className="w-3.5 h-3.5 text-[#ccff00] animate-spin" />
          <span>360° DRAG TO ROTATE BUS • WHEEL TO ZOOM</span>
        </div>

        {/* Bottom-Right Floating Pill: REAL-TIME AI ETA */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[#121620]/90 border border-white/10 backdrop-blur-md absolute bottom-4 right-6 pointer-events-none">
          <Clock className="w-4 h-4 text-[#ccff00]" />
          <span className="text-xs font-mono font-bold tracking-wider text-white">REAL-TIME AI ETA</span>
        </div>
      </div>

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

// Also export as default Bus3DShowcase as requested by user
export default Rotatable3DBusStage;
