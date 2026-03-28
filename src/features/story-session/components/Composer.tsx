interface ComposerProps {
  draft: string
  draftError: string | null
  hasStarted: boolean
  isBusy: boolean
  maxLength: number
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
  maxLength,
  onChange,
  onBackspace,
  onStartSession,
  onSubmit,
}: ComposerProps) {
  const remaining = maxLength - Array.from(draft).length

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      {!hasStarted ? (
        <div className="composer-start-panel">
          <p>点击开始后再输入，系统会记录你的思考时间。</p>
          <button
            className="restart-button restart-button--primary composer-start-button"
            type="button"
            onClick={onStartSession}
          >
            开始
          </button>
        </div>
      ) : null}

      <label className="composer-panel">
        <span className="sr-only">输入你的下一句故事</span>
        <textarea
          className="composer-input"
          disabled={isBusy || !hasStarted}
          maxLength={maxLength}
          placeholder="输入下一句故事，20字内，不使用标点"
          rows={1}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace') {
              onBackspace()
            }

            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSubmit()
            }
          }}
        />
        <button className="composer-send" disabled={isBusy || !hasStarted} type="submit">
          {isBusy ? '生成中' : '发送'}
        </button>
      </label>

      <div className="composer-meta">
        <p>{draftError ?? '和 AI 一起一问一答接龙，故事会一直延续下去。'}</p>
        <span aria-live="polite">{remaining} / {maxLength}</span>
      </div>
    </form>
  )
}
