'use strict';
// Estado persistente, travessia física, escolhas e recuperação após recarregar o capítulo.
// Execute: node --test tools/test-journey.js
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const source = name => readFileSync(path.join(__dirname, '..', 'js', name), 'utf8');

function game() {
  const dialogs = [], saves = [], choices = [], pixels = [], images = [], elements = new Map();
  const ctx = new Proxy({
    globalAlpha: 1,
    fillRect(...args) { assert.ok(args.every(Number.isFinite), `pixel inválido: ${args}`); pixels.push(args); },
    drawImage(...args) { images.push(args); },
    createLinearGradient() { return { addColorStop() {} }; },
    getImageData() { return { data: new Uint8ClampedArray(40 * 64 * 4) }; },
  }, { get: (o, k) => k in o ? o[k] : () => {} });
  function element() {
    return { hidden: true, style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {} },
      children: [], querySelector: () => element(), querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, getContext: () => ctx };
  }
  const sandbox = vm.createContext({
    ctx, cv: {}, stage: element(), I: { down: {}, pressed: {}, mouseT: -Infinity }, L: { touch: false },
    SFX: new Proxy({}, { get: () => () => {} }), soundWood() {}, soundNote() {}, soundAir() {},
    AU: { ctx: null, master: null, on: true, vol: 0.8, mus: 1, music: { volume: 0.28 } },
    musicVol() { return 0.8; }, musicSet() {},
    $: selector => { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); },
    document: { createElement: element, hidden: false }, setTimeout() {}, clearTimeout() {},
    requestAnimationFrame() {}, layout() {}, dialogs, saves, choices,
  });
  const core = source('core.js');
  vm.runInContext(core.slice(core.indexOf('const W'), core.indexOf('const cv')) +
    core.slice(core.indexOf('const clamp'), core.indexOf('// ---------- Layout')) +
    core.slice(core.indexOf('function newSave()'), core.indexOf('function loadSave()')), sandbox);
  for (const file of ['textos.js', 'itens.js', 'art.js', 'tiles.js', 'fauna.js', 'world.js', 'bosses.js', 'beasts.js', 'pxfont.js', 'journey.js', 'companions.js', 'story.js', 'gruta.js']) {
    const code = file === 'story.js' ? source(file).slice(0, source(file).lastIndexOf('\nsetupTouch();')) : source(file);
    vm.runInContext(code, sandbox, { filename: file });
  }
  vm.runInContext(`
    const realWait = wait, realWaitUntil = waitUntil;
    musicVol = () => AU.vol * AU.mus * (AU.journeyMix ?? 1);
    writeSave = () => saves.push(JSON.parse(JSON.stringify(G.save)));
    talk = async lines => { dialogs.push(...lines); };
    choose = async () => choices.shift() ?? 0;
    wait = async () => { updateJourney(0.2); };
    waitUntil = async fn => { for (let i = 0; !fn() && i < 300; i++) updateJourney(0.05); if (!fn()) throw Error('Cena não terminou'); };
    fade = async () => {};
    showToast = () => {}; hint = () => {}; updateHudForm = () => {}; floatText = () => {};
    G.save.act = 1; G.save.forms.push('zarabatana'); G.save.form = 'zarabatana';
    loadLevel('amazonia'); G.P = makePlayer(320, GY); G.P.form = 'zarabatana'; G.P.onG = true; G.state = 'play';
  `, sandbox);
  const api = vm.runInContext(`({ G, I, AU, UI, GY, newSave, loadLevel, makePlayer, groundY, updatePlayer, updateJourney,
    journeyState, journeyNeedsReturn, journeyHelpBridge, journeyCamp, journeyShelter, journeyInteractables,
    journeyFireAction, journeyJournalHTML, journeyMapinguariDown, journeyReturnConversation,
    journeyAmbience, drawJourneyProp, drawJourneyBridge, journeyBossIntro, interactables,
    journeyDeparturePending, journeyContinueToCerrado, journeyExitLocation, STORY,
    COMPANIONS, companionState, companionMeet, companionHelp, companionCamp, companionReturn,
    companionPending, companionInteractables, companionFinalMemory, drawCompanionProp, enterAct,
    travelScene, nextAct, enterGruta, scene, update, startBlend, drawTransition, transC, captureTravelArrival })`, sandbox);
  return { ...api, dialogs, saves, choices, pixels, images, sandbox, run: code => vm.runInContext(code, sandbox) };
}

