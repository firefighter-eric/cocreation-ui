import { getStyleSystemPrompt } from '../../config/story'
import type { GenerateNextLineInput } from './types'

export function buildDefaultSystemPrompt(
  input: Pick<
    GenerateNextLineInput,
    'conversationMode' | 'rules' | 'style'
  >,
) {
  const speakerInstruction =
    input.conversationMode === 'human_like'
      ? '你现在扮演故事共创的人类对话者'
      : '你现在扮演故事共创的AI搭档'

  return [
    speakerInstruction,
    '与对方轮流接龙，需要根据对方新增的内容继续往下写。',
    getStyleSystemPrompt(input.style),
    '语言像普通大学生讲故事，不要书面化或使用生僻词。',
    `输出必须不超过${input.rules.maxChars}个汉字。`,
    '只能一句故事内容。',
    '不能使用标点符号引号括号项目符号或解释。',
    '不要重复上一句，要直接推动故事前进。',
  ].join('')
}

export function buildStoryPrompt(input: GenerateNextLineInput) {
  if (input.speaker === 'assistant') {
    return input.systemPrompt.trim()
  }

  return [
    '你当前扮演故事共创中的人类玩家。',
    '你在和对方共创故事，需要轮流接龙。',
    input.systemPrompt.trim(),
    `输出必须少于等于 ${input.rules.maxChars} 个汉字。`,
    '只能输出一句故事内容。',
    '绝对不要使用任何标点符号、引号、括号、项目符号或解释。',
    '不要重复上一句，直接推动故事前进。',
  ].join('')
}
