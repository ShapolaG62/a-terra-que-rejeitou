'use strict';
// Execute: node --test tools/test-mapinguari.js
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = file => readFileSync(path.join(root, 'js', file), 'utf8');

function game() {
  const pixels = [], stack = [];
  const ctx = {
    globalAlpha: 1,
    fillRect(...rect) { pixels.push([...rect, this.globalAlpha]); },
    save() { stack.push(this.globalAlpha); },
    restore() { this.globalAlpha = stack.pop() ?? 1; },
    translate() {}, scale() {},
    beginPath() {}, fill() {}, stroke() {},
    ellipse(...a) { assert.ok(a.every(Number.isFinite)); },
    moveTo(...a) { assert.ok(a.every(Number.isFinite)); }, lineTo(...a) { assert.ok(a.every(Number.isFinite)); },
  };
  const sandbox = vm.createContext({
    ctx, I: { down: {}, pressed: {} },
    CONQ: new Proxy({}, { get: () => () => {} }), VFX: new Proxy({}, { get: () => () => {} }), SFX: new Proxy({}, { get: () => () => {} }),
    setTimeout() { throw new Error('Ataques do Mapinguari devem usar o tempo do jogo.'); },
    onBossDown() {},
  });
  const core = source('core.js');
  vm.runInContext(core.slice(core.indexOf('const W'), core.indexOf('const cv')) +
    core.slice(core.indexOf('const clamp'), core.indexOf('// ---------- Layout')) +
    core.slice(core.indexOf('function newSave()'), core.indexOf('function loadSave()')), sandbox);
  for (const file of ['itens.js', 'art.js', 'world.js', 'bosses.js', 'beasts.js', 'chefes.js']) {
    vm.runInContext(source(file), sandbox, { filename: file });
  }
  vm.runInContext(`
    floatText = () => {};
    G.lvl = LV({ id: 'test', w: 1200, biome: 'amazonia', act: 1 }).g(0, 1200).ar(100, 'mapinguari');
    G.lvl.arena.active = true;
    G.P = makePlayer(150, GY); G.P.onG = true; G.P.hp = 1000;
    G.boss = makeBoss('mapinguari', 300); G.boss.f = 1;
  `, sandbox);
  const api = vm.runInContext('({ G, BOSSES, DIFF, GY, AW, makeBoss, go, updateBoss, updateHazards, bossHurt, drawBoss, drawMapinguariWarnings, drawMapinguariFx })', sandbox);
  const tick = (dt = 1 / 120) => {
    api.G.P.inv = Math.max(0, api.G.P.inv - dt);
    api.G.t += dt;
    api.updateBoss(dt);
  };
  const advance = seconds => {
    let remaining = seconds;
    while (remaining > 1e-9) { const dt = Math.min(remaining, 1 / 120); tick(dt); remaining -= dt; }
  };
  const advanceAI = seconds => advance(seconds / api.DIFF.bossSpeed);
  const until = (predicate, seconds = 3) => {
    for (let t = 0; t < seconds && !predicate(); t += 1 / 120) tick();
    assert.ok(predicate(), `o estado esperado não foi atingido; atual=${api.G.boss?.st}`);
  };
  return { ...api, B: api.G.boss, ctx, pixels, tick, advance, advanceAI, until };
}

test('mantém vida e hitbox do guardião da Amazônia', () => {
  const { B, DIFF } = game();
  assert.equal(B.hp, Math.round(430 * DIFF.bossHp));
  assert.equal(B.hpMax, B.hp);
  assert.equal(B.w, 40);
  assert.equal(B.h, 84);
});

test('cada ataque tem preparação antes da execução e deixa uma recuperação', () => {
  for (const [warning, attack] of [['biteW', 'bite'], ['clawW', 'claw'], ['slamW', 'slam'], ['gasW', 'gas'], ['chargeW', 'charge']]) {
    const { B, G, go, advance, until } = game();
    B.contact = 0;
    G.P.x = B.x + 35;
    const hp = G.P.hp;
    go(B, warning, 0.65);
    advance(0.2);
    assert.equal(B.st, warning, warning);
    assert.equal(G.P.hp, hp, 'o aviso não inflige dano');
    assert.equal(G.hazards.length, 0, 'o aviso não cria perigos ativos');
    until(() => B.st === attack);
    assert.ok(B.stateDur > 0, attack);
    until(() => B.st === 'rec' || B.st === 'dazed');
    assert.ok(B.tt > 0, 'existe uma janela para contra-atacar');
  }
});

