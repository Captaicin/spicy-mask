import { sendMessage } from '../shared/messaging'
import { DEFAULT_COLOR } from '../shared/constants'
import { log, warn } from '../shared/logger'
import { mountUI } from './ui/mount'

const highlightNodes = (color: string) => {
  const targets = document.querySelectorAll('p, span, div')
  targets.forEach((node) => {
    const element = node as HTMLElement
    element.style.outline = `2px dashed ${color}`
    element.style.outlineOffset = '4px'
  })
  log('Applied highlight to nodes', targets.length)
}

const init = async () => {
  try {
    const response = await sendMessage({ type: 'GET_COLOR' })
    const color = response.ok && typeof response.data === 'string' ? response.data : DEFAULT_COLOR
    highlightNodes(color)
  } catch (err) {
    warn('Failed to retrieve color, using default', err)
    highlightNodes(DEFAULT_COLOR)
  }

  mountUI()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
