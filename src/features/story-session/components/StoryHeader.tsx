import type {
  StorySessionStatus,
  StoryStyle,
} from '../../../entities/story-session/types'
import { styleOptions } from '../../../shared/config/story'

interface StoryHeaderProps {
  currentStyle: StoryStyle
  hasMessages: boolean
  openingLine: string
  onExport: () => void
  sessionStatus: StorySessionStatus
  title: string
}

export function StoryHeader({
  currentStyle,
  hasMessages,
  openingLine,
  onExport,
  sessionStatus,
  title,
}: StoryHeaderProps) {
  const styleLabel =
    styleOptions.find((option) => option.value === currentStyle)?.label ??
    currentStyle

  const statusCopy =
    sessionStatus === 'waiting_for_ai' || sessionStatus === 'submitting_user_line'
      ? 'AI 正在续写'
      : '轮到你继续'

  return (
    <header className="workspace-header">
      <div>
        <p className="eyebrow">共创故事</p>
        <h2>{title}</h2>
        <p className="workspace-subtitle">{openingLine}</p>
      </div>

      <div className="header-pills">
        <span className="header-pill">{styleLabel}</span>
        <span className="header-pill header-pill--muted">{statusCopy}</span>
        <button
          className="header-export"
          disabled={!hasMessages}
          type="button"
          onClick={onExport}
        >
          导出 JSON
        </button>
      </div>
    </header>
  )
}
