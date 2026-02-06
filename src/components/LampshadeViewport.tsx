"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { LampshadeParams, generateLampshadeGeometry } from '@/utils/geometry-generator';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Scissors, Lightbulb, Ruler, RotateCcw, ThermometerSun, WallPreview } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface MaterialParams {
  color: string;
  roughness: number;
  metalness: number;
  transmission: number;
  opacity: number;
}

interface ViewportProps {
  params: LampshadeParams;
  material: MaterialParams;
  showWireframe?: boolean;
  showPrintability?: boolean;
  onSceneReady?: (scene: THREE.Scene, mesh: THREE.Mesh) => void;
}

const LampshadeViewport: React.FC<ViewportProps> = ({ 
  params, 
  material,
  showWireframe = false, 
  showPrintability = false,
  onSceneReady 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const requestRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const bulbLightRef = useRef<THREE.PointLight | null>(null);
  const wallRef = useRef<THREE.Mesh | null>(null);
  
  const [isLightOn, setIsLightOn] = useState(false);
  const [isCutaway, setIsCutaway] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showWalls, setShowWalls] = useState(false);

  // Thermal Safety Calculation
  const thermalWarning = useMemo(() => {
    const minR = Math.min(params.topRadius, params.bottomRadius);
    if (minR < 3.5) return { level: 'critical', msg: 'CRITICAL: Shade is too close to bulb. Risk of melting/fire.' };
    if (minR < 5.0) return { level: 'warning', msg: 'WARNING: Narrow clearance. Use LED bulbs only (max 9W).' };
    return null;
  }, [params.topRadius, params.bottomRadius]);

  const overhangMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(material.color) },
        uThreshold: { value: Math.cos(Math.PI / 4) }, 
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldNormal;
        void main() {
          vNormal = normal;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldNormal;
        uniform vec3 uColor;
        uniform float uThreshold;
        void main() {
          float dotUp = dot(vWorldNormal, vec3(0.0, 1.0, 0.0));
          vec3 color = uColor;
          if (dotUp < uThreshold && dotUp > -0.1) {
            color = mix(uColor, vec3(1.0, 0.2, 0.2), 0.8);
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }, [material.color]);

  const resetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(250, 250, 250);
      controlsRef.current.target.set(0, (params.height * 10) / 2, 0);
      controlsRef.current.update();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 1, 5000);
    camera.position.set(250, 250, 250);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance",
      precision: "mediump" 
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap; // Better for soft shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(300, 500, 300);
    scene.add(mainLight);

    // Enhanced Bulb Light for Shadow Projection
    const bulbLight = new THREE.PointLight(0xffaa44, 0, 2000, 1.5);
    bulbLight.castShadow = true;
    bulbLight.shadow.mapSize.width = 2048;
    bulbLight.shadow.mapSize.height = 2048;
    bulbLight.shadow.camera.near = 1;
    bulbLight.shadow.camera.far = 2000;
    bulbLight.shadow.bias = -0.0001;
    bulbLight.shadow.radius = 4; // Soften shadows
    scene.add(bulbLight);
    bulbLightRef.current = bulbLight;

    // Shadow Projection Walls (Environment)
    const wallGeom = new THREE.BoxGeometry(1000, 1000, 1000);
    const wallMat = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, 
      side: THREE.BackSide,
      roughness: 1.0
    });
    const walls = new THREE.Mesh(wallGeom, wallMat);
    walls.position.y = 400;
    walls.receiveShadow = true;
    walls.visible = false;
    scene.add(walls);
    wallRef.current = walls;

    const bedGroup = new THREE.Group();
    const bedSize = 200; 
    const bedGeom = new THREE.PlaneGeometry(bedSize, bedSize);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const bed = new THREE.Mesh(bedGeom, bedMat);
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    bedGroup.add(bed);
    
    const grid = new THREE.GridHelper(bedSize, 20, 0x334155, 0x1e293b);
    grid.position.y = 0.1;
    bedGroup.add(grid);
    scene.add(bedGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    const geometry = generateLampshadeGeometry(params);
    const meshMaterial = new THREE.MeshPhysicalMaterial({ 
      color: material.color, 
      roughness: material.roughness, 
      metalness: material.metalness,
      side: THREE.DoubleSide 
    });
    
    const mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.scale.set(10, 10, 10);
    mesh.position.y = (params.height * 10) / 2;
    scene.add(mesh);
    meshRef.current = mesh;

    if (onSceneReady) onSceneReady(scene, mesh);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      const newGeom = generateLampshadeGeometry(params);
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = newGeom;
      meshRef.current.position.y = (params.height * 10) / 2;
      
      // Update bulb position to center of shade
      if (bulbLightRef.current) {
        bulbLightRef.current.position.y = (params.height * 10) / 2;
      }

      if (showPrintability) {
        meshRef.current.material = overhangMaterial;
        overhangMaterial.uniforms.uColor.value.set(material.color);
      } else {
        const mat = new THREE.MeshPhysicalMaterial({
          color: material.color,
          roughness: material.roughness,
          metalness: material.metalness,
          transmission: material.transmission,
          opacity: material.opacity,
          transparent: material.opacity < 1,
          side: THREE.DoubleSide,
          wireframe: showWireframe,
          clippingPlanes: isCutaway ? [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)] : []
        });
        meshRef.current.material = mat;
        if (rendererRef.current) rendererRef.current.localClippingEnabled = isCutaway;
      }
      
      if (isLightOn && !showPrintability) {
        (meshRef.current.material as THREE.MeshPhysicalMaterial).emissive?.set(0xffaa44);
        (meshRef.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.6;
      }
    }
  }, [params, material, showWireframe, isLightOn, showPrintability, isCutaway, overhangMaterial]);

  useEffect(() => {
    if (bulbLightRef.current) bulbLightRef.current.intensity = isLightOn ? 15.0 : 0;
    if (wallRef.current) wallRef.current.visible = showWalls && isLightOn;
  }, [isLightOn, showWalls]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-[2rem] overflow-hidden bg-slate-950 touch-none">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />
      
      {/* Thermal Safety Warning */}
      <AnimatePresence>
        {thermalWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30"
          >
            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border backdrop-blur-md shadow-2xl ${
              thermalWarning.level === 'critical' 
                ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                : 'bg-amber-500/20 border-amber-500/50 text-amber-200'
            }`}>
              <ThermometerSun className={`w-4 h-4 ${thermalWarning.level === 'critical' ? 'animate-bounce' : 'animate-pulse'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest">{thermalWarning.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Measurement Overlays */}
      {showMeasurements && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute left-1/2 top-1/2 -translate-x-[120px] flex flex-col items-center" style={{ height: `${params.height * 10}px`, transform: `translate(-120px, -50%)` }}>
            <div className="w-px h-full bg-white/20 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                <span className="text-[10px] font-black text-white whitespace-nowrap">{params.height}cm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 flex flex-wrap gap-3 z-20">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsLightOn(!isLightOn)}
          className={`gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all rounded-2xl ${isLightOn ? 'bg-amber-100 text-amber-700' : 'bg-slate-800 text-slate-300'}`}
        >
          <Lightbulb className={`w-4 h-4 ${!isLightOn ? 'opacity-50' : ''}`} />
          {isLightOn ? 'Light On' : 'Light Off'}
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setShowWalls(!showWalls)}
          className={`gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all rounded-2xl ${showWalls ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-800 text-slate-300'}`}
        >
          <WallPreview className="w-4 h-4" />
          {showWalls ? 'Walls On' : 'Walls Off'}
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsCutaway(!isCutaway)}
          className={`gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all rounded-2xl ${isCutaway ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-800 text-slate-300'}`}
        >
          <Scissors className="w-4 h-4" />
          {isCutaway ? 'Full' : 'Cut'}
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={resetView}
          className="gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all rounded-2xl bg-slate-800 text-slate-300"
        >
          <RotateCcw className="w-4 h-4" />
          Reset View
        </Button>
      </div>
    </div>
  );
};

export default LampshadeViewport;