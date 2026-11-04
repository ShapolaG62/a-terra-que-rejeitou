'use strict';
// Renderização com mais detalhe: conserva tamanhos lógicos, recortes e reutilização das texturas.
// Execute: node --test tools/test-rendering.js
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const source = name => readFileSync(path.join(__dirname, '..', 'js', name), 'utf8');

function renderer() {
  const canvases = [], stats = { operations: 0 };
  function finite(name, args) {
    assert.ok(args.every(Number.isFinite), `${name} recebeu coordenadas inválidas: ${args}`);
    stats.operations++;
  }
  function canvas() {
    const c = { width: 300, height: 150 }, stack = [];
    const context = {
      canvas: c, globalAlpha: 1, draws: [], transforms: [], stack,
      setTransform(...a) { finite('setTransform', a); this.transforms.push(a); },
      drawImage(image, ...a) {
        assert.ok(image && image.width > 0 && image.height > 0, 'fonte de imagem válida');
        assert.ok([2, 4, 8].includes(a.length), 'assinatura válida de drawImage');
        finite('drawImage', a); this.draws.push([image, ...a]);
      },
      save() { stack.push({ alpha: this.globalAlpha }); },
      restore() { const s = stack.pop(); assert.ok(s, 'restore deve corresponder a save'); this.globalAlpha = s.alpha; },
      beginPath() {}, closePath() {}, clip() {}, fill() {}, stroke() {},
      createLinearGradient(...a) { return gradient('linear', a); },
      createRadialGradient(...a) { return gradient('radial', a); },
    };
    function gradient(name, args) {
      finite(name, args);
      return { addColorStop(k, color) { assert.ok(k >= 0 && k <= 1); assert.equal(typeof color, 'string'); } };
    }
    for (const name of ['fillRect', 'clearRect', 'strokeRect', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'translate', 'scale', 'rotate', 'arc', 'ellipse', 'rect']) {
      context[name] = (...a) => finite(name, a);
    }
    c.getContext = type => { assert.equal(type, '2d'); return context; };
    canvases.push(c); return c;
  }
  const sandbox = vm.createContext({
    document: { createElement(type) { assert.equal(type, 'canvas'); return canvas(); } },
    solidAt: () => false, groundY: () => 150,
    G: { save: { opened: {}, act: 2, look: 0 }, t: 0 },
  });
  const core = source('core.js');
  vm.runInContext(core.slice(core.indexOf('const W'), core.indexOf('const cv')) +
    core.slice(core.indexOf('const clamp'), core.indexOf('// ---------- Layout')), sandbox);
  vm.runInContext(source('art.js'), sandbox, { filename: 'art.js' });
  vm.runInContext(source('tiles.js'), sandbox, { filename: 'tiles.js' });
  // A paleta e o fundo da gruta também participam, sem carregar sua física e roteiro.
  const cave = source('gruta.js');
  vm.runInContext('const EYE = {};\n' + cave.slice(0, cave.indexOf('const GRUTA_CARD')), sandbox, { filename: 'gruta-art.js' });
  const world = source('world.js');
  vm.runInContext(world.slice(world.indexOf('function drawWorldAtmosphere'), world.indexOf('function drawSolid')) +
    world.slice(world.indexOf('function drawGrass'), world.indexOf('function drawEcho')), sandbox, { filename: 'world-art.js' });
  vm.runInContext('const [screen, ctx] = mk(W, H);', sandbox);
  return {
    canvas, canvases, stats,
    run: code => vm.runInContext(code, sandbox),
    ...vm.runInContext('({ renderContext, mk, ctx, screen, W, H, GY, biome, drawBackground, drawGroundSolid, drawPlatSolid, drawBlockSolid, drawCanopy, drawTreeTrunk, drawHangingVines, drawVinePiece, drawRampPiece, drawThornPiece, drawWorldAtmosphere, drawContactShadow, drawGrass })', sandbox),
  };
}

test('a resolução maior mantém o campo de visão e as coordenadas do mundo', () => {
  const g = renderer();
  assert.equal(g.W, 432); assert.equal(g.H, 243); assert.equal(g.GY, 150);
  assert.equal(g.screen.width, 864); assert.equal(g.screen.height, 486);
  assert.equal(g.screen.renderScale, 2);
  assert.deepEqual(g.ctx.transforms.at(-1), [2, 0, 0, 2, 0, 0]);
  assert.equal(g.ctx.imageSmoothingEnabled, false);
});

test('a luz difusa reutiliza a textura mesmo ao pulsar e restaura a opacidade', () => {
  const g = renderer(), before = g.canvases.length;
  g.ctx.globalAlpha = 0.37;
  for (let i = 0; i < 60; i++) g.run(`softGlow(ctx, 120, 100, ${20 + i / 10}, 35, '#ffb050', 0.3);`);
  assert.equal(g.canvases.length, before + 1, 'uma textura para todos os tamanhos da mesma luz');
  assert.equal(g.ctx.globalAlpha, 0.37); assert.equal(g.ctx.stack.length, 0);
  assert.equal(g.run('GLOW_CACHE.size'), 1);
  for (const c of g.canvases) assert.equal(c.getContext('2d').stack.length, 0);
});

