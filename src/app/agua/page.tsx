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
  FolderSearch,
  Cloud,
  HardDrive,
  LogIn,
  Copy,
  ArrowLeft,
  Droplets,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAguaStore } from '@/store/aguaStore'
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

export default function AguaPage() {
  const router = useRouter()
  const {
    pdfs, setPdfs, listaItems, setListaItems,
    processingStates, setProcessingState, addRows, reset,
    inputDir, setInputDir, clearScan,
    setOnedriveSync, clearOnedriveSync,
  } = useAguaStore()

  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [sourceMode, setSourceMode] = useState<'local' | 'onedrive'>('local')
  const [onedriveUrl, setOnedriveUrl] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncInfo, setSyncInfo] = useState<{ downloaded: number; total: number } | null>(null)
  const [onedriveFiltros, setOnedriveFiltros] = useState({ unidadeNeg: '', filtro1: '', filtro2: '', filtro3: '' })
  const [filtroSuggestions, setFiltroSuggestions] = useState<{ options: string[] }>({ options: [] })
  const [msToken, setMsToken] = useState<string | null>(null)
  const [authState, setAuthState] = useState<'idle' | 'loading' | 'waiting' | 'done'>('idle')
  const [deviceCode, setDeviceCode] = useState<{ code: string; url: string; device_code: string; interval: number } | null>(null)

  const doneCount = Object.values(processingStates).filter((s) => s.status === 'done').length
  const totalRows = useAguaStore((s) => s.rows.length)
  const progress = pdfs.length > 0 ? (doneCount / pdfs.length) * 100 : 0
  const allDone = pdfs.length > 0 && doneCount === pdfs.length
  const hasErrors = Object.values(processingStates).some((s) => s.status === 'error')

  async function startMicrosoftLogin() {
    setAuthState('loading')
    setScanError(null)
    try {
      const res = await fetch('/api/auth/device-code').then((r) => r.json())
      if (res.error) throw new Error(res.error)
      setDeviceCode({
        code: res.user_code,
        url: res.verification_uri,
        device_code: res.device_code,
        interval: res.interval ?? 5,
      })
      setAuthState('waiting')

      const poll = async () => {
        const pollRes = await fetch('/api/auth/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceCode: res.device_code }),
        }).then((r) => r.json())

        if (pollRes.status === 'ok') {
          setMsToken(pollRes.accessToken)
          setAuthState('done')
          setDeviceCode(null)
        } else if (pollRes.status === 'pending') {
          setTimeout(poll, (res.interval ?? 5) * 1000)
        } else if (pollRes.status === 'expired') {
          setAuthState('idle')
          setScanError('Código expirado. Clique em "Entrar com Microsoft" para gerar um novo.')
        } else {
          setAuthState('idle')
          setScanError(pollRes.error ?? 'Erro de autenticação desconhecido.')
        }
      }
      setTimeout(poll, (res.interval ?? 5) * 1000)
    } catch (e) {
      setAuthState('idle')
      setScanError(e instanceof Error ? e.message : 'Erro ao iniciar login Microsoft')
    }
  }

  async function syncOneDrive() {
    if (!onedriveUrl || !msToken) return
    setSyncing(true)
    setScanError(null)
    setSyncInfo(null)
    clearScan()
    try {
      const syncRes = await fetch('/api/onedrive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharingUrl: onedriveUrl, accessToken: msToken }),
      })
      const syncData = await syncRes.json()
      if (!syncRes.ok || syncData.error) throw new Error(syncData.error ?? 'Erro ao sincronizar')

      setSyncInfo({ downloaded: syncData.downloaded, total: syncData.total })
      setInputDir(syncData.dir)
      setOnedriveSync(msToken, onedriveUrl)

      setLoading(true)
      const scanUrl = `/api/scan?dir=${encodeURIComponent(syncData.dir)}`
      const [scanRes2, listaRes] = await Promise.all([
        fetch(scanUrl).then((r) => r.json()),
        fetch('/api/lista').then((r) => r.json()),
      ])
      if (scanRes2.error) throw new Error(scanRes2.error)
      if (listaRes.error) throw new Error(listaRes.error)
      const scannedPdfs = scanRes2.pdfs as PdfFile[]
      setPdfs(scannedPdfs)
      setListaItems(listaRes.items)

      const unique = (arr: string[]) => [...new Set(arr.filter(Boolean))]
      const driveNames: string[] = syncData.folderNames ?? []
      const subNames = unique([
        ...scannedPdfs.map((p) => p.unidadeNeg),
        ...scannedPdfs.map((p) => p.filtro1),
        ...scannedPdfs.map((p) => p.filtro2),
        ...scannedPdfs.map((p) => p.filtro3),
      ])
      setFiltroSuggestions({ options: unique([...driveNames, ...subNames]) })
      setOnedriveFiltros({ unidadeNeg: '', filtro1: '', filtro2: '', filtro3: '' })
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Erro ao sincronizar OneDrive')
    } finally {
      setSyncing(false)
      setLoading(false)
    }
  }

  async function pickFolder() {
    setPicking(true)
    try {
      const res = await fetch('/api/pick-folder').then((r) => r.json())
      if (res.dir) {
        clearScan()
        setInputDir(res.dir)
        setLoading(true)
        setScanError(null)
        const scanUrl = `/api/scan?dir=${encodeURIComponent(res.dir)}`
        const [scanRes, listaRes] = await Promise.all([
          fetch(scanUrl).then((r) => r.json()),
          fetch('/api/lista').then((r) => r.json()),
        ])
        if (scanRes.error) throw new Error(scanRes.error)
        if (listaRes.error) throw new Error(listaRes.error)
        setPdfs(scanRes.pdfs as PdfFile[])
        setListaItems(listaRes.items)
      }
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Erro ao selecionar pasta')
    } finally {
      setPicking(false)
      setLoading(false)
    }
  }

  async function scan() {
    setLoading(true)
    setScanError(null)
    try {
      const scanUrl = inputDir
        ? `/api/scan?dir=${encodeURIComponent(inputDir)}`
        : '/api/scan'
      const [scanRes, listaRes] = await Promise.all([
        fetch(scanUrl).then((r) => r.json()),
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
    const scanUrl = inputDir
      ? `/api/scan?dir=${encodeURIComponent(inputDir)}`
      : '/api/scan'
    const [scanRes, listaRes] = await Promise.all([
      fetch(scanUrl).then((r) => r.json()),
      fetch('/api/lista').then((r) => r.json()),
    ])
    const freshPdfs: PdfFile[] = scanRes.pdfs ?? []
    setPdfs(freshPdfs)
    setListaItems(listaRes.items ?? [])

    for (const pdf of freshPdfs) {
      setProcessingState(pdf.relativePath, { status: 'processing' })
      try {
        const pdfToSend = sourceMode === 'onedrive'
          ? {
              ...pdf,
              unidadeNeg: onedriveFiltros.unidadeNeg || pdf.unidadeNeg,
              filtro1: onedriveFiltros.filtro1 || pdf.filtro1,
              filtro2: onedriveFiltros.filtro2 || pdf.filtro2,
              filtro3: onedriveFiltros.filtro3 || pdf.filtro3,
            }
          : pdf
        const res = await fetch('/api/process-agua', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf: pdfToSend }),
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
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="shrink-0 mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-sky-500" />
            <h1 className="text-xl font-semibold text-foreground">Processamento de Contas de Água</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Analise contas de água e saneamento com IA — extrai consumo (m³) e custo por unidade.
          </p>
        </div>
      </div>

      {/* Source selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Origem dos Arquivos</CardTitle>
          <CardDescription>Selecione de onde os PDFs serão carregados.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex gap-2">
            <Button
              variant={sourceMode === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceMode('local')}
              disabled={processing || syncing}
              className="gap-2"
            >
              <HardDrive className="h-4 w-4" />
              Pasta Local
            </Button>
            <Button
              variant={sourceMode === 'onedrive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceMode('onedrive')}
              disabled={processing || syncing}
              className="gap-2"
            >
              <Cloud className="h-4 w-4" />
              OneDrive
            </Button>
          </div>

          {sourceMode === 'local' && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={pickFolder}
                disabled={picking || processing}
                className="gap-2 shrink-0"
              >
                {picking ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSearch className="h-4 w-4" />}
                Selecionar Pasta
              </Button>
              {inputDir && sourceMode === 'local' ? (
                <p className="text-sm font-mono text-muted-foreground truncate" title={inputDir}>{inputDir}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma pasta selecionada — usando <code className="text-xs">Input_Files/</code>
                </p>
              )}
            </div>
          )}

          {sourceMode === 'onedrive' && (
            <div className="space-y-3">
              {authState !== 'done' && (
                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Passo 1 — Login Microsoft</p>
                  {authState === 'idle' && (
                    <Button variant="outline" size="sm" onClick={startMicrosoftLogin} disabled={processing} className="gap-2">
                      <LogIn className="h-4 w-4" />
                      Entrar com Microsoft
                    </Button>
                  )}
                  {authState === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Iniciando autenticação...
                    </div>
                  )}
                  {authState === 'waiting' && deviceCode && (
                    <div className="space-y-2">
                      <p className="text-sm">
                        Acesse{' '}
                        <a href={deviceCode.url} target="_blank" rel="noopener noreferrer" className="font-medium underline text-primary">
                          {deviceCode.url}
                        </a>{' '}
                        e insira o código:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold tracking-widest bg-muted px-3 py-1 rounded">{deviceCode.code}</code>
                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(deviceCode.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Aguardando login...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {authState === 'done' && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Autenticado com Microsoft</span>
                  <Button
                    variant="ghost" size="sm"
                    className="text-xs h-auto py-0.5 px-2 ml-auto"
                    onClick={() => { setMsToken(null); setAuthState('idle'); clearOnedriveSync() }}
                  >
                    Sair
                  </Button>
                </div>
              )}

              {authState === 'done' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Passo 2 — Link da pasta</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://empresa.sharepoint.com/:f:/s/..."
                      value={onedriveUrl}
                      onChange={(e) => setOnedriveUrl(e.target.value)}
                      disabled={syncing || processing}
                      className="font-mono text-sm"
                    />
                    <Button onClick={syncOneDrive} disabled={!onedriveUrl || syncing || processing} className="gap-2 shrink-0">
                      {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                      {syncing ? 'Sincronizando...' : 'Sincronizar'}
                    </Button>
                  </div>
                  {syncInfo && !syncing && (
                    <p className="text-xs text-green-700">{syncInfo.downloaded} de {syncInfo.total} PDF(s) baixado(s) com sucesso.</p>
                  )}
                </div>
              )}

              {syncInfo && !syncing && (
                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Filtros (aplicados a todos os PDFs)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['unidadeNeg', 'filtro1', 'filtro2', 'filtro3'] as const).map((key) => {
                      const labels: Record<string, string> = { unidadeNeg: 'Un. Negócio', filtro1: 'Filtro 1', filtro2: 'Filtro 2', filtro3: 'Filtro 3' }
                      const opts = filtroSuggestions.options
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-xs text-muted-foreground block">{labels[key]}</label>
                          {opts.length > 0 && (
                            <select
                              value={opts.includes(onedriveFiltros[key]) ? onedriveFiltros[key] : ''}
                              onChange={(e) => { if (e.target.value) setOnedriveFiltros((f) => ({ ...f, [key]: e.target.value })) }}
                              disabled={processing}
                              className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                            >
                              <option value="">— selecione —</option>
                              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          )}
                          <Input
                            value={onedriveFiltros[key]}
                            onChange={(e) => setOnedriveFiltros((f) => ({ ...f, [key]: e.target.value }))}
                            placeholder={opts.length > 0 ? 'ou escreva manualmente' : 'Digite o valor...'}
                            disabled={processing}
                            className="text-sm h-8"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files card */}
      <Card>
        <CardHeader className="pb-3">
          <div>
            <CardTitle className="text-base">
              Arquivos encontrados{inputDir ? '' : ' em Input_Files'}
            </CardTitle>
            <CardDescription>
              {pdfs.length === 0 ? 'Nenhum PDF encontrado' : `${pdfs.length} arquivo(s) encontrado(s)`}
              {listaItems.length > 0 && ` · ${listaItems.length} itens na Lista`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {scanError && <p className="text-sm text-destructive mb-3">{scanError}</p>}

          {pdfs.length === 0 && !loading && !scanError && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Nenhum PDF encontrado em <code className="text-xs">{inputDir || 'Input_Files/'}</code></p>
              <p className="text-xs mt-1">Adicione arquivos .pdf à pasta e clique em Carregar</p>
            </div>
          )}

          {pdfs.length > 0 && (
            <div className="divide-y rounded-md border overflow-hidden">
              {pdfs.map((pdf) => {
                const state = processingStates[pdf.relativePath]
                return (
                  <div key={pdf.relativePath} className="flex items-center gap-3 px-4 py-3 text-sm bg-background hover:bg-muted/30 transition-colors">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pdf.filename}</p>
                      {(pdf.unidadeNeg || pdf.filtro1) && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {[pdf.unidadeNeg, pdf.filtro1, pdf.filtro2, pdf.filtro3, pdf.filtro4].filter(Boolean).join(' › ')}
                        </p>
                      )}
                      {state?.status === 'error' && <p className="text-xs text-destructive mt-0.5">{state.error}</p>}
                      {state?.status === 'done' && state.rowCount !== undefined && (
                        <p className="text-xs text-green-700 mt-0.5">
                          {state.rowCount} {state.rowCount === 1 ? 'linha extraída' : 'linhas extraídas'}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariant(state?.status) as any}>
                      {state?.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
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

      {processing && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processando com IA...</span>
            <span>{doneCount} / {pdfs.length}</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={processAll} disabled={pdfs.length === 0 || processing || loading} className="gap-2">
          {processing && <Loader2 className="h-4 w-4 animate-spin" />}
          {processing ? 'Processando...' : 'Processar Todos com IA'}
        </Button>

        {(allDone || totalRows > 0) && (
          <Button variant="outline" onClick={() => router.push('/agua/review')} className="gap-2">
            Revisar Dados
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {hasErrors && (
          <p className="text-xs text-destructive">Alguns arquivos falharam. Verifique sua ANTHROPIC_API_KEY.</p>
        )}
      </div>

      {totalRows > 0 && !processing && (
        <p className="text-xs text-muted-foreground">
          {totalRows} {totalRows === 1 ? 'linha extraída' : 'linhas extraídas'} no total.{' '}
          Clique em <strong>Revisar Dados</strong> para conferir e exportar.
        </p>
      )}
    </div>
  )
}
