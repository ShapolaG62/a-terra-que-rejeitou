'use strict';
// Peças de cenário no espírito do tileset da Amazônia (Prompt_Tileset_Amazônia.pdf), desenhadas por código
// na escala do jogo (bloco de chão = 24px). Cada bioma troca material e paleta: a mesma ideia, cenário progressivo.

const TILE = 24;
const TPAL = {
  prologo: { moss: ['#262c38', '#343c4e', '#4c556c'], soil: ['#1e2028', '#16181e', '#2a2c36'], stone: ['#2e323e', '#3e4250', '#1c1f27'], root: ['#20242e', '#2e3442', '#444c5e'], bark: ['#22262e', '#30343e', '#16181e'], fern: ['#1e2430', '#2a3242', '#3e485c'], thorn: ['#3a2a34', '#5a3a46', '#1a1218'], deep: '#11131a', leaf: ['#12161e', '#1a2028', '#242c38'], vine: ['#1c222c', '#2c3442'], out: '#0a0b10', corrupt: '#05060a' },
  amazonia: { moss: ['#2a5226', '#4a842c', '#8cbc3a'], soil: ['#3a2618', '#2a1d14', '#4a3020'], stone: ['#5a4030', '#74563c', '#3a2a1e'], root: ['#34461e', '#566a28', '#7e9238'], bark: ['#4a3424', '#6a4a30', '#2a1c12'], fern: ['#1a5236', '#2a7444', '#4c9c58'], thorn: ['#5a1a1a', '#8e2a26', '#360c0c'], deep: '#2a1d14', leaf: ['#122a1c', '#1c4028', '#2a5e36'], vine: ['#264420', '#46682a'], out: '#0c100a', corrupt: '#0a1410' },
  cerrado: { moss: ['#6e4e1a', '#a07e26', '#dcb446'], soil: ['#6a2a1a', '#4a1c12', '#843822'], stone: ['#8a4a30', '#a8603a', '#5a2a1a'], root: ['#2a1a14', '#4a2a1a', '#6a3a22'], bark: ['#3a2216', '#5a3420', '#22120c'], fern: ['#86661a', '#b48e2a', '#e0c050'], thorn: ['#5a2a10', '#8a4a1a', '#2a1008'], deep: '#2a1210', leaf: ['#2a1a10', '#40281a', '#5a3a22'], vine: ['#4a2a14', '#6a4a22'], out: '#140806', corrupt: '#2a0a08' },
  pantanal: { moss: ['#284828', '#3c6638', '#68984a'], soil: ['#3a2a30', '#2a1c24', '#4a3438'], stone: ['#4a3a40', '#5e4c52', '#2a2028'], root: ['#283828', '#384a30', '#566a40'], bark: ['#4a3428', '#6a4a36', '#2a1c18'], fern: ['#3a5a2a', '#5a7a32', '#8aa04a'], thorn: ['#5a1e3a', '#8a2e4a', '#2a0e1a'], deep: '#1f1230', leaf: ['#1a3424', '#2a5034', '#467446'], vine: ['#283822', '#48582a'], out: '#0e0a12', corrupt: '#120a1e' },
  caatinga: { moss: ['#6a5a3a', '#8a7a4a', '#b0a060'], soil: ['#7a5440', '#5a3e2e', '#9a6a50'], stone: ['#8a7a6a', '#aa9a88', '#5a4a3a'], root: ['#5a4a3a', '#76664e', '#968666'], bark: ['#5a4a40', '#7a6a5a', '#3a2e28'], fern: ['#3a5a3a', '#5a7a4a', '#8aa06a'], thorn: ['#3e5a3e', '#e8e0c8', '#26362a'], deep: '#3e2a20', leaf: ['#4a3a2a', '#6a5a3a', '#8a7a4a'], vine: ['#5a4a3a', '#7a6a4a'], out: '#1e140e', corrupt: '#3a1e10' },
  mata: { moss: ['#224c38', '#367648', '#66a658'], soil: ['#2a2420', '#1c1814', '#3a3028'], stone: ['#3d5560', '#56707a', '#2a3a40'], root: ['#283e2e', '#385838', '#567848'], bark: ['#3a3024', '#5a4a34', '#221a12'], fern: ['#1c4832', '#2c6842', '#489858'], thorn: ['#561a28', '#862a38', '#2a0a12'], deep: '#10241f', leaf: ['#12261c', '#1c3828', '#285636'], vine: ['#22402a', '#3a5a32'], out: '#080e0c', corrupt: '#16080e' },
  coracao: { moss: ['#1e4a4a', '#2a7a6a', '#5ae0b0'], soil: ['#1a1830', '#120f22', '#24223e'], stone: ['#2a2a4a', '#3a3a62', '#1a1a30'], root: ['#22305a', '#2e4a7a', '#3ad0a0'], bark: ['#2a2456', '#3a3470', '#18142e'], fern: ['#1e5a5a', '#2a8a7a', '#5af0c0'], thorn: ['#5a1a4a', '#a02a7a', '#2a0820'], deep: '#0c0c1c', leaf: ['#122a3a', '#1c4258', '#2a6a7a'], vine: ['#1e3a4a', '#2a6a6a'], out: '#06060e', corrupt: '#000000' },
};
const tpal = b => TPAL[b] || TPAL.amazonia;
const TCACHE = {};
function tcache(key, w, h, fn) { if (!TCACHE[key]) { const [c, x] = mk(w, h); fn(x, w, h); TCACHE[key] = c; } return TCACHE[key]; }
// linha grossa com contorno (raízes, galhos, cipós)
function strokePath(x, pts, th, col, out) {
  for (const [px, py] of pts) rect(x, px - th / 2 - 1, py - th / 2 - 1, th + 2, th + 2, out);
  for (const [px, py] of pts) rect(x, px - th / 2, py - th / 2, th, th, col);
}
function curve(x0, y0, cx, cy, x1, y1, n = 24) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); } return pts; }
function mossTop(x, w, y, P, r, drip = true) {
  for (let i = 0; i < w; i++) {
    const h = 3 + (r() * 3 | 0);
    rect(x, i, y, 1, h, P.moss[1]); rect(x, i, y + h - 1, 1, 1, P.moss[0]);
    if (r() < 0.45) rect(x, i, y, 1, 1, P.moss[2]);
    if (drip && r() < 0.12) rect(x, i, y + h, 1, 1 + (r() * 3 | 0), P.moss[0]);
  }
  for (let i = 0; i < w; i += 3 + (r() * 4 | 0)) rect(x, i, y - 1, 2, 1, P.moss[r() < 0.5 ? 1 : 2]);
}
function fern(x, cx, by, P, r, size = 1) {
  for (let i = 0; i < 7; i++) {
    const a = -HPI / 2 + (i - 3) * 0.38, L2 = (7 + r() * 4) * size;
    const pts = curve(cx, by, cx + Math.sin(a) * L2 * 0.6, by - Math.cos(a) * L2 * 0.9, cx + Math.sin(a) * L2, by - Math.cos(a) * L2 * 0.6 + 2, 10);
    pts.forEach(([px, py], k) => { rect(x, px, py, 1, 1, P.fern[k % 3 === 0 ? 2 : 1]); if (k % 2 === 0 && k > 2) rect(x, px + (a > 0 ? 1 : -1), py + 1, 1, 1, P.fern[0]); });
  }
}

