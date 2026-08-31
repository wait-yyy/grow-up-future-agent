<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import type { Message } from '@/types'
import MessageBubble from './MessageBubble.vue'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'

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

// 语音输入：临时结果实时显示，最终结果累加
const baseText = ref('')
const { supported: voiceSupported, speaking, toggle: toggleVoice } = useSpeechRecognition({
  onResult: (text, isFinal) => {
    if (isFinal) {
      baseText.value += text
      inputValue.value = baseText.value
    } else {
      inputValue.value = baseText.value + text
    }
    nextTick(() => {
      if (inputRef.value) inputRef.value.scrollTop = inputRef.value.scrollHeight
    })
  },
  onError: (err) => console.error('[Voice]', err),
})

function handleMicClick() {
  if (!speaking.value) baseText.value = inputValue.value
  toggleVoice()
}

// Alt+Y 切换麦克风
function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.altKey && (e.key === 'y' || e.key === 'Y')) {
    e.preventDefault()
    handleMicClick()
  }
}

onMounted(() => window.addEventListener('keydown', handleGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleGlobalKeydown))

function handleSend() {
  const text = inputValue.value.trim()
  if (!text || props.generating) return
  emit('send', text)
  inputValue.value = ''
  baseText.value = ''
  nextTick(scrollToBottom)
}

function handleKeydown(e: KeyboardEvent) {
  // 回车发送（Shift+Enter 换行；中文输入法组词中的 Enter 不触发）
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
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
        <div class="empty-icon">◈</div>
        <p class="empty-title">Grow Up</p>
        <p class="empty-hint">输入消息开始对话，AI 回复后自动提炼主题小文档</p>
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
        v-if="voiceSupported"
        class="btn-mic"
        :class="{ speaking: speaking }"
        :disabled="generating"
        title="点击开始 / 停止语音输入"
        @click="handleMicClick"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>
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
  font-size: 40px;
  margin-bottom: 12px;
  color: var(--accent);
  text-shadow: 0 0 24px var(--accent-dim);
}

.empty-state .empty-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.18em;
  background: linear-gradient(90deg, var(--accent-hover), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
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
  border-radius: var(--radius-md);
  background: var(--accent);
  color: var(--bg-primary);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
}

.btn-send:hover:not(:disabled) {
  filter: brightness(1.15);
  box-shadow: 0 0 12px var(--accent-dim);
}

.btn-send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-mic {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.btn-mic svg {
  width: 22px;
  height: 22px;
  fill: var(--text-secondary);
  transition: fill var(--transition-fast);
}

.btn-mic:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn-mic:hover:not(:disabled) svg {
  fill: var(--text-primary);
}

.btn-mic.speaking {
  border-color: var(--danger);
  animation: mic-pulse 1.2s ease-in-out infinite;
}

.btn-mic.speaking svg {
  fill: var(--danger);
}

@keyframes mic-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.12); opacity: 0.7; }
}

.btn-mic:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>