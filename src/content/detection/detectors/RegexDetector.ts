import { log } from '../../../shared/logger'
import { BaseDetector, type DetectionInput, type DetectionMatch } from './BaseDetector'

export interface RegexDetectorOptions {
  pattern?: RegExp
}

export class RegexDetector extends BaseDetector {
  private readonly pattern: RegExp

  constructor(options: RegexDetectorOptions = {}) {
    super({
      id: 'regex-detector',
      label: 'Regex detector',
      description: 'Runs a configurable regular expression against input values.'
    })

    const rawPattern = options.pattern ?? /asdfas/g
    this.pattern = new RegExp(rawPattern.source, rawPattern.flags.includes('g') ? rawPattern.flags : `${rawPattern.flags}g`)
  }

  detect(input: DetectionInput): DetectionMatch[] {
    const value = input.value ?? ''
    if (!value) {
      return []
    }

    const matches: DetectionMatch[] = []
    this.pattern.lastIndex = 0

    let execResult = this.pattern.exec(value)
    while (execResult) {
      const matchText = execResult[0]
      const startIndex = execResult.index
      const endIndex = startIndex + matchText.length

      const match: DetectionMatch = {
        detectorId: this.id,
        match: matchText,
        startIndex,
        endIndex
      }

      matches.push(match)

      log('RegexDetector match', {
        filterId: input.context.filterId,
        fieldIndex: input.context.fieldIndex,
        startIndex,
        endIndex,
        pattern: this.pattern.toString()
      })

      execResult = this.pattern.exec(value)
    }

    return matches
  }
}
