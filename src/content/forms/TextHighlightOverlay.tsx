import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift
} from '@floating-ui/react'
import type { DetectionContext, DetectionTrigger } from '../detection/detectors/BaseDetector'
import type { DetectionMatch } from '../../shared/types'
import { ManagementPanel } from './ManagementPanel'
import { uiContainerRegistry } from '../uiRegistry'

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
  ignoredValues: string[]
  userRules: string[]
  onMaskSegment?: (payload: { matches: DetectionMatch[]; context: DetectionContext }) => void
  onMaskAll?: (payload: { matches: DetectionMatch[]; context: DetectionContext }) => void
  onFocusMatch?: (payload: { match: DetectionMatch; context: DetectionContext }) => void
  onIgnoreValue?: (value: string) => void
  onUnignore?: (value: string) => void
  onAddRule?: (rule: string) => void
  onRemoveRule?: (rule: string) => void
  onRequestScan?: () => void
  closeSignal: number
  showScanButton: boolean
  latestTrigger: DetectionTrigger
}

interface ActivePii {
  pii: DetectionMatch
  anchorRect: DOMRect
}

const summarizeMatches = (matches: DetectionMatch[]): Record<string, number> => {
  return matches.reduce(
    (acc, match) => {
      const type = match.entityType ?? 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
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
  ignoredValues,
  userRules,
  onMaskSegment,
  onMaskAll,
  onFocusMatch,
  onIgnoreValue,
  onUnignore,
  onAddRule,
  onRemoveRule,
  onRequestScan,
  closeSignal,
  showScanButton,
  latestTrigger
}) => {
  const popoverTimerRef = useRef<number | null>(null)
  const runCounterRef = useRef(0)
  const pendingRunIdRef = useRef<number | null>(null)

  const [hovered, setHovered] = useState<ActivePii | null>(null)
  const [pinned, setPinned] = useState<ActivePii | null>(null)

  const [isScanOpen, setIsScanOpen] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [scanPending, setScanPending] = useState(false)
  const [scanSummary, setScanSummary] = useState<Record<string, number> | null>(null)

  const activePii = pinned ?? hovered

  const { refs: piiRefs, floatingStyles: piiFloatingStyles } = useFloating({
    open: !!activePii,
    placement: 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    elements: {
      reference: (activePii ? { getBoundingClientRect: () => activePii.anchorRect } : null) as any
    }
  })

  const { refs: scanRefs, floatingStyles: scanFloatingStyles } = useFloating({
    open: isScanOpen,
    onOpenChange: setIsScanOpen,
    placement: 'top-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  })

  const { refs: panelRefs, floatingStyles: panelFloatingStyles } = useFloating({
    open: isPanelOpen,
    onOpenChange: setIsPanelOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  })

  const panelWrapperRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const wrapper = panelWrapperRef.current
    if (wrapper) {
      uiContainerRegistry.add(wrapper)
      return () => {
        uiContainerRegistry.delete(wrapper)
      }
    }
  }, [isPanelOpen]) // Rerun when panel is opened/closed

  const clearPopoverTimer = useCallback(() => {
    if (popoverTimerRef.current !== null) {
      window.clearTimeout(popoverTimerRef.current)
      popoverTimerRef.current = null
    }
  }, [])

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

  useEffect(() => {
    if (closeSignal !== closeSignalRef.current) {
      closeSignalRef.current = closeSignal
      closePopover()
    }
  }, [closeSignal, closePopover])

  useEffect(() => {
    if (!pinned) return

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node
      if (piiRefs.floating.current && !piiRefs.floating.current.contains(targetNode) && !target.contains(targetNode)) {
        closePopover()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [pinned, closePopover, target, piiRefs.floating])

  const handleMaskIt = useCallback(() => {
    if (!activePii) return
    onMaskSegment?.({ matches: [activePii.pii], context })
  }, [activePii, context, onMaskSegment])

  const handleMaskAll = useCallback(() => {
    if (allMatches.length === 0) return
    onMaskAll?.({ matches: allMatches, context })
  }, [allMatches, context, onMaskAll])

  const handleIgnore = useCallback(() => {
    if (!activePii) return
    onIgnoreValue?.(activePii.pii.match)
    closePopover()
  }, [activePii, onIgnoreValue, closePopover])

  const resetScanState = useCallback(() => {
    setScanPending(false)
    setScanSummary(null)
    pendingRunIdRef.current = null
  }, [])

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
    if (!hasPendingRun) return

    setScanSummary(summarizeMatches(allMatches))
    setScanPending(false)
    pendingRunIdRef.current = null
  }, [latestTrigger, allMatches])

  useEffect(() => {
    if (!isScanOpen) {
      resetScanState()
    }
  }, [isScanOpen, resetScanState])

  const showMaskAllButton = Boolean(scanSummary) && !scanPending && allMatches.length > 0

  const piiPopover = createPortal(
    activePii ? (
      <div
        ref={piiRefs.setFloating}
        onMouseEnter={handleInteractionEnter}
        onMouseLeave={handleInteractionLeave}
        style={{
          ...piiFloatingStyles,
          width: `${POPOVER_WIDTH}px`,
          pointerEvents: 'auto',
          zIndex: 2147483647,
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '10px',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
          padding: '12px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}
      >
        <button
          type="button"
          onClick={closePopover}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '20px',
            height: '20px',
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            fontSize: '16px',
            lineHeight: '20px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>Detected PII</div>
        <div
          style={{
            fontSize: '12px',
            lineHeight: 1.4,
            background: '#1e293b',
            padding: '8px',
            borderRadius: '6px',
            marginBottom: '10px',
            wordBreak: 'break-all',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '4px 8px',
            alignItems: 'start'
          }}
        >
          <div style={{ opacity: 0.7 }}>Match:</div>
          <div style={{ fontWeight: 600 }}>{activePii.pii.match}</div>

          <div style={{ opacity: 0.7 }}>Type:</div>
          <div>{activePii.pii.entityType}</div>

          <div style={{ opacity: 0.7 }}>Detector:</div>
          <div>{activePii.pii.detectorId}</div>

          {activePii.pii.reason && (
            <>
              <div style={{ opacity: 0.7 }}>Reason:</div>
              <div>{activePii.pii.reason}</div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handleMaskIt} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#f97316', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Mask it</button>
          <button type="button" onClick={handleIgnore} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(248, 250, 252, 0.4)', background: 'transparent', color: '#f8fafc', fontWeight: 500, cursor: 'pointer' }}>Ignore</button>
        </div>
        <button type="button" onClick={handleMaskAll} style={{ width: '100%', marginTop: '8px', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(248, 250, 252, 0.4)', background: 'transparent', color: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}>Mask all</button>
      </div>
    ) : null,
    document.body
  )

  const scanPopover = createPortal(
    isScanOpen ? (
      <div
        ref={scanRefs.setFloating}
        style={{
          ...scanFloatingStyles,
          width: '180px',
          padding: '12px',
          borderRadius: '10px',
          background: '#0f172a',
          color: '#f8fafc',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.35)',
          pointerEvents: 'auto',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          zIndex: 2147483647,
          maxHeight: '400px',
          overflowY: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => setIsScanOpen(false)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '20px',
            height: '20px',
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            fontSize: '16px',
            lineHeight: '20px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>Scan Tools</div>
        <button type="button" onClick={handleStartScan} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Start Scan</button>
        <div
          style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#cbd5f5',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {scanPending && !scanSummary ? (
            <span>Scanning…</span>
          ) : scanSummary ? (
            <>
              <span style={{ fontWeight: 600 }}>Results</span>
              {Object.entries(scanSummary).length > 0 ? (
                Object.entries(scanSummary).map(([type, count]) => (
                  <span key={type} style={{ marginLeft: '8px' }}>
                    • {type}: {count}
                  </span>
                ))
              ) : (
                <span>No PII found.</span>
              )}
            </>
          ) : (
            <span>Run Start Scan to scan PII with Gemini Nano</span>
          )}
        </div>
        {showMaskAllButton ? (
          <button type="button" onClick={handleMaskAll} style={{ width: '100%', marginTop: '10px', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(248, 250, 252, 0.4)', background: 'transparent', color: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}>Mask all</button>
        ) : null}
      </div>
    ) : null,
    document.body
  )

  const managementPanel = createPortal(
    isPanelOpen && onUnignore && onAddRule && onRemoveRule && onIgnoreValue ? (
      <div ref={panelWrapperRef}>
        <div
          ref={panelRefs.setFloating}
          style={{
            ...panelFloatingStyles,
            zIndex: 2147483647,
          }}
        >
          <ManagementPanel 
            visibleMatches={allMatches}
            ignoredValues={ignoredValues}
            userRules={userRules}
            onIgnoreValue={onIgnoreValue}
            onUnignore={onUnignore}
            onAddRule={onAddRule}
            onRemoveRule={onRemoveRule}
            onClose={() => setIsPanelOpen(false)}
          />
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
        <div style={{ position: 'absolute', right: '8px', bottom: '4px', display: 'flex', gap: '4px' }}>
          <button
            ref={panelRefs.setReference}
            type="button"
            onClick={() => setIsPanelOpen((open) => !open)}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: 'none',
              background: '#475569',
              color: '#f8fafc',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              pointerEvents: 'auto'
            }}
            title="Manage ignored values and rules"
          >
            ⚙️
          </button>
          <button
            ref={scanRefs.setReference}
            type="button"
            onClick={() => setIsScanOpen((open) => !open)}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: 'none',
              background: '#2563eb',
              color: '#f8fafc',
              fontSize: '10px',
              lineHeight: '20px',
              textAlign: 'center',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              pointerEvents: 'auto'
            }}
            title="Scan for sensitive text"
          >
            ✦
          </button>
        </div>
      ) : null}
      {managementPanel}
      {piiPopover}
      {scanPopover}
    </>
  )
}

export default TextHighlightOverlay