# ZNIT Carbon Accounting Platform

Plataforma web para extração automática de dados de documentos fiscais em PDF via IA (Claude), com exportação para planilhas do **Inventário GHG Protocol**.

Módulos disponíveis:
- **Escopo 3 — Bens e Serviços**: processa notas fiscais de materiais e serviços comprados
- **Água — Contas de Água**: processa faturas de concessionárias de água/saneamento, extraindo consumo em m³ e custo

---

## Pré-requisitos

- Node.js 18+
- Chave de API da Anthropic (`ANTHROPIC_API_KEY`)
- Credenciais do Azure AD para integração com OneDrive (opcional)

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
ANTHROPIC_API_KEY=sk-ant-...

# Necessário apenas para sincronização com OneDrive
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Configuração do Azure AD (OneDrive)

1. Acesse [portal.azure.com](https://portal.azure.com) → **App registrations** → **New registration**
2. Nome: `ZNIT Scope3` · Tipo de conta: *This organizational directory only*
3. Platform: *Mobile and desktop applications* → URI de redirecionamento: `http://localhost`
4. Copie o **Application (client) ID** e o **Directory (tenant) ID** para `.env.local`
5. **API permissions** → Add → Microsoft Graph → Delegated:
   - `Files.ReadWrite.All`
   - `Sites.ReadWrite.All`
   - `User.Read`
6. Clique em **Grant admin consent**
7. **Authentication** → Advanced settings → **Allow public client flows** → Sim → Salvar

---

## Instalação e execução

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Como usar o Escopo 3

### 1. Acessar o módulo

Na tela inicial, clique em **Escopo 3 — Bens e Serviços**.

---

### 2. Carregar os PDFs

Escolha a origem dos arquivos:

#### Opção A — Pasta local

1. Clique em **Selecionar Pasta** e escolha a pasta com os PDFs.
2. A estrutura de subpastas é usada para preencher os filtros automaticamente:
   - 1º nível → Unidade de Negócio
   - 2º nível → Filtro 1
   - 3º nível → Filtro 2
   - 4º nível → Filtro 3

#### Opção B — OneDrive

1. Clique em **Entrar com Microsoft**.
2. Acesse [microsoft.com/devicelogin](https://microsoft.com/devicelogin) e insira o código exibido.
3. Após autenticar, cole o link de compartilhamento da pasta do OneDrive e clique em **Sincronizar**.
4. Os PDFs são baixados automaticamente para processamento.
5. Use os dropdowns de **Filtros** para definir os metadados que serão aplicados a todos os PDFs dessa pasta (Unidade de Negócio, Filtro 1, Filtro 2, Filtro 3). As sugestões são geradas a partir dos nomes das pastas do caminho compartilhado.

---

### 3. Processar com IA

Clique em **Processar Todos com IA**. Para cada PDF, o Claude irá:

- Extrair data, descrição, quantidade, unidade de medida e valor total de cada linha da nota fiscal
- Sugerir o **item** correspondente da lista de referência com nível de confiança (alto / incerto / não encontrado)

O progresso é exibido em tempo real. PDFs com erro são marcados individualmente.

---

### 4. Revisar os dados

Clique em **Revisar Dados** para acessar a tabela de revisão.

- **Amarelo** → sugestão IA pendente de confirmação
- **Laranja** → correspondência incerta — verifique o item
- **Vermelho** → item não encontrado — seleção manual obrigatória

Ações disponíveis:
- Editar qualquer célula diretamente na tabela
- Expandir linha (ícone `›`) para ver o texto completo sem truncamento
- Selecionar múltiplas linhas → atribuir item em lote ou excluir
- Filtrar por status: Todos / Não encontrado / Correspondência incerta / Confirmados
- Adicionar linhas em branco por PDF
- Configurar colunas visíveis (botão **Colunas**)

---

### 5. Exportar

Dois botões de exportação estão disponíveis no canto superior direito:

| Botão | Ação |
|---|---|
| **Exportar Excel** | Baixa o arquivo `.xlsx` localmente |
| **Enviar para OneDrive** | Faz upload do `.xlsx` para a mesma pasta sincronizada no OneDrive (visível apenas quando autenticado com Microsoft) |

O arquivo exportado segue o template **Bens_Servicos_Comprados_YYYY-MM-DD.xlsx** com todas as colunas do GHG Protocol Escopo 3.

---

## Estrutura de pastas recomendada

Para que os filtros sejam preenchidos automaticamente a partir da estrutura de diretórios (modo local), organize os PDFs assim:

```
Input_Files/
└── Unidade de Negócio/
    └── Filtro 1/
        └── Filtro 2/
            └── Filtro 3/
                └── nota_fiscal.pdf
```

---

## Lista de referência

O sistema lê automaticamente o arquivo `Template_Bens_Servicos_Comprados.xlsx` para obter a lista de itens válidos (aba **Lista**). Mantenha esse arquivo atualizado na raiz do projeto.

---

## Como usar o módulo Água

O fluxo é idêntico ao Escopo 3. As diferenças são:

- Origem: clique em **Água — Contas de Água** na tela inicial
- O Claude utiliza um prompt especializado para faturas de água/saneamento, extraindo:
  - Consumo de Água (m³ e valor)
  - Esgoto Coletado (m³ e valor)
  - Tarifa Básica Água / Esgoto
  - Outros serviços administrativos (ex: Alteração Cadastral)
  - Multas e juros por atraso são **ignorados** automaticamente
- PDFs com **múltiplas faturas escaneadas** (várias contas em um único arquivo) são processados corretamente — cada fatura é extraída separadamente
- O arquivo exportado segue o template **Agua_YYYY-MM-DD.xlsx**

### Skill do classificador de água

O arquivo `Skill_AguaClassifier.md` na raiz do projeto serve como documento de referência injetado no prompt do Claude a cada processamento. Ele contém:

- Edge cases conhecidos (caminhão-pipa, categorias residencial/comercial, encargos por atraso)
- Exemplos de saída esperada por tipo de fatura
- Histórico de versões do classificador

Para melhorar o classificador ao encontrar uma fatura mal extraída:
1. Documente o edge case em `Skill_AguaClassifier.md`
2. O Claude passará a usar as novas regras automaticamente no próximo processamento
