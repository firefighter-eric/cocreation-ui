import { startTransition, useEffect, useState } from 'react'
import { createMessage, createStorySession } from '../../../entities/story-session/state-machine'
import { advanceStorySession } from '../../../entities/story-session/state-machine'
import type {
  StartingRoundMode,
  StorySeed,
  StorySessionState,
  StoryStyle,
} from '../../../entities/story-session/types'
import {
  defaultMaxRoundCount,
  defaultStartingRoundMode,
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
  initialModelSettings: StorySessionState['modelSettings']
  initialSeed: StorySeed
  provider: LLMProvider
  store: SessionStore
}

export function useStorySession({
  conversationMode,
  initialModelSettings,
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
      maxRoundCount: defaultMaxRoundCount,
      startingRoundMode: defaultStartingRoundMode,
      modelSettings: initialModelSettings,
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
  const completedRoundCount = Math.floor(state.messages.length / 2)
  const isRoundLimitReached = completedRoundCount >= state.maxRoundCount
  const resolvedStartingSpeaker = state.startingRoundSpeaker ?? 'user'

  useEffect(() => {
    store.save(state)
  }, [state, store])

  async function requestGeneratedLine(
    history: typeof state.messages,
    activeSessionId: string,
  ) {
    const aiStartedAt = new Date().toISOString()
    setState((current) => advanceStorySession(current, { type: 'AI_REQUEST_START' }))

    try {
      const content = await provider.generateNextLine({
        conversationMode,
        history,
        model: state.modelSettings.model,
        rules: state.rules,
        seed: state.seed,
        speaker: 'assistant',
        style: state.style,
        systemPrompt: state.systemPrompt,
        temperature: state.modelSettings.temperature,
        topP: state.modelSettings.topP,
      })

      if (conversationMode === 'human_like') {
        await waitForDelay(computeHumanLikeDelay(content))
      }

      const message = createMessage('assistant', content, {
        aiEndedAt: new Date().toISOString(),
        aiStartedAt,
      })

      startTransition(() => {
        setState((current) =>
          current.sessionId !== activeSessionId
            ? current
            : advanceStorySession(current, {
                type: 'AI_SUCCESS',
                message,
              }),
        )
      })

      return message
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
      return null
    }
  }

  function resolveStartingSpeaker(mode: StartingRoundMode) {
    if (mode !== 'random') {
      return mode
    }

    return Math.random() < 0.5 ? 'user' : 'assistant'
  }

  function getNextSpeaker(
    startingSpeaker: 'user' | 'assistant',
    messageCount: number,
  ) {
    if (messageCount % 2 === 0) {
      return startingSpeaker
    }

    return startingSpeaker === 'user' ? 'assistant' : 'user'
  }

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

    if (isRoundLimitReached) {
      setDraftError(`已达到最大 ${state.maxRoundCount} 回合，请重新开始或在设置中调整。`)
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
    const nextHistory = [...state.messages, userMessage]
    const nextCompletedRoundCount = Math.floor(nextHistory.length / 2)
    const nextSpeaker = getNextSpeaker(resolvedStartingSpeaker, nextHistory.length)

    if (nextSpeaker === 'assistant' && nextCompletedRoundCount < state.maxRoundCount) {
      const assistantMessage = await requestGeneratedLine(nextHistory, activeSessionId)

      if (assistantMessage === null) {
        return
      }
    } else {
      setState((current) =>
        current.sessionId !== activeSessionId
          ? current
          : advanceStorySession(current, { type: 'SET_READY' }),
      )
    }
  }

  async function generateAutoConversation(roundCount: number) {
    const activeSessionId = state.sessionId
    let history = [...state.messages]
    const totalMessages = roundCount * 2
    const sessionStartedAt = new Date().toISOString()
    const startingRoundSpeaker = resolveStartingSpeaker(state.startingRoundMode)

    setDraft('')
    setDraftError(null)
    setState((current) =>
      advanceStorySession(current, {
        type: 'START_SESSION',
        startedAt: sessionStartedAt,
        startingRoundSpeaker,
      }),
    )

    try {
      for (let index = 0; index < totalMessages; index += 1) {
        const speaker =
          index % 2 === 0
            ? startingRoundSpeaker
            : startingRoundSpeaker === 'user'
              ? 'assistant'
              : 'user'
        const content = await provider.generateNextLine({
          conversationMode,
          history,
          model: state.modelSettings.model,
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
    nextMaxRoundCount = state.maxRoundCount,
    nextStartingRoundMode = state.startingRoundMode,
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
          maxRoundCount: nextMaxRoundCount,
          startingRoundMode: nextStartingRoundMode,
          startingRoundSpeaker: null,
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
    maxRoundCount: number,
    startingRoundMode: StartingRoundMode,
    modelSettings: StorySessionState['modelSettings'],
  ) {
    restartSession(
      state.seed,
      style,
      systemPrompt.trim(),
      maxRoundCount,
      startingRoundMode,
      modelSettings,
    )
  }

  function incrementBackspaceCount() {
    setManualBackspaceCount((current) => current + 1)
  }

  function startSession() {
    setDraftError(null)
    const startingRoundSpeaker = resolveStartingSpeaker(state.startingRoundMode)
    setState((current) =>
      advanceStorySession(current, {
        type: 'START_SESSION',
        startedAt: new Date().toISOString(),
        startingRoundSpeaker,
      }),
    )

    if (startingRoundSpeaker === 'assistant') {
      void requestGeneratedLine(state.messages, state.sessionId)
    }
  }

  return {
    state,
    draft,
    draftError,
    isRoundLimitReached,
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
