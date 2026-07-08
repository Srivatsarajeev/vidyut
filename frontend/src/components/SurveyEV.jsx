import React from 'react';
import { useVidyut } from '../VidyutContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, ShieldAlert, Sparkles } from 'lucide-react';

export default function SurveyEV() {
  const { evData, setEvData, setSurveyStep } = useVidyut();

  const handleEvTypeSelect = (type) => {
    setEvData(prev => ({
      ...prev,
      evType: type,
      hasEv: type !== 'None'
    }));
  };

  const handleInputChange = (field, value) => {
    setEvData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setSurveyStep('bill');
  };

  const prevStep = () => {
    setSurveyStep('appliances');
  };

  const evOptions = [
    { type: 'None', label: 'No EV', icon: '❌', desc: 'No home EV charging' },
    { type: 'Electric Scooter', label: 'E-Scooter', icon: '🛵', desc: 'Electric scooter' },
    { type: 'Electric Bike', label: 'Electric Bike', icon: '🏍️', desc: 'Electric motorcycle' },
    { type: 'Electric Car', label: 'Electric Car', icon: '🚗', desc: 'EV or PHEV car' }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white border border-slate-100 rounded-xl shadow-[0_20px_50px_rgba(148,163,184,0.04)] p-8 md:p-10"
      >
        {/* Stepper Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Step 3 of 4: Electric Vehicle</span>
            <span>75% Complete</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Header Text */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Electric Vehicle Setup</h2>
          <p className="text-slate-500 text-sm mt-1">Specify EV charging habits to calculate impact on grid slabs and peak demand pricing.</p>
        </div>

        {/* EV Ownership options */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Do you own an EV?</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {evOptions.map((opt) => (
                <motion.button
                  key={opt.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleEvTypeSelect(opt.type)}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border text-center transition-all ${
                    evData.evType === opt.type
                      ? 'border-blue-600 bg-blue-50/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-3xl mb-2">{opt.icon}</span>
                  <span className="font-semibold text-slate-800 text-xs tracking-tight">{opt.label}</span>
                  <span className="text-slate-400 text-[10px] mt-0.5 leading-tight">{opt.desc}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Conditional Input Section */}
          <AnimatePresence>
            {evData.hasEv && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border border-slate-100 rounded-xl p-6 bg-slate-50/50 space-y-4"
              >
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  <Sparkles size={14} />
                  <span>EV Charge details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">EV Brand / Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Ather 450X, Tata Nexon EV"
                      value={evData.evBrand}
                      onChange={(e) => handleInputChange('evBrand', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Battery Capacity (kWh)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={0.5}
                      value={evData.evBatteryCapacity}
                      onChange={(e) => handleInputChange('evBatteryCapacity', parseFloat(e.target.value) || '')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Charging Duration per Session (Hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={evData.evChargingHours}
                      onChange={(e) => handleInputChange('evChargingHours', parseFloat(e.target.value) || '')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Charging Days per Week</label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={evData.evChargingDays}
                      onChange={(e) => handleInputChange('evChargingDays', parseInt(e.target.value) || '')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            onClick={nextStep}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all"
          >
            <span>Next Step</span>
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
