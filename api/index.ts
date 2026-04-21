import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { HfInference } from "@huggingface/inference";
import { performDuckDuckGoSearch, performDuckDuckGoImageSearch } from "./ddg_search.js";


function extractImageQuery(message: string): string | null {
  if (!message) return null;
  const cleanMessage = message.replace(/^(show\s+me|give\s+me|send|find|search\s+for|i\s+need|mujhe|bhai|bro)\s+(an?\s+)?/i, "").trim();

  const prefixRegex = /^(?:image|picture|photo|pic|img)s?\s*(?:of|about|for)?\s+(.+)$/i;
  const suffixRegex = /^(.+?)\s+(?:ki|ka|ke)?\s*(?:image|picture|photo|pic|img)s?(?:\s+(?:dikhao|do|bhejo|please|chahiye|de|dikhana))?$/i;

  let match = cleanMessage.match(prefixRegex);
  if (match && match[1]) return match[1].trim();

  match = cleanMessage.match(suffixRegex);
  if (match && match[1]) return match[1].trim();

  const origRegex = /(?:image|picture|photo|pic|img)s?\s*(?:of|about|for)?\s+(.+)/i;
  match = message.match(origRegex);
  if (match && match[1]) return match[1].trim();

  const fallbackSuffixRegex = /(.+?)\s+(?:ki|ka|ke)?\s*(?:image|picture|photo|pic|img)s?/i;
  match = message.match(fallbackSuffixRegex);
  if (match && match[1]) return match[1].trim();

  return null;
}

const app = express();

const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

app.use(cors({
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : '*'),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security middlewares
app.use(helmet());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
// Apply the rate limiting middleware to API calls only
app.use("/api/", limiter);

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/quota", (req, res) => {
  try {
    res.json({ date: getTodayDateString(), fast_count: 0, generate_count: 0, ultra_count: 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    let groqKey = process.env.GROQ_API_KEY;
    if (groqKey && (groqKey.includes("MY_GROQ") || groqKey.includes("YOUR_"))) groqKey = undefined;

    if (!groqKey) {
      return res.status(400).json({ 
        error: "Groq API Key is missing. Please add 'GROQ_API_KEY' to your AI Studio Secrets (Settings -> Secrets) to enable voice transcription." 
      });
    }

    const groq = new Groq({ apiKey: groqKey });
    
    // Convert base64 to buffer
    const buffer = Buffer.from(audioBase64, 'base64');
    
    // Write to a temporary file
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const { randomUUID } = await import('crypto');
    const tempFilePath = path.join(os.tmpdir(), `audio_${randomUUID()}.webm`);
    
    fs.writeFileSync(tempFilePath, buffer);

    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-large-v3',
        response_format: 'json',
        prompt: 'The following is a conversation in English and Hinglish (Hindi written in the Latin alphabet). Please transcribe exactly as spoken, keeping Hinglish words in Latin script. Examples: "Haan bhai, kya haal hai?", "Theek hai."',
      });

      res.json({ text: transcription.text });
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error: any) {
    console.error("Transcription Error:", error);
    res.status(500).json({ error: error.message || "Internal server error during transcription." });
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    let geminiKey = process.env.GEMINI_API_KEY;
    let googleKey = process.env.GOOGLE_AI_KEY;
    const apiKey = googleKey || geminiKey;

    if (!apiKey) {
      return res.status(400).json({ error: "Google AI Key is missing." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audioBase64: base64Audio });
    } else {
      throw new Error("Failed to generate audio");
    }
  } catch (error: any) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: error.message || "Internal server error during TTS." });
  }
});