test('mordida e varrida atingem à frente nos dois sentidos e respeitam os i-frames', () => {
  for (const attack of ['bite', 'claw']) {
    for (const f of [-1, 1]) {
      for (const protectedPlayer of [false, true]) {
        const { B, G, go, until } = game();
        B.f = f; B.contact = 0;
        G.P.x = B.x + f * 35 - (f < 0 ? G.P.w : 0);
        G.P.inv = protectedPlayer ? 5 : 0;
        const hp = G.P.hp;
        go(B, attack, 0.6);
        until(() => B.st === 'rec');
        assert.equal(G.P.hp < hp, !protectedPlayer, `${attack}, direção=${f}, inv=${protectedPlayer}`);
      }
    }
  }
});

test('uma mordida não aplica dano repetido durante a mesma execução', () => {
  const { B, G, go, tick, until } = game();
  B.contact = 0; G.P.x = B.x + 35;
  go(B, 'bite', 0.6);
  until(() => G.P.hp < 1000);
  const hp = G.P.hp;
  for (let i = 0; i < 120 && B.st === 'bite'; i++) { G.P.inv = 0; tick(); }
  assert.equal(B.st, 'rec');
  assert.equal(G.P.hp, hp);
});

test('a pancada gera duas ondas na fase 1 e uma segunda pancada somente na fase 2', () => {
  for (const phase of [1, 2]) {
    const { B, G, go, advance, advanceAI, updateBoss } = game();
    B.phase = phase; B.contact = 0;
    go(B, 'slam', 1.3);
    advanceAI(0.25);
    assert.equal(G.hazards.filter(h => h.kind === 'mapShock').length, 2);
    const stateT = B.stateT;
    for (let i = 0; i < 120; i++) updateBoss(0);
    assert.equal(B.stateT, stateT, 'uma pausa não avança o ataque');
    assert.equal(G.hazards.filter(h => h.kind === 'mapShock').length, 2);
    advance(0.5);
    assert.equal(G.hazards.filter(h => h.kind === 'mapShock').length, phase === 2 ? 4 : 2);
  }
});

test('derrota interrompe a segunda pancada e remove os perigos inimigos', () => {
  const { B, G, go, advance, advanceAI, bossHurt, updateHazards } = game();
  B.phase = 2; B.contact = 0;
  go(B, 'slam', 1.3);
  advanceAI(0.25);
  assert.equal(G.hazards.length, 2);
  bossHurt(B, B.hpMax + 1, 1, { quiet: true });
  assert.equal(B.st, 'down');
  advance(0.7); updateHazards(1 / 60);
  assert.equal(G.hazards.length, 0);
});

test('as duas pancadas da segunda fase são consistentes a 30, 60 e 144 FPS', () => {
  for (const fps of [30, 60, 144]) {
    const { B, G, go, tick, DIFF } = game();
    B.phase = 2; B.contact = 0;
    go(B, 'slam', 1.3);
    for (let elapsed = 0; elapsed < 0.9 / DIFF.bossSpeed; elapsed += 1 / fps) tick(1 / fps);
    assert.equal(G.hazards.filter(h => h.kind === 'mapShock').length, 4, `${fps} FPS`);
  }
});

function gasGame() {
  const api = game();
  api.B.contact = 0; api.B.phase = 2;
  api.go(api.B, 'gasW', 0.01);
  api.until(() => api.G.hazards.some(h => h.kind === 'mapGas'));
  const h = api.G.hazards.find(hazard => hazard.kind === 'mapGas');
  h.t = 1; h.vx = 0;
  api.G.P.x = h.x + (h.w - api.G.P.w) / 2;
  api.G.P.y = h.y + (h.h - api.G.P.h) / 2;
  return { ...api, h };
}

test('gás respeita invulnerabilidade e bloqueio de cena, sem empilhar dano de nuvens', () => {
  const { G, h } = gasGame();
  const st = G.P.st, hp = G.P.hp;
  G.P.inv = 1;
  h.update(h, 0.1);
  assert.equal(G.P.st, st);
  assert.equal(G.P.slow, 0);
  assert.equal(G.P.stun, 0);
  G.P.inv = 0; G.lock = 1;
  h.update(h, 0.1);
  assert.equal(G.P.st, st);
  assert.equal(G.P.stun, 0);
  G.lock = 0;
  h.update(h, 0.1);
  assert.ok(G.P.st < st);
  assert.ok(G.P.slow > 0);
  assert.equal(G.P.hp, hp, 'o gás enfraquece o fôlego; não vira dano direto');
  assert.equal(G.hazards.filter(hazard => hazard.kind === 'mapGas').length, 1);
});

test('ondas e gás deixam de atuar quando o chefe muda ou é removido', () => {
  for (const kind of ['mapShock', 'mapGas']) {
    const api = kind === 'mapGas' ? gasGame() : game();
    if (kind === 'mapShock') { api.go(api.B, 'slam', 1.3); api.advanceAI(0.25); }
    assert.ok(api.G.hazards.some(h => h.kind === kind));
    api.G.boss = null;
    api.updateHazards(1 / 60);
    assert.equal(api.G.hazards.length, 0);
  }
});

