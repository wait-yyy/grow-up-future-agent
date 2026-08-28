import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { Role } from '@/types'
import { generateId } from '@/utils'

export const useRoleStore = defineStore('role', () => {
  const roles = ref<Role[]>([])
  const currentRoleId = ref<string>('')

  async function load() {
    roles.value = await db.roles.toArray()
    if (roles.value.length && !currentRoleId.value) {
      currentRoleId.value = roles.value[0].id
    }
  }

  async function create(data: Omit<Role, 'id' | 'isBuiltin' | 'createdAt'>) {
    const role: Role = {
      ...data,
      id: generateId('role'),
      isBuiltin: false,
      createdAt: Date.now(),
    }
    await db.roles.add(role)
    roles.value.push(role)
    if (!currentRoleId.value) currentRoleId.value = role.id
    return role
  }

  async function update(id: string, data: Partial<Role>) {
    await db.roles.update(id, data)
    const idx = roles.value.findIndex(r => r.id === id)
    if (idx !== -1) Object.assign(roles.value[idx], data)
  }

  async function remove(id: string) {
    await db.roles.delete(id)
    roles.value = roles.value.filter(r => r.id !== id)
    if (currentRoleId.value === id) {
      currentRoleId.value = roles.value[0]?.id ?? ''
    }
  }

  function selectRole(id: string) {
    currentRoleId.value = id
  }

  function getCurrentRole(): Role | undefined {
    return roles.value.find(r => r.id === currentRoleId.value)
  }

  return { roles, currentRoleId, load, create, update, remove, selectRole, getCurrentRole }
})