import { error, log } from '../../../shared/logger'
import { BaseDetector, type DetectionInput } from './BaseDetector'
import type { RegexEntityType, DetectionMatch } from '../../../shared/types'
import { PII_PATTERNS, PII_PATTERN_ORDER, isValidLuhn } from './pii/piiPatterns'
import { parsePhoneNumberFromString } from 'libphonenumber-js/core'
import metadata from 'libphonenumber-js/metadata.min.json'

interface PiiCandidate {
  type: string
  entityType: RegexEntityType
  value: string
  startIndex: number
  endIndex: number
  priority: number
}

const MAX_CACHE_SIZE = 2000

const preprocessText = (text: string): string => {
  return text
    .normalize('NFKC')
    .replace(/[\u2000-\u200B\u202F\u205F\u00A0]/g, ' ')
    .replace(/[＋﹢]/g, '+')
    .replace(/[‐‒–—﹣]/g, '-')
    .trim()
}

const normalizePhoneKey = (value: string): string => {
  const preprocessed = preprocessText(value)
  const trimmed = preprocessed.trim()
  const mainPart = trimmed.split(/(?:ext\.?|extension|x|#|;ext=|,)\s*\d+/i)[0]
  const digits = mainPart.replace(/\D/g, '')
  return mainPart.startsWith('+') ? `+${digits}` : digits
}

export class RegexDetector extends BaseDetector {
  private validationCache = new Map<string, boolean>()

  constructor() {
    super({
      id: 'regex-detector',
      label: 'PII Regex Detector',
      description:
        'Detects various types of PII using prioritized regular expressions.',
    })
  }

  detect(input: DetectionInput): DetectionMatch[] {
    let value = input.value ?? ''
    if (!value) {
      return []
    }

    value = preprocessText(value)

    // --- Pre-calculate country list once ---
    const lang = chrome.i18n.getUILanguage()
    const langParts = lang.split('-')
    const browserCountry =
      langParts.length > 1
        ? langParts[langParts.length - 1].toUpperCase()
        : undefined
    const fallbackCountries = ['US', 'KR']
    const fallbackOnlyCountries = fallbackCountries.filter(
      (c) => c !== browserCountry,
    )

    // --- Find all regex candidates ---
    const allCandidates: PiiCandidate[] = []
    for (const piiKey of PII_PATTERN_ORDER) {
      const patternInfo = PII_PATTERNS[piiKey]
      if (!patternInfo) continue

      const { regex, label, entityType, priority } = patternInfo

      let match
      regex.lastIndex = 0
      while ((match = regex.exec(value)) !== null) {
        const matchedString = match[0]
        if (matchedString === '') continue

        allCandidates.push({
          type: label,
          entityType: entityType,
          value: matchedString,
          startIndex: match.index,
          endIndex: match.index + matchedString.length,
          priority: priority,
        })
      }
    }

    if (allCandidates.length === 0) {
      return []
    }

    // --- Sort candidates for correct overlap resolution ---
    allCandidates.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority
      const lengthA = a.endIndex - a.startIndex
      const lengthB = b.endIndex - b.startIndex
      if (lengthA !== lengthB) return lengthB - lengthA
      return a.startIndex - b.startIndex
    })

    // --- Filter and Validate Candidates ---
    const finalPii: PiiCandidate[] = []
    const occupiedRanges: { start: number; end: number }[] = []

    const isOccupied = (startIndex: number, endIndex: number) => {
      return occupiedRanges.some(
        (range) =>
          Math.max(startIndex, range.start) < Math.min(endIndex, range.end),
      )
    }

    for (const pii of allCandidates) {
      if (isOccupied(pii.startIndex, pii.endIndex)) {
        continue
      }

      if (pii.type === 'Credit Card' && !isValidLuhn(pii.value)) {
        continue
      }

      if (pii.entityType === 'phone_number') {
        // Heuristic 1: Block common date/timestamp formats
        const DATE_TIME_REGEX = new RegExp(
          [
            '(?:^|\\s)(\\d{4}[-/\\s](?:0?[1-9]|1[0-2])[-/\\s](?:0?[1-9]|[12]\\d|3[01])(?:[-/\\s]+\\d+)?)(?:$|\\s)',
            '(?:^|\\s)(0?[1-9]|[12]\\d|3[01])[-/\\s](0?[1-9]|1[0-2])[-/\\s]\\d{4}(?:$|\\s)',
            '(?:^|\\s)((19|20)\\d\\d(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01]))(?:$|\\s)',
            '(?:^|\\s)\\d{1,2}:\\d{1,2}(?::\\d{1,2})?(?:$|\\s)',
          ].join('|'),
        )

        if (DATE_TIME_REGEX.test(pii.value.trim())) {
          continue
        }

        const TIMESTAMP_REGEX = /\b(19|20)\d{2}(0[1-9]|1[0-2])[0-3]\d{4,}\b/
        if (TIMESTAMP_REGEX.test(pii.value.trim())) {
          continue
        }

        const normalizedKey = normalizePhoneKey(pii.value)
        if (!normalizedKey || /^\+\D*$/.test(normalizedKey)) {
          continue
        }

        // Heuristic 2: Exclude if the number of digits is too long
        const MAX_PHONE_DIGITS = 15
        const MIN_PHONE_DIGITS = 7
        const digits = normalizedKey.startsWith('+')
          ? normalizedKey.substring(1)
          : normalizedKey
        if (
          digits.length < MIN_PHONE_DIGITS ||
          digits.length > MAX_PHONE_DIGITS
        ) {
          continue
        }

        let isValid = false

        const check = (country?: string): boolean => {
          const cacheKey = `${country ?? 'ANY'}|${digits}`
          if (this.validationCache.has(cacheKey)) {
            const cachedValue = this.validationCache.get(cacheKey)!
            this.validationCache.delete(cacheKey)
            this.validationCache.set(cacheKey, cachedValue)
            return cachedValue
          }

          try {
            const phoneNumber = parsePhoneNumberFromString(
              pii.value,
              country as any,
              metadata,
            )
            const result = phoneNumber
              ? phoneNumber.isPossible() &&
                (typeof phoneNumber.isValid === 'function'
                  ? phoneNumber.isValid()
                  : true)
              : false

            if (this.validationCache.size >= MAX_CACHE_SIZE) {
              const oldestKey = this.validationCache.keys().next().value
              if (oldestKey) this.validationCache.delete(oldestKey)
            }
            this.validationCache.set(cacheKey, result)
            return result
          } catch (e) {
            error('libphonenumber-js parsing error', e)
            this.validationCache.set(cacheKey, false)
            return false
          }
        }

        // Strategy A: Check browser country
        if (browserCountry) {
          isValid = check(browserCountry)
        }
        // Strategy B: Check international format
        if (!isValid && /^\D*\+/.test(pii.value.trim())) {
          isValid = check() // No country
        }
        // Strategy C: Check fallbacks
        if (!isValid) {
          for (const country of fallbackOnlyCountries) {
            if (check(country)) {
              isValid = true
              break
            }
          }
        }

        if (!isValid) {
          continue
        }
      }

      finalPii.push(pii)
      occupiedRanges.push({ start: pii.startIndex, end: pii.endIndex })
    }

    // --- Format final matches ---
    const matches: DetectionMatch[] = finalPii.map((pii) => ({
      detectorId: this.id,
      source: 'regex',
      match: pii.value,
      startIndex: pii.startIndex,
      endIndex: pii.endIndex,
      entityType: pii.entityType,
      priority: pii.priority,
      reason: `Matched PII pattern for ${pii.type}.`,
    }))

    if (matches.length > 0) {
      log(`${this.label} matches found`, {
        filterId: input.context.filterId,
        fieldIndex: input.context.fieldIndex,
        count: matches.length,
      })
    }

    return matches.sort((a, b) => a.startIndex - b.startIndex)
  }
}
