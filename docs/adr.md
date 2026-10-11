# Documentação de Arquitetura — MVP

**Versão:** 0.2 
**Status:** Em desenvolvimento  
**Escopo:** Arquitetura do MVP

## 1. Objetivo

Este documento registra as principais decisões arquiteturais do MVP, suas motivações, consequências e limitações conhecidas.

O objetivo é manter uma arquitetura suficientemente organizada para permitir evolução futura, sem introduzir complexidade que não seja necessária para a primeira versão.

As decisões serão revisadas conforme novos requisitos e necessidades técnicas forem identificados.

## 2. Princípios arquiteturais

O projeto seguirá estes princípios:

1. **Simplicidade:** implementar apenas as abstrações justificadas pelos requisitos atuais.
2. **Separação de responsabilidades:** cada módulo deve possuir responsabilidades claramente definidas.
3. **Baixo acoplamento:** mudanças internas em um módulo devem minimizar impactos nos demais.
4. **Independência do domínio:** as regras de negócio não devem depender diretamente de frameworks ou mecanismos de persistência.
5. **Evolução incremental:** permitir substituição de componentes sem exigir uma reestruturação completa do sistema.
6. **Interfaces explícitas:** módulos devem interagir por contratos definidos, sem depender de comportamentos internos uns dos outros.

---

## 3. ADR-001 — Monólito modular organizado por domínio

**Status:** Aceito  
**Contexto:** Organização estrutural do MVP.

### Contexto e problema

O sistema precisa agrupar funcionalidades relacionadas, mantendo suas responsabilidades separadas. Uma arquitetura excessivamente distribuída aumentaria o custo operacional e a complexidade de desenvolvimento antes de existir uma necessidade concreta.

### Decisão

Adotar um **monólito modular organizado por domínio**.

O código será agrupado por áreas funcionais, e não exclusivamente por categorias técnicas globais, como controllers, services e repositories.

Cada módulo deverá concentrar suas responsabilidades e expor operações por meio de interfaces apropriadas.

### Consequências positivas

- Facilita localizar e modificar funcionalidades relacionadas.
- Reduz a necessidade de infraestrutura distribuída.
- Permite testar os módulos com maior isolamento.
- Cria limites que podem facilitar uma eventual extração de serviços no futuro.

### Consequências negativas

- Os limites entre módulos precisarão ser respeitados por convenção e testes.
- Um monólito modular não garante isolamento automaticamente.
- Uma extração futura para serviços independentes ainda exigirá trabalho adicional.

### Escopo

A adoção de módulos não implica que cada módulo deva ter seu próprio processo, banco de dados ou serviço HTTP.

---

## 4. ADR-002 — DDD leve e arquitetura hexagonal pragmática

**Status:** Aceito  
**Contexto:** Organização interna dos módulos.

### Contexto e problema

O sistema precisa proteger as regras de negócio contra dependências desnecessárias de infraestrutura. Entretanto, aplicar integralmente padrões de DDD ou arquitetura hexagonal seria desproporcional ao escopo inicial.

### Decisão

Adotar DDD leve combinado com uma arquitetura hexagonal pragmática.

Os módulos poderão separar suas responsabilidades em:

- **Domínio:** regras de negócio, entidades, objetos de valor e contratos necessários ao domínio.
- **Aplicação:** coordenação dos casos de uso.
- **Infraestrutura:** implementações técnicas, como persistência, integrações e adaptadores.

Essa separação deverá ser aplicada conforme a necessidade real de cada módulo, sem exigir a criação de todas as camadas ou classes em todos os casos.

O núcleo de negócio não deverá depender diretamente de FastAPI, PostgreSQL ou outros detalhes de infraestrutura.

### Consequências positivas

- Regras de negócio mais fáceis de testar.
- Menor dependência de tecnologias específicas.
- Maior facilidade para substituir implementações técnicas.
- Estrutura compreensível sem impor formalismo excessivo.

### Consequências negativas

