import type { StartingRoundMode } from '../../../entities/story-session/types'
import type {
  StoryRules,
} from '../../../entities/story-session/types'

interface StoryHeaderProps {
  badge?: string
  hasMessages: boolean
  maxRoundCount: number
  onExitExperiment?: () => void
  onOpenSettings?: () => void
  title?: string
  subtitle?: string
  startingRoundMode: StartingRoundMode
  onExport: () => void
  providerStatusTone: 'mock' | 'connected'
  providerStatusLabel: string
  rules: StoryRules
}

export function StoryHeader({
  badge,
  hasMessages,
  maxRoundCount,
  onExitExperiment,
  title = '当前规则',
  subtitle,
  startingRoundMode,
  onExport,
  onOpenSettings,
  providerStatusTone,
  providerStatusLabel,
  rules,
}: StoryHeaderProps) {
  const startingRoundLabel =
    startingRoundMode === 'user'
      ? '用户先开始'
      : startingRoundMode === 'assistant'
        ? '对方先开始'
        : '随机开始'

  return (
    <header className="workspace-header">
      <div className="rule-card rule-card--header rule-card--header-main">
        <div className="rule-card__header-copy">
          <span className="rule-card__label">{title}</span>
          {subtitle ? <p className="workspace-subtitle">{subtitle}</p> : null}
        </div>
        <div className="rule-card__items">
          {badge ? <span className="rule-chip rule-chip--strong">{badge}</span> : null}
          <span className="rule-chip">{rules.maxChars} 字内</span>
          <span className="rule-chip">
            {rules.punctuationAllowed ? '允许标点' : '不允许标点'}
          </span>
          <span className="rule-chip">最多 {maxRoundCount} 回合</span>
          <span className="rule-chip">{startingRoundLabel}</span>
        </div>
      </div>

      <div className="header-side">
        <div className="header-pills">
          <span
            className={
              providerStatusTone === 'connected'
                ? 'header-pill header-pill--status header-pill--status-connected'
                : 'header-pill header-pill--status header-pill--status-mock'
            }
          >
            <span className="header-pill__dot" aria-hidden="true" />
            {providerStatusLabel}
          </span>
          <button
            className="header-export"
            disabled={!hasMessages}
            type="button"
            onClick={onExport}
          >
            导出 JSON
          </button>
          {onOpenSettings ? (
            <button
              className="header-export"
              type="button"
              onClick={onOpenSettings}
            >
              设置
            </button>
          ) : null}
          {onExitExperiment ? (
            <button
              className="header-export"
              type="button"
              onClick={onExitExperiment}
            >
              退出正式实验
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
