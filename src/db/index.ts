import Dexie, { type Table } from 'dexie'
import type { Session, Message, Document, Role } from '@/types'

class AppDB extends Dexie {
  sessions!: Table<Session>
  messages!: Table<Message>
  documents!: Table<Document>
  roles!: Table<Role>

  constructor() {
    super('dcrdci-db')
    this.version(1).stores({
      sessions: 'id, roleId, createdAt, updatedAt',
      messages: 'id, sessionId, role, createdAt',
      documents: 'id, sessionId, emotion, status, createdAt',
      roles: 'id, isBuiltin, createdAt',
    })
  }
}

export const db = new AppDB()