import { db } from '@/db'
import type { Role } from '@/types'
import { generateId } from '@/utils'

export async function getAll(includeBuiltin = true): Promise<Role[]> {
  const all = await db.roles.toArray()
  return includeBuiltin ? all : all.filter(r => !r.isBuiltin)
}

export async function create(data: Omit<Role, 'id' | 'isBuiltin' | 'createdAt'>): Promise<Role> {
  const role: Role = {
    ...data,
    id: generateId('role'),
    isBuiltin: false,
    createdAt: Date.now(),
  }
  await db.roles.add(role)
  return role
}

export async function update(id: string, data: Partial<Role>): Promise<void> {
  await db.roles.update(id, data)
}

export async function remove(id: string): Promise<void> {
  await db.roles.delete(id)
}