import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NetworkStatusIndicator } from "./components/NetworkStatusIndicator";

import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { StatusBar } from "@capacitor/status-bar";
import { ChatInput, ChatInputHandle } from "./components/ChatInput";
import { useAwakening } from "./hooks/useAwakening";
import { AvatarShockwave } from "./components/AvatarShockwave";
import { PremiumLiquidShockwave } from "./components/PremiumLiquidShockwave";
import { MessageBubble } from "./components/MessageBubble";
import { AwakenedBackground } from "./components/AwakenedBackground";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsModal } from "./components/SettingsModal";
import { AppsModal } from "./components/AppsModal";
import { WelcomeModal } from "./components/WelcomeModal";
import { useSettings } from "./contexts/SettingsContext";
import { useChat } from "./contexts/ChatContext";
import { InfinityLogo, HeaderInfinityLogo } from "./components/Logos";
import { TimelineItem } from "./components/TimelineItem";
import { format, isToday } from "date-fns";
import { TaskWidget } from "./features/tasks/components/TaskWidget";
import { AssistantOverlay } from "./components/AssistantOverlay";
import { registerPlugin } from "@capacitor/core";
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
  MoreVertical,
  Pin,
  PinOff,
  Edit2,
  Check,
  Search,
  FileText,
  Download,
  Type,
  Volume2,
  Rocket,
  LogOut,
  LogIn,
  ArrowDown,
} from "lucide-react";

const EMPTY_ARRAY: any[] = [];
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const AssistantModePlugin = registerPlugin("AssistantMode");

