import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, slot } = req.body;

  if (!message || !slot) {
    return res.status(400).json({ error: 'Message and slot are required' });
  }

  try {
    let responseText = '';

    if (slot === '1' || slot === '2') {
      // Groq API Logic
      // Slot 1: groq/compound-mini
      // Slot 2: openai/gpt-oss-120b
      const model = slot === '1' ? 'groq/compound-mini' : 'openai/gpt-oss-120b';
      
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: message }]
        })
      });
      
      const data = await groqRes.json();
      if (!groqRes.ok) throw new Error(data.error?.message || 'Groq API Error');
      responseText = data.choices[0].message.content;

    } else if (slot === '3') {
      // Gemini API Logic
      // Using the correct model name for gemini lite preview
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: message,
      });
      
      responseText = response.text;
    } else {
      return res.status(400).json({ error: 'Invalid slot selected' });
    }

    // Return the successful response
    return res.status(200).json({ response: responseText });

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: 'Internal server error while processing your request.' });
  }
}
