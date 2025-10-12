import React, { useEffect, useMemo, useState } from 'react'
import { log } from '../../shared/logger'
import type { FormElement } from './FormFilter'

const getElementValue = (element: FormElement): string => {
  if (element instanceof HTMLSelectElement) {
    return element.value
  }
  return element.value ?? ''
}

const setElementValue = (element: FormElement, value: string) => {
  if (element.value !== value) {
    element.value = value
  }
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

const deriveLabel = (element: FormElement, fallback: string): string => {
  const explicit = element.getAttribute('aria-label') ?? element.getAttribute('placeholder')
  if (explicit) {
    return explicit
  }

  if (element instanceof HTMLInputElement && element.type) {
    return `${element.type} input`
  }

  if (element instanceof HTMLTextAreaElement) {
    return 'Textarea'
  }

  if (element instanceof HTMLSelectElement) {
    return 'Select'
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
  const [options, setOptions] = useState(() => (target instanceof HTMLSelectElement ? listSelectOptions(target) : []))

  useEffect(() => {
    log('MirrorField mounted', {
      filterId,
      index,
      tag: target.tagName,
      name: target.getAttribute('name') ?? null,
      initialValue: getElementValue(target)
    })
    return () => {
      log('MirrorField unmounted', {
        filterId,
        index,
        tag: target.tagName,
        name: target.getAttribute('name') ?? null
      })
    }
  }, [filterId, index, target])

  useEffect(() => {
    const handleInput = () => {
      const nextValue = getElementValue(target)
      log('MirrorField observed target input', {
        filterId,
        index,
        value: nextValue
      })
      setValue(nextValue)
    }

    target.addEventListener('input', handleInput)
    target.addEventListener('change', handleInput)

    return () => {
      target.removeEventListener('input', handleInput)
      target.removeEventListener('change', handleInput)
    }
  }, [target])

  useEffect(() => {
    if (!(target instanceof HTMLSelectElement)) {
      return
    }

    const observer = new MutationObserver(() => {
      setOptions(listSelectOptions(target))
      setValue(target.value)
      log('MirrorField detected options mutation', {
        filterId,
        index,
        options: listSelectOptions(target)
      })
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
    log('MirrorField propagating change to target', {
      filterId,
      index,
      value: newValue
    })
    setValue(newValue)
    setElementValue(target, newValue)
  }

  const mirrorControl = () => {
    if (target instanceof HTMLTextAreaElement) {
      return (
        <textarea
          value={value}
          onChange={handleChange}
          rows={Math.max(3, Math.min(6, target.rows || 3))}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', padding: '8px' }}
        />
      )
    }

    if (target instanceof HTMLSelectElement) {
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

    const inputType = target instanceof HTMLInputElement ? target.type || 'text' : 'text'

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
