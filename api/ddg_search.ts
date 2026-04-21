import * as cheerio from 'cheerio';

export async function performDuckDuckGoSearch(query: string): Promise<string> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!res.ok) {
        console.warn(`DuckDuckGo search returned ${res.status}`);
        return "";
    }

    const text = await res.text();
    const $ = cheerio.load(text);

    let results: string[] = [];
    $('.result').each((i, el) => {
      if (i >= 5) return; // Top 5 results
      const title = $(el).find('.result__title').text().trim();
      const snippet = $(el).find('.result__snippet').text().trim();
      if (snippet && title) {
        results.push(`[${title}]\n${snippet}`);
      }
    });

    return results.join('\n\n');
  } catch (err) {
    console.error("DuckDuckGo Search Error:", err);
    return "";
  }
}

export async function performDuckDuckGoImageSearch(query: string): Promise<string[]> {
  try {
    const res = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iax=images&ia=images`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!res.ok) {
        console.warn(`DuckDuckGo image search returned ${res.status}`);
        return [];
    }

    const text = await res.text();
    const vqdMatch = text.match(/vqd=([0-9-]+)/);

    if (vqdMatch) {
      const vqd = vqdMatch[1];
      const imgRes = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}&f=,,,,,&p=1`, {
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          }
      });

      if (!imgRes.ok) {
          console.warn(`DuckDuckGo image api returned ${imgRes.status}`);
          return [];
      }

      const imgData = await imgRes.json();
      if (imgData && imgData.results && imgData.results.length > 0) {
        // Return up to 3 image URLs
        return imgData.results.slice(0, 3).map((i: any) => i.image);
      }
    }
    return [];
  } catch (err) {
    console.error("DuckDuckGo Image Search Error:", err);
    return [];
  }
}
