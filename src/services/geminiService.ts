import { GoogleGenAI, Type, ThinkingLevel, Modality, GenerateContentConfig } from "@google/genai";

const getApiKey = () => {
  // Only use VITE_ prefixed keys on the client to avoid leaking server-side secrets
  let key = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (import.meta as any).env?.VITE_GOOGLE_AI_KEY;
  if (key && (key.includes("MY_GEMINI") || key.includes("YOUR_"))) return undefined;
  return key;
};

export const generateChatResponse = async (params: {
  message: string;
  history: { role: string; content: string }[];
  mode: 'fast' | 'pro' | 'happy';
  thinkingMode: boolean;
  searchGrounding: boolean;
  systemInstruction: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  attachments?: { data: string, mimeType: string }[];
}) => {
  // All chat responses are now routed through the backend to ensure security of API keys
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      history: params.history?.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
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
    let errorMsg = `Server returned ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error) {
        errorMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error);
      } else if (errData.message) {
        errorMsg = errData.message;
      }
    } catch (e) {}
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error("No response body returned from server.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  async function* streamResponse() {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') return;

          let data;
          try {
            data = JSON.parse(dataStr);
          } catch (e) {
            continue;
          }

          if (data.error) {
            if (typeof data.error === 'string' && data.error.includes("Groq or HuggingFace API Key is missing")) {
              yield { text: "Commander, your Groq or HuggingFace API key is missing. Please add 'GROQ_API_KEY' or 'HF_TOKEN' to your AI Studio Secrets to enable Pro/Happy models." };
              return;
            } else if (typeof data.error === 'string' && data.error.includes("Groq API Key is missing")) {
              yield { text: "Commander, your Groq API key is missing. Please add 'GROQ_API_KEY' to your AI Studio Secrets to enable Pro/Happy models." };
              return;
            }
            throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
          }
          if (data.text) {
            yield { text: data.text };
          }
        }
      }
    }
  }
  return streamResponse();
};

export const generateImage = async (prompt: string, _size: '1K' | '2K' | '4K' = '1K') => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      mode: 'image'
    }),
  });

  if (!response.ok) {
    let errorMsg = `Server returned ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.error) {
        errorMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error);
      } else if (errData.message) {
        errorMsg = errData.message;
      }
    } catch (e) {}
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error("No response body returned from server.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let base64Result = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') break;

        let data;
        try {
          data = JSON.parse(dataStr);
        } catch (e) {
          continue;
        }

        if (data.error) {
          throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
        }
        if (data.text) {
          const match = data.text.match(/\!\[.*?\]\((.*)\)/);
          if (match && match[1]) {
            base64Result = match[1];
          } else {
             base64Result = data.text;
          }
        }
      }
    }
  }

  if (!base64Result) {
    throw new Error("Failed to extract image data from server response.");
  }

  return base64Result;
};

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audioBase64, mimeType }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Server responded with ${response.status}`);
  }

  return data.text;
};

export const connectLiveSession = (callbacks: {
  onopen: () => void;
  onmessage: (message: any) => void;
  onerror: (error: any) => void;
  onclose: () => void;
}, systemInstruction?: string) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Please set VITE_GEMINI_API_KEY in your environment to use Live Voice.");

  const ai = new GoogleGenAI({ apiKey });
  
  return ai.live.connect({
    model: "models/gemini-2.0-flash",
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
