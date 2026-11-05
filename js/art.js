'use strict';
// Arte procedural em pixel: fundos de bioma (parallax) e sprites desenhados por código.

function mk(w, h) { const c = document.createElement('canvas'); return [c, renderContext(c, w, h)]; }
const GLOW_CACHE = new Map();
function softGlow(c, x, y, rx, ry, col, strength = 1) {
  if (rx <= 0 || ry <= 0 || strength <= 0) return;
  let img = GLOW_CACHE.get(col);
  if (!img) {
    const [stamp, g] = mk(96, 96);
    // A luz perde força desde o centro; duas manchas sobrepostas evitam um disco marcado.
    g.save();
    try {
    for (const [cx, cy, r, power] of [[44, 45, 44, 1], [59, 51, 35, 0.25]]) {
      const falloff = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      falloff.addColorStop(0, col + 'c0'); falloff.addColorStop(0.22, col + '50');
      falloff.addColorStop(0.48, col + '1c'); falloff.addColorStop(0.72, col + '06'); falloff.addColorStop(1, col + '00');
      g.globalAlpha = power; g.fillStyle = falloff; g.fillRect(0, 0, 96, 96);
    }
    } finally { g.restore(); }
    if (GLOW_CACHE.size >= 32) GLOW_CACHE.clear();
    GLOW_CACHE.set(col, img = stamp);
  }
  c.save();
  try { c.globalAlpha *= strength; c.drawImage(img, x - rx, y - ry, rx * 2, ry * 2); }
  finally { c.restore(); }
}
function rect(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2, Math.round(w * 2) / 2, Math.round(h * 2) / 2); }
function ell(c, cx, cy, rx, ry, col) {
  if (rx <= 0 || ry <= 0) return;
  c.fillStyle = col;
  for (let y = Math.ceil((cy - ry) * 2) / 2; y < cy + ry; y += 0.5) {
    const dy = (y + 0.25 - cy) / ry; if (Math.abs(dy) > 1) continue;
    const hw = rx * Math.sqrt(1 - dy * dy), x0 = Math.round((cx - hw) * 2) / 2, x1 = Math.round((cx + hw) * 2) / 2;
    c.fillRect(x0, y, Math.max(0.5, x1 - x0), 0.5);
  }
}
function line(c, x0, y0, x1, y1, col, th = 1) {
  c.fillStyle = col; x0 = Math.round(x0 * 2); y0 = Math.round(y0 * 2); x1 = Math.round(x1 * 2); y1 = Math.round(y1 * 2);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (let i = 0; i < 4000; i++) {
    c.fillRect(x0 / 2, y0 / 2, Math.max(0.5, Math.round(th * 2) / 2), Math.max(0.5, Math.round(th * 2) / 2));
    if (x0 === x1 && y0 === y1) break;
    const e2 = e * 2; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
const BAYER = [0, 2, 3, 1];
function dither(c, x, y, w, h, col, d) { c.fillStyle = col; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const px = x + i, py = y + j; if (BAYER[(px & 1) + ((py & 1) << 1)] / 4 < d) c.fillRect(px, py, 1, 1); } }
function bands(c, cols, y0, y1, w) {
  const n = cols.length, bh = (y1 - y0) / n;
  for (let i = 0; i < n; i++) rect(c, 0, y0 + i * bh, w, bh + 1, cols[i]);
  if (y1 < H) rect(c, 0, y1, w, H - y1, cols[n - 1]);
  for (let i = 0; i < n - 1; i++) { const by = Math.round(y0 + (i + 1) * bh); dither(c, 0, by - 3, w, 1, cols[i + 1], 0.25); dither(c, 0, by - 2, w, 1, cols[i + 1], 0.5); dither(c, 0, by - 1, w, 1, cols[i + 1], 0.75); }
}
function streak(c, x, y, len, col, hi) { rect(c, x + len * 0.15, y - 1, len * 0.6, 1, hi || col); rect(c, x, y, len, 2, col); rect(c, x + len * 0.25, y + 2, len * 0.55, 1, col); }
function branch(c, x, y, ang, len, d, col, r, leaf) {
  const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len;
  line(c, x, y, x1, y1, col, d > 2 ? 2 : 1);
  if (d <= 0) { if (leaf) leaf(x1, y1); return; }
  const n = 2 + (r() < 0.3 ? 1 : 0);
  for (let i = 0; i < n; i++) branch(c, x1, y1, ang + (r() - 0.5) * 1.3, len * (0.6 + r() * 0.2), d - 1, col, r, leaf);
}
// Árvore de copa achatada (samaúma / castanheira)
function canopyTree(c, x, base, h, rw, col, r, vines) {
  rect(c, x - 2, base - h, 4, h, col);
  ell(c, x, base - h, rw, Math.max(3, rw * 0.22 | 0), col);
  if (vines) for (let i = 0; i < 5; i++) { const vx = x - rw + r() * rw * 2; rect(c, vx, base - h + 2, 1, 6 + r() * 18, col); }
}
function palm(c, x, base, h, col, r, droop) {
  let tx = x, ty = base;
  for (let i = 0; i < h; i++) { rect(c, Math.round(tx), ty - i, 2, 1, col); tx += (r() - 0.5) * 0.5; }
  const top = base - h;
  for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8; const L2 = 9 + r() * 6; line(c, tx, top, tx + Math.cos(a) * L2, top + Math.sin(a) * L2 * 0.55 + (droop ? L2 * 0.5 : 2), col); }
}
function mesa(c, x, w, top, base, col, hi) { for (let y = top; y < base; y++) { const k = (y - top) / (base - top); const ww = w + k * 40; rect(c, x - ww / 2, y, ww, 1, col); } if (hi) rect(c, x - w / 2, top, w, 2, hi); }

