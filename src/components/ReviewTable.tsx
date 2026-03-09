'use client'

import React, { useState } from 'react'
import { Trash2, Plus, AlertTriangle, HelpCircle, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableCell } from './EditableCell'
import { ItemDropdown } from './ItemDropdown'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import type { ColumnDef, InvoiceRow, ListaItem } from '@/lib/types'
import { DEFAULT_COLUMNS } from '@/lib/types'

type FilterType = 'all' | 'none' | 'low' | 'high'

interface ReviewTableProps {
  rows: InvoiceRow[]
  listaItems: ListaItem[]
  columnConfig?: ColumnDef[]
  onUpdateRow: (id: string, updates: Partial<InvoiceRow>) => void
  onDeleteRow: (id: string) => void
  onAddRow: (sourcePdf: string) => void
}

function groupByPdf(rows: InvoiceRow[]) {
  const groups: Map<string, InvoiceRow[]> = new Map()
  for (const row of rows) {
    if (!groups.has(row.sourcePdf)) groups.set(row.sourcePdf, [])
    groups.get(row.sourcePdf)!.push(row)
  }
  return groups
}

const COL_WIDTHS: Record<string, string> = {
  data:          '6%',
  descricao:     '16%',
  quantidade:    '5%',
  item:          '14%',
  itemId:        '4%',
  unidadeMedida: '5%',
  unidadeNeg:    '8%',
  filtro1:       '6%',
  filtro2:       '6%',
  filtro3:       '6%',
  filtro4:       '6%',
  valorTotal:    '7%',
  sourcePdf:     '11%',
}

const PLACEHOLDERS: Record<string, string> = {
  data: 'DD/MM/YYYY',
  quantidade: '0',
  unidadeMedida: 'm3',
  valorTotal: '0.00',
}

