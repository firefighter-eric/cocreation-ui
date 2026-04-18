import type { MessageRole } from '../message/types'
import type { Message } from '../message/types'

export type StoryStyle = 'creative' | 'coherent'
export type StartingRoundMode = MessageRole | 'random'

export interface StorySeed {
  id: string
  title: string
  openingLine: string
  summary: string
}

export interface StoryRules {
  maxChars: number
  punctuationAllowed: boolean
}

export interface ModelSettings {
  model: string
  temperature: number
  topP: number
}

export type StorySessionStatus =
  | 'idle'
  | 'ready'
  | 'submitting_user_line'
  | 'waiting_for_ai'
  | 'ai_replied'
  | 'failed'

export interface StorySessionState {
  sessionId: string
  sessionStartedAt: string | null
  systemPrompt: string
  modelSettings: ModelSettings
  maxRoundCount: number
  startingRoundMode: StartingRoundMode
  startingRoundSpeaker: MessageRole | null
  seed: StorySeed
  style: StoryStyle
  rules: StoryRules
  status: StorySessionStatus
  messages: Message[]
  error: string | null
}

export type StorySessionEvent =
  | { type: 'BOOT' }
  | {
      type: 'START_SESSION'
      startedAt: string
      startingRoundSpeaker: MessageRole
    }
  | { type: 'USER_SUBMIT'; message: Message }
  | {
      type: 'APPEND_MESSAGE'
      message: Message
      status?: StorySessionStatus
    }
  | { type: 'AI_REQUEST_START' }
  | { type: 'AI_SUCCESS'; message: Message }
  | { type: 'AI_FAILURE'; error: string }
  | { type: 'SET_SYSTEM_PROMPT'; systemPrompt: string }
  | { type: 'SET_STYLE'; style: StoryStyle }
  | { type: 'SET_MODEL_SETTINGS'; modelSettings: ModelSettings }
  | { type: 'SET_MAX_ROUND_COUNT'; maxRoundCount: number }
  | {
      type: 'SET_STARTING_ROUND'
      startingRoundMode: StartingRoundMode
      startingRoundSpeaker: MessageRole | null
    }
  | { type: 'SET_READY' }
  | { type: 'CLEAR_ERROR' }
  | {
      type: 'RESET'
      maxRoundCount?: number
      startingRoundMode?: StartingRoundMode
      startingRoundSpeaker?: MessageRole | null
      modelSettings?: ModelSettings
      seed?: StorySeed
      style?: StoryStyle
      rules?: StoryRules
      systemPrompt?: string
    }
