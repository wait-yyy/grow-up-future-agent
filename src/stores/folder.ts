import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Folder } from '@/types'
import { generateId } from '@/utils'

export const useFolderStore = defineStore('folder', () => {
  const folders = ref<Folder[]>([])
  const currentFolderId = ref<string>('')

  async function load() {
    folders.value = await db.folders.toArray()
    if (folders.value.length && !currentFolderId.value) {
      const first = folders.value[0]
      if (first) currentFolderId.value = first.id
    }
  }

  async function create(data: Omit<Folder, 'id' | 'createdAt'>) {
    const folder: Folder = {
      ...data,
      id: generateId('folder'),
      createdAt: Date.now(),
    }
    await db.folders.add(folder)
    folders.value.push(folder)
    if (!currentFolderId.value) currentFolderId.value = folder.id
    return folder
  }

  async function update(id: string, data: Partial<Folder>) {
    await db.folders.update(id, data)
    const idx = folders.value.findIndex(f => f.id === id)
    if (idx !== -1) {
      const target = folders.value[idx]
      if (target) Object.assign(target, data)
    }
  }

  async function remove(id: string) {
    await db.folders.delete(id)
    folders.value = folders.value.filter(f => f.id !== id)
    if (currentFolderId.value === id) {
      currentFolderId.value = folders.value[0]?.id ?? ''
    }
  }

  function selectFolder(id: string) {
    currentFolderId.value = id
  }

  function getCurrentFolder(): Folder | undefined {
    return folders.value.find(f => f.id === currentFolderId.value)
  }

  return { folders, currentFolderId, load, create, update, remove, selectFolder, getCurrentFolder }
})
