import { error, log } from '../../shared/logger'
import { BaseDetector, type DetectionInput } from './detectors/BaseDetector'
import type { DetectionMatch } from '../../shared/types'

export class DetectionEngine {
  private detectors: BaseDetector[]
  private manualMatches: DetectionMatch[] = []
  private readonly MANUAL_DETECTOR_IDS = new Set(['gemini-detector'])
  private isRunning = false

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

  private isManualDetectorMatch = (match: DetectionMatch): boolean => {
    return this.MANUAL_DETECTOR_IDS.has(match.detectorId)
  }

  private remapManualMatches(text: string): DetectionMatch[] {
    const remapped: DetectionMatch[] = []
    for (const oldMatch of this.manualMatches) {
      const searchTerm = oldMatch.match
      if (!searchTerm) continue

      let currentIndex = -1
      while ((currentIndex = text.indexOf(searchTerm, currentIndex + 1)) !== -1) {
        remapped.push({
          ...oldMatch,
          startIndex: currentIndex,
          endIndex: currentIndex + searchTerm.length,
        })
      }
    }

    // Deduplicate the remapped matches to prevent exponential growth of the cache.
    const uniqueRemapped = new Map<number, DetectionMatch>()
    for (const match of remapped) {
      // Using startIndex as the key ensures that we only have one match per position.
      if (!uniqueRemapped.has(match.startIndex)) {
        uniqueRemapped.set(match.startIndex, match)
      }
    }

    return Array.from(uniqueRemapped.values())
  }

  async run(input: DetectionInput): Promise<DetectionMatch[]> {
    if (this.isRunning) {
      log('DetectionEngine is already running. Skipping this run.')
      return []
    }
    this.isRunning = true

    try {
      const enrichedInput: DetectionInput = {
        ...input,
        trigger: input.trigger ?? 'auto',
      }

      let allMatches: DetectionMatch[] = []

      if (enrichedInput.trigger === 'manual') {
        // Run ALL detectors for manual scan
        for (const detector of this.detectors) {
          try {
            const matches = await detector.detect(enrichedInput)
            const matchesWithId = matches.map((m) => ({
              ...m,
              detectorId: m.detectorId ?? detector.id,
            }))
            allMatches.push(...matchesWithId)
          } catch (err) {
            error('Detector execution failed', {
              detectorId: detector.id,
              message: err instanceof Error ? err.message : String(err),
            })
          }
        }
        // Cache the manual results from this run
        this.manualMatches = allMatches.filter(this.isManualDetectorMatch)
      } else if (enrichedInput.trigger === 'auto') {
        // Run only AUTOMATIC detectors
        const automaticDetectors = this.detectors.filter(
          (d) => !this.MANUAL_DETECTOR_IDS.has(d.id),
        )
        let automaticMatches: DetectionMatch[] = []
        for (const detector of automaticDetectors) {
          try {
            const matches = await detector.detect(enrichedInput)
            const matchesWithId = matches.map((m) => ({
              ...m,
              detectorId: m.detectorId ?? detector.id,
            }))
            automaticMatches.push(...matchesWithId)
          } catch (err) {
            error('Detector execution failed', {
              detectorId: detector.id,
              message: err instanceof Error ? err.message : String(err),
            })
          }
        }

        // Remap previously found manual matches to the new text
        const remappedManualMatches = this.remapManualMatches(
          enrichedInput.value,
        )
        // Update the cache with the remapped matches
        this.manualMatches = remappedManualMatches

        // Combine automatic and remapped manual matches
        allMatches = [...automaticMatches, ...remappedManualMatches]
      }

      if (allMatches.length === 0) {
        return []
      }

      // Sort all matches by priority (descending)
      allMatches.sort((a, b) => b.priority - a.priority)

      // Resolve overlaps
      const finalMatches: DetectionMatch[] = []
      const isOverlapping = (
        matchA: DetectionMatch,
        matchB: DetectionMatch,
      ): boolean => {
        return (
          Math.max(matchA.startIndex, matchB.startIndex) <
          Math.min(matchA.endIndex, matchB.endIndex)
        )
      }

      for (const currentMatch of allMatches) {
        // Check if the current match overlaps with any of the already accepted final matches
        const hasOverlap = finalMatches.some((finalMatch) =>
          isOverlapping(currentMatch, finalMatch),
        )

        if (!hasOverlap) {
          finalMatches.push(currentMatch)
        }
      }

      // Sort by startIndex (ascending)
      finalMatches.sort((a, b) => a.startIndex - b.startIndex)

      if (finalMatches.length > 0) {
        log('DetectionEngine matches', {
          filterId: enrichedInput.context.filterId,
          fieldIndex: enrichedInput.context.fieldIndex,
          matches: finalMatches,
        })
      }

      return finalMatches
    } finally {
      this.isRunning = false
    }
  }
}
