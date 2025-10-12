import { formOverlayController } from './forms/FormOverlayController'
import { overlayConfig } from './filterConfig'

const init = () => {
  formOverlayController.init(overlayConfig)

  window.addEventListener('beforeunload', () => {
    formOverlayController.destroy()
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
