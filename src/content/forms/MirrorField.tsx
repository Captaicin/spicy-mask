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
    return element.textContent ?? ''
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
  const detectionSequenceRef = useRef(0)

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

        setMatches(results)
        highlighterRef.current?.update(nextValue, results)
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

      const { masked, changed } = maskValueWithMatches(value, targetMatches)
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
    [filterId, index, runDetection, target, value]
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
    void runDetection(value, { trigger: 'manual' })
  }, [runDetection, value])

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
    const handleInput = () => {
      const nextValue = getElementValue(target)
      if (isInputElement(target) || isTextareaElement(target) || isContentEditableElement(target)) {
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
    if (!highlighterRef.current) {
      return
    }

    highlighterRef.current.update(value, matches)
  }, [value, matches])

  useEffect(() => {
    highlighterRef.current?.setCloseSignal(closeSignal)
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
