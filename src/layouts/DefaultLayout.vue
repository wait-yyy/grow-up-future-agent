<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useDocumentStore } from '@/stores/document'
import { useRoleStore } from '@/stores/role'
import { useSettingsStore } from '@/stores/settings'
import { useChat } from '@/composables/useChat'
import type { Document, Role, EmotionType } from '@/types'

import ChatPanel from '@/components/chat/ChatPanel.vue'
import RolePanel from '@/components/role/RolePanel.vue'
import DocumentPanel from '@/components/document/DocumentPanel.vue'
import DocPreviewModal from '@/components/document/DocPreviewModal.vue'
import RoleEditModal from '@/components/role/RoleEditModal.vue'

const chatStore = useChatStore()
const docStore = useDocumentStore()
const roleStore = useRoleStore()
const settingsStore = useSettingsStore()
const { errorMsg, sendMessageAndReply } = useChat()

const showRoleEdit = ref(false)
const editingRole = ref<Role | null>(null)
const previewDoc = ref<Document | null>(null)
const showPreview = ref(false)

onMounted(async () => {
  await roleStore.load()
  await chatStore.loadSessions()
})

async function handleSend(content: string) {
  await sendMessageAndReply(content)
}

function handleSelectRole(id: string) {
  roleStore.selectRole(id)
}

function handleCreateRole() {
  editingRole.value = null
  showRoleEdit.value = true
}

function handleUpdateRole(role: Role) {
  editingRole.value = role
  showRoleEdit.value = true
}

async function handleSaveRole(data: Partial<Role>) {
  if (editingRole.value) {
    await roleStore.update(editingRole.value.id, data)
  } else {
    await roleStore.create(data as any)
  }
  showRoleEdit.value = false
  editingRole.value = null
}

async function handleDeleteRole(id: string) {
  await roleStore.remove(id)
}

function handleDocFilter(emotion: EmotionType | 'all') {
  docStore.setFilter(emotion)
}

async function handleUpdateDocStatus(id: string, status: Document['status']) {
  await docStore.updateStatus(id, status)
}

async function handleApplyRole(docId: string) {
  const doc = docStore.getDocById(docId)
  if (!doc) return

  const currentRole = roleStore.getCurrentRole()
  if (!currentRole) {
    await roleStore.create({
      name: doc.title,
      avatar: '🧬',
      description: `由文档「${doc.title}」融合生成`,
      systemPrompt: doc.content,
      emotionOverrides: { [doc.emotion]: doc.content },
    })
    return
  }

  const fusedPrompt = [
    currentRole.systemPrompt,
    '',
    '---',
    `【融合文档：${doc.title}（${doc.emotion}风格）】`,
    doc.content,
  ].join('\n')

  const fusedOverrides = { ...currentRole.emotionOverrides }
  fusedOverrides[doc.emotion] = [
    currentRole.emotionOverrides[doc.emotion] ?? '',
    '',
    `【融合自文档：${doc.title}】`,
    doc.content,
  ].join('\n')

  await roleStore.create({
    name: `${currentRole.name}+${doc.emotion}`,
    avatar: '🧬',
    description: `由「${currentRole.name}」与文档「${doc.title}」融合生成`,
    systemPrompt: fusedPrompt,
    emotionOverrides: fusedOverrides,
  })

  await docStore.applyToRole(docId, roleStore.roles[roleStore.roles.length - 1]?.id ?? '')
}

function handlePreview(doc: Document) {
  previewDoc.value = doc
  showPreview.value = true
}

async function handleNewSession() {
  await chatStore.createSession('新对话', roleStore.currentRoleId)
  docStore.clearSession(chatStore.currentSessionId)
}

async function handleSelectSession(id: string) {
  await chatStore.loadMessages(id)
  await docStore.loadBySession(id)
}

async function handleDeleteSession(id: string) {
  await chatStore.deleteSession(id)
  docStore.clearSession(id)
}
</script>

<template>
  <div class="layout">
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">📝 情绪化文档生成</h1>
      </div>
      <div class="header-center">
        <div class="session-tabs">
          <button
            v-for="session in chatStore.sessions"
            :key="session.id"
            class="session-tab"
            :class="{ active: session.id === chatStore.currentSessionId }"
            @click="handleSelectSession(session.id)"
          >
            <span class="session-title">{{ session.title }}</span>
            <button class="tab-close" @click.stop="handleDeleteSession(session.id)">×</button>
          </button>
          <button class="session-tab new-tab" @click="handleNewSession">+</button>
        </div>
      </div>
      <div class="header-right">
        <span class="header-status">已连接</span>
      </div>
    </header>

    <div v-if="errorMsg" class="error-bar">{{ errorMsg }}</div>

    <div class="app-body">
      <ChatPanel
        :messages="chatStore.messages"
        :generating="chatStore.generating"
        :streaming-content="chatStore.streamingContent"
        @send="handleSend"
      />

      <div class="right-sidebar">
        <RolePanel
          :roles="roleStore.roles"
          :current-role-id="roleStore.currentRoleId"
          @select-role="handleSelectRole"
          @create-role="handleCreateRole"
          @update-role="handleUpdateRole"
          @delete-role="handleDeleteRole"
        />

        <DocumentPanel
          :documents="docStore.filteredDocuments"
          :filter-emotion="docStore.filterEmotion"
          :generating="docStore.generating"
          @update-status="handleUpdateDocStatus"
          @filter-emotion="handleDocFilter"
          @apply-role="handleApplyRole"
          @preview="handlePreview"
        />
      </div>
    </div>

    <DocPreviewModal
      :visible="showPreview"
      :doc="previewDoc"
      @close="showPreview = false"
    />

    <RoleEditModal
      :visible="showRoleEdit"
      :role="editingRole"
      @save="handleSaveRole"
      @close="showRoleEdit = false"
    />
  </div>
</template>

<style scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: var(--header-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header-left {
  flex-shrink: 0;
}

.app-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-center {
  flex: 1;
  overflow-x: auto;
  margin: 0 20px;
}

.session-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  height: var(--header-height);
}

.session-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.session-tab:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.session-tab.active {
  background: var(--bg-active);
  color: var(--text-primary);
}

.session-title {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-close {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all var(--transition-fast);
}

.session-tab:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: #ef444440;
  color: #ef4444;
}

.new-tab {
  font-size: 16px;
  font-weight: 500;
  padding: 6px 12px;
}

.header-right {
  flex-shrink: 0;
}

.header-status {
  font-size: 12px;
  color: var(--success);
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}

.error-bar {
  padding: 8px 20px;
  background: color-mix(in srgb, var(--danger) 8%, transparent);
  color: var(--danger);
  font-size: 13px;
  text-align: center;
  border-bottom: 1px solid color-mix(in srgb, var(--danger) 20%, transparent);
  flex-shrink: 0;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.right-sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  overflow: hidden;
}
</style>