- Interfaces e adaptadores acrescentam algum código.
- Uma separação mal aplicada pode gerar abstrações desnecessárias.
- Será necessário estabelecer convenções para evitar dependências indevidas entre camadas.

### Diretriz

A arquitetura deve servir ao domínio, e não obrigar o domínio a se adaptar à arquitetura.

---

## 5. ADR-003 — Organização do módulo Learning

**Status:** Aceito  
**Contexto:** Representação do aprendizado e do histórico de revisões.

### Contexto e problema

O sistema precisa representar o estado atual de aprendizagem de um usuário e registrar o histórico de suas revisões.

Essas informações estão relacionadas e precisam permanecer consistentes, mas cumprem papéis diferentes.

### Decisão

Manter os conceitos de aprendizagem e vocabulário no mesmo módulo de domínio, denominado `learning`.

O módulo será responsável pelas regras relacionadas ao estado de aprendizagem, ao histórico de revisões e à lógica de repetição espaçada.

Os principais conceitos identificados são:

- **Learner:** representa o estado atual de aprendizagem.
- **ReviewLog:** representa o histórico de revisões realizadas.
- **SRS:** representa a estratégia de repetição espaçada, cuja implementação deverá poder ser substituída.

A separação desses conceitos não determina, por si só, a estrutura definitiva das tabelas ou os atributos de cada entidade. Esses detalhes serão definidos conforme os requisitos funcionais forem formalizados.

### Consequências positivas

- Mantém juntas as regras de negócio relacionadas.
- Distingue o estado atual dos registros históricos.
- Permite evoluir a estratégia de repetição espaçada sem acoplar todo o sistema a um algoritmo específico.

### Consequências negativas

- Será necessário definir como o estado atual e o histórico permanecem consistentes.
- A substituição do algoritmo poderá exigir adaptação caso estratégias diferentes utilizem informações distintas.
- O módulo poderá crescer e precisar de subdivisões internas no futuro.

### Limites da decisão

A escolha de manter os conceitos em `learning` não significa que todas as funcionalidades relacionadas ao usuário devam pertencer a esse módulo.

---

## 6. ADR-004 — Comunicação entre Reader e Learning

**Status:** Aceito  
**Contexto:** Integração entre a experiência de leitura e as funcionalidades de aprendizagem.

### Contexto e problema

O Reader precisa interagir com as funcionalidades de aprendizagem. Entretanto, não deve conhecer os comportamentos internos, as entidades ou os mecanismos de persistência utilizados pelo módulo Learning.

Além disso, o Reader precisa consultar o estado de aprendizagem das palavras para aplicar regras de apresentação, incluindo a exibição automática de furigana. É necessário representar também palavras que o usuário declara conhecer, mas que ainda não passaram por uma revisão no sistema.

### Decisão

O Reader deverá interagir com Learning por meio de uma interface explícita. O contrato deverá representar as operações de aprendizagem de que o Reader realmente necessita, sem expor detalhes internos de implementação.

A camada de aplicação responsável pela coordenação dos módulos deverá organizar os fluxos que envolvam mais de um módulo, quando necessário.

#### Responsabilidades dos módulos

- **Reader:** apresenta o conteúdo, mantém a preferência manual de exibição de furigana por palavra e decide como renderizar cada palavra.
- **Learning:** gerencia o vocabulário do usuário, o estado de aprendizagem, as declarações de conhecimento, o histórico de revisões e a estratégia de repetição espaçada (SRS).
- O Reader não conhece as entidades internas, tabelas, algoritmo SRS ou mecanismos de persistência do Learning.
- O Learning não decide como o Reader apresenta o conteúdo e não mantém a preferência manual de furigana.

#### Estado de aprendizagem exposto ao Reader

O contrato conceitual deverá permitir ao Reader distinguir os seguintes estados:

- `NOT_STUDIED`: a palavra ainda não foi adicionada ao vocabulário do usuário no Learning.
- `AWAITING_FIRST_REVIEW`: a palavra está no vocabulário, mas ainda não possui uma revisão real registrada.
- `REVIEWED`: existe pelo menos uma revisão real registrada para a palavra.

