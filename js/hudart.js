'use strict';
// Interface em pixel art desenhada no próprio canvas: painel do espírito (moldura de madeira, vida e estamina com
// textura viva, medalhão de raízes com o rosto da forma, frascos de cura e memórias, calor e fôlego) e uma barra
// própria para cada guardião, com a moldura feita do mundo dele.

const UIA = { trHp: null, lastHp: null, hitT: -9, delayHp: 0, trB: null, lastB: null, bHitT: -9, delayB: 0, lastFl: null, usedT: -9, usedI: -1, bIn: -9, bKind: null, t: 0 };
const UI_OUT = '#0a0608';

// ---------- texturas das barras ----------
// tira de 48 px que se repete na horizontal e rola devagar; cada estilo tem seu desenho
const TEX_T = 48;
function barTex(key, h, pal, style) {
  return tcache(`bt-${key}-${h}`, TEX_T, h, (c, T) => {
    const r = seeded(key.length * 97 + h * 13 + key.charCodeAt(0));
    const px = (x, y, col, w = 1) => { x = ((Math.round(x) % T) + T) % T; rect(c, x, y, w, 1, col); if (x + w > T) rect(c, x - T, y, w, 1, col); };
    for (let y = 0; y < h; y++) rect(c, 0, y, T, 1, y < h * 0.34 ? pal[2] : y < h * 0.72 ? pal[1] : pal[0]);
    if (style === 'flame') {
      // línguas de fogo subindo inclinadas, mais claras na ponta
      for (let i = 0; i < 18; i++) { const x0 = r() * T, th = 2 + r() * (h - 1); for (let k = 0; k < th; k++) px(x0 + k * 0.8, h - 1 - k, k > th * 0.55 ? pal[3] : pal[2], k < th * 0.4 ? 2 : 1); }
      for (let i = 0; i < 10; i++) px(r() * T, r() * h * 0.5 | 0, pal[0]);
    } else if (style === 'veins') {
      for (let m = 0; m < 3; m++) { const f = HPI * 2 * (m + 1) / T, ph = r() * 6, amp = h * (0.2 + r() * 0.2), col = m ? pal[2] : pal[3]; for (let x = 0; x < T; x++) px(x, Math.round(h * 0.5 + Math.sin(x * f + ph) * amp), col); }
      for (let i = 0; i < 14; i++) px(r() * T, r() * h | 0, pal[0]);
    } else if (style === 'specks') {
      for (let i = 0; i < 46; i++) px(r() * T, r() * h | 0, r() < 0.6 ? pal[2] : pal[3]);
      for (let i = 0; i < 12; i++) px(r() * T, h * 0.4 + r() * h * 0.6 | 0, pal[0], 2);
    } else if (style === 'bubbles') {
      for (let i = 0; i < 30; i++) px(r() * T, r() * h | 0, pal[2]);
      for (let i = 0; i < 7; i++) { const bx = r() * T, by = 1 + (r() * (h - 3) | 0); px(bx, by - 1, pal[3]); px(bx - 1, by, pal[3]); px(bx + 1, by, pal[3]); px(bx, by + 1, pal[2]); }
    } else if (style === 'cracks') {
      for (let i = 0; i < 5; i++) { let x = r() * T; for (let y = 0; y < h; y++) { x += (r() - 0.5) * 2.4; px(x, y, pal[0]); px(x + 1, y, pal[3]); } }
      for (let i = 0; i < 20; i++) px(r() * T, r() * h | 0, pal[2]);
    }
    rect(c, 0, 0, T, 1, mixHex(pal[2], pal[3], 0.6)); rect(c, 0, h - 1, T, 1, pal[0]);
  });
}
// barra: vazio escuro, perda recente em âmbar, enchimento com textura rolando, borda viva e clarão do golpe
function drawTexBar(x, y, w, h, frac, trail, tex, off, edge, flash) {
  const fw = Math.round(w * clamp(frac, 0, 1)), tw = Math.round(w * clamp(trail, 0, 1));
  rect(ctx, x, y, w, h, '#100a0a'); rect(ctx, x, y, w, 1, '#050304');
  for (let i = 3; i < w; i += 6) rect(ctx, x + i, y + h - 2, 1, 1, '#1e1414');
  if (tw > fw) { rect(ctx, x + fw, y, tw - fw, h, '#e8b860'); rect(ctx, x + fw, y, tw - fw, 1, '#fff0b0'); rect(ctx, x + fw, y + h - 1, tw - fw, 1, '#a86a2a'); }
  if (fw <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, fw, h); ctx.clip();
  const o = Math.floor(off) % TEX_T; for (let p = x - o; p < x + fw; p += TEX_T) ctx.drawImage(tex, p, y);
  ctx.restore();
  rect(ctx, x + fw - 1, y, 1, h, edge);
  if (flash > 0) { ctx.globalAlpha = flash; rect(ctx, x, y, fw, h, '#ffffff'); ctx.globalAlpha = 1; }
}
// moldura de bronze arredondada em volta de uma barra (no contexto c)
function bronzeRim(c, x, y, w, h, lt = '#e0b860', dk = '#7a5a24') {
  rect(c, x + 1, y, w - 2, h, UI_OUT); rect(c, x, y + 1, w, h - 2, UI_OUT);
  rect(c, x + 2, y + 1, w - 4, 1, lt); rect(c, x + 2, y + h - 2, w - 4, 1, dk);
  rect(c, x + 1, y + 2, 1, h - 4, lt); rect(c, x + w - 2, y + 2, 1, h - 4, dk);
  rect(c, x + 2, y + 2, w - 4, h - 4, '#000'); rect(c, x + 3, y + 1, 3, 1, '#fff2c0');
}

