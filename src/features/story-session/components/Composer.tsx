import { useEffect, useRef, useState } from 'react'

interface ComposerProps {
  draft: string
  draftError: string | null
  hasStarted: boolean
  isBusy: boolean
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
  draft,
  draftError,
  hasStarted,
  isBusy,
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
  const buttonLabel = !hasStarted ? '开始' : isBusy ? '生成中' : '发送'

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
                ? '点击开始后先由对方说第一句，系统会记录你的思考时间。'
                : startingRoundMode === 'random'
                  ? '点击开始后会随机决定谁先说第一句。'
                  : '点击开始后再输入，系统会记录你的思考时间。'
              : isRoundLimitReached
                ? `已达到最大 ${maxRoundCount} 回合，请重新开始或在设置中调整。`
                : '和 AI 一起一问一答接龙。')}
        </p>
        <span aria-live="polite">{remaining} / {maxLength}</span>
      </div>
    </form>
  )
}
