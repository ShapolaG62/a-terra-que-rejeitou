'use strict';
// Gruta dos Antigos (Região 04, entre o Cerrado e a Caatinga), seguindo o documento de design:
// escuridão e tocha, inimigos guiados pelo som, pinturas rupestres que despertam com o fogo, o Boitatá
// Encarcerado (vence quem quebra as correntes, não quem mata) e o Olho de Fogo Frio, que purifica os
// Cipós-de-Sangue espalhados pelo mundo e abre caminhos em regiões já visitadas.

// ---------- Paleta e fundo ----------
TPAL.gruta = { moss: ['#2a3a34', '#3a5248', '#5a8a6a'], soil: ['#2a221e', '#1c1714', '#3a2e28'], stone: ['#4a4038', '#625448', '#2e2722'], root: ['#3a2a22', '#523a2c', '#6a4a36'], bark: ['#3a2c22', '#523e30', '#241a14'], fern: ['#2a4038', '#3a5a4a', '#5a8a6a'], thorn: ['#5a2a2a', '#c8603a', '#2a1010'], deep: '#0e0b0a', leaf: ['#22302a', '#304438', '#46604c'], vine: ['#3a2a22', '#5a3a2a'], out: '#08060a', corrupt: '#1a0a0a' };
EYE.gruta = '#ff9a3a';
BIOME_BUILD.gruta = function () {
  const r = seeded(404);
  const [sky, s] = mk(W, H); bands(s, ['#0a0808', '#100c0b', '#16110f', '#1c1613', '#201915', '#241c17'], 0, 180, W);
  const spike = (c, x, w2, h2, top, col) => { for (let k = 0; k < h2; k++) rect(c, x + k * w2 / h2 / 2, top ? k : 164 - k, w2 * (1 - k / h2), 1, col); };
  const [far, b] = mk(LW, H);
  for (let i = 0; i < 40; i++) spike(b, r() * LW, 4 + r() * 12, 10 + r() * 40, true, '#1e1814');
  for (let i = 0; i < 7; i++) rect(b, r() * LW, 0, 10 + r() * 14, 160, '#1a1512');
  for (let i = 0; i < 30; i++) spike(b, r() * LW, 6 + r() * 14, 8 + r() * 26, false, '#1e1814');
  rect(b, 0, 150, LW, 30, '#1a1512');
  const [mid, m] = mk(LW, H);
  for (let i = 0; i < 22; i++) { const x = r() * LW, w2 = 8 + r() * 20, h2 = 16 + r() * 50; for (let k = 0; k < h2; k++) rect(m, x + k * w2 / h2 / 2, k, w2 * (1 - k / h2), 1, k % 7 === 0 ? '#2e2620' : '#251e19'); }
  for (let i = 0; i < 16; i++) { const x = r() * LW, y = 60 + r() * 90; rect(m, x, y, 1, 2, '#5a8a7a'); rect(m, x + 1, y + 1, 1, 1, '#8ad0b0'); }
  for (let i = 0; i < 20; i++) spike(m, r() * LW, 10 + r() * 30, 10 + r() * 30, false, '#221b16');
  return { sky, layers: [{ c: far, f: 0.06 }, { c: mid, f: 0.18 }], mist: '#3a2e28', ground: { top: '#5a4a3e', fill: '#1c1714', dark: '#0e0b0a', speck: '#2a221e', plat: '#3a2e28' }, motes: '#8a7a6a' };
};
const GRUTA_CARD = ['Região IV', 'Gruta dos Antigos', 'O Boitatá', 'O lugar onde a Terra guarda aquilo que os homens tentaram esquecer.'];

// ---------- Estado do mundo (save): selos abertos, pinturas vistas, eventos ----------
function SV() { const s = G.save; s.gates = s.gates || []; s.murals = s.murals || []; s.seenGates = s.seenGates || []; s.ev = s.ev || {}; return s; }
function gateOpen(id) { return SV().gates.includes(id); }
// ao carregar uma fase: selos fechados viram parede, atalhos abertos viram ponte
function applyWorldState(L) {
  for (const g of L.gates) if (!gateOpen(g.id) && g.solid) L.solids.push({ x: g.x - g.w / 2, y: g.y - g.h, w: g.w, h: g.h, t: 'g', block: true, vis: 'none', gateId: g.id });
  for (const b of L.bridges) if (gateOpen(b.id)) L.solids.push({ x: b.x0, y: b.y, w: b.x1 - b.x0, h: 4, t: 'p', kind: 'branch' });
}
const GATES_INFO = {
  amazonia_templo: 'Amazônia · Templo Selado', amazonia_arvore: 'Amazônia · Árvore Oca', cerrado_raizes: 'Cerrado · Raízes Mortas',
  gruta_setima: 'Gruta · Salão das Memórias', gruta_rio: 'Gruta · Rio Sepultado', gruta_saida: 'Gruta · Santuário da Última Brasa', caatinga_altar: 'Caatinga · Altar das Cinzas',
};
const MURALS = {
  m1: { n: 'I · A Harmonia', s: 'um corpo volta ao solo, e dele nasce uma planta' },
  m2: { n: 'II · A Grande Seca', s: 'os rios somem; alguém se ajoelha diante de quem caiu' },
  m3: { n: 'III · A Súplica', s: 'o homem estende os braços; as raízes oferecidas são arrancadas' },
  m4: { n: 'IV · A Ruptura', s: 'o círculo se quebra; criaturas de luz são presas' },
  m5: { n: 'V · O Fogo Aprisionado', s: 'uma serpente luminosa é arrastada para baixo da montanha' },
  m6: { n: 'VI · O Rejeitado', s: 'as raízes se afastam do cadáver, que se ergue deformado' },
  m7: { n: 'VII · A Sétima Pintura', s: 'ele ainda humano, dentro do círculo... e um pedaço arrancado da pedra' },
  r1: { n: 'Ruínas · O Guardião Peludo', s: 'o Mapinguari caminha à frente do primeiro povo, afastando quem derruba' },
  r2: { n: 'Ruínas · A Boca que Canta', s: 'a boca do ventre canta; as árvores crescem em volta dela' },
};
const MURAL_ORDER = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'];
function caveJournalHTML() {
  const s = SV();
  if (!s.murals.length && !s.seenGates.length) return '';
  const pm = MURAL_ORDER.map(id => { const has = s.murals.includes(id); return `<div class="e ${has ? '' : 'no'}"><b>${has ? 'Pintura ' + MURALS[id].n : '???'}</b><span>${has ? MURALS[id].s : 'Uma pintura ainda não vista à luz da tocha.'}</span></div>`; }).join('');
  const extra = ['r1', 'r2'].filter(id => s.murals.includes(id)).map(id => `<div class="e"><b>${MURALS[id].n}</b><span>${MURALS[id].s}</span></div>`).join('');
  const gs = s.seenGates.map(id => `<div class="e ${gateOpen(id) ? '' : 'no'}"><b>${GATES_INFO[id] || id}</b><span>${gateOpen(id) ? 'purificado pelo fogo frio' : s.cold ? 'o fogo frio pode abrir · viaje por uma fogueira' : 'Cipós-de-Sangue: a lança e o arco não abrem'}</span></div>`).join('');
  return `<h2 style="margin-top:16px">Pinturas da gruta (${s.murals.filter(id => id[0] === 'm').length}/7)</h2><div class="journal">${pm}${extra}</div>` + (gs ? `<h2 style="margin-top:16px">Selos encontrados</h2><div class="journal">${gs}</div>` : '');
}

// ---------- Viagem rápida pelas fogueiras (depois do Olho de Fogo Frio) ----------
const TRAVEL = [['amazonia', 'Amazônia', 1], ['cerrado', 'Cerrado', 2], ['gruta', 'Gruta dos Antigos', 2], ['caatinga', 'Caatinga', 4]];
async function travelMenu() {
  const home = homeLevel(), here = G.lvl.id;
  const opts = TRAVEL.filter(([id, , a]) => id !== here && (id === home || G.save.act > a || (id === 'gruta' && SV().ev.boitata)));
  if (home !== here && !opts.some(o => o[0] === home)) opts.unshift([home, 'Voltar à jornada', 0]);
  const html = `<h2>Viajar</h2><p>O fogo frio liga as fogueiras já acesas.</p><div class="btns">${opts.map(([id, nome]) => `<button class="btn" data-act="${id}">${id === home ? 'Voltar à jornada · ' + (id === 'gruta' ? 'Gruta' : CARDS[ACTS.indexOf(id)][1]) : nome}</button>`).join('')}<button class="btn" data-act="back">Ficar</button></div>`;
  const a = await menu(html);
  return a === 'back' ? null : a;
}
async function travelTo(id, x) {
  snapshotScene();
  const form = G.P.form;
  loadLevel(id);
  // visita: o guardião já foi vencido e as cenas já aconteceram
  if (id !== homeLevel()) { if (G.lvl.arena) G.lvl.arena.cleared = true; for (const t of G.lvl.triggers) if (!t.visit) t.done = true; }
  const f0 = G.lvl.fires[0], px = x != null ? x : f0 ? f0.x + 16 : G.lvl.start;
  G.P = makePlayer(px, groundY(px)); G.P.form = form;
  if (x == null && f0) { G.save.fire = { lvl: id, x: f0.x }; G.save.lit[f0.id] = 1; }
  writeSave();
  G.cam.x = clamp(px - W / 2, 0, G.lvl.w - W); G.state = 'play'; $('#hud').hidden = false; updateHudForm(); hud.cache = {};
  startBlend(); showToast(G.lvl.name, '', 2.4);
}

