import { FormFilter, FormElement } from '../FormFilter'

export class AllFormFilter extends FormFilter {
  constructor() {
    super({ id: 'all', label: 'All inputs', description: 'Include every input, textarea, and select element.' })
  }

  matches(_element: FormElement): boolean {
    return true
  }
}
