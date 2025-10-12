import { FormFilter, FormElement } from '../FormFilter'

const TEXT_INPUT_TYPES = new Set([
  'text',
  'search',
  'email',
  'tel',
  'url',
  'password',
  'number'
])

export class TextFormFilter extends FormFilter {
  constructor() {
    super({
      id: 'text',
      label: 'Textual inputs',
      description: 'Match text-like inputs and textareas (e.g. text, email, password).'
    })
  }

  matches(element: FormElement): boolean {
    if (element instanceof HTMLTextAreaElement) {
      return true
    }

    if (element instanceof HTMLInputElement) {
      const type = element.type || 'text'
      return TEXT_INPUT_TYPES.has(type)
    }

    return false
  }
}
