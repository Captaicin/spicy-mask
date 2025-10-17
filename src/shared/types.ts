export type DetectorSource = 'regex' | 'gemini';

export type RegexEntityType = 
  | 'email'
  | 'phone_number'
  | 'credit_card_number'
  | 'social_security_number';

export type GeminiEntityType =
  | 'email'
  | 'phone_number'
  | 'contextual_pii';

interface BaseDetectionMatch {
  detectorId: string
  match: string
  startIndex: number
  endIndex: number
  reason?: string
  priority: number
}

interface RegexDetectionMatch extends BaseDetectionMatch {
  source: 'regex'
  entityType: RegexEntityType
}

interface GeminiDetectionMatch extends BaseDetectionMatch {
  source: 'gemini'
  entityType: GeminiEntityType
}

export type DetectionMatch = RegexDetectionMatch | GeminiDetectionMatch;

export interface GeminiApiResult {
  value: string
  startIndex: number
  endIndex: number
  entityType: GeminiEntityType
  reason?: string
}

export type Msg = 
  | { type: 'PING' } 
  | { type: 'RUN_GEMINI_SCAN'; payload: { text: string } };

export type MsgResponse =
  | { ok: true; data?: unknown | GeminiApiResult[] }
  | { ok: false; error: string }
