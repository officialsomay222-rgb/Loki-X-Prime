const fs = require('fs');

let content = fs.readFileSync('src/contexts/ChatContext.tsx', 'utf8');

// I need to find the history slice logic to see where we use the Dexie db for history
const searchHistory = `      const currentMessages = await localDb.messages.where('sessionId').equals(currentSessionId).sortBy('timestamp');
      const history = currentMessages.slice(0, -1).map(m => ({`;
const replaceHistory = `      let history: { role: 'user' | 'model', content: string }[] = [];
      if (isLoggedIn) {
        const currentMessages = await localDb.messages.where('sessionId').equals(currentSessionId).sortBy('timestamp');
        history = currentMessages.slice(0, -1).map(m => ({
          role: m.role,
          content: m.content
        }));
      }`;

content = content.replace(searchHistory, replaceHistory);

const replaceHistoryEnd = `        role: m.role,
        content: m.content
      }));`;
content = content.replace(replaceHistoryEnd, ``);

fs.writeFileSync('src/contexts/ChatContext.tsx', content);