test('as ondas baixas atingem no chão e podem ser evitadas com salto', () => {
  const { B, G, go, advanceAI, GY } = game();
  B.contact = 0;
  go(B, 'slam', 1.3); advanceAI(0.25);
  const h = G.hazards.find(hazard => hazard.kind === 'mapShock');
  h.vx = 0; h.t = 1;
  G.P.x = h.x; G.P.y = h.y - G.P.h - 1;
  const hp = G.P.hp;
  h.update(h, 0);
  assert.equal(G.P.hp, hp);
  G.P.y = GY - G.P.h;
  h.update(h, 0);
  assert.ok(G.P.hp < hp);
});

test('investida bate na borda da arena e deixa o chefe tonto', () => {
  const { B, G, AW, go, tick } = game();
  B.contact = 0; B.f = 1;
  B.x = G.lvl.arena.x0 + AW - 16 - B.w / 2 + 7;
  go(B, 'charge', 2);
  tick();
  assert.equal(B.st, 'dazed');
  assert.ok(B.tt > 0);
});

test('a segunda fase começa com rugido uma única vez abaixo de metade da vida', () => {
  const { B, go, tick } = game();
  B.hp = B.hpMax * 0.49;
  go(B, 'idle', 0.8); tick();
  assert.equal(B.phase, 2);
  assert.equal(B.st, 'roar');
  const time = B.tt;
  tick();
  assert.ok(B.tt < time, 'o rugido não reinicia a cada frame');
});

test('poses, avisos e efeitos desenham nos dois sentidos sem coordenadas inválidas', () => {
  const { B, G, go, drawBoss, drawMapinguariFx, ctx, pixels } = game();
  const states = ['idle', 'walk', 'biteW', 'bite', 'clawW', 'claw', 'slamW', 'slam', 'gasW', 'gas', 'chargeW', 'charge', 'roar', 'dazed', 'rec', 'down'];
  for (const phase of [1, 2]) for (const f of [-1, 1]) for (const state of states) for (const p of [0, 0.5, 1]) {
    B.phase = phase; B.f = f;
    go(B, state, 1); B.tt = 1 - p; B.stateT = p; B.t = 1 + p;
    pixels.length = 0;
    drawBoss(B); drawMapinguariFx();
    assert.ok(pixels.length > 0, state);
    assert.ok(pixels.every(pixel => pixel.every(Number.isFinite)), `${state}, fase=${phase}, direção=${f}`);
    assert.equal(ctx.globalAlpha, 1, state);
  }
  assert.ok(Array.isArray(G.bfx));
});

test('efeitos emitidos por ataques e perigos ativos renderizam sem coordenadas inválidas', () => {
  for (const attack of ['biteW', 'clawW', 'slamW', 'gasW', 'charge', 'roar']) {
    const { B, G, go, tick, advanceAI, until, drawMapinguariFx, pixels, ctx } = game();
    B.contact = 0;
    if (attack === 'roar') { B.hp = B.hpMax * 0.49; go(B, 'idle', 1); tick(); }
    else {
      go(B, attack, attack.endsWith('W') ? 0.01 : 2);
      if (attack.endsWith('W')) until(() => !B.st.endsWith('W'));
      advanceAI(0.16);
    }
    assert.ok(G.bfx.some(effect => effect.k.startsWith('map')), attack);
    for (const progress of [0, 0.5, 0.95]) {
      for (const effect of G.bfx) effect.t = effect.life * progress;
      pixels.length = 0;
      drawMapinguariFx();
      for (const hazard of G.hazards) { hazard.t = 1; hazard.draw(hazard); }
      assert.ok(pixels.length > 0, attack);
      assert.ok(pixels.every(pixel => pixel.every(Number.isFinite)), attack);
      assert.equal(ctx.globalAlpha, 1, attack);
    }
  }
});

test('efeitos da varrida expiram mesmo depois que o chefe é removido', () => {
  const { B, G, go, until, advanceAI, updateBoss, drawMapinguariFx, pixels } = game();
  go(B, 'clawW', 0.01);
  until(() => B.st === 'claw');
  advanceAI(0.12);
  assert.ok(G.bfx.some(effect => effect.k === 'mapClaw'), 'a varrida emite seu efeito real');
  G.boss = null;
  for (let i = 0; i < 120; i++) updateBoss(1 / 60);
  assert.equal(G.bfx.length, 0, 'efeitos antigos não congelam ao remover o chefe');
  pixels.length = 0;
  drawMapinguariFx();
  assert.equal(pixels.length, 0, 'não sobra um rastro congelado na tela');
});
