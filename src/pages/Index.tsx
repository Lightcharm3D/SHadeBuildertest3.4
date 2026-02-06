"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LampshadeViewport, { MaterialParams } from '@/components/LampshadeViewport';
import ControlPanel from '@/components/ControlPanel';
import { LampshadeParams, LampshadeType, SilhouetteType } from '@/utils/geometry-generator';
import { STLExporter } from 'three-stdlib';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { Settings2, ChevronLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/mobile-hooks';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { saveStlFile } from '@/utils/file-saver';
import OnboardingTutorial from '@/components/OnboardingTutorial';

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
  noiseFrequency: 1.0,
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
  spokeCount: 4,
  rimThickness: 0.1,
  rimHeight: 0.1,
  internalRibDepth: 0.5,
  patternScale: 10,
  patternDepth: 0.3,
  patternRotation: 0,
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const isMobile = useIsMobile();

  const handleSceneReady = (scene: THREE.Scene, mesh: THREE.Mesh) => {
    meshRef.current = mesh;
  };

  const handleExport = async () => {
    if (!meshRef.current) {
      showError("Geometry not ready for export");
      return;
    }
    try {
      const exporter = new STLExporter();
      const exportMesh = meshRef.current.clone();
      exportMesh.scale.set(10, 10, 10);
      exportMesh.updateMatrixWorld();
      const result = exporter.parse(exportMesh);
      const fileName = `lampshade-${params.type}-${Date.now()}.stl`;
      await saveStlFile(result as string, fileName);
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
      'organic_cell', 'bricks', 'petal_bloom', 'faceted_gem',
      'honeycomb', 'diamond_mesh', 'knurled', 'wave_rings',
      'triangular_lattice', 'square_grid', 'radial_spokes', 'chevron_mesh',
      'spiral_ribs', 'voronoi_wire', 'star_mesh', 'organic_mesh',
      'woven_basket', 'bubble_foam', 'parametric_fins', 'spiral_stairs', 'diamond_plate',
      'knurled_v2', 'radial_fins', 'cellular_automata', 'voronoi_v2', 'spiral_mesh', 'diamond_lattice',
      'honeycomb_v2', 'crystal_lattice', 'organic_veins', 'geometric_tiles', 'spiral_vortex', 'ribbed_conic'
    ];
    const silhouettes: SilhouetteType[] = ['straight', 'hourglass', 'bell', 'convex', 'concave', 'tapered', 'bulbous', 'flared', 'waisted', 'asymmetric', 'trumpet', 'teardrop', 'diamond', 'stepped', 'wavy'];
    
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
      gridDensity: 8 + Math.floor(Math.random() * 15),
      twistAngle: Math.random() * 720,
      patternScale: 5 + Math.random() * 20,
      patternDepth: 0.1 + Math.random() * 0.8,
      patternRotation: Math.random() * 360,
      noiseFrequency: 0.5 + Math.random() * 2.0,
      rimThickness: Math.random() > 0.5 ? 0.1 + Math.random() * 0.2 : 0,
      rimHeight: Math.random() > 0.5 ? 0.1 + Math.random() * 0.5 : 0,
      spokeCount: 3 + Math.floor(Math.random() * 5),
    });
    
    showSuccess("New design generated!");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen bg-[#f8fafc] flex flex-col font-sans overflow-hidden"
    >
      <OnboardingTutorial />
      
      <header className="h-14 border-b border-slate-200/60 bg-white/80 backdrop-blur-2xl px-4 lg:px-6 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
            <img src="logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[10px] lg:text-sm font-black tracking-tighter text-slate-900 leading-none flex items-center gap-2">
              SHADEBUILDER <span className="text-slate-400">X</span> LITHOSTUDIO
              <span className="bg-indigo-100 text-indigo-600 text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-widest">BETA</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to="/lithophane" className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all">
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Litho Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative">
        {/* 3D Viewport - Takes priority */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <LampshadeViewport 
            params={params} 
            material={material}
            showWireframe={showWireframe} 
            showPrintability={showPrintability}
            onSceneReady={handleSceneReady} 
          />
          
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/80">Live 3D Preview</span>
            </div>
          </div>

          <AnimatePresence>
            {showWelcome && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-30 bg-slate-950/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-slate-900/90 p-8 rounded-[2.5rem] border border-white/10 text-center max-w-xs shadow-2xl mx-4"
                >
                  <div className="flex justify-center mb-4">
                    <div className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest">BETA TESTING</div>
                  </div>
                  <h3 className="text-white font-black text-xl mb-2">3D Shade Designer</h3>
                  <p className="text-slate-400 text-xs mb-6">
                    Adjust the parameters on the right to customize your 3D printable lampshade. This is a preview version.
                  </p>
                  <Button 
                    onClick={() => setShowWelcome(false)}
                    className="w-full brand-gradient text-white h-12 rounded-xl font-black uppercase tracking-widest"
                  >
                    Start Designing
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {isMobile && (
            <div className="absolute bottom-4 right-4 z-30">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button className="w-14 h-14 rounded-full brand-gradient shadow-2xl flex items-center justify-center text-white p-0 border-2 border-white/20">
                    <img src="settings-icon.png" alt="Settings" className="w-8 h-8 object-contain" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[80vh] bg-white rounded-t-[2rem]">
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
        
        {/* Permanent Sidebar for Desktop/Tablets */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && !isMobile && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:block shrink-0 border-l border-slate-200 bg-white h-full overflow-hidden"
            >
              <div className="w-[400px]">
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
                  onClose={() => setIsSidebarOpen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button when sidebar is closed */}
        {!isSidebarOpen && !isMobile && (
          <Button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-20 rounded-l-2xl rounded-r-none brand-gradient shadow-2xl flex items-center justify-center text-white p-0 border-y-2 border-l-2 border-white/20 z-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
      </main>
    </motion.div>
  );
};

export default Index;