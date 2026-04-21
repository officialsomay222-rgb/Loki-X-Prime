import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ReportOverlayProps {
  onClose: () => void;
}

export const ReportOverlay: React.FC<ReportOverlayProps> = ({ onClose }) => {
  const [reportText, setReportText] = useState('');

  return (
    <motion.div
                  key="report"
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
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Report a Problem</h2>
                  </div>
                  <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-slate-500 dark:text-[#717171]">Describe the issue you're experiencing. Our team will look into it as soon as possible.</p>
                    <textarea
                      aria-label="Report description"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full h-48 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-slate-300 dark:focus:border-white/20 transition-colors resize-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "#2563eb" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        alert('Thank you for your report!');
                        onClose();
                        setReportText('');
                      }}
                      disabled={!reportText.trim()}
                      className="w-full py-4 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold transition-all shadow-xl shadow-blue-600/20"
                    >
                      Submit Report
                    </motion.button>
                  </div>
                </motion.div>
  );
};