// ---------- Selos de Cipós-de-Sangue ----------
function caveInteractables(add) {
  const L = G.lvl;
  for (const g of L.gates) if (!gateOpen(g.id) && g.dis == null) add(g.x, g.y, G.save.cold ? 'Purificar com o fogo frio' : 'Cipós-de-Sangue', () => G.save.cold ? purifyGate(g) : scene(async () => { await talk([['Espírito', g.msg || 'A lança e o arco não abrem esses cipós. Eles pulsam como coisa viva... mantida à força.']]); }));
  for (const d of L.doors) if ((!d.need || gateOpen(d.need)) && (!d.cond || d.cond())) add(d.x, d.y || GY, d.label, () => scene(() => travelTo(d.to, d.toX)));
  for (const b of L.bridges) if (!gateOpen(b.id)) add(b.lx, GY, 'Derrubar o tronco (atalho)', () => openBridge(b));
}
function purifyGate(g) {
  scene(async () => {
    G.P.vx = 0; SFX.fire(); g.dis = 0; G.flash = 0.2; G.flashCol = '#bfe4ff';
    for (let i = 0; i < 50; i++) part(g.x + rnd(-g.w / 2 - 4, g.w / 2 + 4), g.y - rnd(0, g.h), rnd(-20, 20), rnd(-70, -20), 1.2, pick(['#bfe4ff', '#e8f6ff', '#7ab8ff']), pick([1, 2]), -30);
    await wait(1.1);
    SV().gates.push(g.id); writeSave();
    G.lvl.solids = G.lvl.solids.filter(s => s.gateId !== g.id);
    showToast('Cipós purificados', g.reward || GATES_INFO[g.id] || '', 2.4);
    if (g.onOpen) await g.onOpen(g);
  });
}
function openBridge(b) {
  scene(async () => {
    SFX.boom(); G.cam.shake = 5;
    SV().gates.push(b.id); writeSave();
    G.lvl.solids.push({ x: b.x0, y: b.y, w: b.x1 - b.x0, h: 4, t: 'p', kind: 'branch' });
    for (let i = 0; i < 30; i++) part(rnd(b.x0, b.x1), b.y, rnd(-20, 20), rnd(-40, 0), 0.8, '#8a6a4a');
    showToast('Atalho aberto', 'o tronco caiu sobre o poço', 2.2);
  });
}
// fundo de cada selo: o que os cipós escondem (desenhado com textura própria)
function drawGateBack(g, t) {
  const x = Math.round(g.x), gy = g.y, w = g.w, h = g.h, r = seeded(Math.round(g.x) * 7 + 3), L = x - w / 2;
  if (g.kind === 'templo') {
    // pórtico de pedra antiga: blocos com juntas, verga entalhada, musgo escorrendo e soleira
    const X0 = L - 9, W0 = w + 18, Y0 = gy - h - 12;
    rect(ctx, X0 - 1, Y0 - 1, W0 + 2, h + 13, '#1a1c14'); rect(ctx, X0, Y0, W0, h + 12, '#4a5240');
    for (let row = 0, y = Y0 + 6; y < gy; row++, y += 6) { rect(ctx, X0, y, W0, 1, '#363c2e'); for (let xx = X0 + (row % 2 ? 4 : 9); xx < X0 + W0; xx += 11) rect(ctx, xx, y - 5, 1, 5, '#363c2e'); }
    for (let i = 0; i < 18; i++) rect(ctx, X0 + r() * W0, Y0 + r() * (h + 10), 1 + (r() * 2 | 0), 1, r() < 0.5 ? '#5e6650' : '#3e4434');
    rect(ctx, X0 - 3, Y0 - 3, W0 + 6, 6, '#5e6650'); rect(ctx, X0 - 3, Y0 - 3, W0 + 6, 1, '#7a8468'); rect(ctx, X0 - 3, Y0 + 2, W0 + 6, 1, '#2e3226');
    for (let i = 0; i < 5; i++) { const gx = X0 + 4 + i * (W0 - 8) / 4; rect(ctx, gx - 1, Y0 - 1, 3, 2, '#8a9a6a'); rect(ctx, gx, Y0 - 2, 1, 4, '#2e3226'); }
    for (let i = 0; i < W0 + 6; i += 2) { const d2 = 1 + (r() * 4 | 0); rect(ctx, X0 - 3 + i, Y0 + 3, 1, d2, i % 4 ? '#3a6a2a' : '#5a8a3a'); }
    rect(ctx, L - 2, gy - h - 2, w + 4, h + 2, '#2a2e22');
    for (let y = 0; y < h; y++) rect(ctx, L, gy - h + y, w, 1, y < 4 ? '#14120c' : '#0a0806');
    rect(ctx, X0 - 4, gy - 2, W0 + 8, 2, '#5e6650'); rect(ctx, X0 - 4, gy - 2, W0 + 8, 1, '#7a8468');
  } else if (g.kind === 'arvore') {
    // tronco oco: casca com sulcos e nós, borda quebrada no alto, musgo, raízes saindo na base e o oco escuro
    const X0 = L - 11, W0 = w + 22, top = gy - h - 26;
    for (let xx = 0; xx < W0; xx++) { const ty = top + Math.round(Math.abs(Math.sin(xx * 0.9 + 1)) * 4 + (xx % 5 === 0 ? 2 : 0)); rect(ctx, X0 + xx, ty, 1, gy - ty, xx < 3 ? '#2a1c12' : xx > W0 - 4 ? '#24180e' : '#3e2c1c'); }
    for (let i = 0; i < 7; i++) { const sx = X0 + 3 + i * (W0 - 6) / 6; for (let y = top + 4; y < gy - 1; y += 1) if (r() < 0.85) rect(ctx, Math.round(sx + Math.sin(y * 0.25 + i) * 1.2), y, 1, 1, i % 2 ? '#2a1c12' : '#523a26'); }
    for (let i = 0; i < 3; i++) { const kx = X0 + 4 + r() * (W0 - 8), ky = top + 8 + r() * (h - 4); ell(ctx, kx, ky, 2, 1, '#22160c'); rect(ctx, kx - 1, ky - 1, 2, 1, '#6a4a30'); }
    for (let xx = 0; xx < W0; xx += 1) if (r() < 0.6) rect(ctx, X0 + xx, top + 3 + Math.round(Math.abs(Math.sin(xx * 0.9 + 1)) * 4), 1, 1 + (r() * 3 | 0), r() < 0.5 ? '#4a7a2e' : '#6a9a3a');
    for (const dir of [-1, 1]) for (let k2 = 0; k2 < 2; k2++) strokePath(ctx, curve(x + dir * (W0 / 2 - 3), gy - 4 - k2 * 3, x + dir * (W0 / 2 + 4), gy - 2, x + dir * (W0 / 2 + 9 + k2 * 4), gy, 8), 2, '#3e2c1c', '#160e08');
    ell(ctx, x, gy - h * 0.45, w / 2 + 2, (h * 0.45 | 0) + 2, '#22160c'); ell(ctx, x, gy - h * 0.45, w / 2, h * 0.45 | 0, '#0a0604'); ell(ctx, x + 1, gy - h * 0.42, w / 2 - 3, (h * 0.35 | 0), '#050302');
  } else if (g.kind === 'nicho' || g.kind === 'altar') {
    // nicho cavado na rocha: moldura com rachaduras e lascas, fundo que escurece para dentro
    rect(ctx, L - 5, gy - h - 5, w + 10, h + 5, '#2a231e'); rect(ctx, L - 4, gy - h - 4, w + 8, h + 4, '#3a3029');
    for (let i = 0; i < 10; i++) rect(ctx, L - 4 + r() * (w + 8), gy - h - 4 + r() * 4, 2, 1, '#4a3e34');
    for (let i = 0; i < 3; i++) { let cx = L - 3 + r() * (w + 6), cy = gy - h - 4; for (let k2 = 0; k2 < 5; k2++) { rect(ctx, cx, cy, 1, 1, '#1a1410'); cx += (r() * 2 | 0) - 0.5; cy += 1; } }
    for (let y = 0; y < h; y++) rect(ctx, L, gy - h + y, w, 1, y < 3 ? '#1a1510' : '#0c0a08');
    if (g.kind === 'altar') { rect(ctx, x - 13, gy - 11, 26, 11, '#5a4a3c'); rect(ctx, x - 15, gy - 13, 30, 3, '#8a7a6a'); rect(ctx, x - 15, gy - 13, 30, 1, '#a89a88'); for (let i = 0; i < 4; i++) rect(ctx, x - 10 + i * 6, gy - 8, 3, 3, '#3e3228'); for (let i = 0; i < 6; i++) rect(ctx, x - 8 + i * 3, gy - 14 - (i % 2), 2, 1, '#b8aca0'); }
  } else if (g.kind === 'raizes') {
    // raízes mortas e retorcidas descendo para uma trilha escura
    rect(ctx, L - 2, gy - h, w + 4, h, '#140c08');
    for (let i = 0; i < 6; i++) strokePath(ctx, curve(L - 4 + i * (w + 8) / 5, gy, L + 2 + i * w / 5 + Math.sin(i) * 4, gy - h * 0.5, L + i * (w / 5) + 4, gy - h - 2, 12), 2, i % 2 ? '#3a2a1c' : '#2a1c12', '#0e0806');
  }
}
// Cipós-de-Sangue: troncos grossos trançados, cipós finos cruzados, espinhos, bulbos que pulsam,
// gavinhas enroladas no alto, amarras horizontais, raízes negras se espalhando no chão e seiva pingando
function bloodVine(pts, th, base, hi, seed, pulse) {
  strokePath(ctx, pts, th, base, '#12040a');
  pts.forEach(([px, py], j) => {
    if (th > 1 && j % 2 === 0) rect(ctx, px - (th >> 1), py, 1, 1, hi);                                   // brilho de um lado
    if (th > 1 && j % 3 === 1) rect(ctx, px + (th >> 1), py, 1, 1, '#2a0610');                             // sombra do outro
    if (j % 6 === (seed % 6) && j > 1) { const sd = (j + seed) % 2 ? 1 : -1; rect(ctx, px + sd * (th / 2 + 1), py - 1, 1, 1, '#0e0206'); rect(ctx, px + sd * (th / 2 + 2), py - 2, 1, 1, '#d8b0a8'); } // espinho
    if (th > 1 && j % 9 === (seed % 9)) { rect(ctx, px - 1, py - 1, 3, 3, '#3a0610'); rect(ctx, px, py, 1, 1, pulse > 0.5 ? '#ff6a7a' : '#e02a3e'); } // bulbo
  });
}
function drawBloodGate(g, t) {
  const open = gateOpen(g.id), x = g.x, gy = g.y, w = g.w, h = g.h;
  drawGateBack(g, t);
  if (open && g.dis == null) return;
  const k = g.dis != null ? 1 - g.dis : 1, pulse = (Math.sin(t * 3 + x) + 1) / 2, L = x - w / 2, seed = Math.round(x);
  // brilho rubro atrás dos cipós
  ctx.globalAlpha = k * (0.1 + pulse * 0.06); ell(ctx, x, gy - h / 2, w / 2 + 8, h / 2 + 6, '#c8203a'); ctx.globalAlpha = k;
  // raízes negras se espalhando no chão, com veios vermelhos
  for (let i = 0; i < 6; i++) { const dir = i % 2 ? 1 : -1, len = 8 + (i * 5) % 11; const pts = curve(x + dir * (w / 4), gy - 1, x + dir * (w / 2 + len * 0.5), gy - 3, x + dir * (w / 2 + len), gy, 10); strokePath(ctx, pts, 2, '#1a0608', '#060204'); rect(ctx, pts[5][0], pts[5][1], 1, 1, '#a0182a'); }
  // cipós finos atravessados (fundo)
  for (let i = 0; i < 3; i++) { const fromL = i % 2 === 0, y0 = gy - h * (0.15 + i * 0.28); bloodVine(curve(fromL ? L - 2 : L + w + 2, y0, x + (fromL ? 3 : -3), y0 - h * 0.12, fromL ? L + w + 2 : L - 2, y0 - h * 0.26, 14), 1, '#3e0812', '#7a1422', seed + i, pulse); }
  // troncos principais trançados (frente)
  const n = Math.max(2, Math.round(w / 9));
  for (let i = 0; i < n; i++) {
    const bx = L + (i + 0.5) * w / n, sw = (i % 2 ? 1 : -1) * Math.min(6, w / n);
    bloodVine(curve(bx, gy, bx + sw, gy - h * 0.5, bx - sw * 0.6, gy - h, 20), 2, i % 2 ? '#4a0a12' : '#5e1018', '#9a2030', seed + i * 3, pulse);
  }
  // amarras horizontais envolvendo os troncos
  for (let i = 0; i < 2; i++) { const yy = gy - h * (0.33 + i * 0.33); bloodVine(curve(L - 3, yy + 2, x, yy - 2 + Math.sin(i * 2) * 2, L + w + 3, yy + 1, 18), 1, '#3a0610', '#8a1a28', seed + 11 + i, pulse); }
  // gavinhas enroladas saindo pelo alto
  for (let i = 0; i < 2; i++) { const bx = L + (i + 0.5) * w / 2, top = gy - h; const pts = []; for (let j = 0; j <= 12; j++) { const a = j * 0.55, rr = 4 - j * 0.28; pts.push([bx + Math.sin(a + i) * rr, top - j * 0.9 + Math.cos(a + i) * rr * 0.4]); } strokePath(ctx, pts, 1, '#5e1018', '#12040a'); }
  // seiva pingando
  for (let i = 0; i < 2; i++) { const p = (t * 0.5 + i * 0.5 + (seed % 7) * 0.1) % 1, dx2 = L + w * (0.3 + i * 0.4); ctx.globalAlpha = k * (1 - p); rect(ctx, dx2, gy - h * 0.4 + p * h * 0.4, 1, 2, '#c8203a'); }
  ctx.globalAlpha = k;
  // depois de ganhar o fogo frio: brilho azul discreto avisando que o selo pode ser aberto
  if (G.save.cold && g.dis == null) { ctx.globalAlpha = 0.5 + pulse * 0.4; for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; rect(ctx, x + Math.cos(a) * (w / 2 + 4), gy - h / 2 + Math.sin(a) * h / 2, 1, 1, '#bfe4ff'); } }
  ctx.globalAlpha = 1;
}

