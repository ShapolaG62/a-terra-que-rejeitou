'use strict';
// Fauna corrompida da mata (inimigos comuns): capivara, tatu, lobo-guará, tamanduá, jaguatirica, cobra, queixada
// e urubu. Pelagem escura, veias roxas pulsando, espinhos e galhos nas costas, olhos vermelhos.

const VEIN = ['#6a2aa8', '#a04ae8', '#d08aff'];
// pelagem por fase: a terra de cada bioma se mistura no couro dos bichos, e a corrupção vai ficando mais acesa
const FUR = {
  prologo: { mix: null, k: 0, deco: null, vein: ['#4a2a6a', '#7a4aa8', '#a88ad0'] },
  amazonia: { mix: '#2e6a2a', k: 0.3, deco: 'musgo', vein: VEIN },
  cerrado: { mix: '#a05a22', k: 0.36, deco: 'brasa', vein: ['#7a2a98', '#b84ad8', '#e88aff'] },
  pantanal: { mix: '#34386a', k: 0.32, deco: 'lama', vein: ['#7a2ab0', '#b04af0', '#e09aff'] },
  caatinga: { mix: '#b8a07a', k: 0.42, deco: 'osso', vein: ['#8a1ab0', '#c03af0', '#f08aff'] },
  mata: { mix: '#123a48', k: 0.42, deco: 'cristal', vein: ['#9a1ac0', '#d02af8', '#ff8aff'] },
};
FUR.coracao = FUR.mata;
const TINTS = new Map();
function furTint(col, fur) {
  if (!fur.mix || col[0] !== '#') return col;
  const key = col + fur.mix; let v = TINTS.get(key); if (v) return v;
  const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), a = h(col), b = h(fur.mix);
  v = '#' + a.map((n, i) => Math.round(n + (b[i] - n) * fur.k).toString(16).padStart(2, '0')).join(''); TINTS.set(key, v); return v;
}
function drawFauna(c, e, x, y, t) {
  const fur = FUR[G.lvl && G.lvl.biome] || FUR.prologo, V = fur.vein;
  const R = [], f = e.f || 1, flash = e.flash > 0 || (e.stag > 0 && Math.sin(t * 40) > 0);
  const A = (dx, dy, w, h, col) => R.push([dx, dy, w, h, col]);
  const T = (dx, dy, col) => R.push([dx, dy, 1, 1, col, 1]); // traço fino, sem contorno (espinhos e galhos)
  const thin = (x0, y0, x1, y1, col) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) T(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col); };
  const blob = (cx, cy, rx, ry, col) => { for (let dy = -ry; dy <= ry; dy++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2))); A(Math.round(cx - hw), Math.round(cy + dy), hw * 2 || 1, 1, col); } };
  const seg = (x0, y0, x1, y1, th, col) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) A(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), th, th, col); };
  const raw = fn => { const n = R.length; fn(); for (let i = n; i < R.length; i++) R[i][6] = 1; }; // sem tingir (olhos, veias, enfeites)
  const pulse = (Math.sin(t * 4 + e.x * 0.1) + 1) / 2, vein = pulse > 0.6 ? V[2] : V[1];
  const veins = pts => raw(() => { for (let i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 1, i % 2 ? V[0] : vein); });
  const spikes = (x0, x1, yy, n, len, col) => { for (let i = 0; i < n; i++) { const sx = x0 + (x1 - x0) * i / Math.max(1, n - 1), l2 = len * (0.6 + hash(i + 3) * 0.6), tilt = -1 - hash(i) * 2; thin(sx, yy, sx + tilt, yy - l2, col); T(Math.round(sx + tilt), Math.round(yy - l2), V[1]); } };
  const branches = (bx, by, col) => { thin(bx, by, bx - 2, by - 8, col); thin(bx - 1, by - 4, bx + 2, by - 7, col); thin(bx + 5, by, bx + 4, by - 9, col); thin(bx + 4, by - 6, bx + 7, by - 9, col); thin(bx + 4, by - 5, bx + 1, by - 8, col); T(bx - 2, by - 9, V[1]); T(bx + 7, by - 10, V[1]); };
  const eye = (ex, ey) => raw(() => { A(ex, ey, 2, 1, '#ff2a3a'); A(ex + 1, ey - 1, 1, 1, '#ffb0b8'); });
  // enfeite da fase nas costas (back: pontos do dorso) e na barriga (belly: altura de baixo do corpo)
  const deco = (back, belly) => raw(() => back.forEach(([bx, by], i) => {
    const h1 = hash(i * 7 + e.type.length);
    if (fur.deco === 'musgo') { A(bx - 1, by, 3, 1, '#3a7a32'); A(bx, by - 1, 2, 1, '#6ab04a'); if (h1 > 0.5) { T(bx + 1, by - 2, '#8fd06a'); T(bx + 2, by - 3, '#8fd06a'); } }
    else if (fur.deco === 'brasa') { thin(bx, by, bx - 1, by - 3 - (h1 * 2 | 0), '#c8a050'); T(bx + 1, by - 1, pulse > 0.5 ? '#ffb04a' : '#e0602a'); }
    else if (fur.deco === 'lama') { A(bx - 1, by, 3, 1, '#4a3422'); thin(bx, belly, bx, belly + 1 + (h1 * 3 | 0), '#3a2a1a'); T(bx + 1, by - 1, '#a8c8e8'); }
    else if (fur.deco === 'osso') { A(bx - 1, by - 1, 3, 2, '#e0d4b8'); T(bx, by - 1, '#8a7a60'); thin(bx + 1, by - 1, bx + 2, by - 4, '#d8ccb0'); }
    else if (fur.deco === 'cristal') { const l = 3 + (h1 * 3 | 0); thin(bx, by, bx - 1, by - l, pulse > 0.5 ? '#7af0e0' : '#4ac8c8'); T(bx - 1, by - l - 1, '#e0fff8'); }
  }));
  const moving = Math.abs(e.vx) > 4, ph = e.t * (Math.abs(e.vx) > 60 ? 18 : 11);
  const legs = (xs, top, len, th, col, amp, lift) => xs.forEach((lx, i) => { const p = moving ? Math.sin(ph + i * HPI) : 0, fx = lx + p * amp, up = moving ? Math.max(0, -Math.cos(ph + i * HPI)) * lift : 0; seg(lx, top, fx, -1 - up, th, col); A(Math.round(fx) - 1, Math.round(-1 - up), th + 1, 1, '#120a0a'); });
  const k = e.type, wind = e.wind > 0, swing = e.swing > 0;
  if (k === 'capivara') {
    const lean = wind ? -2 : swing ? 3 : 0;
    legs([-7, -4, 5, 8], -5, 5, 2, '#2a3420', 2, 2);
    blob(lean * 0.3, -9, 11, 5, '#3e4c2c'); blob(-1, -11, 9, 3, '#4e5e36'); A(-10, -8, 3, 3, '#2a3420');
    A(8 + lean, -13, 7, 6, '#3e4c2c'); A(13 + lean, -11, 2, 4, '#2a3420'); A(9 + lean, -14, 2, 2, '#2a3420'); eye(11 + lean, -12);
    spikes(-9, 6, -13, 7, 5, '#2a1830'); veins([[-8, -7], [-3, -10], [2, -8], [7, -11]]); deco([[-6, -14], [-1, -15], [4, -14]], -5);
  } else if (k === 'tatu') {
    if (Math.abs(e.vx) > (e.spd || 32) * 1.5) {
      // enrolado: bola de carapaça com as cintas girando
      const rot = (e.x * 0.25) % 6;
      blob(0, -6, 6, 6, '#5a5e64'); blob(-1, -7, 4, 4, '#6e737a');
      for (let i = 0; i < 3; i++) { const a = rot + i * HPI * 2 / 3; seg(Math.cos(a) * 5, -6 + Math.sin(a) * 5, -Math.cos(a) * 5, -6 - Math.sin(a) * 5, 1, '#34383c'); }
      raw(() => { A(Math.round(Math.cos(rot) * 3), Math.round(-6 + Math.sin(rot) * 3), 1, 1, vein); A(-2, -10, 2, 1, '#8a9098'); });
      deco([[0, -12]], -1);
    } else {
      // tatu-peba: casco em cúpula com cintas, escudos na frente e atrás, cabeça cônica com orelhas e rabo anelado
      legs([-4, -1, 3, 5], -3, 3, 2, '#3a3430', 1, 1);
      seg(-7, -3, -10, -2, 2, '#5a5e64'); seg(-10, -2, -13, -1, 1, '#5a5e64'); T(-9, -3, '#34383c'); T(-11, -2, '#34383c');
      blob(0, -5, 7, 4, '#5a5e64'); blob(-1, -6, 5, 2, '#6e737a');
      for (let i = -3; i <= 3; i += 2) A(i, -8, 1, 6, '#34383c');
      for (let i = -6; i <= 5; i += 3) A(i, -2, 2, 1, '#44484e');
      A(-5, -7, 1, 1, '#8a9098'); A(-1, -9, 2, 1, '#8a9098'); A(4, -7, 1, 1, '#8a9098');
      A(6, -6, 3, 3, '#7a6a62'); seg(8, -5, 11, -3, 2, '#7a6a62'); A(12, -3, 1, 1, '#1a1010'); A(9, -3, 3, 1, '#5a4a44');
      A(6, -8, 1, 2, '#7a6a62'); A(7, -9, 1, 2, '#6a5a54');
      eye(8, -6);
      veins([[-3, -7], [-3, -3]]); veins([[1, -8], [1, -4], [3, -3]]);
      deco([[-4, -8], [0, -10], [4, -8]], -1);
    }
  } else if (k === 'lobo' || k === 'jaguatirica') {
    const wolf = k === 'lobo', st = e.st || 'run';
    const body = wolf ? ['#4a2c22', '#6a3e2c', '#2a1814'] : ['#1a1426', '#2a2238', '#0e0a16'];
    const crouch = st === 'wind' ? 3 : 0, stretch = st === 'leap', legLen = wolf ? 9 : 6, top = -legLen - 1 + crouch;
    if (stretch) { seg(-6, top, -12, top + 4, 2, body[2]); seg(-3, top, -9, top + 5, 2, body[0]); seg(6, top, 13, top + 2, 2, body[2]); seg(8, top, 15, top + 3, 2, body[0]); }
    else legs([-6, -3, 5, 8], top, legLen, 2, body[2], wolf ? 3 : 4, 2);
    blob(1, top - 3, 9, 4, body[0]); blob(0, top - 5, 7, 2, body[1]);
    if (wolf) { A(-3, top - 8, 7, 3, '#1a0e0a'); } else for (let i = -6; i <= 6; i += 3) A(i, top - 4 + (i % 2), 1, 1, '#4a3a5a');
    const hx = 10, hy = top - 6 + (st === 'wind' ? 2 : 0);
    A(hx - 1, hy, 5, 5, body[0]); A(hx + 4, hy + 2, wolf ? 5 : 3, 2, body[0]); A(hx + (wolf ? 8 : 6), hy + 2, 1, 1, '#120a0a');
    A(hx, hy - 3, 2, 3, body[0]); A(hx + 2, hy - 2, 1, 2, body[2]); eye(hx + 2, hy + 1);
    if (st === 'wind' || stretch) A(hx + 4, hy + 4, 3, 1, '#a01828');
    seg(-9, top - 3, -14, top - (wolf ? 1 : 6), wolf ? 3 : 2, wolf ? '#2a1814' : body[0]);
    branches(-5, top - 6, '#3a2a24'); veins([[-7, top - 2], [-2, top - 4], [3, top - 2], [8, top - 4]]); deco([[-7, top - 7], [1, top - 8], [6, top - 7]], top + 1);
  } else if (k === 'tamandua') {
    const lean = wind ? -3 : swing ? 4 : 0, raise = wind ? -6 : swing ? 4 : 0;
    legs([-7, -4, 4], -6, 6, 2, '#1a1a20', 2, 1);
    blob(lean * 0.3, -10, 10, 5, '#3a3a44'); seg(-6, -14, 6, -8, 3, '#d8d4cc'); seg(-6, -15, 6, -9, 1, '#1a1a20');
    seg(8 + lean, -11, 18 + lean, -7, 2, '#4a4a54'); A(18 + lean, -7, 2, 1, '#1a1a20'); eye(10 + lean, -12);
    seg(7, -8, 11 + raise, -2 + raise * 0.5, 2, '#1a1a20'); for (let i = 0; i < 3; i++) A(11 + raise + i, -2 + raise * 0.5, 1, 3, '#e8e0d0');
    for (let i = 0; i < 6; i++) seg(-9, -11, -16 - i, -18 + i * 2, 1, i % 2 ? '#5a4a3a' : '#7a6a54');
    spikes(-6, 4, -14, 4, 5, '#2a1830'); veins([[-7, -9], [-1, -12], [4, -9]]); deco([[-8, -15], [0, -16], [6, -14]], -6);
    if (swing) enemySlash(c, x + f * 12, y - 8, f, 12);
  } else if (k === 'queixada') {
    const lean = wind ? -3 : swing ? 4 : 0;
    legs([-7, -4, 4, 7], -5, 5, 2, '#1e140e', 2, 2);
    blob(lean * 0.3, -9, 10, 5, '#3a2a1e'); blob(-2, -12, 8, 2, '#2a1c12');
    for (let i = -8; i <= 4; i += 2) A(i, -15 - (i % 4 === 0 ? 1 : 0), 1, 3 + (hash(i + 9) * 2 | 0), '#1a100a');
    A(8 + lean, -12, 6, 6, '#3a2a1e'); A(14 + lean, -9, 2, 3, '#5a4030'); A(15 + lean, -8, 1, 1, '#120a0a');
    seg(12 + lean, -7, 14 + lean, -11, 1, '#efe8dc'); eye(10 + lean, -11);
    veins([[-7, -8], [-2, -11], [3, -8], [7, -10]]); deco([[-5, -15], [3, -14]], -5);
    if (swing) enemySlash(c, x + f * 14, y - 8, f, 10);
  } else if (k === 'cobra') {
    const back = wind ? -3 : 0, open = wind || e.cd > 1.6;
    for (let i = 0; i < 16; i++) { const a = i / 16 * HPI * 2, cx = -2 + Math.cos(a) * 6, cy = -3 + Math.sin(a) * 2.5; A(Math.round(cx), Math.round(cy), 3, 2, i % 4 < 2 ? '#a01e24' : '#1a0e10'); }
    const neck = [[2, -4], [4 + back * 0.3, -8], [5 + back, -12]];
    for (let i = 0; i < neck.length - 1; i++) seg(neck[i][0], neck[i][1], neck[i + 1][0], neck[i + 1][1], 3, i ? '#c02a30' : '#a01e24');
    blob(6 + back, -13, 3, 2, '#c02a30'); A(4 + back, -12, 2, 3, '#7a1418'); eye(7 + back, -14);
    if (open) { A(9 + back, -13, 2, 1, '#1a0a0a'); A(10 + back, -12, 2, 1, '#e8e0d0'); A(11 + back, -11, 2, 1, '#8a2ad0'); }
    veins([[-6, -3], [-2, -4], [2, -3]]); deco([[-6, -5], [-1, -6]], -1);
  } else if (k === 'urubu') {
    const flap = e.mode === 'swoop' ? 0 : e.mode === 'aim' ? 2 : Math.sin(t * (e.mode === 'tired' ? 8 : 16)) > 0 ? 1 : -1;
    blob(0, -6, 5, 3, '#14101a'); A(-7, -5, 3, 2, '#14101a');
    A(4, -9, 3, 3, '#c87a7a'); A(7, -8, 2, 1, '#e8d0a8'); eye(5, -9);
    if (flap === 0) { seg(-2, -7, -8, -3, 2, '#1e1828'); }
    else if (flap === 2) { seg(-1, -7, -8, -14, 2, '#1e1828'); seg(1, -7, 7, -15, 2, '#1e1828'); }
    else if (flap > 0) { seg(-1, -7, -10, -11, 2, '#1e1828'); seg(1, -7, 9, -11, 2, '#1e1828'); A(-11, -11, 2, 1, '#2a2238'); }
    else { seg(-1, -6, -10, -2, 2, '#1e1828'); seg(1, -6, 9, -2, 2, '#1e1828'); }
    veins([[-4, -6], [0, -7], [3, -6]]); deco([[-1, -9]], -4);
  } else return false;
  c.fillStyle = '#08060a';
  for (const q of R) { if (q[5]) continue; const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillRect(Math.round(sx) - 1, Math.round(y + q[1]) - 1, q[2] + 2, q[3] + 2); }
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillStyle = flash ? '#fff' : q[6] ? q[4] : furTint(q[4], fur); c.fillRect(Math.round(sx), Math.round(y + q[1]), q[2], q[3]); }
  if ((k === 'urubu' && e.mode === 'aim') || (k === 'cobra' && wind)) { c.globalAlpha = 0.5; ell(c, x + f * 6, y - 12, 4, 4, '#ff4a5a'); c.globalAlpha = 1; }
  return true;
}
