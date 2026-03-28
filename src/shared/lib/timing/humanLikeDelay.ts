const baseDelayMs = 700
const perCharDelayMs = 140
const maxJitterMs = 450

export function computeHumanLikeDelay(
  content: string,
  randomValue = Math.random(),
) {
  const charCount = Array.from(content).length
  const jitter = Math.round(randomValue * maxJitterMs)

  return baseDelayMs + charCount * perCharDelayMs + jitter
}

export function waitForDelay(delayMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs)
  })
}
