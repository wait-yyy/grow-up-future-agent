export type EmotionType = 'objective' | 'enthusiastic' | 'melancholic' | 'humorous' | 'critical' | 'poetic'

export type MessageRole = 'user' | 'assistant'

export type DocumentStatus = 'pending' | 'kept' | 'discarded'

export interface Session {
  id: string
  title: string
  roleId: string
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  createdAt: number
}

export interface Document {
  id: string
  sessionId: string
  emotion: EmotionType
  title: string
  content: string
  status: DocumentStatus
  appliedRoleId?: string
  createdAt: number
}

export interface Role {
  id: string
  name: string
  avatar: string
  description: string
  systemPrompt: string
  emotionOverrides: Partial<Record<EmotionType, string>>
  isBuiltin: boolean
  createdAt: number
}

export interface Settings {
  apiKey: string
  baseUrl: string
  model: string
  defaultEmotions: EmotionType[]
  generateTimeout: number
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
  defaultEmotions: ['objective', 'enthusiastic', 'melancholic', 'humorous', 'critical', 'poetic'],
  generateTimeout: 60000,
}