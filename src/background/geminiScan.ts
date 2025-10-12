import { log } from '../shared/logger'
import type { GeminiScanMatch } from '../shared/types'

const PHONE_TOKEN = '1234'
const EMAIL_TOKEN = 'qwer'

type EntityType = GeminiScanMatch['entityType']

export const scanGeminiEntities = (text: string): GeminiScanMatch[] => {
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
  log(results)
  return results
}
