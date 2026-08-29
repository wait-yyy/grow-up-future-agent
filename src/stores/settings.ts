import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { DEFAULT_SETTINGS, type Settings } from '@/types'
import { SETTINGS_STORAGE_KEY } from '@/constants'

function migrate(raw: Record<string, any>): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...raw }
  if (!merged.model?.trim()) merged.model = DEFAULT_SETTINGS.model
  if (!merged.baseUrl?.trim()) merged.baseUrl = DEFAULT_SETTINGS.baseUrl
  delete (merged as any).defaultEmotions
  delete (merged as any).apiKey
  return merged as Settings
}

function loadFromStorage(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return migrate(parsed)
    }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(loadFromStorage())

  function persist() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
  }

  function update(patch: Partial<Settings>) {
    Object.assign(settings.value, patch)
    persist()
  }

  watch(settings, persist, { deep: true })

  return { settings, update }
})