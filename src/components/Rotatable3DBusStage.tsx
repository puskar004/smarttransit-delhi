import {
  Compass,
  Maximize2,
  Minimize2,
  RotateCw,
  Users,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Rotatable3DBusStageProps {
  onOpenLiveMap: () => void;
  activeBusCount?: number;
  gpsSyncPercent?: number;
}

export const Rotatable3DBusStage: React.FC<Rotatable3DBusStageProps> = ({
  onOpenLiveMap,
  activeBusCount = 72,
  gpsSyncPercent = 98.4,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraAngle, setCameraAngle] = useState<'PERSPECTIVE' | 'FRONT' | 'SIDE' | 'TOP'>('PERSPECTIVE');

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    busGroup: THREE.Group;
    radarGroup: THREE.Group;
    wheels: THREE.Mesh[];
    isDragging: boolean;
    prevMouse: { x: number; y: number };
    targetRotY: number;
    targetRotX: number;
    currentRotY: number;
    currentRotX: number;
    zoom: number;
    targetZoom: number;
    animFrameId: number;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.04);

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(7.5, 3.8, 8.5);
    camera.lookAt(0, 0.5, 0);

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. LIGHTING
    // Ambient light - deep cool navy
    const ambientLight = new THREE.AmbientLight(0x223048, 1.8);
    scene.add(ambientLight);

    // Main Key light - bright studio soft white from top-front
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Rim light 1 - Electric Lime Glow (#CCFF00) from rear-bottom
    const limeRimLight = new THREE.DirectionalLight(0xccff00, 2.5);
    limeRimLight.position.set(-8, 2, -6);
    scene.add(limeRimLight);

    // Fill light - Cyan glow (#38BDF8) from front-left
    const cyanFillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    cyanFillLight.position.set(-6, 6, 6);
    scene.add(cyanFillLight);

    // Ground bounce light
    const bounceLight = new THREE.PointLight(0x22c55e, 1.5, 10);
    bounceLight.position.set(0, 0.2, 0);
    scene.add(bounceLight);

    // 5. TEXTURE HELPERS (Canvas generated for maximum reliability)
    // LED Destination Sign Texture ("DELHI TRANSIT")
    const createLedSignTexture = (text: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      // Dark background
      ctx.fillStyle = '#050a05';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // LED dot grid pattern
      ctx.fillStyle = '#0f2910';
      for (let y = 4; y < canvas.height; y += 8) {
        for (let x = 4; x < canvas.width; x += 8) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Glowing Neon Text
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ccff00';
      ctx.font = '900 52px "Courier New", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return texture;
    };

    // Holographic Circular Radar Ground Texture
    const createRadarFloorTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;
      const center = canvas.width / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark radial shadow under the bus
      const radGrad = ctx.createRadialGradient(center, center, 20, center, center, 480);
      radGrad.addColorStop(0, 'rgba(10, 16, 26, 0.95)');
      radGrad.addColorStop(0.5, 'rgba(12, 20, 32, 0.7)');
      radGrad.addColorStop(0.85, 'rgba(12, 20, 32, 0.25)');
      radGrad.addColorStop(1, 'rgba(10, 12, 16, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(center, center, 490, 0, Math.PI * 2);
      ctx.fill();

      // Concentric circles
      const rings = [
        { r: 460, stroke: 'rgba(204, 255, 0, 0.35)', width: 2, dash: [8, 8] },
        { r: 420, stroke: 'rgba(56, 189, 248, 0.25)', width: 1.5, dash: [] },
        { r: 380, stroke: 'rgba(204, 255, 0, 0.5)', width: 2.5, dash: [16, 12, 4, 12] },
        { r: 310, stroke: 'rgba(56, 189, 248, 0.3)', width: 1, dash: [6, 6] },
        { r: 240, stroke: 'rgba(204, 255, 0, 0.6)', width: 2, dash: [] },
        { r: 160, stroke: 'rgba(56, 189, 248, 0.4)', width: 1.5, dash: [10, 10] },
        { r: 80, stroke: 'rgba(204, 255, 0, 0.5)', width: 1.5, dash: [] },
      ];

      rings.forEach((ring) => {
        ctx.strokeStyle = ring.stroke;
        ctx.lineWidth = ring.width;
        ctx.setLineDash(ring.dash);
        ctx.beginPath();
        ctx.arc(center, center, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Radial tick marks around outer circle
      ctx.setLineDash([]);
      for (let i = 0; i < 360; i += 5) {
        const rad = (i * Math.PI) / 180;
        const isMajor = i % 30 === 0;
        const len = isMajor ? 18 : 8;
        const r1 = 440;
        const r2 = r1 - len;

        ctx.strokeStyle = isMajor ? 'rgba(204, 255, 0, 0.8)' : 'rgba(100, 140, 180, 0.3)';
        ctx.lineWidth = isMajor ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(center + Math.cos(rad) * r1, center + Math.sin(rad) * r1);
        ctx.lineTo(center + Math.cos(rad) * r2, center + Math.sin(rad) * r2);
        ctx.stroke();
      }

      // Digital coordinates text on radar
      ctx.fillStyle = 'rgba(204, 255, 0, 0.7)';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DELHI AVLS • 28.544° N, 77.272° E', center, center + 400);
      ctx.fillText('RADAR SCAN: 360° FLEET TELEMETRY', center, center - 400);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    // 6. ASSEMBLE RADAR PEDESTAL
    const radarGroup = new THREE.Group();
    const radarGeo = new THREE.PlaneGeometry(12, 12);
    const radarMat = new THREE.MeshBasicMaterial({
      map: createRadarFloorTexture(),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const radarMesh = new THREE.Mesh(radarGeo, radarMat);
    radarMesh.rotation.x = -Math.PI / 2;
    radarMesh.position.y = 0.01;
    radarGroup.add(radarMesh);
    scene.add(radarGroup);

    // 7. ASSEMBLE PROCEDURAL 3D ELECTRIC BUS MODEL (Tata Starbus EV / Delhi Fleet Style)
    const busGroup = new THREE.Group();

    // Standard materials
    const silverMetallicMat = new THREE.MeshStandardMaterial({
      color: 0xcfd6e0,
      metalness: 0.85,
      roughness: 0.22,
      envMapIntensity: 1.2,
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      metalness: 0.5,
      roughness: 0.4,
    });

    const neonLimeGlowMat = new THREE.MeshBasicMaterial({
      color: 0xccff00,
    });

    const tintedGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c1e18,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.75,
      thickness: 0.4,
      transparent: true,
      opacity: 0.65,
    });

    const interiorSeatMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.7,
    });

    const ledSignTex = createLedSignTexture('DELHI TRANSIT');
    const ledSignMat = new THREE.MeshBasicMaterial({
      map: ledSignTex,
    });

    // --- Bus Main Body (Length: 7.2, Width: 2.3, Height: 2.1) ---
    const bodyWidth = 2.3;
    const bodyLength = 7.0;

    // Lower chassis skirt (Dark charcoal)
    const lowerSkirtGeo = new THREE.BoxGeometry(bodyWidth, 0.45, bodyLength);
    const lowerSkirtMesh = new THREE.Mesh(lowerSkirtGeo, darkTrimMat);
    lowerSkirtMesh.position.y = 0.55;
    lowerSkirtMesh.castShadow = true;
    busGroup.add(lowerSkirtMesh);

    // Middle body side panels (Metallic silver)
    const mainBodyGeo = new THREE.BoxGeometry(bodyWidth, 0.7, bodyLength * 0.96);
    const mainBodyMesh = new THREE.Mesh(mainBodyGeo, silverMetallicMat);
    mainBodyMesh.position.y = 1.1;
    mainBodyMesh.castShadow = true;
    busGroup.add(mainBodyMesh);

    // Aerodynamic curved front nose
    const noseGeo = new THREE.CylinderGeometry(0.5, 0.5, bodyWidth, 16, 1, false, -Math.PI / 2, Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, silverMetallicMat);
    noseMesh.rotation.z = Math.PI / 2;
    noseMesh.position.set(0, 0.9, bodyLength / 2 - 0.2);
    busGroup.add(noseMesh);

    // --- Glass Greenhouse / Windows ---
    const windowStripGeo = new THREE.BoxGeometry(bodyWidth * 0.98, 0.85, bodyLength * 0.92);
    const windowStripMesh = new THREE.Mesh(windowStripGeo, tintedGlassMat);
    windowStripMesh.position.y = 1.8;
    busGroup.add(windowStripMesh);

    // Window Pillars (Black frames)
    for (let z = -2.8; z <= 2.8; z += 1.4) {
      const pillarGeo = new THREE.BoxGeometry(bodyWidth * 1.01, 0.85, 0.12);
      const pillarMesh = new THREE.Mesh(pillarGeo, darkTrimMat);
      pillarMesh.position.set(0, 1.8, z);
      busGroup.add(pillarMesh);
    }

    // Panoramic Windshield (Front)
    const windshieldGeo = new THREE.BoxGeometry(bodyWidth * 0.96, 0.95, 0.15);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, tintedGlassMat);
    windshieldMesh.position.set(0, 1.8, bodyLength / 2 - 0.05);
    windshieldMesh.rotation.x = 0.15; // aerodynamic slant
    busGroup.add(windshieldMesh);

    // Rear Windshield
    const rearWindowGeo = new THREE.BoxGeometry(bodyWidth * 0.92, 0.7, 0.1);
    const rearWindowMesh = new THREE.Mesh(rearWindowGeo, tintedGlassMat);
    rearWindowMesh.position.set(0, 1.85, -bodyLength / 2 + 0.05);
    busGroup.add(rearWindowMesh);

    // --- Roof & Aerodynamic Fairings ---
    const roofGeo = new THREE.BoxGeometry(bodyWidth, 0.25, bodyLength * 0.98);
    const roofMesh = new THREE.Mesh(roofGeo, silverMetallicMat);
    roofMesh.position.y = 2.3;
    roofMesh.castShadow = true;
    busGroup.add(roofMesh);

    // Central Panoramic Glass Roof Strip
    const roofGlassGeo = new THREE.BoxGeometry(1.2, 0.05, bodyLength * 0.75);
    const roofGlassMesh = new THREE.Mesh(roofGlassGeo, tintedGlassMat);
    roofGlassMesh.position.set(0, 2.43, 0);
    busGroup.add(roofGlassMesh);

    // Rooftop AC / Battery pack (Dark enclosure with vents)
    const acUnitGeo = new THREE.BoxGeometry(1.8, 0.35, 2.4);
    const acUnitMesh = new THREE.Mesh(acUnitGeo, darkTrimMat);
    acUnitMesh.position.set(0, 2.52, -1.0);
    acUnitMesh.castShadow = true;
    busGroup.add(acUnitMesh);

    // --- Glowing Neon Lime Roof Cantrail Strips (Exact Screenshot Detail!) ---
    // Left edge roof glow
    const leftGlowGeo = new THREE.BoxGeometry(0.06, 0.06, bodyLength * 0.96);
    const leftGlowMesh = new THREE.Mesh(leftGlowGeo, neonLimeGlowMat);
    leftGlowMesh.position.set(bodyWidth / 2 - 0.02, 2.25, 0);
    busGroup.add(leftGlowMesh);

    // Right edge roof glow
    const rightGlowMesh = leftGlowMesh.clone();
    rightGlowMesh.position.x = -bodyWidth / 2 + 0.02;
    busGroup.add(rightGlowMesh);

    // Lower skirt accent glow strips
    const leftLowerGlow = new THREE.BoxGeometry(0.04, 0.04, bodyLength * 0.85);
    const leftLowerGlowMesh = new THREE.Mesh(leftLowerGlow, neonLimeGlowMat);
    leftLowerGlowMesh.position.set(bodyWidth / 2 + 0.01, 0.72, 0);
    busGroup.add(leftLowerGlowMesh);

    const rightLowerGlowMesh = leftLowerGlowMesh.clone();
    rightLowerGlowMesh.position.x = -bodyWidth / 2 - 0.01;
    busGroup.add(rightLowerGlowMesh);

    // --- LED Destination Boards ("DELHI TRANSIT") ---
    // Front Destination Sign Box (Glows neon lime above windshield)
    const frontSignGeo = new THREE.BoxGeometry(1.5, 0.32, 0.05);
    const frontSignMesh = new THREE.Mesh(frontSignGeo, ledSignMat);
    frontSignMesh.position.set(0, 2.22, bodyLength / 2 - 0.12);
    busGroup.add(frontSignMesh);

    // Side Passenger Door Destination Sign Box
    const sideSignGeo = new THREE.BoxGeometry(0.05, 0.22, 1.1);
    const sideSignMesh = new THREE.Mesh(sideSignGeo, ledSignMat);
    sideSignMesh.position.set(bodyWidth / 2 + 0.02, 2.12, 1.1);
    sideSignMesh.rotation.y = Math.PI / 2;
    busGroup.add(sideSignMesh);

    // --- LED Headlights & Taillights ---
    // Front LED Headlight Strips (Bright Ice-White / Cyan)
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
    const hlLeftGeo = new THREE.BoxGeometry(0.35, 0.1, 0.05);
    const hlLeftMesh = new THREE.Mesh(hlLeftGeo, headlightMat);
    hlLeftMesh.position.set(0.85, 0.78, bodyLength / 2 - 0.05);
    busGroup.add(hlLeftMesh);

    const hlRightMesh = hlLeftMesh.clone();
    hlRightMesh.position.x = -0.85;
    busGroup.add(hlRightMesh);

    // Rear Taillights (Dual vertical neon amber/red strips)
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // amber/gold (no red)
    const tlLeftGeo = new THREE.BoxGeometry(0.12, 0.45, 0.05);
    const tlLeftMesh = new THREE.Mesh(tlLeftGeo, taillightMat);
    tlLeftMesh.position.set(0.95, 1.1, -bodyLength / 2 + 0.02);
    busGroup.add(tlLeftMesh);

    const tlRightMesh = tlLeftMesh.clone();
    tlRightMesh.position.x = -0.95;
    busGroup.add(tlRightMesh);

    // --- Interior Passenger Seats (Visible inside) ---
    for (let z = -2.6; z <= 2.2; z += 0.9) {
      // Left seat
      const seatGeo = new THREE.BoxGeometry(0.45, 0.5, 0.4);
      const seatLeft = new THREE.Mesh(seatGeo, interiorSeatMat);
      seatLeft.position.set(0.72, 1.35, z);
      busGroup.add(seatLeft);

      // Right seat
      const seatRight = new THREE.Mesh(seatGeo, interiorSeatMat);
      seatRight.position.set(-0.72, 1.35, z);
      busGroup.add(seatRight);

      // Silver Grab Pole
      const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.1);
      const poleMesh = new THREE.Mesh(poleGeo, silverMetallicMat);
      poleMesh.position.set(0.45, 1.75, z);
      busGroup.add(poleMesh);
    }

    // Driver Dashboard & Steering Wheel
    const dashGeo = new THREE.BoxGeometry(0.65, 0.4, 0.5);
    const dashMesh = new THREE.Mesh(dashGeo, darkTrimMat);
    dashMesh.position.set(0.65, 1.25, bodyLength / 2 - 0.7);
    busGroup.add(dashMesh);

    // --- Wheels with Neon Lime Rim Accents (Exact Screenshot Style) ---
    const wheels: THREE.Mesh[] = [];
    const wheelPositions = [
      { x: bodyWidth / 2 + 0.04, y: 0.45, z: 2.1, isLeft: true }, // Front Left
      { x: -bodyWidth / 2 - 0.04, y: 0.45, z: 2.1, isLeft: false }, // Front Right
      { x: bodyWidth / 2 + 0.04, y: 0.45, z: -2.0, isLeft: true }, // Rear Left
      { x: -bodyWidth / 2 - 0.04, y: 0.45, z: -2.0, isLeft: false }, // Rear Right
    ];

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.85,
      metalness: 0.2,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2,
    });

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();

      // Black Rubber Tire
      const tireGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.3, 24);
      const tireMesh = new THREE.Mesh(tireGeo, tireMat);
      tireMesh.rotation.z = Math.PI / 2;
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      // Alloy Hubcap
      const hubGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.32, 24);
      const hubMesh = new THREE.Mesh(hubGeo, rimMat);
      hubMesh.rotation.z = Math.PI / 2;
      wheelGroup.add(hubMesh);

      // Glowing Neon Lime Wheel Rim Ring (#CCFF00)
      const rimRingGeo = new THREE.TorusGeometry(0.26, 0.025, 12, 32);
      const rimRingMesh = new THREE.Mesh(rimRingGeo, neonLimeGlowMat);
      rimRingMesh.rotation.y = Math.PI / 2;
      rimRingMesh.position.x = pos.isLeft ? 0.16 : -0.16;
      wheelGroup.add(rimRingMesh);

      wheelGroup.position.set(pos.x, pos.y, pos.z);
      busGroup.add(wheelGroup);
      wheels.push(tireMesh);
    });

    // Aerodynamic Rear Wing Mirrors
    const mirrorLeftGeo = new THREE.BoxGeometry(0.08, 0.25, 0.14);
    const mirrorLeft = new THREE.Mesh(mirrorLeftGeo, darkTrimMat);
    mirrorLeft.position.set(bodyWidth / 2 + 0.2, 1.9, bodyLength / 2 - 0.4);
    busGroup.add(mirrorLeft);

    const mirrorRight = mirrorLeft.clone();
    mirrorRight.position.x = -bodyWidth / 2 - 0.2;
    busGroup.add(mirrorRight);

    // Initial bus rotation to match the dynamic isometric angle in the screenshot
    busGroup.rotation.y = Math.PI * 0.72; // angled 3/4 front view
    scene.add(busGroup);

    // Keep instance references for controls
    threeRef.current = {
      scene,
      camera,
      renderer,
      busGroup,
      radarGroup,
      wheels,
      isDragging: false,
      prevMouse: { x: 0, y: 0 },
      targetRotY: busGroup.rotation.y,
      targetRotX: 0,
      currentRotY: busGroup.rotation.y,
      currentRotX: 0,
      zoom: 1.0,
      targetZoom: 1.0,
      animFrameId: 0,
    };

    // 8. INTERACTIVE DRAG-TO-ROTATE LISTENERS
    const handlePointerDown = (e: PointerEvent) => {
      if (!threeRef.current) return;
      threeRef.current.isDragging = true;
      threeRef.current.prevMouse = { x: e.clientX, y: e.clientY };
      setIsRotating(false);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const state = threeRef.current;
      if (!state || !state.isDragging) return;

      const deltaX = e.clientX - state.prevMouse.x;
      const deltaY = e.clientY - state.prevMouse.y;

      state.prevMouse = { x: e.clientX, y: e.clientY };

      // Sensitivity
      state.targetRotY += deltaX * 0.007;
      state.targetRotX = Math.max(-0.35, Math.min(0.45, state.targetRotX + deltaY * 0.005));
    };

    const handlePointerUp = () => {
      if (!threeRef.current) return;
      threeRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = threeRef.current;
      if (!state) return;
      const zoomDelta = e.deltaY * 0.001;
      state.targetZoom = Math.max(0.65, Math.min(1.8, state.targetZoom + zoomDelta));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });

    // 9. ANIMATION LOOP
    let lastTime = performance.now();

    const animate = (time: number) => {
      const state = threeRef.current;
      if (!state) return;

      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Auto-rotation when not dragging
      if (isRotating && !state.isDragging) {
        state.targetRotY += dt * 0.18; // smooth gentle orbit
      }

      // Smooth lerp damping for rotation
      state.currentRotY += (state.targetRotY - state.currentRotY) * 0.08;
      state.currentRotX += (state.targetRotX - state.currentRotX) * 0.08;
      state.busGroup.rotation.y = state.currentRotY;
      state.busGroup.rotation.x = state.currentRotX;

      // Slow radar pedestal counter-rotation for holographic telemetry feel
      state.radarGroup.rotation.y -= dt * 0.05;

      // Smooth zoom lerp
      state.zoom += (state.targetZoom - state.zoom) * 0.1;
      const baseCamDist = 12.0 * state.zoom;
      state.camera.position.x = Math.sin(0.7) * baseCamDist * 0.65;
      state.camera.position.y = 3.6 * state.zoom;
      state.camera.position.z = Math.cos(0.7) * baseCamDist * 0.75;
      state.camera.lookAt(0, 1.1, 0);

      state.renderer.render(state.scene, state.camera);
      state.animFrameId = requestAnimationFrame(animate);
    };

    threeRef.current.animFrameId = requestAnimationFrame(animate);

    // 10. RESIZE OBSERVER
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // CLEANUP
    return () => {
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domEl.removeEventListener('wheel', handleWheel);

      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animFrameId);
        threeRef.current.renderer.dispose();
      }
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, [isRotating]);

  // View preset switchers
  const setPresetAngle = (preset: 'PERSPECTIVE' | 'FRONT' | 'SIDE' | 'TOP') => {
    setCameraAngle(preset);
    setIsRotating(false);
    const state = threeRef.current;
    if (!state) return;

    if (preset === 'PERSPECTIVE') {
      state.targetRotY = Math.PI * 0.72;
      state.targetRotX = 0.05;
      state.targetZoom = 1.0;
    } else if (preset === 'FRONT') {
      state.targetRotY = 0;
      state.targetRotX = 0;
      state.targetZoom = 0.9;
    } else if (preset === 'SIDE') {
      state.targetRotY = Math.PI / 2;
      state.targetRotX = 0;
      state.targetZoom = 1.1;
    } else if (preset === 'TOP') {
      state.targetRotY = Math.PI * 0.5;
      state.targetRotX = 0.42;
      state.targetZoom = 1.3;
    }
  };

  const resetRotation = () => {
    const state = threeRef.current;
    if (!state) return;
    state.targetRotY = Math.PI * 0.72;
    state.targetRotX = 0;
    state.targetZoom = 1.0;
    setIsRotating(true);
    setCameraAngle('PERSPECTIVE');
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-between overflow-hidden bg-[#0a0c10] select-none ${
        isFullscreen ? 'fixed inset-0 z-[1000]' : ''
      }`}
    >
      {/* 3D Canvas Mounting Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
        title="Click and drag to rotate 3D Electric Bus 360° • Scroll to zoom"
      />

      {/* FLOATING TELEMETRY BADGES (Exact Screenshot Placement & Style) */}

      {/* Top Left Telemetry Pill: 72 ACTIVE FLEET */}
      <div className="absolute top-5 left-5 z-20 pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#121620]/90 backdrop-blur-md border border-[#232a3d] shadow-[0_8px_20px_rgba(0,0,0,0.6)] text-[12px] font-mono font-bold text-white transition-all hover:border-[#CCFF00]">
          <div className="w-5 h-5 rounded-full bg-[#CCFF00]/15 flex items-center justify-center text-[#CCFF00]">
            <Users className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-[#CCFF00] tracking-wider uppercase font-black">
            {activeBusCount} ACTIVE FLEET
          </span>
        </div>
      </div>

      {/* Top Right Telemetry Pill: 98.4% GPS SYNC */}
      <div className="absolute top-5 right-5 z-20 pointer-events-auto flex items-center gap-2">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#121620]/90 backdrop-blur-md border border-[#232a3d] shadow-[0_8px_20px_rgba(0,0,0,0.6)] text-[12px] font-mono font-bold text-white transition-all hover:border-[#CCFF00]">
          <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse shadow-[0_0_8px_#CCFF00]" />
          <span className="text-[#CCFF00] tracking-wider uppercase font-black">
            {gpsSyncPercent}% GPS SYNC
          </span>
        </div>

        {/* Quick 3D Camera Controls */}
        <button
          type="button"
          onClick={resetRotation}
          className={`p-2 rounded-full border border-[#232a3d] bg-[#121620]/90 backdrop-blur-md text-slate-300 hover:text-[#CCFF00] hover:border-[#CCFF00] transition-colors cursor-pointer ${
            isRotating ? 'text-[#CCFF00] border-[#CCFF00]' : ''
          }`}
          title={isRotating ? 'Pause Auto-Spin' : 'Auto-Spin 360°'}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen((f) => !f)}
          className="p-2 rounded-full border border-[#232a3d] bg-[#121620]/90 backdrop-blur-md text-slate-300 hover:text-white hover:border-[#CCFF00] transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Bottom Right Floating Badge: REAL-TIME AI ETA */}
      <div className="absolute bottom-24 sm:bottom-28 right-5 z-20 pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#121620]/90 backdrop-blur-md border border-[#232a3d] shadow-[0_8px_20px_rgba(0,0,0,0.6)] text-[11.5px] font-mono font-bold text-white transition-all hover:border-[#CCFF00]">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
          <span className="text-white tracking-wider uppercase font-black flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#CCFF00] stroke-[2.5]" />
            REAL-TIME AI ETA
          </span>
        </div>
      </div>

      {/* Interactive Angle Switchers (Pill dock) */}
      <div className="absolute top-16 right-5 z-20 hidden md:flex items-center gap-1 bg-[#121620]/80 backdrop-blur-md p-1 rounded-full border border-[#232a3d]">
        {(['PERSPECTIVE', 'FRONT', 'SIDE', 'TOP'] as const).map((angle) => (
          <button
            key={angle}
            type="button"
            onClick={() => setPresetAngle(angle)}
            className={`px-2.5 py-1 text-[9.5px] font-mono font-black uppercase rounded-full transition-all cursor-pointer ${
              cameraAngle === angle
                ? 'bg-[#CCFF00] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {angle}
          </button>
        ))}
      </div>

      {/* Drag Instruction Cue */}
      <div className="absolute bottom-24 sm:bottom-28 left-5 z-20 pointer-events-none hidden sm:flex items-center gap-2 text-[10.5px] font-mono text-slate-400 bg-[#121620]/80 backdrop-blur-sm px-3 py-1 rounded-full border border-[#232a3d]">
        <Compass className="w-3 h-3 text-[#CCFF00] animate-spin" />
        <span>360° DRAG TO ROTATE BUS • WHEEL TO ZOOM</span>
      </div>

      {/* BOTTOM HERO CTA DOCK (Exact Screenshot Button & Subtext) */}
      <div className="w-full flex flex-col items-center justify-center pb-6 sm:pb-8 pt-3 z-20 pointer-events-auto bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/80 to-transparent">
        <button
          type="button"
          onClick={onOpenLiveMap}
          className="group px-7 sm:px-9 py-3 sm:py-3.5 rounded-full bg-[#CCFF00] hover:bg-[#bfe600] active:scale-95 text-black font-sans font-black text-xs sm:text-[13px] tracking-wider uppercase shadow-[0_0_30px_rgba(204,255,0,0.45)] hover:shadow-[0_0_45px_rgba(204,255,0,0.7)] transition-all cursor-pointer flex items-center gap-2 border-2 border-black"
        >
          <span>OPEN LIVE DELHI MAP</span>
          <span className="font-mono text-base font-black transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5">
            ↗
          </span>
        </button>

        <p className="text-[11px] sm:text-xs text-slate-400 mt-2.5 text-center font-sans max-w-md px-4">
          Launch real-time tracking, live delay models, and crowd telemetry in a full-screen view.
        </p>
      </div>
    </div>
  );
};
