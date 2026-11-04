'use strict';
// Poses dos bichos: a animação lê a IA e não modifica o corpo usado pela física.
// Execute: node --test tools/test-mob-animations.js
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const source = name => readFileSync(path.join(__dirname, '..', 'js', name), 'utf8');
const fauna = ['capivara', 'tatu', 'lobo', 'jaguatirica', 'tamandua', 'queixada', 'cobra', 'urubu'];

function renderer() {
  let pixels = [];
  const ctx = { globalAlpha: 1, fillStyle: '', fillRect(...a) {
    assert.ok(a.every(Number.isFinite), `pixel inválido: ${a}`);
    assert.ok(a.every(v => Number.isInteger(v * 2)), `pixel fora da grade fina: ${a}`);
    assert.ok(a[2] > 0 && a[3] > 0, 'pixel tem dimensões positivas');
    pixels.push([...a, this.fillStyle]);
  } };
  const sandbox = vm.createContext({ G: { lvl: { biome: 'cerrado' } }, drawCaveEnemy: () => false });
  const core = source('core.js');
  vm.runInContext(core.slice(core.indexOf('const W'), core.indexOf('const cv')) +
    core.slice(core.indexOf('const clamp'), core.indexOf('// ---------- Layout')), sandbox);
  vm.runInContext(source('art.js'), sandbox, { filename: 'art.js' });
  vm.runInContext(source('fauna.js'), sandbox, { filename: 'fauna.js' });
  const draw = vm.runInContext('drawEnemy', sandbox);
  return { frame(e, time) {
    pixels = []; const before = JSON.stringify(e);
    draw(ctx, e, 100, 150, time, '#ff6a3a');
    assert.equal(JSON.stringify(e), before, 'desenhar não altera IA, vida, hitbox ou posição');
    assert.equal(ctx.globalAlpha, 1, 'opacidade é preservada');
    assert.ok(pixels.length > 0, 'o bicho continua visível');
    return JSON.stringify(pixels);
  } };
}
function enemy(type, phase, p, f = 1) {
  return { type, x: 100, y: 128, hx: 100, w: 22, h: 22, hp: 10, f, vx: phase === 'move' ? 35 : 0, vy: 0,
    spd: 32, t: 1, gait: phase === 'move' ? p * Math.PI * 2 : 1, wind: 0, swing: 0, rec: 0,
    motion: { phase, progress: p, variant: type === 'tatu' ? 'roll' : 'sweep' } };
}

test('as oito espécies têm ao menos oito poses em movimento, preparação, ataque e recuperação', () => {
  const r = renderer();
  for (const type of fauna) for (const phase of ['move', 'windup', 'attack', 'recover']) for (const f of [-1, 1]) {
    const frames = new Set();
    for (let i = 0; i < 12; i++) {
      // O tempo fica parado nos golpes: a variação deve vir da fase da IA, sem depender da respiração.
      frames.add(r.frame(enemy(type, phase, i / 11, f), phase === 'move' ? i / 30 : 0.73));
    }
    assert.ok(frames.size >= 8, `${type} · ${phase} · direção ${f}: ${frames.size} poses`);
  }
});

test('repouso, alerta e estados legados desenham sem mudar colisão ou progresso', () => {
  const r = renderer();
  for (const type of fauna) for (const f of [-1, 1]) {
    for (const phase of ['idle', 'alert']) for (const t of [0, 0.2, 0.7, 1.8]) r.frame(enemy(type, phase, t / 2, f), t);
    for (const state of [{ wind: 0.3, windMax: 0.6 }, { swing: 0.12, swingMax: 0.3 }, { rec: 0.2, recMax: 0.7 }, { mode: 'aim' }, { st: 'leap' }]) {
      const e = enemy(type, 'idle', 0, f); delete e.motion; delete e.gait;
      Object.assign(e, state); r.frame(e, 0.7);
    }
  }
});

test('sombras genéricas também animam todas as fases nos dois sentidos', () => {
  const r = renderer();
  for (const type of ['crawler', 'flyer', 'spitter', 'brute', 'lanceiro', 'wolf']) for (const phase of ['idle', 'move', 'alert', 'windup', 'attack', 'recover']) {
    for (const f of [-1, 1]) for (let i = 0; i < 12; i++) r.frame(enemy(type, phase, i / 11, f), i / 30);
  }
});
