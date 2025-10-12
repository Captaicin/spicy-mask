import type { GeminiScanMatch } from '../shared/types'

const PHONE_TOKEN = '1234'
const EMAIL_TOKEN = 'qwer'
const SCAN_DELAY_MS = 3000

type EntityType = GeminiScanMatch['entityType']

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const scanGeminiEntities = async (text: string): Promise<GeminiScanMatch[]> => {
  await delay(SCAN_DELAY_MS)

  if (!text) {
    return []
  }

  return [
    ...gatherMatches(text, PHONE_TOKEN, 'phone_number'),
    ...gatherMatches(text, EMAIL_TOKEN, 'email')
  ]
}

const gatherMatches = (text: string, token: string, entityType: EntityType): GeminiScanMatch[] => {
  if (!token) {
    return []
  }

  const results: GeminiScanMatch[] = []
  let cursor = text.indexOf(token)

  while (cursor !== -1) {
    results.push({
      value: token,
      startIndex: cursor,
      endIndex: cursor + token.length,
      entityType
    })

    cursor = text.indexOf(token, cursor + 1)
  }

  return results
}
