import type { FormOverlayConfig } from './forms/FormOverlayController'
import { TextFormFilter } from './forms/filters'
// import { AllFormFilter } from './forms/filters/AllFormFilter'

// Swap this instance for another FormFilter (or a custom implementation) to change mirroring behaviour.
const injectedFilter = new TextFormFilter()

export const overlayConfig: FormOverlayConfig = {
  filter: injectedFilter,
  enabled: true
}
