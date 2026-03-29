const env = import.meta.env

export const appEnv = {
  apiKey: env.VITE_LLM_API_KEY?.trim() ?? '',
  baseUrl: (env.VITE_LLM_BASE_URL?.trim() ?? '').replace(/\/$/, ''),
  model: env.VITE_LLM_MODEL?.trim() ?? 'none',
}
