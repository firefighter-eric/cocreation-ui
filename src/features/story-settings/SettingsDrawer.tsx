import { useState } from 'react'
import type {
  StartingRoundMode,
  StoryRules,
  StoryStyle,
} from '../../entities/story-session/types'
import type { StoryMode } from '../../shared/config/story'
import {
  defaultHumanLikeDelayMultiplier,
  humanLikeDelayMultiplierRange,
  modeLabelDisplayOptions,
  roundCountRange,
  startingRoundOptions,
  styleOptions,
  type ModeLabelDisplay,
} from '../../shared/config/story'
import { buildDefaultSystemPrompt } from '../../shared/lib/llm/prompt'
import { defaultLLMModel } from '../../shared/config/env'
import type { RuntimeLLMConfig } from '../../shared/lib/llm/runtimeConfig'

interface SettingsDrawerProps {
  availableModels: string[]
  conversationMode: StoryMode
  currentStyle: StoryStyle
  hideStartingRoundSettings?: boolean
  initialModelSettings: {
    model: string
    temperature: number
    topP: number
  }
  initialMaxRoundCount: number
  initialStartingRoundMode: StartingRoundMode
  initialApiConfig: RuntimeLLMConfig | null
  initialHumanLikeSettings: {
    delayMultiplier: number
  }
  initialModeLabelDisplay: ModeLabelDisplay
  isFetchingModels: boolean
  initialPrompt: string
  isOpen: boolean
  modelFetchError: string | null
  onClose: () => void
  onFetchModels: (apiConfig: RuntimeLLMConfig) => Promise<string[]>
  onSave: (payload: {
    apiConfig: RuntimeLLMConfig
    style: StoryStyle
    systemPrompt: string
    maxRoundCount: number
    startingRoundMode: StartingRoundMode
    humanLikeSettings: {
      delayMultiplier: number
    }
    modelSettings: {
      model: string
      temperature: number
      topP: number
    }
    modeLabelDisplay: ModeLabelDisplay
  }) => void
  providerLabel: string
  rules: StoryRules
}

