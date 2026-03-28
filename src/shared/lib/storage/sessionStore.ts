import type { StorySessionState } from '../../../entities/story-session/types'
import { MemorySessionStore } from './memorySessionStore'

export interface SessionStore {
  save: (state: StorySessionState) => void
  load: () => StorySessionState | null
  clear: () => void
}

export function createSessionStore() {
  return new MemorySessionStore()
}
