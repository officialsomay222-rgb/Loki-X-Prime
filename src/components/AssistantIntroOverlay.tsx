import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles, Zap, Smartphone, CheckCircle } from 'lucide-react';
import AssistantSettings from '../plugins/AssistantSettings';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

interface AssistantIntroOverlayProps {
  onClose: () => void;
}

export const AssistantIntroOverlay: React.FC<AssistantIntroOverlayProps> = ({ onClose }) => {

  const handleSetAssistant = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await AssistantSettings.openAssistantSettings();
      } catch (e) {
        console.error('Failed to open settings', e);
        toast.error('Could not open assistant settings. Please try manually in your device settings.');
      }
    } else {
      toast.error('This feature is only available on Android devices.');
    }
  };

  return (
    <motion.div
      key="assistant-intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 z-[120] bg-white dark:bg-[#0a0a0a] flex flex-col"
    >
      <div className="flex items-center gap-4 p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] sticky top-0 z-10">
        <motion.button
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 rounded-full transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-slate-900 dark:text-white" />
        </motion.button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[2rem] flex items-center justify-center rotate-12 mb-2 shadow-2xl">
            <Sparkles className="w-10 h-10 text-white dark:text-black -rotate-12" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Loki X Prime</h1>
          <p className="text-slate-500 dark:text-[#717171] leading-relaxed">
            Elevate your mobile experience by setting Loki X Prime as your default digital assistant. Access advanced AI capabilities directly from anywhere on your phone.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-[#161616] p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex gap-4">
            <Zap className="w-6 h-6 text-slate-900 dark:text-white flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Instant Access</h3>
              <p className="text-sm text-slate-500 dark:text-[#717171]">Long-press your home button or swipe from the bottom corner to summon Loki instantly.</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#161616] p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex gap-4">
            <Smartphone className="w-6 h-6 text-slate-900 dark:text-white flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Deep Integration</h3>
              <p className="text-sm text-slate-500 dark:text-[#717171]">Replace your system's default assistant with a smarter, highly capable AI companion.</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#161616] p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex gap-4">
            <CheckCircle className="w-6 h-6 text-slate-900 dark:text-white flex-shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Ready to Assist</h3>
              <p className="text-sm text-slate-500 dark:text-[#717171]">Always available to answer questions, generate content, or help with tasks on the go.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: "#f0f0f0" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSetAssistant}
          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold transition-all shadow-xl"
        >
          Set Loki X Prime as default AI assistant
        </motion.button>
      </div>
    </motion.div>
  );
};
