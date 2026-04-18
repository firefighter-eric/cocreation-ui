import type { MessageRole } from '../message/types'
import type { StorySeed } from '../story-session/types'
import type { ExperimentItem } from './types'

export function createExperimentPlan(seeds: StorySeed[]): ExperimentItem[] {
  const shuffledSeeds = shuffle(seeds)
  const speakers = shuffle<MessageRole>([
    'user',
    'user',
    'user',
    'assistant',
    'assistant',
    'assistant',
  ])

  return shuffledSeeds.map((seed, index) => ({
    id: `${seed.id}-${index + 1}`,
    promptIndex: index + 1,
    seed,
    startingRoundSpeaker: speakers[index],
  }))
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}
