import { useState } from 'react'
import { AutoConversationPanel } from '../features/story-session/components/AutoConversationPanel'
import { StorySidebar } from '../features/story-settings/StorySidebar'
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
import { createSessionStore } from '../shared/lib/storage/sessionStore'
import { createStoryProvider } from '../shared/lib/llm/createStoryProvider'
import { exportStoryCsv } from '../shared/lib/export/storyCsv'

export function App() {
  const [conversationMode, setConversationMode] = useState<StoryMode>(
    defaultStoryMode,
  )
  const [autoTurnCount, setAutoTurnCount] = useState(defaultAutoTurnCount)
  const [provider] = useState(() => createStoryProvider())
  const [store] = useState(() => createSessionStore())

  function handleExportCsv() {
    exportStoryCsv({
      error: state.error,
      messages: state.messages,
      mode: conversationMode,
      rules: state.rules,
      seed: state.seed,
      sessionId: state.sessionId,
      status: state.status,
      style: state.style,
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
    updateStyle,
    updateSeed,
    clearError,
    incrementBackspaceCount,
  } = useStorySession({
    provider,
    store,
    initialSeed: storySeeds[0],
  })

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <StorySidebar
          providerLabel={providerLabel}
          seeds={storySeeds}
          selectedMode={conversationMode}
          selectedSeedId={state.seed.id}
          selectedStyle={state.style}
          rules={state.rules}
          onModeChange={(mode) => {
            setConversationMode(mode)
            restartSession()
          }}
          onRestart={restartSession}
          onSeedChange={updateSeed}
          onStyleChange={updateStyle}
        />
      </aside>

      <main className="workspace">
        <StoryHeader
          currentStyle={state.style}
          hasMessages={state.messages.length > 0}
          openingLine={state.seed.openingLine}
          onExport={handleExportCsv}
          sessionStatus={state.status}
          title={state.seed.title}
        />

        <MessageList
          error={state.error}
          messages={state.messages}
          onDismissError={clearError}
          openingLine={state.seed.openingLine}
          status={state.status}
        />

        {conversationMode === 'manual' ? (
          <Composer
            draft={draft}
            draftError={draftError}
            isBusy={
              state.status === 'submitting_user_line' ||
              state.status === 'waiting_for_ai'
            }
            maxLength={state.rules.maxChars}
            onBackspace={incrementBackspaceCount}
            onChange={setDraft}
            onSubmit={submitDraft}
          />
        ) : (
          <AutoConversationPanel
            autoTurnCount={autoTurnCount}
            isBusy={state.status === 'waiting_for_ai'}
            onAutoTurnChange={handleAutoTurnChange}
            onGenerate={() => generateAutoConversation(autoTurnCount)}
          />
        )}
      </main>
    </div>
  )
}
