'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ListaItem } from '@/lib/types'

interface ItemDropdownProps {
  items: ListaItem[]
  value: string
  suggestedItem?: string
  onChange: (value: string) => void
  className?: string
}

export function ItemDropdown({ items, value, suggestedItem, onChange, className }: ItemDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const openDropdown = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPopupStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: 288,
        zIndex: 9999,
      })
    }
    setSearch('')
    setOpen(true)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const popup = open ? (
    <div
      ref={popupRef}
      style={{ ...popupStyle, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
    >
      <div className="p-2 border-b">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar item..."
          className="w-full text-xs rounded border border-input px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        />
      </div>
      <ul className="max-h-48 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-xs text-muted-foreground">Nenhum item encontrado</li>
        )}
        {filtered.map((item) => (
          <li
            key={item.name}
            onMouseDown={(e) => {
              e.preventDefault()
              onChange(item.name)
              setOpen(false)
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-accent',
              item.name === value && 'bg-accent',
              item.name === suggestedItem && 'bg-yellow-50 font-medium'
            )}
          >
            {item.name === value && <Check className="h-3 w-3 shrink-0" />}
            {item.name !== value && <span className="w-3 shrink-0" />}
            <span className="truncate">{item.name}</span>
            {item.name === suggestedItem && item.name !== value && (
              <span className="ml-auto text-[10px] text-yellow-600 shrink-0">IA</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  ) : null

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={cn(
          'flex w-full items-center justify-between rounded border border-input bg-background px-2 py-1 text-xs hover:bg-accent transition-colors',
          !value && 'text-muted-foreground'
        )}
      >
        <span className="truncate">{value || 'Selecionar...'}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground ml-1" />
      </button>

      {typeof document !== 'undefined' && popup && createPortal(popup, document.body)}
    </div>
  )
}
