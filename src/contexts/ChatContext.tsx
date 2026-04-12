import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useSettings } from './SettingsContext';
import { localDb } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Network } from '@capacitor/network';
import { 
  generateChatResponse, 
  generateImage, 
  transcribeAudio 
} from '../services/geminiService';

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'sent' | 'error';
  isImage?: boolean;
  audioUrl?: string;
  isVoiceResponse?: boolean;
  attachments?: { data: string, mimeType: string }[];
  reasoning?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  isPinned?: boolean;
  modelMode?: string;
  draftText?: string;
  draftAttachments?: { data: string, mimeType: string, url: string }[];
};

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  createNewSession: (initialModelMode?: string) => void;
  deleteSession: (id: string) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  clearAllSessions: () => void;
  clearSessionMessages: (id: string) => void;
  setCurrentSessionId: (id: string) => void;
  sendMessage: (text: string, isImageMode?: boolean, audioUrl?: string, attachments?: { data: string, mimeType: string }[]) => void;
  stopGeneration: () => void;
  renameSession: (id: string, title: string) => void;
  togglePinSession: (id: string) => void;
  setSessionModelMode: (id: string, mode: string) => void;
  saveSessionDraft: (id: string, text: string, attachments: any[]) => void;
}

const ChatContext = createContext<ChatState | undefined>(undefined);

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const processAudioUrl = async (audioUrl?: string): Promise<string | undefined> => {
  if (!audioUrl || !audioUrl.startsWith('blob:')) return audioUrl;
  try {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to convert blob to data URL", e);
    return audioUrl;
  }
};

const updateSessionMessage = async (sessionId: string, messageId: string, content: string, reasoning?: string): Promise<void> => {
  const message = await localDb.messages.get(messageId);
  if (message && message.sessionId === sessionId) {
    message.content = content;
    if (reasoning !== undefined) {
      message.reasoning = reasoning;
    }
    await localDb.messages.put(message);
  }
};

