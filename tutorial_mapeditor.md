# Tutorial: Editor de Níveis — Tiled Map Editor

Este tutorial ensina como editar os níveis do jogo **BioQuest Fase 3** usando o Tiled Map Editor. O jogo possui dois mapas:

- `assets/tilemaps/phase1.json` — Fase 1: chuva ácida (largura: 2100px)
- `assets/tilemaps/phase2.json` — Fase 2: pulmão (largura: 2400px)

---

## 1. Instalação do Tiled

1. Acesse [mapeditor.org](https://www.mapeditor.org) e baixe a versão mais recente (gratuita).
2. Instale normalmente e abra o programa.

---

## 2. Abrindo um Mapa

1. No Tiled, vá em **File > Open** (ou pressione `Ctrl+O`).
2. Navegue até a pasta do projeto e abra `assets/tilemaps/phase1.json` ou `phase2.json`.
3. O que você verá na tela:
   - **Retângulos cinzas** = plataformas e chão do nível.
   - **Pontos ou retângulos coloridos** = pontos de spawn (jogador, inimigos, coletáveis, saída).

> Nota: estes mapas usam apenas **camadas de objetos** (object layers), sem tiles visuais. O Tiled vai exibir os objetos sobre um fundo vazio — isso é normal.

---

## 3. Interface do Tiled

### Painel de Camadas (Layers) — lado direito

Cada mapa possui as seguintes camadas:

| Camada | O que contém |
|---|---|
| `platforms` | Retângulos de chão e plataformas |
| `spawns` | Posição do jogador, saída, inimigos e célula |
| `atp` | Coletáveis de ATP (apenas Fase 1) |

Clique no nome de uma camada para selecioná-la antes de editar seus objetos.

### Painel de Propriedades (Properties) — parte inferior ou lateral

Quando você seleciona um objeto, as propriedades aparecem aqui:
- **x, y** — posição em pixels no mundo do jogo.
- **width, height** — tamanho do objeto.
- **Name** — nome do objeto (ex: `player_start`, `atp`).
- **Type** — tipo do objeto (ex: `ground`, `platform`).

### Ferramentas principais

| Tecla | Ferramenta |
|---|---|
| `S` | Seleção de objetos (Select Objects) |
| `R` | Desenhar retângulo (Rectangle Tool) |
| `Delete` | Apagar objeto selecionado |

---

## 4. Editando Plataformas

1. No painel de camadas, clique na camada **`platforms`**.
2. Pressione `S` para ativar a ferramenta de seleção.
3. Clique em um retângulo no mapa para selecioná-lo.
4. **Mover:** clique e arraste o retângulo para a posição desejada.
5. **Redimensionar:** arraste as alças nos cantos e bordas do retângulo.
6. **Posição exata:** no painel de Propriedades, edite os campos `x`, `y`, `width` e `height` diretamente digitando os valores.

### Campo `Type` — qual usar?

| Valor | Uso |
|---|---|
| `ground` | Chão contínuo do nível (base do mapa) |
| `platform` | Plataforma elevada onde o jogador pode pular |

Para alterar o tipo, selecione o objeto, localize o campo **Type** no painel de Propriedades e edite o texto.

---

## 5. Adicionando uma Nova Plataforma

1. Selecione a camada **`platforms`** no painel de camadas.
2. Pressione `R` para ativar a ferramenta de retângulo.
3. Clique e arraste no mapa para desenhar o retângulo no tamanho desejado.
4. Após desenhar, pressione `S` para voltar à seleção e clique no novo objeto.
5. No painel de Propriedades:
   - Defina o **Name** como desejar (opcional, mas recomendado para organização).
   - Defina o **Type** como `platform` (ou `ground` se for chão).
   - Ajuste **x**, **y**, **width** e **height** conforme necessário.

**Exemplo de plataforma elevada:**
- `x`: 400, `y`: 380, `width`: 200, `height`: 20, `type`: `platform`

**Exemplo de chão:**
- `x`: 0, `y`: 490, `width`: 2100, `height`: 40, `type`: `ground`

---

## 6. Removendo uma Plataforma

1. Selecione a camada **`platforms`**.
2. Pressione `S` e clique no objeto que deseja remover.
3. Pressione `Delete`.

---

## 7. Movendo Pontos de Spawn

Os pontos de spawn definem onde objetos e personagens aparecem no jogo.

1. Selecione a camada **`spawns`** no painel de camadas.
2. Pressione `S` e clique no ponto de spawn que deseja mover.
3. Arraste-o para a nova posição, ou edite os campos **x** e **y** no painel de Propriedades para posicionamento preciso.

> As coordenadas do Tiled correspondem diretamente às coordenadas em pixels do mundo do jogo. O que você vê no Tiled é exatamente o que aparece no jogo.

### Objetos de spawn disponíveis

| Name | Descrição |
|---|---|
| `player_start` | Posição inicial do jogador |
| `exit_pipe` | Saída da fase (Fase 1) |
| `cell` | Célula a ser alcançada (Fase 2) |
| `neutro_spawn` | Ponto de aparecimento do neutrófilo (inimigo) |
| `macro_spawn` | Ponto de aparecimento do macrófago (inimigo) |

---

## 8. Adicionando e Movendo ATP (Fase 1)

O ATP é o coletável da Fase 1. Os objetos ficam na camada **`atp`**.

### Mover um ATP existente

1. Selecione a camada **`atp`**.
2. Pressione `S`, clique no objeto e arraste para a nova posição.

### Adicionar um novo ATP

1. Selecione a camada **`atp`**.
2. Pressione `R` e desenhe um pequeno retângulo (recomendado: 28x28 pixels).
3. Selecione o objeto com `S`.
4. No painel de Propriedades, defina:
   - **Name**: `atp` (obrigatório — o jogo lê exatamente esse nome).
   - **x** e **y**: posição desejada.

> Dica: posicione os ATPs 20 a 30 pixels acima das plataformas para parecerem "flutuando". Se a plataforma está em `y: 380`, coloque o ATP em `y: 350`.

---

## 9. Salvando e Testando

1. Salve o mapa com **File > Save** ou `Ctrl+S`.
   - O arquivo JSON original será sobrescrito automaticamente.
2. Abra o navegador em `http://localhost:3000`.
3. Pressione `F5` para recarregar a página.
4. As alterações aparecem imediatamente — não é necessário reiniciar o servidor.

> Para iniciar o servidor de desenvolvimento, execute `npm run dev` no terminal dentro da pasta do projeto.

---

## 10. Coordenadas de Referência

Use estes valores como guia ao posicionar objetos:

| Referência | Valor |
|---|---|
| Largura da tela | 960px |
| Altura da tela | 560px |
| Y do chão (ground) | 490px |
| Altura típica do chão | 40px |
| Faixa útil para plataformas (y) | 300px a 450px |
| Largura do mundo — Fase 1 | 2100px |
| Largura do mundo — Fase 2 | 2400px |
| Exit pipe (Fase 1) — posição aproximada | x: 1900px |
| Célula (Fase 2) — posição aproximada | x: 1850px |

---

## 11. Dicas de Design de Nível

- **Lacunas entre plataformas:** não faça gaps maiores que ~160px horizontais, pois esse é o alcance máximo do pulo do jogador.
- **ATP acima das plataformas:** posicione em `y = plataforma.y - 30` para aparecerem flutuando logo acima.
- **Patrulha do neutrófilo:** por padrão, o inimigo patrulha entre `x=650` e `x=1100`. Esse intervalo pode ser ajustado em `Neutrophil.js` caso precise de um alcance diferente.
- **Exit pipe (Fase 1):** mantenha próximo de `x=1900` para dar ao jogador um objetivo claro no final da fase.
- **Célula (Fase 2):** mantenha próxima de `x=1850`.
- **Chão contínuo:** certifique-se de que os objetos `ground` cobrem toda a largura do mundo sem lacunas, senão o jogador pode cair fora do mapa.

---

## 12. Problemas Comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Plataforma sumiu no jogo" | Objeto na camada errada | Verifique se o objeto está na camada `platforms` |
| "Player cai no infinito" | Lacuna no chão | Estenda o objeto `ground` ou adicione uma plataforma como "ponte" |
| "ATP não aparece" | Nome incorreto ou camada errada | Confirme que o objeto está na camada `atp` e que o **Name** é exatamente `atp` |
| "Spawn no lugar errado" | Objeto `spawns` deslocado | Selecione a camada `spawns` e ajuste o objeto correto |
| "Coordenadas parecem erradas" | Origem diferente esperada | O Tiled usa origem no canto superior esquerdo — igual ao sistema de coordenadas do jogo |
| "Alteração não apareceu no jogo" | Arquivo não salvo | Salve com `Ctrl+S` no Tiled antes de recarregar o navegador |

---

## Referência Rápida — Camadas e Objetos

### Camadas

| Nome da camada | Tipo | Presente em |
|---|---|---|
| `platforms` | Object Layer | Fase 1 e Fase 2 |
| `spawns` | Object Layer | Fase 1 e Fase 2 |
| `atp` | Object Layer | Fase 1 apenas |

### Objetos — camada `platforms`

| Type | Uso |
|---|---|
| `ground` | Chão base do nível |
| `platform` | Plataforma elevada |

### Objetos — camada `spawns`

| Name | Uso |
|---|---|
| `player_start` | Posição inicial do jogador |
| `exit_pipe` | Saída da fase (Fase 1) |
| `cell` | Alvo principal (Fase 2) |
| `neutro_spawn` | Spawn do neutrófilo |
| `macro_spawn` | Spawn do macrófago |

### Objetos — camada `atp`

| Name | Uso |
|---|---|
| `atp` | Coletável de ATP (Fase 1) |

### Atalhos do Tiled

| Tecla | Ação |
|---|---|
| `S` | Ferramenta de seleção |
| `R` | Desenhar retângulo |
| `Delete` | Apagar objeto selecionado |
| `Ctrl+S` | Salvar |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` | Refazer |
| Scroll do mouse | Zoom in/out |
| Clique do meio + arraste | Mover a visão do mapa |
