import { TextNodeMapping } from '../shared/dom'

export function getSelectionOffsets(
  range: Range,
  mappings: TextNodeMapping[],
): { start: number; end: number } | null {
  let start = -1
  let end = -1

  const startMapping = mappings.find(m => m.node === range.startContainer)
  const endMapping = mappings.find(m => m.node === range.endContainer)

  if (startMapping) {
    start = startMapping.start + range.startOffset
  }

  if (endMapping) {
    end = endMapping.start + range.endOffset
  }

  if (start === -1 || end === -1) {
    return null
  }

  return { start, end }
}
