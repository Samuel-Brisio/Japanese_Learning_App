# Plano de Implementação — Japanese Learning Assistant MVP

**Versão:** 0.1  
**Status:** Plano de trabalho vivo  
**Referências:** `Modules.md`, `Architectures.md`, `DataModel.md`, `CommunicationContract.md`

## 1. Objetivo

Transformar as decisões conceituais em uma implementação incremental, evitando continuar expandindo a arquitetura sem entregar software funcional. Este plano separa o que já foi decidido, o que está sendo especificado e o que pode ser implementado em seguida.

## 2. Escopo do MVP

O núcleo do MVP é conta/autenticação, leitura de textos, vocabulário pessoal e revisão espaçada. A preparação linguística de textos é um fluxo administrativo/de conteúdo necessário para disponibilizar textos ao Reader. Recursos avançados de tutoria por IA, geração de conteúdo por IA, listening/speaking, gamificação, social e recomendações complexas permanecem fora do MVP, salvo decisão explícita posterior.

### Fluxo principal do usuário

1. Criar conta e entrar.
2. Abrir um texto publicado.
3. Consultar leitura/furigana e estado de aprendizagem durante a leitura.
4. Selecionar uma palavra e adicioná-la ao vocabulário.
5. Revisar palavras selecionadas para revisão.
6. Informar a avaliação da revisão (`AGAIN`, `HARD`, `GOOD`, `EASY`).
7. Registrar o histórico e calcular a próxima data de revisão conforme a estratégia SRS escolhida.

## 3. Decisões aceitas

- Aplicação principal: NestJS + TypeScript, organizada como monólito modular.
- Banco: PostgreSQL.
- Processing: aplicação separada Python + FastAPI; bibliotecas de NLP japonês ainda a escolher.
- Migrações SQL versionadas como fonte de verdade; `schema_migrations` registra migrações aplicadas.
- UTF-8 para texto; NFC para normalização de texto japonês antes de unicidade; não aplicar NFKC por padrão.
- IDs comuns UUID gerados pelo banco; Reader gera `text_id`; Processing gera `processing_id`.
- Catálogo lexical global separado do progresso individual do usuário.
- `CanonicalWord` identifica palavra por forma canônica + leitura normalizadas. `ObservedForm` é reutilizável globalmente; cada ocorrência textual permanece em `Text.elements`.
- Progresso de palavra independente do conhecimento de kanji; não há `UserKanjiEntry` no MVP.
- `UserVocabularyEntry` combina inclusão no vocabulário e estado atual; `ReviewRecord` registra cada revisão real.
- `NOT_STUDIED` significa ausência de `UserVocabularyEntry`, não estado persistido.
- `AWAITING_FIRST_REVIEW` significa entrada sem revisão real; declarar uma palavra conhecida não cria `ReviewRecord`.
- `Text` usa colunas relacionais mais `JSONB elements`; `original_content` é a fonte autoritativa do texto original.
- Reader é proprietário de `text_id`; Processing é proprietário de `processing_id`.
- Publicação inicial omite `text_id`; substituição inclui `text_id` e `expected_version`.
- Reader mantém registros idempotentes por `processing_id`; retries não duplicam publicação nem incrementam versão novamente.
- Falhas de publicação preservam a versão publicada anterior.
- Revisão administrativa de conflitos e publicação manual usam exportação/reenvio de JSON no MVP.

## 4. Etapas de trabalho

### Etapa 0 — Preparar o repositório e ambiente

**Status:** Em andamento

- [x] Escolher NestJS para a aplicação principal.
- [x] Escolher PostgreSQL.
- [x] Escolher Python/FastAPI para Processing.
- [ ] Definir estrutura inicial do repositório para backend e Processing.
- [ ] Definir configuração de desenvolvimento e variáveis de ambiente sem versionar segredos.
- [ ] Confirmar estratégia de execução local dos dois componentes.

### Etapa 1 — Fechar especificações mínimas

**Status:** Em andamento

