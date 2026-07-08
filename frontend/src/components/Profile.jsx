import React, { useState } from 'react';
import { useVidyut } from '../VidyutContext';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Building, ShieldCheck, Sun, Moon, LogOut, Award } from 'lucide-react';

export default function Profile() {
  const { user, profileData, analysisResult, evData, logout } = useVidyut();
  const [darkMode, setDarkMode] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'SR';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const score = analysisResult ? analysisResult.energy_score : 82;

  return (
    <div className="space-y-8 p-6 md:p-8 font-sans bg-slate-50/20 max-w-4xl mx-auto">
      
      {/* Profile Intro Header */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.005)] flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-2xl border border-blue-100 shadow-sm shrink-0">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-slate-800 font-display tracking-tight leading-none">{user.name || "Srivatsa Rajeev"}</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mt-1.5">Registered Vidyut Auditor</span>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> +91 {user.phone || "9876543210"}</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {profileData.city || "Bengaluru"}, India</span>
          </div>
        </div>

        {/* Energy score badge */}
        <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 text-center shrink-0 flex items-center gap-4">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Energy Score</span>
            <span className="text-3xl font-extrabold text-emerald-600 block mt-1 leading-none">{score}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Info columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column 1: Onboarding survey summary */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.005)] space-y-5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-50">Survey Audit Details</h3>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
            <div>
              <span className="text-slate-400 font-medium block uppercase text-[10px]">House Structure</span>
              <span className="text-slate-800 font-bold block mt-1">{profileData.houseType}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block uppercase text-[10px]">Bedrooms</span>
              <span className="text-slate-800 font-bold block mt-1">{profileData.bedrooms} BHK</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block uppercase text-[10px]">Family Members</span>
              <span className="text-slate-800 font-bold block mt-1">{profileData.familyMembers} Residents</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block uppercase text-[10px]">Utility Provider</span>
              <span className="text-slate-800 font-bold block mt-1">{profileData.provider}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block uppercase text-[10px]">Avg. Monthly Bill</span>
              <span className="text-slate-800 font-bold block mt-1">₹{profileData.monthlyBill}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block uppercase text-[10px]">EV Integration</span>
              <span className="text-slate-800 font-bold block mt-1">
                {evData.hasEv ? `${evData.evBrand || evData.evType}` : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: App configurations & settings */}
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.005)] space-y-6">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-50">Preferences</h3>
          
          {/* Dark Mode toggle item */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                {darkMode ? <Moon size={15} /> : <Sun size={15} />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 block">Dark Mode</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Toggle dark colors (Beta feature)</span>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-10 h-6 rounded-full p-0.5 transition-all ${
                darkMode ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all transform ${
                darkMode ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Security details indicator */}
          <div className="p-3.5 bg-blue-50/20 border border-blue-50 rounded-lg text-[11px] text-slate-500 leading-normal flex items-start gap-2.5">
            <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={15} />
            <span>
              Your profile is verified. Energy records and analytics reports are stored in secure S3 storage and encrypted at rest using AES-256.
            </span>
          </div>

          {/* Sign Out Button */}
          <div className="pt-4 border-t border-slate-50">
            <button
              onClick={logout}
              className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-500 hover:text-rose-600 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={13} />
              <span>Log out of Vidyut</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