// ---------- peças de desenho (madeira, raízes, cipós, ossos) ----------
const WOOD = ['#2e1c10', '#5a3a22', '#7a5232', '#9a6a40'];
function plank(c, x, y, w, h, P = WOOD, r = seeded(x * 7 + y)) {
  rect(c, x, y, w, h, UI_OUT); rect(c, x + 1, y + 1, w - 2, h - 2, P[1]); rect(c, x + 1, y + 1, w - 2, 1, P[2]);
  for (let i = 0; i < w * h / 6; i++) rect(c, x + 1 + r() * (w - 3), y + 2 + r() * Math.max(1, h - 3), 2 + r() * 4, 1, r() < 0.6 ? P[0] : P[2]);
  for (let i = 0; i < w / 30; i++) { const kx = x + 4 + r() * (w - 8), ky = y + h / 2 | 0; rect(c, kx, ky, 2, 1, P[0]); rect(c, kx - 1, ky - 1, 1, 1, P[3]); }
}
function dense(pts) {
  const o = [];
  for (let i = 0; i < pts.length; i++) { o.push(pts[i]); const q = pts[i + 1]; if (!q) break; const n = Math.ceil(Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])); for (let k = 1; k < n; k++) o.push([pts[i][0] + (q[0] - pts[i][0]) * k / n, pts[i][1] + (q[1] - pts[i][1]) * k / n]); }
  return o;
}
function sPath(c, pts, th, col, out = UI_OUT) { strokePath(c, dense(pts), th, col, out); }
// raiz/galho roliço: contorno, corpo, luz em cima, sombra embaixo e um nó de vez em quando
function rootPath(c, pts, th, P) {
  pts = dense(pts); strokePath(c, pts, th, P[1], UI_OUT);
  const hw = Math.max(1, th - 2);
  pts.forEach(([px, py], i) => { rect(c, px - hw / 2, py - th / 2, hw, 1, P[2]); if (th > 2) rect(c, px - hw / 2, py + th / 2 - 1, hw, 1, P[0]); if (i % 23 === 11) rect(c, px, py, 1, 1, P[3] || P[2]); });
}
function twig(c, x, y, ang, len, col) { for (let k = 0; k <= len; k++) { const tx = x + Math.cos(ang) * k, ty = y + Math.sin(ang) * k; rect(c, tx - 1, ty - 1, 3, 3, UI_OUT); } for (let k = 0; k <= len; k++) rect(c, x + Math.cos(ang) * k, y + Math.sin(ang) * k, 1, 1, col); }
function vineOn(c, pts, col, leafCol, every = 6) {
  pts = dense(pts); const step = every * 2;
  for (const [px, py] of pts) rect(c, px - 1, py - 1, 3, 3, UI_OUT);
  pts.forEach(([px, py], i) => { rect(c, px, py, 1, 1, col); if (i % step === step - 1) { const k = i / step | 0; leafTip(c, Math.round(px), Math.round(py), k % 2 ? 1 : -1, k % 3 ? -1 : 1, k % 3 ? leafCol : col, UI_OUT); } });
}
const wave = (x0, y0, x1, y1, amp, n, ph = 0) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * HPI * 2 * 3 + ph) * amp]; });
function bone(c, x0, y0, x1, y1, col = '#e0d4b8', sh = '#a8987a') {
  line(c, x0, y0, x1, y1, UI_OUT, 3);
  for (const [bx, by] of [[x0, y0], [x1, y1]]) { ell(c, bx, by, 2, 2, UI_OUT); rect(c, bx - 1, by - 1, 2, 2, col); }
  line(c, x0, y0, x1, y1, col, 1); rect(c, (x0 + x1) / 2, (y0 + y1) / 2 + 1, 2, 1, sh);
}
// crânio de bicho com chifre (Mapinguari / Labatut), voltado para a esquerda
function beastSkull(c, x, y, horn, col = '#ddd0b2', sh = '#a8967a') {
  ell(c, x + 13, y + 8, 9, 7, UI_OUT); ell(c, x + 13, y + 8, 8, 6, col);
  for (let i = 0; i < 11; i++) { const hh = 6 - i * 0.25; rect(c, x + 2 + i, y + 9 - hh / 2 - 1, 1, hh + 2, UI_OUT); rect(c, x + 2 + i, y + 9 - hh / 2, 1, hh, col); }
  rect(c, x + 4, y + 11, 14, 2, sh); rect(c, x + 8, y + 13, 9, 1, sh);
  for (let i = 0; i < 5; i++) rect(c, x + 4 + i * 2, y + 12, 1, 2, '#f8f0dc');
  ell(c, x + 13, y + 6, 3, 2, '#1a0c0a'); rect(c, x + 13, y + 6, 1, 1, '#5a1a14');
  rect(c, x + 3, y + 8, 1, 1, '#1a0c0a'); rect(c, x + 5, y + 7, 1, 1, '#1a0c0a');
  for (let i = 0; i < 4; i++) rect(c, x + 15 + i, y + 3 + (i % 2), 1, 1, sh);
  if (horn) { const pts = curve(x + 17, y + 3, x + 24, y - 2, x + 22, y - 10, 10); sPath(c, pts, 2, col, UI_OUT); pts.forEach(([px, py], i) => i % 3 === 0 && rect(c, px, py, 1, 1, sh)); }
}
// chama pequena (estática no quadro)
function smallFlame(c, x, y, s, cols) { for (let k = 0; k < 5 * s; k++) { const w2 = Math.max(1, Math.round((1 - k / (5 * s)) * 2.5 * s)); rect(c, x - w2 / 2 + Math.sin(k) * 0.6, y - k, w2, 1, k < 2 * s ? cols[0] : k < 3.5 * s ? cols[1] : cols[2]); } }

