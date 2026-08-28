<script setup lang="ts">
import type { Document, EmotionType } from '@/types'
import { ALL_EMOTIONS, EMOTION_LABELS } from '@/constants'
import { truncate } from '@/utils'
import EmotionTag from '@/components/common/EmotionTag.vue'

defineProps<{
  documents: Document[]
  filterEmotion: EmotionType | 'all'
  generating: boolean
}>()

const emit = defineEmits<{
  updateStatus: [id: string, status: Document['status']]
  filterEmotion: [emotion: EmotionType | 'all']
  applyRole: [docId: string]
  preview: [doc: Document]
}>()
</script>

<template>
  <section class="doc-panel">
    <div class="panel-header">
      <h2>文档</h2>
      <span v-if="generating" class="generating-badge">生成中...</span>
    </div>

    <div class="emotion-tabs">
      <button
        class="emotion-tab"
        :class="{ active: filterEmotion === 'all' }"
        @click="emit('filterEmotion', 'all')"
      >
        全部
      </button>
      <button
        v-for="emotion in ALL_EMOTIONS"
        :key="emotion"
        class="emotion-tab"
        :class="{ active: filterEmotion === emotion }"
        @click="emit('filterEmotion', emotion)"
      >
        {{ EMOTION_LABELS[emotion] }}
      </button>
    </div>

    <div class="doc-list">
      <div v-if="!documents.length" class="empty-state">
        <div class="empty-icon">📄</div>
        <p>暂无文档</p>
        <p class="empty-hint">对话后将自动生成多情绪风格文档</p>
      </div>

      <div
        v-for="doc in documents"
        :key="doc.id"
        class="doc-card"
        :class="{ discarded: doc.status === 'discarded' }"
      >
        <div class="doc-header">
          <EmotionTag :emotion="doc.emotion" />
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
            v-if="doc.status !== 'discarded'"
            class="btn-small btn-apply"
            @click="emit('applyRole', doc.id)"
          >融合到角色</button>
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
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.panel-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.generating-badge {
  font-size: 11px;
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
}

.emotion-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border);
}

.emotion-tab {
  padding: 4px 10px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.emotion-tab:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.emotion-tab.active {
  background: var(--bg-active);
  color: var(--text-primary);
  font-weight: 500;
}

.doc-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 40px;
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
  background: var(--bg-primary);
  border-radius: 10px;
  padding: 14px;
  border: 1px solid var(--border);
  transition: all var(--transition-fast);
}

.doc-card:hover {
  border-color: var(--accent);
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
  font-size: 11px;
  color: var(--text-tertiary);
}

.doc-status.kept {
  color: var(--success);
}

.doc-status.discarded {
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
  color: var(--text-tertiary);
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
  border: none;
  border-radius: var(--radius-sm);
  font-size: 11px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-keep {
  background: color-mix(in srgb, var(--success) 12%, transparent);
  color: var(--success);
}

.btn-keep:hover {
  background: color-mix(in srgb, var(--success) 20%, transparent);
}

.btn-discard {
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}

.btn-discard:hover {
  background: color-mix(in srgb, var(--danger) 20%, transparent);
}

.btn-apply {
  background: var(--accent);
  color: #fff;
  opacity: 0.8;
}

.btn-apply:hover {
  opacity: 1;
}
</style>