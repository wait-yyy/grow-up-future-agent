<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Message } from '@/types'
import { formatTime } from '@/utils'

const props = defineProps<{
  message: Message
}>()

// 助手消息按 markdown 渲染（流式输出时也容错），用户消息保持纯文本
const renderedContent = computed(() => {
  if (props.message.role !== 'assistant') return ''
  const raw = marked.parse(props.message.content || '', { async: false, breaks: true }) as string
  return DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] })
})
</script>

<template>
  <div class="message" :class="message.role">
    <div class="msg-avatar">{{ message.role === 'user' ? '👤' : '🤖' }}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-role">{{ message.role === 'user' ? '你' : '助手' }}</span>
        <span class="msg-time">{{ formatTime(message.createdAt) }}</span>
      </div>
      <div v-if="message.role === 'assistant'" class="msg-content markdown-body" v-html="renderedContent" />
      <div v-else class="msg-content">{{ message.content }}</div>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.message.assistant .msg-avatar {
  background: var(--accent-dim);
  border: 1px solid var(--accent);
}

.msg-body {
  min-width: 0;
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message.user .msg-meta {
  justify-content: flex-end;
}

.msg-role {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
}

.msg-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.msg-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-secondary);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border-left: 2px solid var(--text-tertiary);
  white-space: pre-wrap;
  word-break: break-word;
}

.message.assistant .msg-content {
  border-left-color: var(--accent);
}

/* Markdown 渲染样式（助手消息） */
.markdown-body {
  white-space: normal;
}

.markdown-body :deep(p) {
  margin: 0 0 8px;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-body :deep(h1) { font-size: 18px; }
.markdown-body :deep(h2) { font-size: 16px; }
.markdown-body :deep(h3) { font-size: 15px; }
.markdown-body :deep(h4) { font-size: 14px; }

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0 0 8px;
  padding-left: 20px;
}

.markdown-body :deep(li) {
  margin: 2px 0;
}

.markdown-body :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--bg-active);
  color: var(--accent);
}

.markdown-body :deep(pre) {
  margin: 0 0 8px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: #05080d;
  border: 1px solid var(--border);
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  display: block;
  padding: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 12.5px;
  line-height: 1.5;
}

.markdown-body :deep(blockquote) {
  margin: 0 0 8px;
  padding: 4px 12px;
  border-left: 3px solid var(--accent);
  color: var(--text-secondary);
}

.markdown-body :deep(a) {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
}

.markdown-body :deep(a:hover) {
  border-bottom-color: var(--accent);
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 10px 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 0 0 8px;
  font-size: 13px;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border);
  padding: 4px 8px;
}

.markdown-body :deep(th) {
  background: var(--bg-active);
  font-weight: 600;
}

.message.user .msg-content {
  background: var(--accent);
  color: var(--bg-primary);
  border-left: none;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}
</style>