// ---------- painel do espírito ----------
function panelFrame(lb, ls) {
  return tcache(`pf4-${lb}-${ls}`, lb + 16, 25, (c) => {
    const fw = lb + 14, r = seeded(lb * 3 + 1);
    rect(c, 2, 2, fw - 2, 20, '#140c0a'); for (let i = 0; i < 24; i++) rect(c, 3 + r() * (fw - 6), 3 + r() * 18, 2, 1, '#1e1410');
    plank(c, 0, 0, fw, 4, WOOD, r); plank(c, 0, 20, fw, 4, WOOD, r);
    plank(c, 0, 0, 4, 24, WOOD, r);
    // amarração em X nos cantos
    for (const cy of [0, 20]) { line(c, -1, cy - 1, 5, cy + 5, UI_OUT, 3); line(c, 5, cy - 1, -1, cy + 5, UI_OUT, 3); line(c, -1, cy - 1, 5, cy + 5, '#b09a68'); line(c, 5, cy - 1, -1, cy + 5, '#8a7650'); }
    // presilhas de ferro nas tábuas
    for (const cx of [12, fw - 22]) for (const cy of [0, 20]) { rect(c, cx, cy - 1, 4, 6, UI_OUT); rect(c, cx + 1, cy, 2, 4, '#6a6a74'); rect(c, cx + 1, cy, 2, 1, '#b8b8c4'); rect(c, cx + 1, cy + 2, 1, 1, '#2a2a30'); }
    bronzeRim(c, 6, 4, lb + 4, 9); bronzeRim(c, 6, 13, ls + 4, 7, '#c8d090', '#5a6a2a');
  });
}
function medallion() {
  return tcache('medal4', 32, 32, (c) => {
    const cx = 16, cy = 16, r = seeded(91);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const dx = x - cx + 0.5, dy = y - cy + 0.5, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (d > 13.5 || d < 7.5) continue;
      if (d > 12.5 || d < 8.5) { rect(c, x, y, 1, 1, UI_OUT); continue; }
      const s = ((a / HPI * 6 + d * 0.4) % 1 + 1) % 1, n = hash(x * 31 + y * 17);
      rect(c, x, y, 1, 1, n < 0.06 ? WOOD[3] : s < 0.42 ? WOOD[1] : s < 0.62 ? WOOD[2] : WOOD[0]);
    }
    ell(c, cx, cy, 8, 8, '#0a0606'); ell(c, cx, cy - 1, 7, 7, '#1c120e'); ell(c, cx, cy - 2, 5, 4, '#241812');
    // raízes soltas e cipó com folhas abraçando o medalhão
    for (const [a, l] of [[-2.5, 3], [-0.6, 3], [0.9, 3], [2.2, 3]]) twig(c, cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, a + (r() - 0.5) * 0.6, l, WOOD[2]);
    const vine = (a0, a1, rr) => Array.from({ length: 24 }, (_, i) => { const a = a0 + (a1 - a0) * i / 23, w = rr + Math.sin(i * 0.9) * 1.1; return [cx + Math.cos(a) * w, cy + Math.sin(a) * w]; });
    vineOn(c, vine(-2.9, -0.4, 12.5), '#4a8a2c', '#7ac048', 4);
    vineOn(c, vine(0.6, 2.4, 13), '#3e7a26', '#6ab040', 5);
  });
}
function flaskIcon(full) {
  return tcache('flask4-' + full, 9, 11, (c) => {
    rect(c, 3, 0, 3, 2, UI_OUT); rect(c, 4, 0, 1, 1, '#e0b070');
    rect(c, 2, 2, 5, 2, UI_OUT); rect(c, 3, 2, 3, 2, full ? '#9ab8c0' : '#5a6068'); rect(c, 3, 2, 1, 2, '#d0e8f0');
    ell(c, 4, 7, 4, 3, UI_OUT); ell(c, 4, 7, 3, 2, full ? '#3a2a34' : '#1e1a24');
    if (full) {
      for (let y = 5; y <= 9; y++) { const hw = Math.round(3 * Math.sqrt(Math.max(0, 1 - ((y - 7) / 2.6) ** 2))); rect(c, 4 - hw, y, hw * 2 + 1, 1, y < 6 ? '#fff0a0' : y < 7 ? '#ffb43a' : y < 9 ? '#e8702a' : '#a8301a'); }
      rect(c, 2, 6, 1, 2, '#ffffff'); rect(c, 5, 8, 1, 1, '#fff6d0');
    } else {
      rect(c, 2, 9, 5, 1, '#5a2a18'); rect(c, 2, 6, 1, 1, '#6a6a7a');
      // barbante enrolado no frasco vazio
      line(c, 1, 5, 7, 9, '#a08a5a'); line(c, 7, 5, 2, 9, '#8a744a');
    }
  });
}
function leafIcon() {
  return tcache('leaf4', 8, 8, (c) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (x + y > 4 && x + y < 11 && Math.abs(x - y) < 5) rect(c, x, y, 1, 1, UI_OUT);
    for (let y = 1; y < 7; y++) for (let x = 1; x < 7; x++) if (x + y > 5 && x + y < 10 && Math.abs(x - y) < 4) rect(c, x, y, 1, 1, (x + y) % 3 ? '#c8822e' : '#e0a040');
    line(c, 0, 7, 5, 2, '#7a4a1a');
  });
}
function iconSun(c, x, y, t) { ell(ctx, x, y, 2, 2, UI_OUT); ell(ctx, x, y, 1, 1, '#ffd25a'); for (let i = 0; i < 6; i++) { const a = i / 6 * HPI * 2 + t; rect(ctx, x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, 1, 1, '#ffb030'); } }
function iconBubble(c, x, y) { ell(ctx, x, y, 2, 2, UI_OUT); ell(ctx, x, y, 1, 1, '#3a7ab0'); rect(ctx, x - 1, y - 1, 1, 1, '#e0f6ff'); rect(ctx, x + 3, y - 2, 1, 1, '#9ad8f8'); }

