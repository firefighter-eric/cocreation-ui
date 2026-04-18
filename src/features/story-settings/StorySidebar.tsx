import type {
  StorySeed,
} from '../../entities/story-session/types'
import { storyModeOptions, type StoryMode } from '../../shared/config/story'
import type { ExperimentMode } from '../../entities/experiment/types'

interface StorySidebarProps {
  experimentCompletedCount: number
  experimentPromptCount: number
  experimentStatus: 'idle' | 'running' | 'completed'
  isExperimentPickerOpen: boolean
  playgroundLabel: string
  seeds: StorySeed[]
  selectedMode: StoryMode
  selectedSeedId: string
  selectedExperimentMode: ExperimentMode | null
  onExperimentModePick: (mode: ExperimentMode) => void
  onOpenExperimentPicker: () => void
  onResetExperiment: () => void
  onModeChange: (mode: StoryMode) => void
  onRestart: () => void
  onSeedChange: (seed: StorySeed) => void
}

export function StorySidebar({
  experimentCompletedCount,
  experimentPromptCount,
  experimentStatus,
  isExperimentPickerOpen,
  playgroundLabel,
  seeds,
  selectedMode,
  selectedSeedId,
  selectedExperimentMode,
  onExperimentModePick,
  onOpenExperimentPicker,
  onResetExperiment,
  onModeChange,
  onRestart,
  onSeedChange,
}: StorySidebarProps) {
  const isExperimentActive = experimentStatus === 'running'
  const isExperimentFinished = experimentStatus === 'completed'
  const selectedExperimentLabel =
    selectedExperimentMode === 'human_like' ? '与人开始' : '与AI开始'

  return (
    <div className="sidebar-panel">
      <div className="sidebar-brand">
        <p className="eyebrow">Story Co-creation</p>
        <h1>共创故事</h1>
      </div>

      <section className="sidebar-section">
        <div className="section-heading">
          <h2>正式实验</h2>
          <span>
            {experimentStatus === 'running'
              ? `${experimentCompletedCount} / ${experimentPromptCount}`
              : experimentStatus === 'completed'
                ? '已完成'
                : '6 题'}
          </span>
        </div>
        <div className="experiment-card">
          <p className="experiment-card__copy">
            {isExperimentActive
              ? `正在进行 ${selectedExperimentLabel} 的正式实验，当前题目会按随机顺序自动推进。`
              : isExperimentFinished
                ? `已完成 ${selectedExperimentLabel} 的 6 个 prompt，可导出整次实验结果。`
                : '正式实验会一次完成全部 6 个 prompt，并把起手方严格平衡为 3 比 3。'}
          </p>
          {isExperimentPickerOpen ? (
            <div className="option-grid">
              <button
                className="option-card"
                type="button"
                onClick={() => onExperimentModePick('human_like')}
              >
                <strong>和人开始</strong>
                <span>进入正式实验，并以前台“对方”语义完成 6 题。</span>
              </button>
              <button
                className="option-card"
                type="button"
                onClick={() => onExperimentModePick('manual')}
              >
                <strong>和AI开始</strong>
                <span>进入正式实验，并以 AI 搭档模式连续完成 6 题。</span>
              </button>
            </div>
          ) : (
            <button
              className="restart-button restart-button--primary"
              disabled={isExperimentActive}
              type="button"
              onClick={onOpenExperimentPicker}
            >
              {isExperimentFinished ? '再开始一轮正式实验' : '开始实验'}
            </button>
          )}
          {(isExperimentActive || isExperimentFinished) && (
            <button
              className="restart-button"
              type="button"
              onClick={onResetExperiment}
            >
              退出正式实验
            </button>
          )}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="section-heading">
          <h2>功能选取</h2>
          <span>{playgroundLabel}</span>
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
              disabled={isExperimentActive}
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
              disabled={isExperimentActive}
              type="button"
              onClick={() => onSeedChange(seed)}
            >
              <p>{seed.openingLine}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section sidebar-section--compact">
        <button
          className="restart-button"
          disabled={isExperimentActive}
          type="button"
          onClick={onRestart}
        >
          重新开始当前故事
        </button>
      </section>
    </div>
  )
}
