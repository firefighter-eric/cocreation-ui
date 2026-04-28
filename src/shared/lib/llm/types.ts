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
  model: string
  rules: StoryRules
  seed: StorySeed
  speaker: MessageRole
  style: StoryStyle
  systemPrompt: string
  temperature: number
  topP: number
  maxTokens: number
  outputMaxChars: number
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
