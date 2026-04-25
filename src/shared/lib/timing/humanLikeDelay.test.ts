import { describe, expect, it } from 'vitest'
import { computeHumanLikeDelay, computePartnerReadyDelay } from './humanLikeDelay'

describe('computeHumanLikeDelay', () => {
  it('applies the configured delay multiplier to the combined delay budget', () => {
    expect(computeHumanLikeDelay('测试', 0, 2)).toBe((1400 + 2 * 280) * 2)
  })

  it('scales with character count', () => {
    const shortDelay = computeHumanLikeDelay('你好', 0, 2)
    const longDelay = computeHumanLikeDelay('你好这里是一个更长的句子', 0, 2)

    expect(longDelay).toBeGreaterThan(shortDelay)
  })

  it('applies jitter within range', () => {
    const minDelay = computeHumanLikeDelay('测试', 0, 2)
    const maxDelay = computeHumanLikeDelay('测试', 1, 2)

    expect(maxDelay - minDelay).toBeLessThanOrEqual(3600)
  })
})

describe('computePartnerReadyDelay', () => {
  it('stays within the expected 5-10 second range', () => {
    expect(computePartnerReadyDelay(0)).toBe(5000)
    expect(computePartnerReadyDelay(1)).toBe(10000)
  })
})
