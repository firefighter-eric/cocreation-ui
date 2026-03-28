import { hasRemoteProviderConfig } from '../../config/env'
import { MockProvider } from './mockProvider'
import { OpenAICompatibleProvider } from './openaiCompatibleProvider'

export function createStoryProvider() {
  if (hasRemoteProviderConfig()) {
    return new OpenAICompatibleProvider()
  }

  return new MockProvider()
}
