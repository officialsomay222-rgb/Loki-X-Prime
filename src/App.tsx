import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { AwakenedBackground } from './components/AwakenedBackground';
import { CommandPalette } from './components/CommandPalette';
import { useSettings } from './contexts/SettingsContext';
import { useChat } from './contexts/ChatContext';
import { InfinityLogo, HeaderInfinityLogo } from './components/Logos';
import { format, isToday } from 'date-fns';
import { TaskWidget } from './features/tasks/components/TaskWidget';
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Trash2, 
  PanelLeftClose, 
  PanelLeftOpen,
  User as UserIcon,
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
  Volume2,
  CheckCircle2,
  LogOut,
  LogIn
} from 'lucide-react';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true); // Enabled booting
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [awakening, setAwakening] = useState<{id: number, phase: string, startX: number, startY: number, width: number, height: number, isDeactivating?: boolean} | null>(null);
  const [input, setInput] = useState('');
  
  const { 
    theme, setTheme, 
    bgStyle, setBgStyle, 
    commanderName, setCommanderName, 
    modelMode, setModelMode, 
    tone, setTone,
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
    thinkingMode, setThinkingMode,
    searchGrounding, setSearchGrounding,
    imageSize, setImageSize,
    liveAudioEnabled, setLiveAudioEnabled,
    animationSpeed, setAnimationSpeed,
    borderRadius, setBorderRadius,
    textReveal, setTextReveal,
    appWidth, setAppWidth,
    glowIntensity, setGlowIntensity,
    resetSettings
  } = useSettings();
  const { sessions, currentSessionId, isLoading, createNewSession, deleteSession, deleteMessage, clearAllSessions, clearSessionMessages, setCurrentSessionId, sendMessage, stopGeneration } = useChat();
  
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

  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 1500);
    
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(skipTimer);
    };
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

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [currentSession?.messages.length, currentSessionId, autoScroll]);

  const handleSendMessage = useCallback(async (text: string, isImageMode?: boolean, audioUrl?: boolean | string) => {
    await sendMessage(text, isImageMode, typeof audioUrl === 'string' ? audioUrl : undefined);
    if (window.innerWidth >= 768) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [sendMessage]);

  const handleDeleteSession = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSession(id);
  }, [deleteSession]);

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

  const handleCreateNewSession = useCallback(() => {
    createNewSession();
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [createNewSession]);

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
      setIsAwakened(!isAwakened);
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
        onEdit={message.role === 'user' ? (text) => {
          setInput(text);
          inputRef.current?.focus();
        } : undefined}
        onDelete={(id) => currentSessionId && deleteMessage(currentSessionId, id)}
        formatDate={formatDate}
        bubbleStyle={bubbleStyle}
        fontSize={fontSize}
        messageAnimation={messageAnimation}
        textReveal={textReveal}
        animationSpeed={animationSpeed}
        accentColor={accentColor}
        messageDensity={messageDensity}
        showAvatars={showAvatars}
      />
    ));
  }, [currentSession?.messages, isAwakened, commanderName, copiedId, copyToClipboard, formatDate, bubbleStyle, fontSize, messageAnimation, textReveal, animationSpeed, accentColor, messageDensity, showAvatars, setInput, currentSessionId, deleteMessage]);

  if (isBooting) {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#08080c] z-[9999] flex flex-col justify-between items-center transition-opacity duration-700 pb-12 pt-24">
         <div className="flex flex-col items-center justify-center gap-8 w-full max-w-[300px] my-auto mx-auto">
            <div className="w-full max-w-[240px] aspect-[2/1] relative flex justify-center items-center">
               <InfinityLogo />
            </div>
            <div className="w-full h-[2px] bg-white/5 overflow-hidden rounded-sm">
               <div className="h-full bg-white animate-[fill-progress_1.5s_ease-in-out_forwards]" />
            </div>
            <p className="text-[#6b6b80] tracking-[6px] text-sm animate-[pulse-text_1.5s_infinite] font-montserrat font-bold uppercase">
              INITIALIZING SYSTEM
            </p>
            {showSkip && (
              <button 
                onClick={() => setIsBooting(false)}
                className="mt-6 px-4 py-2 border border-cyan-500/30 rounded-lg text-cyan-500 text-[10px] font-bold tracking-[2px] hover:bg-cyan-500/10 transition-all animate-pulse"
              >
                FORCE START SYSTEM
              </button>
            )}
         </div>
         <div className="mt-auto mb-8">
            <h1 className="text-2xl sm:text-3xl font-black tracking-[0.3em] font-montserrat uppercase animate-[rgb-text_4s_linear_infinite] drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]" style={{
              backgroundImage: 'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #00f0ff, #bd00ff, #ff00ff, #ff0000)',
              backgroundSize: '200% auto',
              color: 'white',
              WebkitTextFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text'
            }}>
              LOKI X PRIME
            </h1>
         </div>
      </div>
    );
  }


  const fontClass = fontStyle === 'sans' ? 'font-sans' : fontStyle === 'serif' ? 'font-serif' : 'font-mono';
  const radiusVar = borderRadius === 'sharp' ? '0px' : borderRadius === 'pill' ? '9999px' : '0.75rem';
  const appWidthClass = appWidth === 'narrow' ? 'max-w-2xl' : appWidth === 'wide' ? 'max-w-6xl' : 'max-w-4xl';
  const glowOpacity = glowIntensity === 'low' ? '0.2' : glowIntensity === 'high' ? '0.8' : '0.5';

  return (
    <div 
      className={`w-full h-[100dvh] relative overflow-hidden flex flex-col ${theme} ${isAwakened ? 'awakened-mode' : ''} ${fontClass}`}
      style={{ 
        '--global-radius': radiusVar,
        '--glow-opacity': glowOpacity,
      } as React.CSSProperties}
    >
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      {/* 1. Background Layer (Fixed, never moves) */}
      <AwakenedBackground isAwakened={isAwakened} bgStyle={bgStyle} theme={theme} />

      {/* 2. Awakening Overlays */}
      {awakening && (
        <div className="fixed inset-0 z-[100000] pointer-events-none">
          <div className="bootloader-border" />
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
             <img src={"https://i.ibb.co/ns3LTFwp/Picsart-26-02-28-11-29-26-443.jpg"} className="absolute inset-0 w-full h-full rounded-full object-cover z-[2] border-2 border-white dark:border-[#08080c]" alt="Commander" />
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

      {/* Tasks Modal */}
      {isTasksOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button 
              onClick={() => setIsTasksOpen(false)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <TaskWidget />
          </div>
        </div>
      )}

      {/* Settings Modal - Full Screen Refined */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-50/95 dark:bg-[#050508]/95 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto custom-scrollbar transform-gpu overscroll-contain">
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-[#050508]/50 backdrop-blur-3xl -z-10" />
          <div className="w-full min-h-full max-w-6xl mx-auto flex flex-col md:flex-row relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/20 transition-colors z-[100] shadow-md backdrop-blur-md"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-slate-700 dark:text-slate-200" />
            </button>

            {/* Settings Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 p-6 flex flex-col gap-6 shrink-0">
              <div className="flex flex-col items-center text-center gap-3 mt-3">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white dark:border-[#0a0a0c] shadow-md relative ring-4 ring-cyan-500/5">
                  <img src={"https://i.ibb.co/ns3LTFwp/Picsart-26-02-28-11-29-26-443.jpg"} alt="Commander Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="mt-2">
                  <h2 className="text-lg font-montserrat font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{commanderName}</h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">guest@loki.prime</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <button 
                  onClick={() => setActiveSettingsTab('general')}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-bold text-[0.8rem] text-left uppercase tracking-wider ${activeSettingsTab === 'general' ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}`}
                >
                  <UserIcon className="w-5 h-5" />
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

                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Assistant Tone</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(['formal', 'casual', 'happy', 'custom'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTone(t)}
                              className={`py-3 text-[0.7rem] font-bold rounded-xl border transition-all ${tone === t ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-700 dark:text-cyan-400' : 'bg-white dark:bg-[#0a0a0c] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'}`}
                            >
                              {t.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Model Core</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'pro', label: 'PRO THINKING' },
                            { id: 'fast', label: 'FAST CORE' },
                            { id: 'happy', label: 'HAPPY MODEL' }
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setModelMode(m.id as any)}
                              className={`py-3 text-[0.7rem] font-bold rounded-xl border transition-all ${modelMode === m.id ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-700 dark:text-cyan-400' : 'bg-white dark:bg-[#0a0a0c] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'}`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Font Style</label>
                        <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                          {(['sans', 'serif', 'mono'] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => setFontStyle(style)}
                              className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${fontStyle === style ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              {style.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Font Size</label>
                        <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                          {(['small', 'medium', 'large'] as const).map((size) => (
                            <button
                              key={size}
                              onClick={() => setFontSize(size)}
                              className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${fontSize === size ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              {size.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">App Width</label>
                        <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                          {(['narrow', 'normal', 'wide'] as const).map((width) => (
                            <button
                              key={width}
                              onClick={() => setAppWidth(width)}
                              className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${appWidth === width ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              {width.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Glow Intensity</label>
                        <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                          {(['low', 'medium', 'high'] as const).map((intensity) => (
                            <button
                              key={intensity}
                              onClick={() => setGlowIntensity(intensity)}
                              className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${glowIntensity === intensity ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              {intensity.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Border Radius</label>
                        <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                          {(['sharp', 'rounded', 'pill'] as const).map((radius) => (
                            <button
                              key={radius}
                              onClick={() => setBorderRadius(radius)}
                              className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${borderRadius === radius ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              {radius.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Text Reveal Animation</label>
                        <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                          {(['none', 'fade', 'typewriter'] as const).map((reveal) => (
                            <button
                              key={reveal}
                              onClick={() => setTextReveal(reveal)}
                              className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${textReveal === reveal ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              {reveal.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Animation Speed</label>
                        <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                          {(['slow', 'normal', 'fast'] as const).map((speed) => (
                            <button
                              key={speed}
                              onClick={() => setAnimationSpeed(speed)}
                              className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${animationSpeed === speed ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              {speed.toUpperCase()}
                            </button>
                          ))}
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
                      </div>
                    </section>
                  </div>
                )}

                {activeSettingsTab === 'advanced' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <section className="space-y-6">
                      <h3 className="text-2xl font-montserrat font-bold text-slate-900 dark:text-white tracking-tight">AI Core Parameters</h3>
                      
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-center justify-between cursor-pointer p-4 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-cyan-500/50 transition-all">
                            <div>
                              <span className="text-[0.85rem] font-black text-slate-900 dark:text-white block uppercase tracking-wide">Thinking Mode</span>
                              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">High intelligence reasoning.</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${thinkingMode ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`} onClick={() => setThinkingMode(!thinkingMode)}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${thinkingMode ? 'left-5.5' : 'left-0.5'}`} />
                            </div>
                          </label>

                          <label className="flex items-center justify-between cursor-pointer p-4 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-cyan-500/50 transition-all">
                            <div>
                              <span className="text-[0.85rem] font-black text-slate-900 dark:text-white block uppercase tracking-wide">Search Grounding</span>
                              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">Real-time web data.</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${searchGrounding ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`} onClick={() => setSearchGrounding(!searchGrounding)}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${searchGrounding ? 'left-5.5' : 'left-0.5'}`} />
                            </div>
                          </label>

                          <label className="flex items-center justify-between cursor-pointer p-4 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm hover:border-cyan-500/50 transition-all">
                            <div>
                              <span className="text-[0.85rem] font-black text-slate-900 dark:text-white block uppercase tracking-wide">Live Audio</span>
                              <span className="text-[0.65rem] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">Conversational voice.</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${liveAudioEnabled ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-slate-700'}`} onClick={() => setLiveAudioEnabled(!liveAudioEnabled)}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-md ${liveAudioEnabled ? 'left-5.5' : 'left-0.5'}`} />
                            </div>
                          </label>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[0.7rem] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Image Generation Size</label>
                          <div className="flex p-1 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-xl">
                            {(['1K', '2K', '4K'] as const).map((size) => (
                              <button
                                key={size}
                                onClick={() => setImageSize(size)}
                                className={`flex-1 py-2.5 text-[0.7rem] font-bold rounded-lg transition-all ${imageSize === size ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
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

      {/* 3. Main Content Layer (Flex Column) */}
      <div className={`flex-1 flex flex-col min-h-0 z-10 relative ${isSidebarOpen ? 'md:pl-72' : ''} transition-all duration-300`}>
        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-40 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`fixed inset-y-0 left-0 z-50 w-72 glass-panel premium-shadow border-y-0 border-l-0 border-r border-slate-200/30 dark:border-white/5 flex flex-col transition-transform duration-300 ease-in-out will-change-transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-2 font-montserrat font-bold text-slate-900 dark:text-white">
              <span className="text-cyan-600 dark:text-[#00f2ff]">TIME</span> LINES
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-white"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-4">
            <motion.button 
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              type="button"
              onClick={handleCreateNewSession}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] font-bold text-xs border border-white/20 uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              NEW AWAKENING
            </motion.button>
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
              <motion.button 
                whileTap={{ scale: 0.97 }}
                whileHover={{ filter: "brightness(1.2)" }}
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all timelines?')) {
                    clearAllSessions();
                  }
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-transparent"
              >
                <Trash2 className="w-4 h-4" />
                CLEAR ALL TIMELINES
              </motion.button>
            )}
            <motion.button 
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              onClick={() => setIsTasksOpen(true)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <CheckCircle2 className="w-4 h-4" />
              TASK LIST
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <Settings className="w-4 h-4" />
              SYSTEM SETTINGS
            </motion.button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          {/* Header */}
          <header className="h-16 sm:h-20 flex items-center justify-between px-3 sm:px-8 border-b border-slate-200/30 dark:border-white/5 glass-panel premium-shadow !border-t-0 !border-l-0 !border-r-0 z-10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 sm:p-2.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-white"
                >
                  <PanelLeftOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
            
            <div className="flex items-center justify-center shrink-0">
              {isLoading && currentSession?.messages[currentSession.messages.length - 1]?.role === 'model' && currentSession?.messages[currentSession.messages.length - 2]?.isImage ? (
                <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-2 sm:gap-3 font-montserrat font-bold text-base sm:text-xl tracking-[1px] sm:tracking-[4px] text-cyan-400 drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]">
                    <div className="w-6 h-3 sm:w-10 sm:h-5">
                      <HeaderInfinityLogo />
                    </div>
                    <span className="animate-pulse">GENERATING</span>
                    <span className="flex gap-1">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                </div>
              ) : (
                <h1 className="flex items-center gap-2 sm:gap-4 font-montserrat font-bold text-lg sm:text-2xl tracking-[1px] sm:tracking-[4px] text-slate-900 dark:text-[#e0e0e0]">
                  <span>LOKI</span>
                  <div className="w-8 h-4 sm:w-14 sm:h-8">
                    <HeaderInfinityLogo />
                  </div>
                  <span className="text-[0.55rem] sm:text-[0.75rem] tracking-[1px] sm:tracking-[3px] font-black px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-lg border border-cyan-500/50 dark:border-[#00f2ff]/50 text-cyan-600 dark:text-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.3)] dark:shadow-[0_0_20px_rgba(0,242,255,0.4)] bg-cyan-500/10">PRIME</span>
                </h1>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-6 flex-1">
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
            <div className={`w-full ${appWidthClass} mx-auto px-3 sm:px-6 h-full flex flex-col ${(!currentSession || currentSession.messages.length === 0) ? 'justify-center items-center' : 'pt-4 space-y-6 sm:space-y-8'}`}>
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
                  <div ref={messagesEndRef} className="h-8 sm:h-12 shrink-0" />
                </>
              )}
            </div>
          </div>

          {/* Input Area - Flex Item (Not Absolute) */}
          <div className={`shrink-0 z-20 w-full ${appWidthClass} mx-auto`}>
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
              enterToSend={enterToSend}
              input={input}
              setInput={setInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
