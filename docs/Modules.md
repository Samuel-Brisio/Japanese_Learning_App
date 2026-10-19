# Módulos do Sistema

**Versão:** 0.5  
**Status:** Proposta em evolução; decisões de comunicação e stack atualizadas em 0.5

## 1. Objetivo

Este documento descreve os módulos funcionais do MVP, suas responsabilidades e os limites entre eles. O sistema será organizado como um monólito modular: os módulos fazem parte da mesma aplicação, mas expõem contratos explícitos e evitam depender diretamente de suas implementações internas.

## 2. Módulos

### 2.1. Reader

**Responsabilidade:** gerenciar a experiência de leitura e as regras de apresentação do conteúdo.

#### Estrutura hexagonal e DDD

O Reader é organizado como um módulo hexagonal:

- **Domínio:** `Text` representa o agregado de texto estruturado e protege invariantes
  como conteúdo não vazio e versão maior ou igual a 1.
- **Aplicação:** casos de uso recebem/publicam um texto estruturado, listam os
  textos do usuário e consultam um texto específico. Eles dependem apenas da
  porta `TextRepository`.
- **Porta de saída:** `TextRepository` define as operações de leitura necessárias
  pelo domínio de aplicação, sem mencionar Prisma ou HTTP.
- **Adaptador de saída:** `PrismaTextRepository` traduz registros do Prisma para a
  entidade `Text`.
- **Adaptadores de entrada:** `ReaderPublicationController` recebe o texto
  estruturado do Processing; `ReaderController` expõe as consultas do frontend
  e converte erros de aplicação em respostas HTTP.

O `ReaderModule` conecta a porta ao adaptador Prisma por injeção de dependência.
Assim, os casos de uso podem ser testados sem banco, e a persistência pode ser
substituída sem alterar o domínio ou a API.

O Reader apresenta o conteúdo ao usuário e decide como renderizar palavras, incluindo se deve exibir furigana. Essa decisão considera a preferência manual do usuário para a palavra e, quando não existe uma preferência definida, o estado de aprendizagem fornecido pelo Learning.

O Reader é responsável por armazenar e consultar a preferência de apresentação de furigana por palavra. A preferência possui três estados conceituais:

- `SHOW`: exibir furigana independentemente do estado de aprendizagem.
- `HIDE`: ocultar furigana independentemente do estado de aprendizagem.
- `AUTO`: decidir automaticamente com base no estado de aprendizagem.

`AUTO` representa a ausência de uma preferência manual explícita e poderá ser representado por um valor nulo na persistência, caso essa convenção seja adotada.

**Limites:** o Reader não mantém nem calcula o estado de aprendizagem, não altera o histórico de revisões e não conhece as regras internas do SRS. Ele consulta o Learning por meio de uma interface explícita e aplica a regra de apresentação localmente.

### 2.2. Learning

**Responsabilidade:** gerenciar o vocabulário do usuário, o estado de aprendizagem, as declarações de conhecimento e o histórico de revisões.

O Learning mantém as informações que representam o conhecimento estimado do usuário sobre cada palavra e registra as revisões reais realizadas. Também é responsável pelas regras relacionadas à atualização desse estado e à estratégia de repetição espaçada (SRS).

O conhecimento de uma palavra deve ser tratado separadamente do conhecimento dos kanji que a compõem: conhecer um kanji não significa necessariamente conhecer uma palavra que o utiliza.

Para a integração com o Reader, o Learning deve disponibilizar, por palavra, um estado do ciclo de aprendizagem e o grau de conhecimento quando disponível. Os estados conceituais são:

- `NOT_STUDIED`: a palavra ainda não foi adicionada ao vocabulário do usuário.
- `AWAITING_FIRST_REVIEW`: a palavra foi adicionada ao vocabulário, mas ainda não possui uma revisão real registrada.
- `REVIEWED`: a palavra possui pelo menos uma revisão real registrada.

O estado do ciclo de aprendizagem não é o mesmo que o grau de conhecimento. O grau pode estar indisponível antes da primeira revisão; essa ausência deve ser explícita no contrato.

