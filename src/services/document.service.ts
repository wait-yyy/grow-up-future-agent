import { db } from '@/db'
import type { Document, DocumentStatus } from '@/types'
import { generateId } from '@/utils'

export async function createDocuments(docs: Omit<Document, 'id' | 'createdAt'>[]): Promise<string[]> {
  const now = Date.now()
  const records: Document[] = docs.map((d, i) => ({
    ...d,
    id: generateId('doc'),
    createdAt: now + i,
  }))
  await db.documents.bulkAdd(records)
  return records.map(r => r.id)
}

export async function getBySession(sessionId: string, status?: DocumentStatus): Promise<Document[]> {
  const all = await db.documents.where('sessionId').equals(sessionId).toArray()
  return status ? all.filter(d => d.status === status) : all
}

export async function updateStatus(id: string, status: DocumentStatus): Promise<void> {
  await db.documents.update(id, { status })
}

export async function applyToRole(docId: string, roleId: string): Promise<void> {
  await db.documents.update(docId, { appliedRoleId: roleId })
}