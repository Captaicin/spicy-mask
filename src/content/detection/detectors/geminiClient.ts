import { sendMessage } from '../../../shared/messaging'
import { error } from '../../../shared/logger'
import type { GeminiApiResult, MsgResponse } from '../../../shared/types'


export const requestGeminiPiiAnalysis = async (
  text: string,
): Promise<GeminiApiResult[]> => {
  try {
    const response: MsgResponse = await sendMessage({
      type: 'RUN_GEMINI_PII_ANALYSIS',
      payload: { text },
    })
    if (!response.ok) {
      const errorMessage =
        (response as any).error ?? 'Unknown error from background service'
      error('Gemini scan failed', { message: errorMessage })
      throw new Error(`Gemini scan failed: ${errorMessage}`)
    }

    // The data is expected to be GeminiApiResult[] now.
    const payload = response.data as GeminiApiResult[] | undefined
    if (!Array.isArray(payload)) {
      return []
    }

    return payload // Return the payload directly.
  } catch (err) {
    error('Gemini scan request threw', {
      message: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}
