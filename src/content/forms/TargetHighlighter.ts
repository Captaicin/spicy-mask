import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import TextHighlightOverlay from './TextHighlightOverlay'
import type { DetectionContext, DetectionMatch, DetectionTrigger } from '../detection/detectors/BaseDetector'

const joinPadding = (computed: CSSStyleDeclaration): string => {
  const top = computed.paddingTop || '0px'
  const right = computed.paddingRight || top
  const bottom = computed.paddingBottom || top
  const left = computed.paddingLeft || right
  return `${top} ${right} ${bottom} ${left}`
}

const isScrollableElement = (element: HTMLElement): element is HTMLElement & { scrollTop: number; scrollLeft: number } => {
  if (!(element instanceof HTMLElement)) {
    return false
  }
  const style = getComputedStyle(element)
  return /auto|scroll|overlay/i.test(style.overflow + style.overflowX + style.overflowY)
}

const getScrollableAncestors = (element: HTMLElement): HTMLElement[] => {
  const ancestors: HTMLElement[] = []
  let parent = element.parentElement
  while (parent) {
    if (isScrollableElement(parent)) {
      ancestors.push(parent)
    }
    parent = parent.parentElement
  }
  return ancestors
}

type TargetHighlighterCallbacks = {
  onMaskSegment?: (payload: { matches: DetectionMatch[]; context: DetectionContext }) => void
  onMaskAll?: (payload: { matches: DetectionMatch[]; context: DetectionContext }) => void
  onFocusMatch?: (payload: { match: DetectionMatch; context: DetectionContext }) => void
  onRequestScan?: () => void
}

export class TargetHighlighter {
  private readonly target: HTMLElement
  private readonly context: DetectionContext
  private readonly callbacks: TargetHighlighterCallbacks
  private readonly container: HTMLDivElement
  private readonly inner: HTMLDivElement
  private readonly root: Root
  private padding = '0px'
  private scrollTop = 0
  private scrollLeft = 0
  private clientWidth = 0
  private clientHeight = 0
  private mutationObserver: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private scrollableAncestors: HTMLElement[] = []
  private layoutRafId: number | null = null
  private updateRafId: number | null = null
  private destroyed = false
  private currentValue = ''
  private currentMatches: DetectionMatch[] = []
  private closeSignal = 0
  private hasValue = false
  private latestTrigger: DetectionTrigger = 'auto'
  private lastPiiDetails: { pii: DetectionMatch; rects: DOMRect[] }[] = []
  private layoutCheckInterval: number | null = null

  constructor(target: HTMLElement, context: DetectionContext, callbacks: TargetHighlighterCallbacks = {}) {
    this.target = target
    this.context = context
    this.callbacks = callbacks

    this.container = document.createElement('div')
    this.container.style.position = 'absolute'
    this.container.style.pointerEvents = 'none'
    this.container.style.top = '0'
    this.container.style.left = '0'
    this.container.style.overflow = 'hidden'
    this.container.style.display = 'none'

    this.inner = document.createElement('div')
    this.inner.style.position = 'relative'
    this.inner.style.width = '100%'
    this.inner.style.height = '100%'
    this.inner.style.boxSizing = 'border-box'

    this.container.appendChild(this.inner)
    document.body.appendChild(this.container)

    this.target.addEventListener('focusin', this.handleFocusChange, true)
    this.target.addEventListener('focusout', this.handleFocusChange, true)

    this.root = createRoot(this.inner)

    this.syncBaseStyles()
    this.updateLayout()
    this.attachObservers()
  }

