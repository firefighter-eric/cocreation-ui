import type { StartingRoundMode } from '../../../entities/story-session/types'

interface AutoConversationPanelProps {
  isBusy: boolean
  maxRoundCount: number
  startingRoundMode: StartingRoundMode
  onGenerate: (count: number) => void
}

export function AutoConversationPanel({
  isBusy,
  maxRoundCount,
  startingRoundMode,
  onGenerate,
}: AutoConversationPanelProps) {
  const startingRoundLabel =
    startingRoundMode === 'user'
      ? '用户'
      : startingRoundMode === 'assistant'
        ? '对方'
        : '随机'

  return (
    <section className="auto-mode-panel">
      <div className="auto-mode-panel__inner">
        <div className="section-heading">
          <h2>自动对话轮数</h2>
          <span>由设置统一控制</span>
        </div>

        <p className="settings-drawer__hint">
          当前最大回合数为 {maxRoundCount}，开始回合为{startingRoundLabel}。每 1
          回合代表 1 组“用户一句 + 对方一句”，可在右上角设置中修改。
        </p>

        <button
          className="restart-button restart-button--primary"
          disabled={isBusy}
          type="button"
          onClick={() => onGenerate(maxRoundCount)}
        >
          {isBusy ? '自动生成中' : '自动生成 1 例对话'}
        </button>
      </div>
    </section>
  )
}