app.post("/api/chat", async (req, res) => {
  const { message, history, mode, systemInstruction, temperature, topP, topK, thinkingMode, searchGrounding, attachments } = req.body;

  if (!message && (!attachments || attachments.length === 0) && mode !== 'image') {
    return res.status(400).json({ error: "Message or attachments are required" });
  }

  const setupSSE = () => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
    }
  };

  try {
    if (mode === "fast" || mode === "pro" || mode === "happy") {
      let geminiKey = process.env.GEMINI_API_KEY;
      let googleKey = process.env.GOOGLE_AI_KEY;
      let groqKey = process.env.GROQ_API_KEY;
      let hfKey = process.env.HF_TOKEN;
      
      // Filter out placeholder keys
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = undefined;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = undefined;
      if (groqKey && (groqKey.includes("MY_GROQ") || groqKey.includes("YOUR_"))) groqKey = undefined;
      if (hfKey && (hfKey.includes("MY_HF") || hfKey.includes("YOUR_"))) hfKey = undefined;

      const apiKey = googleKey || geminiKey;

      const hasAttachments = attachments && attachments.length > 0;

      let searchContext = "";
      let imageMarkdown = "";

      if (searchGrounding) {
        // Build search query: 20% history, 80% exact message
        const lastFewMessages = (history || []).slice(-3).map((m: any) => m?.parts?.[0]?.text || "").join(" ");
        const queryToSearch = `${lastFewMessages} ${message || ""}`.trim();
        if (queryToSearch) {
           searchContext = await performDuckDuckGoSearch(queryToSearch);

           // Check if user is asking for an image
           const imageQuery = extractImageQuery(message);

           if (imageQuery) {
              const imageUrls = await performDuckDuckGoImageSearch(imageQuery);
              if (imageUrls && imageUrls.length > 0) {
                 imageMarkdown = imageUrls.map(url => `![${imageQuery}](${url})`).join('\n\n') + '\n\n';
              }
           }
        }
      }

      // Use Gemini if attachments or thinkingMode is requested, or if searchGrounding is requested and we fallback to it
      // Wait, we don't *force* Gemini for searchGrounding anymore, but let's see.
      // Actually, if we use Groq/HF, they can ALSO use the search context now.
      // But the previous code forced Gemini for searchGrounding.
      // Let's keep forcing Gemini ONLY IF attachments or thinkingMode are present.
      // If ONLY searchGrounding is present, we can use Groq/HF if mode is fast/pro/happy!
      // But wait, the original code forced Gemini if `searchGrounding` was requested.
      // Let's modify the condition:
      if (hasAttachments || thinkingMode) {
        if (!apiKey) {
          return res.status(400).json({ error: "Google AI Key is missing. Please add 'GOOGLE_AI_KEY' or 'GC' to your AI Studio Secrets to enable Vision/Fast Model." });
        }
        
        const ai = new GoogleGenAI({ apiKey });
        let modelName = "gemini-3.1-flash-lite-preview";
        
        const config: any = {
          systemInstruction: systemInstruction,
          temperature: temperature || 0.7,
          topP: topP || 0.95,
          topK: topK || 64,
        };

        if (thinkingMode) {
          config.thinkingConfig = { thinkingLevel: "HIGH" };
        }

        // Format history for Gemini
        const contents: any[] = [];
        if (history && Array.isArray(history)) {
          history.forEach((msg: any) => {
            if (msg.parts && msg.parts[0] && msg.parts[0].text) {
              contents.push({
                role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.parts[0].text }]
              });
            }
          });
        }
        
        const userParts: any[] = [];
        if (hasAttachments) {
          attachments.forEach((att: any) => {
            userParts.push({
              inlineData: {
                data: att.data,
                mimeType: att.mimeType
              }
            });
          });
        }

        let finalMessage = message || " ";
        if (!message || message.trim().length === 0) {
           if (hasAttachments) finalMessage = "Please analyze this image.";
        }

        if (searchGrounding && searchContext) {
           finalMessage = `Context from Web Search:\n${searchContext}\n\nBased on the above context, answer the following:\n${finalMessage}`;
        }
        
        userParts.push({ text: finalMessage });
        contents.push({ role: 'user', parts: userParts });

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: contents,
          config: config
        });

        setupSSE();

        if (imageMarkdown) {
          res.write(`data: ${JSON.stringify({ text: imageMarkdown })}\n\n`);
        }

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();

      } else {
        // Fast, Pro and Happy modes (without Gemini-specific features) use Groq or HuggingFace
        if (!groqKey && !hfKey) {
          return res.status(400).json({ error: "Groq or HuggingFace API Key is missing. Please add 'GROQ_API_KEY' or 'HF_TOKEN' to your AI Studio Secrets to enable Fast/Pro/Happy models." });
        }

        const messages: any[] = [];
        if (systemInstruction && systemInstruction.trim() !== "") {
          messages.push({ role: "system", content: systemInstruction });
        }

        const historyMessages = (history || [])
          .filter((msg: any) => msg?.parts?.[0]?.text && msg.parts[0].text.trim() !== "")
          .map((msg: any) => ({
            role: msg.role === "model" || msg.role === "assistant" ? "assistant" : "user",
            content: msg.parts[0].text
          }));

        messages.push(...historyMessages);

        let finalMessage = message && message.trim() !== "" ? message : " ";
        if (searchGrounding && searchContext) {
           finalMessage = `Context from Web Search:\n${searchContext}\n\nBased on the above context, answer the following:\n${finalMessage}`;
        }

        messages.push({ role: "user", content: finalMessage });

        if (groqKey) {
          const groq = new Groq({ apiKey: groqKey });
          const modelName = mode === "pro" ? "openai/gpt-oss-120b" : mode === "fast" ? "groq/compound-mini" : "llama-3.1-8b-instant";

          const stream = await groq.chat.completions.create({
            messages: messages as any,
            model: modelName,
            temperature: temperature || 0.7,
            top_p: topP || 0.95,
            max_tokens: 4000,
            stream: true,
          });

          setupSSE();

          if (imageMarkdown) {
            res.write(`data: ${JSON.stringify({ text: imageMarkdown })}\n\n`);
          }

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
          }
        } else if (hfKey) {
          const hf = new HfInference(hfKey);
          const modelName = mode === "pro" ? "mistralai/Mistral-7B-Instruct-v0.2" : mode === "fast" ? "HuggingFaceH4/zephyr-7b-beta" : "microsoft/Phi-3-mini-4k-instruct";

          const stream = hf.chatCompletionStream({
            model: modelName,
            messages: messages,
            temperature: temperature || 0.7,
            top_p: topP || 0.95,
            max_tokens: 4000,
          });

          setupSSE();

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
            }
          }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
      }

    } else if (mode === "image") {
      setupSSE();
      const prompt = message && message.trim().length > 0 ? message.trim() : "A beautiful sunset";
      const seed = Math.floor(Math.random() * 1000000);
      const encodedPrompt = encodeURIComponent(prompt).replace(/\(/g, '%28').replace(/\)/g, '%29');
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`;
      const responseText = `![Generated Image](${imageUrl})\n\n*Image generated successfully!*`;
      res.write(`data: ${JSON.stringify({ text: responseText })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();

    } else {
      return res.status(400).json({ error: "Invalid mode selected" });
    }

  } catch (error: any) {
    console.error("Chat API Error:", error);
    let errorMessage = error.message || "Internal server error while processing your request.";
    try {
      const jsonStrMatch = errorMessage.match(/\{.*\}/s);
      if (jsonStrMatch) {
        const parsed = JSON.parse(jsonStrMatch[0]);
        if (parsed.error && parsed.error.message) {
           let innerMsg = parsed.error.message;
           try {
             const innerParsed = JSON.parse(innerMsg);
             if (innerParsed.error && innerParsed.error.message) {
               innerMsg = innerParsed.error.message;
             }
           } catch (e2) {}
           errorMessage = innerMsg;
        } else if (parsed.message) {
           errorMessage = parsed.message;
        }
      }
    } catch (e) {}
    const statusCode = error.status || error.statusCode || 500;
    if (!res.headersSent) {
      res.status(statusCode).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

export default app;
