import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { Document, EmotionType, DocumentStatus } from '@/types'
import { generateId } from '@/utils'

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<Document[]>([])
  const filterEmotion = ref<EmotionType | 'all'>('all')
  const generating = ref(false)

  const filteredDocuments = computed(() => {
    if (filterEmotion.value === 'all') {
      return documents.value.filter(d => d.status !== 'discarded')
    }
    return documents.value.filter(
      d => d.emotion === filterEmotion.value && d.status !== 'discarded'
    )
  })

  async function loadBySession(sessionId: string) {
    documents.value = await db.documents.where('sessionId').equals(sessionId).sortBy('createdAt')
  }

  function setFilter(emotion: EmotionType | 'all') {
    filterEmotion.value = emotion
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
    return records
  }

  async function updateStatus(id: string, status: DocumentStatus) {
    await db.documents.update(id, { status })
    const doc = documents.value.find(d => d.id === id)
    if (doc) doc.status = status
  }

  async function applyToRole(docId: string, roleId: string) {
    const doc = documents.value.find(d => d.id === docId)
    if (!doc) return
    await db.documents.update(docId, { appliedRoleId: roleId })
    doc.appliedRoleId = roleId
  }

  function getDocById(id: string): Document | undefined {
    return documents.value.find(d => d.id === id)
  }

  function clearSession(sessionId: string) {
    documents.value = documents.value.filter(d => d.sessionId !== sessionId)
  }

  return {
    documents, filteredDocuments, filterEmotion, generating,
    loadBySession, setFilter, addDocuments, updateStatus, applyToRole, getDocById, clearSession,
  }
})