#### Palavras declaradas como conhecidas

Quando o usuário declara conhecer uma palavra, o Learning deve adicioná-la ao vocabulário sem criar uma revisão fictícia e sem iniciar uma sessão de revisão imediata. A declaração de conhecimento é informação distinta do histórico de revisões.

A palavra permanece em `AWAITING_FIRST_REVIEW` até a primeira revisão real. O sistema deve prever essa primeira revisão para um intervalo relativamente curto, considerando a declaração como informação inicial para a estratégia SRS. Uma resposta correta nessa primeira revisão pode levar a um intervalo maior, conforme a estratégia escolhida.

As datas de adição ao vocabulário, da última revisão real e da próxima revisão têm significados diferentes e não devem ser tratadas como equivalentes. A forma de armazenar a declaração e a lógica exata de inicialização do SRS ainda serão definidas; a adaptação deve ficar concentrada no fluxo de inicialização, evitando condicionais especiais espalhadas pela lógica normal de revisão.

**Limites:** o Learning não decide como o conteúdo é apresentado nem mantém a preferência manual de furigana. Outros módulos acessam suas capacidades por meio de contratos explícitos, sem depender de entidades, tabelas ou implementações internas.

### 2.3. Processing

**Responsabilidade:** executar tarefas de processamento independentes do fluxo principal da aplicação.

O componente será uma aplicação separada em Python com FastAPI. O fluxo de preparação de textos é iniciado por uma solicitação de processamento e comunica-se com Learning e Reader por contratos explícitos. O modo de implantação (serviço ativo ou execução sob demanda, possivelmente em contêiner) ainda está em aberto; não assumir um contêiner temporário como decisão final.

**Limites:** o ciclo de vida das tarefas de processamento deve ser separado do fluxo principal da aplicação. Para o fluxo de preparação de textos, Processing interage com Learning por meio do contrato explícito descrito na seção 4. Processing não é proprietário do catálogo lexical canônico: identifica formas lexicais e prepara propostas de informação linguística, enquanto Learning valida e mantém o catálogo e as associações entre formas observadas e palavras lexicais canônicas.

## 3. Interação entre Reader e Learning

### 3.1. Fluxo de consulta

1. O Reader identifica as palavras presentes no trecho que será exibido.
2. O Reader envia ao Learning, por meio de uma interface explícita, uma consulta contendo o conjunto de palavras e o contexto de usuário necessário.
3. O Learning retorna um resultado para cada palavra, sem expor suas entidades internas ou seu histórico completo.
4. O Reader associa os resultados às palavras e decide como renderizar o conteúdo.

A consulta em lote é preferida para evitar uma chamada separada para cada palavra. O contrato concreto ainda deverá definir a forma de identificação das palavras, os tipos de retorno e o tratamento de falhas.

### 3.2. Dados conceituais retornados

Para cada palavra, o resultado precisa permitir distinguir:

| Campo conceitual | Significado |
|---|---|
| Estado de aprendizagem | `NOT_STUDIED`, `AWAITING_FIRST_REVIEW` ou `REVIEWED` |
| Grau de conhecimento | Valor fornecido pelo Learning quando disponível; caso contrário, ausência explícita |

O Reader não precisa receber datas de revisão, histórico detalhado ou estatísticas para a funcionalidade atual. Esses dados só deverão ser adicionados ao contrato se uma funcionalidade concreta passar a exigi-los.

### 3.3. Regra de exibição de furigana

O Reader resolve a exibição nesta ordem:

1. Se a preferência manual for `SHOW`, exibe furigana.
2. Se a preferência manual for `HIDE`, oculta furigana.
3. Se a preferência for `AUTO` ou não estiver definida, usa o estado de aprendizagem retornado pelo Learning.
4. Se o grau de conhecimento atingir ou ultrapassar o limiar definido, oculta furigana; caso contrário, exibe furigana.

A métrica e o limiar usados pela decisão automática ainda precisam ser especificados. A regra de apresentação pertence ao Reader; o Learning apenas fornece os dados de aprendizagem necessários.

### 3.4. Declaração de conhecimento pelo usuário