- [x] Documentar módulos e limites de domínio.
- [x] Documentar modelo de dados conceitual.
- [x] Documentar a distinção entre publicação inicial, retry e substituição.
- [ ] Fixar schema JSON de `Text.elements`.
- [ ] Fixar contrato técnico Processing–Learning, incluindo política de criação lexical.
- [ ] Fixar contrato técnico Processing–Reader e os códigos HTTP/erro.
- [ ] Definir autenticação serviço-a-serviço.
- [ ] Definir formato do JSON de revisão humana.
- [ ] Escolher ORM/query layer para NestJS sem substituir as migrações SQL como fonte de verdade.

### Etapa 2 — Banco e migrações

**Status:** Não iniciada

- [ ] Validar nomes SQL, FKs, unicidade e constraints.
- [ ] Criar migração inicial versionada para tabelas do modelo.
- [ ] Criar tabela `schema_migrations` ou confirmar o mecanismo mínimo que registra versões aplicadas.
- [ ] Testar aplicação de migrações em banco vazio.
- [ ] Testar atualização de um banco já migrado usando nova migração.
- [ ] Separar seed de teste da estrutura do banco.
- [ ] Preparar backup e procedimento de recuperação antes da implantação.

### Etapa 3 — Backend principal mínimo

**Status:** Não iniciada

- [ ] Implementar Account: registro e login com autenticação local e hash seguro de senha.
- [ ] Implementar interfaces dos módulos Reader e Learning.
- [ ] Implementar catálogo lexical mínimo e resolução/consulta por IDs canônicos.
- [ ] Implementar consulta em lote Reader–Learning com resultado por ID.
- [ ] Implementar armazenamento/publicação de textos em `Text`.
- [ ] Implementar `TextPublication` e idempotência transacional.

### Etapa 4 — Processing mínimo

**Status:** Não iniciada

- [ ] Criar aplicação FastAPI com contratos validados.
- [ ] Implementar `processing_id`, checkpoints e estados do workflow.
- [ ] Integrar consulta e registro de candidatos com Learning.
- [ ] Implementar montagem de `Text.elements` preservando texto e ordem.
- [ ] Implementar publicação inicial e substituição com Reader.
- [ ] Implementar tratamento de resposta perdida por retry idempotente.
- [ ] Implementar exportação de JSON e relatório de conflitos para revisão humana.

### Etapa 5 — Leitura e vocabulário

**Status:** Não iniciada

- [ ] Abrir textos publicados no Reader.
- [ ] Renderizar furigana segundo preferência e dados disponíveis.
- [ ] Adicionar/remover palavra do vocabulário conforme as regras definidas.
- [ ] Garantir unicidade por usuário/palavra.
- [ ] Aplicar fallback visual neutro quando Learning não estiver disponível.

### Etapa 6 — Revisão espaçada

**Status:** Não iniciada

- [ ] Escolher algoritmo SRS adequado ao MVP.
- [ ] Definir grau de conhecimento e sua atualização, se necessário.
- [ ] Definir agendamento inicial de palavra declarada conhecida.
- [ ] Implementar gravação atômica de `ReviewRecord` e atualização de `UserVocabularyEntry`.
- [ ] Implementar seleção de revisões vencidas e índice após validar a consulta.

### Etapa 7 — Qualidade e implantação

**Status:** Não iniciada

- [ ] Testar constraints e relações do banco.
- [ ] Testar idempotência, concorrência e conflitos de versão.
- [ ] Testar falha de comunicação antes/depois do commit de publicação.
- [ ] Configurar CI para testes e validações.
- [ ] Definir execução e implantação dos dois componentes no VPS.
- [ ] Configurar logs com `processing_id` e `text_id` quando disponível.
- [ ] Definir backups externos e procedimento de restauração.

## 5. Decisões explicitamente adiadas

- ORM/query layer do NestJS.
- Bibliotecas específicas de NLP japonês.
- FastAPI ativo continuamente versus execução sob demanda.
- Algoritmo SRS e valores exatos de agendamento.
- Métrica/limiar para ocultar furigana automaticamente.
- Schema completo de elementos linguísticos em JSONB.
- Autenticação interna entre NestJS e Processing.
- Limites de retry, timeouts e backoff.
- Política de exclusão/anonymização de contas.
- Indexação adicional guiada por consultas reais.

## 6. Regra de progresso

Uma decisão só é considerada implementada quando existe código e teste relevante; documentação por si só não significa que o recurso esteja implementado. Quando uma decisão mudar, atualizar os artefatos relacionados antes de implementar a alteração.
