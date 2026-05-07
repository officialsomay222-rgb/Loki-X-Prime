import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface ClearConfirmOverlayProps {
  onParentClose: () => void;
  onClose: () => void;
  onClearAllChats: () => void;
  setShowClearConfirm: (show: boolean) => void;
}

export const ClearConfirmOverlay: React.FC<ClearConfirmOverlayProps> = ({
  onParentClose,
  onClose,
  onClearAllChats,
  setShowClearConfirm
}) => {
  return (
    <motion.div
                  key="clear-confirm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[130] bg-white/90 dark:bg-black/95 backdrop-blur-sm flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-[#0a0a0a] rounded-[32px] p-8 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,1)]"
                  >
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2 tracking-tight">Clear History?</h3>
                    <p className="text-slate-500 dark:text-[#717171] text-center mb-8 text-sm leading-relaxed">This will permanently delete all your chat sessions. This action cannot be undone.</p>
                    <div className="flex flex-col gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "#dc2626" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onClearAllChats();
                          onParentClose();
                          setShowClearConfirm(false);
                        }}
                        className="w-full py-4 bg-red-600 text-white rounded-full font-bold transition-all shadow-xl shadow-red-600/20"
                      >
                        Clear Everything
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowClearConfirm(false)}
                        className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-full font-bold transition-all"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
  );
};
