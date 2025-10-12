import { GeminiDetector } from './GeminiDetector'
import { MockDetector } from './MockDetector'
import { RegexDetector } from './RegexDetector'

export const defaultDetectors = [new MockDetector(), new RegexDetector(), new GeminiDetector()]
