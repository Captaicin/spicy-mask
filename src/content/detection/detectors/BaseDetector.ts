import type { FormElement } from '../../forms/FormFilter'

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

export interface DetectionInput {
  value: string
  context: DetectionContext
}

export interface DetectionMatch {
  detectorId: string
  match: string
  startIndex: number
  endIndex: number
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

  abstract detect(input: DetectionInput): DetectionMatch[]
}
