import type {
  HumanLikeSettings,
  ModelSettings,
  StartingRoundMode,
  StoryStyle,
} from '../../../entities/story-session/types'
import {
  defaultHumanLikeDelayMultiplier,
  defaultMaxRoundCount,
  defaultModeLabelDisplay,
  defaultModelMaxTokens,
  defaultModelOutputMaxChars,
  defaultModelTemperature,
  defaultModelTopP,
  defaultStartingRoundMode,
  defaultStoryStyle,
  humanLikeDelayMultiplierRange,
  modelOutputMaxCharsRange,
  roundCountRange,
  type ModeLabelDisplay,
} from '../../config/story'
import type {
  StorySettingsSnapshot,
  StorySettingsStore,
} from './storySettingsStore'

const STORAGE_KEY = 'cocreation.story_settings'

export class LocalStorageStorySettingsStore implements StorySettingsStore {
  clear() {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  load() {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>

      return normalizeStorySettingsSnapshot(parsed)
    } catch {
      return null
    }
  }

  save(settings: Required<StorySettingsSnapshot>) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalizeStorySettingsSnapshot(settings as Record<string, unknown>),
      ),
    )
  }
}

function normalizeStorySettingsSnapshot(
  input: Record<string, unknown>,
): StorySettingsSnapshot {
  const modelSettings = normalizeModelSettings(input.modelSettings)
  const humanLikeSettings = normalizeHumanLikeSettings(input.humanLikeSettings)

  return {
    humanLikeSettings,
    maxRoundCount: normalizeInteger(
      input.maxRoundCount,
      roundCountRange.min,
      roundCountRange.max,
      defaultMaxRoundCount,
    ),
    modeLabelDisplay: normalizeModeLabelDisplay(input.modeLabelDisplay),
    modelSettings,
    startingRoundMode: normalizeStartingRoundMode(input.startingRoundMode),
    style: normalizeStoryStyle(input.style),
    systemPrompt:
      typeof input.systemPrompt === 'string' ? input.systemPrompt : undefined,
  }
}

function normalizeModelSettings(input: unknown): ModelSettings | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const settings = input as Record<string, unknown>
  const model = typeof settings.model === 'string' ? settings.model.trim() : ''

  return {
    model,
    temperature: normalizeNumber(
      settings.temperature,
      0,
      2,
      defaultModelTemperature,
    ),
    topP: normalizeNumber(settings.topP, 0, 1, defaultModelTopP),
    maxTokens: normalizeInteger(settings.maxTokens, 1, 200000, defaultModelMaxTokens),
    outputMaxChars: normalizeInteger(
      settings.outputMaxChars,
      modelOutputMaxCharsRange.min,
      modelOutputMaxCharsRange.max,
      defaultModelOutputMaxChars,
    ),
  }
}

function normalizeHumanLikeSettings(input: unknown): HumanLikeSettings | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const settings = input as Record<string, unknown>

  return {
    delayMultiplier: normalizeNumber(
      settings.delayMultiplier,
      humanLikeDelayMultiplierRange.min,
      humanLikeDelayMultiplierRange.max,
      defaultHumanLikeDelayMultiplier,
    ),
  }
}

function normalizeStoryStyle(input: unknown): StoryStyle | undefined {
  return input === 'creative' || input === 'coherent' ? input : defaultStoryStyle
}

function normalizeStartingRoundMode(input: unknown): StartingRoundMode | undefined {
  return input === 'user' || input === 'assistant' || input === 'random'
    ? input
    : defaultStartingRoundMode
}

function normalizeModeLabelDisplay(input: unknown): ModeLabelDisplay | undefined {
  return input === 'anonymized' || input === 'descriptive'
    ? input
    : defaultModeLabelDisplay
}

function normalizeNumber(
  input: unknown,
  min: number,
  max: number,
  fallback: number,
) {
  const value = typeof input === 'number' ? input : Number(input)

  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, value))
}

function normalizeInteger(
  input: unknown,
  min: number,
  max: number,
  fallback: number,
) {
  return Math.trunc(normalizeNumber(input, min, max, fallback))
}
