"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LampshadeViewport from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Box, Layers, Zap, Ruler, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [params, setParams] = useState<LampshadeParams>({
    type: 'ribbed_drum',
    height: 15,
    topRadius: 5,
    bottomRadius: 8,
    thickness: 0.2,
    segments: 32, // Lower default for mobile performance
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
    seed: Math.random() * 1000,
  });
  
  const [showWireframe, setShowWireframe] = useState(false);
  const meshRef = useRef<THREE.Mesh | null>(null);

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

  const handleRandomize = () => {
    const types: LampshadeType[] = [
      'ribbed_drum',
      'spiral_twist',
      'voronoi',
      'wave_shell',
      'geometric_poly',
      'lattice',
      'origami',
      'perlin_noise',
      'slotted',
      'double_wall'
    ];
    
    const newType = types[Math.floor(Math.random() * types.length)];
    
    // Set default parameters based on type
    let newParams: Partial<LampshadeParams> = {};
    switch (newType) {
      case 'ribbed_drum':
        newParams = { ribCount: Math.floor(10 + Math.random() * 40), ribDepth: Math.random() * 1 };
        break;
      case 'spiral_twist':
        newParams = { twistAngle: Math.random() * 720 };
        break;
      case 'origami':
        newParams = { foldCount: Math.floor(6 + Math.random() * 24), foldDepth: Math.random() * 1.5 };
        break;
      case 'geometric_poly':
        newParams = { sides: Math.floor(3 + Math.random() * 10) };
        break;
      case 'wave_shell':
        newParams = { amplitude: Math.random() * 2, frequency: 2 + Math.random() * 10 };
        break;
      case 'perlin_noise':
        newParams = { noiseScale: Math.random() * 1, noiseStrength: Math.random() * 1 };
        break;
      case 'voronoi':
        newParams = { cellCount: Math.floor(5 + Math.random() * 20) };
        break;
      case 'lattice':
        newParams = { gridDensity: Math.floor(5 + Math.random() * 20) };
        break;
      case 'slotted':
        newParams = { slotCount: Math.floor(8 + Math.random() * 32), slotWidth: 0.05 + Math.random() * 0.2 };
        break;
      case 'double_wall':
        newParams = { gapDistance: 0.2 + Math.random() * 0.8 };
        break;
    }
    
    setParams({
      ...params,
      type: newType,
      height: 10 + Math.random() * 15,
      topRadius: 3 + Math.random() * 7,
      bottomRadius: 5 + Math.random() * 10,
      seed: Math.random() * 1000,
      ...newParams
    });
    
    showSuccess("New design generated!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Zap className="w-4 h-4" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">ShadeBuilder</h1>
            <p className="text-[10px] text-slate-500 font-medium">by LightCharm 3D</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/lithophane">
            <Button variant="outline" size="sm" className="gap-1 border-indigo-100 text-indigo-600 hover:bg-indigo-50 h-8 px-2 text-xs">
              <ImageIcon className="w-3 h-3" />
              Lithophane
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col p-2 gap-4 overflow-hidden">
        <div className="flex-1 relative min-h-[300px] bg-slate-950 rounded-xl shadow-lg border border-slate-800">
          <LampshadeViewport 
            params={params} 
            showWireframe={showWireframe} 
            onSceneReady={handleSceneReady} 
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-sm p-2 rounded-lg border border-slate-700 shadow-lg">
              <div className="flex items-center gap-1 text-indigo-400 mb-1">
                <Ruler className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Dimensions</span>
              </div>
              <div className="grid grid-cols-1 gap-0.5">
                <div className="text-[9px] text-slate-300">Height: <span className="font-mono text-white">{params.height * 10}mm</span></div>
                <div className="text-[9px] text-slate-300">Max Width: <span className="font-mono text-white">{Math.max(params.topRadius, params.bottomRadius) * 20}mm</span></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full">
          <ControlPanel 
            params={params} 
            setParams={setParams} 
            showWireframe={showWireframe} 
            setShowWireframe={setShowWireframe} 
            onExport={handleExport} 
            onRandomize={handleRandomize} 
          />
        </div>
      </main>
      
      <footer className="py-2 border-t border-slate-200 bg-white text-center">
        <p className="text-[10px] text-slate-400">
          © {new Date().getFullYear()} LightCharm 3D. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;