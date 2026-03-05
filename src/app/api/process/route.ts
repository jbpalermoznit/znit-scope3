import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { extractInvoiceData } from '@/lib/claudeClient'
import { getListaItems } from '@/lib/excelReader'
import type { InvoiceRow, PdfFile } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { pdf: PdfFile }
    const { pdf } = body

    if (!pdf?.absolutePath) {
      return NextResponse.json({ error: 'PDF path obrigatório' }, { status: 400 })
    }

    const listaItems = await getListaItems()
    const extraction = await extractInvoiceData(pdf.absolutePath, listaItems)

    const rows: InvoiceRow[] = extraction.lineItems.map((item) => ({
      id: uuidv4(),
      sourcePdf: pdf.filename,
      data: extraction.invoiceDate,
      descricao: item.descricao,
      quantidade: item.quantidade,
      item: item.suggestedItem,
      itemId: item.suggestedItemId,
      unidadeMedida: item.unidadeMedida,
      unidadeNeg: pdf.unidadeNeg,
      filtro1: pdf.filtro1,
      filtro2: pdf.filtro2,
      filtro3: pdf.filtro3,
      filtro4: pdf.filtro4,
      aiSuggested: true,
      aiSuggestedItem: item.suggestedItem,
    }))

    return NextResponse.json({ rows, invoiceNumber: extraction.invoiceNumber })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao processar PDF'
    console.error('[/api/process]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
