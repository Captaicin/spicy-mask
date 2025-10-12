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
