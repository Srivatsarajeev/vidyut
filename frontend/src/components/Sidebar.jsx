import React from 'react';
import { useVidyut } from '../VidyutContext';
import { LayoutDashboard, Lightbulb, FileSpreadsheet, User, LogOut, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const { user, currentTab, setCurrentTab, logout } = useVidyut();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'recommendations', label: 'AI Recommendations', icon: <Lightbulb size={18} /> },
    { id: 'reports', label: 'Reports & History', icon: <FileSpreadsheet size={18} /> },
    { id: 'profile', label: 'User Profile', icon: <User size={18} /> }
  ];

  const getInitials = (name) => {
    if (!name) return 'SR';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <aside className="w-64 border-r border-slate-100 bg-white h-screen flex flex-col justify-between shrink-0 font-sans sticky top-0">
      
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-slate-50 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Zap size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm tracking-tight leading-none">Vidyut</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AI Energy SaaS</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all relative ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
              >
                {/* Active Indicator Blob */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-blue-50/40 border border-blue-50 rounded-lg z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Icon & text */}
                <span className={`z-10 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="z-10 tracking-wide font-semibold mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile & Logout footer */}
      <div className="p-4 border-t border-slate-50 bg-slate-50/20">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-xs truncate leading-none">{user.name || "Srivatsa Rajeev"}</h4>
            <span className="text-[10px] text-slate-400 truncate block mt-1 font-semibold uppercase tracking-wider">Resident</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-rose-500 hover:bg-rose-50/50 hover:text-rose-600 transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
