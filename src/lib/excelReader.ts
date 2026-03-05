import ExcelJS from 'exceljs'
import path from 'path'
import type { ListaItem } from './types'

const TEMPLATE_PATH = path.join(process.cwd(), 'Template_Bens_Servicos_Comprados.xlsx')

let cache: ListaItem[] | null = null

export async function getListaItems(): Promise<ListaItem[]> {
  if (cache) return cache

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(TEMPLATE_PATH)

  const sheet = workbook.getWorksheet('Lista')
  if (!sheet) throw new Error('Aba "Lista" não encontrada no template.')

  const items: ListaItem[] = []
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // skip header if any
    const name = row.getCell(1).value?.toString().trim() ?? ''
    if (!name) return
    items.push({
      name,
      col2: row.getCell(2).value?.toString().trim() ?? '',
      col3: row.getCell(3).value?.toString().trim() ?? '',
      col4: row.getCell(4).value?.toString().trim() ?? '',
    })
  })

  cache = items
  return items
}

export function getTemplatePath() {
  return TEMPLATE_PATH
}