export default function App() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isAssistantMode, setIsAssistantMode] = useState<boolean | null>(null);
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false,
  );
  const [timelineSearchQuery, setTimelineSearchQuery] = useState("");
  const [showWelcome, setShowWelcome] = useState(() => {
    return typeof window !== "undefined"
      ? !localStorage.getItem("loki_hasSeenWelcome")
      : false;
  });
  const isSettingsOpen = activeModal === "settings";
  const isAppsOpen = activeModal === "apps";
  const isCommandPaletteOpen = activeModal === "commands";
  const openModal = useCallback((modalName: string) => {
    setActiveModal(modalName);
  }, []);
  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const {
    theme,
    resolvedTheme,
    setTheme,
    bgStyle,
    setBgStyle,
    commanderName,
    setCommanderName,
    avatarUrl,
    setAvatarUrl,
    modelMode,
    setModelMode,
    tone,
    setTone,
    isAwakened,
    setIsAwakened,
    systemInstruction,
    setSystemInstruction,
    temperature,
    setTemperature,
    topP,
    setTopP,
    topK,
    setTopK,
    enterToSend,
    setEnterToSend,
    bubbleStyle,
    setBubbleStyle,
    fontSize,
    setFontSize,
    fontStyle,
    setFontStyle,
    soundEnabled,
    setSoundEnabled,
    messageAnimation,
    setMessageAnimation,
    autoScroll,
    setAutoScroll,
    typingSpeed,
    setTypingSpeed,
    showAvatars,
    setShowAvatars,
    responseLength,
    setResponseLength,
    accentColor,
    setAccentColor,
    messageDensity,
    setMessageDensity,
    thinkingMode,
    setThinkingMode,
    searchGrounding,
    setSearchGrounding,
    imageSize,
    setImageSize,
    liveAudioEnabled,
    setLiveAudioEnabled,
    animationSpeed,
    setAnimationSpeed,
    borderRadius,
    setBorderRadius,
    textReveal,
    setTextReveal,
    appWidth,
    setAppWidth,
    glowIntensity,
    setGlowIntensity,
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
    resetSettings,
  } = useSettings();

  const { awakening, triggerAwakening, handleAwakeningResponse } = useAwakening(
    isAwakened,
    setIsAwakened,
  );

  const {
    sessions,
    currentSessionId,
    isLoading,
    createNewSession,
    deleteSession,
    deleteMessage,
    clearAllSessions,
    clearSessionMessages,
    setCurrentSessionId,
    sendMessage,
    stopGeneration,
    togglePinSession,
    renameSession,
    setSessionModelMode,
    saveSessionDraft,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeModal();
        } else {
          openModal("commands");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        createNewSession(modelMode);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    createNewSession,
    isCommandPaletteOpen,
    openModal,
    closeModal,
    modelMode,
  ]);

  const [showSkip, setShowSkip] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);


  useEffect(() => {
    const checkAssistantMode = async () => {
      // Check URL search params
      const params = new URLSearchParams(window.location.search);
      if (params.get("assistant") === "true") {
        setIsAssistantMode(true);
      }

      // Check native plugin
      if (Capacitor.isNativePlatform()) {
        try {
          const plugin = AssistantModePlugin as any;
          const { isAssistantMode: nativeMode } = await plugin.checkAssistantMode();
          setIsAssistantMode(nativeMode);
        } catch (e) {
          console.warn("AssistantModePlugin not available");
          setIsAssistantMode(false);
        }
      } else {
        setIsAssistantMode(false);
      }
    };
    checkAssistantMode();

    // Re-check when app resumes
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        const appStateListener = App.addListener('appStateChange', (state) => {
          if (state.isActive) {
            checkAssistantMode();
          }
        });
      });

      try {
        const plugin = AssistantModePlugin as any;
        plugin.addListener("assistantModeChanged", (info: any) => {
          if (info && info.isAssistantMode !== undefined) {
             setIsAssistantMode(info.isAssistantMode);
          }
        });
      } catch (e) {
        console.error("Failed to add listener to AssistantModePlugin", e);
      }
    }
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true })
        .then(() => {
          setTimeout(() => {
            StatusBar.show().catch(console.warn);
          }, 100);
        })
        .catch(console.warn);


      return () => {
        Keyboard.removeAllListeners();
      };
    }
  }, []);

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

    if (urlParams.get("settings") === "true") {
      openModal("settings");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const command = urlParams.get("command");
    if (command) {
      // Handle web+loki:// protocol
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const shareText = urlParams.get("text");
    const shareUrl = urlParams.get("url");
    if (shareText || shareUrl) {
      // Handle share target
      const initialMessage = [shareText, shareUrl].filter(Boolean).join("\n");
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

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // Search and sort timelines
  const sortedAndFilteredSessions = React.useMemo(() => {
    let result = [...sessions];

    if (timelineSearchQuery.trim()) {
      const lowerQuery = timelineSearchQuery.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(lowerQuery));
    }

    // Sort by pinned status first
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0; // Maintain recent updatedAt order from DB
    });

    return result;
  }, [sessions, timelineSearchQuery]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end",
      });
    }
  }, [currentSession?.messages.length, currentSessionId, autoScroll]);

  const checkScrollPosition = useCallback(() => {
    const target = scrollContainerRef.current;
    if (!target) return;

    // Check if there is enough content to scroll
    if (target.scrollHeight <= target.clientHeight) {
      setShowScrollToBottom(false);
      return;
    }

    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 400;
    setShowScrollToBottom(!isNearBottom);
  }, []);

  // Check scroll position when messages change or session changes
  useEffect(() => {
    checkScrollPosition();
  }, [currentSession?.messages.length, currentSessionId, checkScrollPosition]);

  const handleSetModelMode = useCallback((mode: string) => {
    setModelMode(mode as any);
    if (currentSessionId) {
      setSessionModelMode(currentSessionId, mode);
    }
  }, [currentSessionId, setModelMode, setSessionModelMode]);

  const handleSendMessage = useCallback(
    async (
      text: string,
      isImageMode?: boolean,
      audioUrl?: boolean | string,
      attachments?: { data: string; mimeType: string }[],
    ) => {
      await sendMessage(
        text,
        isImageMode,
        typeof audioUrl === "string" ? audioUrl : undefined,
        attachments,
      );
      if (window.innerWidth >= 768) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 10);
      }
    },
    [sendMessage],
  );

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      deleteSession(id);
    },
    [deleteSession],
  );

  const handleExportChat = () => {
    if (!currentSession || currentSession.messages.length === 0) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(currentSession.messages, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `loki_chat_export_${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCreateNewSession = useCallback(() => {
    createNewSession(modelMode);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [createNewSession, modelMode]);

  const handleSessionClick = useCallback(
    (id: string) => {
      setCurrentSessionId(id);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    },
    [setCurrentSessionId, setIsSidebarOpen],
  );

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const formatDate = useCallback((date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    return format(date, "MMM d, HH:mm");
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const handleEditMessage = useCallback((text: string) => {
    if (inputRef.current) {
      inputRef.current.setInput(text);
      inputRef.current.focus();
    }
  }, []);

  const handleDeleteMessage = useCallback((id: string) => {
    if (currentSessionId) {
      deleteMessage(currentSessionId, id);
    }
  }, [currentSessionId, deleteMessage]);

  const renderedMessages = useMemo(() => {
    return currentSession?.messages.map((message) => (
      <MessageBubble
        key={message.id}
        message={message}
        commanderName={commanderName}
        avatarUrl={avatarUrl}
        isCopied={copiedId === message.id}
        onCopy={copyToClipboard}
        onEdit={message.role === "user" ? handleEditMessage : undefined}
        onDelete={handleDeleteMessage}
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
        resolvedTheme={resolvedTheme}
      />
    ));
  }, [
    currentSession?.messages,
    isAwakened,
    effectMessageBubbles,
    commanderName,
    avatarUrl,
    copiedId,
    copyToClipboard,
    formatDate,
    bubbleStyle,
    fontSize,
    messageAnimation,
    textReveal,
    animationSpeed,
    accentColor,
    messageDensity,
    showAvatars,
    chatAlignment,
    blurIntensity,
    timestampFormat,
    codeTheme,
    avatarShape,
    messageShadow,
    resolvedTheme,
    handleEditMessage,
    handleDeleteMessage,
  ]);

  if (isBooting) {
    return (
      <div
        className={`fixed inset-0 w-full h-full z-[9999] flex flex-col justify-between items-center transition-opacity duration-700 pb-12 pt-24 ${resolvedTheme === "light" ? "bg-[#ffffff]" : "bg-[#08080c]"}`}
        style={{
          paddingTop:
            "calc(6rem + clamp(24px, env(safe-area-inset-top), 48px))",
          paddingBottom:
            "calc(3rem + clamp(0px, env(safe-area-inset-bottom), 32px))",
        }}
      >
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
        </div>
        <div className="mt-auto mb-8">
          <h1
            className="text-2xl sm:text-3xl font-black tracking-[0.3em] font-montserrat uppercase animate-[rgb-text_4s_linear_infinite] drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #00f0ff, #bd00ff, #ff00ff, #ff0000)",
              backgroundSize: "200% auto",
              color: "white",
              WebkitTextFillColor: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            LOKI X PRIME
          </h1>
        </div>
      </div>
    );
  }

  const fontClass =
    fontStyle === "sans"
      ? "font-sans"
      : fontStyle === "serif"
        ? "font-serif"
        : "font-mono";

  const radiusVar =
    borderRadius === "sharp"
      ? "0px"
      : borderRadius === "pill"
        ? "9999px"
        : "16px";

  const appWidthClass =
    appWidth === "narrow"
      ? "max-w-2xl"
      : appWidth === "wide"
        ? "max-w-6xl"
        : "max-w-4xl";
  const glowOpacity =
    glowIntensity === "low" ? "0.2" : glowIntensity === "high" ? "0.8" : "0.5";

  if (isAssistantMode === null) {
    // Render an invisible layer while we check if it's assistant mode
    // to prevent the entire main app from flashing into view briefly
    return <div style={{ backgroundColor: 'transparent', width: '100%', height: '100%' }} />;
  }

  if (isAssistantMode) {
    return (
      <div className={`app-wrapper ${theme} ${fontClass} bg-transparent`}>
        <AssistantOverlay onClose={() => setIsAssistantMode(false)} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1], // Custom sleek easing
        opacity: { duration: 0.8 }
      }}
      className={`app-wrapper ${theme} ${isAwakened ? "awakened-mode" : ""} ${fontClass}`}
    >
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeModal} />
      <NetworkStatusIndicator />
      {/* 1. Background Layer (Fixed, never moves) */}
      <AwakenedBackground
        isAwakened={isAwakened || effectBackground}
        bgStyle={bgStyle}
        theme={resolvedTheme}
      />

      {/* 2. Awakening Overlays */}
      {awakening && (
        <div
          className="fixed inset-0 z-[100000] pointer-events-none flex justify-center items-center"
          style={{
            paddingTop: "clamp(24px, env(safe-area-inset-top, 0px), 48px)",
            paddingBottom: "clamp(0px, env(safe-area-inset-bottom, 0px), 32px)",
          }}
        >
          {/* Shockwave rendered strictly behind the avatar container */}
          {awakening.phase === "shockwave" && <PremiumLiquidShockwave />}

          <div
            className={`avatar-awakening flex justify-center items-center ${awakening.phase === "moving-out" ? "avatar-moving-out" : "avatar-moving-in"}`}
            style={
              {
                "--start-x": `${awakening.startX}px`,
                "--start-y": `${awakening.startY}px`,
                width: awakening.width,
                height: awakening.height,
                zIndex: 999,
              } as any
            }
          >
            <div className="absolute -inset-[2px] sm:-inset-[3px] rounded-full z-[1] opacity-100 animate-spin-aura bg-cyan-500/50 shadow-[0_0_15px_rgba(0,242,255,0.5)]"></div>
            <img
              src={
                "/Picsart_26-02-28_11-29-26-443.jpg"
              }
              className="absolute inset-0 w-full h-full rounded-full object-cover z-[2] border-2 border-white dark:border-[#08080c]"
              alt="Commander"
            />
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

      {/* Welcome Modal for First-time Users */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
      />

      {/* 3. Main Content Layer (Flex Row/Column) */}
      <div
        className={`flex-1 flex min-h-0 z-10 relative ${isSidebarOpen ? (sidebarPosition === "right" ? "md:pr-72" : "md:pl-72") : ""} ${sidebarPosition === "right" ? "flex-row-reverse" : "flex-row"} transition-all duration-300`}
      >
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
          animate={{
            x: isSidebarOpen
              ? 0
              : sidebarPosition === "right"
                ? "100%"
                : "-100%",
          }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 400,
            mass: 0.8,
          }}
          className={`fixed inset-y-0 ${sidebarPosition === "right" ? "right-0 border-l" : "left-0 border-r"} z-50 w-72 bg-[#f8fafc] dark:bg-[#0a0a0a] shadow-2xl border-y-0 border-slate-200/30 dark:border-white/5 flex flex-col transform-gpu gpu-accelerate`}
        >
          <div
            className="p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 shrink-0"
            style={{
              paddingTop:
                "calc(1rem + clamp(24px, env(safe-area-inset-top, 0px), 48px))",
            }}
          >
            <div
              className={`flex items-center gap-2 font-montserrat font-bold ${isAwakened && theme === "light" ? "text-slate-900" : "text-slate-900 dark:text-white"}`}
            >
              <span className="text-cyan-600 dark:text-[#00f2ff]">TIME</span>{" "}
              LINES
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close Sidebar"
              className={`p-2 rounded-lg transition-colors ${isAwakened && theme === "light" ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white"}`}
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

          <div
            className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar touch-pan-y transform-gpu overscroll-contain"
            style={{
              WebkitOverflowScrolling: "touch",
              transform: "translateZ(0)",
              willChange: "transform",
              paddingBottom:
                "calc(0.5rem + clamp(0px, env(safe-area-inset-bottom), 32px))",
            }}
          >
            <div className="text-[0.65rem] font-bold text-slate-500 dark:text-[#6b6b80] uppercase tracking-[0.3em] mb-3 px-4 mt-2">
              Recent Timelines
            </div>

            <div className="px-3 mb-3 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input
                aria-label="Search timelines"
                type="text"
                placeholder="Search timelines..."
                value={timelineSearchQuery}
                onChange={(e) => setTimelineSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg transition-all border outline-none
                  ${
                    isAwakened || effectSidebar
                      ? "bg-black/20 border-white/10 text-white placeholder-slate-400 focus:border-cyan-500/50 focus:bg-black/40"
                      : "bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-cyan-500/30 focus:bg-white dark:focus:bg-black/40 shadow-sm"
                  }
                `}
              />
            </div>

            <AnimatePresence>
              {sortedAndFilteredSessions.map((session, index) => (
                <TimelineItem
                  key={session.id}
                  session={session}
                  index={index}
                  isActive={currentSessionId === session.id}
                  isAwakened={isAwakened}
                  effectSidebar={effectSidebar}
                  onClick={handleSessionClick}
                  onDelete={handleDeleteSession}
                  onPin={togglePinSession}
                  onRename={renameSession}
                />
              ))}
            </AnimatePresence>
            {sortedAndFilteredSessions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-slate-500 dark:text-[#6b6b80] text-sm py-12 px-6 font-medium"
              >
                {sessions.length === 0
                  ? "No timelines yet. Initiate an awakening."
                  : "No matching timelines found."}
              </motion.div>
            )}
          </div>

          <div
            className="p-4 border-t border-slate-200/50 dark:border-white/5 space-y-2 mt-auto"
            style={{
              paddingBottom:
                "calc(1rem + clamp(16px, env(safe-area-inset-bottom, 0px), 32px))",
            }}
          >
            {sessions.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ filter: "brightness(1.2)" }}
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to clear all timelines?",
                    )
                  ) {
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
              onClick={() => openModal("apps")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <Rocket className="w-4 h-4" />
              TRY OUR APPS
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              onClick={() => openModal("settings")}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <Settings className="w-4 h-4" />
              SYSTEM SETTINGS
            </motion.button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col min-w-0 relative h-full ${isAwakened ? "awakened-mode" : ""} ${isAwakened && resolvedTheme === "dark" ? "dark" : ""}`}
        >
          {/* Header */}
          <header
            className={`absolute top-0 left-0 right-0 flex items-center justify-between px-3 sm:px-8 border-b border-slate-200 dark:border-white/5 backdrop-blur-md premium-shadow z-30 shrink-0 ${resolvedTheme === "light" ? (isAwakened ? "bg-white/90" : "bg-white/80") : "bg-[#08080c]/80"}`}
            style={{
              paddingTop: "clamp(24px, env(safe-area-inset-top, 0px), 48px)",
              height:
                "calc(var(--header-height, 4rem) + clamp(24px, env(safe-area-inset-top, 0px), 48px))",
            }}
          >
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open Sidebar"
                  className="p-2 sm:p-2.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-white"
                >
                  <PanelLeftOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-center shrink-0">
              {isLoading &&
              currentSession?.messages[currentSession.messages.length - 1]
                ?.role === "model" &&
              currentSession?.messages[currentSession.messages.length - 2]
                ?.isImage ? (
                <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                  <div className="flex items-center gap-2 sm:gap-3 font-montserrat font-bold text-base sm:text-xl tracking-[1px] sm:tracking-[4px] text-cyan-400 drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]">
                    <div className="w-6 h-3 sm:w-10 sm:h-5">
                      <HeaderInfinityLogo />
                    </div>
                    <span className="animate-pulse">GENERATING</span>
                    <span className="flex gap-1">
                      <span
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </span>
                  </div>
                </div>
              ) : (
                <h1 className="flex items-center gap-2 sm:gap-4 font-montserrat font-bold text-lg sm:text-2xl tracking-[1px] sm:tracking-[4px] text-slate-900 dark:text-[#e0e0e0]">
                  <span>LOKI</span>
                  <div className="w-8 h-4 sm:w-14 sm:h-8">
                    <HeaderInfinityLogo />
                  </div>
                  <span className="text-[0.55rem] sm:text-[0.75rem] tracking-[1px] sm:tracking-[3px] font-black px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-lg border border-cyan-500/50 dark:border-[#00f2ff]/50 text-cyan-600 dark:text-[#00f2ff] shadow-[0_0_12px_rgba(0,242,255,0.3)] dark:shadow-[0_0_20px_rgba(0,242,255,0.4)] bg-cyan-500/10">
                    PRIME
                  </span>
                </h1>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-6 flex-1">
              <div
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer flex justify-center items-center hover:scale-110 transition-transform ${awakening ? "opacity-0" : "opacity-100"}`}
                title={commanderName}
                onClick={triggerAwakening}
                onMouseDown={() => setIsAvatarActive(true)}
                onMouseUp={() => setIsAvatarActive(false)}
                onMouseLeave={() => setIsAvatarActive(false)}
                onTouchStart={() => setIsAvatarActive(true)}
                onTouchEnd={() => setIsAvatarActive(false)}
              >
                <AvatarShockwave isActive={isAvatarActive} />
                {(isAwakened || effectAvatar) && (
                  <div
                    className="absolute -inset-[2px] sm:-inset-[3px] rounded-full z-[1] opacity-100 animate-spin-aura"
                    style={{
                      background:
                        "conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00f0ff, #bd00ff, #ff00ff, #ff0000)",
                      boxShadow: "0 0 15px rgba(255, 255, 255, 0.3)",
                    }}
                  ></div>
                )}
                <div className="w-full h-full rounded-full overflow-hidden z-[2] border-2 border-white dark:border-[#08080c] relative">
                  <img
                    src="/Picsart_26-02-28_11-29-26-443.jpg"
                    className="w-full h-full object-cover"
                    alt="Commander"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Chat Area - Scrollable */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            className={`flex-1 overflow-x-hidden custom-scrollbar relative w-full transform-gpu ${!currentSession || currentSession.messages.length === 0 ? "overflow-hidden" : "overflow-y-auto overscroll-contain"}`}
            style={{
              WebkitOverflowScrolling: "touch",
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          >
            {/* Inner spacer for floating header */}
            <div
              style={{
                height:
                  "calc(var(--header-height, 4rem) + 16px + clamp(24px, env(safe-area-inset-top, 0px), 48px))",
                width: "100%",
                flexShrink: 0,
              }}
            ></div>

            <div
              className={`w-full ${appWidthClass} mx-auto px-3 sm:px-6 h-full flex flex-col ${!currentSession || currentSession.messages.length === 0 ? "justify-center items-center" : "pt-4 space-y-6 sm:space-y-8"}`}
              style={
                !currentSession || currentSession.messages.length === 0
                  ? {
                      height:
                        "calc(100% - (var(--header-height, 4rem) + 16px + clamp(24px, env(safe-area-inset-top, 0px), 48px)))",
                    }
                  : {}
              }
            >
              {!currentSession || currentSession.messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center text-center space-y-8 w-full h-full touch-none select-none"
                  onTouchMove={(e) => e.preventDefault()} // CRITICAL: Stop pull-to-refresh/scroll on empty state
                >
                  <div
                    className={`relative flex justify-center items-center transition-all duration-700 ${isAwakened ? "w-full max-w-[480px] sm:max-w-[700px] aspect-[2/1]" : "w-full max-w-[200px] sm:max-w-[280px] aspect-[2/1]"}`}
                    style={{

                    }}
                  >
                    {isAwakened ? (
                      <div className="relative w-full h-full awakened-logo-container flex items-center justify-center">
                        {/* Hardware-accelerated RGB Aura Border */}
                        <div className="absolute inset-0 awakened-logo-aura"></div>
                        {/* Sweeping Shine Overlay */}
                        <div className="absolute inset-0 awakened-logo-shine"></div>
                        {/* Main Transparent Logo */}
                        <img
                          src="/Picsart_26-03-05_20-52-27-601.png"
                          alt="Loki Prime Logo"
                          className="w-full h-full object-contain relative z-10 awakened-logo-image"
                        />
                      </div>
                    ) : (
                      <InfinityLogo />
                    )}
                  </div>
                  <div
                    className="relative"
                    style={{
                      transition: "opacity 0.3s ease, max-height 0.3s ease",
                      overflow: "hidden",
                    }}
                  >
                    <p
                      className={`text-slate-500 dark:text-[#6b6b80] tracking-[4px] sm:tracking-[8px] text-[0.65rem] sm:text-xs font-montserrat font-bold uppercase drop-shadow-sm px-4 transition-all duration-1000 ${isAwakened ? (resolvedTheme === "light" ? "text-cyan-600 animate-pulse" : "text-cyan-300 animate-pulse") : "opacity-80 hover:opacity-100"}`}
                      style={
                        isAwakened
                          ? { textShadow: "0 0 15px rgba(0,242,255,0.6)" }
                          : {}
                      }
                    >
                      {isAwakened
                        ? "SYSTEM AWAKENED. AWAITING INPUT."
                        : `AWAITING COMMAND, ${commanderName.toUpperCase()}.`}
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

          {/* Scroll to Bottom Button Container */}
          <div className={`relative w-full ${appWidthClass} mx-auto z-30 pointer-events-none h-0`}>
            <AnimatePresence>
              {showScrollToBottom &&
                currentSession &&
                currentSession.messages.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    onClick={() => {
                      messagesEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                      });
                    }}
                    className="absolute bottom-4 right-4 sm:right-8 p-3 rounded-full flex items-center justify-center bg-cyan-600/90 backdrop-blur-md text-white shadow-[0_0_15px_rgba(0,242,255,0.4)] hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] hover:bg-cyan-500 transition-all duration-300 border-2 border-cyan-400/50 pointer-events-auto"
                    aria-label="Scroll to bottom"
                    title="Scroll to bottom"
                  >
                    <ArrowDown className="w-5 h-5" aria-hidden="true" />
                  </motion.button>
                )}
            </AnimatePresence>
          </div>

          {/* Input Area - Flex Item (Not Absolute) */}
          <div
            className={`shrink-0 z-20 w-full ${appWidthClass} mx-auto`}
            style={{
              paddingBottom:
                "calc(16px + clamp(0px, env(safe-area-inset-bottom, 0px), 48px))",
              paddingTop: "8px",
            }}
          >
            <ChatInput
              ref={inputRef}
              isAwakened={isAwakened}
              isLoading={isLoading}
              modelMode={currentSession?.modelMode || modelMode}
              setModelMode={handleSetModelMode}
              onSendMessage={handleSendMessage}
              onDeleteSession={handleDeleteSession}
              currentSessionId={currentSessionId}
              onStopGeneration={stopGeneration}
              enterToSend={enterToSend}
              draftText={currentSession?.draftText || ""}
              draftAttachments={currentSession?.draftAttachments || EMPTY_ARRAY}
              saveSessionDraft={saveSessionDraft}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
