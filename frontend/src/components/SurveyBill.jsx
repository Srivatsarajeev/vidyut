import React, { useState, useRef } from 'react';
import { useVidyut } from '../VidyutContext';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';

export default function SurveyBill() {
  const { billData, setBillData, uploadBillFile, setSurveyStep } = useVidyut();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    
    // Check file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      setError('Please upload a PDF or image file (PNG/JPG).');
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(10);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 20;
      });
    }, 200);

    try {
      const data = await uploadBillFile(file);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    } catch (err) {
      setError('Error reading bill file. Please try manual entry.');
      setIsUploading(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleManualChange = (field, value) => {
    setBillData(prev => ({
      ...prev,
      [field]: value,
      hasUploaded: true
    }));
  };

  const prevStep = () => {
    setSurveyStep('ev');
  };

  const triggerAnalysis = () => {
    setSurveyStep('processing');
  };


  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-white border border-slate-100 rounded-xl shadow-[0_20px_50px_rgba(148,163,184,0.04)] p-8 md:p-10"
      >
        {/* Stepper Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Step 4 of 4: Utility Bill Upload</span>
            <span>100% Complete</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Grid layout: Left is upload, Right is preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload area and manual inputs */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Current Electricity Bill</h2>
              <p className="text-slate-500 text-sm mt-1">Upload your latest BESCOM bill to extract exact slab history, or input manually below.</p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/10'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf, image/png, image/jpeg"
                onChange={handleFileSelect}
              />

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3">
                  <UploadCloud size={24} />
                </div>
                
                <h4 className="font-semibold text-slate-800 text-sm">Drag and drop bill here</h4>
                <p className="text-slate-400 text-xs mt-1">Supports PDF, PNG or JPG up to 10MB</p>
                <span className="mt-3 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg text-xs hover:bg-slate-50 shadow-sm">
                  Select File
                </span>
              </div>
            </div>

            {/* Extraction Loader */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-blue-50/30 border border-blue-100 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 text-blue-600">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>Vidyut AI is reading bill OCR...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Manual Form Area */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Or Enter Manually</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Consumption (Units / kWh)</label>
                  <input
                    type="number"
                    min={0}
                    value={billData.units || ''}
                    onChange={(e) => handleManualChange('units', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bill Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={billData.billAmount || ''}
                    onChange={(e) => handleManualChange('billAmount', parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 1200"
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Billing Period</label>
                  <input
                    type="text"
                    value={billData.billingPeriod}
                    onChange={(e) => handleManualChange('billingPeriod', e.target.value)}
                    placeholder="e.g. June 2026"
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tariff Plan</label>
                  <input
                    type="text"
                    value={billData.tariff}
                    onChange={(e) => handleManualChange('tariff', e.target.value)}
                    placeholder="e.g. LT-2a (Domestic)"
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Invoice Preview Card */}
          <div className="lg:col-span-5 flex flex-col h-full lg:sticky lg:top-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Invoice Preview Card</label>
            <div className="bg-slate-900 text-white rounded-xl shadow-xl overflow-hidden border border-slate-800 flex flex-col font-mono relative">
              
              {/* Receipt Header */}
              <div className="p-6 bg-slate-800/50 border-b border-dashed border-slate-700/60 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase text-blue-400 font-bold tracking-wider leading-none">Utility Provider</span>
                  <h4 className="text-sm font-bold mt-1 text-slate-100">BESCOM DOMESTIC</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-bold leading-none">Bill Type</span>
                  <div className="text-xs font-bold text-slate-100 mt-1">LT-2a Domestic</div>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Billing Period:</span>
                  <span className="text-slate-100">{billData.billingPeriod || "---"}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Tariff Class:</span>
                  <span className="text-slate-100">{billData.tariff || "---"}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Meter Status:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE</span>
                </div>

                <div className="border-t border-dashed border-slate-700/60 my-4" />

                {/* Primary numbers */}
                <div className="grid grid-cols-2 gap-4 text-center bg-slate-800/20 p-4 rounded-lg border border-slate-800/40">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Units Consumed</span>
                    <span className="text-lg font-bold text-slate-100 block mt-1">{billData.units || 0} kWh</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Charges</span>
                    <span className="text-lg font-bold text-slate-100 block mt-1">₹{billData.billAmount || 0}</span>
                  </div>
                </div>

                {/* Simulated barcode */}
                <div className="pt-2 flex flex-col items-center">
                  <div className="h-6 w-full max-w-[200px] bg-slate-800 bg-[linear-gradient(90deg,#fff_2px,transparent_2px,#fff_8px,transparent_8px,#fff_12px,transparent_12px)] [background-size:20px_100%] opacity-40" />
                  <span className="text-[8px] text-slate-500 mt-1 tracking-widest">VIDYUT-BILL-OCR-SIMULATOR</span>
                </div>
              </div>

              {/* Overlay in case not entered */}
              {!billData.hasUploaded && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-10">
                  <FileText className="text-slate-600 mb-2" size={32} />
                  <span className="text-xs font-semibold text-slate-400">Upload a bill file or fill form to generate invoice receipt preview</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="flex justify-between items-center mt-10 border-t border-slate-100 pt-6">
          <button
            onClick={prevStep}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium rounded-lg text-sm transition-colors border border-slate-100"
          >
            Previous
          </button>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={triggerAnalysis}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg text-sm shadow-lg shadow-blue-500/15 flex items-center gap-2 transition-all"
          >
            <span>Generate AI Analysis</span>
            <Sparkles size={16} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
