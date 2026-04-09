import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import Database from "better-sqlite3";

const app = express();

// Initialize Quota Tracker Database
const quotaDb = new Database('quota.db');
quotaDb.exec(`
  CREATE TABLE IF NOT EXISTS imagen_quota (
    date TEXT PRIMARY KEY,
    fast_count INTEGER DEFAULT 0,
    generate_count INTEGER DEFAULT 0,
    ultra_count INTEGER DEFAULT 0
  )
`);

const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// In-memory tracker for consecutive failures
const consecutiveFailures = {
  fast: 0,
  generate: 0,
  ultra: 0
};

let lastQuotaDate = getTodayDateString();

const getTodayQuota = () => {
  const dateStr = getTodayDateString();

  if (dateStr !== lastQuotaDate) {
    // New day has started: reset the consecutive failures globally
    consecutiveFailures.fast = 0;
    consecutiveFailures.generate = 0;
    consecutiveFailures.ultra = 0;
    lastQuotaDate = dateStr;
  }

  let row = quotaDb.prepare('SELECT * FROM imagen_quota WHERE date = ?').get(dateStr) as any;
  if (!row) {
    quotaDb.prepare('INSERT INTO imagen_quota (date, fast_count, generate_count, ultra_count) VALUES (?, 0, 0, 0)').run(dateStr);
    row = { date: dateStr, fast_count: 0, generate_count: 0, ultra_count: 0 };
  }
  return row;
};
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/quota", (req, res) => {
  try {
    const quota = getTodayQuota();
    res.json(quota);
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

    let groqKey = process.env.GROQ_API_KEY || process.env.GR;
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
    const tempFilePath = path.join(os.tmpdir(), `audio_${randomUUID()}.${mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm'}`);
    
    fs.writeFileSync(tempFilePath, buffer);

    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-large-v3-turbo',
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

    let geminiKey = process.env.GEMINI_API_KEY || process.env.GC;
    let googleKey = process.env.GOOGLE_AI_KEY || process.env.API_KEY;
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

  if (!message || !mode) {
    return res.status(400).json({ error: "Message and mode are required" });
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
      let geminiKey = process.env.GEMINI_API_KEY || process.env.GC;
      let googleKey = process.env.GOOGLE_AI_KEY;
      let groqKey = process.env.GROQ_API_KEY || process.env.GR;
      
      // Filter out placeholder keys
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = undefined;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = undefined;
      if (groqKey && (groqKey.includes("MY_GROQ") || groqKey.includes("YOUR_"))) groqKey = undefined;

      const apiKey = googleKey || geminiKey || process.env.API_KEY;

      const hasAttachments = attachments && attachments.length > 0;

      if (mode === "fast" || hasAttachments) {
        // Fast mode or when attachments are present uses Gemini
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

        if (searchGrounding) {
          modelName = "gemini-3-flash-preview";
          config.tools = [{ googleSearch: {} }];
        }

        if (thinkingMode) {
          // Thinking mode is only available for Gemini 3 series
          config.thinkingConfig = { thinkingLevel: "HIGH" };
        }

        // Format history for Gemini
        const contents: any[] = [];
        if (history && Array.isArray(history)) {
          history.forEach((msg: any) => {
            if (msg.parts && msg.parts[0] && msg.parts[0].text) {
              contents.push({
                role: msg.role === 'model' ? 'model' : 'user',
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
        if (message && message.trim().length > 0) {
          userParts.push({ text: message });
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

        setupSSE();
        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();

      } else if (mode === "pro" || mode === "happy") {
        // Pro and Happy modes use Groq as requested
        if (!groqKey) {
          return res.status(400).json({ error: "Groq API Key is missing. Please add 'GROQ_API_KEY' or 'GR' to your AI Studio Secrets to enable Pro/Happy models." });
        }

        const groq = new Groq({ apiKey: groqKey });
        
        // Pro: llama-3.3-70b-versatile
        // Happy: llama-3.1-8b-instant
        const modelName = mode === "pro" ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";

        const messages = [
          { role: "system", content: systemInstruction },
          ...(history || []).map((msg: any) => ({
            role: msg.role === "model" ? "assistant" : "user",
            content: msg.parts[0].text
          })),
          { role: "user", content: message }
        ];

        const stream = await groq.chat.completions.create({
          messages: messages as any,
          model: modelName,
          temperature: temperature || 0.7,
          top_p: topP || 0.95,
          stream: true,
        });

        setupSSE();
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
          }
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
      }

    } else if (mode === "image") {
      // Image Generation Logic using Gemini for refinement and Imagen for generation
      let geminiKey = process.env.GEMINI_API_KEY || process.env.GC;
      let googleKey = process.env.GOOGLE_AI_KEY;
      
      // Filter out placeholder keys
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = undefined;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = undefined;

      const apiKey = googleKey || geminiKey || process.env.API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Google AI Key (GC) is missing or invalid. Please add a real GOOGLE_AI_KEY or GC to your AI Studio Secrets." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Keep connection alive with SSE comments
      setupSSE();
      const pingInterval = setInterval(() => {
        res.write(`:\n\n`);
      }, 15000);

      try {
        // Step 1: Refine prompt using Gemini
        let detailedPrompt = message;
        try {
          const refinementResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: `[IMAGE_MODE] Create a stunning visual description for: ${message}`,
            config: {
              systemInstruction: "Tum ek expert Image Prompt Engineer ho. Jab user '[IMAGE_MODE]' flag ke saath koi request bheje, toh tum us text ko ek detailed, artistic, aur high-quality visual description mein badal do. Description ko Imagen 4 model ke liye optimize karo (lighting, style, aur camera angles add karo). Sirf description likhna, koi extra baat mat karna."
            }
          });
          detailedPrompt = refinementResponse.text || message;
        } catch (e) {
          console.error("Gemini refinement failed, using original prompt:", e);
        }

        // Step 2: Generate image using Google Imagen 4 models with predictive failover and quota checking
        let base64EncodeString = null;
        let lastError: any = null;
        const dateStr = getTodayDateString();

        while (true) {
          const quota = getTodayQuota();
          let activeModel = null;
          let modelTier: 'fast' | 'generate' | 'ultra' | null = null;

          if (quota.fast_count < 25 && consecutiveFailures.fast < 3) {
            activeModel = "imagen-4.0-fast-generate-001";
            modelTier = 'fast';
            if (quota.fast_count >= 20) {
              console.warn(`Preemptive Alert: Imagen 4 fast pool is nearing exhaustion (${quota.fast_count}/25).`);
            }
          } else if (quota.generate_count < 25 && consecutiveFailures.generate < 3) {
            activeModel = "imagen-4.0-generate-001";
            modelTier = 'generate';
            if (quota.generate_count >= 20) {
              console.warn(`Preemptive Alert: Imagen 4 generate pool is nearing exhaustion (${quota.generate_count}/25).`);
            }
          } else if (quota.ultra_count < 25 && consecutiveFailures.ultra < 3) {
            activeModel = "imagen-4.0-ultra-generate-001";
            modelTier = 'ultra';
            if (quota.ultra_count >= 20) {
              console.warn(`Preemptive Alert: Imagen 4 ultra pool is nearing exhaustion (${quota.ultra_count}/25).`);
            }
          }

          if (!activeModel || !modelTier) {
            const nextMidnight = new Date();
            nextMidnight.setUTCHours(24, 0, 0, 0); // Next 00:00 UTC
            throw new Error(`Daily image generation limit reached. Limits reset at ${nextMidnight.toISOString()}`);
          }

          try {
            // Strict Version Control Pre-flight Payload Check
            const targetModel = activeModel;
            if (!targetModel.startsWith("imagen-4")) {
               throw new Error("Critical: Version Mismatch/Downgrade Attempted - Pre-flight check failed");
            }

            const response = await ai.models.generateImages({
              model: targetModel,
              prompt: detailedPrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: "image/jpeg"
              }
            });

            const generatedImage = response.generatedImages?.[0];
            if (!generatedImage || !generatedImage.image || !generatedImage.image.imageBytes) {
              throw new Error(`Model ${activeModel} returned empty image data`);
            }

            base64EncodeString = generatedImage.image.imageBytes;

            // Success: update DB counter and reset failures
            quotaDb.prepare(`UPDATE imagen_quota SET ${modelTier}_count = ${modelTier}_count + 1 WHERE date = ?`).run(dateStr);
            consecutiveFailures[modelTier] = 0;
            break; // Success, exit loop

          } catch (e: any) {
            console.warn(`Failed with model ${activeModel}:`, e);
            lastError = e;

            // Failover logic based on error type
            if (e.status === 429 || e.message?.includes("429") || e.message?.includes("quota")) {
               // Rate limit exceeded: force failover by maxing quota
               quotaDb.prepare(`UPDATE imagen_quota SET ${modelTier}_count = 25 WHERE date = ?`).run(dateStr);
            } else {
               // Non-quota error (500, 503, etc): increment consecutive failures
               consecutiveFailures[modelTier]++;
            }
          }
        }

        // Use a cleaner response format - Only send the image markdown
        const responseText = `![Generated Image](data:image/jpeg;base64,${base64EncodeString})`;
        res.write(`data: ${JSON.stringify({ text: responseText })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      } finally {
        clearInterval(pingInterval);
      }

    } else {
      return res.status(400).json({ error: "Invalid mode selected" });
    }

  } catch (error: any) {
    console.error("Chat API Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Internal server error while processing your request." });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || "Internal server error while processing your request." })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

export default app;
