import { formOverlayController } from './forms/FormOverlayController'
import { overlayConfig } from './filterConfig'
import { initContextMenuHandler } from './contextMenuHandler'

const init = () => {
  formOverlayController.init(overlayConfig)
  initContextMenuHandler()

  window.addEventListener('beforeunload', () => {
    formOverlayController.destroy()
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
