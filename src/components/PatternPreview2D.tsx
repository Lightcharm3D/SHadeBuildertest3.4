"use client";

import React, { useEffect, useRef } from 'react';
import { LampshadeParams, getDisplacementAt } from '@/utils/geometry-generator';

interface PatternPreview2DProps {
  params: LampshadeParams;
}

const PatternPreview2D: React.FC<PatternPreview2DProps> = ({ params }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const width = 300;
  const height = 150;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      const normY = 1 - (y / height);
      const worldY = -params.height / 2 + params.height * normY;
      
      for (let x = 0; x < width; x++) {
        const angle = (x / width) * Math.PI * 2;
        const disp = getDisplacementAt(angle, worldY, params);
        
        // Normalize displacement for visualization (-1 to 1 range roughly)
        const val = Math.max(0, Math.min(255, (disp + 1) * 127));
        
        const idx = (y * width + x) * 4;
        data[idx] = val;     // R
        data[idx + 1] = val; // G
        data[idx + 2] = 255; // B (tinted blue)
        data[idx + 3] = 255; // A
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [params]);

  return (
    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
        <Grid3X3 className="w-3 h-3" /> 2D Pattern Map (UV)
      </span>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-auto image-pixelated"
        />
      </div>
      <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
        <span>0°</span>
        <span>180°</span>
        <span>360°</span>
      </div>
    </div>
  );
};

export default PatternPreview2D;