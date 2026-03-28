import type { Message } from '../../../entities/message/types'
import type {
  StoryRules,
  StorySeed,
  StoryStyle,
} from '../../../entities/story-session/types'

export interface GenerateNextLineInput {
  history: Message[]
  rules: StoryRules
  seed: StorySeed
  style: StoryStyle
}

export interface LLMProvider {
  label: string
  generateNextLine: (input: GenerateNextLineInput) => Promise<string>
}

export interface LLMChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}
