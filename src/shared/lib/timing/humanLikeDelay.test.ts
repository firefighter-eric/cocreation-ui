import { describe, expect, it } from 'vitest'
import { computeHumanLikeDelay } from './humanLikeDelay'

describe('computeHumanLikeDelay', () => {
  it('scales with character count', () => {
    const shortDelay = computeHumanLikeDelay('你好', 0)
    const longDelay = computeHumanLikeDelay('你好这里是一个更长的句子', 0)

    expect(longDelay).toBeGreaterThan(shortDelay)
  })

  it('applies jitter within range', () => {
    const minDelay = computeHumanLikeDelay('测试', 0)
    const maxDelay = computeHumanLikeDelay('测试', 1)

    expect(maxDelay - minDelay).toBeLessThanOrEqual(900)
  })
})
