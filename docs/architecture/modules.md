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

**Responsabilidade:** gerenciar o estado de aprendizagem do usuário e o histórico de revisões.

O Learning concentra as regras relacionadas ao acompanhamento da aprendizagem, incluindo o estado atual de cada item aprendido, o registro das revisões e o cálculo dos próximos momentos de revisão por meio de uma estratégia de repetição espaçada (SRS).

O módulo deve permitir que a estratégia de repetição espaçada seja substituída sem exigir mudanças desnecessárias nos demais módulos.

**Limite:** os outros módulos devem interagir com Learning por meio de uma interface explícita, sem acessar diretamente suas implementações internas.

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

Para cada palavra, o Reader resolve a exibição de furigana nesta ordem:

1. Se a preferência manual for `SHOW`, exibe furigana.
2. Se a preferência manual for `HIDE`, oculta furigana.
3. Se a preferência for `AUTO` ou não estiver definida, consulta o estado de aprendizagem no Learning.
4. Se o estado de aprendizagem atingir ou ultrapassar o limiar definido, oculta furigana; caso contrário, exibe furigana.

O limiar e a métrica que determinam o nível de aprendizagem ainda precisam ser especificados. A implementação também deverá evitar consultas individuais desnecessárias para cada palavra, podendo consultar em lote as informações de um trecho.

## 4. Questões pendentes

- Definir o contrato de consulta em lote do estado de aprendizagem para o Reader.
- Definir a métrica e o limiar usados pela decisão automática de furigana.
- Definir como a preferência manual será identificada por usuário e por palavra.
- Definir persistência, erros e atualização dos dados consultados.
- Especificar os contratos de execução e de resultado do Processing.

## 5. Evolução

Esta divisão é uma proposta inicial para o MVP. Novos módulos ou subdivisões deverão ser introduzidos somente quando houver responsabilidades distintas que justifiquem a separação.