test('saves anteriores recebem o capítulo sem perder progresso e mantêm as outras regiões', () => {
  const g = game();
  for (const old of [undefined, null, 'antigo', []]) {
    g.G.save.journey = old; g.G.save.mem = 137; g.G.save.items = ['pena_gaviao'];
    g.loadLevel('amazonia');
    assert.equal(g.G.save.mem, 137); assert.deepEqual(Array.from(g.G.save.items), ['pena_gaviao']);
    assert.equal(typeof g.journeyState(), 'object');
    assert.equal(g.G.lvl.arena.cleared, undefined);
  }
  g.loadLevel('cerrado');
  assert.equal(g.G.lvl.npcs.length, 1);
  assert.equal(g.G.lvl.solids.some(s => s.kind === 'journeyBridge'), false);
});

test('a comunidade é segura e o igarapé continua atravessável antes de ajudar', () => {
  const g = game();
  assert.ok(g.G.lvl.spawns.every(s => s.x >= 720));
  assert.equal(g.groundY(350), g.GY + 10);
  g.G.P = g.makePlayer(324, g.GY); g.G.P.onG = true;
  g.I.down.right = true; g.I.down.jump = true; g.I.pressed.jump = true;
  g.updatePlayer(1 / 60); g.I.pressed.jump = false;
  for (let i = 0; i < 60; i++) g.updatePlayer(1 / 60);
  assert.ok(g.G.P.x > 378, 'a tarefa não bloqueia a progressão');
  assert.ok(g.G.P.hp > 0);
});

test('ajudar constrói uma superfície física, atravessa com os NPCs e persiste sem duplicar', async () => {
  const g = game();
  await g.journeyHelpBridge();
  assert.equal(g.journeyState().bridgeHelped, true);
  assert.equal(g.groundY(350), g.GY);
  assert.equal(g.G.lvl.npcs.find(n => n.id === 'nina').x, 467);
  assert.equal(g.G.lvl.npcs.find(n => n.id === 'mestra').x, 412);
  assert.equal(g.G.P.kneel, false);
  const saved = JSON.parse(JSON.stringify(g.saves.at(-1)));
  await g.journeyHelpBridge();
  assert.equal(g.G.lvl.solids.filter(s => s.kind === 'journeyBridge').length, 1);
  g.G.save = saved; g.loadLevel('amazonia');
  assert.equal(g.groundY(350), g.GY);
  assert.equal(g.G.lvl.npcs.find(n => n.id === 'nina').x, 467);
});

test('inimigos perseguidos ou empurrados param antes da margem habitada', () => {
  const g = game();
  g.G.P.x = 640;
  g.G.ents[0].x = 695; g.G.ents[0].vx = -60; g.G.ents[0].stag = 0.2;
  const hp = g.G.P.hp;
  for (let i = 0; i < 1800; i++) g.run('updateEnemies(1/60)');
  assert.ok(g.G.ents.every(e => e.x >= 700));
  assert.equal(g.G.P.hp, hp);
  g.loadLevel('coracao');
  assert.equal(g.G.lvl.enemyMinX, undefined);
});

test('cada escolha na fogueira fica no diário e o presente é único após recarregar', async () => {
  for (const [c, key, recall] of [[0, 'memory', 'cheia'], [1, 'fear', 'medo'], [2, 'silence', 'silêncio']]) {
    const g = game(); await g.journeyHelpBridge(); g.choices.push(c);
    const frag = g.G.save.frag;
    await g.journeyCamp();
    assert.equal(g.journeyState().campChoice, key);
    assert.equal(g.G.save.fire.x, 441);
    assert.equal(g.G.save.frag, frag, 'o afeto não compra dano');
    assert.match(g.journeyJournalHTML(), new RegExp(recall));
    assert.equal(g.G.save.items.filter(id => id === 'no_da_margem').length, 1);
    const saved = JSON.parse(JSON.stringify(g.saves.at(-1)));
    g.G.save = saved; g.loadLevel('amazonia'); await g.journeyCamp();
    assert.equal(g.G.save.items.filter(id => id === 'no_da_margem').length, 1);
    assert.equal(g.G.P.kneel, false); assert.equal(g.G.flags.journeyQuiet, false);
  }
});

