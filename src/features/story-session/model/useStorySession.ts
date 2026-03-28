import { startTransition, useEffect, useState } from 'react'
import { createMessage, createStorySession } from '../../../entities/story-session/state-machine'
import { advanceStorySession } from '../../../entities/story-session/state-machine'
import type {
  StorySeed,
  StorySessionState,
  StoryStyle,
} from '../../../entities/story-session/types'
import {
  defaultStoryRules,
  defaultStoryStyle,
} from '../../../shared/config/story'
import type { StoryMode } from '../../../shared/config/story'
import { buildDefaultSystemPrompt } from '../../../shared/lib/llm/prompt'
import type { LLMProvider } from '../../../shared/lib/llm/types'
import type { SessionStore } from '../../../shared/lib/storage/sessionStore'
import {
  computeHumanLikeDelay,
  waitForDelay,
} from '../../../shared/lib/timing/humanLikeDelay'
import { validateStoryLine } from '../../../shared/lib/validation/storyLine'

interface UseStorySessionInput {
  conversationMode: StoryMode
  initialSeed: StorySeed
  provider: LLMProvider
  store: SessionStore
}

export function useStorySession({
  conversationMode,
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
      modelSettings: {
        temperature: 1.0,
        topP: 1,
      },
      seed: initialSeed,
      systemPrompt: buildDefaultSystemPrompt({
        conversationMode,
        rules: defaultStoryRules,
        style: defaultStoryStyle,
      }),
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
    if (state.sessionStartedAt === null) {
      return
    }

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
    if (state.sessionStartedAt === null) {
      setDraftError('请先点击开始，再输入你的故事。')
      return
    }

    const trimmedDraft = draft.trim()
    const validation = validateStoryLine(trimmedDraft, state.rules)
    const activeSessionId = state.sessionId
    const inputEndedAt = new Date().toISOString()

    if (!validation.valid) {
      setDraftError(validation.error)
      return
    }

    const inputStartedAt = manualInputStartedAt ?? inputEndedAt
    const previousAssistantMessage = [...state.messages]
      .reverse()
      .find((message) => message.role === 'assistant')
    const reactionReferenceAt =
      previousAssistantMessage?.interaction?.aiEndedAt ?? state.sessionStartedAt
    const reactionTimeMs = Math.max(
      0,
      new Date(inputStartedAt).getTime() - new Date(reactionReferenceAt).getTime(),
    )

    const userMessage = createMessage('user', trimmedDraft, {
      backspaceCount: manualBackspaceCount,
      inputEndedAt,
      inputStartedAt,
      reactionReferenceAt,
      reactionTimeMs,
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
        conversationMode,
        history: [...state.messages, userMessage],
        rules: state.rules,
        seed: state.seed,
        speaker: 'assistant',
        style: state.style,
        systemPrompt: state.systemPrompt,
        temperature: state.modelSettings.temperature,
        topP: state.modelSettings.topP,
      })

      if (conversationMode === 'human_like') {
        await waitForDelay(computeHumanLikeDelay(assistantContent))
      }

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
    const sessionStartedAt = new Date().toISOString()

    setDraft('')
    setDraftError(null)
    setState((current) =>
      advanceStorySession(current, {
        type: 'START_SESSION',
        startedAt: sessionStartedAt,
      }),
    )
    setState((current) => advanceStorySession(current, { type: 'AI_REQUEST_START' }))

    try {
      for (let index = 0; index < totalMessages; index += 1) {
        const speaker = index % 2 === 0 ? 'user' : 'assistant'
        const content = await provider.generateNextLine({
          conversationMode,
          history,
          rules: state.rules,
          seed: state.seed,
          speaker,
          style: state.style,
          systemPrompt: state.systemPrompt,
          temperature: state.modelSettings.temperature,
          topP: state.modelSettings.topP,
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

  function restartSession(
    nextSeed = state.seed,
    nextStyle = state.style,
    nextSystemPrompt = state.systemPrompt,
    nextModelSettings = state.modelSettings,
  ) {
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
          systemPrompt: nextSystemPrompt,
          modelSettings: nextModelSettings,
        }),
      )
    })
  }

  function updateStyle(style: StoryStyle) {
    restartSession(
      state.seed,
      style,
      buildDefaultSystemPrompt({
        conversationMode,
        rules: state.rules,
        style,
      }),
    )
  }

  function updateSeed(seed: StorySeed) {
    restartSession(
      seed,
      state.style,
      buildDefaultSystemPrompt({
        conversationMode,
        rules: state.rules,
        style: state.style,
      }),
    )
  }

  function clearError() {
    setState((current) => advanceStorySession(current, { type: 'CLEAR_ERROR' }))
  }

  function updatePromptSettings(
    style: StoryStyle,
    systemPrompt: string,
    modelSettings: StorySessionState['modelSettings'],
  ) {
    restartSession(state.seed, style, systemPrompt.trim(), modelSettings)
  }

  function incrementBackspaceCount() {
    setManualBackspaceCount((current) => current + 1)
  }

  function startSession() {
    setDraftError(null)
    setState((current) =>
      advanceStorySession(current, {
        type: 'START_SESSION',
        startedAt: new Date().toISOString(),
      }),
    )
  }

  return {
    state,
    draft,
    draftError,
    providerLabel: provider.label,
    setDraft: setValidatedDraft,
    submitDraft,
    generateAutoConversation,
    restartSession,
    updateStyle,
    updateSeed,
    clearError,
    incrementBackspaceCount,
    startSession,
    updatePromptSettings,
  }
}
