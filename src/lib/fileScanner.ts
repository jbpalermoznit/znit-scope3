import fs from 'fs'
import path from 'path'
import type { PdfFile } from './types'

const DEFAULT_INPUT_DIR = path.join(process.cwd(), 'Input_Files')

export function scanInputFiles(customDir?: string): PdfFile[] {
  const INPUT_DIR = customDir ? path.resolve(customDir) : DEFAULT_INPUT_DIR
  const results: PdfFile[] = []

  if (!fs.existsSync(INPUT_DIR)) return results

  function walk(dir: string, segments: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath, [...segments, entry.name])
      } else if (entry.name.toLowerCase().endsWith('.pdf')) {
        const relativePath = path.relative(INPUT_DIR, fullPath)
        results.push({
          absolutePath: fullPath,
          relativePath,
          filename: entry.name,
          unidadeNeg: segments[0] ?? '',
          filtro1: segments[1] ?? '',
          filtro2: segments[2] ?? '',
          filtro3: segments[3] ?? '',
          filtro4: segments[4] ?? '',
        })
      }
    }
  }

  walk(INPUT_DIR, [])
  return results
}
