import type { FormElement } from './FormFilter'

const SELECTOR = 'input, textarea, select'

export class FormScanner {
  scan(root: Document | HTMLElement = document): FormElement[] {
    const scope = root instanceof Document ? root : root.ownerDocument ?? document
    const list = scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(SELECTOR)
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

    return false
  }
}
