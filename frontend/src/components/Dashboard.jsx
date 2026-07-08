import React from 'react';
import { useVidyut } from '../VidyutContext';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';
import { Zap, TrendingDown, Leaf, Target, Award, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const { analysisResult, profileData } = useVidyut();

  // If for some reason we have no analysisResult, provide mock values
  const data = analysisResult || {
    current_units: 245.5,
    predicted_next_month_units: 198.2,
    current_bill: 2500,
    predicted_next_month_bill: 1950,
    estimated_savings: 550,
    energy_score: 82,
    carbon_footprint: 200.9,
    carbon_reduction: 30.3,
    top_consumers: [
      { appliance: "AIR CONDITIONER", value: 75 },
      { appliance: "REFRIGERATOR", value: 54 },
      { appliance: "LIGHTS", value: 32 }
    ],
    appliances: {
      lights: 32,
      fans: 24,
      fridge: 54,
      tv: 12,
      washing_machine: 18,
      ac: 75,
      other: 30.5
    }
  };

  // 1. Prepare data for Recharts Pie Chart (Appliance share)
  const colors = ['#2563EB', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'];
  const appRaw = data.appliances || {};
  const pieData = Object.keys(appRaw)
    .filter(k => appRaw[k] > 0)
    .map(key => ({
      name: key.toUpperCase().replace('_', ' '),
      value: parseFloat(appRaw[key])
    }));

  // 2. Prepare data for Bar Chart (Top consumers)
  const barData = Object.keys(appRaw)
    .filter(k => appRaw[k] > 0)
    .map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
      kwh: parseFloat(appRaw[key])
    }))
    .sort((a, b) => b.kwh - a.kwh)
    .slice(0, 5);

  // 3. Prepare data for Area/Line Chart (Monthly Trend prediction)
  const trendData = [
    { month: 'Jan', baseline: Math.round(data.current_bill * 0.95), target: Math.round(data.predicted_next_month_bill * 0.95) },
    { month: 'Feb', baseline: Math.round(data.current_bill * 0.98), target: Math.round(data.predicted_next_month_bill * 0.96) },
    { month: 'Mar', baseline: Math.round(data.current_bill * 1.05), target: Math.round(data.predicted_next_month_bill * 1.01) },
    { month: 'Apr', baseline: Math.round(data.current_bill * 1.15), target: Math.round(data.predicted_next_month_bill * 1.05) },
    { month: 'May', baseline: Math.round(data.current_bill * 1.20), target: Math.round(data.predicted_next_month_bill * 1.08) },
    { month: 'Jun', baseline: Math.round(data.current_bill), target: Math.round(data.predicted_next_month_bill) }
  ];

  // 4. Property rankings benchmark mock
  const rankingList = [
    { rank: 1, name: "Green Villa (Solar)", score: 96, current: false },
    { rank: 2, name: "Siddharth's flat", score: 88, current: false },
    { rank: 3, name: `${profileData.city} Benchmark`, score: 85, current: false },
    { rank: 4, name: "Your Household (Current)", score: data.energy_score, current: true },
    { rank: 5, name: "Rahul Hegde", score: 72, current: false }
  ];

  return (
    <div className="space-y-8 p-6 md:p-8 font-sans bg-slate-50/20">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display tracking-tight">Welcome back!</h2>
          <p className="text-slate-400 text-xs mt-0.5">Here is your customized domestic energy intelligence audit.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        
        {/* Card 1: Energy Score */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Energy Score</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <Award size={14} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">{data.energy_score}</span>
            <span className="text-xs text-slate-400 font-medium">/100</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-2 leading-none">Optimal efficiency class</span>
        </motion.div>

        {/* Card 2: Current Bill */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Bill</span>
            <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center text-xs">
              <Zap size={14} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">₹{data.current_bill}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-2 leading-none">{data.current_units} kWh consumed</span>
        </motion.div>

        {/* Card 3: Predicted Bill */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Predicted Target</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
              <Target size={14} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-blue-600 tracking-tight">₹{data.predicted_next_month_bill}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-2 leading-none">After AI optimizations</span>
        </motion.div>

        {/* Card 4: Monthly Savings */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Savings</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <TrendingDown size={14} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">₹{data.estimated_savings}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-2 leading-none">~22% saving potential</span>
        </motion.div>

        {/* Card 5: Carbon Footprint */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carbon Footprint</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50/80 text-emerald-700 flex items-center justify-center text-xs">
              <Leaf size={14} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">{data.carbon_footprint}</span>
            <span className="text-xs text-slate-400 font-medium">kg CO₂</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-2 leading-none">▼ {data.carbon_reduction} kg offset</span>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Bar & Line Charts */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Trend Prediction Area Chart */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.005)]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bill Forecast Trend</h3>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">6-Month baseline vs. optimized path</span>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f1f5f9' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Area name="Baseline Bill (₹)" type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorBaseline)" />
                  <Area name="Optimized Target (₹)" type="monotone" dataKey="target" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorTarget)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Consuming Appliances Bar Chart */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.005)]">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800">Top Energy Consuming Appliances</h3>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Monthly energy consumption share in kWh</span>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f1f5f9' }} />
                  <Bar name="Usage (kWh)" dataKey="kwh" fill="#2563eb" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Pie Chart Share & rankings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Appliance Share Pie Chart */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.005)]">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800">Appliance Share</h3>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Percentage contribution of household loads</span>
            </div>

            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner details text */}
              <div className="absolute text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Total Usage</span>
                <span className="text-lg font-extrabold text-slate-800 block mt-0.5">{Math.round(data.current_units)} kWh</span>
              </div>
            </div>

            {/* Custom Pie Legend */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {pieData.slice(0, 4).map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Property Rankings Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.005)]">
            <div className="mb-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Community Benchmark</h3>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Efficiency scores within {profileData.city}</span>
              </div>
            </div>

            <div className="space-y-3">
              {rankingList.map((rank) => (
                <div
                  key={rank.rank}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-all ${
                    rank.current
                      ? 'border-blue-600 bg-blue-50/10 font-bold'
                      : 'border-slate-50 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                      rank.current ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {rank.rank}
                    </span>
                    <span className={rank.current ? 'text-slate-800' : 'text-slate-600'}>{rank.name}</span>
                  </div>
                  <span className={`font-mono font-bold ${rank.current ? 'text-blue-600' : 'text-slate-800'}`}>
                    {rank.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
