import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInput, ChatInputHandle } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { AwakenedBackground } from './components/AwakenedBackground';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { AppsModal } from './components/AppsModal';
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
  Rocket,
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
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [isBooting, setIsBooting] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  
  const isSettingsOpen = activeModal === 'settings';
  const isAppsOpen = activeModal === 'apps';
  const isCommandPaletteOpen = activeModal === 'commands';

  const openModal = useCallback((modalName: string) => {
    setActiveModal(modalName);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [awakening, setAwakening] = useState<{id: number, phase: string, startX: number, startY: number, width: number, height: number, isDeactivating?: boolean} | null>(null);
  
  const { 
    theme, setTheme, 
    bgStyle, setBgStyle, 
    commanderName, setCommanderName, 
    avatarUrl, setAvatarUrl,
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
    effectInputBox,
    effectMessageBubbles,
    effectSidebar,
    effectBackground,
    effectAvatar,
    sidebarPosition,
    chatAlignment,
    blurIntensity,
    timestampFormat,
    soundTheme,
    codeTheme,
    avatarShape,
    messageShadow,
    resetSettings
  } = useSettings();
  const { sessions, currentSessionId, isLoading, createNewSession, deleteSession, deleteMessage, clearAllSessions, clearSessionMessages, setCurrentSessionId, sendMessage, stopGeneration } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeModal();
        } else {
          openModal('commands');
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNewSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewSession, isCommandPaletteOpen, openModal, closeModal]);

  const [showSkip, setShowSkip] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 4000);
    
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(skipTimer);
    };
  }, []);

  // Handle PWA shortcuts and share target
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('settings') === 'true') {
      openModal('settings');
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
        inputRef.current.setInput(initialMessage);
        // Trigger synthetic change event if needed by ChatInput
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [openModal]);

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
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [currentSession?.messages.length, currentSessionId, autoScroll]);

  // Debounce scroll events to prevent checkerboarding and lag
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList && target.classList.contains('overflow-y-auto')) {
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 400;
        setShowScrollToBottom(!isNearBottom);
      }

      if (!document.body.classList.contains('is-scrolling')) {
        document.body.classList.add('is-scrolling');
      }
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150); // 150ms debounce
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleSendMessage = useCallback(async (text: string, isImageMode?: boolean, audioUrl?: boolean | string, attachments?: { data: string, mimeType: string }[]) => {
    await sendMessage(text, isImageMode, typeof audioUrl === 'string' ? audioUrl : undefined, attachments);
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
           // Activating - Skip prompt, go straight to shockwave
           setAwakening(prev => prev ? { ...prev, phase: 'shockwave' } : null);
           setTimeout(() => {
             setIsAwakened(true);
             setAwakening(prev => prev ? { ...prev, phase: 'moving-out' } : null);
           }, 2500);
           setTimeout(() => {
             setAwakening(null);
           }, 4000);
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
        commanderName={commanderName}
        avatarUrl={avatarUrl}
        copiedId={copiedId}
        onCopy={copyToClipboard}
        onEdit={message.role === 'user' ? (text) => {
          inputRef.current?.setInput(text);
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
        isAwakened={isAwakened || effectMessageBubbles}
        chatAlignment={chatAlignment}
        blurIntensity={blurIntensity}
        timestampFormat={timestampFormat}
        codeTheme={codeTheme}
        avatarShape={avatarShape}
        messageShadow={messageShadow}
      />
    ));
  }, [currentSession?.messages, isAwakened, effectMessageBubbles, commanderName, avatarUrl, copiedId, copyToClipboard, formatDate, bubbleStyle, fontSize, messageAnimation, textReveal, animationSpeed, accentColor, messageDensity, showAvatars, currentSessionId, deleteMessage, chatAlignment, blurIntensity, timestampFormat, codeTheme, avatarShape, messageShadow]);

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
                className="mt-6 px-4 py-2 border border-cyan-500/30 rounded-lg text-cyan-500 text-[10px] font-bold tracking-[2px] hover:bg-cyan-500/10 transition-all animate-pulse gpu-accelerate"
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
  const radiusVar = borderRadius === 'sharp' ? '0px' : borderRadius === 'pill' ? '9999px' : '16px';
  const appWidthClass = appWidth === 'narrow' ? 'max-w-2xl' : appWidth === 'wide' ? 'max-w-6xl' : 'max-w-4xl';
  const glowOpacity = glowIntensity === 'low' ? '0.2' : glowIntensity === 'high' ? '0.8' : '0.5';

  return (
    <div 
      className={`w-full h-[100dvh] relative overflow-hidden flex flex-col ${theme} ${isAwakened ? 'awakened-mode' : ''} ${fontClass}`}
    >
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeModal} />
      {/* 1. Background Layer (Fixed, never moves) */}
      <AwakenedBackground isAwakened={isAwakened || effectBackground} bgStyle={bgStyle} theme={theme} />

      {/* 2. Awakening Overlays */}
      {awakening && (
        <div className="fixed inset-0 z-[100000] pointer-events-none">
          <div className="bootloader-border" />
          
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
             <div className="absolute -inset-[2px] sm:-inset-[3px] rounded-full z-[1] opacity-100 animate-spin-aura bg-cyan-500/50 shadow-[0_0_15px_rgba(0,242,255,0.5)]"></div>
             <img src={"https://i.ibb.co/ns3LTFwp/Picsart-26-02-28-11-29-26-443.jpg"} className="absolute inset-0 w-full h-full rounded-full object-cover z-[2] border-2 border-white dark:border-[#08080c]" alt="Commander" />
          </div>
        </div>
      )}

      {/* Apps Modal */}
      <AppsModal 
        isOpen={isAppsOpen} 
        onClose={closeModal} 
        commanderName={commanderName}
      />

      {/* Settings Modal - Full Screen Refined */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={closeModal} 
        onExportChat={handleExportChat}
        onClearAllChats={clearAllSessions}
      />

      {/* 3. Main Content Layer (Flex Row/Column) */}
      <div className={`flex-1 flex min-h-0 z-10 relative ${isSidebarOpen ? (sidebarPosition === 'right' ? 'md:pr-72' : 'md:pl-72') : ''} ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'} transition-all duration-300`}>
        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/85 dark:bg-black/85 z-40 md:hidden gpu-accelerate"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div 
          initial={false}
          animate={{ x: isSidebarOpen ? 0 : (sidebarPosition === 'right' ? '100%' : '-100%') }}
          transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.5 }}
          className={`fixed inset-y-0 ${sidebarPosition === 'right' ? 'right-0 border-l' : 'left-0 border-r'} z-50 w-72 bg-[#f8fafc] dark:bg-[#0a0a0a] shadow-2xl border-y-0 border-slate-200/30 dark:border-white/5 flex flex-col transform-gpu gpu-accelerate`}
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
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] font-bold text-xs border border-white/20 uppercase tracking-widest gpu-accelerate"
            >
              <Plus className="w-4 h-4" />
              NEW AWAKENING
            </motion.button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar touch-pan-y transform-gpu overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)', willChange: 'transform' }}>
            <div className="text-[0.65rem] font-bold text-slate-500 dark:text-[#6b6b80] uppercase tracking-[0.3em] mb-3 px-4 mt-2">
              Recent Timelines
            </div>
            <AnimatePresence>
              {sessions.map((session, index) => (
                <motion.div 
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`group relative flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    currentSessionId === session.id 
                      ? (isAwakened || effectSidebar)
                        ? 'bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(0,242,255,0.15)] border border-cyan-500/40'
                        : 'bg-white dark:bg-white/10 text-cyan-700 dark:text-white shadow-md border border-cyan-200/50 dark:border-white/10' 
                      : `hover:bg-white/50 dark:hover:bg-white/5 border border-transparent ${(isAwakened || effectSidebar) ? 'text-slate-300 hover:text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`
                  }`}
                >
                  {currentSessionId === session.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(0,242,255,1)]" />
                  )}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${currentSessionId === session.id ? 'text-cyan-600 dark:text-[#00f2ff]' : (isAwakened || effectSidebar) ? 'text-slate-400 group-hover:text-cyan-400' : 'text-slate-400 dark:text-[#6b6b80] group-hover:text-cyan-500'}`} />
                    <div className="truncate text-sm font-semibold tracking-tight">
                      {session.title}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className={`p-1.5 hover:bg-slate-200 dark:hover:bg-black/50 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 ${(isAwakened || effectSidebar) ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 dark:text-[#6b6b80] hover:text-red-500 dark:hover:text-red-400'}`}
                    title="Delete timeline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {sessions.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-slate-500 dark:text-[#6b6b80] text-sm py-12 px-6 font-medium"
              >
                No timelines yet. Initiate an awakening.
              </motion.div>
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
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all border border-transparent"
              >
                <Trash2 className="w-4 h-4" />
                CLEAR ALL TIMELINES
              </motion.button>
            )}
            <motion.button 
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              onClick={() => openModal('apps')}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <Rocket className="w-4 h-4" />
              TRY OUR APPS
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              onClick={() => openModal('settings')}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <Settings className="w-4 h-4" />
              SYSTEM SETTINGS
            </motion.button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          {/* Header */}
          <header className="h-16 sm:h-20 flex items-center justify-between px-3 sm:px-8 border-b border-slate-200/30 dark:border-white/5 glass-panel premium-shadow !border-t-0 !border-l-0 !border-r-0 z-10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 sm:p-2.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-white"
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
              {currentSession && currentSession.messages.length > 0 && (
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (isConfirmingClear) {
                      if (currentSessionId) clearSessionMessages(currentSessionId);
                      setIsConfirmingClear(false);
                    } else {
                      setIsConfirmingClear(true);
                      setTimeout(() => setIsConfirmingClear(false), 3000);
                    }
                  }}
                  className={`p-2 rounded-lg transition-all flex items-center gap-2 group ${isConfirmingClear ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white'}`}
                  title={isConfirmingClear ? "Click again to confirm" : "Clear timeline"}
                >
                  <RotateCcw className={`w-5 h-5 ${isConfirmingClear ? 'animate-spin' : 'group-hover:rotate-[-45deg] transition-transform'}`} />
                  {isConfirmingClear && <span className="text-[10px] font-black tracking-tighter hidden sm:inline">CONFIRM?</span>}
                </motion.button>
              )}
              <div 
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer flex justify-center items-center hover:scale-110 transition-transform ${awakening ? 'opacity-0' : 'opacity-100'}`} 
                title={commanderName}
                onClick={triggerAwakening}
              >
                 {(isAwakened || effectAvatar) && (
                   <div className="absolute -inset-[2px] sm:-inset-[3px] rounded-full z-[1] opacity-100 animate-spin-aura" style={{
                     background: 'conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00f0ff, #bd00ff, #ff00ff, #ff0000)',
                     boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)'
                   }}></div>
                 )}
                 <div className="w-full h-full rounded-full overflow-hidden z-[2] border-2 border-white dark:border-[#08080c] relative">
                   <img src="https://i.ibb.co/ns3LTFwp/Picsart-26-02-28-11-29-26-443.jpg" className="w-full h-full object-cover" alt="Commander" />
                 </div>
              </div>
            </div>
          </header>

          {/* Chat Area - Scrollable */}
          <div className={`flex-1 overflow-x-hidden custom-scrollbar relative w-full transform-gpu ${(!currentSession || currentSession.messages.length === 0) ? 'overflow-hidden' : 'overflow-y-auto overscroll-auto'}`} style={{ WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)', willChange: 'transform' }}>
            <div className={`w-full ${appWidthClass} mx-auto px-3 sm:px-6 h-full flex flex-col ${(!currentSession || currentSession.messages.length === 0) ? 'justify-center items-center' : 'pt-4 space-y-6 sm:space-y-8'}`}>
              {!currentSession || currentSession.messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
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
                </motion.div>
              ) : (
                <>
                  {renderedMessages}
                  <div ref={messagesEndRef} className="h-8 sm:h-12 shrink-0" />
                </>
              )}
            </div>
          </div>

          {/* Scroll to Bottom Button */}
          <AnimatePresence>
            {showScrollToBottom && currentSession && currentSession.messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                onClick={() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="absolute bottom-24 right-4 sm:right-8 z-30 p-3 rounded-full bg-cyan-600 text-white shadow-lg hover:bg-cyan-500 transition-all border border-white/20"
              >
                <Download className="w-5 h-5 rotate-180" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Input Area - Flex Item (Not Absolute) */}
          <div className={`shrink-0 z-20 w-full ${appWidthClass} mx-auto`}>
            {/* Offline Banner */}
            <AnimatePresence>
              {isOffline && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="w-full max-w-3xl mx-auto mb-2 px-4"
                >
                  <div className="bg-rose-500/10 border border-rose-500/20 backdrop-blur-md rounded-xl py-2 px-4 flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 text-sm font-medium shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    No Internet Connection - Chat Disabled
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
              isOffline={isOffline}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
