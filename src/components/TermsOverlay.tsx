import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface TermsOverlayProps {
  onClose: () => void;
}

export const TermsOverlay: React.FC<TermsOverlayProps> = ({ onClose }) => {
  return (
    <motion.div
                  key="terms"
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
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Terms of Use</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-500 dark:text-[#717171] leading-relaxed custom-scrollbar">
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">1. Acceptance of Terms</h3>
                      <p>By using Loki Prime X, you agree to these terms. If you do not agree, please do not use the service.</p>
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">2. Use of Service</h3>
                      <p>You agree to use the service for lawful purposes only. You are responsible for all content you generate or share.</p>
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">3. Privacy</h3>
                      <p>Your privacy is important to us. Please review our Privacy Policy to understand how we handle your data.</p>
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">4. AI Disclaimer</h3>
                      <p>Loki Prime X uses advanced AI models. Responses may be inaccurate, biased, or incomplete. Always verify important information.</p>
                    </section>
                    <section className="space-y-2">
                      <h3 className="text-slate-900 dark:text-white font-bold">5. Modifications</h3>
                      <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of new terms.</p>
                    </section>
                    <div className="pt-8 text-center text-[10px] uppercase tracking-widest">
                      Last Updated: March 2026
                    </div>
                  </div>
                </motion.div>
  );
};