// ---------- Biomas ----------
// Cada bioma: céu (estático) + camadas que repetem a cada 640px + paleta do chão.
const BG_CACHE = {};
function biome(id) { return BG_CACHE[id] || (BG_CACHE[id] = Object.assign(BIOME_BUILD[id](), { id })); }
const LW = 640;
const BIOME_BUILD = {
  prologo() {
    const r = seeded(11);
    const [sky, s] = mk(W, H); bands(s, ['#11131c', '#161a25', '#1d222f', '#252b3a', '#2f3646', '#3a4152'], 0, 150, W);
    ell(s, 252, 38, 11, 11, '#b9bccb'); ell(s, 249, 36, 3, 3, '#a2a6b8'); ell(s, 256, 42, 2, 2, '#a2a6b8');
    for (let i = 0; i < 40; i++) rect(s, r() * W, r() * 90, 1, 1, '#6a7088');
    const [cl, a] = mk(LW, H); for (let i = 0; i < 10; i++) streak(a, r() * LW, 20 + r() * 60, 40 + r() * 80, '#2b3142', '#3a4152');
    const [far, b] = mk(LW, H);
    for (let x = 0; x < LW; x++) { const h = 22 + Math.sin(x / 40) * 8 + Math.sin(x / 13) * 3; rect(b, x, 150 - h, 1, h + 30, '#232836'); }
    for (let i = 0; i < 14; i++) { const x = r() * LW; branch(b, x, 140, -Math.PI / 2, 14 + r() * 10, 3, '#1c202b', r); }
    const [mid, m] = mk(LW, H);
    for (let i = 0; i < 6; i++) { const x = 40 + i * 105 + r() * 30; rect(m, x, 30, 5, 130, '#12151d'); branch(m, x + 2, 70, -Math.PI / 2 - 0.4, 22, 3, '#12151d', r); branch(m, x + 2, 60, -Math.PI / 2 + 0.5, 20, 3, '#12151d', r); }
    return { sky, layers: [{ c: cl, f: 0.03 }, { c: far, f: 0.08 }, { c: mid, f: 0.2 }], mist: '#5a6278', ground: { top: '#3b4252', fill: '#191c25', dark: '#11131a', speck: '#2a2f3c', plat: '#2a2f3c' }, motes: '#8a90b0' };
  },
  // Fundos em camadas, inspirados na prancha "Fundos de bioma": quanto mais longe, menor, mais claro e mais lento.
  amazonia() {
    const r = seeded(21);
    const [sky, s] = mk(W, H); bands(s, ['#7e8466', '#969a72', '#b0ac7e', '#c8bc8a', '#d8ca96', '#d2c892', '#b8b886', '#9cab82'], 0, 150, W);
    const [cl, a] = mk(LW, H);
    for (let i = 0; i < 12; i++) { const x = r() * LW, y = 14 + r() * 60, w2 = 30 + r() * 70; ell(a, x, y, w2 / 2 | 0, 4 + r() * 4 | 0, '#a8a47a'); ell(a, x - 4, y - 2, w2 / 2.6 | 0, 3 + r() * 3 | 0, '#e6dcac'); }
    const [far, b] = mk(LW, H);
    for (let x = 0; x < LW; x += 9 + r() * 10 | 0) { const h = 18 + r() * 14; ell(b, x, 132 - h * 0.5, 7 + r() * 6 | 0, 4 + r() * 3 | 0, '#a8b48e'); rect(b, x - 1, 132 - h * 0.5, 2, h, '#a8b48e'); }
    rect(b, 0, 128, LW, 52, '#a8b48e');
    const [f2, c] = mk(LW, H);
    for (let i = 0; i < 16; i++) canopyTree(c, r() * LW, 140, 22 + r() * 22, 9 + r() * 8, '#82987c', r);
    for (let i = 0; i < 22; i++) ell(c, r() * LW, 134 + r() * 6, 8 + r() * 8 | 0, 5, '#82987c');
    rect(c, 0, 138, LW, 42, '#82987c');
    ctx2fog(c, 120, 30, '#c8c896', 0.25);
    const [mid, m] = mk(LW, H);
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 110 + r() * 40, h = 60 + r() * 30, rw = 18 + r() * 10;
      rect(m, x - 3, 150 - h, 6, h, '#5e7a68');
      for (let k = 0; k < 8; k++) rect(m, x - 3 - k, 150 - k * 2, 6 + k * 2, 2, '#5e7a68');
      ell(m, x, 150 - h, rw, 9, '#5e7a68'); ell(m, x - rw * 0.5, 150 - h + 4, rw * 0.6 | 0, 6, '#5e7a68'); ell(m, x + rw * 0.5, 150 - h + 3, rw * 0.6 | 0, 6, '#5e7a68');
      ell(m, x - 3, 150 - h - 3, rw * 0.7 | 0, 4, '#6e8a74');
      for (let v = 0; v < 4; v++) { const vx = x - rw + r() * rw * 2; for (let y = 0; y < 10 + r() * 22; y++) rect(m, vx + Math.sin(y * 0.3) * 1.2, 150 - h + 6 + y, 1, 1, '#5e7a68'); }
    }
    for (let i = 0; i < 18; i++) fernSil(m, r() * LW, 150, 5 + r() * 5, '#4e6a5a', r);
    ctx2fog(m, 128, 22, '#b8bc8e', 0.18);
    return { sky, layers: [{ c: cl, f: 0.02, drift: 1.2 }, { c: far, f: 0.05 }, { c: f2, f: 0.11 }, { c: mid, f: 0.2 }], mist: '#c8c896', ground: { top: '#2f5a3e', fill: '#14291f', dark: '#0d1c15', speck: '#1f3d2c', plat: '#3a2a1c' }, motes: '#e8f0a0' };
  },
  cerrado() {
    const r = seeded(31);
    const [sky, s] = mk(W, H); bands(s, ['#4a2438', '#6e2e3e', '#9a3e3e', '#c4583e', '#dc7442', '#ea924c', '#f2aa5a', '#f4bc6a'], 0, 150, W);
    ell(s, 200, 118, 16, 16, '#f8d27a'); ell(s, 200, 118, 12, 12, '#fff0b0');
    const [cl, a] = mk(LW, H);
    for (let i = 0; i < 10; i++) { const x = r() * LW, y = 12 + r() * 56, w2 = 30 + r() * 80; ell(a, x, y, w2 / 2 | 0, 3 + r() * 3 | 0, '#8a3a46'); ell(a, x + 3, y - 2, w2 / 2.4 | 0, 2 + r() * 2 | 0, '#f0a050'); }
    const [far, b] = mk(LW, H);
    for (let i = 0; i < 5; i++) mesa(b, 60 + i * 130 + r() * 30, 50 + r() * 50, 104 + r() * 10, 140, '#c47a5c', '#d68c66');
    rect(b, 0, 136, LW, 44, '#c47a5c');
    const [f2, c] = mk(LW, H);
    for (let i = 0; i < 4; i++) mesa(c, 90 + i * 160 + r() * 40, 30 + r() * 30, 116 + r() * 6, 146, '#9a4e44', '#b0604c');
    rect(c, 0, 142, LW, 38, '#9a4e44');
    for (let i = 0; i < 6; i++) { const x = r() * LW, h = 5 + r() * 4; for (let y = 0; y < h; y++) rect(c, x - (h - y) * 0.4, 142 - y, (h - y) * 0.8 + 1, 1, '#8a4038'); }
    const [mid, m] = mk(LW, H);
    for (let i = 0; i < 7; i++) acacia(m, 30 + i * 92 + r() * 30, 150, 22 + r() * 14, '#5a2a2e', '#7a3a34', r);
    for (let i = 0; i < 10; i++) { const x = r() * LW, h = 7 + r() * 5; for (let y = 0; y < h; y++) rect(m, x - (h - y) * 0.45, 150 - y, (h - y) * 0.9 + 1, 1, '#5a2a2e'); }
    for (let x = 0; x < LW; x += 2) if (r() < 0.5) rect(m, x, 150 - 2 - r() * 4, 1, 6, r() < 0.5 ? '#6a3430' : '#8a4a34');
    ctx2fog(m, 130, 20, '#f0a060', 0.14);
    return { sky, layers: [{ c: cl, f: 0.02, drift: 1 }, { c: far, f: 0.05 }, { c: f2, f: 0.1 }, { c: mid, f: 0.2 }], mist: '#f0a060', ground: { top: '#5a2c2a', fill: '#2a1420', dark: '#1c0c16', speck: '#3c1c26', plat: '#4a2a22' }, motes: '#ffb050', grass: '#d99a3a' };
  },
  pantanal() {
    const r = seeded(41);
    const [sky, s] = mk(W, H); bands(s, ['#3a2a5e', '#52367a', '#74488c', '#9a5e96', '#c47c98', '#e29a94', '#f2b88e', '#f8cc8a'], 0, 112, W);
    ell(s, 150, 112, 15, 14, '#ffe2a0'); ell(s, 150, 112, 11, 10, '#fff2c8');
    bands(s, ['#d8a0a0', '#b88098', '#946690', '#745080', '#583e70', '#463062'], 112, 160, W);
    for (let i = 0; i < 46; i++) { const y = 114 + r() * 40, k = (y - 112) / 48, x = 150 + (r() - 0.5) * 70 * (1 + k); rect(s, x, y, 2 + r() * 8 * (1 - k), 1, r() < 0.5 ? '#ffe2a0' : '#f6c88e'); }
    const [cl, a] = mk(LW, H);
    for (let i = 0; i < 12; i++) { const x = r() * LW, y = 12 + r() * 60, w2 = 30 + r() * 70; ell(a, x, y, w2 / 2 | 0, 2 + r() * 3 | 0, '#8a5a94'); ell(a, x - 3, y - 1, w2 / 2.6 | 0, 2, '#f4b494'); }
    const [far, b] = mk(LW, H);
    for (let x = 0; x < LW; x++) rect(b, x, 108 - (Math.sin(x / 40) + 1) * 2 - hash(x) * 2, 1, 4 + (Math.sin(x / 40) + 1) * 2, '#8a6898');
    for (let i = 0; i < 18; i++) palm(b, r() * LW, 108, 8 + r() * 6, '#7a5a8e', r, true);
    const [f2, c] = mk(LW, H);
    for (let i = 0; i < 4; i++) {
      const x = 50 + i * 160 + r() * 50; ell(c, x, 113, 30, 3, '#4e3466');
      for (let k = 0; k < 4; k++) palm(c, x - 18 + k * 12, 112, 14 + r() * 10, '#4e3466', r, true);
      for (let y = 0; y < 18; y += 2) rect(c, x - 26 + Math.sin(y) * 2, 116 + y, 52 - y * 2, 1, '#5e4278');
    }
    const [mid, m] = mk(LW, H);
    for (let i = 0; i < 3; i++) palm(m, 60 + i * 230 + r() * 60, 152, 46 + r() * 20, '#2a1c40', r, true);
    for (let i = 0; i < 40; i++) { const x = r() * LW; line(m, x, 152, x + (r() - 0.5) * 4, 152 - 6 - r() * 10, '#2a1c40'); }
    return { sky, layers: [{ c: cl, f: 0.02, drift: 0.8 }, { c: far, f: 0.04 }, { c: f2, f: 0.1 }, { c: mid, f: 0.22 }], mist: '#c890a8', ground: { top: '#3a2650', fill: '#1f1230', dark: '#150c22', speck: '#2c1a40', plat: '#5a3a26' }, motes: '#ffd0a0', water: '#5a3a7acc' };
  },
  caatinga() {
    const r = seeded(51);
    const [sky, s] = mk(W, H); bands(s, ['#a4a69c', '#b4b4a6', '#c4c0ae', '#d2ccb6', '#ddd4bc', '#e2d6bc', '#dccdb0'], 0, 150, W);
    ell(s, 236, 52, 24, 24, '#e8e2cc'); ell(s, 236, 52, 17, 17, '#f6f0dc'); ell(s, 236, 52, 14, 14, '#fffaec');
    const [cl, a] = mk(LW, H);
    for (let i = 0; i < 8; i++) { const x = r() * LW, y = 16 + r() * 50, w2 = 40 + r() * 80; ell(a, x, y, w2 / 2 | 0, 2 + r() * 2 | 0, '#eee6d4'); }
    const [far, b] = mk(LW, H);
    for (let i = 0; i < 4; i++) mesa(b, 80 + i * 160 + r() * 40, 60 + r() * 50, 112 + r() * 8, 140, '#c8bea8', '#d2c8b2');
    rect(b, 0, 136, LW, 44, '#c8bea8');
    const [f2, c] = mk(LW, H);
    for (let x = 0; x < LW; x++) { const h = 10 + Math.round((Math.sin(x / 47) * 5 + Math.sin(x / 19) * 2) / 2) * 2; rect(c, x, 146 - h, 1, h + 34, '#b4a488'); }
    for (let i = 0; i < 8; i++) cactus(c, r() * LW, 144, 12 + r() * 8, '#8e8268');
    const [mid, m] = mk(LW, H);
    for (let i = 0; i < 5; i++) cactus(m, 40 + i * 130 + r() * 50, 150, 26 + r() * 16, '#5a5242');
    for (let i = 0; i < 8; i++) { const x = r() * LW; branch(m, x, 150, -HPI / 2 + (r() - 0.5) * 0.4, 9 + r() * 6, 3, '#6a5a48', r); }
    for (let i = 0; i < 4; i++) { const x = r() * LW; ell(m, x, 149, 3, 1, '#ece4d0'); rect(m, x + 3, 148, 3, 1, '#ece4d0'); }
    ctx2fog(m, 130, 20, '#f0e4c4', 0.16);
    return { sky, layers: [{ c: cl, f: 0.02, drift: 0.6 }, { c: far, f: 0.05 }, { c: f2, f: 0.1 }, { c: mid, f: 0.2 }], mist: '#f8e8c0', ground: { top: '#8a6448', fill: '#5a3e2e', dark: '#3e2a20', speck: '#6e4e3a', plat: '#4a3428' }, motes: '#fff0c0', hot: true };
  },
  mata() {
    const r = seeded(61);
    const [sky, s] = mk(W, H); bands(s, ['#5a6a76', '#687a86', '#788a94', '#8a9ca2', '#9aaaa8', '#a8b4ac', '#b2baaa'], 0, 150, W);
    const [cl, a] = mk(LW, H);
    for (let i = 0; i < 10; i++) { const x = r() * LW, y = 14 + r() * 50, w2 = 40 + r() * 80; ell(a, x, y, w2 / 2 | 0, 3 + r() * 3 | 0, '#8a9aa2'); ell(a, x - 4, y - 2, w2 / 2.6 | 0, 2, '#b4c0c0'); }
    const [far, b] = mk(LW, H);
    for (let x = 0; x < LW; x++) { const h = 22 + Math.sin(x / 60) * 8 + Math.sin(x / 23) * 3; rect(b, x, 140 - h, 1, h + 40, '#94a4a6'); }
    for (let i = 0; i < 12; i++) araucaria(b, r() * LW, 122 - r() * 8, 22 + r() * 10, '#86989a', r);
    const [f2, c] = mk(LW, H);
    for (let i = 0; i < 10; i++) araucaria(c, r() * LW, 142, 34 + r() * 18, '#6c8082', r);
    const rx = 300; rect(c, rx, 116, 40, 26, '#7a8c8c'); for (let k = 0; k < 3; k++) { ell(c, rx + 7 + k * 13, 124, 4, 5, '#9aaaa8'); rect(c, rx + 3 + k * 13, 124, 8, 18, '#9aaaa8'); } rect(c, rx - 2, 113, 44, 4, '#7a8c8c');
    rect(c, 0, 140, LW, 40, '#6c8082');
    ctx2fog(c, 118, 30, '#b4c0bc', 0.3);
    const [mid, m] = mk(LW, H);
    for (let i = 0; i < 4; i++) araucaria(m, 60 + i * 160 + r() * 40, 152, 56 + r() * 20, '#3e5252', r);
    for (let i = 0; i < 3; i++) palm(m, 140 + i * 200 + r() * 40, 152, 40 + r() * 20, '#34484a', r, true);
    for (let i = 0; i < 14; i++) fernSil(m, r() * LW, 152, 5 + r() * 4, '#34484a', r);
    ctx2fog(m, 126, 26, '#b4c0bc', 0.2);
    return { sky, layers: [{ c: cl, f: 0.02, drift: 1 }, { c: far, f: 0.04 }, { c: f2, f: 0.1 }, { c: mid, f: 0.2 }], mist: '#a4b4b0', ground: { top: '#2c5244', fill: '#1a342d', dark: '#10241f', speck: '#244438', plat: '#3d5560' }, motes: '#f0d890' };
  },
  coracao() {
    const r = seeded(71);
    const [sky, s] = mk(W, H); bands(s, ['#0c0a22', '#120e30', '#18163e', '#1c204c', '#1e2c5a', '#1e3a66', '#1e4670'], 0, 160, W);
    for (let i = 0; i < 6; i++) { const x = 40 + r() * 240; for (let y = 0; y < 150; y++) if (hash(y + i * 50) < 0.5) rect(s, x + y * 0.15, y, 2, 1, '#2a5a8a'); }
    const [far, b] = mk(LW, H);
    for (let i = 0; i < 18; i++) { const x = r() * LW, w2 = 4 + r() * 5; rect(b, x, 10, w2, 150, '#22406a'); ell(b, x + w2 / 2, 14, 14 + r() * 10 | 0, 6, '#1e365e'); }
    rect(b, 0, 132, LW, 48, '#1e365e');
    const [f2, c] = mk(LW, H);
    const tx = 320; rect(c, tx - 14, 20, 28, 130, '#2a2456'); for (let k = 0; k < 16; k++) rect(c, tx - 14 - k * 2.4, 150 - k * 2, 28 + k * 4.8, 2, '#2a2456');
    ell(c, tx, 22, 70, 18, '#1e3860'); ell(c, tx - 40, 30, 36, 12, '#22406a'); ell(c, tx + 44, 28, 40, 12, '#22406a');
    for (let k = 0; k < 7; k++) { const pts = curve(tx + (k - 3) * 4, 120 + k * 3, tx + (k - 3) * 30, 140, tx + (k - 3) * 52, 150, 30); for (const [px, py] of pts) rect(c, px, py, 2, 2, '#2e8a72'); }
    for (let i = 0; i < 10; i++) { const x = r() * LW; rect(c, x, 20 + r() * 10, 3 + r() * 3, 130, '#241e4a'); }
    const [mid, m] = mk(LW, H);
    for (let i = 0; i < 26; i++) { const x = r() * LW, y = 148 - r() * 6, col = r() < 0.6 ? '#5af0c0' : '#e070c0'; rect(m, x, y - 4, 1, 4, '#3a3a6a'); ell(m, x, y - 5, 2 + (r() * 2 | 0), 1, col); }
    for (let i = 0; i < 12; i++) fernSil(m, r() * LW, 152, 5 + r() * 4, '#1a2a4a', r);
    for (let i = 0; i < 30; i++) rect(m, r() * LW, 40 + r() * 100, 1, 1, '#7af0e0');
    return { sky, layers: [{ c: far, f: 0.04 }, { c: f2, f: 0.1 }, { c: mid, f: 0.22 }], mist: '#3ad0c0', ground: { top: '#2a5a5a', fill: '#141428', dark: '#0c0c1c', speck: '#22223e', plat: '#2a2a4a' }, motes: '#7af0e0' };
  },
};
// névoa: faixa semitransparente que apaga a base das camadas distantes
function ctx2fog(c, y, h, col, a) { for (let i = 0; i < h; i++) { c.globalAlpha = a * (i / h); c.fillStyle = col; c.fillRect(0, y + i, LW, 1); } c.globalAlpha = 1; }
function fernSil(c, x, by, sz, col, r) { for (let i = 0; i < 5; i++) { const a = -HPI / 2 + (i - 2) * 0.45; line(c, x, by, x + Math.sin(a) * sz * 1.4, by - Math.cos(a) * sz, col); } }
function acacia(c, x, by, h, col, hi, r) {
  line(c, x, by, x + (r() - 0.5) * 6, by - h * 0.6, col, 2);
  const tx = x + (r() - 0.5) * 6, ty = by - h * 0.6;
  branch(c, tx, ty, -HPI / 2 - 0.6, h * 0.35, 2, col, r); branch(c, tx, ty, -HPI / 2 + 0.6, h * 0.35, 2, col, r);
  ell(c, tx, by - h, h * 0.75 | 0, 4, col); ell(c, tx - 3, by - h - 2, h * 0.5 | 0, 2, hi);
}
function cactus(c, x, by, h, col) {
  rect(c, x - 2, by - h, 4, h, col); rect(c, x - 7, by - h * 0.6, 5, 2, col); rect(c, x - 7, by - h * 0.85, 2, h * 0.27, col);
  rect(c, x + 2, by - h * 0.5, 5, 2, col); rect(c, x + 5, by - h * 0.72, 2, h * 0.24, col);
}
function araucaria(c, x, by, h, col) {
  // copa de taça: galhos que sobem e terminam em tufos, bordas mais altas que o meio
  rect(c, x, by - h, 2, h, col);
  const top = by - h, n = 7, span = h * 0.34;
  for (let k = 0; k < n; k++) {
    const ox = (k - (n - 1) / 2) / ((n - 1) / 2) * span, ty = top + 3 - Math.abs(ox) * 0.35;
    for (const [px, py] of curve(x + 1, top + 9, x + 1 + ox * 0.6, top + 6, x + 1 + ox, ty, 10)) rect(c, px, py, 1, 1, col);
    ell(c, x + 1 + ox, ty - 1, 3, 1, col);
  }
}