test('a marca da mão prepara a fala do chefe sem alterar os seis ecos', async () => {
  const g = game();
  await g.journeyShelter();
  assert.equal(g.journeyState().witnessedShelter, true);
  assert.equal(g.G.save.echoes.length, 0);
  assert.match(g.journeyBossIntro()[0][1], /marca no tronco/);
  assert.match(g.journeyJournalHTML(), /Nina/);
});

test('os dois desfechos voltam à margem, lembram a conversa e só então liberam a saída', async () => {
  for (const [choice, outcome] of [[0, 'poupar'], [1, 'purificar']]) {
    const g = game();
    Object.assign(g.journeyState(), { metDavi: true, metLia: true, bridgeHelped: true, campShared: true, campChoice: 'fear' });
    g.choices.push(choice, 1);
    const B = { kind: 'mapinguari', x: 2250, y: g.GY, w: 40, h: 84 };
    g.G.boss = B;
    await g.journeyMapinguariDown(B);
    assert.equal(g.G.save.harmony.mapinguari, outcome);
    assert.equal(g.G.save.frag, choice);
    assert.equal(g.G.save.act, 1, 'a vitória não salta o retorno às pessoas');
    assert.equal(g.G.lvl.id, 'amazonia'); assert.equal(g.G.lvl.arena.cleared, true);
    assert.equal(g.G.P.x, 440); assert.equal(g.G.boss, null);
    assert.equal(g.G.lvl.npcs.find(n => n.id === 'nina').x, choice === 0 ? 467 : 430);
    const aftermath = g.G.lvl.props.find(p => p.kind === 'journeyAftermath');
    assert.equal(g.groundY(aftermath.x), aftermath.y, 'a consequência aparece sobre o chão');
    assert.equal(g.G.lvl.ramps.some(r => aftermath.x >= r.x0 && aftermath.x <= r.x1), false, 'não fica escondida pela rampa');
    assert.equal(g.journeyState().returned, true);
    assert.equal(g.journeyState().stayAtMargin, true);
    assert.ok(g.dialogs.some(([, t]) => t.includes('Você disse que estava com medo')));
    if (choice === 0) assert.ok(g.dialogs.some(([, t]) => t.includes('passarinho')));
    else assert.ok(g.dialogs.some(([, t]) => t.includes('quieta de um jeito diferente')));
    const options = []; g.journeyInteractables((...args) => options.push(args));
    assert.ok(options.some(o => o[2] === 'Seguir para o Cerrado'));
    g.G.save.act = 2;
    const revisit = []; g.journeyInteractables((...args) => revisit.push(args));
    assert.equal(revisit.some(o => o[2] === 'Seguir para o Cerrado'), false, 'revisitar não pula outro ato');
  }
});

test('recarregar durante o retorno não repete boss, ganho de poder nem ajuda que não aconteceu', async () => {
  const g = game();
  g.G.save.harmony.mapinguari = 'purificar'; g.G.save.frag = 1;
  g.G.save.fire = { lvl: 'amazonia', x: 1925 };
  g.loadLevel('amazonia');
  assert.equal(g.G.save.fire.x, 441);
  assert.equal(g.G.lvl.arena.cleared, true);
  assert.equal(g.journeyNeedsReturn(), true);
  assert.equal(g.groundY(350), g.GY, 'a comunidade termina o reparo mesmo sem a tarefa');
  g.choices.push(1);
  await g.G.lvl.onStart(); await g.G.lvl.onStart();
  assert.equal(g.G.save.frag, 1);
  assert.equal(g.journeyState().bridgeHelped, undefined);
  assert.equal(g.G.save.items.includes('no_da_margem'), false);
  assert.equal(g.dialogs.filter(([, t]) => t.includes('O igarapé continua correndo')).length, 1);
});

