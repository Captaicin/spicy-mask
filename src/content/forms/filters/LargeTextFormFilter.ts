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
      description:
        'Match large text inputs like comment fields or post bodies, excluding smaller fields like search or login.',
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
      if (
        element.disabled ||
        element.readOnly ||
        this.isDisabledByAria(element)
      ) {
        return false
      }
      // Include all valid textareas regardless of size.
      return true
    }

    if (element instanceof HTMLSelectElement) {
      return false
    }

    const role = element.getAttribute('role')?.toLowerCase()
    if (element.isContentEditable || role === 'textbox') {
      if (this.isDisabledByAria(element)) {
        return false
      }

      // For contenteditable elements, we need to be careful not to match
      // rich text editors (like Notion, Google Docs).
      // We use a few heuristics to decide if it's a form-like input.

      // 1. It's inside a <form> element.
      if (element.closest('form')) {
        return true
      }

      // 2. It has a "textbox" role. This is a strong signal.
      if (role === 'textbox') {
        return true
      }

      // 3. It has an associated <label> element.
      const labels = (element as HTMLInputElement).labels
      if (labels && labels.length > 0) {
        return true
      }
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
