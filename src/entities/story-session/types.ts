import type { Message } from '../message/types'

export type StoryStyle = 'creative' | 'coherent'

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
  seed: StorySeed
  style: StoryStyle
  rules: StoryRules
  status: StorySessionStatus
  messages: Message[]
  error: string | null
}

export type StorySessionEvent =
  | { type: 'BOOT' }
  | { type: 'START_SESSION'; startedAt: string }
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
  | { type: 'SET_MODEL_SETTINGS'; modelSettings: ModelSettings }
  | { type: 'CLEAR_ERROR' }
  | {
      type: 'RESET'
      modelSettings?: ModelSettings
      seed?: StorySeed
      style?: StoryStyle
      rules?: StoryRules
      systemPrompt?: string
    }
