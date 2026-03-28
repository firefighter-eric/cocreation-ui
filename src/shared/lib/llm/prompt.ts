import type { GenerateNextLineInput } from './types'

export function buildStoryPrompt(input: GenerateNextLineInput) {
  const styleInstruction =
    input.style === 'creative'
      ? '请给出一个意想不到、跳跃感强、但仍然延续当前故事的短句。'
      : '请给出一个自然连贯、符合日常叙事逻辑的短句。'

  return [
    '你在和用户共创故事，需要轮流接龙。',
    `故事开场：${input.seed.openingLine}`,
    styleInstruction,
    `输出必须少于等于 ${input.rules.maxChars} 个汉字。`,
    '只能输出一句故事内容。',
    '绝对不要使用任何标点符号、引号、括号、项目符号或解释。',
    '不要重复上一句，直接推动故事前进。',
  ].join('')
}
