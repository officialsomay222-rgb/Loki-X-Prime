import express from "express";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const app = express();
app.use(express.json());

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
        
        // Pro: openai/gpt-oss-120b (as requested from Groq console)
        // Happy: groq/compound-mini (as requested from Groq console)
        const modelName = mode === "pro" ? "openai/gpt-oss-120b" : "groq/compound-mini";

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
      // Image Generation Logic using Gemini 2.5 Flash Image
      let geminiKey = process.env.GEMINI_API_KEY || process.env.GC;
      let googleKey = process.env.GOOGLE_AI_KEY;
      
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = undefined;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = undefined;

      const apiKey = googleKey || geminiKey || process.env.API_KEY;
      
      if (!apiKey) {
        throw new Error("Google AI Key (GC) is missing or invalid. Please add a real GOOGLE_AI_KEY or GC to your AI Studio Secrets.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Step 1: Refine prompt using Gemini
      let detailedPrompt = message;
      try {
        const refinementResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-preview",
          contents: `[IMAGE_MODE] Create a stunning visual description for: ${message}`,
          config: {
            systemInstruction: "Tum ek expert Image Prompt Engineer ho. Jab user '[IMAGE_MODE]' flag ke saath koi request bheje, toh tum us text ko ek detailed, artistic, aur high-quality visual description mein badal do. Description ko image generation model ke liye optimize karo (lighting, style, aur camera angles add karo). Sirf description likhna, koi extra baat mat karna."
          }
        });
        detailedPrompt = refinementResponse.text || message;
      } catch (e) {
        console.error("Gemini refinement failed, using original prompt:", e);
      }

      // Step 2: Generate image using gemini-2.5-flash-image
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: detailedPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let base64Image = "";
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }

      if (!base64Image) {
        throw new Error("Gemini failed to generate an image. Please try a different prompt.");
      }

      const responseText = `![Generated Image](data:image/png;base64,${base64Image})\n\n**Refined Prompt:** ${detailedPrompt}`;
      res.write(`data: ${JSON.stringify({ text: responseText })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();

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
