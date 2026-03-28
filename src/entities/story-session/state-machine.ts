import type { Message } from '../message/types'
import type {
  StoryRules,
  StorySeed,
  StorySessionEvent,
  StorySessionState,
  StoryStyle,
} from './types'

interface CreateStorySessionInput {
  modelSettings: StorySessionState['modelSettings']
  seed: StorySeed
  systemPrompt: string
  style: StoryStyle
  rules: StoryRules
}

export function createStorySession(
  input: CreateStorySessionInput,
): StorySessionState {
  return {
    sessionId: createSessionId(),
    sessionStartedAt: null,
    systemPrompt: input.systemPrompt,
    modelSettings: input.modelSettings,
    seed: input.seed,
    style: input.style,
    rules: input.rules,
    status: 'idle',
    messages: [],
    error: null,
  }
}

export function advanceStorySession(
  state: StorySessionState,
  event: StorySessionEvent,
): StorySessionState {
  switch (event.type) {
    case 'BOOT':
      return {
        ...state,
        status: 'ready',
      }
    case 'USER_SUBMIT':
      return {
        ...state,
        status: 'submitting_user_line',
        messages: [...state.messages, event.message],
        error: null,
      }
    case 'START_SESSION':
      return {
        ...state,
        sessionStartedAt: state.sessionStartedAt ?? event.startedAt,
        error: null,
      }
    case 'APPEND_MESSAGE':
      return {
        ...state,
        status: event.status ?? state.status,
        messages: [...state.messages, event.message],
        error: null,
      }
    case 'AI_REQUEST_START':
      return {
        ...state,
        status: 'waiting_for_ai',
      }
    case 'AI_SUCCESS':
      return {
        ...state,
        status: 'ai_replied',
        messages: [...state.messages, event.message],
        error: null,
      }
    case 'AI_FAILURE':
      return {
        ...state,
        status: 'failed',
        error: event.error,
      }
    case 'SET_SYSTEM_PROMPT':
      return {
        ...state,
        systemPrompt: event.systemPrompt,
      }
    case 'SET_MODEL_SETTINGS':
      return {
        ...state,
        modelSettings: event.modelSettings,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        status: 'ready',
        error: null,
      }
    case 'RESET':
      return {
        sessionId: createSessionId(),
        sessionStartedAt: null,
        systemPrompt: event.systemPrompt ?? state.systemPrompt,
        modelSettings: event.modelSettings ?? state.modelSettings,
        seed: event.seed ?? state.seed,
        style: event.style ?? state.style,
        rules: event.rules ?? state.rules,
        status: 'ready',
        messages: [],
        error: null,
      }
  }
}

export function createMessage(
  role: Message['role'],
  content: string,
  interaction?: Message['interaction'],
): Message {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${role}-${Date.now()}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    interaction,
  }
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`
}
