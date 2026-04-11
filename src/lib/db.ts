import Dexie, { Table } from 'dexie';
import { ChatSession } from '../contexts/ChatContext';

import { Message } from '../contexts/ChatContext';

export class ChatDatabase extends Dexie {
  sessions!: Table<Omit<ChatSession, 'messages'>, string>;
  messages!: Table<Message & { sessionId: string }, string>;

  constructor() {
    super('LokiChatDB');
    this.version(3).stores({
      sessions: 'id, title, updatedAt',
      messages: 'id, sessionId, timestamp'
    });
    this.version(2).stores({
      sessions: 'id, title, updatedAt',
      messages: 'id, sessionId, timestamp'
    }).upgrade(tx => {
      // Migration: split messages out of sessions
      return tx.table('sessions').toCollection().modify(session => {
        if (session.messages && Array.isArray(session.messages)) {
          const messagesToInsert = session.messages.map(m => ({ ...m, sessionId: session.id }));
          if (messagesToInsert.length > 0) {
            tx.table('messages').bulkAdd(messagesToInsert).catch(console.error);
          }
          delete session.messages;
        }
      });
    });
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
  sessions = new DummyTable() as unknown as Table<Omit<ChatSession, 'messages'>, string>;
  messages = new DummyTable() as unknown as Table<Message & { sessionId: string }, string>;
}

let dbInstance: ChatDatabase | DummyDb;

try {
  dbInstance = new ChatDatabase();
} catch (e) {
  console.warn('Failed to initialize IndexedDB, using in-memory fallback:', e);
  dbInstance = new DummyDb();
}

export const localDb = dbInstance as ChatDatabase;
