<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Settings, EmotionType } from '@/types'
import { ALL_EMOTIONS, EMOTION_LABELS } from '@/constants'
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

watch(() => props.settings, (val) => {
  form.value = { ...val }
}, { deep: true })

function toggleEmotion(emotion: EmotionType) {
  const idx = form.value.defaultEmotions.indexOf(emotion)
  if (idx >= 0) {
    form.value.defaultEmotions.splice(idx, 1)
  } else {
    form.value.defaultEmotions.push(emotion)
  }
}

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
        <label>API Key <span class="required">*</span></label>
        <input v-model="form.apiKey" type="password" placeholder="sk-..." />
      </div>

      <div class="form-group">
        <label>默认情绪类型</label>
        <div class="emotion-checks">
          <button
            v-for="emotion in ALL_EMOTIONS"
            :key="emotion"
            class="emotion-check"
            :class="{ active: form.defaultEmotions.includes(emotion) }"
            @click="toggleEmotion(emotion)"
          >
            {{ EMOTION_LABELS[emotion] }}
          </button>
        </div>
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
  gap: 20px;
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

.form-group input::placeholder {
  color: var(--text-tertiary);
}

.emotion-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emotion-check {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.emotion-check:hover {
  border-color: var(--accent);
  color: var(--text-secondary);
}

.emotion-check.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
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