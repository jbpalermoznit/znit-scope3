# Skill: Classificador de Contas de Água — Resultados Extraídos

Este documento registra os dados extraídos das **6 faturas escaneadas** do PDF `3110-1527-AGUA_POTAVEL_-_04-2025.pdf`, seguindo a estrutura do classificador de referência (`SKILL.md`).

---

## Metadados do Lote

| Campo | Valor |
|---|---|
| Concessionária | Águas de Governador Valadares SPE S.A. (Ae Valadares) |
| CNPJ | 53.667.104/0001-10 |
| Referência | 04/2025 |
| Tipo de PDF | Escaneado (scan A4, múltiplas faturas em um único arquivo) |
| Total de faturas | 6 |

---

## Fatura 1 — Conta de Água Nº 605.910

```json
{
  "invoiceNumber": "605910",
  "invoiceDate": "23/04/2025",
  "lineItems": [
    {
      "descricao": "Caminhão Pipa Água Tratada 8m³ Área Urbana",
      "quantidade": "8",
      "unidadeMedida": "m3",
      "valor": "R$ 518,69",
      "suggestedItem": "Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    }
  ]
}
```

**Detalhes da fatura:**

| Campo | Valor |
|---|---|
| Cliente / Matrícula | -0 |
| Mês Referência | abr/2025 |
| Emissão | 08/04/2025 |
| Vencimento | 23/04/2025 |
| Morador | Cobra Brasil Serviços Comunicações e Energia |
| Endereço Imóvel | Fazenda Vale Formoso 9999 IP Área Rural Gov. Valadares Seis |
| Descrição | Caminhão Pipa Água Tratada 8M3 Área Urbana |
| Observação | Cobra Brasil Serviços 01 Caminhão Pipa de Água Tratada de 10 Mil Litros |
| Total a Pagar | **R$ 518,69** |
| Tipo | Serviços Diversos (não possui medidor / esgoto) |

> **Edge case identificado:** Fatura do tipo "Serviços Diversos" — não é uma conta de consumo medido por hidrômetro. O fornecimento é via caminhão-pipa (10.000 litros = 10 m³). O volume de 8m³ consta na descrição do lançamento; sem esgoto, sem tarifa básica. Usar `matchConfidence: "high"` pois a associação com abastecimento de água é clara.

---

## Fatura 2 — Fatura Nº 150738362

```json
{
  "invoiceNumber": "150738362",
  "invoiceDate": "17/04/2025",
  "lineItems": [
    {
      "descricao": "Valor Referente Água - Residencial Normal",
      "quantidade": "10",
      "unidadeMedida": "m3",
      "valor": "R$ 17,29",
      "suggestedItem": "Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Valor de Esgoto - Residencial Normal",
      "quantidade": "10",
      "unidadeMedida": "m3",
      "valor": "R$ 12,10",
      "suggestedItem": "Esgoto",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Tarifa Básica Água",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 14,01",
      "suggestedItem": "Taxa de Disponibilidade de Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Tarifa Básica Esgoto",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 9,80",
      "suggestedItem": "Taxa de Disponibilidade de Esgoto",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    }
  ]
}
```

**Detalhes da fatura:**

| Campo | Valor |
|---|---|
| Matrícula | 706973-1 |
| Fatura Nº | 150738362 |
| Mês/Ano | 04/2025 |
| Morador | Milton Edgard Reis |
| Endereço | Rua Sete de Setembro, 2360-A, Centro A — Governador Valadares/MG |
| CPF | 353054190 |
| Localização | 010-01003-030176 |
| Grupo | 3 |
| Hidrômetro | A19G345794 |
| Categoria | 1 Residencial — Normal |
| Leitura Anterior | 06/03/2025 — 271 |
| Leitura Atual | 07/04/2025 — 281 |
| **Consumo m³** | **10 m³** |
| Vencimento | 17/04/2025 |
| **Total a Pagar** | **R$ 53,20** |

---

## Fatura 3 — Fatura Nº 150741113

