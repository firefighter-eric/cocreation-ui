import type {
  StoryRules,
  StorySessionStatus,
} from '../../../entities/story-session/types'
import type { StoryMode } from '../../../shared/config/story'

interface StoryHeaderProps {
  conversationMode: StoryMode
  hasMessages: boolean
  openingLine: string
  onExport: () => void
  onOpenSettings: () => void
  rules: StoryRules
  sessionStatus: StorySessionStatus
  title: string
}

export function StoryHeader({
  conversationMode,
  hasMessages,
  openingLine,
  onExport,
  onOpenSettings,
  rules,
  sessionStatus,
  title,
}: StoryHeaderProps) {
  const statusCopy =
    sessionStatus === 'waiting_for_ai' || sessionStatus === 'submitting_user_line'
      ? conversationMode === 'human_like'
        ? '对方正在输入'
        : 'AI 正在续写'
      : null

  return (
    <header className="workspace-header">
      <div>
        <p className="eyebrow">共创故事</p>
        <h2>{title}</h2>
        <p className="workspace-subtitle">{openingLine}</p>
      </div>

      <div className="header-side">
        <div className="header-pills">
          {statusCopy ? (
            <span className="header-pill header-pill--muted">{statusCopy}</span>
          ) : null}
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
            <span className="rule-chip">一来一回接龙</span>
          </div>
        </div>
      </div>
    </header>
  )
}
