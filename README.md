<div align="center">
  <img src="https://i.ibb.co/5XjVRg3S/Picsart-26-03-07-20-42-18-789.png" alt="Loki X Prime Logo" width="200" height="200" />

  <h1>🌟 LOKI X PRIME 🌟</h1>
  <p><strong>Next-Generation AI Assistant Platform</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

<br />

## 📖 Introduction

Welcome to **Loki X Prime**, a cutting-edge, highly immersive AI assistant platform designed to deliver an unparalleled conversational experience. Built using modern web technologies like React 19, Vite 6, and Tailwind CSS v4, this application seamlessly integrates the intelligence of **Google Gemini** and the lightning-fast inference of **Groq**.

Loki X Prime isn't just a chatbot; it's a fully-fledged productivity and exploration tool wrapped in a stunning UI. With a focus on buttery-smooth, hardware-accelerated animations, deep personalization, and multi-platform support (PWA and Native Mobile via Capacitor), it sets a new standard for AI interfaces.

---

## ⚡ Capabilities & Core Features

- 🧠 **Multi-Model Intelligence:** Switch seamlessly between deep-reasoning Gemini models and hyper-fast Groq backend processing for dynamic interactions.
- 🎨 **Immersive 3D UI & Animations:** Experience a cinematic "Awakening" interface powered by React Three Fiber, Framer Motion, and HTML5 Canvas overlays—designed for zero-lag, buttery-smooth visual fidelity.
- 🎙️ **Live Voice & Audio:** Native mobile microphone integration using Capacitor for fluid, real-time voice inputs and realistic text-to-speech feedback.
- 📱 **Cross-Platform PWA & Mobile Native:** Engineered as a Progressive Web App and packaged as a native Android app. Respects safe area insets and responsive design principles for flawless mobile operation.
- 💾 **Local Offline Storage:** Your timelines and data stay yours. Fully decentralized local storage powered by Dexie (IndexedDB) with robust AES encryption for sensitive configuration.
- 📝 **Rich Markdown & Code Rendering:** Beautiful, syntax-highlighted code blocks, tables, and complex markdown structures natively supported.
- ⚙️ **Extreme Customizability:** Adjust system instructions, temperatures, visual themes, avatar shapes, background styles, and UI density through an extensive Settings interface.

---

## 🏗️ Architecture & Tech Stack

**Frontend:**
- **Framework:** React 19 + Vite 6
- **Styling:** Tailwind CSS v4, Framer Motion, custom CSS Keyframes & Canvas integrations for "Makhan" (smooth) animations.
- **State Management:** Zustand (Global State) + React Query (Data Fetching)
- **Local Database:** Dexie.js (IndexedDB)
- **3D Rendering:** Three.js / @react-three/fiber / @react-three/drei

**Backend & AI Integrations:**
- **Server:** Node.js + Express (dynamic API routes)
- **Database (Server-Side):** Better SQLite3
- **AI Providers:** `@google/genai` (exclusively Imagen 3 for generation), `groq-sdk` for ultra-fast completions.

**Mobile:**
- **Framework:** Capacitor 8 (Android target)
- **Plugins:** Keyboard, Voice Recorder, Core APIs.

---

## 👨‍💻 About the Creator

<div align="center">
  <img src="./public/Picsart_26-02-28_11-29-26-443.jpg" alt="Somay Avatar" width="150" height="150" style="border-radius: 50%; border: 4px solid #00f2ff; box-shadow: 0 0 15px rgba(0,242,255,0.5);" />
  <h3>Somay a.k.a. Owner</h3>
  <p><em>Lead Architect & Developer</em></p>
  <p>Passionate about crafting "God-level" UI/UX experiences, bleeding-edge AI integrations, and high-performance software engineering.</p>
</div>

---

## 🚀 Run Locally

This repository contains everything you need to run your app locally.

**Prerequisites:** Node.js (v18+ recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure Environment:**
   Create a `.env.local` file (or use `.env.example` as a template) and set your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. **Run the app (Development Mode):**
   ```bash
   npm run dev
   ```
4. **Build for Production:**
   ```bash
   npm run build
   ```

**Live Preview in AI Studio:** [View your app](https://ai.studio/apps/0d515a0e-3432-4baa-a9e6-19c5fdd86fd6)
