import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";
import Groq from "groq-sdk";
import { HfInference } from "@huggingface/inference";

const getApiKey = () => {
  let key = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (import.meta as any).env?.VITE_GOOGLE_AI_KEY || 
         process.env.GEMINI_API_KEY || 
         process.env.GOOGLE_AI_KEY;
  if (key && (key.includes("MY_GEMINI") || key.includes("YOUR_"))) return undefined;
  return key;
};

const getGroqKey = () => {
  let key = (import.meta as any).env?.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (key && (key.includes("MY_GROQ") || key.includes("YOUR_"))) return undefined;
  return key;
};

const getHfToken = () => {
  let key = (import.meta as any).env?.VITE_HF_TOKEN || process.env.HF_TOKEN;
  if (key && (key.includes("MY_HF") || key.includes("YOUR_"))) return undefined;
  return key;
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
  const hasAttachments = params.attachments && params.attachments.length > 0;

  if (params.mode === "fast" || hasAttachments) {
    const apiKey = getApiKey();
    if (!apiKey) {
      // Mock response for missing API key
      async function* mockStream() {
        yield { text: "Commander, your Google AI API key is missing. Please set VITE_GEMINI_API_KEY in your environment variables to activate my full intelligence. For now, I'm running in demo mode." };
      }
      return mockStream();
    }

    const ai = new GoogleGenAI({ apiKey });
    let modelName = "gemini-3.1-flash-lite-preview";
    
    const config: any = {
      systemInstruction: params.systemInstruction,
      temperature: params.temperature || 0.7,
      topP: params.topP || 0.95,
      topK: params.topK || 64,
    };

    if (params.searchGrounding) {
      modelName = "gemini-3-flash-preview";
      config.tools = [{ googleSearch: {} }];
    }

    if (params.thinkingMode) {
      config.thinkingConfig = { thinkingLevel: "HIGH" };
    }

    const contents: any[] = [];
    if (params.history && Array.isArray(params.history)) {
      params.history.forEach((msg: any) => {
        if (msg.content) {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      });
    }
    
    const userParts: any[] = [];
    if (hasAttachments) {
      params.attachments!.forEach((att: any) => {
        userParts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }
    if (params.message && params.message.trim().length > 0) {
      userParts.push({ text: params.message });
    } else if (hasAttachments) {
      userParts.push({ text: "Please analyze this image." });
    } else {
      userParts.push({ text: " " });
    }
    
    contents.push({ role: 'user', parts: userParts });

    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: config
    });

    async function* streamResponse() {
      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield { text: chunk.text };
        }
      }
    }
    return streamResponse();

  } else if (params.mode === "pro" || params.mode === "happy") {
    const groqKey = getGroqKey();
    if (!groqKey) {
      async function* mockStream() {
        yield { text: "Commander, your Groq API key is missing. Please set VITE_GROQ_API_KEY to enable Llama models. Running in demo mode." };
      }
      return mockStream();
    }

    const groq = new Groq({ apiKey: groqKey, dangerouslyAllowBrowser: true });
    const modelName = params.mode === "pro" ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";

    const messages = [
      { role: "system", content: params.systemInstruction },
      ...(params.history || []).map((msg: any) => ({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content
      })),
      { role: "user", content: params.message }
    ];

    const stream = await groq.chat.completions.create({
      messages: messages as any,
      model: modelName,
      temperature: params.temperature || 0.7,
      top_p: params.topP || 0.95,
      stream: true,
    });

    async function* streamResponse() {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield { text: content };
        }
      }
    }
    return streamResponse();
  }
  
  throw new Error("Invalid mode selected");
};

export const generateImage = async (prompt: string, _size: '1K' | '2K' | '4K' = '1K') => {
  const apiKey = getApiKey();
  const hfToken = getHfToken();
  
  if (!apiKey) throw new Error("Google AI Key is missing.");
  if (!hfToken) throw new Error("Hugging Face Token is missing.");

  const ai = new GoogleGenAI({ apiKey });
  
  let detailedPrompt = prompt;
  try {
    const refinementResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `[IMAGE_MODE] Create a stunning visual description for: ${prompt}`,
      config: {
        systemInstruction: "Tum ek expert Image Prompt Engineer ho. Jab user '[IMAGE_MODE]' flag ke saath koi request bheje, toh tum us text ko ek detailed, artistic, aur high-quality visual description mein badal do. Description ko Stable Diffusion XL model ke liye optimize karo (lighting, style, aur camera angles add karo). Sirf description likhna, koi extra baat mat karna."
      }
    });
    detailedPrompt = refinementResponse.text || prompt;
  } catch (e) {
    console.error("Gemini refinement failed, using original prompt:", e);
  }

  const hf = new HfInference(hfToken);
  
  let blob;
  try {
    blob = await hf.textToImage({
      inputs: detailedPrompt,
      model: "stabilityai/stable-diffusion-xl-base-1.0",
    });
  } catch (e: any) {
    if (e.message?.includes("loading") || e.status === 503) {
      throw new Error("stable-diffusion-xl-base-1.0 model is loading on Hugging Face. Please try again in 20-30 seconds.");
    }
    throw new Error(`Hugging Face API Error: ${e.message}`);
  }

  const imageBuffer = await blob.arrayBuffer();
  // Convert ArrayBuffer to Base64 in browser
  let binary = '';
  const bytes = new Uint8Array(imageBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64EncodeString = window.btoa(binary);

  if (!base64EncodeString || base64EncodeString.length < 100) {
    throw new Error("Generated image data is invalid or empty.");
  }

  let mimeType = blob.type;
  if (!mimeType || !mimeType.startsWith('image/')) {
    mimeType = 'image/jpeg';
  }
  
  return `data:${mimeType};base64,${base64EncodeString}`;
};

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
  const groqKey = getGroqKey();
  if (!groqKey) throw new Error("Groq API Key is missing.");

  const groq = new Groq({ apiKey: groqKey, dangerouslyAllowBrowser: true });
  
  // Convert base64 to File object
  const byteCharacters = atob(audioBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const file = new File([blob], `audio.${mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'}`, { type: mimeType });

  const transcription = await groq.audio.transcriptions.create({
    file: file,
    model: 'whisper-large-v3-turbo',
    response_format: 'json',
    prompt: 'The following is a conversation in English and Hinglish (Hindi written in the Latin alphabet). Please transcribe exactly as spoken, keeping Hinglish words in Latin script. Examples: "Haan bhai, kya haal hai?", "Theek hai."',
  });

  return transcription.text;
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
