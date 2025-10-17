import type { RegexEntityType } from '../../../../shared/types';

export interface PiiPattern {
  regex: RegExp;
  label: string;
  entityType: RegexEntityType;
  priority: number;
}

export const PII_PATTERNS: Record<string, PiiPattern> = {
  CREDIT_CARD: {
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
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
  PHONE_NUMBER: {
    regex: /\b(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?)?\d{3,4}[-.\s]?\d{4}\b/g,
    label: 'Phone Number',
    entityType: 'phone_number',
    priority: 90,
  },
};

// export const PII_PATTERN_ORDER: (keyof typeof PII_PATTERNS)[] = [
//   'CREDIT_CARD', 
//   'SSN', 
//   'EMAIL', 
//   'PHONE_NUMBER'
// ];

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