// ---------- Pinturas rupestres ----------
const PG = '#b0482e', PW = '#d8c4a0', PR = '#e03a2a';
function pfig(x, y, col, pose = 'stand') {
  if (pose === 'lie') { rect(ctx, x - 4, y - 2, 8, 1, col); rect(ctx, x + 4, y - 3, 2, 2, col); return; }
  const ky = pose === 'kneel' ? 3 : 0, bx = pose === 'bent' ? 2 : 0;
  rect(ctx, x + bx, y - 10 + ky, 2, 2, col); line(ctx, x + bx * 0.5, y - 8 + ky, x, y - 3, col);
  rect(ctx, x - 1, y - 3, 1, 3, col); rect(ctx, x + 1, y - 3, 1, 3, col);
  if (pose === 'up') { rect(ctx, x - 2, y - 11, 1, 4, col); rect(ctx, x + 2, y - 11, 1, 4, col); }
  else if (pose === 'bent') { line(ctx, x + 1, y - 7, x + 4, y - 4, col); line(ctx, x, y - 7, x - 2, y - 3, col); }
  else rect(ctx, x - 2, y - 7 + ky, 5, 1, col);
}
function pbeast(x, y, col, lie) { if (lie) { rect(ctx, x - 4, y - 2, 8, 2, col); rect(ctx, x + 4, y - 2, 2, 1, col); return; } rect(ctx, x - 4, y - 5, 8, 2, col); rect(ctx, x + 4, y - 7, 2, 2, col); rect(ctx, x - 4, y - 3, 1, 3, col); rect(ctx, x + 2, y - 3, 1, 3, col); rect(ctx, x - 6, y - 6, 2, 1, col); }
function ptree(x, y, col) { rect(ctx, x, y - 8, 1, 8, col); rect(ctx, x - 3, y - 11, 7, 3, col); rect(ctx, x - 1, y - 13, 3, 2, col); }
function pring(cx, cy, rx, ry, col, gap) { for (let i = 0; i < 28; i++) { if (gap && i >= gap[0] && i <= gap[1]) continue; const a = i / 28 * HPI * 2; rect(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 1, 1, col); } }
function marks3(x, y) { for (let k = 0; k < 3; k++) rect(ctx, x + k * 2, y, 1, 4, PR); }
function drawMural(m, t) {
  const X = Math.round(m.x - m.w / 2), Y = m.y, lit = m.lit, hidden = m.need && !gateOpen(m.need);
  rect(ctx, X - 2, Y - 2, m.w + 4, m.h + 4, '#2a231e'); rect(ctx, X, Y, m.w, m.h, '#3a3029');
  for (let i = 0; i < 14; i++) rect(ctx, X + hash(i * 3 + m.x) * m.w, Y + hash(i * 7 + m.x) * m.h, 2, 1, '#443830');
  if (hidden) return;
  const k = Math.round(Math.sin(t * 2) * lit), j = Math.round(Math.cos(t * 1.6) * lit);
  ctx.globalAlpha = 0.18 + lit * 0.82;
  const g = Y + m.h - 6;
  switch (m.id) {
    case 'm1': pring(X + 30, Y + 19, 22, 13, PG); pfig(X + 10, g, PG); pfig(X + 50, g, PG); pfig(X + 30, Y + 12 + k, PG); pbeast(X + 18, g + j, PG); pbeast(X + 42, g - j, PG); ptree(X + 8, Y + 16, PG); ptree(X + 52, Y + 16, PG); pfig(X + 30, Y + 26, PW, 'lie'); ptree(X + 30, Y + 24 - Math.max(0, k), PW); break;
    case 'm2': for (let i = 0; i < 8; i++) { const a = i / 8 * HPI * 2 + t * 0.3 * lit; rect(ctx, X + 12 + Math.cos(a) * 7, Y + 10 + Math.sin(a) * 7, 1, 1, PG); } pring(X + 12, Y + 10, 4, 4, PG); for (let i = 0; i < 50; i += 6) rect(ctx, X + 5 + i, g + 3, 3, 1, PW); pbeast(X + 20, g, PG, true); pbeast(X + 52, g, PG, true); pfig(X + 34, g + k * 0.5, PG, 'kneel'); pfig(X + 43, g, PW, 'lie'); break;
    case 'm3': pfig(X + 18, g, PG, 'up'); pring(X + 44, Y + 14, 7, 7, PW); rect(ctx, X + 44, Y + 8, 1, 13, PW); rect(ctx, X + 38, Y + 14, 13, 1, PW); for (let i = 0; i < 4; i++) { line(ctx, X + 40 - i * 3, Y + 20 + i * 2, X + 34 - i * 3 + k, Y + 24 + i * 2, PG); } rect(ctx, X + 27, Y + 26, 3, 1, '#3a3029'); break;
    case 'm4': pring(X + 30, Y + 18, 22, 13, PG, [5, 9]); for (let i = 0; i < 3; i++) { pbeast(X + 14 + i * 16, Y + 14 + (i % 2) * 4 + j, PW); line(ctx, X + 14 + i * 16, Y + 12, X + 14 + i * 16, Y + 4, '#8a8a92'); } pfig(X + 30, g, PG, 'bent'); marks3(X + 36, g - 10); break;
    case 'm5': line(ctx, X + 14, g, X + 30, Y + 6, PG); line(ctx, X + 30, Y + 6, X + 46, g, PG); for (let i = 0; i < 46; i++) rect(ctx, X + 4 + i, g - 4 + Math.sin(i * 0.5 + t * 3 * lit) * 2, 1, 2, i < 30 ? '#e08a3a' : '#8a4a2a'); rect(ctx, X + 50, g - 10, 3, 10, PW); for (let i = 0; i < 4; i++) rect(ctx, X + 44 + i * 2, g - 6 + (i % 2), 1, 1, '#8a8a92'); break;
    case 'm6': pfig(X + 18, g, PW, 'lie'); for (let i = 0; i < 3; i++) { line(ctx, X + 12 - i * 2 - k, g + 2, X + 4 - i * 2 - k, g - 6 + i * 3, PG); line(ctx, X + 26 + i * 2 + k, g + 2, X + 34 + i * 2 + k, g - 6 + i * 3, PG); } pfig(X + 46, g - Math.max(0, k), PG, 'bent'); marks3(X + 50, g - 14); break;
    case 'm7': pring(X + 40, Y + 22, 32, 16, PG); for (let i = 0; i < 6; i++) { const a = i / 6 * HPI * 2 + 0.3; pbeast(X + 40 + Math.cos(a) * 26, Y + 26 + Math.sin(a) * 12, i % 2 ? PW : PG); } pfig(X + 40, Y + 30 + k * 0.5, PG); ptree(X + 30, Y + 30, PG); rect(ctx, X + 58, Y + 6, 22, 30, '#2a231e'); for (let i = 0; i < 6; i++) rect(ctx, X + 56 + hash(i + 7) * 4, Y + 6 + i * 5, 3, 3, '#2a231e'); break;
    case 'r1': ptree(X + 8, g, PG); ptree(X + 16, g, PG); pbeast(X + 32, g, PW); rect(ctx, X + 30, g - 12, 6, 8, PW); pfig(X + 44, g, PG); pfig(X + 52, g, PG); break;
    case 'r2': pring(X + 30, Y + 18, 9, 7, PR); for (let i = 0; i < 6; i++) ptree(X + 6 + i * 10, g, i % 2 ? PG : PW); for (let i = 0; i < 4; i++) rect(ctx, X + 26 + i * 2, Y + 18 + Math.sin(t * 4 + i) * lit * 2, 1, 1, PW); break;
  }
  // pigmento brilhando quando a tocha passa
  if (lit > 0.3) for (let i = 0; i < 5; i++) { const s2 = hash(i * 13 + (t * 3 | 0) + m.x); rect(ctx, X + s2 * m.w, Y + hash(i * 5 + (t * 3 | 0)) * m.h, 1, 1, '#ffd27a'); }
  ctx.globalAlpha = 1;
  // revelação: o fogo frio marca as inscrições ainda não vistas
  if (G.save.cold && lit < 1 && G.P && Math.abs(G.P.x - m.x) < 90) { ctx.globalAlpha = 0.6; for (const [cx, cy] of [[X, Y], [X + m.w, Y], [X, Y + m.h], [X + m.w, Y + m.h]]) rect(ctx, cx - 1, cy - 1, 2, 2, '#bfe4ff'); ctx.globalAlpha = 1; }
}

