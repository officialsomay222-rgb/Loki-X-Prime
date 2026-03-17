import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const getApiKey = () => {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
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
  const hfToken = process.env.HF_TOKEN || (import.meta as any).env?.VITE_HF_TOKEN || (import.meta as any).env?.HF_TOKEN;

  const config: any = {
    systemInstruction: params.systemInstruction,
    temperature: params.temperature,
    topP: params.topP,
    topK: params.topK,
  };

  const messages = [
    { role: "system", content: params.systemInstruction },
    ...params.history.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.content || m.parts?.[0]?.text || ""
    })),
    { role: "user", content: params.message }
  ];

  // Handle Groq for 'pro' and 'happy' modes
  if (params.mode === 'pro' || params.mode === 'happy') {
    const groqKey = process.env.GROQ_API_KEY || (import.meta as any).env?.VITE_GROQ_API_KEY || (import.meta as any).env?.GROQ_API_KEY;
    if (!groqKey) throw new Error(`GROQ_API_KEY is not set. Please add it to your AI Studio Secrets panel to use ${params.mode === 'pro' ? 'Pro' : 'Happy'} Mode.`);

    const groqModel = params.mode === 'pro' ? "openai/gpt-oss-120b" : "groq/compound-mini";

    async function* streamGroq() {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: groqModel,
          messages: messages,
          stream: true,
          temperature: config.temperature ?? 0.7,
          top_p: config.topP ?? 0.9,
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API error: ${response.status} ${err}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("No response body");

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
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                yield { text: content };
              }
            } catch (e) {}
          }
        }
      }
    }
    return streamGroq();
  }

  // Handle Gemini model for 'fast' mode
  const googleAiKey = process.env.GOOGLE_AI_KEY || (import.meta as any).env?.VITE_GOOGLE_AI_KEY || (import.meta as any).env?.GOOGLE_AI_KEY;
  if (!googleAiKey) throw new Error("GOOGLE_AI_KEY is not set. Please add it to your AI Studio Secrets panel to use Fast Mode.");
  const ai = new GoogleGenAI({ apiKey: googleAiKey });
  
  let model = "gemini-3.1-flash"; // Requested by user for fast mode

  if (params.searchGrounding) {
    model = "gemini-3-flash-preview";
  }

  if (params.thinkingMode && model.includes("pro")) {
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
  const hfToken = process.env.HF_TOKEN || (import.meta as any).env?.VITE_HF_TOKEN || (import.meta as any).env?.HF_TOKEN;
  if (!hfToken) throw new Error("HF_TOKEN is not set. Please add your Hugging Face Token to the AI Studio Secrets panel to generate images.");

  const response = await fetch(
    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
    {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} ${err}`);
  }

  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
