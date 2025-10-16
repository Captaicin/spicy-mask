import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { log, warn } from '../../shared/logger'
import type { FormElement } from './FormFilter'
import { detectionEngine } from '../detection'
import {
  type DetectionContext,
  type DetectionMatch,
  type DetectionTrigger
} from '../detection/detectors/BaseDetector'
import { TargetHighlighter } from './TargetHighlighter'
import { maskValueWithMatches } from '../masking'

const isInputElement = (element: FormElement): element is HTMLInputElement =>
  element instanceof HTMLInputElement

const isTextareaElement = (element: FormElement): element is HTMLTextAreaElement =>
  element instanceof HTMLTextAreaElement

const isSelectElement = (element: FormElement): element is HTMLSelectElement =>
  element instanceof HTMLSelectElement

const isContentEditableElement = (element: FormElement): element is HTMLElement =>
  element instanceof HTMLElement && element.isContentEditable

const getElementValue = (element: FormElement): string => {
  if (isSelectElement(element)) {
    return element.value
  }

  if (isInputElement(element) || isTextareaElement(element)) {
    return element.value ?? ''
  }

  if (isContentEditableElement(element)) {
    return element.innerText ?? ''
  }

  return ''
}

const setElementValue = (element: FormElement, value: string) => {
  if (isSelectElement(element) || isInputElement(element) || isTextareaElement(element)) {
    if (element.value !== value) {
      element.value = value
    }
  } else if (isContentEditableElement(element)) {
    if (element.textContent !== value) {
      element.textContent = value
    }
  }

  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

const deriveLabel = (element: FormElement, fallback: string): string => {
  const explicit = element.getAttribute('aria-label') ?? element.getAttribute('placeholder')
  if (explicit) {
    return explicit
  }

  if (isInputElement(element) && element.type) {
    return `${element.type} input`
  }

  if (isTextareaElement(element)) {
    return 'Textarea'
  }

  if (isSelectElement(element)) {
    return 'Select'
  }

  if (isContentEditableElement(element)) {
    return 'Contenteditable region'
  }

  return fallback
}

type MirrorFieldProps = {
  target: FormElement
  index: number
  filterId: string
}

const listSelectOptions = (element: HTMLSelectElement) =>
  Array.from(element.options).map((option) => ({ value: option.value, label: option.label }))

const MirrorField: React.FC<MirrorFieldProps> = ({ target, index, filterId }) => {
  const [value, setValue] = useState(() => getElementValue(target))
  const [options, setOptions] = useState(() => (isSelectElement(target) ? listSelectOptions(target) : []))
  const [matches, setMatches] = useState<DetectionMatch[]>([])
  const [closeSignal, setCloseSignal] = useState(0)
  const highlighterRef = useRef<TargetHighlighter | null>(null)
  const detectionContext = useMemo<DetectionContext>(
    () => ({
      element: target,
      filterId,
      fieldIndex: index
    }),
    [target, filterId, index]
  )

  const isMountedRef = useRef(true)
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])
  const detectionSequenceRef = useRef(0)
  const manualMatchesRef = useRef<DetectionMatch[]>([])

  const MANUAL_DETECTOR_IDS = useMemo(() => new Set(['gemini-detector']), [])

  const isManualDetectorMatch = useCallback(
    (match: DetectionMatch) => MANUAL_DETECTOR_IDS.has(match.detectorId),
    [MANUAL_DETECTOR_IDS]
  )

  const filterValidManualMatches = useCallback(
    (valueSnapshot: string): DetectionMatch[] => {
      return manualMatchesRef.current.filter((match) => {
        const slice = valueSnapshot.slice(match.startIndex, match.endIndex)
        return slice === match.match
      })
    },
    []
  )

  const mergeMatches = useCallback((primary: DetectionMatch[], secondary: DetectionMatch[]): DetectionMatch[] => {
    const dedupe = new Map<string, DetectionMatch>()
    const insert = (match: DetectionMatch) => {
      const key = `${match.detectorId}:${match.startIndex}:${match.endIndex}:${match.match}`
      if (!dedupe.has(key)) {
        dedupe.set(key, match)
      }
    }

    primary.forEach(insert)
    secondary.forEach(insert)

    return Array.from(dedupe.values())
  }, [])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const runDetection = useCallback(
    async (nextValue: string, options: { trigger?: DetectionTrigger } = {}) => {
      const trigger = options.trigger ?? 'auto'
      const sequence = ++detectionSequenceRef.current

      try {
        const results = await detectionEngine.run({
          value: nextValue,
          context: detectionContext,
          trigger
        })

        if (!isMountedRef.current) {
          return
        }

        if (detectionSequenceRef.current !== sequence) {
          return
        }

        let reconciled = results

        if (trigger === 'manual') {
          manualMatchesRef.current = results.filter(isManualDetectorMatch)
        } else {
          const preservedManualMatches = filterValidManualMatches(nextValue)
          manualMatchesRef.current = preservedManualMatches
          reconciled = mergeMatches(results, preservedManualMatches)
        }

        setMatches(reconciled)
        highlighterRef.current?.update(nextValue, reconciled, { trigger })
      } catch (err) {
        warn('Detection run failed', {
          filterId,
          index,
          message: err instanceof Error ? err.message : String(err)
        })
      }
    },
    [detectionContext, filterId, index]
  )

  const applyMask = useCallback(
    (targetMatches: DetectionMatch[]) => {
      if (targetMatches.length === 0) {
        return
      }

      const { masked, changed } = maskValueWithMatches(valueRef.current, targetMatches)
      if (!changed) {
        warn('Mask request produced no change', {
          filterId,
          index
        })
        setCloseSignal((token) => token + 1)
        return
      }

      log('Mask applied', {
        filterId,
        index,
        segments: targetMatches.map((match) => ({
          detectorId: match.detectorId,
          start: match.startIndex,
          end: match.endIndex
        }))
      })

      setValue(masked)
      setElementValue(target, masked)
      setMatches([])
      setCloseSignal((token) => token + 1)
      void runDetection(masked, { trigger: 'auto' })
    },
    [filterId, index, runDetection, target]
  )

  const handleMaskSegment = useCallback(
    ({ matches: selectedMatches }: { matches: DetectionMatch[]; context: DetectionContext }) => {
      applyMask(selectedMatches)
    },
    [applyMask]
  )

  const handleMaskAll = useCallback(
    ({ matches: allMatches }: { matches: DetectionMatch[]; context: DetectionContext }) => {
      applyMask(allMatches)
    },
    [applyMask]
  )

  const handleRequestScan = useCallback(() => {
    void runDetection(valueRef.current, { trigger: 'manual' })
  }, [runDetection])

  useEffect(() => {
    if (!isInputElement(target) && !isTextareaElement(target) && !isContentEditableElement(target)) {
      return
    }

    const highlighter = new TargetHighlighter(target, detectionContext, {
      onMaskSegment: handleMaskSegment,
      onMaskAll: handleMaskAll,
      onRequestScan: handleRequestScan
    })
    highlighterRef.current = highlighter

    return () => {
      highlighter.destroy()
      highlighterRef.current = null
    }
  }, [target, detectionContext, handleMaskSegment, handleMaskAll, handleRequestScan])

  useEffect(() => {
    void runDetection(value, { trigger: 'auto' })
  }, [runDetection, value])

  useEffect(() => {
    // This hook is for standard form elements, not contenteditable.
    if (!isInputElement(target) && !isTextareaElement(target) && !isSelectElement(target)) {
      return
    }

    const handleInput = () => {
      const nextValue = getElementValue(target)
      if (isInputElement(target) || isTextareaElement(target)) {
        log('MirrorField input', {
          filterId,
          index,
          value: nextValue
        })
      }
      setValue(nextValue)
    }

    target.addEventListener('input', handleInput)
    target.addEventListener('change', handleInput)

    return () => {
      target.removeEventListener('input', handleInput)
      target.removeEventListener('change', handleInput)
    }
  }, [target, filterId, index])

  useEffect(() => {
    if (!isContentEditableElement(target)) {
      return
    }

    const handleMutation = () => {
      const nextValue = getElementValue(target)
      log('MirrorField contenteditable mutation', {
        filterId,
        index,
        value: nextValue
      })
      setValue(nextValue)
    }

    const observer = new MutationObserver(handleMutation)

    observer.observe(target, {
      characterData: true,
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [target, filterId, index])

  useEffect(() => {
    if (!isSelectElement(target)) {
      return
    }

    const observer = new MutationObserver(() => {
      setOptions(listSelectOptions(target))
      setValue(target.value)
    })

    observer.observe(target, { childList: true })

    return () => observer.disconnect()
  }, [target])



  useEffect(() => {
    if (highlighterRef.current && highlighterRef.current instanceof TargetHighlighter) {
      highlighterRef.current.setCloseSignal(closeSignal)
    }
  }, [closeSignal])

  const label = useMemo(() => deriveLabel(target, `Field #${index + 1}`), [target, index])
  const location = useMemo(() => target.getAttribute('name') || target.getAttribute('id') || 'Unnamed field', [target])

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (
    event
  ) => {
    const newValue = event.target.value
    setValue(newValue)
    setElementValue(target, newValue)
  }

  const mirrorControl = () => {
    if (isTextareaElement(target) || isContentEditableElement(target)) {
      const baseRows = isTextareaElement(target) ? target.rows || 3 : 3
      return (
        <textarea
          value={value}
          onChange={handleChange}
          rows={Math.max(3, Math.min(6, baseRows))}
          style={{
            width: '100%',
            resize: 'vertical',
            fontFamily: 'inherit',
            padding: '8px',
            background: '#ffffff',
            color: '#0f172a',
            caretColor: '#1f2937',
            border: '1px solid #cbd5f5',
            borderRadius: '8px'
          }}
        />
      )
    }

    if (isSelectElement(target)) {
      return (
        <select value={value} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <input
        value={value}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '8px',
          background: '#ffffff',
          color: '#0f172a',
          caretColor: '#1f2937',
          border: '1px solid #cbd5f5',
          borderRadius: '8px'
        }}
      />
    )
  }

  return (
    <div
      style={{
        all: 'initial',
        display: 'block',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#0f172a',
        background: '#f8fafc',
        borderRadius: '12px',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)',
        padding: '16px',
        border: '1px solid #cbd5f5'
      }}
    >
      <header style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#4f46e5' }}>Filter: {filterId}</div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>{location}</div>
      </header>
      {mirrorControl()}
    </div>
  )
}

export default MirrorField
