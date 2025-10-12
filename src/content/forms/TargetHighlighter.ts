import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import TextHighlightOverlay from './TextHighlightOverlay'
import type { DetectionMatch } from '../detection'

const MAX_Z_INDEX = '2147483646'

const joinPadding = (computed: CSSStyleDeclaration): string => {
  const top = computed.paddingTop || '0px'
  const right = computed.paddingRight || top
  const bottom = computed.paddingBottom || top
  const left = computed.paddingLeft || right
  return `${top} ${right} ${bottom} ${left}`
}

const isScrollableElement = (element: HTMLElement): element is HTMLElement & { scrollTop: number; scrollLeft: number } => {
  const style = getComputedStyle(element)
  return /auto|scroll|overlay/i.test(style.overflow + style.overflowX + style.overflowY)
}

export class TargetHighlighter {
  private readonly target: HTMLElement
  private readonly container: HTMLDivElement
  private readonly inner: HTMLDivElement
  private readonly root: Root
  private padding = '0px'
  private scrollTop = 0
  private scrollLeft = 0
  private resizeObserver: ResizeObserver | null = null
  private rafId: number | null = null
  private destroyed = false
  private currentValue = ''
  private currentMatches: DetectionMatch[] = []
  private whiteSpace: React.CSSProperties['whiteSpace'] = 'pre-wrap'
  private wordBreak: React.CSSProperties['wordBreak'] = 'break-word'

  constructor(target: HTMLElement) {
    this.target = target

    this.container = document.createElement('div')
    this.container.style.position = 'absolute'
    this.container.style.pointerEvents = 'none'
    this.container.style.top = '0'
    this.container.style.left = '0'
    this.container.style.zIndex = MAX_Z_INDEX
    this.container.style.display = 'none'

    this.inner = document.createElement('div')
    this.inner.style.position = 'relative'
    this.inner.style.width = '100%'
    this.inner.style.height = '100%'

    this.container.appendChild(this.inner)
    document.body.appendChild(this.container)

    this.root = createRoot(this.inner)

    this.syncBaseStyles()
    this.updateLayout()
    this.attachObservers()
  }

  update(value: string, matches: DetectionMatch[]): void {
    if (this.destroyed) {
      return
    }

    this.currentValue = value
    this.currentMatches = matches

    if (!matches || matches.length === 0) {
      this.container.style.display = 'none'
      return
    }

    this.container.style.display = 'block'
    this.syncBaseStyles()
    this.updateLayout()
    this.scrollTop = this.target.scrollTop
    this.scrollLeft = this.target.scrollLeft

    this.render()
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }
    this.destroyed = true

    this.resizeObserver?.disconnect()
    this.resizeObserver = null

    window.removeEventListener('scroll', this.requestLayoutUpdate, true)
    window.removeEventListener('resize', this.requestLayoutUpdate, true)
    this.target.removeEventListener('scroll', this.handleTargetScroll, true)

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.root.unmount()
    this.container.remove()
  }

  private syncBaseStyles(): void {
    const computed = getComputedStyle(this.target)
    this.padding = joinPadding(computed)

    const isMultiline = this.target instanceof HTMLTextAreaElement || this.target.isContentEditable
    this.whiteSpace = isMultiline ? 'pre-wrap' : 'pre'
    this.wordBreak = isMultiline ? 'break-word' : 'normal'

    this.inner.style.font = computed.font
    this.inner.style.letterSpacing = computed.letterSpacing
    this.inner.style.lineHeight = computed.lineHeight
    this.inner.style.whiteSpace = this.whiteSpace ?? 'pre-wrap'
    this.inner.style.wordBreak = this.wordBreak ?? 'break-word'
    this.inner.style.textAlign = computed.textAlign
    this.container.style.borderRadius = computed.borderRadius
  }

  private readonly handleTargetScroll = (): void => {
    this.scrollTop = this.target.scrollTop
    this.scrollLeft = this.target.scrollLeft
    this.requestRender()
  }

  private attachObservers(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.syncBaseStyles()
      this.updateLayout()
      this.requestRender()
    })
    this.resizeObserver.observe(this.target)

    window.addEventListener('scroll', this.requestLayoutUpdate, true)
    window.addEventListener('resize', this.requestLayoutUpdate, true)

    if (isScrollableElement(this.target)) {
      this.target.addEventListener('scroll', this.handleTargetScroll, true)
    }
  }

  private readonly requestLayoutUpdate = (): void => {
    if (this.destroyed) {
      return
    }
    if (this.rafId !== null) {
      return
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      this.updateLayout()
      this.requestRender()
    })
  }

  private requestRender(): void {
    if (this.destroyed || this.container.style.display === 'none' || this.currentMatches.length === 0) {
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
  }

  private render(): void {
    if (this.destroyed || this.currentMatches.length === 0) {
      return
    }
    this.root.render(
      React.createElement(TextHighlightOverlay, {
        value: this.currentValue,
        matches: this.currentMatches,
        padding: this.padding,
        scrollTop: this.scrollTop,
        scrollLeft: this.scrollLeft,
        whiteSpace: this.whiteSpace,
        wordBreak: this.wordBreak
      })
    )
  }
}
