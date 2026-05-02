import express from "express";
import { createServer as createViteServer } from "vite";
import apiApp from "./api/index.ts";
import fs from "fs";
import path from "path";

async function startServer() {
  const app = express();

  // Security: Trust the reverse proxy (Vercel/Cloudflare) to get real client IPs
  // This is required for rate limiting to work correctly and prevent accidental DoS
  app.set("trust proxy", 1);

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Mount API routes
  app.use(apiApp);

  const isProduction = process.env.NODE_ENV === "production";

  // Vite middleware for development
  if (!isProduction) {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    app.use(express.static("dist"));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} (Production: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