const PAL_HP = ['#4a0606', '#b0180e', '#f04a20', '#ffc070'], PAL_ST = ['#1a2a0a', '#4a7a1a', '#9ac83a', '#e8f0a0'];
const PAL_HEAT = ['#5a1a04', '#c85a10', '#f8a030', '#fff0a0'], PAL_AIR = ['#0a2a4a', '#2a6aa8', '#7ac8f0', '#e8faff'];
function drawPlayerHud() {
  const P = G.P, m = statMax(), t = G.rt, dt = Math.min(0.1, Math.max(0, t - UIA.t)); UIA.t = t;
  const lb = clamp(Math.round(58 + (m.hp - 100) / 5), 58, 104), ls = clamp(Math.round(44 + (m.st - 100) / 5), 40, lb - 6);
  const hp = clamp(P.hp / m.hp, 0, 1), st = clamp(P.st / m.st, 0, 1);
  // perda recente: a faixa âmbar espera um instante e desce
  if (UIA.lastHp != null && hp < UIA.lastHp - 0.002) { UIA.hitT = t; UIA.delayHp = 0.35; }
  UIA.lastHp = hp;
  if (UIA.trHp == null || hp > UIA.trHp) UIA.trHp = hp; else if ((UIA.delayHp -= dt) <= 0) UIA.trHp = Math.max(hp, UIA.trHp - dt * 0.5);
  const shake = t - UIA.hitT < 0.25 ? Math.round((hash(Math.floor(t * 60)) - 0.5) * 3) : 0, low = hp > 0 && hp < 0.3;
  const X = 4 + shake, Y = 10;
  // nome da forma
  const f = FORMS[P.form] || FORMS.espirito, nome = f.nome + (f.povo ? ' · ' + f.povo : '');
  drawPx(nome, X + 1, Y - 9, { col: '#f0e2c4', col2: '#b8a484' });
  ctx.drawImage(panelFrame(lb, ls), X, Y);
  drawTexBar(X + 8, Y + 6, lb, 5, hp, UIA.trHp, barTex('hp', 5, PAL_HP, 'flame'), t * 16, low && Math.sin(t * 12) > 0 ? '#ffffff' : '#ffe0a0', 0);
  if (low) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 8); rect(ctx, X + 8, Y + 6, Math.round(lb * hp), 5, '#ff6040'); ctx.globalAlpha = 1; }
  drawTexBar(X + 8, Y + 15, ls, 3, st, st, barTex('st', 3, PAL_ST, 'specks'), t * 6, st < 0.15 && Math.sin(t * 16) > 0 ? '#ffffff' : '#f0ffc0', 0);
  // medalhão com o rosto (pulsa em vermelho com a vida baixa)
  const mx = X + lb + 16, my = Y + 12;
  if (low) { ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 8); ell(ctx, mx, my, 15, 15, '#c8302a'); ctx.globalAlpha = 1; }
  ctx.drawImage(medallion(), mx - 16, my - 16);
  const face = $('#hudFace'); if (face) ctx.drawImage(face, 2, 1, 14, 14, mx - 7, my - 8, 14, 14);
  if (G.save.cold) drawSparkle(ctx, mx + 10, my - 11, t, '#bfe4ff');
  // frascos de cura e memórias
  let fx = X + 3; const fy = Y + 26;
  if (P.ab.heal) {
    if (UIA.lastFl != null && P.flasks < UIA.lastFl) { UIA.usedT = t; UIA.usedI = P.flasks; }
    UIA.lastFl = P.flasks;
    for (let i = 0; i < m.flasks; i++) {
      const full = i < P.flasks;
      if (full) { ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 2.6 + i * 1.3); ell(ctx, fx + 4, fy + 7, 5, 4, '#ffa040'); ctx.globalAlpha = 1; }
      ctx.drawImage(flaskIcon(full), fx, fy);
      if (i === UIA.usedI && t - UIA.usedT < 0.45) { const k = (t - UIA.usedT) / 0.45; ctx.globalAlpha = 1 - k; ell(ctx, fx + 4, fy + 6, 3 + k * 6, 3 + k * 6, '#fff0b0'); ctx.globalAlpha = 1; }
      fx += 10;
    }
    fx += 3;
  }
  ctx.drawImage(leafIcon(), fx, fy + 2);
  drawPx('×' + G.save.mem, fx + 10, fy + 2, { col: '#fff0c8', col2: '#d8b878' });
  // calor da Caatinga e fôlego embaixo d'água
  let ry = fy + 14;
  const mini = (v, pal, key, style, icon) => { bronzeRimScreen(X + 10, ry - 1, 48, 6); drawTexBar(X + 12, ry + 1, 44, 2, v, v, barTex(key, 2, pal, style), t * 10, '#ffffff', 0); icon(ctx, X + 4, ry + 1, t); ry += 8; };
  if (G.lvl.biome === 'caatinga') mini(clamp(G.heat / 100, 0, 1), G.heat >= 100 && Math.sin(t * 14) > 0 ? ['#6a0a04', '#e02a1a', '#ff7a4a', '#ffffff'] : PAL_HEAT, G.heat >= 100 ? 'heat2' : 'heat', 'flame', iconSun);
  if (P.breath != null && P.breath < 100) mini(clamp(P.breath / 100, 0, 1), PAL_AIR, 'air', 'bubbles', iconBubble);
}
function bronzeRimScreen(x, y, w, h) { bronzeRim(ctx, x, y, w, h); }

