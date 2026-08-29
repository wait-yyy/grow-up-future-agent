<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useDocumentStore } from '@/stores/document'
import { useFolderStore } from '@/stores/folder'
import { useSettingsStore } from '@/stores/settings'
import { useChat } from '@/composables/useChat'
import type { Document, Folder } from '@/types'

import ChatPanel from '@/components/chat/ChatPanel.vue'
import FolderPanel from '@/components/folder/FolderPanel.vue'
import DocumentPanel from '@/components/document/DocumentPanel.vue'
import DocPreviewModal from '@/components/document/DocPreviewModal.vue'
import DocEditModal from '@/components/document/DocEditModal.vue'
import FolderEditModal from '@/components/folder/FolderEditModal.vue'
import SettingsModal from '@/components/common/SettingsModal.vue'

const chatStore = useChatStore()
const docStore = useDocumentStore()
const folderStore = useFolderStore()
const settingsStore = useSettingsStore()
const { errorMsg, sendMessageAndReply, generateMainLinkForCurrentSession, autoRefreshMainLink, toggleFolderSelection } = useChat()

const showFolderEdit = ref(false)
const editingFolder = ref<Folder | null>(null)
const previewDoc = ref<Document | null>(null)
const showPreview = ref(false)
const editingDoc = ref<Document | null>(null)
const showDocEdit = ref(false)
const showSettings = ref(false)
const viewFolderId = ref<string>('')

const selectedFolderIds = computed(() => chatStore.currentSession?.selectedFolderIds ?? [])
const mainLinkContent = computed(() => chatStore.currentSession?.mainLinkContent ?? '')
const hasMainLink = computed(() => mainLinkContent.value.length > 0)

const viewMode = computed<'session' | 'folder'>(() => viewFolderId.value ? 'folder' : 'session')
const viewFolderName = computed(() => {
  if (!viewFolderId.value) return ''
  return folderStore.folders.find(f => f.id === viewFolderId.value)?.name ?? ''
})
const displayDocuments = computed(() => {
  if (viewMode.value === 'folder' && viewFolderId.value) {
    return docStore.allDocuments
      .filter(d => d.folderIds?.includes(viewFolderId.value) && d.status !== 'discarded')
      .sort((a, b) => a.createdAt - b.createdAt)
  }
  return docStore.filteredDocuments
})

onMounted(async () => {
  await folderStore.load()
  await chatStore.loadSessions()
  await docStore.loadAllDocuments()
})

async function handleSend(content: string) {
  await sendMessageAndReply(content)
}

async function handleToggleFolder(id: string) {
  await toggleFolderSelection(id)
  autoRefreshMainLink()
}

function handleCreateFolder() {
  editingFolder.value = null
  showFolderEdit.value = true
}

function handleUpdateFolder(folder: Folder) {
  editingFolder.value = folder
  showFolderEdit.value = true
}

async function handleSaveFolder(data: Partial<Folder>) {
  if (editingFolder.value) {
    await folderStore.update(editingFolder.value.id, data)
  } else {
    await folderStore.create(data as Omit<Folder, 'id' | 'createdAt'>)
  }
  showFolderEdit.value = false
  editingFolder.value = null
}

async function handleDeleteFolder(id: string) {
  await folderStore.remove(id)
  const session = chatStore.currentSession
  if (session && session.selectedFolderIds.includes(id)) {
    const ids = session.selectedFolderIds.filter(fid => fid !== id)
    await chatStore.setSelectedFolderIds(session.id, ids)
    autoRefreshMainLink()
  }
  if (viewFolderId.value === id) viewFolderId.value = ''
}

function handleDocFilter(theme: string) {
  docStore.setFilterTheme(theme)
}

async function handleUpdateDocStatus(id: string, status: Document['status']) {
  await docStore.updateStatus(id, status)
  autoRefreshMainLink()
}

async function handleAddToFolders(docId: string, folderIds: string[]) {
  await docStore.addToFolders(docId, folderIds)
  autoRefreshMainLink()
}

