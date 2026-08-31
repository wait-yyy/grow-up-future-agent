<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Settings } from '@/types'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps<{
  visible: boolean
  settings: Settings
}>()

const emit = defineEmits<{
  save: [settings: Settings]
  close: []
}>()

const form = ref<Settings>({ ...props.settings })
const showKey = ref(false)

watch(() => props.settings, (val) => {
  form.value = { ...val }
}, { deep: true })

function handleSave() {
  emit('save', { ...form.value })
}
</script>

<template>
  <AppModal :visible="visible" width="480px" @close="emit('close')">
    <div class="modal-header">
      <h2>设置</h2>
      <button class="btn-icon" @click="emit('close')">✕</button>
    </div>

    <div class="modal-body">
      <div class="form-group">
        <label>API Key</label>
        <div class="input-with-action">
          <input
            v-model="form.apiKey"
            :type="showKey ? 'text' : 'password'"
            placeholder="留空则使用内置 Key"
          />
          <button class="btn-toggle" @click="showKey = !showKey">{{ showKey ? '隐藏' : '显示' }}</button>
        </div>
        <span class="form-hint">用于调用大模型 API，保存后即时生效</span>
      </div>

      <div class="form-group">
        <label>API Base URL</label>
        <input v-model="form.baseUrl" type="text" placeholder="https://api.deepseek.com/v1" />
      </div>

      <div class="form-group">
        <label>模型</label>
        <input v-model="form.model" type="text" placeholder="deepseek-chat" />
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-cancel" @click="emit('close')">取消</button>
      <button class="btn-confirm" @click="handleSave">保存</button>
    </div>
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

.form-group input::placeholder {
  color: var(--text-tertiary);
}

.input-with-action {
  display: flex;
  gap: 8px;
}

.input-with-action input {
  flex: 1;
}

.btn-toggle {
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.btn-toggle:hover {
  background: var(--bg-active);
  color: var(--text-primary);
  border-color: var(--accent);
}

.form-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
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

.btn-confirm:hover {
  filter: brightness(1.1);
}
</style>
