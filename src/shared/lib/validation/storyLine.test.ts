import { describe, expect, it } from 'vitest'
import { defaultStoryRules } from '../../config/story'
import { sanitizeAssistantLine, validateStoryLine } from './storyLine'

describe('story line validation', () => {
  it('rejects punctuation', () => {
    const result = validateStoryLine('你好，世界', defaultStoryRules)

    expect(result.valid).toBe(false)
  })

  it('rejects content over the max length', () => {
    const result = validateStoryLine(
      '这是一个明显超过二十个汉字限制而且还会继续变长的故事句子',
      defaultStoryRules,
    )

    expect(result.valid).toBe(false)
  })

  it('sanitizes model output before validating', () => {
    const result = sanitizeAssistantLine('窗外的雨开始倒着落下。', defaultStoryRules)

    expect(result).toBe('窗外的雨开始倒着落下')
  })
})
