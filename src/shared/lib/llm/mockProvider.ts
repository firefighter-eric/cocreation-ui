import { sanitizeAssistantLine } from '../validation/storyLine'
import type { GenerateNextLineInput, LLMProvider } from './types'

const mockCreativeReplies = [
  '书页里突然伸出一只手',
  '窗外的雨开始倒着落下',
  '台灯把影子折成了一把钥匙',
  '空气里飘来陌生人的名字',
]

const mockCoherentReplies = [
  '他抬头看向窗边的光',
  '书页停在一段旧回忆上',
  '安静里传来翻页的声音',
  '他像在等谁走进来',
]

export class MockProvider implements LLMProvider {
  label = 'Mock Provider'

  async generateNextLine(input: GenerateNextLineInput) {
    await sleep(600)

    const pool =
      input.style === 'creative' ? mockCreativeReplies : mockCoherentReplies
    const pick = pool[input.history.length % pool.length]

    return sanitizeAssistantLine(pick, input.rules)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
