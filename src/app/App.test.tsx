import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

    await user.type(
      screen.getByPlaceholderText('输入下一句故事，20字内，不使用标点'),
      '你好，世界',
    )

    expect(screen.getByText('这条规则不允许使用标点。')).toBeInTheDocument()
  })

  it('generates an automatic conversation sample', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /机器自动对话/ }))
    const turnInput = screen.getByRole('spinbutton')
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
    expect(exported.conversation[1].interaction.inputStartedAt).toEqual(
      expect.any(String),
    )
    expect(exported.conversation[1].interaction.inputEndedAt).toEqual(
      expect.any(String),
    )
    expect(exported.conversation[1].interaction.backspaceCount).toBe(1)
    expect(exported.conversation[2].interaction.aiStartedAt).toEqual(
      expect.any(String),
    )
    expect(exported.conversation[2].interaction.aiEndedAt).toEqual(
      expect.any(String),
    )

    createElementSpy.mockRestore()
    globalThis.Blob = originalBlob
  })
})
