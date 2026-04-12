import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface PickerOverlayProps {
  showPicker: { label: string, options: any[], value: any, onChange: (val: any) => void, rect?: DOMRect } | null;
  setShowPicker: (val: any) => void;
}

export const PickerOverlay: React.FC<PickerOverlayProps> = ({ showPicker, setShowPicker }) => {
  if (!showPicker) return null;

  return (
    <div className="fixed inset-0 z-[100001] bg-transparent" onClick={() => setShowPicker(null)}>
      <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    style={{
                      position: 'fixed',
                      top: showPicker.rect ? Math.min(showPicker.rect.top - 4, window.innerHeight - 300) : '50%',
                      left: showPicker.rect ? Math.min(showPicker.rect.right - 200, window.innerWidth - 216) : '50%',
                      transform: showPicker.rect ? 'none' : 'translate(-50%, -50%)'
                    }}
                    className="w-[210px] bg-white dark:bg-[#0a0a0a] rounded-[24px] p-2 border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,1)] ring-1 ring-slate-200 dark:ring-white/5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                      <h3 className="text-[10px] font-bold text-slate-500 dark:text-[#717171] uppercase tracking-wider">{showPicker.label}</h3>
                    </div>
                    <div className="space-y-0.5">
                      {showPicker.options.map((opt: any) => {
                        const val = opt.value || opt;
                        const label = opt.label || opt;
                        const Icon = opt.icon;
                        const isSelected = showPicker.value === val;
                        return (
                          <motion.button
                            key={val}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              showPicker.onChange(val);
                              setShowPicker(null);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'hover:bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white'}`}
                          >
                            <div className="flex items-center gap-3">
                              {Icon && <Icon className={`w-4 h-4 ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-[#717171]'}`} />}
                              <span className="text-sm font-bold capitalize">{label}</span>
                            </div>
                            {isSelected && <Zap className="w-3.5 h-3.5" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
    </div>
  );
};
