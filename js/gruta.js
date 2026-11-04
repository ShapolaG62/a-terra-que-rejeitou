'use strict';
// Gruta dos Antigos: uma área subterrânea acessível pela pedra do Cerrado.
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
const GRUTA_CARD = ['Cerrado · interior', 'Gruta dos Antigos', 'O Boitatá', 'Sob a pedra, a Terra guarda aquilo que os homens tentaram esquecer.'];

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
const TRAVEL = [['amazonia', 'Amazônia', 1], ['cerrado', 'Cerrado', 2], ['caatinga', 'Caatinga', 4]];
async function travelMenu() {
  const home = homeLevel() === 'gruta' ? 'cerrado' : homeLevel(), here = G.lvl.id;
  const opts = TRAVEL.filter(([id, , a]) => id !== here && (id === home || G.save.act > a || (id === 'gruta' && SV().ev.boitata)));
  if (home !== here && !opts.some(o => o[0] === home)) opts.unshift([home, 'Voltar à jornada', 0]);
  const html = `<h2>Viajar</h2><p>O fogo frio liga as fogueiras já acesas.</p><div class="btns">${opts.map(([id, nome]) => `<button class="btn" data-act="${id}">${id === home ? 'Voltar à jornada · ' + (id === 'gruta' ? 'Gruta' : CARDS[ACTS.indexOf(id)][1]) : nome}</button>`).join('')}<button class="btn" data-act="back">Ficar</button></div>`;
  const a = await menu(html);
  return a === 'back' ? null : a;
}
async function travelTo(id, x) {
  if (id === 'gruta') return enterGruta();
  if (G.lvl.id === 'gruta') { G.save.sub = null; G.save.caveReturn = null; }
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

// A descida troca apenas o interior; o ato e as conquistas do Cerrado continuam os mesmos.
async function useCavePassage(direction, exit) {
  const down = direction === 'down', L = G.lvl, P = G.P;
  const passage = down ? L.caveEntry : (L.caveExits || []).find(e => e === exit);
  if (G.cavePassage || G.boss || !P || P.state !== 'normal' || !P.onG ||
      (down ? L.id !== 'cerrado' : L.id !== 'gruta') || !passage ||
      (passage.need && !gateOpen(passage.need)) || Math.abs(P.x + 5 - passage.x) > INTERACT_R ||
      Math.abs(P.y + P.h - passage.y) > 12) return;
  const carried = { form: P.form, hp: P.hp, st: P.st, flasks: P.flasks, spCd: P.spCd };
  G.cavePassage = { direction, phase: 'align', t0: G.rt, dur: 0.8, x: passage.x, y: passage.y };
  try {
    const t0 = G.rt;
    G.auto = Math.sign(passage.x - (P.x + 5));
    await waitUntil(() => Math.abs(P.x + 5 - passage.x) < 2 || G.rt - t0 > 0.5);
    G.auto = 0; P.x = passage.x - 5; P.y = passage.y - P.h; P.vx = P.vy = 0;
    G.cavePassage.phase = 'depart'; G.cavePassage.t0 = G.rt;
    SFX.step(); await wait(0.9); await fade(true);
    let target, px;
    if (down) {
      G.save.caveReturn = { x: passage.x, sub: G.save.sub || null, fire: G.save.fire && { ...G.save.fire } };
      if (G.save.act === 2) G.save.sub = 'gruta';
      target = 'gruta'; px = 56;
      G.save.fire = { lvl: target, x: 96 };
    } else {
      const back = G.save.caveReturn;
      px = back && Number.isFinite(back.x) ? back.x : 430; target = 'cerrado';
      G.save.sub = back && back.sub !== 'gruta' ? back.sub : null;
      G.save.fire = back && back.fire && back.fire.lvl === target ? back.fire : { lvl: target, x: 325 };
      G.save.caveReturn = null;
    }
    writeSave(); loadLevel(target);
    G.P = makePlayer(px - 5, groundY(px));
    Object.assign(G.P, carried, { onG: true, f: down ? 1 : -1 });
    G.P.safe = { x: G.P.x, y: G.P.y };
    G.cam.x = clamp(px - W / 2, 0, G.lvl.w - W); G.cam.shake = 0; G.camTarget = null;
    G.state = 'play'; G.trans = null; G.flags = {};
    for (const t of G.lvl.triggers) if (t.x < px - 10 && !t.always) t.done = true;
    G.cavePassage = { direction, phase: 'arrive', t0: G.rt + 0.15, dur: 1.1, x: px, y: groundY(px) };
    hud.boss.hidden = true; hud.cache = {}; updateHudForm();
    await fade(false); await wait(0.45);
    showToast(down ? 'Gruta dos Antigos' : 'De volta ao Cerrado', down ? 'Sob o Cerrado · E na corda para subir' : '', 2.6);
  } finally { G.auto = 0; G.cavePassage = null; $('#fade').classList.remove('on'); }
}
function cavePassageOffset() {
  const a = G.cavePassage;
  if (!a || a.phase === 'align') return 0;
  const k = clamp((G.rt - a.t0) / a.dur, 0, 1), e = k * k * (3 - 2 * k);
  return (a.direction === 'down' ? 1 : -1) * (a.phase === 'depart' ? e * 50 : (e - 1) * 50);
}
function drawCavePassagePlayer(P, t) {
  if (G.cavePassage.phase === 'align') return drawPlayer(P, t);
  const a = G.cavePassage;
  ctx.save();
  try {
    ctx.beginPath(); ctx.rect(a.x - 23, a.y - 90, 46, 92); ctx.clip();
    drawHuman(ctx, P.x + 5, P.y + P.h + cavePassageOffset(), P.f, { kind: 'climb', t: G.rt, moving: true }, playerSpec(P.form));
  } finally { ctx.restore(); }
}

// ---------- Selos de Cipós-de-Sangue ----------
function caveInteractables(add) {
  const L = G.lvl;
  if (L.caveEntry) add(L.caveEntry.x, L.caveEntry.y, 'Descer para a gruta', () => scene(enterGruta));
  for (const exit of L.caveExits || []) if (!exit.need || gateOpen(exit.need)) add(exit.x, exit.y, 'Subir para o Cerrado', () => scene(() => useCavePassage('up', exit)));
  for (const g of L.gates) if (!gateOpen(g.id) && g.dis == null) add(g.x, g.y, G.save.cold ? 'Purificar com o fogo frio' : 'Cipós-de-Sangue', () => G.save.cold ? purifyGate(g) : scene(async () => { await talk([['Espírito', g.msg || 'A lança e o arco não abrem esses cipós. Eles pulsam como coisa viva... mantida à força.']]); }));
  for (const d of L.doors) if ((!d.need || gateOpen(d.need)) && (!d.cond || d.cond())) add(d.x, d.y || GY, d.label, () => scene(() => travelTo(d.to, d.toX)));
  for (const b of L.bridges) if (!gateOpen(b.id)) add(b.lx, GY, 'Derrubar o tronco (atalho)', () => openBridge(b));
}
function purifyGate(g) {
  scene(async () => {
    G.P.vx = 0; SFX.fire(); g.dis = 0; G.flash = 0.2; G.flashCol = '#bfe4ff'; VFX.play('terra/selo', g.x, g.y, { height: g.h });
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
const [darkC, dctx] = mk(W, H);
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
  const cx = G.cam.x, cy = G.cam.y || 0, lights = caveLights();
  dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, W, H);
  dctx.fillStyle = 'rgba(5,3,6,0.88)'; dctx.fillRect(0, 0, W, H);
  dctx.globalCompositeOperation = 'destination-out';
  for (const [x, y, r] of lights) {
    const sx = x - cx, sy = y - cy, radius = r * 1.35; if (sx < -radius || sx > W + radius) continue;
    const g = dctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
    g.addColorStop(0, 'rgba(0,0,0,0.98)'); g.addColorStop(0.18, 'rgba(0,0,0,0.9)');
    g.addColorStop(0.4, 'rgba(0,0,0,0.54)'); g.addColorStop(0.68, 'rgba(0,0,0,0.13)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g; dctx.fillRect(sx - radius, sy - radius, radius * 2, radius * 2);
  }
  dctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkC, 0, 0);
  // cor da luz: fogo alaranjado, olho azul-esbranquiçado
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, k] of lights) { if (!k) continue; softGlow(ctx, x - cx, y - cy, r * 1.1, r * 0.95, k === 'warm' ? '#ff8a3a' : '#7ab8ff', 0.16); }
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
    if (m.lit >= 1 && !SV().murals.includes(m.id)) { SV().murals.push(m.id); writeSave(); SFX.echo(); VFX.memory(G.P.x + 5, G.P.y + G.P.h); showToast('Pintura ' + MURALS[m.id].n, MURALS[m.id].s, 3.2); }
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
  if (L.caveEntry) drawCaveEntrance(L.caveEntry, t);
  for (const e of L.caveExits || []) drawCaveRope(e, t);
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
function drawCaveEntrance(e, t) {
  const x = e.x, y = e.y;
  ell(ctx, x, y - 17, 30, 25, '#2b2422'); ell(ctx, x - 2, y - 19, 26, 23, '#665347');
  ell(ctx, x, y - 14, 18, 20, '#302925'); ell(ctx, x, y - 12, 14, 17, '#0c0b0e');
  for (let i = 0; i < 8; i++) rect(ctx, x - 23 + i * 6, y - 32 + Math.abs(i - 3.5) * 3, 4, 2, i % 2 ? '#897461' : '#4e4237');
  line(ctx, x - 18, y - 36, x + 18, y - 36, '#503926', 3);
  line(ctx, x - 18, y - 37, x + 18, y - 37, '#b18a54');
  line(ctx, x, y - 36, x, y + 1, '#c0a477', 2);
  for (let k = 0; k < 5; k++) rect(ctx, x - 2, y - 31 + k * 7, 4, 1, '#e0c493');
  rect(ctx, x - 27, y - 5, 8, 5, '#554b36'); rect(ctx, x + 20, y - 6, 7, 6, '#6b5943');
  softGlow(ctx, x, y - 12, 24, 18, '#dcb86b', 0.18 + Math.sin(t * 1.5) * 0.03);
  drawPx('Gruta', x, y - 51, { align: 'center', col: '#eedcb2', col2: '#b6976d' });
}
function drawCaveRope(e) {
  line(ctx, e.x, -DY, e.x, e.y - 3, '#806346', 2);
  for (let y = -DY; y < e.y - 3; y += 8) rect(ctx, e.x - 2, y, 4, 1, '#c8ab79');
  rect(ctx, e.x - 9, e.y - 1, 18, 1, '#927c5c');
  drawPx('Subir', e.x + 8, e.y - 50, { col: '#e4d7b6', col2: '#9b8d72' });
}
function drawCaveFront(L, t) {
  const P = G.P;
  if (L.cave && P && !P.hidden && P.state !== 'dead' && !G.cavePassage) {
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
  motion(e, phase, progress, variant) {
    const m = e.motion || (e.motion = {}); m.phase = phase; m.progress = clamp(progress || 0, 0, 1); m.variant = variant;
  },
  mode(e, mode, duration) { e.mode = mode; e.st = e.caveDur = duration; },
  paused(e) { if (!G.lock) return false; e.vx = 0; e.noTouch = true; return true; },
  // Lacraia-cega: sai da fenda e persegue a origem do barulho, mesmo sem ver ninguém
  lacraia(e, dt) {
    if (!e.init) {
      e.init = 1; e.hx = e.x; e.mode = 'hide'; e.dustCd = 0;
      e.hear = x => { e.tx = x; e.heard = 3.6; if (e.mode === 'hide' || e.mode === 'home') CAVE_AI.mode(e, 'alert', 0.35); };
    }
    if (CAVE_AI.paused(e)) return;
    e.heard = Math.max(0, (e.heard || 0) - dt); e.noTouch = true;
    let speed = 0, phase = 'idle', progress = 0;
    if (e.mode === 'alert') {
      e.st -= dt; phase = 'alert'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) e.mode = 'hunt';
    } else if (e.mode === 'hunt') {
      const d = e.tx - (e.x + e.w / 2); e.f = Math.sign(d) || e.f;
      speed = Math.abs(d) < 5 || pitAhead(e) ? 0 : e.f * e.spd; phase = 'move';
      if (!e.heard) e.mode = 'home';
      else if (Math.abs(d) < 23 && e.onG) { CAVE_AI.mode(e, 'coil', 0.32); speed = 0; }
    } else if (e.mode === 'coil') {
      e.st -= dt; phase = 'windup'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) { CAVE_AI.mode(e, 'lunge', 0.28); e.contactHit = false; }
    } else if (e.mode === 'lunge') {
      e.st -= dt; e.noTouch = false; phase = 'attack'; progress = 1 - e.st / e.caveDur;
      speed = pitAhead(e) ? 0 : e.f * e.spd * 1.45;
      if (e.st <= 0 || e.hitWall) { CAVE_AI.mode(e, 'recover', 0.55); speed = 0; e.noTouch = true; }
    } else if (e.mode === 'recover') {
      e.st -= dt; phase = 'recover'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) e.mode = e.heard ? 'hunt' : 'home';
    } else if (e.mode === 'home') {
      const d = e.hx - e.x; e.f = Math.sign(d) || e.f; phase = 'move';
      speed = Math.abs(d) < 3 || pitAhead(e) ? 0 : e.f * e.spd * 0.45;
      if (Math.abs(d) < 3) { e.mode = 'hide'; phase = 'idle'; }
    }
    e.vx = lerp(e.vx, speed, 1 - Math.exp(-dt * (e.mode === 'lunge' ? 22 : 9)));
    e.dustCd -= dt;
    if (Math.abs(e.vx) > 35 && e.dustCd <= 0) { e.dustCd = 0.16; part(e.x + e.w / 2, e.y + e.h, -e.vx * 0.12, -12, 0.3, '#5a4a3e'); }
    CAVE_AI.motion(e, phase, progress, 'centipede');
    e.vy += GRAV * dt; moveBody(e, dt);
  },
  // Morcego-fantasma: mergulha sobre a luz e apaga a tocha
  morcego(e, dt, dx, dy) {
    const P = G.P;
    if (!e.init) { e.init = 1; e.mode = 'hang'; e.caveCd = 0.6; }
    if (CAVE_AI.paused(e)) return;
    e.caveCd = Math.max(0, e.caveCd - dt); e.noTouch = true;
    let phase = 'idle', progress = 0;
    if (e.mode === 'hang') {
      e.vx = e.vy = 0; e.f = Math.sign(dx) || e.f;
      if (e.caveCd <= 0 && G.torchOut <= 0 && Math.abs(dx) < 105 && dy > -10 && dy < 130) CAVE_AI.mode(e, 'aim', 0.48);
    } else if (e.mode === 'aim') {
      e.st -= dt; phase = 'windup'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) {
        const ax = P.x + 5 + P.f * 5 - (e.x + e.w / 2), ay = P.y + 7 - (e.y + e.h / 2), length = Math.hypot(ax, ay) || 1;
        e.vx = ax / length * 148; e.vy = ay / length * 148; e.f = Math.sign(ax) || e.f;
        e.contactHit = false; e.hitTorch = false; e.endDive = false; CAVE_AI.mode(e, 'dive', 0.8);
      }
    } else if (e.mode === 'dive') {
      e.st -= dt; phase = 'attack'; progress = 1 - e.st / e.caveDur; e.noTouch = false;
      if (e.endDive || e.st <= 0) { CAVE_AI.mode(e, 'recover', 0.3); e.noTouch = true; }
      else {
        // O alvo fica marcado no lançamento: correr ou dar dash evita o mergulho.
        e.x += e.vx * dt; e.y += e.vy * dt;
        const floor = groundY(e.x + e.w / 2, e.y);
        if (e.y + e.h >= floor - 2) { e.y = floor - e.h - 2; e.endDive = true; }
        if (!e.hitTorch && overlap(e, P)) {
          e.hitTorch = true; e.endDive = true;
          if (G.torchOut <= 0) { G.torchOut = 4; floatText(P.x + 5, P.y - 6, 'a tocha apagou', '#bfe4ff'); SFX.splash(); }
        }
      }
    } else if (e.mode === 'recover') {
      e.st -= dt; phase = 'recover'; progress = 1 - e.st / e.caveDur;
      e.vx *= Math.exp(-dt * 10); e.vy *= Math.exp(-dt * 10); e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.st <= 0) e.mode = 'up';
    } else {
      phase = 'move'; e.x += (e.hx - e.x) * (1 - Math.exp(-dt * 2.6)); e.y += (e.hy - e.y) * (1 - Math.exp(-dt * 2.6));
      if (Math.abs(e.y - e.hy) < 2 && Math.abs(e.x - e.hx) < 2) { e.mode = 'hang'; e.caveCd = 1.45; }
    }
    CAVE_AI.motion(e, phase, progress, 'bat');
  },
  // Sapo-pedra: camuflado de rocha, respira de leve; salta e golpeia com a língua
  sapo(e, dt, dx, dy) {
    if (!e.init) { e.init = 1; e.mode = 'rock'; e.caveCd = 0.4; }
    if (CAVE_AI.paused(e)) return;
    e.caveCd = Math.max(0, e.caveCd - dt); e.noTouch = true;
    let phase = 'idle', progress = 0;
    if (e.mode === 'rock') {
      e.vx = 0;
      if (Math.abs(dx) < 74 && Math.abs(dy) < 40 && e.caveCd <= 0) { CAVE_AI.mode(e, 'crouch', 0.48); e.f = Math.sign(dx) || e.f; e.leapVx = e.f * clamp(Math.abs(dx) * 2, 65, 120); }
    } else if (e.mode === 'crouch') {
      e.st -= dt; e.vx = 0; phase = 'windup'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) { CAVE_AI.mode(e, 'leap', 0.8); e.vy = -195; e.vx = pitAhead(e, 24) ? 0 : e.leapVx; e.onG = false; e.contactHit = false; SFX.jump(); }
    } else if (e.mode === 'leap') {
      e.st -= dt; e.noTouch = false; phase = 'attack'; progress = 1 - e.st / e.caveDur;
      if (e.onG && e.vy >= 0) { CAVE_AI.mode(e, 'tongueW', 0.32); e.vx = 0; e.noTouch = true; }
    } else if (e.mode === 'tongueW') {
      e.st -= dt; phase = 'windup'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) { CAVE_AI.mode(e, 'tongue', 0.4); e.hitT = false; }
    } else if (e.mode === 'tongue') {
      e.st -= dt; phase = 'attack'; progress = 1 - e.st / e.caveDur;
      const len = 34 * Math.sin(clamp(progress, 0, 1) * Math.PI); e.tongue = len;
      const hb = { x: e.f > 0 ? e.x + e.w : e.x - len, y: e.y + 2, w: len, h: 4 };
      if (!e.hitT && len > 8 && overlap(hb, G.P)) { e.hitT = true; hurtPlayer(e.dmg, e.x + e.w / 2); }
      if (e.st <= 0) { CAVE_AI.mode(e, 'recover', 0.85); e.tongue = 0; }
    } else {
      e.st -= dt; e.vx *= Math.exp(-dt * 12); phase = 'recover'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) { e.mode = 'rock'; e.caveCd = 0.65; }
    }
    CAVE_AI.motion(e, phase, progress, e.mode === 'tongue' || e.mode === 'tongueW' ? 'tongue' : 'frog');
    e.vy += GRAV * dt; moveBody(e, dt);
  },
  // Besouro de Cristal: casco da frente reflete golpes; demora a virar, e o barulho o faz virar
  besouro(e, dt, dx) {
    if (!e.init) {
      e.init = 1; e.shell = true; e.mode = 'walk'; e.caveCd = 0.65; e.turnT = 0;
      e.hear = x => { e.heardF = Math.sign(x - (e.x + e.w / 2)) || e.f; e.ignore = 1.6; };
    }
    if (CAVE_AI.paused(e)) return;
    e.ignore = Math.max(0, (e.ignore || 0) - dt); e.caveCd = Math.max(0, e.caveCd - dt); e.noTouch = true; e.shell = true;
    const want = e.ignore > 0 ? e.heardF : Math.sign(dx) || e.f;
    let speed = 0, phase = 'move', progress = 0;
    if (e.mode === 'turn') {
      e.st -= dt; phase = 'alert'; progress = 1 - e.st / e.caveDur; e.turnT = progress; e.shell = false;
      if (e.st <= 0) { e.f = e.turnF; e.mode = 'walk'; e.turnT = 0; }
    } else if (e.mode === 'brace') {
      e.st -= dt; phase = 'windup'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) { CAVE_AI.mode(e, 'push', 0.45); e.contactHit = false; }
    } else if (e.mode === 'push') {
      e.st -= dt; phase = 'attack'; progress = 1 - e.st / e.caveDur; e.noTouch = false;
      speed = e.f * e.spd * 2.1;
      if (e.st <= 0 || pitAhead(e, 5) || e.hitWall) { CAVE_AI.mode(e, 'recover', 0.7); speed = 0; e.noTouch = true; }
    } else if (e.mode === 'recover') {
      e.st -= dt; phase = 'recover'; progress = 1 - e.st / e.caveDur;
      if (e.st <= 0) { e.mode = 'walk'; e.caveCd = 0.9; }
    } else {
      if (pitAhead(e, 5)) { e.f *= -1; e.caveCd = Math.max(e.caveCd, 0.5); }
      speed = e.f * e.spd * 0.7;
      if ((e.ignore > 0 || Math.abs(dx) < 110) && want !== e.f) { e.turnF = want; CAVE_AI.mode(e, 'turn', 0.68); speed = 0; }
      else if (Math.abs(dx) < 78 && e.caveCd <= 0) { CAVE_AI.mode(e, 'brace', 0.5); speed = 0; }
    }
    e.vx = lerp(e.vx, speed, 1 - Math.exp(-dt * 10)); CAVE_AI.motion(e, phase, progress, 'beetle');
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
  const snap = n => Math.round(n * 2) / 2, m = e.motion || {}, p = Math.round(clamp(m.progress || 0, 0, 1) * 11) / 11;
  const attack = m.phase === 'attack', wind = m.phase === 'windup', recover = m.phase === 'recover';
  let poseY = 0, poseW = 1;
  const A = (dx, dy, w, h, col, noOut) => R.push([snap(dx * poseW), snap(dy + poseY), Math.max(0.5, snap(w * poseW)), Math.max(0.5, snap(h)), col, noOut]);
  const S = (x0, y0, x1, y1, th, col, noOut = true) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) A(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, th, th, col, noOut);
  };
  const k = e.type;
  if (k === 'lacraia') {
    if (e.mode === 'hide' || !e.mode) {
      // só as antenas tremendo para fora da fenda
      A(-8, -1, 16, 1, '#0a0806', 1); A(-5, -2, 10, 1, '#0a0806', 1);
      const tw = Math.sin(t * 9); A(2, -4 - tw, 0.5, 3, '#8a7a6a', 1); A(4, -5 + tw, 0.5, 4, '#8a7a6a', 1); A(3, -2, 2, 1, '#6a4a50');
    } else {
      poseY = e.mode === 'alert' ? (1 - p) * 5 : wind ? p * 1.5 : recover ? (1 - p) : 0;
      poseW = wind ? 1 - p * 0.14 : attack ? 1 + Math.sin(p * HPI) * 0.1 : 1;
      for (let i = 0; i < 9; i++) {
        const sx = -12 + i * 3, wob = Math.sin(t * (Math.abs(e.vx) > 8 ? 16 : 5) + i * 0.9), sy = -5 + wob;
        A(sx, sy, 3, 4, i % 2 ? '#30202c' : '#4a2934'); A(sx, sy, 3, 1, '#91656b');
        // Placas sobrepostas e pontas dorsais tornam a silhueta de quitina serrilhada.
        A(sx, sy + 1, 0.5, 2.5, '#180e18', 1); A(sx + 0.5, sy - 1, 2, 1, '#65414c');
        if (i % 2 === 0) { S(sx + 1, sy, sx - 0.5, sy - 3, 1, '#57313e'); A(sx - 0.5, sy - 3, 0.5, 1, '#b1888b', 1); }
        const lg = Math.sin(t * 20 + i * 0.8) * (wind ? 0.5 : 1.5);
        S(sx, sy + 3, sx - 1 + lg, -0.5 - Math.max(0, lg * 0.5), 0.5, '#2a1a20');
        S(sx + 2, sy + 3, sx + 3 - lg, -0.5 - Math.max(0, -lg * 0.5), 0.5, '#7a5a60');
      }
      const reach = wind ? -p * 2 : attack ? Math.sin(p * HPI) * 4 : 0;
      A(14 + reach, -6, 4, 4, '#5a303c'); A(14 + reach, -7, 3, 1, '#94636e');
      const bite = attack ? Math.sin(p * HPI) * 1.5 : wind ? p : 0.5;
      A(17 + reach, -5, 2.5, 3, '#160c18', 1);
      S(17 + reach, -5.5 - bite, 20 + reach, -4.5 - bite, 1, '#cabb9e');
      S(20 + reach, -4.5 - bite, 19 + reach, -3.5, 0.5, '#eee0c1');
      S(17 + reach, -2 + bite * 0.5, 20 + reach, -2.5 + bite * 0.5, 1, '#9f8a70');
      A(19 + reach, -3, 0.5, 1, '#eee0c1', 1);
      A(14.5 + reach, -5.5, 2, 1.5, '#21101c', 1); A(15 + reach, -5, 1.5, 0.5, '#e4dcd4', 1); // olho cego sob a placa inclinada
      S(14 + reach, -6, 16.5 + reach, -5.5, 0.5, '#8d515c');
      A(17 + reach, -9, 1, 3, '#8a7a6a', 1); A(18 + reach, -11, 1, 2, '#8a7a6a', 1); A(-14, -5, 2, 1, '#5a3a40');
    }
  } else if (k === 'morcego') {
    const hang = e.mode === 'hang' || !e.mode;
    if (hang) {
      A(-2, -10, 4, 8, '#1a1620'); A(-3, -8, 1, 5, '#2a2434'); A(2, -8, 1, 5, '#2a2434'); A(-1, -11, 2, 1, '#3a3448');
      A(-2, -5, 2, 1, '#09080e', 1); A(1, -5, 2, 1, '#09080e', 1);
      A(-1.5, -4.5, 1, 0.5, '#ff674f', 1); A(1, -4.5, 1, 0.5, '#ff674f', 1);
      A(-1, -3.5, 2.5, 1, '#09080e', 1); A(-1, -3, 0.5, 1, '#e9d7b9', 1); A(1, -3, 0.5, 1, '#e9d7b9', 1);
    }
    else {
      const fl = wind ? -2 - p * 5 : attack ? -1 + Math.sin(t * 18) : Math.sin(t * 22) * 4;
      const span = attack ? 7 : 11, tuck = recover ? Math.sin(p * HPI) * 2 : 0;
      A(-2, -6 - tuck, 5, 4, '#1a1620');
      for (const side of [-1, 1]) {
        S(side, -6, side * 5, -7 + fl * 0.45, 2, '#2a2434', false);
        S(side * 5, -7 + fl * 0.45, side * span, -5 + fl, 1.5, '#2a2434', false);
        for (let j = 0; j < 3; j++) S(side * 4, -5, side * (span - j * 1.5), -4 + fl + j, 0.5, j ? '#3a3448' : '#8a8ab0');
        S(side * span, -5 + fl, side * (span - 1), -3.5 + fl, 0.5, '#c5b1c9'); // gancho na ponta da asa
      }
      S(-1, -2, -2 - (attack ? 1 : 0), 0, 0.5, '#8a8ab0'); S(2, -2, 3 + (attack ? 1 : 0), 0, 0.5, '#8a8ab0');
      A(-2, -9 - tuck, 1.5, 3, '#3b283e'); A(2, -9 - tuck, 1, 3, '#3b283e');
      A(-1.5, -8.5 - tuck, 0.5, 1.5, '#8e526b', 1); A(2, -8.5 - tuck, 0.5, 1.5, '#8e526b', 1);
      A(-1, -6 - tuck, 4, 2, '#08070e', 1);
      A(-0.5, -5.5 - tuck, 1, 0.5, '#ff795d', 1); A(2, -5.5 - tuck, 1, 0.5, '#ff795d', 1);
      S(-1, -6.5 - tuck, 0.5, -6 - tuck, 0.5, '#725065'); S(3, -6.5 - tuck, 1.5, -6 - tuck, 0.5, '#725065');
      const jaw = attack ? 1.5 + p : wind ? 1 + p : 1;
      A(0, -3.5 - tuck, 2.5, jaw, '#08070e', 1); A(0, -3.5 - tuck, 0.5, 1.5, '#efdfc5', 1); A(2, -3.5 - tuck, 0.5, 1.5, '#efdfc5', 1);
    }
  } else if (k === 'sapo') {
    const rock = e.mode === 'rock' || !e.mode, br = rock && Math.sin(t * 2.6) > 0.7;
    poseY = e.mode === 'crouch' ? p * 2.5 : e.mode === 'recover' ? (1 - p) * 1.5 : rock ? Math.sin(t * 2.6) * 0.5 : 0;
    if (rock) {
      // pedra... que respira de vez em quando
      A(-8, -8 - (br ? 1 : 0), 16, 8 + (br ? 1 : 0), '#4a4038'); A(-6, -9 - (br ? 1 : 0), 11, 2, '#625448'); A(-5, -5, 3, 2, '#3a322c'); A(2, -4, 4, 2, '#3a322c'); A(-2, -7, 2, 1, '#7a6a5a');
      if (br) { A(3, -8, 1, 1, '#c8b040', 1); A(5, -8, 1, 1, '#c8b040', 1); }
    } else {
      A(-7, -9, 14, 7, '#5a5040'); A(-5, -11, 6, 3, '#6a6050'); A(1, -12, 3, 3, '#4a4234');
      // Sobrancelha óssea e olho estreito de predador; o disfarce de pedra continua intacto.
      A(1, -12, 4, 2, '#29261e'); A(2, -11, 2, 1, '#edb63a', 1); A(3.5, -11, 0.5, 1, '#1a1208', 1);
      S(0.5, -13.5, 4, -12, 1, '#8c7b5e'); A(0.5, -14, 1, 1.5, '#a39070', 1);
      A(-5, -8, 2, 1, '#978260', 1); A(-2, -10, 1.5, 1, '#978260', 1); A(-6, -4, 3, 1, '#393426', 1);
      const stretch = e.mode === 'leap' ? Math.sin(p * HPI) * 4 : wind ? -p * 1.5 : 0;
      S(-5, -4, -8 - stretch, -1 + stretch * 0.3, 2.5, '#4a4034', false);
      S(5, -4, 8 + stretch, -1 + stretch * 0.3, 2.5, '#4a4034', false);
      for (const side of [-1, 1]) { A(side * (8 + stretch), -1 + stretch * 0.3, 1.5, 0.5, '#b7a17b', 1); A(side * (7 + stretch), -0.5 + stretch * 0.3, 0.5, 1, '#b7a17b', 1); }
      const gape = attack || e.mode === 'tongueW' || e.tongue > 0 ? 2 : 1.5;
      A(2.5, -6.5, 6.5, gape, '#1a1112', 1); A(3, -6.5, 0.5, 1, '#dbcfaa', 1); A(6, -6.5, 0.5, 1.5, '#dbcfaa', 1); A(8, -6, 0.5, 1, '#dbcfaa', 1);
      A(4, -6.5 + gape, 4.5, 0.5, '#8a7252', 1);
      if (e.mode === 'tongueW') A(7, -6, 2 + p * 3, 1 + p, '#30121a');
      if (e.tongue > 0) { S(8, -6, 8 + e.tongue, -6, 1.5, '#d06080'); S(9, -6, 8 + e.tongue, -6, 0.5, '#f0a0aa'); }
    }
  } else if (k === 'besouro') {
    poseY = wind ? p * 1.5 : recover ? (1 - p) : Math.sin(t * 12) * Math.min(0.5, Math.abs(e.vx || 0) / 50);
    poseW = e.mode === 'turn' ? 0.65 + Math.abs(1 - p * 2) * 0.35 : 1;
    A(-8, -9, 12, 7, '#232334'); A(-7, -10, 9, 2, '#44435b'); A(-9, -7, 3, 4, '#6a3a4a'); // traseira mole e avermelhada
    for (let i = 0; i < 3; i++) { A(-6 + i * 3, -10.5, 1.5, 1.5, '#66647d'); A(-5.5 + i * 3, -12, 0.5, 1.5, '#a5a4b9', 1); }
    A(-7, -7, 8, 0.5, '#13131f', 1); A(-6, -5, 6, 0.5, '#49465e', 1);
    for (let i = 0; i < 3; i++) {
      const lg = Math.sin(t * 14 + i * 2) * (wind ? 0.4 : 1.5);
      S(-6 + i * 4, -3, -7 + i * 4 + lg, -0.5 - Math.max(0, lg), 0.5, '#1a1a24');
      S(-4 + i * 4, -3, -3 + i * 4 - lg, -0.5 - Math.max(0, -lg), 0.5, '#6a6a80');
    }
    // casco de cristal na frente
    const shieldX = wind ? -p * 2 : attack ? Math.sin(p * HPI) * 2 : recover ? -(1 - p) : 0;
    const shieldY = wind ? -p * 2 : 0;
    A(3 + shieldX, -12 + shieldY, 6, 11, '#5a9ab8'); A(4 + shieldX, -13 + shieldY, 4, 2, '#9ad8f0'); A(5 + shieldX, -11 + shieldY, 2, 6, '#e0f8ff'); A(8 + shieldX, -9 + shieldY, 2, 6, '#3a7a98'); A(3 + shieldX, -4 + shieldY, 7, 2, '#4a8aa8');
    // Coroa de cristal quebrado e mandíbula escura sob o escudo frontal.
    S(6 + shieldX, -12 + shieldY, 9 + shieldX, -15 + shieldY, 1.5, '#6aa9c6');
    S(9 + shieldX, -15 + shieldY, 9.5 + shieldX, -12.5 + shieldY, 0.5, '#d6f5ff');
    A(7 + shieldX, -7.5 + shieldY, 3, 2, '#142233', 1); A(8 + shieldX, -6.5 + shieldY, 1.5, 0.5, '#ff7553', 1);
    S(7 + shieldX, -8 + shieldY, 9.5 + shieldX, -7 + shieldY, 0.5, '#91c8dc');
    const clampJaw = attack ? Math.sin(p * HPI) : wind ? p * 0.5 : 0.25;
    S(8 + shieldX, -4.5 + shieldY, 11.5 + shieldX, -5.5 + shieldY - clampJaw, 1, '#152336');
    S(11.5 + shieldX, -5.5 + shieldY - clampJaw, 11 + shieldX, -4 + shieldY, 0.5, '#c6e4e8');
    S(8 + shieldX, -2.5 + shieldY, 11.5 + shieldX, -2 + shieldY + clampJaw, 1, '#152336');
    A(11 + shieldX, -3 + shieldY + clampJaw, 0.5, 1, '#c6e4e8', 1);
    if (Math.sin(t * 3 + e.x) > 0.7) A(6, -10, 1, 1, '#ffffff', 1);
  } else if (k === 'raizes') {
    // raízes negras do Corpo-seco cobrindo o último suporte
    for (let i = 0; i < 8; i++) { const ox = -10 + i * 3, wv = Math.sin(t * 2 + i) * 1.5; for (let yy = 0; yy < 54; yy += 2) A(Math.round(ox + Math.sin(yy * 0.2 + i) * 3 + wv), -yy - 2, 2, 2, i % 2 ? '#120a0e' : '#1e1018'); }
    const p = (Math.sin(t * 4) + 1) / 2; for (let i = 0; i < 10; i++) A(-8 + hash(i * 3) * 16, -4 - hash(i * 7) * 48, 1, 2, p > 0.5 ? '#ff3a4a' : '#a0182a', 1);
  } else return false;
  c.fillStyle = '#08060a';
  for (const q of R) { if (q[5]) continue; const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillRect(snap(sx) - 0.5, snap(y + q[1]) - 0.5, q[2] + 1, q[3] + 1); }
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillStyle = flash ? '#fff' : q[4]; c.fillRect(snap(sx), snap(y + q[1]), q[2], q[3]); }
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
// A cabeça erguida é a posição real do chefe: colisão, luz e disparos a acompanham.
function boitataRestPose(x, y, f) {
  return Array.from({ length: 40 }, (_, i) => {
    const u = i / 39;
    if (u <= 0.78) {
      const q = u / 0.78;
      return { x: x - f * (Math.sin(q * HPI / 2) * 21 + Math.sin(q * HPI) * 5), y: lerp(y, GY - 18, q) };
    }
    const q = (u - 0.78) / 0.22, v = 1 - q;
    return { x: x - f * (v ** 3 * 21 + 3 * v * v * q * 10 + 3 * v * q * q * 40 + q ** 3 * 37),
      y: v ** 3 * (GY - 18) + 3 * v * v * q * (GY + 1) + 3 * v * q * q * (GY + 1) + q ** 3 * (GY - 20) };
  });
}
function followBoitataBody(B, dt) {
  const seg = B.seg; if (!seg || !seg.length) return;
  const resting = ['intro', 'idle', 'tailW', 'fireW', 'rec'].includes(B.st);
  const pose = resting ? boitataRestPose(B.x, B.y, B.f) : null, blend = 1 - Math.exp(-dt * 4);
  seg[0].x = B.x; seg[0].y = B.y;
  for (let i = 1; i < seg.length; i++) {
    const a = seg[i - 1], b = seg[i];
    if (pose) { b.x = lerp(b.x, pose[i].x, blend); b.y = lerp(b.y, pose[i].y, blend); }
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d > 4.5) { b.x = a.x + (b.x - a.x) / d * 4.5; b.y = a.y + (b.y - a.y) / d * 4.5; }
  }
}
function boitataRiseHead(B, dt) {
  B.poseState = null;
  B.y = lerp(B.y, GY - 126 + Math.sin(B.t * 2) * 1.5, 1 - Math.exp(-dt * 5));
}
function boitataLowerHead(B, duration) {
  if (B.poseState !== B.st) { B.poseState = B.st; B.poseFrom = B.y; }
  const p = clamp(1 - Math.max(0, B.tt) / duration, 0, 1), ease = p * p * (3 - 2 * p);
  B.y = lerp(B.poseFrom, GY - 8, ease);
}
BOSSES.boitata = {
  nome: 'BOITATÁ ENCARCERADO', sub: 'quebre as correntes, não a serpente',
  init(B) {
    const A = G.lvl.arena, sup = [0.2, 0.5, 0.8].map((k, i) => ({ x: A.x0 + Math.round(AW * k), broken: false, i }));
    const y = GY - 126, seg = boitataRestPose(B.x, y, B.f);
    return { w: 22, h: 16, hp: 1, contact: 14, inv: true, noAim: true, chains: 3, sup, seg, y, glow: 0, shield: false, rockCd: 3 };
  },
  update(B, dt) {
    const [a0, a1] = arenaX(), P = G.P, px = P.x + 5, dx = px - B.x, ph = 4 - B.chains;
    try {
    B.glow = Math.max(0, B.glow - dt * 2);
    if (B.st === 'freed') return boitataFreedTick(B, dt);
    // fase 2: a arena desaba aos poucos
    if (ph === 2) { B.rockCd -= dt; if (B.rockCd <= 0) { B.rockCd = 2.6; const rx = clamp(px + rnd(-60, 60), a0 + 10, a1 - 10); addHazard({ x: rx - 6, y: GY - 2, w: 12, h: 2, life: 0.9, draw: h => { ctx.globalAlpha = 0.5 + Math.sin(G.t * 25) * 0.4; for (let i = 0; i < h.w; i += 3) rect(ctx, h.x + i, GY - 1, 2, 1, '#c8b8a0'); ctx.globalAlpha = 1; } }); setTimeout(() => { if (G.boss === B) shoot({ team: 'e', x: rx, y: -6, vx: 0, vy: 200, w: 8, h: 8, dmg: 16, kind: 'rock', grav: 300, life: 2 }); }, 700); } }
    // fase 3: o sopro de fogo rompe a última corrente se as raízes já caíram
    if (ph === 3) for (const p of G.projs) if (p.kind === 'sopro') for (const s of B.sup) if (!s.broken && Math.abs(p.x - s.x) < 10) { p.life = 0; if (B.shield) { floatText(s.x, GY - 64, 'as raízes seguram', '#ff3a4a'); for (let i = 0; i < 10; i++) part(s.x, GY - 30, rnd(-40, 40), rnd(-60, 0), 0.5, '#ff6a2a'); } else breakSupport(B, s); }
    switch (B.st) {
      case 'idle': {
        if (ph === 2) { go(B, 'climb', 0); B.path = null; break; }
        boitataRiseHead(B, dt); B.f = Math.sign(dx) || B.f;
        B.x += clamp((px - B.f * 90) - B.x, -1, 1) * 30 * dt;
        if (B.tt > 0) break;
        const r = Math.random();
        const n = ph === 1 ? (Math.abs(dx) < 50 ? 'tailW' : r < 0.6 ? 'chargeW' : 'fireW') : (r < 0.65 ? 'breathW' : 'chargeW');
        go(B, n, { tailW: 0.45, chargeW: 0.7, fireW: 0.6, breathW: 0.8 }[n]); B.dir = Math.sign(dx) || B.f;
        break;
      }
      case 'chargeW': boitataLowerHead(B, 0.7); B.glow = 1; B.dir = Math.sign(dx) || B.dir; B.f = B.dir; if (B.tt <= 0) { go(B, 'charge', 2.5); SFX.roar(); } break;
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
      case 'tailW': boitataRiseHead(B, dt); B.glow = 1; if (B.tt <= 0) { go(B, 'rec', 0.6); bossFx('ring', B.x, GY - 6, B.f, { r: 70 }); SFX.fire(); if (Math.abs(px - B.x) < 50 && P.y + P.h > GY - 30) hurtPlayer(18, B.x); } break;
      case 'fireW': boitataRiseHead(B, dt); B.glow = 1; if (B.tt <= 0) {
        for (let i = 0; i < 3; i++) { const T = 0.9 + i * 0.15, tx = px + (i - 1) * 26, mx = B.x + B.f * 16, my = B.y + 2; shoot({ team: 'e', x: mx, y: my, vx: (tx - mx) / T, vy: (GY - my - 0.5 * 300 * T * T) / T, w: 7, h: 7, dmg: 14, kind: 'bfire', grav: 300, life: 3, land: (p, s) => addHazard({ kind: 'fire', x: p.x - 10, y: s.y - 12, w: 20, h: 12, life: 2.2, dmg: 10 }) }); }
        SFX.fire(); go(B, 'rec', 0.7);
      } break;
      case 'breathW': boitataLowerHead(B, 0.8); B.glow = 1; B.f = Math.sign(dx) || B.f; if (B.tt <= 0) { shoot({ team: 'e', x: B.x + B.f * 16, y: B.y + 2, vx: B.f * 170, vy: 0, w: 14, h: 10, dmg: 18, kind: 'sopro', life: 2.5 }); SFX.fire(); go(B, 'rec', 0.8); } break;
      case 'rec': boitataRiseHead(B, dt); if (B.tt <= 0) go(B, 'idle', ph === 3 ? 0.3 : 0.5); break;
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
    } finally { followBoitataBody(B, dt); }
  },
  draw(B) { drawBoitata(B); },
};
function breakSupport(B, s) {
  if (s.broken) return;
  s.broken = true; B.chains--; B.glow = 1;
  SFX.boom(); G.cam.shake = 9; G.flash = 0.2; G.flashCol = '#ff9a3a';
  bossFx('burst', s.x, GY, 1, { col: '#c8b8a0' }); VFX.play('terra/corrente', s.x, GY - 40, { floor: 40 });
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
// Silhuetas rasterizadas: escamas, chamas e elos compartilham a grade de meio pixel.
function boitataPoly(c, points, col) {
  if (points.length < 3 || points.some(p => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) return;
  let ymin = Infinity, ymax = -Infinity;
  for (const p of points) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
  c.fillStyle = col;
  for (let y = Math.floor(ymin * 2) / 2; y < ymax; y += 0.5) {
    const hits = [], sy = y + 0.25;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[j], b = points[i];
      if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) hits.push(a[0] + (sy - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const a = Math.round(hits[i] * 2) / 2, b = Math.round(hits[i + 1] * 2) / 2;
      if (b > a) c.fillRect(a, y, b - a, 0.5);
    }
  }
}
function boitataStroke(c, pts, col, width = 0.5) {
  for (let i = 1; i < pts.length; i++) line(c, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], col, width);
}
function boitataLink(c, x, y, tx, ty, edge, lit, narrow = false) {
  const nx = -ty, ny = tx, w = narrow ? 0.65 : 1.55, len = 2.4;
  const at = (u, v) => [x + tx * u + nx * v, y + ty * u + ny * v];
  const shape = [at(-len, -w * 0.5), at(-len + 0.5, -w), at(len - 0.5, -w), at(len, -w * 0.5), at(len, w * 0.5), at(len - 0.5, w), at(-len + 0.5, w), at(-len, w * 0.5), at(-len, -w * 0.5)];
  boitataStroke(c, shape, '#080909', 1.5);
  boitataStroke(c, shape, edge, 0.5);
  boitataStroke(c, [at(-len + 0.5, -w), at(len - 0.5, -w), at(len, -w * 0.5)], lit, 0.5);
}
function drawSupports(B, t) {
  ctx.save();
  try {
    const baseAlpha = ctx.globalAlpha;
    for (const s of B.sup || []) {
      const si = Number.isFinite(s.i) ? s.i : 0, top = GY - 120, left = s.x - 10;
      if (s.broken) {
        // Os mesmos pilares de madeira deixam lascas inclinadas e um cepo após romper.
        boitataPoly(ctx, [[left, GY], [left, GY - 15], [left + 4, GY - 20], [left + 8, GY - 13], [left + 12, GY - 25], [left + 17, GY - 14], [left + 20, GY]], '#292019');
        for (let i = 0; i < 5; i++) {
          const dx = -15 + i * 7, hh = 3 + hash(si * 29 + i) * 9;
          boitataPoly(ctx, [[s.x + dx, GY], [s.x + dx - 3, GY - hh], [s.x + dx + 1, GY - hh - 1], [s.x + dx + 5, GY - 1]], i % 2 ? '#4c3927' : '#6d5135');
        }
        rect(ctx, left + 2, GY - 14, 1, 10, '#8b6744');
        continue;
      }
      rect(ctx, left - 1, top + 4, 22, 116, '#080808');
      rect(ctx, left + 1, top + 5, 18, 115, '#29231d');
      rect(ctx, left + 2, top + 5, 3, 115, '#3e3022');
      rect(ctx, left + 5, top + 5, 7, 115, '#30271e');
      rect(ctx, left + 17, top + 5, 2, 115, '#171715');
      rect(ctx, left - 3, top + 2, 26, 5, '#0b0b0b');
      rect(ctx, left - 2, top + 2, 24, 1.5, '#493929');
      rect(ctx, left + 7, top - 1, 6, 3.5, '#25211d');
      // Fibras secas, entalhes e nós; a textura não muda de forma a cada quadro.
      for (let i = 0; i < 18; i++) {
        const gx = left + 3 + hash(i * 7 + si * 13) * 12, gy = top + 10 + hash(i * 11 + si * 3) * 100;
        rect(ctx, gx, gy, i % 3 ? 0.5 : 1, 2 + hash(i + 11) * 7, i % 4 ? '#59432c' : '#151410');
      }
      for (const yy of [GY - 112, GY - 85, GY - 58]) {
        rect(ctx, left - 0.5, yy - 2, 21, 4, '#111315');
        rect(ctx, left, yy - 2, 20, 0.5, '#5d5850');
        for (const dx of [2, 17]) { rect(ctx, left + dx, yy - 0.5, 1, 1, '#9a8b74'); rect(ctx, left + dx + 0.5, yy, 0.5, 1, '#393731'); }
      }
      // As fissuras discretas antecipam a libertação sem apagar a textura da madeira.
      ctx.globalAlpha = baseAlpha * (0.14 + (3 - (B.chains || 0)) * 0.08);
      const fissure = '#f1a24b';
      for (let yy = GY - 102; yy < GY - 8; yy += 13) rect(ctx, s.x - 2 + Math.round(Math.sin(yy * 0.2 + si) * 2), yy, 0.5, 3, fissure);
      ctx.globalAlpha = baseAlpha;
    }
  } finally { ctx.restore(); }
}
function drawBoitata(B) {
  const seg = B.seg || []; if (!seg.length) return;
  const t = Number.isFinite(B.t) ? B.t : 0, glow = clamp(B.glow || 0, 0, 1), rev = clamp(B.revive || 0, 0, 1), freed = B.st === 'freed', exhausted = freed && !B.rise;
  const face = B.f < 0 ? -1 : 1, frames = [], last = seg.length - 1;
  // A pele acompanha o caminho físico real durante investidas, teto e mergulho.
  for (let i = 0; i < seg.length; i++) {
    const s = seg[i], a = seg[Math.max(0, i - 1)], b = seg[Math.min(last, i + 1)];
    let dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
    if (d < 0.001) { dx = face; dy = 0; d = 1; }
    const tx = dx / d, ty = dy / d, nx = ty * face, ny = -tx * face;
    const r = 2 + 8.25 * Math.pow(1 - i / Math.max(1, last), 0.7);
    const point = (u, v) => [s.x + tx * u + nx * v, s.y + ty * u + ny * v];
    frames.push({ s, tx, ty, nx, ny, r, point });
  }
  ctx.save();
  try {
    const alpha = ctx.globalAlpha;
    // Reflexo quente local, sem discos opacos atrás das chamas.
    for (let i = 0; i < seg.length; i += 5) softGlow(ctx, seg[i].x, seg[i].y, 26, 28, rev > 0 ? '#bfe4ff' : '#ff8a3a', (exhausted ? 0.025 : 0.1) + glow * 0.1);
    // Contorno contínuo e faixas de placas ligadas, sem bolinhas no lugar das escamas.
    const ribbon = (a, b, outer, inner, col) => boitataPoly(ctx, [a.point(0, a.r * outer), b.point(0, b.r * outer), b.point(0, b.r * inner), a.point(0, a.r * inner)], col);
    for (let i = last; i > 0; i--) ribbon(frames[i], frames[i - 1], 1.15, -1.15, '#0c0a08');
    for (let i = last; i > 0; i--) {
      const a = frames[i], b = frames[i - 1], { r, point: P } = a;
      const lit = rev > 0 && Math.abs(i / seg.length - (1 - rev)) < 0.1;
      ribbon(a, b, 1, -1, exhausted ? '#24201b' : '#302820');
      ribbon(a, b, 0.86, 0.06, exhausted ? '#35302a' : '#46382b');
      ribbon(a, b, 0.04, -0.92, lit ? '#b4ddec' : exhausted ? '#694322' : '#c46029');
      ribbon(a, b, -0.13, -0.68, lit ? '#e8fbff' : exhausted ? '#80532b' : glow > 0.5 ? '#f2953b' : '#df7c34');
      // As placas do ventre têm bordas e extremidades curvadas na direção do dorso.
      boitataStroke(ctx, [P(-0.5, -r * 0.87), P(0.7, -r * 0.55), P(1.2, -r * 0.15), P(0.5, r * 0.09)], '#291810', 0.75);
      boitataStroke(ctx, [P(1.2, -r * 0.8), P(2, -r * 0.48), P(2, -r * 0.18)], lit ? '#f8ffff' : exhausted ? '#9a6030' : '#f5aa54', 0.5);
      // Escamas escuras sobrepostas, com bordas de cobre, em três fileiras dorsais.
      for (let row = 0; row < 3; row++) {
        const v = r * (0.18 + row * 0.28), u = (row % 2 ? 1 : -0.75), w = Math.max(1, 2.2 - i / seg.length);
        boitataPoly(ctx, [P(u - w, v), P(u, v + r * 0.18), P(u + w, v + 0.4), P(u + w * 0.3, v - r * 0.11)], row === 2 ? '#29251f' : '#383027');
        boitataStroke(ctx, [P(u - w, v), P(u, v + r * 0.18), P(u + w, v + 0.4)], lit ? '#d2e9ed' : row === 2 ? '#796044' : '#66503b', 0.5);
      }
    }
    const fireActive = !exhausted, firePower = fireActive ? (freed ? 0.65 : 1) : 0;
    if (firePower) {
      // Crina de fogo contínua: cada língua tem raiz laranja, miolo amarelo e ponta móvel.
      for (let i = last - 1; i >= 1; i--) {
        const a = frames[i], P = a.point, wave = Math.sin(t * 13 + i * 1.6), wave2 = Math.sin(t * 21 - i * 0.9);
        const height = (3.8 + (wave + 1) * 2.6 + glow * 4) * firePower * Math.max(0.42, 1 - i / seg.length * 0.4), lean = 2 + wave2 * 1.8;
        const base = a.r * 0.83, tip = base + height;
        boitataPoly(ctx, [P(-2.8, base), P(-2, base + height * 0.5), P(lean - 1, tip - 1), P(lean + 0.8, tip + 1), P(lean + 0.5, base + height * 0.58), P(3, base + 0.8), P(2.5, base - 1)], rev > 0 ? '#66bbdf' : '#d65016');
        boitataPoly(ctx, [P(-2, base + 0.6), P(-0.5, base + height * 0.45), P(lean + 0.2, tip), P(lean - 0.5, base + height * 0.35), P(2.1, base)], rev > 0 ? '#a9e7fa' : '#ff9a25');
        if (i % 2 === 0) boitataPoly(ctx, [P(-1.3, base), P(0, base + height * 0.52), P(1.3, base + 0.3)], rev > 0 ? '#f0ffff' : '#ffe184');
      }
      // Faíscas determinísticas sobem sem criar entidades ou modificar o combate.
      for (let i = 0; i < 22; i++) {
        const j = 1 + Math.floor(hash(i * 17 + 31) * Math.max(1, last - 1)), a = frames[Math.min(last, j)], life = (t * (0.35 + hash(i + 11) * 0.3) + hash(i + 29)) % 1;
        const pp = a.point(-4 + hash(i * 7) * 8, a.r + 2 + life * 16);
        rect(ctx, pp[0] + Math.sin(t * 3 + i) * 2, pp[1] - life * 12, 0.5, life < 0.55 ? 1 : 0.5, rev > 0 ? '#d7f5ff' : i % 3 ? '#ffb544' : '#ffe3a1');
      }
    }
    const h = seg[0], headFrame = frames[0], vertical = Math.abs(headFrame.ty) > 0.7;
    const tx = vertical ? face : headFrame.tx, ty = vertical ? 0 : headFrame.ty, nx = ty * face, ny = -tx * face;
    const P = (u, v) => [h.x + tx * u + nx * v, h.y + ty * u + ny * v];
    const poly = (pts, col) => boitataPoly(ctx, pts.map(p => P(p[0], p[1])), col);
    const stroke = (pts, col, width = 0.5) => boitataStroke(ctx, pts.map(p => P(p[0], p[1])), col, width);
    // Crânio angular, focinho longo e mandíbula pesada, exatamente sobre seg[0].
    poly([[-12, -2], [-11, 5], [-7, 8], [0, 9], [9, 7], [15, 4], [19, 0], [18, -5], [12, -8], [0, -8], [-9, -5]], '#0b0908');
    poly([[-11, -1], [-10, 4], [-6, 7], [0, 8], [8, 6], [14, 3], [17.5, -0.5], [16, -3], [5, -4], [-6, -4]], exhausted ? '#383028' : '#49392b');
    poly([[-9, -3.5], [-2, -4], [8, -3], [17, -2], [17, -4.5], [11, -6.5], [1, -7], [-7, -5]], exhausted ? '#46362a' : '#705039');
    poly([[-9, 4], [-5, 6.5], [1, 7], [0, 5], [-5, 3]], '#68513a');
    poly([[9, 4], [13, 2.5], [17, 0], [14, -0.5], [9, 1]], '#59422d');
    stroke([[-9, -3], [-3, -4], [7, -3], [16.5, -2]], '#17100c', 1);
    stroke([[-7, -5], [2, -5.5], [10, -5], [15, -4]], exhausted ? '#6c4d32' : '#a67445', 0.5);
    // Órbita grande e funda, com sobrancelha inclinada, como na referência.
    poly([[-2, 2], [0, 5.5], [5, 5.5], [9, 3], [6, 0], [1, -0.5]], '#19120d');
    poly([[0, 2], [2, 4], [5, 4.5], [7, 3], [5, 1], [1, 0.5]], exhausted ? '#745635' : rev > 0 ? '#bfefff' : '#f6bf56');
    poly([[1, 2], [3, 4], [5.5, 3.5], [5, 1.5], [2, 1]], exhausted ? '#a37a43' : '#fff1ae');
    stroke([[3.5, 1.5], [4.5, 4]], exhausted ? '#392a1d' : '#cc6c27', 0.5);
    stroke([[-3, 6], [1, 6.5], [6, 5], [9, 3.5]], '#8a6741', 1);
    stroke([[-4, 5], [-1, 4], [0, 2]], '#302319', 0.5);
    poly([[13.5, 0.5], [15, 0.5], [15, -0.5], [13.5, -1]], '#0c0907');
    for (const [u, v] of [[-8, 1], [-6, -1], [-4, 1], [-2, -2], [1, -1.5], [10, 0.5], [11, -1.5]]) {
      poly([[u - 1.5, v], [u, v + 1.5], [u + 1.5, v + 0.5], [u + 1, v - 0.7]], '#372a20');
      stroke([[u - 1.5, v], [u, v + 1.5], [u + 1.5, v + 0.5]], '#795c3c', 0.5);
    }
    if (B.st === 'breathW' || B.st === 'fireW') {
      const pulse = (Math.sin(t * 30) + 1) / 2;
      stroke([[7, -3], [15, -2.5], [17.5, -1.5]], pulse > 0.5 ? '#fff0ae' : '#f18b2f', 1);
      const mouth = P(16, -2); softGlow(ctx, mouth[0], mouth[1], 14 + glow * 6, 12, '#ffb449', 0.3 + pulse * 0.15);
    }
    if (firePower) for (let i = 0; i < 7; i++) {
      const u = -10 + i * 2.5, v = 5 + Math.sin(i / 6 * HPI) * 3.5, flame = (4 + (Math.sin(t * 17 + i * 2) + 1) * 2.5 + glow * 3) * firePower;
      poly([[u - 1.8, v - 1], [u - 1.2, v + flame * 0.6], [u + 1.5 + Math.sin(t * 11 + i), v + flame], [u + 0.5, v + flame * 0.35], [u + 2, v]], rev > 0 ? '#72cce6' : '#e26319');
      poly([[u - 1, v], [u, v + flame * 0.45], [u + 1.2, v + flame - 1], [u + 1, v]], rev > 0 ? '#e1fbff' : '#ffd66a');
    }
    // Elos pesados alternam a face e a aresta. A corrente sempre termina no segmento real.
    if (!freed) for (const s of B.sup || []) {
      const si = Number.isFinite(s.i) ? s.i : 0, x0 = s.x, y0 = GY - 112 + si * 27;
      if (s.broken) {
        for (let j = 0; j < 5; j++) boitataLink(ctx, x0 + Math.sin(t * 2 + j * 0.7) * j * 0.4, y0 + j * 3.4, 0, 1, '#514b42', '#8a7a60', j % 2 === 0);
        continue;
      }
      const a = frames[Math.min(last, Math.max(0, 8 + si * 9))], target = a.s, dx = target.x - x0, dy = target.y - y0, dist = Math.hypot(dx, dy), steps = Math.max(1, Math.ceil(dist / 3.8)), sag = dist > 110 ? 0.7 : Math.min(6, dist * 0.04);
      const at = k => [x0 + dx * k, y0 + dy * k + Math.sin(k * HPI) * sag];
      for (let j = 0; j <= steps; j++) {
        const k = j / steps, q = at(k), next = at(Math.min(1, k + 0.01)), vx = next[0] - q[0], vy = next[1] - q[1], length = Math.hypot(vx, vy);
        const ux = length > 0.001 ? vx / length : dist > 0.001 ? dx / dist : 1, uy = length > 0.001 ? vy / length : dist > 0.001 ? dy / dist : 0;
        boitataLink(ctx, q[0], q[1], ux, uy, dist > 130 ? '#6d4e34' : '#56534a', dist > 130 ? '#c38a54' : '#a59373', j % 2 === 1);
      }
      const P = a.point;
      boitataPoly(ctx, [P(-2, -a.r - 1), P(2, -a.r - 1), P(2, a.r + 1), P(-2, a.r + 1)], '#171a1b');
      boitataStroke(ctx, [P(-2, -a.r), P(-2, a.r), P(2, a.r)], '#857b68', 0.75);
      const collar = P(0, -a.r * 0.4); rect(ctx, collar[0], collar[1], 1.5, 1.5, '#aa9776');
    }
    if (B.st === 'diveW') {
      ctx.globalAlpha = alpha * (0.5 + Math.sin(t * 25) * 0.4);
      for (let i = -12; i <= 12; i += 3) rect(ctx, B.x + i, GY - 1, 2, 1, '#ffd27a');
    }
  } finally { ctx.restore(); }
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
  SFX.echo(); G.flash = 0.35; G.flashCol = '#bfe4ff'; VFX.play('holy/holy-pillar', G.P.x + 5, G.P.y + G.P.h, { palette: VFX.PAL.ice, dur: 2.2 });
  showToast('Olho de Fogo Frio', 'luz ancestral · chama purificadora · brasa de proteção', 3.2);
  hint('<kbd>E</kbd> perto dos <b>Cipós-de-Sangue</b>: purificar com o fogo frio · nas fogueiras: <b>Viajar</b>', '<b>Agir</b> perto dos <b>Cipós-de-Sangue</b>: purificar · nas fogueiras: <b>Viajar</b>', 8);
  G.lvl.arena.cleared = true; resetArena(); musicSet('gruta');
};

// ---------- A fase: Gruta dos Antigos ----------
function lastChest(L, o) { Object.assign(L.chests[L.chests.length - 1], o); return L; }
LEVELS.gruta = function () {
  const L2 = LV({ act: 2, biome: 'gruta', parent: 'cerrado', name: 'Cerrado — Gruta dos Antigos', w: 3000, start: 96, cave: true });
  L2.caveExits = [{ x: 56, y: GY }, { x: 2970, y: GY, need: 'gruta_saida' }];
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
  L2.gate(2930, 'gruta_saida', { w: 20, h: 90, solid: true, kind: 'parede', reward: 'a subida de volta ao Cerrado', msg: 'Os cipós fecham a subida. Só um fogo que não queima o que é vivo abre isto.' });
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
  L2.caveEntry = { x: 430, y: GY };
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