Quando o usuário marca uma palavra como conhecida, o fluxo deve registrar essa declaração no Learning e adicionar a palavra ao vocabulário. Isso não representa uma revisão realizada.

A palavra fica no estado `AWAITING_FIRST_REVIEW` até que uma revisão real ocorra. O Learning/SRS deve considerar a declaração para inicializar o estado e prever a primeira revisão em um intervalo relativamente curto; uma resposta correta nessa revisão pode permitir um intervalo posterior maior. Os intervalos concretos e a representação interna serão definidos quando a estratégia SRS for escolhida.

## 4. Interface entre Processing e Learning

### 4.1. Responsabilidades e conceitos

Processing identifica as formas observadas no texto, propõe suas formas lexicais canônicas e fornece a leitura da forma observada em cada ocorrência processada. Learning é o proprietário do catálogo lexical canônico e mantém as associações entre formas observadas e palavras lexicais canônicas.

Os conceitos abaixo são distintos e não devem ser usados como sinônimos:

- **Identificador de correlação:** identificador local à requisição, gerado por Processing e devolvido por Learning em cada resultado. Serve apenas para relacionar cada item enviado ao seu resultado correspondente.
- **Candidato:** par conceitual `(forma observada, forma lexical canônica proposta)`. Dois candidatos são duplicados quando os dois elementos são iguais. Se qualquer elemento for diferente, trata-se de outro candidato.
- **Forma lexical canônica:** representação normalizada da palavra, por exemplo `食べる`. Learning atribui a ela um identificador lexical canônico estável, independente da grafia ou de correções futuras dos dados.
- **Associação de forma:** relação mantida por Learning entre uma forma observada, por exemplo `食べた`, e a palavra lexical canônica correspondente, por exemplo `食べる`.

A forma observada e sua leitura não são a identidade da palavra lexical canônica. Formas como `食べた` e `食べます` são associações distintas à mesma palavra lexical canônica `食べる`. Processing fornece a leitura da forma observada quando a encontra; no MVP, Learning não precisa persistir essa leitura como parte da associação.

O identificador de correlação não é o identificador lexical canônico e não deve ser usado como identidade persistente. Processing pode deduplicar candidatos dentro de uma operação e manter separadamente o mapeamento das ocorrências do texto para esses candidatos.

### 4.2. Operação A — Consultar candidatos

Processing envia a Learning uma coleção de candidatos para consulta. Para cada item, a requisição inclui:

| Campo conceitual | Significado |
|---|---|
| Identificador de correlação | Chave única dentro da requisição, gerada por Processing e devolvida sem alteração. |
| Forma observada | Forma exata encontrada no texto, por exemplo `食べた`. |
| Forma lexical canônica proposta | Forma normalizada identificada por Processing, por exemplo `食べる`. |
| Leitura da forma observada | Leitura identificada por Processing para a forma encontrada, por exemplo `たべた`. É informação do processamento atual e não precisa ser persistida por Learning no MVP. |

Learning verifica a associação existente para a forma observada e consulta seu catálogo lexical canônico. O resultado é devolvido individualmente para cada candidato e inclui, quando aplicável, o identificador de correlação, a forma observada, a forma canônica proposta, o resultado da consulta e o identificador lexical canônico estável, caso conhecido.

Resultados conceituais possíveis:

- `MATCH`: a forma observada já está associada à forma lexical canônica proposta; Learning retorna o identificador lexical canônico existente.
- `CANONICAL_WORD_EXISTS`: a palavra lexical canônica existe, mas ainda não há uma associação registrada para essa forma observada. Processing não deve inferir que a associação já existe apenas porque a palavra canônica foi encontrada.
- `NOT_FOUND`: não foi encontrada uma palavra lexical canônica correspondente nem uma associação conhecida para a proposta.
- `REVIEW_REQUIRED`: a forma observada já está associada a uma palavra lexical canônica diferente da proposta. Learning preserva a associação existente e registra a discrepância para revisão administrativa.

Os nomes acima são rótulos conceituais para o contrato e podem ser ajustados antes da implementação. Uma forma canônica existente não elimina a necessidade de verificar a associação da forma observada.

