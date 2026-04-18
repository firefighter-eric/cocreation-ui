import { useEffect, useMemo, useRef, useState } from 'react'
import { AutoConversationPanel } from '../features/story-session/components/AutoConversationPanel'
import { StorySidebar } from '../features/story-settings/StorySidebar'
import { SettingsDrawer } from '../features/story-settings/SettingsDrawer'
import { Composer } from '../features/story-session/components/Composer'
import { MessageList } from '../features/story-session/components/MessageList'
import { StoryHeader } from '../features/story-session/components/StoryHeader'
import { useExperimentSession } from '../features/story-session/model/useExperimentSession'
import { useStorySession } from '../features/story-session/model/useStorySession'
import {
  defaultHumanLikeDelayMultiplier,
  defaultStoryMode,
  storySeeds,
  type StoryMode,
} from '../shared/config/story'
import { buildDefaultSystemPrompt } from '../shared/lib/llm/prompt'
import { createSessionStore } from '../shared/lib/storage/sessionStore'
import { createExperimentStore } from '../shared/lib/storage/experimentStore'
import { createStoryProvider } from '../shared/lib/llm/createStoryProvider'
import { exportStoryCsv } from '../shared/lib/export/storyCsv'
import { exportExperimentJson } from '../shared/lib/export/experimentExport'
import { fetchAvailableModels } from '../shared/lib/llm/modelDiscovery'
import type { RuntimeLLMConfig } from '../shared/lib/llm/runtimeConfig'
import { normalizeRuntimeLLMConfig } from '../shared/lib/llm/runtimeConfig'
import { resolveLLMConfig } from '../shared/lib/llm/runtimeConfig'
import { createRuntimeLLMConfigStore } from '../shared/lib/storage/runtimeLlmConfigStore'
import { appEnv } from '../shared/config/env'

