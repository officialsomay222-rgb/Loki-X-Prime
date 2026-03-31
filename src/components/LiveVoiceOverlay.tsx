import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, X, Sparkles } from 'lucide-react';

interface LiveVoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onHold: () => void;
}

export const LiveVoiceOverlay: React.FC<LiveVoiceOverlayProps> = ({ isOpen, onClose, onHold }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && isMobile && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-between pb-12 pt-8"
        >
          {/* Top Indicator */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md mt-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-white text-sm font-medium tracking-wide">Live</span>
          </div>

          {/* Center/Bottom Glow Effect */}
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/40 to-purple-500/40 blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-500/30 to-fuchsia-500/30 blur-2xl"
            />
          </div>

          {/* Bottom Controls */}
          <div className="relative z-10 flex items-center gap-12 mt-auto mb-8">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onHold}
                className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/5 active:scale-95 transition-transform"
              >
                <Pause className="w-8 h-8 text-white fill-white" />
              </button>
              <span className="text-white/70 text-sm font-medium">Hold</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onClose}
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-[0_8px_30px_rgba(220,38,38,0.4)] active:scale-95 transition-transform"
              >
                <X className="w-8 h-8 text-white" />
              </button>
              <span className="text-white/70 text-sm font-medium">End</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
