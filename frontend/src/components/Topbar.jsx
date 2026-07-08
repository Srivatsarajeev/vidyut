import React, { useState } from 'react';
import { useVidyut } from '../VidyutContext';
import { Bell, Cloud, CloudOff, CloudLightning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Topbar() {
  const { currentTab, cloudStatus, notifications, setNotifications } = useVidyut();
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Energy Intelligence Dashboard';
      case 'recommendations':
        return 'AI Optimization Recommendations';
      case 'reports':
        return 'Energy Audit Reports';
      case 'profile':
        return 'User Settings & Settings';
      default:
        return 'Vidyut Engine';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 font-sans">
      
      {/* Title */}
      <h1 className="text-sm font-bold text-slate-800 tracking-tight font-display">
        {getPageTitle()}
      </h1>

      {/* Action Indicators */}
      <div className="flex items-center gap-5">
        
        {/* S3 Cloud Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
          cloudStatus.connected
            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600'
            : 'bg-amber-50/40 border-amber-100 text-amber-600'
        }`}>
          {cloudStatus.connected ? (
            <>
              <Cloud size={13} className="animate-pulse" />
              <span>S3 Synced ({cloudStatus.bucket.substring(0, 15)}...)</span>
            </>
          ) : (
            <>
              <CloudOff size={13} />
              <span>S3 Demo Mode</span>
            </>
          )}
        </div>

        {/* Notifications Icon and Menu */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Card */}
          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop overlay to close */}
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-150 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold uppercase tracking-wider"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 text-xs transition-colors ${
                            item.read ? 'bg-white' : 'bg-blue-50/10'
                          }`}
                        >
                          <p className="text-slate-600 leading-normal">{item.text}</p>
                          <span className="text-[9px] text-slate-400 block mt-1 font-semibold">{item.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