### 4.3. Operação B — Registrar propostas de informação lexical

Após a consulta, Processing prepara informações linguísticas para candidatos que precisam de cadastro e envia propostas a Learning. A proposta inclui o identificador de correlação, a forma observada, a forma lexical canônica proposta, a leitura da forma observada e as informações lexicais necessárias para cadastrar uma palavra canônica ausente, como leitura canônica, significados, composição em kanji e leituras relevantes dos kanji no contexto da palavra.

Learning valida cada item de forma independente. Ele é responsável por atribuir o identificador lexical canônico estável e por decidir se deve criar uma nova palavra canônica, reutilizar uma já existente ou sinalizar uma discrepância. A leitura da forma observada é fornecida por Processing e não precisa ser armazenada por Learning no MVP; os dados canônicos validados pertencem ao catálogo de Learning.

Cada item da resposta devolve o identificador de correlação e um resultado individual. Resultados conceituais:

- `CREATED`: a palavra lexical canônica foi criada e sua associação com a forma observada foi registrada.
- `EXISTING`: a palavra lexical canônica e a associação apropriada já existiam; o identificador canônico existente é retornado.
- `REVIEW_REQUIRED`: a forma observada já possui uma associação incompatível. A associação existente é preservada e a discrepância é encaminhada para revisão administrativa.
- `REJECTED`: a proposta foi rejeitada por dados inválidos ou insuficientes; a resposta deve informar o motivo quando possível.
- `FAILED`: ocorreu uma falha técnica inesperada ao processar esse item; a resposta deve informar a falha quando possível.

Esses rótulos são conceituais e podem ser refinados antes da implementação. `REVIEW_REQUIRED` é um resultado de negócio tratado, não uma falha técnica.

### 4.4. Regras de lote e consistência

- Learning deve processar cada candidato independentemente e retornar um resultado correspondente a cada item válido da requisição.
- Um conflito, rejeição ou falha técnica em um candidato não deve impedir o processamento dos demais candidatos.
- Alterações concluídas com sucesso devem ser preservadas mesmo que outros itens do lote falhem.
- Cada resultado deve devolver o identificador de correlação recebido, permitindo a Processing associá-lo ao candidato correto sem depender da ordem dos resultados ou de comparar apenas as formas textuais.
- Se a requisição inteira não puder ser iniciada, por exemplo porque Learning está indisponível, a operação pode falhar como um todo. Isso é distinto de resultados individuais de itens já processados.
- Learning não deve sobrescrever silenciosamente uma associação existente quando a proposta indicar outra forma lexical canônica. Deve preservar os dados existentes e registrar a discrepância para revisão administrativa.
- Processing registra os detalhes do desacordo em seu log de processamento; Learning mantém o item de revisão administrativa. O tratamento não deve bloquear as demais palavras do texto.
- Uma associação de forma observada com uma forma canônica diferente da já registrada é considerada conflito neste MVP. A regra não implica que formas observadas diferentes, como `食べた` e `食べます`, sejam conflitantes quando ambas estão associadas a `食べる`.

### 4.5. Dados devolvidos e montagem do texto

Quando conhecida, a resposta inclui a referência lexical canônica estável e as informações canônicas disponíveis necessárias para Processing concluir a montagem do texto estruturado. Processing mantém a ordem dos elementos e a forma exata encontrada no texto; cada ocorrência de palavra aponta para a referência lexical canônica correspondente. Reader armazena a estrutura textual, as formas observadas e as referências estáveis, e consulta Learning para obter informações lexicais atuais e estados de aprendizagem quando for apresentar o texto.

A representação física das associações, o esquema de persistência, as estruturas de dados, a tecnologia de transporte e os limites transacionais permanecem fora do escopo deste contrato conceitual.

## 5. Princípios de comunicação

