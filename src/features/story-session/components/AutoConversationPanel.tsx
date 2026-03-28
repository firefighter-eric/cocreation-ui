import { useEffect, useState } from 'react'
import { autoTurnCountRange } from '../../../shared/config/story'

interface AutoConversationPanelProps {
  autoTurnCount: number
  isBusy: boolean
  onAutoTurnChange: (count: number) => void
  onGenerate: (count: number) => void
}

export function AutoConversationPanel({
  autoTurnCount,
  isBusy,
  onAutoTurnChange,
  onGenerate,
}: AutoConversationPanelProps) {
  const [draftValue, setDraftValue] = useState(String(autoTurnCount))

  useEffect(() => {
    setDraftValue(String(autoTurnCount))
  }, [autoTurnCount])

  function commitDraft(value: string) {
    if (value.trim() === '') {
      setDraftValue('')
      return null
    }

    const parsed = Number(value)

    if (Number.isNaN(parsed)) {
      setDraftValue(String(autoTurnCount))
      return null
    }

    const clamped = Math.min(
      autoTurnCountRange.max,
      Math.max(autoTurnCountRange.min, Math.trunc(parsed)),
    )

    onAutoTurnChange(clamped)
    setDraftValue(String(clamped))
    return clamped
  }

  return (
    <section className="auto-mode-panel">
      <div className="auto-mode-panel__inner">
        <div className="section-heading">
          <h2>自动对话轮数</h2>
          <span>机器自动模式</span>
        </div>

        <label className="auto-turn-input">
          <span>输入 1-10 轮</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            type="text"
            value={draftValue}
            onBlur={(event) => commitDraft(event.target.value)}
            onChange={(event) => setDraftValue(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>

        <button
          className="restart-button restart-button--primary"
          disabled={isBusy}
          type="button"
          onClick={() => {
            const nextCount = commitDraft(draftValue)

            if (nextCount !== null) {
              onGenerate(nextCount)
            }
          }}
        >
          {isBusy ? '自动生成中' : '自动生成 1 例对话'}
        </button>
      </div>
    </section>
  )
}