function drawBackground(b, camx, t) {
  ctx.drawImage(b.sky, 0, 0, W, 150, 0, -DY, W, 150 + DY); ctx.drawImage(b.sky, 0, 150, W, H - 150, 0, 150, W, H - 150);
  for (const l of b.layers) {
    let ox = -((camx * l.f + (l.drift ? t * l.drift : 0)) % LW);
    if (ox > 0) ox -= LW;
    for (let x = ox; x < W; x += LW) ctx.drawImage(l.c, x, 0);
  }
}

// ---------- Personagens humanos (forma do espírito e povos) ----------
const SK = { skin: '#8a5434', skinD: '#5e3622', skinL: '#a86c44', foot: '#3a2014' };
// Visual dos protagonistas (folhas de referência): o espírito assume o corpo do arqueiro nas formas de tiro e o do
// lanceiro nas de corpo a corpo, em três variantes — Cocar, Manto e Caveira. Cada forma mantém a sua arma.
const PELE = { ...SK, hair: '#14100e', eye: '#ffe066', armBand: '#e8dcc0', shin: '#3a2418', wstyle: 'tribal' };
const VARIANTES = {
  arqueiro: [
    // Cocar: cocar de penas vermelhas, brancas e escuras, peito nu com alças cruzadas, colar de contas, tanga vermelha
    { ...PELE, hairStyle: 'long', acc: 'cocar', top: { k: 'straps', col: '#e8dcc0' }, necklace: 'beads', bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, back: 'quiver', stripe: '#e8dcc0' },
    // Manto: capuz e capa vermelhos com penas saindo do capuz, túnica escura e tanga vermelha
    { ...PELE, hairStyle: 'hood', hood: '#9a2a22', cape: '#9a2a22', top: { k: 'tunic', col: '#2a1c16' }, bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, back: 'quiver', armBand: '#a8302a' },
    // Caveira: máscara de crânio com penas, ombreiras de pelo e pintura de guerra escura
    { ...PELE, hairStyle: 'long', acc: 'skull', fur: '#d8c8a8', top: { k: 'warpaint', col: '#2a1a14' }, necklace: 'beads', bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, back: 'quiver', armBand: '#a8302a' },
  ],
  lanceiro: [
    { ...PELE, hairStyle: 'long', acc: 'cocar', top: { k: 'bare', col: '#e8dcc0' }, necklace: true, armPaint: '#e8dcc0', bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, stripe: '#e8dcc0' },
    { ...PELE, hairStyle: 'hood', hood: '#8a2420', cape: '#8a2420', top: { k: 'tunic', col: '#2a1c16' }, necklace: true, bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, armBand: '#a8302a' },
    { ...PELE, hairStyle: 'long', acc: 'skull', fur: '#d8c8a8', top: { k: 'warpaint', col: '#2a1a14' }, necklace: true, bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, armBand: '#a8302a' },
  ],
};
const VARIANTE_NOMES = ['Do povo', 'Cocar', 'Manto', 'Caveira'];
const FORMA_CORPO = { zarabatana: 'arqueiro', arco: 'arqueiro', lanca: 'lanceiro', cabaca: 'lanceiro', semente: 'lanceiro' };
// variantes liberadas pela jornada: Cocar desde o início, Manto a partir do Pantanal, Caveira a partir da Mata Atlântica
// visual "Do povo" (o de cada região) é o padrão; Cocar desde o início, Manto a partir do Pantanal e Caveira a partir da Mata Atlântica
function variantesLiberadas() { const act = (G.save && G.save.act) || 0; return act >= 5 ? 4 : act >= 3 ? 3 : 2; }
function varianteAtual() { const n = variantesLiberadas(), v = G.save && G.save.look; return v != null && v < n ? v : 0; }
// aparência do jogador: corpo da variante + arma e acessórios da forma
function playerSpec(form) {
  const corpo = FORMA_CORPO[form], base = SPEC[form] || SPEC.espirito;
  const v = varianteAtual();
  if (!corpo || v === 0) return base;
  return { ...VARIANTES[corpo][v - 1], weapon: base.weapon, hip: base.hip };
}
const SPEC = {
  espirito: { skin: '#0c0a10', skinD: '#09070c', skinL: '#1a1624', foot: '#09070c', hair: '#0c0a10', hairStyle: 'short', eye: '#ffe066', outline: '#6a5a8a', weapon: null },
  // Caçador da zarabatana (Amazônia): pena no cabelo, faixa vermelha pintada nos olhos, gola e saia de folhas, pintura vermelha e zarabatana preta
  zarabatana: { ...SK, hair: '#14100e', hairStyle: 'short', acc: 'feather1', facePaint: '#c8302a', leafCollar: true, top: { k: 'paint', col: '#b8302a' }, bottom: { k: 'leaves' }, armBand: '#4a8a3a', armPaint: '#b8302a', shin: '#3a2418', weapon: 'blowgun', gunCol: '#2a2420', eye: '#ffe066' },
  // Arqueira do cerrado: penas amarelas, cabelo comprido com faixa, top claro com alça, saia de franja, braçadeiras douradas e arco de madeira
  arco: { ...SK, hair: '#14100e', hairStyle: 'long', acc: 'yellowfeathers', top: { k: 'bandeau', col: '#c8a878' }, bottom: { k: 'skirt', col: '#a0522d', len: 3 }, armBand: '#d8a040', shin: '#6a4a2a', back: 'quiver', weapon: 'bow', bowCol: '#8a5a2a', eye: '#ffe066' },
  // Canoeiro das águas: chapéu de palha, camisa azul, calça arregaçada e remo
  lanca: { ...SK, hair: '#14100e', hairStyle: 'short', acc: 'strawhat', top: { k: 'shirt', col: '#34486e' }, sleeve: '#34486e', pants: '#6a5a4a', weapon: 'paddle', eye: '#ffe066' },
  // Lanceira da cabaça: cabelo comprido com faixa vermelha, top claro, saia avermelhada, cabaça na cintura e lança
  cabaca: { ...SK, hair: '#14100e', hairStyle: 'long', acc: 'redband', top: { k: 'bandeau', col: '#e8dcc0' }, bottom: { k: 'skirt', col: '#8a3a2a', len: 4 }, hip: 'gourd', armBand: '#e8dcc0', weapon: 'spear', eye: '#ffe066' },
  // Anciã das sementes: cabelo grisalho comprido, xale e vestido verdes, cajado com folhas e sementes
  semente: { ...SK, hair: '#a8a8a0', hairStyle: 'whitelong', top: { k: 'shawl', col: '#3a5a2e' }, bottom: { k: 'dress', col: '#4a6a3a' }, weapon: 'staff', wstyle: 'leafy', eye: '#ffe066' },
};
// visual antigo dos mestres de cada povo, que não são o protagonista
const NPC_BASE = {
  zarabatana: { ...SK, hair: '#1a1210', hairStyle: 'short', acc: 'crown', top: { k: 'band', col: '#b8402e' }, neck: '#e8d8b8', bottom: { col: '#7a4a2a', len: 4, hem: '#a8744a' }, legBand: '#e8d8b8', back: 'bag', weapon: 'blowgun' },
  arco: { ...SK, hair: '#14100e', hairStyle: 'long', acc: 'tuft', top: { k: 'cords', col: '#c8402e' }, bottom: { col: '#b8402e', len: 1, hem: '#e8d8b8' }, legBand: '#1a1210', back: 'quiver', weapon: 'bow', paint: '#1a1210' },
  lanca: { ...SK, hair: '#e8e4dc', hairStyle: 'white', acc: 'plume', top: { k: 'sash', col: '#c8b48a' }, bottom: { col: '#7aaab0', len: 1, hem: '#5a8a90' }, back: 'bag', weapon: 'spear' },
  cabaca: { ...SK, hair: '#14100e', hairStyle: 'braid', acc: 'fan', top: { k: 'sash', col: '#e8dcc0' }, bottom: { col: '#e8dcc0', len: 5, hem: '#b8402e' }, hip: 'gourd', weapon: 'spear' },
  semente: { ...SK, hair: '#ece6dc', hairStyle: 'whitelong', acc: 'sprouts', top: { k: 'shirt', col: '#34446e', dots: '#f2e6a0' }, bottom: { col: '#e8e0cc', len: 6, hem: '#b8402e' }, back: 'basket', weapon: 'staff' },
};
function npcSpec(form, over) { return Object.assign({}, NPC_BASE[form] || SPEC[form], { eye: '#20140e' }, over || {}); }

