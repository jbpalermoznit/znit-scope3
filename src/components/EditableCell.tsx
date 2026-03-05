'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface EditableCellProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  inputClassName?: string
}

export function EditableCell({
  value,
  onChange,
  className,
  placeholder = '—',
  inputClassName,
}: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [editing, value])

  function commit() {
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        className={cn(
          'w-full rounded border border-ring px-1.5 py-0.5 text-xs focus:outline-none',
          inputClassName
        )}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        'block w-full cursor-text rounded px-1.5 py-0.5 text-xs hover:bg-accent/50 transition-colors',
        !value && 'text-muted-foreground',
        className
      )}
      title="Clique para editar"
    >
      {value || placeholder}
    </span>
  )
}
