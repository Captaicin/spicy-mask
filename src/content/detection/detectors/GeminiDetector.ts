import { log } from '../../../shared/logger'
import { BaseDetector, type DetectionInput, type DetectionMatch } from './BaseDetector'

const PLACEHOLDER_NEEDLE = 'asdfas'

export class GeminiDetector extends BaseDetector {
  constructor() {
    super({
      id: 'gemini-detector',
      label: 'Gemini detector',
      description:
        'Stub detector that will later call an external Gemini service. Currently mirrors the mock detector behaviour.'
    })
  }

  detect(input: DetectionInput): DetectionMatch[] {
    const value = input.value ?? ''
    if (!value) {
      return []
    }

    const matches: DetectionMatch[] = []
    let index = value.indexOf(PLACEHOLDER_NEEDLE)

    while (index !== -1) {
      const endIndex = index + PLACEHOLDER_NEEDLE.length
      const match: DetectionMatch = {
        detectorId: this.id,
        match: PLACEHOLDER_NEEDLE,
        startIndex: index,
        endIndex
      }

      matches.push(match)

      log('GeminiDetector match (stub)', {
        filterId: input.context.filterId,
        fieldIndex: input.context.fieldIndex,
        startIndex: index,
        endIndex
      })

      index = value.indexOf(PLACEHOLDER_NEEDLE, index + 1)
    }

    return matches
  }
}
