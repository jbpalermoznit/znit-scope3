// Column definition for dynamic review table + Excel export
export interface ColumnDef {
  key: string
  label: string
  enabled: boolean
  width: string // Tailwind width class
}

export const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'data',          label: 'Data',                enabled: true,  width: 'w-24' },
  { key: 'descricao',     label: 'Descrição',           enabled: true,  width: 'w-48' },
  { key: 'quantidade',    label: 'Quantidade',           enabled: true,  width: 'w-20' },
  { key: 'item',          label: 'Item',                enabled: true,  width: 'w-52' },
  { key: 'itemId',        label: 'ID Item',             enabled: true,  width: 'w-20' },
  { key: 'unidadeMedida', label: 'Unidade de Medida',   enabled: true,  width: 'w-20' },
  { key: 'unidadeNeg',    label: 'Unidade de Negócio',  enabled: true,  width: 'w-28' },
  { key: 'filtro1',       label: 'Filtro 1',            enabled: true,  width: 'w-24' },
  { key: 'filtro2',       label: 'Filtro 2',            enabled: true,  width: 'w-24' },
  { key: 'filtro3',       label: 'Filtro 3',            enabled: true,  width: 'w-24' },
  { key: 'filtro4',       label: 'Filtro 4',            enabled: false, width: 'w-24' },
  { key: 'valorTotal',    label: 'Valor',               enabled: true,  width: 'w-28' },
  { key: 'sourcePdf',     label: 'Nome da Evidência',   enabled: true,  width: 'w-40' },
]

// One PDF found on disk inside Input_Files/
export interface PdfFile {
  absolutePath: string
  relativePath: string   // relative to Input_Files/
  filename: string
  // Column G-K derived from subfolder depth
  unidadeNeg: string     // G — 1st subfolder level
  filtro1: string        // H — 2nd subfolder level
  filtro2: string        // I — 3rd subfolder level
  filtro3: string        // J — 4th subfolder level
  filtro4: string        // K — 5th subfolder level
}

// One row in the output Excel (one invoice line item)
export interface InvoiceRow {
  id: string             // uuid, client-side only
  sourcePdf: string      // filename, for grouping in review table
  // Columns A–L
  data: string           // A — date "DD/MM/YYYY"
  descricao: string      // B
  quantidade: string     // C
  item: string           // D — must match a ListaItem name
  itemId: string         // E
  unidadeMedida: string  // F
  unidadeNeg: string     // G
  filtro1: string        // H
  filtro2: string        // I
  filtro3: string        // J
  filtro4: string        // K
  valorTotal: string     // L — total invoice value
  // UI state
  aiSuggested: boolean          // true → yellow highlight
  aiSuggestedItem?: string
  matchConfidence?: 'high' | 'low' | 'none'
  matchNote?: string            // explanation when confidence is low/none
}

// One row from the Lista reference sheet
export interface ListaItem {
  name: string
  col2: string
  col3: string
  col4: string
}

// Processing status per PDF
export type ProcessingStatus = 'pending' | 'processing' | 'done' | 'error'

export interface PdfProcessingState {
  status: ProcessingStatus
  error?: string
  rowCount?: number
}

// What Claude returns for one PDF
export interface ClaudeExtractionResult {
  invoiceNumber: string
  invoiceDate: string
  lineItems: ClaudeLineItem[]
}

export interface ClaudeLineItem {
  descricao: string
  quantidade: string
  unidadeMedida: string
  valor: string
  suggestedItem: string
  suggestedItemId: string
  matchConfidence: 'high' | 'low' | 'none'
  matchNote?: string
}
