'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  FolderOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useInvoiceStore } from '@/store/invoiceStore'
import type { PdfFile } from '@/lib/types'

function statusVariant(status?: string) {
  if (status === 'done') return 'success'
  if (status === 'error') return 'destructive'
  if (status === 'processing') return 'warning'
  return 'pending'
}

function statusLabel(status?: string) {
  if (status === 'done') return 'Concluído'
  if (status === 'error') return 'Erro'
  if (status === 'processing') return 'Processando...'
  return 'Aguardando'
}

export default function HomePage() {
  const router = useRouter()
  const {
    pdfs, setPdfs, listaItems, setListaItems,
    processingStates, setProcessingState, addRows, reset,
  } = useInvoiceStore()

  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const doneCount = Object.values(processingStates).filter((s) => s.status === 'done').length
  const totalRows = useInvoiceStore((s) => s.rows.length)
  const progress = pdfs.length > 0 ? (doneCount / pdfs.length) * 100 : 0
  const allDone = pdfs.length > 0 && doneCount === pdfs.length
  const hasErrors = Object.values(processingStates).some((s) => s.status === 'error')

  async function scan() {
    setLoading(true)
    setScanError(null)
    try {
      const [scanRes, listaRes] = await Promise.all([
        fetch('/api/scan').then((r) => r.json()),
        fetch('/api/lista').then((r) => r.json()),
      ])
      if (scanRes.error) throw new Error(scanRes.error)
      if (listaRes.error) throw new Error(listaRes.error)
      setPdfs(scanRes.pdfs as PdfFile[])
      setListaItems(listaRes.items)
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Erro ao carregar arquivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (pdfs.length === 0) scan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function processAll() {
    reset()
    setProcessing(true)
    // Re-load pdfs and lista fresh
    const [scanRes, listaRes] = await Promise.all([
      fetch('/api/scan').then((r) => r.json()),
      fetch('/api/lista').then((r) => r.json()),
    ])
    const freshPdfs: PdfFile[] = scanRes.pdfs ?? []
    setPdfs(freshPdfs)
    setListaItems(listaRes.items ?? [])

    for (const pdf of freshPdfs) {
      setProcessingState(pdf.relativePath, { status: 'processing' })
      try {
        const res = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error ?? 'Erro desconhecido')
        addRows(data.rows)
        setProcessingState(pdf.relativePath, { status: 'done', rowCount: data.rows.length })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro'
        setProcessingState(pdf.relativePath, { status: 'error', error: msg })
      }
    }
    setProcessing(false)
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Processamento de Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analise os PDFs com IA e preencha a planilha de Bens e Serviços Comprados (Scope 3).
        </p>
      </div>

      {/* Files card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Arquivos em Input_Files</CardTitle>
              <CardDescription>
                {pdfs.length === 0 ? 'Nenhum PDF encontrado' : `${pdfs.length} arquivo(s) encontrado(s)`}
                {listaItems.length > 0 && ` · ${listaItems.length} itens na Lista`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={scan} disabled={loading || processing}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {scanError && (
            <p className="text-sm text-destructive mb-3">{scanError}</p>
          )}

          {pdfs.length === 0 && !loading && !scanError && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhum PDF encontrado em Input_Files/</p>
              <p className="text-xs mt-1">Adicione arquivos .pdf à pasta e clique em Atualizar</p>
            </div>
          )}

          {pdfs.length > 0 && (
            <div className="divide-y rounded-md border overflow-hidden">
              {pdfs.map((pdf) => {
                const state = processingStates[pdf.relativePath]
                return (
                  <div
                    key={pdf.relativePath}
                    className="flex items-center gap-3 px-4 py-3 text-sm bg-background hover:bg-muted/30 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pdf.filename}</p>
                      {/* Show folder-derived values if any */}
                      {(pdf.unidadeNeg || pdf.filtro1) && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {[pdf.unidadeNeg, pdf.filtro1, pdf.filtro2, pdf.filtro3, pdf.filtro4]
                            .filter(Boolean)
                            .join(' › ')}
                        </p>
                      )}
                      {state?.status === 'error' && (
                        <p className="text-xs text-destructive mt-0.5">{state.error}</p>
                      )}
                      {state?.status === 'done' && state.rowCount !== undefined && (
                        <p className="text-xs text-green-700 mt-0.5">
                          {state.rowCount} {state.rowCount === 1 ? 'linha extraída' : 'linhas extraídas'}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariant(state?.status) as any}>
                      {state?.status === 'processing' && (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      )}
                      {state?.status === 'done' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {state?.status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                      {statusLabel(state?.status)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress bar during processing */}
      {processing && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processando com IA...</span>
            <span>{doneCount} / {pdfs.length}</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={processAll}
          disabled={pdfs.length === 0 || processing || loading}
          className="gap-2"
        >
          {processing && <Loader2 className="h-4 w-4 animate-spin" />}
          {processing ? 'Processando...' : 'Processar Todos com IA'}
        </Button>

        {(allDone || (totalRows > 0)) && (
          <Button
            variant="outline"
            onClick={() => router.push('/review')}
            className="gap-2"
          >
            Revisar Dados
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {hasErrors && (
          <p className="text-xs text-destructive">
            Alguns arquivos falharam. Verifique sua ANTHROPIC_API_KEY.
          </p>
        )}
      </div>

      {/* Legend */}
      {totalRows > 0 && !processing && (
        <p className="text-xs text-muted-foreground">
          {totalRows} {totalRows === 1 ? 'linha extraída' : 'linhas extraídas'} no total.{' '}
          Clique em <strong>Revisar Dados</strong> para conferir e exportar.
        </p>
      )}
    </div>
  )
}
