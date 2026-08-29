<script setup lang="ts">
import type { Document } from '@/types'
import AppModal from '@/components/common/AppModal.vue'
import ThemeTag from '@/components/common/ThemeTag.vue'

defineProps<{
  visible: boolean
  doc: Document | null
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <AppModal :visible="visible && !!doc" width="640px" @close="emit('close')">
    <template v-if="doc">
      <div class="modal-header">
        <div class="preview-title-row">
          <ThemeTag :theme="doc.theme" size="md" />
          <h2>{{ doc.title }}</h2>
        </div>
        <button class="btn-icon" @click="emit('close')">✕</button>
      </div>
      <div class="preview-body">
        <div class="preview-content">{{ doc.content }}</div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.preview-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-title-row h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-hover);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

.preview-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.preview-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