// ---------- barras dos guardiões ----------
// cada guardião tem moldura própria (fundo e frente), cor do nome, textura do enchimento e efeito animado
const BS = { x: 73, y: 38, w: 190, h: 9 };   // fenda da barra dentro do quadro (336×66)
const BOSS_UI = {
  mapinguari: {
    name: '#ecd2a0', fill: ['#4a0808', '#a8240c', '#e8602a', '#ffc060'], style: 'flame', speed: 10,
    back(c, r) {
      const P = WOOD, L = BS.x, R = BS.x + BS.w, T = BS.y, B = BS.y + BS.h, M = (L + R) / 2;
      rootPath(c, curve(L - 16, T - 1, M, T - 5, R + 16, T, 40), 3, P); rootPath(c, curve(L - 12, B + 1, M, B + 9, R + 14, B - 1, 40), 3, P);
      rootPath(c, curve(L - 24, T + 6, L + 8, T - 9, L + 56, T - 2, 20), 2, P); rootPath(c, curve(R - 56, T - 2, R - 8, T - 9, R + 26, T + 6, 20), 2, P);
      rootPath(c, curve(L - 20, B - 4, L + 22, B + 13, L + 76, B + 2, 22), 2, P); rootPath(c, curve(R - 76, B + 2, R - 22, B + 13, R + 22, B - 4, 22), 2, P);
      for (let i = 0; i < 16; i++) { const x = L - 10 + r() * (BS.w + 20), up = r() < 0.5; twig(c, x, up ? T - 3 - r() * 2 : B + 4 + r() * 4, up ? -HPI / 2 + (r() - 0.5) * 1.6 : HPI / 2 + (r() - 0.5) * 1.6, 2 + r() * 2, P[2]); }
      vineOn(c, wave(L - 18, T - 3, R + 18, T - 2, 1.5, 80, 1), '#3e7a26', '#6ab040', 7);
      vineOn(c, wave(L - 14, B + 5, R + 14, B + 6, 2, 80, 2.2), '#3e7a26', '#7ac048', 9);
      beastSkull(c, L - 44, T - 6, false);
      for (let i = 0; i < 9; i++) { ell(c, R + 12 + i * 3, T - 3 + (i % 3), 4, 3, UI_OUT); }
      for (let i = 0; i < 9; i++) { ell(c, R + 12 + i * 3, T - 4 + (i % 3), 3, 2, i % 2 ? '#3a3a42' : '#52525c'); rect(c, R + 11 + i * 3, T - 6 + (i % 3), 1, 2, '#6a6a74'); }
      for (let k = 0; k < 3; k++) { const pts = curve(R + 14 + k * 8, T, R + 22 + k * 8, T + 8, R + 16 + k * 8, B + 9, 16); sPath(c, pts, 2, '#e8e0cc'); dense(pts).forEach(([x, y], i) => i % 4 === 0 && rect(c, x + 1, y, 1, 1, '#a8987a')); }
      bone(c, R + 4, B + 8, R + 30, B + 10);
    },
    front(c, r) { const L = BS.x, R = BS.x + BS.w, T = BS.y, B = BS.y + BS.h; vineOn(c, curve(L + 34, T - 4, L + 44, T + 6, L + 40, B + 4, 14), '#4a8a2c', '#7ac048', 5); vineOn(c, curve(R - 62, T - 4, R - 70, T + 6, R - 58, B + 4, 14), '#4a8a2c', '#6ab040', 5); rootPath(c, curve(L - 6, T - 5, L + 8, T + 6, L + 2, B + 5, 12), 2, WOOD); },
    fx: [[BS.x - 30, BS.x + BS.w + 30, BS.y - 6, '#c8f060', 14, 0.25]],
  },
  capelobo: {
    name: '#ffb868', fill: ['#5a1a04', '#c04a0a', '#f8a030', '#fff0a0'], style: 'flame', speed: 18,
    back(c, r) {
      const L = BS.x, R = BS.x + BS.w, T = BS.y, B = BS.y + BS.h, CH = ['#140e0c', '#2a1e18', '#3e2c22', '#5a4030'];
      for (const [y, h] of [[T - 6, 6], [B, 6]]) { plank(c, L - 18, y, BS.w + 36, h, CH, r); for (let i = 0; i < 22; i++) { const x = L - 14 + r() * (BS.w + 28); rect(c, x, y + 2 + (r() * (h - 3) | 0), 2 + r() * 5, 1, r() < 0.6 ? '#e0602a' : '#ffb040'); } }
      for (const x of [L - 20, R + 20]) { ell(c, x, T + 6, 7, 9, UI_OUT); ell(c, x, T + 6, 6, 8, '#3a2a20'); ell(c, x, T + 6, 4, 6, '#5a3a28'); ell(c, x, T + 6, 2, 3, '#e0602a'); rect(c, x, T + 5, 1, 1, '#ffd080'); }
      for (const x0 of [L - 26, R + 6]) for (let i = 0; i < 9; i++) { const x = x0 + i * 2.6, h = 4 + r() * 6; line(c, x, B + 6, x + (r() - 0.5) * 4, B + 6 - h, UI_OUT, 2); line(c, x, B + 6, x + (r() - 0.5) * 4, B + 6 - h, r() < 0.5 ? '#d8a83a' : '#a87a2a'); }
      // focinho comprido do Capelobo (crânio de tamanduá)
      const sx = L - 52, sy = T - 6; ell(c, sx + 26, sy + 8, 7, 6, UI_OUT); ell(c, sx + 26, sy + 8, 6, 5, '#cfc0a4');
      for (let i = 0; i < 22; i++) { const hh = 4 - i * 0.1; rect(c, sx + 4 + i, sy + 8 - hh / 2 - 1 + i * 0.12, 1, hh + 2, UI_OUT); rect(c, sx + 4 + i, sy + 8 - hh / 2 + i * 0.12, 1, hh, i % 4 ? '#cfc0a4' : '#a8987a'); }
      ell(c, sx + 26, sy + 7, 2, 2, '#1a0c0a'); rect(c, sx + 27, sy + 7, 1, 1, '#ff6a2a'); rect(c, sx + 28, sy + 1, 3, 3, UI_OUT); rect(c, sx + 29, sy + 2, 1, 2, '#cfc0a4');
      for (let k = 0; k < 3; k++) { line(c, R + 8 + k * 6, T - 6, R + 16 + k * 6, B + 8, UI_OUT, 3); line(c, R + 8 + k * 6, T - 6, R + 16 + k * 6, B + 8, '#ff8a3a'); }
      for (const [x, y] of [[L + 20, T - 6], [L + 70, T - 6], [R - 40, T - 6], [R + 2, T - 6], [L - 8, B]]) smallFlame(c, x, y, 1.2, ['#e04a1a', '#ff9a2a', '#ffe08a']);
    },
    front() {},
    fx: [[BS.x - 20, BS.x + BS.w + 20, BS.y - 6, '#ffb040', 20, 0.8], [BS.x - 20, BS.x + BS.w + 20, BS.y + BS.h + 1, '#ff6a2a', 12, 0.6]],
  },
  boitata: {
    name: '#c8f0ff', fill: ['#081a3a', '#1a5aa8', '#5ad0f0', '#e0ffff'], style: 'flame', speed: 22,
    back(c, r) {
      const L = BS.x, R = BS.x + BS.w, T = BS.y, B = BS.y + BS.h;
      for (const x of [L - 30, R + 22]) { ell(c, x, B + 6, 16, 6, UI_OUT); ell(c, x, B + 5, 15, 5, '#3a3430'); rect(c, x - 8, B + 2, 6, 1, '#5a5048'); }
      // corpo de escamas serpenteando por cima e por baixo, com chama fria nas costas
      const body = (y0, ph) => { const pts = Array.from({ length: 140 }, (_, i) => { const x = L - 24 + i * (BS.w + 48) / 139; return [x, y0 + Math.sin(x * 0.055 + ph) * 3.5]; }); sPath(c, pts, 5, '#16203a', UI_OUT); pts.forEach(([x, y], i) => { if (i % 3 === 0) rect(c, x, y, 2, 1, '#2e4470'); if (i % 3 === 1) rect(c, x, y - 2, 1, 1, '#5ad0f0'); if (i % 9 === 0) smallFlame(c, x, y - 3, 0.9, ['#2a8ad0', '#7ae0ff', '#e8ffff']); }); };
      body(T - 4, 0); body(B + 4, 2.4);
      // cabeça à direita, olhando para a barra
      const hx = R + 12, hy = T - 3;
      ell(c, hx + 12, hy + 10, 12, 9, UI_OUT); ell(c, hx + 12, hy + 10, 11, 8, '#1a2440'); ell(c, hx + 14, hy + 7, 7, 4, '#2a3a60');
      for (let i = 0; i < 10; i++) { rect(c, hx - 2 + i, hy + 9 - i * 0.2, 1, 6 - i * 0.3, UI_OUT); }
      rect(c, hx, hy + 13, 10, 2, '#5a1a2a'); for (let i = 0; i < 4; i++) { rect(c, hx + 1 + i * 2, hy + 12, 1, 2, '#e8f0ff'); rect(c, hx + 2 + i * 2, hy + 15, 1, 1, '#e8f0ff'); }
      ell(c, hx + 10, hy + 7, 2, 2, '#0a1020'); rect(c, hx + 9, hy + 6, 3, 2, '#bfefff'); rect(c, hx + 10, hy + 6, 1, 1, '#ffffff');
      for (let i = 0; i < 5; i++) smallFlame(c, hx + 8 + i * 4, hy + 2 - (i % 2), 1.1, ['#2a8ad0', '#7ae0ff', '#e8ffff']);
      for (let k = 0; k < 6; k++) rect(c, hx - 6 - k * 1.6, hy + 14 + Math.sin(k) * 1.5, 2, 1, k % 2 ? '#7ae0ff' : '#e8ffff');
      // cauda enrolada à esquerda
      const sp = Array.from({ length: 40 }, (_, i) => { const a = i * 0.32, rr = 11 - i * 0.24; return [L - 26 + Math.cos(a) * rr, T + 6 + Math.sin(a) * rr]; });
      sPath(c, sp, 3, '#16203a', UI_OUT); sp.forEach(([x, y], i) => i % 3 === 0 && rect(c, x, y, 1, 1, '#5ad0f0')); smallFlame(c, sp[39][0], sp[39][1] - 1, 1, ['#2a8ad0', '#7ae0ff', '#e8ffff']);
    },
    front(c) {
      const L = BS.x, T = BS.y, B = BS.y + BS.h;
      // as três correntes que prendem a serpente (a barra se esvazia uma corrente por vez)
      for (const k of [1, 2]) { const x = L + Math.round(BS.w * k / 3); for (let y = T - 6, i = 0; y < B + 8; y += 4, i++) { if (i % 2) { rect(c, x - 2, y - 1, 5, 6, UI_OUT); rect(c, x - 1, y, 3, 4, '#8a8a96'); rect(c, x, y + 1, 1, 2, '#1a1a20'); } else { rect(c, x - 1, y - 1, 3, 6, UI_OUT); rect(c, x, y, 1, 4, '#c8c8d4'); } } rect(c, x - 4, T - 8, 9, 3, UI_OUT); rect(c, x - 3, T - 7, 7, 1, '#a8a8b4'); }
      const pts = curve(L + 16, T - 5, L + 26, T + 6, L + 20, B + 5, 16); sPath(c, pts, 4, '#16203a', UI_OUT); pts.forEach(([x, y], i) => i % 2 === 0 && rect(c, x, y, 2, 1, '#2e4470'));
    },
    fx: [[BS.x - 24, BS.x + BS.w + 24, BS.y - 7, '#9fe8ff', 22, 0.9], [BS.x - 24, BS.x + BS.w + 24, BS.y + BS.h + 1, '#5ad0f0', 14, 0.6]],
  },
  paidomato: {
    name: '#c8f0b0', fill: ['#0a2a20', '#1a6a4a', '#5ac080', '#d0ffb0'], style: 'bubbles', speed: 6,
    back(c, r) {
      const L = BS.x, R = BS.x + BS.w, T = BS.y, B = BS.y + BS.h;
      // espelho d'água embaixo, com aguapés e uma flor
      for (let x = L - 30; x < R + 30; x++) { const y = B + 4 + Math.round(Math.sin(x * 0.2) * 0.8); rect(c, x, y, 1, 4, '#1a3a5a'); rect(c, x, y, 1, 1, (x % 7) < 3 ? '#8ac0e0' : '#2a5a80'); }
      for (const [x, w] of [[L - 18, 9], [L + 40, 7], [R - 70, 8], [R + 12, 10], [L + 120, 6]]) { ell(c, x, B + 5, w, 3, UI_OUT); ell(c, x, B + 5, w - 1, 2, '#3a7a3a'); rect(c, x - 1, B + 3, 2, 2, '#1a3a5a'); rect(c, x - w + 2, B + 4, 3, 1, '#6aaa4a'); }
      ell(c, R + 12, B + 2, 3, 2, UI_OUT); ell(c, R + 12, B + 1, 2, 2, '#f0a0c8'); rect(c, R + 12, B + 1, 1, 1, '#ffe060');
      // galho com musgo pendurado em cima
      rootPath(c, curve(L - 20, T - 2, (L + R) / 2, T - 5, R + 20, T - 2, 44), 4, ['#3a2a1a', '#6a5032', '#8a6a42', '#a8844a']);
      for (let i = 0; i < 34; i++) { const x = L - 14 + r() * (BS.w + 28), l = 2 + r() * 8; rect(c, x - 1, T - 3, 3, l + 1, UI_OUT); rect(c, x, T - 3, 1, l, r() < 0.5 ? '#8aba5a' : '#5a9a3a'); }
      rootPath(c, curve(L - 16, B + 1, (L + R) / 2, B + 3, R + 16, B + 1, 44), 2, ['#3a2a1a', '#6a5032', '#8a6a42', '#a8844a']);
      // juncos e taboas nas pontas
      for (const [x0, dir] of [[L - 34, 1], [R + 22, -1]]) for (let i = 0; i < 7; i++) { const x = x0 + i * 3 * dir, h = 12 + r() * 9, top = B + 4 - h; line(c, x, B + 6, x + dir * 2, top, UI_OUT, 3); line(c, x, B + 6, x + dir * 2, top, i % 2 ? '#5a8a3a' : '#7aaa4a'); if (i % 2 === 0) { rect(c, x + dir * 2 - 1, top - 1, 4, 7, UI_OUT); rect(c, x + dir * 2, top, 2, 5, '#6a4020'); } }
      // lamparina pendurada na ponta do galho
      const lx = L - 6; line(c, lx, T - 4, lx, T + 4, '#2a2018'); rect(c, lx - 3, T + 4, 7, 8, UI_OUT); rect(c, lx - 2, T + 5, 5, 6, '#ffd27a'); rect(c, lx - 1, T + 6, 3, 4, '#fff4c0'); rect(c, lx - 3, T + 4, 7, 1, '#5a4030');
    },
    front(c) { const R = BS.x + BS.w, T = BS.y, B = BS.y + BS.h; line(c, R - 10, B + 7, R - 5, T - 6, UI_OUT, 3); line(c, R - 10, B + 7, R - 5, T - 6, '#7aaa4a'); rect(c, R - 7, T - 7, 4, 7, UI_OUT); rect(c, R - 6, T - 6, 2, 5, '#6a4020'); },
    fx: [[BS.x - 30, BS.x + BS.w + 30, BS.y + BS.h + 5, '#bfe8ff', 10, 0.35], [BS.x - 10, BS.x - 2, BS.y + 8, '#ffe08a', 6, 0.5]],
  },
  labatut: {
    name: '#ffdc98', fill: ['#3a1a08', '#8a4a1a', '#d8903a', '#ffe0a0'], style: 'cracks', speed: 5,
    back(c, r) {
      const L = BS.x, R = BS.x + BS.w, T = BS.y, B = BS.y + BS.h, ST = ['#5a4630', '#a8906a', '#c8b088', '#e0cca0'];
      for (const [y, h] of [[T - 7, 7], [B, 7]]) { plank(c, L - 16, y, BS.w + 32, h, ST, r); for (let i = 0; i < 9; i++) { let x = L - 10 + r() * (BS.w + 20); for (let k = 0; k < h - 2; k++) { x += (r() - 0.5) * 2; rect(c, x, y + 1 + k, 1, 1, '#5a4630'); } } }
      // mandacarus nas pontas
      for (const [x, s] of [[L - 30, 1], [R + 28, -1]]) {
        const col = (x0, y0, y1, w) => { rect(c, x0 - 1, y1 - 1, w + 2, y0 - y1 + 2, UI_OUT); rect(c, x0, y1, w, y0 - y1, '#4a7a3a'); for (let k = 1; k < w; k += 2) rect(c, x0 + k, y1 + 1, 1, y0 - y1 - 2, '#6a9a4a'); for (let y = y1 + 2; y < y0; y += 3) { rect(c, x0 - 1, y, 1, 1, '#f0e8c8'); rect(c, x0 + w, y + 1, 1, 1, '#f0e8c8'); } };
        col(x, B + 7, T - 9, 5); col(x + s * 7, T + 6, T - 6, 3); rect(c, Math.min(x, x + s * 7) + 2, T + 4, 7, 3, UI_OUT); rect(c, Math.min(x, x + s * 7) + 3, T + 5, 5, 1, '#4a7a3a');
        col(x - s * 6, T + 10, T - 1, 3); rect(c, Math.min(x, x - s * 6) + 2, T + 8, 7, 3, UI_OUT); rect(c, Math.min(x, x - s * 6) + 3, T + 9, 5, 1, '#4a7a3a');
      }
      // crânio de boi com chifres e a lança de ferro enferrujada
      const kx = L - 22, ky = T - 8; ell(c, kx, ky + 8, 6, 6, UI_OUT); ell(c, kx, ky + 8, 5, 5, '#ece4d2'); rect(c, kx - 3, ky + 12, 6, 5, UI_OUT); rect(c, kx - 2, ky + 12, 4, 4, '#d8d0bc');
      ell(c, kx - 2, ky + 7, 1, 1, '#1a1008'); ell(c, kx + 2, ky + 7, 1, 1, '#1a1008');
      for (const s of [-1, 1]) { const pts = curve(kx + s * 4, ky + 5, kx + s * 13, ky + 4, kx + s * 14, ky - 1, 10); sPath(c, pts, 2, '#e8e0cc', UI_OUT); }
      line(c, R + 2, B + 10, R + 34, T - 6, UI_OUT, 4); line(c, R + 2, B + 10, R + 34, T - 6, '#7a4a2a', 2); line(c, R + 3, B + 9, R + 34, T - 5, '#a86a3a');
      rect(c, R + 32, T - 10, 6, 6, UI_OUT); rect(c, R + 33, T - 9, 4, 4, '#8a8a90'); rect(c, R + 33, T - 9, 2, 1, '#c8c8d0');
    },
    front() {},
    fx: [[BS.x - 30, BS.x + BS.w + 30, BS.y + BS.h + 6, '#e8d8b0', 12, 0.3]],
  },
  corposeco: {
    name: '#e0c8f0', fill: ['#14081a', '#4a1a4a', '#8a3a7a', '#c8f080'], style: 'veins', speed: 4,
    back(c, r) {
      const L = BS.x, R = BS.x + BS.w, T = BS.y, B = BS.y + BS.h, DW = ['#1e181c', '#4a3e40', '#6a5c5a', '#8a7a76'];
      for (let i = 0; i < 4; i++) { ell(c, L - 20 + i * 8, B + 2, 14, 8, '#2a0e2a55'); ell(c, R + 20 - i * 8, T + 2, 14, 8, '#2a0e2a55'); }
      rootPath(c, curve(L - 22, T - 1, (L + R) / 2, T - 5, R + 22, T - 2, 44), 3, DW); rootPath(c, curve(L - 18, B + 1, (L + R) / 2, B + 10, R + 18, B, 44), 3, DW);
      rootPath(c, curve(L - 30, T + 8, L - 4, T - 9, L + 40, T - 3, 20), 2, DW); rootPath(c, curve(R - 40, B + 6, R + 6, B + 16, R + 30, B - 8, 20), 2, DW);
      for (let i = 0; i < 26; i++) { const x = L - 16 + r() * (BS.w + 32), up = r() < 0.5; twig(c, x, up ? T - 3 - r() * 2 : B + 5 + r() * 4, up ? -HPI / 2 + (r() - 0.5) * 2 : HPI / 2 + (r() - 0.5) * 2, 2 + r() * 3, DW[3]); }
      // caveira rachada com olhos de brasa
      const sx = L - 36, sy = T - 8; ell(c, sx + 9, sy + 9, 9, 9, UI_OUT); ell(c, sx + 9, sy + 9, 8, 8, '#d8d0c0'); ell(c, sx + 9, sy + 6, 7, 5, '#ece6d8');
      rect(c, sx + 4, sy + 15, 11, 6, UI_OUT); rect(c, sx + 5, sy + 15, 9, 5, '#c8c0b0'); for (let i = 0; i < 4; i++) rect(c, sx + 6 + i * 2, sy + 17, 1, 3, UI_OUT);
      ell(c, sx + 6, sy + 10, 2, 2, '#0a0408'); ell(c, sx + 12, sy + 10, 2, 2, '#0a0408'); rect(c, sx + 6, sy + 10, 1, 1, '#ff3a2a'); rect(c, sx + 12, sy + 10, 1, 1, '#ff3a2a');
      rect(c, sx + 9, sy + 13, 1, 2, '#0a0408'); line(c, sx + 10, sy + 1, sx + 13, sy + 6, '#5a5048'); line(c, sx + 13, sy + 6, sx + 12, sy + 9, '#5a5048');
      // costelas à direita
      for (let k = 0; k < 4; k++) { const pts = curve(R + 10, T - 4 + k * 5, R + 26, T - 6 + k * 5, R + 30, T + 2 + k * 5, 10); sPath(c, pts, 1, '#d8d0c0', UI_OUT); }
      line(c, R + 9, T - 6, R + 9, B + 10, UI_OUT, 3); line(c, R + 9, T - 6, R + 9, B + 10, '#c8c0b0');
    },
    front(c) {
      const L = BS.x, R = BS.x + BS.w, B = BS.y + BS.h;
      // mãos secas agarrando a barra por baixo
      for (const [hx, s] of [[L + 10, 1], [R - 34, -1]]) for (let k = 0; k < 4; k++) { const x = hx + k * 5 * s, pts = [[x, B + 10], [x, B + 3], [x + s, B - 1], [x + 2 * s, B - 3], [x + 3 * s, B - 2]]; sPath(c, pts, 1, '#d8d0c0', UI_OUT); rect(c, x, B + 2, 1, 1, '#8a8070'); }
    },
    fx: [[BS.x - 30, BS.x + BS.w + 30, BS.y - 6, '#b07ad0', 16, 0.3], [BS.x - 30, BS.x + BS.w + 30, BS.y + BS.h + 4, '#7a3a8a', 12, 0.25]],
  },
};
const BOSS_UI_BASE = { name: '#efe0c0', fill: ['#3a0a14', '#7a1a2a', '#c84a4a', '#ffb0a0'], style: 'veins', speed: 6, back(c) { plank(c, BS.x - 10, BS.y - 6, BS.w + 20, 6); plank(c, BS.x - 10, BS.y + BS.h, BS.w + 20, 6); }, front() {}, fx: [] };
function bossFrame(k, part) {
  const U = BOSS_UI[k] || BOSS_UI_BASE;
  return tcache(`bf2-${k}-${part}`, 336, 66, (c) => {
    const r = seeded(k.length * 131 + (part === 'front' ? 7 : 3));
    if (part === 'back') { U.back(c, r); bronzeRim(c, BS.x, BS.y, BS.w, BS.h); }
    else U.front(c, r);
  });
}
function drawBossHud() {
  const B = G.boss; if (!B) return;
  const k = B.kind, U = BOSS_UI[k] || BOSS_UI_BASE, t = G.rt, dt = Math.min(0.1, Math.max(0, t - (UIA.bt || t))); UIA.bt = t;
  if (UIA.bKind !== k) { UIA.bKind = k; UIA.bIn = t; UIA.trB = null; UIA.lastB = null; }
  const frac = clamp(B.chains != null ? B.chains / 3 : B.hp / B.hpMax, 0, 1);
  if (UIA.lastB != null && frac < UIA.lastB - 0.001) { UIA.bHitT = t; UIA.delayB = 0.4; }
  UIA.lastB = frac;
  if (UIA.trB == null || frac > UIA.trB) UIA.trB = frac; else if ((UIA.delayB -= dt) <= 0) UIA.trB = Math.max(frac, UIA.trB - dt * 0.4);
  // entrada: o quadro sobe e a vida enche
  const e = clamp((t - UIA.bIn) / 0.6, 0, 1), fill = clamp((t - UIA.bIn - 0.35) / 0.9, 0, 1), ee = 1 - (1 - e) ** 3;
  const ox = Math.round(W / 2 - 168), oy = Math.round(H - 57 + (1 - ee) * 12);
  ctx.globalAlpha = ee;
  const low = frac > 0 && frac < 0.25;
  if (low) { ctx.globalAlpha = ee * (0.25 + 0.2 * Math.sin(t * 7)); rect(ctx, ox + BS.x - 3, oy + BS.y - 3, BS.w + 6, BS.h + 6, '#ff3a2a'); ctx.globalAlpha = ee; }
  ctx.drawImage(bossFrame(k, 'back'), ox, oy);
  const f2 = Math.min(frac, fill), tr = Math.min(UIA.trB, fill), flash = Math.max(0, 1 - (t - UIA.bHitT) / 0.12) * 0.7;
  drawTexBar(ox + BS.x + 2, oy + BS.y + 2, BS.w - 4, BS.h - 4, f2, tr, barTex('b-' + k, BS.h - 4, U.fill, U.style), t * U.speed, U.fill[3], flash);
  ctx.drawImage(bossFrame(k, 'front'), ox, oy);
  // efeito vivo do quadro (vaga-lumes, brasas, chama fria, bolhas, poeira, miasma)
  for (const [x0, x1, y, col, n, rise] of U.fx) for (let i = 0; i < n; i++) {
    const p = (t * (0.25 + hash(i + 11) * 0.35) + hash(i)) % 1, x = ox + x0 + hash(i * 3 + 1) * (x1 - x0) + Math.sin(t * 2 + i) * 2, y2 = oy + y - p * 16 * rise * 2;
    ctx.globalAlpha = ee * Math.sin(p * Math.PI) * 0.9; rect(ctx, x, y2, 1, 1, col);
  }
  ctx.globalAlpha = ee;
  // nome do guardião logo acima da barra, na fonte de pixel, sobre uma faixa escura
  const nm = (BOSSES[k] || {}).nome || k.toUpperCase(), bw = pxW(nm, 2) + 22;
  for (let i = 0; i < 3; i++) { ctx.globalAlpha = ee * (0.25 + i * 0.15); rect(ctx, W / 2 - bw / 2 + i * 3, oy + BS.y - 13 + i, bw - i * 6, 13 - i * 2, '#0a0608'); }
  ctx.globalAlpha = ee;
  drawPx(nm, W / 2, oy + BS.y - 10, { align: 'center', sp: 2, col: U.name, col2: mixHex(U.name, '#000000', 0.32) });
  ctx.globalAlpha = 1;
}
function drawHudCanvas() {
  if (!G.P || G.state !== 'play') return;
  if (!$('#hud').hidden) drawPlayerHud();
  if (G.boss && !$('#bossbar').hidden) drawBossHud(); else UIA.bKind = null;
}