- Módulos interagem por interfaces explícitas.
- Um módulo não deve acessar diretamente os detalhes internos de outro.
- A comunicação entre módulos dentro do monólito não exige serviços separados nem comunicação por rede.
- A camada de aplicação poderá coordenar fluxos que envolvam mais de um módulo, sem transferir as regras internas de um módulo para outro.
- O contrato entre módulos deve expor apenas os dados necessários aos casos de uso consumidores.
- Identificadores de correlação de requisição não substituem identificadores de domínio estáveis.

## 6. Questões pendentes

- Definir o contrato técnico de consulta em lote Reader–Learning, incluindo identificação do usuário, formato de retorno e tratamento de erros.
- Definir a métrica e o limiar usados pela decisão automática de furigana.
- Definir a representação interna da declaração de conhecimento e como ela inicializa o estado/agendamento do SRS.
- Escolher a estratégia SRS e definir os intervalos concretos de revisão.
- Definir a persistência, a consistência e os limites transacionais do Learning.
- Refinar os nomes e o formato técnico dos resultados do contrato Processing–Learning ao iniciar a implementação.
- Definir o formato técnico dos logs de processamento e dos itens de revisão administrativa.

## 7. Evolução

Esta divisão é uma proposta inicial para o MVP. Novos módulos ou subdivisões deverão ser introduzidos somente quando houver responsabilidades distintas que justifiquem a separação.
## 8. Contrato Reader–Learning: consulta de estado de aprendizagem

### 8.1. Contexto do usuário

Reader passa explicitamente o identificador do usuário autenticado na chamada interna a Learning. Esse identificador deve vir do contexto confiável de autenticação do lado servidor, e não de um valor do cliente aceito sem validação. Learning usa o identificador para consultar o estado de aprendizagem daquele usuário.

### 8.2. Consulta em lote e correspondência

Reader envia uma consulta em lote contendo os identificadores lexicais canônicos únicos necessários para renderizar o texto. Learning retorna um resultado por cada identificador único solicitado quando a operação em lote é concluída. Reader associa os resultados por `wordId`, nunca pela ordem da resposta.

O contrato expõe somente as informações necessárias à leitura. Não inclui histórico de revisão, datas ou estatísticas, pois o Reader não precisa desses dados para a funcionalidade atual.

### 8.3. Resultados por palavra

Cada resultado contém:

- `wordId`: identificador lexical canônico solicitado.
- `status`: `SUCCESS`, `NOT_FOUND` ou `LOOKUP_FAILED`.
- `learningState`: `NOT_STUDIED`, `AWAITING_FIRST_REVIEW`, `REVIEWED` ou `null`, conforme o resultado.

Significados:

- `SUCCESS`: Learning conseguiu determinar o estado de aprendizagem. `NOT_STUDIED` é um resultado bem-sucedido: a palavra existe no catálogo lexical, mas ainda não foi adicionada ao vocabulário daquele usuário.
- `NOT_FOUND`: o identificador lexical canônico solicitado não foi encontrado ou não está disponível em Learning; o estado fica indisponível.
- `LOOKUP_FAILED`: Learning não conseguiu determinar o resultado para aquela palavra por uma falha na consulta; o estado fica indisponível.

Uma falha em uma palavra não invalida os resultados das demais. A resposta deve conter exatamente um resultado para cada `wordId` único solicitado quando o lote for concluído, inclusive resultados explícitos para falhas individuais.

Exemplo ilustrativo:

```json
{
  "results": [
    {"wordId": "W101", "status": "SUCCESS", "learningState": "REVIEWED"},
    {"wordId": "W205", "status": "SUCCESS", "learningState": "AWAITING_FIRST_REVIEW"},
    {"wordId": "W310", "status": "SUCCESS", "learningState": "NOT_STUDIED"},
    {"wordId": "W999", "status": "LOOKUP_FAILED", "learningState": null}
  ]
}
```

Os identificadores do exemplo são ilustrativos. `knowledgeDegree` não é campo obrigatório do contrato do MVP. A necessidade do campo, sua escala e seu cálculo ficam adiados até a escolha e avaliação da estratégia SRS e da experiência de leitura.

### 8.4. Falha da consulta em lote e apresentação de fallback

