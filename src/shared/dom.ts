export const injectShadowRoot = (id: string): ShadowRoot => {
  let container = document.getElementById(id)
  if (!container) {
    container = document.createElement('div')
    container.id = id
    container.style.all = 'initial'
    container.style.position = 'fixed'
    container.style.top = '16px'
    container.style.right = '16px'
    container.style.zIndex = '2147483647'
    document.body.appendChild(container)
  }

  return container.shadowRoot ?? container.attachShadow({ mode: 'open' })
}

export interface ShadowOverlay {
  host: HTMLElement
  shadow: ShadowRoot
  updatePosition: () => void
  destroy: () => void
}

export const createOverlayShadow = (target: HTMLElement, id: string): ShadowOverlay => {
  const host = document.createElement('div')
  host.id = id
  host.style.position = 'absolute'
  host.style.zIndex = '2147483647'
  host.style.minWidth = '200px'
  host.style.pointerEvents = 'none'
  host.style.visibility = 'hidden'
  host.style.opacity = '0'
  host.style.height = '0'

  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  const applyPosition = () => {
    const rect = target.getBoundingClientRect()
    host.style.top = `${rect.bottom + window.scrollY + 8}px`
    host.style.left = `${rect.left + window.scrollX}px`
    host.style.width = `${rect.width}px`
  }

  applyPosition()

  let resizeObserver: ResizeObserver | null = null
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => applyPosition())
    resizeObserver.observe(target)
  }

  const scrollHandler = () => applyPosition()
  window.addEventListener('scroll', scrollHandler, true)
  window.addEventListener('resize', scrollHandler)

  return {
    host,
    shadow,
    updatePosition: applyPosition,
    destroy: () => {
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', scrollHandler, true)
      window.removeEventListener('resize', scrollHandler)
      host.remove()
    }
  }
}
