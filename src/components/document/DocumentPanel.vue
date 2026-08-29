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
  moveToFolder: [docId: string, folderId: string]
  preview: [doc: Document]
  edit: [doc: Document]
  remove: [id: string]
  exitFolderView: []
}>()

const pickingDocId = ref<string>('')

function startPick(docId: string) {
  pickingDocId.value = pickingDocId.value === docId ? '' : docId
}

function confirmPick(docId: string, folderId: string) {
  emit('moveToFolder', docId, folderId)
  pickingDocId.value = ''
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
        :class="{ discarded: doc.status === 'discarded' }"
      >
        <div class="doc-header">
          <ThemeTag :theme="doc.theme" />
          <span class="doc-status" :class="doc.status">
            {{ doc.status === 'pending' ? '待处理' : doc.status === 'kept' ? '已保留' : '已丢弃' }}
          </span>
        </div>

        <h3 class="doc-title" @click="emit('preview', doc)">{{ doc.title }}</h3>

        <p class="doc-preview" @click="emit('preview', doc)">{{ truncate(doc.content, 100) }}</p>

        <div class="doc-actions">
          <button
            v-if="doc.status === 'pending'"
            class="btn-small btn-keep"
            @click="emit('updateStatus', doc.id, 'kept')"
          >保留</button>
          <button
            v-if="doc.status === 'pending'"
            class="btn-small btn-discard"
            @click="emit('updateStatus', doc.id, 'discarded')"
          >丢弃</button>
          <button
            v-if="doc.status === 'kept'"
            class="btn-small btn-discard"
            @click="emit('updateStatus', doc.id, 'discarded')"
          >丢弃</button>
          <button
            v-if="doc.status === 'discarded'"
            class="btn-small btn-keep"
            @click="emit('updateStatus', doc.id, 'kept')"
          >恢复</button>
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
            v-if="viewMode === 'session' && doc.status !== 'discarded'"
            class="btn-small btn-apply"
            @click="startPick(doc.id)"
          >归入文件夹</button>
        </div>

        <div v-if="pickingDocId === doc.id" class="folder-picker">
          <div v-if="!folders.length" class="picker-empty">请先创建文件夹</div>
          <button
            v-for="folder in folders"
            :key="folder.id"
            class="picker-item"
            :class="{ current: doc.folderId === folder.id }"
            @click="confirmPick(doc.id, folder.id)"
          >
            <span class="picker-icon">{{ folder.icon }}</span>
            <span class="picker-name">{{ folder.name }}</span>
            <span v-if="doc.folderId === folder.id" class="picker-check">✓</span>
          </button>
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
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  transition: all var(--transition-fast);
}

.doc-card.discarded {
  opacity: 0.5;
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

.doc-status.kept {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
}

.doc-status.discarded {
  background: color-mix(in srgb, var(--danger) 15%, transparent);
  color: var(--danger);
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

.picker-item.current {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
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

.picker-check {
  color: var(--accent);
  font-size: 12px;
  flex-shrink: 0;
}
</style>
