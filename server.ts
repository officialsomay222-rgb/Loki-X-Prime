import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

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

    try {
      let responseText = "";

      if (mode === "fast") {
        // Fast Mode: Gemini 3.1 Flash Lite via Google GenAI
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
        const modelName = "gemini-3.1-flash-lite-preview";

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

        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: temperature || 0.7,
            topP: topP || 0.95,
            topK: topK || 64,
          }
        });

        responseText = response.text;

      } else if (mode === "pro" || mode === "happy") {
        // Pro & Happy Modes: Groq API
        // Pro -> "gpt oss 120b" (User specified)
        // Happy -> "groq compound" (User specified)
        
        const modelMap: Record<string, string> = {
          "pro": "openai/gpt-oss-120b",
          "happy": "groq/compound"
        };

        const model = modelMap[mode];

        const messages = [];
        if (systemInstruction) {
          messages.push({ role: "system", content: systemInstruction });
        }
        
        // Add history
        if (history && Array.isArray(history)) {
          history.forEach((msg: any) => {
            messages.push({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.parts[0].text });
          });
        }
        
        messages.push({ role: "user", content: message });

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: temperature || 0.7,
            top_p: topP || 0.95,
          })
        });
        
        const data = await groqRes.json();
        if (!groqRes.ok) throw new Error(data.error?.message || "Groq API Error");
        responseText = data.choices[0].message.content;

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

        responseText = `![Generated Image](data:image/jpeg;base64,${base64EncodeString})`;

      } else {
        return res.status(400).json({ error: "Invalid mode selected" });
      }

      // Clean up any <think> or <thought> tags from the response
      if (responseText) {
        responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
      }

      return res.status(200).json({ response: responseText });

    } catch (error: any) {
      console.error("Chat API Error:", error);
      return res.status(500).json({ error: error.message || "Internal server error while processing your request." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
