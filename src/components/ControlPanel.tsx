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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LampshadeParams, FitterType, SilhouetteType } from '@/utils/geometry-generator';
import { MaterialParams } from './LampshadeViewport';
import { Download, RefreshCw, RotateCcw, Anchor, History, Trash2, MoveVertical, ShieldAlert, Cpu, Share2, X, Layers, Box, Sliders, Save, FolderHeart, Scale, Clock, Scissors, Sparkles, Palette, Zap, Info } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { generateLampDNA } from '@/utils/dna-engine';

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
  'Modern Slotted': { type: 'slotted', silhouette: 'straight', slotCount: 24, slotWidth: 0.1, height: 18, topRadius: 6, bottomRadius: 6 },
  'Organic Cell': { type: 'organic_cell', silhouette: 'convex', noiseStrength: 1.2, noiseScale: 2.0, height: 15, topRadius: 5, bottomRadius: 8 },
  'Honeycomb': { type: 'honeycomb', silhouette: 'straight', gridDensity: 15, thickness: 0.15, height: 16, topRadius: 7, bottomRadius: 7, rimThickness: 0.2 },
  'Spiral Vortex': { type: 'spiral_vortex', silhouette: 'hourglass', twistAngle: 720, ribCount: 12, height: 20, topRadius: 8, bottomRadius: 8 },
  'Origami Fold': { type: 'origami', silhouette: 'straight', foldCount: 16, foldDepth: 1.2, height: 15, topRadius: 6, bottomRadius: 6 },
  'Lattice Shell': { type: 'lattice', silhouette: 'bell', gridDensity: 18, height: 18, topRadius: 5, bottomRadius: 10 },
};

