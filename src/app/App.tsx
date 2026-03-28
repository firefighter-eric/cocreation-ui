import { useState } from 'react'
import { StorySidebar } from '../features/story-settings/StorySidebar'
import { Composer } from '../features/story-session/components/Composer'
import { MessageList } from '../features/story-session/components/MessageList'
import { StoryHeader } from '../features/story-session/components/StoryHeader'
import { useStorySession } from '../features/story-session/model/useStorySession'
import { storySeeds } from '../shared/config/story'
import { createSessionStore } from '../shared/lib/storage/sessionStore'
import { createStoryProvider } from '../shared/lib/llm/createStoryProvider'

export function App() {
  const [provider] = useState(() => createStoryProvider())
  const [store] = useState(() => createSessionStore())

  const {
    state,
    draft,
    draftError,
    providerLabel,
    setDraft,
    submitDraft,
    restartSession,
    updateStyle,
    updateSeed,
    clearError,
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
          selectedSeedId={state.seed.id}
          selectedStyle={state.style}
          rules={state.rules}
          onRestart={restartSession}
          onSeedChange={updateSeed}
          onStyleChange={updateStyle}
        />
      </aside>

      <main className="workspace">
        <StoryHeader
          currentStyle={state.style}
          openingLine={state.seed.openingLine}
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

        <Composer
          draft={draft}
          draftError={draftError}
          isBusy={
            state.status === 'submitting_user_line' ||
            state.status === 'waiting_for_ai'
          }
          maxLength={state.rules.maxChars}
          onChange={setDraft}
          onSubmit={submitDraft}
        />
      </main>
    </div>
  )
}
