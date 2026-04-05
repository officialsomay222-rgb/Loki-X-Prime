import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface PrivacyOverlayProps {
  onClose: () => void;
}

export const PrivacyOverlay: React.FC<PrivacyOverlayProps> = ({ onClose }) => {
  return (
    <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 z-[120] bg-white dark:bg-[#0a0a0a] flex flex-col"
                >
                  <div className="flex items-center gap-4 p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] sticky top-0">
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="p-2 rounded-full transition-colors"
                    >
                      <ChevronDown className="w-5 h-5 text-slate-900 dark:text-white" />
                    </motion.button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Privacy Policy</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-500 dark:text-[#717171] leading-relaxed custom-scrollbar">
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">1. Data Collection</h3>
                      <p>We collect minimal data required to provide the AI service. This includes chat history (stored locally by default) and basic settings.</p>
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">2. Data Usage</h3>
                      <p>Your data is used solely to improve your experience with Loki Prime X. We do not sell your personal information to third parties.</p>
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">3. Local Storage</h3>
                      <p>Most of your settings and chat data are stored directly on your device using local storage for maximum privacy.</p>
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">4. Security</h3>
                      <p>We implement industry-standard security measures to protect your data during transmission and storage.</p>
                    </section>
                    <div className="pt-8 text-center text-[10px] uppercase tracking-widest">
                      Last Updated: March 2026
                    </div>
                  </div>
                </motion.div>
  );
};
