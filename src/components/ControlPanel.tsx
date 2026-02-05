"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LampshadeParams, FitterType, SilhouetteType } from '@/utils/geometry-generator';
import { MaterialParams } from './LampshadeViewport';
import { Download, RefreshCw, RotateCcw, Anchor, History, Trash2, MoveVertical, ShieldAlert, Cpu, Share2, X, Layers, Box, Sliders, Save, FolderHeart, Scale, Clock } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface ControlPanelProps {
  params: LampshadeParams;
  setParams: (params: LampshadeParams) => void;
  material: MaterialParams;
  setMaterial: (material: MaterialParams) => void;
  showWireframe: boolean;
  setShowWireframe: (show: boolean) => void;
  showPrintability: boolean;
  setShowPrintability: (show: boolean) => void;
  onExport: () => void;
  onRandomize: () => void;
  onReset: () => void;
  onClose?: () => void;
}

const PRESETS: Record<string, Partial<LampshadeParams>> = {
  'Modern': { type: 'slotted', silhouette: 'straight', slotCount: 24, slotWidth: 0.1, height: 18, topRadius: 6, bottomRadius: 6 },
  'Organic': { type: 'organic_cell', silhouette: 'convex', noiseStrength: 1.2, noiseScale: 2.0, height: 15, topRadius: 5, bottomRadius: 8 },
  'Honeycomb': { type: 'honeycomb', silhouette: 'straight', gridDensity: 15, thickness: 0.15, height: 16, topRadius: 7, bottomRadius: 7, rimThickness: 0.2 },
  'Knurled': { type: 'knurled', silhouette: 'straight', patternScale: 15, patternDepth: 0.4, height: 14, topRadius: 6, bottomRadius: 6 },
};