test('o primeiro E da fogueira oferece convivência; depois volta ao descanso normal', async () => {
  const g = game(), f = g.G.lvl.fires.find(f => f.id === 'a1');
  assert.equal(g.journeyFireAction(f), false);
  await g.journeyHelpBridge();
  assert.equal(g.journeyFireAction(f), true);
  assert.ok(g.interactables().some(z => z.label === 'Sentar com Lia e Nina'));
  await g.journeyCamp();
  assert.equal(g.journeyFireAction(f), false);
});

test('Davi reencontra o jogador no fim do prólogo mesmo com um save antigo na fogueira', () => {
  const g = game(); g.G.save = g.newSave(); g.loadLevel('prologo');
  assert.equal(g.G.lvl.npcs[0].id, 'cacador');
  assert.equal(g.G.lvl.npcs[0].x, 142);
  g.G.P = g.makePlayer(620, g.GY); g.updateJourney(1 / 60);
  assert.equal(g.G.lvl.npcs[0].x, 1395);
});

test('novos objetos e passarela desenham os dois desfechos com coordenadas válidas', () => {
  const g = game();
  for (const outcome of [undefined, 'poupar', 'purificar']) {
    g.G.save.harmony.mapinguari = outcome; g.loadLevel('amazonia');
    for (const t of [0, 1, 5, 18]) {
      for (const p of g.G.lvl.props.filter(p => p.kind.startsWith('journey'))) g.drawJourneyProp(p, t, g.GY);
      const bridge = g.G.lvl.solids.find(s => s.kind === 'journeyBridge'); if (bridge) g.drawJourneyBridge(bridge);
    }
  }
  assert.ok(g.pixels.length > 1000);
});

test('ambiência reutiliza suas fontes e respeita menu, Som desligado e saída do capítulo', () => {
  const g = game(), gains = [], sources = [];
  let buffers = 0;
  const c = {
    sampleRate: 8000, currentTime: 0,
    createBuffer(_channels, size) { buffers++; return { getChannelData: () => new Float32Array(size) }; },
    createBufferSource() { const s = { connect() {}, start() {}, stop() {}, disconnect() {} }; sources.push(s); return s; },
    createBiquadFilter() { return { frequency: {}, Q: {}, connect() {}, disconnect() {} }; },
    createGain() { const gain = { value: 0, target: 0, setTargetAtTime(v) { assert.ok(Number.isFinite(v) && v >= 0); this.target = v; } }; gains.push(gain); return { gain, connect() {}, disconnect() {} }; },
  };
  g.AU.ctx = c; g.AU.master = {};
  for (let i = 0; i < 120; i++) { c.currentTime += 1 / 60; g.journeyAmbience(1 / 60); }
  assert.equal(buffers, 1); assert.equal(sources.length, 2);
  assert.ok(gains[1].target > 0, 'água audível perto do igarapé');
  assert.ok(g.AU.music.volume < 0.28, 'a música deixa espaço para o lugar');
  g.UI.menu = true; g.journeyAmbience(1 / 60);
  assert.ok(gains.every(v => v.target === 0));
  g.UI.menu = false; g.AU.on = false; g.journeyAmbience(1 / 60);
  assert.ok(gains.every(v => v.target === 0));
  g.G.state = 'title'; for (let i = 0; i < 200; i++) g.journeyAmbience(1 / 60);
  assert.ok(g.AU.journeyMix > 0.99, 'retorna ao volume normal fora do capítulo');
  assert.equal(sources.length, 2);
});

