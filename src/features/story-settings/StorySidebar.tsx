import type {
  StorySeed,
} from '../../entities/story-session/types'
import {
  getExperimentModeCopy,
  getStoryModeOptions,
  type ModeLabelDisplay,
  type StoryMode,
} from '../../shared/config/story'
import type { ExperimentMode } from '../../entities/experiment/types'
import type { ExperimentStatus } from '../../entities/experiment/types'

interface StorySidebarProps {
  experimentCompletedCount: number
  experimentPromptCount: number
  experimentStatus: ExperimentStatus
  isExperimentPickerOpen: boolean
  modeLabelDisplay: ModeLabelDisplay
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
  modeLabelDisplay,
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
  const isExperimentActive =
    experimentStatus === 'running' || experimentStatus === 'advancing'
  const isExperimentFinished = experimentStatus === 'completed'
  const humanLikeExperimentCopy = getExperimentModeCopy(
    'human_like',
    modeLabelDisplay,
  )
  const manualExperimentCopy = getExperimentModeCopy('manual', modeLabelDisplay)
  const selectedExperimentLabel =
    selectedExperimentMode === 'human_like'
      ? humanLikeExperimentCopy.selectedLabel
      : manualExperimentCopy.selectedLabel
  const storyModeOptions = getStoryModeOptions(modeLabelDisplay)
  const experimentCardCopy = isExperimentActive
    ? `正在进行 ${selectedExperimentLabel}，当前题目会自动推进。`
    : isExperimentFinished
      ? `已完成 ${selectedExperimentLabel} 的全部题目，可导出结果。`
      : isExperimentPickerOpen
        ? null
        : '请选择一个模式开始。'

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
            {experimentStatus === 'running' || experimentStatus === 'advancing'
              ? `${experimentCompletedCount} / ${experimentPromptCount}`
              : experimentStatus === 'completed'
                ? '已完成'
                : '6 题'}
          </span>
        </div>
        <div className="experiment-card">
          {experimentCardCopy ? (
            <p className="experiment-card__copy">{experimentCardCopy}</p>
          ) : null}
          {isExperimentPickerOpen ? (
            <div className="option-grid">
              <button
                aria-label={`选择${humanLikeExperimentCopy.label}`}
                className="option-card option-card--title-only"
                type="button"
                onClick={() => onExperimentModePick('human_like')}
              >
                <strong>{humanLikeExperimentCopy.label}</strong>
              </button>
              <button
                aria-label={`选择${manualExperimentCopy.label}`}
                className="option-card option-card--title-only"
                type="button"
                onClick={() => onExperimentModePick('manual')}
              >
                <strong>{manualExperimentCopy.label}</strong>
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
                  ? 'option-card option-card--title-only option-card--active'
                  : 'option-card option-card--title-only'
              }
              disabled={isExperimentActive}
              type="button"
              onClick={() => onModeChange(option.value)}
            >
              <strong>{option.label}</strong>
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