  update(value: string, matches: DetectionMatch[], meta: { trigger?: DetectionTrigger } = {}): void {
    if (this.destroyed) {
      return
    }

    if (this.updateRafId) {
      cancelAnimationFrame(this.updateRafId)
    }

    this.updateRafId = requestAnimationFrame(() => {
      this.currentValue = value
      this.currentMatches = matches
      this.hasValue = typeof value === 'string' && value.length > 0
      this.latestTrigger = meta.trigger ?? 'auto'

      const hasMatches = Array.isArray(matches) && matches.length > 0

      if (!hasMatches && !this.hasValue) {
        this.container.style.display = 'none'
        return
      }

      this.container.style.display = 'block'
      this.syncBaseStyles()
      this.updateLayout()

      const isStandardInput =
        this.target.tagName.toLowerCase() === 'input' || this.target.tagName.toLowerCase() === 'textarea'

      const highlightRects: DOMRect[] = []
      const piiDetails = []

      for (const pii of this.currentMatches) {
        let rects: DOMRect[] = []
        if (isStandardInput) {
          rects = this._getRectsForInput(pii)
        } else {
          // This logic is from the user's reference code to handle newline differences in contenteditable
          const textBeforePii = this.currentValue.substring(0, pii.startIndex)
          const newlineCount = (textBeforePii.match(/\n/g) || []).length
          const correctedStartIndex = pii.startIndex - newlineCount
          const correctedEndIndex = pii.endIndex - newlineCount

          const ranges = this._findTextRanges(correctedStartIndex, correctedEndIndex)
          ranges.forEach((range) => {
            rects.push(...Array.from(range.getClientRects()))
          })
        }

        if (rects.length > 0) {
          piiDetails.push({ pii, rects })
          highlightRects.push(...rects)
        }
      }
      this.lastPiiDetails = piiDetails
      this.render()
    })
  }

  setCloseSignal(signal: number): void {
    if (this.destroyed) {
      return
    }
    if (this.closeSignal === signal) {
      return
    }
    this.closeSignal = signal
    this.render()
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }
    this.destroyed = true

    this.target.removeEventListener('focusin', this.handleFocusChange, true)
    this.target.removeEventListener('focusout', this.handleFocusChange, true)

    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null

    if (this.layoutCheckInterval) {
      window.clearInterval(this.layoutCheckInterval)
      this.layoutCheckInterval = null
    }

    window.removeEventListener('resize', this.requestLayoutUpdate, true)
    this.target.removeEventListener('scroll', this.handleTargetScroll, true)
    this.scrollableAncestors.forEach((el) => el.removeEventListener('scroll', this.requestLayoutUpdate, true))
    this.scrollableAncestors = []

    if (this.layoutRafId !== null) {
      cancelAnimationFrame(this.layoutRafId)
      this.layoutRafId = null
    }
    if (this.updateRafId !== null) {
      cancelAnimationFrame(this.updateRafId)
      this.updateRafId = null
    }

