import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { 
  generateChatResponse, 
  generateImage, 
  transcribeAudio 
} from '../services/geminiService';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  setDoc,
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'sent' | 'error';
  isImage?: boolean;
  audioUrl?: string;
  isVoiceResponse?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null, user: any) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't want to crash the whole app, but we should log it
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
  
  const { user } = useAuth();
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
    imageSize
  } = useSettings();

  const createNewSession = useCallback(async () => {
    if (!user) return;
    
    const sessionId = generateId();
    const sessionPath = `users/${user.uid}/sessions/${sessionId}`;
    
    try {
      await setDoc(doc(db, sessionPath), {
        id: sessionId,
        title: 'New Awakening',
        updatedAt: serverTimestamp(),
        uid: user.uid
      });
      setCurrentSessionId(sessionId);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, sessionPath, user);
    }
  }, [user]);

  // Load sessions and messages from Firestore
  useEffect(() => {
    if (!user) {
      setSessions([]);
      setCurrentSessionId(null);
      return;
    }

    const sessionsPath = `users/${user.uid}/sessions`;
    const q = query(collection(db, sessionsPath), orderBy('updatedAt', 'desc'));

    const unsubscribeSessions = onSnapshot(q, (snapshot) => {
      const sessionList: ChatSession[] = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        sessionList.push({
          id: data.id,
          title: data.title,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
          messages: [] // Messages will be loaded per session
        });
      });

      setSessions(sessionList);
      
      if (sessionList.length > 0 && !currentSessionId) {
        setCurrentSessionId(sessionList[0].id);
      } else if (sessionList.length === 0) {
        createNewSession();
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, sessionsPath, user);
    });

    return () => unsubscribeSessions();
  }, [user, createNewSession]);

  // Load messages for the current session
  useEffect(() => {
    if (!user || !currentSessionId) return;

    const messagesPath = `users/${user.uid}/sessions/${currentSessionId}/messages`;
    const q = query(collection(db, messagesPath), orderBy('timestamp', 'asc'));

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
          status: data.status,
          isImage: data.isImage,
          audioUrl: data.audioUrl,
          isVoiceResponse: data.isVoiceResponse
        };
      });

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: messageList } : s
      ));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, messagesPath, user);
    });

    return () => unsubscribeMessages();
  }, [user, currentSessionId]);

  useEffect(() => {
    sessionsRef.current = sessions;
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

${modeInstruction} ${toneInstruction} ${systemInstruction}`;
  }, [modelMode, tone, commanderName, systemInstruction]);

  useEffect(() => {
    if (currentSessionId) {
      // No longer need to initialize chatInstanceRef
    }
  }, [currentSessionId, modelMode, commanderName, systemInstruction, temperature, topP, topK]);

  const deleteSession = useCallback(async (id: string) => {
    if (!user) return;
    const sessionPath = `users/${user.uid}/sessions/${id}`;
    try {
      // Delete messages first (optional but cleaner)
      const messagesPath = `${sessionPath}/messages`;
      const messagesSnap = await getDocs(collection(db, messagesPath));
      const batch = writeBatch(db);
      messagesSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      await deleteDoc(doc(db, sessionPath));
      
      if (currentSessionId === id) {
        const remainingSessions = sessionsRef.current.filter(s => s.id !== id);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          createNewSession();
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, sessionPath, user);
    }
  }, [user, currentSessionId, createNewSession]);

  const deleteMessage = useCallback(async (sessionId: string, messageId: string) => {
    if (!user) return;
    const messagePath = `users/${user.uid}/sessions/${sessionId}/messages/${messageId}`;
    try {
      await deleteDoc(doc(db, messagePath));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, messagePath, user);
    }
  }, [user]);

  const clearSessionMessages = useCallback(async (id: string) => {
    if (!user) return;
    const messagesPath = `users/${user.uid}/sessions/${id}/messages`;
    try {
      const messagesSnap = await getDocs(collection(db, messagesPath));
      const batch = writeBatch(db);
      messagesSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, messagesPath, user);
    }
  }, [user]);

  const clearAllSessions = useCallback(async () => {
    if (!user) return;
    try {
      const sessionsPath = `users/${user.uid}/sessions`;
      const sessionsSnap = await getDocs(collection(db, sessionsPath));
      for (const sessionDoc of sessionsSnap.docs) {
        await deleteSession(sessionDoc.id);
      }
    } catch (error) {
      console.error("Failed to clear all sessions", error);
    }
  }, [user, deleteSession]);

  const renameSession = useCallback(async (id: string, title: string) => {
    if (!user) return;
    const sessionPath = `users/${user.uid}/sessions/${id}`;
    try {
      await updateDoc(doc(db, sessionPath), { title, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, sessionPath, user);
    }
  }, [user]);

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

    // Store if this was a voice message to trigger voice response
    const isVoiceRequest = !!audioUrl;
    
    // Convert blob URL to data URL for persistence if needed
    let persistentAudioUrl = audioUrl;
    if (audioUrl && audioUrl.startsWith('blob:')) {
      try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        persistentAudioUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Failed to convert blob to data URL", e);
      }
    }

    const userMessageId = generateId();
    const userMessagePath = `users/${user.uid}/sessions/${currentSessionId}/messages/${userMessageId}`;
    
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      status: 'pending',
      isImage: isImageMode,
      audioUrl: persistentAudioUrl
    };
    
    // Add a hidden flag for the AI if it's a voice request
    const processedText = isVoiceRequest ? `[VOICE_INPUT] ${text.trim()}` : text.trim();

    try {
      const sessionRef = doc(db, `users/${user.uid}/sessions/${currentSessionId}`);
      const currentSession = sessionsRef.current.find(s => s.id === currentSessionId);
      
      const title = currentSession?.title === 'New Awakening' 
        ? (userMessage.content.length > 30 ? userMessage.content.substring(0, 30) + '...' : userMessage.content)
        : currentSession?.title || 'New Awakening';

      await updateDoc(sessionRef, { title, updatedAt: serverTimestamp() });
      await setDoc(doc(db, userMessagePath), {
        ...userMessage,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userMessagePath, user);
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 300 second timeout (5 minutes)
    const modelMessageId = generateId();
    const modelMessagePath = `users/${user.uid}/sessions/${currentSessionId}/messages/${modelMessageId}`;

    try {
      await updateDoc(doc(db, userMessagePath), { status: 'sent' });

      const currentSession = sessionsRef.current.find(s => s.id === currentSessionId);
      const history = currentSession?.messages.map(m => ({
        role: m.role,
        content: m.content
      })) || [];

      if (isImageMode) {
        await setDoc(doc(db, modelMessagePath), {
          id: modelMessageId,
          role: 'model',
          content: 'Generating image...',
          timestamp: serverTimestamp(),
          isImage: true
        });

        const imageUrl = await generateImage(processedText, imageSize);
        const imageMarkdown = `![Generated Image](${imageUrl})`;
        
        await updateDoc(doc(db, modelMessagePath), { 
          content: imageMarkdown 
        });
      } else {
        await setDoc(doc(db, modelMessagePath), {
          id: modelMessageId,
          role: 'model',
          content: '',
          timestamp: serverTimestamp(),
          isImage: false
        });

        const responseStream = await generateChatResponse({
          message: processedText,
          history,
          mode: modelMode,
          thinkingMode,
          searchGrounding,
          systemInstruction: `${getFullSystemInstruction()}\n\nIMPORTANT: If the user input starts with [VOICE_INPUT], you are receiving a voice message. Bypass extensive reasoning or research. Keep your response concise, conversational, and direct. Provide a text answer as requested by the user.`,
          temperature,
          topP,
          topK
        });

        let fullResponse = "";
        let lastUpdateTime = Date.now();
        let pendingUpdate = false;

        const updateState = async (cleanResponse: string) => {
          try {
            await updateDoc(doc(db, modelMessagePath), { content: cleanResponse });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, modelMessagePath, user);
          }
        };

        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullResponse += chunk.text;
            const now = Date.now();
            if (now - lastUpdateTime > 50) {
              let cleanResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<thought>[\s\S]*?<\/thought>/gi, '').trimStart();
              updateState(cleanResponse);
              lastUpdateTime = now;
              pendingUpdate = false;
            } else {
              pendingUpdate = true;
            }
          }
        }

        if (pendingUpdate) {
          let cleanResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<thought>[\s\S]*?<\/thought>/gi, '').trimStart();
          updateState(cleanResponse);
        }
      }

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user');
      } else {
        console.error("Error sending message:", error);
        try {
          await updateDoc(doc(db, userMessagePath), { status: 'error' });
          await updateDoc(doc(db, modelMessagePath), { 
            content: `SYSTEM ERROR: ${error.message || 'Connection to core interrupted. Please try again.'}`,
            isImage: false 
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, modelMessagePath, user);
        }
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
