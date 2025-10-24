
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
          is_masked: { type: 'boolean' },
        },
        required: ['pii_type', 'pii_value', 'reason', 'is_masked'],
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

  const preprocessedText = text
    .trim()
    .replace(/(\r\n|\n){3,}/g, '\n\n')

  const prompt = `Role: You are a privacy expert. Your task is to identify PII that is **difficult to detect with simple patterns such as regex**.

Analyze the user's input for PII. For each piece of PII found, provide its type (e.g., "Full Name", "Password"), the exact value, and a brief reason for your decision.

For each item, you must also set a boolean 'is_masked' field. Follow these rules in order:
1. If the 'pii_type' is 'Password', you **must** set 'is_masked' to false.
2. For all other types, set 'is_masked' to true **only if** a significant portion of the value is replaced by masking characters (like '*', 'X', '#'), making it unreadable. (e.g., 'john.doe@*****.com' is masked, but 'User*s' is not).
3. If the above conditions are not met, set 'is_masked' to false.

If you find multiple instances of a valid PII type, return an object for each. Do not summarize.
Respond with a JSON object conforming to the schema.
---
SELECTED TEXT:
"${preprocessedText}"`

  const result = await executeLLMPrompt(prompt, PII_ANALYSIS_SCHEMA)

  if (!result || !result.contains_pii || !result.pii_items) {
    return []
  }

  // Map the raw LLM response to the shared GeminiApiResult type
  return result.pii_items.map((item: any) => ({
    value: item.pii_value,
    type: item.pii_type,
    reason: item.reason,
    is_masked: item.is_masked,
  }))
}
