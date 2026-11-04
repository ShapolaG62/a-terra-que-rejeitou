'use strict';
// IA e poses subterrâneas com a física real; não usa relógio ou navegador.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');

function game() {
  const pixels = [], hits = [], ctx = { fillRect(...p) { assert.ok(p.every(Number.isFinite)); pixels.push([...p, this.fillStyle]); } };
  const sandbox = vm.createContext({ ctx, I: { down: {}, pressed: {} }, SFX: new Proxy({}, { get: () => () => {} }),
    document: { createElement: () => ({ getContext: () => ({ setTransform() {}, drawImage() {}, fillRect() {}, createRadialGradient: () => ({ addColorStop() {} }) }) }) }, hits });
  const core = source('core.js');
  vm.runInContext(core.slice(core.indexOf('const W'), core.indexOf('const cv')) +
    core.slice(core.indexOf('const clamp'), core.indexOf('// ---------- Layout')) +
    core.slice(core.indexOf('function newSave()'), core.indexOf('function loadSave()')), sandbox);
  for (const f of ['itens.js', 'art.js', 'world.js']) vm.runInContext(source(f), sandbox, { filename: f });
  const cave = source('gruta.js');
  vm.runInContext(cave.slice(cave.indexOf('Object.assign(ET,'), cave.indexOf('function shellBlock')) +
    cave.slice(cave.indexOf('function drawCaveEnemy'), cave.indexOf('// ---------- Chefe:')), sandbox);
  vm.runInContext(`
    G.lvl = LV({ id: 'test', biome: 'gruta', act: 0, w: 1000 }).g(0, 1000);
    G.P = makePlayer(180, GY); G.P.onG = true; G.state = 'play'; G.torchOut = 0;
    hurtPlayer = (...a) => { hits.push(a); return false; };
    floatText = () => {};
  `, sandbox);
  const api = vm.runInContext('({ G, CAVE_AI, makeEnemy, drawCaveEnemy })', sandbox);
  function mob(type, x = 120, y) { const e = api.makeEnemy(type, x, y); e.onG = !['morcego'].includes(type); return e; }
  function tick(e, dt) {
    api.G.t += dt; e.t += dt;
    const dx = api.G.P.x + 5 - (e.x + e.w / 2), dy = api.G.P.y + 11 - (e.y + e.h / 2);
    api.CAVE_AI[e.type](e, dt, dx, dy);
    assert.ok([e.x, e.y, e.vx, e.vy, e.motion.progress].every(Number.isFinite));
  }
  function until(e, predicate, hz = 60, seconds = 6) {
    let t = 0; while (!predicate() && t < seconds) { tick(e, 1 / hz); t += 1 / hz; }
    assert.ok(predicate(), `estado esperado, atual=${e.mode}`); return t;
  }
  return { ...api, mob, tick, until, pixels, hits };
}

test('sapo prepara o salto antes de sair do chão e deixa recuperação nas três taxas de quadros', () => {
  for (const hz of [30, 60, 144]) {
    const g = game(), e = g.mob('sapo');
    const elapsed = g.until(e, () => e.mode === 'leap', hz);
    assert.ok(elapsed >= 0.85 && elapsed < 1, `preparação em ${hz} FPS: ${elapsed}`);
    assert.equal(e.contactHit, false); assert.ok(e.vy < 0);
    g.until(e, () => e.mode === 'tongueW', hz);
    assert.equal(e.noTouch, true); assert.equal(g.hits.length, 0);
    g.until(e, () => e.mode === 'recover', hz);
    assert.equal(e.noTouch, true); assert.equal(e.tongue, 0);
  }
});

test('morcego anuncia e fixa o alvo no lançamento, deixando o jogador desviar', () => {
  const g = game(), e = g.mob('morcego', 120, 40);
  g.until(e, () => e.mode === 'aim');
  assert.equal(e.noTouch, true);
  g.until(e, () => e.mode === 'dive');
  const vx = e.vx, vy = e.vy;
  g.G.P.x = 20;
  for (let i = 0; i < 5; i++) { g.tick(e, 1 / 60); assert.equal(e.vx, vx); assert.equal(e.vy, vy); }
  g.until(e, () => e.mode === 'recover');
  assert.equal(e.noTouch, true); assert.equal(g.G.torchOut, 0);
});

