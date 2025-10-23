import type { FormOverlayConfig } from './forms/FormOverlayController'
// import { TextFormFilter } from './forms/filters'
// import { AllFormFilter } from './forms/filters/AllFormFilter'
import { LargeTextFormFilter } from './forms/filters'

// Swap this instance for another FormFilter (or a custom implementation) to change mirroring behaviour.
const injectedFilter = new LargeTextFormFilter()

export const overlayConfig: FormOverlayConfig = {
  filter: injectedFilter,
  enabled: true,
}
