import { useState } from 'react'
import type { StoryRules, StoryStyle } from '../../entities/story-session/types'
import type { StoryMode } from '../../shared/config/story'
import { styleOptions } from '../../shared/config/story'
import { buildDefaultSystemPrompt } from '../../shared/lib/llm/prompt'

interface SettingsDrawerProps {
  conversationMode: StoryMode
  currentStyle: StoryStyle
  initialModelSettings: {
    temperature: number
    topP: number
  }
  initialPrompt: string
  isOpen: boolean
  onClose: () => void
  onSave: (payload: {
    style: StoryStyle
    systemPrompt: string
    modelSettings: {
      temperature: number
      topP: number
    }
  }) => void
  providerLabel: string
  rules: StoryRules
}

export function SettingsDrawer({
  conversationMode,
  currentStyle,
  initialModelSettings,
  initialPrompt,
  isOpen,
  onClose,
  onSave,
  providerLabel,
  rules,
}: SettingsDrawerProps) {
  const [draft, setDraft] = useState(initialPrompt)
  const [selectedStyle, setSelectedStyle] = useState(currentStyle)
  const [temperature, setTemperature] = useState(initialModelSettings.temperature)
  const [topP, setTopP] = useState(initialModelSettings.topP)

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
            <h2>创作风格</h2>
            <span>{providerLabel}</span>
          </div>
          <div className="option-grid">
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
            <h2>模型参数</h2>
            <span>可直接修改</span>
          </div>
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

        <p className="settings-drawer__hint">
          风格切换会直接改写这份 system prompt，你可以继续手动修改。
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
              onSave({
                style: selectedStyle,
                systemPrompt: draft,
                modelSettings: {
                  temperature,
                  topP,
                },
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
