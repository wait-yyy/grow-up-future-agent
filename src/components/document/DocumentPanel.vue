<script setup lang="ts">
import { ref } from 'vue'
import type { Document, Folder } from '@/types'
import { truncate } from '@/utils'
import ThemeTag from '@/components/common/ThemeTag.vue'

defineProps<{
  documents: Document[]
  themes: string[]
  filterTheme: string
  generating: boolean
  folders: Folder[]
  viewMode: 'session' | 'folder'
  viewFolderName: string
}>()

const emit = defineEmits<{
  updateStatus: [id: string, status: Document['status']]
  filterTheme: [theme: string]
  addToFolders: [docId: string, folderIds: string[]]
  preview: [doc: Document]
  edit: [doc: Document]
  remove: [id: string]
  exitFolderView: []
}>()

const pickingDocId = ref<string>('')
const pickedFolderIds = ref<string[]>([])

function startPick(docId: string) {
  if (pickingDocId.value === docId) {
    pickingDocId.value = ''
    return
  }
  pickingDocId.value = docId
  pickedFolderIds.value = []
}

function togglePick(folderId: string) {
  const idx = pickedFolderIds.value.indexOf(folderId)
  if (idx >= 0) {
    pickedFolderIds.value.splice(idx, 1)
  } else {
    pickedFolderIds.value.push(folderId)
  }
}

function confirmPick(docId: string) {
  if (!pickedFolderIds.value.length) return
  emit('addToFolders', docId, [...pickedFolderIds.value])
  pickingDocId.value = ''
  pickedFolderIds.value = []
}
</script>

<template>
  <section class="doc-panel">
    <div class="panel-header">
      <div class="header-left">
        <h2 v-if="viewMode === 'session'">提炼文档</h2>
        <div v-else class="folder-view-title">
          <button class="btn-back" @click="emit('exitFolderView')">←</button>
          <h2>{{ viewFolderName }}</h2>
        </div>
      </div>
      <span v-if="generating" class="generating-badge">提炼中...</span>
    </div>

    <div v-if="viewMode === 'session' && themes.length" class="theme-tabs">
      <button
        class="theme-tab"
        :class="{ active: filterTheme === '' }"
        @click="emit('filterTheme', '')"
      >
        全部
      </button>
      <button
        v-for="theme in themes"
        :key="theme"
        class="theme-tab"
        :class="{ active: filterTheme === theme }"
        @click="emit('filterTheme', theme)"
      >
        {{ theme }}
      </button>
    </div>

    <div class="doc-list">
      <div v-if="!documents.length" class="empty-state">
        <div class="empty-icon">📄</div>
        <p>暂无文档</p>
        <p class="empty-hint">对话后将自动提炼主题小文档</p>
      </div>

      <div
        v-for="doc in documents"
        :key="doc.id"
        class="doc-card"
      >
        <div class="doc-header">
          <ThemeTag :theme="doc.theme" />
          <span class="doc-status">{{ doc.status === 'pending' ? '待处理' : '已丢弃' }}</span>
        </div>

        <h3 class="doc-title" @click="emit('preview', doc)">{{ doc.title }}</h3>

        <p class="doc-preview" @click="emit('preview', doc)">{{ truncate(doc.content, 100) }}</p>

        <div class="doc-actions">
          <button
            v-if="doc.status === 'pending'"
            class="btn-small btn-discard"
            @click="emit('updateStatus', doc.id, 'discarded')"
          >丢弃</button>
          <button
            class="btn-small btn-edit"
            @click="emit('edit', doc)"
          >编辑</button>
          <button
            v-if="viewMode === 'folder'"
            class="btn-small btn-discard"
            @click="emit('remove', doc.id)"
          >删除</button>
          <button
            v-if="viewMode === 'session' && doc.status === 'pending'"
            class="btn-small btn-apply"
            @click="startPick(doc.id)"
          >归入文件夹</button>
        </div>

        <div v-if="pickingDocId === doc.id" class="folder-picker">
          <div v-if="!folders.length" class="picker-empty">请先创建文件夹</div>
          <template v-else>
            <label
              v-for="folder in folders"
              :key="folder.id"
              class="picker-item"
              :class="{ checked: pickedFolderIds.includes(folder.id) }"
            >
              <input
                type="checkbox"
                :checked="pickedFolderIds.includes(folder.id)"
                @change="togglePick(folder.id)"
              />
              <span class="picker-icon">{{ folder.icon }}</span>
              <span class="picker-name">{{ folder.name }}</span>
            </label>
            <button
              class="btn-confirm"
              :disabled="!pickedFolderIds.length"
              @click="confirmPick(doc.id)"
            >确认归入</button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.doc-panel {
  flex: 1;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
}

.panel-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.folder-view-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-back {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

.btn-edit {
  border-color: var(--text-tertiary);
  color: var(--text-tertiary);
}

.btn-edit:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.generating-badge {
  font-size: 11px;
  color: var(--accent);
  padding: 2px 8px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-radius: var(--radius-sm);
}

.theme-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.theme-tab {
  padding: 4px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.theme-tab:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.theme-tab.active {
  background: var(--bg-active);
  color: var(--text-primary);
}

.doc-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  padding: 20px;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.empty-hint {
  font-size: 11px !important;
  margin-top: 4px !important;
}

.doc-card {
  padding: 12px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  background: var(--bg-secondary);
  transition: all var(--transition-fast);
}

.doc-card:hover {
  border-color: var(--accent);
  box-shadow: 0 0 10px var(--accent-dim);
}

.doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.doc-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  color: var(--text-tertiary);
}

.doc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
  cursor: pointer;
}

.doc-title:hover {
  color: var(--accent);
}

.doc-preview {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 10px;
  cursor: pointer;
}

.doc-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-small {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-small:hover {
  background: var(--bg-hover);
}

.btn-keep:hover {
  background: color-mix(in srgb, var(--success) 12%, transparent);
  border-color: var(--success);
  color: var(--success);
}

.btn-discard:hover {
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  border-color: var(--danger);
  color: var(--danger);
}

.btn-apply {
  border-color: var(--accent);
  color: var(--accent);
  opacity: 0.8;
}

.btn-apply:hover {
  opacity: 1;
}

.folder-picker {
  margin-top: 8px;
  padding: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.picker-empty {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 6px 8px;
  text-align: center;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all var(--transition-fast);
}

.picker-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.picker-item.checked {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.picker-item input {
  margin: 0;
  accent-color: var(--accent);
}

.picker-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.picker-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-confirm {
  margin-top: 4px;
  padding: 6px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-confirm:disabled {
  background: var(--bg-hover);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.btn-confirm:not(:disabled):hover {
  opacity: 0.9;
}
</style>
