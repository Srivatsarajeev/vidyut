import React from 'react';
import { useVidyut } from '../VidyutContext';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, Minus, Star } from 'lucide-react';

export default function SurveyAppliances() {
  const { appliancesData, setAppliancesData, setSurveyStep } = useVidyut();

  const handleUpdateAppliance = (key, field, value) => {
    setAppliancesData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const toggleAppliance = (key) => {
    const app = appliancesData[key];
    const isSelected = app.qty > 0;
    if (isSelected) {
      handleUpdateAppliance(key, 'qty', 0);
    } else {
      handleUpdateAppliance(key, 'qty', 1);
    }
  };

  const nextStep = () => {
    setSurveyStep('ev');
  };

  const prevStep = () => {
    setSurveyStep('profile');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center py-4 md:py-6 px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white border border-slate-100 rounded-xl shadow-[0_20px_50px_rgba(148,163,184,0.04)] p-5 md:p-6"
      >
        {/* Stepper Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Step 2 of 4: Appliances Inventory</span>
            <span>50% Complete</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '50%' }} />
          </div>
        </div>

        {/* Header Text */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appliances & Ratings</h2>
          <p className="text-slate-500 text-sm mt-1">Configure active appliances. Select a card to enable it, then specify its details.</p>
        </div>

        {/* Appliance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[46vh] overflow-y-auto pr-2 pb-4">
          {Object.keys(appliancesData).map((key) => {
            const app = appliancesData[key];
            const isSelected = app.qty > 0;

            return (
              <motion.div
                key={key}
                whileHover={{ y: -3 }}
                className={`p-5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-white shadow-md shadow-blue-500/5'
                    : 'border-slate-150 bg-slate-50/40 opacity-70'
                }`}
              >
                {/* Header of card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{app.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{app.name}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAppliance(key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                    }`}
                  >
                    {isSelected ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Body of card, shown only if active */}
                {isSelected ? (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    {/* Quantity Row */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Quantity</span>
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleUpdateAppliance(key, 'qty', Math.max(1, app.qty - 1))}
                          className="p-1 px-2 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-sm font-bold text-slate-800">{app.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateAppliance(key, 'qty', app.qty + 1)}
                          className="p-1 px-2 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Daily Usage Slider */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-500 font-semibold uppercase mb-1">
                        <span>Daily Usage</span>
                        <span className="text-slate-800 font-bold">{app.usage} hrs</span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={24}
                        step={key === 'mixerGrinder' || key === 'microwave' ? 0.1 : 0.5}
                        value={app.usage}
                        onChange={(e) => handleUpdateAppliance(key, 'usage', parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Energy Rating Star selection */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Energy Rating</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleUpdateAppliance(key, 'rating', star)}
                            className="focus:outline-none"
                          >
                            <Star
                              size={15}
                              className={
                                star <= app.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[105px] flex items-center justify-center border-t border-dashed border-slate-200 mt-2">
                    <button
                      onClick={() => toggleAppliance(key)}
                      className="text-xs text-slate-400 font-medium hover:text-blue-600 transition-colors"
                    >
                      Click to configure {app.name}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Stepper Buttons */}
        <div className="flex justify-between items-center mt-6 border-t border-slate-100 pt-4">
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