// 01/02 — chão: musgo + terra, ou musgo + pedras
function groundTile(b, stones) {
  return tcache(`g-${b}-${stones}`, TILE, TILE, (x, w, h) => {
    const P = tpal(b), r = seeded(stones ? 77 : 33);
    rect(x, 0, 0, w, h, P.soil[1]);
    for (let i = 0; i < 26; i++) rect(x, r() * w, 4 + r() * (h - 4), 1 + (r() * 2 | 0), 1, r() < 0.5 ? P.soil[0] : P.soil[2]);
    if (stones) for (let i = 0; i < 4; i++) { const sx = 3 + (i % 2) * 11 + r() * 3, sy = 9 + (i >> 1) * 8 + r() * 2; ell(x, sx + 1, sy + 1, 4, 3, P.out); ell(x, sx, sy, 4, 3, P.stone[1]); rect(x, sx - 2, sy - 2, 3, 1, P.stone[0] === P.stone[1] ? P.stone[2] : P.stone[0]); rect(x, sx - 1, sy + 2, 4, 1, P.stone[2]); }
    for (let yy = 16; yy < h; yy++) for (let i = 0; i < w; i++) if (hash(i * 31 + yy * 7 + (stones ? 5 : 0)) < (yy - 15) / 12) rect(x, i, yy, 1, 1, P.deep);
    mossTop(x, w, 0, P, r);
  });
}
// 08 — plataforma de terra flutuante / 10 — ilha com samambaia / 06 — galho
function floatPlat(b, w, kind) {
  return tcache(`fp-${b}-${w}-${kind}`, w + 8, 34, (x, W2) => {
    const P = tpal(b), r = seeded(w * 13 + kind.length);
    if (kind === 'branch') {
      const pts = curve(4, 6, 4 + w * 0.5, 3, w + 4, 5, 30);
      strokePath(x, pts, 3, P.bark[1], P.out);
      for (const [px, py] of pts) if (r() < 0.3) rect(x, px, py - 1, 1, 1, P.bark[0] === P.bark[1] ? P.bark[2] : P.bark[0]);
      strokePath(x, curve(w * 0.6, 6, w * 0.7, 14, w * 0.5, 22, 10), 2, P.bark[2], P.out);
      for (let i = 0; i < 4; i++) rect(x, w + 2 + (i % 2) * 2, 1 - i, 2, 2, P.fern[i % 2 ? 2 : 1]);
      return;
    }
    const depth = kind === 'island' ? 10 : 13;
    for (let yy = 0; yy < depth; yy++) { const shrink = Math.round(yy * yy / depth * 0.9) + (r() * 2 | 0); const x0 = 4 + shrink * (0.6 + r() * 0.4), x1 = 4 + w - shrink; if (x1 > x0) { rect(x, x0 - 1, 4 + yy, x1 - x0 + 2, 1, P.out); rect(x, x0, 4 + yy, x1 - x0, 1, yy < 4 ? P.soil[2] : P.soil[1]); } }
    for (let i = 0; i < 5; i++) { const sx = 6 + r() * (w - 4); strokePath(x, curve(sx, 10, sx + (r() - 0.5) * 6, 18, sx + (r() - 0.5) * 8, 18 + r() * 12, 8), 1, P.root[0], P.out); }
    mossTop(x, w + 8, 3, P, r);
    x.clearRect(0, 0, 4, 34); x.clearRect(w + 4, 0, 4, 34);
    for (let i = 4; i < w + 4; i += 2) if (r() < 0.25) rect(x, i, 9 + r() * 4, 1, 2 + r() * 4, P.moss[0]);
    if (kind === 'island') fern(x, 4 + w * 0.35, 4, P, r, 0.8);
  });
}
// 09 — tronco caído (rampa): topo caminhável segue a linha (x0,y0)→(x1,y1)
function logRamp(b, dx, dy) {
  const w = Math.abs(dx), h = Math.abs(dy);
  return tcache(`log-${b}-${dx}-${dy}`, w + 20, h + 20, (x) => {
    const P = tpal(b), r = seeded(w + h);
    const yAt = i => dy < 0 ? 4 + h - i * h / w : 4 + i * h / w;
    for (let i = 0; i <= w; i++) { const y0 = yAt(i); rect(x, i + 2, y0 - 1, 1, 11, P.out); rect(x, i + 2, y0, 1, 9, P.bark[1]); rect(x, i + 2, y0 + 6, 1, 3, P.bark[2]); if (r() < 0.2) rect(x, i + 2, y0 + 2 + r() * 4, 1, 1, P.bark[0] === P.bark[1] ? P.bark[2] : P.bark[0]); if (r() < 0.55) rect(x, i + 2, y0, 1, 2, P.moss[r() < 0.5 ? 1 : 2]); }
    const hi = dy < 0 ? w : 0, hy = yAt(hi);
    ell(x, hi + 2, hy + 4, 3, 5, P.out); ell(x, hi + 2, hy + 4, 2, 3, P.bark[2]);
    for (let i = 0; i < 6; i++) { const px = 2 + r() * w; rect(x, px, yAt(px) + 9, 1, 2 + r() * 5, P.moss[0]); }
    const lo = dy < 0 ? 0 : w; fern(x, lo + 4, yAt(lo) + 10, P, r, 1);
  });
}
// 12 — espinhos (só a parte de cima; o chão é o tile normal)
function thornPiece(b, w) {
  return tcache(`th-${b}-${w}`, w, 16, (x) => {
    const P = tpal(b), r = seeded(w);
    if (b === 'caatinga') {
      // xique-xique: touceiras de cacto com gomos, topo arredondado, braços e espinhos claros
      const cactus = (cx, hh, arm) => {
        rect(x, cx - 3, 16 - hh, 6, hh, P.out); rect(x, cx - 2, 16 - hh + 1, 4, hh - 1, '#5a7a52'); rect(x, cx - 2, 16 - hh + 1, 1, hh - 1, '#3e563a'); rect(x, cx, 16 - hh + 1, 1, hh - 1, '#7a9a6a'); rect(x, cx - 2, 16 - hh, 4, 1, '#7a9a6a');
        for (let k = 1; k < hh - 1; k += 2) { rect(x, cx - 4, 16 - hh + k, 1, 1, '#e8e0c8'); rect(x, cx + 3, 16 - hh + k + 1, 1, 1, '#e8e0c8'); }
        if (arm) { const ay = 16 - hh * 0.55 | 0, s2 = arm; rect(x, cx + s2 * 3 - (s2 < 0 ? 3 : 0), ay - 1, 4, 4, P.out); rect(x, cx + s2 * 3 - (s2 < 0 ? 2 : 0), ay, 3, 2, '#5a7a52'); rect(x, cx + s2 * 5 - 1, ay - 5, 4, 6, P.out); rect(x, cx + s2 * 5, ay - 4, 2, 5, '#6a8a5e'); rect(x, cx + s2 * 6 + (s2 < 0 ? 1 : -1), ay - 6, 1, 1, '#e8e0c8'); }
        if (r() < 0.3) { rect(x, cx - 1, 16 - hh - 2, 2, 2, '#e070a0'); rect(x, cx - 1, 16 - hh - 2, 1, 1, '#ffb0d0'); }
      };
      for (let i = 5; i < w - 5; i += 10 + (r() * 6 | 0)) { cactus(i, 9 + r() * 6 | 0, r() < 0.5 ? (r() < 0.5 ? 1 : -1) : 0); if (r() < 0.5) cactus(i + 5, 6 + r() * 3 | 0, 0); }
      for (let i = 0; i < w; i += 3) rect(x, i, 15, 2, 1, '#3a2a1e');
      return;
    }
    for (let i = 0; i < w / 6; i++) {
      const pts = curve(r() * w, 15, r() * w, r() * 6, r() * w, 4 + r() * 10, 16);
      strokePath(x, pts, 1, P.thorn[1], P.thorn[2]);
      pts.forEach(([px, py], k) => { if (k % 4 === 2) { rect(x, px, py - 2, 1, 2, P.thorn[1]); rect(x, px + 1, py - 3, 1, 1, P.thorn[0]); } });
    }
  });
}