// ---------- Luz e escuridão ----------
const darkC = document.createElement('canvas'); darkC.width = W; darkC.height = H; const dctx = darkC.getContext('2d');
function torchR() { return G.torchOut > 0 ? 0 : 56; }
function caveLights() {
  const L = G.lvl, P = G.P, out = [];
  if (P && !P.hidden) {
    const tr = torchR();
    if (tr) out.push([P.x + 5 + P.f * 6, P.y + 6, tr * (0.95 + Math.sin(G.t * 13) * 0.03 + Math.sin(G.t * 7.3) * 0.02), 'warm']);
    else out.push([P.x + 5, P.y + 10, 16, null]);
  }
  if (G.save.cold && G.relic) out.push([G.relic.x, G.relic.y, 36, 'cold']);
  for (const f of L.fires) if (G.save.lit[f.id]) out.push([f.x, groundY(f.x) - 8, 70, 'warm']);
  for (const l of L.lights) out.push([l.x, l.y, l.r, null]);
  const B = G.boss;
  if (B && B.kind === 'boitata' && B.seg) for (let i = 0; i < B.seg.length; i += 8) out.push([B.seg[i].x, B.seg[i].y, i === 0 ? 70 : 34, i === 0 ? 'warm' : null]);
  if (L.glimpse && G.glimpseT > 0) out.push([G.glimpseX, L.glimpse.y, 60, 'warm']);
  for (const h of G.hazards) if (h.kind === 'fire' || h.kind === 'pfire') out.push([h.x + h.w / 2, h.y, 34, 'warm']);
  for (const p of G.projs) if (p.kind === 'fire' || p.kind === 'bfire' || p.kind === 'sopro') out.push([p.x, p.y, 30, 'warm']);
  return out;
}
function drawCaveDark() {
  const cx = Math.round(G.cam.x), cy = G.cam.y || 0, lights = caveLights();
  dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, W, H);
  dctx.fillStyle = 'rgba(5,3,6,0.88)'; dctx.fillRect(0, 0, W, H);
  dctx.globalCompositeOperation = 'destination-out';
  for (const [x, y, r] of lights) {
    const sx = x - cx, sy = y - cy; if (sx < -r || sx > W + r) continue;
    const g = dctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.82)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g; dctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  dctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkC, 0, 0);
  // cor da luz: fogo alaranjado, olho azul-esbranquiçado
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, k] of lights) { if (!k) continue; ctx.globalAlpha = 0.07; ell(ctx, x - cx, y - cy, r * 0.6 | 0, r * 0.5 | 0, k === 'warm' ? '#ff8a3a' : '#7ab8ff'); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

// ---------- Ruído ----------
function emitNoise(x, y, r) {
  if (!G.lvl || !G.lvl.cave) return;
  (G.noises = G.noises || []).push({ x, y, r, t: 0 });
  for (const e of G.ents) if (e.hp > 0 && e.hear && Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) < r) e.hear(x, y);
}

// ---------- Atualização: tocha, passos, pinturas, selos vistos, relíquia ----------
function updateCave(dt) {
  const L = G.lvl, P = G.P; if (!L || !P) return;
  for (const g of L.gates) {
    if (g.dis != null) { g.dis += dt; if (g.dis >= 1) g.dis = null; }
    if (!gateOpen(g.id) && Math.abs(g.x - (P.x + 5)) < 150 && !SV().seenGates.includes(g.id)) { SV().seenGates.push(g.id); writeSave(); showToast('Cipós-de-Sangue', G.save.cold ? 'o fogo frio pode purificar' : 'a lança e o arco não abrem isto', 2.4); }
  }
  // relíquia: chama azul que acompanha o espírito; a brasa interrompe bichos corrompidos colados nele
  if (G.save.cold) {
    const R = G.relic || (G.relic = { x: P.x, y: P.y, cd: 0 }), tx = P.x + 5 - P.f * 11, ty = P.y - 2 + Math.sin(G.t * 2.5) * 2;
    R.x += (tx - R.x) * Math.min(1, dt * 6); R.y += (ty - R.y) * Math.min(1, dt * 6); R.cd -= dt;
    if (R.cd <= 0) for (const e of G.ents) if (e.hp > 0 && !e.fixed && Math.abs(e.x + e.w / 2 - (P.x + 5)) < 26 && Math.abs(e.y + e.h / 2 - (P.y + 11)) < 26) {
      R.cd = 5; e.stag = 0.6; e.vx = Math.sign(e.x - P.x) * 120; e.flash = 0.15; floatText(e.x + e.w / 2, e.y - 4, 'brasa', '#bfe4ff');
      for (let i = 0; i < 12; i++) part(R.x, R.y, rnd(-60, 60), rnd(-60, 20), 0.5, pick(['#bfe4ff', '#e8f6ff']));
      break;
    }
  }
  if (!L.cave) return;
  G.torchOut = Math.max(0, (G.torchOut || 0) - dt);
  if (G.torchOut > 0 && G.torchOut - dt <= 0) floatText(P.x + 5, P.y - 6, 'a tocha reacende', '#ffd27a');
  // passos fazem barulho (segurar ↓ anda em silêncio); queda forte faz mais
  P.noiseCd = (P.noiseCd || 0) - dt;
  const sneak = I.down.down && P.onG;
  if (P.onG && Math.abs(P.vx) > 50 && !sneak && P.noiseCd <= 0) { P.noiseCd = 0.35; emitNoise(P.x + 5, P.y + P.h, 85); }
  if (P.onG && !P.wasG2 && (P.fallV || 0) > 230) emitNoise(P.x + 5, P.y + P.h, 130);
  P.fallV = P.onG ? 0 : Math.max(P.fallV || 0, P.vy); P.wasG2 = P.onG;
  for (const n of G.noises || []) n.t += dt; G.noises = (G.noises || []).filter(n => n.t < 0.7);
  // pinturas: só o fogo quente da tocha desperta
  const tr = torchR();
  for (const m of L.murals) {
    if (m.need && !gateOpen(m.need)) continue;
    const near = tr > 0 && Math.abs(m.x - (P.x + 5)) < tr * 0.6 + m.w / 2 && P.y + P.h > m.y;
    m.lit = clamp(m.lit + (near ? dt * 1.4 : -dt * 0.25), 0, 1);
    if (m.lit >= 1 && !SV().murals.includes(m.id)) { SV().murals.push(m.id); writeSave(); SFX.echo(); showToast('Pintura ' + MURALS[m.id].n, MURALS[m.id].s, 3.2); }
  }
  // Poço dos Ecos: o Boitatá passa lá embaixo, iluminando o poço por instantes
  if (L.glimpse && !SV().ev.boitata) {
    G.glimpseCd = (G.glimpseCd == null ? 3 : G.glimpseCd) - dt;
    if (G.glimpseCd <= 0 && Math.abs(P.x - (L.glimpse.x0 + L.glimpse.x1) / 2) < 260) { G.glimpseCd = 9; G.glimpseT = 3; SFX.roar(); }
    if (G.glimpseT > 0) { G.glimpseT -= dt; G.glimpseX = lerp(L.glimpse.x1 + 60, L.glimpse.x0 - 120, 1 - G.glimpseT / 3); }
  }
}

// ---------- Desenho: fundo da caverna e frente ----------
function drawCaveBack(L, cx, t) {
  for (const m of L.murals) if (m.x + m.w > cx - 10 && m.x - m.w < cx + W + 10) drawMural(m, t);
  for (const d of L.doors) if (d.x > cx - 40 && d.x < cx + W + 40 && (!d.need || gateOpen(d.need)) && d.arch) { rect(ctx, d.x - 12, (d.y || GY) - 34, 24, 34, '#2a231e'); rect(ctx, d.x - 9, (d.y || GY) - 30, 18, 30, '#06050a'); }
  for (const g of L.gates) if (g.x > cx - 60 && g.x < cx + W + 60) drawBloodGate(g, t);
  for (const b of L.bridges) if (!gateOpen(b.id) && b.lx > cx - 30 && b.lx < cx + W + 30) { rect(ctx, b.lx - 3, GY - 46, 6, 46, '#3a2a1c'); rect(ctx, b.lx - 3, GY - 46, 2, 46, '#5a4030'); rect(ctx, b.lx - 5, GY - 48, 10, 3, '#4a3424'); }
  // Poço dos Ecos: a serpente de fogo cruza o fundo do poço
  if (L.glimpse && G.glimpseT > 0) for (let i = 0; i < 40; i++) { const sx = G.glimpseX + i * 5, sy = L.glimpse.y + Math.sin(i * 0.4 + G.t * 4) * 4; ctx.globalAlpha = 0.85 - i * 0.015; ell(ctx, sx, sy, Math.max(2, 6 - i * 0.1) | 0, Math.max(2, 5 - i * 0.08) | 0, i % 3 ? '#c8501e' : '#ff9a3a'); }
  ctx.globalAlpha = 1;
  // suportes das correntes do Boitatá (atrás do corpo)
  const B = G.boss; if (B && B.kind === 'boitata') drawSupports(B, t);
}
function drawCaveFront(L, t) {
  const P = G.P;
  if (L.cave && P && !P.hidden && P.state !== 'dead') {
    // tocha na mão: chama viva, ou só brasa e fumaça quando um morcego apagou
    const hx = P.x + 5 + P.f * 6 * HUMAN_S, hy = P.y + P.h - 13 * HUMAN_S;
    line(ctx, hx, hy, hx + P.f * 2, hy - 7, '#5a3a22');
    if (G.torchOut > 0) { rect(ctx, hx + P.f * 2, hy - 8, 1, 1, '#c8402e'); if (Math.random() < 0.2) part(hx + P.f * 2, hy - 9, rnd(-4, 4), -12, 1, '#4a4448', 1, -5); }
    else { const f2 = Math.sin(t * 20) > 0 ? 1 : 0; rect(ctx, hx + P.f * 2 - 1, hy - 11 - f2, 3, 3, '#ff8a3a'); rect(ctx, hx + P.f * 2, hy - 13 - f2, 1, 3, '#ffd27a'); rect(ctx, hx + P.f * 2, hy - 10, 1, 1, '#fff0b0'); }
  }
  if (G.save.cold && G.relic && P && !P.hidden) drawSparkle(ctx, G.relic.x, G.relic.y + 6, t, '#bfe4ff');
  // ondas de poeira: o som também aparece na tela
  for (const n of G.noises || []) { const k = n.t / 0.7, r = n.r * (0.3 + k * 0.7); ctx.globalAlpha = (1 - k) * 0.45; for (let i = 0; i < 20; i++) { const a = i / 20 * HPI * 2; rect(ctx, n.x + Math.cos(a) * r, n.y + Math.sin(a) * r * 0.25, 2, 1, '#c8b8a0'); } }
  ctx.globalAlpha = 1;
}
// Boitatá livre no horizonte do Cerrado
function drawSkyBoitata(t) {
  ctx.globalAlpha = 0.55;
  const x0 = (t * 8) % (W + 200) - 100;
  for (let i = 0; i < 26; i++) rect(ctx, x0 - i * 3, 34 + Math.sin(i * 0.4 + t * 1.5) * 3, 2, 2, i % 3 ? '#ff9a3a' : '#ffd27a');
  ctx.globalAlpha = 1;
}

