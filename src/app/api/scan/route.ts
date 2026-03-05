import { NextResponse } from 'next/server'
import { scanInputFiles } from '@/lib/fileScanner'

export async function GET() {
  try {
    const pdfs = scanInputFiles()
    return NextResponse.json({ pdfs })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao escanear arquivos'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
