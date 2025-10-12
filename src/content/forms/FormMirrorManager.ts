import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { createOverlayShadow, type ShadowOverlay } from '../../shared/dom'
import { MIRROR_OVERLAY_PREFIX } from '../../shared/constants'
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
    const nextSet = new Set(elements)

    for (const [element, instance] of this.mirrors) {
      if (!nextSet.has(element)) {
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
    })
  }

  dispose(): void {
    if (this.mirrors.size === 0) {
      return
    }

    for (const instance of this.mirrors.values()) {
      this.teardownInstance(instance)
    }
    this.mirrors.clear()
  }

  private createInstance(element: FormElement): MirrorInstance {
    const overlayId = `${MIRROR_OVERLAY_PREFIX}-${++this.counter}`
    const overlay = createOverlayShadow(overlayId)
    const container = document.createElement('div')
    overlay.shadow.appendChild(container)
    const root = createRoot(container)

    const render = (index: number, filterId: string) => {
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
    instance.root.unmount()
    instance.overlay.destroy()
  }
}
