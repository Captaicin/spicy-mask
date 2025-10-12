import { log, warn } from '../../shared/logger'
import { FormFilter, FormElement } from './FormFilter'
import { FormMirrorManager } from './FormMirrorManager'
import { FormScanner } from './FormScanner'

export type FormOverlayConfig = {
  filter: FormFilter
  enabled?: boolean
  autoObserve?: boolean
}

export class FormOverlayController {
  private scanner = new FormScanner()
  private mirrorManager = new FormMirrorManager()
  private mutationObserver: MutationObserver | null = null
  private refreshQueued = false

  private filter: FormFilter | null = null
  private enabled = true

  private allElements: FormElement[] = []
  private filteredElements: FormElement[] = []

  init(config: FormOverlayConfig): void {
    this.filter = config.filter
    this.enabled = config.enabled ?? true

    if (config.autoObserve !== false) {
      this.observeDom()
    }

    this.refresh()
  }

  destroy(): void {
    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    this.mirrorManager.dispose()
    this.allElements = []
    this.filteredElements = []
    this.refreshQueued = false
    this.filter = null
  }

  setFilter(filter: FormFilter): void {
    this.filter = filter
    log('FormOverlayController: filter injected', { filterId: filter.id })
    this.refresh()
  }

  setEnabled(next: boolean): void {
    if (this.enabled === next) {
      return
    }

    this.enabled = next
    log('FormOverlayController: setEnabled', { enabled: this.enabled })

    if (!this.enabled) {
      this.mirrorManager.dispose()
    }

    this.refresh()
  }

  refresh(): void {
    const filter = this.filter

    if (!filter) {
      warn('FormOverlayController: refresh skipped because no filter is configured')
      this.mirrorManager.dispose()
      this.allElements = []
      this.filteredElements = []
      return
    }

    try {
      this.allElements = this.scanner.scan()
      log('FormOverlayController: scanned form elements', {
        total: this.allElements.length
      })
    } catch (err) {
      warn('FormOverlayController: failed to scan forms', err)
      this.allElements = []
    }

    this.filteredElements = filter.filter(this.allElements)

    if (this.enabled) {
      this.mirrorManager.sync(this.filteredElements, filter.id)
    } else {
      if (this.filteredElements.length > 0) {
        log('FormOverlayController: mirroring disabled, disposed current mirrors', {
          filtered: this.filteredElements.length
        })
      }
      this.mirrorManager.dispose()
    }

    log('FormOverlayController: refresh complete', {
      enabled: this.enabled,
      filterId: filter.id,
      total: this.allElements.length,
      filtered: this.filteredElements.length
    })
  }

  private observeDom(): void {
    if (typeof MutationObserver === 'undefined') {
      return
    }

    if (this.mutationObserver) {
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
}

export const formOverlayController = new FormOverlayController()
