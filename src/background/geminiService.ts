
import { GeminiApiResult } from '../shared/types'


const PII_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    contains_pii: {
      type: 'boolean',
    },
    pii_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pii_type: { type: 'string' },
          pii_value: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['pii_type', 'pii_value', 'reason'],
      },
    },
  },
  required: ['contains_pii'],
}

let model: LanguageModel | null = null

async function getModel(): Promise<LanguageModel> {
  if (!model) {
    console.log('[Spicy Mask] AI 모델을 생성합니다.')
    model = await LanguageModel.create()
  }
  return model
}

async function executeLLMPrompt(
  prompt: string,
  schema: object,
): Promise<any | null> {
  try {
    const activeModel = await getModel()
    console.log('🤖 [Gemini Request] Prompt:', prompt)
    const resultStr = await activeModel.prompt(prompt, {
      responseConstraint: schema,
    })
    console.log('🤖 [Gemini Response] Raw Result:', resultStr)
    return JSON.parse(resultStr)
  } catch (error) {
    console.error('Gemini Execution or Parsing Error:', error)
    return null
  }
}

export async function runPiiAnalysis(
  text: string,
): Promise<GeminiApiResult[]> {
  const prompt = `Role: You are a privacy expert. Your task is to identify PII that is difficult to detect with simple patterns.
Your primary focus is on types like:
- Full Names
- Physical Addresses
- Potential Passwords or secret keys

Analyze the user's input for PII. For each piece of PII found, provide its type (e.g., "Full Name"), the exact value, and a brief reason for your decision.
If you find multiple instances of a valid PII type (e.g., two different passwords), return an object for each. Do not summarize.
Respond with a JSON object conforming to the schema.
---
SELECTED TEXT:
"${text}"`

  const result = await executeLLMPrompt(prompt, PII_ANALYSIS_SCHEMA)

  if (!result || !result.contains_pii || !result.pii_items) {
    return []
  }

  // Map the raw LLM response to the shared GeminiApiResult type
  return result.pii_items.map((item: any) => ({
    value: item.pii_value,
    type: item.pii_type,
    reason: item.reason,
  }))
}
