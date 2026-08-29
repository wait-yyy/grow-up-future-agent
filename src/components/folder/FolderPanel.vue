<script setup lang="ts">
import { computed } from 'vue'
import type { Folder, Document } from '@/types'

const props = defineProps<{
  folders: Folder[]
  selectedFolderIds: string[]
  documentsByFolder: Record<string, Document[]>
  generatingMainLink: boolean
}>()

const emit = defineEmits<{
  toggleFolder: [id: string]
  viewFolder: [id: string]
  createFolder: []
  updateFolder: [folder: Folder]
  deleteFolder: [id: string]
  generateMainLink: []
}>()

const selectedCount = computed(() => props.selectedFolderIds.length)

function isChecked(id: string): boolean {
  return props.selectedFolderIds.includes(id)
}

function getDocCount(folderId: string): number {
  return props.documentsByFolder[folderId]?.filter(d => d.status !== 'discarded').length ?? 0
}
</script>

<template>
  <section class="folder-panel">
    <div class="panel-header">
      <h2>文件夹</h2>
      <button class="btn-icon" title="新建文件夹" @click="emit('createFolder')">+</button>
    </div>

    <div class="main-link-bar">
      <span class="main-link-info">
        已选 <b>{{ selectedCount }}</b> 个文件夹
      </span>
      <button
        class="btn-generate"
        :disabled="generatingMainLink"
        @click="emit('generateMainLink')"
      >
        {{ generatingMainLink ? '生成中...' : '生成 Main_link' }}
      </button>
    </div>

    <div class="folder-list">
      <div v-if="!folders.length" class="empty-state">
        <div class="empty-icon">📁</div>
        <p>暂无文件夹</p>
        <p class="empty-hint">点击 + 创建你的第一个文件夹</p>
      </div>

      <div
        v-for="folder in folders"
        :key="folder.id"
        class="folder-item"
        :class="{ selected: isChecked(folder.id) }"
        @click="emit('toggleFolder', folder.id)"
      >
        <span class="folder-checkbox" :class="{ checked: isChecked(folder.id) }">
          <span v-if="isChecked(folder.id)" class="check-mark">✓</span>
        </span>
        <span class="folder-icon">{{ folder.icon }}</span>
        <div class="folder-info">
          <span class="folder-name">{{ folder.name }}</span>
          <span class="folder-count">{{ getDocCount(folder.id) }} 篇文档</span>
        </div>
        <button
          class="btn-icon btn-view"
          title="查看文档"
          @click.stop="emit('viewFolder', folder.id)"
        >📄</button>
        <button
          class="btn-icon btn-delete"
          title="删除文件夹"
          @click.stop="emit('deleteFolder', folder.id)"
        >×</button>
        <button
          class="btn-icon btn-edit"
          title="编辑文件夹"
          @click.stop="emit('updateFolder', folder)"
        >✎</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.folder-panel {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 50%;
  min-height: 180px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.panel-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-icon {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-hover);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.btn-icon:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

.btn-delete, .btn-edit, .btn-view {
  opacity: 0;
  font-size: 13px;
}

.folder-item:hover .btn-delete,
.folder-item:hover .btn-edit,
.folder-item:hover .btn-view {
  opacity: 1;
}

.btn-delete:hover {
  background: #ef444420;
  color: #ef4444;
}

.main-link-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}

.main-link-info {
  font-size: 11px;
  color: var(--text-secondary);
}

.main-link-info b {
  color: var(--accent);
  font-weight: 600;
}

.btn-generate {
  padding: 5px 12px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.btn-generate:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-generate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.folder-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
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

.folder-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.folder-item:hover {
  background: var(--bg-hover);
}

.folder-item.selected {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.folder-checkbox {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.folder-checkbox.checked {
  background: var(--accent);
  border-color: var(--accent);
}

.check-mark {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.folder-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.folder-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.folder-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-count {
  font-size: 11px;
  color: var(--text-tertiary);
}
</style>
