import type { MessageRole } from '../message/types'
import type { StorySeed } from '../story-session/types'
import type { ExperimentItem } from './types'

export function createExperimentPlan(
  seeds: StorySeed[],
  seed: number,
): ExperimentItem[] {
  const random = createSeededRandom(seed)
  const shuffledSeeds = shuffle(seeds, random)
  const speakers = shuffle<MessageRole>([
    'user',
    'user',
    'user',
    'assistant',
    'assistant',
    'assistant',
  ], random)

  return shuffledSeeds.map((seed, index) => ({
    id: `${seed.id}-${index + 1}`,
    promptIndex: index + 1,
    seed,
    startingRoundSpeaker: speakers[index],
  }))
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0

  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0
    let next = Math.imul(state ^ (state >>> 15), state | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}
