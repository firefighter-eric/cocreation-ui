import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appEnv } from '../../config/env'
import { sanitizeAssistantLine } from '../validation/storyLine'
import { buildStoryPrompt } from './prompt'
import { OpenAICompatibleProvider } from './openaiCompatibleProvider'
import type { GenerateNextLineInput } from './types'

describe('OpenAICompatibleProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fails with a retryable timeout error when request hangs too long', async () => {
    vi.useFakeTimers()

    vi.stubGlobal(
      'fetch',
      vi.fn((_: string, init?: RequestInit) => {
        return new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      }),
    )

    const provider = new OpenAICompatibleProvider({
      apiKey: 'test-key',
      baseUrl: 'https://example.com/v1',
      model: 'gpt-test',
      source: 'env',
    })
    const promise = provider.generateNextLine(createInput())
    const expectation = expect(promise).rejects.toThrow('请求超时，请重试。')

    await vi.advanceTimersByTimeAsync(20000)

    await expectation
    vi.useRealTimers()
  })

  it('uses resolved runtime config for request url and auth header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '窗外的雨开始倒着落下',
              },
            },
          ],
        }),
      }),
    )

    const provider = new OpenAICompatibleProvider({
      apiKey: 'custom-key',
      baseUrl: 'https://custom.example/v1',
      model: 'ignored-config-model',
      source: 'custom',
    })

    await provider.generateNextLine(createInput())

    expect(fetch).toHaveBeenCalledWith(
      'https://custom.example/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer custom-key',
        }),
        body: expect.stringContaining('"model":"story-model"'),
      }),
    )
  })

  const liveTest = appEnv.baseUrl && appEnv.apiKey ? it : it.skip

  liveTest('can call the real provider using .env-backed config', async () => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    const input = createInput({
      model: appEnv.model,
    })

    const response = await fetch(`${appEnv.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appEnv.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
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
        ],
      }),
    })

    const rawText = await response.text()
    expect(response.ok, rawText || `请求失败，状态码 ${response.status}`).toBe(true)

    const data = JSON.parse(rawText) as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }
    const content = data.choices?.[0]?.message?.content?.trim()

    expect(content).toBeTruthy()
    expect(sanitizeAssistantLine(content ?? '', input.rules).length).toBeGreaterThan(0)
  })
})

function createInput(
  overrides: Partial<GenerateNextLineInput> = {},
): GenerateNextLineInput {
  return {
    conversationMode: 'manual',
    history: [],
    model: 'story-model',
    rules: {
      maxChars: 20,
      punctuationAllowed: false,
    },
    seed: {
      id: 'library',
      title: '图书馆角落',
      openingLine: '图书馆的角落里有个读书的人',
      summary: '',
    },
    speaker: 'assistant',
    style: 'coherent',
    systemPrompt: '请自然接龙',
    temperature: 1,
    topP: 1,
    ...overrides,
  }
}
