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

const init = () => {
  formOverlayController.init()
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
