import type {
  StoryRules,
} from '../../../entities/story-session/types'

interface StoryHeaderProps {
  hasMessages: boolean
  maxRoundCount: number
  openingLine: string
  onExport: () => void
  onOpenSettings: () => void
  providerStatusTone: 'mock' | 'connected'
  providerStatusLabel: string
  rules: StoryRules
  title: string
}

export function StoryHeader({
  hasMessages,
  maxRoundCount,
  openingLine,
  onExport,
  onOpenSettings,
  providerStatusTone,
  providerStatusLabel,
  rules,
  title,
}: StoryHeaderProps) {
  return (
    <header className="workspace-header">
      <div>
        <p className="eyebrow">共创故事</p>
        <h2>{title}</h2>
        <p className="workspace-subtitle">{openingLine}</p>
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
          <button
            className="header-export"
            type="button"
            onClick={onOpenSettings}
          >
            设置
          </button>
        </div>

        <div className="rule-card rule-card--header">
          <span className="rule-card__label">当前规则</span>
          <div className="rule-card__items">
            <span className="rule-chip">{rules.maxChars} 字内</span>
            <span className="rule-chip">
              {rules.punctuationAllowed ? '允许标点' : '不允许标点'}
            </span>
            <span className="rule-chip">最多 {maxRoundCount} 回合</span>
          </div>
        </div>
      </div>
    </header>
  )
}