// Esqueleto simples: braço = ombro→cotovelo→mão (ângulo 0 aponta para baixo, π/2 para a frente, π para cima),
// perna = quadril→joelho→pé (o joelho dobra sozinho). As poses seguem as animações de referência
// (correr, golpe por cima, varrida, estocada em avanço, puxar o arco, dor, queda).
const HPI = Math.PI;
function humanPose(a, s) {
  const k = a.kind, p = clamp(a.p || 0, 0, 1), t = a.t || 0, wp = s.weapon;
  const P = { bob: 0, lean: 0, head: 0, crouch: 0, fb: [-2, 0], ff: [2, 0], ab: [0.15, 0.2], af: [0.25, 0.9], wa: HPI - 0.1, slash: null, lie: false, blink: false, puff: false, draw: 0, arrow: false, gourd: false, noWeapon: false, mouth: false, scaleX: 1, scaleY: 1, rot: 0 };
  const ez = v => v * v * (3 - 2 * v);

  if (k === 'idle') {
    P.bob = Math.sin(t * 2.4) > 0.2 ? 0 : 1;
    P.ab = [0.12 + Math.sin(t * 2.4) * 0.05, 0.2];
    P.blink = (t % 3.3) < 0.13;
    P.scaleY = 1 + Math.sin(t * 2.4) * 0.02;
    P.scaleX = 1 - Math.sin(t * 2.4) * 0.01;
    if (wp === 'bow') { P.af = [0.15, 0.4]; P.wa = HPI / 2 + 0.25; }
  } else if (k === 'run' || k === 'walk') {
    const run = k === 'run', amp = run ? 4 : 2.5, lift = run ? 2.5 : 1, s1 = Math.sin(a.ph), c1 = Math.cos(a.ph);
    P.ff = [1 + s1 * amp, Math.max(0, c1) * lift]; P.fb = [-2 - s1 * amp, Math.max(0, -c1) * lift];
    P.bob = Math.abs(c1) > 0.7 ? 1 : 0; P.lean = run ? 1.5 : 0.5;
    P.rot = run ? Math.sin(a.ph * 2) * 0.05 : 0;
    P.scaleY = 1 + Math.abs(Math.sin(a.ph)) * 0.05;
    P.scaleX = 1 - Math.abs(Math.sin(a.ph)) * 0.03;
    P.af = [-s1 * 0.8 + 0.3, 0.9]; P.ab = [s1 * 0.9, 0.7];
    P.wa = wp === 'bow' ? HPI / 2 + 0.4 : wp === 'spear' ? HPI / 2 + 0.12 + s1 * 0.04 : 2.3 + s1 * 0.12;
  } else if (k === 'dash') {
    const drive = 1 - ez(p);
    P.lean = 3 + drive * 2; P.head = 1; P.ff = [5, 1]; P.fb = [-7, 2];
    P.scaleX = 1.25; P.scaleY = 0.8; P.rot = 0.12;
    P.af = [-0.8, 0.5]; P.ab = [-1.3, 0.3]; P.wa = 2.5;
  } else if (k === 'jump') {
    P.ff = [3, 4]; P.fb = [-2, 2]; P.af = [2.2, 0.4]; P.ab = [-1.1, 0.3]; P.wa = 2.4;
    P.scaleX = 0.85; P.scaleY = 1.2; P.rot = -0.05;
  } else if (k === 'fall') {
    P.ff = [2, 0]; P.fb = [-3, 1]; P.af = [1.8, 0.2]; P.ab = [-1.5, 0.2]; P.wa = 2.0;
    P.scaleX = 0.95; P.scaleY = 1.08;
  } else if (k === 'climb') {
    const s1 = Math.sin(t * 9) * (a.moving ? 1 : 0); P.af = [HPI - 0.2 + s1 * 0.3, 0.2]; P.ab = [HPI - 0.4 - s1 * 0.3, 0.2]; P.ff = [2, 3 + s1 * 2]; P.fb = [-1, 3 - s1 * 2]; P.noWeapon = true; P.lean = 1;
  } else if (k === 'kneel') {
    P.crouch = 5; P.ff = [4, 0]; P.fb = [-4, 0]; P.af = [0.4, 0.6]; P.ab = [0.1, 0.2]; P.head = 1; P.wa = 2.2; P.scaleY = 0.85;
  } else if (k === 'heal') {
    P.af = [2.6, 2.3]; P.ab = [0.25, 0.3]; P.head = -1; P.gourd = true; P.noWeapon = wp !== 'bow'; P.wa = 0.3;
  } else if (k === 'hurt') {
    P.lean = -2; P.head = -1; P.af = [1.9 - p, 0.3]; P.ab = [-1.6, 0.4]; P.ff = [3, 2]; P.fb = [-2, 0]; P.wa = 2.6; P.scaleX = 1.1; P.scaleY = 0.9;
  } else if (k === 'dead') {
    if (p < 0.45) { P.crouch = 5 * ez(p / 0.45); P.ff = [4, 0]; P.fb = [-4, 0]; P.af = [0.3, 0.2]; P.ab = [0.1, 0.1]; P.head = 1; P.wa = 1.4; }
    else P.lie = true;
  } else if (k === 'attack') {
    const st = a.style || 'thrust';
    const w = p < 0.3 ? ez(p / 0.3) : 1, sk = p < 0.3 ? 0 : p < 0.55 ? ez((p - 0.3) / 0.25) : 1;
    if (st === 'over') {
      const a1 = p < 0.3 ? lerp(0.9, HPI + 0.55, w) : lerp(HPI + 0.55, 0.55, sk);
      P.af = [a1, 0.15]; P.wa = a1 + 0.1; P.lean = p < 0.3 ? -w : lerp(-1, 2, sk); P.ff = [1 + 3 * sk, 0]; P.ab = [-0.6 + sk, 0.4];
      if (p >= 0.3) P.slash = { st, a0: HPI + 0.55, a1, r: wp ? 15 : 10 };
    } else if (st === 'sweep' || st === 'claw') {
      const a1 = p < 0.3 ? lerp(0.4, -1.4, w) : lerp(-1.4, 2.0, sk);
      P.af = [a1, 0.1]; P.wa = a1; P.lean = p < 0.3 ? -w : lerp(0, 2, sk); P.ff = [1 + 2 * sk, 0]; P.ab = [0.6 - sk, 0.5];
      if (p >= 0.3) P.slash = { st, a0: -1.4, a1, r: st === 'claw' ? 10 : 14 };
      if (st === 'claw') P.noWeapon = true;
    } else {
      const jab = st === 'jab', reach = jab ? 0.6 : 1;
      const bend = p < 0.3 ? lerp(0.6, 1.5, w) : lerp(1.5, 0, sk);
      P.af = [lerp(0.7, HPI / 2, p < 0.3 ? 0 : sk), bend]; P.wa = HPI / 2;
      P.lean = p < 0.3 ? -w : lerp(-1, 3 * reach, sk); P.ff = [2 + 4 * reach * sk, 0]; P.fb = [-2 - 2 * reach * sk, 0]; P.ab = [0.8, 0.9];
      if (p >= 0.32 && p < 0.75) P.slash = { st: 'thrust', len: jab ? 10 : 16 };
    }
  } else if (k === 'shot' || k === 'special') {
    const sh = a.shot || 'orb', rel = a.at || 0.28, w = p < rel ? ez(p / rel) : 1, after = p < rel ? 0 : ez(clamp((p - rel) / 0.3, 0, 1));
    if (sh === 'arrow' || sh === 'firearrow') { P.af = [HPI / 2 + 0.05, 0]; P.ab = [HPI / 2 + 0.1, lerp(0.4, 2.5, w) * (1 - after)]; P.wa = HPI / 2; P.draw = p < rel ? w : 0; P.arrow = p < rel; P.lean = -after; }
    else if (sh === 'dart' || sh === 'burst') { P.af = [2.0, 0.7]; P.ab = [2.1, 0.9]; P.wa = HPI / 2; P.mouth = true; P.puff = (p > rel - 0.05 && p < rel + 0.15) || (sh === 'burst' && Math.sin(p * 30) > 0.3); }
    else if (sh === 'javelin' || sh === 'throw') { const a1 = p < rel ? lerp(1.0, HPI + 0.75, w) : lerp(HPI + 0.75, 1.2, after); P.af = [a1, 0.2]; P.wa = a1 + 0.15; P.lean = p < rel ? -w : 2 * after; P.ff = [2 + 2 * after, 0]; if (p >= rel) P.noWeapon = sh === 'throw'; }
    else if (sh === 'drop' || sh === 'splash') { const a1 = p < rel ? lerp(0.2, -0.9, w) : lerp(-0.9, 2.2, after); P.af = [a1, 0.3]; P.gourd = true; P.noWeapon = true; P.lean = after; if (sh === 'splash' && p >= rel) P.slash = { st: 'sweep', a0: -0.9, a1, r: 12, water: true }; }
    else if (sh === 'roots') { const a1 = p < rel ? lerp(0.9, HPI + 0.3, w) : lerp(HPI + 0.3, 0.2, after); P.af = [a1, 0.1]; P.wa = a1; P.crouch = 3 * after; P.lean = after; }
    else if (sh === 'seed') { const a1 = p < rel ? lerp(0.6, HPI, w) : lerp(HPI, 1.7, after); P.af = [a1, 0.1]; P.wa = a1; P.lean = after; }
    else { P.af = [HPI / 2, lerp(0.8, 0, w)]; P.ab = [0.4, 0.4]; P.lean = w; P.noWeapon = true; }
  }
  return P;
}

