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

  useEffect(() => {
    store.save(state)
  }, [state, store])

  function setValidatedDraft(value: string) {
    setDraft(value)

    const validation = validateStoryLine(value, state.rules)
    setDraftError(validation.valid || value.length === 0 ? null : validation.error)
  }

  async function submitDraft() {
    const trimmedDraft = draft.trim()
    const validation = validateStoryLine(trimmedDraft, state.rules)
    const activeSessionId = state.sessionId

    if (!validation.valid) {
      setDraftError(validation.error)
      return
    }

    const userMessage = createMessage('user', trimmedDraft)

    setDraft('')
    setDraftError(null)
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
        style: state.style,
      })

      const assistantMessage = createMessage('assistant', assistantContent)

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

  function restartSession(nextSeed = state.seed, nextStyle = state.style) {
    startTransition(() => {
      setDraft('')
      setDraftError(null)
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

  return {
    state,
    draft,
    draftError,
    providerLabel: provider.label,
    setDraft: setValidatedDraft,
    submitDraft,
    restartSession: () => restartSession(),
    updateStyle,
    updateSeed,
    clearError,
  }
}
