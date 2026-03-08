import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { AwakenedBackground } from './components/AwakenedBackground';
import { CommandPalette } from './components/CommandPalette';
import { useSettings } from './contexts/SettingsContext';
import { useChat } from './contexts/ChatContext';
import { format, isToday } from 'date-fns';
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Trash2, 
  PanelLeftClose, 
  PanelLeftOpen,
  User,
  Sun,
  Moon,
  X,
  Image as ImageIcon,
  Palette,
  Sliders,
  FileText,
  Download,
  RotateCcw,
  Type,
  Volume2
} from 'lucide-react';

const InfinityLogo = memo(({ className = "" }: { className?: string }) => (
  <svg className={`w-full h-full will-change-transform ${className}`} viewBox="0 0 200 100" style={{ animation: 'float3d 5s infinite ease-in-out', contain: 'paint' }}>
    <defs>
        <linearGradient id="rainbowGradMain" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000"><animate attributeName="stop-color" values="#ff0000;#ff7f00;#ffff00;#00ff00;#00f0ff;#bd00ff;#ff00ff;#ff0000" dur="6s" repeatCount="indefinite" /></stop>
            <stop offset="50%" stopColor="#bd00ff"><animate attributeName="stop-color" values="#bd00ff;#00f0ff;#00ff00;#ffff00;#ff7f00;#ff0000;#ff00ff;#bd00ff" dur="6s" repeatCount="indefinite" /></stop>
            <stop offset="100%" stopColor="#00f0ff"><animate attributeName="stop-color" values="#00f0ff;#bd00ff;#ff00ff;#ff0000;#ff7f00;#ffff00;#00ff00;#00f0ff" dur="6s" repeatCount="indefinite" /></stop>
        </linearGradient>
        <filter id="neonGlow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
    </defs>
    <path d="M50 50 C30 30, 20 50, 30 70 C40 90, 60 90, 80 70 C100 50, 120 50, 140 70 C160 90, 180 90, 170 70 C160 50, 140 30, 120 50 C100 70, 80 70, 60 50 C40 30, 30 30, 50 50" fill="none" stroke="url(#rainbowGradMain)" strokeWidth="6" filter="url(#neonGlow)" style={{ strokeDasharray: 500, strokeDashoffset: 500, animation: 'drawInfinity 4s linear infinite' }} />
  </svg>
));

const HeaderInfinityLogo = memo(({ className = "" }: { className?: string }) => (
  <svg className={`w-full h-full will-change-transform ${className}`} viewBox="0 0 100 50" style={{ contain: 'paint' }}>
    <defs>
        <linearGradient id="rainbowGradHeader" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000"><animate attributeName="stop-color" values="#ff0000;#ff7f00;#ffff00;#00ff00;#00f0ff;#bd00ff;#ff00ff;#ff0000" dur="6s" repeatCount="indefinite" /></stop>
            <stop offset="50%" stopColor="#bd00ff"><animate attributeName="stop-color" values="#bd00ff;#00f0ff;#00ff00;#ffff00;#ff7f00;#ff0000;#ff00ff;#bd00ff" dur="6s" repeatCount="indefinite" /></stop>
            <stop offset="100%" stopColor="#00f0ff"><animate attributeName="stop-color" values="#00f0ff;#bd00ff;#ff00ff;#ff0000;#ff7f00;#ffff00;#00ff00;#00f0ff" dur="6s" repeatCount="indefinite" /></stop>
        </linearGradient>
    </defs>
    <path d="M25 15 C 5 15, 5 35, 25 35 C 45 35, 55 15, 75 15 C 95 15, 95 35, 75 35 C 55 35, 45 15, 25 15" fill="none" stroke="url(#rainbowGradHeader)" strokeWidth="7" strokeLinecap="round" style={{ strokeDasharray: '60 40', animation: 'dashMoveTitle 2s linear infinite' }}/>
  </svg>
));

