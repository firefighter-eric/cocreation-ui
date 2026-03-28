import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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

  it('allows sending a valid line and getting a mock reply', async () => {
    const user = userEvent.setup()

    render(<App />)

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

  it('generates an automatic conversation sample', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /AI自动对话/ }))
    const turnInput = screen.getByRole('textbox')
    fireEvent.change(turnInput, { target: { value: '2' } })
    await user.click(screen.getByRole('button', { name: '自动生成 1 例对话' }))

    await waitFor(() => expect(window.fetch).toHaveBeenCalledTimes(4))
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
    await user.click(screen.getByRole('button', { name: '保存' }))

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
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '0.7')
    await user.clear(screen.getByLabelText('Top P'))
    await user.type(screen.getByLabelText('Top P'), '0.85')
    await user.click(screen.getByRole('button', { name: '保存' }))

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
      content: '图书馆的角落里有个读书的人',
    })
    expect(payload.temperature).toBe(0.7)
    expect(payload.top_p).toBe(0.85)
  })

  it('supports human-like conversation mode with delayed reply presentation', async () => {
    vi.useFakeTimers()

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /与人对话/ }))

    fireEvent.click(screen.getByRole('button', { name: '开始' }))
    const input = screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点')
    fireEvent.change(input, { target: { value: '他把钟表藏进了袖口' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('对方正在输入')).toBeInTheDocument()
    expect(screen.queryByText('窗外的雨开始倒着落下')).not.toBeInTheDocument()

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(screen.getByText('窗外的雨开始倒着落下')).toBeInTheDocument()
    vi.useRealTimers()
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
})
