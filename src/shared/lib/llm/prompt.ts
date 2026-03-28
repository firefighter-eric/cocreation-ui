import type { GenerateNextLineInput } from './types'

export function buildStoryPrompt(input: GenerateNextLineInput) {
  const customSystemPrompt = input.systemPrompt.trim()
  const speakerInstruction =
    input.speaker === 'assistant'
      ? input.conversationMode === 'human_like'
        ? '你当前扮演故事共创中的人类对话者。'
        : '你当前扮演故事共创中的AI搭档。'
      : '你当前扮演故事共创中的人类玩家。'
  return [
    speakerInstruction,
    '你在和对方共创故事，需要轮流接龙。',
    `故事开场：${input.seed.openingLine}`,
    customSystemPrompt || null,
    `输出必须少于等于 ${input.rules.maxChars} 个汉字。`,
    '只能输出一句故事内容。',
    '绝对不要使用任何标点符号、引号、括号、项目符号或解释。',
    '不要重复上一句，直接推动故事前进。',
  ]
    .filter(Boolean)
    .join('')
}
