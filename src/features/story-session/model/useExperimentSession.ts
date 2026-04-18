import { useEffect, useMemo, useRef, useState } from 'react'
import { createExperimentPlan } from '../../../entities/experiment/planner'
import type {
  ExperimentMode,
  ExperimentSessionRecord,
  ExperimentState,
} from '../../../entities/experiment/types'
import type { StorySeed, StorySessionState } from '../../../entities/story-session/types'
import type { ExperimentStore } from '../../../shared/lib/storage/experimentStore'

interface UseExperimentSessionInput {
  seeds: StorySeed[]
  store: ExperimentStore
}

function createIdleExperimentState(): ExperimentState {
  return {
    experimentId: globalThis.crypto?.randomUUID?.() ?? `experiment-${Date.now()}`,
    experimentStartedAt: null,
    experimentCompletedAt: null,
    mode: null,
    items: [],
    currentItemIndex: 0,
    sessions: [],
    status: 'idle',
  }
}

export function useExperimentSession({
  seeds,
  store,
}: UseExperimentSessionInput) {
  const advanceTimerRef = useRef<number | null>(null)
  const [state, setState] = useState<ExperimentState>(
    () => store.load() ?? createIdleExperimentState(),
  )

  useEffect(() => {
    store.save(state)
  }, [state, store])

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        window.clearTimeout(advanceTimerRef.current)
      }
    }
  }, [])

  const currentItem = state.items[state.currentItemIndex] ?? null
  const isRunning = state.status === 'running'
  const isCompleted = state.status === 'completed'
  const completedCount = state.sessions.length

  const sessionIds = useMemo(
    () => new Set(state.sessions.map((record) => record.session.sessionId)),
    [state.sessions],
  )

  function startExperiment(mode: ExperimentMode) {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    const startedAt = new Date()
    const experimentSeed = startedAt.getTime()

    setState((current) => ({
      experimentId: globalThis.crypto?.randomUUID?.() ?? `experiment-${Date.now()}`,
      experimentStartedAt: startedAt.toISOString(),
      experimentCompletedAt: null,
      mode,
      items: createExperimentPlan(
        seeds,
        experimentSeed,
        current.items[0]?.seed.id ?? null,
      ),
      currentItemIndex: 0,
      sessions: [],
      status: 'running',
    }))
  }

  function completeCurrentSession(session: StorySessionState) {
    if (!currentItem || sessionIds.has(session.sessionId)) {
      return
    }

    const nextRecord: ExperimentSessionRecord = {
      promptIndex: currentItem.promptIndex,
      session,
    }

    setState((current) => {
      const nextSessions = [...current.sessions, nextRecord]
      const hasNextItem = current.currentItemIndex + 1 < current.items.length
      const nextStatus: ExperimentState['status'] = hasNextItem
        ? 'advancing'
        : 'completed'

      const nextState = {
        ...current,
        sessions: nextSessions,
        currentItemIndex: current.currentItemIndex,
        experimentCompletedAt: hasNextItem ? null : new Date().toISOString(),
        status: nextStatus,
      }

      if (hasNextItem) {
        advanceTimerRef.current = window.setTimeout(() => {
          setState((latest) => ({
            ...latest,
            currentItemIndex: latest.currentItemIndex + 1,
            status: 'running',
          }))
          advanceTimerRef.current = null
        }, 3000)
      }

      return nextState
    })
  }

  function resetExperiment() {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }

    const next = createIdleExperimentState()
    setState(next)
    store.clear()
  }

  return {
    state,
    currentItem,
    completedCount,
    isCompleted,
    isRunning,
    startExperiment,
    completeCurrentSession,
    resetExperiment,
  }
}
