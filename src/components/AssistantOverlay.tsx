import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { useChat } from '../contexts/ChatContext';
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

const AssistantModePlugin = registerPlugin('AssistantMode');

export const AssistantOverlay = ({ onClose }: { onClose: () => void }) => {
  const { sessions, currentSessionId, sendMessage, stopGeneration } = useChat();
  const [expanded, setExpanded] = useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const isStreaming = false; // We can check if last message is pending
  const modelMode = currentSession?.modelMode || "gemini";

  // Only show the latest message if one exists and we are active
  const recentMessages = currentSession?.messages || [];
  const latestMessage = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1] : null;
  const isAssistantMessage = latestMessage?.role === 'model';

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

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center">
      {/* Invisible backdrop to dismiss */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={closeOverlay}
      />

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full bg-slate-900/95 dark:bg-[#08080c]/95 backdrop-blur-2xl rounded-t-3xl p-4 sm:p-6 pb-8 pointer-events-auto border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-4 relative"
        style={{
           paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)'
        }}
      >
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
                  isCopied={false}
                  onCopy={() => {}}
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
           <ChatInput
              onSendMessage={sendMessage}
              isLoading={isStreaming}
              modelMode={modelMode}
              setModelMode={() => {}}
              onDeleteSession={() => {}}
              currentSessionId={currentSessionId}
              enterToSend={true}
           />
        </div>
      </motion.div>
    </div>
  );
};