// ---------- desenho no mundo ----------
function drawGroundSolid(s, b, cx) {
  const P = tpal(b), x0 = Math.max(s.x, cx - 2), x1 = Math.min(s.x + s.w, cx + W + 2);
  const bot = Math.min(H + 10, s.y + s.h);
  if (bot - s.y > TILE) rect(ctx, x0, s.y + TILE, x1 - x0, bot - s.y - TILE, P.deep);
  let prevStone = false;
  for (let tx = Math.floor(x0 / TILE) * TILE; tx < x1; tx += TILE) {
    const stone = !prevStone && hash((tx / TILE | 0) * 17 + 3) < 0.22; prevStone = stone;
    const a = Math.max(tx, s.x), e = Math.min(tx + TILE, s.x + s.w);
    if (e > a) ctx.drawImage(groundTile(b, stone), a - tx, 0, e - a, TILE, a, s.y, e - a, TILE);
  }
  // beiradas de abismo: contorno e musgo caindo
  for (const ex of [s.x, s.x + s.w]) if (ex > cx - 4 && ex < cx + W + 4 && !solidAt(ex + (ex === s.x ? -2 : 2), s.y + 4)) {
    // em platôs a borda só desce até encontrar o chão de baixo
    const dir = ex === s.x ? -2 : 2; let eh = 0; while (eh < bot - s.y && !solidAt(ex + dir, s.y + eh + 2)) eh++;
    rect(ctx, ex - (ex === s.x ? 0 : 1), s.y, 1, eh + 2, P.out);
    rect(ctx, ex - (ex === s.x ? 1 : 0), s.y + 1, 1, 6, P.moss[0]);
  }
}
function drawPlatSolid(s, b) {
  if (s.kind === 'flog') { ctx.drawImage(tcache('flog-' + Math.round(s.w), Math.round(s.w) + 4, 8, (x) => { const w = Math.round(s.w); rect(x, 1, 1, w + 2, 6, '#120a06'); rect(x, 2, 2, w, 4, '#6a4428'); rect(x, 2, 2, w, 1, '#8a5c36'); rect(x, 2, 5, w, 1, '#4a2e1a'); for (let i = 4; i < w; i += 5) rect(x, i, 3, 2, 1, '#4a2e1a'); ell(x, 3, 4, 2, 2, '#a8845a'); rect(x, 6, 2, 3, 1, '#4a7a3a'); rect(x, w - 6, 2, 4, 1, '#4a7a3a'); }), Math.round(s.x) - 2, Math.round(s.y) - 1); return; }
  const kind = s.kind || (s.w <= 28 ? 'island' : 'earth');
  ctx.drawImage(floatPlat(b, Math.round(s.w), kind), Math.round(s.x) - 4, Math.round(s.y) - (kind === 'branch' ? 4 : 3));
}
function drawRampPiece(rp, b) {
  const dx = rp.x1 - rp.x0, dy = rp.y1 - rp.y0, img = logRamp(b, dx, dy);
  ctx.drawImage(img, Math.round(rp.x0) - 2, Math.round(Math.min(rp.y0, rp.y1)) - 4);
}
function drawThornPiece(th, b) { ctx.drawImage(thornPiece(b, th.x1 - th.x0), th.x0, th.y - 14); }

