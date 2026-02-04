"use client";

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { LampshadeParams, LampshadeType } from '@/utils/geometry-generator';
import { Download, RefreshCw, Eye, Box, Settings2, Hash, Sparkles, Image as ImageIcon } from 'lucide-react';

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
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateParam = (key: keyof LampshadeParams, value: any) => {
    setParams({ ...params, [key]: value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsProcessing(false);
            return;
          }
          
          // Set canvas dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Update params with image data
          updateParam('imageData', imageData);
          setIsProcessing(false);
        };
        img.src = e.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
    }
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'custom_lithophane':
        setParams({
          type: 'lithophane',
          height: 17, // 170mm
          topRadius: 6.5, // 130mm diameter / 2
          bottomRadius: 6.5, // 130mm diameter / 2
          thickness: 0.25, // 0.25mm resolution
          segments: 128,
          seed: Math.random() * 1000,
          imageData: null,
          lithoResolution: 0.25,
          maxThickness: 3.0,
          minThickness: 0.6,
          baseWidth: 5,
          overhangAngle: 45,
          ledgeDiameter: 27.6,
          ledgeHeight: 10,
          cylinderDiameter: 36,
          cylinderThickness: 2.5,
          spokeThickness: 5,
          spokeDepth: 10,
          halfWaves: 0,
          waveSize: -10
        });
        setShowImageUpload(true);
        break;
        
      case 'ribbed_drum':
        setParams({
          ...params,
          type: 'ribbed_drum',
          ribCount: 24,
          ribDepth: 0.4
        });
        setShowImageUpload(false);
        break;
        
      case 'spiral_twist':
        setParams({
          ...params,
          type: 'spiral_twist',
          twistAngle: 180
        });
        setShowImageUpload(false);
        break;
        
      case 'voronoi':
        setParams({
          ...params,
          type: 'voronoi',
          cellCount: 12
        });
        setShowImageUpload(false);
        break;
        
      case 'wave_shell':
        setParams({
          ...params,
          type: 'wave_shell',
          amplitude: 1,
          frequency: 5
        });
        setShowImageUpload(false);
        break;
        
      case 'geometric_poly':
        setParams({
          ...params,
          type: 'geometric_poly',
          sides: 6
        });
        setShowImageUpload(false);
        break;
        
      case 'lattice':
        setParams({
          ...params,
          type: 'lattice',
          gridDensity: 10
        });
        setShowImageUpload(false);
        break;
        
      case 'origami':
        setParams({
          ...params,
          type: 'origami',
          foldCount: 12,
          foldDepth: 0.8
        });
        setShowImageUpload(false);
        break;
        
      case 'perlin_noise':
        setParams({
          ...params,
          type: 'perlin_noise',
          noiseScale: 0.5,
          noiseStrength: 0.5
        });
        setShowImageUpload(false);
        break;
        
      case 'slotted':
        setParams({
          ...params,
          type: 'slotted',
          slotCount: 16,
          slotWidth: 0.1
        });
        setShowImageUpload(false);
        break;
        
      case 'double_wall':
        setParams({
          ...params,
          type: 'double_wall',
          gapDistance: 0.5
        });
        setShowImageUpload(false);
        break;
    }
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
          <Select value={params.type} onValueChange={(v) => applyPreset(v)}>
            <SelectTrigger className="bg-slate-50 border-slate-200 h-8 text-xs">
              <SelectValue placeholder="Select shape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom_lithophane" className="text-xs">Custom Lithophane</SelectItem>
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

        {showImageUpload && (
          <div className="space-y-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <Label className="text-[9px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Upload Image for Lithophane
            </Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-900 hover:file:bg-indigo-200 text-xs"
              disabled={isProcessing}
            />
            {isProcessing && (
              <div className="flex items-center text-[9px] text-indigo-700">
                <div className="inline-block animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-indigo-700 mr-1"></div>
                Processing image...
              </div>
            )}
          </div>
        )}

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
                max={128} 
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
          
          {params.type === 'lithophane' && (
            <div className="space-y-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-indigo-900">Lithophane Settings</Label>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px]">Resolution (mm)</Label>
                  <Input 
                    type="number" 
                    step={0.01} 
                    value={params.lithoResolution} 
                    onChange={(e) => updateParam('lithoResolution', parseFloat(e.target.value))} 
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px]">Max Thickness</Label>
                  <Input 
                    type="number" 
                    step={0.1} 
                    value={params.maxThickness} 
                    onChange={(e) => updateParam('maxThickness', parseFloat(e.target.value))} 
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[9px]">Min Thickness</Label>
                  <Input 
                    type="number" 
                    step={0.1} 
                    value={params.minThickness} 
                    onChange={(e) => updateParam('minThickness', parseFloat(e.target.value))} 
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px]">Half Waves</Label>
                  <Input 
                    type="number" 
                    value={params.halfWaves} 
                    onChange={(e) => updateParam('halfWaves', parseInt(e.target.value))} 
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-[9px]">Wave Size</Label>
                <Input 
                  type="number" 
                  value={params.waveSize} 
                  onChange={(e) => updateParam('waveSize', parseFloat(e.target.value))} 
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="pt-2 border-t border-indigo-200">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-indigo-900">Base & Frame</Label>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="space-y-1">
                    <Label className="text-[9px]">Base Width</Label>
                    <Input 
                      type="number" 
                      step={0.1} 
                      value={params.baseWidth} 
                      onChange={(e) => updateParam('baseWidth', parseFloat(e.target.value))} 
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Overhang Angle</Label>
                    <Input 
                      type="number" 
                      value={params.overhangAngle} 
                      onChange={(e) => updateParam('overhangAngle', parseFloat(e.target.value))} 
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <Label className="text-[9px]">Ledge Diameter</Label>
                    <Input 
                      type="number" 
                      step={0.1} 
                      value={params.ledgeDiameter} 
                      onChange={(e) => updateParam('ledgeDiameter', parseFloat(e.target.value))} 
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Ledge Height</Label>
                    <Input 
                      type="number" 
                      step={0.1} 
                      value={params.ledgeHeight} 
                      onChange={(e) => updateParam('ledgeHeight', parseFloat(e.target.value))} 
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <Label className="text-[9px]">Cylinder Dia</Label>
                    <Input 
                      type="number" 
                      step={0.1} 
                      value={params.cylinderDiameter} 
                      onChange={(e) => updateParam('cylinderDiameter', parseFloat(e.target.value))} 
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Cylinder Thick</Label>
                    <Input 
                      type="number" 
                      step={0.1} 
                      value={params.cylinderThickness} 
                      onChange={(e) => updateParam('cylinderThickness', parseFloat(e.target.value))} 
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <Label className="text-[9px]">Spoke Thickness</Label>
                    <Input 
                      type="number" 
                      step={0.1} 
                      value={params.spokeThickness} 
                      onChange={(e) => updateParam('spokeThickness', parseFloat(e.target.value))} 
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Spoke Depth</Label>
                    <Input 
                      type="number" 
                      step={0.1} 
                      value={params.spokeDepth} 
                      onChange={(e) => updateParam('spokeDepth', parseFloat(e.target.value))} 
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
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