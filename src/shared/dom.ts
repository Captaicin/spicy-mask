export interface ShadowOverlay {
  host: HTMLElement
  shadow: ShadowRoot
  updatePosition: () => void
  destroy: () => void
}

export const createOverlayShadow = (id: string): ShadowOverlay => {
  const host = document.createElement('div')
  host.id = id
  host.style.position = 'fixed'
  host.style.top = '0'
  host.style.left = '0'
  host.style.width = '0'
  host.style.height = '0'
  host.style.overflow = 'hidden'
  host.style.opacity = '0'
  host.style.pointerEvents = 'none'
  host.style.visibility = 'hidden'
  host.style.zIndex = '2147483647'

  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  return {
    host,
    shadow,
    updatePosition: () => {},
    destroy: () => {
      host.remove()
    }
  }
}
