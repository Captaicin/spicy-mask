import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { injectShadowRoot } from '../../shared/dom'
import RootApp from './Root'
import '../../styles/globals.css'

let root: Root | null = null

export const mountUI = () => {
  const shadow = injectShadowRoot('spicy-mask-root')
  let container = shadow.getElementById('root') as HTMLElement | null

  if (!container) {
    container = document.createElement('div')
    container.id = 'root'
    shadow.appendChild(container)
  }

  if (!root) {
    root = createRoot(container)
  }

  root.render(React.createElement(RootApp))
}
