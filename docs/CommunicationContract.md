# Contrato de Comunicação — Japanese Learning Assistant MVP

**Versão:** 0.1  
**Status:** Draft consolidado para implementação  
**Stack:** NestJS/TypeScript, PostgreSQL, Python/FastAPI  
**Relacionados:** `Modules.md`, `Architectures.md`, `DataModel.md`

## 1. Objetivo e escopo

Este documento define os contratos externos entre a aplicação principal NestJS e Processing, além dos contratos lógicos entre Reader, Learning e Processing. Os caminhos HTTP e os exemplos JSON são propostas iniciais; nomes finais, autenticação e schemas formais devem ser confirmados antes da implementação.

Account, Reader e Learning são módulos da aplicação NestJS. Processing é uma aplicação separada em Python/FastAPI. Dentro do monólito, módulos usam interfaces internas; não é necessário HTTP entre Reader e Learning. Processing usa HTTP/JSON para solicitar operações à aplicação principal.

## 2. Convenções comuns

- Prefixo interno proposto: `/internal/api/v1`.
- Transporte: HTTP com JSON em UTF-8.
- IDs: UUID como strings.
- Timestamps: ISO 8601 com timezone.
- Erros possuem código estável e mensagem diagnóstica. A lógica não depende do texto de `message`.
- Endpoints internos exigem autenticação serviço-a-serviço; o mecanismo concreto fica pendente.
- A requisição e a resposta devem validar-se contra schemas explícitos.

Exemplo de erro: `{"error":{"code":"VALIDATION_ERROR","message":"The request payload is invalid","details":[]}}`.

## 3. Reader → Learning: estado de aprendizagem

### Operação conceitual

Reader passa o identificador do usuário autenticado obtido de contexto confiável do servidor e os IDs canônicos únicos das palavras presentes no texto. Como Reader e Learning estão no mesmo backend NestJS, a chamada pode ser uma interface interna, não um endpoint HTTP.

### Resposta por palavra

Cada resultado é correlacionado por `wordId`, nunca pela ordem. Quando o lote termina, deve haver exatamente um resultado para cada ID solicitado.

- `SUCCESS` + `NOT_STUDIED`: a palavra existe no catálogo, mas não foi adicionada ao vocabulário desse usuário. É resultado normal, não erro.
- `SUCCESS` + `AWAITING_FIRST_REVIEW`: adicionada, sem revisão real ainda.
- `SUCCESS` + `REVIEWED`: pelo menos uma revisão real.
- `NOT_FOUND`: o ID lexical solicitado não foi encontrado/disponibilizado.
- `LOOKUP_FAILED`: falha individual ao determinar o resultado.

`NOT_FOUND` e `LOOKUP_FAILED` são distintos. Falha individual não invalida resultados restantes. `knowledgeDegree` não é obrigatório neste contrato inicial.

### Falha de lote e fallback

Reader é responsável por retry de falhas de comunicação do lote. Se não obtiver uma resposta utilizável, continua exibindo o texto. Para estado indisponível, `AUTO` exibe furigana; `SHOW` exibe e `HIDE` oculta; não aplica cores baseadas em conhecimento e não modifica Learning por causa da falha.

## 4. Processing → Learning: resolução lexical

Learning é proprietário do catálogo lexical canônico e das associações entre formas observadas e palavras canônicas. Processing identifica candidatos, mas não gera IDs canônicos nem escreve diretamente nas tabelas de Learning.

### Operação A — Consultar candidatos

Endpoint HTTP proposto: `POST /internal/api/v1/learning/catalog/resolve` (nome provisório).

Pedido ilustrativo:

```json
{
  "processing_id": "UUID",
  "candidates": [
    {
      "candidate_id": "candidate-001",
      "canonical_form": "学校",
      "canonical_reading": "がっこう",
      "observed_forms": [
        {"surface_form": "学校", "reading": "がっこう", "grammatical_form": "noun"}
      ]
    }
  ]
}
```

`candidate_id` é um identificador de correlação local à operação, não um ID canônico global.

### Resultado conceitual por candidato

- `MATCH`: associação da forma observada com a palavra canônica proposta já existe; retorna o `word_id` estável.
- `CANONICAL_WORD_EXISTS`: palavra canônica existe, mas a associação da forma observada precisa ser registrada/confirmada.
- `NOT_FOUND`: não foi encontrada palavra canônica correspondente.
- `REVIEW_REQUIRED`: a forma observada já está associada a outra palavra canônica; não sobrescrever silenciosamente.
- `FAILED`: falha técnica por item.

### Operação B — Registrar proposta

Depois da consulta, Processing envia propostas de dados lexicais necessários para cadastro. Learning valida cada item e decide se cria ou reutiliza a palavra canônica e sua associação. Resultados conceituais: `CREATED`, `EXISTING`, `REVIEW_REQUIRED`, `REJECTED` e `FAILED`. Esses rótulos ainda podem ser ajustados antes da implementação.

### Regras de lote

- Cada candidato válido recebe um resultado correlacionado pelo `candidate_id`.
- Resultados são independentes; conflito de um item não cancela os demais.
- Alterações concluídas com sucesso são preservadas.
- Requisição inteira pode falhar se Learning estiver indisponível; isso é diferente de falhas individuais.
- NFC deve ser aplicada consistentemente antes de verificar unicidade. A identidade de `CanonicalWord` usa forma canônica + leitura.
- A forma observada e sua leitura não substituem a identidade canônica. Cada ocorrência no texto continua sendo representada individualmente em `Text.elements`.

