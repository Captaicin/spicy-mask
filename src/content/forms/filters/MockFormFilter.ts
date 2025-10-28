import { FormFilter, FormElement } from '../FormFilter'

const MOCK_ATTRIBUTES = ['data-mock', 'data-test', 'data-testid'] as const

const includesMockyText = (value: string | null | undefined): boolean => {
  if (!value) {
    return false
  }
  return /mock|test|sample/i.test(value)
}

export class MockFormFilter extends FormFilter {
  constructor() {
    super({
      id: 'mock',
      label: 'Mock / test inputs',
      description:
        'Inputs flagged for mocks via data attributes, name, id, or placeholder.',
    })
  }

  matches(element: FormElement): boolean {
    for (const attribute of MOCK_ATTRIBUTES) {
      if (element.hasAttribute(attribute)) {
        return true
      }
    }

    if (includesMockyText(element.getAttribute('name'))) {
      return true
    }

    if (includesMockyText(element.getAttribute('id'))) {
      return true
    }

    if (includesMockyText(element.getAttribute('placeholder'))) {
      return true
    }

    return false
  }
}
