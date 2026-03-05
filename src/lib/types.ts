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
  // Columns A–K
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
  // UI state
  aiSuggested: boolean   // true → yellow highlight
  aiSuggestedItem?: string
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
  suggestedItem: string
  suggestedItemId: string
}
