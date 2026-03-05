import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import type { ClaudeExtractionResult, ListaItem } from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-4-6'

export async function extractInvoiceData(
  pdfPath: string,
  listaItems: ListaItem[]
): Promise<ClaudeExtractionResult> {
  const pdfBuffer = fs.readFileSync(pdfPath)
  const base64PDF = pdfBuffer.toString('base64')

  const itemsList = listaItems.map((item) => item.name).join('\n')

  const prompt = `Você está analisando uma nota fiscal brasileira.

Extraia as informações e retorne APENAS um JSON válido, sem texto adicional, no formato:

{
  "invoiceNumber": "número da nota fiscal",
  "invoiceDate": "DD/MM/YYYY",
  "lineItems": [
    {
      "descricao": "descrição completa do produto/serviço",
      "quantidade": "valor numérico como string, ex: 45.5",
      "unidadeMedida": "unidade (ex: m3, kg, t, un, m2)",
      "suggestedItem": "nome EXATO da lista abaixo que melhor corresponde",
      "suggestedItemId": ""
    }
  ]
}

Lista de itens válidos para "suggestedItem" (use EXATAMENTE um nome desta lista):
${itemsList}

Regras:
- Para "suggestedItem": escolha o item da lista que melhor descreve o produto. Se for concreto, identifique o fck/resistência e escolha o item correspondente. Use EXATAMENTE o texto da lista.
- Para "invoiceDate": formato DD/MM/YYYY
- Para "quantidade": número com ponto decimal, sem unidade
- Pode haver múltiplos itens na nota
- Retorne SOMENTE o JSON, sem markdown, sem explicações`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client.beta.messages as any).create({
    model: MODEL,
    max_tokens: 4096,
    betas: ['pdfs-2024-09-25'],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64PDF,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip markdown fences if present
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  const parsed = JSON.parse(cleaned) as ClaudeExtractionResult
  return parsed
}
