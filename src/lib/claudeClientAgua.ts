import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { ClaudeExtractionResult, ListaItem } from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-4-6'

function loadSkill(): string {
  try {
    const skillPath = path.join(process.cwd(), 'Skill_AguaClassifier.md')
    return fs.readFileSync(skillPath, 'utf-8')
  } catch {
    return ''
  }
}

export async function extractWaterData(
  pdfPath: string,
  listaItems: ListaItem[]
): Promise<ClaudeExtractionResult[]> {
  const pdfBuffer = fs.readFileSync(pdfPath)
  const base64PDF = pdfBuffer.toString('base64')
  const skill = loadSkill()

  const itemsList = listaItems
    .map((item) => {
      const extra = [item.col2, item.col3, item.col4].filter(Boolean).join(' | ')
      return extra ? `${item.name} [${extra}]` : item.name
    })
    .join('\n')

  const prompt = `Você está analisando um PDF que pode conter UMA OU MAIS contas de água/saneamento brasileiras.

IMPORTANTE: Identifique quantas faturas distintas existem no documento e extraia os dados de CADA UMA separadamente.
Uma nova fatura começa quando há novo número de conta, nova matrícula ou novo cabeçalho de concessionária.

Retorne APENAS um array JSON válido (mesmo que seja apenas uma fatura), sem texto adicional, no formato:

[
  {
    "invoiceNumber": "número da conta/fatura",
    "invoiceDate": "DD/MM/YYYY",
    "lineItems": [
      {
        "descricao": "descrição do componente da conta",
        "quantidade": "volume em m³ como string numérica (ex: 45.5), ou \"1\" quando não houver volume",
        "unidadeMedida": "m3 quando houver volume; 'un' para taxas fixas sem volume",
        "valor": "valor monetário exatamente como aparece na linha do item, ex: R$ 1.234,56",
        "suggestedItem": "nome EXATO da lista abaixo que melhor corresponde, ou \"\" se nenhum se encaixa",
        "suggestedItemId": "",
        "matchConfidence": "high | low | none",
        "matchNote": "explicação breve em português somente quando confidence for low ou none"
      }
    ]
  }
]

Lista de itens válidos para "suggestedItem".
Cada item: NOME [categoria | subcategoria] — use SOMENTE o NOME (sem colchetes) em "suggestedItem".
${itemsList}

Regras CRÍTICAS:

1. MÚLTIPLAS FATURAS
   - Processe TODAS as faturas do documento. Retorne um objeto por fatura no array.
   - Use o número de conta/fatura/matrícula para diferenciar faturas distintas.
   - Extraia somente os dados do mês de competência atual de cada fatura (ignore histórico de consumo).

2. TIPOS DE FATURA
   a) Fatura com hidrômetro (padrão):
      - Extraia: Valor Referente Água (m³), Valor de Esgoto (m³), Tarifa Básica Água, Tarifa Básica Esgoto,
        Multa por Atraso, Juros por Atraso, Aviso de Débito, Alteração Cadastral e quaisquer outros lançamentos.
   b) Fatura "Serviços Diversos" / Caminhão-Pipa (sem hidrômetro):
      - Identifique pela presença de "Serviços Diversos" ou "Caminhão Pipa" na descrição.
      - Extraia o volume em m³ mencionado na descrição do lançamento (ex: "8M3" → quantidade: "8").
      - NÃO extraia a marca d'água "Serviços Diversos" como item — ela é decorativa.
      - Não há esgoto nem tarifa básica neste tipo.

3. COMPONENTES TÍPICOS
   - Consumo de Água → volume em m³, unidadeMedida: "m3"
   - Esgoto / Esgoto Coletado → volume em m³, unidadeMedida: "m3"
   - Tarifa Básica Água / Esgoto → quantidade: "1", unidadeMedida: "un"
   - Alteração Cadastral e outros serviços administrativos → quantidade: "1", unidadeMedida: "un"
   - IGNORAR completamente: Multa por Atraso, Juros por Atraso, Aviso de Débito, Correção Monetária
     e qualquer encargo por inadimplência — NÃO incluir esses itens no lineItems.

4. CAMPOS
   - "quantidade": volume m³ quando disponível; "1" para taxas e encargos.
   - "unidadeMedida": "m3" com volume; "un" para demais.
   - "valor": copie exatamente como está impresso na linha do item (com R$).
   - "invoiceDate": data de vencimento da fatura, formato DD/MM/YYYY.
   - Se a conta mostrar apenas o total sem detalhamento, crie um único lineItem:
     descricao "Consumo de Água e Saneamento", quantidade = volume total m³ ou "1", valor = total.

5. matchConfidence
   - "high": correspondência clara com item da lista.
   - "low": item próximo mas incerto — explique em matchNote.
   - "none": nenhum item corresponde — deixe suggestedItem: "" e explique em matchNote.

Retorne SOMENTE o array JSON, sem markdown, sem explicações adicionais.`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = []

  if (skill) {
    content.push({
      type: 'text',
      text: `=== DOCUMENTO DE REFERÊNCIA: Skill Classificador de Contas de Água ===\n\n${skill}\n\n=== FIM DO DOCUMENTO DE REFERÊNCIA ===`,
    })
  }

  content.push({
    type: 'document',
    source: { type: 'base64', media_type: 'application/pdf', data: base64PDF },
  })

  content.push({ type: 'text', text: prompt })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client.beta.messages as any).create({
    model: MODEL,
    max_tokens: 8192,
    temperature: 0,
    betas: ['pdfs-2024-09-25'],
    messages: [{ role: 'user', content }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsed = JSON.parse(cleaned) as ClaudeExtractionResult | ClaudeExtractionResult[]
  if (!Array.isArray(parsed)) parsed = [parsed]

  for (const item of parsed) {
    if (!Array.isArray(item.lineItems)) {
      throw new Error(`Fatura sem lineItems válidos: ${JSON.stringify(item).slice(0, 200)}`)
    }
  }

  return parsed as ClaudeExtractionResult[]
}
