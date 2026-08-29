import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { Document, DocumentStatus } from '@/types'
import { generateId } from '@/utils'

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<Document[]>([])
  const allDocuments = ref<Document[]>([])
  const filterTheme = ref<string>('')
  const generating = ref(false)

  const themes = computed(() => {
    const set = new Set<string>()
    for (const d of documents.value) {
      if (d.status !== 'discarded' && d.theme) set.add(d.theme)
    }
    return [...set]
  })

  const filteredDocuments = computed(() => {
    let list = documents.value.filter(d => d.status !== 'discarded')
    if (filterTheme.value) {
      list = list.filter(d => d.theme === filterTheme.value)
    }
    return list
  })

  const documentsByFolder = computed(() => {
    const map: Record<string, Document[]> = {}
    for (const d of allDocuments.value) {
      if (d.status === 'discarded') continue
      const key = d.folderId || '_root'
      if (!map[key]) map[key] = []
      map[key].push(d)
    }
    return map
  })

  async function loadAllDocuments() {
    allDocuments.value = await db.documents.toArray()
  }

  async function loadBySession(sessionId: string) {
    documents.value = await db.documents.where('sessionId').equals(sessionId).sortBy('createdAt')
  }

  async function getDocsByFolders(folderIds: string[]): Promise<Document[]> {
    if (!folderIds.length) return []
    console.log('[getDocsByFolders] 查询文件夹:', folderIds)
    const all: Document[] = []
    for (const fid of folderIds) {
      const docs = await db.documents.where('folderId').equals(fid).toArray()
      console.log(`[getDocsByFolders] 文件夹 ${fid} 命中 ${docs.length} 篇`)
      all.push(...docs.filter(d => d.status !== 'discarded'))
    }
    const allDocs = await db.documents.toArray()
    console.log('[getDocsByFolders] DB 全部文档 folderId 分布:',
      allDocs.map(d => ({ id: d.id.slice(-6), folderId: d.folderId || '(空)', status: d.status }))
    )
    return all.sort((a, b) => a.createdAt - b.createdAt)
  }

  function setFilterTheme(theme: string) {
    filterTheme.value = theme
  }

  async function addDocuments(docs: Omit<Document, 'id' | 'createdAt'>[]) {
    const now = Date.now()
    const records: Document[] = docs.map((d, i) => ({
      ...d,
      id: generateId('doc'),
      createdAt: now + i,
    }))
    await db.documents.bulkAdd(records)
    documents.value.push(...records)
    allDocuments.value.push(...records)
    return records
  }

  async function updateStatus(id: string, status: DocumentStatus) {
    await db.documents.update(id, { status })
    const doc = documents.value.find(d => d.id === id)
    if (doc) doc.status = status
    const allDoc = allDocuments.value.find(d => d.id === id)
    if (allDoc) allDoc.status = status
  }

  async function moveToFolder(docId: string, folderId: string) {
    console.log('[moveToFolder] 归入文件夹:', docId.slice(-6), '→', folderId)
    await db.documents.update(docId, { folderId })
    const verify = await db.documents.get(docId)
    console.log('[moveToFolder] 验证 DB:', verify?.id.slice(-6), 'folderId=', verify?.folderId)
    const doc = documents.value.find(d => d.id === docId)
    if (doc) doc.folderId = folderId
    const allDoc = allDocuments.value.find(d => d.id === docId)
    if (allDoc) allDoc.folderId = folderId
  }

  async function updateDocument(id: string, data: Partial<Pick<Document, 'title' | 'theme' | 'content' | 'folderId' | 'status'>>) {
    await db.documents.update(id, data)
    const doc = documents.value.find(d => d.id === id)
    if (doc) Object.assign(doc, data)
    const allDoc = allDocuments.value.find(d => d.id === id)
    if (allDoc) Object.assign(allDoc, data)
  }

  async function removeDocument(id: string) {
    await db.documents.delete(id)
    documents.value = documents.value.filter(d => d.id !== id)
    allDocuments.value = allDocuments.value.filter(d => d.id !== id)
  }

  function getDocById(id: string): Document | undefined {
    return documents.value.find(d => d.id === id)
  }

  function clearSession(sessionId: string) {
    documents.value = documents.value.filter(d => d.sessionId !== sessionId)
  }

  return {
    documents, allDocuments, filteredDocuments, documentsByFolder, themes, filterTheme, generating,
    loadAllDocuments, loadBySession, getDocsByFolders, setFilterTheme,
    addDocuments, updateStatus, moveToFolder, updateDocument, removeDocument, getDocById, clearSession,
  }
})
