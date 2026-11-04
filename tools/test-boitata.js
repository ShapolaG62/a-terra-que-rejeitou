'use strict';
// Pose erguida, ataques e puzzle do Boitatá com as rotinas reais do jogo.
// Execute: node --test tools/test-boitata.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, 'js', file), 'utf8');

function game(spawnX = 310) {
  const delayed = [], hits = [], scenes = [];
  const sandbox = vm.createContext({
    I: { down: {}, pressed: {} },
    SFX: new Proxy({}, { get: () => () => {} }),
    BOSS_INTRO: {}, STORY: {}, hud: { cache: {} },
    setTimeout(fn) { delayed.push(fn); },
    showToast() {}, floatText() {}, onBossDown() {},
    scene(fn) { scenes.push(fn); },
  });
  const core = source('core.js');
  vm.runInContext(core.slice(core.indexOf('const W'), core.indexOf('const cv')) +
    core.slice(core.indexOf('const clamp'), core.indexOf('// ---------- Layout')) +
    core.slice(core.indexOf('function newSave()'), core.indexOf('function loadSave()')), sandbox);
  for (const file of ['itens.js', 'art.js', 'world.js', 'bosses.js', 'beasts.js']) {
    vm.runInContext(source(file), sandbox, { filename: file });
  }
  const cave = source('gruta.js');
  vm.runInContext(cave.slice(cave.indexOf('Object.assign(ET,'), cave.indexOf('function shellBlock')) +
    cave.slice(cave.indexOf('// ---------- Chefe: Boitatá'), cave.indexOf('STORY.boitataFreed =')), sandbox, { filename: 'boitata.js' });
  sandbox.spawnX = spawnX; sandbox.hits = hits;
  vm.runInContext(`
    floatText = () => {};
    G.lvl = LV({ id: 'test-boitata', w: 1200, biome: 'gruta', act: 2, cave: true }).g(0, 1200).ar(100, 'boitata');
    G.lvl.arena.active = true;
    G.P = makePlayer(180, GY); G.P.onG = true; G.P.hp = 1000;
    hurtPlayer = (...args) => { hits.push(args); return true; };
    G.boss = makeBoss('boitata', spawnX);
  `, sandbox);
  const api = vm.runInContext('({ G, GY, AW, DIFF, BOSSES, makeBoss, bossBox, updateBoss, bossHurt, go, breakSupport, boitataFreedTick })', sandbox);
  const tick = (dt = 1 / 120) => { api.G.t += dt; api.updateBoss(dt); };
  const until = (predicate, seconds = 4) => {
    for (let t = 0; t < seconds && !predicate(); t += 1 / 120) tick();
    assert.ok(predicate(), `estado esperado não atingido: ${api.G.boss.st}`);
  };
  return { ...api, B: api.G.boss, tick, until, hits, delayed, scenes };
}
function assertBody(B) {
  assert.ok([B.x, B.y].every(Number.isFinite), 'posição da cabeça finita');
  assert.equal(B.seg[0].x, B.x, 'cabeça acompanha o movimento horizontal no mesmo quadro');
  assert.equal(B.seg[0].y, B.y, 'cabeça acompanha a altura no mesmo quadro');
  for (const s of B.seg) assert.ok([s.x, s.y].every(Number.isFinite), 'todos os segmentos têm coordenadas válidas');
}

test('nasce erguido na posição solicitada, com corpo curvo e as três correntes', () => {
  for (const x of [265, 448]) {
    const g = game(x), { B, GY } = g;
    assert.equal(B.x, x); assert.equal(B.y, GY - 126); assertBody(B);
    assert.equal(B.seg.length, 40);
    assert.ok(Math.max(...B.seg.map(s => s.y)) - B.y > 90, 'o corpo desce da cabeça até perto do chão');
    assert.ok(new Set(B.seg.map(s => s.x)).size > 5, 'a silhueta tem uma curva lateral');
    assert.equal(B.w, 22); assert.equal(B.h, 16); assert.equal(B.contact, 14);
    assert.equal(B.inv, true); assert.equal(B.noAim, true); assert.equal(B.chains, 3);
    assert.equal(B.sup.filter(s => !s.broken).length, 3);
  }
});

test('idle move a cabeça e o contato junto ao corpo, sem uma hitbox invisível no chão', () => {
  const g = game(310), { B, G, GY, go, bossBox } = g;
  go(B, 'idle', 9); G.P.x = B.x - G.P.w / 2; G.P.y = GY - G.P.h;
  const x = B.x; g.tick();
  assert.notEqual(B.x, x, 'a aproximação normal continua ativa'); assertBody(B);
  assert.ok(bossBox(B).y + bossBox(B).h < G.P.y, 'contato acompanha a cabeça elevada');
  assert.equal(g.hits.length, 0, 'passar sob a cabeça erguida não toca uma hitbox antiga no chão');
});

