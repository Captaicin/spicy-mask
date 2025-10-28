import { onMessage } from '../shared/messaging'
import { maskValueWithMatches } from './masking/plainTextMasker'
import { maskContentEditableNodes } from './masking/contentEditableMasker'
import { getSelectionOffsets } from './selection'
import { extractTextWithMapping } from '../shared/dom'
import { DetectionMatch } from '../shared/types'

const handleMaskSelection = () => {
  const activeElement = document.activeElement as HTMLElement

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    const el = activeElement
    const { selectionStart, selectionEnd, value } = el
    if (
      selectionStart === null ||
      selectionEnd === null ||
      selectionStart === selectionEnd
    )
      return

    const match: DetectionMatch = {
      detectorId: 'user-selection',
      source: 'user',
      entityType: 'user_defined_pii',
      match: value.substring(selectionStart, selectionEnd),
      startIndex: selectionStart,
      endIndex: selectionEnd,
      priority: 100,
    }

    const { masked } = maskValueWithMatches(value, [match])
    el.value = masked
  } else if (activeElement.isContentEditable) {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (range.collapsed) return

    const { plainText, mappings } = extractTextWithMapping(activeElement)
    const offsets = getSelectionOffsets(range, mappings)

    if (!offsets || offsets.start === offsets.end) return

    const match: DetectionMatch = {
      detectorId: 'user-selection',
      source: 'user',
      entityType: 'user_defined_pii',
      match: plainText.substring(offsets.start, offsets.end),
      startIndex: offsets.start,
      endIndex: offsets.end,
      priority: 100,
    }

    maskContentEditableNodes([match], mappings)
  }
}

export const initContextMenuHandler = () => {
  onMessage((message) => {
    if (message.type === 'MASK_SELECTION') {
      handleMaskSelection()
    }
    // This listener is only for the context menu.
    // We return a resolved promise to not interfere with other listeners.
    return Promise.resolve({ ok: true })
  })
}