O estado do ciclo de aprendizagem é distinto do grau de conhecimento. O grau de conhecimento pode estar indisponível, especialmente antes da primeira revisão. Nesse caso, o contrato deverá representar explicitamente a ausência do valor, em vez de inventar um grau.

O conhecimento de uma palavra é independente do conhecimento dos kanji que a compõem. Conhecer um kanji não implica, por si só, conhecer uma palavra que o utiliza.

No MVP, o Reader precisa apenas do estado de aprendizagem e do grau de conhecimento, quando disponível. Histórico, datas de revisão e estatísticas não precisam ser expostos sem uma necessidade concreta.

#### Palavras declaradas como conhecidas

- Quando o usuário declara conhecer uma palavra, o Learning deve adicioná-la ao vocabulário sem registrar uma revisão que não aconteceu.
- A declaração de conhecimento deve ser representada separadamente do histórico de revisões.
- A palavra permanece em `AWAITING_FIRST_REVIEW` até que uma revisão real seja registrada, mesmo que o usuário a tenha declarado conhecida.
- A primeira revisão deve ser prevista para um intervalo relativamente curto, sem exigir uma sessão de revisão imediata no momento da declaração.
- A declaração pode informar a inicialização do estado de aprendizagem e do agendamento pelo SRS. Se a primeira revisão for respondida corretamente, o algoritmo poderá então definir um intervalo maior, de acordo com sua estratégia.
- A data em que a palavra foi adicionada, a data da última revisão real e a próxima data de revisão são conceitos distintos. A data de adição não deve ser registrada como se fosse uma revisão.
- A inicialização especial decorrente de uma declaração de conhecimento deve ficar concentrada no fluxo de inicialização do Learning/SRS, evitando espalhar condições especiais pela lógica normal de revisão.

O algoritmo SRS, a representação interna da declaração, os intervalos concretos e a regra exata de inicialização permanecem pendentes. Esta decisão define o comportamento esperado, não a implementação específica.

#### Preferência de furigana e regra de apresentação

A preferência manual de furigana descreve como o usuário deseja visualizar o conteúdo; o estado de aprendizagem representa o conhecimento estimado do usuário. São informações distintas.

A preferência possui três estados conceituais:

- `SHOW`: exibir furigana, independentemente do estado de aprendizagem.
- `HIDE`: ocultar furigana, independentemente do estado de aprendizagem.
- `AUTO`: decidir com base no estado de aprendizagem. `AUTO` também representa a ausência de preferência manual explícita.

A regra de apresentação é:

1. Se a preferência for `SHOW`, o Reader exibe furigana.
2. Se a preferência for `HIDE`, o Reader oculta furigana.
3. Se a preferência for `AUTO`, ou não estiver definida, o Reader consulta o estado de aprendizagem no Learning.
4. O Reader aplica o limiar de conhecimento definido para ocultar automaticamente o furigana; abaixo do limiar, exibe furigana.

A métrica e o limiar usados nessa decisão ainda não estão definidos e deverão ser formalizados separadamente.

#### Forma de consulta

O Reader poderá enviar ao Learning, em uma única consulta, o conjunto de palavras presentes no trecho exibido e receber o estado correspondente a cada palavra. A consulta em lote é a abordagem preferida para evitar chamadas individuais desnecessárias.

O formato exato da operação, a identificação do usuário, os tipos concretos de dados e a política de erros ainda serão definidos durante o detalhamento do contrato.

### Consequências positivas

- Reduz o acoplamento entre Reader e Learning.
- Permite alterar a implementação interna de Learning sem exigir mudanças desnecessárias no Reader.
- Facilita testar o Reader utilizando uma implementação substituta da interface.
- Distingue declaração de conhecimento de evidência obtida em revisões reais.
- Mantém o contrato do Reader focado nos dados necessários à experiência de leitura.

### Consequências negativas

