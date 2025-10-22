import { GeminiDetector } from './GeminiDetector'
import { RegexDetector } from './RegexDetector'
import { UserRuleDetector } from './UserRuleDetector'

export const userRuleDetector = new UserRuleDetector()

export const defaultDetectors = [new RegexDetector(), new GeminiDetector(), userRuleDetector]
