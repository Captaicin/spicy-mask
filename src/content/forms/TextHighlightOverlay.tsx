import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'
import type { DetectionContext, DetectionTrigger } from '../detection/detectors/BaseDetector'
import type { DetectionMatch } from '../../shared/types'


const HIGHLIGHT_COLOR = 'rgba(252, 211, 77, 0.6)'
const POPOVER_WIDTH = 220
const HOVER_DELAY_MS = 500
const HIDE_DELAY_MS = 300

interface PiiDetail {
  pii: DetectionMatch
  rects: DOMRect[]
}

interface HighlightOverlayProps {
  piiDetails: PiiDetail[]
  containerRect: DOMRect
  allMatches: DetectionMatch[]
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

interface ActivePii {
  pii: DetectionMatch
  anchorRect: DOMRect
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
  }
}

const TextHighlightOverlay: React.FC<HighlightOverlayProps> = ({
  piiDetails,
  containerRect,
  allMatches,
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
  const popoverRef = useRef<HTMLDivElement>(null)
  const scanButtonRef = useRef<HTMLButtonElement>(null)
  const scanPopoverRef = useRef<HTMLDivElement>(null)
  const popoverTimerRef = useRef<number | null>(null)
  const runCounterRef = useRef(0)
  const pendingRunIdRef = useRef<number | null>(null)

  const [hovered, setHovered] = useState<ActivePii | null>(null)
  const [pinned, setPinned] = useState<ActivePii | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ left: number; top: number } | null>(null)

  const [isScanOpen, setIsScanOpen] = useState(false)
  const [scanPending, setScanPending] = useState(false)
  const [scanSummary, setScanSummary] = useState<{ phone: number; email: number } | null>(null)

  const activePii = pinned ?? hovered

  const clearPopoverTimer = useCallback(() => {
    if (popoverTimerRef.current !== null) {
      window.clearTimeout(popoverTimerRef.current)
      popoverTimerRef.current = null
    }
  }, [])

  const handleHighlightEnter = useCallback(
    (pii: DetectionMatch, rect: DOMRect) => {
      if (pinned) return
      clearPopoverTimer()
      popoverTimerRef.current = window.setTimeout(() => {
        setHovered({ pii, anchorRect: rect })
      }, HOVER_DELAY_MS)
    },
    [pinned, clearPopoverTimer]
  )

  const handleInteractionLeave = useCallback(() => {
    if (pinned) return
    clearPopoverTimer()
    popoverTimerRef.current = window.setTimeout(() => {
      setHovered(null)
    }, HIDE_DELAY_MS)
  }, [pinned, clearPopoverTimer])

  const handleInteractionEnter = useCallback(() => {
    clearPopoverTimer()
  }, [clearPopoverTimer])

  const handleClickHighlight = useCallback(
    (pii: DetectionMatch, rect: DOMRect) => {
      focusMatch(target, pii)
      onFocusMatch?.({ match: pii, context })

      clearPopoverTimer()
      setPinned({ pii, anchorRect: rect })
      setHovered(null)
      setIsScanOpen(false)
    },
    [context, onFocusMatch, target, clearPopoverTimer]
  )

  useLayoutEffect(() => {
    if (!activePii) {
      setPopoverPosition(null)
      return
    }
    const { anchorRect } = activePii
    const rawLeft = anchorRect.left + anchorRect.width / 2 - POPOVER_WIDTH / 2
    const clampedLeft = Math.min(Math.max(0, rawLeft), Math.max(0, window.innerWidth - POPOVER_WIDTH))
    const rawTop = anchorRect.bottom + 8

    setPopoverPosition({ left: clampedLeft, top: rawTop })
  }, [activePii])

  const closePopover = useCallback(() => {
    try {
      target.focus({ preventScroll: true })
    } catch (err) {
      target.focus()
    }
    clearPopoverTimer()
    setPinned(null)
    setHovered(null)
    setIsScanOpen(false)
  }, [target, clearPopoverTimer])

  useEffect(() => {
    if (closeSignal !== closeSignalRef.current) {
      closeSignalRef.current = closeSignal
      closePopover()
    }
  }, [closeSignal, closePopover])

  const handleMaskIt = useCallback(() => {
    if (!activePii) return
    onMaskSegment?.({ matches: [activePii.pii], context })
  }, [activePii, context, onMaskSegment])

  const handleMaskAll = useCallback(() => {
    if (allMatches.length === 0) return
    onMaskAll?.({ matches: allMatches, context })
  }, [allMatches, context, onMaskAll])

  // ... (Scan button logic is mostly unchanged) ...
  const resetScanState = useCallback(() => {
    setScanPending(false)
    setScanSummary(null)
    pendingRunIdRef.current = null
  }, [])

  const handleScanButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsScanOpen((open) => !open)
    },
    []
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
    if (latestTrigger !== 'manual') return
    const hasPendingRun = pendingRunIdRef.current !== null
    if (!scanPending && !hasPendingRun) return
    if (hasPendingRun) {
      setScanSummary(summarizeMatches(allMatches))
      pendingRunIdRef.current = null
    }
    setScanPending(false)
  }, [latestTrigger, allMatches, scanPending])

  useEffect(() => {
    if (!isScanOpen) {
      resetScanState()
    }
  }, [isScanOpen, resetScanState])

  const showMaskAllButton = Boolean(scanSummary) && !scanPending && allMatches.length > 0

  const popover = createPortal(
    activePii && popoverPosition ? (
      <div
        ref={popoverRef}
        onMouseEnter={handleInteractionEnter}
        onMouseLeave={handleInteractionLeave}
        style={{
          position: 'fixed',
          left: `${popoverPosition.left}px`,
          top: `${popoverPosition.top}px`,
          width: `${POPOVER_WIDTH}px`,
          pointerEvents: 'auto',
          zIndex: 2147483647,
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '8px',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
          padding: '12px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Detected Text</div>
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
          <div style={{ fontWeight: 600 }}>{activePii.pii.match}</div>
          <div style={{ opacity: 0.7 }}>Detector: {activePii.pii.detectorId}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handleMaskIt} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#f97316', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Mask it</button>
          <button type="button" onClick={handleMaskAll} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(248, 250, 252, 0.4)', background: 'transparent', color: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}>Mask all</button>
        </div>
      </div>
    ) : null,
    document.body
  )

  return (
    <>
      <div
        onMouseEnter={handleInteractionEnter}
        onMouseLeave={handleInteractionLeave}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        {piiDetails.map(({ pii, rects }) =>
          rects.map((rect, index) => (
            <div
              key={`${pii.startIndex}-${pii.endIndex}-${index}`}
              onMouseEnter={() => handleHighlightEnter(pii, rect)}
              onClick={() => handleClickHighlight(pii, rect)}
              style={{
                position: 'absolute',
                top: `${rect.top - containerRect.top}px`,
                left: `${rect.left - containerRect.left}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                backgroundColor: HIGHLIGHT_COLOR,
                borderRadius: '3px',
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
            />
          ))
        )}
      </div>

      {showScanButton ? (
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
          {isScanOpen ? (
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
                zIndex: 2147483646
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>Scan Tools</div>
              <button type="button" onClick={handleStartScan} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Start Scan</button>
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#cbd5f5' }}>
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
                <button type="button" onClick={handleMaskAll} style={{ width: '100%', marginTop: '10px', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(248, 250, 252, 0.4)', background: 'transparent', color: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}>Mask all</button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
      {popover}
    </>
  )
}

export default TextHighlightOverlay