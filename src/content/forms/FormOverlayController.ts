import { log, warn } from '../../shared/logger'
import { FormFilter, FormElement } from './FormFilter'
import { FormMirrorManager } from './FormMirrorManager'
import { FormScanner } from './FormScanner'
import { getFilterById, getFilters } from './filterRegistry'

type Listener = (state: FormOverlayState) => void

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
  private enabled = true
  private allElements: FormElement[] = []
  private filteredElements: FormElement[] = []

  init(): void {
    this.refresh()
    this.observeDom()
  }

  destroy(): void {
    this.mutationObserver?.disconnect()
    this.mirrorManager.dispose()
    this.listeners.clear()
  }

  setEnabled(next: boolean): void {
    if (this.enabled === next) {
      return
    }

    this.enabled = next

    log('FormOverlayController: setEnabled', { enabled: this.enabled })

    this.applyCurrentFilter()

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
      this.mirrorManager.sync(this.filteredElements, this.activeFilter.id)
    } else {
      this.mirrorManager.dispose()
      if (this.filteredElements.length > 0) {
        log('FormOverlayController: overlay disabled; mirrors cleared', {
          total: this.allElements.length
        })
      }
    }

    log('FormOverlayController: applied filter state', {
      filterId: this.activeFilter.id,
      total: this.allElements.length,
      matches: this.filteredElements.length,
      enabled: this.enabled
    })

    this.emit()
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
