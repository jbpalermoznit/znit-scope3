import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { InvoiceRow, ListaItem, PdfFile, PdfProcessingState } from '@/lib/types'

interface InvoiceStore {
  pdfs: PdfFile[]
  listaItems: ListaItem[]
  processingStates: Record<string, PdfProcessingState>
  rows: InvoiceRow[]

  setPdfs: (pdfs: PdfFile[]) => void
  setListaItems: (items: ListaItem[]) => void
  setProcessingState: (pdfPath: string, state: PdfProcessingState) => void
  addRows: (newRows: InvoiceRow[]) => void
  updateRow: (id: string, updates: Partial<InvoiceRow>) => void
  deleteRow: (id: string) => void
  addBlankRow: (sourcePdf: string) => void
  reset: () => void
}

const initialState = {
  pdfs: [],
  listaItems: [],
  processingStates: {},
  rows: [],
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set) => ({
      ...initialState,

      setPdfs: (pdfs) => set({ pdfs }),
      setListaItems: (items) => set({ listaItems: items }),

      setProcessingState: (pdfPath, state) =>
        set((s) => ({
          processingStates: { ...s.processingStates, [pdfPath]: state },
        })),

      addRows: (newRows) =>
        set((s) => ({ rows: [...s.rows, ...newRows] })),

      updateRow: (id, updates) =>
        set((s) => ({
          rows: s.rows.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      deleteRow: (id) =>
        set((s) => ({ rows: s.rows.filter((r) => r.id !== id) })),

      addBlankRow: (sourcePdf) =>
        set((s) => {
          const pdf = s.pdfs.find((p) => p.filename === sourcePdf)
          const blank: InvoiceRow = {
            id: uuidv4(),
            sourcePdf,
            data: '',
            descricao: '',
            quantidade: '',
            item: '',
            itemId: '',
            unidadeMedida: '',
            unidadeNeg: pdf?.unidadeNeg ?? '',
            filtro1: pdf?.filtro1 ?? '',
            filtro2: pdf?.filtro2 ?? '',
            filtro3: pdf?.filtro3 ?? '',
            filtro4: pdf?.filtro4 ?? '',
            aiSuggested: false,
          }
          return { rows: [...s.rows, blank] }
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'znit-scope3-store',
      storage: {
        getItem: (name) => {
          if (typeof sessionStorage === 'undefined') return null
          const val = sessionStorage.getItem(name)
          return val ? JSON.parse(val) : null
        },
        setItem: (name, value) => {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(name, JSON.stringify(value))
          }
        },
        removeItem: (name) => {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(name)
          }
        },
      },
    }
  )
)