Falhas de comunicação que impedem obter uma resposta utilizável para o lote inteiro são diferentes de resultados de falha por palavra. Reader é responsável por tentar novamente falhas de comunicação do lote; limites e intervalos exatos são detalhes de implementação.

Se as tentativas não forem bem-sucedidas, Reader mantém o texto legível e não modifica o vocabulário ou o estado de aprendizagem. Para palavras sem informação de aprendizagem disponível:

- em `AUTO`, exibe furigana;
- em `SHOW`, exibe furigana;
- em `HIDE`, oculta furigana;
- não aplica cores baseadas em conhecimento; usa estilo visual neutro e discreto, como cinza ou preto.

O mesmo fallback neutro aplica-se a `NOT_FOUND` e `LOOKUP_FAILED`. Uma palavra com resultado `SUCCESS` e estado `NOT_STUDIED` continua elegível à apresentação normal de palavra não estudada. Mensagens ao usuário como “Algumas palavras não puderam ser carregadas corretamente” ficam adiadas para iterações futuras.

### 8.5. Decisões adiadas

A escala e o cálculo de grau de conhecimento, a necessidade definitiva de expor esse grau no contrato, o limiar para ocultar furigana em `AUTO`, os limites e intervalos de retry e mensagens de erro ao usuário não são necessários para concluir o desenho arquitetural atual. Devem ser revistos quando houver evidências da implementação e da experiência de uso.

## 9. Preparação e publicação de textos: contrato Processing–Reader

### 9.1. Responsabilidades

Processing é responsável pela análise linguística e pela orquestração do processamento do texto. Learning é a fonte de verdade para identificadores lexicais canônicos e associações entre formas observadas e palavras canônicas. Reader valida e persiste o texto pronto para leitura e é proprietário do identificador do texto persistido (`textId`).

Processing envia uma única requisição de publicação contendo um texto completo e validado, incluindo todo o conteúdo necessário para Reader validar e persistir o texto. Reader não deve chamar Processing de volta para obter informações ausentes. A requisição conceitual inclui `processingId`, `attemptNumber`, `operation` e `text`, com o conteúdo original e os elementos ordenados.

Reader valida estrutura, campos obrigatórios, consistência, ordem e reconstrução do texto e requisitos de publicação. Reader não repete a análise linguística. Se Processing tentou produzir análise para um elemento, deve fornecer todos os campos exigidos ou indicar explicitamente que o elemento não foi analisado. Elementos sem análise são permitidos quando essa condição está explícita e o texto e sua ordem são preservados.

### 9.2. Identidade e idempotência

- Cada nova submissão do usuário representa uma entrada de texto distinta, mesmo quando o conteúdo é idêntico; não há deduplicação por hash no MVP.
- `processingId` é a identidade lógica/idempotency key da publicação e é associado a um `textId` criado por Reader na primeira persistência bem-sucedida.
- Repetir `PUBLISH` para um `processingId` já publicado não cria outro texto: Reader retorna `ALREADY_PUBLISHED` e mantém o texto existente.
- `REPLACE` atualiza um texto existente; não cria um novo texto implicitamente. Se o `processingId` não existir, Reader rejeita a operação. A substituição mantém o `textId` original.
- `attemptNumber` é controlado por Processing para acompanhar tentativas e não é usado por Reader para decidir qual versão é a mais recente. Processing deve impedir que solicitações obsoletas substituam uma versão mais nova.
- Em uma substituição, a versão antiga permanece disponível se a validação ou persistência da nova versão falhar. A nova versão só passa a valer após validação e persistência completas.

### 9.3. Resposta de publicação

A resposta estruturada contém `processingId`, `status`, `message`, e `textId` quando já existir um texto associado. `diagnostic` é opcional e pode conter texto simples.

Estados conceituais de resposta:

- `PUBLISHED`: texto novo foi persistido e está disponível no Reader.
- `ALREADY_PUBLISHED`: o mesmo `processingId` já havia sido publicado; não foi criado duplicado.
- `REPLACED`: uma versão existente foi substituída com sucesso, preservando `textId`.
- `INVALID_REQUEST`: requisição malformada, inconsistente ou operação de substituição para identificador inexistente.
- `PUBLICATION_FAILED`: Reader não conseguiu concluir a persistência e pode informar uma falha estruturada.

