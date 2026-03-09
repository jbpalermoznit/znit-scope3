import ExcelJS from 'exceljs'
import path from 'path'
import type { ColumnDef, InvoiceRow } from './types'
import { DEFAULT_COLUMNS } from './types'

const TEMPLATE_PATH = path.join(process.cwd(), 'Template_Bens_Servicos_Comprados.xlsx')
const DATA_SHEET = 'Bens e Serviços Comprados'

export async function generateExcel(rows: InvoiceRow[], columnConfig: ColumnDef[] = DEFAULT_COLUMNS): Promise<Buffer> {
  const enabledCols = columnConfig.filter((c) => c.enabled)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(TEMPLATE_PATH)

  const sheet = workbook.getWorksheet(DATA_SHEET)
  if (!sheet) throw new Error(`Aba "${DATA_SHEET}" não encontrada no template.`)

  const firstDataRow = 2

  // Get style reference from row 2 before clearing
  const styleRef = sheet.getRow(firstDataRow)

  // Clear all rows from header onward and rewrite
  const lastRow = sheet.lastRow?.number ?? firstDataRow
  for (let i = lastRow; i >= 1; i--) {
    sheet.spliceRows(i, 1)
  }

  // Write header row with configured column labels
  const headerRow = sheet.getRow(1)
  headerRow.values = [null, ...enabledCols.map((c) => c.label)]
  headerRow.font = { bold: true }
  headerRow.commit()

  // Write data rows
  rows.forEach((row, idx) => {
    const r = row as Record<string, unknown>
    const newRow = sheet.getRow(firstDataRow + idx)
    newRow.values = [null, ...enabledCols.map((c) => r[c.key] ?? '')]

    if (styleRef) {
      newRow.eachCell((cell, colNumber) => {
        const refCell = styleRef.getCell(colNumber)
        if (refCell.border) cell.border = refCell.border
        if (refCell.font) cell.font = { ...refCell.font, bold: false }
        if (refCell.alignment) cell.alignment = refCell.alignment
      })
    }

    newRow.commit()
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
