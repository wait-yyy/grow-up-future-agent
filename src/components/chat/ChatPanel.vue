<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { Message } from '@/types'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  messages: Message[]
  generating: boolean
  streamingContent: string
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const inputRef = ref<HTMLTextAreaElement>()
const inputValue = ref('')
const messagesEl = ref<HTMLDivElement>()

function handleSend() {
  const text = inputValue.value.trim()
  if (!text || props.generating) return
  emit('send', text)
  inputValue.value = ''
  nextTick(scrollToBottom)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function scrollToBottom() {
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

function focusInput() {
  inputRef.value?.focus()
}

watch(() => props.messages.length, () => nextTick(scrollToBottom))
watch(() => props.streamingContent, () => nextTick(scrollToBottom))

defineExpose({ focusInput })
</script>

<template>
  <main class="chat-panel">
    <div ref="messagesEl" class="messages">
      <div v-if="!messages.length" class="empty-state">
        <div class="empty-icon">💬</div>
        <p>开始一段新对话</p>
        <p class="empty-hint">输入内容后，AI 将以当前角色身份回复并自动生成文档</p>
      </div>

      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />

      <div v-if="generating && streamingContent" class="message assistant streaming">
        <div class="msg-avatar">🤖</div>
        <div class="msg-body">
          <div class="msg-meta">
            <span class="msg-role">助手</span>
            <span class="streaming-indicator">输入中...</span>
          </div>
          <div class="msg-content">{{ streamingContent }}<span class="cursor">▊</span></div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <textarea
        ref="inputRef"
        v-model="inputValue"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
        :disabled="generating"
        rows="1"
        @keydown="handleKeydown"
      />
      <button
        class="btn-send"
        :disabled="!inputValue.trim() || generating"
        @click="handleSend"
      >
        ↑
      </button>
    </div>
  </main>
</template>

<style scoped>
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-primary);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px !important;
  margin-top: 4px !important;
}

.streaming .msg-content {
  display: inline;
}

.streaming-indicator {
  font-size: 11px;
  color: var(--accent);
}

.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.input-area textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  resize: none;
  outline: none;
  max-height: 120px;
  line-height: 1.5;
  transition: border-color var(--transition-fast);
}

.input-area textarea:focus {
  border-color: var(--accent);
}

.input-area textarea::placeholder {
  color: var(--text-tertiary);
}

.btn-send {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>