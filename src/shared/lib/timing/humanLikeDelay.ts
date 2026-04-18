const baseDelayMs = 1400
const perCharDelayMs = 280
const maxJitterMs = 900

export function computeHumanLikeDelay(
  content: string,
  randomValue = Math.random(),
  delayMultiplier = 1,
) {
  const charCount = Array.from(content).length
  const jitter = Math.round(randomValue * maxJitterMs)

  return (baseDelayMs + charCount * perCharDelayMs + jitter) * delayMultiplier
}

export function waitForDelay(delayMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs)
  })
}
