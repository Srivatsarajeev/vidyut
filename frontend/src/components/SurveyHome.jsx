import React from 'react';
import { useVidyut } from '../VidyutContext';
import { motion } from 'framer-motion';
import { Building2, Home, Users, MapPin, Landmark, DollarSign, BedDouble, ChevronRight } from 'lucide-react';

export default function SurveyHome() {
  const { profileData, setProfileData, setSurveyStep } = useVidyut();

  const handleHouseTypeSelect = (type) => {
    setProfileData(prev => ({ ...prev, houseType: type }));
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setSurveyStep('appliances');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center py-12 px-6">
      {/* Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white border border-slate-100 rounded-xl shadow-[0_20px_50px_rgba(148,163,184,0.04)] p-8 md:p-10"
      >
        {/* Stepper Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Step 1 of 4: Home Profile</span>
            <span>25% Complete</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '25%' }} />
          </div>
        </div>

        {/* Header Text */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Property Details</h2>
          <p className="text-slate-500 text-sm mt-1">Let's start with basic information about your property size and baseline details.</p>
        </div>

        {/* Form Body */}
        <div className="space-y-6">
          {/* Apartment vs Independent House Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">House Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => handleHouseTypeSelect('Apartment')}
                className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
                  profileData.houseType === 'Apartment'
                    ? 'border-blue-600 bg-blue-50/20 shadow-sm shadow-blue-500/5'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${
                  profileData.houseType === 'Apartment' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Building2 size={22} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Apartment</h4>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">Multi-family building residence or flat layout</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => handleHouseTypeSelect('Independent House')}
                className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-all ${
                  profileData.houseType === 'Independent House'
                    ? 'border-blue-600 bg-blue-50/20 shadow-sm shadow-blue-500/5'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${
                  profileData.houseType === 'Independent House' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Home size={22} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Independent House</h4>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">Stand-alone villa, duplex, or row house</p>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Number of Family Members</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Users size={16} />
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={profileData.familyMembers}
                  onChange={(e) => handleInputChange('familyMembers', parseInt(e.target.value) || '')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <MapPin size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru"
                  value={profileData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Electricity Provider</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Landmark size={16} />
                </span>
                <select
                  value={profileData.provider}
                  onChange={(e) => handleInputChange('provider', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all appearance-none"
                >
                  <option value="BESCOM">BESCOM (Bengaluru)</option>
                  <option value="MESCOM">MESCOM (Mangaluru)</option>
                  <option value="Adani Electricity">Adani Electricity (Mumbai)</option>
                  <option value="Tata Power">Tata Power (Delhi/Mumbai)</option>
                  <option value="MSEDCL">MSEDCL (Maharashtra)</option>
                  <option value="TANGEDCO">TANGEDCO (Tamil Nadu)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Electricity Bill (₹)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <DollarSign size={16} />
                </span>
                <input
                  type="number"
                  min={0}
                  value={profileData.monthlyBill}
                  onChange={(e) => handleInputChange('monthlyBill', parseFloat(e.target.value) || '')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Number of Rooms (Bedrooms)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <BedDouble size={16} />
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={profileData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || '')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 text-sm transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Buttons */}
        <div className="flex justify-between items-center mt-10 border-t border-slate-100 pt-6">
          <button
            onClick={() => setSurveyStep('welcome')}
            className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium rounded-lg text-sm transition-colors border border-slate-100"
          >
            Previous
          </button>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={nextStep}
            disabled={!profileData.familyMembers || !profileData.city || !profileData.monthlyBill || !profileData.bedrooms}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium rounded-lg text-sm shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all"
          >
            <span>Next Step</span>
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
