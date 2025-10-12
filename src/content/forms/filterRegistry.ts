import { FormFilter } from './FormFilter'
import { AllFormFilter, MockFormFilter, TextFormFilter } from './filters'

const FILTERS: FormFilter[] = [new AllFormFilter(), new TextFormFilter(), new MockFormFilter()]

export const getFilters = (): FormFilter[] => FILTERS

export const getFilterById = (id: string): FormFilter => {
  const found = FILTERS.find((filter) => filter.id === id)
  if (!found) {
    return FILTERS[0]
  }
  return found
}
