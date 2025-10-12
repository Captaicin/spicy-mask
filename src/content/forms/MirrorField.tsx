import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { log } from '../../shared/logger'
import type { FormElement } from './FormFilter'
import { detectionEngine, type DetectionContext } from '../detection'

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
  const detectionContext = useMemo<DetectionContext>(
    () => ({
      element: target,
      filterId,
      fieldIndex: index
    }),
    [target, filterId, index]
  )

  const runDetection = useCallback(
    (nextValue: string) => {
      detectionEngine.run({
        value: nextValue,
        context: detectionContext
      })
    },
    [detectionContext]
  )

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
      runDetection(nextValue)
    }

    target.addEventListener('input', handleInput)
    target.addEventListener('change', handleInput)

    return () => {
      target.removeEventListener('input', handleInput)
      target.removeEventListener('change', handleInput)
    }
  }, [target, filterId, index, runDetection])

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

  const label = useMemo(() => deriveLabel(target, `Field #${index + 1}`), [target, index])
  const location = useMemo(() => target.getAttribute('name') || target.getAttribute('id') || 'Unnamed field', [target])

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (
    event
  ) => {
    const newValue = event.target.value
    setValue(newValue)
    setElementValue(target, newValue)
    runDetection(newValue)
  }

  const mirrorControl = () => {
    if (isTextareaElement(target) || isContentEditableElement(target)) {
      const baseRows = isTextareaElement(target) ? target.rows || 3 : 3
      return (
        <textarea
          value={value}
          onChange={handleChange}
          rows={Math.max(3, Math.min(6, baseRows))}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', padding: '8px' }}
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

    const inputType = isInputElement(target) ? target.type || 'text' : 'text'

    return (
      <input
        type={inputType}
        value={value}
        onChange={handleChange}
        style={{ width: '100%', padding: '8px' }}
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
