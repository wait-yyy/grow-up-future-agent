import OpenAI from 'openai'
import { BUILTIN_API_KEY } from '@/constants'
import { useSettingsStore } from '@/stores/settings'
import type { Message, Role, EmotionType } from '@/types'
import { EMOTION_LABELS, EMOTION_SYSTEM_PROMPTS } from '@/constants'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

function createClient(): OpenAI {
  const { settings } = useSettingsStore()
  return new OpenAI({
    apiKey: BUILTIN_API_KEY,
    baseURL: settings.baseUrl?.trim() || undefined,
    dangerouslyAllowBrowser: true,
  })
}

function buildChatMessages(chatMessages: Message[], role?: Role): ChatMessage[] {
  const result: ChatMessage[] = []
  if (role?.systemPrompt) {
    result.push({ role: 'system', content: role.systemPrompt })
  }
  for (const m of chatMessages) {
    result.push({ role: m.role as 'user' | 'assistant', content: m.content })
  }
  return result
}

export async function sendMessage(
  chatMessages: Message[],
  role: Role | undefined,
  onDelta: (text: string) => void,
): Promise<string> {
  const client = createClient()
  const { settings } = useSettingsStore()
  const model = settings.model?.trim() || 'gpt-3.5-turbo'
  const messages = buildChatMessages(chatMessages, role)

  if (!messages.length) throw new Error('消息列表为空')

  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    })

    let full = ''
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      full += delta
      onDelta(full)
    }

    if (!full) throw new Error('API 返回了空内容')
    return full
  } catch (e: any) {
    console.error('[AI] 请求失败:', e?.status, e?.message)
    if (e?.status === 401) throw new Error('API Key 无效或已过期')
    if (e?.status === 404) throw new Error(`模型 "${model}" 不存在`)
    if (e?.status === 429) throw new Error('请求过于频繁，请稍后重试')
    if (e?.status === 500 || e?.status === 502 || e?.status === 503) {
      throw new Error('API 服务器错误，请稍后重试')
    }
    if (e?.message?.includes('Failed to fetch') || e?.message?.includes('NetworkError') || e?.message?.includes('fetch failed')) {
      throw new Error('网络连接失败')
    }
    if (e?.message?.includes('CORS')) throw new Error('CORS 错误')
    throw new Error(e?.message ?? '未知错误')
  }
}

export async function generateDocument(
  chatMessages: Message[],
  emotion: EmotionType,
  role?: Role,
): Promise<{ title: string; content: string }> {
  const client = createClient()
  const { settings } = useSettingsStore()
  const model = settings.model?.trim() || 'gpt-3.5-turbo'

  let systemPrompt = EMOTION_SYSTEM_PROMPTS[emotion]
  const override = role?.emotionOverrides?.[emotion]
  if (override) systemPrompt = override

  const conversationText = chatMessages
    .map(m => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
    .join('\n')

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `以下是对话内容：\n\n${conversationText}\n\n请根据以上对话生成一份${EMOTION_LABELS[emotion]}风格的文档。先给出文档标题（一行），然后空一行，再写正文内容。`,
    },
  ]

  const resp = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
  })

  const text = resp.choices[0]?.message?.content ?? ''
  const lines = text.split('\n')
  const title = lines[0]?.replace(/^#+\s*/, '') || `${EMOTION_LABELS[emotion]}风格文档`
  const content = lines.slice(1).join('\n').trim()

  return { title, content }
}

export async function generateAllDocuments(
  chatMessages: Message[],
  emotions: EmotionType[],
  role?: Role,
): Promise<Array<{ emotion: EmotionType; result: { title: string; content: string } } | { emotion: EmotionType; error: string }>> {
  const results = await Promise.allSettled(
    emotions.map(async emotion => {
      const result = await generateDocument(chatMessages, emotion, role)
      return { emotion, result }
    }),
  )

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return { emotion: emotions[i], error: r.reason?.message ?? '生成失败' }
  })
}