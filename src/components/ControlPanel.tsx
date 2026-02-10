"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LampshadeParams, FitterType, SilhouetteType, LampshadeType, ControlPoint, RimMode } from '@/utils/geometry-generator';
import { MaterialParams } from './LampshadeViewport';
import { Download, RefreshCw, RotateCcw, Anchor, History, Trash2, MoveVertical, ShieldAlert, Cpu, Share2, FileInput, X, Layers, Box, Sliders, Save, FolderHeart, Scale, Clock, Scissors, Sparkles, Palette, Zap, Info, Wrench, Dna, Copy, Check, Layout, Ruler, Grid3X3, Waves, ZapOff, Search, Undo2, Redo2, MousePointer2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { generateLampDNA, parseLampDNA } from '@/utils/dna-engine';
import PresetGallery from './PresetGallery';
import ProfileEditor from './ProfileEditor';
import PatternPreview2D from './PatternPreview2D';

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

const TYPES: { id: LampshadeType; label: string }[] = [
  { id: 'plain_wall', label: 'Plain Wall' },
  { id: 'ribbed_drum', label: 'Ribbed Drum' },
  { id: 'spiral_twist', label: 'Spiral Twist' },
  { id: 'voronoi', label: 'Voronoi' },
  { id: 'wave_shell', label: 'Wave Shell' },
  { id: 'geometric_poly', label: 'Geometric Poly' },
  { id: 'lattice', label: 'Lattice' },
  { id: 'origami', label: 'Origami' },
  { id: 'perlin_noise', label: 'Perlin Noise' },
  { id: 'slotted', label: 'Slotted' },
  { id: 'double_wall', label: 'Double Wall' },
  { id: 'organic_cell', label: 'Organic Cell' },
  { id: 'bricks', label: 'Bricks' },
  { id: 'petal_bloom', label: 'Petal Bloom' },
  { id: 'faceted_gem', label: 'Faceted Gem' },
  { id: 'honeycomb', label: 'Honeycomb' },
  { id: 'diamond_mesh', label: 'Diamond Mesh' },
  { id: 'knurled', label: 'Knurled' },
  { id: 'wave_rings', label: 'Wave Rings' },
  { id: 'spiral_vortex', label: 'Spiral Vortex' },
  { id: 'ribbed_conic', label: 'Ribbed Conic' },
  { id: 'parametric_waves', label: 'Parametric Waves' },
  { id: 'scalloped_edge', label: 'Scalloped Edge' },
  { id: 'twisted_column', label: 'Twisted Column' },
];

const SILHOUETTES: { id: SilhouetteType; label: string }[] = [
  { id: 'straight', label: 'Straight' },
  { id: 'hourglass', label: 'Hourglass' },
  { id: 'bell', label: 'Bell' },
  { id: 'convex', label: 'Convex' },
  { id: 'concave', label: 'Concave' },
  { id: 'tapered', label: 'Tapered' },
  { id: 'bulbous', label: 'Bulbous' },
  { id: 'flared', label: 'Flared' },
  { id: 'waisted', label: 'Waisted' },
  { id: 'asymmetric', label: 'Asymmetric' },
  { id: 'teardrop', label: 'Teardrop' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'stepped', label: 'Stepped' },
  { id: 'wavy', label: 'Wavy' },
  { id: 'onion', label: 'Onion' },
  { id: 'custom', label: 'Custom Bezier' },
];

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
  const [dnaInput, setDnaInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  // History State
  const [history, setHistory] = useState<LampshadeParams[]>([]);
  const [redoStack, setRedoStack] = useState<LampshadeParams[]>([]);
  const lastHistoryParams = useRef<LampshadeParams>(params);
  
  // Nozzle Settings
  const [nozzleSize, setNozzleSize] = useState(0.4);
  const [snapToNozzle, setSnapToNozzle] = useState(false);

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

  const deleteFromGallery = (id: string) => {
    const updated = gallery.filter(item => item.id !== id);
    setGallery(updated);
    localStorage.setItem('shade_gallery', JSON.stringify(updated));
    showSuccess("Design removed from gallery");
  };

  const shareDNA = () => {
    const dna = generateLampDNA(params);
    const baseUrl = window.location.href.split('#')[0];
    const shareUrl = `${baseUrl}#/?dna=${dna}`;
    navigator.clipboard.writeText(shareUrl);
    showSuccess("Share link with DNA copied to clipboard!");
  };

  const handleImportDNA = () => {
    if (!dnaInput) {
      showError("Please paste a DNA string or link first");
      return;
    }
    const importedParams = parseLampDNA(dnaInput);
    if (importedParams) {
      addToHistory(params);
      setParams(importedParams);
      showSuccess("Design loaded successfully!");
      setDnaInput('');
    } else {
      showError("Invalid DNA format. Please check the code or link.");
    }
  };

  const copyCurrentDNA = () => {
    const dna = generateLampDNA(params);
    navigator.clipboard.writeText(dna);
    setCopied(true);
    showSuccess("Current design DNA copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const addToHistory = (currentParams: LampshadeParams) => {
    if (JSON.stringify(currentParams) === JSON.stringify(lastHistoryParams.current)) return;
    setHistory(prev => [...prev.slice(-19), { ...lastHistoryParams.current }]);
    lastHistoryParams.current = { ...currentParams };
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(prevRedo => [...prevRedo, { ...params }]);
    setHistory(prevHist => prevHist.slice(0, -1));
    lastHistoryParams.current = { ...prev };
    setParams(prev);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prevHist => [...prevHist, { ...params }]);
    setRedoStack(prevRedo => prevRedo.slice(0, -1));
    lastHistoryParams.current = { ...next };
    setParams(next);
  };

  const updateParam = (key: keyof LampshadeParams, value: any, commit = false) => {
    if (commit) addToHistory(params);
    
    let finalValue = value;
    if (key === 'thickness' && snapToNozzle) {
      const perimeters = Math.max(1, Math.round(value / nozzleSize));
      finalValue = perimeters * nozzleSize;
    }

    const roundedValue = typeof finalValue === 'number' ? parseFloat(finalValue.toFixed(3)) : finalValue;
    setParams({ ...params, [key]: roundedValue });
  };

  const updateCustomProfile = (points: ControlPoint[]) => {
    setParams({ ...params, customProfile: points });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Studio Controls</h2>
        </div>
        <div className="flex gap-1.5">
          <Button variant="secondary" size="icon" onClick={undo} disabled={history.length === 0} className="h-8 w-8 bg-white border border-slate-200 text-slate-600 disabled:opacity-30">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="secondary" size="icon" onClick={redo} disabled={redoStack.length === 0} className="h-8 w-8 bg-white border border-slate-200 text-slate-600 disabled:opacity-30">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <Button variant="secondary" size="icon" onClick={onRandomize} title="Randomize Design" className="h-8 w-8 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="secondary" size="icon" onClick={saveToGallery} title="Save to Gallery" className="h-8 w-8 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm">
            <Save className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Tabs defaultValue="shape" className="w-full">
          <TabsList className="grid grid-cols-5 w-full h-10 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="shape" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Shape</TabsTrigger>
            <TabsTrigger value="pattern" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Pattern</TabsTrigger>
            <TabsTrigger value="fit" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Fit</TabsTrigger>
            <TabsTrigger value="split" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Split</TabsTrigger>
            <TabsTrigger value="tools" className="text-[8px] font-black uppercase tracking-widest rounded-lg">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="shape" className="space-y-4 pt-4">
            <Button 
              onClick={() => setIsGalleryOpen(true)}
              className="w-full h-14 brand-gradient text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Search className="w-4 h-4" />
              Browse Design Gallery
            </Button>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2"><Layout className="w-3 h-3" /> Design Type</Label>
                <Select value={params.type} onValueChange={(v: LampshadeType) => updateParam('type', v, true)}>
                  <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2"><Box className="w-3 h-3" /> Silhouette</Label>
                <Select value={params.silhouette} onValueChange={(v: SilhouetteType) => updateParam('silhouette', v, true)}>
                  <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SILHOUETTES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {params.silhouette === 'custom' && (
                <ProfileEditor 
                  points={params.customProfile || [{x: 1, y: 0}, {x: 1, y: 1}]} 
                  onChange={updateCustomProfile} 
                />
              )}
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
              <AccordionItem value="dimensions" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 px-4 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Ruler className="w-3 h-3 text-indigo-500" /> Dimensions
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4 px-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Height (cm)</Label>
                      <Input type="number" step={0.1} value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value))} onBlur={() => addToHistory(params)} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Wall (cm)</Label>
                      <Input type="number" step={0.01} value={params.thickness} onChange={(e) => updateParam('thickness', parseFloat(e.target.value))} onBlur={() => addToHistory(params)} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] font-black uppercase text-indigo-600 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Nozzle Snapping
                      </Label>
                      <Switch checked={snapToNozzle} onCheckedChange={setSnapToNozzle} />
                    </div>
                    {snapToNozzle && (
                      <div className="space-y-2">
                        <Select value={nozzleSize.toString()} onValueChange={(v) => setNozzleSize(parseFloat(v))}>
                          <SelectTrigger className="h-8 text-[9px] font-bold bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.4">0.4mm Nozzle</SelectItem>
                            <SelectItem value="0.6">0.6mm Nozzle</SelectItem>
                            <SelectItem value="0.8">0.8mm Nozzle</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[8px] text-indigo-400 font-bold uppercase leading-tight">
                          Thickness will snap to multiples of {nozzleSize}mm for perfect perimeters.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Top Diameter (cm)</Label>
                      <Input type="number" step={0.1} value={params.topRadius * 2} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) / 2)} onBlur={() => addToHistory(params)} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Bottom Diameter (cm)</Label>
                      <Input type="number" step={0.1} value={params.bottomRadius * 2} onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value) / 2)} onBlur={() => addToHistory(params)} className="h-9 text-[10px] font-bold rounded-lg bg-white" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="structure" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 px-4 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Layers className="w-3 h-3 text-indigo-500" /> Structure (Ribs & Rims)
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6 px-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Internal Ribs</Label>
                      <Switch 
                        checked={params.internalRibs > 0} 
                        onCheckedChange={(v) => updateParam('internalRibs', v ? 4 : 0, true)} 
                      />
                    </div>
                    {params.internalRibs > 0 && (
                      <div className="space-y-4 pl-2 border-l-2 border-indigo-100">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                            <span>Rib Count</span>
                            <span>{params.internalRibs}</span>
                          </div>
                          <Slider value={[params.internalRibs]} min={2} max={24} step={1} onValueChange={([v]) => updateParam('internalRibs', v)} onValueCommit={() => addToHistory(params)} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                            <span>Rib Depth (cm)</span>
                            <span>{params.internalRibDepth || 0.5}</span>
                          </div>
                          <Slider value={[params.internalRibDepth || 0.5]} min={0.1} max={2} step={0.1} onValueChange={([v]) => updateParam('internalRibDepth', v)} onValueCommit={() => addToHistory(params)} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] font-black uppercase text-slate-500">Support Rims</Label>
                      <Switch 
                        checked={(params.rimThickness || 0) > 0} 
                        onCheckedChange={(v) => updateParam('rimThickness', v ? 0.2 : 0, true)} 
                      />
                    </div>
                    {(params.rimThickness || 0) > 0 && (
                      <div className="space-y-4 pl-2 border-l-2 border-indigo-100">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-slate-500">Rim Mode</Label>
                          <Select value={params.rimMode || 'both'} onValueChange={(v: RimMode) => updateParam('rimMode', v, true)}>
                            <SelectTrigger className="h-8 text-[9px] font-bold bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="both">Both Rims</SelectItem>
                              <SelectItem value="top">Top Only</SelectItem>
                              <SelectItem value="bottom">Bottom Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                            <span>Rim Thickness (cm)</span>
                            <span>{params.rimThickness}</span>
                          </div>
                          <Slider value={[params.rimThickness || 0.2]} min={0.05} max={1} step={0.01} onValueChange={([v]) => updateParam('rimThickness', v)} onValueCommit={() => addToHistory(params)} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                            <span>Rim Height (cm)</span>
                            <span>{params.rimHeight || 0.2}</span>
                          </div>
                          <Slider value={[params.rimHeight || 0.2]} min={0.05} max={1} step={0.01} onValueChange={([v]) => updateParam('rimHeight', v)} onValueCommit={() => addToHistory(params)} />
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="pattern" className="space-y-4 pt-4">
            <PatternPreview2D params={params} />
            
            <div className="p-4 bg-slate-50 rounded-2xl space-y-5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                  <Sliders className="w-3 h-3" /> Pattern Tuning
                </Label>
              </div>

              <div className="space-y-4">
                {/* Dynamic Controls based on Type */}
                {(params.type.includes('ribbed') || params.type.includes('spiral') || params.type === 'slotted' || params.type === 'origami' || params.type === 'bricks' || params.type.includes('honeycomb')) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                      <span>Count / Density</span>
                      <span>{params.ribCount || params.slotCount || params.foldCount || params.gridDensity || 24}</span>
                    </div>
                    <Slider 
                      value={[params.ribCount || params.slotCount || params.foldCount || params.gridDensity || 24]} 
                      min={4} max={120} step={1} 
                      onValueChange={([v]) => {
                        if (params.type === 'slotted') updateParam('slotCount', v);
                        else if (params.type === 'origami') updateParam('foldCount', v);
                        else if (params.type === 'bricks' || params.type.includes('honeycomb')) updateParam('gridDensity', v);
                        else updateParam('ribCount', v);
                      }} 
                      onValueCommit={() => addToHistory(params)}
                    />
                  </div>
                )}

                {(params.type.includes('twist') || params.type.includes('spiral') || params.type === 'lattice' || params.type === 'bricks') && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                      <span>{params.type === 'bricks' ? 'Pattern Rotation' : 'Twist Angle'}</span>
                      <span>{params.type === 'bricks' ? params.patternRotation : params.twistAngle || 0}°</span>
                    </div>
                    <Slider 
                      value={[params.type === 'bricks' ? (params.patternRotation || 0) : (params.twistAngle || 0)]} 
                      min={params.type === 'bricks' ? -90 : -720} 
                      max={params.type === 'bricks' ? 90 : 720} 
                      step={1} 
                      onValueChange={([v]) => {
                        if (params.type === 'bricks') updateParam('patternRotation', v);
                        else updateParam('twistAngle', v);
                      }} 
                      onValueCommit={() => addToHistory(params)}
                    />
                  </div>
                )}

                {(params.type.includes('wave') || params.type.includes('parametric')) && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                        <span>Frequency</span>
                        <span>{params.frequency || 5}</span>
                      </div>
                      <Slider value={[params.frequency || 5]} min={1} max={30} step={0.1} onValueChange={([v]) => updateParam('frequency', v)} onValueCommit={() => addToHistory(params)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                        <span>Amplitude</span>
                        <span>{params.amplitude || 1}</span>
                      </div>
                      <Slider value={[params.amplitude || 1]} min={0} max={5} step={0.1} onValueChange={([v]) => updateParam('amplitude', v)} onValueCommit={() => addToHistory(params)} />
                    </div>
                  </>
                )}

                {(params.type.includes('noise') || params.type.includes('organic') || params.type.includes('voronoi')) && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                        <span>Noise Strength</span>
                        <span>{params.noiseStrength || 0.5}</span>
                      </div>
                      <Slider value={[params.noiseStrength || 0.5]} min={0} max={3} step={0.01} onValueChange={([v]) => updateParam('noiseStrength', v)} onValueCommit={() => addToHistory(params)} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                        <span>Noise Scale</span>
                        <span>{params.noiseScale || 0.5}</span>
                      </div>
                      <Slider value={[params.noiseScale || 0.5]} min={0.1} max={5} step={0.01} onValueChange={([v]) => updateParam('noiseScale', v)} onValueCommit={() => addToHistory(params)} />
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                      <span>Pattern Scale</span>
                      <span>{params.patternScale || 10}</span>
                    </div>
                    <Slider value={[params.patternScale || 10]} min={1} max={50} step={0.1} onValueChange={([v]) => updateParam('patternScale', v)} onValueCommit={() => addToHistory(params)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                      <span>Pattern Depth</span>
                      <span>{params.patternDepth || 0.3} mm</span>
                    </div>
                    <Slider value={[params.patternDepth || 0.3]} min={0} max={5} step={0.01} onValueChange={([v]) => updateParam('patternDepth', v)} onValueCommit={() => addToHistory(params)} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fit" className="space-y-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2"><Anchor className="w-3 h-3" /> Fitter Type</Label>
                <Select value={params.fitterType} onValueChange={(v: FitterType) => updateParam('fitterType', v, true)}>
                  <SelectTrigger className="h-9 text-[10px] font-bold rounded-lg bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="spider">Spider</SelectItem>
                    <SelectItem value="uno">Uno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {params.fitterType !== 'none' && (
                <div className="space-y-5 pt-2 border-t border-slate-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                      <span className="flex items-center gap-1"><MoveVertical className="w-2.5 h-2.5" /> Placement Height</span>
                      <span>{params.fitterHeight.toFixed(1)} cm</span>
                    </div>
                    <Slider 
                      value={[params.fitterHeight]} 
                      min={0} 
                      max={params.height} 
                      step={0.1} 
                      onValueChange={([v]) => updateParam('fitterHeight', v)} 
                      onValueCommit={() => addToHistory(params)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                      <span className="flex items-center gap-1"><Ruler className="w-2.5 h-2.5" /> Inner Diameter</span>
                      <span>{params.fitterDiameter.toFixed(1)} mm</span>
                    </div>
                    <Slider 
                      value={[params.fitterDiameter]} 
                      min={10} 
                      max={100} 
                      step={0.1} 
                      onValueChange={([v]) => updateParam('fitterDiameter', v)} 
                      onValueCommit={() => addToHistory(params)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                      <span className="flex items-center gap-1"><Ruler className="w-2.5 h-2.5" /> Outer Diameter</span>
                      <span>{params.fitterOuterDiameter.toFixed(1)} mm</span>
                    </div>
                    <Slider 
                      value={[params.fitterOuterDiameter]} 
                      min={10} 
                      max={120} 
                      step={0.1} 
                      onValueChange={([v]) => updateParam('fitterOuterDiameter', v)} 
                      onValueCommit={() => addToHistory(params)}
                    />
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2">
                      <Scale className="w-3 h-3" /> Spoke Dimensions
                    </Label>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                        <span>Inner Overlap</span>
                        <span>{params.spokeInnerOverlap || 2} mm</span>
                      </div>
                      <Slider 
                        value={[params.spokeInnerOverlap || 2]} 
                        min={0} 
                        max={20} 
                        step={0.5} 
                        onValueChange={([v]) => updateParam('spokeInnerOverlap', v)} 
                        onValueCommit={() => addToHistory(params)}
                      />
                      <p className="text-[7px] text-slate-400 font-bold uppercase">How far the spoke goes into the ring.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                        <span>Outer Length</span>
                        <span>{params.spokeLength ? `${params.spokeLength.toFixed(1)} mm` : 'Auto (Full)'}</span>
                      </div>
                      <Slider 
                        value={[params.spokeLength || 0]} 
                        min={0} 
                        max={200} 
                        step={1} 
                        onValueChange={([v]) => updateParam('spokeLength', v === 0 ? undefined : v)} 
                        onValueCommit={() => addToHistory(params)}
                      />
                      <p className="text-[7px] text-slate-400 font-bold uppercase">Set to 0 for automatic wall-reaching spokes.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                        <span>Spoke Amount</span>
                        <span>{params.spokeCount}</span>
                      </div>
                      <Slider 
                        value={[params.spokeCount || 4]} 
                        min={2} 
                        max={12} 
                        step={1} 
                        onValueChange={([v]) => updateParam('spokeCount', v)} 
                        onValueCommit={() => addToHistory(params)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-slate-500">Spoke Width (mm)</Label>
                        <Input 
                          type="number" 
                          step={0.1} 
                          value={params.spokeWidth} 
                          onChange={(e) => updateParam('spokeWidth', parseFloat(e.target.value))} 
                          onBlur={() => addToHistory(params)}
                          className="h-9 text-[10px] font-bold rounded-lg bg-white" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-slate-500">Spoke Thick (mm)</Label>
                        <Input 
                          type="number" 
                          step={0.1} 
                          value={params.spokeThickness} 
                          onChange={(e) => updateParam('spokeThickness', parseFloat(e.target.value))} 
                          onBlur={() => addToHistory(params)}
                          className="h-9 text-[10px] font-bold rounded-lg bg-white" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="split" className="space-y-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2">
                  <Scissors className="w-3 h-3 text-indigo-500" /> Multi-Part Splitting
                </Label>
                <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight">
                  Split the model into vertical segments for printing on smaller beds.
                </p>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                      <span>Number of Parts</span>
                      <span>{params.splitSegments || 1}</span>
                    </div>
                    <Slider 
                      value={[params.splitSegments || 1]} 
                      min={1} max={8} step={1} 
                      onValueChange={([v]) => updateParam('splitSegments', v)} 
                      onValueCommit={() => addToHistory(params)}
                    />
                  </div>

                  {params.splitSegments && params.splitSegments > 1 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                        <span>Active Part</span>
                        <span>{(params.activePart || 0) + 1} of {params.splitSegments}</span>
                      </div>
                      <Slider 
                        value={[params.activePart || 0]} 
                        min={0} max={params.splitSegments - 1} step={1} 
                        onValueChange={([v]) => updateParam('activePart', v)} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 pt-4">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2">
                  <Dna className="w-3 h-3 text-indigo-500" /> DNA Studio
                </Label>
                <div className="space-y-2">
                  <Input 
                    placeholder="Paste DNA string or link..." 
                    value={dnaInput} 
                    onChange={(e) => setDnaInput(e.target.value)}
                    className="h-9 text-[10px] font-bold rounded-lg bg-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={handleImportDNA} 
                      className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-widest rounded-xl"
                    >
                      Load Design
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={copyCurrentDNA} 
                      className="h-9 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-200"
                    >
                      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      Copy DNA
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <Label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2">
                  <Wrench className="w-3 h-3 text-indigo-500" /> Mesh Repair System
                </Label>
                <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight">
                  Ensures geometry is manifold and optimized for 3D printing.
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
                  <Label className="text-[9px] font-black uppercase text-slate-500">Support-Free Mode</Label>
                  <Switch checked={params.supportFreeMode} onCheckedChange={(v) => updateParam('supportFreeMode', v, true)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[9px] font-black uppercase text-slate-500">Wireframe Mode</Label>
                  <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <Button onClick={onExport} className="w-full brand-gradient text-white h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Download className="w-4 h-4 mr-2" />
          {params.splitSegments && params.splitSegments > 1 ? `Export Part ${(params.activePart || 0) + 1}` : 'Export STL'}
        </Button>
      </div>

      <PresetGallery 
        open={isGalleryOpen} 
        onOpenChange={setIsGalleryOpen} 
        onSelect={(newParams) => {
          addToHistory(params);
          setParams({ ...params, ...newParams });
        }}
        savedDesigns={gallery}
        onDeleteSaved={deleteFromGallery}
      />
    </div>
  );
};

export default ControlPanel;