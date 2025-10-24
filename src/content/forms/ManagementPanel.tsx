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
}

const MIN_WIDTH = 300
const MAX_WIDTH = 500
const MAX_HEIGHT = 450

const BASE_HPAD = 0
const EXTRA_RIGHT_PAD = 8

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
  gridTemplateRows: 'auto 1fr',
  padding: `${tokens.spacing.s2} 0`,
  boxSizing: 'border-box',
  overflow: 'hidden',
  contain: 'layout style',
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
}) => {
  const detectedPiiValues = React.useMemo(() => {
    const uniqueValues = new Set(visibleMatches.map((m) => m.match))
    return Array.from(uniqueValues)
  }, [visibleMatches])

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

  return (
    <div style={panelStyles}>
      <div style={headerStyles}>
        <span>Management Panel</span>
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
    </div>
  )
}