const FILAMENT_PRESETS: Record<string, Partial<MaterialParams>> = {
  'Matte': { roughness: 0.9, metalness: 0, transmission: 0, opacity: 1 },
  'Silk': { roughness: 0.2, metalness: 0.4, transmission: 0, opacity: 1 },
  'Clear': { roughness: 0.4, metalness: 0, transmission: 0.8, opacity: 0.7 },
};

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  params, 
  setParams, 
  material,
  setMaterial,
  showWireframe, 
  setShowWireframe, 
  showPrintability,
  setShowPrintability,
  onExport, 
  onRandomize,
  onReset,
  onClose
}) => {
  const [gallery, setGallery] = useState<{id: string, name: string, params: LampshadeParams, material: MaterialParams}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('shade_gallery');
    if (saved) setGallery(JSON.parse(saved));
  }, []);

  const saveToGallery = () => {
    const name = prompt("Enter a name for this design:", `Design ${gallery.length + 1}`);
    if (!name) return;

    const newEntry = {
      id: Date.now().toString(),
      name,
      params: { ...params },
      material: { ...material }
    };
    const updated = [newEntry, ...gallery];
    setGallery(updated);
    localStorage.setItem('shade_gallery', JSON.stringify(updated));
    showSuccess("Design saved to gallery!");
  };

  const loadFromGallery = (entry: typeof gallery[0]) => {
    setParams(entry.params);
    setMaterial(entry.material);
    showSuccess(`Loaded "${entry.name}"`);
  };

  const removeFromGallery = (id: string) => {
    const updated = gallery.filter(e => e.id !== id);
    setGallery(updated);
    localStorage.setItem('shade_gallery', JSON.stringify(updated));
  };

  const updateParam = (key: keyof LampshadeParams, value: any) => {
    const roundedValue = typeof value === 'number' ? parseFloat(value.toFixed(2)) : value;
    setParams({ ...params, [key]: roundedValue });
  };

  const updateMaterial = (key: keyof MaterialParams, value: any) => {
    const roundedValue = typeof value === 'number' ? parseFloat(value.toFixed(2)) : value;
    setMaterial({ ...material, [key]: roundedValue });
  };

  const applyFilament = (preset: string) => {
    const presetData = FILAMENT_PRESETS[preset];
    setMaterial({ ...material, ...presetData });
    showSuccess(`Applied ${preset}`);
  };

  const estimateWeight = () => {
    const avgRadius = (params.topRadius + params.bottomRadius) / 2;
    const surfaceArea = 2 * Math.PI * avgRadius * params.height;
    const volume = surfaceArea * params.thickness;
    return (volume * 1.24).toFixed(1);
  };

  const estimatePrintTime = () => {
    const weight = parseFloat(estimateWeight());
    const baseTime = weight * 12; // ~12 mins per gram at standard speeds
    const complexityFactor = params.gridDensity ? (params.gridDensity / 10) : 1;
    const totalMins = baseTime * complexityFactor;
    const hours = Math.floor(totalMins / 60);
    const mins = Math.round(totalMins % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 md:hidden">
              <X className="w-4 h-4 text-slate-500" />
            </Button>
          )}
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Studio Controls</h2>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={saveToGallery} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
            <Save className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex h-8 w-8 text-slate-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Tabs defaultValue="shape" className="w-full">
          <TabsList className="grid grid-cols-5 w-full h-10 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="shape" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Shape</TabsTrigger>
            <TabsTrigger value="fitter" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Fit</TabsTrigger>
            <TabsTrigger value="pattern" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Pat</TabsTrigger>
            <TabsTrigger value="material" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Mat</TabsTrigger>
            <TabsTrigger value="gallery" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="shape" className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Presets</Label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {Object.keys(PRESETS).map(name => (
                  <Button 
                    key={name} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setParams({...params, ...PRESETS[name]})} 
                    className="h-8 text-[8px] font-black uppercase tracking-widest px-3 rounded-lg shrink-0"
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500">Template</Label>
                <Select value={params.type} onValueChange={(v: any) => updateParam('type', v)}>
                  <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voronoi_v3">Voronoi V3</SelectItem>
                    <SelectItem value="spiral_stairs_v2">Spiral Stairs V2</SelectItem>
                    <SelectItem value="diamond_plate_v2">Diamond Plate V2</SelectItem>
                    <SelectItem value="organic_coral">Organic Coral</SelectItem>
                    <SelectItem value="geometric_stars">Geometric Stars</SelectItem>
                    <SelectItem value="ribbed_spiral">Ribbed Spiral</SelectItem>
                    <SelectItem value="faceted_poly">Faceted Poly</SelectItem>
                    <SelectItem value="wave_shell_v2">Wave Shell V2</SelectItem>
                    <SelectItem value="fractal_tree">Fractal Tree</SelectItem>
                    <SelectItem value="geometric_weave">Geometric Weave</SelectItem>
                    <SelectItem value="parametric_waves">Parametric Waves</SelectItem>
                    <SelectItem value="scalloped_edge">Scalloped Edge</SelectItem>
                    <SelectItem value="twisted_column">Twisted Column</SelectItem>
                    <SelectItem value="honeycomb_v2">Honeycomb V2</SelectItem>
                    <SelectItem value="crystal_lattice">Crystal Lattice</SelectItem>
                    <SelectItem value="organic_veins">Organic Veins</SelectItem>
                    <SelectItem value="geometric_tiles">Geometric Tiles</SelectItem>
                    <SelectItem value="spiral_vortex">Spiral Vortex</SelectItem>
                    <SelectItem value="ribbed_conic">Ribbed Conic</SelectItem>
                    <SelectItem value="diamond_lattice">Diamond Lattice</SelectItem>
                    <SelectItem value="spiral_mesh">Spiral Mesh</SelectItem>
                    <SelectItem value="voronoi_v2">Voronoi V2</SelectItem>
                    <SelectItem value="cellular_automata">Cellular Automata</SelectItem>
                    <SelectItem value="radial_fins">Radial Fins</SelectItem>
                    <SelectItem value="knurled_v2">Knurled V2</SelectItem>
                    <SelectItem value="woven_basket">Woven Basket</SelectItem>
                    <SelectItem value="bubble_foam">Bubble Foam</SelectItem>
                    <SelectItem value="parametric_fins">Parametric Fins</SelectItem>
                    <SelectItem value="spiral_stairs">Spiral Stairs</SelectItem>
                    <SelectItem value="diamond_plate">Diamond Plate</SelectItem>
                    <SelectItem value="organic_mesh">Organic Mesh</SelectItem>
                    <SelectItem value="star_mesh">Star Mesh</SelectItem>
                    <SelectItem value="voronoi_wire">Voronoi Wire</SelectItem>
                    <SelectItem value="spiral_ribs">Spiral Ribs</SelectItem>
                    <SelectItem value="triangular_lattice">Triangular Lattice</SelectItem>
                    <SelectItem value="square_grid">Square Grid</SelectItem>
                    <SelectItem value="radial_spokes">Radial Spokes</SelectItem>
                    <SelectItem value="chevron_mesh">Chevron Mesh</SelectItem>
                    <SelectItem value="honeycomb">Honeycomb Grid</SelectItem>
                    <SelectItem value="diamond_mesh">Diamond Mesh</SelectItem>
                    <SelectItem value="knurled">Knurled Texture</SelectItem>
                    <SelectItem value="wave_rings">Wave Rings</SelectItem>
                    <SelectItem value="bricks">Bricks Pattern</SelectItem>
                    <SelectItem value="petal_bloom">Petal Bloom</SelectItem>
                    <SelectItem value="faceted_gem">Faceted Gem</SelectItem>
                    <SelectItem value="organic_cell">Organic Cellular</SelectItem>
                    <SelectItem value="ribbed_drum">Ribbed Drum</SelectItem>
                    <SelectItem value="spiral_twist">Spiral Twist</SelectItem>
                    <SelectItem value="voronoi">Voronoi Cells</SelectItem>
                    <SelectItem value="slotted">Slotted Fins</SelectItem>
                    <SelectItem value="double_wall">Double Wall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500">Silhouette</Label>
                <Select value={params.silhouette} onValueChange={(v: SilhouetteType) => updateParam('silhouette', v)}>
                  <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagoda_v2">Pagoda V2</SelectItem>
                    <SelectItem value="lotus">Lotus</SelectItem>
                    <SelectItem value="diamond_v2">Diamond V2</SelectItem>
                    <SelectItem value="stepped_v2">Stepped V2</SelectItem>
                    <SelectItem value="onion">Onion</SelectItem>
                    <SelectItem value="pagoda">Pagoda</SelectItem>
                    <SelectItem value="egg">Egg</SelectItem>
                    <SelectItem value="barrel">Barrel</SelectItem>
                    <SelectItem value="spindle">Spindle</SelectItem>
                    <SelectItem value="chalice">Chalice</SelectItem>
                    <SelectItem value="urn">Urn</SelectItem>
                    <SelectItem value="ovoid">Ovoid</SelectItem>
                    <SelectItem value="scalloped">Scalloped</SelectItem>
                    <SelectItem value="conic_stepped">Conic Stepped</SelectItem>
                    <SelectItem value="twisted_profile">Twisted Profile</SelectItem>
                    <SelectItem value="fluted">Fluted</SelectItem>
                    <SelectItem value="trumpet">Trumpet</SelectItem>
                    <SelectItem value="teardrop">Teardrop</SelectItem>
                    <SelectItem value="diamond">Diamond</SelectItem>
                    <SelectItem value="stepped">Stepped</SelectItem>
                    <SelectItem value="wavy">Wavy</SelectItem>
                    <SelectItem value="straight">Straight</SelectItem>
                    <SelectItem value="hourglass">Hourglass</SelectItem>
                    <SelectItem value="convex">Convex</SelectItem>
                    <SelectItem value="concave">Concave</SelectItem>
                    <SelectItem value="tapered">Tapered</SelectItem>
                    <SelectItem value="bulbous">Bulbous</SelectItem>
                    <SelectItem value="flared">Flared</SelectItem>
                    <SelectItem value="waisted">Waisted</SelectItem>
                    <SelectItem value="asymmetric">Asymmetric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500">Height (cm)</Label>
                <Input type="number" step={0.1} value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500">Top Radius</Label>
                <Input type="number" step={0.1} value={params.topRadius} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500">Bottom Radius</Label>
              <Input type="number" step={0.1} value={params.bottomRadius} onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg" />
            </div>
          </TabsContent>

          <TabsContent value="fitter" className="space-y-5 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2">
                <Anchor className="w-3 h-3" /> Fitter Type
              </Label>
              <Select value={params.fitterType} onValueChange={(v: FitterType) => updateParam('fitterType', v)}>
                <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="spider">Spider</SelectItem>
                  <SelectItem value="uno">Uno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {params.fitterType !== 'none' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                    <span className="flex items-center gap-2"><MoveVertical className="w-3 h-3" /> Height (cm)</span>
                    <span className="text-indigo-600 font-bold">{params.fitterHeight.toFixed(1)}</span>
                  </div>
                  <Slider value={[params.fitterHeight]} min={0} max={params.height} step={0.1} onValueChange={([v]) => updateParam('fitterHeight', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500">Inner ID (mm)</Label>
                    <Input type="number" value={params.fitterDiameter} onChange={(e) => updateParam('fitterDiameter', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500">Outer OD (mm)</Label>
                    <Input type="number" value={params.fitterOuterDiameter} onChange={(e) => updateParam('fitterOuterDiameter', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg" />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pattern" className="space-y-5 pt-4">
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                    <span>Scale / Density</span>
                    <span className="text-indigo-600 font-bold">{(params.patternScale || params.gridDensity || 10).toFixed(1)}</span>
                  </div>
                  <Slider 
                    value={[params.patternScale || params.gridDensity || 10]} 
                    min={1} max={50} step={0.1} 
                    onValueChange={([v]) => {
                      updateParam('patternScale', v);
                      updateParam('gridDensity', Math.round(v));
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                    <span>Depth / Strength</span>
                    <span className="text-indigo-600 font-bold">{(params.patternDepth || params.noiseStrength || params.ribDepth || 0.3).toFixed(2)}</span>
                  </div>
                  <Slider 
                    value={[params.patternDepth || params.noiseStrength || params.ribDepth || 0.3]} 
                    min={0} max={2} step={0.01} 
                    onValueChange={([v]) => {
                      updateParam('patternDepth', v);
                      updateParam('noiseStrength', v);
                      updateParam('ribDepth', v);
                    }} 
                  />
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => updateParam('seed', Math.floor(Math.random() * 1000000))}
              className="w-full gap-2 h-9 text-[9px] font-black uppercase tracking-widest rounded-lg"
            >
              <RefreshCw className="w-3 h-3" />
              New Variation
            </Button>
          </TabsContent>

          <TabsContent value="material" className="space-y-5 pt-4">
            <div className="space-y-3">
              <Label className="text-[9px] font-black uppercase text-slate-400">Filament Presets</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(FILAMENT_PRESETS).map(name => (
                  <Button 
                    key={name} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => applyFilament(name)} 
                    className="h-8 text-[8px] font-black uppercase tracking-widest rounded-lg"
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-500">Color</Label>
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: material.color }} />
                <Input type="color" value={material.color} onChange={(e) => updateMaterial('color', e.target.value)} className="h-10 w-full p-1 rounded-lg cursor-pointer" />
              </div>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Scale className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Print Stats</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-indigo-700 font-bold">Est. Weight</span>
                  <span className="text-xs font-black text-indigo-900">{estimateWeight()}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-indigo-700 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Est. Time
                  </span>
                  <span className="text-xs font-black text-indigo-900">{estimatePrintTime()}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FolderHeart className="w-3.5 h-3.5" /> Saved Designs
              </Label>
              <span className="text-[8px] font-bold text-slate-400">{gallery.length}/20</span>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
              {gallery.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No saved designs</p>
                </div>
              ) : (
                gallery.map(entry => (
                  <div key={entry.id} className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer" onClick={() => loadFromGallery(entry)}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-900 group-hover:text-indigo-600">{entry.name}</span>
                      <span className="text-[8px] text-slate-400 uppercase font-bold">{entry.params.type.replace('_', ' ')}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); removeFromGallery(entry.id); }}
                      className="h-7 w-7 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <Button onClick={saveToGallery} className="w-full gap-2 h-10 text-[9px] font-black uppercase tracking-widest rounded-xl border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50">
              <Save className="w-3.5 h-3.5" />
              Save Current Design
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <Button variant="outline" onClick={onRandomize} className="w-full h-10 text-[9px] font-black uppercase tracking-widest rounded-xl">
          Randomize
        </Button>
        <Button onClick={onExport} className="w-full brand-gradient text-white h-12 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
          <Download className="w-4 h-4 mr-2" />
          Export STL
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;