`PUBLISHED` significa persistência concluída e disponibilidade para leitura, não apenas recebimento da requisição ou validação. Uma falha de transporte pode resultar em ausência de resposta. Nesse caso, Processing pode repetir a mesma publicação lógica; a idempotência evita duplicação.

### 9.4. Recuperação e revalidação

Processing mantém os checkpoints duráveis do processamento e Reader mantém o texto publicado. Se publicação falhar após esgotar as tentativas automáticas, Processing salva o JSON e o contexto do erro e aguarda publicação manual. Se houver conflito lexical, Processing salva o JSON e um documento de conflitos para revisão administrativa.

No MVP, a revisão administrativa pode ocorrer por exportação e envio manual de JSON. O administrador pode corrigir uma proposta para uma terceira forma canônica; uma correção explicitamente revisada tem prioridade sobre propostas anteriores e atualiza a associação global por meio de Learning. Ao retomar, Processing revalida os dados com Learning antes de tentar publicar. Não há integração direta Reader–Processing para recuperação administrativa no MVP.

## 10. Ciclo de vida do processamento de texto

Estados conceituais:

- `PENDING`: pronto para iniciar ou retomar.
- `PROCESSING`: execução ativa.
- `WAITING_FOR_HUMAN_REVIEW`: existe conflito ou item lexical não resolvido; checkpoint JSON e detalhes do conflito foram salvos.
- `WAITING_FOR_PUBLICATION`: todas as ocorrências possuem identificadores canônicos válidos e o JSON completo foi salvo; a publicação está sendo tentada.
- `WAITING_FOR_MANUAL_PUBLICATION`: as tentativas automáticas de publicação foram esgotadas; JSON e contexto do erro foram salvos para recuperação manual.
- `PUBLISHED`: Reader confirmou a persistência do texto.
- `FAILED`: reservado para situações genuinamente irrecuperáveis, não para interrupções técnicas comuns que possam ser retomadas.

Transições principais:

- `PENDING` → `PROCESSING`.
- `PROCESSING` → `WAITING_FOR_HUMAN_REVIEW` diante de conflito lexical.
- `PROCESSING` → `WAITING_FOR_PUBLICATION` quando o texto estruturado completo estiver pronto e salvo.
- `WAITING_FOR_PUBLICATION` → `PUBLISHED` após confirmação de Reader, ou → `WAITING_FOR_MANUAL_PUBLICATION` quando a política de retry for esgotada.
- Após o administrador reenviar JSON corrigido, estados de recuperação podem voltar a `PROCESSING`, revalidar com Learning e retomar o fluxo.

A contagem e os intervalos de retry, o esquema técnico do JSON, a persistência de checkpoints, a autenticação administrativa e a implementação da idempotência ficam para etapas posteriores.

## 11. Princípios de publicação

- O processamento só é considerado publicado após confirmação de persistência por Reader.
- Checkpoints e artefatos de recuperação pertencem a Processing; o texto final persistido pertence a Reader.
- Falhas recuperáveis devem manter informação suficiente para retomar sem duplicar alterações bem-sucedidas.
- A análise linguística não deve ser repetida por Reader como parte da validação estrutural.


---

## 12. Stack de implementação e limites dos componentes

**Status:** Decisão aceita para o MVP

- **Aplicação principal:** NestJS com TypeScript. Os módulos Account, Reader e Learning permanecem organizados como módulos de domínio na aplicação principal.
- **Banco de dados:** PostgreSQL.
- **Processing:** aplicação separada em Python, usando FastAPI para expor sua interface HTTP.
- **Persistência:** migrações SQL versionadas são a fonte de verdade do esquema. O ORM/query layer da aplicação NestJS continua em aberto até ser comparado com os requisitos do modelo.

FastAPI é a camada de API do Processing, não o mecanismo de análise linguística. As bibliotecas específicas de NLP japonês ainda serão selecionadas. A forma de implantação do FastAPI (serviço continuamente ativo ou execução sob demanda) permanece em aberto; esta decisão não autoriza introduzir filas, Kubernetes ou infraestrutura adicional no MVP.

