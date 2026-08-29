export type MessageRole = 'user' | 'assistant'

export type DocumentStatus = 'pending' | 'kept' | 'discarded'

export interface Session {
  id: string
  title: string
  selectedFolderIds: string[]
  mainLinkContent: string
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
  folderId: string
  theme: string
  title: string
  content: string
  status: DocumentStatus
  createdAt: number
}

export interface Folder {
  id: string
  name: string
  icon: string
  description: string
  createdAt: number
}

export interface Settings {
  apiKey: string
  baseUrl: string
  model: string
  generateTimeout: number
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  generateTimeout: 60000,
}
