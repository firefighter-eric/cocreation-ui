import { describe, expect, it } from 'vitest'
import {
  defaultHumanLikeDelayMultiplier,
  defaultMaxRoundCount,
  defaultStartingRoundMode,
  defaultStoryRules,
  storySeeds,
} from '../../shared/config/story'
import { advanceStorySession, createMessage, createStorySession } from './state-machine'

describe('story session state machine', () => {
  it('boots into ready state', () => {
    const session = createStorySession({
      modelSettings: {
        model: 'gpt-test',
        temperature: 1.0,
        topP: 1,
        maxTokens: 8000,
      },
      humanLikeSettings: {
        delayMultiplier: defaultHumanLikeDelayMultiplier,
      },
      maxRoundCount: defaultMaxRoundCount,
      startingRoundMode: defaultStartingRoundMode,
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
          model: 'gpt-test',
          temperature: 1.0,
          topP: 1,
          maxTokens: 8000,
        },
        humanLikeSettings: {
          delayMultiplier: defaultHumanLikeDelayMultiplier,
        },
        maxRoundCount: defaultMaxRoundCount,
        startingRoundMode: defaultStartingRoundMode,
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

  it('can delay opening line visibility after session start', () => {
    const session = advanceStorySession(
      createStorySession({
        modelSettings: {
          model: 'gpt-test',
          temperature: 1.0,
          topP: 1,
          maxTokens: 8000,
        },
        humanLikeSettings: {
          delayMultiplier: defaultHumanLikeDelayMultiplier,
        },
        maxRoundCount: defaultMaxRoundCount,
        startingRoundMode: defaultStartingRoundMode,
        seed: storySeeds[0],
        systemPrompt: '',
        style: 'creative',
        rules: defaultStoryRules,
      }),
      { type: 'BOOT' },
    )

    const started = advanceStorySession(session, {
      type: 'START_SESSION',
      startedAt: '2026-03-28T10:00:00.000Z',
      startingRoundSpeaker: 'user',
      openingLineShownAt: null,
    })
    const waiting = advanceStorySession(started, {
      type: 'PARTNER_READY_WAIT_START',
    })
    const visible = advanceStorySession(waiting, {
      type: 'SHOW_OPENING_LINE',
      shownAt: '2026-03-28T10:00:02.000Z',
      status: 'ready',
    })

    expect(started.sessionStartedAt).toBe('2026-03-28T10:00:00.000Z')
    expect(started.openingLineShownAt).toBeNull()
    expect(waiting.status).toBe('waiting_for_partner_ready')
    expect(visible.openingLineShownAt).toBe('2026-03-28T10:00:02.000Z')
    expect(visible.status).toBe('ready')
  })

  it('resets with a new seed', () => {
    const session = advanceStorySession(
      createStorySession({
        modelSettings: {
          model: 'gpt-test',
          temperature: 1.0,
          topP: 1,
          maxTokens: 8000,
        },
        humanLikeSettings: {
          delayMultiplier: defaultHumanLikeDelayMultiplier,
        },
        maxRoundCount: defaultMaxRoundCount,
        startingRoundMode: defaultStartingRoundMode,
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
      model: 'gpt-test',
      temperature: 1.0,
      topP: 1,
      maxTokens: 8000,
    })
    expect(reset.humanLikeSettings).toEqual({
      delayMultiplier: defaultHumanLikeDelayMultiplier,
    })
    expect(reset.messages).toHaveLength(0)
  })
})
