import type { StartingRoundMode } from '../../../entities/story-session/types'
import type { MessageRole } from '../../../entities/message/types'
import type { Message } from '../../../entities/message/types'
import type { StorySessionStatus } from '../../../entities/story-session/types'
import type { StoryMode } from '../../../shared/config/story'

interface MessageListProps {
  conversationMode: StoryMode
  error: string | null
  hideOpeningLine?: boolean
  messages: Message[]
  openingLine: string
  startingRoundMode: StartingRoundMode
  startingRoundSpeaker: MessageRole | null
  status: StorySessionStatus
  onDismissError: () => void
}

export function MessageList({
  conversationMode,
  error,
  hideOpeningLine = false,
  messages,
  openingLine,
  startingRoundMode,
  startingRoundSpeaker,
  status,
  onDismissError,
}: MessageListProps) {
  const partnerLabel = conversationMode === 'human_like' ? '对方' : 'AI'
  const selfLabel = '我'
  const isWaitingForPartnerReady = status === 'waiting_for_partner_ready'
  const emptyTitle = isWaitingForPartnerReady
    ? '等待对方进场'
    : '先写一句，把故事推向下一步。'
  const emptyCopy = isWaitingForPartnerReady
    ? '对方正在进入当前题目，双方准备好后会显示故事开场句。'
    : startingRoundMode === 'assistant'
      ? conversationMode === 'human_like'
        ? '点击开始后，对方会先接上开场句。'
        : '点击开始后，AI 会先接上开场句。'
      : startingRoundMode === 'random'
        ? '点击开始后，本次会随机决定由谁先接上开场句。'
        : conversationMode === 'human_like'
          ? '你发送一句，对方会接着把故事继续写下去。'
          : '你发送一句，AI 会继续接龙。'
  const openingTurnCopy =
    startingRoundSpeaker === 'user'
      ? '本轮由你先接龙'
      : startingRoundSpeaker === 'assistant'
        ? '本轮由对方先接龙'
        : startingRoundMode === 'user'
          ? '本轮由你先接龙'
          : startingRoundMode === 'assistant'
            ? '本轮由对方先接龙'
            : '本轮开始后随机决定'

  return (
    <section className="chat-panel">
      <div className="chat-scroll">
        {hideOpeningLine ? null : (
          <div className="opening-card">
            <div className="opening-card__content">
              <div>
                <p className="eyebrow">故事开场</p>
                <h1>{openingLine}</h1>
              </div>
              <div className="opening-card__turn">
                <span className="opening-card__turn-label">开始顺序</span>
                <strong>{openingTurnCopy}</strong>
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">{emptyTitle}</p>
            <p className="empty-copy">{emptyCopy}</p>
          </div>
        ) : null}

        <div className="message-list">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`message-row message-row--${message.role}`}
            >
              <div className="message-avatar" aria-hidden="true">
                {message.role === 'user' ? selfLabel : partnerLabel}
              </div>
              <div className="message-bubble">
                <p>{message.content}</p>
              </div>
            </article>
          ))}

          {status === 'submitting_user_line' || status === 'waiting_for_ai' ? (
            <article className="message-row message-row--assistant">
              <div className="message-avatar" aria-hidden="true">
                {partnerLabel}
              </div>
              <div className="message-bubble message-bubble--typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </article>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="error-banner" role="alert">
          <div>
            <p>这次接龙失败了</p>
            <span>{error}</span>
          </div>
          <button type="button" onClick={onDismissError}>
            关闭
          </button>
        </div>
      ) : null}
    </section>
  )
}
