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
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Box className="w-5 h-5 text-indigo-600" />
          Parametric Studio
        </h2>
        <p className="text-sm text-slate-500">Procedural 3D Design Engine</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Design Template</Label>
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

        <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Global Generative Controls</Label>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Random Seed</span>
              <span>{params.seed.toFixed(0)}</span>
            </div>
            <Slider value={[params.seed]} min={0} max={9999} step={1} onValueChange={([v]) => updateParam('seed', v)} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Smoothness</span>
              <span>{params.segments}</span>
            </div>
            <Slider value={[params.segments]} min={12} max={128} step={1} onValueChange={([v]) => updateParam('segments', v)} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-700">Wireframe</span>
            </div>
            <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 mb-2">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <Label className="text-xs font-bold uppercase tracking-wider">Geometry Parameters</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Height (cm)</Label>
              <Input type="number" step={0.1} value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Top Radius</Label>
              <Input type="number" step={0.1} value={params.topRadius} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Bottom Radius</Label>
              <Input type="number" step={0.1} value={params.bottomRadius} onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Thickness (mm)</Label>
              <Input type="number" step={0.1} value={params.thickness} onChange={(e) => updateParam('thickness', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Dynamic Type-Specific Inputs */}
          {params.type === 'ribbed_drum' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Rib Count</Label>
                <Input type="number" value={params.ribCount} onChange={(e) => updateParam('ribCount', parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Rib Depth</Label>
                <Input type="number" step={0.1} value={params.ribDepth} onChange={(e) => updateParam('ribDepth', parseFloat(e.target.value))} />
              </div>
            </div>
          )}

          {params.type === 'spiral_twist' && (
            <div className="space-y-2">
              <Label className="text-xs">Twist Angle</Label>
              <Input type="number" value={params.twistAngle} onChange={(e) => updateParam('twistAngle', parseFloat(e.target.value))} />
            </div>
          )}

          {params.type === 'origami' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Fold Count</Label>
                <Input type="number" value={params.foldCount} onChange={(e) => updateParam('foldCount', parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Fold Depth</Label>
                <Input type="number" step={0.1} value={params.foldDepth} onChange={(e) => updateParam('foldDepth', parseFloat(e.target.value))} />
              </div>
            </div>
          )}

          {params.type === 'geometric_poly' && (
            <div className="space-y-2">
              <Label className="text-xs">Sides</Label>
              <Input type="number" min={3} max={20} value={params.sides} onChange={(e) => updateParam('sides', parseInt(e.target.value))} />
            </div>
          )}

          {params.type === 'wave_shell' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Amplitude</Label>
                <Input type="number" step={0.1} value={params.amplitude} onChange={(e) => updateParam('amplitude', parseFloat(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Frequency</Label>
                <Input type="number" step={0.1} value={params.frequency} onChange={(e) => updateParam('frequency', parseFloat(e.target.value))} />
              </div>
            </div>
          )}

          {params.type === 'perlin_noise' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Noise Scale</Label>
                <Input type="number" step={0.1} value={params.noiseScale} onChange={(e) => updateParam('noiseScale', parseFloat(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Strength</Label>
                <Input type="number" step={0.1} value={params.noiseStrength} onChange={(e) => updateParam('noiseStrength', parseFloat(e.target.value))} />
              </div>
            </div>
          )}

          {params.type === 'voronoi' && (
            <div className="space-y-2">
              <Label className="text-xs">Cell Count</Label>
              <Input type="number" value={params.cellCount} onChange={(e) => updateParam('cellCount', parseInt(e.target.value))} />
            </div>
          )}

          {params.type === 'lattice' && (
            <div className="space-y-2">
              <Label className="text-xs">Grid Density</Label>
              <Input type="number" value={params.gridDensity} onChange={(e) => updateParam('gridDensity', parseInt(e.target.value))} />
            </div>
          )}
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