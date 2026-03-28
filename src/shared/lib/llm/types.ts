import type { Message } from '../../../entities/message/types'
import type { MessageRole } from '../../../entities/message/types'
import type {
  StoryRules,
  StorySeed,
  StoryStyle,
} from '../../../entities/story-session/types'
import type { StoryMode } from '../../config/story'

export interface GenerateNextLineInput {
  conversationMode: StoryMode
  history: Message[]
  rules: StoryRules
  seed: StorySeed
  speaker: MessageRole
  style: StoryStyle
  systemPrompt: string
  temperature: number
  topP: number
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