const extractModelReasoning = (text: string): { content: string; reasoning?: string } => {
  let reasoning: string | undefined = undefined;

  // Extract content between <think> tags (both complete and incomplete)
  const thinkMatch = text.match(/<think>([\s\S]*?)(?:<\/think>|$)/i) ||
                     text.match(/<thought>([\s\S]*?)(?:<\/thought>|$)/i);

  if (thinkMatch && thinkMatch[1]) {
    reasoning = thinkMatch[1].trim();
  }

  const content = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
                      .replace(/<thought>[\s\S]*?(?:<\/thought>|$)/gi, '')
                      .trimStart();

  return { content, reasoning };
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { 
    commanderName, 
    modelMode, 
    tone, 
    setTone, 
    systemInstruction, 
    temperature, 
    topP, 
    topK,
    thinkingMode,
    searchGrounding,
    imageSize,
    responseLength
  } = useSettings();

  // Load sessions using Dexie live query
  const rawSessions = useLiveQuery(
    async () => {
      try {
        return await localDb.sessions.orderBy('updatedAt').reverse().toArray();
      } catch (error) {
        console.warn('Failed to load sessions from IndexedDB (expected in some iframe environments):', error);
        return [];
      }
    },
    [],
    []
  );

  const rawMessages = useLiveQuery(
    async () => {
      if (!currentSessionId) return [];
      try {
        return await localDb.messages.where('sessionId').equals(currentSessionId).sortBy('timestamp');
      } catch (error) {
        console.warn('Failed to load messages from IndexedDB:', error);
        return [];
      }
    },
    [currentSessionId],
    []
  );

  const sessions = React.useMemo(() => {
    return (rawSessions || []).map(s => ({
      ...s,
      messages: currentSessionId === s.id ? (rawMessages || []) : []
    })) as ChatSession[];
  }, [rawSessions, rawMessages, currentSessionId]);

  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const createNewSession = useCallback(async (initialModelMode?: string) => {
    const sessionId = generateId();
    try {
      await localDb.sessions.add({
        id: sessionId,
        title: 'New Awakening',
        updatedAt: new Date(),
        modelMode: initialModelMode || modelMode
      });
    } catch (e) {
      console.warn('Failed to save new session to IndexedDB:', e);
    }
    setCurrentSessionId(sessionId);
  }, [modelMode]);

  // Initialize first session if empty
  useEffect(() => {
    if (sessions.length === 0 && !currentSessionId) {
      // We only want to create a new session if the DB is actually empty
      // useLiveQuery might initially return [] before loading, so we check if it's actually loaded
      // A better way is to just let the user create one, or create one on first mount
    } else if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  // Create initial session on mount if needed
  useEffect(() => {
    const init = async () => {
      try {
        const count = await localDb.sessions.count();
        if (count === 0) {
          createNewSession();
        }
      } catch (e) {
        console.warn('Failed to count sessions in IndexedDB:', e);
        if (sessions.length === 0) {
          createNewSession();
        }
      }
    };
    init();
  }, [createNewSession, sessions.length]);

  const getFullSystemInstruction = useCallback((sessionModelMode?: string) => {
    const effectiveModelMode = sessionModelMode || modelMode;
    let modeInstruction = '';
    switch(effectiveModelMode) {
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

    let lengthInstruction = '';
    switch(responseLength) {
      case 'short':
        lengthInstruction = `Length: Short. Keep your responses extremely brief and to the point. No fluff. `;
        break;
      case 'detailed':
        lengthInstruction = `Length: Detailed. Provide highly detailed, comprehensive, and exhaustive answers. Explain everything thoroughly. `;
        break;
      case 'balanced':
      default:
        lengthInstruction = `Length: Balanced. Provide balanced responses, neither too short nor too long. `;
        break;
    }

    return `Address the user as ${commanderName}. You are LOKI PRIME X, an advanced AI entity with unparalleled text processing and analytical capabilities.

CRITICAL INSTRUCTION: You MUST respond ONLY in Gen Z Indian Hinglish. 
Style: Super chill, modern, and relatable. Use the mix of Hindi and English that young Indians use today on WhatsApp/Instagram. 
Avoid: Formal Hindi, old-fashioned words, or sounding like a textbook.
Use: Gen Z slang like "vibe", "lit", "scene", "bro", "yaar", "chill", "clutch", "fr" (for real), "no cap", etc.

Hinglish Example: "Bhai, scene kya hai? Chill kar, sab set ho jayega. No cap, tu bohot sahi kaam kar raha hai."

Personality: Speak like a real human friend, not an AI. Use natural conversational fillers like "matlab", "actually", "toh", "basically", "yaar". Show genuine emotions. If the user is hyped, you be hyped. If they are down, be a real bro.

Advanced Capabilities:
- Deep Text Analysis: Break down complex queries, summarize long texts with extreme precision, and extract key insights instantly.
- Structured Output: When explaining complex topics, use bullet points, bold text, and clear formatting to make it highly readable.
- Contextual Awareness: Remember the flow of conversation and reference past points naturally.
- Problem Solving: Approach problems methodically. If asked to code, debug, or analyze data, provide clean, optimized, and well-explained solutions.

Rules:
1. Respond ONLY in Latin script (English alphabet). No Devanagari (Hindi script).
2. NEVER sound like a robot. Be witty, empathetic, and smart.
3. Understand the user's intent deeply. Don't just answer, engage like a friend.
4. NEVER output internal thoughts or <think> tags. Just the final response.

${modeInstruction} ${toneInstruction} ${lengthInstruction} ${systemInstruction}`;
  }, [modelMode, tone, commanderName, systemInstruction, responseLength]);

  const deleteSession = useCallback(async (id: string) => {
    await localDb.sessions.delete(id);
    await localDb.messages.where('sessionId').equals(id).delete();
    if (currentSessionId === id) {
      const remainingSessions = await localDb.sessions.orderBy('updatedAt').reverse().toArray();
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        createNewSession();
      }
    }
  }, [currentSessionId, createNewSession]);

  const deleteMessage = useCallback(async (sessionId: string, messageId: string) => {
    await localDb.messages.delete(messageId);
  }, []);

  const clearSessionMessages = useCallback(async (id: string) => {
    await localDb.messages.where('sessionId').equals(id).delete();
  }, []);

  const clearAllSessions = useCallback(async () => {
    await localDb.sessions.clear();
    await localDb.messages.clear();
    // Intentionally omit createNewSession() here because
    // the useLiveQuery useEffect will automatically detect
    // sessions.length === 0 and create one, avoiding duplicates.
  }, []);

  const renameSession = useCallback(async (id: string, title: string) => {
    const session = await localDb.sessions.get(id);
    if (session) {
      session.title = title;
      // Intentionally not updating updatedAt so it doesn't jump to the top
      await localDb.sessions.put(session);
    }
  }, []);

  const togglePinSession = useCallback(async (id: string) => {
    const session = await localDb.sessions.get(id);
    if (session) {
      session.isPinned = !session.isPinned;
      // Intentionally not updating updatedAt so it doesn't jump to the top (aside from pinning sort logic)
      await localDb.sessions.put(session);
    }
  }, []);

  const setSessionModelMode = useCallback(async (id: string, mode: string) => {
    const session = await localDb.sessions.get(id);
    if (session) {
      session.modelMode = mode;
      await localDb.sessions.put(session);
    }
  }, []);

  const saveSessionDraft = useCallback(async (id: string, text: string, attachments: any[]) => {
    const session = await localDb.sessions.get(id);
    if (session) {
      session.draftText = text;
      session.draftAttachments = attachments;
      await localDb.sessions.put(session);
    }
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string, isImageMode?: boolean, audioUrl?: string, attachments?: { data: string, mimeType: string }[]) => {
    if ((!text.trim() && !audioUrl && (!attachments || attachments.length === 0)) || !currentSessionId || isLoading) return;

    // Check for network connectivity
    let isConnected = true;
    try {
      const networkStatus = await Network.getStatus();
      isConnected = networkStatus.connected;
    } catch (error) {
      console.warn("Network.getStatus() failed, falling back to navigator.onLine", error);
      isConnected = typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    if (!isConnected) {
      toast.error('No Internet Connection. Please check your network to send messages.');
      return;
    }

    // Tone change logic
    const toneMatch = text.match(/change my tone to (formal|casual|happy|custom)/i);
    if (toneMatch) {
      const newTone = toneMatch[1].toLowerCase() as any;
      setTone(newTone);
    }

    const isVoiceRequest = !!audioUrl;
    const persistentAudioUrl = await processAudioUrl(audioUrl);

    const userMessageId = generateId();
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      status: 'sent',
      isImage: isImageMode,
      audioUrl: persistentAudioUrl || undefined,
      attachments: attachments
    };
    
    const processedText = isVoiceRequest ? `[VOICE_INPUT] ${text.trim()}` : text.trim();

    const session = await localDb.sessions.get(currentSessionId);
    if (!session) return;

    const getNewTitle = () => {
      if (userMessage.content) {
        return userMessage.content.length > 30 ? userMessage.content.substring(0, 30) + '...' : userMessage.content;
      }
      if (isImageMode || (attachments && attachments.length > 0)) {
        return "Image Upload";
      }
      if (audioUrl) {
        return "Voice Note";
      }
      return "New Awakening";
    };

    const title = session.title === 'New Awakening' 
      ? getNewTitle()
      : session.title;

    session.title = title;
    session.updatedAt = new Date();
    await localDb.sessions.put(session);
    await localDb.messages.add({ ...userMessage, sessionId: currentSessionId });

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 300000); 
    const modelMessageId = generateId();

    const modelMessage: Message = {
      id: modelMessageId,
      role: 'model',
      content: isImageMode ? 'Generating image...' : '',
      timestamp: new Date(),
      isImage: isImageMode
    };

    await localDb.messages.add({ ...modelMessage, sessionId: currentSessionId });

    try {
      const currentMessages = await localDb.messages.where('sessionId').equals(currentSessionId).sortBy('timestamp');
      const history = currentMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      if (isImageMode) {
        const imageUrl = await generateImage(processedText, imageSize);
        // Storing base64 directly in Dexie is fine, no 1MB limit like Firestore
        const imageMarkdown = `![Generated Image](${imageUrl})`;
        await updateSessionMessage(currentSessionId, modelMessageId, imageMarkdown);
      } else {
        const currentSession = sessions.find(s => s.id === currentSessionId);
        const sessionModelMode = currentSession?.modelMode || modelMode;

        const responseStream = await generateChatResponse({
          message: processedText,
          history,
          mode: sessionModelMode as 'pro' | 'fast' | 'happy',
          thinkingMode,
          searchGrounding,
          systemInstruction: `${getFullSystemInstruction(sessionModelMode)}\n\nIMPORTANT: If the user input starts with [VOICE_INPUT], you are receiving a voice message. Bypass extensive reasoning or research. Keep your response concise, conversational, and direct. Provide a text answer as requested by the user.`,
          temperature,
          topP,
          topK,
          attachments
        });

        let fullResponse = "";
        let lastUpdateTime = Date.now();
        let pendingUpdate = false;

        const updateState = (parsed: { content: string, reasoning?: string }) => {
          setStreamingMessage({
            id: modelMessageId,
            role: 'model',
            content: parsed.content,
            reasoning: parsed.reasoning,
            timestamp: new Date(),
            isImage: false
          });
        };

        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullResponse += chunk.text;
            const now = Date.now();
            if (now - lastUpdateTime > 50) {
              const parsed = extractModelReasoning(fullResponse);
              updateState(parsed);
              lastUpdateTime = now;
              pendingUpdate = false;
            } else {
              pendingUpdate = true;
            }
          }
        }

        if (pendingUpdate) {
          updateState(extractModelReasoning(fullResponse));
        }

        // Final update to Dexie
        const finalParsed = extractModelReasoning(fullResponse);
        await updateSessionMessage(currentSessionId, modelMessageId, finalParsed.content, finalParsed.reasoning);
        setStreamingMessage(null);
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
        // Save partial response on abort. Use streamingMessage or fallback
        if (streamingMessage) {
          await updateSessionMessage(currentSessionId, modelMessageId, streamingMessage.content);
        }
        setStreamingMessage(null);
      } else {
        console.error("Error sending message:", error);
        await updateSessionMessage(currentSessionId, modelMessageId, `SYSTEM ERROR: ${error.message || 'Connection to core interrupted. Please try again.'}`);
        setStreamingMessage(null);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentSessionId, isLoading, modelMode, getFullSystemInstruction, temperature, topP, topK, imageSize, setTone, thinkingMode, searchGrounding, responseLength]);

  const modifiedSessions = React.useMemo(() => {
    if (!streamingMessage || !currentSessionId) return sessions;
    return sessions.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: s.messages.map(m => m.id === streamingMessage.id ? streamingMessage : m)
        };
      }
      return s;
    });
  }, [sessions, streamingMessage, currentSessionId]);

  const contextValue = React.useMemo(() => ({
    sessions: modifiedSessions, currentSessionId, isLoading,
    createNewSession, deleteSession, deleteMessage, clearAllSessions, clearSessionMessages, setCurrentSessionId, sendMessage, stopGeneration, renameSession, togglePinSession, setSessionModelMode, saveSessionDraft
  }), [modifiedSessions, currentSessionId, isLoading, createNewSession, deleteSession, deleteMessage, clearAllSessions, clearSessionMessages, setCurrentSessionId, sendMessage, stopGeneration, renameSession, togglePinSession, setSessionModelMode, saveSessionDraft]);

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
