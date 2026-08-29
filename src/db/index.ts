import Dexie, { type Table } from 'dexie'
import type { Session, Message, Document, Folder } from '@/types'

class AppDB extends Dexie {
  sessions!: Table<Session>
  messages!: Table<Message>
  documents!: Table<Document>
  folders!: Table<Folder>

  constructor() {
    super('dcrdci-db')
    this.version(1).stores({
      sessions: 'id, roleId, createdAt, updatedAt',
      messages: 'id, sessionId, role, createdAt',
      documents: 'id, sessionId, emotion, status, createdAt',
      roles: 'id, isBuiltin, createdAt',
    })
    this.version(2)
      .stores({
        sessions: 'id, folderId, createdAt, updatedAt',
        messages: 'id, sessionId, role, createdAt',
        documents: 'id, sessionId, folderId, emotion, status, createdAt',
        folders: 'id, createdAt',
        roles: null,
      })
      .upgrade(async (tx) => {
        await tx.table('roles').clear()
        const docs = await tx.table('documents').toCollection().toArray()
        for (const doc of docs) {
          await tx.table('documents').update(doc.id, { folderId: '' })
        }
        const sessions = await tx.table('sessions').toCollection().toArray()
        for (const s of sessions) {
          await tx.table('sessions').update(s.id, { folderId: (s as any).roleId ?? '' })
        }
      })
    this.version(3)
      .stores({
        sessions: 'id, createdAt, updatedAt',
        messages: 'id, sessionId, role, createdAt',
        documents: 'id, sessionId, folderId, theme, status, createdAt',
        folders: 'id, createdAt',
      })
      .upgrade(async (tx) => {
        const docs = await tx.table('documents').toCollection().toArray()
        for (const doc of docs) {
          await tx.table('documents').update(doc.id, {
            theme: (doc as any).emotion ?? 'general',
          })
        }
        const sessions = await tx.table('sessions').toCollection().toArray()
        for (const s of sessions) {
          await tx.table('sessions').update(s.id, {
            selectedFolderIds: [],
            mainLinkContent: '',
          })
        }
      })
    this.version(4)
      .stores({
        sessions: 'id, createdAt, updatedAt',
        messages: 'id, sessionId, role, createdAt',
        documents: 'id, sessionId, *folderIds, theme, status, createdAt',
        folders: 'id, createdAt',
      })
      .upgrade(async (tx) => {
        const docs = await tx.table('documents').toCollection().toArray()
        for (const doc of docs) {
          const oldFolderId = (doc as any).folderId
          await tx.table('documents').update(doc.id, {
            folderIds: oldFolderId ? [oldFolderId] : [],
          })
        }
      })
  }
}

export const db = new AppDB()
