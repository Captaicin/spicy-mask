export * from './DetectionEngine'
export * from './detectors/index'

import { DetectionEngine } from './DetectionEngine'
import { defaultDetectors } from './detectors/index'

export const detectionEngine = new DetectionEngine(defaultDetectors)
