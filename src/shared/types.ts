// Global types for browser-provided APIs
declare global {
  interface LanguageModel {
    prompt(
      prompt: string,
      options: { responseConstraint: object },
    ): Promise<string>;
  }
  const LanguageModel: {
    create(): Promise<LanguageModel>;
  };
}

export type DetectorSource = 'regex' | 'gemini' | 'user';

export type RegexEntityType =
  | 'email'
  | 'phone_number'
  | 'credit_card_number'
  | 'social_security_number';

export type GeminiEntityType = 'email' | 'phone_number' | 'contextual_pii';

export type UserEntityType = 'user_defined_pii';

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

interface UserDetectionMatch extends BaseDetectionMatch {
  source: 'user'
  entityType: UserEntityType
}

export type DetectionMatch =
  | RegexDetectionMatch
  | GeminiDetectionMatch
  | UserDetectionMatch

export interface GeminiApiResult {
  value: string
  type: string
  reason: string
}

export type Msg = 
  | { type: 'PING' } 
  | { type: 'RUN_GEMINI_PII_ANALYSIS'; payload: { text: string } };

export type MsgResponse =
  | { ok: true; data?: unknown | GeminiApiResult[] }
  | { ok: false; error: string }
