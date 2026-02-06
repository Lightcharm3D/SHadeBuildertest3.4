"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { LampshadeParams, generateLampshadeGeometry } from '@/utils/geometry-generator';
import { Button } from '@/components/ui/button';
import { Lightbulb, RotateCcw } from 'lucide-react';

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
  
  const [isLightOn, setIsLightOn] = useState(false);

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(300, 500, 300);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // Internal Bulb Light
    const bulbLight = new THREE.PointLight(0xffaa44, 0, 1000);
    bulbLight.position.set(0, (params.height * 10) / 2, 0);
    bulbLight.castShadow = true;
    scene.add(bulbLight);
    bulbLightRef.current = bulbLight;

    // Build Plate 200x200mm (20cm)
    const bedSize = 200; 
    const bedGroup = new THREE.Group();
    
    const bedGeom = new THREE.PlaneGeometry(bedSize, bedSize);
    
    // Create Branding Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 502, 502);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SHADEBUILDER X LITHOSTUDIO', 256, 450);
    }
    const bedTexture = new THREE.CanvasTexture(canvas);

    const bedMat = new THREE.MeshStandardMaterial({ 
      map: bedTexture,
      color: 0xffffff, 
      roughness: 0.8,
      metalness: 0.2
    });
    const bed = new THREE.Mesh(bedGeom, bedMat);
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    bedGroup.add(bed);
    
    const grid = new THREE.GridHelper(bedSize, 20, 0x475569, 0x334155);
    grid.position.y = 0.1;
    bedGroup.add(grid);

    scene.add(bedGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
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
      
      if (bulbLightRef.current) {
        bulbLightRef.current.position.y = (params.height * 10) / 2;
        bulbLightRef.current.intensity = isLightOn ? 5.0 : 0;
      }
      
      const mat = new THREE.MeshPhysicalMaterial({
        color: material.color, 
        roughness: material.roughness, 
        metalness: material.metalness,
        transmission: material.transmission, 
        opacity: material.opacity, 
        transparent: material.opacity < 1,
        side: THREE.DoubleSide, 
        wireframe: showWireframe,
        emissive: isLightOn ? new THREE.Color(0xffaa44) : new THREE.Color(0x000000),
        emissiveIntensity: isLightOn ? 0.4 : 0
      });
      meshRef.current.material = mat;
    }
  }, [params, material, showWireframe, isLightOn, showPrintability]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-[2rem] overflow-hidden bg-slate-950 touch-none">
      <div ref={containerRef} className="w-full h-full absolute inset-0" />
      <div className="absolute bottom-6 left-6 flex flex-wrap gap-3 z-20">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsLightOn(!isLightOn)} 
          className={`gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all rounded-2xl ${isLightOn ? 'bg-amber-100 text-amber-700' : 'bg-slate-800 text-slate-300'}`}
        >
          <Lightbulb className="w-4 h-4" /> {isLightOn ? 'Light On' : 'Light Off'}
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={resetView} 
          className="gap-2 h-12 px-5 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all rounded-2xl bg-slate-800 text-slate-300"
        >
          <RotateCcw className="w-4 h-4" /> Reset View
        </Button>
      </div>
    </div>
  );
};

export default LampshadeViewport;