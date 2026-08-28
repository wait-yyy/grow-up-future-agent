import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'
import type { Session, Message } from '@/types'
import { generateId } from '@/utils'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<Session[]>([])
  const currentSessionId = ref<string>('')
  const messages = ref<Message[]>([])
  const generating = ref(false)
  const streamingContent = ref('')

  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value)
  )

  async function loadSessions() {
    sessions.value = await db.sessions.orderBy('updatedAt').reverse().toArray()
  }

  async function createSession(title = '新对话', roleId?: string) {
    const session: Session = {
      id: generateId('session'),
      title,
      roleId: roleId ?? '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.sessions.add(session)
    sessions.value.unshift(session)
    currentSessionId.value = session.id
    messages.value = []
    return session
  }

  async function loadMessages(sessionId: string) {
    currentSessionId.value = sessionId
    messages.value = await db.messages.where('sessionId').equals(sessionId).sortBy('createdAt')
  }

  async function addMessage(role: Message['role'], content: string) {
    if (!currentSessionId.value) await createSession()
    const msg: Message = {
      id: generateId('msg'),
      sessionId: currentSessionId.value,
      role,
      content,
      createdAt: Date.now(),
    }
    await db.messages.add(msg)
    messages.value.push(msg)
    await db.sessions.update(currentSessionId.value, { updatedAt: Date.now() })
    return msg
  }

  async function deleteSession(id: string) {
    await db.messages.where('sessionId').equals(id).delete()
    await db.documents.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (currentSessionId.value === id) {
      currentSessionId.value = ''
      messages.value = []
    }
  }

  return {
    sessions, currentSessionId, messages, generating, streamingContent,
    currentSession, loadSessions, createSession, loadMessages,
    addMessage, deleteSession,
  }
})