function handlePreview(doc: Document) {
  previewDoc.value = doc
  showPreview.value = true
}

function handleEditDoc(doc: Document) {
  editingDoc.value = doc
  showDocEdit.value = true
}

async function handleSaveDoc(id: string, data: Partial<Document>) {
  await docStore.updateDocument(id, data)
  showDocEdit.value = false
  editingDoc.value = null
  autoRefreshMainLink()
}

async function handleRemoveDoc(id: string) {
  await docStore.removeDocument(id)
  autoRefreshMainLink()
}

function handleViewFolder(id: string) {
  viewFolderId.value = viewFolderId.value === id ? '' : id
}

function handleExitFolderView() {
  viewFolderId.value = ''
}

async function handleNewSession() {
  await chatStore.createSession('新对话')
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

async function handleSaveSettings(settings: any) {
  settingsStore.update(settings)
  showSettings.value = false
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
        <button class="btn-settings" title="设置" @click="showSettings = true">⚙</button>
        <span class="header-status">已连接</span>
      </div>
    </header>

    <div v-if="errorMsg" class="error-bar">{{ errorMsg }}</div>

    <div v-if="hasMainLink" class="main-link-status">
      <span class="ml-icon">🔗</span>
      <span class="ml-text">Main_link 已加载（{{ mainLinkContent.length }} 字）</span>
      <button class="ml-refresh" :disabled="chatStore.generatingMainLink" @click="() => generateMainLinkForCurrentSession()">
        {{ chatStore.generatingMainLink ? '重新生成中...' : '重新生成' }}
      </button>
    </div>

    <div class="app-body">
      <ChatPanel
        :messages="chatStore.messages"
        :generating="chatStore.generating"
        :streaming-content="chatStore.streamingContent"
        @send="handleSend"
      />

      <div class="right-sidebar">
        <FolderPanel
          :folders="folderStore.folders"
          :selected-folder-ids="selectedFolderIds"
          :documents-by-folder="docStore.documentsByFolder"
          :generating-main-link="chatStore.generatingMainLink"
          @toggle-folder="handleToggleFolder"
          @view-folder="handleViewFolder"
          @create-folder="handleCreateFolder"
          @update-folder="handleUpdateFolder"
          @delete-folder="handleDeleteFolder"
          @generate-main-link="generateMainLinkForCurrentSession"
        />

        <DocumentPanel
          :documents="displayDocuments"
          :themes="docStore.themes"
          :filter-theme="docStore.filterTheme"
          :generating="docStore.generating"
          :folders="folderStore.folders"
          :view-mode="viewMode"
          :view-folder-name="viewFolderName"
          @update-status="handleUpdateDocStatus"
          @filter-theme="handleDocFilter"
          @add-to-folders="handleAddToFolders"
          @preview="handlePreview"
          @edit="handleEditDoc"
          @remove="handleRemoveDoc"
          @exit-folder-view="handleExitFolderView"
        />
      </div>
    </div>

    <DocPreviewModal
      :visible="showPreview"
      :doc="previewDoc"
      @close="showPreview = false"
    />

    <DocEditModal
      :visible="showDocEdit"
      :doc="editingDoc"
      @save="handleSaveDoc"
      @close="showDocEdit = false"
    />

    <FolderEditModal
      :visible="showFolderEdit"
      :folder="editingFolder"
      @save="handleSaveFolder"
      @close="showFolderEdit = false"
    />

    <SettingsModal
      :visible="showSettings"
      :settings="settingsStore.settings"
      @save="handleSaveSettings"
      @close="showSettings = false"
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
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-settings {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 16px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-settings:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
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

.main-link-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  flex-shrink: 0;
}

.ml-icon {
  font-size: 14px;
}

.ml-text {
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
}

.ml-refresh {
  padding: 4px 12px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ml-refresh:hover:not(:disabled) {
  background: var(--accent);
  color: #fff;
}

.ml-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
