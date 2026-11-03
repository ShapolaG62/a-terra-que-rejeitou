# A Terra que Rejeitou

Soulslike de plataforma 2D em pixel art, feito em HTML, CSS e JavaScript puro (sem bibliotecas nem engine).
Um espírito sem forma atravessa os biomas do Brasil — Amazônia, Cerrado, Gruta dos Antigos, Pantanal, Caatinga e
Mata Atlântica — enfrentando guardiões corrompidos das lendas: Mapinguari, Capelobo, Boitatá, Pai do Mato, Labatut e Corpo-seco.

## Como jogar

```bash
node server.js
```

Depois abra http://localhost:5179 no navegador. Funciona no computador (teclado, mouse ou controle) e no celular (botões na tela).

Ao abrir, os dois vídeos de `assets/videos/` tocam em sequência a 1,5× antes do menu. Se o navegador bloquear o início com som, use **Iniciar jogo**. Para ir direto ao menu, use **Pular abertura**, **Esc** ou **B** no controle.

As músicas de `assets/audio/` tocam conforme o momento: **Trilha da Jornada** no menu principal, **Música tema** na exploração, **batalha com boss** nas lutas e **após vencer boss** nas cenas de vitória. A opção **Som** no menu de pausa controla as trilhas e os efeitos.

## Estrutura

| Arquivo | Para que serve |
|---|---|
| `index.html` | página, interface (barras, menus, diálogos, botões de toque) e estilos |
| `js/core.js`, `assets/audio/` | controles, efeitos sonoros, trilhas em MP3 e save no navegador |
| `js/intro.js`, `assets/videos/` | vídeos da abertura e reprodução antes do menu |
| `js/textos.js` | textos da história |
| `js/itens.js` | runas, ferramentas e partes dos baús; inventário |
| `js/art.js` | fundos dos biomas e desenho/animação dos personagens |
| `js/tiles.js` | chão, plataformas, troncos, espinhos e cipós |
| `js/fauna.js` | bichos corrompidos |
| `js/world.js` | física, jogador, inimigos, combate, água, calor |
| `js/bosses.js`, `js/beasts.js` | comportamento e desenho dos chefes |
| `js/story.js` | roteiro, fases, diálogos, menus e laço principal |
| `js/gruta.js` | Gruta dos Antigos: escuridão, ruído, pinturas, Boitatá, Olho de Fogo Frio, selos e viagem |
| `server.js` | servidor local mínimo |
| `tools/` | ferramentas de apoio (não fazem parte do jogo) |

Mundo fictício, inspirado nos biomas e nos povos do Brasil. As criaturas vêm de lendas contadas pelo país;
o pacto, a Lei antiga e os ecos são criações do jogo.
