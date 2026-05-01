import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { useChat } from '../contexts/ChatContext';
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';
import { Plus, Image as ImageIcon, Mic, Send, Sparkles } from 'lucide-react';

const AssistantModePlugin = registerPlugin('AssistantMode');

export const AssistantOverlay = ({ onClose }: { onClose: () => void }) => {
  const { sessions, currentSessionId, sendMessage, stopGeneration } = useChat();
  const [expanded, setExpanded] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Only show the latest message if one exists and we are active
  const recentMessages = currentSession?.messages || [];
  const latestMessage = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1] : null;
  const isAssistantMessage = latestMessage?.role === 'model';
  const isStreaming = latestMessage?.status === 'pending';

  const handleDragEnd = async (event: any, info: any) => {
    if (info.offset.y < -50) {
      // Dragged up
      setExpanded(true);
      // Clean up the native intent so we don't get stuck in assistant mode
      if (Capacitor.isNativePlatform()) {
        try {
          const plugin = AssistantModePlugin as any;
          await plugin.clearAssistantMode();
        } catch (e) {
          console.error(e);
        }
      }
      onClose(); // This seamlessly unmounts the overlay and reveals the main app
    } else if (info.offset.y > 50) {
      // Dragged down - close
      closeOverlay();
    }
  };

  const closeOverlay = async () => {
    onClose();
    if (Capacitor.isNativePlatform()) {
      try {
        const plugin = AssistantModePlugin as any;
        await plugin.closeAssistantMode();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    sendMessage(inputText.trim());
    setInputText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center overflow-hidden">
      {/* Invisible backdrop to dismiss */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all"
        onClick={closeOverlay}
      />

      {/* God-level RGB Background Overlay */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="processing-rgb-overlay pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%', scale: 0.95, filter: 'blur(10px)' }}
        animate={{ y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ y: '100%', scale: 0.95, filter: 'blur(10px)' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
        className="w-full bg-slate-900/95 dark:bg-[#08080c]/95 backdrop-blur-2xl rounded-t-[40px] p-4 sm:p-6 pb-8 pointer-events-auto border-t border-cyan-500/30 shadow-[0_-20px_80px_rgba(0,242,255,0.2)] flex flex-col gap-4 relative overflow-hidden"
        style={{
           paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)'
        }}
      >
        {/* God-level Edge Glowing Effects */}
        {isStreaming && (
          <>
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 shadow-[0_0_20px_rgba(0,242,255,0.8)]" />
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50 shadow-[0_0_30px_rgba(189,0,255,0.8)] mix-blend-screen animate-pulse" style={{ animationDuration: '3s' }} />
          </>
        )}
        {/* Drag Handle */}
        <div className="w-16 h-1.5 bg-white/30 rounded-full mx-auto cursor-grab active:cursor-grabbing" />

        {/* Response Area */}
        <AnimatePresence mode="popLayout">
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-2 py-4 text-cyan-400 font-medium flex items-center gap-3"
            >
              <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              Thinking...
            </motion.div>
          )}

          {!isStreaming && isAssistantMessage && latestMessage && (
            <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-h-[40vh] overflow-y-auto w-full px-2 custom-scrollbar"
            >
               <MessageBubble
                  message={latestMessage}
                  commanderName="Owner"
                  avatarUrl=""
                  onEdit={() => {}}
                  onDelete={() => {}}
                  formatDate={(d) => d.toISOString()}
                  bubbleStyle="glass"
                  fontSize="medium"
                  messageAnimation={true}
                  textReveal="fade"
                  animationSpeed="normal"
                  accentColor="cyan"
                  messageDensity="comfortable"
                  showAvatars={true}
               />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="mt-2 w-full max-w-3xl mx-auto">
          <div className="relative w-full rounded-[30px] p-[2px] transition-all duration-500 bg-white/60 dark:bg-[#050505]/90 shadow-[inset_0_0_30px_rgba(0,242,255,0.1)]">
            <div className="relative z-10 rounded-[28px] flex items-center p-2 backdrop-blur-xl bg-transparent">
              {/* Left Side Icons */}
              <div className="flex items-center gap-1 pl-2">
                {!isStreaming && (
                  <>
                    <button
                      aria-label="Add attachment"
                      onClick={() => alert("File attachment opened")}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-[#C4C7C5] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-[#E3E3E3] transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                    <button
                      aria-label="Add image"
                      onClick={() => alert("Image gallery opened")}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-[#C4C7C5] hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-[#E3E3E3] transition-all"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Text Input */}
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (inputRef.current) {
                    inputRef.current.style.height = "auto";
                    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
                  }
                }}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder={isStreaming ? "Thinking..." : "Ask LOKI..."}
                rows={1}
                className="flex-1 mx-2 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-base sm:text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#C4C7C5] py-3 max-h-[120px] custom-scrollbar"
              />

              {/* Right Side Icons */}
              <div className="flex items-center pr-1">
                {isStreaming ? (
                  <button
                    onClick={stopGeneration}
                    aria-label="Processing..."
                    className="w-12 h-12 rounded-full flex items-center justify-center text-cyan-500 bg-transparent transition-all"
                  >
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                      <Sparkles className="w-6 h-6" />
                    </motion.div>
                  </button>
                ) : inputText.trim().length > 0 ? (
                  <button
                    onClick={handleSend}
                    aria-label="Send Message"
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-[#E3E3E3] hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
                  >
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                ) : (
                  <button
                    aria-label="Voice Input"
                    onClick={() => alert("Voice input activated")}
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-slate-600 dark:text-[#C4C7C5] hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
