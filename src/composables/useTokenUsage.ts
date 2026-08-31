import { ref, computed } from 'vue'

export type UsageType = 'chat' | 'mainlink' | 'summary' | 'title'

export interface UsageRecord {
  id: string
  time: number
  type: UsageType
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

const STORAGE_KEY = 'dcrdci-token-usage'

// 全局单例记录（跨组件共享）
const records = ref<UsageRecord[]>(loadAll())

function loadAll(): UsageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UsageRecord[]) : []
  } catch {
    return []
  }
}

function persist() {
  try {
    // 只保留最近 500 条，防止 localStorage 爆满
    const list = records.value.slice(-500)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* 忽略 */
  }
}

function add(rec: Omit<UsageRecord, 'id'>) {
  if (!rec.totalTokens) return
  records.value.push({
    ...rec,
    id: `tok_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  })
  persist()
}

function clearAll() {
  records.value = []
  persist()
}

export function useTokenUsage() {
  // 汇总
  const total = computed(() => records.value.reduce((s, r) => s + r.totalTokens, 0))
  const promptTotal = computed(() => records.value.reduce((s, r) => s + r.promptTokens, 0))
  const completionTotal = computed(() => records.value.reduce((s, r) => s + r.completionTokens, 0))
  const count = computed(() => records.value.length)

  // 按类型分组
  const byType = computed(() => {
    const map: Record<string, { count: number; tokens: number }> = {}
    for (const r of records.value) {
      const cur = map[r.type]
      if (cur) {
        cur.count++
        cur.tokens += r.totalTokens
      } else {
        map[r.type] = { count: 1, tokens: r.totalTokens }
      }
    }
    return map
  })

  // 按日期分组（YYYY-MM-DD）
  const byDate = computed(() => {
    const map: Record<string, number> = {}
    for (const r of records.value) {
      const d = new Date(r.time)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] ?? 0) + r.totalTokens
    }
    // 按日期升序
    return Object.entries(map)
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => a.date.localeCompare(b.date))
  })

  // 按月分组（YYYY-MM）
  const byMonth = computed(() => {
    const map: Record<string, { tokens: number; count: number }> = {}
    for (const r of records.value) {
      const d = new Date(r.time)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const cur = map[key]
      if (cur) {
        cur.tokens += r.totalTokens
        cur.count++
      } else {
        map[key] = { tokens: r.totalTokens, count: 1 }
      }
    }
    return Object.entries(map)
      .map(([month, info]) => ({ month, ...info }))
      .sort((a, b) => a.month.localeCompare(b.month))
  })

  // 每日 token 数映射（YYYY-MM-DD -> tokens），用于热力图查表
  const dailyMap = computed(() => {
    const map: Record<string, number> = {}
    for (const r of records.value) {
      const d = new Date(r.time)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      map[key] = (map[key] ?? 0) + r.totalTokens
    }
    return map
  })

  return {
    records,
    total,
    promptTotal,
    completionTotal,
    count,
    byType,
    byDate,
    byMonth,
    dailyMap,
    addRecord: add,
    clearAll,
  }
}
