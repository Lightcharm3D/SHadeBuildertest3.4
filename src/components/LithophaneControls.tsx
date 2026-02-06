"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LithophaneParams, MappingMode } from '@/utils/lithophane-generator';
import { Download, Image as ImageIcon, Layers, Maximize, Square, Circle, Heart, Crop, Sliders, Box, Settings2, Shield, Cylinder, Type, Info, SunMedium, Zap, Sparkles, UploadCloud } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface LithophaneControlsProps {
  params: LithophaneParams;
  setParams: (params: LithophaneParams) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onApplyPreset: (preset: string) => void;
  onTriggerCrop: () => void;
  isProcessing: boolean;
  imagePreview?: string | null;
  imageData?: ImageData | null;
}

const LithophaneControls: React.FC<LithophaneControlsProps> = ({ 
  params, 
  setParams, 
  onImageUpload, 
  onExport, 
  onApplyPreset,
  onTriggerCrop,
  isProcessing,
  imagePreview,
  imageData
}) => {
  const updateParam = (key: keyof LithophaneParams, value: any) => {
    const roundedValue = typeof value === 'number' ? parseFloat(value.toFixed(2)) : value;
    setParams({ ...params, [key]: roundedValue });
  };

  const fixAspectRatio = () => {
    if (!imageData) return;
    const aspect = imageData.width / imageData.height;
    updateParam('height', parseFloat((params.width / aspect).toFixed(2)));
    showSuccess("Aspect ratio matched to image!");
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto scrollbar-hide">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            Lithophane Studio
          </h2>
        </div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Professional 3D Print Generator</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Quick Presets
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => onApplyPreset('portrait')} className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50">
              Portrait Frame
            </Button>
            <Button variant="outline" size="sm" onClick={() => onApplyPreset('keychain')} className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50">
              Keychain Tag
            </Button>
            <Button variant="outline" size="sm" onClick={() => onApplyPreset('nightlight')} className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50">
              Night Light
            </Button>
            <Button variant="outline" size="sm" onClick={() => onApplyPreset('cylinder')} className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50">
              Cylinder Lamp
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Source Image</Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-2xl group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all pointer-events-none flex flex-col items-center justify-center gap-1">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Click to Upload</span>
            </div>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={onImageUpload} 
              className="h-20 opacity-0 cursor-pointer relative z-10" 
            />
          </div>
          {imagePreview && (
            <div className="flex gap-2 mt-2">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <Button variant="outline" onClick={onTriggerCrop} className="flex-1 h-12 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-200">
                <Crop className="w-3.5 h-3.5 mr-2" /> Recrop Image
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">2. Select Shape</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'flat', icon: Square, label: 'Flat' },
              { id: 'curved', icon: Box, label: 'Curved' },
              { id: 'cylinder', icon: Cylinder, label: 'Cylinder' },
              { id: 'circle', icon: Circle, label: 'Circle' },
              { id: 'heart', icon: Heart, label: 'Heart' },
              { id: 'badge', icon: Shield, label: 'Badge' }
            ].map(shape => (
              <Button 
                key={shape.id}
                variant={params.type === shape.id ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => updateParam('type', shape.id)} 
                className={`h-10 text-[9px] font-black uppercase tracking-widest rounded-xl ${params.type === shape.id ? 'bg-indigo-600 text-white' : 'border-slate-100'}`}
              >
                <shape.icon className="w-3 h-3 mr-1.5" /> {shape.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Image Adjustments
          </Label>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-500"><span>Brightness</span><span>{params.brightness.toFixed(0)}</span></div>
              <Slider value={[params.brightness]} min={-100} max={100} step={1} onValueChange={([v]) => updateParam('brightness', v)} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-500"><span>Contrast</span><span>{params.contrast.toFixed(0)}</span></div>
              <Slider value={[params.contrast]} min={-100} max={100} step={1} onValueChange={([v]) => updateParam('contrast', v)} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 flex items-center gap-1"><SunMedium className="w-2.5 h-2.5" /> <span>Gamma</span><span>{params.gamma.toFixed(2)}</span></div>
              <Slider value={[params.gamma]} min={0.1} max={3.0} step={0.01} onValueChange={([v]) => updateParam('gamma', v)} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-500"><span>Smoothing</span><span>{params.smoothing.toFixed(1)}</span></div>
              <Slider value={[params.smoothing]} min={0} max={5} step={0.1} onValueChange={([v]) => updateParam('smoothing', v)} />
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100">
          <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Thickness Mapping
          </Label>
          <div className="space-y-2">
            <Select value={params.mappingMode} onValueChange={(v: MappingMode) => updateParam('mappingMode', v)}>
              <SelectTrigger className="h-9 text-[10px] font-bold bg-white rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear (Standard)</SelectItem>
                <SelectItem value="exponential">Exponential (High Contrast)</SelectItem>
                <SelectItem value="logarithmic">Logarithmic (Soft Midtones)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight">
              Nonlinear mapping accounts for light absorption for more realistic photo reproduction.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Type className="w-3 h-3" /> Personalization
          </Label>
          <div className="space-y-2">
            <Input 
              placeholder="Add name or date..." 
              value={params.text || ''} 
              onChange={(e) => updateParam('text', e.target.value)} 
              className="h-9 text-[10px] font-bold bg-white rounded-lg"
            />
            {params.text && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-500">Size</Label>
                  <Input type="number" value={params.textSize} onChange={(e) => updateParam('textSize', parseInt(e.target.value))} className="h-8 text-[10px] font-bold bg-white rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-500">Pos Y</Label>
                  <Input type="number" step={0.01} value={params.textY?.toFixed(2)} onChange={(e) => updateParam('textY', parseFloat(e.target.value))} className="h-8 text-[10px] font-bold bg-white rounded-lg" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Border & Frame
            </Label>
            <Switch checked={params.hasBorder} onCheckedChange={(v) => updateParam('hasBorder', v)} />
          </div>
          {params.hasBorder && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500">Thick (mm)</Label>
                <Input type="number" step={0.1} value={params.borderThickness} onChange={(e) => updateParam('borderThickness', parseFloat(e.target.value))} className="h-8 text-[10px] font-bold bg-white rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-500">Height (mm)</Label>
                <Input type="number" step={0.1} value={params.borderHeight} onChange={(e) => updateParam('borderHeight', parseFloat(e.target.value))} className="h-8 text-[10px] font-bold bg-white rounded-lg" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Model Settings</Label>
            {imageData && (
              <Button variant="ghost" size="sm" onClick={fixAspectRatio} className="h-6 text-[8px] font-black uppercase tracking-widest gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <Maximize className="w-2.5 h-2.5" /> Fix Aspect
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500">Width (cm)</Label>
              <Input type="number" step={0.1} value={params.width} onChange={(e) => updateParam('width', parseFloat(e.target.value))} className="h-8 text-[10px] font-bold bg-white rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500">Height (cm)</Label>
              <Input type="number" step={0.1} value={params.height} onChange={(e) => updateParam('height', parseFloat(e.target.value))} className="h-8 text-[10px] font-bold bg-white rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500">Min (mm)</Label>
              <Input type="number" step={0.1} value={params.minThickness} onChange={(e) => updateParam('minThickness', parseFloat(e.target.value))} className="h-8 text-[10px] font-bold bg-white rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500">Max (mm)</Label>
              <Input type="number" step={0.1} value={params.maxThickness} onChange={(e) => updateParam('maxThickness', parseFloat(e.target.value))} className="h-8 text-[10px] font-bold bg-white rounded-lg" />
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-500">Keychain Hole</span>
            <Switch checked={params.hasHole} onCheckedChange={(v) => updateParam('hasHole', v)} />
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
            <span className="text-[9px] font-black uppercase text-slate-500">Invert Height</span>
            <Switch checked={params.inverted} onCheckedChange={(v) => updateParam('inverted', v)} />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 space-y-4">
        <Button onClick={onExport} disabled={isProcessing || !imageData} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Download className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Export STL'}
        </Button>

        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mb-1">
            <Info className="w-3 h-3 text-indigo-500" /> License Notice
          </p>
          <p className="text-[9px] text-slate-500 leading-relaxed">
            All generated models are under a <span className="text-indigo-600 font-bold">Standard Digital File License</span>. For personal use only. Commercial resale of files or prints is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LithophaneControls;