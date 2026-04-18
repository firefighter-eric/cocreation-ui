import type { ExperimentState } from '../../../entities/experiment/types'
import type { ExperimentStore } from './experimentStore'

export class MemoryExperimentStore implements ExperimentStore {
  private snapshot: ExperimentState | null = null

  clear() {
    this.snapshot = null
  }

  load() {
    return this.snapshot
  }

  save(state: ExperimentState) {
    this.snapshot = state
  }
}
