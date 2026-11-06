'use strict';
// Regras das conquistas e estatísticas, sem navegador. Execute: node --test tools/test-conquistas.js
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

function game(salvo = null) {
  const store = salvo ? { 'terra-que-rejeitou-perfil-v1': salvo } : {}, sons = [], saves = [];
  const el = () => ({ setAttribute() {}, appendChild() {}, className: '', innerHTML: '', style: {} });
  const sandbox = vm.createContext({
    Object, JSON, Math, Date, String,
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    document: { createElement: el, body: { appendChild() {} } }, setTimeout: () => 0,
    SFX: { echo: () => sons.push('echo') }, writeSave: () => saves.push(1),
    G: { exploring: false, save: { tempo: 0, mortes: 0, vig: 0, forc: 0, fol: 0, forms: ['espirito'], echoes: [], murals: [], harmony: {} } },
    FORM_ORDER: ['zarabatana', 'arco', 'lanca', 'cabaca', 'semente'], MURALS: { m1: {}, r1: {} },
  });
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'js', 'conquistas.js'), 'utf8') + '\nthis.CONQ = CONQ;', sandbox);
  return { CONQ: sandbox.CONQ, G: sandbox.G, store, sons, saves, tem: id => !!sandbox.CONQ.perfil().ach[id] };
}

test('zerar sem morrer dá Sem Morrer; com uma morte, não', () => {
  const a = game(); a.CONQ.fim(); assert.ok(a.tem('fim')); assert.ok(a.tem('semmorrer'));
  const b = game(); b.CONQ.morte(); b.CONQ.fim(); assert.ok(b.tem('fim')); assert.equal(b.tem('semmorrer'), false);
  assert.equal(b.CONQ.perfil().ultimasMortes, 1);
});

test('save antigo, sem registro de mortes, não ganha Sem Morrer', () => {
  const g = game(); g.G.save.semRegistro = true; g.CONQ.fim();
  assert.ok(g.tem('fim')); assert.equal(g.tem('semmorrer'), false); assert.equal(g.CONQ.perfil().menosMortes, null);
});

test('a Platina só vem com todas as outras, e vem sozinha', () => {
  const g = game(), ids = g.CONQ.LISTA.map(a => a[0]).filter(id => id !== 'platina');
  ids.slice(0, -1).forEach(id => g.CONQ.ganhar(id));
  assert.equal(g.tem('platina'), false);
  g.CONQ.ganhar(ids[ids.length - 1]);
  assert.ok(g.tem('platina'));
});

test('a exploração temporária não conta nada', () => {
  const g = game(); g.G.exploring = true;
  g.CONQ.ganhar('fim'); g.CONQ.morte(); g.CONQ.abate(); g.CONQ.tick(10); g.CONQ.fim();
  assert.equal(g.tem('fim'), false); assert.equal(g.G.save.mortes, 0); assert.equal(g.G.save.tempo, 0);
  assert.equal(g.CONQ.perfil().abates, 0); assert.equal(g.CONQ.perfil().zerou, 0);
});

test('o tempo soma no save, e o nível vem das histórias contadas', () => {
  const g = game(); g.CONQ.tick(1.5); g.CONQ.tick(2.5);
  assert.equal(g.G.save.tempo, 4);
  g.G.save.vig = 4; g.G.save.forc = 3; g.G.save.fol = 2; assert.equal(g.CONQ.nivelDe(g.G.save), 10);
  g.CONQ.checar(); assert.ok(g.tem('nivel10'));
  assert.equal(g.CONQ.tempoTxt(3725), '1h 02min 05s'); assert.equal(g.CONQ.tempoTxt(65), '1min 05s');
});

test('o caminho dos guardiões decide Pacto e Força, e o melhor tempo fica guardado', () => {
  const a = game(); for (const k of ['mapinguari', 'capelobo', 'paidomato', 'labatut']) a.G.save.harmony[k] = 'poupar';
  a.G.save.tempo = 300; a.CONQ.fim(); assert.ok(a.tem('pacto')); assert.equal(a.tem('forca'), false);
  a.G.save.tempo = 500; for (const k of ['mapinguari', 'capelobo', 'paidomato', 'labatut']) a.G.save.harmony[k] = 'purificar';
  a.CONQ.fim(); assert.ok(a.tem('forca'));
  assert.equal(a.CONQ.perfil().melhorTempo, 300); assert.equal(a.CONQ.perfil().ultimoTempo, 500); assert.equal(a.CONQ.perfil().zerou, 2);
});

test('o perfil sobrevive a recarregar a página', () => {
  const a = game(); a.CONQ.ganhar('ecos');
  const b = game(a.store['terra-que-rejeitou-perfil-v1']);
  assert.ok(b.tem('ecos')); assert.equal(b.sons.length, 0);
});