test('lacraia escuta, emerge, acelera e prepara a investida sem causar dano na perseguição', () => {
  const g = game(), e = g.mob('lacraia');
  g.tick(e, 1 / 60); assert.equal(e.mode, 'hide'); assert.equal(e.noTouch, true);
  e.hear(180); assert.equal(e.mode, 'alert');
  g.until(e, () => e.mode === 'hunt');
  g.tick(e, 1 / 60); assert.ok(e.vx > 0 && e.vx < e.spd); assert.equal(e.noTouch, true);
  g.until(e, () => e.mode === 'coil');
  assert.equal(e.noTouch, true);
  g.until(e, () => e.mode === 'lunge'); assert.equal(e.contactHit, false);
  g.tick(e, 1 / 60); assert.equal(e.noTouch, false);
  g.until(e, () => e.mode === 'recover'); assert.equal(e.noTouch, true);
  assert.ok(g.G.parts.length < 15, 'a poeira usa intervalo, sem emissão a cada quadro');
});

test('besouro leva tempo para virar e pode ser distraído pelo som', () => {
  const g = game(), e = g.mob('besouro');
  e.f = 1; g.G.P.x = 200; g.tick(e, 1 / 60);
  e.hear(70); g.tick(e, 1 / 60);
  assert.equal(e.mode, 'turn'); assert.equal(e.f, 1);
  for (let i = 0; i < 15; i++) g.tick(e, 1 / 60);
  assert.equal(e.f, 1); assert.equal(e.shell, false); assert.equal(e.noTouch, true);
  g.until(e, () => e.mode !== 'turn');
  assert.equal(e.f, -1);
});

test('a língua tenta acertar uma única vez mesmo quando a invulnerabilidade bloqueia', () => {
  const g = game(), e = g.mob('sapo');
  g.tick(e, 1 / 60); e.mode = 'tongue'; e.st = e.caveDur = 0.4; e.hitT = false; e.f = 1; g.G.P.x = 140;
  g.until(e, () => e.mode === 'recover');
  assert.equal(g.hits.length, 1); assert.equal(e.noTouch, true);
});

test('cenas congelam a ação e o dano dos quatro bichos', () => {
  for (const type of ['lacraia', 'morcego', 'sapo', 'besouro']) {
    const g = game(), e = g.mob(type, 120, type === 'morcego' ? 40 : undefined);
    g.tick(e, 1 / 60); const x = e.x, y = e.y, state = e.mode;
    g.G.lock = 1;
    for (let i = 0; i < 60; i++) g.tick(e, 1 / 60);
    assert.equal(e.x, x); assert.equal(e.y, y); assert.equal(e.mode, state); assert.equal(e.noTouch, true);
    assert.equal(g.hits.length, 0);
  }
});

test('preparações têm poses intermediárias em pixel art e coordenadas válidas', () => {
  for (const [type, mode] of [['lacraia', 'coil'], ['morcego', 'aim'], ['sapo', 'crouch'], ['besouro', 'brace']]) {
    const g = game(), e = g.mob(type), poses = new Set();
    e.mode = mode; e.motion = { phase: 'windup', progress: 0, variant: type }; e.vx = 0;
    for (let i = 0; i < 12; i++) {
      e.motion.progress = i / 11; g.pixels.length = 0;
      g.drawCaveEnemy({ fillRect(...p) { assert.ok(p.every(Number.isFinite)); g.pixels.push([...p, this.fillStyle]); } }, e, 120, 150, 1);
      poses.add(JSON.stringify(g.pixels));
    }
    assert.ok(poses.size >= 6, `${type}: ${poses.size} poses distintas`);
  }
});
