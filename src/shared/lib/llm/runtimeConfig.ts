import { appEnv } from '../../config/env'

export interface RuntimeLLMConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface ResolvedLLMConfig extends RuntimeLLMConfig {
  source: 'custom' | 'env'
}

type DefaultLLMConfig = RuntimeLLMConfig

export function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/$/, '')
}

export function normalizeRuntimeLLMConfig(
  config: RuntimeLLMConfig,
): RuntimeLLMConfig {
  return {
    apiKey: config.apiKey.trim(),
    baseUrl: normalizeBaseUrl(config.baseUrl),
    model: config.model.trim(),
  }
}

export function hasCompleteRuntimeLLMConfig(
  config: RuntimeLLMConfig | null | undefined,
) {
  if (!config) {
    return false
  }

  const normalized = normalizeRuntimeLLMConfig(config)
  return (
    normalized.apiKey.length > 0 &&
    normalized.baseUrl.length > 0 &&
    normalized.model.length > 0 &&
    normalized.model !== 'none'
  )
}

export function resolveLLMConfig(
  runtimeConfig: RuntimeLLMConfig | null,
  defaultConfig: DefaultLLMConfig = {
    apiKey: appEnv.apiKey,
    baseUrl: appEnv.baseUrl,
    model: appEnv.model,
  },
): ResolvedLLMConfig | null {
  if (hasCompleteRuntimeLLMConfig(runtimeConfig)) {
    const normalized = normalizeRuntimeLLMConfig(runtimeConfig!)

    return {
      ...normalized,
      source: 'custom',
    }
  }

  const envConfig = normalizeRuntimeLLMConfig({
    apiKey: defaultConfig.apiKey,
    baseUrl: defaultConfig.baseUrl,
    model: defaultConfig.model,
  })

  if (!hasCompleteRuntimeLLMConfig(envConfig)) {
    return null
  }

  return {
    ...envConfig,
    source: 'env',
  }
}
