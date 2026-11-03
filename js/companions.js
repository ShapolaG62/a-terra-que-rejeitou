'use strict';
// Pessoas que continuam a viver depois que o espírito passa. Cada lugar tem um gesto próprio.
const COMPANIONS = {
  cerrado: { act: 2, who: 'Cecília', npc: 'arqueira', form: 'arco', boss: 'capelobo', camp: 325, taskX: 294, exitX: 365, meetX: 216, item: 'fita_do_caminho',
    action: 'Firmar o marco da trilha', taskName: 'Um caminho de volta',
    intro: [
      ['Cecília', 'Segura... Não, estou falando com esta fita. O vento não quer deixar o nó pronto. Sou Cecília.'],
      ['Cecília', 'Estou refazendo a marca da trilha. Minha irmã voltava por aqui quando escurecia. Hoje marco para quem ainda vem.'],
      ['Cecília', 'Leve o arco. Posso te mostrar sem largar esta ponta: o braço acompanha o vento, não briga com ele.'],
    ],
    lesson: 'O Capelobo seguia na beira da trilha. A gente ouvia o passo e sabia até onde podia ir. Agora o passo vem atrás da gente.',
    helped: [['Cecília', 'Agora dá para ver do outro lado do capim. Parece pouca coisa, até ser você procurando o caminho.']],
    question: 'Cecília testa a fita no vento. “O que você procura quando precisa voltar?”',
    choices: [{ label: '“Alguém que reconheça minha chegada.”', key: 'people', reply: 'Então não esquece de reconhecer a chegada dos outros. Hoje eu reconheci a sua.' }, { label: '“Ainda não sei onde é minha casa.”', key: 'home', reply: 'Às vezes começa com um marco. Não precisa escolher a estrada inteira hoje.' }],
    recall: { people: 'Você falou de ser reconhecido. Quando voltar a passar, eu vou saber que é você.', home: 'Não sei se encontrou casa. Mas já sabe uma trilha que leva até alguém.' },
    journal: 'Firmei o marco enquanto Cecília terminava o nó. A fita voltou a mostrar a trilha.',
    spare: 'O capim parou de se abrir sozinho. O passo dele ficou mais longe, como antes. Deixei um pouco de água na beira da trilha.',
    purify: 'O vento voltou a passar, mas ninguém ouviu o passo. Vou manter a marca mesmo assim. Alguém ainda precisa dela.',
  },
  pantanal: { act: 3, who: 'Bento', npc: 'canoeiro', form: 'lanca', boss: 'paidomato', camp: 300, taskX: 342, exitX: 365, meetX: 194, item: 'lasca_do_remo',
    action: 'Ajudar Bento a empurrar a canoa', taskName: 'A canoa que espera',
    intro: [
      ['Bento', 'Se veio cobrar a travessia, vai ter de esperar. A canoa resolveu virar árvore outra vez. Sou Bento.'],
      ['Bento', 'Este risco no remo era a altura do meu filho. Eu ia lixar. Acabei deixando.'],
      ['Bento', 'Pega o jeito da lança e do remo. Aqui você aprende com a água antes de tentar mandar nela.'],
    ],
    lesson: 'O Pai do Mato me viu aprender a remar. Ainda reconhece a gente. Se levantar a mão, escute o que ele tem a dizer.',
    helped: [['Bento', 'Olha só. Mais teimosa que eu, mas flutua. Pode usar para chegar ao primeiro tronco.']],
    question: 'Bento deixa o remo atravessado sobre os joelhos. “Quer ouvir um pouco?”',
    choices: [{ label: 'Perguntar por quem aprendeu a remar aqui.', key: 'family', reply: 'Meu filho remava do lado errado só para eu corrigir. Quando aprendeu, fiquei sem desculpa para sentar perto.' }, { label: 'Ficar escutando a água com ele.', key: 'water', reply: 'Isso. Hoje o rio está falando baixo. Dá para escutar sem ter resposta pronta.' }],
    recall: { family: 'Vou chamar meu filho para remar um trecho. Mesmo que ele já saiba o caminho.', water: 'O rio ainda fala baixo. Se quiser escutar mais um pouco, o banco está livre.' },
    journal: 'Empurramos a canoa juntos. Ela voltou à água e virou um apoio de verdade na saída do porto.',
    spare: 'Vi os bichos descerem à água sem se empurrar. Fazia tempo que não via. Ele continua cuidando da margem.',
    purify: 'Os bichos pararam antes da margem. O Pai do Mato também não veio. Vou passar a noite aqui para ver se voltam.',
  },
  caatinga: { act: 4, who: 'Rosa', npc: 'lanceira', form: 'cabaca', boss: 'labatut', camp: 225, taskX: 274, exitX: 344, meetX: 174, item: 'retalho_de_sombra',
    action: 'Estender a esteira de sombra', taskName: 'Lugar para mais um',
    intro: [
      ['Rosa', 'Chega para cá antes de conversar. O sol não vai esperar a gente terminar. Sou Rosa.'],
      ['Rosa', 'Esta esteira era grande. Fui remendando e agora parece um mapa que só eu entendo. Ainda cabe mais alguém.'],
      ['Rosa', 'Leva nossa cabaça e a lança. Bebe antes de o corpo pedir. E aprende a ver a próxima sombra antes de sair desta.'],
    ],
    lesson: 'Quando eu era pequena, o Labatut ficava no fim das histórias. Agora a fome dele está chegando perto demais das casas.',
    helped: [['Rosa', 'Pronto. Aquela faixa no chão já não queima. É assim que a gente ganha um pedaço de caminho.']],
    question: 'Rosa coloca uma cuia no lugar novo da sombra.',
    choices: [{ label: '“Deixa para quem vier depois.”', key: 'next', reply: 'Deixo. E amanhã torno a encher. Um desconhecido fez isso por mim uma vez.' }, { label: '“Você espera alguém?”', key: 'waiting', reply: 'Hoje, não. Mas já precisei chegar a um lugar que não estava esperando ninguém. Não gostei do silêncio.' }],
    recall: { next: 'A cuia ficou para quem vinha depois. Acabou sendo você.', waiting: 'Desta vez eu estava esperando alguém. Você demorou, mas chegou.' },
    journal: 'Estendemos a esteira. A sombra ficou maior, refresca de verdade e guarda uma cuia para a próxima pessoa.',
    spare: 'Ouvi um nome no lugar do grito. Não entendi inteiro. Vou perguntar aos mais velhos se ainda lembram.',
    purify: 'O grito sumiu. Deixei a cuia onde a trilha termina. Se ele voltar sem reconhecer o caminho, talvez reconheça a água.',
  },
  mata: { act: 5, who: 'Celina', npc: 'ancia', form: 'semente', boss: 'corposeco', camp: 235, taskX: 267, meetX: 156, item: 'casca_da_semente',
    action: 'Plantar com Celina', taskName: 'Uma coisa que continua',
    intro: [
      ['Celina', 'Devagar. Tem uma raiz bem debaixo do seu pé. Sou Celina. Já ouvi mais de uma versão da sua história.'],
      ['Celina', 'Estou escolhendo um lugar para esta semente. Vai dar trabalho por anos. É por isso que quero plantar.'],
      ['Celina', 'Leva o jeito das sementes. Você já aprendeu fogo, água e sopro. Aqui pode trocar entre o que carrega.'],
    ],
    lesson: 'O engenho fica depois das ruínas. Antes de ir, se quiser, cabe outra mão nesta terra.',
    helped: [['Celina', 'Não precisa crescer hoje. Só precisa ter onde começar.']],
    question: 'Celina cobre a semente sem apertar demais. “Em quem você pensou?”',
    choices: [{ label: '“Em quem guardou um lugar para mim.”', key: 'living', reply: 'Então este lugar guarda um pouco deles. Sem trazer ninguém para longe de casa.' }, { label: '“Em quem não conseguiu voltar.”', key: 'lost', reply: 'Pode lembrar deles sem pedir que sejam apenas tristeza. A terra aguenta mais de uma coisa.' }],
    recall: { living: 'Os lugares que te acolheram também andam com você.', lost: 'A semente ficou aqui. Sua lembrança não precisa ficar sozinha.' },
    journal: 'Plantei com Celina. A muda cresce com o tempo passado no jogo e fica aqui nas revisitas.',
  },
};
function companionState(id = G.lvl.id) {
  const j = journeyState();
  if (!j.regions || typeof j.regions !== 'object' || Array.isArray(j.regions)) j.regions = {};
  if (!j.regions[id] || typeof j.regions[id] !== 'object' || Array.isArray(j.regions[id])) j.regions[id] = {};
  return j.regions[id];
}
function companionOutcome(id) { const c = COMPANIONS[id]; return c && G.save.harmony[c.boss]; }
function companionPending(id) { const c = COMPANIONS[id]; return !!(c && c.exitX && G.save.act === c.act && !G.save.sub && companionOutcome(id) && !companionState(id).returned); }
function configureCompanions(level) {
  const id = level.id, c = COMPANIONS[id];
  if (!c) {
    if (id === 'gruta' && companionState('cerrado').helped) level.pr('journeyRegionalRibbon', 90, GY);
    return;
  }
  const r = companionState(id), outcome = companionOutcome(id), n = level.npcs.find(n => n.id === c.npc);
  level.enemyMinX = id === 'pantanal' ? 900 : 470;
  level.spawns = level.spawns.filter(s => s.x >= level.enemyMinX + 10);
  level.companion = id;
  if (outcome && level.arena) level.arena.cleared = true;
  if (companionPending(id)) G.save.fire = { lvl: id, x: c.camp };
  n.talk = () => companionTalk(id); n.anim = 'kneel';
  n.spec = { ...n.spec, weapon: null };
  if (r.helped) n.x = id === 'pantanal' ? 277 : c.taskX - 19;
  level.triggers = level.triggers.filter(t => ![230, 200, 150, 140].includes(t.x));
  level.tr(c.meetX, () => companionMeet(id));
  level.onStart = async () => { if (companionPending(id)) await companionReturnTalk(id); };
  level.pr('journeyRegionalWork', c.taskX, GY, { region: id });
  level.pr('journeyRegionalRest', c.camp - 27, GY, { region: id });
  if (r.helped) applyCompanionTask(level, id);
  if (outcome) level.pr('journeyRegionalAftermath', c.camp + 14, GY, { region: id });
}
function finishCompanionScenery(level) {
  if (!level.companion) return;
  level.canopies = level.canopies.filter(c => c.tx < 160 || c.tx > 355);
  level.hvines = level.hvines.filter(v => v.x < 150 || v.x > 365);
}
function applyCompanionTask(level, id) {
  if (id === 'pantanal' && !level.solids.some(s => s.companionBoat)) {
    level.p(382, 145, 34, { dy: 1, spd: 1.2, canoe: true });
    level.solids.at(-1).companionBoat = true;
  }
  if (id === 'caatinga' && !level.shade.some(s => s.companionShade)) level.shade.push({ x: 240, w: 104, kind: 'awning', companionShade: true });
}
async function companionMeet(id) {
  const c = COMPANIONS[id], r = companionState(id);
  if (r.met) { if (!G.save.forms.includes(c.form)) grantForm(c.form); return; }
  if (companionOutcome(id)) { r.met = true; writeSave(); return; }
  await talk(c.intro);
  if (id === 'cerrado' && G.save.items.includes('no_da_margem')) await talk([['Cecília', 'Esse nó na sua fibra já segurou alguma coisa.'], ['Espírito', 'Uma passarela. E um lugar junto ao fogo.']]);
  if (!G.save.forms.includes(c.form)) { grantForm(c.form); await wait(0.5); }
  await talk([[c.who, c.lesson]]);
  r.met = true; writeSave();
  const tips = { cerrado: 'J: três golpes · U: flecha de fogo', pantanal: 'J: estocada · U: arremesso · a forma da lança atravessa melhor a água', caatinga: 'Procure sombra · F: beber da cabaça · U: água para aliviar o calor', mata: 'Q: trocar de forma · U: raízes sob o inimigo' };
  hint(tips[id] + ' · E para ajudar ou conversar.', tips[id] + ' · Use Agir para ajudar ou conversar.', 7);
}
async function companionTalk(id) {
  const c = COMPANIONS[id], r = companionState(id);
  if (companionPending(id)) return companionReturnTalk(id);
  if (r.helped && !r.shared) return companionCamp(id);
  if (companionOutcome(id)) return talk([[c.who, c.recall[r.choice] || 'O lugar continua aqui. Pode descansar antes de seguir.']]);
  if (!r.met) return companionMeet(id);
  if (!r.helped) return talk([[c.who, { cerrado: 'Pode firmar o marco para mim? A fita já está pronta.', pantanal: 'A canoa está na margem. Uma mão deste lado resolve mais que outra história sobre força.', caatinga: 'A ponta solta da esteira. Se estender até o próximo poste, cabe mais alguém.', mata: 'A terra está solta perto da ruína. Quando quiser, plantamos juntos.' }[id]]]);
  if (!r.shared) return companionCamp(id);
  return talk([[c.who, c.recall[r.choice] || 'Fico por aqui. Você já sabe como voltar.']]);
}
async function companionHelp(id) {
  const c = COMPANIONS[id], r = companionState(id);
  if (r.helped) return;
  if (!r.met) await companionMeet(id);
  G.P.vx = 0; G.P.kneel = true;
  try {
    const neighbor = G.lvl.npcs.find(n => n.id === c.npc);
    neighbor.targetX = c.taskX - 19;
    await waitUntil(() => neighbor.targetX == null);
    if (id === 'pantanal') {
      const boat = G.lvl.companionPush = { t: 0, dur: 1.5, startPlayer: G.P.x, startNPC: neighbor.x, distance: Math.min(38, Math.max(0, 382 - G.P.x)) };
      await waitUntil(() => boat.t >= boat.dur);
      G.lvl.companionPush = null;
    } else await wait(id === 'mata' ? 1.4 : 1);
    r.helped = true;
    if (id === 'mata') r.growth = 0;
    applyCompanionTask(G.lvl, id);
    if (AU.ctx && AU.on) soundWood(id === 'cerrado' ? 350 : 220, 0.35);
    writeSave();
    await talk(c.helped);
    if (id === 'pantanal') neighbor.targetX = 277;
  } finally { G.P.kneel = false; }
  hint('Há tempo para uma conversa junto à fogueira. E para sentar.', 'Há tempo para uma conversa junto à fogueira. Use Agir para sentar.', 6);
}
async function companionCamp(id) {
  const c = COMPANIONS[id], r = companionState(id);
  if (!r.helped || r.shared) return;
  G.P.vx = 0; G.P.kneel = true; G.flags.journeyQuiet = true;
  try {
    const index = await choose(c.question, c.choices.map(o => ({ label: o.label })), c.who);
    closeDialog();
    const choice = c.choices[index];
    await talk([[c.who, choice.reply]]);
    r.choice = choice.key; r.shared = true;
    giveRelic(c.item); G.save.lit[G.lvl.fires[0].id] = 1;
    G.save.fire = { lvl: id, x: c.camp }; G.P.hp = statMax().hp; G.P.st = statMax().st; G.P.flasks = statMax().flasks;
    writeSave(); SFX.rest(); showToast(RELICS[c.item].n, 'Uma lembrança da conversa · guardada no diário', 3);
  } finally { G.P.kneel = false; G.flags.journeyQuiet = false; }
}
function companionInteractables(add) {
  const id = G.lvl.id, c = COMPANIONS[id];
  if (!c) {
    if (id === 'gruta' && companionState('cerrado').helped) add(90, GY, 'Reconhecer a fita de Cecília', () => scene(() => talk([['', 'Uma fita parecida com a do marco prende a tocha à madeira.'], ['Espírito', 'Um caminho de volta. Ainda aqui.']])));
    return;
  }
  const r = companionState(id);
  if (!r.helped) add(c.taskX, GY, c.action, () => scene(() => companionHelp(id)));
  if (c.exitX && companionOutcome(id) && G.save.act === c.act && !G.save.sub) add(c.exitX, GY, id === 'cerrado' ? 'Seguir para a Gruta dos Antigos' : id === 'pantanal' ? 'Seguir para a Caatinga' : 'Seguir para a Mata Atlântica', () => scene(id === 'cerrado' ? enterGruta : nextAct));
}
function companionFireAction(f) {
  const id = G.lvl.id, c = COMPANIONS[id];
  if (!c || f !== G.lvl.fires[0]) return false;
  const r = companionState(id);
  return !!(r.helped && !r.shared);
}
function updateCompanions(dt) {
  const id = G.lvl && G.lvl.companion;
  if (!id) return;
  const r = companionState(id), n = G.lvl.npcs.find(n => n.id === COMPANIONS[id].npc);
  if (n && n.targetX != null) {
    const dx = n.targetX - n.x, step = dt * 48;
    if (Math.abs(dx) <= step) { n.x = n.targetX; n.targetX = null; n.anim = 'kneel'; }
    else { n.x += Math.sign(dx) * step; n.f = Math.sign(dx); n.anim = 'walk'; n.ph = (n.ph || 0) + dt * 9; }
  } else if (n) { n.anim = Math.sin(G.t * 0.3) > 0.8 ? 'idle' : 'kneel'; n.f = G.P && G.P.x < n.x ? -1 : 1; }
  const push = G.lvl.companionPush;
  if (push) {
    push.t = Math.min(push.dur, push.t + dt);
    const p = push.t / push.dur;
    G.P.x = push.startPlayer + push.distance * p;
    n.x = push.startNPC + push.distance * p; n.anim = 'kneel'; n.f = 1;
  }
  if (id === 'mata' && r.helped && (r.growth || 0) < 1) {
    r.growth = Math.min(1, (r.growth || 0) + dt / 80);
    if (r.growth === 1) writeSave();
  }
}
function prepareCompanionReturn(boss) {
  const id = Object.keys(COMPANIONS).find(id => COMPANIONS[id].boss === boss && COMPANIONS[id].exitX);
  if (!id) return null;
  G.save.fire = { lvl: id, x: COMPANIONS[id].camp }; G.save.lit[G.lvl.fires[0].id] = 1; writeSave();
  return id;
}
async function companionReturn(id) {
  const c = COMPANIONS[id], form = G.P.form;
  prepareCompanionReturn(c.boss);
  await fade(true); loadLevel(id);
  G.P = makePlayer(c.camp, groundY(c.camp)); G.P.form = form; G.P.onG = true; G.P.f = -1;
  G.cam.x = clamp(c.camp - W / 2, 0, G.lvl.w - W); G.cam.shake = 0; G.camTarget = null; G.auto = 0;
  for (const t of G.lvl.triggers) if (t.x < c.camp) t.done = true;
  hud.cache = {}; updateHudForm();
  await fade(false); await companionReturnTalk(id);
}
async function companionReturnTalk(id) {
  const c = COMPANIONS[id], r = companionState(id);
  if (r.returned) return;
  G.flags.journeyQuiet = true; G.P.kneel = true;
  try {
    await talk([[c.who, { cerrado: 'A fita levantou antes de eu ouvir seus passos. Sabia que alguém vinha.', pantanal: 'Deixei a canoa amarrada. Hoje não ia embora antes de ver você voltar.', caatinga: 'Chega para cá. Ainda tem sombra. E eu tenho uma pergunta, mas pode beber primeiro.' }[id]], [c.who, companionOutcome(id) === 'poupar' ? c.spare : c.purify]]);
    if (c.recall[r.choice]) await talk([[c.who, c.recall[r.choice]]]);
    await talk([[c.who, id === 'cerrado' ? 'A entrada da gruta fica depois do marco. Não precisa entrar sem respirar primeiro.' : 'Pode ficar um pouco. A próxima trilha não sai do lugar.']]);
    r.returned = true; writeSave();
    hint('Converse, descanse ou use E na saída da margem para continuar.', 'Converse, descanse ou use Agir na saída para continuar.', 6);
  } finally { G.P.kneel = false; G.flags.journeyQuiet = false; }
}
function companionJournalEntries() {
  const rows = [];
  for (const [id, c] of Object.entries(COMPANIONS)) {
    const r = companionState(id);
    if (r.met) rows.push([c.who, r.helped ? c.journal : c.lesson]);
    if (r.shared) rows.push([c.taskName, c.recall[r.choice]]);
    if (r.returned) rows.push(['Voltei para ' + c.who, companionOutcome(id) === 'poupar' ? c.spare : c.purify]);
  }
  return rows;
}
function companionFinalMemory() {
  const bits = [];
  if (companionState('cerrado').helped) bits.push('o marco de Cecília apontando a trilha');
  if (companionState('pantanal').helped) bits.push('a canoa de Bento na água');
  if (companionState('caatinga').helped) bits.push('a cuia de Rosa esperando alguém');
  if (companionState('mata').helped) bits.push('a semente que ficou com Celina');
  return bits.length ? [['', 'Você lembra: ' + bits.join('; ') + '.'], ['Espírito', 'Eles ainda têm coisas para fazer amanhã.']] : [];
}
function drawCompanionProp(p, t, gy) {
  const id = p.region, r = id ? companionState(id) : companionState('cerrado'), x = p.x;
  if (p.kind === 'journeyRegionalRibbon') {
    rect(ctx, x, gy - 28, 2, 28, '#745b3a'); rect(ctx, x + 2, gy - 24, 11, 3, '#d0ac66'); drawFire(ctx, x, gy - 29, t, true); return;
  }
  if (p.kind === 'journeyRegionalRest') {
    rect(ctx, x - 8, gy - 2, 16, 2, '#9c7f50');
    for (let i = 0; i < 7; i++) rect(ctx, x - 7 + i * 2, gy - 3, 1, 2, '#d0b373');
    return;
  }
  if (p.kind === 'journeyRegionalAftermath') {
    const calm = companionOutcome(id) === 'poupar';
    if (calm) { for (let i = 0; i < 3; i++) { rect(ctx, x + i * 5, gy - 5 - i % 2, 1, 5 + i % 2, '#789763'); rect(ctx, x + i * 5 - 1, gy - 6 - i % 2, 3, 2, id === 'caatinga' ? '#dfbe83' : '#b2c28a'); } }
    else { rect(ctx, x - 3, gy - 3, 8, 3, '#987b50'); rect(ctx, x - 2, gy - 4, 6, 1, '#cfb889'); }
    return;
  }
  if (p.kind !== 'journeyRegionalWork') return;
  if (id === 'cerrado') {
    if (r.helped) { rect(ctx, x, gy - 27, 2, 27, '#775334'); const sway = Math.sin(t * 3) * 2; rect(ctx, x + 2, gy - 25, 12 + sway, 3, '#d7ad67'); rect(ctx, x + 11 + sway, gy - 22, 2, 5, '#bd714b'); }
    else { rect(ctx, x - 10, gy - 2, 22, 2, '#8b613c'); rect(ctx, x + 9, gy - 5, 7, 3, '#c39860'); }
  } else if (id === 'pantanal' && !r.helped) {
    const push = G.lvl.companionPush, bx = x - 12 + (push ? 52 * push.t / push.dur : 0);
    drawCanoe({ x: bx, y: gy - 6, w: 34 });
    rect(ctx, x - 26, gy - 3, 18, 1, '#bc9b65');
  } else if (id === 'caatinga' && !r.helped) {
    for (let i = 0; i < 5; i++) rect(ctx, x - 8 + i, gy - 6 + i, 18 - i * 2, 1, i % 2 ? '#b18b52' : '#d0ad70');
  } else if (id === 'caatinga') {
    ell(ctx, x + 24, gy - 3, 4, 3, '#a87c4c'); rect(ctx, x + 21, gy - 5, 6, 1, '#6e9b99');
  } else if (id === 'mata') {
    ell(ctx, x, gy - 1, 9, 2, '#54422b');
    if (r.helped) { const h = 3 + Math.floor((r.growth || 0) * 9); rect(ctx, x, gy - h, 1, h, '#779864'); ell(ctx, x - 2, gy - h + 2, 3, 1, '#9ebc79'); ell(ctx, x + 3, gy - h, 3, 1, '#6f9b60'); }
    else { rect(ctx, x - 1, gy - 3, 3, 2, '#b28a4d'); }
  }
}