// ---------- Bichos da caverna ----------
Object.assign(ET, {
  lacraia: { ai: 'lacraia', w: 26, h: 7, hp: 30, dmg: 16, spd: 72, mem: 12 },
  morcego: { ai: 'morcego', w: 12, h: 8, hp: 14, dmg: 8, spd: 70, mem: 9, fly: true },
  sapo: { ai: 'sapo', w: 16, h: 10, hp: 34, dmg: 18, mem: 12 },
  besouro: { ai: 'besouro', w: 18, h: 11, hp: 40, dmg: 14, spd: 24, mem: 14 },
  raizes: { ai: 'raizes', w: 22, h: 56, hp: 70, dmg: 0, mem: 0 },
});
const CAVE_AI = {
  // Lacraia-cega: sai da fenda e persegue a origem do barulho, mesmo sem ver ninguém
  lacraia(e, dt) {
    if (!e.init) { e.init = 1; e.hx = e.x; e.mode = 'hide'; e.hear = x => { e.tx = x; e.heard = 3; if (e.mode !== 'hunt') { e.mode = 'hunt'; e.flash = 0.05; } }; }
    e.heard = (e.heard || 0) - dt; e.noTouch = e.mode === 'hide';
    if (e.mode === 'hunt') {
      if (e.heard <= 0) e.mode = 'home';
      const d = e.tx - (e.x + e.w / 2); e.f = Math.sign(d) || e.f;
      e.vx = Math.abs(d) < 4 || pitAhead(e) ? 0 : e.f * e.spd;
      if (Math.random() < 0.3) part(e.x + rnd(0, e.w), e.y + e.h, rnd(-10, 10), rnd(-20, -5), 0.4, '#5a4a3e');
    } else if (e.mode === 'home') { const d = e.hx - e.x; e.f = Math.sign(d) || e.f; e.vx = e.f * e.spd * 0.5; if (Math.abs(d) < 3) { e.mode = 'hide'; e.vx = 0; } }
    else e.vx = 0;
    e.vy += GRAV * dt; moveBody(e, dt);
  },
  // Morcego-fantasma: mergulha sobre a luz e apaga a tocha
  morcego(e, dt, dx, dy) {
    const P = G.P;
    if (!e.init) { e.init = 1; e.mode = 'hang'; }
    if (e.mode === 'hang') { if (G.torchOut <= 0 && Math.abs(dx) < 100 && dy > -10 && dy < 130) { e.mode = 'dive'; e.st = 1.3; e.vx = 0; e.vy = 0; } }
    else if (e.mode === 'dive') {
      const ax = P.x + 5 + P.f * 6 - (e.x + e.w / 2), ay = P.y + 6 - (e.y + e.h / 2), L2 = Math.hypot(ax, ay) || 1;
      e.vx = lerp(e.vx, ax / L2 * 150, 0.1); e.vy = lerp(e.vy, ay / L2 * 150, 0.1); e.x += e.vx * dt; e.y += e.vy * dt; e.st -= dt;
      if (overlap(e, P)) { if (G.torchOut <= 0) { G.torchOut = 4; floatText(P.x + 5, P.y - 6, 'a tocha apagou', '#bfe4ff'); SFX.splash(); } e.mode = 'up'; }
      if (e.st <= 0) e.mode = 'up';
    } else { e.y += (e.hy - e.y) * 2.5 * dt; e.x += Math.sin(e.t * 3) * 20 * dt; if (Math.abs(e.y - e.hy) < 2) e.mode = 'hang'; }
    e.f = Math.sign(dx) || 1;
  },
  // Sapo-pedra: camuflado de rocha, respira de leve; salta e golpeia com a língua
  sapo(e, dt, dx, dy) {
    if (!e.init) { e.init = 1; e.mode = 'rock'; e.cd = 0; }
    e.cd -= dt; e.noTouch = e.mode === 'rock';
    if (e.mode === 'rock') { e.vx = 0; if (Math.abs(dx) < 52 && Math.abs(dy) < 30 && e.cd <= 0) { e.mode = 'leap'; e.f = Math.sign(dx) || 1; e.vy = -200; e.vx = e.f * 100; SFX.jump(); } }
    else if (e.mode === 'leap') { if (e.onG && e.vy >= 0) { e.mode = 'tongue'; e.st = 0.45; e.vx = 0; } }
    else if (e.mode === 'tongue') {
      e.st -= dt; const len = 34 * Math.sin(clamp((0.45 - e.st) / 0.45, 0, 1) * Math.PI); e.tongue = len;
      const hb = { x: e.f > 0 ? e.x + e.w : e.x - len, y: e.y + 2, w: len, h: 4 };
      if (!e.hitT && len > 8 && overlap(hb, G.P)) e.hitT = hurtPlayer(e.dmg, e.x + e.w / 2);
      if (e.st <= 0) { e.mode = 'rock'; e.cd = 1.5; e.tongue = 0; e.hitT = false; }
    }
    e.vy += GRAV * dt; moveBody(e, dt);
  },
  // Besouro de Cristal: casco da frente reflete golpes; demora a virar, e o barulho o faz virar
  besouro(e, dt, dx) {
    if (!e.init) { e.init = 1; e.shell = true; e.turnT = 0; e.hear = x => { e.f = Math.sign(x - (e.x + e.w / 2)) || e.f; e.ignore = 1.6; }; }
    e.ignore = (e.ignore || 0) - dt;
    const want = Math.sign(dx) || e.f;
    if (Math.abs(dx) < 110 && e.ignore <= 0 && want !== e.f) { e.turnT += dt; if (e.turnT > 0.8) { e.f = want; e.turnT = 0; } } else e.turnT = 0;
    if (pitAhead(e)) e.f *= -1;
    e.vx = e.turnT > 0 ? 0 : e.f * e.spd * (Math.abs(dx) < 110 ? 1.6 : 1);
    e.vy += GRAV * dt; moveBody(e, dt); if (e.hitWall) e.f *= -1;
  },
  raizes(e) { e.vx = 0; e.vy = 0; e.noTouch = true; },
};
function shellBlock(e) {
  e.flash = 0.06; SFX.ui && SFX.ui();
  floatText(e.x + e.w / 2, e.y - 4, 'tinc', '#bfe4ff');
  for (let i = 0; i < 8; i++) part(e.x + e.w / 2 + e.f * 8, e.y + 4, e.f * rnd(20, 70), rnd(-60, 0), 0.35, pick(['#e0f8ff', '#9ad8f0']));
}
function drawCaveEnemy(c, e, x, y, t) {
  const R = [], f = e.f || 1, flash = e.flash > 0 || (e.stag > 0 && Math.sin(t * 40) > 0);
  const A = (dx, dy, w, h, col, noOut) => R.push([dx, dy, w, h, col, noOut]);
  const k = e.type;
  if (k === 'lacraia') {
    if (e.mode === 'hide' || !e.mode) {
      // só as antenas tremendo para fora da fenda
      A(-8, -1, 16, 1, '#0a0806', 1); A(-5, -2, 10, 1, '#0a0806', 1);
      const tw = Math.sin(t * 9) > 0 ? 1 : 0; A(2, -4 - tw, 1, 3, '#8a7a6a', 1); A(4, -5 + tw, 1, 4, '#8a7a6a', 1); A(3, -2, 2, 1, '#6a4a50');
    } else {
      for (let i = 0; i < 9; i++) {
        const sx = -12 + i * 3, wob = Math.round(Math.sin(t * 14 + i * 0.9)), sy = -5 + wob;
        A(sx, sy, 3, 4, i % 2 ? '#3a2a30' : '#4a3438'); A(sx, sy, 3, 1, '#7a5a60');
        const lg = Math.sin(t * 22 + i) > 0 ? 1 : 0; A(sx + lg, -1, 1, 1, '#2a1a20', 1); A(sx + 2 - lg, -1, 1, 1, '#2a1a20', 1);
      }
      A(14, -6, 4, 4, '#5a3a40'); A(17, -3, 2, 1, '#e8dcc8'); A(17, -6, 1, 1, '#e8dcc8');
      A(15, -5, 1, 1, '#c8c0b8'); // olho cego, leitoso
      A(17, -9, 1, 3, '#8a7a6a', 1); A(18, -11, 1, 2, '#8a7a6a', 1); A(-14, -5, 2, 1, '#5a3a40');
    }
  } else if (k === 'morcego') {
    const hang = e.mode === 'hang' || !e.mode;
    if (hang) { A(-2, -10, 4, 8, '#1a1620'); A(-3, -8, 1, 5, '#2a2434'); A(2, -8, 1, 5, '#2a2434'); A(-1, -3, 1, 1, '#8a8ab0'); A(1, -3, 1, 1, '#8a8ab0'); A(-1, -11, 2, 1, '#3a3448'); }
    else {
      const fl = Math.sin(t * 24) > 0 ? -3 : 1;
      A(-2, -6, 5, 4, '#1a1620'); A(-9, -6 + fl, 7, 2, '#2a2434'); A(3, -6 + fl, 7, 2, '#2a2434'); A(-10, -5 + fl, 2, 1, '#8a8ab0', 1); A(9, -5 + fl, 2, 1, '#8a8ab0', 1);
      A(0, -5, 1, 1, '#d8e0ff'); A(2, -5, 1, 1, '#d8e0ff');
    }
  } else if (k === 'sapo') {
    const rock = e.mode === 'rock' || !e.mode, br = rock && (t % 2.4) < 0.25;
    if (rock) {
      // pedra... que respira de vez em quando
      A(-8, -8 - (br ? 1 : 0), 16, 8 + (br ? 1 : 0), '#4a4038'); A(-6, -9 - (br ? 1 : 0), 11, 2, '#625448'); A(-5, -5, 3, 2, '#3a322c'); A(2, -4, 4, 2, '#3a322c'); A(-2, -7, 2, 1, '#7a6a5a');
      if (br) { A(3, -8, 1, 1, '#c8b040', 1); A(5, -8, 1, 1, '#c8b040', 1); }
    } else {
      A(-7, -9, 14, 7, '#5a5040'); A(-5, -11, 6, 3, '#6a6050'); A(1, -12, 3, 3, '#4a4234'); A(2, -12, 2, 2, '#e0c040'); A(3, -11, 1, 1, '#1a1208');
      A(-8, -3, 4, 3, '#4a4034'); A(5, -3, 4, 3, '#4a4034'); A(4, -6, 5, 1, '#2a1a12');
      if (e.tongue > 0) A(8, -6, Math.round(e.tongue), 2, '#d06080');
    }
  } else if (k === 'besouro') {
    A(-8, -9, 12, 7, '#2a2a3a'); A(-7, -10, 9, 2, '#3a3a50'); A(-9, -7, 3, 4, '#6a3a4a'); // traseira mole e avermelhada
    for (let i = 0; i < 3; i++) { const lg = Math.sin(t * 16 + i * 2) > 0 ? 1 : 0; A(-6 + i * 4 + lg, -2, 1, 2, '#1a1a24', 1); }
    // casco de cristal na frente
    A(3, -12, 6, 11, '#5a9ab8'); A(4, -13, 4, 2, '#9ad8f0'); A(5, -11, 2, 6, '#e0f8ff'); A(8, -9, 2, 6, '#3a7a98'); A(3, -4, 7, 2, '#4a8aa8');
    if (Math.sin(t * 3 + e.x) > 0.7) A(6, -10, 1, 1, '#ffffff', 1);
  } else if (k === 'raizes') {
    // raízes negras do Corpo-seco cobrindo o último suporte
    for (let i = 0; i < 8; i++) { const ox = -10 + i * 3, wv = Math.sin(t * 2 + i) * 1.5; for (let yy = 0; yy < 54; yy += 2) A(Math.round(ox + Math.sin(yy * 0.2 + i) * 3 + wv), -yy - 2, 2, 2, i % 2 ? '#120a0e' : '#1e1018'); }
    const p = (Math.sin(t * 4) + 1) / 2; for (let i = 0; i < 10; i++) A(-8 + hash(i * 3) * 16, -4 - hash(i * 7) * 48, 1, 2, p > 0.5 ? '#ff3a4a' : '#a0182a', 1);
  } else return false;
  c.fillStyle = '#08060a';
  for (const q of R) { if (q[5]) continue; const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillRect(Math.round(sx) - 1, Math.round(y + q[1]) - 1, q[2] + 2, q[3] + 2); }
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillStyle = flash ? '#fff' : q[4]; c.fillRect(Math.round(sx), Math.round(y + q[1]), q[2], q[3]); }
  return true;
}

