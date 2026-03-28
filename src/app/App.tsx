import { useState } from 'react'
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

export function App() {
  const [conversationMode, setConversationMode] = useState<StoryMode>(
    defaultStoryMode,
  )
  const [autoTurnCount, setAutoTurnCount] = useState(defaultAutoTurnCount)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [provider] = useState(() => createStoryProvider())
  const [store] = useState(() => createSessionStore())

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
    initialSeed: storySeeds[0],
  })

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
          conversationMode={conversationMode}
          hasMessages={state.messages.length > 0}
          openingLine={state.seed.openingLine}
          onExport={handleExportCsv}
          onOpenSettings={() => setIsSettingsOpen(true)}
          rules={state.rules}
          sessionStatus={state.status}
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
        key={`${isSettingsOpen ? 'open' : 'closed'}-${state.systemPrompt}-${state.style}-${state.modelSettings.temperature}-${state.modelSettings.topP}`}
        conversationMode={conversationMode}
        currentStyle={state.style}
        initialModelSettings={state.modelSettings}
        initialPrompt={state.systemPrompt}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={({ modelSettings, style, systemPrompt }) =>
          updatePromptSettings(style, systemPrompt, modelSettings)
        }
        providerLabel={providerLabel}
        rules={state.rules}
      />
    </div>
  )
}
