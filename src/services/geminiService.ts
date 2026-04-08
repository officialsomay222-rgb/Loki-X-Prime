import { GoogleGenAI, Type, ThinkingLevel, Modality, GenerateContentConfig } from "@google/genai";

const getApiKey = () => {
  let key = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (import.meta as any).env?.VITE_GOOGLE_AI_KEY || 
         process.env.GEMINI_API_KEY || 
         process.env.GOOGLE_AI_KEY;
  if (key && (key.includes("MY_GEMINI") || key.includes("YOUR_"))) return undefined;
  return key;
};

// We don't need getGroqKey in the frontend anymore since we're calling the backend API.

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
    
    const config: GenerateContentConfig = {
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
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const contents: any[] = [];
    if (params.history && Array.isArray(params.history)) {
      params.history.forEach((msg) => {
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
      params.attachments!.forEach((att) => {
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
    // Pro and Happy modes use the Express backend to securely connect to Groq
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.message,
        history: params.history?.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }] // Backend expects this format
        })),
        mode: params.mode,
        systemInstruction: params.systemInstruction,
        temperature: params.temperature,
        topP: params.topP,
      }),
    });

    if (!response.ok) {
      // If there's an error, try to parse the error message, or fallback to generic
      try {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate chat response.");
      } catch (e) {
        throw new Error("Failed to generate chat response. Server returned " + response.status);
      }
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

        // Keep the last partial event in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                if (data.error.includes("Groq API Key is missing")) {
                  yield { text: "Commander, your Groq API key is missing. Please add 'GROQ_API_KEY' to your AI Studio Secrets to enable Pro/Happy models." };
                  return;
                }
                throw new Error(data.error);
              }
              if (data.text) {
                yield { text: data.text };
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e, "Raw data:", dataStr);
            }
          }
        }
      }
    }
    return streamResponse();
  }
  
  throw new Error("Invalid mode selected");
};

export const generateImage = async (prompt: string, _size: '1K' | '2K' | '4K' = '1K') => {
  const apiKey = getApiKey();
  
  if (!apiKey) throw new Error("Google AI Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  
  let detailedPrompt = prompt;
  try {
    const refinementResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `[IMAGE_MODE] Create a stunning visual description for: ${prompt}`,
      config: {
        systemInstruction: "Tum ek expert Image Prompt Engineer ho. Jab user '[IMAGE_MODE]' flag ke saath koi request bheje, toh tum us text ko ek detailed, artistic, aur high-quality visual description mein badal do. Description ko Imagen 4 model ke liye optimize karo (lighting, style, aur camera angles add karo). Sirf description likhna, koi extra baat mat karna."
      }
    });
    detailedPrompt = refinementResponse.text || prompt;
  } catch (e) {
    console.error("Gemini refinement failed, using original prompt:", e);
  }

  const modelsToTry = [
    "imagen-4.0-fast-generate-001",
    "imagen-4.0-generate-001",
    "imagen-4.0-ultra-generate-001",
    "imagen-3.0-generate-001"
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateImages({
        model: model,
        prompt: detailedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg"
        }
      });

      const generatedImage = response.generatedImages?.[0];
      if (!generatedImage || !generatedImage.image || !generatedImage.image.imageBytes) {
        throw new Error(`Model ${model} returned empty image data`);
      }

      // The imageBytes is returned as a base64 string
      const base64Data = generatedImage.image.imageBytes;
      return `data:image/jpeg;base64,${base64Data}`;
    } catch (e: any) {
      console.warn(`Failed with model ${model}:`, e);
      lastError = e;
    }
  }

  throw new Error(`All Google Imagen models failed. Last error: ${lastError?.message || 'Unknown error'}`);
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
