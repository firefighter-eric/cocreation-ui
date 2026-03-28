import { describe, expect, it } from 'vitest'
import {
  buildStoryJson,
  createExportFileStem,
} from './storyCsv'

const exportInput = {
  error: null,
  messages: [
    {
      id: 'm-1',
      role: 'user' as const,
      content: '他踩进会发光的积雪',
      createdAt: '2026-03-28T10:00:00.000Z',
      interaction: {
        backspaceCount: 2,
        inputEndedAt: '2026-03-28T09:59:59.000Z',
        inputStartedAt: '2026-03-28T09:59:30.000Z',
        reactionReferenceAt: '2026-03-28T09:59:00.000Z',
        reactionTimeMs: 30000,
      },
    },
    {
      id: 'm-2',
      role: 'assistant' as const,
      content: '雪下传来海浪的回声',
      createdAt: '2026-03-28T10:00:02.000Z',
      interaction: {
        aiEndedAt: '2026-03-28T10:00:02.000Z',
        aiStartedAt: '2026-03-28T10:00:01.000Z',
      },
    },
  ],
  mode: 'manual' as const,
  rules: {
    maxChars: 20,
    punctuationAllowed: false,
  },
  seed: {
    id: 'snow',
    title: '雪地入口',
    openingLine: '第一片雪落在门把手上',
    summary: 'summary',
  },
  sessionId: 'session-1',
  sessionStartedAt: '2026-03-28T09:59:00.000Z',
  status: 'ready' as const,
  style: 'creative' as const,
  systemPrompt: '保持雪地般的安静',
  modelSettings: {
    temperature: 0.9,
    topP: 0.8,
  },
}

describe('storyCsv', () => {
  it('serializes detailed metadata into json', () => {
    const json = buildStoryJson(exportInput, new Date('2026-03-28T08:25:30.000Z'))
    const parsed = JSON.parse(json)

    expect(parsed.session_id).toBe('session-1')
    expect(parsed.session_started_at).toBe('2026-03-28T09:59:00.000Z')
    expect(parsed.system_prompt).toBe('保持雪地般的安静')
    expect(parsed.model_settings).toEqual({
      temperature: 0.9,
      top_p: 0.8,
    })
    expect(parsed.mode).toBe('manual')
    expect(parsed.seed.openingLine).toBe('第一片雪落在门把手上')
    expect(parsed.conversation[0]).toEqual({
      role: 'opening',
      content: '第一片雪落在门把手上',
    })
    expect(parsed.conversation[1]).toMatchObject({
      id: 'm-1',
      role: 'user',
      content: '他踩进会发光的积雪',
      interaction: {
        backspace_count: 2,
        input_ended_at: '2026-03-28T09:59:59.000Z',
        input_started_at: '2026-03-28T09:59:30.000Z',
        reaction_reference_at: '2026-03-28T09:59:00.000Z',
        reaction_time_ms: 30000,
      },
    })
    expect(parsed.conversation[2]).toMatchObject({
      interaction: {
        ai_ended_at: '2026-03-28T10:00:02.000Z',
        ai_started_at: '2026-03-28T10:00:01.000Z',
      },
    })
  })

  it('creates a local timestamped export file stem', () => {
    const fileStem = createExportFileStem(new Date(2026, 2, 28, 16, 25, 30))

    expect(fileStem).toBe('cocreation-260328-162530')
  })

  it('serializes human-like mode at top level', () => {
    const json = buildStoryJson(
      {
        ...exportInput,
        mode: 'human_like',
      },
      new Date('2026-03-28T08:25:30.000Z'),
    )
    const parsed = JSON.parse(json)

    expect(parsed.mode).toBe('human_like')
  })
})
