import { error, log } from '../../shared/logger'
import { BaseDetector, type DetectionInput, type DetectionMatch } from './detectors/BaseDetector'

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
      trigger: input.trigger ?? 'auto'
    }

    const aggregated: DetectionMatch[] = []
    const seen = new Set<string>()

    for (const detector of this.detectors) {
      try {
        const matches = await Promise.resolve(detector.detect(enrichedInput))
        if (matches.length === 0) {
          continue
        }

        for (const match of matches) {
          const key = `${detector.id}:${match.startIndex}:${match.endIndex}:${match.match}:$${match.entityType ?? 'unknown'}`
          if (seen.has(key)) {
            continue
          }
          seen.add(key)
          aggregated.push({ ...match, detectorId: match.detectorId ?? detector.id })
        }
      } catch (err) {
        error('Detector execution failed', {
          detectorId: detector.id,
          message: err instanceof Error ? err.message : String(err)
        })
      }
    }

    if (aggregated.length > 0) {
      log('DetectionEngine matches', {
        filterId: enrichedInput.context.filterId,
        fieldIndex: enrichedInput.context.fieldIndex,
        matches: aggregated
      })
    }

    return aggregated
  }
}
