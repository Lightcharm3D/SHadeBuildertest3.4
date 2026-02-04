"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { LithophaneParams } from '@/utils/lithophane-generator';
import { Download, Image as ImageIcon, Sun, Contrast, Zap, Sparkles, Circle, Heart, Square, Move } from 'lucide-react';

interface LithophaneControlsProps {
  params: LithophaneParams;
  setParams: (params: LithophaneParams) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onApplyPreset: (preset: string) => void;
  isProcessing: boolean;
}

const LithophaneControls: React.FC<LithophaneControlsProps> = ({
  params,
  setParams,
  onImageUpload,
  onExport,
  onApplyPreset,
  isProcessing
}) => {
  const updateParam = (key: keyof LithophaneParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600" />
          Lithophane Studio
        </h2>
        <p className="text-sm text-slate-500">Custom Shape & Keychain Generator</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Source Image</Label>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={onImageUpload}
            className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Select Shape</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant={params.type === 'flat' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => updateParam('type', 'flat')}
              className="h-10 w-full"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button 
              variant={params.type === 'circle' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => updateParam('type', 'circle')}
              className="h-10 w-full"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button 
              variant={params.type === 'heart' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => updateParam('type', 'heart')}
              className="h-10 w-full"
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-indigo-900">Keyring Hole</span>
              <span className="text-[10px] text-indigo-600">Adjustable attachment point</span>
            </div>
            <Switch checked={params.hasHole} onCheckedChange={(v) => updateParam('hasHole', v)} />
          </div>

          {params.hasHole && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-medium text-indigo-900">
                  <span className="flex items-center gap-1"><Move className="w-3 h-3" /> Horizontal Position</span>
                  <span>{params.holeX}%</span>
                </div>
                <Slider value={[params.holeX]} min={5} max={95} step={1} onValueChange={([v]) => updateParam('holeX', v)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-medium text-indigo-900">
                  <span className="flex items-center gap-1"><Move className="w-3 h-3" /> Vertical Position</span>
                  <span>{params.holeY}%</span>
                </div>
                <Slider value={[params.holeY]} min={5} max={95} step={1} onValueChange={([v]) => updateParam('holeY', v)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-medium text-indigo-900">
                  <span>Hole Diameter (mm)</span>
                  <span>{params.holeSize}mm</span>
                </div>
                <Slider value={[params.holeSize]} min={2} max={10} step={0.5} onValueChange={([v]) => updateParam('holeSize', v)} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Zap className="w-3 h-3" /> Image Adjustments
          </Label>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-medium">
                <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Brightness</span>
                <span>{params.brightness}</span>
              </div>
              <Slider value={[params.brightness]} min={-100} max={100} step={1} onValueChange={([v]) => updateParam('brightness', v)} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-medium">
                <span className="flex items-center gap-1"><Contrast className="w-3 h-3" /> Contrast</span>
                <span>{params.contrast}</span>
              </div>
              <Slider value={[params.contrast]} min={-100} max={100} step={1} onValueChange={([v]) => updateParam('contrast', v)} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-medium">
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Smoothing</span>
                <span>{params.smoothing}</span>
              </div>
              <Slider value={[params.smoothing]} min={0} max={5} step={0.5} onValueChange={([v]) => updateParam('smoothing', v)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">3. Model Settings</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px]">Width (cm)</Label>
              <Input type="number" value={params.width} onChange={(e) => updateParam('width', parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Height (cm)</Label>
              <Input type="number" value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px]">Base Thick (mm)</Label>
              <Input type="number" step={0.1} value={params.baseThickness} onChange={(e) => updateParam('baseThickness', parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Max Relief (mm)</Label>
              <Input type="number" step={0.1} value={params.maxThickness} onChange={(e) => updateParam('maxThickness', parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-medium text-slate-700">Invert Height</span>
            <Switch checked={params.inverted} onCheckedChange={(v) => updateParam('inverted', v)} />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button 
          onClick={onExport} 
          disabled={isProcessing}
          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
        >
          <Download className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Export STL for 3D Print'}
        </Button>
      </div>
    </div>
  );
};

export default LithophaneControls;