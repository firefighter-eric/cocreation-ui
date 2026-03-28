import type { StorySessionState } from '../../../entities/story-session/types'
import type { SessionStore } from './sessionStore'

export class MemorySessionStore implements SessionStore {
  private snapshot: StorySessionState | null = null

  clear() {
    this.snapshot = null
  }

  load() {
    return this.snapshot
  }

  save(state: StorySessionState) {
    this.snapshot = state
  }
}
