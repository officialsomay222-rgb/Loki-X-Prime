import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const { setCommanderName, theme } = useSettings();
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    // Only focus input when modal is opened
    if (isOpen) {
      setTempName('');
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const finalName = tempName.trim() || 'Commander';
    setCommanderName(finalName);
    localStorage.setItem('loki_hasSeenWelcome', 'true');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 transform-gpu"
          style={{ transform: 'translateZ(0)', willChange: 'opacity', paddingTop: 'clamp(24px, env(safe-area-inset-top, 0px), 48px)', paddingBottom: 'clamp(0px, env(safe-area-inset-bottom, 0px), 32px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden ${
              theme === 'dark' ? 'bg-[#0a0a0a] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,1)]' : 'bg-white border border-slate-200'
            }`}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          >
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-3xl">
               <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]"></div>
               <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-violet-500/20 rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h2 className={`text-2xl font-bold mb-2 text-center tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Welcome to LOKI X PRIME
              </h2>

              <p className={`text-center mb-8 text-sm ${theme === 'dark' ? 'text-[#a1a1aa]' : 'text-slate-500'}`}>
                Before we begin our journey, how should I address you?
              </p>

              <div className="w-full space-y-6">
                <div className="relative">
                  <input
                    aria-label="Your name"
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`w-full rounded-2xl p-4 pl-5 pr-12 text-sm focus:outline-none transition-all ${
                      theme === 'dark'
                        ? 'bg-[#161616] border border-white/10 text-white focus:border-cyan-500/50 focus:bg-[#1c1c1c] placeholder-zinc-600'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-cyan-500/50 focus:bg-white placeholder-slate-400'
                    }`}
                    placeholder="Enter your name (e.g., Commander)"
                    autoFocus
                  />
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center ${
                      tempName.trim() ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-300 pointer-events-none`}>
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="w-full py-4 rounded-full font-bold transition-all shadow-xl flex items-center justify-center gap-2 group bg-gradient-to-r from-cyan-600 to-violet-600 text-white hover:from-cyan-500 hover:to-violet-500 shadow-cyan-500/25"
                >
                  <span>Start Experience</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
