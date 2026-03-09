'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Loader2, Info, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewTable } from '@/components/ReviewTable'
import { ColumnConfigurator } from '@/components/ColumnConfigurator'
import { useInvoiceStore } from '@/store/invoiceStore'
import type { InvoiceRow } from '@/lib/types'

export default function ReviewPage() {
  const router = useRouter()
  const { rows, listaItems, columnConfig, setColumnConfig, updateRow, deleteRow, addBlankRow } = useInvoiceStore()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [showConfigurator, setShowConfigurator] = useState(false)

  const aiRows = rows.filter((r) => r.aiSuggested).length
  const confirmedRows = rows.length - aiRows

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, columnConfig }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao exportar')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bens_Servicos_Comprados_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Erro ao exportar')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-3.5rem-4rem)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/escopo3')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Revisão dos Dados</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {rows.length} {rows.length === 1 ? 'linha' : 'linhas'} extraídas
              {aiRows > 0 && (
                <span className="ml-1">· <span className="text-yellow-700">{aiRows} com sugestão IA</span></span>
              )}
              {confirmedRows > 0 && (
                <span className="ml-1">· <span className="text-green-700">{confirmedRows} confirmadas</span></span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowConfigurator((v) => !v)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            Colunas
            {showConfigurator ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          <Button onClick={handleExport} disabled={rows.length === 0 || exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      {/* Column configurator panel */}
      {showConfigurator && (
        <ColumnConfigurator columns={columnConfig} onChange={setColumnConfig} />
      )}

      {/* Legend */}
      {rows.length > 0 && aiRows > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 shrink-0" /> Sugestão IA — revise e confirme</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-orange-300 shrink-0" /> Correspondência incerta — verifique o item</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-red-300 shrink-0" /> Item não encontrado — seleção manual obrigatória</span>
        </div>
      )}

      {/* Error */}
      {exportError && (
        <p className="text-sm text-destructive">{exportError}</p>
      )}

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">Nenhuma linha para revisar.</p>
          <Button variant="link" onClick={() => router.push('/escopo3')}>
            Voltar e processar PDFs
          </Button>
        </div>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border">
        <ReviewTable
          rows={rows}
          listaItems={listaItems}
          columnConfig={columnConfig}
          onUpdateRow={(id, updates) => updateRow(id, updates as Partial<InvoiceRow>)}
          onDeleteRow={deleteRow}
          onAddRow={addBlankRow}
        />
        </div>
      )}
    </div>
  )
}
