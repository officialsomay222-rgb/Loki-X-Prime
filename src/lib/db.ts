import Dexie, { Table } from 'dexie';
import { ChatSession } from '../contexts/ChatContext';

export class ChatDatabase extends Dexie {
  sessions!: Table<ChatSession, string>;

  constructor() {
    super('LokiChatDB');
    this.version(1).stores({
      sessions: 'id, title, updatedAt'
    });
  }
}

// Create a dummy fallback for environments where IndexedDB is blocked (e.g., cross-origin iframes)
class DummyTable {
  async add() { return ''; }
  async put() { return ''; }
  async delete() { return; }
  async clear() { return; }
  async get() { return undefined; }
  async count() { return 0; }
  orderBy() { return this; }
  reverse() { return this; }
  async toArray() { return []; }
}

class DummyDb {
  sessions = new DummyTable() as unknown as Table<ChatSession, string>;
}

let dbInstance: ChatDatabase | DummyDb;

try {
  dbInstance = new ChatDatabase();
} catch (e) {
  console.warn('Failed to initialize IndexedDB, using in-memory fallback:', e);
  dbInstance = new DummyDb();
}

export const localDb = dbInstance as ChatDatabase;