// ---------- Chefe: Boitatá Encarcerado ----------
// O combate não mede a vida do guardião: mede quanto falta para libertá-lo (três correntes).
BOSS_INTRO.boitata = [
  ['', 'Correntes se arrastam no escuro. Dois olhos se acendem.'],
  ['', 'Uma serpente de fogo percorre o teto... e é puxada de volta, com violência, pelas pedras.'],
  ['Espírito', 'Ela não ataca por ódio. Está presa.'],
  ['Espírito', 'Não é a serpente que eu preciso vencer. São as correntes.'],
];
BOSSES.boitata = {
  nome: 'BOITATÁ ENCARCERADO', sub: 'quebre as correntes, não a serpente',
  init() {
    const A = G.lvl.arena, sup = [0.2, 0.5, 0.8].map((k, i) => ({ x: A.x0 + Math.round(AW * k), broken: false, i }));
    const seg = []; for (let i = 0; i < 40; i++) seg.push({ x: A.x0 + 260 + i * 4, y: GY - 8 });
    return { w: 22, h: 16, hp: 1, contact: 14, inv: true, noAim: true, chains: 3, sup, seg, y: GY - 8, glow: 0, shield: false, rockCd: 3 };
  },
  update(B, dt) {
    const [a0, a1] = arenaX(), P = G.P, px = P.x + 5, dx = px - B.x, ph = 4 - B.chains;
    // corpo contínuo: cada escama segue a da frente a uma distância fixa
    B.seg[0].x = B.x; B.seg[0].y = B.y;
    for (let i = 1; i < B.seg.length; i++) { const a = B.seg[i - 1], b = B.seg[i], d = Math.hypot(b.x - a.x, b.y - a.y); if (d > 4) { b.x = a.x + (b.x - a.x) / d * 4; b.y = a.y + (b.y - a.y) / d * 4; } }
    B.glow = Math.max(0, B.glow - dt * 2);
    if (B.st === 'freed') return boitataFreedTick(B, dt);
    // fase 2: a arena desaba aos poucos
    if (ph === 2) { B.rockCd -= dt; if (B.rockCd <= 0) { B.rockCd = 2.6; const rx = clamp(px + rnd(-60, 60), a0 + 10, a1 - 10); addHazard({ x: rx - 6, y: GY - 2, w: 12, h: 2, life: 0.9, draw: h => { ctx.globalAlpha = 0.5 + Math.sin(G.t * 25) * 0.4; for (let i = 0; i < h.w; i += 3) rect(ctx, h.x + i, GY - 1, 2, 1, '#c8b8a0'); ctx.globalAlpha = 1; } }); setTimeout(() => { if (G.boss === B) shoot({ team: 'e', x: rx, y: -6, vx: 0, vy: 200, w: 8, h: 8, dmg: 16, kind: 'rock', grav: 300, life: 2 }); }, 700); } }
    // fase 3: o sopro de fogo rompe a última corrente se as raízes já caíram
    if (ph === 3) for (const p of G.projs) if (p.kind === 'sopro') for (const s of B.sup) if (!s.broken && Math.abs(p.x - s.x) < 10) { p.life = 0; if (B.shield) { floatText(s.x, GY - 64, 'as raízes seguram', '#ff3a4a'); for (let i = 0; i < 10; i++) part(s.x, GY - 30, rnd(-40, 40), rnd(-60, 0), 0.5, '#ff6a2a'); } else breakSupport(B, s); }
    switch (B.st) {
      case 'idle': {
        if (ph === 2) { go(B, 'climb', 0); B.path = null; break; }
        B.y = GY - 8; B.f = Math.sign(dx) || B.f;
        B.x += clamp((px - B.f * 90) - B.x, -1, 1) * 30 * dt;
        if (B.tt > 0) break;
        const r = Math.random();
        const n = ph === 1 ? (Math.abs(dx) < 50 ? 'tailW' : r < 0.6 ? 'chargeW' : 'fireW') : (r < 0.65 ? 'breathW' : 'chargeW');
        go(B, n, { tailW: 0.45, chargeW: 0.7, fireW: 0.6, breathW: 0.8 }[n]); B.dir = Math.sign(dx) || B.f;
        break;
      }
      case 'chargeW': B.glow = 1; B.dir = Math.sign(dx) || B.dir; B.f = B.dir; if (B.tt <= 0) { go(B, 'charge', 2.5); SFX.roar(); } break;
      case 'charge': {
        B.x += B.dir * 240 * dt; B.y = GY - 8;
        for (const s of B.sup) if (!s.broken && Math.abs(B.x - s.x) < 10 && B.lastSup !== s) {
          B.lastSup = s;
          if (ph === 3) { floatText(s.x, GY - 64, 'as raízes seguram', '#ff3a4a'); go(B, 'stun', 0.6); G.cam.shake = 4; }
          else { breakSupport(B, s); go(B, 'stun', 1.4); }
          break;
        }
        if (B.st === 'charge' && (B.x <= a0 + 14 || B.x >= a1 - 14 || B.tt <= 0)) { go(B, 'stun', 0.7); G.cam.shake = 5; SFX.boom(); bossFx('burst', B.x, GY, B.dir, { col: '#ff9a3a' }); }
        break;
      }
      case 'stun': B.lastSup = null; if (B.tt <= 0) go(B, 'idle', ph === 3 ? 0.4 : 0.6); break;
      case 'tailW': B.glow = 1; if (B.tt <= 0) { go(B, 'rec', 0.6); bossFx('ring', B.x, GY - 6, B.f, { r: 70 }); SFX.fire(); if (Math.abs(px - B.x) < 50 && P.y + P.h > GY - 30) hurtPlayer(18, B.x); } break;
      case 'fireW': B.glow = 1; if (B.tt <= 0) {
        for (let i = 0; i < 3; i++) { const T = 0.9 + i * 0.15, tx = px + (i - 1) * 26; shoot({ team: 'e', x: B.x, y: B.y - 8, vx: (tx - B.x) / T, vy: (GY - (B.y - 8) - 0.5 * 300 * T * T) / T, w: 7, h: 7, dmg: 14, kind: 'bfire', grav: 300, life: 3, land: (p, s) => addHazard({ kind: 'fire', x: p.x - 10, y: s.y - 12, w: 20, h: 12, life: 2.2, dmg: 10 }) }); }
        SFX.fire(); go(B, 'rec', 0.7);
      } break;
      case 'breathW': B.glow = 1; B.f = Math.sign(dx) || B.f; B.y = GY - 8; if (B.tt <= 0) { shoot({ team: 'e', x: B.x + B.f * 12, y: GY - 16, vx: B.f * 170, vy: 0, w: 14, h: 10, dmg: 18, kind: 'sopro', life: 2.5 }); SFX.fire(); go(B, 'rec', 0.8); } break;
      case 'rec': if (B.tt <= 0) go(B, 'idle', ph === 3 ? 0.3 : 0.5); break;
      // fase 2: sobe pela parede, rasteja pelo teto e mergulha
      case 'climb': {
        const wx = B.x < (a0 + a1) / 2 ? a0 + 12 : a1 - 12;
        if (!B.path) B.path = [[wx, GY - 8], [wx, 18]];
        const [tx, ty] = B.path[0], d = Math.hypot(tx - B.x, ty - B.y);
        if (d < 4) { B.path.shift(); if (!B.path.length) { go(B, 'crawl', rnd(1.4, 2.4)); B.path = null; } }
        else { B.x += (tx - B.x) / d * 150 * dt; B.y += (ty - B.y) / d * 150 * dt; }
        break;
      }
      case 'crawl': B.y = 18 + Math.sin(B.t * 3) * 2; B.x += clamp(px - B.x, -1, 1) * 95 * dt; if (B.tt <= 0 && Math.abs(px - B.x) < 12) { go(B, 'diveW', 0.85); B.diveX = px; } break;
      case 'diveW': B.glow = 1; B.x = B.diveX; if (B.tt <= 0) { go(B, 'dive', 2); SFX.roar(); } break;
      case 'dive': B.y += 330 * dt; if (B.y >= GY - 8) {
        B.y = GY - 8; G.cam.shake = 7; SFX.boom(); bossFx('burst', B.x, GY, 1, { col: '#ff9a3a' });
        const s = B.sup.find(s2 => !s2.broken && Math.abs(s2.x - B.x) < 22);
        if (s) breakSupport(B, s);
        else for (const dir of [-1, 1]) addHazard({ kind: 'shock', x: B.x - 4, y: GY - 10, w: 8, h: 10, vx: dir * 140, life: 1.4, dmg: 14, col: '#ff8a3a' });
        if (B.st === 'dive') go(B, 'stun', 1.1);
      } break;
    }
  },
  draw(B) { drawBoitata(B); },
};
function breakSupport(B, s) {
  if (s.broken) return;
  s.broken = true; B.chains--; B.glow = 1;
  SFX.boom(); G.cam.shake = 9; G.flash = 0.2; G.flashCol = '#ff9a3a';
  bossFx('burst', s.x, GY, 1, { col: '#c8b8a0' });
  for (let i = 0; i < 30; i++) part(s.x + rnd(-8, 8), GY - rnd(0, 60), rnd(-60, 60), rnd(-90, 0), rnd(0.5, 1.1), pick(['#6a5a4a', '#8a7a6a', '#ff9a3a']), 2, 300);
  floatText(s.x, GY - 70, 'corrente rompida', '#ffd27a');
  hud.cache = {};
  if (B.chains === 2) showToast('O Desespero', 'ele foge pelas paredes e pelo teto', 2.4);
  if (B.chains === 1) {
    const last = B.sup.find(s2 => !s2.broken);
    showToast('A Última Corrente', 'abra as raízes e guie o sopro de fogo até o suporte', 3);
    const e = makeEnemy('raizes', last.x - 11, null); e.fixed = true; e.mem = 0; e.keep = false;
    e.onDeath = () => { B.shield = false; floatText(last.x, GY - 66, 'as raízes cedem', '#bfe4ff'); };
    B.shield = true; G.ents.push(e);
    go(B, 'idle', 0.8); B.x = clamp(B.x, last.x - 140, last.x + 140);
  }
  if (B.chains === 0) {
    go(B, 'freed', 999); B.contact = 0; G.projs = []; G.hazards = [];
    for (const e of G.ents) if (e.type === 'raizes') e.hp = 0;
    scene(() => STORY.boitataFreed(B));
  }
}
function boitataFreedTick(B, dt) {
  // cai exausta; depois se ergue, olha e sai pela abertura do teto
  const A = G.lvl.arena, ox = A.x0 + AW / 2;
  // sobe até a cauda inteira passar pela abertura (o corpo tem ~160px), com limite de tempo de segurança
  if (B.leaving) { B.leaveT = (B.leaveT || 0) + dt; B.x += clamp(ox - B.x, -1, 1) * 60 * dt; B.y -= 130 * dt; if (B.seg[B.seg.length - 1].y < -20 || B.leaveT > 6) B.gone = true; }
  else if (B.rise) { B.y += ((GY - 40) - B.y) * 2 * dt; B.f = Math.sign(G.P.x - B.x) || B.f; }
  else B.y += ((GY - 4) - B.y) * 3 * dt;
}
function drawSupports(B, t) {
  for (const s of B.sup) {
    if (s.broken) { for (let i = 0; i < 6; i++) rect(ctx, s.x - 12 + i * 4, GY - 6 - (i % 3) * 3, 5, 6 + (i % 3) * 3, i % 2 ? '#4a4038' : '#625448'); rect(ctx, s.x - 6, GY - 22, 12, 16, '#4a4038'); rect(ctx, s.x - 6, GY - 22, 12, 2, '#2a221e'); continue; }
    rect(ctx, s.x - 9, GY - 64, 18, 64, '#08060a'); rect(ctx, s.x - 8, GY - 63, 16, 63, '#4a4038'); rect(ctx, s.x - 8, GY - 63, 4, 63, '#625448'); rect(ctx, s.x + 5, GY - 63, 3, 63, '#2e2722');
    rect(ctx, s.x - 10, GY - 66, 20, 5, '#5a4e44'); rect(ctx, s.x - 3, GY - 70, 6, 5, '#8a8a92');
    // fissuras luminosas: mais vivas a cada corrente rompida
    const k = (Math.sin(t * 4 + s.i) + 1) / 2, col = k > 0.5 ? '#ffd27a' : '#ff8a3a';
    ctx.globalAlpha = 0.5 + (3 - B.chains) * 0.15;
    for (let y = GY - 58; y < GY - 6; y += 6) rect(ctx, s.x - 4 + Math.round(Math.sin(y * 0.3 + s.i) * 3), y, 1, 4, col);
    ctx.globalAlpha = 1;
  }
}
function drawBoitata(B) {
  const t = B.t, seg = B.seg; if (!seg.length) return;
  const glow = B.glow, rev = B.revive || 0, freed = B.st === 'freed';
  // brilho em volta das escamas (antecipa o ataque)
  ctx.globalAlpha = 0.06 + glow * 0.1; for (let i = 0; i < seg.length; i += 4) ell(ctx, seg[i].x, seg[i].y, 11, 8, '#ff8a3a'); ctx.globalAlpha = 1;
  // corpo da cauda para a cabeça
  for (let i = seg.length - 1; i >= 0; i--) {
    const s = seg[i], r = Math.max(2, Math.round(7.5 - i * 0.14)), dim = freed && !B.rise ? 0.55 : 1;
    const lit = rev > 0 && Math.abs(i / seg.length - (1 - rev)) < 0.08;
    ell(ctx, s.x, s.y, r + 1, r, '#1a0604');
    ell(ctx, s.x, s.y, r, r - 1, lit ? '#bfe4ff' : dim < 1 ? '#7a3a1a' : '#c8501e');
    if (i % 3 === 0) rect(ctx, s.x - 1, s.y - r + 1, 2, 2, lit ? '#ffffff' : glow > 0.3 ? '#ffd27a' : '#ff9a3a');
    if (!freed && i % 3 === 0 && Math.sin(t * 14 + i) > 0.3) rect(ctx, s.x, s.y - r - 2, 1, 2, '#ffd27a');
  }
  // cabeça: chama de crina, olhos acesos, boca brilhando quando vai soprar
  const h = seg[0], n = seg[2] || h, ang = Math.atan2(h.y - n.y, h.x - n.x || 0.001), ca = Math.cos(ang), sa = Math.sin(ang);
  ell(ctx, h.x, h.y, 10, 8, '#1a0604'); ell(ctx, h.x, h.y, 9, 7, '#d8602a'); ell(ctx, h.x + ca * 4, h.y + sa * 4, 6, 4, '#e87a3a');
  const ex = h.x + ca * 3 - sa * 3, ey = h.y + sa * 3 + ca * 3 - 2, ex2 = h.x + ca * 3 + sa * 3, ey2 = h.y + sa * 3 - ca * 3 - 2;
  const eyeC = freed && !B.rise ? '#5a3a2a' : '#fff6c0';
  rect(ctx, ex - 1, ey - 1, 3, 2, eyeC); rect(ctx, ex2 - 1, ey2 - 1, 3, 2, eyeC); rect(ctx, ex, ey - 1, 1, 1, '#c8202a'); rect(ctx, ex2, ey2 - 1, 1, 1, '#c8202a');
  if (B.st === 'breathW' || B.st === 'fireW') { ctx.globalAlpha = 0.5 + Math.sin(t * 30) * 0.3; ell(ctx, h.x + ca * 9, h.y + sa * 9, 4, 3, '#fff0b0'); ctx.globalAlpha = 1; }
  if (!freed || B.rise) for (let i = 0; i < 5; i++) rect(ctx, h.x - ca * (2 + i * 2) + (Math.sin(t * 18 + i) > 0 ? 1 : 0), h.y - 8 - (i % 2) * 2, 2, 3, i % 2 ? '#ffd27a' : '#ff8a3a');
  // correntes: do topo de cada suporte até o corpo, esticadas quando ele se afasta
  if (!freed) for (const s of B.sup) {
    if (s.broken) { for (let y = 0; y < 18; y += 3) rect(ctx, s.x - 1 + Math.sin(t * 2 + y) * 1.5, GY - 66 + y, 2, 2, '#6a6a72'); continue; }
    const b = seg[8 + s.i * 9] || h, x0 = s.x, y0 = GY - 68, L2 = Math.hypot(b.x - x0, b.y - y0), taut = L2 > 120;
    for (let i = 0; i <= L2; i += 4) { const k = i / L2, cx = x0 + (b.x - x0) * k, cy = y0 + (b.y - y0) * k + (taut ? 0 : Math.sin(k * Math.PI) * 10); rect(ctx, cx - 1, cy - 1, (i / 4) % 2 ? 3 : 2, (i / 4) % 2 ? 2 : 3, taut ? '#c8805a' : '#8a8a92'); }
    rect(ctx, b.x - 4, b.y - 3, 8, 6, '#4a4038'); rect(ctx, b.x - 4, b.y - 3, 8, 1, '#8a8a92');
  }
  // fase 2: marca no chão de onde ele vai cair
  if (B.st === 'diveW') { ctx.globalAlpha = 0.5 + Math.sin(t * 25) * 0.4; for (let i = -12; i <= 12; i += 3) rect(ctx, B.x + i, GY - 1, 2, 1, '#ffd27a'); ctx.globalAlpha = 1; }
}
STORY.boitataFreed = async function (B) {
  musicSet('victory');
  await wait(1.6);
  await talk([['', 'A última corrente se rompe. A serpente cai, exausta. Tudo fica em silêncio.']]);
  for (let i = 0; i <= 40; i++) { B.revive = i / 40; await wait(0.05); }
  B.revive = 0; B.rise = true; await wait(1.2);
  await talk([['', 'Uma pequena chama percorre as escamas. O Boitatá se ergue e olha para você.'], ['Espírito', 'Você não precisava ser vencido. Só precisava ser solto.']]);
  B.leaving = true; G.lvl.lights.push({ x: G.lvl.arena.x0 + AW / 2, y: 0, r: 80 });
  await waitUntil(() => B.gone);
  G.boss = null;
  await talk([['', 'Antes de partir, uma escama se desprende e vira uma chama azul-esbranquiçada. Ela flutua até você.']]);
  G.save.cold = true; SV().ev.boitata = true; giveRelic('olho_fogo_frio'); writeSave();
  G.relic = { x: G.P.x, y: G.P.y - 20, cd: 0 };
  SFX.echo(); G.flash = 0.35; G.flashCol = '#bfe4ff';
  showToast('Olho de Fogo Frio', 'luz ancestral · chama purificadora · brasa de proteção', 3.2);
  hint('<kbd>E</kbd> perto dos <b>Cipós-de-Sangue</b>: purificar com o fogo frio · nas fogueiras: <b>Viajar</b>', '<b>Agir</b> perto dos <b>Cipós-de-Sangue</b>: purificar · nas fogueiras: <b>Viajar</b>', 8);
  G.lvl.arena.cleared = true; resetArena(); musicSet('gruta');
};

