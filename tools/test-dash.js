'use strict';
// Regressões de movimento e invulnerabilidade, sem navegador nem dependências.
// Execute: node --test tools/test-dash.js
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = name => readFileSync(path.join(root, 'js', name), 'utf8');

function game() {
  const pixels = [];
  const stack = [], transforms = [];
  const ctx = { globalAlpha: 1, fillRect(...rect) { pixels.push([...rect, this.globalAlpha]); },
    save() { stack.push(this.globalAlpha); }, restore() { this.globalAlpha = stack.pop(); },
    translate(...v) { transforms.push(v); }, rotate(v) { transforms.push([v]); }, scale(...v) { transforms.push(v); } };
  ctx.beginPath = ctx.fill = ctx.stroke = () => {};
  ctx.drawImage = (source, ...v) => assert.ok(v.every(Number.isFinite));
  for (const method of ['ellipse', 'moveTo', 'lineTo']) ctx[method] = (...v) => assert.ok(v.every(Number.isFinite));
  const sandbox = vm.createContext({
    ctx, I: { down: {}, pressed: {} },
    document: { createElement: () => ({ getContext: () => ({ setTransform() {}, drawImage() {}, fillRect() {}, save() {}, restore() {}, createRadialGradient: () => ({ addColorStop() {} }) }) }) },
    SFX: new Proxy({}, { get: () => () => {} }),
  });
  const core = source('core.js');
  vm.runInContext(core.slice(core.indexOf('const W'), core.indexOf('const cv')) +
    core.slice(core.indexOf('const clamp'), core.indexOf('// ---------- Layout')) +
    core.slice(core.indexOf('function newSave()'), core.indexOf('function loadSave()')), sandbox);
  for (const file of ['itens.js', 'art.js', 'world.js', 'bosses.js']) {
    vm.runInContext(source(file), sandbox, { filename: file });
  }
  vm.runInContext("G.lvl = LV({ id: 'test', w: 2000, biome: 'prologo', act: 0 }).g(-1000, 2000); G.P = makePlayer(100, GY); G.P.onG = true; G.P.plat = G.lvl.solids[0];", sandbox);
  return { ...vm.runInContext('({ G, I, FORMS, startDash, updatePlayer, hurtPlayer, howlUpd, drawPlayer, drawHuman, SPEC })', sandbox), ctx, pixels, stack, transforms };
}

// Durações anteriores à troca da cambalhota, para detectar alterações no i-frame.
const durations = { espirito: 0.34, zarabatana: 0.42, arco: 0.34, lanca: 0.34, cabaca: 0.34, semente: 0.36 };

test('preserva a janela de dano das seis formas, com e sem Pena de gavião', () => {
  for (const [form, duration] of Object.entries(durations)) {
    for (const feather of [false, true]) {
      const { G, startDash, updatePlayer, hurtPlayer } = game();
      G.P.form = form;
      G.save.items = feather ? ['pena_gaviao'] : [];
      const expected = duration * (feather ? 1.05 : 0.85);
      startDash();
      assert.equal(G.P.inv, expected, `${form}, pena=${feather}`);
      let remaining = expected - 0.001;
      while (remaining > 0) { const dt = Math.min(remaining, 1 / 120); updatePlayer(dt); remaining -= dt; }
      assert.equal(hurtPlayer(10, 0), false, 'protegido até o fim da janela');
      updatePlayer(0.002);
      const y = G.P.y;
      assert.equal(hurtPlayer(10, 0), true, 'vulnerável após a janela');
      assert.equal(G.P.h, 22);
      assert.equal(G.P.y, y, 'sofrer dano não desloca o corpo verticalmente');
    }
  }
});

test('não encurta invulnerabilidade anterior e mantém o custo por ato', () => {
  const { G, startDash } = game();
  G.P.inv = 0.85;
  G.lvl.act = 3;
  startDash();
  assert.equal(G.P.inv, 0.85);
  assert.equal(G.P.st, 100 - 18 * 1.3);
  assert.equal(G.P.stDelay, 0.45);
});

test('avança imediatamente nos dois sentidos sem encolher o corpo ou prolongar o dash', () => {
  for (const f of [-1, 1]) {
    for (const dt of [1 / 30, 1 / 60, 1 / 144]) {
      const { G, FORMS, startDash, updatePlayer } = game();
      G.P.f = f;
      startDash();
      assert.equal(Math.sign(G.P.vx), f);
      const x = G.P.x;
      updatePlayer(dt);
      assert.ok((G.P.x - x) * f > 0);
      let elapsed = dt;
      while (G.P.state === 'dash' && elapsed < 1) { updatePlayer(dt); elapsed += dt; }
      assert.equal(G.P.state, 'normal');
      assert.ok(elapsed >= FORMS.espirito.dash.dur && elapsed < FORMS.espirito.dash.dur + dt + 1e-9);
      assert.equal(G.P.h, 22);
      assert.equal(G.P.y, 128);
    }
  }
});

