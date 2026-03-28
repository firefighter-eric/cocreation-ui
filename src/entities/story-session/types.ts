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

export type StorySessionStatus =
  | 'idle'
  | 'ready'
  | 'submitting_user_line'
  | 'waiting_for_ai'
  | 'ai_replied'
  | 'failed'

export interface StorySessionState {
  sessionId: string
  seed: StorySeed
  style: StoryStyle
  rules: StoryRules
  status: StorySessionStatus
  messages: Message[]
  error: string | null
}

export type StorySessionEvent =
  | { type: 'BOOT' }
  | { type: 'USER_SUBMIT'; message: Message }
  | { type: 'AI_REQUEST_START' }
  | { type: 'AI_SUCCESS'; message: Message }
  | { type: 'AI_FAILURE'; error: string }
  | { type: 'CLEAR_ERROR' }
  | {
      type: 'RESET'
      seed?: StorySeed
      style?: StoryStyle
      rules?: StoryRules
    }
