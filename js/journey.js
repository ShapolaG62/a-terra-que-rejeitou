'use strict';
// Um lugar para conhecer e ao qual voltar. O capítulo usa o save normal, inclusive nas revisitas.
function journeyState() {
  const s = G.save;
  if (!s.journey || typeof s.journey !== 'object' || Array.isArray(s.journey)) s.journey = {};
  return s.journey;
}
function journeyOutcome() { return G.save.harmony && G.save.harmony.mapinguari; }
function journeyNPC(id) { return G.lvl.npcs.find(n => n.id === id); }
function journeyNeedsReturn() { return G.save.act === 1 && !!journeyOutcome() && !journeyState().returned; }
function journeyDeparturePending() { return G.save.act === 1 && !!journeyOutcome() && !!journeyState().returned && !journeyState().stayAtMargin; }
function journeyCanContinue() { return journeyDeparturePending() && G.lvl.id === 'amazonia' && !G.boss && !G.journeyDeparting; }
function journeyExitLocation(level = G.lvl) {
  const x = 490;
  let y = level.solids.filter(s => !s.wall && x >= s.x && x <= s.x + s.w).reduce((floor, s) => Math.min(floor, s.y), GY);
  for (const r of level.ramps) if (x >= Math.min(r.x0, r.x1) && x <= Math.max(r.x0, r.x1)) y = Math.min(y, r.y0 + (r.y1 - r.y0) * (x - r.x0) / (r.x1 - r.x0));
  return { x, y };
}

