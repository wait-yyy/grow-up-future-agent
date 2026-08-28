<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Role, EmotionType } from '@/types'
import { ALL_EMOTIONS, EMOTION_LABELS } from '@/constants'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps<{
  visible: boolean
  role: Role | null
}>()

const emit = defineEmits<{
  save: [data: Partial<Role>]
  close: []
}>()

const form = ref({
  name: '',
  avatar: '🤖',
  description: '',
  systemPrompt: '',
  emotionOverrides: {} as Partial<Record<EmotionType, string>>,
})

watch(() => props.role, (val) => {
  if (val) {
    form.value = {
      name: val.name,
      avatar: val.avatar,
      description: val.description,
      systemPrompt: val.systemPrompt,
      emotionOverrides: { ...val.emotionOverrides },
    }
  } else {
    form.value = {
      name: '',
      avatar: '🤖',
      description: '',
      systemPrompt: '',
      emotionOverrides: {},
    }
  }
}, { immediate: true })

function setOverride(emotion: EmotionType, value: string) {
  if (value.trim()) {
    form.value.emotionOverrides[emotion] = value.trim()
  } else {
    delete form.value.emotionOverrides[emotion]
  }
}

function handleSave() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
}
</script>

<template>
  <AppModal :visible="visible" width="520px" @close="emit('close')">
    <div class="modal-header">
      <h2>{{ role ? '编辑角色' : '新建角色' }}</h2>
      <button class="btn-icon" @click="emit('close')">✕</button>
    </div>

    <div class="modal-body">
      <div class="form-row">
        <div class="form-group avatar-field">
          <label>头像</label>
          <input v-model="form.avatar" type="text" class="avatar-input" />
        </div>
        <div class="form-group" style="flex:1">
          <label>名称 <span class="required">*</span></label>
          <input v-model="form.name" type="text" placeholder="角色名称" />
        </div>
      </div>

      <div class="form-group">
        <label>描述</label>
        <input v-model="form.description" type="text" placeholder="简短描述角色特点" />
      </div>

      <div class="form-group">
        <label>系统提示词</label>
        <textarea v-model="form.systemPrompt" rows="3" placeholder="定义角色的行为和回复风格..." />
      </div>

      <div class="form-group">
        <label>情绪覆盖</label>
        <p class="hint">为特定情绪类型自定义提示词，覆盖默认的情绪指令</p>
        <div class="override-list">
          <div v-for="emotion in ALL_EMOTIONS" :key="emotion" class="override-row">
            <span class="override-label">{{ EMOTION_LABELS[emotion] }}</span>
            <input
              :value="form.emotionOverrides[emotion] ?? ''"
              type="text"
              :placeholder="form.emotionOverrides[emotion] ? '已设置' : '默认'"
              @input="setOverride(emotion, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
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

.hint {
  font-size: 11px;
  color: var(--text-tertiary);
  margin: 0;
}

.avatar-field {
  width: 80px;
}

.avatar-input {
  text-align: center;
  font-size: 24px !important;
}

.form-group input,
.form-group textarea {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color var(--transition-fast);
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--accent);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-tertiary);
}

.override-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.override-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.override-label {
  width: 48px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.override-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color var(--transition-fast);
}

.override-row input:focus {
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