test('continua bloqueado por paredes e passagens menores que o corpo', () => {
  for (const h of [120, 15]) {
    const { G, startDash, updatePlayer } = game();
    G.lvl.solids.push({ x: 125, y: 30 + (120 - h), w: 20, h, t: 'g' });
    startDash();
    for (let i = 0; i < 30; i++) updatePlayer(1 / 60);
    assert.ok(G.P.x + G.P.w <= 125);
    assert.equal(G.P.state, 'normal');
    assert.equal(G.P.h, 22);
  }
});

test('mantém um dash aéreo por salto e recupera a carga ao aterrissar', () => {
  const { G, I, updatePlayer } = game();
  G.P.y = 0; G.P.onG = false; G.P.plat = null;
  I.pressed.dodge = true;
  updatePlayer(1 / 60);
  assert.equal(G.P.state, 'dash');
  assert.equal(G.P.airDash, false);
  I.pressed.dodge = false;
  for (let i = 0; i < 24; i++) updatePlayer(1 / 60);
  assert.equal(G.P.onG, false);
  const stamina = G.P.st;
  I.pressed.dodge = true;
  updatePlayer(1 / 60);
  assert.equal(G.P.state, 'normal');
  assert.equal(G.P.st, stamina);
  I.pressed.dodge = false;
  for (let i = 0; i < 120 && !G.P.onG; i++) updatePlayer(1 / 60);
  assert.equal(G.P.onG, true);
  assert.equal(G.P.airDash, true);
  I.pressed.dodge = true;
  updatePlayer(1 / 60);
  assert.equal(G.P.state, 'dash');
});

test('respeita energia, habilidade desativada e bloqueio de controle', () => {
  for (const block of ['stamina', 'ability', 'lock']) {
    const { G, I, updatePlayer } = game();
    if (block === 'stamina') { G.P.st = 0; G.P.stDelay = 1; }
    if (block === 'ability') G.P.ab.dodge = false;
    if (block === 'lock') G.lock = 1;
    I.pressed.dodge = true;
    updatePlayer(1 / 60);
    assert.equal(G.P.state, 'normal', block);
  }
});

test('preserva a proteção específica contra o uivo do Capelobo', () => {
  const { G, startDash, howlUpd } = game();
  const howl = () => ({ x: G.P.x + 5, y: G.P.y + 11, r: 0, hit: false });
  startDash(); G.P.inv = 0;
  howlUpd(howl(), 0);
  assert.equal(G.P.hp, 100);
  G.P.state = 'normal';
  howlUpd(howl(), 0);
  assert.ok(G.P.hp < 100);
});

test('desenha todas as formas e rastros nos dois sentidos, restaurando a opacidade', () => {
  const { G, startDash, drawPlayer, ctx, pixels } = game();
  for (const form of Object.keys(durations)) {
    for (const f of [-1, 1]) {
      G.P.form = form; G.P.f = f;
      startDash();
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        G.P.stT = durations[form] * p;
        pixels.length = 0;
        drawPlayer(G.P, 0.1);
        assert.ok(pixels.some(pixel => pixel[4] > 0 && pixel[4] < 0.2), 'rastro translúcido');
        assert.ok(pixels.some(pixel => pixel[4] === 1), 'corpo visível');
        assert.ok(pixels.every(pixel => pixel.every(Number.isFinite)));
        assert.equal(ctx.globalAlpha, 1);
      }
    }
  }
});

test('animações importadas preservam a opacidade e não deixam transformações no próximo desenho', () => {
  const { drawHuman, SPEC, ctx, pixels, stack, transforms } = game();
  for (const kind of ['idle', 'run', 'dash', 'jump', 'fall', 'climb', 'kneel', 'hurt']) {
    ctx.globalAlpha = 0.6; pixels.length = 0; transforms.length = 0;
    drawHuman(ctx, 100, 150, -1, { kind, ph: 0.7, t: 1, p: 0.3, moving: true }, SPEC.arco);
    assert.equal(ctx.globalAlpha, 0.6); assert.equal(stack.length, 0);
    assert.ok(pixels.length > 0); assert.ok(pixels.every(p => p[4] <= 0.6));
    assert.ok(pixels.some(p => p[4] === 0.6), 'o corpo mantém sua opacidade');
    assert.ok(transforms.flat().every(Number.isFinite));
  }
});
