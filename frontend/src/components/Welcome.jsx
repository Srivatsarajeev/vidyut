import React from 'react';
import { useVidyut } from '../VidyutContext';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, BarChart3, HelpCircle, ArrowRight, CloudLightning } from 'lucide-react';

export default function Welcome() {
  const { user, setSurveyStep } = useVidyut();

  const features = [
    {
      icon: <Zap className="text-blue-500" size={20} />,
      title: "Appliance Analysis",
      desc: "Get granular insights into which appliances consume the most electricity."
    },
    {
      icon: <BarChart3 className="text-emerald-500" size={20} />,
      title: "Bill Forecasting & Sparing",
      desc: "Forecast next month's bill and pinpoint target slabs to avoid higher rate steps."
    },
    {
      icon: <CloudLightning className="text-blue-500" size={20} />,
      title: "AWS Cloud Archiving",
      desc: "Save audit reports securely to S3 to keep historical performance logs."
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between py-12 px-6 md:px-12 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-60 z-0" />
      <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-blue-50 rounded-full filter blur-[120px] opacity-40 z-0" />

      {/* Header bar */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between z-10 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">Vidyut</span>
        </div>
        <div className="text-sm text-slate-500">
          Logged in as <span className="font-semibold text-slate-700">{user.name}</span>
        </div>
      </div>

      {/* Main hero body */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 my-auto">
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
              <Zap size={12} className="animate-bounce" /> Energy Auditing Platform
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-slate-900 tracking-tight leading-[1.1] max-w-2xl">
              Understand Your Home's <span className="text-blue-600">Energy Fingerprint</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-500 text-base md:text-lg max-w-xl leading-relaxed"
          >
            Welcome, {user.name.split(' ')[0]}! Vidyut combines your household survey details with AWS-backed smart modeling to calculate energy utilization, identify savings, and recommend slab sparing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSurveyStep('profile')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 group transition-all"
            >
              <span>Start Energy Survey</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-100 max-w-lg"
          >
            <div>
              <div className="text-2xl font-bold text-slate-800">100%</div>
              <div className="text-xs text-slate-400 font-medium">Slab Optimized</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">~25%</div>
              <div className="text-xs text-slate-400 font-medium">Avg. Saving</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">&lt;5 min</div>
              <div className="text-xs text-slate-400 font-medium">Instant Audit</div>
            </div>
          </motion.div>
        </div>

        {/* Hero Illustration Card */}
        <div className="lg:col-span-5 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative w-full max-w-[400px] aspect-square flex items-center justify-center"
          >
            {/* Outer rings */}
            <div className="absolute inset-0 border border-slate-100 rounded-full animate-pulse-slow opacity-60" />
            <div className="absolute inset-10 border border-slate-100/80 rounded-full" />
            <div className="absolute inset-20 border border-slate-200/50 rounded-full border-dashed" />

            {/* Glowing background */}
            <div className="absolute w-44 h-44 bg-gradient-to-tr from-blue-500/10 to-emerald-500/10 rounded-full filter blur-xl" />

            {/* Central energy unit */}
            <div className="w-40 h-40 bg-white border border-slate-100 rounded-2xl shadow-[0_12px_40px_rgba(148,163,184,0.06)] flex flex-col items-center justify-center p-6 z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3">
                <Zap size={28} />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vidyut Engine</span>
              <span className="text-slate-800 font-bold mt-1 text-sm">Active & Listening</span>
            </div>

            {/* Floating metric card 1 */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-8 right-0 bg-white border border-slate-100 rounded-lg p-3 shadow-md flex items-center gap-2.5 z-20"
            >
              <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center text-xs font-bold">
                ₹
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase leading-none">Monthly Saving</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">₹450+</div>
              </div>
            </motion.div>

            {/* Floating metric card 2 */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
              className="absolute bottom-8 left-0 bg-white border border-slate-100 rounded-lg p-3 shadow-md flex items-center gap-2.5 z-20"
            >
              <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center text-xs">
                💡
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase leading-none">Carbon Off</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">-35.4 kg</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer Features Row */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-100 z-10">
        {features.map((f, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              {f.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{f.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