// ---------- A fase: Gruta dos Antigos ----------
function lastChest(L, o) { Object.assign(L.chests[L.chests.length - 1], o); return L; }
LEVELS.gruta = function () {
  const L2 = LV({ act: 2, biome: 'gruta', name: 'Região IV — Gruta dos Antigos', w: 3000, start: 30, cave: true });
  // 1 · Fenda das Raízes (entrada pelo Cerrado: luz que desce pela fenda)
  L2.g(0, 420).light(50, 10, 80).light(60, 80, 60).hv(90).hv(300).f(210, 'g1');
  L2.tr(110, async () => {
    if (SV().ev.grutaIn) return; SV().ev.grutaIn = 1;
    G.cam.shake = 3; SFX.boom(); for (let i = 0; i < 20; i++) part(rnd(G.cam.x, G.cam.x + W), 0, 0, rnd(20, 60), 2, '#5a4a3e', 1, 120);
    await talk([['', 'Um ronco vem de baixo da terra. Pedrinhas caem do teto.'], ['Espírito', 'Aqui embaixo, quem enxerga é o fogo. E quem escuta... são eles.']]);
    hint('A <b>tocha</b> ilumina e desperta as pinturas · segure <kbd>↓</kbd> para andar em <b>silêncio</b>', 'A <b>tocha</b> ilumina e desperta as pinturas · cuidado com o <b>barulho</b>', 7);
  });
  // 2 · Galeria do Silêncio: uma lacraia isolada ensina o barulho; morcegos sobre o vão
  L2.g(420, 820).g(872, 1000).p(832, 124, 30);
  L2.e('lacraia', 640).e('morcego', 760, 26).e('morcego', 930, 24);
  L2.tr(470, async () => { hint('Barulho atrai as <b>lacraias</b>: elas não veem, escutam · <kbd>K</kbd> atire na parede para distrair', 'Barulho atrai as <b>lacraias</b> · atire no chão longe de você para distrair', 7); });
  L2.tr(720, async () => { hint('<b>Morcegos-fantasma</b> mergulham na luz e apagam a tocha', '<b>Morcegos-fantasma</b> mergulham na luz e apagam a tocha', 5); });
  // 3 · Salão das Memórias: seis pinturas e uma passagem selada (a Sétima Pintura)
  L2.g(1000, 1520);
  for (let i = 0; i < 6; i++) L2.mural(1066 + i * 66, 'm' + (i + 1));
  L2.mural(1478, 'm7', { w: 84, h: 46, y: GY - 70, need: 'gruta_setima' }).gate(1478, 'gruta_setima', { w: 92, h: 60, solid: false, kind: 'nicho', reward: 'a Sétima Pintura', msg: 'Atrás dos cipós há uma pintura maior. A tocha não alcança.' });
  // 4 · Rio Sepultado: rota opcional, com uma escama guardada no alto e uma sala oculta
  L2.g(1520, 1580).wt(1580, 1900, 152).g(1580, 1900, 172).g(1900, 1960);
  L2.flog(1592, 142, 28).flog(1650, 142, 26).p(1710, 146, 34, { dx: 16, spd: 0.8, canoe: true }).flog(1780, 142, 26).flog(1840, 142, 28);
  L2.p(1730, 100, 36).chest(1748, 'g_rio', 100); lastChest(L2, { item: 'escama_rio' });
  L2.e('sapo', 1550).e('sapo', 1930);
  L2.gate(1945, 'gruta_rio', { w: 26, h: 40, solid: false, kind: 'nicho', reward: 'uma sala oculta no Rio Sepultado' }).chest(1945, 'g_rio2');
  lastChest(L2, { need: 'gruta_rio' });
  // 5 · Poço dos Ecos: trilha sobre o abismo; a serpente passa lá embaixo; atalho de tronco
  L2.g(1960, 2012).g(2298, 3000);
  L2.p(2030, 132, 30).p(2082, 116, 30).p(2134, 100, 30).p(2186, 116, 30).p(2238, 132, 30);
  L2.glimpse = { x0: 2012, x1: 2298, y: 172 };
  L2.bridge(2012, 2298, 142, 'gruta_atalho', 2306);
  L2.e('besouro', 2330).e('lacraia', 1972).e('morcego', 2160, 30);
  L2.f(2350, 'g2');
  // 6 · Ventre da Terra: arena circular do Boitatá
  L2.ar(2400, 'boitata').area(2390);
  // 7 · Santuário da Última Brasa: descanso, relíquia e a saída selada (primeiro uso do fogo frio)
  L2.f(2790, 'g3').light(2790, 40, 50);
  L2.gate(2930, 'gruta_saida', { w: 20, h: 90, solid: true, kind: 'parede', reward: 'a saída para o Pantanal', msg: 'Os cipós fecham a saída. Só um fogo que não queima o que é vivo abre isto.' });
  L2.tr(2975, async () => { G.lvl.arena && (G.lvl.arena.cleared = true); await nextAct(); });
  if (SV().ev.boitata && L2.arena) L2.arena.cleared = true;
  return L2;
};
AREAS.gruta = 'Ventre da Terra';

