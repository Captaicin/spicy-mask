import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { log, warn } from '../../shared/logger'
import type { FormElement } from './FormFilter'
import { detectionEngine, userRuleDetector } from '../detection'
import {
  type DetectionContext,
  type DetectionTrigger,
} from '../detection/detectors/BaseDetector'
import type { DetectionMatch } from '../../shared/types'
import { TargetHighlighter, type TargetHighlighterCallbacks } from './TargetHighlighter'
import { maskValueWithMatches, maskContentEditableNodes } from '../masking'
import { extractTextWithMapping, type TextNodeMapping } from '../../shared/dom'

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
  const [plainText, setPlainText] = useState<string | null>(null)
  const [mappings, setMappings] = useState<TextNodeMapping[] | null>(null)

  const [ignoredValues, setIgnoredValues] = useState<string[]>([])
  const [userRules, setUserRules] = useState<string[]>([])
  const [isHighlightingActive, setIsHighlightingActive] = useState(false)

  const highlighterRef = useRef<TargetHighlighter | null>(null)
  const detectionContext = useMemo<DetectionContext>(
    () => ({
      element: target,
      filterId,
      fieldIndex: index,
    }),
    [target, filterId, index],
  )

  const isMountedRef = useRef(true)
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])
  const matchesRef = useRef(matches)
  useEffect(() => {
    matchesRef.current = matches
  }, [matches])
  const mappingsRef = useRef(mappings)
  useEffect(() => {
    mappingsRef.current = mappings
  }, [mappings])
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
          trigger,
        })

        if (!isMountedRef.current || detectionSequenceRef.current !== sequence) {
          return
        }

        if (trigger === 'manual') {
          setIsHighlightingActive(true)
        }

        setMatches(results)

        const currentIgnored = detectionEngine.getIgnoredValues()
        const currentRules = userRuleDetector.getRules()
        setIgnoredValues(currentIgnored)
        setUserRules(currentRules)

        setTimeout(() => {
          highlighterRef.current?.update(
            nextValue,
            results,
            mappings,
            currentIgnored,
            currentRules,
            {
              trigger,
              isHighlightingActive: trigger === 'manual' ? true : isHighlightingActive,
              setIsHighlightingActive,
            },
          )
        }, 200);
      } catch (err) {
        warn('Detection run failed', {
          filterId,
          index,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    },
    [detectionContext, filterId, index, mappings, isHighlightingActive],
  )

  const applyMask = useCallback(
    (targetMatches: DetectionMatch[]) => {
      if (targetMatches.length === 0) {
        return;
      }

      let changed = false;

      if (isContentEditableElement(target)) {
        if (!mappings) {
          warn('Attempted to mask contenteditable with no mappings available.');
          setCloseSignal((token) => token + 1);
          return;
        }
        const result = maskContentEditableNodes(targetMatches, mappings);
        changed = result.changed;
      } else {
        const result = maskValueWithMatches(value, targetMatches);
        changed = result.changed;
        if (changed) {
          setElementValue(target, result.masked);
        }
      }

      if (!changed) {
        warn('Mask request produced no change', {
          filterId,
          index,
        });
        setCloseSignal((token) => token + 1);
        return;
      }

      log('Mask applied', {
        filterId,
        index,
        segments: targetMatches.map((match) => ({
          detectorId: match.detectorId,
          start: match.startIndex,
          end: match.endIndex,
        })),
      });

      if (isContentEditableElement(target)) {
        const { plainText: nextPlainText, mappings: nextMappings } = extractTextWithMapping(target as HTMLElement);
        setPlainText(nextPlainText);
        setMappings(nextMappings);
        setValue(nextPlainText);
      } else {
        setValue(getElementValue(target));
      }
      
      setCloseSignal((token) => token + 1);
    },
    [filterId, index, target, mappings, value],
  )

  const callbacksRef = useRef<TargetHighlighterCallbacks>({})

  callbacksRef.current = {
    onMaskSegment: useCallback(
      ({ matches: selectedMatches }: { matches: DetectionMatch[]; context: DetectionContext }) => {
        applyMask(selectedMatches)
      },
      [applyMask],
    ),
    onMaskAll: useCallback(
      ({ matches: allMatches }: { matches: DetectionMatch[]; context: DetectionContext }) => {
        applyMask(allMatches)
      },
      [applyMask],
    ),
    onIgnoreValue: useCallback((valueToIgnore: string) => {
      detectionEngine.ignoreMatch(valueToIgnore);
      const textToScan = isContentEditableElement(target) ? plainText : value;
      if (textToScan === null) return;
      void runDetection(textToScan, { trigger: 'auto' })
    }, [runDetection, plainText, value, target]),
    onUnignore: useCallback((valueToUnignore: string) => {
      detectionEngine.unignoreMatch(valueToUnignore);
      const textToScan = isContentEditableElement(target) ? plainText : value;
      if (textToScan === null) return;
      void runDetection(textToScan, { trigger: 'auto' })
    }, [runDetection, plainText, value, target]),
    onAddRule: useCallback((ruleToAdd: string) => {
      detectionEngine.addUserRule(ruleToAdd);
      const textToScan = isContentEditableElement(target) ? plainText : value;
      if (textToScan === null) return;
      void runDetection(textToScan, { trigger: 'auto' })
    }, [runDetection, plainText, value, target]),
    onRemoveRule: useCallback((ruleToRemove: string) => {
      detectionEngine.removeUserRule(ruleToRemove);
      const textToScan = isContentEditableElement(target) ? plainText : value;
      if (textToScan === null) return;
      void runDetection(textToScan, { trigger: 'auto' })
    }, [runDetection, plainText, value, target]),
    onRequestScan: useCallback(() => {
      const textToScan = isContentEditableElement(target) ? plainText : value;
      if (textToScan === null) return;
      void runDetection(textToScan, { trigger: 'manual' })
    }, [runDetection, plainText, value, target]),
    onContentScroll: useCallback(() => {
      highlighterRef.current?.update(valueRef.current, matchesRef.current, mappingsRef.current, ignoredValues, userRules)
    }, [ignoredValues, userRules]),
  }

  useEffect(() => {
    if (!isInputElement(target) && !isTextareaElement(target) && !isContentEditableElement(target)) {
      return
    }

    const highlighter = new TargetHighlighter(target, detectionContext, {
      onMaskSegment: (...args) => callbacksRef.current.onMaskSegment?.(...args),
      onMaskAll: (...args) => callbacksRef.current.onMaskAll?.(...args),
      onIgnoreValue: (...args) => callbacksRef.current.onIgnoreValue?.(...args),
      onUnignore: (...args) => callbacksRef.current.onUnignore?.(...args),
      onAddRule: (...args) => callbacksRef.current.onAddRule?.(...args),
      onRemoveRule: (...args) => callbacksRef.current.onRemoveRule?.(...args),
      onRequestScan: (...args) => callbacksRef.current.onRequestScan?.(...args),
      onContentScroll: (...args) => callbacksRef.current.onContentScroll?.(...args),
    })
    highlighterRef.current = highlighter

    return () => {
      highlighter.destroy()
      highlighterRef.current = null
    }
  }, [target, detectionContext])

  useEffect(() => {
    const textToScan = isContentEditableElement(target) ? plainText : value;

    if (textToScan === null) {
      return
    }
    
    void runDetection(textToScan, { trigger: 'auto' });
  }, [runDetection, value, plainText, target]);

  useEffect(() => {
    if (!isInputElement(target) && !isTextareaElement(target) && !isSelectElement(target)) {
      return
    }

    const handleInput = () => {
      const nextValue = getElementValue(target)
      if (isContentEditableElement(target)) {
        const { plainText: nextPlainText, mappings: nextMappings } = extractTextWithMapping(target as HTMLElement);
        setPlainText(nextPlainText);
        setMappings(nextMappings);
        setValue(nextPlainText);
      } else {
        setValue(nextValue);
      }
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
      const { plainText: nextPlainText, mappings: nextMappings } = extractTextWithMapping(target as HTMLElement);
      
      log('MirrorField contenteditable mutation', {
        filterId,
        index,
        value: nextPlainText,
      });

      setPlainText(nextPlainText);
      setMappings(nextMappings);
      setValue(nextPlainText);
    };

    handleMutation();

    const observer = new MutationObserver(handleMutation);

    observer.observe(target, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
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

  useEffect(() => {
    // This effect ensures that when the highlight toggle changes the state,
    // the highlighter component is re-rendered with the new visibility.
    highlighterRef.current?.update(
      valueRef.current,
      matchesRef.current,
      mappingsRef.current,
      ignoredValues,
      userRules,
      {
        isHighlightingActive,
        setIsHighlightingActive,
      },
    )
  }, [isHighlightingActive, ignoredValues, userRules, setIsHighlightingActive])

  const label = useMemo(() => deriveLabel(target, `Field #${index + 1}`), [target, index])
  const location = useMemo(() => target.getAttribute('name') || target.getAttribute('id') || 'Unnamed field', [target])

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (
    event,
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
          value={value ?? ''}
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
            borderRadius: '8px',
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
          borderRadius: '8px',
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
        border: '1px solid #cbd5f5',
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