import type { StoryRules } from '../../../entities/story-session/types'

const punctuationPattern = /[，。！？；：“”‘’（）【】《》、,.!?;:'"()[\]{}<>`~@#$%^&*_+=|\\/:-]/
const punctuationPatternGlobal =
  /[，。！？；：“”‘’（）【】《》、,.!?;:'"()[\]{}<>`~@#$%^&*_+=|\\/:-]/g

export function validateStoryLine(text: string, rules: StoryRules) {
  const trimmed = text.trim()

  if (!trimmed) {
    return { valid: false, error: '先写一句内容再发送。' }
  }

  if (Array.from(trimmed).length > rules.maxChars) {
    return { valid: false, error: `请控制在 ${rules.maxChars} 字内。` }
  }

  if (!rules.punctuationAllowed && punctuationPattern.test(trimmed)) {
    return { valid: false, error: '这条规则不允许使用标点。' }
  }

  return { valid: true, error: null }
}

export function sanitizeAssistantLine(text: string, rules: StoryRules) {
  const compact = text.replace(/\s+/g, '')
  const stripped = rules.punctuationAllowed
    ? compact
    : compact.replace(punctuationPatternGlobal, '')
  const normalized = Array.from(stripped).slice(0, rules.maxChars).join('')
  const validation = validateStoryLine(normalized, rules)

  if (!validation.valid) {
    throw new Error('模型返回的内容不符合短句规则。')
  }

  return normalized
}