export function SettingsDrawer({
  availableModels,
  conversationMode,
  currentStyle,
  hideStartingRoundSettings = false,
  initialApiConfig,
  initialHumanLikeSettings,
  initialMaxRoundCount,
  initialModeLabelDisplay,
  initialStartingRoundMode,
  initialModelSettings,
  isFetchingModels,
  initialPrompt,
  isOpen,
  modelFetchError,
  onClose,
  onFetchModels,
  onSave,
  providerLabel,
  rules,
}: SettingsDrawerProps) {
  const [draft, setDraft] = useState(initialPrompt)
  const [selectedStyle, setSelectedStyle] = useState(currentStyle)
  const [model, setModel] = useState(initialModelSettings.model)
  const [temperature, setTemperature] = useState(initialModelSettings.temperature)
  const [topP, setTopP] = useState(initialModelSettings.topP)
  const [maxRoundCountDraft, setMaxRoundCountDraft] = useState(
    String(initialMaxRoundCount),
  )
  const [delayMultiplierDraft, setDelayMultiplierDraft] = useState(
    String(initialHumanLikeSettings.delayMultiplier),
  )
  const [startingRoundMode, setStartingRoundMode] = useState(initialStartingRoundMode)
  const [modeLabelDisplay, setModeLabelDisplay] = useState(initialModeLabelDisplay)
  const [baseUrl, setBaseUrl] = useState(initialApiConfig?.baseUrl ?? '')
  const [apiKey, setApiKey] = useState(initialApiConfig?.apiKey ?? '')
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false)

  function normalizeMaxRoundCount(value: string) {
    const parsed = Number(value)

    if (Number.isNaN(parsed)) {
      return initialMaxRoundCount
    }

    return Math.min(
      roundCountRange.max,
      Math.max(roundCountRange.min, Math.trunc(parsed)),
    )
  }

  function normalizeDelayMultiplier(value: string) {
    if (value.trim().length === 0) {
      return initialHumanLikeSettings.delayMultiplier ?? defaultHumanLikeDelayMultiplier
    }

    const parsed = Number(value)

    if (Number.isNaN(parsed)) {
      return initialHumanLikeSettings.delayMultiplier ?? defaultHumanLikeDelayMultiplier
    }

    return Math.min(
      humanLikeDelayMultiplierRange.max,
      Math.max(humanLikeDelayMultiplierRange.min, parsed),
    )
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="settings-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        aria-label="Prompt 设置"
        className="settings-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-drawer__header">
          <div>
            <p className="eyebrow">Settings</p>
            <h2>Prompt 设置</h2>
          </div>
          <button type="button" className="settings-drawer__ghost" onClick={onClose}>
            关闭
          </button>
        </div>

        <label className="settings-drawer__field">
          <span>给 AI 的 System Prompt</span>
          <textarea
            placeholder="输入额外的 system prompt，例如：让故事更克制，减少奇幻元素。"
            rows={10}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>

        <section className="settings-drawer__section">
          <div className="section-heading">
            <h2>显示设置</h2>
            <span>前台模式名称</span>
          </div>
          <div className="option-grid option-grid--display-mode">
            {modeLabelDisplayOptions.map((option) => (
              <button
                key={option.value}
                className={
                  option.value === modeLabelDisplay
                    ? 'option-card option-card--active'
                    : 'option-card'
                }
                type="button"
                onClick={() => setModeLabelDisplay(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-drawer__section">
          <div className="section-heading">
            <h2>创作风格</h2>
            <span>{providerLabel}</span>
          </div>
          <div className="option-grid option-grid--style">
            {styleOptions.map((option) => (
              <button
                key={option.value}
                className={
                  option.value === selectedStyle
                    ? 'option-card option-card--active'
                    : 'option-card'
                }
                type="button"
                onClick={() => {
                  setSelectedStyle(option.value)
                  setDraft(
                    buildDefaultSystemPrompt({
                      conversationMode,
                      rules,
                      style: option.value,
                    }),
                  )
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-drawer__section">
          <div className="section-heading">
            <h2>回合设置</h2>
            <span>
              {hideStartingRoundSettings ? '正式实验已锁定起手方' : '所有模式通用'}
            </span>
          </div>
          <label className="settings-drawer__field">
            <span>最大回合数量</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              type="text"
              value={maxRoundCountDraft}
              onBlur={(event) =>
                setMaxRoundCountDraft(
                  String(normalizeMaxRoundCount(event.target.value)),
                )
              }
              onChange={(event) => setMaxRoundCountDraft(event.target.value)}
            />
          </label>
          <p className="settings-drawer__hint">
            默认 5 回合，范围 1-10。1 回合表示 1 组“用户一句 + 对方一句”。
          </p>
          {hideStartingRoundSettings ? null : (
            <div className="option-grid option-grid--starting-round">
              {startingRoundOptions.map((option) => (
                <button
                  key={option.value}
                  className={
                    option.value === startingRoundMode
                      ? 'option-card option-card--active'
                      : 'option-card'
                  }
                  type="button"
                  onClick={() => setStartingRoundMode(option.value)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="settings-drawer__section">
          <div className="section-heading">
            <h2>模型参数</h2>
            <span>可直接修改</span>
          </div>
          <label className="settings-drawer__field">
            <span>Model</span>
            <input
              type="text"
              placeholder={defaultLLMModel}
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </label>
          <div className="settings-drawer__inline-actions">
            <button
              type="button"
              className="settings-drawer__ghost"
              disabled={isFetchingModels}
              onClick={async () => {
                const models = await onFetchModels({
                  apiKey,
                  baseUrl,
                  model: model.trim(),
                })

                if (models.length > 0 && model.trim().length === 0) {
                  setModel(models[0])
                }
              }}
            >
              {isFetchingModels ? '拉取中' : '获取候选模型'}
            </button>
          </div>
          {availableModels.length > 0 ? (
            <label className="settings-drawer__field">
              <span>候选模型</span>
              <select
                value={availableModels.includes(model) ? model : ''}
                onChange={(event) => setModel(event.target.value)}
              >
                <option value="">选择一个候选模型</option>
                {availableModels.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {modelFetchError ? (
            <p className="settings-drawer__error">{modelFetchError}</p>
          ) : null}
          <div className="settings-grid">
            <label className="settings-drawer__field">
              <span>Temperature</span>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(event) => setTemperature(Number(event.target.value))}
              />
            </label>
            <label className="settings-drawer__field">
              <span>Top P</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={topP}
                onChange={(event) => setTopP(Number(event.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="settings-drawer__section">
          <div className="section-heading">
            <h2>模式1节奏</h2>
            <span>仅模式1生效</span>
          </div>
          <label className="settings-drawer__field">
            <span>回复延迟倍率</span>
            <input
              inputMode="decimal"
              type="text"
              value={delayMultiplierDraft}
              onBlur={(event) =>
                setDelayMultiplierDraft(
                  String(normalizeDelayMultiplier(event.target.value)),
                )
              }
              onChange={(event) => setDelayMultiplierDraft(event.target.value)}
            />
          </label>
          <p className="settings-drawer__hint">
            公式：
            <code>(基础等待 + 字数等待 + 随机波动) × 倍率</code>
            。当前基础等待是 1400ms，每个字额外增加 280ms，随机波动范围是
            0-900ms。
          </p>
          <p className="settings-drawer__hint">
            这个倍率只影响前台“对方正在输入”的展示节奏，不影响模型真实请求，
            导出里仍会保留真实的 <code>ai_started_at</code> 和{' '}
            <code>ai_ended_at</code>。
          </p>
        </section>

        <section className="settings-drawer__section">
          <div className="section-heading">
            <h2>API 配置</h2>
            <span>浏览器本地保存</span>
          </div>
          <label className="settings-drawer__field">
            <span>Base URL</span>
            <input
              type="text"
              placeholder="https://api.openai.com/v1"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
          </label>
          <label className="settings-drawer__field">
            <span>API Key</span>
            <div className="settings-drawer__input-with-action">
              <input
                type={isApiKeyVisible ? 'text' : 'password'}
                placeholder="输入你自己的 API Key"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
              <button
                type="button"
                aria-label={isApiKeyVisible ? '隐藏 API Key' : '显示 API Key'}
                aria-pressed={isApiKeyVisible}
                className="settings-drawer__icon-button"
                onClick={() => setIsApiKeyVisible((current) => !current)}
              >
                <VisibilityToggleIcon visible={isApiKeyVisible} />
              </button>
            </div>
          </label>
          <div className="settings-drawer__inline-actions">
            <button
              type="button"
              className="settings-drawer__ghost"
              onClick={() => {
                setBaseUrl('')
                setApiKey('')
              }}
            >
              清空 API 配置
            </button>
          </div>
        </section>

        <p className="settings-drawer__hint">
          风格切换会直接改写这份 system prompt，你可以继续手动修改。API
          配置和 model 只保存在当前浏览器，导出 JSON 不会写入 API Key。
        </p>

        <div className="settings-drawer__actions">
          <button
            type="button"
            className="settings-drawer__ghost"
            onClick={() => setDraft('')}
          >
            清空
          </button>
          <button
            type="button"
            className="settings-drawer__primary"
            onClick={() => {
              const normalizedModel = model.trim() || initialModelSettings.model

              onSave({
                apiConfig: {
                  apiKey,
                  baseUrl,
                  model: normalizedModel,
                },
                style: selectedStyle,
                systemPrompt: draft,
                maxRoundCount: normalizeMaxRoundCount(maxRoundCountDraft),
                startingRoundMode,
                humanLikeSettings: {
                  delayMultiplier: normalizeDelayMultiplier(delayMultiplierDraft),
                },
                modelSettings: {
                  model: normalizedModel,
                  temperature,
                  topP,
                },
                modeLabelDisplay,
              })
              onClose()
            }}
          >
            保存
          </button>
        </div>
      </aside>
    </div>
  )
}

function VisibilityToggleIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="settings-drawer__icon">
        <path
          d="M3 3l18 18M10.6 10.7a2 2 0 102.8 2.8M9.9 5.2A10.9 10.9 0 0112 5c5.5 0 9.5 5.2 9.7 5.4a1 1 0 010 1.2 18.1 18.1 0 01-4.2 4.3M6.6 6.7A17.7 17.7 0 002.3 11 1 1 0 002.3 12.2 18.3 18.3 0 007 16.6M14.1 14.2A4 4 0 019.8 9.9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="settings-drawer__icon">
      <path
        d="M2.3 12a1 1 0 010-1.2C2.5 10.6 6.5 5.4 12 5.4s9.5 5.2 9.7 5.4a1 1 0 010 1.2C21.5 12.2 17.5 17.4 12 17.4S2.5 12.2 2.3 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="11.4"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}
