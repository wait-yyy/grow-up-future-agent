<script setup lang="ts">
import type { Message } from '@/types'
import { formatTime } from '@/utils'

defineProps<{
  message: Message
}>()
</script>

<template>
  <div class="message" :class="message.role">
    <div class="msg-avatar">{{ message.role === 'user' ? '👤' : '🤖' }}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-role">{{ message.role === 'user' ? '你' : '助手' }}</span>
        <span class="msg-time">{{ formatTime(message.createdAt) }}</span>
      </div>
      <div class="msg-content">{{ message.content }}</div>
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
  border-radius: 50%;
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
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
  font-weight: 500;
  color: var(--text-secondary);
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
  border-radius: var(--radius-lg);
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .msg-content {
  background: var(--accent);
  color: #fff;
}
</style>