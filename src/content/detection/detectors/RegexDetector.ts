import { log } from '../../../shared/logger';
import { BaseDetector, type DetectionInput } from './BaseDetector';
import type { RegexEntityType, DetectionMatch } from '../../../shared/types'; 
import { PII_PATTERNS, PII_PATTERN_ORDER, isValidLuhn } from './pii/piiPatterns';

interface PiiCandidate {
  type: string;
  entityType: RegexEntityType;
  value: string;
  startIndex: number;
  endIndex: number;
  priority: number;
}

export class RegexDetector extends BaseDetector {
  constructor() {
    super({
      id: 'regex-detector',
      label: 'PII Regex Detector',
      description: 'Detects various types of PII using prioritized regular expressions.'
    });
  }

  detect(input: DetectionInput): DetectionMatch[] {
    const value = input.value ?? '';
    if (!value) {
      return [];
    }

    const allCandidates: PiiCandidate[] = [];
    for (const piiKey of PII_PATTERN_ORDER) {
      const patternInfo = PII_PATTERNS[piiKey];
      if (!patternInfo) continue;
      
      const { regex, label, entityType, priority } = patternInfo;
      
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(value)) !== null) {
        const matchedString = match[0];
        if (matchedString === '') continue;

        allCandidates.push({
          type: label,
          entityType: entityType,
          value: matchedString,
          startIndex: match.index,
          endIndex: match.index + matchedString.length,
          priority: priority,
        });
      }
    }

    if (allCandidates.length === 0) {
      return [];
    }

    const finalPii: PiiCandidate[] = [];
    const occupiedRanges: { start: number; end: number }[] = [];

    const isOccupied = (startIndex: number, endIndex: number) => {
      return occupiedRanges.some(range => 
        Math.max(startIndex, range.start) < Math.min(endIndex, range.end)
      );
    };

    for (const pii of allCandidates) {
      if (isOccupied(pii.startIndex, pii.endIndex)) {
        continue;
      }
      
      if (pii.type === 'Credit Card' && !isValidLuhn(pii.value)) {
        occupiedRanges.push({ start: pii.startIndex, end: pii.endIndex });
        continue;
      }

      finalPii.push(pii);
      occupiedRanges.push({ start: pii.startIndex, end: pii.endIndex });
    }
    
    const matches: DetectionMatch[] = finalPii.map(pii => ({
      detectorId: this.id,
      source: 'regex',
      match: pii.value,
      startIndex: pii.startIndex,
      endIndex: pii.endIndex,
      entityType: pii.entityType,
      priority: pii.priority,
      reason: `Matched PII pattern for ${pii.type}.`
    }));

    if (matches.length > 0) {
      log(`${this.label} matches found`, {
        filterId: input.context.filterId,
        fieldIndex: input.context.fieldIndex,
        count: matches.length
      });
    }
    
    return matches.sort((a, b) => a.startIndex - b.startIndex);
  }
}