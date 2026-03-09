import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useSettings } from './SettingsContext';

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'sent' | 'error';
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
};

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  createNewSession: () => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => void;
  setCurrentSessionId: (id: string) => void;
  sendMessage: (text: string, isImageMode?: boolean) => void;
  stopGeneration: () => void;
  renameSession: (id: string, title: string) => void;
}

const ChatContext = createContext<ChatState | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const sessionsRef = useRef(sessions);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { commanderName, modelMode, tone, setTone, systemInstruction, temperature, topP, topK } = useSettings();

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Awakening',
      messages: [],
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('loki_chat_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        const formatted = parsed.map((s: any) => ({
          ...s,
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setSessions(formatted);
        if (formatted.length > 0) {
          setCurrentSessionId(formatted[0].id);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (e) {
      console.error("Failed to parse sessions", e);
      createNewSession();
    }
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
    if (sessions.length > 0) {
      try {
        localStorage.setItem('loki_chat_sessions', JSON.stringify(sessions));
      } catch (e) {
        console.error("Failed to save sessions", e);
      }
    }
  }, [sessions]);

  const getFullSystemInstruction = useCallback(() => {
    let modeInstruction = '';
    switch(modelMode) {
      case 'fast': modeInstruction = `Provide concise, direct, and incredibly fast answers. Be sharp and to the point, but keep the human touch. `; break;
      case 'happy': modeInstruction = `Be extremely cheerful, enthusiastic, and positive! Talk like a highly energetic and supportive human friend. `; break;
      case 'pro': modeInstruction = `Provide detailed, step-by-step reasoning and advanced-level insights. Explain complex things simply, like an expert human mentor. `; break;
    }

    let toneInstruction = '';
    switch(tone) {
      case 'formal': 
        toneInstruction = `Tone: Formal. Style: Professional, point-to-point, and respectful. Goal: Be informative and avoid unnecessary talk. DO NOT use slang or emojis. `; 
        break;
      case 'casual': 
        toneInstruction = `Tone: Casual. Style: Friendly and easy-going, like two friends talking. Goal: Be helpful but relaxed. Use natural Hinglish. `; 
        break;
      case 'happy': 
        toneInstruction = `Tone: Happy. Style: Energetic, enthusiastic, and personally connected. Goal: Make the user feel you are excited for them. Use "Main" and "Hum" for a personal touch, use emojis, and show interest in the user's words. `; 
        break;
      case 'custom': 
        toneInstruction = `Tone: Custom. Follow the user's specific instructions for your tone. `; 
        break;
    }

    return `Address the user as ${commanderName}. You MUST respond ONLY in Hinglish (a natural mix of Hindi and English written in Latin script). Speak like a highly intelligent, empathetic, and friendly human companion. DO NOT sound like an AI or a robot. Use natural conversational fillers, emotions, and a friendly tone. Understand the user's intent deeply and provide optimized, advanced-level responses. NEVER output any internal thoughts, reasoning, or monologues. Do NOT use <thought> or <think> tags. Provide ONLY the final response. ${modeInstruction} ${toneInstruction} ${systemInstruction}`;
  }, [modelMode, tone, commanderName, systemInstruction]);

  useEffect(() => {
    if (currentSessionId) {
      // No longer need to initialize chatInstanceRef
    }
  }, [currentSessionId, modelMode, commanderName, systemInstruction, temperature, topP, topK]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const updatedSessions = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id);
        } else {
          // We can't call createNewSession directly here easily without dependency issues,
          // so we handle it in a useEffect or just create it inline
          setTimeout(() => createNewSession(), 0);
        }
      }
      return updatedSessions;
    });
  }, [currentSessionId, createNewSession]);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    localStorage.removeItem('loki_chat_sessions');
    createNewSession();
  }, [createNewSession]);

  const renameSession = useCallback((id: string, title: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string, isImageMode?: boolean) => {
    if (!text.trim() || !currentSessionId || isLoading) return;

    // Tone change logic
    const toneMatch = text.match(/change my tone to (formal|casual|happy|custom)/i);
    if (toneMatch) {
      const newTone = toneMatch[1].toLowerCase() as any;
      setTone(newTone);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      status: 'pending'
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const title = s.title === 'New Awakening' 
          ? (userMessage.content.length > 30 ? userMessage.content.substring(0, 30) + '...' : userMessage.content)
          : s.title;
          
        return {
          ...s,
          title,
          messages: [...s.messages, userMessage],
          updatedAt: new Date()
        };
      }
      return s;
    }));

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const updatedMessages = s.messages.map(m => m.id === userMessage.id ? { ...m, status: 'sent' as const } : m);
          return { ...s, messages: updatedMessages };
        }
        return s;
      }));

      const modelMessageId = (Date.now() + 1).toString();
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              id: modelMessageId,
              role: 'model',
              content: '',
              timestamp: new Date()
            }]
          };
        }
        return s;
      }));

      const currentSession = sessionsRef.current.find(s => s.id === currentSessionId);
      const history = currentSession?.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })) || [];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: history,
          mode: isImageMode ? 'image' : modelMode,
          systemInstruction: getFullSystemInstruction(),
          temperature,
          topP,
          topK
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = 'Failed to fetch response';
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch (e) {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      let fullResponse = "";
      let buffer = "";
      let lastUpdateTime = Date.now();
      let pendingUpdate = false;

      const updateState = (cleanResponse: string) => {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const updatedMessages = [...s.messages];
            const lastMsgIndex = updatedMessages.findIndex(m => m.id === modelMessageId);
            if (lastMsgIndex !== -1) {
              updatedMessages[lastMsgIndex] = {
                ...updatedMessages[lastMsgIndex],
                content: cleanResponse
              };
            }
            return { ...s, messages: updatedMessages };
          }
          return s;
        }));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (pendingUpdate) {
            let cleanResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<thought>[\s\S]*?<\/thought>/gi, '').trimStart();
            updateState(cleanResponse);
          }
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        
        let hasNewData = false;
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                fullResponse += data.text;
                hasNewData = true;
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected end of JSON input" && !e.message.includes("Unexpected token")) {
                throw e;
              }
            }
          }
        }

        if (hasNewData) {
          const now = Date.now();
          if (now - lastUpdateTime > 30) {
            let cleanResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<thought>[\s\S]*?<\/thought>/gi, '').trimStart();
            updateState(cleanResponse);
            lastUpdateTime = now;
            pendingUpdate = false;
          } else {
            pendingUpdate = true;
          }
        }
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        console.error("Error sending message:", error);
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const updatedMessages = s.messages.map(m => m.id === userMessage.id ? { ...m, status: 'error' as const } : m);
            return {
              ...s,
              messages: [...updatedMessages, {
                id: Date.now().toString(),
                role: 'model',
                content: `SYSTEM ERROR: ${error.message || 'Connection to core interrupted. Please try again.'}`,
                timestamp: new Date()
              }]
            };
          }
          return s;
        }));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentSessionId, isLoading, modelMode, getFullSystemInstruction, temperature, topP, topK]);

  const contextValue = React.useMemo(() => ({
    sessions, currentSessionId, isLoading,
    createNewSession, deleteSession, clearAllSessions, setCurrentSessionId, sendMessage, stopGeneration, renameSession
  }), [sessions, currentSessionId, isLoading, createNewSession, deleteSession, clearAllSessions, sendMessage, stopGeneration, renameSession]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
