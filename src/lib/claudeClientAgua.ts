import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import type { ClaudeExtractionResult, ListaItem } from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-4-6'

export async function extractWaterData(
  pdfPath: string,
  listaItems: ListaItem[]
): Promise<ClaudeExtractionResult> {
  const pdfBuffer = fs.readFileSync(pdfPath)
  const base64PDF = pdfBuffer.toString('base64')

  const itemsList = listaItems
    .map((item) => {
      const extra = [item.col2, item.col3, item.col4].filter(Boolean).join(' | ')
      return extra ? `${item.name} [${extra}]` : item.name
    })
    .join('\n')

  const prompt = `Você está analisando uma conta de água/saneamento brasileira (fatura de concessionária de água).

Extraia as informações e retorne APENAS um JSON válido, sem texto adicional, no formato:

{
  "invoiceNumber": "número da conta/fatura",
  "invoiceDate": "DD/MM/YYYY",
  "lineItems": [
    {
      "descricao": "descrição do componente da conta (ex: Consumo de Água, Esgoto Coletado, Taxa Mínima)",
      "quantidade": "volume em m³ como string numérica (ex: 45.5), ou \"1\" quando não houver volume associado",
      "unidadeMedida": "m3 quando houver volume; 'un' para taxas fixas sem volume",
      "valor": "valor monetário do item exatamente como aparece na conta, incluindo símbolo da moeda, ex: R$ 1.234,56",
      "suggestedItem": "nome EXATO da lista abaixo que melhor corresponde, ou \"\" se nenhum item se encaixa",
      "suggestedItemId": "",
      "matchConfidence": "high | low | none",
      "matchNote": "explicação breve em português somente quando confidence for low ou none"
    }
  ]
}

Lista de itens válidos para "suggestedItem".
Cada item é mostrado como: NOME [categoria | subcategoria | ...] — use SOMENTE o NOME (sem colchetes) no campo "suggestedItem".
${itemsList}

Regras CRÍTICAS para contas de água:
- PRIORIDADE MÁXIMA: identifique e extraia SEMPRE o consumo de água em m³ e seu custo correspondente.
- Componentes típicos de uma conta de água:
  * Consumo de Água — volume em m³ e valor do fornecimento de água
  * Esgoto / Esgoto Coletado / Esgoto Tratado — volume em m³ (geralmente percentual do consumo de água) e valor
  * Taxa Mínima / Taxa de Disponibilidade — valor fixo sem volume específico, use quantidade "1"
  * Multa / Juros / Correção — encargos por atraso, use quantidade "1"
  * Outros serviços — qualquer outro item da fatura
- Para "quantidade": use o volume em m³ quando disponível. Para itens sem volume (taxas, multas), use "1".
- Para "unidadeMedida": use "m3" quando houver volume; "un" para taxas fixas e encargos.
- Para "valor": copie o valor monetário exatamente como está impresso na linha do item (com símbolo R$).
- Para "invoiceDate": use a data de vencimento ou data de emissão da conta, formato DD/MM/YYYY.
- Se a conta mostrar apenas o TOTAL sem detalhamento por componente, crie um único lineItem com:
  * descricao: "Consumo de Água e Saneamento"
  * quantidade: volume total em m³ (se disponível) ou "1"
  * valor: valor total da conta
- Para "matchConfidence":
  * "high" — item da lista corresponde claramente ao componente da conta.
  * "low"  — item próximo mas correspondência incerta.
  * "none" — nenhum item da lista corresponde. Deixe "suggestedItem": "" e explique no "matchNote".
- Retorne SOMENTE o JSON, sem markdown, sem explicações.`

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

  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsed = JSON.parse(cleaned) as ClaudeExtractionResult | ClaudeExtractionResult[]
  if (Array.isArray(parsed)) parsed = parsed[0]
  if (!Array.isArray((parsed as ClaudeExtractionResult).lineItems)) {
    throw new Error(`Claude não retornou lineItems válidos. Resposta: ${cleaned.slice(0, 300)}`)
  }
  return parsed as ClaudeExtractionResult
}
