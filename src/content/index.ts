import { sendMessage } from '../shared/messaging'
import { DEFAULT_COLOR } from '../shared/constants'
import { warn } from '../shared/logger'
import type { Msg } from '../shared/types'
import { mountUI, showUI, hideUI, toggleUI } from './ui/mount'
import { formOverlayController } from './forms/FormOverlayController'

const overlayMessageHandler: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (
  message,
  _sender,
  sendResponse
) => {
  const typed = message as Msg
  if (!typed || typeof typed !== 'object' || !('type' in typed)) {
    return
  }

  switch (typed.type) {
    case 'SHOW_OVERLAY':
      showUI()
      sendResponse?.({ ok: true })
      break
    case 'HIDE_OVERLAY':
      hideUI()
      sendResponse?.({ ok: true })
      break
    case 'TOGGLE_OVERLAY':
      toggleUI()
      sendResponse?.({ ok: true })
      break
    default:
      break
  }
}

chrome.runtime.onMessage.addListener(overlayMessageHandler)

const init = async () => {
  let color = DEFAULT_COLOR

  try {
    const response = await sendMessage({ type: 'GET_COLOR' })
    if (response.ok && typeof response.data === 'string') {
      color = response.data
    }
  } catch (err) {
    warn('Failed to retrieve color, using default', err)
  }

  formOverlayController.init(color)
  mountUI()
  hideUI()

  window.addEventListener('beforeunload', () => {
    formOverlayController.destroy()
    hideUI()
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
