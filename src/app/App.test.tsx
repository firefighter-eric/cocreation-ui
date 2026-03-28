import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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
})
