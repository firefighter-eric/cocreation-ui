import { sanitizeAssistantLine } from '../validation/storyLine'
import { buildStoryPrompt } from './prompt'
import type { ResolvedLLMConfig } from './runtimeConfig'
import type {
  GenerateNextLineInput,
  LLMChatCompletionResponse,
  LLMProvider,
} from './types'

const REQUEST_TIMEOUT_MS = 60000
const MAX_RETRY_COUNT = 1

export class OpenAICompatibleProvider implements LLMProvider {
  private readonly config: ResolvedLLMConfig
  label: string

  constructor(config: ResolvedLLMConfig) {
    this.config = config
    this.label =
      config.source === 'custom'
        ? 'OpenAI Compatible · 自定义配置'
        : 'OpenAI Compatible'
  }

  async generateNextLine(input: GenerateNextLineInput) {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt += 1) {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      try {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: input.model,
            temperature: input.temperature,
            top_p: input.topP,
            max_tokens: input.maxTokens,
            messages: [
              {
                role: 'system',
                content: buildStoryPrompt(input),
              },
              {
                role: 'user',
                content: input.seed.openingLine,
              },
              ...input.history.map((message) => ({
                role: message.role,
                content: message.content,
              })),
            ],
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || `请求失败，状态码 ${response.status}`)
        }

        const data = (await response.json()) as LLMChatCompletionResponse
        const content = data.choices?.[0]?.message?.content?.trim()

        if (!content) {
          throw new Error('模型没有返回可用内容。')
        }

        return sanitizeAssistantLine(content, input.rules, input.outputMaxChars)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          lastError = new Error('请求超时，请重试。')
        } else if (error instanceof Error) {
          lastError = error
        } else {
          lastError = new Error('模型返回异常，请稍后再试。')
        }

        if (attempt >= MAX_RETRY_COUNT) {
          throw lastError
        }
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    throw lastError ?? new Error('模型返回异常，请稍后再试。')
  }
}
