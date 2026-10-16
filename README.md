# Artefatos do Projeto — Japanese Learning Assistant

Este índice aponta para os documentos de referência do MVP. Os artefatos distinguem decisões aceitas de detalhes ainda pendentes; os exemplos de API são propostas até serem formalizados como schemas executáveis.

## Documentos

- [`Modules.md`](Modules.md) — responsabilidades, limites e contratos conceituais entre Account, Reader, Learning e Processing.
- [`Architectures.md`](Architectures.md) — decisões arquiteturais (ADRs), stack, princípios e justificativas.
- [`DataModel.md`](DataModel.md) — tabelas, campos, cardinalidades, constraints, índices e idempotência.
- [`CommunicationContract.md`](CommunicationContract.md) — payloads, resultados, estados, retries, erros e publicação.
- [`ImplementationPlan.md`](ImplementationPlan.md) — escopo do MVP, sequência de implementação, checklist e decisões adiadas.

## Fonte de verdade por assunto

| Assunto | Documento principal |
|---|---|
| Responsabilidade de módulo | `Modules.md` |
| Decisão e justificativa arquitetural | `Architectures.md` |
| Tabelas e relacionamentos | `DataModel.md` |
| Contrato de comunicação e publicação | `CommunicationContract.md` |
| Próximas tarefas e progresso | `ImplementationPlan.md` |

Quando houver divergência, atualizar o documento proprietário do assunto e os demais documentos afetados na mesma revisão. Evitar copiar grandes trechos de um documento para outro; usar referências cruzadas.
