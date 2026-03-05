'use client'

import React from 'react'
import { Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditableCell } from './EditableCell'
import { ItemDropdown } from './ItemDropdown'
import { Button } from './ui/button'
import type { InvoiceRow, ListaItem } from '@/lib/types'

interface ReviewTableProps {
  rows: InvoiceRow[]
  listaItems: ListaItem[]
  onUpdateRow: (id: string, updates: Partial<InvoiceRow>) => void
  onDeleteRow: (id: string) => void
  onAddRow: (sourcePdf: string) => void
}

const COLUMNS = [
  { key: 'data', label: 'Data', width: 'w-24' },
  { key: 'descricao', label: 'Descrição', width: 'w-48' },
  { key: 'quantidade', label: 'Qtd', width: 'w-20' },
  { key: 'item', label: 'Item (D)', width: 'w-52' },
  { key: 'itemId', label: 'ID', width: 'w-20' },
  { key: 'unidadeMedida', label: 'Unidade', width: 'w-20' },
  { key: 'unidadeNeg', label: 'Un. Negócio', width: 'w-28' },
  { key: 'filtro1', label: 'Filtro 1', width: 'w-24' },
  { key: 'filtro2', label: 'Filtro 2', width: 'w-24' },
  { key: 'filtro3', label: 'Filtro 3', width: 'w-24' },
  { key: 'filtro4', label: 'Filtro 4', width: 'w-24' },
] as const

// Group rows by sourcePdf
function groupByPdf(rows: InvoiceRow[]) {
  const groups: Map<string, InvoiceRow[]> = new Map()
  for (const row of rows) {
    if (!groups.has(row.sourcePdf)) groups.set(row.sourcePdf, [])
    groups.get(row.sourcePdf)!.push(row)
  }
  return groups
}

export function ReviewTable({
  rows,
  listaItems,
  onUpdateRow,
  onDeleteRow,
  onAddRow,
}: ReviewTableProps) {
  const groups = groupByPdf(rows)

  function handleChange(row: InvoiceRow, key: keyof InvoiceRow, value: string) {
    const updates: Partial<InvoiceRow> = { [key]: value, aiSuggested: false }
    onUpdateRow(row.id, updates)
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn('px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap', col.width)}
              >
                {col.label}
              </th>
            ))}
            <th className="px-3 py-2 text-left font-medium text-muted-foreground w-16">Ações</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(groups.entries()).map(([pdf, pdfRows]) => (
            <React.Fragment key={pdf}>
              {/* Group header */}
              <tr className="bg-muted/30">
                <td colSpan={COLUMNS.length + 1} className="px-3 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-muted-foreground truncate max-w-xl">
                      📄 {pdf}
                      <span className="ml-2 text-[10px] font-normal">
                        {pdfRows.length} {pdfRows.length === 1 ? 'linha' : 'linhas'}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => onAddRow(pdf)}
                    >
                      <Plus className="h-3 w-3" />
                      Linha
                    </Button>
                  </div>
                </td>
              </tr>

              {/* Data rows */}
              {pdfRows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b last:border-0 hover:bg-muted/20 transition-colors',
                    row.aiSuggested && 'bg-yellow-50 hover:bg-yellow-50/80'
                  )}
                >
                  {/* Data (A) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.data}
                      onChange={(v) => handleChange(row, 'data', v)}
                      placeholder="DD/MM/YYYY"
                    />
                  </td>
                  {/* Descrição (B) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.descricao}
                      onChange={(v) => handleChange(row, 'descricao', v)}
                    />
                  </td>
                  {/* Quantidade (C) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.quantidade}
                      onChange={(v) => handleChange(row, 'quantidade', v)}
                      placeholder="0"
                    />
                  </td>
                  {/* Item (D) — dropdown */}
                  <td className="px-2 py-1">
                    <ItemDropdown
                      items={listaItems}
                      value={row.item}
                      suggestedItem={row.aiSuggestedItem}
                      onChange={(v) => onUpdateRow(row.id, { item: v, aiSuggested: false })}
                    />
                  </td>
                  {/* ID (E) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.itemId}
                      onChange={(v) => handleChange(row, 'itemId', v)}
                    />
                  </td>
                  {/* Unidade (F) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.unidadeMedida}
                      onChange={(v) => handleChange(row, 'unidadeMedida', v)}
                      placeholder="m3"
                    />
                  </td>
                  {/* Un. Negócio (G) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.unidadeNeg}
                      onChange={(v) => handleChange(row, 'unidadeNeg', v)}
                    />
                  </td>
                  {/* Filtro 1 (H) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.filtro1}
                      onChange={(v) => handleChange(row, 'filtro1', v)}
                    />
                  </td>
                  {/* Filtro 2 (I) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.filtro2}
                      onChange={(v) => handleChange(row, 'filtro2', v)}
                    />
                  </td>
                  {/* Filtro 3 (J) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.filtro3}
                      onChange={(v) => handleChange(row, 'filtro3', v)}
                    />
                  </td>
                  {/* Filtro 4 (K) */}
                  <td className="px-2 py-1">
                    <EditableCell
                      value={row.filtro4}
                      onChange={(v) => handleChange(row, 'filtro4', v)}
                    />
                  </td>
                  {/* Actions */}
                  <td className="px-2 py-1">
                    <button
                      onClick={() => onDeleteRow(row.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remover linha"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
