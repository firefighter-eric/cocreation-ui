import type { MessageRole } from '../message/types'
import type { StorySeed, StorySessionState } from '../story-session/types'

export type ExperimentMode = 'manual' | 'human_like'
export type ExperimentStatus = 'idle' | 'running' | 'completed'

export interface ExperimentItem {
  id: string
  promptIndex: number
  seed: StorySeed
  startingRoundSpeaker: MessageRole
}

export interface ExperimentSessionRecord {
  promptIndex: number
  session: StorySessionState
}

export interface ExperimentState {
  experimentId: string
  experimentStartedAt: string | null
  experimentCompletedAt: string | null
  mode: ExperimentMode | null
  items: ExperimentItem[]
  currentItemIndex: number
  sessions: ExperimentSessionRecord[]
  status: ExperimentStatus
}
