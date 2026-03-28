import type {
  StorySeed,
} from '../../entities/story-session/types'
import { storyModeOptions, type StoryMode } from '../../shared/config/story'

interface StorySidebarProps {
  seeds: StorySeed[]
  selectedMode: StoryMode
  selectedSeedId: string
  onModeChange: (mode: StoryMode) => void
  onRestart: () => void
  onSeedChange: (seed: StorySeed) => void
}

export function StorySidebar({
  seeds,
  selectedMode,
  selectedSeedId,
  onModeChange,
  onRestart,
  onSeedChange,
}: StorySidebarProps) {
  return (
    <div className="sidebar-panel">
      <div className="sidebar-brand">
        <p className="eyebrow">Story Co-creation</p>
        <h1>共创故事</h1>
        <p>像 ChatGPT 一样对话，但每一句都在推进同一个故事世界。</p>
      </div>

      <section className="sidebar-section">
        <div className="section-heading">
          <h2>功能选取</h2>
          <span>{storyModeOptions.length} 种</span>
        </div>
        <div className="option-grid">
          {storyModeOptions.map((option) => (
            <button
              key={option.value}
              className={
                option.value === selectedMode
                  ? 'option-card option-card--active'
                  : 'option-card'
              }
              type="button"
              onClick={() => onModeChange(option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="section-heading">
          <h2>开场句</h2>
          <span>{seeds.length} 组</span>
        </div>
        <div className="seed-list">
          {seeds.map((seed) => (
            <button
              key={seed.id}
              className={
                seed.id === selectedSeedId
                  ? 'seed-card seed-card--active'
                  : 'seed-card'
              }
              type="button"
              onClick={() => onSeedChange(seed)}
            >
              <p>{seed.openingLine}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section sidebar-section--compact">
        <button className="restart-button" type="button" onClick={onRestart}>
          重新开始当前故事
        </button>
      </section>
    </div>
  )
}