// ---------- elementos interativos (Prompt_Elementos_Interativos_Amazônia.pdf) ----------
// 01 baú de madeira (fechado; aberto = brilho dourado e depois 40% mais escuro)
function chestPiece(open) {
  return tcache(`chest-${open}`, 18, 14, (x) => {
    rect(x, 1, 3, 16, 11, '#120a06'); rect(x, 2, 4, 14, 9, '#6a4428'); rect(x, 2, 4, 14, 3, '#8a5a34');
    for (let i = 0; i < 3; i++) rect(x, 2, 6 + i * 3, 14, 1, '#4a2e1a');
    rect(x, 1, 3, 2, 11, '#7a7468'); rect(x, 15, 3, 2, 11, '#7a7468'); rect(x, 2, 7, 14, 1, '#7a7468');
    rect(x, 7, 6, 4, 4, '#9a9488'); rect(x, 8, 7, 2, 2, '#2a2018');
    rect(x, 3, 2, 12, 2, '#8a5a34'); rect(x, 2, 1, 14, 1, '#120a06');
    if (open) { rect(x, 3, 1, 12, 3, '#2a1a0c'); rect(x, 5, 2, 8, 1, '#f2c14e'); }
  });
}
function drawChest(c, t) {
  const opened = G.save.opened && G.save.opened[c.id];
  const img = chestPiece(!!opened), x = c.x - 9, y = c.y - 14;
  if (opened) {
    const dt2 = G.t - (c.openT || -9);
    ctx.drawImage(img, x, y);
    if (dt2 < 0.5) { ctx.globalAlpha = 0.6 * (1 - dt2 / 0.5); ell(ctx, c.x, c.y - 8, 14, 10, '#f2c14e'); ctx.globalAlpha = 1; for (let i = 0; i < 2; i++) part(c.x + rnd(-5, 5), c.y - 10, rnd(-10, 10), rnd(-50, -20), 0.6, '#f6e3a6'); }
    else { ctx.globalAlpha = 0.4; ctx.drawImage(tcache('chest-dark', 18, 14, (q) => { q.drawImage(img, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = '#000'; q.fillRect(0, 0, 18, 14); }), x, y); ctx.globalAlpha = 1; }
  } else { ctx.globalAlpha = 0.18 + Math.sin(t * 3) * 0.08; ell(ctx, c.x, c.y - 7, 12, 8, '#f2c14e'); ctx.globalAlpha = 1; ctx.drawImage(img, x, y); }
}
// 02 tronco cortado (obstáculo sólido)
function logPiece(b) {
  return tcache(`log2-${b}`, 34, 22, (x) => {
    const P = tpal(b);
    rect(x, 3, 3, 30, 18, P.out); rect(x, 4, 4, 28, 16, P.bark[1]); rect(x, 4, 14, 28, 6, P.bark[2]);
    for (let i = 4; i < 32; i += 2) if (hash(i) < 0.6) rect(x, i, 4 + (hash(i + 5) * 6 | 0), 1, 2, P.moss[1]);
    for (let i = 4; i < 32; i++) if (hash(i + 9) < 0.5) rect(x, i, 4, 1, 2, P.moss[2]);
    ell(x, 5, 12, 5, 8, P.out); ell(x, 5, 12, 4, 7, '#a8845a'); ell(x, 5, 12, 2, 4, '#8a6a44'); rect(x, 5, 11, 1, 2, '#6a4a2a');
    rect(x, 22, 0, 2, 5, P.bark[1]); rect(x, 23, 0, 3, 1, P.fern[2]);
  });
}
// 07 planta sombria de espinhos (perigo)
function drawDarkThorn(o, t) {
  const x = Math.round(o.x), y = o.y || GY;
  // hastes em leque que sobem retas, com as pontas vermelhas apontando para cima
  for (let i = 0; i < 9; i++) {
    const a = (i - 4) * 0.17, L2 = 13 + (i % 3) * 5 - Math.abs(i - 4), sw = Math.sin(t * 1.5 + i) * 0.03;
    const bx = x + (i - 4) * 1.2, pts = curve(bx, y, bx + Math.sin(a + sw) * L2 * 0.35, y - L2 * 0.55, bx + Math.sin(a + sw) * L2 * 0.6, y - L2, 12);
    strokePath(ctx, pts, 2, i % 2 ? '#1c1626' : '#2a2034', '#08060c');
    const tip = pts[pts.length - 1]; rect(ctx, tip[0], tip[1] - 3, 1, 3, '#8a1a2a'); rect(ctx, tip[0], tip[1] - 4, 1, 1, '#e04a5a');
    if (i % 2) { const m = pts[6]; rect(ctx, m[0] + (i < 4 ? -2 : 1), m[1] - 1, 2, 1, '#6a1a2a'); }
  }
}
// 05 cipós pendentes (primeiro plano, só as pontas balançam)
// 03/07 — terreno elevado: bloco de terra com topo de musgo, pedras, raízes saindo das laterais
function raisedPiece(b, w, h) {
  return tcache(`rz-${b}-${w}-${h}`, w + 6, h + 6, (x) => {
    const P = tpal(b), r = seeded(w * 31 + h * 7);
    rect(x, 3, 4, w, h, P.soil[1]);
    for (let i = 0; i < w * h / 9; i++) rect(x, 3 + r() * w, 7 + r() * (h - 3), 1 + (r() * 2 | 0), 1, r() < 0.5 ? P.soil[0] : P.soil[2]);
    for (let i = 0; i < Math.max(1, w * h / 220); i++) { const sx = 7 + r() * (w - 8), sy = 12 + r() * Math.max(1, h - 16); ell(x, sx + 1, sy + 1, 3, 2, P.out); ell(x, sx, sy, 3, 2, P.stone[1]); rect(x, sx - 2, sy - 1, 2, 1, P.stone[0]); rect(x, sx, sy + 1, 2, 1, P.stone[2]); }
    for (let yy = Math.max(8, h - 8); yy < h + 4; yy++) dither(x, 3, yy, w, 1, P.deep, (yy - h + 8) / 12);
    rect(x, 2, 4, 1, h, P.out); rect(x, w + 3, 4, 1, h, P.out); rect(x, 3, 7, 1, h - 4, P.soil[2]);
    for (let i = 0; i < 2 + w / 28; i++) { const left = r() < 0.5, y0 = 10 + r() * Math.max(2, h - 16); strokePath(x, curve(left ? 3 : w + 2, y0, left ? 0 : w + 5, y0 + 4, left ? 1 : w + 4, y0 + 8, 8), 1, P.bark[1], P.out); }
    mossTop(x, w + 6, 4, P, r);
    for (let i = 4; i < w + 2; i += 2 + (r() * 3 | 0)) rect(x, i, 2 + (r() * 2 | 0), 1, 2, P.moss[2]);
    for (const sx of [2, w + 3]) for (let k = 0; k < 3 + r() * 6; k++) rect(x, sx, 7 + k, 1, 1, P.moss[0]);
  });
}
function drawBlockSolid(s, b) {
  if (s.vis === 'none') return;
  if (s.vis === 'log') { ctx.drawImage(logPiece(b), Math.round(s.x) - 3, Math.round(s.y) - 3); return; }
  ctx.drawImage(raisedPiece(b, Math.round(s.w), Math.round(s.h)), Math.round(s.x) - 3, Math.round(s.y) - 4);
}
// 11 — toco com raízes: madeira com veios, borda quebrada, oco, raízes largas e samambaia
function stumpPiece(b) {
  return tcache(`stump3-${b}`, 56, 44, (x) => {
    const P = tpal(b), r = seeded(11), X0 = 16, X1 = 40, TOP = 11, BOT = 44; // tronco: x 16..40, topo em y 11
    // raízes largas saindo da base, com luz por cima
    const roots = [[X0 + 4, 30, 8, 36, 1, 43], [X0 + 6, 33, 12, 39, 8, 43], [X1 - 4, 30, 46, 36, 55, 43], [X1 - 6, 33, 44, 39, 48, 43]];
    for (const q of roots) strokePath(x, curve(...q, 16), 4, P.bark[1], P.out);
    for (const q of roots) curve(...q, 16).forEach(([px, py], i) => { if (i % 2) rect(x, px, py - 2, 1, 1, P.bark[0] === P.bark[2] ? P.bark[1] : P.root[2]); if (r() < 0.25) rect(x, px, py - 3, 1, 1, P.moss[1]); });
    // corpo do tronco: sombra de cilindro (luz à esquerda), placas de casca e rachaduras verticais
    rect(x, X0 - 1, TOP + 2, X1 - X0 + 2, BOT - TOP - 2, P.out);
    for (let xx = X0; xx < X1; xx++) { const k = (xx - X0) / (X1 - X0); rect(x, xx, TOP + 3, 1, BOT - TOP - 3, k < 0.2 ? P.bark[1] : k > 0.75 ? P.bark[2] : P.bark[0]); }
    for (let i = 0; i < 7; i++) { const cx = X0 + 2 + i * 3.3 + (r() * 2 | 0); for (let y = TOP + 5; y < BOT - 1; y++) if (r() < 0.8) rect(x, Math.round(cx + Math.sin(y * 0.3 + i) * 0.8), y, 1, 1, P.bark[2]); }
    for (let i = 0; i < 14; i++) rect(x, X0 + 2 + r() * (X1 - X0 - 4), TOP + 6 + r() * (BOT - TOP - 10), 2, 1, P.bark[1]);
    rect(x, X0, TOP + 3, 2, BOT - TOP - 3, P.bark[1]); rect(x, X0, TOP + 3, 1, BOT - TOP - 3, P.root[2]);
    // nó com buraco escuro
    ell(x, X0 + 7, TOP + 19, 3, 2, P.out); ell(x, X0 + 7, TOP + 19, 2, 1, '#0c0806'); rect(x, X0 + 5, TOP + 17, 4, 1, P.bark[1]);
    // topo quebrado: borda serrilhada, face com anéis de crescimento e o oco no meio
    ell(x, (X0 + X1) / 2, TOP + 4, 13, 4, P.out); ell(x, (X0 + X1) / 2, TOP + 4, 12, 3, P.root[2]);
    ell(x, (X0 + X1) / 2, TOP + 4, 9, 2, P.bark[1]); ell(x, (X0 + X1) / 2, TOP + 4, 6, 1, P.root[2]);
    ell(x, (X0 + X1) / 2 + 1, TOP + 4, 3, 1, '#0c0806');
    for (let xx = X0; xx < X1; xx += 2) { const hgt = 1 + (hash(xx * 3) * 4 | 0); rect(x, xx, TOP + 2 - hgt, 2, hgt + 1, P.bark[xx % 4 ? 0 : 2]); rect(x, xx, TOP + 2 - hgt - 1, 2, 1, P.out); }
    // musgo no topo, escorrendo pela lateral
    for (let xx = X0; xx < X1; xx++) if (r() < 0.6) { const d2 = 1 + (r() * 3 | 0); rect(x, xx, TOP + 5, 1, d2, P.moss[r() < 0.5 ? 1 : 2]); if (r() < 0.15) rect(x, xx, TOP + 5 + d2, 1, 2 + (r() * 3 | 0), P.moss[0]); }
    // hera subindo pelo tronco
    for (let y = BOT - 2, cx = X1 - 6; y > TOP + 8; y -= 2) { cx += Math.sin(y * 0.4) * 1.2; rect(x, Math.round(cx), y, 1, 2, P.fern[1]); if (y % 6 === 0) { rect(x, Math.round(cx) - 2, y, 2, 1, P.fern[2]); rect(x, Math.round(cx) + 1, y - 1, 2, 1, P.fern[1]); } }
    // cogumelos na lateral sombreada
    for (const [mx, my] of [[X1 - 2, TOP + 24], [X1 - 1, TOP + 28]]) { rect(x, mx, my, 4, 2, P.out); rect(x, mx, my - 1, 3, 2, '#c8a46a'); rect(x, mx, my - 1, 1, 1, '#efe0c0'); }
    // samambaias e capim na base
    fern(x, 6, BOT - 1, P, r, 0.7); fern(x, 50, BOT - 1, P, r, 0.6);
    for (let xx = X0 - 2; xx < X1 + 2; xx++) if (r() < 0.5) rect(x, xx, BOT - 2 - (r() * 2 | 0), 1, 3, P.moss[r() < 0.5 ? 1 : 2]);
  });
}
function drawStumpPiece(st, b) { ctx.drawImage(stumpPiece(b), st.x - 28, st.y - 44); }
// 03 eco: toco queimado com um machado velho cravado no topo
function axeStump(x, y) {
  const img = tcache('axestump2', 40, 36, (c) => {
    const roots = [[12, 30, 6, 33, 1, 36], [26, 30, 32, 33, 38, 36]];
    for (const q of roots) strokePath(c, curve(...q, 8), 2, '#3a2c20', '#120a06');
    rect(c, 10, 10, 20, 26, '#120a06'); rect(c, 11, 11, 18, 25, '#4a3a2c');
    for (let i = 0; i < 6; i++) rect(c, 12 + i * 3, 13, 1, 22, i % 2 ? '#3a2c20' : '#5a4836');
    rect(c, 11, 11, 18, 3, '#2a1e16'); for (let i = 0; i < 18; i += 2) rect(c, 11 + i, 8 + (hash(i + 9) * 3 | 0), 2, 4, '#241a12');
    rect(c, 14, 20, 3, 7, '#8a3a1a'); rect(c, 15, 21, 1, 5, '#e0703a');
    for (let i = 11; i < 29; i++) if (hash(i * 5) < 0.5) rect(c, i, 33 + (hash(i) * 2 | 0), 1, 3, '#3a5a2e');
    strokePath(c, curve(20, 10, 13, 5, 3, 1, 12), 2, '#8a5a30', '#120a06');
    rect(c, 17, 6, 9, 7, '#120a06'); rect(c, 18, 7, 7, 5, '#8e8e8a'); rect(c, 24, 7, 1, 5, '#e2e2da'); rect(c, 18, 7, 7, 1, '#b4b4ae'); rect(c, 19, 10, 3, 1, '#6a4a3a');
  });
  ctx.drawImage(img, x - 20, y - 36);
}
// folhagem: miolo escuro, borda recortada em folhinhas, luz por cima
function leafCluster(x, cx, cy, rx, ry, P, r) {
  ell(x, cx, cy + 1, rx + 1, ry + 1, P.out);
  ell(x, cx, cy, rx, ry, P.leaf[0]);
  ell(x, cx - rx * 0.15, cy - ry * 0.3, Math.max(1, rx * 0.8 | 0), Math.max(1, ry * 0.6 | 0), P.leaf[1]);
  for (let i = 0; i < rx * 2.4; i++) { const a = r() * HPI * 2, d = 0.85 + r() * 0.25; rect(x, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 2, 2, P.leaf[r() < 0.6 ? 0 : 1]); }
  for (let i = 0; i < rx * 1.2; i++) rect(x, cx - rx * 0.6 + r() * rx, cy - ry * 0.75 + r() * ry * 0.6, 1 + (r() < 0.4 ? 1 : 0), 1, r() < 0.7 ? P.leaf[2] : P.moss[2]);
}
// cipó: torcido, duas cores, folhinhas alternadas e ponta enrolada; só a ponta balança
function vineStrand(cx0, y0, len, P, t, ph, sway) {
  const sw = i => sway ? Math.round(Math.sin(t * HPI / 2 + ph) * 3 * (i / len) ** 2) : 0;
  for (let i = 0; i < len; i++) {
    const x = cx0 + sw(i) + Math.round(Math.sin(i * 0.17 + ph) * 1.5), y = y0 + i;
    rect(ctx, x - 1, y, 4, 1, P.out); rect(ctx, x, y, 2, 1, (i >> 1) % 3 ? P.vine[1] : P.vine[0]);
    if (i % 4 === 0) rect(ctx, x + 1, y, 1, 1, P.moss[1]);
    if (i % 7 === 4) { const s = (i / 7 | 0) % 2 ? 1 : -1, lx = s > 0 ? x + 2 : x - 3; rect(ctx, lx - (s > 0 ? 0 : 1), y - 2, 4, 3, P.out); rect(ctx, lx, y - 1, 2, 2, P.fern[1]); rect(ctx, lx + (s > 0 ? 1 : 0), y - 2, 1, 1, P.fern[2]); }
  }
  const ex = cx0 + sw(len) + Math.round(Math.sin(len * 0.17 + ph) * 1.5), ey = y0 + len;
  rect(ctx, ex - 1, ey, 3, 1, P.vine[0]); rect(ctx, ex + 1, ey - 2, 1, 2, P.vine[0]);
}
function drawVinePiece(v, b, t) {
  // cipó grosso e torcido com um fio fino enrolado e folhas, igual aos cipós da copa (sem balanço)
  const P = tpal(b), len = v.y1 - v.y0;
  vineStrand(v.x, v.y0, len, P, t, v.x * 0.1, false);
  for (let i = 0; i < len; i++) { const x = v.x + Math.round(Math.sin(i * 0.17 + v.x * 0.1) * 1.5) + Math.round(Math.sin(i * 0.5) * 3); rect(ctx, x, v.y0 + i, 1, 1, P.vine[0]); }
}
// 05 — copa com cipós: folhagem em cachos, parada; os cipós balançam só nas pontas
// tom misturado (sombra das folhas de dentro da copa)
function mixHex(a, b, k) { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
// folha em ponta (bico) saindo da borda da copa
function leafTip(x, px, py, dx, dy, col, out) { rect(x, px - 1, py - 1, 3, 3, out); rect(x, px, py, 2, 2, col); rect(x, px + dx, py + dy, 1, 1, col); }
// copa cheia em camadas: massa escura no fundo, tufos do meio, tufos iluminados em cima, folhas em ponta nas bordas,
// folhas pendendo embaixo e pontos de sol; tudo na paleta do bioma
function drawCanopy(cn, b, t) {
  const P = tpal(b), cw = cn.w, img = tcache(`can3-${b}-${cw}`, cw + 36, 56, (x) => {
    const r = seeded(cw * 3 + 1), deep = mixHex(P.leaf[0], P.out, 0.45), L = 18;
    // fundo: massa contínua e escura (dá volume e fecha os buracos)
    for (let i = 0; i < cw / 5 + 5; i++) { const cx = L + r() * cw, cy = 16 + r() * 14, rx = 10 + r() * 6 | 0, ry = 7 + r() * 4 | 0; ell(x, cx, cy + 1, rx + 1, ry + 1, P.out); ell(x, cx, cy, rx, ry, deep); }
    // meio: tufos cheios com luz de cima
    for (let i = 0; i < cw / 4 + 5; i++) leafCluster(x, L + r() * cw, 10 + r() * 16, 8 + r() * 6 | 0, 6 + r() * 3 | 0, P, r);
    // topo: tufos menores e mais claros, onde o sol bate
    for (let i = 0; i < cw / 7 + 3; i++) leafCluster(x, L + 2 + r() * (cw - 4), 6 + r() * 8, 5 + r() * 4 | 0, 4 + r() * 2 | 0, P, r);
    // folhas em ponta pelas bordas (topo e lados)
    for (let i = 0; i < cw / 2 + 6; i++) {
      const a = -HPI + r() * HPI, ex = L + cw / 2 + Math.cos(a) * (cw / 2 + 1), ey = 17 + Math.sin(a) * 11;
      leafTip(x, Math.round(ex), Math.round(ey), Math.sign(Math.cos(a)) || 1, -1, r() < 0.5 ? P.leaf[1] : P.leaf[0], P.out);
    }
    // folhas pendendo embaixo da copa e sombra na base
    for (let i = 0; i < cw / 3; i++) { const lx = L + 2 + r() * (cw - 4), ly = 26 + r() * 6, ln = 2 + (r() * 3 | 0); rect(x, lx, ly, 2, ln + 1, P.out); rect(x, lx, ly, 1, ln, i % 3 ? deep : P.leaf[0]); }
    // veios e pontos de sol nas folhas
    for (let i = 0; i < cw * 0.8; i++) { const sx = L + r() * cw, sy = 4 + r() * 18; rect(x, sx, sy, 1, 1, r() < 0.65 ? P.leaf[2] : P.moss[2]); }
    for (let i = 0; i < cw / 3; i++) { const sx = L + r() * cw, sy = 12 + r() * 14; rect(x, sx, sy, 2, 1, deep); }
  });
  const cy = cn.y || 0;
  ctx.drawImage(img, cn.x - 18, -10 + cy);
  const r = seeded(cw * 5 + cn.x);
  for (let k = 0; k < (cn.vines || 4); k++) vineStrand(cn.x + 6 + r() * (cw - 12), 26 + cy + r() * 6, 22 + r() * 50, P, t, r() * 6, true);
}
// tronco de árvore ao fundo, sustentando uma copa (ou um tufo de cipós): da copa até o chão
function drawTreeTrunk(x, w, top, b, seed) {
  x = Math.round(x);
  const gy = Math.min(groundY(x), 240), h = Math.max(10, gy - top), key = `trunk-${b}-${w}-${h}-${seed % 5}`;
  const img = tcache(key, w + 30, h + 8, (c) => {
    const P = tpal(b), r = seeded(seed * 3 + w), L = 15, R = 15 + w;
    // galhos subindo para os lados da copa
    for (const dir of [-1, 1]) { const by = 6 + r() * 8; strokePath(c, curve(L + w / 2, by + 4, L + w / 2 + dir * (w * 0.7), by, L + w / 2 + dir * (w + 4 + r() * 3), 1, 10), w > 9 ? 3 : w > 7 ? 2 : 1, P.bark[1], P.out); }
    // corpo: luz à esquerda, sombra à direita, sulcos verticais e nós
    rect(c, L - 1, 0, w + 2, h, P.out);
    for (let xx = 0; xx < w; xx++) rect(c, L + xx, 0, 1, h, xx < 2 ? P.bark[1] : xx > w - 3 ? P.bark[2] : P.bark[0]);
    for (let i = 0; i < w / 3; i++) { const sx = L + 2 + i * 3 + (r() * 2 | 0); for (let y = 2; y < h - 2; y++) if (r() < 0.7) rect(c, Math.round(sx + Math.sin(y * 0.2 + i) * 0.7), y, 1, 1, P.bark[2]); }
    for (let i = 0; i < h / 30 + 1; i++) { const ky = 8 + r() * (h - 16), kx = L + 2 + r() * (w - 4); rect(c, kx - 1, ky, 3, 2, P.out); rect(c, kx - 1, ky - 1, 2, 1, P.bark[1]); }
    for (let i = 0; i < h / 12; i++) if (r() < 0.6) rect(c, L + (r() < 0.5 ? 0 : w - 2), 4 + r() * (h - 8), 2, 2 + (r() * 3 | 0), P.moss[1]);
  });
  // ao fundo: um pouco mais escuro que o primeiro plano
  ctx.globalAlpha = 0.92; ctx.drawImage(img, x - 15 - Math.floor(w / 2), top); ctx.globalAlpha = 1;
}
// 05 cipós pendentes (primeiro plano): um tufo de folhas no alto e cipós com musgo
function drawHangingVines(o, b, t) {
  const P = tpal(b), r = seeded(o.x * 7);
  for (let k = 0; k < 5; k++) vineStrand(o.x + k * 9 - 18 + r() * 4, 4, 30 + r() * 55, P, t, r() * 6, true);
  ctx.drawImage(tcache(`hvtop2-${b}`, 70, 26, (x) => {
    const r2 = seeded(5), deep = mixHex(P.leaf[0], P.out, 0.45);
    for (let i = 0; i < 8; i++) { const cx = 6 + i * 8 + r2() * 4, cy = 8 + r2() * 5; ell(x, cx, cy + 1, 8, 6, P.out); ell(x, cx, cy, 7, 5, deep); }
    for (let i = 0; i < 9; i++) leafCluster(x, 6 + i * 7 + r2() * 4, 5 + r2() * 6, 6 + (r2() * 2 | 0), 4, P, r2);
    for (let i = 0; i < 14; i++) leafTip(x, 4 + r2() * 62, 18 + r2() * 4, r2() < 0.5 ? -1 : 1, 1, i % 2 ? P.leaf[1] : P.leaf[0], P.out);
    for (let i = 0; i < 30; i++) rect(x, 4 + r2() * 62, 2 + r2() * 10, 1, 1, r2() < 0.65 ? P.leaf[2] : P.moss[2]);
  }), o.x - 35, -8);
}
