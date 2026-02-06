"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { LampshadeParams, generateLampshadeGeometry } from '@/utils/geometry-generator';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Scissors, Lightbulb, Ruler, RotateCcw, Eye } from 'lucide-react';

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
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  
  const [isLightOn, setIsLightOn] = useState(false);
  const [isCutaway, setIsCutaway] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showShadowPlane, setShowShadowPlane] = useState(false);

  const overhangMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(material.color) }, uThreshold: { value: Math.cos(Math.PI / 4) } },
      vertexShader: `varying vec3 vWorldNormal; void main() { vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vWorldNormal; uniform vec3 uColor; uniform float uThreshold; void main() { float dotUp = dot(vWorldNormal, vec3(0.0, 1.0, 0.0)); vec3 color = uColor; if (dotUp < uThreshold && dotUp > -0.1) { color = mix(uColor, vec3(1.0, 0.2, 0.2), 0.8); } gl_FragColor = vec4(color, 1.0); }`,
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(300, 500, 300);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024; 
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const bulbLight = new THREE.PointLight(0xffaa44, 0, 1000);
    bulbLight.castShadow = true;
    bulbLight.shadow.mapSize.width = 2048;
    bulbLight.shadow.mapSize.height = 2048;
    scene.add(bulbLight);
    bulbLightRef.current = bulbLight;

    // Shadow Projection Plane (Simulates a wall/floor)
    const shadowPlaneGeom = new THREE.PlaneGeometry(1000, 1000);
    const shadowPlaneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 1 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -100;
    shadowPlane.receiveShadow = true;
    shadowPlane.visible = false;
    scene.add(shadowPlane);
    shadowPlaneRef.current = shadowPlane;

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
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    controlsRef.current = controls;

    const geometry = generateLampshadeGeometry(params);
    const meshMaterial = new THREE.MeshPhysicalMaterial({ color: material.color, roughness: material.roughness, metalness: material.metalness, side: THREE.DoubleSide });
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

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
      const { width, height } = entries[0].contentRect;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height, false);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
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
      if (bulbLightRef.current) bulbLightRef.current.position.y = (params.height * 10) / 2;
      
      if (showPrintability) {
        meshRef.current.material = overhangMaterial;
        overhangMaterial.uniforms.uColor.value.set(material.color);
      } else {
        const mat = new THREE.MeshPhysicalMaterial({
          color: material.color, roughness: material.roughness, metalness: material.metalness,
          transmission: material.transmission, opacity: material.opacity, transparent: material.opacity < 1,
          side: THREE.DoubleSide, wireframe: showWireframe,
          clippingPlanes: isCutaway ? [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)] : []
        });
        meshRef.current.material = mat;
      }
    }
  }, [params, material, showWireframe, isLightOn, showPrintability, isCutaway]);

  useEffect(() => {
    if (bulbLightRef.current) bulbLightRef.current.intensity = isLightOn ? 2.5 : 0;
    if (shadowPlaneRef.current) shadowPlaneRef.current.visible = isLightOn && showShadowPlane;
  }, [isLightOn, showShadowPlane]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-[2rem] overflow-hidden bg-slate-950 touch-none">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />
      <div className="absolute bottom-6 left-6 flex flex-wrap gap-3 z-20">
        <Button variant="secondary" size="sm" onClick={() => setIsLightOn(!isLightOn)} className={`gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all rounded-2xl ${isLightOn ? 'bg-amber-100 text-amber-700' : 'bg-slate-800 text-slate-300'}`}>
          <Lightbulb className="w-4 h-4" /> {isLightOn ? 'Light On' : 'Light Off'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowShadowPlane(!showShadowPlane)} className={`gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all rounded-2xl ${showShadowPlane ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-800 text-slate-300'}`}>
          <Eye className="w-4 h-4" /> {showShadowPlane ? 'Projection On' : 'Projection Off'}
        </Button>
        <Button variant="secondary" size="sm" onClick={resetView} className="gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all rounded-2xl bg-slate-800 text-slate-300">
          <RotateCcw className="w-4 h-4" /> Reset View
        </Button>
      </div>
    </div>
  );
};

export default LampshadeViewport;