export function ReviewTable({
  rows,
  listaItems,
  columnConfig = DEFAULT_COLUMNS,
  onUpdateRow,
  onDeleteRow,
  onAddRow,
}: ReviewTableProps) {
  const enabledCols = columnConfig.filter((c) => c.enabled)

  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [bulkItem, setBulkItem] = useState('')

  const counts = {
    all: rows.length,
    none: rows.filter((r) => r.matchConfidence === 'none').length,
    low: rows.filter((r) => r.matchConfidence === 'low').length,
    high: rows.filter((r) => !r.aiSuggested || r.matchConfidence === 'high').length,
  }

  const visibleRows =
    filter === 'all'
      ? rows
      : filter === 'high'
      ? rows.filter((r) => !r.aiSuggested || r.matchConfidence === 'high')
      : rows.filter((r) => r.matchConfidence === filter)

  const groups = groupByPdf(visibleRows)

  const allVisibleIds = visibleRows.map((r) => r.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id))

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allVisibleIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        allVisibleIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function applyBulkItem() {
    if (!bulkItem) return
    selectedIds.forEach((id) =>
      onUpdateRow(id, { item: bulkItem, aiSuggested: false, matchConfidence: 'high', matchNote: undefined })
    )
    setSelectedIds(new Set())
    setBulkItem('')
  }

  function bulkDelete() {
    selectedIds.forEach((id) => onDeleteRow(id))
    setSelectedIds(new Set())
  }

  function handleChange(row: InvoiceRow, key: keyof InvoiceRow, value: string) {
    onUpdateRow(row.id, { [key]: value, aiSuggested: false })
  }

  function renderCell(col: ColumnDef, row: InvoiceRow, isExpanded: boolean) {
    const r = row as Record<string, unknown>
    const value = (r[col.key] as string) ?? ''
    const textClass = isExpanded ? 'break-words whitespace-normal' : 'truncate'

    if (col.key === 'item') {
      return (
        <ItemDropdown
          items={listaItems}
          value={row.item}
          suggestedItem={row.aiSuggestedItem}
          onChange={(v) => onUpdateRow(row.id, { item: v, aiSuggested: false })}
        />
      )
    }

    if (col.key === 'sourcePdf') {
      return (
        <span className={cn('text-xs text-muted-foreground block w-full', textClass)}>
          {value}
        </span>
      )
    }

    return (
      <EditableCell
        value={value}
        onChange={(v) => handleChange(row, col.key as keyof InvoiceRow, v)}
        placeholder={PLACEHOLDERS[col.key]}
        className={textClass}
      />
    )
  }

  const filterButtons: { key: FilterType; label: string; activeClass: string; inactiveClass: string }[] = [
    { key: 'all',  label: 'Todos',                  activeClass: 'bg-primary text-primary-foreground', inactiveClass: 'bg-muted/50 hover:bg-muted text-foreground' },
    { key: 'none', label: 'Não encontrado',          activeClass: 'bg-red-600 text-white',              inactiveClass: 'bg-muted/50 hover:bg-muted text-red-600' },
    { key: 'low',  label: 'Correspondência incerta', activeClass: 'bg-orange-500 text-white',           inactiveClass: 'bg-muted/50 hover:bg-muted text-orange-600' },
    { key: 'high', label: 'Confirmados',             activeClass: 'bg-green-600 text-white',            inactiveClass: 'bg-muted/50 hover:bg-muted text-green-600' },
  ]

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-background shrink-0 flex-wrap">
        {filterButtons.map((fb) => (
          <button
            key={fb.key}
            onClick={() => { setFilter(fb.key); setSelectedIds(new Set()) }}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              filter === fb.key ? fb.activeClass : fb.inactiveClass
            )}
          >
            {fb.label}
            <span className="ml-1 opacity-70">({counts[fb.key]})</span>
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border-b shrink-0 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedIds.size} selecionada{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-muted-foreground shrink-0">Atribuir item:</span>
            <div className="w-56">
              <ItemDropdown items={listaItems} value={bulkItem} onChange={setBulkItem} />
            </div>
            <Button size="sm" className="h-7 text-xs shrink-0" onClick={applyBulkItem} disabled={!bulkItem}>
              Aplicar
            </Button>
          </div>
          <Button size="sm" variant="destructive" className="h-7 text-xs gap-1 shrink-0" onClick={bulkDelete}>
            <Trash2 className="h-3 w-3" />
            Excluir
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-xs border-collapse table-fixed">
          <colgroup>
            <col style={{ width: '24px' }} />
            <col style={{ width: '28px' }} />
            {enabledCols.map((col) => (
              <col key={col.key} style={{ width: COL_WIDTHS[col.key] ?? '6%' }} />
            ))}
            <col style={{ width: '36px' }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/50 border-b">
              <th className="px-1 py-2" />
              <th className="px-1 py-0 text-left align-middle">
                <div className="mt-1.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                  />
                </div>
              </th>
              {enabledCols.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-left font-medium text-muted-foreground overflow-hidden"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="truncate cursor-default">{col.label}</div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {col.label}
                    </TooltipContent>
                  </Tooltip>
                </th>
              ))}
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {Array.from(groups.entries()).map(([pdf, pdfRows]) => (
              <React.Fragment key={pdf}>
                <tr className="bg-muted/30">
                  <td colSpan={enabledCols.length + 3} className="px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground truncate max-w-xl">
                        📄 {pdf}
                        <span className="ml-2 text-[10px] font-normal">
                          {pdfRows.length} {pdfRows.length === 1 ? 'linha' : 'linhas'}
                        </span>
                      </span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => onAddRow(pdf)}>
                        <Plus className="h-3 w-3" />
                        Linha
                      </Button>
                    </div>
                  </td>
                </tr>

                {pdfRows.map((row) => {
                  const isSelected = selectedIds.has(row.id)
                  const isExpanded = expandedIds.has(row.id)
                  const hasWarning = row.aiSuggested && (row.matchConfidence === 'none' || row.matchConfidence === 'low')

                  return (
                    <React.Fragment key={row.id}>
                      {/* Confidence warning banner */}
                      {hasWarning && (
                        <tr className={cn('border-b', row.matchConfidence === 'none' ? 'bg-red-50' : 'bg-orange-50')}>
                          <td colSpan={2} /> {/* expand + checkbox spacer */}
                          <td
                            colSpan={enabledCols.length + 1}
                            className={cn(
                              'px-3 py-1 text-xs',
                              row.matchConfidence === 'none' ? 'text-red-700' : 'text-orange-700'
                            )}
                          >
                            <div className="flex items-start gap-1.5">
                              {row.matchConfidence === 'none' ? (
                                <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              )}
                              <span>
                                {row.matchConfidence === 'none' ? (
                                  <strong>Item não encontrado na lista. </strong>
                                ) : (
                                  <strong>Correspondência incerta. </strong>
                                )}
                                {row.matchNote
                                  ? row.matchNote
                                  : row.matchConfidence === 'none' && 'Selecione o item correto no campo "Item".'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Data row */}
                      <tr
                        className={cn(
                          'border-b transition-colors',
                          !isExpanded && 'h-9',
                          isSelected
                            ? 'bg-primary/5'
                            : row.matchConfidence === 'none' && row.aiSuggested
                            ? 'bg-red-50/60 hover:bg-red-50/80'
                            : row.matchConfidence === 'low' && row.aiSuggested
                            ? 'bg-orange-50/60 hover:bg-orange-50/80'
                            : row.aiSuggested
                            ? 'bg-yellow-50 hover:bg-yellow-50/80'
                            : 'hover:bg-muted/20'
                        )}
                      >
                        {/* Expand toggle */}
                        <td className="px-1 py-0 align-top">
                          <button
                            onClick={() => toggleExpand(row.id)}
                            className="mt-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            title={isExpanded ? 'Recolher' : 'Expandir linha'}
                          >
                            {isExpanded
                              ? <ChevronDown className="h-3.5 w-3.5" />
                              : <ChevronRight className="h-3.5 w-3.5" />
                            }
                          </button>
                        </td>
                        {/* Checkbox */}
                        <td className="px-1 py-0 align-top">
                          <div className="mt-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(row.id)}
                              className="h-3.5 w-3.5 cursor-pointer accent-primary"
                            />
                          </div>
                        </td>
                        {enabledCols.map((col) => (
                          <td key={col.key} className="px-2 py-1 align-top">
                            {renderCell(col, row, isExpanded)}
                          </td>
                        ))}
                        <td className="px-1 py-0 align-top">
                          <button
                            onClick={() => onDeleteRow(row.id)}
                            className="mt-1 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remover linha"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </TooltipProvider>
  )
}
