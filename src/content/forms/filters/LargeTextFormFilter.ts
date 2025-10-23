import { FormFilter, FormElement } from '../FormFilter'

export type LargeTextFormFilterOptions = {
  includeHidden?: boolean
}

export class LargeTextFormFilter extends FormFilter {
  private readonly includeHidden: boolean

  constructor(options: LargeTextFormFilterOptions = {}) {
    super({
      id: 'large-text',
      label: 'Large text areas',
      description: 'Match large text inputs like comment fields or post bodies, excluding smaller fields like search or login.'
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
      // Exclude all input elements.
      return false
    }

    if (element instanceof HTMLTextAreaElement) {
      if (element.disabled || element.readOnly || this.isDisabledByAria(element)) {
        return false
      }
      // Include all valid textareas regardless of size.
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
