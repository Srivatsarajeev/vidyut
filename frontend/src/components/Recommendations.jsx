import React from 'react';
import { useVidyut } from '../VidyutContext';
import { motion } from 'framer-motion';
import { Lightbulb, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function Recommendations() {
  const { analysisResult } = useVidyut();

  // Fallback recommendations if offline/demo
  const recommendations = (analysisResult && analysisResult.recommendations) || [
    {
      appliance: "Air Conditioner",
      title: "Optimize AC Temperature to 24°C-26°C",
      tips: [
        "Setting the thermostat to 24°C instead of 18°C can reduce compressor run-time by up to 20%.",
        "Ensure doors and windows are fully sealed while the AC is running to prevent cooling loss.",
        "Service the AC filter and coils twice a season to maintain airflow efficiency."
      ],
      estimated_saving: 450.0,
      priority: "High"
    },
    {
      appliance: "Refrigerator",
      title: "Upgrade to a 5-Star Inverter Refrigerator",
      tips: [
        "Modern 5-Star inverter compressors run at variable speeds and draw up to 30% less power.",
        "Maintain a 3-4 inch clearance around the refrigerator sides and back for ventilation.",
        "Ensure refrigerator door gaskets seal tightly to prevent cool air leakage."
      ],
      estimated_saving: 320.0,
      priority: "Medium"
    },
    {
      appliance: "Water Heater",
      title: "Install a Geyser Timer & Reduce Temperature",
      tips: [
        "A smart timer prevents the geyser from heating water continuously; set it to run 20 mins before use.",
        "Lower the thermostat temperature from 65°C to 50°C to significantly reduce standing losses.",
        "Insulate hot water pipes to maintain water temperature for longer periods."
      ],
      estimated_saving: 280.0,
      priority: "Medium"
    },
    {
      appliance: "Lights",
      title: "Switch to High-Efficiency LEDs & Use Sensors",
      tips: [
        "Upgrade any remaining fluorescent tube lights (FTLs) or CFLs to high-efficiency LEDs (9W-12W).",
        "Utilize natural day-lighting in common rooms and turn off lights in unoccupied spaces.",
        "Install motion-sensor switches in bathrooms and corridors to automate shut-offs."
      ],
      estimated_saving: 110.0,
      priority: "Low"
    }
  ];

  const getPriorityStyles = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'high') {
      return 'bg-rose-50 border-rose-100 text-rose-600';
    } else if (p === 'medium') {
      return 'bg-amber-50 border-amber-100 text-amber-600';
    }
    return 'bg-blue-50 border-blue-100 text-blue-600';
  };

  const getApplianceIcon = (appliance) => {
    const app = appliance.toLowerCase();
    if (app.includes('ac') || app.includes('conditioner')) return '❄️';
    if (app.includes('fridge') || app.includes('refrigerator')) return '❄️';
    if (app.includes('light')) return '💡';
    if (app.includes('water') || app.includes('geyser') || app.includes('heater')) return '🚿';
    if (app.includes('ev') || app.includes('vehicle')) return '🚗';
    if (app.includes('computer') || app.includes('laptop')) return '💻';
    return '⚡';
  };

  return (
    <div className="space-y-8 p-6 md:p-8 font-sans bg-slate-50/20">
      
      {/* Intro header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display tracking-tight flex items-center gap-2">
            <Lightbulb size={22} className="text-blue-600" />
            <span>AI Energy Recommendations</span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Custom savings plans optimized for your appliance profile.</p>
        </div>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -3 }}
            className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between"
          >
            <div>
              {/* Header: Icon, priority badge */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
                    {getApplianceIcon(rec.appliance)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-none">{rec.appliance}</h3>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block mt-1">Diagnostic Alert</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getPriorityStyles(rec.priority || (index === 0 ? 'High' : index < 3 ? 'Medium' : 'Low'))}`}>
                  {rec.priority || (index === 0 ? 'High' : index < 3 ? 'Medium' : 'Low')} Priority
                </span>
              </div>

              {/* Title */}
              <h4 className="font-bold text-slate-800 text-sm mb-3 mt-2">{rec.title}</h4>

              {/* Tips List */}
              <ul className="space-y-2 mb-6">
                {(rec.tips || []).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed">
                    <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer: savings display & action button */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block leading-none">Est. Monthly Savings</span>
                <span className="text-sm font-extrabold text-emerald-600 block mt-1">₹{rec.estimated_saving}</span>
              </div>
              <button className="px-3.5 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all">
                Acknowledge Action
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
