<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Document } from '@/types'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps<{
  visible: boolean
  doc: Document | null
}>()

const emit = defineEmits<{
  save: [id: string, data: Partial<Pick<Document, 'title' | 'theme' | 'content'>>]
  close: []
}>()

const form = ref({ title: '', theme: '', content: '' })

watch(() => props.doc, (val) => {
  if (val) {
    form.value = {
      title: val.title,
      theme: val.theme,
      content: val.content,
    }
  }
}, { immediate: true })

function handleSave() {
  if (!props.doc || !form.value.title.trim()) return
  emit('save', props.doc.id, { ...form.value })
}
</script>

<template>
  <AppModal :visible="visible && !!doc" width="640px" @close="emit('close')">
    <template v-if="doc">
      <div class="modal-header">
        <h2>编辑文档</h2>
        <button class="btn-icon" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-row">
          <div class="form-group" style="flex:0 0 120px">
            <label>主题</label>
            <input v-model="form.theme" type="text" placeholder="主题" />
          </div>
          <div class="form-group" style="flex:1">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" type="text" placeholder="文档标题" />
          </div>
        </div>

        <div class="form-group">
          <label>内容</label>
          <textarea v-model="form.content" class="content-input" placeholder="文档正文"></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="emit('close')">取消</button>
        <button class="btn-confirm" :disabled="!form.title.trim()" @click="handleSave">保存</button>
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

.modal-header h2 {
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.required {
  color: var(--danger);
}

.form-group input {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--transition-fast);
}

.form-group input:focus {
  border-color: var(--accent);
}

.content-input {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.7;
  outline: none;
  resize: vertical;
  min-height: 240px;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.content-input:focus {
  border-color: var(--accent);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-confirm {
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-confirm:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