function region(g, id) {
  g.G.save.act = g.COMPANIONS[id].act; g.G.save.sub = null; g.G.save.fire = null;
  g.loadLevel(id); g.G.P = g.makePlayer(g.COMPANIONS[id].taskX - 5, g.groundY(g.COMPANIONS[id].taskX)); g.G.P.onG = true;
}
test('os quatro encontros dão identidade às formas e não repetem o presente ao recarregar', async () => {
  for (const id of ['cerrado', 'pantanal', 'caatinga', 'mata']) {
    const g = game(); region(g, id); const c = g.COMPANIONS[id];
    await g.companionMeet(id); await g.companionHelp(id); g.choices.push(1); await g.companionCamp(id);
    assert.equal(g.companionState(id).met, true); assert.equal(g.companionState(id).shared, true);
    assert.equal(g.G.save.forms.filter(f => f === c.form).length, 1);
    assert.equal(g.G.save.items.filter(i => i === c.item).length, 1);
    assert.equal(g.G.save.frag, 0); assert.match(g.journeyJournalHTML(), new RegExp(c.who));
    const saved = JSON.parse(JSON.stringify(g.saves.at(-1)));
    g.G.save = saved; g.loadLevel(id); await g.companionCamp(id);
    assert.equal(g.G.save.items.filter(i => i === c.item).length, 1);
    assert.equal(g.companionState(id).choice, c.choices[1].key);
    assert.equal(g.G.P.kneel, false); assert.equal(g.G.flags.journeyQuiet, false);
  }
});
test('os gestos mudam a canoa, a área de sombra e o crescimento persistente da muda', async () => {
  const g = game(); region(g, 'pantanal');
  assert.equal(g.groundY(407), 172);
  await g.companionHelp('pantanal');
  assert.equal(g.groundY(407), 145);
  assert.equal(g.G.lvl.solids.filter(s => s.companionBoat).length, 1);
  g.loadLevel('pantanal'); assert.equal(g.G.lvl.solids.filter(s => s.companionBoat).length, 1);
  region(g, 'caatinga');
  assert.equal(g.G.lvl.shade.some(s => s.companionShade), false);
  await g.companionHelp('caatinga');
  assert.ok(g.G.lvl.shade.some(s => s.companionShade && s.x <= 310 && s.x + s.w >= 310));
  g.loadLevel('caatinga'); assert.equal(g.G.lvl.shade.filter(s => s.companionShade).length, 1);
  region(g, 'mata'); await g.companionHelp('mata');
  g.updateJourney(40); assert.equal(g.companionState('mata').growth, 0.5);
  g.updateJourney(80); assert.equal(g.companionState('mata').growth, 1);
  const saved = JSON.parse(JSON.stringify(g.saves.at(-1))); g.G.save = saved; g.loadLevel('mata');
  assert.equal(g.companionState('mata').growth, 1);
  assert.ok(g.companionFinalMemory().some(([, t]) => t.includes('Celina')));
});
test('o calor respeita a cena de cooperação e volta a causar dano quando o jogador retoma o controle', () => {
  const g = game(); region(g, 'caatinga');
  g.G.P.form = 'cabaca'; g.G.P.hp = 40; g.G.heat = 100; g.G.lock = 1;
  for (let i = 0; i < 120; i++) g.updatePlayer(1 / 60);
  assert.equal(g.G.P.hp, 40);
  g.G.lock = 0; g.updatePlayer(1 / 60);
  assert.equal(g.G.P.hp, 35);
});
test('cada resposta nas conversas regionais fica no diário e volta no reencontro', async () => {
  for (const id of ['cerrado', 'pantanal', 'caatinga']) for (const choice of [0, 1]) {
    const g = game(); region(g, id); const c = g.COMPANIONS[id];
    await g.companionHelp(id); g.choices.push(choice); await g.companionCamp(id);
    g.G.save.harmony[c.boss] = choice ? 'purificar' : 'poupar'; g.G.save.frag = choice;
    await g.companionReturn(id);
    assert.equal(g.G.save.act, c.act); assert.equal(g.G.lvl.id, id); assert.equal(g.G.lvl.arena.cleared, true);
    assert.equal(g.companionState(id).returned, true); assert.equal(g.G.save.frag, choice);
    assert.ok(g.dialogs.some(([who, t]) => who === c.who && t === c.recall[c.choices[choice].key]));
    const opts = []; g.companionInteractables((...a) => opts.push(a));
    assert.ok(opts.some(a => a[2].startsWith('Seguir para')));
    g.G.save.act = c.act + 1; const visit = []; g.companionInteractables((...a) => visit.push(a));
    assert.equal(visit.some(a => a[2].startsWith('Seguir para')), false);
  }
});
test('retornos pendentes restauram o checkpoint e revisitar o Cerrado não pula a gruta', async () => {
  const g = game(); region(g, 'cerrado');
  g.G.save.harmony.capelobo = 'purificar'; g.G.save.frag = 1; g.G.save.fire = { lvl: 'cerrado', x: 1890 };
  g.loadLevel('cerrado'); assert.equal(g.G.save.fire.x, 325); assert.equal(g.companionPending('cerrado'), true);
  await g.G.lvl.onStart(); await g.G.lvl.onStart();
  assert.equal(g.G.save.frag, 1); assert.equal(g.companionState('cerrado').returned, true);
  g.G.save.sub = 'gruta'; g.loadLevel('cerrado');
  const opts = []; g.companionInteractables((...a) => opts.push(a));
  assert.equal(opts.some(a => a[2].startsWith('Seguir para')), false);
});
test('objetos dos novos lugares aparecem sobre chão firme antes e depois dos gestos', async () => {
  for (const id of ['cerrado', 'pantanal', 'caatinga', 'mata']) {
    const g = game(); region(g, id);
    for (const state of [0, 1, 2]) {
      if (state === 1) await g.companionHelp(id);
      if (state === 2) { g.G.save.harmony[g.COMPANIONS[id].boss] = 'poupar'; g.loadLevel(id); }
      for (const p of g.G.lvl.props.filter(p => p.kind.startsWith('journeyRegional'))) {
        assert.equal(g.groundY(p.x), p.y);
        for (const t of [0, 1, 7]) g.drawCompanionProp(p, t, p.y);
      }
    }
  }
});

