import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const getApiKey = () => {
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (import.meta as any).env?.VITE_GOOGLE_AI_KEY || 
         process.env.GEMINI_API_KEY || 
         process.env.GOOGLE_AI_KEY;
};

export const generateChatResponse = async (params: {
  message: string;
  history: any[];
  mode: 'fast' | 'pro' | 'happy';
  thinkingMode: boolean;
  searchGrounding: boolean;
  systemInstruction: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  attachments?: { data: string, mimeType: string }[];
}) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: params.message,
      history: params.history.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })),
      mode: params.mode,
      systemInstruction: params.systemInstruction,
      temperature: params.temperature,
      topP: params.topP,
      topK: params.topK,
      thinkingMode: params.thinkingMode,
      searchGrounding: params.searchGrounding,
      attachments: params.attachments
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  async function* streamResponse() {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") return;
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.error) throw new Error(data.error);
            if (data.text) {
              yield { text: data.text };
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("API error")) throw e;
          }
        }
      }
    }
  }

  return streamResponse();
};

export const generateImage = async (prompt: string, _size: '1K' | '2K' | '4K' = '1K') => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: prompt,
      mode: "image",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  let fullText = "";
  let buffer = "";
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") break;
        if (!dataStr) continue;
        try {
          const data = JSON.parse(dataStr);
          if (data.error) throw new Error(data.error);
          if (data.text) fullText += data.text;
        } catch (e) {
          if (e instanceof Error && e.message.includes("API error")) throw e;
          if (e instanceof Error && !e.message.includes("Unexpected token")) throw e;
        }
      }
    }
  }

  // Extract base64 from markdown ![alt](data:image/png;base64,...)
  const match = fullText.match(/\((data:image\/[^;]+;base64,[^)]+)\)/);
  if (match && match[1]) {
    return match[1];
  }
  
  if (fullText.includes("error")) {
     throw new Error(fullText);
  }

  throw new Error("Failed to extract image from response. The response might be incomplete or invalid.");
};

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audioBase64, mimeType }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Transcription API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.text;
};

export const connectLiveSession = (callbacks: {
  onopen: () => void;
  onmessage: (message: any) => void;
  onerror: (error: any) => void;
  onclose: () => void;
}, systemInstruction?: string) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  
  return ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction: systemInstruction || "You are LOKI PRIME X. You are having a real-time voice conversation with your Commander. Be chill, helpful, and respond in Hinglish.",
    },
  });
};
