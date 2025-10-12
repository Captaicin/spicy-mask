import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { createOverlayShadow, type ShadowOverlay } from '../../shared/dom'
import { log } from '../../shared/logger'
import type { FormElement } from './FormFilter'
import MirrorField from './MirrorField'

type MirrorInstance = {
  element: FormElement
  overlay: ShadowOverlay
  root: Root
  render: (index: number, filterId: string) => void
}

export class FormMirrorManager {
  private mirrors = new Map<FormElement, MirrorInstance>()
  private counter = 0

  sync(elements: FormElement[], filterId: string): void {
    log('FormMirrorManager: synchronising mirrors', {
      filterId,
      requested: elements.length
    })

    const nextSet = new Set(elements)

    for (const [element, instance] of this.mirrors) {
      if (!nextSet.has(element)) {
        log('FormMirrorManager: removing mirror', {
          overlayId: instance.overlay.host.id,
          tag: element.tagName,
          name: element.getAttribute('name') ?? null
        })
        this.teardownInstance(instance)
        this.mirrors.delete(element)
      }
    }

    elements.forEach((element, index) => {
      let instance = this.mirrors.get(element)
      if (!instance) {
        instance = this.createInstance(element)
        this.mirrors.set(element, instance)
      }
      instance.render(index, filterId)
      instance.overlay.updatePosition()
    })
  }

  dispose(): void {
    log('FormMirrorManager: disposing all mirrors', { count: this.mirrors.size })
    for (const instance of this.mirrors.values()) {
      this.teardownInstance(instance)
    }
    this.mirrors.clear()
  }

  private createInstance(element: FormElement): MirrorInstance {
    const overlayId = `spicy-mask-field-${++this.counter}`
    log('FormMirrorManager: creating mirror instance', {
      overlayId,
      tag: element.tagName,
      name: element.getAttribute('name') ?? null
    })
    const overlay = createOverlayShadow(element, overlayId)
    const container = document.createElement('div')
    overlay.shadow.appendChild(container)
    const root = createRoot(container)

    const render = (index: number, filterId: string) => {
      log('FormMirrorManager: rendering mirror field', {
        overlayId,
        index,
        filterId,
        value: element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
          ? element.value
          : element instanceof HTMLSelectElement
            ? element.value
            : null
      })
      root.render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(MirrorField, { target: element, index, filterId })
        )
      )
    }

    return { element, overlay, root, render }
  }

  private teardownInstance(instance: MirrorInstance): void {
    log('FormMirrorManager: tearing down mirror instance', {
      overlayId: instance.overlay.host.id,
      tag: instance.element.tagName,
      name: instance.element.getAttribute('name') ?? null
    })
    instance.root.unmount()
    instance.overlay.destroy()
  }
}
