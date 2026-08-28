<script setup lang="ts">
import type { EmotionType } from '@/types'
import { EMOTION_LABELS, EMOTION_COLORS } from '@/constants'

const props = defineProps<{
  emotion: EmotionType
  size?: 'sm' | 'md'
}>()

const color = EMOTION_COLORS[props.emotion]
const label = EMOTION_LABELS[props.emotion]
</script>

<template>
  <span
    class="emotion-tag"
    :class="[size ?? 'sm']"
    :style="{ background: color + '20', color }"
  >
    {{ label }}
  </span>
</template>

<style scoped>
.emotion-tag {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  border-radius: var(--radius-sm);
}

.emotion-tag.sm {
  font-size: 11px;
  padding: 2px 8px;
}

.emotion-tag.md {
  font-size: 13px;
  padding: 4px 12px;
}
</style>