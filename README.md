# chatbot-documentos

Web part SPFx (React) que funciona como interface de chat para um chatbot interno de
SharePoint. Toda a inteligência (RAG, chamada ao Claude, busca no Google Drive) roda fora
do web part, em um workflow do **n8n**, exposto como um webhook HTTP. Este web part é
"burro": só coleta a pergunta do usuário, chama o webhook, e mostra a resposta e o histórico.

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Rodando localmente (gulp serve)](#rodando-localmente-gulp-serve)
- [Mock local do webhook n8n](#mock-local-do-webhook-n8n)
- [Gerando o pacote de produção](#gerando-o-pacote-de-produção)
- [Configurando a URL do webhook (Property Pane)](#configurando-a-url-do-webhook-property-pane)
- [Contrato da API do webhook](#contrato-da-api-do-webhook)
- [Estrutura do projeto](#estrutura-do-projeto)

## Pré-requisitos

- **Node.js 22.x** (testado com `v22.14.0`). O gerador e o build tooling do SPFx 1.23.x
  exigem especificamente `>=22.14.0 <23.0.0` — **Node 18, 20 ou 24 não funcionam**.
  Se você usa outra versão de Node no dia a dia, instale o
  [nvm-windows](https://github.com/coreybutler/nvm-windows) e rode:
  ```bash
  nvm install 22.14.0
  nvm use 22.14.0
  ```
- Uma conta de desenvolvedor Microsoft 365 (para testar no Workbench hospedado ou instalar
  o pacote em um site real). O SPFx 1.23.x **não tem mais Workbench local offline** —
  o teste é feito no Workbench hospedado do seu tenant (veja abaixo), carregando os
  scripts locais via query string de debug.

## Instalação

```bash
npm install
```

## Rodando localmente (`gulp serve`)

Na primeira vez, é preciso confiar no certificado HTTPS de desenvolvimento do SPFx (isso abre
uma janela do Windows pedindo confirmação — aceite):

```bash
gulp trust-dev-cert
```

Depois, para rodar o dev server:

```bash
gulp serve
```

Isso builda e sobe o dev server em `https://localhost:4321`, mas **não abre o navegador
sozinho de forma útil** nesta versão do SPFx, pois não existe mais Workbench local offline.
Para testar, acesse manualmente o Workbench hospedado do seu tenant de desenvolvimento com a
query string de debug (o próprio `gulp serve` imprime essa query string no terminal):

```
https://SEU-TENANT.sharepoint.com/sites/SEU-SITE/_layouts/15/workbench.aspx?debugManifestsFile=https%3A%2F%2Flocalhost%3A4321%2Ftemp%2Fbuild%2Fmanifests.js&debug=true&noredir=true
```

Exemplo já usado neste projeto (site `sebraepi` no tenant `sebraepr`):

```
https://sebraepr.sharepoint.com/sites/sebraepi/_layouts/15/workbench.aspx?debugManifestsFile=https%3A%2F%2Flocalhost%3A4321%2Ftemp%2Fbuild%2Fmanifests.js&debug=true&noredir=true
```

Opcionalmente, defina a variável de ambiente `SPFX_SERVE_TENANT_DOMAIN` com o domínio do seu
tenant para que `config/serve.json` monte essa URL automaticamente e o navegador abra sozinho.

No Workbench, clique em **"+"** para adicionar o web part **ChatbotWebPart** à página, depois
abra o Property Pane (ícone de lápis) e configure a **URL do Webhook n8n** (veja a seção abaixo).

> No Workbench hospedado, `pageContext.user.email` já vem preenchido com o e-mail do usuário
> logado no seu tenant (o mesmo que será usado quando o web part estiver instalado de verdade).

## Mock local do webhook n8n

Para desenvolver a UI sem depender do n8n estar no ar, existe um mock simples em
`mock-server/server.js` (Node puro, sem dependências extras) que implementa o mesmo contrato
de request/response do webhook real.

Rodar o mock (em um terminal separado, mantenha rodando enquanto usa o `gulp serve`):

```bash
npm run mock-server
```

Ele sobe em `http://localhost:3000/webhook/chat` e imprime no console cada pergunta recebida.
Palavras-chave na pergunta disparam respostas de exemplo diferentes:

| Pergunta contém...          | Resposta simulada                                              |
| ---------------------------- | --------------------------------------------------------------- |
| `planilha`, `excel`, `orçamento` | Resposta 200 com markdown + 1 fonte (arquivo do Drive)      |
| `contrato`, `fornecedor`     | Resposta 200 com markdown + 2 fontes                            |
| `erro`, `falha`               | Resposta **500** com `{ "error": "..." }` (testa tratamento de erro) |
| `demora`, `timeout`, `lento`  | Demora 35s para responder (testa o timeout de 30s do web part) |
| qualquer outra pergunta       | Resposta genérica 200, sem fontes                                |

Depois, no Property Pane do web part, configure a URL do Webhook como:

```
http://localhost:3000/webhook/chat
```

> Nota: como o Workbench roda em `https://localhost:4321` e o mock em `http://localhost:3000`,
> a chamada é cross-origin — o mock já responde com os headers CORS necessários
> (`Access-Control-Allow-Origin: *`).

## Gerando o pacote de produção

```bash
gulp bundle --ship
gulp package-solution --ship
```

O pacote final (`.sppkg`) é gerado em `sharepoint/solution/chatbot-documentos.sppkg`. Faça o
upload desse arquivo no **App Catalog** do tenant (ou site collection app catalog) e adicione o
web part à página desejada.

## Configurando a URL do webhook (Property Pane)

Depois de instalar o web part em uma página:

1. Edite a página e clique no web part **ChatbotWebPart**.
2. No painel de propriedades (Property Pane), preencha:
   - **URL do Webhook n8n** (obrigatório): URL completa do webhook em produção
     (ex: `https://meu-n8n.exemplo.com/webhook/chat`). O campo valida que é uma URL `http(s)`
     válida e não permite salvar em branco.
   - **Título do chat** (opcional): título exibido no topo do chat. Se deixado em branco, usa
     o padrão "Assistente de Documentos".
3. Republique/salve a página.

Para trocar entre o mock local e o ambiente real de produção, basta editar esse mesmo campo —
não é necessário alterar código nem gerar um novo pacote.

## Contrato da API do webhook

Este é o **único acoplamento** entre o web part e o backend. O web part não sabe nem se importa
se por trás existe n8n, outra ferramenta de automação, ou uma API escrita à mão — contanto que a
URL configurada no Property Pane receba a requisição abaixo e devolva a resposta no formato
esperado, funciona. Isso significa que **qualquer pessoa, em qualquer conta n8n (ou outra
ferramenta), pode construir um fluxo do zero** seguindo só esta seção, sem precisar entender nada
do código do web part.

O contrato está definido formalmente em
[`src/webparts/chatbotWebPart/models/IChatModels.ts`](src/webparts/chatbotWebPart/models/IChatModels.ts) —
essa é a fonte da verdade caso este README fique desatualizado.

### O que o web part envia (Request)

Toda vez que o usuário manda uma pergunta, o web part faz um `POST` para a URL configurada no
Property Pane, com este corpo JSON:

```json
{
  "question": "onde estao os dados de ferias dos empregados?",
  "sessionId": "3f1a9c2e-8b7d-4e21-9a4f-1c2d3e4f5a6b",
  "userEmail": "usuario@empresa.com"
}
```

| Campo | Tipo | De onde vem | Para que serve |
| --- | --- | --- | --- |
| `question` | string | O que o usuário digitou na caixa de texto | O texto puro da pergunta, sem formatação |
| `sessionId` | string (UUID v4) | Gerado automaticamente pelo web part, uma vez por carregamento de página | Identifica "essa é a mesma conversa" — útil se seu fluxo quiser dar memória/contexto entre perguntas seguidas. Se a página for recarregada, um novo `sessionId` é gerado (conversa reinicia) |
| `userEmail` | string | Pego automaticamente do `pageContext.user.email` do SharePoint — o usuário não digita isso | Serve para personalizar a resposta, aplicar permissões, ou registrar quem perguntou o quê. Não é validado nem exibido na tela pelo web part |

**Como identificar isso ao montar um fluxo do zero (ex: no n8n):** o nó **Webhook** (trigger)
recebe esse JSON no corpo da requisição. No n8n, você acessa os campos como
`{{ $json.body.question }}`, `{{ $json.body.sessionId }}` e `{{ $json.body.userEmail }}` logo no
primeiro nó depois do Webhook.

### O que o web part espera de volta (Response)

Existem só **duas formas válidas** de resposta — o web part decide qual bolha de chat mostrar
com base em qual delas chegou.

**1. Sucesso** — código HTTP `200`, corpo:

```json
{
  "answer": "A planilha de **férias** está em Google Drive > Empregados.\n\n- Setembro: 12 pessoas\n- Outubro: 8 pessoas",
  "sources": [
    { "name": "Empregados Férias SET-2026", "url": "https://docs.google.com/spreadsheets/d/..." }
  ]
}
```

| Campo | Tipo | Obrigatório? | Para que serve |
| --- | --- | --- | --- |
| `answer` | string | Sim | O texto da resposta, em **markdown simples** (negrito `**assim**`, listas com `-`, links). O web part renderiza isso formatado na bolha do bot |
| `sources` | array de `{ name, url }` | Não (pode vir `[]` ou nem vir) | Se enviado, aparece como uma lista de links clicáveis abaixo da resposta ("Fontes:"). Use para apontar de qual documento a informação veio |

**2. Erro** — qualquer código HTTP de erro (`4xx` ou `5xx`), corpo:

```json
{ "error": "Não foi possível consultar os documentos agora. Tente novamente em alguns minutos." }
```

| Campo | Tipo | Obrigatório? | Para que serve |
| --- | --- | --- | --- |
| `error` | string | Sim, nesse caso | Mensagem amigável mostrada direto pro usuário na bolha de erro (fundo vermelho). Escreva algo que faça sentido pra quem não sabe o que é n8n — evite mensagens técnicas/stack trace |

**Como identificar isso ao montar um fluxo do zero:** no n8n, o nó **Respond to Webhook** é quem
decide o que volta pro web part. Configure o "Response Code" (200 para sucesso, 400/500 para
erro) e o "Response Body" com o JSON exato acima. Se seu fluxo puder falhar (chamada a uma IA, a
um banco, etc.), garanta que **todo caminho de erro** termine num "Respond to Webhook" devolvendo
`{ "error": "..." }" — se o fluxo travar sem responder nada, o web part só vai mostrar um erro
genérico de timeout depois de 30 segundos, o que é uma experiência pior para o usuário.

### Checklist para validar um fluxo novo, em qualquer conta

Antes de colocar a URL no Property Pane, teste o webhook direto por fora do SharePoint:

```bash
curl -X POST https://SUA-URL-AQUI/webhook/o-que-for \
  -H "Content-Type: application/json" \
  -d '{"question":"teste","sessionId":"teste-123","userEmail":"voce@empresa.com"}'
```

- ✅ Voltou `{"answer": "...", "sources": [...]}` com código 200? Está pronto para usar.
- ✅ Provoque um erro de propósito (ex: pergunta que quebra alguma etapa) e confirme que volta
  `{"error": "..."}` com um código de erro, não uma resposta vazia ou um HTML de erro genérico.
- ⚠️ Se a resposta demorar mais de 30 segundos, o web part cancela a chamada e mostra timeout —
  otimize o fluxo ou avise o usuário que pode demorar.

Só depois de bater esse checklist é que vale colar a URL no Property Pane do web part.

### Comportamento do lado do web part (não precisa mexer, só saber que existe)

- Timeout de 30s: se o webhook não responder a tempo, a requisição é cancelada e uma mensagem
  amigável de timeout é exibida no chat.
- Se a resposta de erro trouxer o campo `error`, essa mensagem é exibida; caso contrário, é
  exibida uma mensagem genérica.
- `sessionId` é gerado uma vez por carregamento do web part (não persiste entre recarregamentos
  de página — fora de escopo por enquanto).

## Estrutura do projeto

```
src/webparts/chatbotWebPart/
├── ChatbotWebPartWebPart.ts        # Web part: property pane, contexto SPFx, HttpClient
├── components/
│   ├── ChatContainer.tsx           # Estado da conversa, sessionId, orquestra o envio
│   ├── MessageList.tsx             # Histórico, bolhas usuário/bot, renderização markdown
│   ├── MessageInput.tsx            # Textarea + botão enviar (Enter envia, Shift+Enter quebra linha)
│   ├── SourcesFooter.tsx           # Lista de fontes (Google Drive) abaixo da resposta do bot
│   └── IChatbotWebPartProps.ts
├── models/
│   └── IChatModels.ts              # Contrato de request/response do webhook
└── services/
    └── WebhookService.ts           # Chamada HTTP via SPFx HttpClient, timeout e tratamento de erro
mock-server/
└── server.js                       # Mock local do webhook n8n para desenvolvimento
```

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**
