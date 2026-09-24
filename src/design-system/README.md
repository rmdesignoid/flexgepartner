# Flexge Design System

Esta pasta é a fonte de verdade dos componentes core reutilizáveis.

## Convenções

- Use tokens semânticos (`--ds-*`) em vez de cores ou espaçamentos locais.
- Badges são sempre totalmente arredondados com `--ds-radius-full`.
- Campos devem cobrir os estados default, hover, focus, filled, disabled e invalid.
- Toda variante visual deve ser representada por uma prop explícita.
- Todo componente novo precisa de story para estados padrão, interação, disabled/error quando aplicável e tema escuro.
- Componentes específicos de calendário, estudantes ou recursos devem ficar fora do núcleo e compor estes primitivos.

## Comandos

- `npm run storybook`: abrir a documentação local.
- `npm run build-storybook`: gerar a versão estática.