## 5. Processing → Reader: publicação e substituição

### Identificadores

- `processing_id`: gerado por Processing no início do fluxo; conhecido durante todo o processamento.
- `text_id`: gerado por Reader; Processing só o conhece após recebê-lo na resposta da publicação inicial.
- Na substituição de um texto existente, Processing já conhece o `text_id` e o envia.

### Endpoint proposto

`POST /internal/api/v1/reader/texts/publication`

### Publicação inicial

Pedido conceitual (sem `text_id`):

```json
{
  "processing_id": "UUID",
  "operation": "PUBLISH",
  "attempt_number": 1,
  "text_id": null,
  "expected_version": null,
  "original_content": "私は学校へ行きました。",
  "elements": []
}
```

Reader valida o documento, gera `text_id`, persiste a versão 1 e grava o resultado idempotente na mesma transação.

Resposta de sucesso ilustrativa:

```json
{
  "processing_id": "UUID",
  "text_id": "UUID",
  "version": 1,
  "status": "PUBLISHED"
}
```

### Substituição

Pedido `REPLACE` inclui `text_id` conhecido e `expected_version`. Reader verifica existência e versão esperada. Se válida, substitui conteúdo e elementos atomicamente, mantém o `text_id`, incrementa `version` e atualiza `Text.processing_id`. Se falhar, mantém conteúdo, versão e `processing_id` anteriores.

### Idempotência

`processing_id` é a chave de idempotência para uma operação lógica. Reader mantém `TextPublication`, com pelo menos `processing_id` único, `text_id`, tipo de operação, fingerprint do pedido, versão publicada e timestamp. O registro da operação e a publicação são gravados na mesma transação.

- Mesmo `processing_id` + mesmo tipo e payload: retornar resultado original; não duplicar texto nem incrementar versão novamente.
- Mesmo `processing_id` com payload/tipo diferente: rejeitar com `409 IDEMPOTENCY_KEY_REUSED`.
- Nova operação lógica, inclusive uma substituição legítima: novo `processing_id`.
- Retry de uma operação: mesmo `processing_id`, mesmos dados e mesmos valores de `text_id`/`expected_version` originais.
- A consulta idempotente deve ocorrer antes da validação de versão em um retry, pois a primeira tentativa pode já ter incrementado a versão.
- A unicidade de `processing_id` deve ser garantida no banco, incluindo requisições concorrentes.
- Registros idempotentes não expiram automaticamente no MVP.

### Perda de resposta

Se a resposta de Reader não chegar, Processing registra `PUBLICATION_OUTCOME_UNKNOWN` usando `processing_id` e não inventa `text_id`. Repete a mesma operação com o mesmo payload para recuperar o resultado original. Timeout não prova que a publicação falhou.

## 6. Estados do processamento e eventos

Estados acordados:

- `PENDING`
- `PROCESSING`
- `WAITING_FOR_HUMAN_REVIEW`
- `WAITING_FOR_PUBLICATION`
- `WAITING_FOR_MANUAL_PUBLICATION`
- `PUBLISHED`
- `FAILED` (somente irrecuperável)

Processing registra eventos desde o início usando `processing_id`. `text_id` é opcional até Reader retorná-lo. Eventos de conflito ou revisão anteriores à publicação podem existir sem `text_id`; quando Reader retorna o ID, Processing associa-o ao fluxo/eventos relevantes.

O checkpoint JSON e o relatório de conflitos pertencem a Processing. Reader armazena apenas textos publicados. No MVP, a revisão administrativa ocorre por exportação e reenvio manual de JSON; ao retomar, Processing revalida os dados com Learning. Uma correção humana explícita tem prioridade sobre propostas anteriores, mas alterações do catálogo devem ser efetivadas por Learning.

## 7. Erros, retries e transações

- Erros de transporte são diferentes de falhas por item lexical.
- Retries são limitados e usam a mesma identidade e payload para a mesma operação lógica. Limites e intervalos serão definidos na implementação.
- Erro de validação exige corrigir o payload antes de tentar novamente.
- Conflito de versão exige reconciliação, não retry cego.
- A atualização de `UserVocabularyEntry` e inserção de `ReviewRecord` ocorrem na mesma transação.
- Publicação de `Text` e inserção de `TextPublication` ocorrem na mesma transação.
- Processing preserva checkpoints para retomar sem repetir análise completa quando não necessário.

## 8. Segurança e observabilidade

- Autenticar chamadas entre serviços; mecanismo exato pendente.
- Validar payloads em fronteiras de módulos e aplicações.
- Não armazenar segredos em código nem em artefatos de revisão.
- Logs devem correlacionar por `processing_id` e, quando conhecido, `text_id`; não incluir senhas ou segredos.
- A mensagem de erro não é um contrato; consumidores usam códigos estáveis.

## 9. Pendências antes da implementação

1. Fixar nomes e schemas finais dos endpoints e payloads.
2. Definir se o Processing FastAPI fica ativo como serviço ou é iniciado sob demanda.
3. Definir autenticação serviço-a-serviço.
4. Definir algoritmo de fingerprint e canonicalização do JSON.
5. Definir limites e intervalos de retry.
6. Definir formato detalhado de `Text.elements` e do JSON de revisão humana.
7. Definir se criação lexical é automática em Learning ou se requer operação separada/confirmada.
8. Definir como uma operação `REPLACE` seleciona/retém o texto-alvo no estado de Processing.
