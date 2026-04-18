import { describe, expect, it } from 'vitest'
import { storySeeds } from '../../shared/config/story'
import { createExperimentPlan } from './planner'

describe('createExperimentPlan', () => {
  it('covers all story seeds with a balanced starting speaker split', () => {
    const plan = createExperimentPlan(storySeeds, 1713412800000)

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

  it('returns the same plan for the same timestamp seed', () => {
    const firstPlan = createExperimentPlan(storySeeds, 1713412800000)
    const secondPlan = createExperimentPlan(storySeeds, 1713412800000)

    expect(secondPlan).toEqual(firstPlan)
  })

  it('returns a different plan when the timestamp seed changes', () => {
    const firstPlan = createExperimentPlan(storySeeds, 1713412800000)
    const secondPlan = createExperimentPlan(storySeeds, 1713412800001)

    expect(secondPlan).not.toEqual(firstPlan)
  })

  it('avoids repeating the previous first seed when starting a new plan', () => {
    const previousPlan = createExperimentPlan(storySeeds, 1713412800000)
    const nextPlan = createExperimentPlan(
      storySeeds,
      1713412800000,
      previousPlan[0]?.seed.id,
    )

    expect(nextPlan[0]?.seed.id).not.toBe(previousPlan[0]?.seed.id)
  })
})
