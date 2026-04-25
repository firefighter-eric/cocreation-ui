import { describe, expect, it } from 'vitest'
import { createStorySession } from '../../../entities/story-session/state-machine'
import {
  defaultHumanLikeDelayMultiplier,
  defaultStoryRules,
  storySeeds,
} from '../../config/story'
import { buildExperimentJson } from './experimentExport'

describe('buildExperimentJson', () => {
  it('serializes an experiment with prompt-level sessions', () => {
    const session = createStorySession({
      modelSettings: {
        model: 'story-model',
        temperature: 1,
        topP: 0.9,
        maxTokens: 8000,
      },
      humanLikeSettings: {
        delayMultiplier: defaultHumanLikeDelayMultiplier,
      },
      maxRoundCount: 5,
      startingRoundMode: 'user',
      seed: storySeeds[0],
      systemPrompt: '保持自然',
      style: 'creative',
      rules: defaultStoryRules,
    })

    const parsed = JSON.parse(
      buildExperimentJson(
        {
          experimentCompletedAt: '2026-04-18T10:10:00.000Z',
          experimentId: 'experiment-1',
          experimentMode: 'manual',
          experimentStartedAt: '2026-04-18T10:00:00.000Z',
          sessions: [{ promptIndex: 1, session }],
        },
        new Date('2026-04-18T10:10:30.000Z'),
      ),
    )

    expect(parsed.experiment_id).toBe('experiment-1')
    expect(parsed.experiment_mode).toBe('manual')
    expect(parsed.prompt_count).toBe(1)
    expect(parsed.sessions[0].prompt_index).toBe(1)
    expect(parsed.sessions[0].seed.id).toBe(storySeeds[0].id)
    expect(parsed.sessions[0].human_like_settings.delay_multiplier).toBe(
      defaultHumanLikeDelayMultiplier,
    )
    expect(parsed.sessions[0].conversation[0]).toEqual({
      content: storySeeds[0].openingLine,
      is_opening: true,
      role: 'user',
    })
  })
})
