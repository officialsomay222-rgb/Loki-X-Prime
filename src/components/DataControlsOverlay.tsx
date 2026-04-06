import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Shield } from 'lucide-react';

interface DataControlsOverlayProps {
  onClose: () => void;
}

export const DataControlsOverlay: React.FC<DataControlsOverlayProps> = ({ onClose }) => {
  return (
    <motion.div
      key="data-controls"
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
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-500" /> Data Controls
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-500 dark:text-[#717171] leading-relaxed custom-scrollbar">
        <section className="space-y-2">
          <h3 className="text-slate-900 dark:text-white font-bold">Data Privacy</h3>
          <p>Your chats are processed securely. You have full control over your data.</p>
        </section>
        <section className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#161616] rounded-2xl border border-slate-100 dark:border-white/5">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Improve Model</div>
              <div className="text-xs text-slate-500 dark:text-[#717171]">Allow your data to be used to improve our AI.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked={false} />
              <div className="w-11 h-6 bg-slate-200 dark:bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-white peer-checked:after:bg-white dark:peer-checked:after:bg-black"></div>
            </label>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
