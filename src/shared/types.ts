export type GeminiEntityType = 'phone_number' | 'email' | 'pattern_match'

export interface GeminiScanMatch {
  value: string
  startIndex: number
  endIndex: number
  entityType: GeminiEntityType
  reason?: string
}

export type Msg = { type: 'PING' } | { type: 'RUN_GEMINI_SCAN'; text: string }

export type MsgResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string }