- O contrato precisa ser cuidadosamente definido.
- Alterações no contrato podem afetar seus consumidores.
- A interface não deve se transformar em uma camada genérica com operações que o sistema não utiliza.
- O SRS precisará atender ao comportamento esperado para palavras declaradas conhecidas, sem tratar a declaração como revisão real.

### Questões ainda abertas

- Quais operações o Reader precisa solicitar ao Learning?
- Quais dados devem ser retornados por cada operação?
- Como serão representados erros e operações inválidas?
- Como será identificada a correspondência entre as palavras solicitadas e os resultados?
- Qual métrica e qual limiar serão usados para a decisão automática de furigana?
- Como será representada internamente a declaração de conhecimento e como ela inicializará o SRS?

Essas questões serão definidas a partir dos fluxos concretos do MVP.

---

## 7. ADR-005 — Processamento isolado sob demanda

**Status:** Aceito  
**Contexto:** Execução de processos de análise independentes do fluxo principal da aplicação.

### Contexto e problema

Algumas operações de processamento precisam executar de maneira independente do ciclo normal de requisições da aplicação. Elas devem ter um ambiente de execução isolado e não precisam permanecer ativas continuamente.

No MVP, o processamento será iniciado manualmente por um administrador.

### Decisão

Executar o processamento sob demanda em um contêiner Docker temporário.

O fluxo geral será:

1. O administrador solicita a execução.
2. O sistema inicia o ambiente de processamento.
3. O processo executa a análise.
4. Os resultados são devolvidos ou persistidos conforme o contrato definido para a operação.
5. O contêiner é encerrado após a conclusão.

O processamento não será tratado como um serviço permanentemente ativo.

### Consequências positivas

- Isola o ambiente de execução.
- Evita manter recursos reservados quando não há processamento.
- Facilita reproduzir e controlar o ambiente de execução.
- Separa o ciclo de vida do processamento do ciclo de vida da aplicação principal.

### Consequências negativas

- A inicialização do contêiner acrescenta latência.
- Falhas durante a execução precisam ser identificadas e registradas.
- O ciclo de vida do processo e a persistência dos resultados precisam ser coordenados.
- Será necessário definir o comportamento em caso de interrupção ou falha parcial.

### Questões ainda abertas

- Como serão registrados o estado e os resultados de cada execução?
- Como serão tratados erros e novas tentativas?
- Como a aplicação acompanhará o término do processo?
- Quais limites de recursos e tempo serão aplicados?
- Como será garantido que a limpeza do contêiner ocorra mesmo em caso de falha?

Essas decisões serão tomadas antes de formalizar o mecanismo de execução definitivo.

---

## 8. Decisões pendentes

Os seguintes tópicos ainda precisam ser especificados:

1. Contrato técnico entre Reader e Learning, incluindo consulta em lote, identificação do usuário, formato dos resultados e tratamento de erros.
2. Casos de uso e responsabilidades das camadas de aplicação.
3. Modelo de dados de Learner e ReviewLog.
4. Contrato e ciclo de vida da estratégia SRS, incluindo a inicialização de palavras declaradas conhecidas.
5. Limites transacionais entre estado atual e histórico.
6. Persistência e acompanhamento das execuções de processamento.
7. Tratamento de erros e recuperação após falhas.
8. Métrica e limiar usados para a decisão automática de exibição de furigana.

Uma decisão pendente não representa necessariamente um problema arquitetural. Significa apenas que ainda não há informação suficiente para estabelecer uma solução definitiva.

## 9. Processo de evolução

Novas decisões arquiteturais deverão ser registradas quando afetarem significativamente os limites dos módulos, as dependências, a persistência, a execução ou a capacidade de evolução do sistema.

Cada ADR deverá conter:

- Identificador e título.
- Status.
- Contexto e problema.
- Decisão adotada.
- Consequências positivas e negativas.
- Questões pendentes, quando aplicável.

Decisões substituídas deverão ser marcadas como `Superseded`, mantendo o histórico e a justificativa para a mudança.

O objetivo desta documentação não é prever toda a implementação, mas preservar as decisões importantes e tornar explícitas as razões pelas quais a arquitetura evolui de determinada maneira.