// ---------- Ruínas do Primeiro Povo (atrás do Templo Selado da Amazônia) ----------
LEVELS.ruinas = function () {
  const L2 = LV({ act: 1, biome: 'gruta', name: 'Ruínas do Primeiro Povo', w: 760, start: 40, cave: true });
  L2.g(0, 300).g(340, 760).p(304, 128, 34).light(120, 0, 60).light(560, 0, 50);
  L2.door(40, 'amazonia', 1110, 'Sair para a Amazônia', { arch: true });
  L2.mural(200, 'r1').mural(470, 'r2');
  L2.e('besouro', 420).e('morcego', 520, 28).e('sapo', 620);
  L2.chest(700, 'ru_1'); lastChest(L2, { item: 'coracao_antigo' });
  L2.triggers.push({ x: 60, done: false, visit: true, fn: async () => {
    if (SV().ev.ruinas) return; SV().ev.ruinas = 1; writeSave();
    await talk([['', 'Pedras cobertas de musgo e desenhos. O primeiro povo andava com o guardião, não fugia dele.'], ['Espírito', 'O Mapinguari não era só medo. Era muralha.']]);
  } });
  return L2;
};

// ---------- Selos nas regiões já visitadas ----------
// (as fases antigas recebem os obstáculos sem mudar o resto do roteiro)
const _amazonia = LEVELS.amazonia, _cerrado = LEVELS.cerrado, _caatinga = LEVELS.caatinga;
LEVELS.amazonia = function () {
  const L2 = _amazonia();
  L2.gate(1110, 'amazonia_templo', { w: 30, h: 46, solid: false, kind: 'templo', reward: 'as Ruínas do Primeiro Povo', msg: 'Um templo antigo, fechado por cipós que pulsam. A lança e a zarabatana não fazem nem um risco.' });
  L2.door(1110, 'ruinas', null, 'Entrar nas Ruínas do Primeiro Povo', { need: 'amazonia_templo' });
  L2.gate(770, 'amazonia_arvore', { y: 136, w: 18, h: 30, solid: false, kind: 'arvore', reward: 'a seiva da Árvore Oca' }).chest(770, 'a_oca', 136);
  lastChest(L2, { need: 'amazonia_arvore', item: 'seiva_antiga' });
  return L2;
};
LEVELS.cerrado = function () {
  const L2 = _cerrado();
  L2.gate(860, 'cerrado_raizes', { w: 30, h: 44, solid: false, kind: 'raizes', reward: 'um caminho mágico para a Caatinga', msg: 'Raízes mortas e cipós fecham uma trilha que desce para o leste.' });
  L2.door(860, 'caatinga', null, 'Atalho para a Caatinga', { need: 'cerrado_raizes', cond: () => G.save.act >= 4 });
  return L2;
};
LEVELS.caatinga = function () {
  const L2 = _caatinga();
  L2.gate(1580, 'caatinga_altar', { w: 30, h: 40, solid: false, kind: 'altar', reward: 'o desafio do Altar das Cinzas', onOpen: async g => {
    for (const [type, dx] of [['lanceiro', -60], ['brute', 60], ['lanceiro', 110]]) { const e = makeEnemy(type, g.x + dx, null); e.hp = e.hpMax = Math.round(e.hp * 1.4); e.dmg = Math.round(e.dmg * 1.2); G.ents.push(e); }
    showToast('Altar das Cinzas', 'as cinzas se levantam em forma de bicho', 2.6); SFX.roar();
  } }).chest(1580, 'k_altar');
  lastChest(L2, { need: 'caatinga_altar', item: 'cinza_ancestral' });
  return L2;
};
