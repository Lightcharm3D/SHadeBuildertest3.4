"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ControlPoint } from '@/utils/geometry-generator';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MousePointer2 } from 'lucide-react';

interface ProfileEditorProps {
  points: ControlPoint[];
  onChange: (points: ControlPoint[]) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ points, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  
  const width = 300;
  const height = 400;
  const padding = 40;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (width - 2 * padding) * (i / 10);
      const y = padding + (height - 2 * padding) * (i / 10);
      ctx.beginPath(); ctx.moveTo(x, padding); ctx.lineTo(x, height - padding); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
    }

    // Draw Bezier Curve
    if (points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      
      for (let t = 0; t <= 1; t += 0.01) {
        const xVal = getBezierPoint(t, points);
        const px = padding + (width - 2 * padding) * xVal;
        const py = height - (padding + (height - 2 * padding) * t);
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Draw Control Points
    points.forEach((p, i) => {
      const px = padding + (width - 2 * padding) * p.x;
      const py = height - (padding + (height - 2 * padding) * p.y);
      
      ctx.fillStyle = draggingIdx === i ? '#4f46e5' : '#ffffff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  };

  const getBezierPoint = (t: number, pts: ControlPoint[]): number => {
    const n = pts.length - 1;
    let x = 0;
    for (let i = 0; i <= n; i++) {
      const binom = factorial(n) / (factorial(i) * factorial(n - i));
      x += binom * Math.pow(1 - t, n - i) * Math.pow(t, i) * pts[i].x;
    }
    return x;
  };

  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };

  useEffect(() => {
    draw();
  }, [points, draggingIdx]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { mx: 0, my: 0 };
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      mx: clientX - rect.left,
      my: clientY - rect.top
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const { mx, my } = getCoords(e);

    const idx = points.findIndex(p => {
      const px = padding + (width - 2 * padding) * p.x;
      const py = height - (padding + (height - 2 * padding) * p.y);
      return Math.sqrt(Math.pow(mx - px, 2) + Math.pow(my - py, 2)) < 20;
    });

    if (idx !== -1) setDraggingIdx(idx);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIdx === null) return;
    if (e.cancelable) e.preventDefault();
    
    const { mx, my } = getCoords(e);
    
    const nx = Math.max(0, Math.min(1, (mx - padding) / (width - 2 * padding)));
    const ny = Math.max(0, Math.min(1, (height - my - padding) / (height - 2 * padding)));
    
    const newPoints = [...points];
    newPoints[draggingIdx] = { x: nx, y: ny };
    onChange(newPoints);
  };

  const handleEnd = () => setDraggingIdx(null);

  const addPoint = () => {
    const newPoints = [...points];
    const last = points[points.length - 1];
    newPoints.push({ x: last.x, y: Math.min(1, last.y + 0.2) });
    onChange(newPoints);
  };

  const removePoint = () => {
    if (points.length > 2) {
      onChange(points.slice(0, -1));
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <MousePointer2 className="w-3 h-3" /> Profile Editor
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={addPoint} className="h-7 w-7 rounded-lg bg-white border border-slate-200">
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={removePoint} className="h-7 w-7 rounded-lg bg-white border border-slate-200">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      
      <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="w-full h-auto"
        />
      </div>
      
      <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight text-center">
        Drag points to shape the silhouette. Left is center, Right is outer.
      </p>
    </div>
  );
};

export default ProfileEditor;