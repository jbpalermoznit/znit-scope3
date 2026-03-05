import { NextResponse } from 'next/server'
import { getListaItems } from '@/lib/excelReader'

export async function GET() {
  try {
    const items = await getListaItems()
    return NextResponse.json({ items })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao ler aba Lista'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
