"use client";

import React from 'react';
import { Slider } from '@/components/ui/button'; // Note: Using standard inputs for better control if shadcn slider is too basic
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { Download, RefreshCw, Sparkles } from 'lucide-react';

interface ControlPanelProps {
  params: LampshadeParams;
  setParams: (params: LampshadeParams) => void;
  onExport: () => void;
  onRandomize: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ params, setParams, onExport, onRandomize }) => {
  const updateParam = (key: keyof LampshadeParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Design Studio</h2>
        <p className="text-sm text-slate-500">Customize your parametric lampshade</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Base Template</Label>
          <Select value={params.type} onValueChange={(v) => updateParam('type', v as LampshadeType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="drum">Classic Drum</SelectItem>
              <SelectItem value="dome">Modern Dome</SelectItem>
              <SelectItem value="spiral">Spiral Twist</SelectItem>
              <SelectItem value="twisted">Twisted Polygon</SelectItem>
              <SelectItem value="wave">Organic Wave</SelectItem>
              <SelectItem value="ribbed">Ribbed Shell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Height</Label>
              <span className="text-xs font-mono text-slate-400">{params.height}mm</span>
            </div>
            <input 
              type="range" min="5" max="30" step="0.5" 
              value={params.height} 
              onChange={(e) => updateParam('height', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Top Diameter</Label>
              <span className="text-xs font-mono text-slate-400">{params.topRadius * 2}mm</span>
            </div>
            <input 
              type="range" min="2" max="15" step="0.5" 
              value={params.topRadius} 
              onChange={(e) => updateParam('topRadius', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Bottom Diameter</Label>
              <span className="text-xs font-mono text-slate-400">{params.bottomRadius * 2}mm</span>
            </div>
            <input 
              type="range" min="2" max="15" step="0.5" 
              value={params.bottomRadius} 
              onChange={(e) => updateParam('bottomRadius', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Segments (Resolution)</Label>
              <span className="text-xs font-mono text-slate-400">{params.segments}</span>
            </div>
            <input 
              type="range" min="3" max="128" step="1" 
              value={params.segments} 
              onChange={(e) => updateParam('segments', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {(params.type === 'spiral' || params.type === 'twisted') && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Twist Angle</Label>
                <span className="text-xs font-mono text-slate-400">{params.twist}°</span>
              </div>
              <input 
                type="range" min="-360" max="360" step="10" 
                value={params.twist} 
                onChange={(e) => updateParam('twist', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          )}

          {(params.type === 'wave' || params.type === 'ribbed') && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Pattern Density</Label>
                <span className="text-xs font-mono text-slate-400">{params.density}</span>
              </div>
              <input 
                type="range" min="1" max="50" step="1" 
                value={params.density} 
                onChange={(e) => updateParam('density', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onRandomize} className="w-full gap-2">
            <RefreshCw className="w-4 h-4" />
            Randomize
          </Button>
          <Button variant="outline" className="w-full gap-2 bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100">
            <Sparkles className="w-4 h-4" />
            AI Suggest
          </Button>
        </div>
        <Button onClick={onExport} className="w-full gap-2 bg-slate-900 hover:bg-slate-800 text-white">
          <Download className="w-4 h-4" />
          Export STL for 3D Print
        </Button>
        <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-semibold">
          10,000+ Possible Combinations
        </p>
      </div>
    </div>
  );
};

export default ControlPanel;