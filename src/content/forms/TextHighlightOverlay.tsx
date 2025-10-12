import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type { DetectionContext, DetectionMatch, DetectionTrigger } from '../detection/detectors/BaseDetector'

const HIGHLIGHT_COLOR = 'rgba(252, 211, 77, 0.6)'
const POPOVER_WIDTH = 220
const HOVER_DELAY_MS = 500

// FIXME: scanPending keep exists, instead of showing scanSummary
interface HighlightOverlayProps {
  value: string
  matches: DetectionMatch[]
  padding: string | number
  scrollTop: number
  scrollLeft: number
  whiteSpace?: React.CSSProperties['whiteSpace']
  wordBreak?: React.CSSProperties['wordBreak']
  target: HTMLElement
  context: DetectionContext
  onMaskSegment?: (payload: { matches: DetectionMatch[]; context: DetectionContext }) => void
  onMaskAll?: (payload: { matches: DetectionMatch[]; context: DetectionContext }) => void
  onFocusMatch?: (payload: { match: DetectionMatch; context: DetectionContext }) => void
  onRequestScan?: () => void
  closeSignal: number
  showScanButton: boolean
  latestTrigger: DetectionTrigger
}

interface HighlightSegment {
  key: string
  text: string
  start: number
  end: number
  matches: DetectionMatch[]
}

interface ActiveSegment {
  key: string
  matches: DetectionMatch[]
  text: string
}

const clampIndices = (valueLength: number, match: DetectionMatch): DetectionMatch | null => {
  if (match.endIndex <= match.startIndex) {
    return null
  }
  const start = Math.max(0, Math.min(valueLength, match.startIndex))
  const end = Math.max(start, Math.min(valueLength, match.endIndex))
  if (start === end) {
    return null
  }
  return {
    ...match,
    startIndex: start,
    endIndex: end
  }
}

const buildSegments = (value: string, matches: DetectionMatch[]): HighlightSegment[] => {
  if (!value) {
    return []
  }

  const validMatches = matches
    .map((match) => clampIndices(value.length, match))
    .filter((match): match is DetectionMatch => Boolean(match))

  if (validMatches.length === 0) {
    return [
      {
        key: 'whole-0',
        text: value,
        start: 0,
        end: value.length,
        matches: []
      }
    ]
  }

  const boundaries = new Set<number>([0, value.length])
  for (const match of validMatches) {
    boundaries.add(match.startIndex)
    boundaries.add(match.endIndex)
  }

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b)
  const segments: HighlightSegment[] = []

  for (let i = 0; i < sortedBoundaries.length - 1; i += 1) {
    const start = sortedBoundaries[i]
    const end = sortedBoundaries[i + 1]
    if (end <= start) {
      continue
    }

    const slice = value.slice(start, end)
    const overlappingMatches = validMatches.filter(
      (match) => match.startIndex < end && match.endIndex > start
    )

    segments.push({
      key: `${start}-${end}-${overlappingMatches.length}`,
      text: slice || '\u200b',
      start,
      end,
      matches: overlappingMatches
    })
  }

  return segments
}

const summarizeMatches = (matches: DetectionMatch[]): { phone: number; email: number } => {
  let phone = 0
  let email = 0

  matches.forEach((match) => {
    if (match.entityType === 'phone_number') {
      phone += 1
    } else if (match.entityType === 'email') {
      email += 1
    }
  })

  return { phone, email }
}

