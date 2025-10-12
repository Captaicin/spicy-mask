import React, { useMemo } from 'react'
import type { DetectionMatch } from '../detection/detectors/BaseDetector'

type HighlightOverlayProps = {
  value: string
  matches: DetectionMatch[]
  padding: string | number
  scrollTop: number
  scrollLeft: number
  whiteSpace?: React.CSSProperties['whiteSpace']
  wordBreak?: React.CSSProperties['wordBreak']
}

type Segment = {
  text: string
  highlight: boolean
}

const HIGHLIGHT_COLOR = 'rgba(252, 211, 77, 0.6)'

const normalizeMatches = (matches: DetectionMatch[]): Array<Pick<DetectionMatch, 'startIndex' | 'endIndex'>> => {
  if (matches.length === 0) {
    return []
  }

  const sorted = [...matches]
    .filter((match) => match.startIndex < match.endIndex)
    .sort((a, b) => a.startIndex - b.startIndex)

  if (sorted.length === 0) {
    return []
  }

  const merged: Array<Pick<DetectionMatch, 'startIndex' | 'endIndex'>> = []

  for (const current of sorted) {
    const last = merged[merged.length - 1]
    if (!last) {
      merged.push({ startIndex: current.startIndex, endIndex: current.endIndex })
      continue
    }

    if (current.startIndex <= last.endIndex) {
      last.endIndex = Math.max(last.endIndex, current.endIndex)
    } else {
      merged.push({ startIndex: current.startIndex, endIndex: current.endIndex })
    }
  }

  return merged
}

const buildSegments = (value: string, matches: DetectionMatch[]): Segment[] => {
  if (!value) {
    return [{ text: '\u200b', highlight: false }]
  }

  const merged = normalizeMatches(matches)

  if (merged.length === 0) {
    return [{ text: value || '\u200b', highlight: false }]
  }

  const segments: Segment[] = []
  let cursor = 0

  for (const match of merged) {
    if (match.startIndex > cursor) {
      segments.push({ text: value.slice(cursor, match.startIndex), highlight: false })
    }

    const slice = value.slice(match.startIndex, match.endIndex)
    segments.push({ text: slice || '\u200b', highlight: true })
    cursor = match.endIndex
  }

  if (cursor < value.length) {
    segments.push({ text: value.slice(cursor), highlight: false })
  }

  return segments.length > 0 ? segments : [{ text: '\u200b', highlight: false }]
}

const TextHighlightOverlay: React.FC<HighlightOverlayProps> = ({
  value,
  matches,
  padding,
  scrollTop,
  scrollLeft,
  whiteSpace = 'pre-wrap',
  wordBreak = 'break-word'
}) => {
  const segments = useMemo(() => buildSegments(value, matches), [value, matches])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: 'inherit'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -scrollTop,
          left: -scrollLeft,
          padding,
          font: 'inherit',
          whiteSpace,
          wordBreak,
          lineHeight: 'inherit',
          color: 'transparent'
        }}
      >
        {segments.map((segment, index) =>
          segment.highlight ? (
            <mark
              key={`highlight-${index}`}
              style={{
                backgroundColor: HIGHLIGHT_COLOR,
                color: 'transparent',
                borderRadius: '4px'
              }}
            >
              {segment.text}
            </mark>
          ) : (
            <span key={`text-${index}`}>{segment.text}</span>
          )
        )}
      </div>
    </div>
  )
}

export default TextHighlightOverlay
