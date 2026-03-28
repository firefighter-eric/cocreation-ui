import { describe, expect, it } from 'vitest'
import { defaultStoryRules, storySeeds } from '../../config/story'
import { buildStoryPrompt } from './prompt'

describe('buildStoryPrompt', () => {
  it('contains creative guidance', () => {
    const prompt = buildStoryPrompt({
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[0],
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
      style: 'coherent',
    })

    expect(prompt).toContain('自然连贯')
  })
})
