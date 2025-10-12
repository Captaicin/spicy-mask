import { sendMessage } from '../../../shared/messaging'
import { error } from '../../../shared/logger'
import type { GeminiEntityType, GeminiScanMatch, MsgResponse } from '../../../shared/types'

export type GeminiClientMatch = GeminiScanMatch

export const requestGeminiScan = async (text: string): Promise<GeminiClientMatch[]> => {
  try {
    const response: MsgResponse = await sendMessage({ type: 'RUN_GEMINI_SCAN', text })
    if (!response.ok) {
      error('Gemini scan failed', { message: response.error })
      return []
    }

    const payload = response.data as { matches?: GeminiClientMatch[] } | undefined
    if (!payload || !Array.isArray(payload.matches)) {
      return []
    }

    return payload.matches
      .map((match) => normalizeMatch(match))
      .filter((match): match is GeminiClientMatch => Boolean(match))
  } catch (err) {
    error('Gemini scan request threw', {
      message: err instanceof Error ? err.message : String(err)
    })
    return []
  }
}

const normalizeMatch = (match: unknown): GeminiClientMatch | null => {
  if (!match || typeof match !== 'object') {
    return null
  }

  const candidate = match as Partial<GeminiClientMatch>
  if (
    typeof candidate.value !== 'string' ||
    typeof candidate.startIndex !== 'number' ||
    typeof candidate.endIndex !== 'number' ||
    !isValidEntityType(candidate.entityType)
  ) {
    return null
  }

  return {
    value: candidate.value,
    startIndex: candidate.startIndex,
    endIndex: candidate.endIndex,
    entityType: candidate.entityType,
    reason: typeof candidate.reason === 'string' ? candidate.reason : undefined
  }
}

const isValidEntityType = (type: unknown): type is GeminiEntityType => {
  return type === 'phone_number' || type === 'email'
}