function configureJourney(level) {
  if (typeof configureCompanions === 'function') configureCompanions(level);
  if (level.id !== 'prologo' && level.id !== 'amazonia') return;
  const j = journeyState();
  if (level.id === 'prologo') {
    // O caçador continua sendo o primeiro NPC: ele também encerra o prólogo.
    const davi = level.npcs[0];
    davi.x = j.metDavi ? 1395 : 142;
    davi.talk = () => talk([['Davi', 'A trilha seca segue pela direita. Se ouvir meu assobio, sou eu.']]);
    level.pr('npcfire', 122).pr('journeyBasket', 155, GY);
    level.tr(96, async () => {
      if (journeyState().metDavi) return;
      if (AU.ctx && AU.on) { soundNote(1160, 0.16, 0.035, 0, 120, 0.025); soundNote(920, 0.2, 0.025, 0.23, -80, 0.025); }
      await talk([
        ['Davi', 'Opa. Quase apaguei você junto com as brasas. Achei que fosse um vagalume.'],
        ['Espírito', 'Você consegue me ver?'],
        ['Davi', 'Consigo. E você parece perdido. Sou Davi. Minha irmã Lia mora depois desta mata.'],
        ['Davi', 'Vou pela trilha seca levar as fibras dela. A gente se encontra adiante, Vagalume.'],
      ]);
      journeyState().metDavi = true; writeSave();
    });
    return;
  }

  const outcome = journeyOutcome(), repaired = !!(j.bridgeHelped || outcome);
  if (journeyNeedsReturn() || journeyDeparturePending()) G.save.fire = { lvl: 'amazonia', x: 441 };
  // Um braço raso do igarapé: dá para atravessar sem a tarefa, mas a passarela muda o chão de verdade.
  const base = level.solids.find(s => s.t === 'g' && s.x === 0 && s.w === 900);
  if (base) {
    base.w = 330;
    level.g(330, 378, GY + 10).g(378, 900);
  }
  level.spawns = level.spawns.filter(s => s.x >= 720);
  level.enemyMinX = 700;
  level.props = level.props.filter(p => p.kind !== 'malocas');
  level.pr('malocas', 146).pr('journeyBasket', 183, GY).pr('journeyPot', 459, GY);
  level.pr('journeyStream', 354, GY).pr('journeyBridge', 354, GY);
  level.pr('journeyShelter', 616, GY).pr('journeyTrace', 1900, GY);
  if (outcome) level.pr('journeyAftermath', 295, GY);
  if (outcome && G.save.act === 1) { const exit = journeyExitLocation(level); level.pr('journeyExit', exit.x, exit.y); }
  if (repaired) buildJourneyBridge(level);
  level.fires.find(f => f.id === 'a1').x = 441;
  level.echoAt.x = 862;
  const lia = level.npcs.find(n => n.id === 'mestra');
  Object.assign(lia, { x: repaired ? 412 : 307, f: repaired ? 1 : -1, anim: 'kneel', spec: npcSpec('zarabatana', { ...NPC.mestraA, weapon: null }), talk: journeyTalkLia });
  level.n({ id: 'nina', x: outcome === 'purificar' ? 430 : repaired ? 467 : 284, spec: NPC.nina, scale: 0.76, f: repaired ? -1 : 1, talk: journeyTalkNina, carry: !outcome });
  level.n({ id: 'davi', x: outcome ? 385 : 202, spec: npcSpec('zarabatana', { weapon: null }), anim: 'kneel', f: -1, talk: () => talk(outcome ? [['Davi', 'Amanhã vou buscar mais fibras. Esta passarela não se conserta sozinha.'], ['Davi', 'Se encontrar alguém perdido na trilha, guarda um lugar para ele também.']] : [['Davi', j.metDavi ? 'Lia riu quando contei do vagalume. Agora ela quer ver com os próprios olhos.' : 'Sou Davi. Você veio pela mata sozinho? Senta um pouco.'], ['Davi', 'Estou remendando este cesto. Nina acha que ele deve carregar água. Preciso resolver essa discussão.']]) });
  // Substitui a antiga aula automática por um encontro em que Lia já está fazendo alguma coisa.
  level.triggers = level.triggers.filter(t => t.x !== 110);
  level.tr(263, async () => {
    if (journeyState().metLia || journeyOutcome()) return;
    await journeyMeetLia();
  });
  level.tr(570, async () => {
    if (journeyState().shelterHint || journeyOutcome()) return;
    journeyState().shelterHint = true;
    hint('Há uma marca na madeira. <kbd>E</kbd> para olhar de perto.', 'Há uma marca na madeira. Use <b>Agir</b> para olhar.', 5);
  });
  level.tr(680, async () => {
    if (journeyState().trailHint || journeyOutcome()) return;
    journeyState().trailHint = true; writeSave();
    hint('<kbd>K</kbd> assopra um dardo · <kbd>U</kbd> solta três dardos envenenados · recupere o fôlego entre os ataques.', '<b>Tiro</b> assopra um dardo · <b>Especial</b> solta três dardos envenenados · descanse entre os ataques.', 7);
  });
  level.tr(1845, async () => {
    if (journeyState().approach || journeyOutcome()) return;
    journeyState().approach = true; writeSave();
    hint('Os pássaros se calaram. A casca à frente tem as mesmas marcas da margem.', 'Os pássaros se calaram. A casca à frente tem as mesmas marcas da margem.', 6);
  });
  if (outcome) level.arena.cleared = true;
  level.onStart = async () => {
    if (journeyNeedsReturn()) await journeyReturnConversation();
    else if (journeyDeparturePending()) await journeyOfferDeparture();
  };
}
function finishJourneyScenery(level) {
  if (typeof finishCompanionScenery === 'function') finishCompanionScenery(level);
  if (level.id !== 'amazonia') return;
  // Abre a vista para as mãos trabalhando e para a madeira marcada.
  level.canopies = level.canopies.filter(c => !(c.tx > 265 && c.tx < 525) && !(c.tx > 590 && c.tx < 645));
  level.hvines = level.hvines.filter(v => v.x < 260 || v.x > 650);
}
function buildJourneyBridge(level = G.lvl) {
  if (!level.solids.some(s => s.kind === 'journeyBridge')) level.solids.push({ x: 328, y: GY, w: 52, h: 4, t: 'p', kind: 'journeyBridge' });
}
async function journeyMeetLia() {
  const j = journeyState();
  if (j.metLia) return;
  await talk([
    ['Nina', 'Lia, é ele? O vagalume do Davi?'],
    ['Lia', 'Se for, cresceu. Sou Lia. Só não aperto sua mão porque esta ponta solta de novo.'],
    ['Nina', 'Minha cuia ficou do outro lado. Eu ia buscar água para o fogo.'],
    ['Lia', 'A cheia afrouxou a passarela. Pode segurar a ponta para mim? Depois tem lugar junto ao fogo.'],
  ]);
  j.metLia = true; writeSave();
  hint('<kbd>E</kbd> perto da ponta da passarela para ajudar Lia. Você também pode seguir a trilha.', 'Use <b>Agir</b> na ponta da passarela para ajudar Lia. Você também pode seguir a trilha.', 7);
}
async function journeyTalkLia() {
  const j = journeyState();
  if (journeyOutcome()) {
    if (journeyNeedsReturn()) return journeyReturnConversation();
    return talk([['Lia', j.campChoice === 'fear' ? 'Se o medo voltar na próxima trilha, não precisa caminhar com ele sozinho.' : 'O fogo continua aqui. Você já sabe onde fica.'], ['Lia', 'Davi vai ficar por perto. Pode seguir quando estiver pronto.']]);
  }
  if (!j.metLia) return journeyMeetLia();
  if (!j.bridgeHelped) return talk([['Lia', 'A ponta de cá, perto da água. Segure firme enquanto eu amarro.']]);
  if (!j.campShared) return journeyCamp();
  return talk([['Lia', 'Para soprar, primeiro solte os ombros. Você aprendeu com Davi a prender o ar; falta aprender a descansar.'], ['Lia', 'E saia de perto quando o Mapinguari soltar a nuvem verde. O cheiro derruba antes da pancada.']]);
}
async function journeyTalkNina() {
  const j = journeyState(), outcome = journeyOutcome();
  if (outcome === 'poupar') return talk([['Nina', 'Escuta. Voltou o passarinho que responde duas vezes.'], ['Nina', 'Guardei um lugar na margem para você também.']]);
  if (outcome) return talk([['Nina', 'Você volta depois?'], ['Espírito', 'Eu sei o caminho.']]);
  if (j.campShared) return talk([['Nina', 'Minha marca no tronco é a mais baixa. Ano que vem vai ficar lá em cima.']]);
  return talk([['Nina', j.bridgeHelped ? 'Trouxe a água sem derramar! Quase sem derramar.' : 'Davi disse que cesto não carrega água. Mas ele nem tentou.']]);
}
async function journeyHelpBridge() {
  const j = journeyState();
  if (j.bridgeHelped || journeyOutcome()) return;
  if (!j.metLia) await journeyMeetLia();
  const lia = journeyNPC('mestra'), nina = journeyNPC('nina');
  G.P.vx = 0; G.P.f = 1; G.P.kneel = true;
  await talk([['Lia', 'Isso. Não puxe ainda... agora.']]);
  await wait(0.65);
  buildJourneyBridge(); j.bridgeHelped = true; writeSave();
  if (AU.ctx && AU.on) soundWood(230, 0.45);
  await wait(0.35);
  G.P.kneel = false;
  lia.targetX = 412; lia.restAnim = 'kneel';
  nina.targetX = 467; nina.restAnim = 'idle';
  await waitUntil(() => nina.targetX == null && lia.targetX == null);
  await talk([['Nina', 'Não balançou! Vem ver!'], ['Lia', 'Agora ela vai testar a passarela o dia inteiro. Vem. A água já chegou ao fogo.']]);
  G.save.lit.a1 = 1; writeSave();
  hint('Lia e Nina esperam junto à fogueira. <kbd>E</kbd> para sentar.', 'Lia e Nina esperam junto à fogueira. Use <b>Agir</b> para sentar.', 6);
}
async function journeyCamp() {
  const j = journeyState();
  if (!j.bridgeHelped || j.campShared || journeyOutcome()) return;
  G.P.vx = 0; G.P.kneel = true; G.flags.journeyQuiet = true;
  try {
    await talk([
      ['Nina', 'Só derramei um pouquinho. O fogo também estava com sede.'],
      ['Lia', 'E eu quase queimei a comida esperando você. Estamos todos quites.'],
      ['Espírito', 'Faz tempo que alguém não guarda um lugar para mim.'],
    ]);
    const c = await choose('Lia afasta uma cuia e abre espaço junto às brasas.', [
      { label: '“Como era o Mapinguari antes?”' },
      { label: '“Estou com medo de não conseguir.”' },
      { label: 'Ficar em silêncio e escutar o igarapé.' },
    ], 'Lia');
    closeDialog();
    const key = ['memory', 'fear', 'silence'][c];
    if (key === 'memory') await talk([['Lia', 'Desajeitado. Na cheia, segurou um tronco para a água não levar nossa casa. Depois não sabia como soltar sem nos assustar.'], ['Nina', 'A mão dele ficou na madeira. Minha mãe mede minha altura bem do lado.']]);
    else if (key === 'fear') await talk([['Lia', 'Eu também tive medo de segurar a passarela. Só pedi outra mão.'], ['Lia', 'Se precisar parar, pare. Não vou chamar isso de fracasso.'], ['Nina', 'A gente guarda sua cuia.']]);
    else {
      await wait(1.8);
      await talk([['', 'A água passa entre as pedras. Lia mexe as brasas sem preencher o silêncio.'], ['Nina', 'Esse barulhinho é melhor daqui.']]);
    }
    await talk([['Lia', 'Leve este pedaço da fibra. O nó ficou torto, mas segurou.'], ['Lia', 'Se for pela trilha, olhe o tronco depois da curva. Antes de ter medo dele, é ali que eu lembro do Mapinguari.']]);
    j.campChoice = key; j.campShared = true;
    giveRelic('no_da_margem');
    G.save.fire = { lvl: 'amazonia', x: 441 }; G.save.lit.a1 = 1;
    G.P.hp = statMax().hp; G.P.st = statMax().st; G.P.flasks = statMax().flasks;
    writeSave(); SFX.rest(); showToast('Nó da margem', 'Uma lembrança de Lia e Nina · guardada no inventário', 3);
  } finally { G.P.kneel = false; G.flags.journeyQuiet = false; }
}
async function journeyShelter() {
  const j = journeyState();
  if (j.witnessedShelter) return talk([['', 'A marca enorme da mão. Ao lado, as pequenas medidas de Nina. A mesma madeira guarda as duas.']]);
  await talk([
    ['', 'Cinco sulcos fundos prendem uma viga ao tronco. A madeira cresceu por cima deles.'],
    ['', 'Ao lado há riscos menores. No mais recente, uma fibra vermelha e o nome: Nina.'],
    ['Espírito', j.campShared ? 'A mão que segurou a casa... Ela cresceu ao lado dela.' : 'Alguém cresceu medindo a própria altura ao lado desta mão.'],
  ]);
  j.witnessedShelter = true; writeSave(); SFX.echo();
}
function journeyInteractables(add) {
  if (typeof companionInteractables === 'function') companionInteractables(add);
  if (G.lvl.id !== 'amazonia') return;
  const j = journeyState(), outcome = journeyOutcome();
  if (!j.bridgeHelped && !outcome) add(325, GY, 'Segurar a ponta da passarela', () => scene(journeyHelpBridge));
  add(610, GY, 'Examinar a marca no tronco', () => scene(journeyShelter));
  if (outcome && G.save.act === 1 && j.returned && !G.journeyDeparting) {
    const exit = journeyExitLocation();
    add(exit.x, exit.y, 'Seguir para o Cerrado', () => scene(journeyContinueToCerrado));
  }
  if (G.P.x > 1840 && !outcome) add(1900, GY, 'Olhar a casca arrancada', () => scene(() => talk([['', 'A mesma largura dos sulcos na margem. Aqui, os dedos rasgaram a casca em vez de sustentar a madeira.']])));
}
function journeyFireAction(f) {
  const j = journeyState();
  return !!(G.lvl.id === 'amazonia' && f.id === 'a1' && j.bridgeHelped && !j.campShared && !journeyOutcome());
}
function updateJourney(dt) {
  if (!G.lvl || !G.P) return;
  if (typeof updateCompanions === 'function') updateCompanions(dt);
  if (G.lvl.id === 'prologo') {
    const d = G.lvl.npcs[0];
    if (d.x < 500 && G.P.x > 520) { d.x = 1395; d.f = -1; }
    return;
  }
  if (G.lvl.id !== 'amazonia') return;
  for (const n of G.lvl.npcs) {
    if (n.targetX != null) {
      const dx = n.targetX - n.x, step = dt * (n.id === 'nina' ? 58 : 42);
      if (Math.abs(dx) <= step) { n.x = n.targetX; n.targetX = null; n.anim = n.restAnim || 'idle'; }
      else { n.x += Math.sign(dx) * step; n.f = Math.sign(dx); n.anim = 'walk'; n.ph = (n.ph || 0) + dt * 9; }
    } else if (!G.lock && n.id === 'nina' && journeyOutcome() !== 'purificar' && (journeyState().bridgeHelped || journeyOutcome())) {
      // Água para a comida, um passeio curto e uma pausa; não é uma escolta em combate.
      n.routineT = (n.routineT || 0) + dt;
      if (n.routineT > 7) { n.routineT = 0; n.targetX = n.x > 451 ? 397 : 467; n.restAnim = 'idle'; }
    }
  }
}
async function journeyPrologueGift() {
  await talk([
    ['Davi', journeyState().metDavi ? 'Vagalume... Você voltou por mim.' : 'Você podia ter passado direto. Obrigado por voltar. Sou Davi.'],
    ['Espírito', 'Achei que ele fosse reconhecer você.'],
    ['Davi', 'Eu também. Lia precisa saber o que está acontecendo. Leva nosso jeito de andar na mata. Eu te mostro o sopro.'],
  ]);
  grantForm('zarabatana'); await wait(0.7);
  await talk([['Davi', 'Não encha o peito de uma vez. Devagar. Isso.'], ['Davi', 'Minha irmã fica na margem do igarapé, com Nina. Vou chegar depois, pela trilha seca. Diz que levei as fibras.']]);
  return nextAct();
}
function journeyBossIntro() {
  return [
    ['', journeyState().witnessedShelter ? 'Os mesmos dedos da marca no tronco se fecham contra o chão.' : 'A casca arrancada se prende aos dedos do guardião.'],
    ['Espírito', journeyState().campShared ? 'Lia me contou da cheia. Você segurou a casa. Você pode lembrar.' : 'Na margem, sua mão ainda segura a casa de alguém.'],
    ['Mapinguari', '...a água... não... leva...'],
  ];
}
async function journeyMapinguariDown(B) {
  let outcome = journeyOutcome();
  if (!outcome) {
    await talk([['Mapinguari', '...o tronco... não posso... soltar...'], ['Espírito', 'A água já baixou.']]);
    const c = await choose('A mão dele continua fechada, como se ainda sustentasse a casa.', [
      { label: 'Poupar', sub: 'ficar ao lado dele e lembrar da margem' },
      { label: 'Purificar', sub: 'arrancar a corrupção e tomar sua força (+8% de dano)' },
    ]);
    closeDialog();
    outcome = c === 0 ? 'poupar' : 'purificar';
    if (c === 0) {
      G.P.kneel = true;
      await talk([
        ['Espírito', journeyState().witnessedShelter ? 'Sua mão ficou marcada na madeira. Nina mede a altura bem ao lado.' : 'Tem uma criança crescendo na margem. A casa ainda está de pé.'],
        ['Mapinguari', '...cresceu...?'],
        ['', 'Um dedo se abre. Depois outro. Você espera o último soltar a terra.'],
      ]);
      G.P.kneel = false;
    } else {
      for (let i = 0; i < 35; i++) part(B.x + rnd(-14, 14), B.y - rnd(0, B.h), rnd(-40, 40), rnd(-60, 0), 1.1, pick(['#241a28', '#c8402e', '#a89070']));
      SFX.boom(); G.flash = 0.3; G.flashCol = '#c8402e';
      await talk([['', 'A corrupção se rompe. A força que sustentava a mão atravessa você.'], ['', 'O guardião abre os dedos de uma vez. Depois recua, sem reconhecer o caminho da margem.']]);
      G.save.frag++; showToast('Força do guardião', '+8% de dano', 2.5);
    }
    G.save.harmony.mapinguari = outcome;
    // O retorno é um checkpoint: recarregar durante a cena não repete a luta nem a recompensa.
    G.save.fire = { lvl: 'amazonia', x: 441 }; G.save.lit.a1 = 1; writeSave();
  }
  SFX.echo();
  for (let i = 0; i < 18; i++) {
    B.alpha = 1 - i / 18;
    part(B.x + rnd(-18, 18), B.y - rnd(8, B.h), rnd(-12, 12), -28, 1.2, outcome === 'poupar' ? '#bad28a' : '#ab9e94');
    await wait(0.045);
  }
  G.boss = null; G.lvl.arena.cleared = true;
  await fade(true);
  const form = G.P.form;
  loadLevel('amazonia');
  G.P = makePlayer(440, GY); G.P.form = form; G.P.f = -1; G.P.onG = true;
  G.cam.x = clamp(440 - W / 2, 0, G.lvl.w - W); G.camTarget = null; G.auto = 0;
  for (const t of G.lvl.triggers) if (t.x < 450) t.done = true;
  hud.cache = {}; updateHudForm();
  await fade(false);
  await journeyReturnConversation();
}
async function journeyReturnConversation() {
  const j = journeyState(), spared = journeyOutcome() === 'poupar';
  if (j.returned) return journeyOfferDeparture();
  G.flags.journeyQuiet = true; G.P.kneel = true;
  try {
    await talk([['', 'O igarapé continua correndo. Você reconhece o fogo antes de ver quem está junto dele.']]);
    if (spared) await talk([
      ['Nina', j.bridgeHelped ? 'Eu atravessei sozinha de novo. A nossa passarela aguentou!' : 'Lia terminou a passarela. Agora eu posso atravessar.'],
      ['Lia', 'Ouvi o grito parar. Depois, aquele passarinho respondeu. Fazia dias que não respondia.'],
      ['Espírito', 'Ele soltou o tronco. Devagar.'],
      ['Lia', 'Então ainda tem caminho de volta para ele.'],
    ]);
    else await talk([
      ['Nina', 'Acabou?'],
      ['Espírito', 'A fúria passou. Ele foi para longe.'],
      ['Lia', 'A mata ficou quieta de um jeito diferente. Amanhã vou olhar o tronco com Nina.'],
      ['Lia', 'Você trouxe a gente até amanhã. O resto a gente vai entender com tempo.'],
    ]);
    const recall = {
      memory: ['Lia', 'Você perguntou como ele era. Aquela mão na madeira também continua sendo parte da resposta.'],
      fear: ['Lia', 'Você disse que estava com medo. Pode deixar um pouco dele aqui, junto da cuia que Nina guardou.'],
      silence: ['Lia', 'Se quiser ficar sem dizer nada outra vez, eu fico também.'],
    }[j.campChoice];
    if (recall) await talk([recall]);
    await talk([['Davi', j.metDavi ? 'Olha o Vagalume de volta. Desta vez eu não deixei o fogo apagar.' : 'Guardei mais lenha. Tem espaço para você aqui.'], ['Lia', 'A trilha depois do fogo leva ao Cerrado. Pode ficar um pouco antes de ir.']]);
    j.returned = true; writeSave();
  } finally { G.P.kneel = false; G.flags.journeyQuiet = false; }
  return journeyOfferDeparture();
}
async function journeyOfferDeparture() {
  if (!journeyCanContinue()) return;
  const choice = await choose('O caminho para o Cerrado está aberto.', [
    { label: 'Seguir para o Cerrado', sub: 'continuar a jornada' },
    { label: 'Ficar mais um pouco', sub: 'conversar e descansar na margem' },
  ], 'Lia');
  closeDialog();
  if (choice === 0) return journeyContinueToCerrado();
  journeyState().stayAtMargin = true; writeSave();
  hint('Para continuar: siga até a placa “Cerrado”, à direita da fogueira, e aperte <kbd>E</kbd>.', 'Para continuar: vá até a placa “Cerrado”, à direita da fogueira, e use <b>Agir</b>.', 9);
}
async function journeyContinueToCerrado() {
  if (G.save.act !== 1 || !journeyOutcome() || !journeyState().returned || G.lvl.id !== 'amazonia' || G.boss || G.journeyDeparting) return;
  G.journeyDeparting = true;
  journeyState().stayAtMargin = false; writeSave();
  try { return await nextAct(); } finally { G.journeyDeparting = false; }
}
function journeyJournalHTML() {
  const j = journeyState(), out = [], outcome = journeyOutcome();
  if (j.metDavi) out.push(['Davi', 'Me chamou de Vagalume antes de saber quem eu era. Está levando fibras para a irmã.']);
  if (j.metLia) out.push(['Lia e Nina', j.bridgeHelped ? 'Segurei a passarela enquanto Lia amarrou. Nina levou água ao fogo.' : 'Lia está com as mãos ocupadas na passarela. Pediu ajuda com a ponta solta.']);
  if (j.campShared) out.push(['Um lugar junto ao fogo', { memory: 'Perguntei pelo guardião. Lia lembrou de uma cheia e de uma mão segurando a casa.', fear: 'Contei que estava com medo. Nina disse que guardaria minha cuia.', silence: 'Ficamos ouvindo a água. Lia não tentou preencher o silêncio.' }[j.campChoice] || 'Lia me deu um nó de fibra para levar comigo.']);
  if (j.witnessedShelter) out.push(['A mão na madeira', 'Os sulcos do Mapinguari e as marcas de altura de Nina dividem o mesmo tronco.']);
  if (outcome) out.push(['De volta à margem', outcome === 'poupar' ? 'O guardião abriu a mão devagar. Os pássaros voltaram a responder junto ao igarapé.' : 'Tomei a força do guardião. A família está segura, mas a margem ficou mais silenciosa.']);
  if (typeof companionJournalEntries === 'function') out.push(...companionJournalEntries());
  if (!out.length) return '';
  return '<h2>Pessoas e lugares</h2><div class="journal">' + out.map(([t, x]) => `<div class="e"><b>${t}</b><span>${x}</span></div>`).join('') + '</div>';
}

