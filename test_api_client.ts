import { generateChatResponse } from './src/services/geminiService';
import 'dotenv/config'; // Just to populate things if needed, but we don't need frontend envs.

// Polyfill fetch and others if needed, but tsx under node should have them (Node 18+)
async function run() {
  console.log('Testing generateChatResponse...');
  const params = {
    message: "Hi there!",
    history: [],
    mode: "happy" as const,
    thinkingMode: false,
    searchGrounding: false,
    systemInstruction: "You are a helpful assistant.",
  };

  try {
    // Override fetch to point to localhost:3000
    const originalFetch = global.fetch;
    global.fetch = function(url, options) {
      if (typeof url === 'string' && url.startsWith('/')) {
        url = 'http://localhost:3000' + url;
      }
      return originalFetch(url, options);
    };

    const stream = await generateChatResponse(params);
    console.log('Got stream response.');

    for await (const chunk of stream) {
      process.stdout.write(chunk.text);
    }
    console.log('\n\nDone.');
  } catch (error) {
    console.error('Error generating chat response:', error);
  }
}

run();