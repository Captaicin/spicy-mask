import { error, log } from '../../shared/logger'
import { BaseDetector, type DetectionInput } from './detectors/BaseDetector'
import type { DetectionMatch } from '../../shared/types'


export class DetectionEngine {
  private detectors: BaseDetector[]

  constructor(detectors: BaseDetector[] = []) {
    this.detectors = [...detectors]
  }

  setDetectors(detectors: BaseDetector[]): void {
    this.detectors = [...detectors]
  }

  addDetector(detector: BaseDetector): void {
    this.detectors.push(detector)
  }

  getDetectors(): BaseDetector[] {
    return [...this.detectors]
  }

  async run(input: DetectionInput): Promise<DetectionMatch[]> {
    const enrichedInput: DetectionInput = {
      ...input,
      trigger: input.trigger ?? 'auto',
    }

    // 1. Aggregate all matches from all detectors
    let allMatches: DetectionMatch[] = []
    for (const detector of this.detectors) {
      try {
        const matches = await Promise.resolve(detector.detect(enrichedInput))
        // Ensure detectorId is present on each match
        const matchesWithId = matches.map((m) => ({ ...m, detectorId: m.detectorId ?? detector.id }))
        allMatches.push(...matchesWithId)
      } catch (err) {
        error('Detector execution failed', {
          detectorId: detector.id,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    if (allMatches.length === 0) {
      return []
    }

    // 2. Sort all matches by priority (descending)
    allMatches.sort((a, b) => b.priority - a.priority)

    // 3. Resolve overlaps
    const finalMatches: DetectionMatch[] = []
    const isOverlapping = (matchA: DetectionMatch, matchB: DetectionMatch): boolean => {
      return (
        Math.max(matchA.startIndex, matchB.startIndex) <
        Math.min(matchA.endIndex, matchB.endIndex)
      )
    }

    for (const currentMatch of allMatches) {
      // Check if the current match overlaps with any of the already accepted final matches
      const hasOverlap = finalMatches.some((finalMatch) => isOverlapping(currentMatch, finalMatch))

      if (!hasOverlap) {
        finalMatches.push(currentMatch)
      }
    }

    // 4. Sort by startIndex (ascending)
    finalMatches.sort((a, b) => a.startIndex - b.startIndex)

    if (finalMatches.length > 0) {
      log('DetectionEngine matches', {
        filterId: enrichedInput.context.filterId,
        fieldIndex: enrichedInput.context.fieldIndex,
        matches: finalMatches,
      })
    }

    return finalMatches
  }
}
