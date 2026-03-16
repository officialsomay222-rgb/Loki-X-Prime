import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const getApiKey = () => {
  return process.env.GEMINI_API_KEY;
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
}) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  
  let model = "gemini-3.1-flash-lite-preview"; // Default for fast
  if (params.mode === 'pro' || params.mode === 'happy') {
    model = "gemini-3.1-pro-preview";
  }

  // If search grounding is enabled, we use gemini-3-flash-preview as requested
  if (params.searchGrounding) {
    model = "gemini-3-flash-preview";
  }

  const config: any = {
    systemInstruction: params.systemInstruction,
    temperature: params.temperature,
    topP: params.topP,
    topK: params.topK,
  };

  if (params.thinkingMode && model === "gemini-3.1-pro-preview") {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  if (params.searchGrounding) {
    config.tools = [{ googleSearch: {} }];
  }

  const contents = params.history.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content || m.parts?.[0]?.text || "" }]
  }));

  contents.push({ role: 'user', parts: [{ text: params.message }] });

  return ai.models.generateContentStream({
    model,
    contents,
    config
  });
};

export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image data returned from Gemini");
};

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType
        }
      },
      { text: "Please transcribe this audio exactly as spoken. If it's in Hinglish, keep it in Latin script." }
    ]
  });

  return response.text;
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
