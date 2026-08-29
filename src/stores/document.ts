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
      const fids = d.folderIds?.length ? d.folderIds : ['_root']
      for (const fid of fids) {
        if (!map[fid]) map[fid] = []
        map[fid].push(d)
      }
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
    const allDocs = await db.documents.toArray()
    const matched = allDocs.filter(d =>
      d.status !== 'discarded' && d.folderIds?.some(fid => folderIds.includes(fid))
    )
    console.log('[getDocsByFolders] 命中文档数:', matched.length)
    return matched.sort((a, b) => a.createdAt - b.createdAt)
  }

  function setFilterTheme(theme: string) {
    filterTheme.value = theme
  }

  async function addDocuments(docs: Omit<Document, 'id' | 'createdAt'>[]) {
    const now = Date.now()
    const records: Document[] = docs.map((d, i) => ({
      ...d,
      folderIds: d.folderIds ?? [],
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

  async function addToFolders(docId: string, folderIds: string[]) {
    if (!folderIds.length) return
    console.log('[addToFolders] 归入文件夹:', docId.slice(-6), '→', folderIds)
    await db.documents.update(docId, { folderIds })
    // 归入后从提炼列表移除（仍在 DB 和 allDocuments）
    documents.value = documents.value.filter(d => d.id !== docId)
    const allDoc = allDocuments.value.find(d => d.id === docId)
    if (allDoc) allDoc.folderIds = folderIds
  }

  async function updateDocument(id: string, data: Partial<Pick<Document, 'title' | 'theme' | 'content' | 'folderIds' | 'status'>>) {
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
    addDocuments, updateStatus, addToFolders, updateDocument, removeDocument, getDocById, clearSession,
  }
})
