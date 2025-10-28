import type { DetectionMatch } from '../../shared/types'

export interface MaskOptions {
  maskChar?: string
}

const DEFAULT_MASK_CHAR = '*'

const clampMatch = (
  valueLength: number,
  match: DetectionMatch,
): DetectionMatch | null => {
  if (match.endIndex <= match.startIndex) {
    return null
  }
  const start = Math.max(0, Math.min(valueLength, match.startIndex))
  const end = Math.max(start, Math.min(valueLength, match.endIndex))
  if (start === end) {
    return null
  }
  if (start === match.startIndex && end === match.endIndex) {
    return match
  }
  return {
    ...match,
    startIndex: start,
    endIndex: end,
  }
}

export const maskValueWithMatches = (
  value: string,
  matches: DetectionMatch[],
  options: MaskOptions = {},
): { masked: string; changed: boolean } => {
  if (!value || matches.length === 0) {
    return { masked: value, changed: false }
  }

  const maskChar = options.maskChar ?? DEFAULT_MASK_CHAR
  const valid = matches
    .map((match) => clampMatch(value.length, match))
    .filter((match): match is DetectionMatch => Boolean(match))
    .sort((a, b) => a.startIndex - b.startIndex)

  if (valid.length === 0) {
    return { masked: value, changed: false }
  }

  let cursor = 0
  let changed = false
  let result = ''

  for (const match of valid) {
    const start = Math.max(cursor, match.startIndex)
    const end = Math.max(start, match.endIndex)
    if (end <= cursor) {
      continue
    }

    if (start > cursor) {
      result += value.slice(cursor, start)
    }

    const length = end - start
    result += maskChar.repeat(length)
    cursor = end
    changed = true
  }

  if (cursor < value.length) {
    result += value.slice(cursor)
  }

  return { masked: result, changed }
}
