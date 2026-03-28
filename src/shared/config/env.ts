const env = import.meta.env

export const appEnv = {
  apiKey: env.VITE_LLM_API_KEY?.trim() ?? '',
  baseUrl: (env.VITE_LLM_BASE_URL?.trim() ?? '').replace(/\/$/, ''),
  model: env.VITE_LLM_MODEL?.trim() ?? 'gpt-4.1-mini',
}

export function hasRemoteProviderConfig() {
  return appEnv.apiKey.length > 0 && appEnv.baseUrl.length > 0
}