const focusMatch = (target: HTMLElement, match: DetectionMatch) => {
  target.focus()

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    target.setSelectionRange(match.startIndex, match.endIndex)
    return
  }

  if (!target.isContentEditable) {
    return
  }

  const doc = target.ownerDocument
  if (!doc) {
    return
  }
  const range = doc.createRange()
  const selection = doc.getSelection()
  if (!selection) {
    return
  }

  const walker = doc.createTreeWalker(target, NodeFilter.SHOW_TEXT)
  let current = walker.nextNode()
  let offset = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0

  while (current) {
    if (!(current instanceof Text)) {
      current = walker.nextNode()
      continue
    }

    const length = current.length
    const nodeStart = offset
    const nodeEnd = offset + length

    if (!startNode && match.startIndex >= nodeStart && match.startIndex <= nodeEnd) {
      startNode = current
      startOffset = match.startIndex - nodeStart
    }

    if (!endNode && match.endIndex >= nodeStart && match.endIndex <= nodeEnd) {
      endNode = current
      endOffset = Math.max(0, match.endIndex - nodeStart)
      break
    }

    offset += length
    current = walker.nextNode()
  }

  if (!startNode) {
    startNode = target.firstChild as Text | null
    startOffset = 0
  }

  if (!endNode) {
    endNode = target.lastChild as Text | null
    endOffset = endNode instanceof Text ? endNode.length : 0
  }

  if (!startNode || !endNode) {
    return
  }

  range.setStart(startNode, Math.max(0, startOffset))
  range.setEnd(endNode, Math.max(0, endOffset))
  selection.removeAllRanges()
  selection.addRange(range)
}

