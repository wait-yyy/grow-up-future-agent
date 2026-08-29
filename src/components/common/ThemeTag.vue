<script setup lang="ts">
const props = defineProps<{
  theme: string
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <span class="theme-tag" :class="[size ?? 'sm']">
    {{ props.theme }}
  </span>
</template>

<style scoped>
.theme-tag {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
}

.theme-tag.sm {
  font-size: 11px;
  padding: 2px 8px;
}

.theme-tag.md {
  font-size: 13px;
  padding: 4px 12px;
}
</style>
