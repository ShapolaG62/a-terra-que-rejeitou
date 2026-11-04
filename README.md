# A Terra que Rejeitou

Soulslike de plataforma 2D em pixel art, feito em HTML, CSS e JavaScript puro (sem bibliotecas nem engine).
Um espírito sem forma atravessa os biomas do Brasil — Amazônia, Cerrado, Pantanal, Caatinga e
Mata Atlântica — enfrentando guardiões corrompidos das lendas: Mapinguari, Capelobo, Boitatá, Pai do Mato, Labatut e Corpo-seco.

## Como jogar

```bash
node server.js
```

Depois abra http://localhost:5179 no navegador. Funciona no computador (teclado, mouse ou controle) e no celular (botões na tela).

Ao abrir, os dois vídeos de `assets/videos/` tocam em sequência a 1,5× antes do menu. Se o navegador bloquear o início com som, use **Iniciar jogo**. Para ir direto ao menu, use **Pular abertura**, **Esc** ou **B** no controle.

As músicas de `assets/audio/` tocam conforme o momento: **Trilha da Jornada** no menu principal, **Música tema** na exploração, **batalha com boss** nas lutas e **após vencer boss** nas cenas de vitória. A opção **Som** no menu de pausa controla as trilhas e os efeitos.

Para experimentar os ataques e as duas fases do Mapinguari sem percorrer a história, abra http://localhost:5179/tools/preview-mapinguari.html com o servidor em execução. Essa prévia permite escolher os golpes e pausar a animação, sem gravar o progresso do jogo.

Os efeitos usam texturas de madeira, terra, folhas, sopros e percussão. Passos, impactos e ataques alternam versões sem repetir a anterior. Para ouvir cada efeito ou comparar repetições com **Ouvir sequência**, abra http://localhost:5179/tools/preview-audio.html.

O prólogo e a Amazônia têm um primeiro capítulo de convivência: Davi, Lia e Nina; uma passarela que pode ser consertada com Lia; uma conversa junto à fogueira com três respostas; e a marca do Mapinguari na madeira. A conversa deixa uma lembrança no inventário e no diário. Depois da luta, o espírito retorna à margem, onde as pessoas e o cenário reagem à escolha de poupar ou purificar. No fim da conversa, **Seguir para o Cerrado** inicia a próxima fase. Quem escolher **Ficar mais um pouco** pode usar **E** na placa **Cerrado**, à direita da fogueira. Saves de uma vitória já concluída também oferecem a continuação ao carregar.

Vento, água próxima e pássaros espaçados acompanham esses trechos; a música baixa junto ao fogo e na aproximação do guardião. O volume de efeitos também controla a ambiência. Os saves existentes continuam funcionando; cenas já concluídas e as consequências ficam salvas.

Os encontros continuam no Cerrado com Cecília e o marco da trilha, no Pantanal com Bento e uma canoa que volta à água, na Caatinga com Rosa e uma sombra que pode ser ampliada, e na Mata Atlântica com Celina e uma semente que cresce durante o jogo. As conversas deixam lembranças sem bônus de combate. Há reencontros após Capelobo, Pai do Mato e Labatut, com reações às decisões e saídas para a próxima região. A muda de Celina e os outros gestos são lembrados no coração da mata.

As cutscenes terminam com a posição e a passada do personagem alinhadas à fase jogável. O cenário se dissolve no mesmo lugar, sem uma segunda tela deslizando lateralmente. Pular uma viagem acelera sua conclusão e usa a mesma chegada. A prévia inclui todas as fronteiras, inclusive Cerrado → Pantanal.

A Gruta dos Antigos fica dentro do Cerrado. Depois do marco de Cecília há uma abertura na pedra: chegue perto e aperte **E** para descer pela corda. Use **E** junto à corda lá dentro para subir de volta ao mesmo ponto. A descida e a subida têm uma animação própria, sem mudar de ato. Pinturas, Boitatá e fogo frio continuam nesse interior; depois de libertar Boitatá e concluir o reencontro com Cecília, a saída do Cerrado leva ao Pantanal. A prévia tem botões para testar a entrada e a volta.

O Capelobo aparece na arena ao fim do Cerrado, mesmo depois de uma visita à gruta. Na exploração temporária, escolher uma fase também permite testar seu guardião novamente, mantendo o progresso salvo protegido. Para testar diretamente, use **Luta do Capelobo** na prévia.

As animações dos personagens incorporam a versão da pasta `a-terra-que-rejeitou-main0`: respiração, inclinação na corrida, alongamento no salto e rastros no dash. São efeitos visuais; a colisão e a duração da invulnerabilidade continuam iguais.

O cenário usa as texturas clássicas de pixel art, com pixels inteiros, contornos marcados e dithering visível na terra, pedras, folhas, raízes e céu. A resolução de renderização continua em 864×486, com ampliação sem filtro de desfoque para manter a nitidez. O campo de visão, a física, as colisões e as animações mantêm as mesmas medidas. As peças são reutilizadas em cache. Verificação das texturas, recortes e capturas: `node --test tools/test-rendering.js`.

Fogueiras, tochas, relíquias e pontos de luz têm um brilho difuso que perde força gradualmente, sem a borda de um disco colorido. Os sprites e materiais continuam pixelados.

Os mobs observam, se aproximam e anunciam os ataques antes de executar o golpe. Patrulhas, recuos, investidas e recuperações variam por espécie e indivíduo, com poses intermediárias nas patas, asas, cabeça e cauda. Na gruta, o som continua atraindo lacraias; morcegos avisam antes de mergulhar, sapos preparam o salto e a língua, e besouros expõem o casco ao virar. Para experimentar um mob ou um grupo, abra http://localhost:5179/tools/preview-mobs.html. A prévia permite pausar os movimentos, mudar de ambiente e proteger o jogador, sem ler ou gravar o progresso do jogo.

Para testar esse capítulo e os dois retornos sem alterar seu progresso, abra http://localhost:5179/tools/preview-journey.html. A ferramenta permite reabrir o estado salvo do teste, apenas na memória. Verificações: `node --test tools/test-dash.js tools/test-music.js tools/test-mapinguari.js tools/test-sfx.js tools/test-journey.js`.

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
| `js/journey.js` | convivência na margem, passarela, escolhas da fogueira, retorno do Mapinguari e ambiência |
| `js/companions.js` | encontros de Cecília, Bento, Rosa e Celina; gestos que mudam o cenário, lembranças e reencontros |
| `js/vfx.js`, `js/pixelfx.bundle.js`, `vendor/pixelfx/` | efeitos visuais (biblioteca pixelfx e os efeitos próprios em `src/fx/terra`); recrie o bundle com `node tools/build-vfx.mjs` |
| `js/gruta.js` | Gruta dos Antigos: escuridão, ruído, pinturas, Boitatá, Olho de Fogo Frio, selos e viagem |
| `server.js` | servidor local mínimo |
| `tools/` | ferramentas de apoio (não fazem parte do jogo) |

Mundo fictício, inspirado nos biomas e nos povos do Brasil. As criaturas vêm de lendas contadas pelo país;
o pacto, a Lei antiga e os ecos são criações do jogo.
