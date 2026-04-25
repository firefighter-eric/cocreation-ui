import { describe, expect, it } from 'vitest'
import {
  defaultStoryRules,
  getStyleSystemPrompt,
  storySeeds,
} from '../../config/story'
import { buildDefaultSystemPrompt, buildStoryPrompt } from './prompt'

describe('buildStoryPrompt', () => {
  const baseSettings = {
    model: 'gpt-test',
    temperature: 1.0,
    topP: 1,
    maxTokens: 8000,
  }

  it('contains creative guidance', () => {
    const prompt = buildStoryPrompt({
      ...baseSettings,
      conversationMode: 'manual',
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[0],
      speaker: 'assistant',
      style: 'creative',
      systemPrompt: buildDefaultSystemPrompt({
        conversationMode: 'manual',
        rules: defaultStoryRules,
        style: 'creative',
      }),
    })

    expect(prompt).toContain(getStyleSystemPrompt('creative'))
    expect(prompt).not.toContain(storySeeds[0].openingLine)
  })

  it('contains coherent guidance', () => {
    const prompt = buildStoryPrompt({
      ...baseSettings,
      conversationMode: 'manual',
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[1],
      speaker: 'assistant',
      style: 'coherent',
      systemPrompt: buildDefaultSystemPrompt({
        conversationMode: 'manual',
        rules: defaultStoryRules,
        style: 'coherent',
      }),
    })

    expect(prompt).toContain(getStyleSystemPrompt('coherent'))
  })

  it('contains user speaker guidance', () => {
    const prompt = buildStoryPrompt({
      ...baseSettings,
      conversationMode: 'auto',
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[0],
      speaker: 'user',
      style: 'creative',
      systemPrompt: getStyleSystemPrompt('creative'),
    })

    expect(prompt).toContain('人类玩家')
  })

  it('uses the new colloquial creative template', () => {
    const prompt = buildDefaultSystemPrompt({
      conversationMode: 'manual',
      rules: defaultStoryRules,
      style: 'creative',
    })

    expect(prompt).toContain('你现在扮演故事共创的AI搭档')
    expect(prompt).toContain('语言像普通大学生讲故事')
    expect(prompt).toContain('不要书面化或使用生僻词')
    expect(prompt).toContain('输出必须不超过20个汉字')
  })

  it('contains human-like partner guidance', () => {
    const prompt = buildStoryPrompt({
      ...baseSettings,
      conversationMode: 'human_like',
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[0],
      speaker: 'assistant',
      style: 'creative',
      systemPrompt: buildDefaultSystemPrompt({
        conversationMode: 'human_like',
        rules: defaultStoryRules,
        style: 'creative',
      }),
    })

    expect(prompt).toContain('人类对话者')
    expect(prompt).not.toContain('AI搭档')
  })

  it('includes custom system prompt', () => {
    const prompt = buildStoryPrompt({
      ...baseSettings,
      conversationMode: 'manual',
      history: [],
      rules: defaultStoryRules,
      seed: storySeeds[0],
      speaker: 'assistant',
      style: 'creative',
      systemPrompt: '让氛围更冷静',
    })

    expect(prompt).toContain('让氛围更冷静')
  })
})
