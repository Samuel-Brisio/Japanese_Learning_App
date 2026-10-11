# Módulos do Sistema

**Versão:** 0.2
**Status:** Proposta inicial

## 1. Objetivo

Este documento descreve os módulos funcionais do sistema, suas responsabilidades e seus limites. O objetivo é estabelecer uma visão geral da arquitetura antes de definir os detalhes de implementação.

O sistema será organizado como um monólito modular, no qual cada módulo representa uma área funcional e mantém suas responsabilidades separadas das demais.

## 2. Módulos

### 2.1. Reader

**Responsabilidade:** gerenciar a experiência de leitura e as regras de apresentação do conteúdo.

O Reader apresenta o conteúdo ao usuário e decide como renderizar palavras, incluindo se deve exibir furigana. Essa decisão considera a preferência manual do usuário para a palavra e, quando não existe uma preferência definida, o estado de aprendizagem fornecido pelo Learning.

O Reader é responsável por armazenar e consultar a preferência de apresentação de furigana por palavra. A preferência possui três estados conceituais:

- `SHOW`: exibir furigana independentemente do estado de aprendizagem.
- `HIDE`: ocultar furigana independentemente do estado de aprendizagem.
- `AUTO`: decidir automaticamente com base no estado de aprendizagem.

`AUTO` representa a ausência de uma preferência manual explícita e poderá ser representado por um valor nulo na persistência, caso essa convenção seja adotada.

**Limites:** o Reader não mantém nem calcula o estado de aprendizagem. Ele consulta o Learning por meio de uma interface explícita e aplica a regra de apresentação localmente.

### 2.2. Learning

**Responsabilidade:** gerenciar o vocabulário do usuário, o estado de aprendizagem, as declarações de conhecimento e o histórico de revisões.

O Learning mantém as informações que representam o conhecimento estimado do usuário sobre cada palavra e registra as revisões reais realizadas. Também é responsável pelas regras relacionadas à atualização desse estado e à estratégia de repetição espaçada (SRS).

O conhecimento de uma palavra deve ser tratado separadamente do conhecimento dos kanji que a compõem: conhecer um kanji não significa necessariamente conhecer uma palavra que o utiliza.

O módulo deve permitir que a estratégia de repetição espaçada seja substituída sem exigir mudanças desnecessárias nos demais módulos.

**Palavras declaradas como conhecidas**: Quando o usuário declara conhecer uma palavra, o Learning deve adicioná-la ao vocabulário sem criar uma revisão fictícia e sem iniciar uma sessão de revisão imediata. A declaração de conhecimento é informação distinta do histórico de revisões.

A palavra permanece em `AWAITING_FIRST_REVIEW` até a primeira revisão real. O sistema deve prever essa primeira revisão para um intervalo relativamente curto, considerando a declaração como informação inicial para a estratégia SRS. Uma resposta correta nessa primeira revisão pode levar a um intervalo maior, conforme a estratégia escolhida.

As datas de adição ao vocabulário, da última revisão real e da próxima revisão têm significados diferentes e não devem ser tratadas como equivalentes. A forma de armazenar a declaração e a lógica exata de inicialização do SRS ainda serão definidas; a adaptação deve ficar concentrada no fluxo de inicialização, evitando condicionais especiais espalhadas pela lógica normal de revisão.

Limites: o Learning não decide como o conteúdo é apresentado nem mantém a preferência manual de furigana. Outros módulos acessam suas capacidades por meio de contratos explícitos, sem depender de entidades, tabelas ou implementações internas.

O limiar e a métrica que determinam o nível de aprendizagem ainda precisam ser especificados. A implementação também deverá evitar consultas individuais desnecessárias para cada palavra, podendo consultar em lote as informações de um trecho.



### 2.3. Processing

**Responsabilidade:** executar tarefas de processamento independentes do fluxo principal da aplicação.

O Processing será responsável pela execução de operações de processamento sob demanda, em um ambiente isolado por meio de um contêiner Docker temporário.

No MVP, a execução será iniciada manualmente por um administrador. O módulo deverá permitir executar o processamento e disponibilizar seus resultados conforme o contrato definido para cada operação.

**Limite:** o ciclo de vida do processamento deve ser independente do ciclo de vida da aplicação principal. Os mecanismos de acompanhamento, persistência dos resultados e tratamento de falhas ainda precisam ser especificados.

## 3 Comunicação entre módulos

 Princípios de comunicação

- Módulos interagem por interfaces explícitas.
- Um módulo não deve acessar diretamente os detalhes internos de outro.
- A comunicação entre módulos dentro do monólito não exige serviços separados nem comunicação por rede.
- A camada de aplicação poderá coordenar fluxos que envolvam mais de um módulo, sem transferir as regras internas de um módulo para outro.


### 3.1. Interação entre Reader e Learning

O Reader precisa consultar o Learning para obter o estado de aprendizagem das palavras apresentadas. Essa consulta deve ocorrer por meio de uma interface explícita, que exponha somente os dados necessários à experiência de leitura.

Para a integração com o Reader, o Learning deve disponibilizar, por palavra, um estado do ciclo de aprendizagem e o grau de conhecimento quando disponível. Os estados conceituais são:
- `NOT_STUDIED`: a palavra ainda não foi adicionada ao vocabulário do usuário.
- `AWAITING_FIRST_REVIEW`: a palavra foi adicionada ao vocabulário, mas ainda não possui uma revisão real registrada.
- `REVIEWED`: a palavra possui pelo menos uma revisão real registrada.
  
O estado do ciclo de aprendizagem não é o mesmo que o grau de conhecimento. O grau pode estar indisponível antes da primeira revisão; essa ausência deve ser explícita no contrato.

3.1.1. ** Fluxo de consulta**
1. O Reader identifica as palavras presentes no trecho que será exibido.
2. O Reader envia ao Learning, por meio de uma interface explícita, uma consulta contendo o conjunto de palavras e o contexto de usuário necessário.
3. O Learning retorna um resultado para cada palavra, sem expor suas entidades internas ou seu histórico completo.
4. O Reader associa os resultados às palavras e decide como renderizar o conteúdo.
A consulta em lote é preferida para evitar uma chamada separada para cada palavra. O contrato concreto ainda deverá definir a forma de identificação das palavras, os tipos de retorno e o tratamento de falhas.

3.1.2. **Dados conceituais retornados**

Para cada palavra, o resultado precisa permitir distinguir:
- Campo conceitual	Significado
- Estado de aprendizagem	NOT_STUDIED, AWAITING_FIRST_REVIEW ou REVIEWED
- Grau de conhecimento	Valor fornecido pelo Learning quando disponível; caso contrário, ausência explícita

O Reader não precisa receber datas de revisão, histórico detalhado ou estatísticas para a funcionalidade atual. Esses dados só deverão ser adicionados ao contrato se uma funcionalidade concreta passar a exigi-los.

## 4. Questões pendentes

- Definir o contrato de consulta em lote do estado de aprendizagem para o Reader.
- Definir a métrica e o limiar usados pela decisão automática de furigana.
- Definir como a preferência manual será identificada por usuário e por palavra.
- Definir persistência, erros e atualização dos dados consultados.
- Especificar os contratos de execução e de resultado do Processing.

## 5. Evolução

Esta divisão é uma proposta inicial para o MVP. Novos módulos ou subdivisões deverão ser introduzidos somente quando houver responsabilidades distintas que justifiquem a separação.


