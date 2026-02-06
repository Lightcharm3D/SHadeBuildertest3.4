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
import { Download, RefreshCw, RotateCcw, Anchor, History, Trash2, MoveVertical, ShieldAlert, Cpu, Share2, X, Layers, Box, Sliders, Save, FolderHeart, Scale, Clock, Scissors, Sparkles, Palette, Zap, Info, Wrench } from 'lucide-react';
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
  onRepair?: () => void;
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
  onRepair,
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
          <TabsList className="grid grid-cols-5 w-full h-10 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="shape" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Shape</TabsTrigger>
            <TabsTrigger value="fit" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Fit</TabsTrigger>
            <TabsTrigger value="split" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Split</TabsTrigger>
            <TabsTrigger value="mat" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Mat</TabsTrigger>
            <TabsTrigger value="tools" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Tools</TabsTrigger>
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
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2">
                  <Wrench className="w-3 h-3 text-indigo-500" /> Mesh Repair System
                </Label>
                <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight">
                  Ensures geometry is manifold and optimized for 3D printing by merging close vertices and recomputing normals.
                </p>
                <Button 
                  onClick={onRepair} 
                  variant="outline" 
                  className="w-full h-10 text-[9px] font-black uppercase tracking-widest rounded-xl border-indigo-100 hover:bg-indigo-50 text-indigo-600"
                >
                  Repair & Optimize Mesh
                </Button>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-[9px] font-black uppercase text-slate-500">Wireframe Mode</Label>
                  <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
                </div>
                <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight">
                  Inspect the underlying mesh structure for defects.
                </p>
              </div>
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