```json
{
  "invoiceNumber": "150741113",
  "invoiceDate": "17/04/2025",
  "lineItems": [
    {
      "descricao": "Valor Referente Água - Residencial Normal",
      "quantidade": "28",
      "unidadeMedida": "m3",
      "valor": "R$ 111,87",
      "suggestedItem": "Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Valor de Esgoto - Residencial Normal",
      "quantidade": "28",
      "unidadeMedida": "m3",
      "valor": "R$ 78,30",
      "suggestedItem": "Esgoto",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Tarifa Básica Água",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 14,01",
      "suggestedItem": "Taxa de Disponibilidade de Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Tarifa Básica Esgoto",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 9,80",
      "suggestedItem": "Taxa de Disponibilidade de Esgoto",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    }
  ]
}
```

**Detalhes da fatura:**

| Campo | Valor |
|---|---|
| Matrícula | 706965-0 |
| Fatura Nº | 150741113 |
| Mês/Ano | 04/2025 |
| Morador | Anderson Avelino de Farias |
| Endereço | Rua Sete de Setembro, 2360-A, Centro A — Governador Valadares/MG |
| CEP | 35054190 |
| Localização | 010-01003-030175 |
| Grupo | 3 |
| Hidrômetro | A19G345793 |
| Categoria | 1 Residencial — Normal |
| Leitura Anterior | 06/03/2025 — 821 |
| Leitura Atual | 07/04/2025 — 849 |
| **Consumo m³** | **28 m³** |
| Vencimento | 17/04/2025 |
| **Total a Pagar** | **R$ 213,98** |

---

## Fatura 4 — Fatura Nº 349447

```json
{
  "invoiceNumber": "349447",
  "invoiceDate": "17/04/2025",
  "lineItems": [
    {
      "descricao": "Valor Referente Água - Residencial Normal",
      "quantidade": "19",
      "unidadeMedida": "m3",
      "valor": "R$ 63,61",
      "suggestedItem": "Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Valor de Esgoto - Residencial Normal",
      "quantidade": "19",
      "unidadeMedida": "m3",
      "valor": "R$ 44,53",
      "suggestedItem": "Esgoto",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Tarifa Básica Água",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 14,01",
      "suggestedItem": "Taxa de Disponibilidade de Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Tarifa Básica Esgoto",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 9,80",
      "suggestedItem": "Taxa de Disponibilidade de Esgoto",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    }
  ]
}
```

