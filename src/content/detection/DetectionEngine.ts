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

  run(input: DetectionInput): DetectionMatch[] {
    const aggregated: DetectionMatch[] = []

    for (const detector of this.detectors) {
      try {
        const matches = detector.detect(input)
        if (matches.length > 0) {
          aggregated.push(...matches)
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
        filterId: input.context.filterId,
        fieldIndex: input.context.fieldIndex,
        matches: aggregated
      })
    }

    return aggregated
  }
}