const HUMAN_S = 1.45;
function drawHuman(c, x, y, f, a, s, flash, alpha) {
  const P = humanPose(a, s), opacity = alpha === undefined ? c.globalAlpha : alpha;
  c.save();
  try {
    c.translate(x, y); c.rotate(P.rot * f); c.scale(P.scaleX, P.scaleY); c.translate(-x, -y);
    if (a.kind === 'dash') {
      c.globalAlpha = opacity * 0.3; drawHumanBase(c, x - f * 8, y, f, a, s, flash);
      c.globalAlpha = opacity * 0.55; drawHumanBase(c, x - f * 4, y, f, a, s, flash);
    }
    c.globalAlpha = opacity; drawHumanBase(c, x, y, f, a, s, flash);
  } finally { c.restore(); }
}
function drawHumanBase(c, x, y, f, a, s, flash, alpha) {
  const R = [];
  const snap = v => Math.round(v * 2) / 2;
  const A = (dx, dy, w, h, col) => { const X = snap(dx * HUMAN_S), Y = snap(dy * HUMAN_S); R.push([X, Y, Math.max(0.5, snap((dx + w) * HUMAN_S) - X), Math.max(0.5, snap((dy + h) * HUMAN_S) - Y), col]); };
  const seg = (x0, y0, x1, y1, col, th) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2)); for (let i = 0; i <= n; i++) A(snap(x0 + (x1 - x0) * i / n), snap(y0 + (y1 - y0) * i / n), th, th, col); };
  const limb = (x0, y0, x1, y1, t0, t1, col, lit, drk) => {
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(2, Math.ceil(L * 2)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    for (let i = 0; i <= n; i++) { const k = i / n, th = t0 + (t1 - t0) * k; A(x0 + (x1 - x0) * k - th / 2, y0 + (y1 - y0) * k - th / 2, th, th, col); }
    for (let i = 2; i < n - 1; i += 3) { const k = i / n, px = x0 + (x1 - x0) * k, py = y0 + (y1 - y0) * k, th = t0 + (t1 - t0) * k; if (lit) A(px + nx * th * 0.3 - 0.35, py + ny * th * 0.3 - 0.35, 0.7, 0.7, lit); if (drk) A(px - nx * th * 0.35 - 0.35, py - ny * th * 0.35 - 0.35, 0.7, 0.7, drk); }
  };
  const hair = s.hair, skin = s.skin, skinD = s.skinD, skinL = s.skinL || skin, esp = !!s.outline, deep = esp ? '#050307' : '#3e2214', mixC = (p, q) => '#' + [1, 3, 5].map(i => Math.round((parseInt(p.slice(i, i + 2), 16) + parseInt(q.slice(i, i + 2), 16)) / 2).toString(16).padStart(2, '0')).join(''), skinM = mixC(skin, skinD);
  let slash = null, shF = null, tip = 8;
  {
    const P = humanPose(a, s);
    if (P.lie) {
      // caído de costas no chão
      A(-12, -5, 6, 5, skin); A(-13, -6, 4, 5, hair); A(-6, -5, 9, 4, skin);
      if (s.top) A(-6, -5, 9, 2, s.top.col);
      if (s.bottom) A(2, -5, 4, 4, s.bottom.col);
      A(5, -3, 8, 2, skin); A(5, -5, 7, 2, skinD); A(12, -4, 1, 3, s.foot); A(-8, -2, 6, 2, skinD);
    } else {
      const top = -22 + P.bob + P.crouch, hipY = -8 + P.crouch + P.bob * 0.5, Ln = P.lean;
      const sh = (dx, row) => dx + Math.round(Ln * (1 - row / 8));
      shF = [1 + Ln, top + 8];
      const shB = [-2 + Ln, top + 8];
      const arm = (sp, ang) => { const e = [sp[0] + Math.sin(ang[0]) * 4, sp[1] + Math.cos(ang[0]) * 4]; const b = ang[0] + ang[1]; return [e, [e[0] + Math.sin(b) * 4, e[1] + Math.cos(b) * 4]]; };
      const leg = (hx, ft) => {
        const fx = ft[0], fy = -ft[1], d = Math.hypot(fx - hx, fy - hipY) || 1;
        let kx = (hx + fx) / 2, ky = (hipY + fy) / 2;
        if (d < 8) { const hh = Math.sqrt(Math.max(0, 16 - (d / 2) ** 2)); kx += Math.abs(fy - hipY) / d * hh; ky -= (fx - hx) / d * hh * 0.4; }
        return [[kx, ky], [fx, fy]];
      };
      const drawLeg = (hx, ft, col, band) => {
        const [kn, fo] = leg(hx, ft), front = col === skin;
        const mid = [(kn[0] * 0.55 + fo[0] * 0.45), (kn[1] * 0.55 + fo[1] * 0.45)], lit = null, drk = front ? skinM : null;
        A(hx - 1.4, hipY, 2.8, 2, col);                                                        // quadril
        limb(hx, hipY, kn[0], kn[1], 2.9, 2.1, col, lit, drk);                                  // coxa
        limb(kn[0], kn[1], mid[0], mid[1], 2.1, 2.4, col, lit, drk);                            // panturrilha
        limb(mid[0], mid[1], fo[0], fo[1] - 1, 2.4, 1.5, col, null, drk);                       // tornozelo
        if (front) A(kn[0] + 0.6, kn[1] - 0.4, 0.8, 0.8, skinL);                               // joelho
        A(fo[0] - 1, fo[1] - 1.3, 4, 1.3, s.foot); A(fo[0] - 1, fo[1] - 1.3, 0.8, 1.3, s.foot); // pé e calcanhar
        if (!esp) { A(fo[0] + 2.2, fo[1] - 1.3, 0.7, 0.7, front ? skinL : skin); A(fo[0] + 1.2, fo[1] - 0.6, 1.6, 0.6, '#2a1408'); } // dedos
        if (s.pants) { const pc = col === skin ? s.pants : '#4a3e34'; limb(hx, hipY, kn[0], kn[1], 3.1, 2.4, pc, null, '#2a2420'); limb(kn[0], kn[1], (kn[0] + fo[0] * 2) / 3, (kn[1] + fo[1] * 2) / 3, 2.4, 2.4, pc, null, '#2a2420'); } // calça arregaçada
        if (s.shin) limb(mid[0], mid[1], fo[0], fo[1] - 1, 2.5, 1.7, s.shin, null, null);       // perneira de fibra na canela
        if (band) A(Math.round((kn[0] + fo[0]) / 2), Math.round((kn[1] + fo[1]) / 2), 2, 1, band);
      };
      const armBand = (e, h) => { if (s.armBand) A(Math.round((e[0] + h[0]) / 2), Math.round((e[1] + h[1]) / 2), 2, 1, s.armBand); };
      // capa longa caindo das costas, mais aberta e esvoaçante quando corre
      if (s.cape) { const fl = a.kind === 'run' ? 2 : a.kind === 'walk' ? 1 : 0; for (let r = 0; r < 13; r++) { const w2 = 3 + Math.floor(r * 0.35), x0 = sh(-4, r) - Math.floor(r * (0.35 + fl * 0.15)); A(x0 - w2 + 3, top + 6 + r, w2, 1, r % 3 ? s.cape : '#6a1814'); } for (let i = 0; i < 4; i++) A(sh(-4, 12) - 9 - fl * 2 + i * 2, top + 19 + (i % 2), 1, 1, '#6a1814'); }
      // costas
      if (s.back === 'bag') A(sh(-6, 2), top + 8, 3, 6, '#c8a46a');
      if (s.back === 'quiver') { A(sh(-6, 0), top + 4, 2, 10, '#7a4a2a'); A(sh(-6, 0), top + 2, 1, 2, '#e8d8b8'); A(sh(-5, 0), top + 1, 1, 3, '#e8d8b8'); }
      if (s.back === 'basket') { A(sh(-9, 1), top + 6, 5, 8, '#a88a5a'); A(sh(-9, 1), top + 8, 5, 1, '#7a5a3a'); A(sh(-8, 0), top + 3, 1, 3, '#6fd36a'); A(sh(-6, 0), top + 2, 1, 4, '#8fe37a'); }
      const hx = -3 + Ln + P.head, hy = top + (P.head > 0 ? 1 : 0);
      if (s.hairStyle === 'long') { A(hx - 2, top + 2, 3, 13, hair); A(hx - 1.4, top + 4, 0.6, 9, '#2e241e'); A(hx - 2.4, top + 13, 1, 2, hair); }
      if (s.hairStyle === 'hood') { A(hx - 2, top + 1, 3, 9, s.hood); A(hx - 3, top + 4, 1, 6, '#6a1814'); }
      if (s.hairStyle === 'wild') { A(hx - 2, top + 1, 4, 11, hair); A(hx - 3, top + 3, 1, 6, hair); A(hx - 1, top + 12, 2, 2, hair); A(hx - 4, top + 5, 1, 2, hair); }
      if (s.hairStyle === 'wild' && s.back === 'quiver') { A(sh(-6, 0), top + 1, 1, 4, '#e8d8b8'); A(sh(-5, 0), top, 1, 4, '#efe8dc'); A(sh(-6, 0), top + 1, 1, 1, '#a8302a'); A(sh(-4, 0), top + 2, 1, 3, '#7a4a2a'); }
      if (s.hairStyle === 'topknot') { A(hx - 3, top - 2, 2, 3, hair); A(hx - 4, top, 2, 6, hair); A(hx - 5, top + 5, 2, 3, hair); A(hx - 5, top + 8, 1, 2, hair); }
      if (s.hairStyle === 'whitelong') { A(hx - 2, top + 2, 3, 16, hair); A(hx - 1.4, top + 4, 0.6, 11, '#d0d0c8'); A(hx - 0.6, top + 6, 0.6, 9, '#888880'); }
      if (s.hairStyle === 'braid') { A(hx - 2, top + 3, 2, 14, hair); A(hx - 2, top + 10, 2, 1, '#c8402e'); }
      // braço e perna de trás
      const [eB, hB] = arm(shB, P.ab);
      A(shB[0] - 1.4, shB[1] - 1.2, 2.8, 2.2, skinD);
      limb(shB[0], shB[1], eB[0], eB[1], 2.5, 1.8, skinD, null, null); limb(eB[0], eB[1], hB[0], hB[1], 2, 1.4, skinD, null, null);
      A(hB[0] - 0.9, hB[1] - 0.7, 1.9, 1.8, skinD); armBand(eB, hB);
      if (s.sleeve) limb(shB[0], shB[1], eB[0], eB[1], 2.7, 2.2, '#24324e', null, null);
      drawLeg(-2, P.fb, skinD, s.legBand);
      // tronco (o alto acompanha a inclinação)
      const TX = [-1, -4, -4, -3, -3, -3, -3, -3], TW = [3, 7, 7, 6, 6, 5, 5, 6];
      for (let r = 0; r < 8; r++) { A(sh(TX[r], r), top + 6 + r, TW[r], 1, skin); A(sh(TX[r], r), top + 6 + r, 1, 1, skinD); if (r > 0 && r < 7) A(sh(TX[r] + TW[r] - 1, r), top + 6 + r, 1, 1, skinL); }
      A(sh(-2, 3), top + 9, 2, 1, skinD); A(sh(1, 3), top + 9, 1, 1, skinD);    // peitoral
      A(sh(0, 5), top + 11, 1, 1, skinD); A(sh(-1, 6), top + 12, 1, 1, skinD);  // abdômen e umbigo
      A(sh(1, 2), top + 8, 1, 1, skinL);                                         // clavícula com luz
      if (s.top) {
        const T = s.top;
        if (T.k === 'band') { A(sh(-3, 3), top + 9, 6, 2, T.col); A(sh(-2, 6), top + 12, 1, 1, '#f2c14e'); A(sh(1, 6), top + 12, 1, 1, '#c8402e'); }
        if (T.k === 'cords') { A(sh(-3, 2), top + 8, 6, 1, T.col); A(sh(-3, 5), top + 11, 6, 1, T.col); A(sh(-3, 3), top + 9, 6, 1, '#1a1210'); }
        if (T.k === 'sash') for (let i = 0; i < 6; i++) A(sh(-3 + i, i), top + 6 + i, 1, 2, T.col);
        if (T.k === 'poncho') {
          // poncho vermelho que cobre os ombros, cai mais comprido nas costas, com grafismo claro e barra desfiada
          const dk = '#6a1a16', wt = '#e8d8c0';
          for (let r = 0; r < 5; r++) A(sh(-4 - (r >> 1), r), top + 6 + r, 9 + (r >> 1), 1, r === 0 ? dk : T.col);
          for (let r = 5; r < 9; r++) A(sh(-5, r), top + 6 + r, 2, 1, r % 2 ? dk : T.col);
          for (let i = 0; i < 5; i++) A(sh(-4 + i * 2, 2), top + 8 + (i % 2), 1, 1, wt);
          A(sh(-3, 3), top + 10, 7, 1, dk); for (let i = 0; i < 4; i++) A(sh(-3 + i * 2, 4), top + 11, 1, 1, dk);
        }
        if (T.k === 'paint') { A(sh(-2, 3), top + 9, 1, 1, T.col); A(sh(1, 3), top + 9, 1, 1, T.col); A(sh(-1, 5), top + 11, 2, 1, T.col); A(sh(-3, 6), top + 12, 1, 1, T.col); }
        if (T.k === 'bandeau') { A(sh(-3, 2), top + 8, 6, 3, T.col); A(sh(-3, 2), top + 10, 6, 1, '#8a6a4a'); for (let i = 0; i < 4; i++) A(sh(-3 + i, i), top + 6 + i, 1, 1, '#6a4a2a'); }
        if (T.k === 'shawl') { for (let r = 0; r < 6; r++) A(sh(-4, r), top + 6 + r, 8, 1, r % 2 ? T.col : '#2e4a24'); for (let i = 0; i < 4; i++) A(sh(-4 + i * 2, 5), top + 12, 1, 2, '#2e4a24'); }
        if (T.k === 'straps') { for (let i = 0; i < 6; i++) { A(sh(-3 + i, i), top + 7 + i, 1, 1, T.col); A(sh(2 - i, i), top + 7 + i, 1, 1, T.col); } A(sh(-1, 3), top + 9, 2, 1, '#a8302a'); }
        if (T.k === 'tunic') { for (let r = 0; r < 7; r++) A(sh(-3, r), top + 6 + r, 6, 1, r < 2 ? '#3a2a22' : T.col); A(sh(-1, 4), top + 10, 2, 1, '#a8302a'); }
        if (T.k === 'warpaint') { A(sh(-3, 2), top + 8, 6, 1, T.col); A(sh(-2, 5), top + 11, 4, 1, T.col); A(sh(0, 3), top + 9, 1, 2, '#a8302a'); }
        if (T.k === 'bare') {
          // pintura branca no peito e alça escura cruzada do ombro à cintura
          A(sh(-2, 3), top + 9, 1, 3, T.col); A(sh(1, 3), top + 9, 1, 2, T.col);
          for (let i = 0; i < 6; i++) A(sh(-3 + i, i), top + 7 + i, 1, 1, '#3a2014');
        }
        if (T.k === 'shirt') { for (let r = 0; r < 7; r++) A(sh(-3, r), top + 6 + r, 6, 1, T.col); if (T.dots) { A(sh(-1, 2), top + 8, 1, 1, T.dots); A(sh(1, 4), top + 10, 1, 1, T.dots); } }
      }
      if (s.neck) A(sh(-2, 1), top + 7, 4, 1, s.neck);
      if (s.leafCollar) { A(sh(-3, 0), top + 6, 7, 1, '#3a7a2a'); for (let i = 0; i < 7; i += 2) A(sh(-3 + i, 0), top + 7, 1, 2, i % 4 ? '#5a9a3a' : '#2e6a24'); }
      if (s.necklace === 'beads') { for (let i = 0; i < 5; i++) A(sh(-2 + i, 1), top + 7 + (i % 2 ? 1 : 0), 1, 1, i % 2 ? '#a8302a' : '#e8dcc0'); }
      else if (s.necklace) { A(sh(-2, 1), top + 7, 5, 1, '#3a2014'); for (let i = 0; i < 5; i++) A(sh(-2 + i, 1), top + 8, 1, 1 + (i % 2), '#f0e8d8'); }
      if (s.fur) { A(sh(-5, 0), top + 5, 4, 3, s.fur); A(sh(-5, 0), top + 8, 1, 1, '#a89878'); A(sh(-3, 0), top + 8, 1, 1, '#a89878'); }
      if (s.sash) { A(sh(-3, 7), top + 12, 7, 1, s.sash); A(sh(1, 7), top + 13, 2, 3, s.sash); }
      // perna da frente e saia
      drawLeg(1, P.ff, skin, s.legBand);
      if (s.bottom && s.bottom.k === 'leaves') { A(-3, top + 13, 7, 1, '#2e5a24'); for (let i = -3; i <= 3; i++) A(i, top + 14, 1, 4 + ((i + 3) % 2), (i + 3) % 2 ? '#4a8a3a' : '#2e6a24'); }
      else if (s.bottom && s.bottom.k === 'skirt') { const B = s.bottom; A(-3, top + 13, 7, 1, '#5a3a20'); A(-3, top + 14, 7, 2 + B.len, B.col); A(-3, top + 14, 7, 1, '#c8a878'); for (let i = 0; i < 7; i += 2) A(-3 + i, top + 16 + B.len, 1, 1, B.col); }
      else if (s.bottom && s.bottom.k === 'dress') { const B = s.bottom; for (let r = 0; r < 8; r++) A(-3 - (r >> 2), top + 13 + r, 7 + (r >> 1), 1, r % 3 ? B.col : '#3a5a2e'); A(-4, top + 20, 9, 1, '#2e4a24'); }
      else if (s.bottom && s.bottom.k === 'panel') { const B = s.bottom; A(-3, top + 14, 7, 2, '#3a2418'); A(-4, top + 14, 2, 4, B.hem); A(-3, top + 13, 7, 1, '#7a1e1a'); A(-1, top + 13, 1, 1, '#e8dcc0'); A(2, top + 13, 1, 1, '#e8dcc0'); A(0, top + 14, 3, 6, B.col); A(1, top + 16, 1, 1, '#e8dcc0'); A(0, top + 17, 1, 1, '#e8dcc0'); A(2, top + 17, 1, 1, '#e8dcc0'); A(0, top + 20, 1, 1, '#7a1e1a'); A(2, top + 20, 1, 1, '#7a1e1a'); }
      else if (s.bottom && s.bottom.k === 'loin') { const B = s.bottom; A(-3, top + 13, 7, 3 + B.len, B.col); for (let i = 0; i < 7; i += 2) A(-3 + i, top + 16 + B.len, 1, 1 + (i % 4 ? 1 : 0), B.hem); }
      else if (s.bottom && s.bottom.k === 'apron') { const B = s.bottom; A(-3, top + 13, 7, 1, B.hem); A(-4, top + 14, 1, 4, B.hem); A(-1, top + 14, 4, 2 + B.len, B.col); A(-1, top + 16, 4, 1, B.hem); A(1, top + 14, 1, 2 + B.len, B.hem); for (let i = 0; i < 4; i += 2) A(-1 + i, top + 16 + B.len, 1, 1, B.col); }
      else if (s.bottom) { const B = s.bottom; A(-3, top + 13, 7, 3 + B.len, B.col); A(-3, top + 15 + B.len, 7, 1, B.hem); }
      if (s.pants) A(-3, top + 13, 7, 2, s.pants);
      if (s.hip === 'gourd' && !P.gourd) { A(-5, top + 13, 3, 4, '#d8b04a'); A(-4, top + 12, 1, 1, '#7a5a2a'); }
      // cabeça
      A(hx + 1.4, hy + 5.4, 2.6, 1.6, skin); A(hx + 1.4, hy + 5.4, 0.7, 1.6, skinD);                  // pescoço
      A(hx + 1, hy, 4, 1, skin); A(hx, hy + 1, 6, 4, skin); A(hx + 1, hy + 5, 4.6, 1, skin);
      A(hx + 6, hy + 1.8, 0.8, 1.8, skin); A(hx + 6.2, hy + 1.8, 0.6, 0.8, skinL);                     // ponte do nariz com luz
      A(hx + 5.8, hy + 3.4, 0.7, 0.6, skinD);                                                            // narina
      A(hx + 0.8, hy + 2.6, 1.4, 2.2, skin); A(hx + 0.9, hy + 2.8, 0.6, 1.6, skinD); if (!esp) A(hx + 1.5, hy + 3.2, 0.6, 0.8, '#3a1e12'); // orelha
      A(hx + 4.8, hy + 3.2, 1, 0.7, skinL);                                                              // maçã do rosto
      if (!esp) { A(hx + 4.4, hy + 4.4, 1.8, 0.6, '#5a2a20'); A(hx + 4.6, hy + 5, 1.2, 0.5, '#8a4a38'); } // lábios
      A(hx + 1, hy + 4.6, 2.6, 0.8, skinD);                                                              // sombra do maxilar
      A(hx + 1.4, hy + 6, 2.4, 0.7, skinD);                                                              // sombra do queixo no pescoço
      if (s.paint) A(hx + 4, hy + 4, 2, 1, s.paint);
      if (s.stripe) { A(hx + 3, hy + 3, 3, 1, s.stripe); A(hx + 2, hy + 4, 1, 1, s.stripe); }
      if (s.facePaint) A(hx + 1, hy + 2, 6, 1, s.facePaint);
      if (!P.blink) { A(hx + 3.6, hy + 2, 1.2, 1, s.skin === SPEC.espirito.skin ? s.eye : '#f0e8d8'); A(hx + 4.8, hy + 2, 1.2, 1, s.eye); A(hx + 3.6, hy + 1.4, 2.4, 0.6, skinD); } else A(hx + 4, hy + 3, 2, 1, skinD);
      if (P.puff) A(hx + 5, hy + 4, 2, 2, skin);
      if (s.hairStyle === 'white') { A(hx - 1, hy - 1, 7, 3, hair); A(hx - 1, hy + 2, 2, 3, hair); A(hx + 4, hy + 4, 3, 3, hair); }
      else if (s.hairStyle === 'hood') {
        A(hx - 1, hy - 2, 7, 3, s.hood); A(hx - 1, hy + 1, 2, 5, s.hood); A(hx + 5, hy - 1, 2, 2, s.hood); A(hx, hy - 2, 5, 1, '#c8402e');
        A(hx + 2, hy + 1, 3, 1, skinD); seg(hx, hy - 2, hx - 2, hy - 6, '#e8dcc0', 1); seg(hx + 1, hy - 2, hx, hy - 7, '#a8302a', 1); A(hx - 2, hy - 6, 1, 1, '#2a1a14');
      }
      else if (s.hairStyle === 'wild') { A(hx - 1, hy - 1, 7, 3, hair); A(hx - 1, hy + 2, 2, 4, hair); A(hx + 4, hy + 1, 2, 1, hair); A(hx + 5, hy + 2, 1, 1, hair); A(hx, hy - 2, 2, 1, hair); A(hx + 3, hy - 2, 1, 1, hair); }
      else if (s.hairStyle === 'topknot') { A(hx - 1, hy - 1, 7, 2, hair); A(hx - 1, hy + 1, 2, 4, hair); A(hx + 5, hy, 2, 2, hair); A(hx, hy - 3, 3, 2, hair); }
      else { A(hx - 1, hy - 1, 7, 3, hair); A(hx - 1, hy + 2, 2, 3, hair); A(hx + 5, hy, 2, 1, hair); }
      const ax = hx + 3, ay = hy;
      if (s.acc === 'crown') { for (let i = 0; i < 7; i++) A(ax - 3 + i, ay - 3 - (i % 2), 1, 3 + (i % 2), i % 2 ? '#f2c14e' : '#e0703a'); A(ax - 3, ay, 7, 1, '#c8402e'); }
      if (s.acc === 'tuft') { A(ax - 7, ay - 1, 4, 1, '#efe8dc'); A(ax - 8, ay, 4, 1, '#c8402e'); A(ax - 6, ay + 1, 2, 1, '#efe8dc'); }
      if (s.acc === 'plume') { A(ax - 1, ay - 5, 1, 4, '#f4f0e8'); A(ax, ay - 7, 1, 4, '#f4f0e8'); A(ax - 2, ay - 4, 1, 2, '#d8d4cc'); }
      if (s.acc === 'fan') { for (let i = -3; i <= 3; i++) A(ax + i, ay - 4 + (Math.abs(i) >> 1), 1, 3, i % 2 ? '#b8b0a0' : '#d8d0c0'); A(ax - 4, ay + 1, 8, 1, '#c8402e'); }
      if (s.acc === 'cocar' || s.acc === 'skull') {
        // cocar: penas em leque saindo do alto da cabeça (vermelhas, brancas e escuras, pontas contrastando)
        const cores = ['#a8302a', '#e8dcc0', '#c8402e', '#2a1a14', '#e8dcc0', '#a8302a', '#e8dcc0'], n = s.acc === 'skull' ? 5 : 7;
        for (let i = 0; i < n; i++) { const ang = -HPI * 0.92 + i * (HPI * 0.62 / (n - 1)), L2 = 6 + (i % 2) * 2, bx = hx + 2, by = hy - 1, ex = bx + Math.cos(ang) * L2, ey = by + Math.sin(ang) * L2; seg(bx, by, ex, ey, cores[i], 1); A(Math.round(ex), Math.round(ey), 1, 1, i % 2 ? '#2a1a14' : '#f4f0e8'); }
        if (s.acc === 'cocar') { A(hx - 1, hy + 1, 7, 1, '#a8302a'); A(hx + 4, hy + 1, 2, 1, '#e8dcc0'); A(hx + 1, hy + 1, 1, 1, '#e8dcc0'); }
      }
      if (s.acc === 'skull') {
        // máscara de crânio cobrindo o rosto: órbitas escuras com brilho vermelho e dentes
        A(hx + 1, hy - 1, 6, 5, '#e8e0d0'); A(hx + 1, hy - 1, 6, 1, '#f8f4ec'); A(hx + 6, hy, 1, 3, '#c8c0b0');
        A(hx + 3, hy + 1, 1, 2, '#120a08'); A(hx + 5, hy + 1, 1, 2, '#120a08'); A(hx + 5, hy + 1, 1, 1, '#ff4a2a'); A(hx + 4, hy + 3, 1, 1, '#3a3028');
        A(hx + 2, hy + 4, 5, 1, '#e8e0d0'); A(hx + 3, hy + 4, 1, 1, '#3a3028'); A(hx + 5, hy + 4, 1, 1, '#3a3028');
      }
      if (s.acc === 'headband') { A(hx - 1, hy + 1, 7, 1, '#a8302a'); A(hx + 1, hy + 1, 1, 1, '#e8d8c0'); A(hx + 3, hy + 1, 1, 1, '#e8d8c0'); A(hx - 3, hy - 3, 1, 4, '#efe8dc'); A(hx - 2, hy - 5, 1, 5, '#efe8dc'); A(hx - 2, hy - 5, 1, 1, '#a8302a'); A(hx - 4, hy - 1, 1, 3, '#c8402e'); }
      if (s.acc === 'knotfeather') { A(hx + 1, hy - 6, 1, 3, '#efe8dc'); A(hx + 2, hy - 5, 1, 2, '#a8302a'); A(hx, hy - 2, 3, 1, '#a8302a'); }
      if (s.acc === 'feather1') { A(hx - 1, hy - 4, 1, 4, '#e8dcc0'); A(hx, hy - 5, 1, 4, '#a8302a'); A(hx, hy - 5, 1, 1, '#2a1a14'); A(hx - 1, hy - 4, 1, 1, '#c8402e'); }
      if (s.acc === 'yellowfeathers') { A(hx - 1, hy + 1, 7, 1, '#6a4a2a'); A(hx - 1, hy - 4, 1, 4, '#e8c040'); A(hx, hy - 6, 1, 5, '#f0d050'); A(hx + 1, hy - 4, 1, 3, '#c8a030'); A(hx, hy - 6, 1, 1, '#fff0a0'); }
      if (s.acc === 'redband') { A(hx - 1, hy + 1, 7, 1, '#a8302a'); A(hx - 2, hy + 1, 1, 3, '#a8302a'); }
      if (s.acc === 'strawhat') { A(hx - 1, hy - 3, 7, 3, '#e0c07a'); A(hx - 1, hy - 1, 7, 1, '#7a4a2a'); A(hx - 4, hy, 13, 1, '#d8b46a'); A(hx - 4, hy + 1, 13, 1, '#8a6a3a'); for (let i = 0; i < 6; i++) A(hx - 3 + i * 2, hy, 1, 1, '#b8944a'); A(hx + 1, hy - 3, 1, 1, '#f0d898'); }
      if (s.acc === 'sprouts') { A(ax - 2, ay - 4, 1, 4, '#6fd36a'); A(ax, ay - 5, 1, 5, '#8fe37a'); A(ax + 2, ay - 3, 1, 3, '#6fd36a'); A(ax - 3, ay, 7, 1, '#c8402e'); }
      // arma na mão da frente, depois o braço por cima
      const [eF, hF0] = arm(shF, P.af);
      const hF = P.mouth ? [hx + 6, hy + 4] : hF0;
      const d = [Math.sin(P.wa), Math.cos(P.wa)], wood = '#8a6a3a', metal = '#d8d8d0';
      if (s.weapon && !P.noWeapon) {
        if (s.weapon === 'spear' && s.wstyle === 'tribal') {
          // lança rudimentar: haste escura, amarração clara, penas vermelhas penduradas e ponta de pedra em folha
          const n = [Math.cos(P.wa), -Math.sin(P.wa)], at = L2 => [hF[0] + d[0] * L2, hF[1] + d[1] * L2];
          seg(hF[0] - d[0] * 8, hF[1] - d[1] * 8, at(19)[0], at(19)[1], '#4a2a1a', 1);
          const [bx, by] = at(17); A(Math.round(bx), Math.round(by), 1, 1, '#e8d8c0');
          for (const o of [-1, 1]) { const fx = Math.round(bx + n[0] * o * 2), fy = Math.round(by + n[1] * o * 2); A(fx, fy, 1, 3, '#a01e1e'); A(fx, fy + 3, 1, 1, '#e8d8c0'); }
          for (let L2 = 20; L2 <= 24; L2++) { const [px, py] = at(L2), w2 = L2 < 23 ? 1 : 0; for (let k = -w2; k <= w2; k++) A(Math.round(px + n[0] * k), Math.round(py + n[1] * k), 1, 1, k ? '#a8a094' : '#e0d8cc'); }
        } else if (s.weapon === 'spear') { seg(hF[0] - d[0] * 8, hF[1] - d[1] * 8, hF[0] + d[0] * 19, hF[1] + d[1] * 19, wood, 1); const tx = Math.round(hF[0] + d[0] * 21), ty = Math.round(hF[1] + d[1] * 21); A(tx - 1, ty - 1, 3, 3, metal); A(Math.round(hF[0] + d[0] * 23), Math.round(hF[1] + d[1] * 23), 1, 1, metal); }
        if (s.weapon === 'paddle') {
          // remo: cabo de madeira e pá larga na ponta
          const n = [Math.cos(P.wa), -Math.sin(P.wa)], at = L2 => [hF[0] + d[0] * L2, hF[1] + d[1] * L2];
          seg(hF[0] - d[0] * 6, hF[1] - d[1] * 6, at(14)[0], at(14)[1], '#8a5a2a', 1);
          for (let L2 = 14; L2 <= 22; L2++) { const [px, py] = at(L2), w2 = L2 < 15 || L2 > 21 ? 1 : 2; for (let k = -w2; k <= w2; k++) A(Math.round(px + n[0] * k), Math.round(py + n[1] * k), 1, 1, Math.abs(k) === w2 ? '#5a3a1a' : '#9a6a32'); }
          A(Math.round(hF[0] - d[0] * 6) - 1, Math.round(hF[1] - d[1] * 6) - 1, 2, 2, '#6a4220');
        }
        if (s.weapon === 'staff' && s.wstyle === 'leafy') {
          // cajado vivo: galho torto com folhas e um broto enrolado no alto
          seg(hF[0] - d[0] * 9, hF[1] - d[1] * 9, hF[0] + d[0] * 14, hF[1] + d[1] * 14, '#6a4a2a', 1);
          const tx = hF[0] + d[0] * 15, ty = hF[1] + d[1] * 15;
          for (const [ox, oy, c2] of [[-2, -1, '#4a8a3a'], [2, 0, '#6aaa4a'], [-1, -3, '#5a9a3a'], [1, -4, '#8fd06a'], [3, -2, '#4a8a3a'], [-3, 1, '#6aaa4a'], [0, 3, '#4a8a3a']]) A(Math.round(tx + ox), Math.round(ty + oy), 1, 1, c2);
          A(Math.round(tx), Math.round(ty) - 1, 2, 2, '#7a5a32'); A(Math.round(tx + 2), Math.round(ty - 5), 1, 1, '#c8f060');
        } else if (s.weapon === 'staff') { seg(hF[0] - d[0] * 9, hF[1] - d[1] * 9, hF[0] + d[0] * 14, hF[1] + d[1] * 14, wood, 1); A(Math.round(hF[0] + d[0] * 15) - 1, Math.round(hF[1] + d[1] * 15) - 1, 3, 3, '#a87a4a'); }
        if (s.weapon === 'pick' || s.weapon === 'axe') {
          const tc = s.toolCol || '#c8ccd4', ex = hF[0] + d[0] * 9, ey = hF[1] + d[1] * 9, n = [Math.cos(P.wa), -Math.sin(P.wa)];
          seg(hF[0] - d[0] * 2, hF[1] - d[1] * 2, ex, ey, wood, 1);
          if (s.weapon === 'pick') seg(ex - n[0] * 5 - d[0] * 2, ey - n[1] * 5 - d[1] * 2, ex + n[0] * 5 - d[0] * 2, ey + n[1] * 5 - d[1] * 2, tc, 2);
          else A(Math.round(ex + n[0]) - 1, Math.round(ey + n[1]) - 2, 3, 4, tc);
        }
        if (s.weapon === 'blowgun') { const b = P.mouth ? 1 : 4; seg(hF[0] - d[0] * b, hF[1] - d[1] * b, hF[0] + d[0] * 16, hF[1] + d[1] * 16, s.gunCol || wood, 1); if (s.gunCol) A(Math.round(hF[0] + d[0] * 16), Math.round(hF[1] + d[1] * 16), 1, 1, '#5a4a40'); }
        if (s.weapon === 'bow') {
          const n = [Math.cos(P.wa), -Math.sin(P.wa)];
          const tribal = s.wstyle === 'tribal';
          for (let k = -8; k <= 8; k++) { const bulge = 2.2 * (1 - (k / 8) ** 2), tipC = tribal && Math.abs(k) === 8 ? -1 : 0; A(Math.round(hF[0] + n[0] * k + d[0] * (bulge + tipC)), Math.round(hF[1] + n[1] * k + d[1] * (bulge + tipC)), 1, 1, tribal ? (Math.abs(k) === 5 ? '#c02a2a' : k === 0 ? '#e8d8c0' : '#7a3a22') : k === 0 ? '#c8a46a' : (s.bowCol || '#c8a46a')); }
          // arco simples de madeira e fibras: amarrações vermelhas e penas penduradas no punho
          if (tribal) { const gx = Math.round(hF[0] + d[0] * 2 - n[0] * 2), gy = Math.round(hF[1] + d[1] * 2 - n[1] * 2); A(gx, gy + 1, 1, 3, '#a01e1e'); A(gx + 1, gy + 2, 1, 2, '#c8402e'); A(gx, gy + 4, 1, 1, '#e8d8c0'); }
          const nock = [hF[0] - d[0] * (1 + P.draw * 6), hF[1] - d[1] * (1 + P.draw * 6)];
          seg(hF[0] + n[0] * 8, hF[1] + n[1] * 8, nock[0], nock[1], '#e8d8b8', 1); seg(nock[0], nock[1], hF[0] - n[0] * 8, hF[1] - n[1] * 8, '#e8d8b8', 1);
          if (P.arrow) { seg(nock[0], nock[1], hF[0] + d[0] * 5, hF[1] + d[1] * 5, '#efe0c0', 1); A(Math.round(nock[0]), Math.round(nock[1]), 1, 1, '#c8402e'); }
        }
      }
      if (P.gourd) { A(Math.round(hF[0]) - 1, Math.round(hF[1]) - 2, 3, 4, '#d8b04a'); A(Math.round(hF[0]), Math.round(hF[1]) - 3, 1, 1, '#7a5a2a'); }
      A(shF[0] - 1.5, shF[1] - 1.3, 3, 2.4, skin); A(shF[0] - 0.6, shF[1] - 1.3, 1.4, 0.7, skinL);       // deltóide com luz
      limb(shF[0], shF[1], eF[0], eF[1], 2.6, 1.9, skin, null, skinM); A((shF[0] + eF[0]) / 2 - 0.3, (shF[1] + eF[1]) / 2 - 0.6, 0.7, 0.7, skinL);                                   // bíceps
      A(eF[0] - 0.35, eF[1] - 0.35, 0.7, 0.7, skinD);                                                      // cotovelo
      limb(eF[0], eF[1], hF[0], hF[1], 2.1, 1.5, skin, null, skinM);                                     // antebraço
      A(hF[0] - 1, hF[1] - 0.8, 2.1, 2, skin); A(hF[0] + 0.6, hF[1] - 1.3, 0.8, 0.9, skin);              // mão e polegar
      A(hF[0] - 0.8, hF[1] + 0.6, 1.8, 0.6, skinD); A(hF[0] + 0.3, hF[1] - 0.8, 0.6, 0.6, skinL);        // nós dos dedos e luz
      armBand(eF, hF);
      if (s.sleeve) { limb(shF[0], shF[1], eF[0], eF[1], 2.8, 2.3, s.sleeve, '#4a64a0', '#24324e'); A(shF[0] - 1.6, shF[1] - 1.4, 3.2, 2.4, s.sleeve); }
      if (s.armPaint) A(Math.round((shF[0] + eF[0]) / 2), Math.round((shF[1] + eF[1]) / 2), 1, 1, s.armPaint);
      if (s.fur) { A(Math.round(shF[0]) - 2, Math.round(shF[1]) - 2, 4, 3, s.fur); A(Math.round(shF[0]) - 1, Math.round(shF[1]) + 1, 1, 1, '#a89878'); A(Math.round(shF[0]) + 1, Math.round(shF[1]) + 1, 1, 1, '#a89878'); }
      slash = P.slash; tip = s.weapon === 'spear' ? 22 : s.weapon === 'paddle' ? 20 : s.weapon === 'staff' ? 15 : 8;
    }
  }
  if (alpha !== undefined) c.globalAlpha = alpha;
  c.fillStyle = s.outline || '#120a08';
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillRect(snap(sx) - 0.5, snap(y + q[1]) - 0.5, q[2] + 1, q[3] + 1); }
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillStyle = flash ? '#ffffff' : q[4]; c.fillRect(snap(sx), snap(y + q[1]), q[2], q[3]); }
  if (slash) drawSlash(c, x, y, f, Object.assign({}, slash, { r: slash.r && slash.r * HUMAN_S, len: slash.len && slash.len * HUMAN_S }), [shF[0] * HUMAN_S, shF[1] * HUMAN_S], tip * HUMAN_S, s);
  if (alpha !== undefined) c.globalAlpha = 1;
}
// Rastro do golpe (o arco claro das animações de ataque)
function drawSlash(c, x, y, f, S, sh, tip, s) {
  const ox = x + f * sh[0], oy = y + sh[1], base = c.globalAlpha, esp = s.skin === SPEC.espirito.skin;
  const main = S.water ? '#bfe4f0' : esp ? '#c8b8f0' : '#e4f2f8', edge = S.water ? '#5a9ab8' : esp ? '#7a6ab0' : '#7aa8c0';
  if (S.st === 'thrust') {
    for (let i = 0; i < 3; i++) { c.globalAlpha = base * (0.8 - i * 0.2); c.fillStyle = i ? edge : main; const L2 = S.len - i * 3; c.fillRect(Math.round(f > 0 ? ox + 6 + i * 3 : ox - 6 - i * 3 - L2), Math.round(oy + 1 + (i - 1) * 3), L2, 1); }
    c.globalAlpha = base; return;
  }
  const r = S.r + tip * 0.3, n = 14, rings = S.st === 'claw' ? [r - 4, r - 2, r] : [r - 2, r - 1, r];
  for (let i = 0; i <= n; i++) {
    const ang = lerp(S.a0, S.a1, i / n), fade = i / n;
    rings.forEach((rr, j) => {
      if (S.st !== 'claw' && j === 0 && (i < 3 || i > n - 3)) return;
      c.globalAlpha = base * fade * (S.st === 'claw' ? 0.8 : j === 2 ? 0.9 : 0.6);
      c.fillStyle = j === 2 ? main : edge;
      c.fillRect(Math.round(ox + f * Math.sin(ang) * rr), Math.round(oy + Math.cos(ang) * rr), 2, 2);
    });
  }
  c.globalAlpha = base;
}