const FILAMENT_PRESETS: Record<string, Partial<MaterialParams>> = {
  'Matte White': { color: '#ffffff', roughness: 0.9, metalness: 0, transmission: 0, opacity: 1 },
  'Silk Gold': { color: '#ffd700', roughness: 0.2, metalness: 0.6, transmission: 0, opacity: 1 },
  'Clear PETG': { color: '#e0f2fe', roughness: 0.3, metalness: 0, transmission: 0.9, opacity: 0.6 },
  'Marble': { color: '#f1f5f9', roughness: 0.8, metalness: 0, transmission: 0, opacity: 1 },
  'Wood': { color: '#78350f', roughness: 1.0, metalness: 0, transmission: 0, opacity: 1 },
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
    const newEntry = { id: Date.now().toString(), name, params: { ...params }, material: { ...material } };
    const updated = [newEntry, ...gallery];
    setGallery(updated);
    localStorage.setItem('shade_gallery', JSON.stringify(updated));
    showSuccess("Design saved to gallery!");
  };

  const shareDNA = () => {
    const dna = generateLampDNA(params);
    navigator.clipboard.writeText(dna);
    showSuccess("Lamp DNA copied to clipboard!");
  };

  const updateParam = (key: keyof LampshadeParams, value: any) => {
    const roundedValue = typeof value === 'number' ? parseFloat(value.toFixed(2)) : value;
    setParams({ ...params, [key]: roundedValue });
  };

  const updateMaterial = (key: keyof MaterialParams, value: any) => {
    const roundedValue = typeof value === 'number' ? parseFloat(value.toFixed(2)) : value;
    setMaterial({ ...material, [key]: roundedValue });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Studio Controls</h2>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onRandomize} title="Randomize Design" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={shareDNA} title="Share DNA" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={saveToGallery} title="Save to Gallery" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
            <Save className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onReset} title="Reset All" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        <Tabs defaultValue="shape" className="w-full">
          <TabsList className="grid grid-cols-4 w-full h-10 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="shape" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Shape</TabsTrigger>
            <TabsTrigger value="fit" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Fit</TabsTrigger>
            <TabsTrigger value="split" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Split</TabsTrigger>
            <TabsTrigger value="mat" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Mat</TabsTrigger>
          </TabsList>

          <TabsContent value="shape" className="space-y-4 pt-4">
            <Accordion type="single" collapsible className="w-full space-y-2">
              <AccordionItem value="presets" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 px-4 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> Design Presets
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(PRESETS).map(name => (
                      <Button key={name} variant="outline" size="sm" onClick={() => setParams({...params, ...PRESETS[name]})} className="h-10 text-[8px] font-black uppercase tracking-widest px-2 rounded-xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 justify-start">
                        <div className="w-1.5 h-full bg-indigo-500 mr-2 shrink-0" />
                        <span className="truncate">{name}</span>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="dimensions" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 px-4 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Scale className="w-3 h-3 text-indigo-500" /> Dimensions
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4 px-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Height (cm)</Label>
                      <Input type="number" step={0.1} value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Wall (cm)</Label>
                      <Input type="number" step={0.01} value={params.thickness} onChange={(e) => updateParam('thickness', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Top Radius</Label>
                      <Input type="number" step={0.1} value={params.topRadius} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Bottom Radius</Label>
                      <Input type="number" step={0.1} value={params.bottomRadius} onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pattern" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 px-4 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-indigo-500" /> Pattern Engine
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4 px-2">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500">Template</Label>
                    <Select value={params.type} onValueChange={(v: any) => updateParam('type', v)}>
                      <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg bg-white"><SelectValue /></SelectTrigger>
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500">Silhouette</Label>
                    <Select value={params.silhouette} onValueChange={(v: SilhouetteType) => updateParam('silhouette', v)}>
                      <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pagoda_v2">Pagoda V2</SelectItem>
                        <SelectItem value="lotus">Lotus</SelectItem>
                        <SelectItem value="diamond_v2">Diamond V2</SelectItem>
                        <SelectItem value="stepped_v2">Stepped V2</SelectItem>
                        <SelectItem value="onion">Onion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="fit" className="space-y-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2"><Anchor className="w-3 h-3" /> Fitter Type</Label>
                <Select value={params.fitterType} onValueChange={(v: FitterType) => updateParam('fitterType', v)}>
                  <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="spider">Spider</SelectItem>
                    <SelectItem value="uno">Uno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {params.fitterType !== 'none' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Height (cm)</span><span>{params.fitterHeight.toFixed(1)}</span></div>
                    <Slider value={[params.fitterHeight]} min={0} max={params.height} step={0.1} onValueChange={([v]) => updateParam('fitterHeight', v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Inner ID (mm)</Label>
                      <Input type="number" value={params.fitterDiameter} onChange={(e) => updateParam('fitterDiameter', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Outer OD (mm)</Label>
                      <Input type="number" value={params.fitterOuterDiameter} onChange={(e) => updateParam('fitterOuterDiameter', parseFloat(e.target.value))} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="split" className="space-y-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Split Segments</span><span>{params.splitSegments || 1}</span></div>
                <Slider value={[params.splitSegments || 1]} min={1} max={8} step={1} onValueChange={([v]) => updateParam('splitSegments', v)} />
              </div>
              {params.splitSegments && params.splitSegments > 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Active Part</span><span>{(params.activePart || 0) + 1}</span></div>
                    <Slider value={[params.activePart || 0]} min={0} max={params.splitSegments - 1} step={1} onValueChange={([v]) => updateParam('activePart', v)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-slate-500">Joint Type</Label>
                    <Select value={params.jointType || 'none'} onValueChange={(v: any) => updateParam('jointType', v)}>
                      <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Flat)</SelectItem>
                        <SelectItem value="tab">Alignment Tabs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mat" className="space-y-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-500">Custom Color</Label>
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg border border-slate-200 shrink-0 shadow-sm" style={{ backgroundColor: material.color }} />
                  <Input type="color" value={material.color} onChange={(e) => updateMaterial('color', e.target.value)} className="h-10 w-full p-1 rounded-lg cursor-pointer bg-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Roughness</span><span>{material.roughness.toFixed(2)}</span></div>
                  <Slider value={[material.roughness]} min={0} max={1} step={0.01} onValueChange={([v]) => updateMaterial('roughness', v)} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400"><span>Metalness</span><span>{material.metalness.toFixed(2)}</span></div>
                  <Slider value={[material.metalness]} min={0} max={1} step={0.01} onValueChange={([v]) => updateMaterial('metalness', v)} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-emerald-500" /> Print Ready
          </span>
          <Switch checked={showPrintability} onCheckedChange={setShowPrintability} />
        </div>
        <Button onClick={onExport} className="w-full brand-gradient text-white h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Download className="w-4 h-4 mr-2" />
          {params.splitSegments && params.splitSegments > 1 ? `Export Part ${(params.activePart || 0) + 1}` : 'Export STL'}
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;