import type {
  StoryRules,
  StorySeed,
  StoryStyle,
} from '../../entities/story-session/types'
import { storyModeOptions, type StoryMode, styleOptions } from '../../shared/config/story'

interface StorySidebarProps {
  providerLabel: string
  rules: StoryRules
  seeds: StorySeed[]
  selectedMode: StoryMode
  selectedSeedId: string
  selectedStyle: StoryStyle
  onModeChange: (mode: StoryMode) => void
  onRestart: () => void
  onSeedChange: (seed: StorySeed) => void
  onStyleChange: (style: StoryStyle) => void
}

export function StorySidebar({
  providerLabel,
  rules,
  seeds,
  selectedMode,
  selectedSeedId,
  selectedStyle,
  onModeChange,
  onRestart,
  onSeedChange,
  onStyleChange,
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
          <span>2 种</span>
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
          <h2>创作风格</h2>
          <span>{providerLabel}</span>
        </div>
        <div className="option-grid">
          {styleOptions.map((option) => (
            <button
              key={option.value}
              className={
                option.value === selectedStyle
                  ? 'option-card option-card--active'
                  : 'option-card'
              }
              type="button"
              onClick={() => onStyleChange(option.value)}
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
              <strong>{seed.title}</strong>
              <p>{seed.openingLine}</p>
              <span>{seed.summary}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section sidebar-section--compact">
        <div className="rule-card">
          <h2>当前规则</h2>
          <p>{rules.maxChars} 字内</p>
          <p>不允许标点</p>
          <p>一来一回接龙</p>
        </div>

        <button className="restart-button" type="button" onClick={onRestart}>
          重新开始当前故事
        </button>
      </section>
    </div>
  )
}