// Criança (epílogo) e ancião sentado
function drawChild(c, x, y, f) {
  const P = (dx, dy, w, h, col) => { c.fillStyle = col; c.fillRect(f > 0 ? x + dx : x - dx - w, y + dy, w, h); };
  P(-3, -15, 6, 16, '#120a08'); P(-2, -14, 4, 4, '#8a5434'); P(-3, -15, 5, 2, '#1a1210'); P(0, -12, 1, 1, '#20140e'); P(-2, -10, 4, 5, '#8a5434'); P(-2, -6, 4, 2, '#c8402e'); P(-2, -4, 1, 4, '#5e3622'); P(1, -4, 1, 4, '#8a5434');
}

// Silhueta genérica de "sombra do esquecimento" (inimigos comuns)
function pen(c, x, y, f, flash) {
  return (dx, dy, w, h, col) => { c.fillStyle = flash ? '#fff' : col; c.fillRect(Math.round(f > 0 ? x + dx : x - dx - w), Math.round(y + dy), w, h); };
}
const SHADE = '#0d0a10', SHADE2 = '#1c1622';
function drawEnemy(c, e, x, y, t, eye) {
  if (drawFauna(c, e, x, y, t)) return;
  if (drawCaveEnemy(c, e, x, y, t)) return;
  const f = e.f, k = e.type, M = faunaMotion(e, t), snap = v => Math.round(v * 2) / 2;
  const P = (dx, dy, w, h, col) => { const breathe = dy < -4 ? M.breath - M.scan * 0.5 : 0; c.fillStyle = e.flash > 0 ? '#fff' : col; c.fillRect(snap(f > 0 ? x + dx : x - dx - w), snap(y + dy + breathe), Math.max(0.5, snap(w)), Math.max(0.5, snap(h))); };
  // Olhar sob a sobrancelha e dentes claros continuam legíveis no tamanho real do jogo.
  const glare = (ex, ey, w = 2) => {
    P(ex - 0.5, ey - 0.5, w + 1, 2, '#08060b'); P(ex, ey, w, 1, eye);
    P(ex - 1, ey - 1.5, 2, 0.5, '#744557'); P(ex + 1, ey - 1, w, 0.5, '#402433');
    P(ex + w - 0.5, ey, 0.5, 0.5, '#ffe1b5');
  };
  const snarl = (mx, my, w, gape = 1) => {
    const h = 1.5 + gape;
    P(mx, my, w, h, '#050309'); P(mx + 0.5, my + h - 0.5, w - 1, 0.5, '#87313f');
    for (let i = 0; i < w - 1; i += 2) P(mx + i + 0.5, my, 0.5, i === 0 ? Math.min(h, 2) : 1, '#e8d9b9');
    P(mx + w - 1.5, my + h - 1, 0.5, 1, '#f6e7c8');
  };
  if (k === 'crawler') {
    const lg = M.moving ? Math.sin(M.stride) * 1.5 : 0, lean = -M.prep * 2 + M.hit * 3, crouch = M.prep * 1.5 + M.settle;
    P(-7 + lean * 0.3, -8 + crouch, 14, 6, SHADE); P(-5 + lean, -10 + crouch, 9, 3, SHADE); P(4 + lean, -7 + crouch, 4, 4, SHADE2);
    P(-6 + lg, -2, 1, 2, SHADE); P(-2 - lg, -2 - Math.max(0, lg), 1, 2 + Math.max(0, lg), SHADE); P(2 + lg, -2, 1, 2, SHADE); P(5 - lg, -2 - Math.max(0, -lg), 1, 2 + Math.max(0, -lg), SHADE);
    for (let i = 0; i < 4; i++) { P(-6 + i * 3 + lean * 0.3, -10 + crouch - i % 2, 1.5, 3, SHADE2); P(-7 + i * 3 + lean * 0.3, -11 + crouch - i % 2, 1, 1, '#654357'); }
    glare(5 + lean, -6.5 + crouch - M.scan, 2);
    snarl(5 + lean, -4.5 + crouch, 4, M.prep + M.hit);
    for (const foot of [-6 + lg, -2 - lg, 2 + lg, 5 - lg]) P(foot, -0.5, 2, 0.5, '#bdad95');
  } else if (k === 'flyer') {
    const flap = M.phase === 'windup' ? -8 * M.prep : M.phase === 'attack' ? 2 + M.follow * 3 : Math.sin(Math.floor(t * 24) / 12 * HPI) * (M.settle > 0 ? 3 : 6), span = M.phase === 'attack' ? 8 - M.hit * 3 : 12, warn = M.prep > 0.65;
    P(-4, -9, 8, 7, SHADE); P(-3, -11, 2, 2, SHADE); P(2, -11, 2, 2, SHADE);
    glare(1, -7, 2); P(-2, -7, 1, 1, warn ? '#ffffff' : eye); snarl(-1, -5, 4, M.prep + M.hit);
    for (const side of [-1, 1]) {
      line(c, x + f * side * 3, y - 8, x + f * side * 7, y - 7 + flap * 0.5, SHADE, 2);
      line(c, x + f * side * 7, y - 7 + flap * 0.5, x + f * side * span, y - 6 + flap, SHADE2, 1.5);
      for (let i = 0; i < 3; i++) P(side * (span - i * 2) - 0.5, -6 + flap + i * 0.5, 1, 2, '#503345');
    }
  } else if (k === 'spitter') {
    const lean = -M.prep * 2 + M.hit * 4 + (M.moving ? Math.sin(M.stride) * 0.8 : 0), bob = M.breath - M.scan;
    P(-5, -14 + bob, 10, 14 - bob, SHADE); P(-6, -4, 12, 4, SHADE2); P(-4 + lean, -16 + bob, 3, 2, SHADE); P(1 + lean, -17 + bob, 3, 3, SHADE);
    glare(1 + lean, -11 + bob, 2); P(-2 + lean, -11 + bob, 1, 1, eye);
    P(-6, -14 + bob, 2, 4, '#342235'); P(-7, -16 + bob, 1, 3, '#604051');
    snarl(1 + lean, -8 + bob, 5, M.prep * 2 + M.hit);
    if (M.prep || M.hit) { P(2 + lean, -8 + bob, 4, 1 + M.prep * 2 + M.hit, '#000'); P(3 + lean, -7 + bob, 2, 1, eye); }
  } else if (k === 'brute') {
    const sw = -4 * M.prep + 8 * M.hit + M.settle * 2, lift = -8 * M.prep + M.follow * 2, stride = M.moving ? Math.sin(M.stride) * 2 : 0;
    P(-8, -20, 15, 16, SHADE); P(-6, -24, 10, 6, SHADE); P(-7 + stride, -4 - Math.max(0, stride), 4, 4, SHADE); P(2 - stride, -4 - Math.max(0, -stride), 4, 4, SHADE);
    P(-8, -19, 4, 8, SHADE2); P(3, -20, 5, 7, SHADE2);
    for (const dx of [-8, -5, 5]) { P(dx, -22, 2, 4, '#342232'); P(dx + 0.5, -24, 1, 2, '#7b5262'); }
    glare(1, -21, 3); P(-1, -21, 1, 1, eye); snarl(-1, -18.5, 6, 1 + M.prep + M.hit);
    P(5 - M.prep, -18 + lift * 0.5, 4, 10 - lift * 0.3, SHADE2); P(7 + sw, -10 + lift, 5, 4, SHADE);
    for (let i = 0; i < 3; i++) { P(9 + sw + i, -7 + lift, 0.5, 2, '#d6c5a8'); P(-4 + i * 2, -12 + i, 0.5, 2, '#6d314f'); }
    if (M.hit > 0.2) for (let i = 0; i < 3; i++) line(c, x + f * (10 + sw - i), y - 13 + i * 2, x + f * (17 + sw - i), y - 9 + i * 2, '#c8402e', 0.5);
  } else if (k === 'lanceiro') {
    // sombra alta com lança: recua a lança no aviso e estoca no ataque
    const step = M.moving ? Math.sin(M.stride) * 1.5 : 0, back = -6 * M.prep, thr = 12 * M.hit + M.settle * 3;
    P(-4, -22, 8, 16, SHADE); P(-3, -26, 6, 5, SHADE); P(-4, -6, 3, 6 - step, SHADE); P(1, -6, 3, 5 + step, SHADE);
    P(-4, -25, 1, 5, '#4d2d40'); P(2, -27, 2, 2, '#604051');
    glare(0, -24, 2); snarl(-1, -22, 4, M.prep);
    P(-10 + back + thr, -15, 30, 1, '#2a2230'); P(19 + back + thr, -16, 3, 3, eye);
    P(20 + back + thr, -15, 4, 1, '#f1d8b3'); P(18 + back + thr, -17, 1, 5, '#876379');
    P(2 + (back + thr) / 2, -16 - M.prep, 4, 3, SHADE2);
    if (M.hit > 0.2) { P(22 + thr, -17, 5 + M.hit * 5, 0.5, '#8a2a2a'); P(22 + thr, -14, 3 + M.hit * 5, 0.5, '#8a2a2a'); }
  } else if (k === 'wolf') { // guardião menor (prólogo)
    const run = M.moving ? Math.sin(M.stride) * 2 : 0, crouch = M.prep * 3 + M.settle * 2, reach = M.hit * 4;
    P(-12, -12 + crouch, 20, 8, SHADE); P(-2, -15 + crouch, 10, 10, SHADE2);
    P(0, -14 + crouch, 5, 5, '#352333'); P(5, -12 + crouch, 3, 7, '#241621');
    P(6 + reach, -15 + crouch, 7, 7, SHADE); P(12 + reach, -12 + crouch, 4, 3, SHADE);
    P(7 + reach, -14 + crouch, 4, 3, '#392632'); P(11 + reach, -11.5 + crouch, 5, 1, '#593743');
    P(15.5 + reach, -12 + crouch, 1, 1.5, '#050309');
    P(-15, -14 + crouch - M.prep * 2, 4, 2, SHADE); P(-17, -16 + crouch - M.prep * 3, 3, 2, SHADE);
    P(-10 + run - reach, -4, 2, 4 - Math.max(0, run), SHADE); P(-6 - run - reach, -4, 2, 3 + Math.max(0, run), SHADE); P(2 + run + reach, -4, 2, 4 - Math.max(0, -run), SHADE); P(5 - run + reach, -4, 2, 3 + Math.max(0, -run), SHADE);
    // Crina eriçada, orelhas angulosas e mandíbula exposta mesmo no repouso.
    P(6 + reach, -18 + crouch, 3, 4, SHADE); P(6.5 + reach, -19 + crouch, 1, 2, '#704557');
    P(10 + reach, -18 + crouch, 2, 3, SHADE); P(10.5 + reach, -19 + crouch, 0.5, 2, '#704557');
    for (let i = 0; i < 6; i++) { const sx = -11 + i * 3, sy = -14 + crouch - (i % 3); P(sx, sy, 2, 3, SHADE2); P(sx - 1, sy - 2, 1, 3, '#503345'); P(sx - 1, sy - 2, 1, 0.5, '#9c6572'); }
    glare(9 + reach, -13.5 + crouch, 2.5); snarl(10.5 + reach, -10.5 + crouch, 5, M.prep + M.hit * 1.5);
    P(12 + reach, -10.5 + crouch, 1, 2.5, '#f6e7c8');
    for (const foot of [-10 + run - reach, -6 - run - reach, 2 + run + reach, 5 - run + reach]) { P(foot, -0.5, 3, 0.5, '#d6c5a8'); P(foot + 1, -1, 0.5, 1, '#ede0c2'); }
    P(-4, -10 + crouch, 3, 0.5, '#72364f'); P(-3, -9.5 + crouch, 1, 2, '#4f2940');
  }
}

