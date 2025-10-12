import { log } from '../../shared/logger'
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
  private hasLoggedInitialScan = false

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
    this.hasLoggedInitialScan = false
  }

  setFilter(filter: FormFilter): void {
    this.filter = filter
    this.hasLoggedInitialScan = false
    this.refresh()
  }

  setEnabled(next: boolean): void {
    if (this.enabled === next) {
      return
    }

    this.enabled = next

    if (!this.enabled) {
      this.mirrorManager.dispose()
    }

    this.refresh()
  }

  refresh(): void {
    const filter = this.filter

    if (!filter) {
      this.mirrorManager.dispose()
      this.allElements = []
      this.filteredElements = []
      return
    }

    try {
      this.allElements = this.scanner.scan()
    } catch (_err) {
      this.allElements = []
    }

    this.filteredElements = filter.filter(this.allElements)
    
    if (!this.hasLoggedInitialScan) {
      this.hasLoggedInitialScan = true
      log('Spicy Mask discovered form inputs',
        this.filteredElements.map((element) => ({
          tag: element.tagName.toLowerCase(),
          type: element instanceof HTMLInputElement ? element.type : undefined,
          name: element.getAttribute('name') ?? undefined,
          id: element.id || undefined
        }))
      )
    }

    if (this.enabled) {
      this.mirrorManager.sync(this.filteredElements, filter.id)
    } else {
      this.mirrorManager.dispose()
    }
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
