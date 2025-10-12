import { log } from '../../../shared/logger'
import { BaseDetector, type DetectionInput, type DetectionMatch } from './BaseDetector'

const NEEDLE = 'asdfas'

export class MockDetector extends BaseDetector {
  constructor() {
    super({
      id: 'mock-detector',
      label: 'Mock detector',
      description: 'Detects a hard-coded token for demo and diagnostics.'
    })
  }

  detect(input: DetectionInput): DetectionMatch[] {
    const value = input.value ?? ''
    if (!value) {
      return []
    }

    const matches: DetectionMatch[] = []
    let index = value.indexOf(NEEDLE)

    while (index !== -1) {
      const endIndex = index + NEEDLE.length
      const match: DetectionMatch = {
        detectorId: this.id,
        match: NEEDLE,
        startIndex: index,
        endIndex
      }

      matches.push(match)

      log('MockDetector match', {
        filterId: input.context.filterId,
        fieldIndex: input.context.fieldIndex,
        startIndex: index,
        endIndex,
        snippet: value.slice(Math.max(0, index - 10), Math.min(value.length, endIndex + 10))
      })

      index = value.indexOf(NEEDLE, index + 1)
    }

    return matches
  }
}
