import React, { useState, useRef, useEffect } from 'react';
import { useVidyut } from '../VidyutContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login } = useVidyut();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const otpRefs = useRef([]);

  // Auto-focus first OTP input when sent
  useEffect(() => {
    if (otpSent && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [otpSent]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (name.trim() && phone.length === 10) {
      setOtpSent(true);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move focus to next input
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace to move to previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length === 6) {
      setIsVerifying(true);
      // Simulate verification delay
      setTimeout(() => {
        setIsVerifying(false);
        setIsSuccess(true);
        // Delay final login transition
        setTimeout(() => {
          login(name, phone);
        }, 1500);
      }, 1500);
    }
  };

  useEffect(() => {
    if (otp.join('').length === 6) {
      handleVerify();
    }
  }, [otp]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white">
      {/* Dynamic Background Grid and Blobs */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100 rounded-full filter blur-[100px] opacity-40 animate-pulse-slow z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-100 rounded-full filter blur-[100px] opacity-40 animate-pulse-slow z-0" />

      {/* Centered Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-white border border-slate-100 rounded-xl shadow-[0_20px_50px_rgba(148,163,184,0.08)] p-8 md:p-10 z-10 mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          {/* Logo Mark */}
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Vidyut</h1>
          <p className="text-slate-500 text-sm mt-1">AI Energy Intelligence Platform</p>
        </div>

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.form
              key="login-fields"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSendOtp}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Srivatsa Rajeev"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition-all mt-6 text-sm"
              >
                <span>Send OTP</span>
                <ArrowRight size={16} />
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="otp-fields"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 flex flex-col items-center"
            >
              <div className="text-center">
                <h3 className="text-base font-semibold text-slate-800">Verify your mobile</h3>
                <p className="text-slate-500 text-xs mt-1">
                  We've sent a 6-digit code to <span className="font-medium text-slate-700">+91 {phone}</span>
                </p>
              </div>

              {/* OTP Input Boxes */}
              <div className="flex gap-2.5 my-2 justify-center">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={isVerifying || isSuccess}
                    className="w-11 h-12 text-center text-lg font-bold bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 transition-all"
                  />
                ))}
              </div>

              {/* Verification & Success Animations */}
              <div className="w-full h-10 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isVerifying && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-xs text-blue-600 font-medium"
                    >
                      <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Verifying code...</span>
                    </motion.div>
                  )}

                  {isSuccess && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"
                    >
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span>OTP Verified! Welcome.</span>
                    </motion.div>
                  )}

                  {!isVerifying && !isSuccess && (
                    <motion.button
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Change phone number
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-full border-t border-slate-100 pt-4 flex justify-between items-center text-[11px] text-slate-400">
                <span>Demo Code: Any 6 digits</span>
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Secure login</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
