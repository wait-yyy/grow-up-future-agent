<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore } from '@/stores/document'
import { useFolderStore } from '@/stores/folder'
import { formatDate, truncate } from '@/utils'
import ThemeTag from '@/components/common/ThemeTag.vue'

const router = useRouter()
const docStore = useDocumentStore()
const folderStore = useFolderStore()

onMounted(async () => {
  await folderStore.load()
  await docStore.loadAllDocuments()
})

// 只统计未被丢弃的记忆
const memories = computed(() =>
  docStore.allDocuments
    .filter(d => d.status !== 'discarded')
    .sort((a, b) => b.createdAt - a.createdAt),
)

const totalMemories = computed(() => memories.value.length)

const themeCount = computed(() => {
  const set = new Set<string>()
  for (const d of memories.value) if (d.theme) set.add(d.theme)
  return set.size
})

const folderCount = computed(() => folderStore.folders.length)

// 陪伴天数：从最早一条记忆算起
const companionDays = computed(() => {
  if (!memories.value.length) return 0
  const earliest = memories.value[memories.value.length - 1]!.createdAt
  const ms = Date.now() - earliest
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
})

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="timeline-view">
    <header class="tv-header">
      <button class="btn-back" title="返回" @click="goHome">←</button>
      <h1 class="tv-title">成长轨迹</h1>
      <span class="tv-sub">AI 记得你走过的每一步</span>
    </header>

    <div class="tv-body">
      <section class="stats">
        <div class="stat-card">
          <div class="stat-value">{{ totalMemories }}</div>
          <div class="stat-label">条记忆</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ themeCount }}</div>
          <div class="stat-label">个主题</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ companionDays }}</div>
          <div class="stat-label">天陪伴</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ folderCount }}</div>
          <div class="stat-label">个文件夹</div>
        </div>
      </section>

      <section class="timeline">
        <div v-if="!memories.length" class="empty-state">
          <div class="empty-icon">◈</div>
          <p class="empty-title">还没有记忆</p>
          <p class="empty-hint">回去和知音聊几句，成长的痕迹会留在这里</p>
          <button class="btn-go-chat" @click="goHome">开始对话</button>
        </div>

        <div v-else class="tl-track">
          <div v-for="doc in memories" :key="doc.id" class="tl-item">
            <div class="tl-dot" />
            <div class="tl-card">
              <div class="tl-card-head">
                <ThemeTag :theme="doc.theme || '其它'" />
                <span class="tl-time">{{ formatDate(doc.createdAt) }}</span>
              </div>
              <h3 class="tl-title">{{ doc.title }}</h3>
              <p class="tl-content">{{ truncate(doc.content, 120) }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.timeline-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.tv-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  height: var(--header-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.btn-back {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tv-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0;
  background: linear-gradient(90deg, var(--accent-hover), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.tv-sub {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: 4px;
}

.tv-body {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px 48px;
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 36px;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent);
  border-radius: var(--radius-md);
  padding: 18px 16px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.stat-label {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
}

.timeline {
  position: relative;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
  color: var(--accent);
  text-shadow: 0 0 24px var(--accent-dim);
}

.empty-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-hint {
  margin: 0 0 20px;
  font-size: 13px;
}

.btn-go-chat {
  padding: 8px 20px;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.btn-go-chat:hover {
  background: var(--accent);
  color: var(--bg-primary);
}

.tl-track {
  position: relative;
  padding-left: 24px;
}

.tl-track::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: linear-gradient(180deg, var(--accent), var(--border));
}

.tl-item {
  position: relative;
  margin-bottom: 16px;
}

.tl-dot {
  position: absolute;
  left: -24px;
  top: 18px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--bg-primary);
  border: 2px solid var(--accent);
  box-shadow: 0 0 8px var(--accent-dim);
}

.tl-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-left: 2px solid var(--accent);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  transition: all var(--transition-fast);
}

.tl-card:hover {
  border-color: var(--accent);
  box-shadow: 0 0 12px var(--accent-dim);
}

.tl-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.tl-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.tl-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
}

.tl-content {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}
</style>
