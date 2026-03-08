import React, { useState, useRef, useEffect, memo, forwardRef } from 'react';
import { Plus, Mic, Send, Loader2, Trash2, Square } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface ChatInputProps {
  isAwakened: boolean;
  isLoading: boolean;
  modelMode: string;
  setModelMode: (mode: string) => void;
  onSendMessage: (text: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  currentSessionId: string | null;
  onStopGeneration?: () => void;
}

export const ChatInput = memo(forwardRef<HTMLTextAreaElement, ChatInputProps>(({
  isAwakened,
  isLoading,
  modelMode,
  setModelMode,
  onSendMessage,
  onDeleteSession,
  currentSessionId,
  onStopGeneration
}, ref) => {
  const [input, setInput] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = (ref as React.MutableRefObject<HTMLTextAreaElement>) || internalRef;
  const { enterToSend } = useSettings();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isModelDropdownOpen && !(e.target as Element).closest('.model-dropdown-container')) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModelDropdownOpen]);

  const autoResizeInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
      // Show scrollbar only if content exceeds roughly 2 lines (approx 72px)
      inputRef.current.style.overflowY = scrollHeight > 80 ? 'auto' : 'hidden';
    }
  };

  useEffect(() => {
    autoResizeInput();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (enterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // If enterToSend is false, or if shift+enter is pressed, it naturally adds a new line
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full pt-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] px-3 sm:px-6 bg-transparent">
      <div className="max-w-4xl mx-auto relative">
        {isAwakened ? (
          /* AWAKENED MODE TEXTPAD - 10X ADVANCED */
          <div className="relative flex flex-col gap-1.5 sm:gap-2 rounded-[1.2rem] sm:rounded-[1.5rem] p-1.5 sm:p-2 bg-gradient-to-br from-[#0a0a12]/80 to-[#050508]/90 border border-cyan-500/20 backdrop-blur-2xl focus-within:bg-[#0a0a12]/95 focus-within:border-cyan-400/40 focus-within:shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-500 group">
            
            {/* Background effects container (handles overflow for animations) */}
            <div className="absolute inset-0 overflow-hidden rounded-[1.2rem] sm:rounded-[1.5rem] pointer-events-none">
              {/* Scanning Line Animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] -translate-y-full group-focus-within:animate-[scanline_4s_linear_infinite]"></div>
            </div>

            {/* Tech Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/30 rounded-tl-[1.2rem] sm:rounded-tl-[1.5rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/30 rounded-tr-[1.2rem] sm:rounded-tr-[1.5rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/30 rounded-bl-[1.2rem] sm:rounded-bl-[1.5rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/30 rounded-br-[1.2rem] sm:rounded-br-[1.5rem] opacity-50 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="AWAITING COMMAND SEQUENCE..."
              className="w-full max-h-[120px] sm:max-h-[150px] min-h-[40px] sm:min-h-[50px] bg-transparent border-0 focus:ring-0 focus:outline-none resize-none px-3 sm:px-4 py-2.5 sm:py-3.5 text-[1rem] sm:text-[1.1rem] text-cyan-50 placeholder:text-cyan-600/50 custom-scrollbar leading-relaxed font-mono tracking-wide relative z-10"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center w-full px-1 relative z-10">
              <div className="flex items-center gap-1 sm:gap-1.5">
                  <button className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/30">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="relative model-dropdown-container">
                    <button 
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1 sm:gap-1 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[0.6rem] sm:text-[0.75rem] font-bold tracking-[0.1em] transition-all whitespace-nowrap h-7 sm:h-8 border border-cyan-500/30 shadow-[0_0_8px_rgba(0,242,255,0.08)] hover:shadow-[0_0_12px_rgba(0,242,255,0.15)] uppercase"
                    >
                      {modelMode === 'pro' ? 'PRO CORE' : modelMode === 'fast' ? 'FAST CORE' : 'HAPPY CORE'}
                    </button>
                    {isModelDropdownOpen && (
                      <div className="absolute bottom-[calc(100%+8px)] sm:bottom-[calc(100%+12px)] right-0 bg-[#050508] border border-cyan-500/40 rounded-lg sm:rounded-xl p-1 sm:p-1.5 min-w-[130px] sm:min-w-[160px] z-[999] flex flex-col gap-0.5 animate-in slide-in-from-bottom-2 duration-200 shadow-[0_0_25px_rgba(0,242,255,0.25)]">
                        {[
                          { id: 'pro', label: 'PRO CORE' },
                          { id: 'fast', label: 'FAST CORE' },
                          { id: 'happy', label: 'HAPPY CORE' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setModelMode(m.id); setIsModelDropdownOpen(false); }}
                            className={`text-left px-2.5 sm:px-3 py-1.5 sm:py-2 text-[0.65rem] sm:text-[0.75rem] font-bold tracking-wider rounded-md sm:rounded-lg transition-all uppercase ${modelMode === m.id ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 shadow-[inset_0_0_8px_rgba(0,242,255,0.15)]' : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-500/10 border border-transparent'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Mic button hides when typing */}
                  <button className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-cyan-600/70 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/30 overflow-hidden ${input.length > 0 ? 'w-0 opacity-0 scale-50 pointer-events-none p-0 m-0 border-0' : 'opacity-100'}`}>
                    <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  
                  {isLoading ? (
                    <button
                      onClick={onStopGeneration}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-400/50 group"
                    >
                      <div className="absolute inset-0 bg-rose-400/20 animate-pulse group-hover:animate-none"></div>
                      <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10 drop-shadow-[0_0_4px_rgba(244,63,94,1)] fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
                        input.trim()
                          ? 'bg-cyan-500/20 text-[#00f2ff] hover:bg-cyan-500/40 shadow-[0_0_15px_rgba(0,242,255,0.4)] border border-cyan-400/50 group'
                          : 'bg-white/5 text-[#6b6b80] opacity-50 border border-white/5'
                      }`}
                    >
                      {input.trim() && (
                        <div className="absolute inset-0 bg-cyan-400/20 animate-pulse group-hover:animate-none"></div>
                      )}
                      <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 relative z-10 drop-shadow-[0_0_4px_rgba(0,242,255,1)]" />
                    </button>
                  )}
              </div>
            </div>
          </div>
        ) : (
          /* NORMAL MODE TEXTPAD - CLEAN & SIMPLE */
          <div className="relative flex flex-col gap-2 sm:gap-3 glass-panel premium-shadow rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 input-container-focus border border-slate-200/50 dark:border-white/10">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Initiate command sequence..."
              className="w-full max-h-[200px] sm:max-h-[250px] min-h-[50px] sm:min-h-[60px] bg-transparent border-0 focus:ring-0 focus:outline-none resize-none px-3 sm:px-4 py-3 sm:py-4 text-[1.05rem] sm:text-[1.2rem] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6b6b80] custom-scrollbar leading-relaxed font-medium"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center w-full px-2">
              <div className="flex items-center gap-2 sm:gap-3">
                  <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-all">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative model-dropdown-container">
                    <button 
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/80 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-black/60 text-cyan-600 dark:text-[#00f2ff] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[0.65rem] sm:text-[0.8rem] font-bold tracking-wide transition-all whitespace-nowrap h-8 sm:h-10 border border-slate-200/50 dark:border-white/5"
                    >
                      {modelMode === 'pro' ? 'PRO THINKING' : modelMode === 'fast' ? 'FAST MODEL' : 'HAPPY MODEL'}
                    </button>
                    {isModelDropdownOpen && (
                      <div className="absolute bottom-[calc(100%+10px)] sm:bottom-[calc(100%+14px)] right-0 bg-white dark:bg-[#050508] border border-slate-200 dark:border-cyan-500/40 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 min-w-[140px] sm:min-w-[180px] z-[999] flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200 shadow-xl dark:shadow-[0_0_25px_rgba(0,242,255,0.15)]">
                        {[
                          { id: 'pro', label: 'Pro Thinking' },
                          { id: 'fast', label: 'Fast Model' },
                          { id: 'happy', label: 'Happy Model' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setModelMode(m.id); setIsModelDropdownOpen(false); }}
                            className={`text-left px-3 sm:px-4 py-2 sm:py-2.5 text-[0.7rem] sm:text-[0.8rem] font-semibold rounded-lg sm:rounded-xl transition-all ${modelMode === m.id ? 'text-cyan-700 dark:text-[#00f2ff] bg-cyan-50 dark:bg-cyan-500/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Mic button hides when typing */}
                  <button className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-400 dark:text-[#888] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-all overflow-hidden ${input.length > 0 ? 'w-0 opacity-0 scale-50 pointer-events-none p-0 m-0' : 'opacity-100'}`}>
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {isLoading ? (
                    <button
                      onClick={onStopGeneration}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-rose-100 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/40 border border-rose-200 dark:border-rose-400/50"
                    >
                      <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        input.trim()
                          ? 'bg-cyan-600 dark:bg-cyan-500/20 text-white dark:text-[#00f2ff] hover:bg-cyan-500 dark:hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(0,242,255,0.3)] dark:border dark:border-cyan-400/30'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-[#6b6b80] opacity-50'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}));
