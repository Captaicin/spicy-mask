import type { FormOverlayConfig } from './forms/FormOverlayController'
import { AllFormFilter } from './forms/filters/AllFormFilter'

// Swap this instance for another FormFilter (or a custom implementation) to change mirroring behaviour.
const injectedFilter = new AllFormFilter()

export const overlayConfig: FormOverlayConfig = {
  filter: injectedFilter,
  enabled: true
}
