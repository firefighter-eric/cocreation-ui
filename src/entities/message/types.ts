export type MessageRole = 'user' | 'assistant'

export interface MessageInteractionMeta {
  aiEndedAt?: string
  aiStartedAt?: string
  backspaceCount?: number
  inputEndedAt?: string
  inputStartedAt?: string
  reactionReferenceAt?: string
  reactionTimeMs?: number
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  interaction?: MessageInteractionMeta
}
