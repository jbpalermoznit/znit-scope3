import ExcelJS from 'exceljs'
import path from 'path'
import type { InvoiceRow } from './types'

const TEMPLATE_PATH = path.join(process.cwd(), 'Template_Bens_Servicos_Comprados.xlsx')
const DATA_SHEET = 'Bens e Serviços Comprados'

export async function generateExcel(rows: InvoiceRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(TEMPLATE_PATH)

  const sheet = workbook.getWorksheet(DATA_SHEET)
  if (!sheet) throw new Error(`Aba "${DATA_SHEET}" não encontrada no template.`)

  // Find first data row (row after header)
  const firstDataRow = 2

  // Get style reference from row 2 if it exists (may be empty template row)
  const styleRef = sheet.getRow(firstDataRow)

  // Clear existing data rows (keep header)
  const lastRow = sheet.lastRow?.number ?? firstDataRow
  for (let i = lastRow; i >= firstDataRow; i--) {
    sheet.spliceRows(i, 1)
  }

  rows.forEach((row, idx) => {
    const newRow = sheet.getRow(firstDataRow + idx)
    newRow.values = [
      null, // ExcelJS rows are 1-indexed, col 1 = index 1
      row.data,
      row.descricao,
      row.quantidade,
      row.item,
      row.itemId,
      row.unidadeMedida,
      row.unidadeNeg,
      row.filtro1,
      row.filtro2,
      row.filtro3,
      row.filtro4,
    ]

    // Copy border/font style from header reference if available
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
