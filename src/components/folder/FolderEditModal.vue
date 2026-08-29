<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Folder } from '@/types'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps<{
  visible: boolean
  folder: Folder | null
}>()

const emit = defineEmits<{
  save: [data: Partial<Folder>]
  close: []
}>()

const form = ref({
  name: '',
  icon: '📁',
  description: '',
})

watch(() => props.folder, (val) => {
  if (val) {
    form.value = {
      name: val.name,
      icon: val.icon,
      description: val.description,
    }
  } else {
    form.value = {
      name: '',
      icon: '📁',
      description: '',
    }
  }
}, { immediate: true })

function handleSave() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
}
</script>

<template>
  <AppModal :visible="visible" width="420px" @close="emit('close')">
    <div class="modal-header">
      <h2>{{ folder ? '编辑文件夹' : '新建文件夹' }}</h2>
      <button class="btn-icon" @click="emit('close')">✕</button>
    </div>

    <div class="modal-body">
      <div class="form-row">
        <div class="form-group icon-field">
          <label>图标</label>
          <input v-model="form.icon" type="text" class="icon-input" maxlength="2" />
        </div>
        <div class="form-group" style="flex:1">
          <label>名称 <span class="required">*</span></label>
          <input v-model="form.name" type="text" placeholder="文件夹名称" />
        </div>
      </div>

      <div class="form-group">
        <label>描述</label>
        <input v-model="form.description" type="text" placeholder="简短描述文件夹用途" />
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn-cancel" @click="emit('close')">取消</button>
      <button class="btn-confirm" :disabled="!form.name.trim()" @click="handleSave">保存</button>
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

.icon-field {
  width: 80px;
}

.icon-input {
  text-align: center;
  font-size: 24px !important;
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