> **Nota:** Os itens "Multa por Atraso" (R$ 1,75), "Juros por Atraso" (R$ 0,17) e "Aviso de Débito" (R$ 2,61) presentes nesta fatura são **ignorados** — encargos por inadimplência não são extraídos.
```

**Detalhes da fatura:**

| Campo | Valor |
|---|---|
| Matrícula | 810800-5 |
| Fatura Nº | 349447 |
| Mês/Ano | 04/2025 |
| Morador | Gilmar Nunes Queiroga |
| Endereço | Av. Minas Gerais, 1019-B, Centro A — Governador Valadares/MG |
| CEP | 35010151 |
| Localização | 010-01003-029258 |
| Grupo | 3 |
| Hidrômetro | Y10N522732 |
| Categoria | 1 Residencial — Normal |
| Leitura Anterior | 06/03/2025 — 1758 |
| Leitura Atual | 07/04/2025 — 1777 |
| **Consumo m³** | **19 m³** |
| Vencimento | 17/04/2025 |
| **Total a Pagar** | **R$ 137,02** |

> **Edge case identificado:** Fatura com multa, juros e aviso de débito por atraso. O item "Aviso de Débito" não tem correspondência na lista de referência (`matchConfidence: "none"`). Os lançamentos de multa e juros aparecem em múltiplas linhas no scan — consolidados aqui como itens únicos.

---

## Fatura 5 — Conta de Água Nº 610.881

```json
{
  "invoiceNumber": "610881",
  "invoiceDate": "30/04/2025",
  "lineItems": [
    {
      "descricao": "Caminhão Pipa Água Tratada 8m³ Área Urbana",
      "quantidade": "8",
      "unidadeMedida": "m3",
      "valor": "R$ 518,69",
      "suggestedItem": "Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    }
  ]
}
```

**Detalhes da fatura:**

| Campo | Valor |
|---|---|
| Cliente / Matrícula | -0 |
| Conta de Água Nº | 610.881 |
| Mês Referência | abr/2025 |
| Emissão | 14/04/2025 |
| Vencimento | 30/04/2025 |
| Morador | Cobra Brasil Serviços Comunicações e Energia |
| Endereço Imóvel | Fazenda Vale Formoso 9999 IP Área Rural Gov. Valadares Seis |
| Descrição | Caminhão Pipa Água Tratada 8M3 Área Urbana |
| Observação | Cobra Brasil Serviços 01 Caminhão Pipa de Água Tratada de 10 Mil Litros |
| Total a Pagar | **R$ 518,69** |
| Tipo | Serviços Diversos (2ª via emitida) |

> **Nota:** Fatura idêntica à Fatura 1 (mesmo serviço, mesmo valor), porém com número de conta diferente (610.881 vs 605.910) e vencimento posterior (30/04 vs 23/04). Provável segunda entrega do mesmo serviço ou conta duplicada de mesma referência.

---

## Fatura 6 — Fatura Nº 443282

```json
{
  "invoiceNumber": "443282",
  "invoiceDate": "02/05/2025",
  "lineItems": [
    {
      "descricao": "Valor Referente Água - Comercial Normal",
      "quantidade": "94",
      "unidadeMedida": "m3",
      "valor": "R$ 642,30",
      "suggestedItem": "Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Alteração Cadastral",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 15,61",
      "suggestedItem": "",
      "suggestedItemId": "",
      "matchConfidence": "none",
      "matchNote": "Item administrativo sem correspondência na lista de referência."
    },
    {
      "descricao": "Valor de Esgoto - Comercial Normal",
      "quantidade": "94",
      "unidadeMedida": "m3",
      "valor": "R$ 449,61",
      "suggestedItem": "Esgoto",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Tarifa Básica Água",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 18,26",
      "suggestedItem": "Taxa de Disponibilidade de Água",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    },
    {
      "descricao": "Tarifa Básica Esgoto",
      "quantidade": "1",
      "unidadeMedida": "un",
      "valor": "R$ 12,78",
      "suggestedItem": "Taxa de Disponibilidade de Esgoto",
      "suggestedItemId": "",
      "matchConfidence": "high",
      "matchNote": ""
    }
  ]
}
```

**Detalhes da fatura:**

| Campo | Valor |
|---|---|
| Matrícula | 750948 |
| Fatura Nº | 443282 |
| Referência | 04/2025 |
| Morador/Empresa | Cobra Brasil Serviços, Comunicações e Energia S.A. |
| Proprietário | Claudio Cesar Alves Fernandes |
| Endereço | Rua Lincoln Byrro, 176, Sala 02, SL 2 — Vila Bretas, Gov. Valadares/MG |
| Localização | 010-01010-121054 |
| Grupo | 10 |
| Hidrômetro | A06N075686 |
| Categoria | 1 Comercial Normal |
| Leitura Anterior | 18/03/2025 — 1383 (51 m³ faturado) |
| Leitura Atual | 16/04/2025 — 1477 (94 m³ faturado) |
| **Consumo m³** | **94 m³** |
| Data de Vencimento | 02/05/2025 |
| **Total a Pagar** | **R$ 1.138,56** |
| Fatura Pendente | 03/2025 — R$ 570,04 (venc. 28/03/2025) |

> **Edge case identificado:** Categoria Comercial Normal (Grupo 10). Tarifa básica de água (R$ 18,26) e esgoto (R$ 12,78) são superiores às residenciais, refletindo tabela tarifária comercial. Há fatura pendente anterior (03/2025) registrada mas não incluída nos lineItems desta competência. O item "Alteração Cadastral" não tem correspondência na lista de referência.

---

## Resumo Consolidado — Consumo de Água por Fatura

| Fatura Nº | Morador / Empresa | Tipo | Consumo m³ | Valor Água | Total a Pagar |
|---|---|---|---|---|---|
| 605.910 | Cobra Brasil (pipa) | Serviços Diversos | 8 m³ (pipa) | R$ 518,69 | R$ 518,69 |
| 150738362 | Milton Edgard Reis | Residencial Normal | 10 m³ | R$ 17,29 | R$ 53,20 |
| 150741113 | Anderson Avelino de Farias | Residencial Normal | 28 m³ | R$ 111,87 | R$ 213,98 |
| 349447 | Gilmar Nunes Queiroga | Residencial Normal | 19 m³ | R$ 63,61 | R$ 137,02 |
| 610.881 | Cobra Brasil (pipa) | Serviços Diversos | 8 m³ (pipa) | R$ 518,69 | R$ 518,69 |
| 443282 | Cobra Brasil (comercial) | Comercial Normal | 94 m³ | R$ 642,30 | R$ 1.138,56 |
| **TOTAL** | | | **167 m³** | **R$ 1.872,45** | **R$ 2.580,14** |

---

## Edge Cases Identificados Neste Lote

### 1. Faturas de Caminhão-Pipa (Serviços Diversos)
**Faturas:** 605.910 e 610.881  
**Sintoma:** Não há hidrômetro, sem esgoto, sem tarifa básica. O fornecimento é via caminhão-pipa de 10.000 litros (10 m³), porém o lançamento indica "8M3".  
**Classificação adotada:** `descricao: "Caminhão Pipa Água Tratada 8m³ Área Urbana"`, `quantidade: "8"`, `unidadeMedida: "m3"`.  
**Sugestão de melhoria:** Adicionar ao prompt instrução para identificar faturas do tipo "Serviços Diversos" com fornecimento via caminhão-pipa e extrair o volume em m³ da descrição do lançamento.

### 2. Fatura com Multa, Juros e Aviso de Débito
**Fatura:** 349447
**Sintoma:** Múltiplos lançamentos de multa e juros por atraso, além de "Aviso de Débito".
**Regra aplicada:** Multa por Atraso, Juros por Atraso, Aviso de Débito e qualquer Correção Monetária por inadimplência são **ignorados** — não devem aparecer no `lineItems`.

### 3. Categoria Comercial com Alto Consumo
**Fatura:** 443282  
**Sintoma:** Consumo de 94 m³, tarifa comercial, com item "Alteração Cadastral" não mapeável.  
**Classificação adotada:** `matchConfidence: "none"` para Alteração Cadastral.

### 4. Faturas Potencialmente Duplicadas (Caminhão-Pipa)
**Faturas:** 605.910 e 610.881  
**Sintoma:** Mesmo serviço, mesmo valor (R$ 518,69), mesmo endereço, mesmo morador — apenas número de conta e vencimento diferentes.  
**Ação recomendada:** Sinalizar ao sistema que pode haver duplicidade para revisão manual.

---

## Regras Adicionais Sugeridas para o Prompt (v2)

Com base nos edge cases identificados neste lote, recomenda-se adicionar as seguintes regras ao prompt em `src/lib/claudeClientAgua.ts`:

1. **Caminhão-pipa:** "Se a descrição do lançamento mencionar 'Caminhão Pipa', extraia o volume em m³ indicado na descrição como `quantidade` com `unidadeMedida: 'm3'`."
2. **Fatura sem hidrômetro:** "Se não houver medidor/hidrômetro, classifique como serviço avulso de abastecimento."
3. **Multa / Juros / Aviso de Débito:** Ignorar completamente. Não incluir no `lineItems`.
4. **Competência atual:** "Extraia somente os dados do mês de competência atual (indicado como 'Mês Referência' ou 'Referência' na fatura), ignorando histórico e faturas pendentes de meses anteriores."

---

## Histórico de Versões

| Versão | Data | Mudança |
|---|---|---|
| v1 | 2025-03 | Prompt inicial (referência — SKILL.md) |
| v1.1 | 2025-04 | Extração manual das 6 faturas Ae Valadares 04/2025; edge cases de caminhão-pipa, multa/aviso de débito e categoria comercial documentados |
