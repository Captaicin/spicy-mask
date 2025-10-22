import { error, log } from '../../shared/logger'
import { BaseDetector, type DetectionInput } from './detectors/BaseDetector'
import type { DetectionMatch } from '../../shared/types'
import { UserRuleDetector } from './detectors/UserRuleDetector'

export class DetectionEngine {
  private detectors: BaseDetector[]
  private isRunning = false

  private geminiCache = new Map<string, { type: string, source: string, priority: number }>()
  private ignoredValues = new Set<string>()

  constructor(detectors: BaseDetector[] = []) {
    this.detectors = [...detectors]
  }

  // --- Public API for managing state ---

  public ignoreMatch(value: string): void {
    this.ignoredValues.add(value)
    log('Match value ignored', { value })
  }

  public unignoreMatch(value: string): void {
    this.ignoredValues.delete(value)
    log('Match value unignored', { value })
  }

  public addUserRule(pattern: string): void {
    const userDetector = this.detectors.find(
      (d): d is UserRuleDetector => d instanceof UserRuleDetector,
    )
    if (userDetector) {
      userDetector.addRule(pattern)
      log('User rule added', { pattern })
    } else {
      error('UserRuleDetector not found in engine')
    }
  }

  public removeUserRule(pattern: string): void {
    const userDetector = this.detectors.find(
      (d): d is UserRuleDetector => d instanceof UserRuleDetector,
    )
    if (userDetector) {
      userDetector.removeRule(pattern)
      log('User rule removed', { pattern })
    } else {
      error('UserRuleDetector not found in engine')
    }
  }

  public getIgnoredValues(): string[] {
    return Array.from(this.ignoredValues)
  }

  // --- Core detection logic ---

  async run(input: DetectionInput): Promise<DetectionMatch[]> {
    if (this.isRunning) {
      log('DetectionEngine is already running. Skipping this run.')
      return []
    }
    this.isRunning = true

    try {
      const enrichedInput: DetectionInput = {
        ...input,
        trigger: input.trigger ?? 'auto',
      }

      // 1. Create a temporary dictionary for this run, starting with cached results.
      const currentPiiDictionary = new Map(this.geminiCache)

      // 2. Run dynamic detectors (Regex, User Rules) and update the dictionary.
      const dynamicDetectors = this.detectors.filter(d => d.id !== 'gemini-detector')
      for (const detector of dynamicDetectors) {
        try {
          const matches = await detector.detect(enrichedInput);
          for (const match of matches) {
            // Add or overwrite with higher priority results from live detectors
            if (!currentPiiDictionary.has(match.match) || match.priority > (currentPiiDictionary.get(match.match)?.priority ?? -1)) {
                currentPiiDictionary.set(match.match, { type: match.entityType, source: match.source, priority: match.priority })
            }
          }
        } catch (err) {
          error('Detector execution failed', { detectorId: detector.id, message: String(err) })
        }
      }

      // 3. If manual trigger, run Gemini and update the cache.
      if (enrichedInput.trigger === 'manual') {
        const geminiDetector = this.detectors.find(d => d.id === 'gemini-detector')
        if (geminiDetector) {
          try {
            const matches = await geminiDetector.detect(enrichedInput);
            for (const match of matches) {
              // Add to both the current dictionary and the long-term cache
              const newMeta = { type: match.entityType, source: match.source, priority: match.priority }
              currentPiiDictionary.set(match.match, newMeta)
              this.geminiCache.set(match.match, newMeta)
            }
          } catch (err) {
            error('Detector execution failed', { detectorId: geminiDetector.id, message: String(err) })
          }
        }
      }

      // 4. Find all occurrences of all known PII from the dictionary
      let allFoundMatches: DetectionMatch[] = []
      for (const [value, meta] of currentPiiDictionary.entries()) {
        if (this.ignoredValues.has(value)) {
          continue;
        }

        let currentIndex = -1;
        while ((currentIndex = enrichedInput.value.indexOf(value, currentIndex + 1)) !== -1) {
          const match: DetectionMatch = {
            detectorId: meta.source,
            source: meta.source as any,
            entityType: meta.type as any,
            priority: meta.priority,
            match: value,
            startIndex: currentIndex,
            endIndex: currentIndex + value.length,
          }
          allFoundMatches.push(match)
        }
      }

      if (allFoundMatches.length === 0) {
        return []
      }

      // 5. Resolve overlaps
      allFoundMatches.sort((a, b) => b.priority - a.priority)
      const finalMatches: DetectionMatch[] = []
      const isOverlapping = (matchA: DetectionMatch, matchB: DetectionMatch): boolean => {
        return Math.max(matchA.startIndex, matchB.startIndex) < Math.min(matchA.endIndex, matchB.endIndex)
      }

      for (const currentMatch of allFoundMatches) {
        if (!finalMatches.some((finalMatch) => isOverlapping(currentMatch, finalMatch))) {
          finalMatches.push(currentMatch)
        }
      }

      // 6. Final sort and log
      finalMatches.sort((a, b) => a.startIndex - b.startIndex)

      if (finalMatches.length > 0) {
        log('DetectionEngine matches', {
          filterId: enrichedInput.context.filterId,
          fieldIndex: enrichedInput.context.fieldIndex,
          count: finalMatches.length,
        })
      }

      return finalMatches
    } finally {
      this.isRunning = false
    }
  }
}