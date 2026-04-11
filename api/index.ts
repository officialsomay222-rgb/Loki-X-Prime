import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { HfInference } from "@huggingface/inference";

const app = express();

const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
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
      let hfKey = process.env.HF_TOKEN || process.env.HF;
      
      // Filter out placeholder keys
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = undefined;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = undefined;
      if (groqKey && (groqKey.includes("MY_GROQ") || groqKey.includes("YOUR_"))) groqKey = undefined;
      if (hfKey && (hfKey.includes("MY_HF") || hfKey.includes("YOUR_"))) hfKey = undefined;

      const apiKey = googleKey || geminiKey || process.env.API_KEY;

      const hasAttachments = attachments && attachments.length > 0;

      if (hasAttachments) {
        // When attachments are present uses Gemini
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

      } else if (mode === "fast" || mode === "pro" || mode === "happy") {
        // Fast, Pro and Happy modes use Groq or HuggingFace as fallback
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
            role: msg.role === "model" ? "assistant" : "user",
            content: msg.parts[0].text
          }));

        messages.push(...historyMessages);
        if (message && message.trim() !== "") {
          messages.push({ role: "user", content: message });
        } else {
          // If message is somehow empty, push a space to avoid 400 Bad Request
          messages.push({ role: "user", content: " " });
        }

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
      // Image Generation using Pollinations.ai (Free, no API key required)
      setupSSE();

      // Ensure there is a prompt
      const prompt = message && message.trim().length > 0 ? message.trim() : "A beautiful sunset";

      // Generate a random seed to avoid browser caching of the exact same prompt
      const seed = Math.floor(Math.random() * 1000000);

      // Construct the Pollinations URL
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;

      // Send the image back in Markdown format
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

    // Attempt to extract cleaner error messages if it's a JSON string dump
    try {
      // Sometimes errors are prefixed with a status code like "400 {\"error\":...}"
      const jsonStrMatch = errorMessage.match(/\{.*\}/s);
      if (jsonStrMatch) {
        const parsed = JSON.parse(jsonStrMatch[0]);
        if (parsed.error && parsed.error.message) {
           // Groq or nested generic format
           let innerMsg = parsed.error.message;
           // Gemini might double-encode the error inside the message
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
    } catch (e) {
      // Leave errorMessage as is if parsing fails
    }

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
