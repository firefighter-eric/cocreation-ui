import type { ExperimentMode } from '../../../entities/experiment/types'
import type { StorySessionState } from '../../../entities/story-session/types'
import { buildStoryExportPayload, createExportFileStem } from './storyCsv'

interface ExperimentExportSessionInput {
  promptIndex: number
  session: StorySessionState
}

interface ExportExperimentJsonInput {
  experimentCompletedAt: string | null
  experimentId: string
  experimentMode: ExperimentMode
  experimentStartedAt: string
  sessions: ExperimentExportSessionInput[]
}

export function exportExperimentJson(input: ExportExperimentJsonInput) {
  const exportedAt = new Date()
  const json = buildExperimentJson(input, exportedAt)
  const fileStem = createExportFileStem(exportedAt)

  downloadFile(json, `${fileStem}.json`, 'application/json;charset=utf-8;')
}

export function buildExperimentJson(
  input: ExportExperimentJsonInput,
  exportedAt = new Date(),
) {
  return JSON.stringify(
    {
      experiment_id: input.experimentId,
      experiment_started_at: input.experimentStartedAt,
      experiment_completed_at: input.experimentCompletedAt,
      experiment_mode: input.experimentMode,
      prompt_count: input.sessions.length,
      exported_at: exportedAt.toISOString(),
      sessions: input.sessions.map(({ promptIndex, session }) => ({
        prompt_index: promptIndex,
        ...buildStoryExportPayload(
          {
            error: session.error,
            maxRoundCount: session.maxRoundCount,
            messages: session.messages,
            mode: input.experimentMode,
            modelSettings: session.modelSettings,
            rules: session.rules,
            seed: session.seed,
            sessionId: session.sessionId,
            sessionStartedAt: session.sessionStartedAt,
            startingRoundMode: session.startingRoundMode,
            startingRoundSpeaker: session.startingRoundSpeaker,
            status: session.status,
            style: session.style,
            systemPrompt: session.systemPrompt,
          },
          exportedAt,
        ),
      })),
    },
    null,
    2,
  )
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
