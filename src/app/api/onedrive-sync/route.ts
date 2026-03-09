import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { listSharedPdfs } from '@/lib/onedriveClient'

const TEMP_DIR = '/tmp/znit-onedrive'

export async function POST(req: NextRequest) {
  try {
    const { sharingUrl, accessToken } = (await req.json()) as {
      sharingUrl: string
      accessToken: string
    }

    if (!sharingUrl?.startsWith('http')) {
      return NextResponse.json({ error: 'URL inválida.' }, { status: 400 })
    }
    if (!accessToken) {
      return NextResponse.json({ error: 'Faça login com Microsoft antes de sincronizar.' }, { status: 401 })
    }

    // List PDFs from the shared folder
    const { files: pdfFiles, folderNames } = await listSharedPdfs(sharingUrl, accessToken)

    if (pdfFiles.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo PDF encontrado na pasta compartilhada.' }, { status: 404 })
    }

    // Clean and recreate temp dir
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true })
    fs.mkdirSync(TEMP_DIR, { recursive: true })

    // Download each PDF, preserving subfolder structure
    let downloaded = 0
    const errors: string[] = []

    for (const pdf of pdfFiles) {
      const destPath = path.join(TEMP_DIR, pdf.relativePath)
      const destDir = path.dirname(destPath)
      fs.mkdirSync(destDir, { recursive: true })

      try {
        // Graph API content URLs require the Bearer token; pre-auth URLs (@microsoft.graph.downloadUrl) do not
        const isGraphApiUrl = pdf.downloadUrl.startsWith('https://graph.microsoft.com/')
        const fetchHeaders = isGraphApiUrl ? { Authorization: `Bearer ${accessToken}` } : {}
        const res = await fetch(pdf.downloadUrl, { headers: fetchHeaders })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buffer = Buffer.from(await res.arrayBuffer())
        fs.writeFileSync(destPath, buffer)
        downloaded++
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(`${pdf.name}: ${msg}`)
        console.error(`[onedrive-sync] Falha ao baixar ${pdf.name}:`, msg)
      }
    }

    if (downloaded === 0) {
      return NextResponse.json(
        { error: `Nenhum PDF foi baixado com sucesso. Erros: ${errors.join('; ')}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ dir: TEMP_DIR, downloaded, total: pdfFiles.length, errors, folderNames })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao sincronizar OneDrive'
    console.error('[onedrive-sync]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
