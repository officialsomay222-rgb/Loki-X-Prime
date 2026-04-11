import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

export const NetworkStatusIndicator: React.FC = () => {
  const { connected } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!connected && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center mt-safe pt-2 pointer-events-none"
        >
          <div className="bg-red-500/90 text-white px-4 py-1.5 rounded-full shadow-lg shadow-red-500/20 flex items-center gap-2 backdrop-blur-md border border-red-400/50 pointer-events-auto">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium tracking-wide">No Internet Connection</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
