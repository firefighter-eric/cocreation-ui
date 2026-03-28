import type { Message } from '../../../entities/message/types'
import type {
  StoryRules,
  StorySeed,
  StorySessionStatus,
  StoryStyle,
} from '../../../entities/story-session/types'
import type { StoryMode } from '../../config/story'

interface ExportStoryCsvInput {
  error: string | null
  messages: Message[]
  mode: StoryMode
  rules: StoryRules
  seed: StorySeed
  sessionId: string
  status: StorySessionStatus
  style: StoryStyle
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
      sessionId: input.sessionId,
      exportedAt: exportedAt.toISOString(),
      mode: input.mode,
      style: input.style,
      status: input.status,
      error: input.error,
      rules: input.rules,
      seed: input.seed,
      conversation: [
        {
          role: 'opening',
          content: input.seed.openingLine,
        },
        ...input.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
          interaction: message.interaction ?? null,
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
