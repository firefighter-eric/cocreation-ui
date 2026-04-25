import { useEffect, useRef, useState } from 'react'
import type { StorySessionStatus } from '../../../entities/story-session/types'

interface ComposerProps {
  conversationMode: 'manual' | 'human_like'
  draft: string
  draftError: string | null
  hasStarted: boolean
  isBusy: boolean
  status: StorySessionStatus
  isRoundLimitReached: boolean
  maxLength: number
  maxRoundCount: number
  startingRoundMode: 'user' | 'assistant' | 'random'
  onChange: (value: string) => void
  onBackspace: () => void
  onStartSession: () => void
  onSubmit: () => void
}

export function Composer({
  conversationMode,
  draft,
  draftError,
  hasStarted,
  isBusy,
  status,
  isRoundLimitReached,
  maxLength,
  maxRoundCount,
  startingRoundMode,
  onChange,
  onBackspace,
  onStartSession,
  onSubmit,
}: ComposerProps) {
  const [isComposing, setIsComposing] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const remaining = maxLength - Array.from(draft).length
  const canSubmit =
    hasStarted &&
    !isBusy &&
    !isRoundLimitReached &&
    draft.trim().length > 0 &&
    draftError === null
  const buttonLabel = !hasStarted
    ? '开始'
    : isBusy
      ? status === 'waiting_for_partner_ready'
        ? '等待对方进场'
        : conversationMode === 'human_like'
          ? '对方输入中'
        : '生成中'
      : '发送'

  useEffect(() => {
    if (!hasStarted || isBusy) {
      return
    }

    inputRef.current?.focus()
  }, [hasStarted, isBusy])

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault()
        if (!hasStarted) {
          onStartSession()
          return
        }

        if (canSubmit) {
          onSubmit()
        }
      }}
    >
      <label
        className={draftError ? 'composer-panel composer-panel--error' : 'composer-panel'}
      >
        <span className="sr-only">输入你的下一句故事</span>
        <textarea
          ref={inputRef}
          className="composer-input"
          aria-invalid={draftError ? 'true' : 'false'}
          disabled={isBusy || !hasStarted || isRoundLimitReached}
          maxLength={maxLength}
          placeholder="输入下一句故事，20字内，不使用标点"
          rows={1}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(event) => {
            if (isComposing || event.nativeEvent.isComposing) {
              return
            }

            if (event.key === 'Backspace') {
              onBackspace()
            }

            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              if (canSubmit) {
                onSubmit()
              }
            }
          }}
        />
        <button
          className={!hasStarted ? 'composer-send composer-send--start' : 'composer-send'}
          disabled={hasStarted ? !canSubmit : false}
          type="submit"
        >
          {buttonLabel}
        </button>
      </label>

      <div className="composer-meta">
        <p className={draftError ? 'composer-error' : undefined}>
          {draftError ??
            (!hasStarted
              ? startingRoundMode === 'assistant'
                ? conversationMode === 'human_like'
                  ? '点击开始后会先等待对方进场，再进入对方输入状态。'
                  : '点击开始后先由对方说第一句，系统会记录你的思考时间。'
                : startingRoundMode === 'random'
                  ? '点击开始后会随机决定谁先说第一句。'
                  : '点击开始后再输入，系统会记录你的思考时间。'
              : isRoundLimitReached
                ? `已达到最大 ${maxRoundCount} 回合，请重新开始或在设置中调整。`
                : '')}
        </p>
        <span aria-live="polite">{remaining} / {maxLength}</span>
      </div>
    </form>
  )
}