// Arte de objetos cotidianos. A marca do guardião reaparece no caminho e na arena.
function drawJourneyBridge(s) {
  for (let x = s.x; x < s.x + s.w; x += 5) { rect(ctx, x, s.y, 4, 3, '#9d7c48'); rect(ctx, x, s.y, 4, 1, '#d0aa68'); }
  for (const x of [330, 377]) { rect(ctx, x, s.y - 7, 2, 11, '#684b2d'); rect(ctx, x - 1, s.y - 4, 4, 1, '#c0a06a'); }
  rect(ctx, s.x, s.y + 3, s.w, 1, '#3a2a1d');
}
function drawJourneyProp(p, t, gy) {
  if (p.kind.startsWith('journeyRegional')) return drawCompanionProp(p, t, gy);
  const x = p.x, outcome = journeyOutcome();
  if (p.kind === 'journeyExit') {
    rect(ctx, x - 1, gy - 25, 2, 25, '#6c4c2b');
    rect(ctx, x - 22, gy - 29, 42, 11, '#2b2419');
    rect(ctx, x - 21, gy - 28, 40, 9, '#937044');
    for (let i = 0; i < 5; i++) rect(ctx, x + 19 + i, gy - 28 + i, 1, 9 - i * 2, '#937044');
    drawPx('Cerrado', x - 1, gy - 27, { align: 'center', col: '#fff0c4', col2: '#e1c286' });
  } else if (p.kind === 'journeyStream') {
    rect(ctx, 330, GY + 1, 48, 9, '#285758');
    for (let i = 0; i < 8; i++) rect(ctx, 332 + (i * 13 + t * 8) % 43, GY + 2 + i % 6, 3 + i % 3, 1, i % 2 ? '#729c8a' : '#3d7c79');
    for (const bx of [327, 379]) { ell(ctx, bx, GY + 4, 4, 3, '#59614c'); rect(ctx, bx - 1, GY - 8, 1, 9, '#779157'); }
  } else if (p.kind === 'journeyBridge' && !G.lvl.solids.some(s => s.kind === 'journeyBridge')) {
    rect(ctx, 326, gy - 1, 15, 3, '#8c683f'); rect(ctx, 327, gy - 2, 15, 1, '#bc985b');
    for (let i = 0; i < 4; i++) rect(ctx, 339 + i * 2, gy + i, 2, 1, '#b09667');
    rect(ctx, 374, gy, 8, 3, '#8c683f');
  } else if (p.kind === 'journeyBasket') {
    rect(ctx, x - 5, gy - 8, 10, 8, '#6b4a2e'); rect(ctx, x - 4, gy - 7, 8, 6, '#b38d51');
    for (let i = -3; i < 5; i += 2) rect(ctx, x + i, gy - 7, 1, 6, '#735730');
    rect(ctx, x - 4, gy - 4, 8, 1, '#e0b678');
    for (let i = 0; i < 4; i++) rect(ctx, x + 6 + i * 2, gy - 1 - i % 2, 9 - i, 1, '#977c4b');
  } else if (p.kind === 'journeyPot') {
    ell(ctx, x, gy - 3, 6, 3, '#a3754a'); ell(ctx, x, gy - 5, 5, 2, '#382e20'); rect(ctx, x - 3, gy - 5, 5, 1, '#70909a');
    if (!outcome || outcome === 'poupar') for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.25; rect(ctx, x + Math.sin(t + i) * 2, gy - 10 - (t * 4 + i * 4) % 14, 1, 3, '#ded1ac'); } ctx.globalAlpha = 1;
  } else if (p.kind === 'journeyShelter') {
    rect(ctx, x - 13, gy - 65, 22, 65, '#362f23'); rect(ctx, x - 10, gy - 65, 6, 65, '#675039'); rect(ctx, x + 4, gy - 61, 3, 61, '#4f422c');
    rect(ctx, x - 34, gy - 33, 67, 5, '#58442a'); rect(ctx, x - 32, gy - 33, 63, 1, '#9e7c47');
    for (let i = 0; i < 5; i++) { const y = gy - 45 + i * 4; rect(ctx, x - 8 + i % 2, y, 13 - i, 2, '#171e16'); rect(ctx, x - 7, y + 2, 10 - i, 1, '#9d8e60'); }
    for (let i = 0; i < 3; i++) rect(ctx, x + 7, gy - 10 - i * 4, 5, 1, '#d4b16f');
    rect(ctx, x + 11, gy - 19, 1, 5, '#c86947'); rect(ctx, x - 13, gy - 5, 5, 5, '#4d6a3c');
  } else if (p.kind === 'journeyTrace') {
    for (let i = 0; i < 5; i++) { rect(ctx, x + i * 3, gy - 11 + i % 2, 2, 11, '#5a4931'); rect(ctx, x + i * 3, gy - 11, 1, 2, '#c5a16a'); }
  } else if (p.kind === 'journeyAftermath') {
    if (outcome === 'poupar') {
      for (let i = 0; i < 4; i++) { const bx = x + i * 8; rect(ctx, bx, gy - 7 - i % 3, 1, 8 + i % 3, '#749258'); ell(ctx, bx - 2, gy - 6 - i % 3, 3, 1, '#95b66c'); rect(ctx, bx + 1, gy - 8 - i % 3, 2, 2, '#c9d18b'); }
      const bx = x - 25 + Math.sin(t * 0.8) * 7, by = gy - 36 + Math.sin(t * 1.6) * 3;
      rect(ctx, bx, by, 3, 2, '#dfb362'); rect(ctx, bx + 2, by - 1, 2, 1, '#e5d296'); rect(ctx, bx - 2, by + (Math.sin(t * 6) > 0 ? -1 : 1), 3, 1, '#847f42');
    } else {
      rect(ctx, x, gy - 2, 27, 2, '#68604c'); rect(ctx, x + 9, gy - 5, 2, 6, '#655d4b'); rect(ctx, x + 9, gy - 5, 8, 1, '#86775b');
      rect(ctx, x - 7, gy - 1, 6, 1, '#b19b72');
    }
  }
}
function drawJourneyNPCDetails(n, gy) {
  if (!n.carry) return;
  const x = n.x + n.f * 6, y = gy - 8;
  ell(ctx, x, y, 3, 2, '#b59258'); rect(ctx, x - 2, y - 1, 4, 1, '#639897');
}

