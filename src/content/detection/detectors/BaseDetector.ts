import type { FormElement } from '../../forms/FormFilter'
import type { GeminiEntityType } from '../../../shared/types'

export interface DetectionMetadata {
  id: string
  label: string
  description?: string
}

export interface DetectionContext {
  element: FormElement
  filterId: string
  fieldIndex: number
}

export type DetectionTrigger = 'auto' | 'manual'

export interface DetectionInput {
  value: string
  context: DetectionContext
  trigger?: DetectionTrigger
}

export interface DetectionMatch {
  detectorId: string
  match: string
  startIndex: number
  endIndex: number
  entityType?: GeminiEntityType
  reason?: string
}

export abstract class BaseDetector {
  readonly id: string
  readonly label: string
  readonly description?: string

  constructor(meta: DetectionMetadata) {
    this.id = meta.id
    this.label = meta.label
    this.description = meta.description
  }

  abstract detect(input: DetectionInput): DetectionMatch[] | Promise<DetectionMatch[]>
}
