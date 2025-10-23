import React from 'react'
import type { DetectionMatch } from '../../shared/types'

interface ManagementPanelProps {
  visibleMatches: DetectionMatch[]
  ignoredValues: string[]
  userRules: string[]
  onIgnoreValue: (value: string) => void
  onUnignore: (value: string) => void
  onAddRule: (rule: string) => void
  onRemoveRule: (rule: string) => void
  onClose: () => void
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
  background: '#1e293b',
  color: '#f8fafc',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.4)',
  border: '1px solid #334155',
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: '12px',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  padding: '8px 8px',
  boxSizing: 'border-box',
  overflow: 'hidden',
  contain: 'layout style',
}

const headerStyles: React.CSSProperties = {
  padding: '8px 8px',
  fontWeight: 600,
  borderBottom: '1px solid #334155',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const contentContainerBaseStyles: React.CSSProperties = {
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  paddingTop: '4px',
  paddingBottom: '6px',
  paddingLeft: `${BASE_HPAD}px`,
  paddingRight: `${BASE_HPAD}px`,
}

const listStyles: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: '8px',
}

const listItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px',
  borderRadius: '4px',
  marginBottom: '4px',
}

const itemTextStyles: React.CSSProperties = {
  wordBreak: 'break-all',
  marginRight: '8px',
  opacity: 0.9,
  minWidth: 0,
}

const buttonStyles: React.CSSProperties = {
  border: 'none',
  background: '#334155',
  color: '#f1f5f9',
  borderRadius: '4px',
  padding: '2px 6px',
  fontSize: '10px',
  cursor: 'pointer',
  flexShrink: 0,
}

const closeButtonStyles: React.CSSProperties = {
  ...buttonStyles,
  background: 'transparent',
  fontSize: '16px',
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
        padding: '4px 8px',
        margin: '0',
        fontSize: '11px',
        color: '#94a3b8',
      }}
    >
      {title} ({items.length})
    </h4>
    {children}
    {items.length === 0 ? (
      <span style={{ padding: '8px', color: '#64748b', fontSize: '11px' }}>
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
    scrollbarGutter: `${needsScroll ? 'stable' : 'auto'}`,
  }

  return (
    <div style={panelStyles}>
      <div style={headerStyles}>
        <span>Management Panel</span>
        <button style={closeButtonStyles} onClick={onClose}>
          ×
        </button>
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
            style={{ padding: '0 8px 8px 8px', display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              placeholder="Add new rule..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                background: '#293548',
                border: '1px solid #475569',
                borderRadius: '4px',
                color: '#f1f5f9',
                padding: '4px 8px',
                fontSize: '11px',
              }}
            />
            <button
              style={{
                ...buttonStyles,
                background: '#22c55e',
                color: '#1f2937',
                fontWeight: 600,
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
