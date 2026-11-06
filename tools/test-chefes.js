'use strict';
// Confere o jeito de cada chefe sem abrir o jogo: golpes e mortes próprios, e só efeitos que existem no pacote.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path'), vm = require('vm');

const raiz = path.join(__dirname, '..');
const ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');
const KINDS = ['lobo', 'mapinguari', 'capelobo', 'boitata', 'paidomato', 'labatut', 'corposeco'];

function carrega() {
  const jogados = [];
  const box = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)), hash: () => 0.5, rnd: () => 0, pick: l => l[0], part() {}, GY: 150,
    G: { cam: {} }, ctx: {}, cv: {}, W: 432, H: 243, renderContext: () => ({}),
    SFX: new Proxy({}, { get: () => () => {} }),
    VFX: { play: (id, x, y, o) => { jogados.push({ id, x, y, o }); return {}; }, splash() {} },
    Math, Object, console,
  };
  vm.createContext(box);
  vm.runInContext(ler('js/chefes.js') + '\nthis.CHEFES = CHEFES;', box);
  return { CHEFES: box.CHEFES, jogados };
}
const usados = () => { const m = ler('tools/build-vfx.mjs').match(/USED = \[([\s\S]*?)\];/)[1]; return new Set([...m.matchAll(/"([^"]+)"/g)].map(x => x[1])); };
const boss = kind => ({ kind, x: 100, y: 150, f: 1, t: 0, w: 30, h: 70, st: 'idle' });

test('cada chefe tem golpes e morte próprios', () => {
  const { CHEFES } = carrega();
  for (const k of KINDS) {
    assert.ok(Object.keys(CHEFES.GOLPES[k] || {}).length >= 2, k + ' sem golpes');
    assert.ok(CHEFES.MORTE[k], k + ' sem morte');
  }
  const corpos = KINDS.filter(k => k !== 'boitata').map(k => CHEFES.CORPO[k]);
  assert.ok(corpos.every(Boolean), 'falta o movimento de algum chefe');
});

test('todo efeito de golpe e de morte está no pacote, e as mortes não se repetem', () => {
  const { CHEFES, jogados } = carrega(), U = usados();
  const mortes = new Set();
  for (const k of KINDS) {
    for (const st of Object.keys(CHEFES.GOLPES[k])) CHEFES.GOLPES[k][st](boss(k));
    jogados.length;
  }
  for (const j of jogados) assert.ok(U.has(j.id), j.id + ' não está em USED');
  for (const k of KINDS) {
    const antes = jogados.length;
    const B = boss(k); B.st = 'down';
    CHEFES.comecaMorte(B);
    for (const j of jogados.slice(antes)) { assert.ok(U.has(j.id), j.id + ' não está em USED'); mortes.add(j.id); }
  }
  assert.strictEqual(mortes.size, KINDS.length - 1, 'o Corpo-seco toca a dele na cena final; os outros seis têm efeito próprio');
  assert.match(ler('js/story.js'), /terra\/morte-corposeco/);
  assert.ok(U.has('terra/morte-corposeco'));
});

test('morte só começa uma vez e os eventos correm na ordem', () => {
  const { CHEFES, jogados } = carrega();
  const B = boss('mapinguari');
  CHEFES.comecaMorte(B); CHEFES.comecaMorte(B);
  assert.strictEqual(jogados.length, 1);
  B.t = 1; CHEFES.tick(B, 0.016);
  assert.strictEqual(B.evento, 1);
  assert.strictEqual(CHEFES.pose(B), 'kneel');
});

test('o Canoeiro joga água, com a mesma força de antes', () => {
  const w = ler('js/world.js');
  assert.match(w, /lanca:[^\n]*shot: \{ dmg: 9, spd: 260, kind: 'jato', grav: 60 \}/);
  assert.match(w, /p\.kind === 'jato'/);
  assert.match(ler('js/art.js'), /sh === 'jato'/);
});

test('nenhum efeito do pacote quebra ao rodar, e o selo funciona em cipós de qualquer altura', () => {
  const box = { console, Math, performance: { now: () => 0 } }; box.globalThis = box; vm.createContext(box);
  vm.runInContext(ler('js/pixelfx.bundle.js') + '\nthis.PXFX = PXFX;', box);
  const { createFrame, createFx, fx: LIB } = box.PXFX;
  const roda = (id, o) => { const f = createFrame(432, 243, 0, 0), e = createFx(LIB[id], { seed: 3, x: 200, y: 180, ...o }); for (let i = 0; i < 90; i++) { e.update(1 / 30); e.draw(f); } };
  for (const id of Object.keys(LIB)) assert.doesNotThrow(() => roda(id, {}), id);
  for (const height of [12, 20, 30, 40, 46, 60, 90, 140]) assert.doesNotThrow(() => roda('terra/selo', { height }), 'selo com altura ' + height);
});

test('a água não se anima sozinha, e as pinturas ficam espalhadas pela gruta', () => {
  assert.doesNotMatch(ler('js/vfx.js'), /water\/ripples/);
  assert.ok(!usados().has('water/ripples'));
  assert.ok(usados().has('terra/fogueira'));
  const xs = [...ler('js/gruta.js').matchAll(/\.mural\((\d+), 'm[1-6]'\)/g)].map(m => +m[1]);
  assert.strictEqual(xs.length, 6);
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 200, 'pinturas juntas demais: ' + xs);
});

test('o início não tem mais a tela do emblema, e todas as saídas têm placa', () => {
  assert.doesNotMatch(ler('index.html'), /start-emblem|introStart/);
  assert.doesNotMatch(ler('js/intro.js'), /introStart|bIntroPlay/);
  const j = ler('js/journey.js');
  for (const nome of ['Pantanal', 'Caatinga', 'Mata Atlântica', 'Cerrado']) assert.match(j, new RegExp("'" + nome + "'"));
});

test('as conversas não usam o filtro lento nem podem prender o jogo', () => {
  const s = ler('js/story.js');
  assert.doesNotMatch(s, /ctx\.filter/);
  assert.match(s, /function dialogTick\(dt\) \{\n?\r?\n?\s*if \(!DQ\) \{ closeDialog\(\); return; \}/);
  assert.match(s, /w\.t -= \(DQ \|\| UI\.menu \? 0 : dt\)/);
});
