"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { Download, RefreshCw, Eye, Box, Settings2, Hash, Sparkles } from 'lucide-react';

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
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Box className="w-4 h-4 text-indigo-600" />
          Parametric Studio
        </h2>
        <p className="text-xs text-slate-500">Procedural 3D Design</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Design Template</Label>
          <Select value={params.type} onValueChange={(v) => updateParam('type', v as LampshadeType)}>
            <SelectTrigger className="bg-slate-50 border-slate-200 h-8 text-xs">
              <SelectValue placeholder="Select shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ribbed_drum" className="text-xs">Ribbed Drum</SelectItem>
              <SelectItem value="spiral_twist" className="text-xs">Spiral Twist</SelectItem>
              <SelectItem value="voronoi" className="text-xs">Voronoi Organic</SelectItem>
              <SelectItem value="wave_shell" className="text-xs">Wave Shell</SelectItem>
              <SelectItem value="geometric_poly" className="text-xs">Geometric Polygon</SelectItem>
              <SelectItem value="lattice" className="text-xs">Parametric Lattice</SelectItem>
              <SelectItem value="origami" className="text-xs">Origami Fold</SelectItem>
              <SelectItem value="perlin_noise" className="text-xs">Perlin Noise</SelectItem>
              <SelectItem value="slotted" className="text-xs">Parametric Slotted</SelectItem>
              <SelectItem value="double_wall" className="text-xs">Double-Wall Diffuser</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
          <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Global Controls</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-medium">
                <span className="flex items-center gap-1"><Hash className="w-2 h-2" /> Random Seed</span>
                <span>{params.seed.toFixed(0)}</span>
              </div>
              <Slider 
                value={[params.seed]} 
                min={0} 
                max={9999} 
                step={1} 
                onValueChange={([v]) => updateParam('seed', v)} 
                className="py-1"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-medium">
                <span className="flex items-center gap-1"><Sparkles className="w-2 h-2" /> Smoothness</span>
                <span>{params.segments}</span>
              </div>
              <Slider 
                value={[params.segments]} 
                min={12} 
                max={64} 
                step={1} 
                onValueChange={([v]) => updateParam('segments', v)} 
                className="py-1"
              />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">Wireframe</span>
              </div>
              <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-1 text-slate-900 mb-1">
            <Settings2 className="w-3 h-3 text-indigo-600" />
            <Label className="text-[9px] font-bold uppercase tracking-wider">Geometry Parameters</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Height (cm)</Label>
              <Input 
                type="number" 
                step={0.1} 
                value={params.height} 
                onChange={(e) => updateParam('height', parseFloat(e.target.value) || 0)} 
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Top Radius</Label>
              <Input 
                type="number" 
                step={0.1} 
                value={params.topRadius} 
                onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) || 0)} 
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px]">Bottom Radius</Label>
              <Input 
                type="number" 
                step={0.1} 
                value={params.bottomRadius} 
                onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value) || 0)} 
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px]">Thickness (mm)</Label>
              <Input 
                type="number" 
                step={0.1} 
                value={params.thickness} 
                onChange={(e) => updateParam('thickness', parseFloat(e.target.value) || 0)} 
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Dynamic Type-Specific Inputs */}
          {params.type === 'ribbed_drum' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px]">Rib Count</Label>
                <Input 
                  type="number" 
                  value={params.ribCount} 
                  onChange={(e) => updateParam('ribCount', parseInt(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px]">Rib Depth</Label>
                <Input 
                  type="number" 
                  step={0.1} 
                  value={params.ribDepth} 
                  onChange={(e) => updateParam('ribDepth', parseFloat(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
          
          {params.type === 'spiral_twist' && (
            <div className="space-y-1">
              <Label className="text-[9px]">Twist Angle</Label>
              <Input 
                type="number" 
                value={params.twistAngle} 
                onChange={(e) => updateParam('twistAngle', parseFloat(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
          )}
          
          {params.type === 'origami' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px]">Fold Count</Label>
                <Input 
                  type="number" 
                  value={params.foldCount} 
                  onChange={(e) => updateParam('foldCount', parseInt(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px]">Fold Depth</Label>
                <Input 
                  type="number" 
                  step={0.1} 
                  value={params.foldDepth} 
                  onChange={(e) => updateParam('foldDepth', parseFloat(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
          
          {params.type === 'geometric_poly' && (
            <div className="space-y-1">
              <Label className="text-[9px]">Sides</Label>
              <Input 
                type="number" 
                min={3} 
                max={20} 
                value={params.sides} 
                onChange={(e) => updateParam('sides', parseInt(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
          )}
          
          {params.type === 'wave_shell' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px]">Amplitude</Label>
                <Input 
                  type="number" 
                  step={0.1} 
                  value={params.amplitude} 
                  onChange={(e) => updateParam('amplitude', parseFloat(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px]">Frequency</Label>
                <Input 
                  type="number" 
                  step={0.1} 
                  value={params.frequency} 
                  onChange={(e) => updateParam('frequency', parseFloat(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
          
          {params.type === 'perlin_noise' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px]">Noise Scale</Label>
                <Input 
                  type="number" 
                  step={0.1} 
                  value={params.noiseScale} 
                  onChange={(e) => updateParam('noiseScale', parseFloat(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px]">Strength</Label>
                <Input 
                  type="number" 
                  step={0.1} 
                  value={params.noiseStrength} 
                  onChange={(e) => updateParam('noiseStrength', parseFloat(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
          
          {params.type === 'voronoi' && (
            <div className="space-y-1">
              <Label className="text-[9px]">Cell Count</Label>
              <Input 
                type="number" 
                value={params.cellCount} 
                onChange={(e) => updateParam('cellCount', parseInt(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
          )}
          
          {params.type === 'lattice' && (
            <div className="space-y-1">
              <Label className="text-[9px]">Grid Density</Label>
              <Input 
                type="number" 
                value={params.gridDensity} 
                onChange={(e) => updateParam('gridDensity', parseInt(e.target.value))} 
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-2 space-y-2">
        <Button 
          variant="outline" 
          onClick={onRandomize} 
          className="w-full gap-1 border-slate-200 hover:bg-slate-50 h-9 text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          Randomize Design
        </Button>
        <Button 
          onClick={onExport} 
          className="w-full gap-1 bg-slate-900 hover:bg-slate-800 text-white shadow shadow-slate-200 h-9 text-xs"
        >
          <Download className="w-3 h-3" />
          Export STL
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;