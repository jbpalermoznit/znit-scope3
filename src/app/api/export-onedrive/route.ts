import { NextRequest, NextResponse } from 'next/server'
import { generateExcel } from '@/lib/excelWriter'
import { uploadExcelToDrive } from '@/lib/onedriveClient'
import type { ColumnDef, InvoiceRow } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      rows: InvoiceRow[]
      columnConfig?: ColumnDef[]
      sharingUrl: string
      accessToken: string
    }
    const { rows, columnConfig, sharingUrl, accessToken } = body

    if (!rows?.length) {
      return NextResponse.json({ error: 'Nenhuma linha para exportar' }, { status: 400 })
    }
    if (!sharingUrl?.startsWith('http')) {
      return NextResponse.json({ error: 'URL do OneDrive inválida.' }, { status: 400 })
    }
    if (!accessToken) {
      return NextResponse.json({ error: 'Token de acesso Microsoft ausente.' }, { status: 401 })
    }

    const filename = `Bens_Servicos_Comprados_${new Date().toISOString().slice(0, 10)}.xlsx`
    const buffer = await generateExcel(rows, columnConfig)
    const { webUrl } = await uploadExcelToDrive(sharingUrl, accessToken, filename, buffer)

    return NextResponse.json({ webUrl, filename })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao exportar para o OneDrive'
    console.error('[/api/export-onedrive]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
