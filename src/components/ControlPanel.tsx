"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { Download, RefreshCw, Eye, Box, Settings2, Sparkles, Zap, Waves, Sun } from 'lucide-react';

interface ControlPanelProps {
  params: LampshadeParams;
  setParams: (params: LampshadeParams) => void;
  showWireframe: boolean;
  setShowWireframe: (show: boolean) => void;
  onExport: () => void;
  onRandomize: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  params, 
  setParams, 
  showWireframe, 
  setShowWireframe, 
  onExport, 
  onRandomize 
}) => {
  const updateParam = (key: keyof LampshadeParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Box className="w-5 h-5 text-indigo-600" />
          Design Studio
        </h2>
        <p className="text-sm text-slate-500">Parametric Generative Engine</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Template</Label>
          <Select value={params.type} onValueChange={(v) => updateParam('type', v as LampshadeType)}>
            <SelectTrigger className="bg-slate-50 border-slate-200">
              <SelectValue placeholder="Select shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ribbed_drum">Ribbed Drum</SelectItem>
              <SelectItem value="spiral_twist">Spiral Twist</SelectItem>
              <SelectItem value="voronoi">Voronoi Organic</SelectItem>
              <SelectItem value="wave_shell">Wave Shell</SelectItem>
              <SelectItem value="geometric_poly">Geometric Polygon</SelectItem>
              <SelectItem value="lattice">Parametric Lattice</SelectItem>
              <SelectItem value="origami">Origami Fold</SelectItem>
              <SelectItem value="perlin_noise">Perlin Noise</SelectItem>
              <SelectItem value="slotted">Parametric Slotted</SelectItem>
              <SelectItem value="double_wall">Double-Wall Diffuser</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2 text-slate-900 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <Label className="text-xs font-bold uppercase tracking-wider">Generative Controls</Label>
          </div>

          {/* Random Seed */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs flex items-center gap-2">
                <Zap className="w-3 h-3 text-amber-500" /> Random Seed
              </Label>
              <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded">{params.seed.toFixed(0)}</span>
            </div>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={params.seed} 
                onChange={(e) => updateParam('seed', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
              <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => updateParam('seed', Math.random() * 10000)}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Pattern Density */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs flex items-center gap-2">
                <Waves className="w-3 h-3 text-blue-500" /> Pattern Density
              </Label>
              <span className="text-[10px] font-mono">{params.density}%</span>
            </div>
            <Slider 
              value={[params.density]} 
              min={1} 
              max={100} 
              step={1} 
              onValueChange={([v]) => updateParam('density', v)} 
            />
          </div>

          {/* Light Diffusion */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs flex items-center gap-2">
                <Sun className="w-3 h-3 text-orange-500" /> Light Diffusion
              </Label>
              <span className="text-[10px] font-mono">{params.diffusion}%</span>
            </div>
            <Slider 
              value={[params.diffusion]} 
              min={1} 
              max={100} 
              step={1} 
              onValueChange={([v]) => updateParam('diffusion', v)} 
            />
          </div>

          {/* Smoothness */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs flex items-center gap-2">
                <Settings2 className="w-3 h-3 text-emerald-500" /> Smoothness
              </Label>
              <span className="text-[10px] font-mono">{params.smoothness}%</span>
            </div>
            <Slider 
              value={[params.smoothness]} 
              min={1} 
              max={100} 
              step={1} 
              onValueChange={([v]) => updateParam('smoothness', v)} 
            />
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Dimensions</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px]">Height (cm)</Label>
              <Input type="number" step={0.1} value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Top Radius</Label>
              <Input type="number" step={0.1} value={params.topRadius} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Bottom Radius</Label>
            <Input type="number" step={0.1} value={params.bottomRadius} onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-700">Wireframe Preview</span>
            </div>
            <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-3">
        <Button variant="outline" onClick={onRandomize} className="w-full gap-2 border-slate-200 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" />
          Randomize Design
        </Button>
        <Button onClick={onExport} className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
          <Download className="w-4 h-4" />
          Export STL for 3D Print
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;