A decisão de usar Python/FastAPI para Processing atualiza a escolha tecnológica, mas não muda a propriedade do catálogo: Learning continua sendo a fonte de verdade para palavras canônicas e associações lexicais.

## 13. Contrato Processing–Reader: identidade, publicação e substituição

### 13.1. Propriedade dos identificadores

- `processing_id` é gerado e controlado por Processing no início do fluxo e é conhecido durante todo o processamento.
- `text_id` é gerado e controlado por Reader. Processing só conhece `text_id` depois de receber uma resposta de Reader que o contenha.
- Na publicação inicial, Processing não envia `text_id`. Reader cria o texto e devolve o ID.
- Na substituição de um texto já existente, Processing conhece e envia o `text_id` do texto que deseja substituir.

### 13.2. Publicação inicial e retry

Uma publicação inicial usa `operation = PUBLISH`, sem `text_id`. Cada operação lógica tem um `processing_id` único. Um retry da mesma operação reutiliza o mesmo `processing_id` e o mesmo payload. Se Reader já concluiu a operação, devolve o resultado original, incluindo o `text_id` original e a versão publicada, sem criar outro texto. Se a primeira tentativa não foi confirmada, Reader pode processar a operação normalmente.

Se o pedido chegou a Reader, foi persistido, mas a resposta se perdeu, Processing não deve concluir que houve falha definitiva nem inventar um `text_id`. Deve registrar o resultado como desconhecido e repetir a mesma operação com o mesmo `processing_id` para recuperar a resposta idempotente.

### 13.3. Substituição

Uma substituição usa `operation = REPLACE`, inclui o `text_id` conhecido e inclui `expected_version`, correspondente à versão que Processing espera substituir. Reader verifica a existência do texto e a versão esperada; publica a nova estrutura atomicamente, preserva `text_id`, incrementa a versão e atualiza `Text.processing_id` somente após o sucesso. Se falhar, o conteúdo, a versão e o `processing_id` da versão anterior permanecem intactos.

Uma substituição é uma nova operação lógica e usa um novo `processing_id`. Um retry dessa substituição reutiliza o mesmo `processing_id`, o mesmo `text_id` e o mesmo payload.

### 13.4. Registro de operações e idempotência

Reader mantém um registro durável de cada operação de publicação concluída com sucesso, identificada unicamente por `processing_id`. O registro guarda pelo menos `text_id`, tipo de operação, fingerprint do pedido e versão publicada. O registro do texto e o registro da operação são gravados na mesma transação. Registros de operações anteriores são preservados mesmo após substituições, para que retries antigos devolvam seu resultado original.

Se o mesmo `processing_id` for reutilizado com payload ou operação diferentes, Reader rejeita a requisição com erro de conflito de idempotência. Uma nova tentativa de processamento legítima recebe um novo `processing_id`.

### 13.5. Logs e eventos

Processing usa `processing_id` como identificador de correlação desde o início. `text_id` é opcional nos logs e eventos até que Reader o devolva. Conflitos lexicais e eventos que ocorram antes da publicação podem ser registrados sem `text_id`. Quando o ID for recebido, Processing pode associá-lo aos eventos do fluxo. O log deve distinguir `PUBLISHED` confirmado de resultado de publicação desconhecido por falha de comunicação.

### 13.6. Estados do processamento

Os estados acordados são `PENDING`, `PROCESSING`, `WAITING_FOR_HUMAN_REVIEW`, `WAITING_FOR_PUBLICATION`, `WAITING_FOR_MANUAL_PUBLICATION`, `PUBLISHED` e `FAILED`. `FAILED` fica reservado a casos genuinamente irrecuperáveis. Uma falha de comunicação com Reader não prova que a publicação falhou; o resultado pode ficar desconhecido até a recuperação idempotente.

O contrato HTTP exato, a estrutura de eventos, os códigos de erro, os limites de retry e a autenticação entre serviços serão especificados no artefato `CommunicationContract.md`.
