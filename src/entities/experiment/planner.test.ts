import { describe, expect, it, vi } from 'vitest'
import { storySeeds } from '../../shared/config/story'
import { createExperimentPlan } from './planner'

describe('createExperimentPlan', () => {
  it('covers all story seeds with a balanced starting speaker split', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)

    const plan = createExperimentPlan(storySeeds)

    expect(plan).toHaveLength(storySeeds.length)
    expect(new Set(plan.map((item) => item.seed.id))).toEqual(
      new Set(storySeeds.map((seed) => seed.id)),
    )
    expect(
      plan.filter((item) => item.startingRoundSpeaker === 'user'),
    ).toHaveLength(3)
    expect(
      plan.filter((item) => item.startingRoundSpeaker === 'assistant'),
    ).toHaveLength(3)
    expect(plan.map((item) => item.promptIndex)).toEqual([1, 2, 3, 4, 5, 6])
  })
})
