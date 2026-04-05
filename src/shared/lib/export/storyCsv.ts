import type { Message } from '../../../entities/message/types'
import type {
  ModelSettings,
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
  status: StorySessionStatus
  style: StoryStyle
  systemPrompt: string
  modelSettings: ModelSettings
}

export function exportStoryCsv(input: ExportStoryCsvInput) {
  const exportedAt = new Date()
  const json = buildStoryJson(input, exportedAt)
  const fileStem = createExportFileStem(exportedAt)

  downloadFile(json, `${fileStem}.json`, 'application/json;charset=utf-8;')
}

export function buildStoryJson(input: ExportStoryCsvInput, exportedAt = new Date()) {
  return JSON.stringify(
    {
      session_id: input.sessionId,
      session_started_at: input.sessionStartedAt,
      system_prompt: input.systemPrompt,
      model_settings: {
        model: input.modelSettings.model,
        temperature: input.modelSettings.temperature,
        top_p: input.modelSettings.topP,
      },
      max_round_count: input.maxRoundCount,
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
    },
    null,
    2,
  )
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
