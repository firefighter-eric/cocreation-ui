import { MockProvider } from './mockProvider'
import { OpenAICompatibleProvider } from './openaiCompatibleProvider'
import type { ResolvedLLMConfig } from './runtimeConfig'

export function createStoryProvider(config: ResolvedLLMConfig | null) {
  if (config) {
    return new OpenAICompatibleProvider(config)
  }

  return new MockProvider()
}
