import { BaseDetector, type DetectionInput } from './BaseDetector'
import type { DetectionMatch } from '../../../shared/types'

export class UserRuleDetector extends BaseDetector {
  private rules: string[] = []

  constructor() {
    super({
      id: 'user-rule-detector',
      label: 'User-Defined Rule Detector',
      description: 'Detects patterns defined by the user.',
    })
  }

  public addRule(rule: string): void {
    if (rule && !this.rules.includes(rule)) {
      this.rules.push(rule)
    }
  }

  public removeRule(rule: string): void {
    this.rules = this.rules.filter((r) => r !== rule)
  }

  public getRules(): string[] {
    return [...this.rules]
  }

  public clearRules(): void {
    this.rules = []
  }

  detect(input: DetectionInput): DetectionMatch[] {
    const { value } = input
    if (!value || this.rules.length === 0) {
      return []
    }

    const allMatches: DetectionMatch[] = []

    for (const rule of this.rules) {
      const searchTerm = rule
      if (!searchTerm) continue

      let currentIndex = -1
      while (
        (currentIndex = value.indexOf(searchTerm, currentIndex + 1)) !== -1
      ) {
        allMatches.push({
          detectorId: this.id,
          source: 'user',
          entityType: 'user_defined_pii',
          priority: 200,
          match: searchTerm,
          startIndex: currentIndex,
          endIndex: currentIndex + searchTerm.length,
          reason: `Matched user-defined rule.`,
        })
      }
    }

    return allMatches
  }
}
