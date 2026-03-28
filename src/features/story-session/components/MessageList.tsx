import type { Message } from '../../../entities/message/types'
import type { StorySessionStatus } from '../../../entities/story-session/types'
import type { StoryMode } from '../../../shared/config/story'

interface MessageListProps {
  conversationMode: StoryMode
  error: string | null
  messages: Message[]
  openingLine: string
  status: StorySessionStatus
  onDismissError: () => void
}

export function MessageList({
  conversationMode,
  error,
  messages,
  openingLine,
  status,
  onDismissError,
}: MessageListProps) {
  const partnerLabel = conversationMode === 'human_like' ? '对方' : 'AI'
  const selfLabel = '我'
  const emptyCopy =
    conversationMode === 'human_like'
      ? '你发送一句，对方会接着把故事继续写下去。'
      : '你发送一句，AI 会继续接龙。'

  return (
    <section className="chat-panel">
      <div className="chat-scroll">
        <div className="opening-card">
          <p className="eyebrow">故事开场</p>
          <h1>{openingLine}</h1>
        </div>

        {messages.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">先写一句，把故事推向下一步。</p>
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
