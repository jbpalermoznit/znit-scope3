'use client'

import { ChevronUp, ChevronDown, Settings2 } from 'lucide-react'
import { Button } from './ui/button'
import type { ColumnDef } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ColumnConfiguratorProps {
  columns: ColumnDef[]
  onChange: (columns: ColumnDef[]) => void
}

export function ColumnConfigurator({ columns, onChange }: ColumnConfiguratorProps) {
  function toggle(key: string) {
    onChange(columns.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c)))
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...columns]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Configurar colunas</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {columns.filter((c) => c.enabled).length} de {columns.length} ativas
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
        {columns.map((col, i) => (
          <div
            key={col.key}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs',
              col.enabled ? 'bg-background' : 'bg-muted/40 opacity-60'
            )}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={col.enabled}
              onChange={() => toggle(col.key)}
              className="h-3.5 w-3.5 cursor-pointer accent-primary shrink-0"
            />
            <span className={cn('flex-1 truncate', !col.enabled && 'line-through text-muted-foreground')}>
              {col.label}
            </span>
            {/* Reorder buttons */}
            <div className="flex flex-col shrink-0">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed leading-none"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === columns.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed leading-none"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() => {
            // Reset to all enabled, original order is in DEFAULT_COLUMNS — user can just uncheck
            onChange(columns.map((c) => ({ ...c, enabled: true })))
          }}
        >
          Ativar todas
        </Button>
      </div>
    </div>
  )
}
