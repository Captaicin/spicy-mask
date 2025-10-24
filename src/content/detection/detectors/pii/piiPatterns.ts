import type { RegexEntityType } from '../../../../shared/types';

export interface PiiPattern {
  regex: RegExp;
  label: string;
  entityType: RegexEntityType;
  priority: number;
}

export const PII_PATTERNS: Record<string, PiiPattern> = {
  CREDIT_CARD: {
    regex: /\b(?:3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5}|(?:4\d{3}|5[1-5]\d{2}|6011)[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g,
    label: 'Credit Card',
    entityType: 'credit_card_number',
    priority: 120,
  },
  SSN: {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    label: 'SSN',
    entityType: 'social_security_number',
    priority: 110,
  },
  EMAIL: {
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    label: 'Email',
    entityType: 'email',
    priority: 100,
  },
  PHONE_NUMBER_NAIVE: {
    regex: /(?<=(?:^|\s|:))[+(]?(?:\d[ \-().~;:–]*){7,15}\d\b/g,
    label: 'Phone Number',
    entityType: 'phone_number',
    priority: 90,
  },
};

export const PII_PATTERN_ORDER = Object.keys(PII_PATTERNS).sort(
  (a, b) => PII_PATTERNS[b].priority - PII_PATTERNS[a].priority
) as (keyof typeof PII_PATTERNS)[];

export function isValidLuhn(cardNumber: string): boolean {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }
  
  const digitsOnly = cardNumber.replace(/\D/g, '');
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return (sum % 10) === 0;
}