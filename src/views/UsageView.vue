<script setup lang="ts">
import { computed } from 'vue'
import { useTokenUsage } from '@/composables/useTokenUsage'
import { useRouter } from 'vue-router'

const { records, total, promptTotal, completionTotal, count, byType, byDate, byMonth, dailyMap, clearAll } = useTokenUsage()
const router = useRouter()

const TYPE_LABEL: Record<string, string> = {
  chat: '对话',
  mainlink: 'Main_link',
  summary: '提炼',
  title: '标题',
}

function fmt(n: number): string {
  return n.toLocaleString()
}

function fmtTime(t: number): string {
  const d = new Date(t)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 柱状图最大值（用于计算高度比）
const maxDateTokens = () => Math.max(1, ...byDate.value.map(d => d.tokens))
const maxMonthTokens = () => Math.max(1, ...byMonth.value.map(m => m.tokens))

// 热力图：最近 18 周（126 天），按星期对齐补空
type HeatCell = { date: string; tokens: number; level: number; dow: number } | null

function levelOf(tokens: number): number {
  if (tokens <= 0) return 0
  if (tokens < 1000) return 1
  if (tokens < 5000) return 2
  if (tokens < 20000) return 3
  return 4
}

const heatCells = computed<HeatCell[]>(() => {
  const arr: HeatCell[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 125)
  // 前面补空格让起点对齐到星期日
  for (let i = 0; i < start.getDay(); i++) arr.push(null)
  for (let i = 125; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const tokens = dailyMap.value[key] ?? 0
    arr.push({ date: key, tokens, level: levelOf(tokens), dow: d.getDay() })
  }
  return arr
})

// 热力图月份标签（每列首日所在月份）
const heatMonthLabels = computed(() => {
  const labels: { text: string; col: number }[] = []
  let lastMonth = ''
  heatCells.value.forEach((c, idx) => {
    // 每列首格（idx % 7 === 0）所在月份
    if (idx % 7 === 0 && c) {
      const m = c.date.slice(0, 7)
      if (m !== lastMonth) {
        labels.push({ text: m, col: Math.floor(idx / 7) })
        lastMonth = m
      }
    }
  })
  return labels
})

const LEVEL_COLORS = ['var(--bg-active)', 'rgba(47,219,176,0.25)', 'rgba(47,219,176,0.45)', 'rgba(47,219,176,0.7)', 'var(--accent)']
const LEVEL_LABELS = ['无', '<1k', '1k-5k', '5k-20k', '>20k']
</script>

<template>
  <div class="usage-view">
    <header class="uv-header">
      <button class="btn-back" @click="router.push('/')">← 返回</button>
      <h1>Token 用量</h1>
      <button v-if="count > 0" class="btn-clear" @click="clearAll">清空记录</button>
    </header>

    <!-- 总览卡片 -->
    <section class="summary-cards">
      <div class="sum-card total">
        <span class="sum-label">总 Token</span>
        <span class="sum-value">{{ fmt(total) }}</span>
      </div>
      <div class="sum-card">
        <span class="sum-label">输入 Prompt</span>
        <span class="sum-value">{{ fmt(promptTotal) }}</span>
      </div>
      <div class="sum-card">
        <span class="sum-label">输出 Completion</span>
        <span class="sum-value">{{ fmt(completionTotal) }}</span>
      </div>
      <div class="sum-card">
        <span class="sum-label">调用次数</span>
        <span class="sum-value">{{ count }}</span>
      </div>
    </section>

    <div v-if="count === 0" class="empty">
      <p>暂无用量记录</p>
      <p class="empty-hint">开始对话后，每次 API 调用的 token 用量会自动统计到这里</p>
    </div>

    <template v-else>
      <!-- 按类型统计 -->
      <section class="block">
        <h2>按类型</h2>
        <div class="type-list">
          <div v-for="(info, type) in byType" :key="type" class="type-row">
            <span class="type-label">{{ TYPE_LABEL[type] ?? type }}</span>
            <div class="type-bar-bg">
              <div
                class="type-bar"
                :style="{ width: (info.tokens / Math.max(1, ...Object.values(byType).map(t => t.tokens))) * 100 + '%' }"
              />
            </div>
            <span class="type-count">{{ info.count }} 次</span>
            <span class="type-tokens">{{ fmt(info.tokens) }}</span>
          </div>
        </div>
      </section>

      <!-- 按日期统计 -->
      <section class="block">
        <h2>按日期</h2>
        <div class="date-chart">
          <div v-for="d in byDate" :key="d.date" class="date-col">
            <div class="bar-wrap">
              <div class="date-bar" :style="{ height: (d.tokens / maxDateTokens()) * 100 + '%' }" />
            </div>
            <span class="date-label">{{ d.date.slice(5) }}</span>
            <span class="date-tokens">{{ fmt(d.tokens) }}</span>
          </div>
        </div>
      </section>

      <!-- 月用量条形图 -->
      <section class="block">
        <h2>月用量</h2>
        <div v-if="byMonth.length" class="month-chart">
          <div v-for="m in byMonth" :key="m.month" class="month-col">
            <div class="m-bar-wrap">
              <div class="month-bar" :style="{ height: (m.tokens / maxMonthTokens()) * 100 + '%' }" />
              <span class="m-bar-value">{{ fmt(m.tokens) }}</span>
            </div>
            <span class="month-label">{{ m.month.slice(5) }}月</span>
            <span class="month-count">{{ m.count }} 次</span>
          </div>
        </div>
        <p v-else class="block-empty">暂无数据</p>
      </section>

      <!-- 使用热力图 -->
      <section class="block">
        <h2>使用热力图 <span class="block-sub">（最近 18 周）</span></h2>
        <div class="heatmap">
          <!-- 月份标签 -->
          <div class="heat-months">
            <span
              v-for="lbl in heatMonthLabels"
              :key="lbl.text"
              class="heat-month-label"
              :style="{ gridColumn: lbl.col + 1 }"
            >{{ lbl.text.slice(5) }}月</span>
          </div>
          <div class="heat-grid-wrap">
            <!-- 星期标签 -->
            <div class="heat-dow">
              <span>一</span><span>三</span><span>五</span><span>日</span>
            </div>
            <!-- 格子网格 -->
            <div class="heat-grid">
              <template v-for="(c, idx) in heatCells" :key="idx">
                <div v-if="c" class="heat-cell" :class="'lv-' + c.level" :title="`${c.date}：${fmt(c.tokens)} tokens`" />
                <div v-else class="heat-cell empty" />
              </template>
            </div>
          </div>
        </div>
        <!-- 图例 -->
        <div class="heat-legend">
          <span class="legend-title">少</span>
          <span v-for="(color, i) in LEVEL_COLORS" :key="i" class="legend-cell" :style="{ background: color }" :title="LEVEL_LABELS[i]" />
          <span class="legend-title">多</span>
        </div>
      </section>

      <!-- 最近记录 -->
      <section class="block">
        <h2>最近记录 <span class="block-sub">（最多 100 条）</span></h2>
        <div class="record-list">
          <div v-for="r in records.slice(-100).reverse()" :key="r.id" class="record-row">
            <span class="rec-type">{{ TYPE_LABEL[r.type] ?? r.type }}</span>
            <span class="rec-time">{{ fmtTime(r.time) }}</span>
            <span class="rec-model">{{ r.model }}</span>
            <span class="rec-detail">
              <span class="rec-p">P: {{ fmt(r.promptTokens) }}</span>
              <span class="rec-c">C: {{ fmt(r.completionTokens) }}</span>
            </span>
            <span class="rec-total">{{ fmt(r.totalTokens) }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.usage-view {
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  color: var(--text-primary);
}

.uv-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.uv-header h1 {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.btn-back, .btn-clear {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.btn-clear { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 40%, transparent); }
.btn-clear:hover { background: color-mix(in srgb, var(--danger) 10%, transparent); }

/* 总览卡片 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.sum-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sum-card.total {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
}

.sum-label {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
}

.sum-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.sum-card.total .sum-value {
  color: var(--accent);
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-tertiary);
}

.empty p { margin: 4px 0; font-size: 14px; }
.empty-hint { font-size: 12px !important; }

.block {
  margin-bottom: 28px;
}

.block h2 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-primary);
  letter-spacing: 0.04em;
}

.block-sub {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 400;
}

/* 类型统计 */
.type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-row {
  display: grid;
  grid-template-columns: 80px 1fr 60px 80px;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.type-label {
  color: var(--text-secondary);
}

.type-bar-bg {
  height: 8px;
  background: var(--bg-active);
  border-radius: 4px;
  overflow: hidden;
}

.type-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
  transition: width 0.3s;
}

.type-count, .type-tokens {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.type-tokens { color: var(--accent); font-weight: 600; }

/* 日期柱状图 */
.date-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 140px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.date-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 44px;
  height: 100%;
}

.bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  min-height: 2px;
}

.date-bar {
  width: 100%;
  background: var(--accent);
  border-radius: 3px 3px 0 0;
  min-height: 2px;
  opacity: 0.85;
}

.date-label, .date-tokens {
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.date-tokens { color: var(--text-secondary); font-variant-numeric: tabular-nums; }

.block-empty {
  color: var(--text-tertiary);
  font-size: 13px;
  padding: 16px 0;
}

/* 月用量条形图 */
.month-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 180px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.month-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 56px;
  height: 100%;
}

.m-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  min-height: 2px;
}

.month-bar {
  width: 70%;
  background: var(--accent);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  opacity: 0.85;
}

.m-bar-value {
  font-size: 10px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.month-label, .month-count {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.month-count { font-size: 10px; }

/* 热力图 */
.heatmap {
  overflow-x: auto;
  padding: 4px 0;
}

.heat-months {
  display: grid;
  grid-template-columns: repeat(18, 1fr);
  grid-auto-columns: min-content;
  margin-left: 28px;
  margin-bottom: 4px;
  gap: 3px;
}

.heat-month-label {
  font-size: 10px;
  color: var(--text-tertiary);
}

.heat-grid-wrap {
  display: flex;
  gap: 4px;
}

.heat-dow {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: 3px;
  font-size: 9px;
  color: var(--text-tertiary);
  padding-top: 1px;
  width: 24px;
}

.heat-dow span {
  display: flex;
  align-items: center;
}

.heat-grid {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 3px;
}

.heat-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: var(--bg-active);
}

.heat-cell.empty {
  background: transparent;
}

.heat-cell.lv-1 { background: rgba(47, 219, 176, 0.25); }
.heat-cell.lv-2 { background: rgba(47, 219, 176, 0.45); }
.heat-cell.lv-3 { background: rgba(47, 219, 176, 0.7); }
.heat-cell.lv-4 { background: var(--accent); }

.heat-cell:hover {
  outline: 1px solid var(--accent);
  outline-offset: 1px;
}

.heat-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  font-size: 10px;
  color: var(--text-tertiary);
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-title {
  margin: 0 4px;
}

/* 记录列表 */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.record-row {
  display: grid;
  grid-template-columns: 70px 90px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.rec-type {
  color: var(--accent);
  font-weight: 600;
}

.rec-time { color: var(--text-tertiary); }
.rec-model { color: var(--text-tertiary); font-size: 11px; }

.rec-detail {
  display: flex;
  gap: 10px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.rec-total {
  color: var(--text-primary);
  font-weight: 600;
}
</style>
