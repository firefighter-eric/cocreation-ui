import type { RuntimeLLMConfig } from '../llm/runtimeConfig'
import { normalizeRuntimeLLMConfig } from '../llm/runtimeConfig'
import type { RuntimeLLMConfigStore } from './runtimeLlmConfigStore'

const STORAGE_KEY = 'cocreation.runtime_llm_config'

export class LocalStorageRuntimeLLMConfigStore implements RuntimeLLMConfigStore {
  clear() {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  load() {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as Partial<RuntimeLLMConfig>

      if (
        typeof parsed.apiKey !== 'string' ||
        typeof parsed.baseUrl !== 'string' ||
        typeof parsed.model !== 'string'
      ) {
        return null
      }

      return normalizeRuntimeLLMConfig({
        apiKey: parsed.apiKey,
        baseUrl: parsed.baseUrl,
        model: parsed.model,
      })
    } catch {
      return null
    }
  }

  save(config: RuntimeLLMConfig) {
    const normalized = normalizeRuntimeLLMConfig(config)

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }
}
