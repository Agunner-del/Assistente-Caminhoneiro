## Verificações

* Revisar os arquivos atuais para garantir que o botão duplicado foi removido e que o modal novo existe.

* Confirmado: `ActionModalButton.tsx` existe e abre opções de Câmera/Galeria/Gravar Áudio.

* Confirmado: `AIInputButton.tsx` usa `forwardRef(start/stop)` e exibe um FAB próprio.

* Detectado: `Dashboard.tsx` renderiza ambos (modal + FAB de microfone). Há import não usado de `ImageUploadButton`.

## Mudanças Propostas (sem criar novas pastas)

* Atualizar `AIInputButton.tsx` para suportar `showButton?: boolean` (padrão `true`) e ocultar o FAB quando `false`, mantendo funcionalidade de gravação e transcrição.

* Atualizar `Dashboard.tsx` para:

  * Montar `AIInputButton` com `showButton={false}` (apenas controlador da gravação via modal).

  * Manter apenas `ActionModalButton` como único FAB visível.

  * Remover import de `ImageUploadButton` (não é usado).

* Garantir posicionamento e z-index corretos (`bottom: 96px`) para não sobrepor a BottomNavigation.

## Testes e Validação

* Rodar `npm run check` para validar TypeScript.

* Abrir preview em `http://localhost:5174/` e testar:

  * Clicar no FAB → abrir modal → acionar “Gravar áudio” e ver feedback de gravação (sem FAB extra de microfone na tela).

  * Testar câmera/galeria e confirmação de imagem.

* Verificar que não há sobreposição ou elementos duplicados.

## Commit e Push

* Mensagem de commit: "feat(ui): único FAB com modal; oculta FAB do AIInputButton"

* Push para `main` do re