async function advanceGame(g, dt) {
  g.G.rt += dt;
  for (const w of Array.from(g.G.waits)) if (w.fn ? w.fn() : (w.t -= dt) <= 0) { g.G.waits.splice(g.G.waits.indexOf(w), 1); w.res(); }
  if (g.G.state === 'play') g.update(dt);
  else if (g.G.state === 'scene') g.G.t += dt;
  // O navegador esvazia a fila de promises antes do próximo frame, inclusive cenas encadeadas.
  for (let i = 0; i < 64; i++) await Promise.resolve();
}
async function finishFlow(g, task) {
  let done = false, error;
  const completion = task.then(() => { done = true; }, e => { error = e; done = true; });
  for (let i = 0; i < 1200 && !done; i++) await advanceGame(g, 1 / 60);
  if (error) throw error;
  assert.equal(done, true, 'o fluxo concluiu a viagem');
  await completion;
}
test('derrotar o Mapinguari e escolher continuar leva ao Cerrado nos dois desfechos', async () => {
  for (const choice of [0, 1]) {
    const g = game();
    g.run('wait = realWait; waitUntil = realWaitUntil;');
    Object.assign(g.journeyState(), { metDavi: true, metLia: true, bridgeHelped: true, campShared: true, campChoice: 'fear' });
    g.G.P = g.makePlayer(2010, g.GY); g.G.P.form = 'zarabatana'; g.G.P.onG = true;
    const B = g.run("makeBoss('mapinguari', 2250)");
    B.hp = 0; B.st = 'down'; g.G.boss = B; g.G.lvl.arena.active = true;
    g.choices.push(choice, 0);
    await finishFlow(g, g.scene(() => g.STORY.bossDown(B)));
    assert.equal(g.G.lvl.id, 'cerrado'); assert.equal(g.G.save.act, 2);
    assert.equal(g.G.save.harmony.mapinguari, choice ? 'purificar' : 'poupar');
    assert.equal(g.G.save.frag, choice);
    assert.equal(g.journeyState().returned, true); assert.equal(g.journeyState().stayAtMargin, false);
    assert.equal(g.G.lock, 0); assert.equal(g.G.auto, 0); assert.equal(g.G.journeyDeparting, false);
    assert.ok(g.dialogs.some(([who]) => who === 'Lia'), 'mantém o reencontro antes de partir');
  }
});
test('um save que já venceu o Mapinguari oferece a continuação sem repetir a luta ou a recompensa', async () => {
  const g = game(); g.run('wait = realWait; waitUntil = realWaitUntil;');
  g.G.save.harmony.mapinguari = 'purificar'; g.G.save.frag = 1;
  g.journeyState().returned = true;
  g.G.save.fire = { lvl: 'amazonia', x: 1925 };
  g.choices.push(0);
  await finishFlow(g, g.scene(() => g.enterAct(1, { skipCard: true })));
  assert.equal(g.G.lvl.id, 'cerrado'); assert.equal(g.G.save.act, 2);
  assert.equal(g.G.save.frag, 1);
  assert.equal(g.dialogs.some(([who]) => who === 'Mapinguari'), false);
  assert.equal(g.G.lock, 0);
});
test('quem escolhe ficar pode usar a placa na rampa e a saída não avança dois atos', async () => {
  const g = game(); g.run('wait = realWait; waitUntil = realWaitUntil;');
  g.G.save.harmony.mapinguari = 'poupar';
  Object.assign(g.journeyState(), { returned: true, stayAtMargin: true });
  g.loadLevel('amazonia');
  assert.equal(g.journeyDeparturePending(), false);
  const exit = g.journeyExitLocation();
  const sign = g.G.lvl.props.find(p => p.kind === 'journeyExit');
  assert.equal(sign.x, exit.x); assert.equal(sign.y, exit.y);
  g.G.P = g.makePlayer(440, g.GY); g.G.P.form = 'zarabatana'; g.G.P.onG = true;
  g.I.down.right = true;
  for (let i = 0; i < 120 && g.G.P.x + 5 < exit.x; i++) await advanceGame(g, 1 / 60);
  g.I.down.right = false; g.run('checkInteract();');
  assert.equal(g.G.P.onG, true); assert.equal(g.G.interact.label, 'Seguir para o Cerrado');
  assert.ok(Math.abs(g.G.interact.y - (g.G.P.y + g.G.P.h)) < 2);
  const leave = g.G.interact.fn;
  await finishFlow(g, Promise.all([leave(), leave()]));
  assert.equal(g.G.lvl.id, 'cerrado'); assert.equal(g.G.save.act, 2);
  assert.equal(g.journeyState().stayAtMargin, false);
  assert.equal(g.G.lock, 0);
});
test('a chegada preserva posição, forma e passada, sem deslocar a captura lateralmente', async () => {
  for (const hz of [30, 60, 144]) {
    const g = game();
    g.run('wait = realWait; waitUntil = realWaitUntil;');
    g.G.arrivalSeed = { to: 'cerrado', form: 'zarabatana', ph: 120.12 };
    let done = false; const task = g.enterAct(2, { smooth: true, noToast: true }).then(() => { done = true; });
    assert.equal(g.G.P.x + 5 - g.G.cam.x, g.run('VIAGEM_PX'));
    assert.equal(g.G.P.form, 'zarabatana'); assert.equal(g.G.P.ph, 120.12);
    assert.equal(g.G.arriving, true); assert.equal(g.G.trans.kind, 'arrival');
    g.G.rt += 0.2; g.drawTransition();
    const overlay = g.images.filter(a => a[0] === g.transC).at(-1);
    assert.equal(overlay[1], 0); assert.equal(overlay[2], 0);
    for (let i = 0; i < hz * 3 && !done; i++) await advanceGame(g, 1 / hz);
    await task;
    assert.equal(g.G.arriving, false); assert.equal(g.G.auto, 0); assert.equal(g.G.lock, 0);
    assert.ok(g.G.P.x > 200 && g.G.P.x < 260);
  }
});
test('a captura de chegada usa outro canvas e restaura o desenho da tela mesmo se a captura falhar', () => {
  const g = game(), visible = g.run('ctx'), offscreenPixels = [];
  const offscreen = { save() {}, restore() {}, clearRect() {}, translate() {}, fillRect: (...a) => offscreenPixels.push(a) };
  g.transC.getContext = () => offscreen;
  g.run('drawTravel = () => ctx.fillRect(1, 2, 3, 4);');
  const before = g.pixels.length;
  g.captureTravelArrival({}, {}, 'amazonia', 'cerrado', [], 'zarabatana');
  assert.equal(offscreenPixels.length, 1); assert.equal(g.pixels.length, before);
  assert.equal(g.run('ctx'), visible);
  g.run('drawTravel = () => { throw Error("captura interrompida"); };');
  assert.throws(() => g.captureTravelArrival({}, {}, 'amazonia', 'cerrado', [], 'zarabatana'), /captura interrompida/);
  assert.equal(g.run('ctx'), visible);
});
test('a viagem completa e a viagem pulada terminam no bioma correto e conservam os gatilhos', async () => {
  for (const skip of [false, true]) {
    const g = game(); g.run('wait = realWait; waitUntil = realWaitUntil;');
    let done = false;
    const task = g.scene(() => g.nextAct()).then(() => { done = true; });
    let didSkip = false, sawArrival = false;
    for (let i = 0; i < 900 && !done; i++) {
      if (skip && !didSkip && g.G.state === 'scene' && i > 110) { g.I.pressed.confirm = true; didSkip = true; }
      await advanceGame(g, 1 / 60); g.I.pressed.confirm = false;
      if (g.G.arriving) {
        sawArrival = true;
        assert.equal(g.G.lvl.id, 'cerrado'); assert.equal(g.G.trans.kind, 'arrival');
        assert.equal(g.G.lvl.triggers.find(t => t.x === 216).done, false);
      }
    }
    assert.equal(done, true); await task;
    assert.equal(sawArrival, true); assert.equal(g.G.lvl.id, 'cerrado'); assert.equal(g.G.lock, 0);
    assert.equal(g.G.save.act, 2); assert.equal(g.G.auto, 0);
  }
});