// Camadas discretas de vento, água próxima e bichos espaçados. Nenhum loop musical ou ataque extra.
const JOURNEY_AUDIO = { ctx: null, nodes: null, nextBird: 0, nextLeaf: 0 };
function journeyAudioLayer(c, frequency, q, buffer) {
  const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
  source.buffer = buffer; source.loop = true; filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = q; gain.gain.value = 0;
  source.connect(filter); filter.connect(gain); gain.connect(AU.master); source.start();
  return { source, filter, gain };
}
function journeyAmbience(dt) {
  const id = G.lvl && G.lvl.id;
  const regional = typeof COMPANIONS !== 'undefined' && COMPANIONS[id];
  const chapter = id === 'prologo' || id === 'amazonia' || id === 'gruta' || !!regional;
  const audible = chapter && G.state === 'play' && !UI.menu && !UI.card && !document.hidden;
  const x = G.P ? G.P.x : 0, battle = !!G.boss;
  const quiet = !!G.flags.journeyQuiet;
  const boss = G.lvl && G.lvl.arena, localOutcome = boss && (G.save.harmony[boss.boss] || (boss.boss === 'boitata' && G.save.ev.boitata ? 'poupar' : null));
  const tension = !!(boss && x > boss.x0 - 190 && !localOutcome);
  const mix = audible && !battle ? (quiet ? 0.32 : tension ? 0.48 : x < (regional ? 400 : 650) ? 0.67 : 0.9) : 1;
  AU.journeyMix = lerp(AU.journeyMix ?? 1, mix, Math.min(1, dt * 2));
  if (Math.abs(AU.music.volume - 0.35 * musicVol()) > 0.001) AU.music.volume = 0.35 * musicVol();
  const c = AU.ctx;
  if (!c || !AU.master) return;
  if (!JOURNEY_AUDIO.nodes && !audible) return;
  if (JOURNEY_AUDIO.ctx !== c) {
    if (JOURNEY_AUDIO.nodes) for (const n of JOURNEY_AUDIO.nodes) { n.source.stop(); n.source.disconnect(); n.filter.disconnect(); n.gain.disconnect(); }
    JOURNEY_AUDIO.ctx = c;
    const b = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), data = b.getChannelData(0);
    let low = 0;
    for (let i = 0; i < data.length; i++) { low = (low + (Math.random() * 2 - 1) * 0.08) / 1.08; data[i] = low; }
    JOURNEY_AUDIO.nodes = [journeyAudioLayer(c, 530, 0.5, b), journeyAudioLayer(c, 1800, 0.7, b)];
    JOURNEY_AUDIO.nextBird = c.currentTime + 4; JOURNEY_AUDIO.nextLeaf = c.currentTime + 7;
  }
  const active = audible && AU.on;
  const nearStream = id === 'amazonia' ? clamp(1 - Math.abs(x - 354) / 280, 0, 1) : id === 'pantanal' ? 0.65 : id === 'gruta' ? clamp(1 - Math.abs(x - 1740) / 400, 0, 0.5) : 0;
  JOURNEY_AUDIO.nodes[0].filter.frequency.value = id === 'gruta' ? 230 : id === 'caatinga' ? 760 : id === 'cerrado' ? 640 : 530;
  const levels = active ? [(battle ? 0.025 : tension ? 0.12 : id === 'gruta' ? 0.035 : 0.07) * (0.85 + Math.sin(G.rt * 0.21) * 0.15), nearStream * (quiet ? 0.35 : 0.22)] : [0, 0];
  JOURNEY_AUDIO.nodes.forEach((n, i) => n.gain.gain.setTargetAtTime(levels[i], c.currentTime, 0.45));
  if (!active || battle || tension) return;
  const spare = localOutcome === 'poupar', purify = localOutcome === 'purificar';
  if (id !== 'gruta' && !purify && c.currentTime > JOURNEY_AUDIO.nextBird) {
    JOURNEY_AUDIO.nextBird = c.currentTime + rnd(spare ? 9 : 14, spare ? 19 : 29);
    const f = pick([1480, 1730, 2120]);
    soundNote(f, 0.1, 0.019, 0, f * 0.18, 0.018);
    if (Math.random() > 0.35) soundNote(f * 0.87, 0.13, 0.013, 0.2, f * 0.1, 0.018);
  }
  if (c.currentTime > JOURNEY_AUDIO.nextLeaf) {
    JOURNEY_AUDIO.nextLeaf = c.currentTime + rnd(11, 23);
    if (id === 'gruta') soundNote(rnd(620, 950), 0.24, 0.008, 0, -160, 0.004);
    else soundAir(rnd(0.6, 1.2), 0.012, id === 'caatinga' ? 1800 : 1300, 700, 0, 'bandpass', 0.5, 0.2, 'leaf');
  }
}
