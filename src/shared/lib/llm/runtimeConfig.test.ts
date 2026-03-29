import { describe, expect, it } from 'vitest'
import {
  hasCompleteRuntimeLLMConfig,
  normalizeRuntimeLLMConfig,
  resolveLLMConfig,
} from './runtimeConfig'

describe('runtimeConfig', () => {
  it('normalizes trailing slash in base url', () => {
    expect(
      normalizeRuntimeLLMConfig({
        apiKey: ' key ',
        baseUrl: 'https://example.com/v1/ ',
        model: ' gpt-test ',
      }),
    ).toEqual({
      apiKey: 'key',
      baseUrl: 'https://example.com/v1',
      model: 'gpt-test',
    })
  })

  it('prefers complete custom config over env defaults', () => {
    const resolved = resolveLLMConfig(
      {
        apiKey: 'custom-key',
        baseUrl: 'https://custom.example/v1/',
        model: 'custom-model',
      },
      {
        apiKey: 'env-key',
        baseUrl: 'https://env.example/v1',
        model: 'gpt-test',
      },
    )

    expect(resolved).toEqual({
      apiKey: 'custom-key',
      baseUrl: 'https://custom.example/v1',
      model: 'gpt-test',
      source: 'custom',
    })
  })

  it('falls back to env defaults when custom config is incomplete', () => {
    const resolved = resolveLLMConfig(
      {
        apiKey: '',
        baseUrl: 'https://custom.example/v1',
        model: 'custom-model',
      },
      {
        apiKey: 'env-key',
        baseUrl: 'https://env.example/v1',
        model: 'gpt-test',
      },
    )

    expect(resolved).toEqual({
      apiKey: 'env-key',
      baseUrl: 'https://env.example/v1',
      model: 'gpt-test',
      source: 'env',
    })
  })

  it('returns null when neither custom nor env config is complete', () => {
    expect(
      resolveLLMConfig(
        {
          apiKey: '',
          baseUrl: '',
          model: '',
        },
        {
          apiKey: '',
          baseUrl: '',
          model: 'gpt-test',
        },
      ),
    ).toBeNull()
  })

  it('detects whether config is complete', () => {
    expect(
      hasCompleteRuntimeLLMConfig({
        apiKey: 'key',
        baseUrl: 'https://example.com/v1',
        model: 'gpt-test',
      }),
    ).toBe(true)
    expect(
      hasCompleteRuntimeLLMConfig({
        apiKey: '',
        baseUrl: 'https://example.com/v1',
        model: 'gpt-test',
      }),
    ).toBe(false)
  })
})
