"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LampshadeViewport, { MaterialParams } from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType, SilhouetteType } from '@/utils/geometry-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Ruler, Image as ImageIcon, Box, Lightbulb, ChevronRight, Weight, Sparkles, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  fitterHeight: 3,
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

  const handleSceneReady = (scene: THREE.Scene, mesh: THREE.Mesh) => {
    meshRef.current = mesh;
  };

  const estimateWeight = () => {
    const avgRadius = (params.topRadius + params.bottomRadius) / 2;
    const surfaceArea = 2 * Math.PI * avgRadius * params.height;
    const volume = surfaceArea * (params.thickness / 10); 
    return (volume * 1.24).toFixed(1); 
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl px-8 flex items-center justify-between shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-2 brand-gradient rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-12 h-12 brand-gradient rounded-2xl flex items-center justify-center text-white shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none flex items-center gap-1.5">
              SHADE<span className="brand-text-gradient">BUILDER</span>
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest ml-2">Pro</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Precision Geometry Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/lithophane">
            <Button variant="outline" size="sm" className="gap-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest h-10 px-5 rounded-xl transition-all">
              <ImageIcon className="w-3.5 h-3.5" />
              Lithophane Studio
              <ChevronRight className="w-3 h-3 opacity-30" />
            </Button>
          </Link>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
            <Sparkles className="w-5 h-5 text-slate-400" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden max-w-[1800px] mx-auto w-full">
        <div className="flex-1 relative min-h-[500px] bg-slate-950 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden studio-shadow group">
          <LampshadeViewport 
            params={params} 
            material={material}
            showWireframe={showWireframe} 
            showPrintability={showPrintability}
            onSceneReady={handleSceneReady} 
          />
          
          {/* Viewport Overlays */}
          <div className="absolute top-8 left-8 flex flex-col gap-4 pointer-events-none">
            <div className="bg-slate-900/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-2xl transform group-hover:translate-x-1 transition-transform duration-500">
              <div className="flex items-center gap-2.5 text-indigo-400 mb-4">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Ruler className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Live Telemetry</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between gap-12">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Z-Height</span>
                  <span className="text-[11px] font-mono font-bold text-white">{(params.height * 10).toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between gap-12">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max Width</span>
                  <span className="text-[11px] font-mono font-bold text-white">{(Math.max(params.topRadius, params.bottomRadius) * 20).toFixed(1)} mm</span>
                </div>
                <div className="h-px bg-white/5 my-1" />
                <div className="flex justify-between gap-12">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Weight className="w-3 h-3 text-indigo-400" /> Est. Mass
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-300">{estimateWeight()} g</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 pointer-events-none">
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">Engine Active: Real-time Mesh</span>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-[450px] shrink-0">
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
      </main>
      
      <footer className="py-6 px-10 border-t border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-6">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} LightCharm 3D Studio
          </p>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex gap-4">
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Geometry Engine v2.5.0-PRO</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" />
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">1.2k Designs Exported Today</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;