import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { injectShadowRoot } from '../../shared/dom'
import { OVERLAY_ROOT_ID } from '../../shared/constants'
import RootApp from './Root'
import '../../styles/globals.css'

let root: Root | null = null
let container: HTMLElement | null = null

const ensureMounted = () => {
  if (!root || !container) {
    const shadow = injectShadowRoot(OVERLAY_ROOT_ID)
    container = shadow.getElementById('root') as HTMLElement | null

    if (!container) {
      container = document.createElement('div')
      container.id = 'root'
      shadow.appendChild(container)
    }

    container.style.display = 'none'

    root = createRoot(container)
    root.render(React.createElement(React.StrictMode, null, React.createElement(RootApp)))
  }
}

export const mountUI = () => {
  ensureMounted()
}

export const showUI = () => {
  ensureMounted()
  if (container) {
    container.style.display = 'block'
  }
}

export const hideUI = () => {
  if (container) {
    container.style.display = 'none'
  }
}

export const toggleUI = () => {
  ensureMounted()
  if (!container) {
    return
  }
  const shouldShow = container.style.display === 'none'
  container.style.display = shouldShow ? 'block' : 'none'
}
