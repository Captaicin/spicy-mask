export type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export interface FilterMetadata {
  id: string
  label: string
  description?: string
}

export abstract class FormFilter {
  readonly id: string
  readonly label: string
  readonly description?: string

  constructor(meta: FilterMetadata) {
    this.id = meta.id
    this.label = meta.label
    this.description = meta.description
  }

  abstract matches(element: FormElement): boolean

  filter(elements: FormElement[]): FormElement[] {
    return elements.filter((element) => this.matches(element))
  }
}
