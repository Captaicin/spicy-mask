import type { DetectionContext, DetectionMatch } from '../detection/detectors/BaseDetector'
import { warn } from '../../shared/logger'

export class RichTextHighlighter {
  private readonly target: HTMLElement
  private highlightSpans: HTMLElement[] = []
  private observer: MutationObserver
  private readonly observerOptions: MutationObserverInit = {
    childList: true,
    subtree: true,
    characterData: true
  }

  constructor(target: HTMLElement, context: DetectionContext, callbacks: any) {
    this.target = target
    this.observer = new MutationObserver(this.handleMutation)
    this.observer.observe(this.target, this.observerOptions)
  }

  private handleMutation = (mutations: MutationRecord[]) => {
    let needsCleanup = false
    for (const mutation of mutations) {
      if (mutation.type === 'characterData' && !this.highlightSpans.includes(mutation.target.parentElement as HTMLElement)) {
        needsCleanup = true
        break
      }
      if (mutation.type === 'childList') {
        needsCleanup = true
        break
      }
    }

    if (needsCleanup) {
      this.destroyHighlights()
    }
  }

  public update(value: string, matches: DetectionMatch[]): void {
    const selection = document.getSelection()
    const savedRanges: Range[] = []
    if (selection && selection.rangeCount > 0 && this.target.contains(selection.anchorNode)) {
      for (let i = 0; i < selection.rangeCount; i++) {
        savedRanges.push(selection.getRangeAt(i).cloneRange())
      }
    }

    this.observer.disconnect()

    this.destroyHighlights()

    if (matches && matches.length > 0) {
      const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex)

      for (const match of sortedMatches) {
        const range = this.findRange(match.startIndex, match.endIndex)
        if (range) {
          try {
            const highlightSpan = document.createElement('span')
            highlightSpan.style.backgroundColor = 'rgba(252, 211, 77, 0.6)'
            highlightSpan.style.borderRadius = '3px'

            const contents = range.extractContents()
            highlightSpan.appendChild(contents)
            range.insertNode(highlightSpan)

            this.highlightSpans.push(highlightSpan)
          } catch (e) {
            warn('Failed to highlight match', { match, error: e })
          }
        }
      }
    }

    this.restoreSelection(savedRanges)

    this.observer.observe(this.target, this.observerOptions)
  }

  private findRange(start: number, end: number): Range | null {
    const walker = document.createTreeWalker(this.target, NodeFilter.SHOW_TEXT)
    let charCount = 0
    let startNode: Node | null = null
    let startOffset = 0
    let endNode: Node | null = null
    let endOffset = 0

    let currentNode: Node | null
    while ((currentNode = walker.nextNode())) {
      const nodeLength = currentNode.nodeValue?.length ?? 0
      const nodeEnd = charCount + nodeLength

      if (startNode === null && start >= charCount && start < nodeEnd) {
        startNode = currentNode
        startOffset = start - charCount
      }

      if (endNode === null && end > charCount && end <= nodeEnd) {
        endNode = currentNode
        endOffset = end - charCount
        break
      }

      charCount += nodeLength
    }

    if (startNode && endNode) {
      const range = document.createRange()
      try {
        range.setStart(startNode, startOffset)
        range.setEnd(endNode, endOffset)
        return range
      } catch (e) {
        warn('Failed to create range', { start, end, error: e })
        return null
      }
    }

    return null
  }

  private restoreSelection(ranges: Range[]): void {
    if (ranges.length > 0) {
      const selection = document.getSelection()
      if (selection) {
        selection.removeAllRanges()
        for (const range of ranges) {
          selection.addRange(range)
        }
      }
    }
  }

  private destroyHighlights(): void {
    if (this.highlightSpans.length === 0) {
      return
    }
    this.highlightSpans.forEach((span) => {
      const parent = span.parentNode
      if (parent) {
        const fragment = document.createDocumentFragment()
        while (span.firstChild) {
          fragment.appendChild(span.firstChild)
        }
        parent.replaceChild(fragment, span)
        parent.normalize()
      }
    })
    this.highlightSpans = []
  }

  public destroy(): void {
    this.observer.disconnect()
    this.destroyHighlights()
  }
}
