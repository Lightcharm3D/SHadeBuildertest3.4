"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { Download, RefreshCw, Eye, Box, Settings2 } from 'lucide-react';

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
    let finalValue = value;
    if (typeof value === 'number') {
      finalValue = Math.round(value * 100) / 100;
    }
    setParams({ ...params, [key]: finalValue });
  };

  const formatValue = (val: number | undefined) => {
    if (val === undefined) return 0;
    return parseFloat(val.toFixed(2));
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Box className="w-5 h-5 text-indigo-600" />
          Design Studio
        </h2>
        <p className="text-sm text-slate-500">Customize your parametric lampshade</p>
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

        <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Preview Settings</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Wireframe Mode</span>
            </div>
            <Switch checked={showWireframe} onCheckedChange={setShowWireframe} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 mb-2">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <Label className="text-xs font-bold uppercase tracking-wider">Parameters</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Height (cm)</Label>
              <Input type="number" step={0.01} value={formatValue(params.height)} onChange={(e) => updateParam('height', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Segments</Label>
              <Input type="number" step={1} value={params.segments} onChange={(e) => updateParam('segments', parseInt(e.target.value) || 3)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Top Radius</Label>
              <Input type="number" step={0.01} value={formatValue(params.topRadius)} onChange={(e) => updateParam('topRadius', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bottom Radius</Label>
              <Input type="number" step={0.01} value={formatValue(params.bottomRadius)} onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value) || 0)} />
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

          {params.type === 'slotted' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Slot Count</Label>
                <Input type="number" value={params.slotCount} onChange={(e) => updateParam('slotCount', parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Slot Width</Label>
                <Input type="number" step={0.01} value={params.slotWidth} onChange={(e) => updateParam('slotWidth', parseFloat(e.target.value))} />
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

          {params.type === 'double_wall' && (
            <div className="space-y-2">
              <Label className="text-xs">Gap Distance</Label>
              <Input type="number" step={0.1} value={params.gapDistance} onChange={(e) => updateParam('gapDistance', parseFloat(e.target.value))} />
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