test('avisos de investida e sopro abaixam a cabeça progressivamente antes de liberar o golpe', () => {
  for (const [warning, duration, next] of [['chargeW', 0.7, 'charge'], ['breathW', 0.8, 'rec']]) {
    const g = game(265), { B, G, GY, go } = g;
    if (warning === 'breathW') { B.chains = 1; B.sup[0].broken = B.sup[1].broken = true; }
    go(B, warning, duration); g.tick(0);
    const startY = B.y, heights = new Set([startY]);
    let lastY = startY;
    for (let i = 0; i < 200 && B.st === warning; i++) {
      g.tick(); heights.add(B.y);
      assert.ok(B.y >= lastY - 0.001, 'a preparação desce de forma contínua');
      assert.ok(B.y - lastY < 6, 'não há salto de altura entre poses');
      assertBody(B); lastY = B.y;
      if (B.st === warning) assert.equal(G.projs.length, 0, 'o aviso ainda não dispara');
    }
    assert.equal(B.st, next); assert.ok(heights.size > 6, 'há poses intermediárias na preparação');
    assert.equal(B.y, GY - 8, 'a cabeça chega à altura do golpe');
    if (warning === 'breathW') {
      const p = G.projs.find(p => p.kind === 'sopro'); assert.ok(p);
      assert.equal(p.y, B.y + 2); assert.equal(p.x, B.x + B.f * 16);
      assert.ok(p.y + p.h / 2 <= GY, 'o sopro passa acima do chão');
      assert.equal(p.vy, 0); assert.equal(Math.sign(p.vx), B.f);
    }
  }
});

test('bolas de fogo saem da cabeça elevada e conservam a trajetória até o chão', () => {
  const g = game(265), { B, G, GY, go } = g;
  go(B, 'fireW', 0.6); g.until(() => B.st === 'rec'); assertBody(B);
  const fire = G.projs.filter(p => p.kind === 'bfire'); assert.equal(fire.length, 3);
  assert.ok(B.y < GY - 80, 'a cabeça continua erguida no ataque de fogo');
  fire.forEach((p, i) => {
    const T = 0.9 + i * 0.15;
    assert.equal(p.y, B.y + 2); assert.equal(p.x, B.x + B.f * 16);
    assert.ok(Math.abs(p.y + p.vy * T + 0.5 * p.grav * T * T - GY) < 0.001);
    assert.ok(Math.abs(p.x + p.vx * T - (G.P.x + 5 + (i - 1) * 26)) < 0.001);
  });
});

test('subida, teto, mergulho e saída mantêm segmentos finitos e sincronizados', () => {
  const g = game(310), { B, GY, go } = g;
  B.chains = 2; B.rockCd = 100; B.sup.forEach(s => { s.broken = true; });
  go(B, 'climb', 0); B.path = null;
  g.until(() => B.st === 'crawl', 5); assertBody(B); assert.ok(B.y < 25);
  B.x = 300; B.y = 18; B.diveX = 300; go(B, 'diveW', 0.1);
  g.until(() => B.st === 'dive'); g.until(() => B.st === 'stun');
  assert.equal(B.y, GY - 8); assertBody(B);
  go(B, 'freed', 999); B.contact = 0; B.leaving = true;
  let previous = B.y;
  for (let i = 0; i < 720 && !B.gone; i++) { g.tick(); assertBody(B); assert.ok(B.y < previous); previous = B.y; }
  assert.equal(B.gone, true, 'a cauda inteira consegue sair pelo teto');
});

test('o puzzle conserva invulnerabilidade, raízes e libertação pela última corrente', () => {
  const g = game(310), { B, G, GY, bossHurt, breakSupport, go } = g;
  go(B, 'idle', 9); const hp = B.hp;
  assert.equal(bossHurt(B, 999, 1), false); assert.equal(B.hp, hp);
  breakSupport(B, B.sup[0]); assert.equal(B.chains, 2);
  breakSupport(B, B.sup[0]); assert.equal(B.chains, 2, 'não rompe a mesma corrente duas vezes');
  breakSupport(B, B.sup[1]); assert.equal(B.chains, 1); assert.equal(B.shield, true);
  const roots = G.ents.find(e => e.type === 'raizes'); assert.ok(roots); assert.equal(typeof roots.onDeath, 'function');
  const last = B.sup.find(s => !s.broken);
  G.projs.push({ kind: 'sopro', x: last.x, y: GY - 16, life: 2 });
  g.tick(); assert.equal(B.chains, 1, 'as raízes ainda protegem a última corrente');
  G.projs = []; roots.onDeath(); assert.equal(B.shield, false);
  G.projs.push({ kind: 'sopro', x: last.x, y: GY - 16, life: 2 });
  g.tick();
  assert.equal(B.chains, 0); assert.equal(B.st, 'freed'); assert.equal(B.contact, 0);
  assert.equal(G.projs.length, 0); assert.equal(G.hazards.length, 0); assert.equal(roots.hp, 0);
  assert.equal(g.scenes.length, 1, 'a cena de libertação é iniciada uma vez'); assertBody(B);
});
