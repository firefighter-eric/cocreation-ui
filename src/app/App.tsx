import { useMemo, useState } from 'react'
import { AutoConversationPanel } from '../features/story-session/components/AutoConversationPanel'
import { StorySidebar } from '../features/story-settings/StorySidebar'
import { SettingsDrawer } from '../features/story-settings/SettingsDrawer'
import { Composer } from '../features/story-session/components/Composer'
import { MessageList } from '../features/story-session/components/MessageList'
import { StoryHeader } from '../features/story-session/components/StoryHeader'
import { useStorySession } from '../features/story-session/model/useStorySession'
import {
  autoTurnCountRange,
  defaultAutoTurnCount,
  defaultStoryMode,
  storySeeds,
  type StoryMode,
} from '../shared/config/story'
import { buildDefaultSystemPrompt } from '../shared/lib/llm/prompt'
import { createSessionStore } from '../shared/lib/storage/sessionStore'
import { createStoryProvider } from '../shared/lib/llm/createStoryProvider'
import { exportStoryCsv } from '../shared/lib/export/storyCsv'
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
  const [autoTurnCount, setAutoTurnCount] = useState(defaultAutoTurnCount)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const store = useMemo(() => createSessionStore(), [])
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

  function handleExportCsv() {
    exportStoryCsv({
      error: state.error,
      messages: state.messages,
      modelSettings: state.modelSettings,
      mode: conversationMode,
      rules: state.rules,
      seed: state.seed,
      sessionId: state.sessionId,
      sessionStartedAt: state.sessionStartedAt,
      status: state.status,
      style: state.style,
      systemPrompt: state.systemPrompt,
    })
  }

  function handleAutoTurnChange(nextCount: number) {
    if (Number.isNaN(nextCount)) {
      return
    }

    const clamped = Math.min(
      autoTurnCountRange.max,
      Math.max(autoTurnCountRange.min, Math.trunc(nextCount)),
    )

    setAutoTurnCount(clamped)
  }

  const {
    state,
    draft,
    draftError,
    providerLabel,
    setDraft,
    submitDraft,
    generateAutoConversation,
    restartSession,
    updateSeed,
    clearError,
    incrementBackspaceCount,
    startSession,
    updatePromptSettings,
  } = useStorySession({
    conversationMode,
    provider,
    store,
    initialModelSettings: {
      model: runtimeConfig?.model || appEnv.model,
      temperature: 1.0,
      topP: 1,
    },
    initialSeed: storySeeds[0],
  })

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <StorySidebar
          seeds={storySeeds}
          selectedMode={conversationMode}
          selectedSeedId={state.seed.id}
          onModeChange={(mode) => {
            setConversationMode(mode)
            restartSession(
              state.seed,
              state.style,
              buildDefaultSystemPrompt({
                conversationMode: mode,
                rules: state.rules,
                style: state.style,
              }),
              state.modelSettings,
            )
          }}
          onRestart={restartSession}
          onSeedChange={updateSeed}
        />
      </aside>

      <main className="workspace">
        <StoryHeader
          hasMessages={state.messages.length > 0}
          openingLine={state.seed.openingLine}
          onExport={handleExportCsv}
          onOpenSettings={() => setIsSettingsOpen(true)}
          providerStatusTone={providerStatusTone}
          providerStatusLabel={providerStatusLabel}
          rules={state.rules}
          title={state.seed.title}
        />

        <MessageList
          conversationMode={conversationMode}
          error={state.error}
          messages={state.messages}
          onDismissError={clearError}
          openingLine={state.seed.openingLine}
          status={state.status}
        />

        {conversationMode === 'manual' || conversationMode === 'human_like' ? (
          <Composer
            draft={draft}
            draftError={draftError}
            hasStarted={state.sessionStartedAt !== null}
            isBusy={
              state.status === 'submitting_user_line' ||
              state.status === 'waiting_for_ai'
            }
            maxLength={state.rules.maxChars}
            onBackspace={incrementBackspaceCount}
            onChange={setDraft}
            onStartSession={startSession}
            onSubmit={submitDraft}
          />
        ) : (
          <AutoConversationPanel
            autoTurnCount={autoTurnCount}
            isBusy={state.status === 'waiting_for_ai'}
            onAutoTurnChange={handleAutoTurnChange}
            onGenerate={generateAutoConversation}
          />
        )}
      </main>

      <SettingsDrawer
        key={`${isSettingsOpen ? 'open' : 'closed'}-${state.systemPrompt}-${state.style}-${state.modelSettings.model}-${state.modelSettings.temperature}-${state.modelSettings.topP}-${runtimeConfig?.baseUrl ?? ''}-${runtimeConfig?.apiKey ?? ''}-${runtimeConfig?.model ?? ''}`}
        availableModels={availableModels}
        conversationMode={conversationMode}
        currentStyle={state.style}
        initialApiConfig={runtimeConfig}
        initialModelSettings={state.modelSettings}
        isFetchingModels={isFetchingModels}
        initialPrompt={state.systemPrompt}
        isOpen={isSettingsOpen}
        modelFetchError={modelFetchError}
        onClose={() => setIsSettingsOpen(false)}
        onFetchModels={handleFetchModels}
        onSave={({ apiConfig, modelSettings, style, systemPrompt }) => {
          updatePromptSettings(style, systemPrompt, modelSettings)
          const normalized = normalizeRuntimeLLMConfig(apiConfig)
          runtimeConfigStore.save(normalized)
          setRuntimeConfig(runtimeConfigStore.load())
        }}
        providerLabel={providerLabel}
        rules={state.rules}
      />
    </div>
  )
}
