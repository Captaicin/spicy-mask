import { DEFAULT_COLOR } from '../../shared/constants'
import { log, warn } from '../../shared/logger'
import { FormFilter, FormElement } from './FormFilter'
import { FormMirrorManager } from './FormMirrorManager'
import { FormScanner } from './FormScanner'
import { getFilterById, getFilters } from './filterRegistry'

type Listener = (state: FormOverlayState) => void

type HighlightSnapshot = {
  outline: string
  outlineOffset: string
}

export type FormOverlayState = {
  enabled: boolean
  filterId: string
  filters: { id: string; label: string; description?: string }[]
  total: number
  filtered: number
}

export class FormOverlayController {
  private scanner = new FormScanner()
  private mirrorManager = new FormMirrorManager()
  private listeners = new Set<Listener>()
  private mutationObserver: MutationObserver | null = null
  private refreshQueued = false

  private filters = getFilters()
  private activeFilter: FormFilter = this.filters[0]
  private color: string = DEFAULT_COLOR
  private enabled = true
  private allElements: FormElement[] = []
  private filteredElements: FormElement[] = []
  private highlighted = new Set<FormElement>()
  private originalStyles = new WeakMap<FormElement, HighlightSnapshot>()

  init(color: string): void {
    this.color = color
    this.refresh()
    this.observeDom()
  }

  getColor(): string {
    return this.color
  }

  destroy(): void {
    this.mutationObserver?.disconnect()
    this.mirrorManager.dispose()
    this.clearHighlight()
    this.listeners.clear()
  }

  setColor(color: string): void {
    this.color = color
    log('FormOverlayController: setColor', { color })
    this.applyHighlight(this.filteredElements)
  }

  setEnabled(next: boolean): void {
    if (this.enabled === next) {
      return
    }

    this.enabled = next

    log('FormOverlayController: setEnabled', { enabled: this.enabled })

    if (!this.enabled) {
      this.mirrorManager.dispose()
      this.clearHighlight()
    } else {
      this.applyCurrentFilter()
    }

    this.emit()
  }

  setFilterById(id: string): void {
    const current = this.activeFilter
    const next = getFilterById(id)
    if (current.id === next.id) {
      return
    }

    this.activeFilter = next
    log('FormOverlayController: setFilterById', { filterId: id })
    this.applyCurrentFilter()
  }

  refresh(): void {
    try {
      this.allElements = this.scanner.scan()
      log('Scanned form elements', this.allElements.length)
    } catch (err) {
      warn('Failed to scan forms', err)
      this.allElements = []
    }

    this.applyCurrentFilter()
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => this.listeners.delete(listener)
  }

  getState(): FormOverlayState {
    return this.snapshot()
  }

  private applyCurrentFilter(): void {
    this.filteredElements = this.activeFilter.filter(this.allElements)

    if (this.enabled) {
      this.applyHighlight(this.filteredElements)
      this.mirrorManager.sync(this.filteredElements, this.activeFilter.id)
    } else {
      this.mirrorManager.dispose()
      this.clearHighlight()
    }

    log('FormOverlayController: applied filter state', {
      filterId: this.activeFilter.id,
      total: this.allElements.length,
      matches: this.filteredElements.length,
      enabled: this.enabled
    })

    this.emit()
  }

  private applyHighlight(elements: FormElement[]): void {
    const nextSet = new Set(elements)

    for (const element of this.highlighted) {
      if (!nextSet.has(element)) {
        this.restoreHighlight(element)
      }
    }

    elements.forEach((element) => {
      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, {
          outline: element.style.outline,
          outlineOffset: element.style.outlineOffset
        })
      }
      element.style.outline = `2px solid ${this.color}`
      element.style.outlineOffset = '2px'
      this.highlighted.add(element)
    })
  }

  private clearHighlight(): void {
    for (const element of this.highlighted) {
      this.restoreHighlight(element)
    }
    this.highlighted.clear()
  }

  private restoreHighlight(element: FormElement): void {
    const original = this.originalStyles.get(element)
    if (original) {
      element.style.outline = original.outline
      element.style.outlineOffset = original.outlineOffset
      this.originalStyles.delete(element)
    } else {
      element.style.outline = ''
      element.style.outlineOffset = ''
    }
    this.highlighted.delete(element)
  }

  private observeDom(): void {
    if (typeof MutationObserver === 'undefined') {
      return
    }

    this.mutationObserver = new MutationObserver(() => this.queueRefresh())
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['type', 'name', 'id', 'placeholder', 'data-mock', 'data-test', 'data-testid']
    })
  }

  private queueRefresh(): void {
    if (this.refreshQueued) {
      return
    }
    this.refreshQueued = true
    requestAnimationFrame(() => {
      this.refreshQueued = false
      this.refresh()
    })
  }

  private emit(): void {
    const snapshot = this.snapshot()
    this.listeners.forEach((listener) => listener(snapshot))
  }

  private snapshot(): FormOverlayState {
    return {
      enabled: this.enabled,
      filterId: this.activeFilter.id,
      filters: this.filters.map((filter) => ({
        id: filter.id,
        label: filter.label,
        description: filter.description
      })),
      total: this.allElements.length,
      filtered: this.filteredElements.length
    }
  }
}

export const formOverlayController = new FormOverlayController()