    this.root.unmount()
    this.container.remove()
  }

  private syncBaseStyles(): void {
    const computed = getComputedStyle(this.target)
    const targetZIndex = computed.zIndex
    let newZIndex: number
    if (targetZIndex === 'auto') {
      newZIndex = 1
    } else {
      const parsedZIndex = parseInt(targetZIndex, 10)
      if (!isNaN(parsedZIndex)) {
        newZIndex = parsedZIndex + 1
      } else {
        newZIndex = 1
      }
    }

    this.padding = joinPadding(computed)

    const style = this.inner.style
    style.font = computed.font
    style.lineHeight = computed.lineHeight
    style.letterSpacing = computed.letterSpacing
    style.whiteSpace = computed.whiteSpace
    style.wordBreak = computed.wordBreak
    style.wordWrap = computed.wordWrap
    style.textAlign = computed.textAlign
    style.textIndent = computed.textIndent
    style.textTransform = computed.textTransform
    style.wordSpacing = computed.wordSpacing
    style.boxSizing = computed.boxSizing
    style.direction = computed.direction
    style.tabSize = computed.tabSize

    const containerStyle = this.container.style
    containerStyle.zIndex = String(newZIndex)
    containerStyle.borderRadius = computed.borderRadius
    containerStyle.borderTopWidth = computed.borderTopWidth
    containerStyle.borderRightWidth = computed.borderRightWidth
    containerStyle.borderBottomWidth = computed.borderBottomWidth
    containerStyle.borderLeftWidth = computed.borderLeftWidth
    containerStyle.borderStyle = computed.borderStyle
    containerStyle.borderColor = computed.borderColor
    containerStyle.boxSizing = computed.boxSizing
  }

  private readonly handleTargetScroll = (): void => {
    this.scrollTop = this.target.scrollTop || 0
    this.scrollLeft = this.target.scrollLeft || 0
    this.requestRender()
  }

  private attachObservers(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.requestLayoutUpdate()
    })
    this.resizeObserver.observe(this.target)

    this.mutationObserver = new MutationObserver(() => {
      this.requestLayoutUpdate()
    })
    this.mutationObserver.observe(this.target, { attributes: true, attributeFilter: ['style', 'class'] })

    this.layoutCheckInterval = window.setInterval(() => {
      if (this.target.clientWidth !== this.clientWidth || this.target.clientHeight !== this.clientHeight) {
        this.requestLayoutUpdate()
      }
    }, 100)

    window.addEventListener('resize', this.requestLayoutUpdate, true)

    if (isScrollableElement(this.target)) {
      this.target.addEventListener('scroll', this.handleTargetScroll, true)
    }

    this.scrollableAncestors = getScrollableAncestors(this.target)
    this.scrollableAncestors.forEach((el) => el.addEventListener('scroll', this.requestLayoutUpdate, true))
  }

  private readonly requestLayoutUpdate = (): void => {
    if (this.destroyed) {
      return
    }
    if (this.layoutRafId !== null) {
      return
    }
    this.layoutRafId = requestAnimationFrame(() => {
      this.layoutRafId = null
      this.syncBaseStyles()
      this.updateLayout()
      this.requestRender()
    })
  }

  private requestRender(): void {
    if (this.destroyed || this.container.style.display === 'none') {
      return
    }
    this.render()
  }

  private updateLayout(): void {
    const rect = this.target.getBoundingClientRect()
    const doc = this.target.ownerDocument
    const view = doc?.defaultView ?? window
    const scrollX = view.pageXOffset ?? doc?.documentElement?.scrollLeft ?? 0
    const scrollY = view.pageYOffset ?? doc?.documentElement?.scrollTop ?? 0

    this.container.style.transform = `translate(${rect.left + scrollX}px, ${rect.top + scrollY}px)`
    this.container.style.width = `${rect.width}px`
    this.container.style.height = `${rect.height}px`
    this.clientWidth = this.target.clientWidth
    this.clientHeight = this.target.clientHeight

    const scrollParent = this.scrollableAncestors[0]
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect()
      const clipTop = Math.max(0, parentRect.top - rect.top)
      const clipLeft = Math.max(0, parentRect.left - rect.left)
      const clipBottom = Math.min(rect.height, parentRect.bottom - rect.top)
      const clipRight = Math.min(rect.width, parentRect.right - rect.left)

      if (clipBottom <= clipTop || clipRight <= clipLeft) {
        this.container.style.clipPath = 'inset(100%)'
      } else {
        this.container.style.clipPath = `inset(${clipTop}px ${rect.width - clipRight}px ${rect.height - clipBottom}px ${clipLeft}px)`
      }
    } else {
      this.container.style.clipPath = 'none'
    }
  }

  private render(): void {
    if (this.destroyed) {
      return
    }
    const showScanButton = this.hasValue || this.isTargetFocused()

    this.root.render(
      React.createElement(TextHighlightOverlay, {
        piiDetails: this.lastPiiDetails,
        containerRect: this.container.getBoundingClientRect(),
        target: this.target,
        context: this.context,
        onMaskSegment: this.callbacks.onMaskSegment,
        onMaskAll: this.callbacks.onMaskAll,
        onFocusMatch: this.callbacks.onFocusMatch,
        onRequestScan: this.callbacks.onRequestScan,
        closeSignal: this.closeSignal,
        showScanButton,
        latestTrigger: this.latestTrigger,
        allMatches: this.currentMatches
      })
    )
  }

  private readonly handleFocusChange = (): void => {
    if (this.destroyed) {
      return
    }
    if (!this.hasValue && this.currentMatches.length === 0) {
      this.container.style.display = this.isTargetFocused() ? 'block' : 'none'
    }
    this.requestRender()
  }

    private isTargetFocused(): boolean {

      if (document.activeElement === this.target) {

        return true

      }

      if (!this.target.shadowRoot) {

        return false

      }

      return this.target.shadowRoot.contains(document.activeElement)

    }

  

    private _findTextRanges(start: number, end: number): Range[] {

      const ranges = []

      const walker = document.createTreeWalker(this.target, NodeFilter.SHOW_TEXT)

      let charCount = 0

      let foundStart = false

      let startNode: Node | null = null

      let startOffset = 0

      let endNode: Node | null = null

      let endOffset = 0

  

      let currentNode

      while ((currentNode = walker.nextNode())) {

        const nodeLength = currentNode.textContent?.length ?? 0

        const prevCharCount = charCount

        charCount += nodeLength

  

        if (!foundStart && start < charCount) {

          startNode = currentNode

          startOffset = start - prevCharCount

          foundStart = true

        }

  

        if (foundStart && end <= charCount) {

          endNode = currentNode

          endOffset = end - prevCharCount

          const range = document.createRange()

          range.setStart(startNode as Node, startOffset)

          range.setEnd(endNode as Node, endOffset)

          ranges.push(range)

          return ranges

        }

      }

  

      if (foundStart) {

        const range = document.createRange()

        range.setStart(startNode as Node, startOffset)

        const lastNode = walker.currentNode ?? this.target.lastChild

        if (lastNode) {

          range.setEnd(lastNode, lastNode.textContent?.length ?? 0)

          ranges.push(range)

        }

      }

  

      return ranges

    }

  

    private _getRectsForInput(pii: { startIndex: number; endIndex: number }): DOMRect[] {

      const input = this.target as HTMLInputElement | HTMLTextAreaElement

      const { value, scrollLeft, scrollTop } = input

      const { startIndex, endIndex } = pii

  

      const twin = document.createElement('div')

      const styles = window.getComputedStyle(input)

  

      const twinStyles: Partial<CSSStyleDeclaration> = {

        position: 'absolute',

        visibility: 'hidden',

        pointerEvents: 'none',

        top: `${input.offsetTop}px`,

        left: `${input.offsetLeft}px`,

        width: `${input.clientWidth}px`,

        height: `${input.clientHeight}px`,

        overflow: 'auto',

        whiteSpace: styles.whiteSpace,

        wordWrap: styles.wordWrap,

        font: styles.font,

        padding: styles.padding,

        border: styles.border,

        letterSpacing: styles.letterSpacing,

        textTransform: styles.textTransform,

        lineHeight: styles.lineHeight,

        boxSizing: styles.boxSizing,

        direction: styles.direction,

        tabSize: styles.tabSize

      }

      Object.assign(twin.style, twinStyles)

  

      const textBefore = value.substring(0, startIndex)

      const piiText = value.substring(startIndex, endIndex)

      const textAfter = value.substring(endIndex)

  

      const textNodeBefore = document.createTextNode(textBefore)

      const span = document.createElement('span')

      span.textContent = piiText

      const textNodeAfter = document.createTextNode(textAfter)

  

      twin.appendChild(textNodeBefore)

      twin.appendChild(span)

      twin.appendChild(textNodeAfter)

  

      document.body.appendChild(twin)

      twin.scrollLeft = scrollLeft

      twin.scrollTop = scrollTop

  

      const piiRects = Array.from(span.getClientRects())

  

      document.body.removeChild(twin)

  

      return piiRects

    }

  }

  