function enemySlash(c, x, y, f, r) {
  for (let i = 0; i <= 10; i++) { const ang = lerp(HPI + 0.4, 0.4, i / 10); c.globalAlpha = 0.25 + i / 16; c.fillStyle = i > 6 ? '#c8402e' : '#5a1a1a'; c.fillRect(Math.round(x + f * Math.sin(ang) * r), Math.round(y + Math.cos(ang) * r), 2, 2); }
  c.globalAlpha = 1;
}

// Fogueira de histórias (ponto de descanso)
function drawFire(c, x, y, t, lit) {
  // luz no chão (só acesa), roda de pedras, lenha cruzada, chama em camadas, fagulhas e fumaça
  if (lit) { const k = 0.3 + Math.sin(t * 7) * 0.03 + Math.sin(t * 13) * 0.02; softGlow(c, x, y - 10, 46, 36, '#ffb050', k); softGlow(c, x, y - 1, 29, 6, '#ffc070', k * 0.8); }
  const stones = [[-10, 0], [-7, 1], [-3, 1], [2, 1], [6, 1], [9, 0]];
  for (const [sx, sy] of stones) { rect(c, x + sx - 2, y - 3 + sy, 4, 3, '#120a06'); rect(c, x + sx - 1, y - 2 + sy, 3, 2, '#6a6a62'); rect(c, x + sx - 1, y - 2 + sy, 2, 1, '#8a8a80'); }
  line(c, x - 7, y - 1, x + 5, y - 5, '#120a06', 3); line(c, x - 6, y - 2, x + 4, y - 5, '#6a4428', 2);
  line(c, x + 7, y - 1, x - 5, y - 5, '#120a06', 3); line(c, x + 6, y - 2, x - 4, y - 5, '#7a5230', 2);
  rect(c, x - 2, y - 3, 4, 2, '#3a2014');
  if (!lit) {
    for (let i = 0; i < 6; i++) rect(c, x - 5 + i * 2, y - 4 - (i % 2), 2, 1, Math.sin(t * 3 + i * 1.7) > 0.3 ? '#c8402e' : '#5a2a1a');
    if (Math.random() < 0.05) part(x + rnd(-3, 3), y - 5, rnd(-3, 3), -12, 1.6, '#5a5050', 2, -5);
    return;
  }
  const flick = i => Math.abs(Math.sin(t * 8 + i * 1.9)) * 0.6 + Math.abs(Math.sin(t * 13 + i)) * 0.4;
  for (let i = 0; i < 7; i++) { const fx = x - 6 + i * 2, h = (9 - Math.abs(i - 3) * 2.2) * (0.7 + flick(i) * 0.6); rect(c, fx, y - 4 - h, 2, h, '#c8402e'); }
  for (let i = 0; i < 5; i++) { const fx = x - 4 + i * 2, h = (7 - Math.abs(i - 2) * 2) * (0.7 + flick(i + 3) * 0.6); rect(c, fx, y - 4 - h, 2, h, '#f08a3a'); }
  for (let i = 0; i < 3; i++) { const fx = x - 2 + i * 2, h = (4.5 - Math.abs(i - 1) * 1.6) * (0.7 + flick(i + 7) * 0.6); rect(c, fx, y - 4 - h, 2, h, '#ffd27a'); }
  rect(c, x - 1, y - 6, 2, 2, '#fff4d0');
  if (Math.random() < 0.3) part(x + rnd(-4, 4), y - 10, rnd(-8, 8), rnd(-45, -20), rnd(0.6, 1.1), pick(['#ffb050', '#ffd27a', '#ff7a3a']), 1, -10);
  if (Math.random() < 0.08) part(x + rnd(-2, 2), y - 16, rnd(-4, 4), -14, 2, '#5a5050', 2, -3);
}
// chama-espírito (memória perdida, eco): gota de luz que tremula, com fagulhas girando em volta
function drawSparkle(c, x, y, t, col) {
  const a0 = c.globalAlpha, k = (Math.sin(t * 3) + 1) / 2, sway = Math.sin(t * 7) * 1.2;
  softGlow(c, x, y - 2, 13 + k * 2, 17 + k * 2, col, 0.3 + k * 0.1);
  const rows = [1, 1, 2, 2, 3, 3, 4, 4, 4, 3];
  c.globalAlpha = a0 * 0.9;
  rows.forEach((w, i) => { const ox = Math.round(sway * (1 - i / rows.length)) - (w >> 1); rect(c, x + ox, y - 8 + i, w, 1, col); });
  rows.forEach((w, i) => { if (i < 4 || i > 8) return; const ox = Math.round(sway * (1 - i / rows.length)) - (w >> 1) + 1; rect(c, x + ox, y - 8 + i, Math.max(1, w - 2), 1, '#fff'); });
  for (let i = 0; i < 3; i++) { const a = t * 2.2 + i * 2.1, front = Math.sin(a) > 0; c.globalAlpha = a0 * (front ? 0.9 : 0.4); rect(c, x + Math.round(Math.cos(a) * 8), y - 3 + Math.round(Math.sin(a) * 2), 1, 1, front ? '#fff' : col); }
  c.globalAlpha = a0;
}
