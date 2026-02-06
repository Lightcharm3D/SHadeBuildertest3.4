"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LampshadeParams, MaterialParams } from '@/utils/geometry-generator';
import { Sparkles, FolderHeart, Trash2, Layout, Box, Layers, Zap, Waves, Grid3X3, Scissors, Hexagon, Gem } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  params: Partial<LampshadeParams>;
  color: string;
}

const PRO_PRESETS: Preset[] = [
  {
    id: 'modern-slotted',
    name: 'Modern Slotted',
    description: 'Clean vertical lines for a contemporary architectural look.',
    icon: <Layers className="w-6 h-6" />,
    color: 'bg-blue-500',
    params: { type: 'slotted', silhouette: 'straight', slotCount: 24, slotWidth: 0.1, height: 18, topRadius: 6, bottomRadius: 6 }
  },
  {
    id: 'organic-cell',
    name: 'Organic Cell',
    description: 'Natural, bone-like structures inspired by cellular biology.',
    icon: <Zap className="w-6 h-6" />,
    color: 'bg-emerald-500',
    params: { type: 'organic_cell', silhouette: 'convex', noiseStrength: 1.2, noiseScale: 2.0, height: 15, topRadius: 5, bottomRadius: 8 }
  },
  {
    id: 'honeycomb',
    name: 'Honeycomb',
    description: 'Classic hexagonal lattice for beautiful light diffusion.',
    icon: <Hexagon className="w-6 h-6" />,
    color: 'bg-amber-500',
    params: { type: 'honeycomb', silhouette: 'straight', gridDensity: 15, thickness: 0.15, height: 16, topRadius: 7, bottomRadius: 7, rimThickness: 0.2 }
  },
  {
    id: 'spiral-vortex',
    name: 'Spiral Vortex',
    description: 'Dynamic twisting ribs that create dramatic shadows.',
    icon: <Waves className="w-6 h-6" />,
    color: 'bg-indigo-500',
    params: { type: 'spiral_vortex', silhouette: 'hourglass', twistAngle: 720, ribCount: 12, height: 20, topRadius: 8, bottomRadius: 8 }
  },
  {
    id: 'origami',
    name: 'Origami Fold',
    description: 'Sharp geometric folds mimicking traditional paper art.',
    icon: <Scissors className="w-6 h-6" />,
    color: 'bg-rose-500',
    params: { type: 'origami', silhouette: 'straight', foldCount: 16, foldDepth: 1.2, height: 15, topRadius: 6, bottomRadius: 6 }
  },
  {
    id: 'faceted-gem',
    name: 'Faceted Gem',
    description: 'Angular, crystalline surfaces that catch the light.',
    icon: <Gem className="w-6 h-6" />,
    color: 'bg-violet-500',
    params: { type: 'faceted_gem', silhouette: 'diamond', noiseStrength: 0.8, height: 14, topRadius: 4, bottomRadius: 4 }
  }
];

interface PresetGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (params: Partial<LampshadeParams>) => void;
  savedDesigns: { id: string, name: string, params: LampshadeParams }[];
  onDeleteSaved: (id: string) => void;
}

const PresetGallery: React.FC<PresetGalleryProps> = ({ open, onOpenChange, onSelect, savedDesigns, onDeleteSaved }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 bg-white overflow-hidden rounded-[2.5rem]">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Design Gallery
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Choose a professional template or load your saved designs.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-8 pb-8">
          <div className="space-y-8">
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Pro Templates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelect(preset.params);
                      onOpenChange(false);
                    }}
                    className="group relative flex flex-col text-left p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className={`w-12 h-12 ${preset.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                      {preset.icon}
                    </div>
                    <h4 className="font-black text-slate-900 mb-1">{preset.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{preset.description}</p>
                  </button>
                ))}
              </div>
            </section>

            {savedDesigns.length > 0 && (
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <FolderHeart className="w-3 h-3" /> My Saved Designs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedDesigns.map((design) => (
                    <div
                      key={design.id}
                      className="group relative flex items-center justify-between p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all duration-300"
                    >
                      <button
                        onClick={() => {
                          onSelect(design.params);
                          onOpenChange(false);
                        }}
                        className="flex-1 text-left"
                      >
                        <h4 className="font-black text-slate-900 mb-1">{design.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {design.params.type.replace('_', ' ')}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSaved(design.id);
                        }}
                        className="h-10 w-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PresetGallery;