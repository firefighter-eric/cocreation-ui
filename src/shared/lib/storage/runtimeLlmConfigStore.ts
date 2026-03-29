import type { RuntimeLLMConfig } from '../llm/runtimeConfig'
import { LocalStorageRuntimeLLMConfigStore } from './localStorageRuntimeLLMConfigStore'

export interface RuntimeLLMConfigStore {
  clear: () => void
  load: () => RuntimeLLMConfig | null
  save: (config: RuntimeLLMConfig) => void
}

export function createRuntimeLLMConfigStore() {
  return new LocalStorageRuntimeLLMConfigStore()
}