export default function App() {
  const [isBooting, setIsBooting] = useState(true); // Enabled booting
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [awakening, setAwakening] = useState<{id: number, phase: string, startX: number, startY: number, width: number, height: number, isDeactivating?: boolean} | null>(null);
  
  const { 
    theme, setTheme, 
    bgStyle, setBgStyle, 
    commanderName, setCommanderName, 
    modelMode, setModelMode, 
    isAwakened, setIsAwakened,
    systemInstruction, setSystemInstruction,
    temperature, setTemperature,
    topP, setTopP,
    topK, setTopK,
    enterToSend, setEnterToSend,
    bubbleStyle, setBubbleStyle,
    fontSize, setFontSize,
    fontStyle, setFontStyle,
    soundEnabled, setSoundEnabled,
    messageAnimation, setMessageAnimation,
    autoScroll, setAutoScroll,
    typingSpeed, setTypingSpeed,
    showAvatars, setShowAvatars,
    responseLength, setResponseLength,
    accentColor, setAccentColor,
    messageDensity, setMessageDensity,
    resetSettings
  } = useSettings();
  const { sessions, currentSessionId, isLoading, createNewSession, deleteSession, clearAllSessions, setCurrentSessionId, sendMessage, stopGeneration } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNewSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewSession]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle PWA shortcuts and share target
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('settings') === 'true') {
      setIsSettingsOpen(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    const command = urlParams.get('command');
    if (command) {
      // Handle web+loki:// protocol
      console.log('Received command:', command);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const shareText = urlParams.get('text');
    const shareUrl = urlParams.get('url');
    if (shareText || shareUrl) {
      // Handle share target
      const initialMessage = [shareText, shareUrl].filter(Boolean).join('\n');
      if (initialMessage && inputRef.current) {
        inputRef.current.value = initialMessage;
        // Trigger synthetic change event if needed by ChatInput
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Auto-close sidebar on mobile initially
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Save sessions to local storage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('loki_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [currentSession?.messages.length, currentSessionId, autoScroll]);

  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
    if (window.innerWidth >= 768) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSession(id);
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'advanced'>('general');

  const handleExportChat = () => {
    if (!currentSession || currentSession.messages.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentSession.messages, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `loki_chat_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCreateNewSession = () => {
    createNewSession();
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const formatDate = useCallback((date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    return format(date, 'MMM d, HH:mm');
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const triggerAwakening = (e: React.MouseEvent) => {
    if (awakening) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left;
    const startY = rect.top;
    
    setAwakening({ id: Date.now(), phase: 'moving-in', startX, startY, width: rect.width, height: rect.height, isDeactivating: isAwakened });
    
    setTimeout(() => {
      if (isAwakened) {
         // Deactivating
         setAwakening(prev => prev ? { ...prev, phase: 'shockwave' } : null);
         setTimeout(() => {
            setIsAwakened(false);
            setAwakening(prev => prev ? { ...prev, phase: 'moving-out' } : null);
         }, 2500);
         setTimeout(() => {
            setAwakening(null);
         }, 4000);
      } else {
         // Activating
         setAwakening(prev => prev ? { ...prev, phase: 'prompt' } : null);
      }
    }, 1500);
  };

  const handleAwakeningResponse = (ready: boolean) => {
    if (!awakening) return;
    
    if (ready) {
      setAwakening(prev => prev ? { ...prev, phase: 'shockwave' } : null);
      setTimeout(() => {
        setIsAwakened(true);
        setAwakening(prev => prev ? { ...prev, phase: 'moving-out' } : null);
      }, 2500);
      setTimeout(() => {
        setAwakening(null);
      }, 4000);
    } else {
      setAwakening(prev => prev ? { ...prev, phase: 'moving-out' } : null);
      setTimeout(() => {
        setAwakening(null);
      }, 1500);
    }
  };

  const renderedMessages = useMemo(() => {
    return currentSession?.messages.map((message) => (
      <MessageBubble
        key={message.id}
        message={message}
        isAwakened={isAwakened}
        commanderName={commanderName}
        copiedId={copiedId}
        onCopy={copyToClipboard}
        formatDate={formatDate}
      />
    ));
  }, [currentSession?.messages, isAwakened, commanderName, copiedId]);

  if (isBooting) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#08080c] z-[9999] flex flex-col justify-center items-center transition-opacity duration-700">
         <div className="flex flex-col items-center justify-center gap-8 w-full max-w-[300px] my-auto mx-auto">
            <div className="w-full max-w-[240px] aspect-[2/1] relative flex justify-center items-center">
               <InfinityLogo />
            </div>
            <div className="w-full h-[2px] bg-white/5 overflow-hidden rounded-sm">
               <div className="h-full bg-white animate-[fill-progress_1.5s_ease-in-out_forwards]" />
            </div>
            <p className="text-[#6b6b80] tracking-[6px] text-sm animate-[pulse-text_1.5s_infinite] font-montserrat font-bold">INITIALIZING</p>
         </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-[100dvh] relative overflow-hidden flex flex-col ${theme}`}>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      {/* 1. Background Layer (Fixed, never moves) */}
      <AwakenedBackground isAwakened={isAwakened} bgStyle={bgStyle} theme={theme} />

      {/* 2. Awakening Overlays */}
      {awakening && (
        <div className="fixed inset-0 z-[100000] pointer-events-none">
          <div 
            className={`absolute inset-0 transition-all duration-1000 pointer-events-auto ${awakening.phase === 'prompt' ? 'backdrop-blur-xl bg-black/40' : 'backdrop-blur-none bg-transparent pointer-events-none'}`}
          />
          
          <div className="screen-flash-overlay" style={{ opacity: awakening.phase === 'shockwave' ? undefined : 0, animation: awakening.phase === 'shockwave' ? 'screen-flash 3s ease-out forwards' : 'none' }} />
          
          {awakening.phase === 'shockwave' && (
            <>
              <div className="shockwave-core" style={{ left: '50%', top: '35%' }} />
              <div className="rgb-shockwave rgb-shockwave-1" style={{ left: '50%', top: '35%' }} />
              <div className="rgb-shockwave rgb-shockwave-2" style={{ left: '50%', top: '35%' }} />
              <div className="rgb-shockwave rgb-shockwave-3" style={{ left: '50%', top: '35%' }} />
              <div className="rgb-shockwave rgb-shockwave-glitch" style={{ left: '50%', top: '35%' }} />
              <div className="light-streak" style={{ left: '50%', top: '35%' }} />
              <div className="particle-burst" style={{ left: '50%', top: '35%' }}>
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="particle" style={{ '--angle': `${i * 22.5}deg` } as any} />
                ))}
              </div>
            </>
          )}

          <div 
            className={`avatar-awakening flex justify-center items-center ${awakening.phase === 'moving-out' ? 'avatar-moving-out' : 'avatar-moving-in'}`}
            style={{ 
              '--start-x': `${awakening.startX}px`, 
              '--start-y': `${awakening.startY}px`,
              width: awakening.width,
              height: awakening.height,
            } as any}
          >
             <div className="absolute -inset-[2px] sm:-inset-[3px] rounded-full z-[1] opacity-100 animate-[spin-aura_3s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00f0ff, #bd00ff, #ff00ff, #ff0000)' }}></div>
             <img src="https://i.ibb.co/ns3LTFwp/Picsart-26-02-28-11-29-26-443.jpg" className="absolute inset-0 w-full h-full rounded-full object-cover z-[2] border-2 border-white dark:border-[#08080c]" alt="Commander" />
          </div>

          <div className={`fixed inset-0 z-[100005] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-1000 ${awakening.phase === 'prompt' ? 'opacity-100' : 'opacity-0'}`}>
             <div className={`flex flex-col items-center gap-8 pointer-events-auto transition-transform duration-1000 ${awakening.phase === 'prompt' ? 'translate-y-[18vh]' : 'translate-y-[23vh]'}`}>
                <h2 className="text-sm sm:text-2xl font-black text-white tracking-[2px] sm:tracking-[8px] text-center drop-shadow-[0_0_25px_rgba(0,242,255,1)] font-montserrat animate-[pulse-text_2s_infinite] max-w-[90vw] mx-auto leading-relaxed">
                  ARE YOU READY FOR AWAKENING?
                </h2>
                <div className="flex gap-8">
                   <button 
                     onClick={() => handleAwakeningResponse(true)}
                     className="px-10 py-3 bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-50 font-bold tracking-[0.2em] rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] hover:border-cyan-400 group relative overflow-hidden"
                   >
                     <span className="relative z-10">YES</span>
                     <div className="absolute inset-0 bg-cyan-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   </button>
                   <button 
                     onClick={() => handleAwakeningResponse(false)}
                     className="px-10 py-3 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-400/50 text-rose-50 font-bold tracking-[0.2em] rounded-full backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:border-rose-400 group relative overflow-hidden"
                   >
                     <span className="relative z-10">NO</span>
                     <div className="absolute inset-0 bg-rose-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Layer (Flex Column) */}
      <div className={`flex-1 flex flex-col min-h-0 z-10 relative ${isSidebarOpen ? 'md:pl-72' : ''} transition-all duration-300`}>
        
        {/* Settings Modal - Full Screen Refined */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-[#050508] animate-in fade-in duration-300 overflow-y-auto custom-scrollbar transform-gpu overscroll-contain">
            <div className="absolute inset-0 bg-slate-50/80 dark:bg-[#050508]/80 backdrop-blur-md -z-10" />
            <div className="w-full min-h-full max-w-6xl mx-auto flex flex-col md:flex-row relative">
              
              {/* Close Button */}
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors z-50 shadow-sm"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </button>

              {/* Settings Sidebar */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 p-6 flex flex-col gap-6 shrink-0">
                <div className="flex flex-col items-center text-center gap-3 mt-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white dark:border-[#0a0a0c] shadow-md relative ring-4 ring-cyan-500/5">
                    <img src="https://i.ibb.co/ns3LTFwp/Picsart-26-02-28-11-29-26-443.jpg" alt="Commander Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2">
                    <h2 className="text-lg font-montserrat font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{commanderName}</h2>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <button 
                    onClick={() => setActiveSettingsTab('general')}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-bold text-[0.8rem] text-left uppercase tracking-wider ${activeSettingsTab === 'general' ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}
                  >
                    <User className="w-5 h-5" />
                    General
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('advanced')}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-bold text-[0.8rem] text-left uppercase tracking-wider ${activeSettingsTab === 'advanced' ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}
                  >
                    <Sliders className="w-5 h-5" />
                    Advanced
                  </button>
                </div>
              </div>

              {/* Settings Content - Scrollable area */}
              <div className="flex-1 p-6 md:p-10">
                <div className="max-w-2xl mx-auto pb-20">
                  
                  {activeSettingsTab === 'general' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <section className="space-y-6">
                        <h3 className="text-2xl font-montserrat font-bold text-slate-900 dark:text-white tracking-tight">Identity & Appearance</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Commander Name</label>
                            <input 
                              type="text" 
                              value={commanderName}
                              onChange={(e) => setCommanderName(e.target.value)}
                              className="w-full bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[0.85rem] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-sm"
                              placeholder="Enter Commander Name..."
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Accent Color</label>
                            <div className="flex gap-2 p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl h-[50px] items-center px-3">
                              {(['cyan', 'violet', 'emerald', 'rose'] as const).map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setAccentColor(color)}
                                  className={`w-6 h-6 rounded-full transition-all transform hover:scale-110 ${accentColor === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-white scale-110' : 'opacity-60'}`}
                                  style={{ backgroundColor: color === 'cyan' ? '#06b6d4' : color === 'violet' ? '#8b5cf6' : color === 'emerald' ? '#10b981' : '#f43f5e' }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Holographic Background</label>
                          <div className="grid grid-cols-3 gap-3">
                            {(['default', 'nebula', 'cyber-grid'] as const).map((style) => (
                              <button
                                key={style}
                                onClick={() => setBgStyle(style)}
                                className={`py-3 text-[0.7rem] font-bold rounded-xl border transition-all ${bgStyle === style ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-700 dark:text-cyan-400' : 'bg-white dark:bg-[#0a0a0c] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'}`}
                              >
                                {style.replace('-', ' ').toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Interface Theme</label>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setTheme('light')}
                              className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl border font-bold text-[0.8rem] transition-all ${theme === 'light' ? 'bg-amber-500/10 border-amber-500/50 text-amber-600' : 'bg-white dark:bg-[#0a0a0c] border-slate-200 dark:border-white/10 text-slate-500'}`}
                            >
                              <Sun className="w-5 h-5" /> LIGHT
                            </button>
                            <button 
                              onClick={() => setTheme('dark')}
                              className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl border font-bold text-[0.8rem] transition-all ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-white dark:bg-[#0a0a0c] border-slate-200 dark:border-white/10 text-slate-500'}`}
                            >
                              <Moon className="w-5 h-5" /> DARK
                            </button>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-6 pt-10 border-t border-slate-200 dark:border-white/5">
                        <h3 className="text-2xl font-montserrat font-bold text-slate-900 dark:text-white tracking-tight">Chat Experience</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Message Density</label>
                            <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                              {(['compact', 'comfortable'] as const).map((density) => (
                                <button
                                  key={density}
                                  onClick={() => setMessageDensity(density)}
                                  className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${messageDensity === density ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                  {density.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Bubble Style</label>
                            <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                              {(['glass', 'solid'] as const).map((style) => (
                                <button
                                  key={style}
                                  onClick={() => setBubbleStyle(style)}
                                  className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${bubbleStyle === style ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                  {style.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center justify-between cursor-pointer p-4 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-cyan-500/50 transition-all">
                            <div>
                              <span className="text-[0.85rem] font-black text-slate-900 dark:text-white block uppercase tracking-wide">Enter to Send</span>
                              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">Instant transmission.</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${enterToSend ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`} onClick={() => setEnterToSend(!enterToSend)}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${enterToSend ? 'left-5.5' : 'left-0.5'}`} />
                            </div>
                          </label>

                          <label className="flex items-center justify-between cursor-pointer p-4 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-cyan-500/50 transition-all">
                            <div>
                              <span className="text-[0.85rem] font-black text-slate-900 dark:text-white block uppercase tracking-wide">Sound Effects</span>
                              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">System audio.</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${soundEnabled ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`} onClick={() => setSoundEnabled(!soundEnabled)}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${soundEnabled ? 'left-5.5' : 'left-0.5'}`} />
                            </div>
                          </label>

                          <label className="flex items-center justify-between cursor-pointer p-4 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-cyan-500/50 transition-all">
                            <div>
                              <span className="text-[0.85rem] font-black text-slate-900 dark:text-white block uppercase tracking-wide">Animations</span>
                              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">Visual effects.</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${messageAnimation ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`} onClick={() => setMessageAnimation(!messageAnimation)}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${messageAnimation ? 'left-5.5' : 'left-0.5'}`} />
                            </div>
                          </label>

                          <label className="flex items-center justify-between cursor-pointer p-4 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-cyan-500/50 transition-all">
                            <div>
                              <span className="text-[0.85rem] font-black text-slate-900 dark:text-white block uppercase tracking-wide">Show Avatars</span>
                              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">Profile icons.</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${showAvatars ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`} onClick={() => setShowAvatars(!showAvatars)}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${showAvatars ? 'left-5.5' : 'left-0.5'}`} />
                            </div>
                          </label>
                        </div>
                      </section>

                      <section className="pt-10 border-t border-slate-200 dark:border-white/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button 
                            onClick={handleExportChat}
                            className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-[0.8rem] hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5 uppercase tracking-wider"
                          >
                            <Download className="w-5 h-5" /> Export History
                          </button>
                          <button 
                            onClick={() => { if(confirm('Reset all settings to default?')) resetSettings(); }}
                            className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[0.8rem] hover:bg-rose-500/20 transition-all border border-rose-500/20 uppercase tracking-wider"
                          >
                            <RotateCcw className="w-5 h-5" /> Reset Settings
                          </button>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeSettingsTab === 'advanced' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <section className="space-y-6">
                        <h3 className="text-2xl font-montserrat font-bold text-slate-900 dark:text-white tracking-tight">AI Core Parameters</h3>
                        
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Response Length</label>
                            <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                              {(['short', 'balanced', 'detailed'] as const).map((len) => (
                                <button
                                  key={len}
                                  onClick={() => setResponseLength(len)}
                                  className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${responseLength === len ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                  {len.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Typing Speed (ms)</label>
                              <span className="text-[0.7rem] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">{typingSpeed}ms</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" step="5" 
                              value={typingSpeed} onChange={(e) => setTypingSpeed(parseInt(e.target.value))}
                              className="w-full accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Temperature</label>
                              <span className="text-[0.7rem] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">{temperature.toFixed(1)}</span>
                            </div>
                            <input 
                              type="range" min="0" max="2" step="0.1" 
                              value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
                              className="w-full accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">System Instructions</label>
                            <textarea 
                              value={systemInstruction}
                              onChange={(e) => setSystemInstruction(e.target.value)}
                              className="w-full bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/50 transition-all h-40 resize-none text-[0.8rem] custom-scrollbar shadow-sm leading-relaxed font-medium"
                              placeholder="Define the AI's core persona..."
                            />
                          </div>
                        </div>
                      </section>

                      <section className="pt-10 border-t border-slate-200 dark:border-white/5">
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                              clearAllSessions();
                              setIsSettingsOpen(false);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 font-black text-[0.8rem] uppercase tracking-wider hover:bg-red-500/10 transition-all shadow-sm"
                        >
                          <Trash2 className="w-5 h-5" /> Wipe All Data
                        </button>
                      </section>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`fixed md:static inset-y-0 left-0 z-50 w-72 glass-panel premium-shadow border-y-0 border-l-0 border-r border-slate-200/30 dark:border-white/5 flex flex-col transition-transform duration-300 ease-in-out will-change-transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'
          }`}
        >
          <div className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-2 font-montserrat font-bold text-slate-900 dark:text-white">
              <span className="text-cyan-600 dark:text-[#00f2ff]">TIME</span> LINES
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg md:hidden transition-colors"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-4">
            <button 
              type="button"
              onClick={handleCreateNewSession}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] font-bold text-xs border border-white/20 uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              NEW AWAKENING
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar touch-pan-y transform-gpu overscroll-contain">
            <div className="text-[0.65rem] font-bold text-slate-500 dark:text-[#6b6b80] uppercase tracking-[0.3em] mb-3 px-4 mt-2">
              Recent Timelines
            </div>
            {sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`group relative flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  currentSessionId === session.id 
                    ? isAwakened 
                      ? 'bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(0,242,255,0.15)] border border-cyan-500/40 backdrop-blur-md'
                      : 'bg-white dark:bg-white/10 text-cyan-700 dark:text-white shadow-md border border-cyan-200/50 dark:border-white/10 backdrop-blur-md' 
                    : `hover:bg-white/50 dark:hover:bg-white/5 border border-transparent ${isAwakened ? 'text-slate-300 hover:text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`
                }`}
              >
                {currentSessionId === session.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(0,242,255,1)]" />
                )}
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${currentSessionId === session.id ? 'text-cyan-600 dark:text-[#00f2ff]' : isAwakened ? 'text-slate-400 group-hover:text-cyan-400' : 'text-slate-400 dark:text-[#6b6b80] group-hover:text-cyan-500'}`} />
                  <div className="truncate text-sm font-semibold tracking-tight">
                    {session.title}
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className={`p-1.5 hover:bg-slate-200 dark:hover:bg-black/50 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 ${isAwakened ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 dark:text-[#6b6b80] hover:text-red-500 dark:hover:text-red-400'}`}
                  title="Delete timeline"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center text-slate-500 dark:text-[#6b6b80] text-sm py-12 px-6 font-medium">
                No timelines yet. Initiate an awakening.
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200/50 dark:border-white/5 space-y-2">
            {sessions.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all timelines?')) {
                    clearAllSessions();
                  }
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-transparent"
              >
                <Trash2 className="w-4 h-4" />
                CLEAR ALL TIMELINES
              </button>
            )}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <Settings className="w-4 h-4" />
              SYSTEM SETTINGS
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          {/* Header */}
          <header className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200/30 dark:border-white/5 glass-panel premium-shadow !border-t-0 !border-l-0 !border-r-0 z-10 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 w-1/4">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 sm:p-2.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-[#a0a0a0]"
                >
                  <PanelLeftOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-center w-2/4">
              <h1 className="flex items-center gap-3 sm:gap-4 font-montserrat font-bold text-xl sm:text-2xl tracking-[2px] sm:tracking-[4px] text-slate-900 dark:text-[#e0e0e0]">
                <span>LOKI</span>
                <div className="w-10 h-5 sm:w-14 sm:h-8">
                  <HeaderInfinityLogo />
                </div>
                <span className="text-[0.65rem] sm:text-[0.75rem] tracking-[2px] sm:tracking-[3px] font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-cyan-500/50 dark:border-[#00f2ff]/50 text-cyan-600 dark:text-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.3)] dark:shadow-[0_0_20px_rgba(0,242,255,0.4)] bg-cyan-500/10">PRIME</span>
              </h1>
            </div>

            <div className="flex items-center justify-end gap-4 sm:gap-6 w-1/4">
              <div 
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer flex justify-center items-center hover:scale-110 transition-transform ${awakening ? 'opacity-0' : 'opacity-100'}`} 
                title={commanderName}
                onClick={triggerAwakening}
              >
                 <div className="absolute -inset-[2px] sm:-inset-[3px] rounded-full z-[1] opacity-100 animate-[spin-aura_3s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00f0ff, #bd00ff, #ff00ff, #ff0000)' }}></div>
                 <img src="https://i.ibb.co/ns3LTFwp/Picsart-26-02-28-11-29-26-443.jpg" className="w-full h-full rounded-full object-cover z-[2] border-2 border-white dark:border-[#08080c]" alt="Commander" />
              </div>
            </div>
          </header>

          {/* Chat Area - Scrollable */}
          <div className={`flex-1 overflow-x-hidden custom-scrollbar relative w-full transform-gpu scroll-smooth ${(!currentSession || currentSession.messages.length === 0) ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}>
            <div className={`w-full max-w-4xl mx-auto px-3 sm:px-6 h-full flex flex-col ${(!currentSession || currentSession.messages.length === 0) ? 'justify-center items-center' : 'pt-4 space-y-6 sm:space-y-8'}`}>
              {!currentSession || currentSession.messages.length === 0 ? (
                <div 
                  className="flex flex-col items-center justify-center text-center space-y-8 w-full h-full touch-none select-none"
                  onTouchMove={(e) => e.preventDefault()} // CRITICAL: Stop pull-to-refresh/scroll on empty state
                >
                   <div className={`relative flex justify-center items-center transition-all duration-700 ${isAwakened ? 'w-full max-w-[480px] sm:max-w-[700px] aspect-[2/1]' : 'w-full max-w-[200px] sm:max-w-[280px] aspect-[2/1]'}`}>
                      {isAwakened ? (
                        <div className="relative w-full h-full krishna-awakened-sticker flex items-center justify-center">
                          <div className="absolute inset-0 devil-sticker-border opacity-100"></div>
                          <img src="https://i.ibb.co/ch1LzzTD/Picsart-26-03-05-20-52-27-601.png" alt="Loki Prime Logo" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_25px_rgba(0,242,255,0.4)]" />
                        </div>
                      ) : (
                        <InfinityLogo />
                      )}
                   </div>
                   <div className="relative">
                     <p className={`text-slate-500 dark:text-[#6b6b80] tracking-[4px] sm:tracking-[8px] text-[0.65rem] sm:text-xs font-montserrat font-bold uppercase drop-shadow-sm px-4 transition-all duration-1000 ${isAwakened ? 'text-cyan-300 animate-pulse' : 'opacity-80 hover:opacity-100'}`} style={isAwakened ? { textShadow: '0 0 15px rgba(0,242,255,0.6)' } : {}}>
                        {isAwakened ? 'SYSTEM AWAKENED. AWAITING INPUT.' : `AWAITING COMMAND, ${commanderName.toUpperCase()}.`}
                     </p>
                     {isAwakened && (
                       <div className="absolute -inset-4 bg-cyan-500/5 blur-xl rounded-full -z-10 animate-pulse"></div>
                     )}
                   </div>
                </div>
              ) : (
                <>
                  {renderedMessages}
                  <div ref={messagesEndRef} className="h-2 sm:h-4" />
                </>
              )}
            </div>
          </div>

          {/* Input Area - Flex Item (Not Absolute) */}
          <div className="shrink-0 z-20">
            <ChatInput
              ref={inputRef}
              isAwakened={isAwakened}
              isLoading={isLoading}
              modelMode={modelMode}
              setModelMode={setModelMode}
              onSendMessage={handleSendMessage}
              onDeleteSession={handleDeleteSession}
              currentSessionId={currentSessionId}
              onStopGeneration={stopGeneration}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
