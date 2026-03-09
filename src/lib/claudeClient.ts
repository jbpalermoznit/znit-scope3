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

  const itemsList = listaItems
    .map((item) => {
      const extra = [item.col2, item.col3, item.col4].filter(Boolean).join(' | ')
      return extra ? `${item.name} [${extra}]` : item.name
    })
    .join('\n')

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
      "valor": "valor monetário do item exatamente como aparece na nota, incluindo símbolo da moeda, ex: R$ 1.234,56",
      "suggestedItem": "nome EXATO da lista abaixo que melhor corresponde, ou \"\" se nenhum item se encaixa bem",
      "suggestedItemId": "",
      "matchConfidence": "high | low | none",
      "matchNote": "explicação breve em português somente quando confidence for low ou none (ex: 'Serviço de descarte de resíduo não encontrado na lista. Possíveis categorias: Resíduos, Saneamento.')"
    }
  ]
}

Lista de itens válidos para "suggestedItem".
Cada item é mostrado como: NOME [categoria | subcategoria | ...] — use SOMENTE o NOME (sem colchetes) no campo "suggestedItem".
${itemsList}

Regras CRÍTICAS:
- DISTINÇÃO SERVIÇO vs MATERIAL — analise a descrição da nota fiscal cuidadosamente:
  * SERVIÇO: a nota descreve uma ATIVIDADE executada (lançamento, concretagem, aplicação, instalação, montagem, execução, bombeamento, transporte, locação, mão de obra, etc.) → escolha um item de categoria Serviço.
  * MATERIAL: a nota descreve um INSUMO físico fornecido (concreto fck X, aço, cimento, areia, brita, madeira, etc.) → escolha um item de categoria Material/Matéria Prima.
  * "LANÇAMENTO DE CONCRETO" = SERVIÇO. "FORNECIMENTO DE CONCRETO fck 25MPa" = MATERIAL.
  * Se a descrição combina fornecimento + execução (ex: "fornecimento e lançamento"), priorize a categoria que domina o valor ou, se igual, classifique como SERVIÇO.
- Para "suggestedItem": use EXATAMENTE o texto do NOME na lista (sem os colchetes de categoria).
- Se for concreto material, identifique o fck/resistência e escolha o item correspondente.
- Para "invoiceDate": formato DD/MM/YYYY.
- Para "quantidade": número com ponto decimal, sem unidade.
- Para "valor": copie o valor exatamente como está impresso na linha do item na nota (incluindo símbolo monetário). Se o item não tiver valor explícito na nota, use "".
- Pode haver múltiplos itens na nota.
- Para "matchConfidence":
  * "high" — encontrou um item da lista que corresponde claramente ao serviço/material descrito.
  * "low"  — encontrou um item próximo mas a correspondência é incerta (ex: categoria genérica, descrição ambígua).
  * "none" — nenhum item da lista corresponde de forma razoável. Neste caso, deixe "suggestedItem": "" e explique no "matchNote" o que o item parece ser e quais categorias da lista seriam mais próximas.
- Retorne SOMENTE o JSON, sem markdown, sem explicações.`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client.beta.messages as any).create({
    model: MODEL,
    max_tokens: 8192,
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

  let parsed = JSON.parse(cleaned) as ClaudeExtractionResult | ClaudeExtractionResult[]
  if (Array.isArray(parsed)) parsed = parsed[0]
  if (!Array.isArray((parsed as ClaudeExtractionResult).lineItems)) {
    throw new Error(`Claude não retornou lineItems válidos. Resposta: ${cleaned.slice(0, 300)}`)
  }
  return parsed as ClaudeExtractionResult
}
