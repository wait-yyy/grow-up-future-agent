import type { EmotionType } from '@/types'

export const ALL_EMOTIONS: EmotionType[] = [
  'objective',
  'enthusiastic',
  'melancholic',
  'humorous',
  'critical',
  'poetic',
]

export const EMOTION_LABELS: Record<EmotionType, string> = {
  objective: '客观',
  enthusiastic: '热情',
  melancholic: '忧郁',
  humorous: '幽默',
  critical: '批判',
  poetic: '诗意',
}

export const EMOTION_COLORS: Record<EmotionType, string> = {
  objective: '#6b7280',
  enthusiastic: '#f59e0b',
  melancholic: '#6366f1',
  humorous: '#10b981',
  critical: '#ef4444',
  poetic: '#8b5cf6',
}

export const EMOTION_SYSTEM_PROMPTS: Record<EmotionType, string> = {
  objective: '请以客观、中立的语气重新整理以下对话内容为一份文档。保持事实准确，避免主观评价。',
  enthusiastic: '请以热情洋溢的语气重新整理以下对话内容为一份文档。使用积极向上的表达，传递热情与活力。',
  melancholic: '请以忧郁深沉的语气重新整理以下对话内容为一份文档。使用富有感伤的表达，营造沉思氛围。',
  humorous: '请以幽默风趣的语气重新整理以下对话内容为一份文档。适当使用俏皮话和比喻，让内容生动有趣。',
  critical: '请以批判审视的语气重新整理以下对话内容为一份文档。指出问题与不足，提出改进建议。',
  poetic: '请以诗意优美的语气重新整理以下对话内容为一份文档。使用丰富的意象和修辞，营造文学美感。',
}

export const BUILTIN_API_KEY = 'sk-seJfC5LIypIBRv1wTJPi4lenuxftTBlZmCgouOJjd7gz78fC'

export const SETTINGS_STORAGE_KEY = 'dcrdci-settings'