test('todas as fronteiras mantêm a ordem dos atos, a gruta e a primeira cena do coração', async () => {
  for (const [from, to, act] of [['prologo', 'amazonia', 0], ['cerrado', 'gruta', 2], ['gruta', 'pantanal', 2], ['pantanal', 'caatinga', 3], ['caatinga', 'mata', 4], ['mata', 'coracao', 5]]) {
    const g = game(); g.run('wait = realWait; waitUntil = realWaitUntil;');
    g.G.save.act = act; g.G.save.sub = from === 'gruta' ? 'gruta' : null; g.G.save.ev.grutaIn = 1;
    g.loadLevel(from); for (const t of g.G.lvl.triggers) t.done = true;
    g.G.P = g.makePlayer(280, g.groundY(280)); g.G.P.form = 'zarabatana'; g.G.P.onG = true;
    let done = false, error;
    const task = g.scene(() => from === 'cerrado' ? g.enterGruta() : g.nextAct()).then(() => { done = true; }, e => { error = e; done = true; });
    let sawArrival = false;
    for (let i = 0; i < 700 && !done; i++) {
      await advanceGame(g, 1 / 60);
      if (g.G.arriving) { sawArrival = true; assert.equal(g.G.lvl.id, to); }
    }
    if (error) throw error;
    assert.equal(done, true, `${from} → ${to} terminou`); await task;
    assert.equal(sawArrival, true); assert.equal(g.G.lvl.id, to); assert.equal(g.G.lock, 0);
    assert.equal(g.G.save.sub, to === 'gruta' ? 'gruta' : null);
    assert.equal(g.G.save.act, to === 'gruta' ? 2 : act + 1);
    if (to === 'coracao') {
      assert.equal(g.G.lvl.triggers.find(t => t.x === 120).done, false);
      assert.equal(g.G.lvl.triggers.find(t => t.x === 240).done, false);
      assert.ok(g.G.P.x < 235, 'a chegada não atravessa a primeira entrega de forma');
    }
  }
});
