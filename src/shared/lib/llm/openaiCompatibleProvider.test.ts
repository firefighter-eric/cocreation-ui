import { beforeEach, describe, expect, it, vi } from 'vitest'
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

    const provider = new OpenAICompatibleProvider()
    const promise = provider.generateNextLine(createInput())
    const expectation = expect(promise).rejects.toThrow('请求超时，请重试。')

    await vi.advanceTimersByTimeAsync(20000)

    await expectation
    vi.useRealTimers()
  })
})

function createInput(): GenerateNextLineInput {
  return {
    conversationMode: 'manual',
    history: [],
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
  }
}
