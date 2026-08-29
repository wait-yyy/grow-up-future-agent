import OpenAI from 'openai'
import { BUILTIN_API_KEY } from '@/constants'
import { useSettingsStore } from '@/stores/settings'
import type { Message, Document } from '@/types'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

function createClient(): OpenAI {
  const { settings } = useSettingsStore()
  return new OpenAI({
    apiKey: BUILTIN_API_KEY,
    baseURL: settings.baseUrl?.trim() || undefined,
    dangerouslyAllowBrowser: true,
  })
}

function getModel(): string {
  const { settings } = useSettingsStore()
  return settings.model?.trim() || 'deepseek-chat'
}

export async function generateMainLink(docs: Document[]): Promise<string> {
  if (!docs.length) return ''

  const client = createClient()
  const model = getModel()

  const docsText = docs.map((d, i) => `【文档${i + 1}：${d.title}】\n${d.content}`).join('\n\n')

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: '你是一个文档整合助手。请把用户提供的多份文档整合成一份连贯的上下文文档（Main_link），用于作为后续对话的背景知识。要求：1) 保留各文档的关键信息；2) 去除重复内容；3) 按主题/逻辑组织；4) 输出纯文本，不要额外解释。',
    },
    {
      role: 'user',
      content: `请整合以下 ${docs.length} 份文档为一份 Main_link：\n\n${docsText}`,
    },
  ]

  const resp = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
  })

  return resp.choices[0]?.message?.content?.trim() ?? ''
}

export async function sendMessage(
  chatMessages: Message[],
  mainLink: string,
  onDelta: (text: string) => void,
): Promise<string> {
  const client = createClient()
  const model = getModel()

  const result: ChatMessage[] = []
  if (mainLink.trim()) {
    result.push({
      role: 'system',
      content: `以下是背景上下文（Main_link），请结合它来回应用户：\n\n${mainLink}`,
    })
  }
  for (const m of chatMessages) {
    result.push({ role: m.role as 'user' | 'assistant', content: m.content })
  }

  if (!result.length) throw new Error('消息列表为空')

  try {
    const stream = await client.chat.completions.create({
      model,
      messages: result,
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

export async function generateSummaryDocs(
  chatMessages: Message[],
): Promise<Array<{ theme: string; title: string; content: string }>> {
  const client = createClient()
  const model = getModel()

  const conversationText = chatMessages
    .map(m => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
    .join('\n')

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: '你是一个用户画像提炼助手。请分析用户和助手的对话，提炼出用户习惯、偏好、需求类的信息，不要单纯总结对话文字。要求：1) 重点提取：用户的使用习惯、操作偏好、审美倾向、功能需求、痛点诉求、决策模式等画像信息，忽略寒暄和一次性问答；2) 拆分粒度要细，一个习惯/需求点一个文档，能拆多细拆多细；3) content 尽可能精简，用最少的字把该画像点表达清楚，能一句话说清就一句话，写成"用户偏好/需求：xxx"的陈述句；4) 如果对话里没有可提炼的用户习惯或需求信息，返回空数组 []；5) theme 用2-4字标签如"偏好"、"需求"、"习惯"、"痛点"。每个文档包含：theme、title、content。用 JSON 数组返回，格式：[{"theme":"","title":"","content":""}]，不要输出其它内容。',
    },
    {
      role: 'user',
      content: `以下是对话内容：\n\n${conversationText}\n\n请提炼用户的习惯、偏好、需求画像信息，JSON 数组格式返回。`,
    },
  ]

  const resp = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.5,
  })

  const text = resp.choices[0]?.message?.content?.trim() ?? ''

  let parsed: Array<{ theme: string; title: string; content: string }> = []
  try {
    const match = text.match(/\[[\s\S]*\]/)
    parsed = match ? JSON.parse(match[0]) : JSON.parse(text)
  } catch {
    console.error('[AI] 小文档解析失败:', text.slice(0, 200))
    parsed = []
  }

  return parsed.filter(d => d.title && d.content)
}

export async function generateTitle(docs: Array<{ theme: string; title: string }>): Promise<string> {
  const client = createClient()
  const model = getModel()

  const themes = docs.map(d => d.theme).filter(Boolean).join('、')
  const titles = docs.map(d => d.title).join('；')

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: '根据文档的主题和标题，生成一个10字以内的中文会话标题，概括这些文档的核心内容。只输出标题文字，不要标点符号、不要引号、不要额外解释。',
    },
    {
      role: 'user',
      content: `文档主题：${themes}\n文档标题：${titles}\n\n请生成10字以内的会话标题。`,
    },
  ]

  const resp = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
  })

  const title = resp.choices[0]?.message?.content?.trim() ?? ''
  return title.replace(/[「」""''。.!！？?]/g, '').slice(0, 10)
}
