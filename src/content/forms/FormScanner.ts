import type { FormElement } from './FormFilter'

const SELECTOR = 'input, textarea, select, [contenteditable]'
const CONTENTEDITABLE_SELECTOR = '[contenteditable]'

export class FormScanner {
  scan(root: Document | HTMLElement = document): FormElement[] {
    const scope = root instanceof Document ? root : root.ownerDocument ?? document
    const list = scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement>(SELECTOR)
    return Array.from(list).filter((element) => this.isEligible(element))
  }

  private isEligible(element: Element): element is FormElement {
    if (element instanceof HTMLInputElement) {
      // Skip hidden elements and buttons.
      const type = element.type
      return type !== 'hidden' && type !== 'button' && type !== 'submit' && type !== 'reset'
    }

    if (element instanceof HTMLTextAreaElement) {
      return true
    }

    if (element instanceof HTMLSelectElement) {
      return true
    }

    if (element instanceof HTMLElement && element.matches(CONTENTEDITABLE_SELECTOR)) {
      if (!element.isContentEditable) {
        return false
      }
      const view = element.ownerDocument?.defaultView
      const computed = view?.getComputedStyle(element)
      if (!computed) {
        return true
      }
      return computed.display !== 'none' && computed.visibility !== 'hidden'
    }

    return false
  }
}
