import { describe, expect, it } from 'vitest'
import { defaultStoryRules, storySeeds } from '../../config/story'
import { buildStoryPrompt } from './prompt'

describe('buildStoryPrompt', () => {
  it('contains creative guidance', () => {
    const prompt = buildStoryPrompt({
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[0],
      speaker: 'assistant',
      style: 'creative',
    })

    expect(prompt).toContain('意想不到')
    expect(prompt).toContain(storySeeds[0].openingLine)
  })

  it('contains coherent guidance', () => {
    const prompt = buildStoryPrompt({
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[1],
      speaker: 'assistant',
      style: 'coherent',
    })

    expect(prompt).toContain('自然连贯')
  })

  it('contains user speaker guidance', () => {
    const prompt = buildStoryPrompt({
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[0],
      speaker: 'user',
      style: 'creative',
    })

    expect(prompt).toContain('人类玩家')
  })
})
