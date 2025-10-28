import { log } from '../../../shared/logger'
import { BaseDetector, type DetectionInput } from './BaseDetector'
import type { DetectionMatch, GeminiApiResult } from '../../../shared/types'
import { requestGeminiPiiAnalysis } from './geminiClient'

export class GeminiDetector extends BaseDetector {
  constructor() {
    super({
      id: 'gemini-detector',
      label: 'Gemini detector',
      description:
        'Calls the background Gemini service to detect contextual PII such as names, addresses, or secrets.',
    })
  }

  async detect(input: DetectionInput): Promise<DetectionMatch[]> {
    if (input.trigger !== 'manual') {
      return []
    }

    const value = input.value ?? ''
    if (!value) {
      return []
    }

    // 1. Get raw PII suggestions from the background service
    const rawMatches: GeminiApiResult[] = await requestGeminiPiiAnalysis(value)
    if (rawMatches.length === 0) {
      return []
    }

    log('GeminiDetector raw matches received', {
      filterId: input.context.filterId,
      fieldIndex: input.context.fieldIndex,
      count: rawMatches.length,
    })

    // 2. Filter out masked PII and "Findall" logic
    const allMatches: DetectionMatch[] = []

    for (const item of rawMatches) {
      // Always process passwords. For other types, skip if they are already masked.
      if (item.is_masked && item.type.toLowerCase() !== 'password') {
        continue
      }

      const searchTerm = item.value
      if (!searchTerm) continue

      let currentIndex = -1
      while (
        (currentIndex = value.indexOf(searchTerm, currentIndex + 1)) !== -1
      ) {
        allMatches.push({
          detectorId: this.id,
          source: 'gemini',
          priority: 100, // Default priority for Gemini matches
          match: searchTerm,
          startIndex: currentIndex,
          endIndex: currentIndex + searchTerm.length,
          entityType: 'contextual_pii', // Hardcoded as per our type cleanup
          reason: item.reason,
        })
      }
    }

    return allMatches
  }
}
