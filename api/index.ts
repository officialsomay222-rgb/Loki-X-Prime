import express from "express";
import { GoogleGenAI } from "@google/genai";

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
      // All text modes now use Gemini for advanced, human-like Hinglish responses
      let geminiKey = process.env.GEMINI_API_KEY;
      let googleKey = process.env.GOOGLE_AI_KEY;
      
      // Filter out placeholder keys
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = undefined;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = undefined;

      const apiKey = googleKey || geminiKey || process.env.API_KEY;
      
      if (!apiKey) {
        throw new Error("API Key is missing or invalid. Please add a real GOOGLE_AI_KEY or GEMINI_API_KEY to your AI Studio Secrets.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      let modelName = "gemini-1.5-flash-latest"; // Using flash-latest for better stability in fast mode
      if (mode === "pro") {
        modelName = "gemini-3.1-pro-preview";
      } else if (mode === "happy") {
        modelName = "gemini-3-flash-preview";
      }

      // Format history for Gemini
      const rawContents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((msg: any) => {
          if (msg.parts && msg.parts[0] && msg.parts[0].text) {
            rawContents.push({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: msg.parts[0].text }]
            });
          }
        });
      }
      
      // Add the current message
      rawContents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Ensure strictly alternating roles starting with 'user'
      const contents: any[] = [];
      let expectedRole = 'user';
      
      for (const item of rawContents) {
        if (item.role === expectedRole) {
          contents.push(item);
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        } else {
          // Merge consecutive messages of the same role
          if (contents.length > 0) {
            const last = contents[contents.length - 1];
            last.parts[0].text += "\n\n" + item.parts[0].text;
          } else if (item.role === 'model') {
            // Skip model message if it's the first message
            continue;
          }
        }
      }

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

    } else if (mode === "image") {
      // Image Generation Logic
      let geminiKey = process.env.GEMINI_API_KEY;
      let googleKey = process.env.GOOGLE_AI_KEY;
      
      // Filter out placeholder keys
      if (geminiKey && (geminiKey.includes("MY_GEMINI") || geminiKey.includes("YOUR_"))) geminiKey = undefined;
      if (googleKey && (googleKey.includes("MY_GOOGLE") || googleKey.includes("YOUR_"))) googleKey = undefined;

      const apiKey = googleKey || geminiKey || process.env.API_KEY;
      
      if (!apiKey) {
        throw new Error("API Key is missing or invalid. Please add a real GOOGLE_AI_KEY or GEMINI_API_KEY to your AI Studio Secrets.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: message,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Failed to generate image. The model did not return image data.");
      }

      const base64EncodeString = response.generatedImages[0].image.imageBytes;

      const responseText = `![Generated Image](data:image/jpeg;base64,${base64EncodeString})`;
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
