import type { Message } from '../../../entities/message/types'
import type {
  HumanLikeSettings,
  ModelSettings,
  StartingRoundMode,
  StoryRules,
  StorySeed,
  StorySessionStatus,
  StoryStyle,
} from '../../../entities/story-session/types'
import type { StoryMode } from '../../config/story'

interface ExportStoryCsvInput {
  error: string | null
  maxRoundCount: number
  messages: Message[]
  mode: StoryMode
  rules: StoryRules
  seed: StorySeed
  sessionId: string
  sessionStartedAt: string | null
  startingRoundMode: StartingRoundMode
  startingRoundSpeaker: Message['role'] | null
  status: StorySessionStatus
  style: StoryStyle
  systemPrompt: string
  humanLikeSettings: HumanLikeSettings
  modelSettings: ModelSettings
}

export interface StoryExportPayload {
  session_id: string
  session_started_at: string | null
  system_prompt: string
  model_settings: {
    model: string
    temperature: number
    top_p: number
    max_tokens: number
    output_max_chars: number
  }
  human_like_settings: {
    delay_multiplier: number
  }
  max_round_count: number
  starting_round_mode: StartingRoundMode
  starting_round_speaker: Message['role'] | null
  exported_at: string
  mode: StoryMode
  style: StoryStyle
  status: StorySessionStatus
  error: string | null
  rules: StoryRules
  seed: StorySeed
  conversation: Array<{
    id?: string
    role: Message['role']
    content: string
    created_at?: string
    is_opening: boolean
    interaction?: {
      ai_ended_at: string | undefined
      ai_started_at: string | undefined
      backspace_count: number | undefined
      input_ended_at: string | undefined
      input_started_at: string | undefined
      reaction_reference_at: string | undefined
      reaction_time_ms: number | undefined
    } | null
  }>
}

export function exportStoryCsv(input: ExportStoryCsvInput) {
  const exportedAt = new Date()
  const json = buildStoryJson(input, exportedAt)
  const fileStem = createExportFileStem(exportedAt)

  downloadFile(json, `${fileStem}.json`, 'application/json;charset=utf-8;')
}

export function buildStoryJson(input: ExportStoryCsvInput, exportedAt = new Date()) {
  return JSON.stringify(buildStoryExportPayload(input, exportedAt), null, 2)
}

export function buildStoryExportPayload(
  input: ExportStoryCsvInput,
  exportedAt = new Date(),
): StoryExportPayload {
  return {
    session_id: input.sessionId,
    session_started_at: input.sessionStartedAt,
    system_prompt: input.systemPrompt,
    model_settings: {
      model: input.modelSettings.model,
      temperature: input.modelSettings.temperature,
      top_p: input.modelSettings.topP,
      max_tokens: input.modelSettings.maxTokens,
      output_max_chars: input.modelSettings.outputMaxChars,
    },
    human_like_settings: {
      delay_multiplier: input.humanLikeSettings.delayMultiplier,
    },
    max_round_count: input.maxRoundCount,
    starting_round_mode: input.startingRoundMode,
    starting_round_speaker: input.startingRoundSpeaker,
    exported_at: exportedAt.toISOString(),
    mode: input.mode,
    style: input.style,
    status: input.status,
    error: input.error,
    rules: input.rules,
    seed: input.seed,
    conversation: [
      {
        role: 'user',
        content: input.seed.openingLine,
        is_opening: true,
      },
      ...input.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        created_at: message.createdAt,
        is_opening: false,
        interaction: message.interaction
          ? {
              ai_ended_at: message.interaction.aiEndedAt,
              ai_started_at: message.interaction.aiStartedAt,
              backspace_count: message.interaction.backspaceCount,
              input_ended_at: message.interaction.inputEndedAt,
              input_started_at: message.interaction.inputStartedAt,
              reaction_reference_at: message.interaction.reactionReferenceAt,
              reaction_time_ms: message.interaction.reactionTimeMs,
            }
          : null,
      })),
    ],
  }
}

export function createExportFileStem(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2)
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return `cocreation-${year}${month}${day}-${hours}${minutes}${seconds}`
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()

  URL.revokeObjectURL(url)
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}