export function App() {
  const [conversationMode, setConversationMode] = useState<StoryMode>(
    defaultStoryMode,
  )
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isExperimentPickerOpen, setIsExperimentPickerOpen] = useState(false)
  const playgroundStore = useMemo(() => createSessionStore(), [])
  const experimentSessionStore = useMemo(() => createSessionStore(), [])
  const experimentStore = useMemo(() => createExperimentStore(), [])
  const runtimeConfigStore = useMemo(() => createRuntimeLLMConfigStore(), [])
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeLLMConfig | null>(() =>
    runtimeConfigStore.load(),
  )
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [modelFetchError, setModelFetchError] = useState<string | null>(null)
  const resolvedConfig = useMemo(
    () => resolveLLMConfig(runtimeConfig),
    [runtimeConfig],
  )
  const provider = useMemo(
    () => createStoryProvider(resolvedConfig),
    [resolvedConfig],
  )
  const providerStatusLabel = resolvedConfig ? 'API 已接入' : '本地 Mock'
  const providerStatusTone = resolvedConfig ? 'connected' : 'mock'

  const playgroundSession = useStorySession({
    conversationMode,
    provider,
    store: playgroundStore,
    initialModelSettings: {
      model: runtimeConfig?.model || appEnv.model || 'none',
      temperature: 1.5,
      topP: 1,
    },
    initialHumanLikeSettings: {
      delayMultiplier: defaultHumanLikeDelayMultiplier,
    },
    initialSeed: storySeeds[0],
  })
  const experiment = useExperimentSession({
    seeds: storySeeds,
    store: experimentStore,
  })
  const experimentConversationMode = experiment.state.mode ?? 'manual'
  const currentExperimentItem = experiment.currentItem
  const experimentSession = useStorySession({
    conversationMode: experimentConversationMode,
    provider,
    store: experimentSessionStore,
    initialModelSettings: {
      model: runtimeConfig?.model || appEnv.model || 'none',
      temperature: 1.5,
      topP: 1,
    },
    initialHumanLikeSettings: {
      delayMultiplier: defaultHumanLikeDelayMultiplier,
    },
    initialSeed: storySeeds[0],
  })

  const isExperimentWorkspace =
    experiment.state.status === 'running' ||
    experiment.state.status === 'advancing' ||
    experiment.state.status === 'completed'
  const activeSession = isExperimentWorkspace ? experimentSession : playgroundSession
  const activeConversationMode = isExperimentWorkspace
    ? experimentConversationMode
    : conversationMode
  const isActiveSessionBusy =
    activeSession.state.status === 'submitting_user_line' ||
    activeSession.state.status === 'waiting_for_ai'
  const experimentSessionConfigRef = useRef({
    maxRoundCount: experimentSession.state.maxRoundCount,
    humanLikeSettings: experimentSession.state.humanLikeSettings,
    modelSettings: experimentSession.state.modelSettings,
    sessionSnapshot: experimentSession.state,
    style: experimentSession.state.style,
    systemPrompt: experimentSession.state.systemPrompt,
  })
  const experimentRestartRef = useRef(experimentSession.restartSession)
  const completeExperimentSessionRef = useRef(experiment.completeCurrentSession)

  useEffect(() => {
    experimentSessionConfigRef.current = {
      maxRoundCount: experimentSession.state.maxRoundCount,
      humanLikeSettings: experimentSession.state.humanLikeSettings,
      modelSettings: experimentSession.state.modelSettings,
      sessionSnapshot: experimentSession.state,
      style: experimentSession.state.style,
      systemPrompt: experimentSession.state.systemPrompt,
    }
  }, [
    experimentSession.state.maxRoundCount,
    experimentSession.state.humanLikeSettings,
    experimentSession.state.modelSettings,
    experimentSession.state,
    experimentSession.state.style,
    experimentSession.state.systemPrompt,
  ])

  useEffect(() => {
    experimentRestartRef.current = experimentSession.restartSession
  }, [experimentSession.restartSession])

  useEffect(() => {
    completeExperimentSessionRef.current = experiment.completeCurrentSession
  }, [experiment.completeCurrentSession])

  useEffect(() => {
    if (!experiment.isRunning || !currentExperimentItem) {
      return
    }

    const currentConfig = experimentSessionConfigRef.current

    experimentRestartRef.current(
      currentExperimentItem.seed,
      currentConfig.style,
      currentConfig.systemPrompt,
      currentConfig.maxRoundCount,
      currentExperimentItem.startingRoundSpeaker,
      currentConfig.humanLikeSettings,
      currentConfig.modelSettings,
      null,
    )
  }, [
    currentExperimentItem,
    experiment.isRunning,
  ])

  useEffect(() => {
    if (
      !experiment.isRunning ||
      !experimentSession.state.sessionStartedAt ||
      !experimentSession.isRoundLimitReached ||
      isActiveSessionBusy
    ) {
      return
    }

    completeExperimentSessionRef.current(
      experimentSessionConfigRef.current.sessionSnapshot,
    )
  }, [
    experiment.isRunning,
    experimentSession.isRoundLimitReached,
    experimentSession.state.sessionId,
    experimentSession.state.sessionStartedAt,
    isActiveSessionBusy,
  ])

  function handleExport() {
    if (
      isExperimentWorkspace &&
      experiment.state.status === 'completed' &&
      experiment.state.mode &&
      experiment.state.experimentStartedAt
    ) {
      exportExperimentJson({
        experimentCompletedAt: experiment.state.experimentCompletedAt,
        experimentId: experiment.state.experimentId,
        experimentMode: experiment.state.mode,
        experimentStartedAt: experiment.state.experimentStartedAt,
        sessions: experiment.state.sessions,
      })
      return
    }

    exportStoryCsv({
      error: activeSession.state.error,
      maxRoundCount: activeSession.state.maxRoundCount,
      messages: activeSession.state.messages,
      modelSettings: activeSession.state.modelSettings,
      humanLikeSettings: activeSession.state.humanLikeSettings,
      mode: activeConversationMode,
      rules: activeSession.state.rules,
      seed: activeSession.state.seed,
      sessionId: activeSession.state.sessionId,
      sessionStartedAt: activeSession.state.sessionStartedAt,
      startingRoundMode: activeSession.state.startingRoundMode,
      startingRoundSpeaker: activeSession.state.startingRoundSpeaker,
      status: activeSession.state.status,
      style: activeSession.state.style,
      systemPrompt: activeSession.state.systemPrompt,
    })
  }

  async function handleFetchModels(apiConfig: RuntimeLLMConfig) {
    setIsFetchingModels(true)
    setModelFetchError(null)

    try {
      const models = await fetchAvailableModels(apiConfig)
      setAvailableModels(models)
      return models
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '获取模型列表失败，请稍后重试。'
      setModelFetchError(message)
      setAvailableModels([])
      return []
    } finally {
      setIsFetchingModels(false)
    }
  }

  const headerCopy = isExperimentWorkspace
    ? experiment.state.status === 'completed'
      ? {
          badge: '实验完成',
          subtitle:
            '本次正式实验的 6 个 prompt 已全部完成，可直接导出整次实验 JSON。',
          title: '正式实验',
        }
      : experiment.state.status === 'advancing'
        ? {
            badge: `第 ${experiment.completedCount} / ${experiment.state.items.length} 题`,
            subtitle: '本题完成，3秒钟后进入下一题。',
            title: '正式实验',
          }
      : {
          badge: `第 ${experiment.completedCount + 1} / ${experiment.state.items.length} 题`,
          subtitle:
            activeConversationMode === 'human_like'
              ? '当前是正式实验，题目顺序和起手方已经锁定，完成当前题后会自动进入下一题。'
              : '当前是正式实验，AI 搭档模式、题目顺序和起手方已经锁定，完成当前题后会自动进入下一题。',
          title: '正式实验',
      }
    : {
        badge: '临时对话',
        subtitle: '当前是临时对话，可自由切换模式、题目和参数。',
        title: '临时对话',
      }

  const canExport =
    isExperimentWorkspace && experiment.state.status === 'completed'
      ? experiment.state.sessions.length > 0
      : activeSession.state.messages.length > 0

  return (
    <div
      className={
        isSidebarCollapsed ? 'app-shell app-shell--sidebar-collapsed' : 'app-shell'
      }
    >
      <aside className={isSidebarCollapsed ? 'sidebar sidebar--collapsed' : 'sidebar'}>
        {isExperimentWorkspace ? null : (
          <button
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? '展开左侧栏' : '收起左侧栏'}
            className="sidebar-toggle"
            type="button"
            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          >
            <span className="sidebar-toggle__glyph" aria-hidden="true">
              <span className="sidebar-toggle__panel sidebar-toggle__panel--sidebar" />
              <span className="sidebar-toggle__divider" />
              <span className="sidebar-toggle__panel sidebar-toggle__panel--workspace" />
            </span>
          </button>
        )}
        {!isSidebarCollapsed ? (
          <StorySidebar
            experimentCompletedCount={experiment.completedCount}
            experimentPromptCount={storySeeds.length}
            experimentStatus={experiment.state.status}
            isExperimentPickerOpen={isExperimentPickerOpen}
            playgroundLabel="临时对话"
            seeds={storySeeds}
            selectedExperimentMode={experiment.state.mode}
            selectedMode={conversationMode}
            selectedSeedId={playgroundSession.state.seed.id}
            onExperimentModePick={(mode) => {
              const nextExperimentConfig = {
                maxRoundCount: playgroundSession.state.maxRoundCount,
                humanLikeSettings: playgroundSession.state.humanLikeSettings,
                modelSettings: playgroundSession.state.modelSettings,
                sessionSnapshot: experimentSession.state,
                style: playgroundSession.state.style,
                systemPrompt: playgroundSession.state.systemPrompt,
              }

              experimentSessionConfigRef.current = nextExperimentConfig
              experimentSession.restartSession(
                storySeeds[0],
                nextExperimentConfig.style,
                nextExperimentConfig.systemPrompt,
                nextExperimentConfig.maxRoundCount,
                experimentSession.state.startingRoundMode,
                nextExperimentConfig.humanLikeSettings,
                nextExperimentConfig.modelSettings,
                null,
              )
              experiment.startExperiment(mode)
              setIsSidebarCollapsed(true)
              setIsExperimentPickerOpen(false)
              setIsSettingsOpen(false)
            }}
            onOpenExperimentPicker={() => setIsExperimentPickerOpen(true)}
            onResetExperiment={() => {
              experiment.resetExperiment()
              experimentSession.restartSession(
                storySeeds[0],
                experimentSession.state.style,
                buildDefaultSystemPrompt({
                  conversationMode: 'manual',
                  rules: experimentSession.state.rules,
                  style: experimentSession.state.style,
                }),
                experimentSession.state.maxRoundCount,
                experimentSession.state.startingRoundMode,
                experimentSession.state.humanLikeSettings,
                experimentSession.state.modelSettings,
                null,
              )
              setIsExperimentPickerOpen(false)
            }}
            onModeChange={(mode) => {
              setConversationMode(mode)
              playgroundSession.restartSession(
                playgroundSession.state.seed,
                playgroundSession.state.style,
                buildDefaultSystemPrompt({
                  conversationMode: mode,
                  rules: playgroundSession.state.rules,
                  style: playgroundSession.state.style,
                }),
                playgroundSession.state.maxRoundCount,
                playgroundSession.state.startingRoundMode,
                playgroundSession.state.humanLikeSettings,
                playgroundSession.state.modelSettings,
                null,
              )
            }}
            onRestart={() => playgroundSession.restartSession()}
            onSeedChange={playgroundSession.updateSeed}
          />
        ) : null}
      </aside>

      <main className="workspace">
        <StoryHeader
          badge={headerCopy.badge}
          hasMessages={canExport}
          maxRoundCount={activeSession.state.maxRoundCount}
          onExitExperiment={
            isExperimentWorkspace
              ? () => {
                  experiment.resetExperiment()
                  experimentSession.restartSession(
                    storySeeds[0],
                    experimentSession.state.style,
                    buildDefaultSystemPrompt({
                      conversationMode: 'manual',
                      rules: experimentSession.state.rules,
                      style: experimentSession.state.style,
                    }),
                    experimentSession.state.maxRoundCount,
                    experimentSession.state.startingRoundMode,
                    experimentSession.state.humanLikeSettings,
                    experimentSession.state.modelSettings,
                    null,
                  )
                  setIsSidebarCollapsed(false)
                  setIsExperimentPickerOpen(false)
                }
              : undefined
          }
          onExport={handleExport}
          onOpenSettings={
            isExperimentWorkspace ? undefined : () => setIsSettingsOpen(true)
          }
          providerStatusTone={providerStatusTone}
          providerStatusLabel={providerStatusLabel}
          rules={activeSession.state.rules}
          startingRoundMode={activeSession.state.startingRoundMode}
          subtitle={headerCopy.subtitle}
          title={headerCopy.title}
        />

        <MessageList
          conversationMode={activeConversationMode}
          error={activeSession.state.error}
          messages={activeSession.state.messages}
          onDismissError={activeSession.clearError}
          openingLine={activeSession.state.seed.openingLine}
          startingRoundMode={activeSession.state.startingRoundMode}
          startingRoundSpeaker={activeSession.state.startingRoundSpeaker}
          status={activeSession.state.status}
        />

        {isExperimentWorkspace ? (
          experiment.state.status === 'completed' ? (
            <section className="experiment-summary">
              <div className="experiment-summary__inner">
                <p className="eyebrow">实验完成</p>
                <h2>6 个 prompt 已全部完成</h2>
                <p>
                  当前可从右上角导出整次实验的 JSON，也可以退出正式实验回到
                  playground。
                </p>
              </div>
            </section>
          ) : experiment.state.status === 'advancing' ? (
            <section className="experiment-summary">
              <div className="experiment-summary__inner">
                <p className="eyebrow">本题完成</p>
                <h2>本题完成，3秒钟后进入下一题</h2>
                <p>请保持当前页面，系统会自动进入下一题。</p>
              </div>
            </section>
          ) : (
            <Composer
              conversationMode={experimentConversationMode}
              draft={experimentSession.draft}
              draftError={experimentSession.draftError}
              hasStarted={experimentSession.state.sessionStartedAt !== null}
              isBusy={
                experimentSession.state.status === 'waiting_for_partner_ready' ||
                experimentSession.state.status === 'submitting_user_line' ||
                experimentSession.state.status === 'waiting_for_ai'
              }
              status={experimentSession.state.status}
              isRoundLimitReached={experimentSession.isRoundLimitReached}
              maxLength={experimentSession.state.rules.maxChars}
              maxRoundCount={experimentSession.state.maxRoundCount}
              startingRoundMode={experimentSession.state.startingRoundMode}
              onBackspace={experimentSession.incrementBackspaceCount}
              onChange={experimentSession.setDraft}
              onStartSession={() =>
                currentExperimentItem &&
                experimentSession.startSession(
                  currentExperimentItem.startingRoundSpeaker,
                )
              }
              onSubmit={experimentSession.submitDraft}
            />
          )
        ) : conversationMode === 'manual' || conversationMode === 'human_like' ? (
          <Composer
            conversationMode={conversationMode}
            draft={playgroundSession.draft}
            draftError={playgroundSession.draftError}
            hasStarted={playgroundSession.state.sessionStartedAt !== null}
            isBusy={
              playgroundSession.state.status === 'waiting_for_partner_ready' ||
              playgroundSession.state.status === 'submitting_user_line' ||
              playgroundSession.state.status === 'waiting_for_ai'
            }
            status={playgroundSession.state.status}
            isRoundLimitReached={playgroundSession.isRoundLimitReached}
            maxLength={playgroundSession.state.rules.maxChars}
            maxRoundCount={playgroundSession.state.maxRoundCount}
            startingRoundMode={playgroundSession.state.startingRoundMode}
            onBackspace={playgroundSession.incrementBackspaceCount}
            onChange={playgroundSession.setDraft}
            onStartSession={() => playgroundSession.startSession()}
            onSubmit={playgroundSession.submitDraft}
          />
        ) : (
          <AutoConversationPanel
            isBusy={playgroundSession.state.status === 'waiting_for_ai'}
            maxRoundCount={playgroundSession.state.maxRoundCount}
            startingRoundMode={playgroundSession.state.startingRoundMode}
            onGenerate={playgroundSession.generateAutoConversation}
          />
        )}
      </main>

      <SettingsDrawer
        key={`${isSettingsOpen ? 'open' : 'closed'}-${activeSession.state.systemPrompt}-${activeSession.state.style}-${activeSession.state.maxRoundCount}-${activeSession.state.modelSettings.model}-${activeSession.state.modelSettings.temperature}-${activeSession.state.modelSettings.topP}-${activeSession.state.humanLikeSettings.delayMultiplier}-${runtimeConfig?.baseUrl ?? ''}-${runtimeConfig?.apiKey ?? ''}-${runtimeConfig?.model ?? ''}-${activeConversationMode}`}
        availableModels={availableModels}
        conversationMode={activeConversationMode}
        currentStyle={activeSession.state.style}
        hideStartingRoundSettings={isExperimentWorkspace}
        initialApiConfig={runtimeConfig}
        initialHumanLikeSettings={activeSession.state.humanLikeSettings}
        initialMaxRoundCount={activeSession.state.maxRoundCount}
        initialStartingRoundMode={activeSession.state.startingRoundMode}
        initialModelSettings={activeSession.state.modelSettings}
        isFetchingModels={isFetchingModels}
        initialPrompt={activeSession.state.systemPrompt}
        isOpen={!isExperimentWorkspace && isSettingsOpen}
        modelFetchError={modelFetchError}
        onClose={() => setIsSettingsOpen(false)}
        onFetchModels={handleFetchModels}
        onSave={({
          apiConfig,
          humanLikeSettings,
          maxRoundCount,
          modelSettings,
          startingRoundMode,
          style,
          systemPrompt,
        }) => {
          if (isExperimentWorkspace) {
            experimentSession.applyPromptSettings(
              style,
              systemPrompt,
              maxRoundCount,
              humanLikeSettings,
              modelSettings,
            )
          } else {
            playgroundSession.updatePromptSettings(
              style,
              systemPrompt,
              maxRoundCount,
              startingRoundMode,
              humanLikeSettings,
              modelSettings,
            )
          }

          const normalized = normalizeRuntimeLLMConfig(apiConfig)
          runtimeConfigStore.save(normalized)
          setRuntimeConfig(runtimeConfigStore.load())
        }}
        providerLabel={activeSession.providerLabel}
        rules={activeSession.state.rules}
      />
    </div>
  )
}