test('imagens e capturas densas ocupam o tamanho lógico ao usar posição sem tamanho explícito', () => {
  const g = renderer(), dense = g.mk(432, 243)[0], original = { width: 18, height: 18 };
  g.ctx.drawImage(dense, -12.5, 6.25);
  assert.deepEqual(g.ctx.draws.at(-1), [dense, -12.5, 6.25, 432, 243]);
  g.ctx.drawImage(original, 2.5, 4);
  assert.deepEqual(g.ctx.draws.at(-1), [original, 2.5, 4, 18, 18]);
  const capture = g.mk(432, 243)[1];
  capture.drawImage(g.screen, 0, 0);
  assert.deepEqual(capture.draws.at(-1), [g.screen, 0, 0, 432, 243], 'a captura contém o quadro inteiro');
});

test('ampliações explícitas e recortes preservam destino, posição e proporção nas duas densidades', () => {
  const g = renderer();
  for (const scale of [1, 2]) {
    const image = g.canvas(); g.renderContext(image, 64, 48, scale);
    g.ctx.drawImage(image, 13, 17, 90, 60);
    assert.deepEqual(g.ctx.draws.at(-1), [image, 13, 17, 90, 60]);
    g.ctx.drawImage(image, 2.5, 3, 12, 9, -4.5, 7, 24, 18);
    assert.deepEqual(g.ctx.draws.at(-1), [image, 2.5 * scale, 3 * scale, 12 * scale, 9 * scale, -4.5, 7, 24, 18]);
  }
});

test('reconfigurar um canvas não aplica a escala duas vezes nos próximos recortes', () => {
  const g = renderer(), image = g.mk(40, 32)[0], destination = g.canvas();
  const a = g.renderContext(destination, 432, 243);
  const native = a.nativeDrawImage;
  const b = g.renderContext(destination, 432, 243, 3);
  assert.equal(a, b); assert.equal(b.nativeDrawImage, native);
  b.drawImage(image, 1, 2, 8, 10, 9, 11, 16, 20);
  assert.equal(b.draws.length, 1);
  assert.deepEqual(b.draws[0], [image, 2, 4, 16, 20, 9, 11, 16, 20]);
  assert.equal(destination.width, 1296); assert.equal(destination.height, 729);
});

test('fundos e texturas dos oito ambientes desenham com coordenadas finitas e reutilizam os caches', t => {
  const g = renderer();
  function frame(id, camera, time) {
    g.drawBackground(g.biome(id), camera, time);
    if (id !== 'gruta') g.drawWorldAtmosphere(id, g.biome(id), time);
    g.drawGroundSolid({ x: 0, y: 150, w: 760, h: 90 }, id, camera);
    for (const kind of ['earth', 'island', 'branch', 'flog']) g.drawPlatSolid({ x: 70, y: 104, w: kind === 'island' ? 26 : 40, kind }, id);
    g.drawBlockSolid({ x: 100, y: 125, w: 40, h: 25 }, id);
    g.drawTreeTrunk(180, 10, 24, id, 15);
    g.drawCanopy({ x: 150, w: 64, vines: 3 }, id, time);
    g.drawHangingVines({ x: 300 }, id, time);
    g.drawVinePiece({ x: 340, y0: 40, y1: 150 }, id, time);
    g.drawRampPiece({ x0: 370, y0: 150, x1: 430, y1: 126 }, id);
    g.drawThornPiece({ x0: 460, x1: 520, y: 150 }, id);
    g.drawContactShadow(120, 150, 10); g.drawContactShadow(200, 132, 22);
    g.drawGrass({ x: 100, w: 40 }, time, g.biome(id));
  }
  const ids = ['prologo', 'amazonia', 'cerrado', 'pantanal', 'caatinga', 'mata', 'coracao', 'gruta'];
  for (const id of ids) {
    for (const camera of [0, 20, 140, 280]) frame(id, camera, 0);
    const warmed = g.canvases.length;
    for (let i = 0; i < 12; i++) frame(id, [0, 20, 140, 280][i % 4], i / 10);
    assert.equal(g.canvases.length, warmed, `${id}: nenhum canvas novo a cada frame`);
  }
  assert.ok(g.stats.operations > 1000);
  for (const c of g.canvases) {
    assert.equal(c.renderScale, 2);
    assert.ok(Number.isFinite(c.width) && c.width > 0 && c.width <= 1600);
    assert.ok(Number.isFinite(c.height) && c.height > 0 && c.height <= 600);
    assert.equal(c.getContext('2d').stack.length, 0, 'estados de desenho são restaurados');
    assert.equal(c.getContext('2d').globalAlpha, 1, 'texturas, luzes e sombras restauram a opacidade');
  }
  const bytes = g.canvases.reduce((total, c) => total + c.width * c.height * 4, 0);
  assert.ok(bytes < 128 * 1024 * 1024, 'as cenas representativas dos oito ambientes cabem em 128 MiB de buffers RGBA');
  t.diagnostic(`${g.canvases.length} canvases em cache; ${(bytes / 1024 / 1024).toFixed(1)} MiB de buffers RGBA nas oito cenas`);
});
