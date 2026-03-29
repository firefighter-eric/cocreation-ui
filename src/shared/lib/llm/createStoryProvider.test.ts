import { describe, expect, it } from 'vitest'
import { createStoryProvider } from './createStoryProvider'

describe('createStoryProvider', () => {
  it('returns mock provider when no remote config is available', () => {
    expect(createStoryProvider(null).label).toBe('Mock Provider')
  })

  it('returns openai-compatible provider when remote config is available', () => {
    expect(
      createStoryProvider({
        apiKey: 'custom-key',
        baseUrl: 'https://custom.example/v1',
        model: 'custom-model',
        source: 'custom',
      }).label,
    ).toBe('OpenAI Compatible · 自定义配置')
  })
})
