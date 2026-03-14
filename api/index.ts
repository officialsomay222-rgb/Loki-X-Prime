import express from "express";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
      return res.status(400).json({ error: "Groq API Key (GR) is missing or invalid." });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(audioBase64, 'base64');
    
    // Use fetch to send to Groq API
    const formData = new FormData();
    const extension = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm';
    const blob = new Blob([buffer], { type: mimeType || 'audio/webm' });
    formData.append('file', blob, `audio.${extension}`);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'json');
    formData.append('prompt', 'The following is a conversation in English and Hinglish (Hindi written in the Latin alphabet). Please transcribe exactly as spoken, keeping Hinglish words in Latin script. Examples: "Haan bhai, kya haal hai?", "I am doing good", "Theek hai."');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq transcription error:", errorText);
      return res.status(response.status).json({ error: `Groq API Error: ${response.statusText}` });
    }

    const data = await response.json();
    res.json({ text: data.text });
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
    let googleKey = process.env.GOOGLE_AI_KEY;
    const apiKey = googleKey || geminiKey || process.env.API_KEY;

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
  const { message, history, mode, systemInstruction, temperature, topP, topK } = req.body;

  if (!message || !mode) {
    return res.status(400).json({ error: "Message and mode are required" });
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

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

      if (mode === "fast") {
        // Fast mode uses Gemini 3.1 Flash Lite as requested
        if (!apiKey) {
          throw new Error("Google AI Key (GC) is missing or invalid. Please add a real GOOGLE_AI_KEY or GC to your AI Studio Secrets.");
        }
        
        const ai = new GoogleGenAI({ apiKey });
        const modelName = "gemini-3.1-flash-lite-preview";

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
        contents.push({ role: 'user', parts: [{ text: message }] });

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: temperature || 0.7,
            topP: topP || 0.95,
            topK: topK || 64,
          }
        });

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
          throw new Error("Groq API Key (GR) is missing or invalid. Please add a real GROQ_API_KEY or GR to your AI Studio Secrets.");
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
      // Image Generation Logic using Gemini for refinement and Hugging Face FLUX
      let geminiKey = process.env.GEMINI_API_KEY || process.env.GC;
      let googleKey = process.env.GOOGLE_AI_KEY;
      let hfToken = process.env.HF_TOKEN || process.env.HF;
      
      // Filter out placeholder keys
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = undefined;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = undefined;
      if (hfToken && (hfToken.includes("MY_HF") || hfToken.includes("YOUR_"))) hfToken = undefined;

      const apiKey = googleKey || geminiKey || process.env.API_KEY;
      
      if (!apiKey) {
        throw new Error("Google AI Key (GC) is missing or invalid. Please add a real GOOGLE_AI_KEY or GC to your AI Studio Secrets.");
      }

      if (!hfToken) {
        throw new Error("Hugging Face Token (HF) is missing. Please add it to your AI Studio Secrets.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Keep connection alive with SSE comments
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
              systemInstruction: "Tum ek expert Image Prompt Engineer ho. Jab user '[IMAGE_MODE]' flag ke saath koi request bheje, toh tum us text ko ek detailed, artistic, aur high-quality visual description mein badal do. Description ko FLUX model ke liye optimize karo (lighting, style, aur camera angles add karo). Sirf description likhna, koi extra baat mat karna."
            }
          });
          detailedPrompt = refinementResponse.text || message;
        } catch (e) {
          console.error("Gemini refinement failed, using original prompt:", e);
        }

        // Step 2: Generate image using Hugging Face stabilityai/stable-diffusion-xl-base-1.0
        const { HfInference } = await import("@huggingface/inference");
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
        const base64EncodeString = Buffer.from(imageBuffer).toString('base64');

        if (!base64EncodeString || base64EncodeString.length < 100) {
          throw new Error("Generated image data is invalid or empty.");
        }

        let mimeType = blob.type;
        if (!mimeType || !mimeType.startsWith('image/')) {
          mimeType = 'image/jpeg';
        }
        
        // Use a cleaner response format - Only send the image markdown
        const responseText = `![Generated Image](data:${mimeType};base64,${base64EncodeString})`;
        res.write(`data: ${JSON.stringify({ text: responseText })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
      } finally {
        clearInterval(pingInterval);
      }

    } else {
      throw new Error("Invalid mode selected");
    }

  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || "Internal server error while processing your request." })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

export default app;
