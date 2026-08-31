import OpenAI from 'openai'
import { BUILTIN_API_KEY } from '@/constants'
import { useSettingsStore } from '@/stores/settings'
import { useTokenUsage } from '@/composables/useTokenUsage'
import type { Message, Document } from '@/types'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

function createClient(): OpenAI {
  const { settings } = useSettingsStore()
  return new OpenAI({
    apiKey: settings.apiKey?.trim() || BUILTIN_API_KEY,
    baseURL: settings.baseUrl?.trim() || undefined,
    dangerouslyAllowBrowser: true,
  })
}

function getModel(): string {
  const { settings } = useSettingsStore()
  return settings.model?.trim() || 'deepseek-chat'
}

// 记录 token 用量
function logUsage(type: 'chat' | 'mainlink' | 'summary' | 'title', model: string, usage: any) {
  if (!usage) return
  useTokenUsage().addRecord({
    time: Date.now(),
    type,
    model,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  })
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

  logUsage('mainlink', model, resp.usage)

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
      content: [
        '你是用户的知音，一位温和、真诚、长期陪伴 TA 的伙伴。你倾听多于说教，回应有温度但不煽情，像真正在意 TA 的人那样说话。',
        '下方「记忆」是你对这位用户的最新了解（每次对话前都已更新为最新版本）——TA 聊过的事、在意的东西、走过的路。',
        '请优先基于这份最新记忆来理解当前对话：',
        '1) 回应时自然融入记忆里的相关信息，让 TA 感觉到「你记得我」，但不要生硬复述或罗列记忆，而是像老朋友那样不经意地呼应；',
        '2) 如果记忆与当前话题相关，主动呼应；如果记忆已与当前话题无关，就专注当下；',
        '3) 把对话上文与记忆结合起来回答，不要只依赖其中之一。',
        '——关于 TA 的最新记忆（已随本次对话更新）——',
        mainLink,
      ].join('\n'),
    })
  } else {
    result.push({
      role: 'system',
      content: '你是用户的知音，一位温和、真诚、长期陪伴 TA 的伙伴。你倾听多于说教，回应有温度但不煽情，像真正在意 TA 的人那样说话。虽然你还没有关于 TA 的记忆，请用心听 TA 说的每一句，让 TA 感到被看见。',
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
      stream_options: { include_usage: true },
    })

    let full = ''
    let usage: any = null
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      full += delta
      onDelta(full)
      if ((chunk as any).usage) usage = (chunk as any).usage
    }

    logUsage('chat', model, usage)

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
      content: '你是一个内容提炼助手。请分析用户和助手的对话，拆分成若干个独立的主题小文档。要求：1) 拆分粒度要细，一个主题一个文档，能拆多细拆多细；2) 每个文档只保留核心信息素（最关键、不可省略的信息点），去掉所有冗余、客套、重复表述；3) content 尽可能精简，用最少的字把该主题的意思表达完整，能一句话说清就一句话；4) 宁可多拆几个短文档，也不要把多个主题混在一个长文档里。每个文档包含：theme（主题标签，2-4字）、title（标题）、content（精简正文）。用 JSON 数组返回，格式：[{"theme":"","title":"","content":""}]，不要输出其它内容。',
    },
    {
      role: 'user',
      content: `以下是对话内容：\n\n${conversationText}\n\n请拆分成多个精简的主题小文档，JSON 数组格式返回。`,
    },
  ]

  const resp = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.5,
  })

  logUsage('summary', model, resp.usage)

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

  logUsage('title', model, resp.usage)

  const title = resp.choices[0]?.message?.content?.trim() ?? ''
  return title.replace(/[「」""''。.!！？?]/g, '').slice(0, 10)
}
