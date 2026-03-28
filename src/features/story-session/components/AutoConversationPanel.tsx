import { autoTurnCountRange } from '../../../shared/config/story'

interface AutoConversationPanelProps {
  autoTurnCount: number
  isBusy: boolean
  onAutoTurnChange: (count: number) => void
  onGenerate: () => void
}

export function AutoConversationPanel({
  autoTurnCount,
  isBusy,
  onAutoTurnChange,
  onGenerate,
}: AutoConversationPanelProps) {
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
            max={autoTurnCountRange.max}
            min={autoTurnCountRange.min}
            step={1}
            type="number"
            value={autoTurnCount}
            onChange={(event) => onAutoTurnChange(Number(event.target.value))}
          />
        </label>

        <button
          className="restart-button restart-button--primary"
          disabled={isBusy}
          type="button"
          onClick={onGenerate}
        >
          {isBusy ? '自动生成中' : '自动生成 1 例对话'}
        </button>
      </div>
    </section>
  )
}
