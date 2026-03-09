import { NextRequest, NextResponse } from 'next/server'
import { scanInputFiles } from '@/lib/fileScanner'

export async function GET(req: NextRequest) {
  try {
    const dir = req.nextUrl.searchParams.get('dir') ?? undefined
    const pdfs = scanInputFiles(dir)
    return NextResponse.json({ pdfs })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao escanear arquivos'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
