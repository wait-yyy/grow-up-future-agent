<script setup lang="ts">
import { computed } from 'vue'
import type { Role } from '@/types'

const props = defineProps<{
  roles: Role[]
  currentRoleId: string
}>()

const emit = defineEmits<{
  selectRole: [id: string]
  createRole: []
  updateRole: [role: Role]
  deleteRole: [id: string]
}>()

const currentRole = computed(() =>
  props.roles.find(r => r.id === props.currentRoleId)
)
</script>

<template>
  <section class="role-panel">
    <div class="panel-header">
      <h2>角色</h2>
      <button class="btn-icon" title="新建角色" @click="emit('createRole')">+</button>
    </div>

    <div class="role-list">
      <div v-if="!roles.length" class="empty-state">
        <div class="empty-icon">🎭</div>
        <p>暂无角色</p>
        <p class="empty-hint">点击 + 创建你的第一个角色</p>
      </div>

      <div
        v-for="role in roles"
        :key="role.id"
        class="role-item"
        :class="{ active: role.id === currentRoleId }"
        @click="emit('selectRole', role.id)"
      >
        <span class="role-avatar">{{ role.avatar }}</span>
        <div class="role-info">
          <span class="role-name">{{ role.name }}</span>
          <span class="role-desc">{{ role.description }}</span>
        </div>
        <button
          class="btn-icon btn-delete"
          title="删除角色"
          @click.stop="emit('deleteRole', role.id)"
        >×</button>
      </div>
    </div>

    <div v-if="currentRole" class="current-role-detail">
      <div class="detail-header">
        <span class="detail-avatar">{{ currentRole.avatar }}</span>
        <div>
          <div class="detail-name">{{ currentRole.name }}</div>
          <div class="detail-desc">{{ currentRole.description }}</div>
        </div>
      </div>
      <div class="detail-prompt">
        <label>系统提示词</label>
        <p>{{ currentRole.systemPrompt }}</p>
      </div>
      <div v-if="Object.keys(currentRole.emotionOverrides).length" class="detail-overrides">
        <label>情绪覆盖</label>
        <div v-for="(val, key) in currentRole.emotionOverrides" :key="key" class="override-item">
          <span class="override-emotion">{{ key }}</span>
          <span class="override-text">{{ val }}</span>
        </div>
      </div>
      <button class="btn-secondary" @click="emit('updateRole', currentRole)">编辑角色</button>
    </div>
  </section>
</template>

<style scoped>
.role-panel {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 45%;
  min-height: 160px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.panel-header h2 {
  font-size: 14px;
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
  font-size: 16px;
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

.btn-delete {
  opacity: 0;
}

.role-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: #ef444420;
  color: #ef4444;
}

.role-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  padding: 20px;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.empty-hint {
  font-size: 11px !important;
  margin-top: 4px !important;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.role-item:hover {
  background: var(--bg-hover);
}

.role-item.active {
  background: var(--bg-active);
}

.role-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.role-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.current-role-detail {
  border-top: 1px solid var(--border);
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.detail-avatar {
  font-size: 32px;
}

.detail-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.detail-prompt,
.detail-overrides {
  margin-bottom: 12px;
}

.detail-prompt label,
.detail-overrides label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.detail-prompt p {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.override-item {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.override-emotion {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-active);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.override-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.btn-secondary {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>