const TextHighlightOverlay: React.FC<HighlightOverlayProps> = ({
  value,
  matches,
  padding,
  scrollTop,
  scrollLeft,
  whiteSpace = 'pre-wrap',
  wordBreak = 'break-word',
  target,
  context,
  onMaskSegment,
  onMaskAll,
  onFocusMatch,
  onRequestScan,
  closeSignal,
  showScanButton,
  latestTrigger
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const scanButtonRef = useRef<HTMLButtonElement>(null)
  const scanPopoverRef = useRef<HTMLDivElement>(null)
  const hoverTimerRef = useRef<number | null>(null)
  const runCounterRef = useRef(0)
  const pendingRunIdRef = useRef<number | null>(null)
  const [hovered, setHovered] = useState<ActiveSegment | null>(null)
  const [pinned, setPinned] = useState<ActiveSegment | null>(null)
  const [anchor, setAnchor] = useState<{ left: number; top: number; width: number } | null>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [scanPending, setScanPending] = useState(false)
  const [scanSummary, setScanSummary] = useState<{ phone: number; email: number } | null>(null)

  const segments = useMemo(() => buildSegments(value, matches), [value, matches])
  const hasMatches = matches.length > 0

  const active = pinned ?? hovered

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const resetScanState = useCallback(() => {
    setScanPending(false)
    setScanSummary(null)
    pendingRunIdRef.current = null
  }, [])

  const updateAnchorPosition = useCallback(
    (segmentKey: string | null) => {
      if (!segmentKey || !containerRef.current) {
        setAnchor(null)
        return
      }
      const containerRect = containerRef.current.getBoundingClientRect()
      const segmentEl = containerRef.current.querySelector<HTMLElement>(
        `[data-highlight-key="${segmentKey}"]`
      )
      if (!segmentEl) {
        setAnchor(null)
        return
      }

      const rect = segmentEl.getBoundingClientRect()
      const relativeLeft = rect.left - containerRect.left
      const relativeTop = rect.top - containerRect.top

      setAnchor({
        left: relativeLeft,
        top: relativeTop,
        width: rect.width
      })
    },
    []
  )

  useLayoutEffect(() => {
    updateAnchorPosition(active?.key ?? null)
  }, [active?.key, updateAnchorPosition, scrollTop, scrollLeft, value, matches])

  useLayoutEffect(() => {
    if (!anchor || !containerRef.current) {
      setPosition(null)
      return
    }

    const frame = requestAnimationFrame(() => {
      if (!anchor || !containerRef.current) {
        return
      }

      const containerRect = containerRef.current.getBoundingClientRect()
      const popoverHeight = popoverRef.current?.offsetHeight ?? 0
      const containerWidth = containerRect.width

      const rawLeft = anchor.left + anchor.width / 2 - POPOVER_WIDTH / 2
      const clampedLeft = Math.min(Math.max(0, rawLeft), Math.max(0, containerWidth - POPOVER_WIDTH))
      const rawTop = anchor.top - popoverHeight - 8

      setPosition({
        left: clampedLeft,
        top: rawTop
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [anchor, active, matches, value])

  useEffect(() => {
    if (!pinned) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }
      const root = containerRef.current
      const targetNode = event.target
      if (!(targetNode instanceof Node)) {
        return
      }
      if (root.contains(targetNode)) {
        return
      }
      clearHoverTimer()
      setPinned(null)
      setHovered(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pinned, clearHoverTimer])

  useEffect(() => {
    return () => clearHoverTimer()
  }, [clearHoverTimer])

  useEffect(() => {
    if (latestTrigger !== 'manual') {
      return
    }

    const hasPendingRun = pendingRunIdRef.current !== null
    if (!scanPending && !hasPendingRun) {
      return
    }

    if (hasPendingRun) {
      setScanSummary(summarizeMatches(matches))
      pendingRunIdRef.current = null
    }

    setScanPending(false)
  }, [latestTrigger, matches, scanPending])

  const hasValue = showScanButton

  useEffect(() => {
    if (!hasValue && isScanOpen) {
      setIsScanOpen(false)
    }
  }, [hasValue, isScanOpen])

  useEffect(() => {
    if (!isScanOpen) {
      resetScanState()
    }
  }, [isScanOpen, resetScanState])

  useEffect(() => {
    if (!isScanOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target
      if (!(targetNode instanceof Node)) {
        return
      }
      const button = scanButtonRef.current
      const popover = scanPopoverRef.current
      if (button?.contains(targetNode) || popover?.contains(targetNode)) {
        return
      }
      setIsScanOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isScanOpen])

  const handleMouseEnter = useCallback(
    (segment: HighlightSegment) => {
      clearHoverTimer()
      hoverTimerRef.current = window.setTimeout(() => {
        hoverTimerRef.current = null
        setHovered({ key: segment.key, matches: segment.matches, text: segment.text })
      }, HOVER_DELAY_MS)
    },
    [clearHoverTimer]
  )

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (pinned) {
        return
      }
      const next = event.relatedTarget as Node | null
      if (next && next instanceof Node && containerRef.current?.contains(next)) {
        return
      }
      clearHoverTimer()
      setHovered(null)
    },
    [pinned, clearHoverTimer]
  )

  const handleClickHighlight = useCallback(
    (segment: HighlightSegment) => {
      if (segment.matches.length === 0) {
        return
      }

      const primaryMatch = segment.matches[0]
      focusMatch(target, primaryMatch)
      onFocusMatch?.({ match: primaryMatch, context })

      const nextPinned: ActiveSegment = {
        key: segment.key,
        matches: segment.matches,
        text: segment.text
      }
      clearHoverTimer()
      setPinned(nextPinned)
      setHovered(null)
      updateAnchorPosition(segment.key)
      setIsScanOpen(false)
    },
    [context, onFocusMatch, target, updateAnchorPosition, clearHoverTimer]
  )

  const handleMaskIt = useCallback(() => {
    if (!active) {
      return
    }
    onMaskSegment?.({ matches: active.matches, context })
  }, [active, context, onMaskSegment])

  const handleMaskAll = useCallback(() => {
    if (matches.length === 0) {
      return
    }
    onMaskAll?.({ matches, context })
  }, [matches, context, onMaskAll])

  const closePopover = useCallback(() => {
    try {
      target.focus({ preventScroll: true })
    } catch (err) {
      target.focus()
    }
    clearHoverTimer()
    setPinned(null)
    setHovered(null)
    setAnchor(null)
    setPosition(null)
    setIsScanOpen(false)
    resetScanState()
  }, [target, clearHoverTimer, resetScanState])

  const handleScanButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsScanOpen((open) => {
        const next = !open
        if (!next) {
          resetScanState()
        } else {
          setScanPending(false)
          setScanSummary(null)
          pendingRunIdRef.current = null
        }
        return next
      })
    },
    [resetScanState]
  )

  const handleStartScan = useCallback(() => {
    runCounterRef.current += 1
    pendingRunIdRef.current = runCounterRef.current
    setScanPending(true)
    setScanSummary(null)
    onRequestScan?.()
  }, [onRequestScan])

  const closeSignalRef = useRef(closeSignal)
  useEffect(() => {
    if (closeSignal !== closeSignalRef.current) {
      closeSignalRef.current = closeSignal
      closePopover()
      setIsScanOpen(false)
    }
  }, [closeSignal, closePopover])

  const showScanIcon = showScanButton
  const scanPopoverOpen = isScanOpen
  const showMaskAllButton = Boolean(scanSummary) && !scanPending && hasMatches

  if (segments.length === 0 && !showScanIcon) {
    return null
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
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
        {segments.map((segment) => {
          const isHighlight = segment.matches.length > 0
          const commonProps = {
            key: segment.key,
            'data-highlight-key': segment.key
          }

          if (!isHighlight) {
            return (
              <span {...commonProps} style={{ pointerEvents: 'none' }}>
                {segment.text}
              </span>
            )
          }

          return (
            <span
              {...commonProps}
              onMouseEnter={() => handleMouseEnter(segment)}
              onMouseLeave={(event) => handleMouseLeave(event)}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                handleClickHighlight(segment)
              }}
              style={{
                backgroundColor: HIGHLIGHT_COLOR,
                color: 'transparent',
                borderRadius: '4px',
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
            >
              {segment.text}
            </span>
          )
        })}
      </div>

      {showScanIcon ? (
        <>
          <button
            ref={scanButtonRef}
            type="button"
            onClick={handleScanButtonClick}
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '8px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              background: '#2563eb',
              color: '#f8fafc',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)',
              pointerEvents: 'auto'
            }}
            title="Scan for sensitive text"
          >
            ✦
          </button>
          {scanPopoverOpen ? (
            <div
              ref={scanPopoverRef}
              style={{
                position: 'absolute',
                right: '8px',
                bottom: '48px',
                width: '180px',
                padding: '12px',
                borderRadius: '10px',
                background: '#0f172a',
                color: '#f8fafc',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
                pointerEvents: 'auto',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                zIndex: 12
              }}
              onClick={(event) => {
                event.stopPropagation()
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>Scan Tools</div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setIsScanOpen(false)
                  resetScanState()
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleStartScan()
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                background: '#22c55e',
                color: '#0f172a',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Start Scan
            </button>
            <div
              style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#cbd5f5',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              {scanPending && !scanSummary ? (
                <span>Scanning…</span>
              ) : scanSummary ? (
                <>
                  <span>Results</span>
                  <span>• phone_number: {scanSummary.phone}</span>
                  <span>• email: {scanSummary.email}</span>
                </>
              ) : (
                <span>Run Start Scan to scan PII with Gemini Nano</span>
              )}
            </div>
            {showMaskAllButton ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleMaskAll()
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(248, 250, 252, 0.4)',
                  background: 'transparent',
                  color: '#f8fafc',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Mask all
              </button>
            ) : null}
          </div>
        ) : null}
        </>
      ) : null}

      {active && position ? (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            left: `${position.left}px`,
            top: `${position.top}px`,
            width: `${POPOVER_WIDTH}px`,
            pointerEvents: 'auto',
            zIndex: 10,
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '8px',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
            padding: '12px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}
          onMouseLeave={(event) => {
            if (pinned) {
              return
            }
            const next = event.relatedTarget as Node | null
            if (next && next instanceof Node && containerRef.current?.contains(next)) {
              return
            }
            clearHoverTimer()
            setHovered(null)
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>Detected Text</div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                closePopover()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              fontSize: '12px',
              lineHeight: 1.4,
              background: '#1e293b',
              padding: '8px',
              borderRadius: '6px',
              marginBottom: '10px',
              wordBreak: 'break-word'
            }}
          >
            {active.matches.map((match, idx) => (
              <div key={`${match.detectorId}-${match.startIndex}-${idx}`} style={{ marginBottom: '4px' }}>
                <div style={{ fontWeight: 600 }}>{match.match}</div>
                <div style={{ opacity: 0.7 }}>Detector: {match.detectorId}</div>
                {match.entityType ? (
                  <div style={{ opacity: 0.7 }}>Type: {match.entityType}</div>
                ) : null}
                {match.reason ? (
                  <div style={{ opacity: 0.7 }}>Reason: {match.reason}</div>
                ) : null}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleMaskIt()
              }}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                background: '#f97316',
                color: '#0f172a',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Mask it
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleMaskAll()
              }}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(248, 250, 252, 0.4)',
                background: 'transparent',
                color: '#f8fafc',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Mask all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default TextHighlightOverlay
