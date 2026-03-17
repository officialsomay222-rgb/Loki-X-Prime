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

export const localDb = new ChatDatabase();
