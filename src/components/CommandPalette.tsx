import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Settings, Plus, X } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

export const CommandPalette = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const { sessions, createNewSession, setCurrentSessionId } = useChat();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null; // Toggle logic would be outside
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100]"
            style={{ paddingTop: 'clamp(24px, env(safe-area-inset-top, 0px), 48px)', paddingBottom: 'clamp(0px, env(safe-area-inset-bottom, 0px), 32px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg glass-panel premium-shadow rounded-xl z-[101] overflow-hidden"
            style={{ marginTop: 'clamp(24px, env(safe-area-inset-top, 0px), 48px)' }}
          >
            <div className="flex items-center px-4 border-b border-slate-200/30 dark:border-white/10">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search sessions or commands..."
                aria-label="Search sessions or commands"
                className="w-full bg-transparent p-4 text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} aria-label="Close command palette" title="Close command palette" className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md transition-colors"><X className="w-4 h-4 text-slate-500 dark:text-slate-400" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar transform-gpu" style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)', willChange: 'transform' }}>
              <button onClick={() => { createNewSession(); onClose(); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-white/5 focus-visible:bg-slate-100 dark:focus-visible:bg-white/5 focus-visible:outline-none rounded-lg text-slate-800 dark:text-white transition-colors">
                <Plus className="w-4 h-4" /> New Awakening
              </button>
              {filteredSessions.map(session => (
                <button key={session.id} onClick={() => { setCurrentSessionId(session.id); onClose(); }} className="w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-white/5 focus-visible:bg-slate-100 dark:focus-visible:bg-white/5 focus-visible:outline-none rounded-lg text-slate-700 dark:text-slate-300 transition-colors">
                  {session.title}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
