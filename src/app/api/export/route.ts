import { NextRequest, NextResponse } from 'next/server'
import { generateExcel } from '@/lib/excelWriter'
import type { ColumnDef, InvoiceRow } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { rows: InvoiceRow[]; columnConfig?: ColumnDef[] }
    const { rows, columnConfig } = body

    if (!rows?.length) {
      return NextResponse.json({ error: 'Nenhuma linha para exportar' }, { status: 400 })
    }

    const buffer = await generateExcel(rows, columnConfig)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Bens_Servicos_Comprados_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao gerar Excel'
    console.error('[/api/export]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
