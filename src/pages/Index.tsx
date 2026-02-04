"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LampshadeViewport, { MaterialParams } from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType, SilhouetteType } from '@/utils/geometry-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Ruler, Image as ImageIcon, Box, Lightbulb, ChevronRight, Weight, Sparkles, Cpu, Activity, Users, Layers, Zap, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

const DEFAULT_PARAMS: LampshadeParams = {
  type: 'ribbed_drum',
  silhouette: 'straight',
  height: 15,
  topRadius: 5,
  bottomRadius: 8,
  thickness: 0.2,
  segments: 64,
  internalRibs: 0,
  ribThickness: 0.2,
  ribCount: 24,
  ribDepth: 0.4,
  twistAngle: 0,
  cellCount: 12,
  amplitude: 1,
  frequency: 5,
  sides: 6,
  gridDensity: 10,
  foldCount: 12,
  foldDepth: 0.8,
  noiseScale: 0.5,
  noiseStrength: 0.5,
  slotCount: 16,
  slotWidth: 0.1,
  gapDistance: 0.5,
  seed: 1234,
  fitterType: 'spider',
  fitterDiameter: 27.6,
  fitterOuterDiameter: 36,
  fitterRingHeight: 10,
  fitterHeight: 0,
  spokeThickness: 5,
  spokeWidth: 10,
};

const DEFAULT_MATERIAL: MaterialParams = {
  color: '#ffffff',
  roughness: 0.8,
  metalness: 0,
  transmission: 0,
  opacity: 1,
};

const Index = () => {
  const [params, setParams] = useState<LampshadeParams>(DEFAULT_PARAMS);
  const [material, setMaterial] = useState<MaterialParams>(DEFAULT_MATERIAL);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showPrintability, setShowPrintability] = useState(false);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const isMobile = useIsMobile();

  const handleSceneReady = (scene: THREE.Scene, mesh: THREE.Mesh) => {
    meshRef.current = mesh;
  };

  const handleExport = () => {
    if (!meshRef.current) {
      showError("Geometry not ready for export");
      return;
    }
    try {
      const exporter = new STLExporter();
      const result = exporter.parse(meshRef.current);
      const blob = new Blob([result as any], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lampshade-${params.type}-${Date.now()}.stl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess("STL file exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      showError("Failed to export STL");
    }
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setMaterial(DEFAULT_MATERIAL);
    showSuccess("Parameters reset to default");
  };

  const handleRandomize = () => {
    const types: LampshadeType[] = [
      'ribbed_drum', 'spiral_twist', 'voronoi', 'wave_shell', 'geometric_poly', 
      'lattice', 'origami', 'perlin_noise', 'slotted', 'double_wall', 
      'organic_cell', 'bricks', 'petal_bloom', 'faceted_gem'
    ];
    const silhouettes: SilhouetteType[] = ['straight', 'hourglass', 'bell', 'convex', 'concave'];
    
    const newType = types[Math.floor(Math.random() * types.length)];
    const newSilhouette = silhouettes[Math.floor(Math.random() * silhouettes.length)];
    
    setParams({
      ...params,
      type: newType,
      silhouette: newSilhouette,
      height: 12 + Math.random() * 12,
      topRadius: 4 + Math.random() * 6,
      bottomRadius: 6 + Math.random() * 8,
      seed: Math.random() * 10000,
      internalRibs: Math.random() > 0.7 ? Math.floor(Math.random() * 8) : 0,
      gridDensity: 8 + Math.floor(Math.random() * 10),
      twistAngle: Math.random() * 720,
    });
    
    showSuccess("New design generated!");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans safe-area-pt">
      <header className="h-16 lg:h-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl px-4 lg:px-10 flex items-center justify-between shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 lg:-inset-2 brand-gradient rounded-xl lg:rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-10 h-10 lg:w-12 lg:h-12 brand-gradient rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl transform group-hover:scale-105 transition-transform duration-300">
              <Cpu className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-base lg:text-xl font-black tracking-tighter text-slate-900 leading-none flex items-center gap-2">
              SHADE<span className="brand-text-gradient">BUILDER</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest ml-2 shadow-lg shadow-indigo-200">Pro</span>
            </h1>
            <p className="text-[8px] lg:text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] lg:tracking-[0.4em] mt-1 lg:mt-1.5">Precision Geometry Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <Link to="/lithophane">
            <Button variant="outline" size="sm" className="gap-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-black text-[9px] lg:text-[10px] uppercase tracking-widest h-9 lg:h-11 px-3 lg:px-6 rounded-xl lg:rounded-2xl transition-all shadow-sm group">
              <ImageIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden xs:inline">Lithophane</span>
            </Button>
          </Link>
          <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2" />
          <Button variant="ghost" size="icon" className="rounded-xl lg:rounded-2xl hover:bg-slate-100 h-9 w-9 lg:h-11 lg:w-11 text-slate-400 hover:text-indigo-600 transition-colors">
            <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row p-4 lg:p-8 gap-4 lg:gap-8 overflow-hidden max-w-[1920px] mx-auto w-full">
        <div className="flex-1 relative min-h-[300px] lg:min-h-[500px] bg-slate-950 rounded-[2rem] lg:rounded-[3.5rem] shadow-2xl border border-slate-800/50 overflow-hidden studio-shadow group">
          <div className="absolute inset-0 scanline opacity-20 pointer-events-none z-10"></div>
          <LampshadeViewport 
            params={params} 
            material={material}
            showWireframe={showWireframe} 
            showPrintability={showPrintability}
            onSceneReady={handleSceneReady} 
          />
          
          <div className="absolute top-4 lg:top-10 left-4 lg:left-10 z-20 flex flex-col gap-2 lg:gap-3">
            <div className="flex items-center gap-2 lg:gap-3 bg-black/40 backdrop-blur-xl px-3 lg:px-5 py-1.5 lg:py-2.5 rounded-xl lg:rounded-2xl border border-white/10 shadow-2xl">
              <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] text-white/80">Live Preview</span>
            </div>
          </div>

          {isMobile && (
            <div className="absolute bottom-4 right-4 z-30">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button className="w-14 h-14 rounded-full brand-gradient shadow-2xl flex items-center justify-center text-white">
                    <Settings2 className="w-6 h-6" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[85vh] bg-white rounded-t-[2.5rem]">
                  <DrawerHeader className="sr-only">
                    <DrawerTitle>Studio Controls</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 h-full overflow-hidden">
                    <ControlPanel 
                      params={params} 
                      setParams={setParams} 
                      material={material}
                      setMaterial={setMaterial}
                      showWireframe={showWireframe} 
                      setShowWireframe={setShowWireframe} 
                      showPrintability={showPrintability}
                      setShowPrintability={setShowPrintability}
                      onExport={handleExport} 
                      onRandomize={handleRandomize}
                      onReset={handleReset}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          )}
        </div>
        
        {!isMobile && (
          <div className="w-full lg:w-[500px] shrink-0">
            <ControlPanel 
              params={params} 
              setParams={setParams} 
              material={material}
              setMaterial={setMaterial}
              showWireframe={showWireframe} 
              setShowWireframe={setShowWireframe} 
              showPrintability={showPrintability}
              setShowPrintability={setShowPrintability}
              onExport={handleExport} 
              onRandomize={handleRandomize}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
      
      <footer className="hidden lg:flex py-8 px-12 border-t border-slate-200/60 bg-white items-center justify-between safe-area-pb">
        <div className="flex items-center gap-8">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} LightCharm 3D Studio
          </p>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Geometry Engine v2.6.0-PREMIUM</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;