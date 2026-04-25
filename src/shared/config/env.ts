const env = import.meta.env
export const defaultLLMModel = 'deepseek-v4-flash'

export const appEnv = {
  apiKey: env.VITE_LLM_API_KEY?.trim() ?? '',
  baseUrl: (env.VITE_LLM_BASE_URL?.trim() ?? '').replace(/\/$/, ''),
  model: env.VITE_LLM_MODEL?.trim() ?? defaultLLMModel,
}
