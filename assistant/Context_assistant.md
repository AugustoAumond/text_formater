# Contexto de desenvolvimento

## Estado inicial

- O projeto foi limpo em 31/08/2026.
- Todo o conteúdo do template Vite, incluindo as dependências instaladas, foi removido.
- A estrutura de desenvolvimento começa a partir desta pasta.

## Registro de alterações

- 31/08/2026 — Criado este arquivo para centralizar decisões, requisitos e o histórico do desenvolvimento.
- 31/08/2026 — Inicializada a aplicação Vite com React 19 e TypeScript.
- 31/08/2026 — Definida a aplicação de substituição de identificadores numéricos delimitados por #.
- A regra transforma todas as ocorrências exatas de #De e #De# em #Para#, sem alterar identificadores parciais como #10 quando De é 1.
- 31/08/2026 — A aplicação foi ampliada para múltiplas regras De → Para, adicionadas e removidas dinamicamente.
- A transformação analisa somente o texto de entrada em uma passagem: preserva #número# já processado, evita cascatas e rejeita valores De duplicados.
- 31/08/2026 — Identificadores com zeros à esquerda são normalizados na busca: regras para 2 e 3 também alcançam #02 e #03.
- 31/08/2026 — Após as substituições, seções iniciadas por uma tag isolada em uma linha são reordenadas em ordem numérica pelo identificador final.
- 31/08/2026 — Adicionado botão com ícone para copiar o texto resultante para a área de transferência.
- 31/08/2026 — O preview passou a destacar cada tag alterada; ao passar o mouse sobre ela, a interface informa a regra De → Para aplicada.
