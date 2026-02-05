"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LithophaneViewport from '@/components/LithophaneViewport';
import LithophaneControls from '@/components/LithophaneControls';
import ImageCropper from '@/components/ImageCropper';
import { LithophaneParams, generateLithophaneGeometry } from '@/utils/lithophane-generator';
import { STLExporter } from 'three-stdlib';
import * as THREE from 'three';
import { showSuccess, showError } from '@/utils/toast';
import { ArrowLeft, Image as ImageIcon, Share2, Link as LinkIcon, Settings2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/mobile-hooks';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { saveStlFile } from '@/utils/file-saver';

const LithophaneGenerator = () => {
  const [params, setParams] = useState<LithophaneParams>({
    type: 'flat',
    width: 10,
    height: 10,
    minThickness: 0.4,
    maxThickness: 2.8,
    baseThickness: 0.8,
    curveRadius: 15,
    resolution: 200,
    inverted: false,
    brightness: 0,
    contrast: 20,
    smoothing: 1.0,
    hasHole: false,
    holeSize: 3,
    hasBorder: false,
    borderThickness: 2,
    borderHeight: 2,
  });
  
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [history, setHistory] = useState<{id: string, preview: string, params: LithophaneParams}[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const saved = localStorage.getItem('litho_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImage(e.target?.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const processCroppedImage = useCallback(async (croppedImageUrl: string) => {
    setIsCropping(false);
    setImagePreview(croppedImageUrl);
    setIsProcessing(true);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height);
        setImageData(data);
        
        const aspect = img.width / img.height;
        setParams(prev => ({ ...prev, height: parseFloat((prev.width / aspect).toFixed(2)) }));
        
        const newEntry = {
          id: Date.now().toString(),
          preview: croppedImageUrl,
          params: { ...params }
        };
        const updated = [newEntry, ...history].slice(0, 5);
        setHistory(updated);
        localStorage.setItem('litho_history', JSON.stringify(updated));
        
        setIsProcessing(false);
        showSuccess("Image processed!");
      };
      img.src = croppedImageUrl;
    } catch (err) {
      console.error(err);
      showError("Failed to process image");
      setIsProcessing(false);
    }
  }, [params, history]);

  const copyPublicLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    showSuccess("Public Link copied!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My 3D Lithophane Design',
          text: 'Check out this 3D printable lithophane I created!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      showError("Sharing not supported on this browser");
    }
  };

  const handleApplyPreset = useCallback((preset: string) => {
    switch (preset) {
      case 'portrait':
        setParams({ ...params, width: 8, height: 10, resolution: 250, contrast: 30, smoothing: 1.0 });
        break;
      case 'keychain':
        setParams({ ...params, width: 4, height: 4, resolution: 150, baseThickness: 1.2, maxThickness: 2.0, smoothing: 0.5, hasHole: true });
        break;
    }
    showSuccess(`Applied ${preset} preset`);
  }, [params]);

  useEffect(() => {
    if (imageData) {
      try {
        const geom = generateLithophaneGeometry(imageData, params);
        setGeometry(geom);
      } catch (err) {
        console.error(err);
      }
    }
  }, [imageData, params]);

  const handleExport = useCallback(async () => {
    if (!geometry) {
      showError("Upload an image first");
      return;
    }
    setIsProcessing(true);
    try {
      const exporter = new STLExporter();
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      const result = exporter.parse(mesh);
      const fileName = `lithophane-${Date.now()}.stl`;
      
      await saveStlFile(result as string, fileName);
      showSuccess("STL exported!");
    } catch (err) {
      showError("Export failed");
    } finally {
      setIsProcessing(false);
    }
  }, [geometry]);

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-2xl px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-[10px] lg:text-sm font-black tracking-tighter text-slate-900 leading-none">
              LITHOSTUDIO <span className="text-slate-400">X</span> SHADEBUILDER
            </h1>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-600 uppercase tracking-wider">BETA</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button 
              variant={isSidebarOpen ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="gap-2 h-8 px-3 rounded-lg font-black text-[8px] uppercase tracking-widest"
            >
              <Settings2 className="w-3 h-3" />
              {isSidebarOpen ? "Hide Settings" : "Show Settings"}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={copyPublicLink}
            className="gap-2 h-8 px-3 rounded-lg font-black text-[8px] uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
          >
            <LinkIcon className="w-3 h-3" />
            <span className="hidden sm:inline">Copy Link</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-lg h-8 w-8 text-slate-400 hover:text-indigo-600">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative">
        <div className="flex-1 relative bg-slate-950 overflow-hidden">
          <LithophaneViewport geometry={geometry} />
          
          {!imageData && !imagePreview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 text-center max-w-xs shadow-2xl">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-white font-black text-lg mb-2">Lithophane Studio</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Upload a photo to generate your 3D printable model.
                </p>
              </div>
            </div>
          )}

          {isMobile && (
            <div className="absolute bottom-4 right-4 z-30">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button className="w-14 h-14 rounded-full brand-gradient shadow-2xl flex items-center justify-center text-white p-0 border-2 border-white/20">
                    <img src="settings-icon.png" alt="Settings" className="w-8 h-8 object-contain" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[80vh] bg-white rounded-t-[2rem]">
                  <div className="p-4 h-full overflow-hidden">
                    <LithophaneControls 
                      params={params} 
                      setParams={setParams} 
                      onImageUpload={handleImageUpload} 
                      onExport={handleExport} 
                      onApplyPreset={handleApplyPreset} 
                      onTriggerCrop={() => setIsCropping(true)}
                      isProcessing={isProcessing} 
                      imagePreview={imagePreview}
                      imageData={imageData}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          )}
        </div>
        
        <AnimatePresence initial={false}>
          {isSidebarOpen && !isMobile && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:block shrink-0 border-l border-slate-200 bg-white h-full overflow-hidden"
            >
              <div className="w-[400px]">
                <LithophaneControls 
                  params={params} 
                  setParams={setParams} 
                  onImageUpload={handleImageUpload} 
                  onExport={handleExport} 
                  onApplyPreset={handleApplyPreset} 
                  onTriggerCrop={() => setIsCropping(true)}
                  isProcessing={isProcessing} 
                  imagePreview={imagePreview}
                  imageData={imageData}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSidebarOpen && !isMobile && (
          <Button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-20 rounded-l-2xl rounded-r-none brand-gradient shadow-2xl flex items-center justify-center text-white p-0 border-y-2 border-l-2 border-white/20 z-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
      </main>

      {rawImage && (
        <ImageCropper
          image={rawImage}
          aspect={params.width / params.height}
          open={isCropping}
          onCropComplete={processCroppedImage}
          onCancel={() => setIsCropping(false)}
        />
      )}
    </div>
  );
};

export default LithophaneGenerator;