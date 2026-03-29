import { normalizeBaseUrl } from './runtimeConfig'

interface ModelListResponse {
  data?: Array<{
    id?: string
  }>
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0
}

const REQUEST_TIMEOUT_MS = 10000
const MAX_MODEL_OPTIONS = 12

export async function fetchAvailableModels(input: {
  apiKey: string
  baseUrl: string
}) {
  const baseUrl = normalizeBaseUrl(input.baseUrl)
  const apiKey = input.apiKey.trim()

  if (baseUrl.length === 0 || apiKey.length === 0) {
    throw new Error('请先填写完整的 Base URL 和 API Key。')
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `模型列表请求失败，状态码 ${response.status}`)
    }

    const data = (await response.json()) as ModelListResponse
    const models = [
      ...new Set((data.data ?? []).map((item) => item.id?.trim()).filter(isNonEmptyString)),
    ]

    if (models.length === 0) {
      throw new Error('当前接口没有返回可用模型。')
    }

    return models.slice(0, MAX_MODEL_OPTIONS)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('获取模型列表超时，请重试。')
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
