import { startTransition, useEffect, useState } from 'react'
import { createMessage, createStorySession } from '../../../entities/story-session/state-machine'
import { advanceStorySession } from '../../../entities/story-session/state-machine'
import type {
  StorySeed,
  StorySessionState,
  StoryStyle,
} from '../../../entities/story-session/types'
import { defaultStoryRules, defaultStoryStyle } from '../../../shared/config/story'
import type { LLMProvider } from '../../../shared/lib/llm/types'
import type { SessionStore } from '../../../shared/lib/storage/sessionStore'
import { validateStoryLine } from '../../../shared/lib/validation/storyLine'

interface UseStorySessionInput {
  initialSeed: StorySeed
  provider: LLMProvider
  store: SessionStore
}

export function useStorySession({
  initialSeed,
  provider,
  store,
}: UseStorySessionInput) {
  const [state, setState] = useState<StorySessionState>(() => {
    const stored = store.load()

    if (stored) {
      return stored
    }

    const session = createStorySession({
      seed: initialSeed,
      style: defaultStoryStyle,
      rules: defaultStoryRules,
    })

    return advanceStorySession(session, { type: 'BOOT' })
  })
  const [draft, setDraft] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)
  const [manualInputStartedAt, setManualInputStartedAt] = useState<string | null>(null)
  const [manualBackspaceCount, setManualBackspaceCount] = useState(0)

  useEffect(() => {
    store.save(state)
  }, [state, store])

  function setValidatedDraft(value: string) {
    if (value.length > 0 && manualInputStartedAt === null) {
      setManualInputStartedAt(new Date().toISOString())
    }

    if (value.length === 0 && draft.length > 0) {
      setManualInputStartedAt(null)
      setManualBackspaceCount(0)
    }

    setDraft(value)

    const validation = validateStoryLine(value, state.rules)
    setDraftError(validation.valid || value.length === 0 ? null : validation.error)
  }

  async function submitDraft() {
    const trimmedDraft = draft.trim()
    const validation = validateStoryLine(trimmedDraft, state.rules)
    const activeSessionId = state.sessionId
    const inputEndedAt = new Date().toISOString()

    if (!validation.valid) {
      setDraftError(validation.error)
      return
    }

    const userMessage = createMessage('user', trimmedDraft, {
      backspaceCount: manualBackspaceCount,
      inputEndedAt,
      inputStartedAt: manualInputStartedAt ?? inputEndedAt,
    })
    const aiStartedAt = new Date().toISOString()

    setDraft('')
    setDraftError(null)
    setManualInputStartedAt(null)
    setManualBackspaceCount(0)
    setState((current) =>
      advanceStorySession(current, {
        type: 'USER_SUBMIT',
        message: userMessage,
      }),
    )

    setState((current) => advanceStorySession(current, { type: 'AI_REQUEST_START' }))

    try {
      const assistantContent = await provider.generateNextLine({
        history: [...state.messages, userMessage],
        rules: state.rules,
        seed: state.seed,
        speaker: 'assistant',
        style: state.style,
      })

      const assistantMessage = createMessage('assistant', assistantContent, {
        aiEndedAt: new Date().toISOString(),
        aiStartedAt,
      })

      startTransition(() => {
        setState((current) =>
          current.sessionId !== activeSessionId
            ? current
            : advanceStorySession(current, {
                type: 'AI_SUCCESS',
                message: assistantMessage,
              }),
        )
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '模型返回异常，请稍后再试。'

      setState((current) =>
        current.sessionId !== activeSessionId
          ? current
          : advanceStorySession(current, {
              type: 'AI_FAILURE',
              error: message,
            }),
      )
    }
  }

  async function generateAutoConversation(roundCount: number) {
    const activeSessionId = state.sessionId
    let history = [...state.messages]
    const totalMessages = roundCount * 2

    setDraft('')
    setDraftError(null)
    setState((current) => advanceStorySession(current, { type: 'AI_REQUEST_START' }))

    try {
      for (let index = 0; index < totalMessages; index += 1) {
        const speaker = index % 2 === 0 ? 'user' : 'assistant'
        const content = await provider.generateNextLine({
          history,
          rules: state.rules,
          seed: state.seed,
          speaker,
          style: state.style,
        })
        const message = createMessage(speaker, content)
        history = [...history, message]

        setState((current) =>
          current.sessionId !== activeSessionId
            ? current
            : advanceStorySession(current, {
                type: 'APPEND_MESSAGE',
                message,
                status: index === totalMessages - 1 ? 'ready' : 'waiting_for_ai',
              }),
        )
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '自动对话生成失败，请稍后再试。'

      setState((current) =>
        current.sessionId !== activeSessionId
          ? current
          : advanceStorySession(current, {
              type: 'AI_FAILURE',
              error: message,
            }),
      )
    }
  }

  function restartSession(nextSeed = state.seed, nextStyle = state.style) {
    startTransition(() => {
      setDraft('')
      setDraftError(null)
      setManualInputStartedAt(null)
      setManualBackspaceCount(0)
      setState((current) =>
        advanceStorySession(current, {
          type: 'RESET',
          seed: nextSeed,
          style: nextStyle,
        }),
      )
    })
  }

  function updateStyle(style: StoryStyle) {
    restartSession(state.seed, style)
  }

  function updateSeed(seed: StorySeed) {
    restartSession(seed, state.style)
  }

  function clearError() {
    setState((current) => advanceStorySession(current, { type: 'CLEAR_ERROR' }))
  }

  function incrementBackspaceCount() {
    setManualBackspaceCount((current) => current + 1)
  }

  return {
    state,
    draft,
    draftError,
    providerLabel: provider.label,
    setDraft: setValidatedDraft,
    submitDraft,
    generateAutoConversation,
    restartSession: () => restartSession(),
    updateStyle,
    updateSeed,
    clearError,
    incrementBackspaceCount,
  }
}
