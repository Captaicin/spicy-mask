import { log } from '../../../shared/logger'
import { BaseDetector, type DetectionInput, type DetectionMatch } from './BaseDetector'
import { requestGeminiScan } from './geminiClient'

export class GeminiDetector extends BaseDetector {
  constructor() {
    super({
      id: 'gemini-detector',
      label: 'Gemini detector',
      description:
        'Calls the background Gemini scan stub to detect structured secrets such as phone numbers or emails.'
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

    const matches = await requestGeminiScan(value)
    if (matches.length === 0) {
      return []
    }

    log('GeminiDetector remote matches', {
      filterId: input.context.filterId,
      fieldIndex: input.context.fieldIndex,
      count: matches.length
    })

    return matches.map((match) => ({
      detectorId: this.id,
      match: match.value,
      startIndex: match.startIndex,
      endIndex: match.endIndex,
      entityType: match.entityType,
      reason: match.reason ?? 'Detected by Gemini scan'
    }))
  }
}
