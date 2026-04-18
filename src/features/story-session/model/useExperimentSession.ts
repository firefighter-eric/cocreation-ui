import { useEffect, useMemo, useState } from 'react'
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
  const [state, setState] = useState<ExperimentState>(
    () => store.load() ?? createIdleExperimentState(),
  )

  useEffect(() => {
    store.save(state)
  }, [state, store])

  const currentItem = state.items[state.currentItemIndex] ?? null
  const isRunning = state.status === 'running'
  const isCompleted = state.status === 'completed'
  const completedCount = state.sessions.length

  const sessionIds = useMemo(
    () => new Set(state.sessions.map((record) => record.session.sessionId)),
    [state.sessions],
  )

  function startExperiment(mode: ExperimentMode) {
    setState({
      experimentId: globalThis.crypto?.randomUUID?.() ?? `experiment-${Date.now()}`,
      experimentStartedAt: new Date().toISOString(),
      experimentCompletedAt: null,
      mode,
      items: createExperimentPlan(seeds),
      currentItemIndex: 0,
      sessions: [],
      status: 'running',
    })
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

      return {
        ...current,
        sessions: nextSessions,
        currentItemIndex: hasNextItem
          ? current.currentItemIndex + 1
          : current.currentItemIndex,
        experimentCompletedAt: hasNextItem
          ? null
          : new Date().toISOString(),
        status: hasNextItem ? current.status : 'completed',
      }
    })
  }

  function resetExperiment() {
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
