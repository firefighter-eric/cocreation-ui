import { appEnv } from '../../config/env'
import { sanitizeAssistantLine } from '../validation/storyLine'
import { buildStoryPrompt } from './prompt'
import type {
  GenerateNextLineInput,
  LLMChatCompletionResponse,
  LLMProvider,
} from './types'

export class OpenAICompatibleProvider implements LLMProvider {
  label = 'OpenAI Compatible'

  async generateNextLine(input: GenerateNextLineInput) {
    const response = await fetch(`${appEnv.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appEnv.apiKey}`,
      },
      body: JSON.stringify({
        model: appEnv.model,
        temperature: input.temperature,
        top_p: input.topP,
        max_tokens: 80,
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

    return sanitizeAssistantLine(content, input.rules)
  }
}
