import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function GET() {
  try {
    const result = execSync(
      `osascript -e 'POSIX path of (choose folder with prompt "Selecione a pasta com os PDFs:")'`,
      { encoding: 'utf-8' }
    ).trim()
    // Remove trailing slash
    const dir = result.endsWith('/') ? result.slice(0, -1) : result
    return NextResponse.json({ dir })
  } catch {
    // User cancelled or error
    return NextResponse.json({ dir: null })
  }
}
