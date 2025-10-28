import React from 'react'
import type { DetectionMatch } from '../../shared/types'
import * as tokens from '../../styles/designTokens'

interface ManagementPanelProps {
  visibleMatches: DetectionMatch[]
  ignoredValues: string[]
  userRules: string[]
  onIgnoreValue: (value: string) => void
  onUnignore: (value: string) => void
  onAddRule: (rule: string) => void
  onRemoveRule: (rule: string) => void
  onClose: () => void
  onMaskAll: () => void
  onStartScan: () => void
  scanPending: boolean
  scanSummary: Record<string, number> | null
  scanError: string | null
  showMaskAllButton: boolean
  isHighlightingActive?: boolean
  setIsHighlightingActive?: (value: boolean) => void
}

const MIN_WIDTH = 300
const MAX_WIDTH = 500
const MAX_HEIGHT = 450

const BASE_HPAD = 0
const EXTRA_RIGHT_PAD = 8

const loadingOverlayStyles: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
  borderRadius: tokens.radii.md,
}

const loadingImageStyles: React.CSSProperties = {
  width: '80px',
  height: '80px',
}

const resultsCardStyles: React.CSSProperties = {
  background: tokens.colors.backgroundPrimary,
  padding: tokens.spacing.s4,
  borderRadius: tokens.radii.lg,
  boxShadow: tokens.shadows.lg,
  width: '80%',
  textAlign: 'center',
  border: `1px solid ${tokens.colors.border}`,
}

const resultsTitleStyles: React.CSSProperties = {
  fontSize: tokens.typography.fontSizeLg,
  fontWeight: tokens.typography.fontWeightBold,
  color: tokens.colors.textPrimary,
  marginBottom: tokens.spacing.s3,
}

const resultsListStyles: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: `0 0 ${tokens.spacing.s4} 0`,
  color: tokens.colors.textSecondary,
}

const panelStyles: React.CSSProperties = {
  width: 'fit-content',
  minWidth: MIN_WIDTH,
  maxWidth: MAX_WIDTH,
  maxHeight: MAX_HEIGHT,
  background: tokens.colors.backgroundSecondary,
  color: tokens.colors.textPrimary,
  borderRadius: tokens.radii.md,
  boxShadow: tokens.shadows.lg,
  border: `1px solid ${tokens.colors.border}`,
  fontFamily: tokens.typography.fontFamilyBase,
  fontSize: tokens.typography.fontSizeXs,
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  padding: `${tokens.spacing.s2} 0`,
  boxSizing: 'border-box',
  overflow: 'hidden',
  contain: 'layout style',
  position: 'relative',
}

const headerStyles: React.CSSProperties = {
  padding: `0 ${tokens.spacing.s2} ${tokens.spacing.s2} ${tokens.spacing.s2}`,
  fontSize: tokens.typography.fontSizeSm,
  fontWeight: tokens.typography.fontWeightBold,
  borderBottom: `1px solid ${tokens.colors.border}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const footerStyles: React.CSSProperties = {
  padding: `${tokens.spacing.s2} ${tokens.spacing.s2} ${tokens.spacing.s1}`,
  borderTop: `1px solid ${tokens.colors.border}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const scanButtonContainerStyles: React.CSSProperties = {
  position: 'sticky',
  bottom: '0',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
}

const contentContainerBaseStyles: React.CSSProperties = {
  minHeight: 0,
  // overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  paddingTop: tokens.spacing.s1,
  paddingBottom: '6px',
  paddingLeft: `${BASE_HPAD}px`,
  paddingRight: `${BASE_HPAD}px`,
}

const listStyles: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: tokens.spacing.s2,
}

const listItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: tokens.spacing.s1,
  borderRadius: tokens.radii.sm,
  marginBottom: tokens.spacing.s1,
}

const itemTextStyles: React.CSSProperties = {
  wordBreak: 'break-all',
  marginRight: tokens.spacing.s2,
  fontWeight: tokens.typography.fontWeightMedium,
  // opacity: 0.9,
  minWidth: 0,
}

const buttonStyles: React.CSSProperties = {
  border: 'none',
  background: tokens.colors.border,
  color: tokens.colors.textPrimary,
  borderRadius: tokens.radii.sm,
  padding: '6px 10px',
  fontSize: tokens.typography.fontSizeXs,
  fontWeight: tokens.typography.fontWeightMedium,
  cursor: 'pointer',
  flexShrink: 0,
}

const closeButtonStyles: React.CSSProperties = {
  ...buttonStyles,
  background: 'transparent',
  fontSize: tokens.typography.fontSizeMd,
  padding: '0',
  width: '20px',
  height: '20px',
  lineHeight: '20px',
}

