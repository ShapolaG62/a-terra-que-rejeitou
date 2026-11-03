'use strict';
// Todos os textos dos elementos de cenário, por identificador. Edite aqui sem mexer na lógica.

// Ecos do Corpo-seco (lidos uma vez; ficam no diário)
const ECHOES = {
  pegadas: { t: 'Pegadas sem sombra', x: 'Pegadas fundas no barro. Quem passou aqui não deixou sombra. Ninguém sabe de quem são.' },
  machado: { t: 'Machado no toco', x: 'Um machado muito antigo, cravado num toco queimado. O cabo já apodreceu, mas o ferro continua ali. Alguém veio buscar madeira e nunca parou.' },
  lanterna: { t: 'A lanterna apagada', x: 'Uma lanterna de vidro rachado, apagada. As marcas de queimada seguem sempre o mesmo caminho, em linha reta, como quem abre estrada.' },
  escritura: { t: 'A escritura rasgada', x: 'Um papel antigo com selo de cera: uma escritura de terras. Tem um nome escrito, mas a água apagou as letras. Pela primeira vez você pensa: ele tinha um nome.' },
  poco: { t: 'O poço, a cruz e a cuia', x: 'Um poço seco. Ao lado, uma cruz simples de galhos. E uma cuia deixada na borda, como se alguém quisesse que outro bebesse. Um gesto de bondade. Ele poderia ter escolhido diferente.' },
  engenho: { t: 'A casa de engenho', x: 'Nas ruínas do engenho, por fragmentos, você vê o momento da escolha: a cuia ou o ouro. Ele jogou a cuia no chão.' },
};
const ECHO_ORDER = ['pegadas', 'machado', 'lanterna', 'escritura', 'poco', 'engenho'];

// Nomes das áreas mostrados na entrada da arena
const AREAS = {
  amazonia: 'Clareira do Mapinguari', cerrado: 'Chapada em Chamas', pantanal: 'Baía do Pai do Mato',
  caatinga: 'Fim do Mundo', mata: 'Ruínas do Engenho', prologo: 'Clareira do Guardião',
};

// Frases ao descansar na fogueira
const REST_LINES = ['As histórias aquecem mais que o fogo.', 'Alguém, em algum lugar, ainda conta a sua história.', 'O fogo lembra por você.', 'Descanse. A mata espera.'];

// Lenda e invenção (diário)
const NOTES = [
  ['A ferida da mata', 'No mundo do jogo, as histórias mantêm os guardiões ligados aos lugares e às pessoas. O Corpo-seco cala essas vozes; os guardiões perdem suas lembranças e começam a ferir quem protegiam. O espírito pode aprender formas emprestadas com quem encontra pelo caminho.'],
  ['A margem de Lia', 'Davi, Lia, Nina, a passarela e a cheia são personagens e acontecimentos fictícios deste jogo. Não representam uma comunidade ou uma tradição indígena específica.'],
  ['Pessoas da jornada', 'Cecília, Bento, Rosa e Celina, suas lembranças e seus gestos cotidianos são criações do jogo. Os encontros não reproduzem práticas ou histórias de um povo específico.'],
  ['Mapinguari', 'Lenda da Amazônia: gigante peludo de um olho só, com boca na barriga e cheiro forte. A ligação dele com a memória é invenção do jogo.'],
  ['Capelobo', 'Lenda contada no Maranhão e no Pará: criatura de focinho comprido que ataca à noite. A arena em chamas é invenção do jogo.'],
  ['Pai do Mato', 'Protetor dos bichos e da mata em várias tradições do interior. O teste do pacto é invenção do jogo.'],
  ['Labatut', 'Lenda do sertão do Ceará: gigante cabeludo e faminto, de presas grandes. As fontes são escassas e variam; a seca como mecânica e a memória perdida são invenção do jogo.'],
  ['Corpo-seco', 'Lenda de origem colonial: o homem tão ruim que a terra não quis receber. O arrependimento é invenção do jogo.'],
  ['O pacto', 'O pacto, a Lei antiga, os ecos e o Espírito da Mata são criações do jogo. Os povos aqui são inspirados nos povos de cada bioma, sem retratar nenhum em particular.'],
];
