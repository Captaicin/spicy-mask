import type { FormElement } from './FormFilter'
import { uiContainerRegistry } from '../uiRegistry'

const SELECTOR = 'input, textarea, select, [contenteditable]'
const CONTENTEDITABLE_SELECTOR = '[contenteditable]'

export class FormScanner {
  scan(root: Document | HTMLElement = document): FormElement[] {
    const scope = root instanceof Document ? root : root.ownerDocument ?? document
    const list = scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement>(SELECTOR)
    return Array.from(list).filter((element) => this.isEligible(element))
  }

  private isEligible(element: Element): element is FormElement {
    // Do not scan elements that are part of our own UI.
    for (const container of uiContainerRegistry) {
      if (container.contains(element)) {
        return false
      }
    }

    if (element instanceof HTMLInputElement) {
      // Skip hidden elements and buttons.
      const type = element.type
      return type !== 'hidden' && type !== 'button' && type !== 'submit' && type !== 'reset'
    }

    if (element instanceof HTMLTextAreaElement) {
      return true
    }

    if (element instanceof HTMLSelectElement) {
      // Only include single-line selects to mimic text choice; skip multi-selects for simplicity.
      return !element.multiple
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
      if (computed.display === 'none' || computed.visibility === 'hidden') {
        return false
      }
      
      // Skip contenteditable regions that disable text input via user-modify or pointer events.
      const userModify = computed?.getPropertyValue('-webkit-user-modify').trim()
      if (userModify && userModify === 'read-only') {
        return false
      }
      return computed.pointerEvents !== 'none'
    }

    return false
  }
}
