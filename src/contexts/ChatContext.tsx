import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useSettings } from './SettingsContext';
import { get, set, del } from 'idb-keyval';

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'sent' | 'error';
  isImage?: boolean;
  audioUrl?: string;
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
  deleteMessage: (sessionId: string, messageId: string) => void;
  clearAllSessions: () => void;
  clearSessionMessages: (id: string) => void;
  setCurrentSessionId: (id: string) => void;
  sendMessage: (text: string, isImageMode?: boolean, audioUrl?: string) => void;
  stopGeneration: () => void;
  renameSession: (id: string, title: string) => void;
}

const ChatContext = createContext<ChatState | undefined>(undefined);

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const sessionsRef = useRef(sessions);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { commanderName, modelMode, tone, setTone, systemInstruction, temperature, topP, topK } = useSettings();

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Awakening',
      messages: [],
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const savedSessionsStr = await get('loki_chat_sessions');
        const legacySessions = localStorage.getItem('loki_chat_sessions');
        let parsed = null;

        if (savedSessionsStr) {
          parsed = JSON.parse(savedSessionsStr);
        } else if (legacySessions) {
          parsed = JSON.parse(legacySessions);
        }

        if (parsed) {
          const usedIds = new Set<string>();
          
          const formatted = parsed.map((s: any) => {
            // Ensure session ID is unique
            let sessionId = s.id;
            if (usedIds.has(sessionId)) {
              sessionId = generateId();
            }
            usedIds.add(sessionId);

            const sessionUsedMessageIds = new Set<string>();
            return {
              ...s,
              id: sessionId,
              updatedAt: new Date(s.updatedAt),
              messages: s.messages.map((m: any) => {
                // Ensure message ID is unique within session
                let msgId = m.id;
                if (sessionUsedMessageIds.has(msgId)) {
                  msgId = generateId();
                }
                sessionUsedMessageIds.add(msgId);
                
                return {
                  ...m,
                  id: msgId,
                  timestamp: new Date(m.timestamp)
                };
              })
            };
          });
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
    };
    loadSessions();
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
    if (sessions.length > 0) {
      set('loki_chat_sessions', JSON.stringify(sessions)).catch(e => {
        console.error("Failed to save sessions", e);
      });
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

    return `Address the user as ${commanderName}. 

CRITICAL INSTRUCTION: You MUST respond ONLY in Gen Z Indian Hinglish. 
Style: Super chill, modern, and relatable. Use the mix of Hindi and English that young Indians use today on WhatsApp/Instagram. 
Avoid: Formal Hindi, old-fashioned words, or sounding like a textbook.
Use: Gen Z slang like "vibe", "lit", "scene", "bro", "yaar", "chill", "clutch", "fr" (for real), "no cap", etc.

Hinglish Example: "Bhai, scene kya hai? Chill kar, sab set ho jayega. No cap, tu bohot sahi kaam kar raha hai."

Personality: Speak like a real human friend, not an AI. Use natural conversational fillers like "matlab", "actually", "toh", "basically", "yaar". Show genuine emotions. If the user is hyped, you be hyped. If they are down, be a real bro.

Rules:
1. Respond ONLY in Latin script (English alphabet). No Devanagari (Hindi script).
2. NEVER sound like a robot. Be witty, empathetic, and smart.
3. Understand the user's intent deeply. Don't just answer, engage like a friend.
4. NEVER output internal thoughts or <think> tags. Just the final response.

${modeInstruction} ${toneInstruction} ${systemInstruction}`;
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

  const deleteMessage = useCallback((sessionId: string, messageId: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages: session.messages.filter(m => m.id !== messageId)
        };
      }
      return session;
    }));
  }, []);

  const clearSessionMessages = useCallback((id: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === id) {
        return { ...session, messages: [] };
      }
      return session;
    }));
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    del('loki_chat_sessions').catch(e => console.error("Failed to delete sessions", e));
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

  const sendMessage = useCallback(async (text: string, isImageMode?: boolean, audioUrl?: string) => {
    if ((!text.trim() && !audioUrl) || !currentSessionId || isLoading) return;

    // Tone change logic
    const toneMatch = text.match(/change my tone to (formal|casual|happy|custom)/i);
    if (toneMatch) {
      const newTone = toneMatch[1].toLowerCase() as any;
      setTone(newTone);
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      status: 'pending',
      isImage: isImageMode,
      audioUrl: audioUrl
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
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 300 second timeout (5 minutes)
    const modelMessageId = generateId();

    try {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const updatedMessages = s.messages.map(m => m.id === userMessage.id ? { ...m, status: 'sent' as const } : m);
          return { ...s, messages: updatedMessages };
        }
        return s;
      }));

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              id: modelMessageId,
              role: 'model',
              content: '',
              timestamp: new Date(),
              isImage: isImageMode
            }]
          };
        }
        return s;
      }));

      const currentSession = sessionsRef.current.find(s => s.id === currentSessionId);
      const history = currentSession?.messages.map(m => {
        let text = m.content;
        if (m.isImage && text.startsWith('![')) {
          text = "[Image Generated]";
        }
        return {
          role: m.role,
          parts: [{ text }]
        };
      }) || [];

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
            const updatedMessages = s.messages.map(m => {
              if (m.id === userMessage.id) return { ...m, status: 'error' as const };
              if (m.id === modelMessageId) return { ...m, content: `SYSTEM ERROR: ${error.message || 'Connection to core interrupted. Please try again.'}`, isImage: false };
              return m;
            });
            return { ...s, messages: updatedMessages };
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
    createNewSession, deleteSession, deleteMessage, clearAllSessions, clearSessionMessages, setCurrentSessionId, sendMessage, stopGeneration, renameSession
  }), [sessions, currentSessionId, isLoading, createNewSession, deleteSession, deleteMessage, clearAllSessions, clearSessionMessages, sendMessage, stopGeneration, renameSession]);

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
