import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { appEnv } from '../shared/config/env'
import {
  computeHumanLikeDelay,
  computePartnerReadyDelay,
} from '../shared/lib/timing/humanLikeDelay'

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    window.localStorage.clear()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:story'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '窗外的雨开始倒着落下',
            },
          },
        ],
      }),
    } as Response)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows sending a valid line and getting a mock reply', async () => {
    const user = userEvent.setup()

    render(<App />)
    expect(
      screen.getByText(appEnv.baseUrl && appEnv.apiKey ? '已接入' : '本地 Mock'),
    ).toBeInTheDocument()

    expect(screen.getByRole('button', { name: '开始' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '开始' }))
    await user.type(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
      '他翻到空白页的尽头',
    )
    await user.click(screen.getByRole('button', { name: '发送' }))

    expect(await screen.findByText('他翻到空白页的尽头')).toBeInTheDocument()
    expect(await screen.findByText('窗外的雨开始倒着落下')).toBeInTheDocument()
    await waitFor(() => expect(window.fetch).toHaveBeenCalled())
  })

  it('submits on enter', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '开始' }))
    await user.type(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
      '他看见墙上浮出旧地图{enter}',
    )

    expect(await screen.findByText('他看见墙上浮出旧地图')).toBeInTheDocument()
    await waitFor(() => expect(window.fetch).toHaveBeenCalled())
  })

  it('shows validation feedback for punctuation', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '开始' }))
    await user.type(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
      '你好，世界',
    )

    expect(screen.getByText('这条规则不允许使用标点。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发送' })).toBeDisabled()
  })

  it('uses the main composer button as start action before input is enabled', async () => {
    const user = userEvent.setup()

    render(<App />)

    const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')
    expect(input).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '开始' }))

    expect(input).not.toBeDisabled()
    expect(input).toHaveFocus()
    expect(screen.getByRole('button', { name: '发送' })).toBeDisabled()
  })

  it('refocuses the composer input after each reply so the next line can be typed immediately', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.click(
      within(screen.getByRole('group', { name: '谁先开始' })).getByRole(
        'button',
        { name: '用户' },
      ),
    )
    await user.click(screen.getByRole('button', { name: '关闭' }))

    await user.click(screen.getByRole('button', { name: '开始' }))
    const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')

    await user.type(input, '他忽然听见楼上传来脚步{enter}')

    expect(await screen.findAllByText('窗外的雨开始倒着落下')).not.toHaveLength(0)
    await waitFor(() => expect(input).toHaveFocus())
  })

  it('generates an automatic conversation sample', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /模式3/ }))
    await user.click(screen.getByRole('button', { name: '自动生成 1 例对话' }))

    await waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(10))
  })

  it('can switch between coded and descriptive mode labels from settings', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByRole('button', { name: /模式1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /模式2/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /模式3/ })).toBeInTheDocument()
    expect(screen.queryByText('进入模式1的手动接龙流程。')).not.toBeInTheDocument()
    expect(screen.queryByText('进入模式2的手动接龙流程。')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '设置' }))
    const codedLabelButton = screen.getByRole('button', { name: /显示模式编号/ })
    const descriptiveLabelButton = screen.getByRole('button', {
      name: /显示模式名称/,
    })

    expect(codedLabelButton).toHaveClass('option-card--active')
    expect(descriptiveLabelButton).not.toHaveClass('option-card--active')

    await user.click(descriptiveLabelButton)
    await user.click(screen.getByRole('button', { name: '关闭' }))

    expect(screen.getByRole('button', { name: /与人对话/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /与AI对话/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /AI自动对话/ })).toBeInTheDocument()
    expect(screen.queryByText('与对话搭档轮流接龙。')).not.toBeInTheDocument()
    expect(screen.queryByText('由你输入，AI 接着续写。')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '开始实验' }))

    expect(screen.getByRole('button', { name: '选择和人开始' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '选择和AI开始' })).toBeInTheDocument()
    expect(screen.queryByText('请选择一个模式开始。')).not.toBeInTheDocument()
    expect(screen.queryByText('进入正式实验，并以前台“对方”语义完成全部题目。')).not.toBeInTheDocument()
    expect(screen.queryByText('进入正式实验，并以 AI 搭档模式完成全部题目。')).not.toBeInTheDocument()
  })

  it('auto-saves settings changes and can restore defaults', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))

    expect(screen.queryByRole('button', { name: '保存' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '清空' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '还原默认' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /显示模式名称/ }))
    await user.clear(screen.getByLabelText('最大回合数量'))
    await user.type(screen.getByLabelText('最大回合数量'), '2')
    await user.clear(screen.getByLabelText('Model'))
    await user.type(screen.getByLabelText('Model'), 'custom-model')
    await user.clear(screen.getByLabelText('Max Tokens'))
    await user.type(screen.getByLabelText('Max Tokens'), '4096')
    await user.click(screen.getByRole('button', { name: '关闭' }))

    expect(screen.getByRole('button', { name: /与人对话/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '设置' }))
    expect(screen.getByLabelText('最大回合数量')).toHaveValue('2')
    expect(screen.getByLabelText('Model')).toHaveValue('custom-model')
    expect(screen.getByLabelText('Max Tokens')).toHaveValue('4096')

    await user.click(screen.getByRole('button', { name: '还原默认' }))

    expect(screen.getByLabelText('最大回合数量')).toHaveValue('5')
    expect(screen.getByLabelText('Model')).toHaveValue('deepseek-v4-flash')
    expect(screen.getByLabelText('Max Tokens')).toHaveValue('8000')

    await user.click(screen.getByRole('button', { name: '关闭' }))
    expect(screen.getByRole('button', { name: /模式1/ })).toBeInTheDocument()
  })

  it('exports the current conversation as json', async () => {
    const user = userEvent.setup()
    const clickMock = vi.fn()
    const downloadNames: string[] = []
    const blobContents: string[] = []
    const originalBlob = globalThis.Blob
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        const element = document.createElementNS(
          'http://www.w3.org/1999/xhtml',
          tagName,
        ) as HTMLAnchorElement

        if (tagName === 'a') {
          Object.defineProperty(element, 'download', {
            configurable: true,
            get: () => downloadNames.at(-1) ?? '',
            set: (value: string) => {
              downloadNames.push(value)
            },
          })
          Object.defineProperty(element, 'click', {
            value: clickMock,
          })
        }

        return element
      }) as typeof document.createElement)
    globalThis.Blob = class {
      parts: string[]

      constructor(parts: BlobPart[]) {
        this.parts = parts.map((part) => String(part))
      }
    } as unknown as typeof Blob
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: { parts: string[] }) => {
        blobContents.push(blob.parts.join(''))
        return 'blob:story'
      }),
    })

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.type(
      screen.getByLabelText('给 AI 的 System Prompt'),
      '让画面更安静',
    )
    await user.click(screen.getByRole('button', { name: '关闭' }))

    await user.click(screen.getByRole('button', { name: '开始' }))
    const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')
    await user.type(input, '月台尽头传来鲸歌')
    await user.keyboard('{Backspace}')
    await user.type(input, '声')
    await user.keyboard('{enter}')

    expect(await screen.findByText('月台尽头传来鲸声')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '导出 JSON' }))

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(clickMock).toHaveBeenCalledTimes(1)
    expect(downloadNames).toEqual([
      expect.stringMatching(/^cocreation-\d{6}-\d{6}\.json$/),
    ])
    const exported = JSON.parse(blobContents[0])
    expect(exported.session_started_at).toEqual(expect.any(String))
    expect(exported.system_prompt).toContain('让画面更安静')
    expect(exported.model_settings.model).toBe(appEnv.model)
    expect(exported.model_settings.max_tokens).toBe(8000)
    expect(exported.human_like_settings.delay_multiplier).toBe(2)
    expect(exported.max_round_count).toBe(5)
    expect(exported).not.toHaveProperty('base_url')
    expect(exported).not.toHaveProperty('api_key')
    expect(exported.conversation[1].interaction.input_started_at).toEqual(
      expect.any(String),
    )
    expect(exported.conversation[1].interaction.input_ended_at).toEqual(
      expect.any(String),
    )
    expect(exported.conversation[1].interaction.backspace_count).toBe(1)
    expect(exported.conversation[1].interaction.reaction_reference_at).toEqual(
      expect.any(String),
    )
    expect(exported.conversation[1].interaction.reaction_time_ms).toBeTypeOf(
      'number',
    )
    expect(exported.conversation[2].interaction.ai_started_at).toEqual(
      expect.any(String),
    )
    expect(exported.conversation[2].interaction.ai_ended_at).toEqual(
      expect.any(String),
    )

    createElementSpy.mockRestore()
    globalThis.Blob = originalBlob
  })

  it('opens settings drawer and sends custom system prompt', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.type(
      screen.getByLabelText('给 AI 的 System Prompt'),
      '让场景更贴近日常',
    )
    await user.clear(screen.getByLabelText('Model'))
    await user.type(screen.getByLabelText('Model'), 'story-model')
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '0.7')
    await user.clear(screen.getByLabelText('Top P'))
    await user.type(screen.getByLabelText('Top P'), '0.85')
    await user.clear(screen.getByLabelText('Max Tokens'))
    await user.type(screen.getByLabelText('Max Tokens'), '6000')
    await user.click(screen.getByRole('button', { name: '关闭' }))

    await user.click(screen.getByRole('button', { name: '开始' }))
    await user.type(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
      '他把雨衣挂在门后{enter}',
    )

    await waitFor(() => expect(window.fetch).toHaveBeenCalled())
    const request = vi.mocked(window.fetch).mock.calls[0]?.[1] as RequestInit
    const payload = JSON.parse(String(request.body))

    expect(payload.messages[0].content).toContain('让场景更贴近日常')
    expect(payload.messages[0].content).not.toContain('故事开场')
    expect(payload.messages[1]).toEqual({
      role: 'user',
      content: '一辆出租车停在路边',
    })
    expect(payload.model).toBe('story-model')
    expect(payload.temperature).toBe(0.7)
    expect(payload.top_p).toBe(0.85)
    expect(payload.max_tokens).toBe(6000)
  })

  it('uses max round count from settings for auto mode', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.clear(screen.getByLabelText('最大回合数量'))
    await user.type(screen.getByLabelText('最大回合数量'), '2')
    await user.click(screen.getByRole('button', { name: '关闭' }))

    await user.click(screen.getByRole('button', { name: /模式3/ }))
    expect(
      screen.getByText(
        '当前最大回合数为 2，开始回合为随机。每 1 回合代表 1 组“用户一句 + 对方一句”，可在右上角设置中修改。',
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '自动生成 1 例对话' }))

    await waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(4))
  })

  it('lets the partner speak first when starting round is set to 对方', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /模式1/ }))
    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.click(
      within(screen.getByRole('group', { name: '谁先开始' })).getByRole(
        'button',
        { name: '对方' },
      ),
    )
    await user.click(screen.getByRole('button', { name: '关闭' }))

    vi.useFakeTimers()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '开始' }))
    })

    expect(screen.getAllByText('等待对方进场')).toHaveLength(2)
    expect(screen.getByRole('button', { name: '等待对方进场' })).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(computePartnerReadyDelay(0.1))
    })

    expect(screen.getByRole('button', { name: '对方输入中' })).toBeInTheDocument()

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByText('窗外的雨开始倒着落下')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
    ).toHaveFocus()
  }, 10000)

  it('stops manual conversation after reaching max round count', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.clear(screen.getByLabelText('最大回合数量'))
    await user.type(screen.getByLabelText('最大回合数量'), '1')
    await user.click(screen.getByRole('button', { name: '关闭' }))

    await user.click(screen.getByRole('button', { name: '开始' }))
    const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')
    await user.type(input, '他把月光卷进袖口{enter}')

    expect(await screen.findByText('窗外的雨开始倒着落下')).toBeInTheDocument()
    expect(screen.getByText('已达到最大 1 回合，请重新开始或在设置中调整。')).toBeInTheDocument()
    expect(input).toBeDisabled()
    expect(screen.getByRole('button', { name: '发送' })).toBeDisabled()
  })

  it('uses saved custom api config from settings and persists it in localStorage', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.type(screen.getByLabelText('Base URL'), 'https://custom.example/v1/')
    await user.type(screen.getByLabelText('API Key'), 'custom-key')
    await user.clear(screen.getByLabelText('Model'))
    await user.type(screen.getByLabelText('Model'), 'custom-model')
    await user.click(screen.getByRole('button', { name: '关闭' }))
    expect(screen.getByText('已接入')).toBeInTheDocument()

    expect(
      window.localStorage.getItem('cocreation.runtime_llm_config'),
    ).toContain('custom-model')

    await user.click(screen.getByRole('button', { name: '开始' }))
    await user.type(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
      '他把影子折进衣袋{enter}',
    )

    await waitFor(() => expect(window.fetch).toHaveBeenCalled())
    const [url, request] = vi.mocked(window.fetch).mock.calls[0] as [
      string,
      RequestInit,
    ]

    expect(url).toBe('https://custom.example/v1/chat/completions')
    expect(request.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer custom-key',
      }),
    )
    expect(String(request.body)).toContain('"model":"custom-model"')
  })

  it('hydrates saved api config into settings drawer on reopen', async () => {
    window.localStorage.setItem(
      'cocreation.runtime_llm_config',
      JSON.stringify({
        apiKey: 'saved-key',
        baseUrl: 'https://saved.example/v1/',
        model: 'saved-model',
      }),
    )

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '设置' }))

    expect(screen.getByLabelText('Base URL')).toHaveValue('https://saved.example/v1')
    expect(screen.getByLabelText('API Key')).toHaveValue('saved-key')
    expect(screen.getByLabelText('Model')).toHaveValue('saved-model')
  })

  it('clears saved custom api config and stops using the previous custom url', async () => {
    const user = userEvent.setup()

    window.localStorage.setItem(
      'cocreation.runtime_llm_config',
      JSON.stringify({
        apiKey: 'saved-key',
        baseUrl: 'https://saved.example/v1',
        model: 'saved-model',
      }),
    )

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.click(screen.getByRole('button', { name: '清空 API 配置' }))
    await user.click(screen.getByRole('button', { name: '关闭' }))

    expect(window.localStorage.getItem('cocreation.runtime_llm_config')).toContain(
      '"model":"saved-model"',
    )
    

    await user.click(screen.getByRole('button', { name: '开始' }))
    await user.type(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
      '他把窗上的雾抹开{enter}',
    )

    await waitFor(() => expect(window.fetch).toHaveBeenCalled())
    const [url] = vi.mocked(window.fetch).mock.calls[0] as [string, RequestInit]

    expect(url).not.toBe('https://saved.example/v1/chat/completions')
    if (appEnv.baseUrl) {
      expect(url).toBe(`${appEnv.baseUrl}/chat/completions`)
    }
  })

  it('fetches candidate models and allows selecting one from dropdown', async () => {
    const user = userEvent.setup()

    vi.mocked(window.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: 'model-a' }, { id: 'model-b' }, { id: 'model-a' }],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '窗外的雨开始倒着落下',
              },
            },
          ],
        }),
      } as Response)

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    await user.click(
      within(screen.getByRole('group', { name: '谁先开始' })).getByRole(
        'button',
        { name: '用户' },
      ),
    )
    await user.type(screen.getByLabelText('Base URL'), 'https://custom.example/v1')
    await user.type(screen.getByLabelText('API Key'), 'custom-key')
    await user.click(screen.getByRole('button', { name: '获取候选模型' }))

    expect(await screen.findByRole('option', { name: 'model-a' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('候选模型'), 'model-b')
    await user.click(screen.getByRole('button', { name: '关闭' }))
    await user.click(screen.getByRole('button', { name: '开始' }))
    await user.type(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
      '他在门后听见潮声{enter}',
    )

    await waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(2))
    const request = vi.mocked(window.fetch).mock.calls[1]?.[1] as RequestInit

    expect(String(request.body)).toContain('"model":"model-b"')
  })

  it('toggles api key visibility in settings drawer', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    const apiKeyInput = screen.getByLabelText('API Key')

    expect(apiKeyInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: '显示 API Key' }))
    expect(apiKeyInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: '隐藏 API Key' }))
    expect(apiKeyInput).toHaveAttribute('type', 'password')
  })

  it('supports human-like conversation mode with delayed reply presentation', async () => {
    vi.useFakeTimers()

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /模式1/ }))

    fireEvent.click(screen.getByRole('button', { name: '开始' }))
    const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')
    fireEvent.change(input, { target: { value: '他把钟表藏进了袖口' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(document.querySelector('.message-bubble--typing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '对方输入中' })).toBeInTheDocument()
    expect(screen.queryByText('窗外的雨开始倒着落下')).not.toBeInTheDocument()
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByText('窗外的雨开始倒着落下')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('uses the saved human-like delay multiplier from settings', async () => {
    vi.useFakeTimers()

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /模式1/ }))
    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    expect(
      screen.getByText('(基础等待 + 字数等待 + 随机波动) × 倍率'),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('回复延迟倍率'), {
      target: { value: '3' },
    })
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))

    fireEvent.click(screen.getByRole('button', { name: '开始' }))
    const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')
    fireEvent.change(input, { target: { value: '他把钟表藏进了袖口' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const replyDelay = computeHumanLikeDelay('窗外的雨开始倒着落下', 0.1, 3)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(replyDelay - 1000)
    })

    expect(document.querySelector('.message-bubble--typing')).toBeInTheDocument()
    expect(screen.queryByText('窗外的雨开始倒着落下')).not.toBeInTheDocument()

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByText('窗外的雨开始倒着落下')).toBeInTheDocument()
  })

  it('does not submit while IME composition is active', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '开始' }))
    const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '他看见风停在门口' } })
    fireEvent.keyDown(input, {
      key: 'Enter',
      nativeEvent: { isComposing: true },
    })

    expect(window.fetch).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: '生成中' })).not.toBeInTheDocument()

    fireEvent.compositionEnd(input)
  })

  it('starts a formal experiment and locks playground controls', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '开始实验' }))
    await user.click(screen.getByRole('button', { name: '选择模式1' }))

    expect(screen.getByText('正式实验')).toBeInTheDocument()
    expect(screen.getByText('第 1 / 6 题')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '退出正式实验' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '展开左侧栏' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '设置' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /模式3/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '一辆出租车停在路边' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '重新开始当前故事' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('故事开场')).not.toBeInTheDocument()
  })

  it('delays the formal experiment opening line until both sides are ready', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-04-18T12:00:00.000Z'))

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '开始实验' }))
    fireEvent.click(screen.getByRole('button', { name: '选择模式2' }))

    expect(screen.queryByText('故事开场')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '开始' }))

    expect(screen.getAllByText('等待对方进场')).toHaveLength(2)
    expect(screen.queryByText('故事开场')).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(computePartnerReadyDelay(0.1) - 1)
    })

    expect(screen.queryByText('故事开场')).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(screen.getByText('故事开场')).toBeInTheDocument()
    expect(screen.getByText('电视屏幕突然闪烁了一下')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
    ).not.toBeDisabled()
  })

  it('requires settings to be configured before a formal experiment starts', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '设置' }))
    expect(screen.getByText('Prompt 设置')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '关闭' }))

    await user.click(screen.getByRole('button', { name: '开始实验' }))
    await user.click(screen.getByRole('button', { name: '选择模式2' }))

    expect(
      screen.queryByRole('button', { name: '设置' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Prompt 设置'),
    ).not.toBeInTheDocument()
  })

  it('re-expands the sidebar after exiting a formal experiment', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: '开始实验' }))
    await user.click(screen.getByRole('button', { name: '选择模式2' }))
    await user.click(screen.getByRole('button', { name: '退出正式实验' }))

    expect(screen.getByRole('button', { name: '收起左侧栏' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /模式3/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始实验' })).toBeInTheDocument()
  })

  it(
    'completes a formal experiment and exports one aggregated json file',
    async () => {
    vi.useFakeTimers()
    const clickMock = vi.fn()
    const downloadNames: string[] = []
    const blobContents: string[] = []
    const originalBlob = globalThis.Blob
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation(((tagName: string) => {
        const element = document.createElementNS(
          'http://www.w3.org/1999/xhtml',
          tagName,
        ) as HTMLAnchorElement

        if (tagName === 'a') {
          Object.defineProperty(element, 'download', {
            configurable: true,
            get: () => downloadNames.at(-1) ?? '',
            set: (value: string) => {
              downloadNames.push(value)
            },
          })
          Object.defineProperty(element, 'click', {
            value: clickMock,
          })
        }

        return element
      }) as typeof document.createElement)
    globalThis.Blob = class {
      parts: string[]

      constructor(parts: BlobPart[]) {
        this.parts = parts.map((part) => String(part))
      }
    } as unknown as typeof Blob
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: { parts: string[] }) => {
        blobContents.push(blob.parts.join(''))
        return 'blob:experiment'
      }),
    })

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    fireEvent.change(screen.getByLabelText('最大回合数量'), {
      target: { value: '1' },
    })
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))

    fireEvent.click(screen.getByRole('button', { name: '开始实验' }))
    fireEvent.click(screen.getByRole('button', { name: '选择模式2' }))

      for (let index = 1; index <= 6; index += 1) {
        expect(screen.getByText(`第 ${index} / 6 题`)).toBeInTheDocument()

        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: '开始' }))
        })

        const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')
        const wasWaitingForPartner = input.hasAttribute('disabled')

        if (wasWaitingForPartner) {
          expect(screen.getByRole('button', { name: '等待对方进场' })).toBeInTheDocument()
          await act(async () => {
            await vi.advanceTimersByTimeAsync(computePartnerReadyDelay(0.1))
            await Promise.resolve()
          })

          const assistantStartedFirst = screen.queryByRole('button', {
            name: '对方输入中',
          }) ?? screen.queryByRole('button', { name: '生成中' })

          if (assistantStartedFirst) {
            await act(async () => {
              await vi.runOnlyPendingTimersAsync()
            })
            expect(screen.getByText('窗外的雨开始倒着落下')).toBeInTheDocument()
          }
          expect(input).not.toBeDisabled()
        }

        await act(async () => {
          fireEvent.change(input, { target: { value: `第${index}题故事` } })
          fireEvent.keyDown(input, { key: 'Enter' })
        })

        if (index < 6) {
          await act(async () => {
            await Promise.resolve()
            await vi.runAllTimersAsync()
          })
          expect(screen.getByText(`第 ${index + 1} / 6 题`)).toBeInTheDocument()
        }
      }

      expect(screen.getByText('全部题目已完成')).toBeInTheDocument()
      expect(
        screen.getByText(/感谢您已完成了实验部分，但请您先不要离开/),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', {
          name: 'https://www.credamo.com/s/zuER3eano/',
        }),
      ).toHaveAttribute('href', 'https://www.credamo.com/s/zuER3eano/')

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(clickMock).toHaveBeenCalledTimes(1)
    expect(downloadNames).toEqual([
      expect.stringMatching(/^cocreation-\d{6}-\d{6}\.json$/),
    ])

    const exported = JSON.parse(blobContents[0])
    expect(exported.experiment_id).toEqual(expect.any(String))
    expect(exported.experiment_mode).toBe('manual')
    expect(exported.prompt_count).toBe(6)
    expect(exported.sessions).toHaveLength(6)
    expect(exported.sessions[0].conversation[0].is_opening).toBe(true)
    expect(exported.sessions[0].prompt_index).toBe(1)
    const userStartedSession = exported.sessions.find(
      (session: { starting_round_speaker: string }) =>
        session.starting_round_speaker === 'user',
    )
    expect(
      new Date(
        userStartedSession.conversation[1].interaction.reaction_reference_at,
      ).getTime(),
    ).toBeGreaterThan(
      new Date(userStartedSession.session_started_at).getTime(),
    )
    expect(
      userStartedSession.conversation[1].interaction.reaction_reference_at,
    ).not.toBe(userStartedSession.session_started_at)

      createElementSpy.mockRestore()
      globalThis.Blob = originalBlob
    },
    15000,
  )
})
