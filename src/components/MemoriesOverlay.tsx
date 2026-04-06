import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Database, Trash2 } from 'lucide-react';

interface MemoriesOverlayProps {
  onClose: () => void;
}

export const MemoriesOverlay: React.FC<MemoriesOverlayProps> = ({ onClose }) => {
  return (
    <motion.div
      key="memories"
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
          <Database className="w-5 h-5 text-slate-500" /> Memories
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-500 dark:text-[#717171] leading-relaxed custom-scrollbar">
        <div className="text-center py-10 space-y-4">
            <Database className="w-12 h-12 text-slate-300 dark:text-white/20 mx-auto" />
            <div className="text-lg font-bold text-slate-900 dark:text-white">No Memories Yet</div>
            <p className="text-sm text-slate-500 dark:text-[#717171]">The AI learns about you over time. Things it remembers will appear here.</p>
        </div>
      </div>
    </motion.div>
  );
};
