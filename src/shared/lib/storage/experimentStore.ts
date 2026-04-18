import type { ExperimentState } from '../../../entities/experiment/types'
import { MemoryExperimentStore } from './memoryExperimentStore'

export interface ExperimentStore {
  save: (state: ExperimentState) => void
  load: () => ExperimentState | null
  clear: () => void
}

export function createExperimentStore() {
  return new MemoryExperimentStore()
}
