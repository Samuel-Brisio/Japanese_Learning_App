# Módulos do Sistema

**Versão:** 0.1  
**Status:** Proposta inicial

## 1. Objetivo

Este documento descreve os módulos funcionais do sistema, suas responsabilidades e seus limites. O objetivo é estabelecer uma visão geral da arquitetura antes de definir os detalhes de implementação.

O sistema será organizado como um monólito modular, no qual cada módulo representa uma área funcional e mantém suas responsabilidades separadas das demais.

## 2. Módulos

### 2.1. Reader

**Responsabilidade:** gerenciar as funcionalidades relacionadas à experiência de leitura do usuário.

O Reader é responsável pela interação com o conteúdo durante a leitura. Quando necessário, ele utiliza interfaces disponibilizadas por outros módulos para acessar funcionalidades complementares.

O Reader não deve conhecer os detalhes internos do estado de aprendizagem do usuário nem implementar diretamente as regras de aprendizagem.

**Limite:** sua responsabilidade está relacionada à experiência de leitura, e não à gestão das regras de aprendizagem.

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

## 3. Comunicação entre módulos

Os módulos devem interagir por meio de interfaces explícitas, evitando dependências desnecessárias sobre suas estruturas internas.

- **Reader → Learning:** o Reader solicita operações relacionadas à aprendizagem quando necessário, sem conhecer a implementação interna do Learning.
- **Processing → demais módulos:** eventuais integrações dependerão dos requisitos das tarefas processadas e ainda precisam ser definidas.

A comunicação entre módulos não implica a necessidade de serviços separados ou comunicação por rede. Como o sistema será inicialmente um monólito modular, as interfaces poderão ser utilizadas dentro da própria aplicação.
