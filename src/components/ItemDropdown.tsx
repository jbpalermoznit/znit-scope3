'use client'

import { useState, useRef, useEffect } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between rounded border border-input bg-background px-2 py-1 text-xs hover:bg-accent transition-colors',
          !value && 'text-muted-foreground'
        )}
      >
        <span className="truncate max-w-[180px]">{value || 'Selecionar...'}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground ml-1" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-md border bg-popover shadow-lg">
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
                onClick={() => {
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
      )}
    </div>
  )
}
