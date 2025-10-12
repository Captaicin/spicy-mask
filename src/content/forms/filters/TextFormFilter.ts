import { FormFilter, FormElement } from '../FormFilter'

export type TextFormFilterOptions = {
  includeHidden?: boolean
}

const ALLOWED_INPUT_TYPES = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number'
])

export class TextFormFilter extends FormFilter {
  private readonly includeHidden: boolean

  constructor(options: TextFormFilterOptions = {}) {
    super({
      id: 'text',
      label: 'Textual inputs',
      description:
        'Match typable content such as text inputs, textareas, contenteditable regions, and ARIA textboxes.'
    })

    this.includeHidden = options.includeHidden ?? false
  }

  matches(element: FormElement): boolean {
    if (!(element instanceof HTMLElement)) {
      return false
    }

    if (!element.isConnected) {
      return false
    }

    if (!this.includeHidden && this.isHidden(element)) {
      return false
    }

    if (element instanceof HTMLInputElement) {
      if (element.disabled || element.readOnly || this.isDisabledByAria(element)) {
        return false
      }

      const typeAttr = element.getAttribute('type')
      if (!typeAttr || typeAttr.trim() === '') {
        return true
      }

      const type = typeAttr.trim().toLowerCase()
      return ALLOWED_INPUT_TYPES.has(type)
    }

    if (element instanceof HTMLTextAreaElement) {
      if (element.disabled || element.readOnly || this.isDisabledByAria(element)) {
        return false
      }
      return true
    }

    if (element instanceof HTMLSelectElement) {
      return false
    }

    if (element.isContentEditable) {
      if (this.isDisabledByAria(element)) {
        return false
      }
      return true
    }

    const role = element.getAttribute('role')?.toLowerCase()
    if (role === 'textbox') {
      if (this.isDisabledByAria(element)) {
        return false
      }
      return true
    }

    return false
  }

  private isHidden(element: HTMLElement): boolean {
    if (element.hasAttribute('hidden')) {
      return true
    }

    const view = element.ownerDocument?.defaultView
    const style = view?.getComputedStyle(element)
    if (!style) {
      return false
    }
    return style.display === 'none' || style.visibility === 'hidden'
  }

  private isDisabledByAria(element: HTMLElement): boolean {
    const ariaDisabled = element.getAttribute('aria-disabled')
    if (ariaDisabled && ariaDisabled.toLowerCase() === 'true') {
      return true
    }
    const ariaReadonly = element.getAttribute('aria-readonly')
    if (ariaReadonly && ariaReadonly.toLowerCase() === 'true') {
      return true
    }
    return false
  }
}
