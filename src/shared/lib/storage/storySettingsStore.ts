import type {
  HumanLikeSettings,
  ModelSettings,
  StartingRoundMode,
  StoryStyle,
} from '../../../entities/story-session/types'
import type { ModeLabelDisplay } from '../../config/story'
import { LocalStorageStorySettingsStore } from './localStorageStorySettingsStore'

export interface StorySettingsSnapshot {
  humanLikeSettings?: HumanLikeSettings
  maxRoundCount?: number
  modeLabelDisplay?: ModeLabelDisplay
  modelSettings?: ModelSettings
  startingRoundMode?: StartingRoundMode
  style?: StoryStyle
  systemPrompt?: string
}

export interface StorySettingsStore {
  clear: () => void
  load: () => StorySettingsSnapshot | null
  save: (settings: Required<StorySettingsSnapshot>) => void
}

export function createStorySettingsStore() {
  return new LocalStorageStorySettingsStore()
}
