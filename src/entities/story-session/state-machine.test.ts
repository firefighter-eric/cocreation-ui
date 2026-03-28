import { describe, expect, it } from 'vitest'
import { defaultStoryRules, storySeeds } from '../../shared/config/story'
import { advanceStorySession, createMessage, createStorySession } from './state-machine'

describe('story session state machine', () => {
  it('boots into ready state', () => {
    const session = createStorySession({
      modelSettings: {
        temperature: 1.1,
        topP: 1,
      },
      seed: storySeeds[0],
      systemPrompt: '',
      style: 'creative',
      rules: defaultStoryRules,
    })

    const next = advanceStorySession(session, { type: 'BOOT' })

    expect(next.status).toBe('ready')
  })

  it('moves through user submit and ai success', () => {
    const session = advanceStorySession(
      createStorySession({
        modelSettings: {
          temperature: 1.1,
          topP: 1,
        },
        seed: storySeeds[0],
        systemPrompt: '',
        style: 'creative',
        rules: defaultStoryRules,
      }),
      { type: 'BOOT' },
    )

    const afterUser = advanceStorySession(session, {
      type: 'USER_SUBMIT',
      message: createMessage('user', '我把窗帘轻轻拉开'),
    })
    const afterStart = advanceStorySession(afterUser, { type: 'AI_REQUEST_START' })
    const afterAssistant = advanceStorySession(afterStart, {
      type: 'AI_SUCCESS',
      message: createMessage('assistant', '月光站在书架后面'),
    })

    expect(afterAssistant.status).toBe('ai_replied')
    expect(afterAssistant.messages).toHaveLength(2)
  })

  it('resets with a new seed', () => {
    const session = advanceStorySession(
      createStorySession({
        modelSettings: {
          temperature: 1.1,
          topP: 1,
        },
        seed: storySeeds[0],
        systemPrompt: '保持安静语气',
        style: 'creative',
        rules: defaultStoryRules,
      }),
      { type: 'BOOT' },
    )

    const reset = advanceStorySession(session, {
      type: 'RESET',
      seed: storySeeds[1],
      style: 'coherent',
    })

    expect(reset.seed.id).toBe(storySeeds[1].id)
    expect(reset.style).toBe('coherent')
    expect(reset.systemPrompt).toBe('保持安静语气')
    expect(reset.modelSettings).toEqual({
      temperature: 1.1,
      topP: 1,
    })
    expect(reset.messages).toHaveLength(0)
  })
})
