/**
 * Soft ETA from content-match rate (sliding window).
 */

/** One matched-count sample for ETA estimation. */
export interface EtaSample {
  readonly atMs: number
  readonly matched: number
}

const WINDOW_MS = 3_000

/**
 * Estimate whole seconds remaining until `limitPerKind` matches.
 * Returns undefined when the signal is too weak.
 * @param samples - chronological matched samples
 * @param limitPerKind - hit ceiling for the content leg
 * @param nowMs - current time (usually last sample time)
 */
export function estimateEtaSec(
  samples: readonly EtaSample[],
  limitPerKind: number,
  nowMs: number,
): number | undefined {
  const windowStart = nowMs - WINDOW_MS
  const inWindow = samples.filter(s => s.atMs >= windowStart && s.atMs <= nowMs)
  if (inWindow.length < 2) return undefined
  const first = inWindow[0]!
  const last = inWindow[inWindow.length - 1]!
  if (last.matched <= 0) return undefined
  const dtSec = (last.atMs - first.atMs) / 1000
  if (dtSec <= 0) return undefined
  const rate = (last.matched - first.matched) / dtSec
  if (rate <= 0) return undefined
  const remaining = Math.max(0, limitPerKind - last.matched)
  if (remaining === 0) return 0
  return Math.ceil(remaining / rate)
}
