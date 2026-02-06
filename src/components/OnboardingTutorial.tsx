"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X, Sparkles, Sliders, Eye, Download, MousePointer2 } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const STEPS: Step[] = [
  {
    title: "Step 1 – Choose Mode",
    description: "Select Lampshade Builder or Lithophane Studio to start your project.",
    icon: <MousePointer2 className="w-8 h-8" />,
    color: "bg-indigo-600"
  },
  {
    title: "Step 2 – Customize",
    description: "Use sliders and presets to shape your design and adjust dimensions.",
    icon: <Sliders className="w-8 h-8" />,
    color: "bg-violet-600"
  },
  {
    title: "Step 3 – Preview",
    description: "Enable light simulation and printability check to verify your model.",
    icon: <Eye className="w-8 h-8" />,
    color: "bg-fuchsia-600"
  },
  {
    title: "Step 4 – Export",
    description: "Tap Export STL to download or share your 3D printable file.",
    icon: <Download className="w-8 h-8" />,
    color: "bg-emerald-600"
  }
];

const OnboardingTutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('has_seen_tutorial_v1');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => setIsVisible(true), 3500); // Show after splash
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('has_seen_tutorial_v1', 'true');
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden relative"
          >
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"
            >
              <X className="w-5 h-5" />
            </Button>

            <div className="p-8 pt-12 flex flex-col items-center text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className={`w-20 h-20 ${STEPS[currentStep].color} rounded-3xl flex items-center justify-center text-white shadow-xl mx-auto mb-8`}>
                    {STEPS[currentStep].icon}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {STEPS[currentStep].title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed px-4">
                      {STEPS[currentStep].description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-1.5 mt-10 mb-8">
                {STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-indigo-600' : 'w-1.5 bg-slate-200'}`} 
                  />
                ))}
              </div>

              <div className="flex gap-3 w-full">
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] border-slate-200"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                )}
                <Button 
                  onClick={nextStep}
                  className="flex-[2] h-12 brand-gradient text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg"
                >
                  {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next Step'}
                  {currentStep !== STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTutorial;