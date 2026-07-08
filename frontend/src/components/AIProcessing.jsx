import React, { useState, useEffect } from 'react';
import { useVidyut } from '../VidyutContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle2 } from 'lucide-react';

export default function AIProcessing() {
  const { runAIAnalysis } = useVidyut();
  const [currentStep, setCurrentStep] = useState(0);

  const stages = [
    "Reading Survey Data...",
    "Analyzing Appliance Consumption Shares...",
    "Predicting Electricity Usage Slabs...",
    "Generating AI Savings Recommendations...",
    "Forecasting Next Month Bill Details...",
    "Saving Energy Report to AWS S3..."
  ];

  useEffect(() => {
    // Increment stages periodically
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < stages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 850);

    // Call the actual AI analysis endpoint
    const runAnalysis = async () => {
      await runAIAnalysis();
    };

    runAnalysis();

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-white flex flex-col items-center justify-center z-50 overflow-hidden px-6">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-75 z-0" />
      
      {/* Center container */}
      <div className="max-w-md w-full flex flex-col items-center z-10 text-center">
        
        {/* ChatGPT voice/thinking animation style */}
        <div className="relative w-44 h-44 flex items-center justify-center mb-10">
          
          {/* Animated concentric rings */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="absolute w-full h-full bg-blue-100/50 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute w-[80%] h-[80%] bg-blue-200/40 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute w-[60%] h-[60%] bg-blue-500/10 rounded-full"
          />
          
          {/* Inner core */}
          <div className="absolute w-[40%] h-[40%] bg-gradient-to-tr from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
            <Brain size={30} className="animate-pulse" />
          </div>
        </div>

        {/* Text descriptions */}
        <h2 className="text-xl font-bold text-slate-800 font-display">Vidyut AI Engine</h2>
        <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">Running Energy Diagnostics</p>

        {/* Stages Checklist */}
        <div className="w-full mt-10 space-y-3.5 text-left border border-slate-100 rounded-2xl p-6 bg-slate-50/40 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStep;
            const isPending = idx > currentStep;
            const isActive = idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isPending ? 'opacity-30' : 'opacity-100'
                }`}
              >
                {/* Stage Indicator */}
                <div className="shrink-0 flex items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : isActive ? (
                    <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>

                {/* Stage Title */}
                <span className={`text-xs font-medium ${
                  isActive ? 'text-slate-800 font-semibold' : 'text-slate-500'
                }`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
