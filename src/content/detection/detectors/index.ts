import { GeminiDetector } from './GeminiDetector'
import { RegexDetector } from './RegexDetector'

export const defaultDetectors = [new RegexDetector(), new GeminiDetector()]