const ListSection: React.FC<{
  title: string
  items: string[]
  onAction: (item: string) => void
  actionLabel: string
  children?: React.ReactNode
}> = ({ title, items, onAction, actionLabel, children }) => (
  <div>
    <h4
      style={{
        padding: `${tokens.spacing.s1} ${tokens.spacing.s2}`,
        margin: '0',
        fontSize: '11px',
        color: tokens.colors.textSecondary,
        fontWeight: tokens.typography.fontWeightNormal,
      }}
    >
      {title} ({items.length})
    </h4>
    {children}
    {items.length === 0 ? (
      <span
        style={{
          padding: tokens.spacing.s2,
          marginBottom: tokens.spacing.s1,
          color: tokens.colors.textSecondary,
          fontSize: '11px',
        }}
      >
        None
      </span>
    ) : (
      <ul style={listStyles}>
        {items.map((item) => (
          <li key={item} style={listItemStyles}>
            <span style={itemTextStyles}>{item}</span>
            <button
              style={buttonStyles}
              onClick={(e) => {
                e.stopPropagation()
                onAction(item)
              }}
            >
              {actionLabel}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)

export const ManagementPanel: React.FC<ManagementPanelProps> = ({
  visibleMatches,
  ignoredValues,
  userRules,
  onIgnoreValue,
  onUnignore,
  onAddRule,
  onRemoveRule,
  onClose,
  onMaskAll,
  onStartScan,
  scanPending,
  scanSummary,
  scanError,
  isHighlightingActive,
  setIsHighlightingActive,
}) => {
  const [showResultsCard, setShowResultsCard] = React.useState(false)
  const loadingGifUrl = React.useMemo(() => {
    try {
      return chrome.runtime.getURL('assets/loading.gif')
    } catch (e) {
      return ''
    }
  }, [])

  React.useEffect(() => {
    if (!scanPending && (scanSummary || scanError)) {
      setShowResultsCard(true)
    }
  }, [scanPending, scanSummary, scanError])

  const handleStartScanClick = () => {
    setShowResultsCard(false)
    onStartScan()
  }

  const detectedPiiValues = React.useMemo(() => {
    const uniqueValues = new Set(visibleMatches.map((m) => m.match))
    return Array.from(uniqueValues)
  }, [visibleMatches])

  const shouldAnimate = React.useMemo(() => {
    const hasRegexResults = visibleMatches.some(
      (match) => match.detectorId !== 'gemini',
    )
    const hasGeminiResults = scanSummary && Object.keys(scanSummary).length > 0
    return hasRegexResults && !hasGeminiResults
  }, [visibleMatches, scanSummary])

  const [newRule, setNewRule] = React.useState('')
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [needsScroll, setNeedsScroll] = React.useState(false)

  React.useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return

    const check = () => {
      setNeedsScroll(el.scrollHeight > el.clientHeight + 1)
    }

    check()

    const ro = new ResizeObserver(check)
    ro.observe(el)

    const onWinResize = () => check()
    window.addEventListener('resize', onWinResize)

    if ('fonts' in document && (document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(check).catch(() => {})
    }

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onWinResize)
    }
  }, [visibleMatches, ignoredValues, userRules])

  const handleAddRule = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (newRule.trim()) {
      onAddRule(newRule.trim())
      setNewRule('')
    }
  }

  const contentContainerStyles: React.CSSProperties = {
    ...contentContainerBaseStyles,
    paddingRight: `${BASE_HPAD + (needsScroll ? EXTRA_RIGHT_PAD : 0)}px`,
    overflowY: `${needsScroll ? 'auto' : 'hidden'}`,
    scrollbarGutter: `${needsScroll ? 'stable' : 'auto'}`,
  }

  const animatedGradientButtonStyle: React.CSSProperties = {
    ...buttonStyles,
    padding: '6px 10px',
    border: 'none',
    borderRadius: tokens.radii.md,
    cursor: 'pointer',
    color: 'white',
    fontSize: tokens.typography.fontSizeXs,
    fontWeight: tokens.typography.fontWeightBold,
    background: `linear-gradient(
      135deg,
      #2196F3,
      #FF1744,
      #FFC107,
      #2196F3
    )`,
    backgroundSize: '400% 400%',
    animation: 'gradient-move 10s ease infinite',
  }

  const scanButtonStyle = shouldAnimate
    ? { ...animatedGradientButtonStyle, width: '80%' }
    : { ...buttonStyles, width: '80%' }

  const checkResultsButtonStyle: React.CSSProperties = {
    ...buttonStyles,
    background: tokens.colors.accentGreen,
    color: tokens.colors.backgroundPrimary,
    fontWeight: tokens.typography.fontWeightBold,
    padding: '10px 20px',
    width: '100%',
    fontSize: tokens.typography.fontSizeSm,
  }

  return (
    <>
      <style>
        {`
          @keyframes gradient-move {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }

          .switch {
            position: relative;
            display: inline-block;
            width: 34px;
            height: 20px;
          }

          .switch input { 
            opacity: 0;
            width: 0;
            height: 0;
          }

          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 20px;
          }

          .slider:before {
            position: absolute;
            content: "";
            height: 14px;
            width: 14px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          }

          input:checked + .slider {
            background-color: ${tokens.colors.accentGreen};
          }

          input:focus + .slider {
            box-shadow: 0 0 1px ${tokens.colors.accentGreen};
          }

          input:checked + .slider:before {
            transform: translateX(14px);
          }
        `}
      </style>
      <div style={panelStyles}>
        {(scanPending || showResultsCard) && (
          <div style={loadingOverlayStyles}>
            {scanPending ? (
              <img
                src={loadingGifUrl}
                style={loadingImageStyles}
                alt="Loading..."
              />
            ) : (
              <div style={resultsCardStyles}>
                <h2 style={resultsTitleStyles}>Scan Results</h2>
                {scanError ? (
                  <p
                    style={{
                      color: tokens.colors.accentRed,
                      marginBottom: tokens.spacing.s4,
                    }}
                  >
                    {scanError}
                  </p>
                ) : scanSummary && Object.keys(scanSummary).length > 0 ? (
                  <ul style={resultsListStyles}>
                    {Object.entries(scanSummary).map(([type, count]) => (
                      <li key={type}>
                        {type}: {count}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ marginBottom: tokens.spacing.s4 }}>
                    No PII found.
                  </p>
                )}
                <button
                  style={checkResultsButtonStyle}
                  onClick={() => setShowResultsCard(false)}
                >
                  {scanError ? 'Close' : 'Check Results'}
                </button>
              </div>
            )}
          </div>
        )}
        <div style={headerStyles}>
          <span>🌶️ Spicy Mask</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing.s2,
            }}
          >
            <button
              style={{
                ...buttonStyles,
                background: tokens.colors.accentOrange,
                color: tokens.colors.backgroundPrimary,
                fontWeight: tokens.typography.fontWeightBold,
              }}
              onClick={onMaskAll}
            >
              Mask all
            </button>
            <button style={closeButtonStyles} onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div
          style={{
            ...headerStyles,
            borderBottom: 'none',
            paddingTop: tokens.spacing.s2,
            paddingBottom: tokens.spacing.s2,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontWeight: tokens.typography.fontWeightMedium,
                fontSize: tokens.typography.fontSizeXs,
              }}
            >
              Show Highlights
            </span>
            <div className="switch">
              <input
                type="checkbox"
                checked={isHighlightingActive}
                onChange={(e) => setIsHighlightingActive?.(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="slider"></span>
            </div>
          </label>
        </div>

        {/* <div style={{ padding: `0 ${tokens.spacing.s2}` }}>
        {scanPending && !scanSummary ? (
          <span>Scanning…</span>
        ) : scanSummary ? (
          <>
            <span
              style={{
                fontWeight: tokens.typography.fontWeightBold,
                color: tokens.colors.textPrimary,
              }}
            >
              Results
            </span>
            {Object.entries(scanSummary).length > 0 ? (
              Object.entries(scanSummary).map(([type, count]) => (
                <span key={type} style={{ marginLeft: tokens.spacing.s2 }}>
                  • {type}: {count}
                </span>
              ))
            ) : (
              <span>No PII found.</span>
            )}
          </>
        ) : null}
      </div> */}

        <div ref={contentRef} style={contentContainerStyles}>
          <ListSection
            title="Detected PII"
            items={detectedPiiValues}
            onAction={onIgnoreValue}
            actionLabel="Ignore"
          />
          <ListSection
            title="Ignored Values"
            items={ignoredValues}
            onAction={onUnignore}
            actionLabel="Restore"
          />
          <ListSection
            title="User-Defined Rules"
            items={userRules}
            onAction={onRemoveRule}
            actionLabel="Remove"
          >
            <div
              style={{
                padding: `0 ${tokens.spacing.s2} ${tokens.spacing.s2}`,
                display: 'flex',
                gap: tokens.spacing.s2,
              }}
            >
              <input
                type="text"
                placeholder="Add new rule..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  background: tokens.colors.backgroundPrimary,
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.radii.sm,
                  color: tokens.colors.textPrimary,
                  padding: `${tokens.spacing.s1} ${tokens.spacing.s2}`,
                  fontSize: '11px',
                }}
              />
              <button
                style={{
                  ...buttonStyles,
                  background: tokens.colors.accentGreen,
                  color: tokens.colors.backgroundPrimary,
                  fontWeight: tokens.typography.fontWeightBold,
                }}
                onClick={handleAddRule}
              >
                Add
              </button>
            </div>
          </ListSection>
        </div>
        <div style={footerStyles}>
          <div style={scanButtonContainerStyles}>
            <button
              style={scanButtonStyle}
              onClick={handleStartScanClick}
              disabled={scanPending}
            >
              {scanPending ? 'Scanning PIIs...' : 'Scan with Gemini'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
