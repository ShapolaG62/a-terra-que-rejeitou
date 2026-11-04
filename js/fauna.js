'use strict';
// Fauna corrompida da mata (inimigos comuns): capivara, tatu, lobo-guará, tamanduá, jaguatirica, cobra, queixada
// e urubu. Silhuetas eriçadas, olhos sob sobrancelhas angulosas, presas e garras; corrupção por bioma.

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
// Doze poses por fase: o desenho acompanha o tempo real da preparação e do golpe.
function faunaMotion(e, t) {
  const motion = e.motion, legacy = e.wind > 0 || e.st === 'wind' || e.mode === 'aim' ? 'windup' : e.swing > 0 || e.st === 'leap' || e.mode === 'swoop' ? 'attack' : e.rec > 0 || e.st === 'rest' || e.mode === 'tired' ? 'recover' : Math.abs(e.vx || 0) > 4 ? 'move' : 'idle';
  const phase = motion && motion.phase || legacy;
  let p = motion && Number.isFinite(motion.progress) ? motion.progress : phase === 'windup' ? 1 - (e.wind || 0) / (e.windMax || 0.5) : phase === 'attack' ? 1 - (e.swing || 0) / (e.swingMax || 0.3) : phase === 'recover' ? 1 - (e.rec || 0) / (e.recMax || 0.6) : 0;
  p = Math.min(11, Math.floor(clamp(p, 0, 1) * 12)) / 11;
  const ease = p * p * (3 - 2 * p), stride = Number.isFinite(e.gait) ? e.gait : t * (8 + Math.abs(e.vx || 0) * 0.12);
  return { phase, p, prep: phase === 'windup' ? ease : 0, hit: phase === 'attack' ? Math.sin(p * HPI) : 0, follow: phase === 'attack' ? ease : 0, settle: phase === 'recover' ? 1 - ease : 0,
    moving: phase === 'move' || Math.abs(e.vx || 0) > 4, stride: Math.floor(stride / (HPI * 2) * 12) / 12 * HPI * 2,
    breath: Math.round(Math.sin(t * 2.4 + (e.hx || 0) * 0.03) * 2) * 0.25, scan: phase === 'alert' ? Math.sin(ease * HPI) : 0,
    variant: motion && motion.variant || '' };
}
function drawFauna(c, e, x, y, t) {
  const fur = FUR[G.lvl && G.lvl.biome] || FUR.prologo, V = fur.vein;
  const R = [], f = e.f || 1, flash = e.flash > 0 || (e.stag > 0 && Math.sin(t * 40) > 0);
  const A = (dx, dy, w, h, col) => R.push([dx, dy, w, h, col]);
  const T = (dx, dy, col) => R.push([dx, dy, 1, 1, col, 1]); // traço fino, sem contorno (espinhos e galhos)
  const snap = v => Math.round(v * 2) / 2;
  const thin = (x0, y0, x1, y1, col) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) R.push([snap(x0 + (x1 - x0) * i / n), snap(y0 + (y1 - y0) * i / n), 0.5, 0.5, col, 1]); };
  const blob = (cx, cy, rx, ry, col) => { for (let dy = -ry; dy <= ry; dy += 0.5) { const hw = snap(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2))); A(snap(cx - hw), snap(cy + dy), hw * 2 || 0.5, 0.5, col); } };
  const seg = (x0, y0, x1, y1, th, col) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)); for (let i = 0; i <= n; i++) A(snap(x0 + (x1 - x0) * i / n), snap(y0 + (y1 - y0) * i / n), th, th, col); };
  const group = (dx, dy, fn) => { const n = R.length; fn(); for (let i = n; i < R.length; i++) { R[i][0] += dx; R[i][1] += dy; } };
  const raw = fn => { const n = R.length; fn(); for (let i = n; i < R.length; i++) R[i][6] = 1; }; // sem tingir (olhos, veias, enfeites)
  const pulse = (Math.sin(t * 4 + e.x * 0.1) + 1) / 2, vein = pulse > 0.6 ? V[2] : V[1];
  const veins = pts => raw(() => { for (let i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 1, i % 2 ? V[0] : vein); });
  const spikes = (x0, x1, yy, n, len, col) => { for (let i = 0; i < n; i++) { const sx = x0 + (x1 - x0) * i / Math.max(1, n - 1), l2 = len * (0.6 + hash(i + 3) * 0.6), tilt = -1 - hash(i) * 2; thin(sx, yy, sx + tilt, yy - l2, col); T(Math.round(sx + tilt), Math.round(yy - l2), V[1]); } };
  const branches = (bx, by, col) => { thin(bx, by, bx - 2, by - 8, col); thin(bx - 1, by - 4, bx + 2, by - 7, col); thin(bx + 5, by, bx + 4, by - 9, col); thin(bx + 4, by - 6, bx + 7, by - 9, col); thin(bx + 4, by - 5, bx + 1, by - 8, col); T(bx - 2, by - 9, V[1]); T(bx + 7, by - 10, V[1]); };
  // A sobrancelha desce na direção do focinho; o olho continua legível em cada paleta.
  const eye = (ex, ey) => raw(() => {
    A(ex - 0.5, ey - 0.5, 3, 2, '#160b12'); A(ex, ey, 2.5, 1, '#ef2635'); A(ex + 1.5, ey, 0.5, 0.5, '#ffd79a');
    A(ex - 1, ey - 1.5, 2, 1, '#0c080c'); A(ex + 1, ey - 1, 2, 0.5, '#0c080c');
  });
  const snarl = (mx, my, width, gape = 0, tusks = false) => raw(() => {
    const open = snap(1 + gape);
    A(mx, my, width, open + 1, '#10090d'); A(mx + 0.5, my + open, Math.max(1, width - 1), 0.5, '#8a2a32');
    for (let i = 0; i < 2; i++) {
      const fx = mx + 0.5 + i * Math.max(1, width - 2);
      A(fx, my, 1, tusks ? 2.5 : 1.5, '#e8dcc0'); A(fx + 0.5, my + (tusks ? 2 : 1), 0.5, 1, '#ad9c83');
    }
    A(mx + width - 1.5, my + open + 0.5, 1, 0.5, '#dbccb0');
  });
  // enfeite da fase nas costas (back: pontos do dorso) e na barriga (belly: altura de baixo do corpo)
  const deco = (back, belly) => raw(() => back.forEach(([bx, by], i) => {
    const h1 = hash(i * 7 + e.type.length);
    if (fur.deco === 'musgo') { A(bx - 1, by, 3, 1, '#3a7a32'); A(bx, by - 1, 2, 1, '#6ab04a'); if (h1 > 0.5) { T(bx + 1, by - 2, '#8fd06a'); T(bx + 2, by - 3, '#8fd06a'); } }
    else if (fur.deco === 'brasa') { thin(bx, by, bx - 1, by - 3 - (h1 * 2 | 0), '#c8a050'); T(bx + 1, by - 1, pulse > 0.5 ? '#ffb04a' : '#e0602a'); }
    else if (fur.deco === 'lama') { A(bx - 1, by, 3, 1, '#4a3422'); thin(bx, belly, bx, belly + 1 + (h1 * 3 | 0), '#3a2a1a'); T(bx + 1, by - 1, '#a8c8e8'); }
    else if (fur.deco === 'osso') { A(bx - 1, by - 1, 3, 2, '#e0d4b8'); T(bx, by - 1, '#8a7a60'); thin(bx + 1, by - 1, bx + 2, by - 4, '#d8ccb0'); }
    else if (fur.deco === 'cristal') { const l = 3 + (h1 * 3 | 0); thin(bx, by, bx - 1, by - l, pulse > 0.5 ? '#7af0e0' : '#4ac8c8'); T(bx - 1, by - l - 1, '#e0fff8'); }
  }));
  const M = faunaMotion(e, t), ph = M.stride, moving = M.moving;
  const bob = moving ? Math.abs(Math.sin(ph * 2)) * 0.7 : M.breath;
  const legs = (xs, top, len, th, col, amp, lift) => xs.forEach((lx, i) => {
    const phase = ph + (i % 2 ? HPI : 0) + (i > 1 ? 0.7 : 0), step = moving ? Math.sin(phase) : 0;
    const fx = lx + step * amp - M.prep * (i < 2 ? 1 : -1), up = moving ? Math.max(0, -Math.cos(phase)) * lift : 0;
    const ky = top * 0.45 - up * 0.4, kx = lx + step * amp * 0.3 + (i < 2 ? -0.5 : 0.5);
    seg(lx, top, kx, ky, th, col); seg(kx, ky, fx, -1 - up, Math.max(1, th - 0.5), col); A(snap(fx) - 0.5, snap(-1 - up), th + 0.5, 0.75, '#120a0a');
    raw(() => { A(snap(fx) + th - 0.5, snap(-up), 1.5, 0.5, '#b7aa91'); A(snap(fx) + th - 1, snap(-up) + 0.5, 1, 0.5, '#e1d3b8'); });
  });
  const k = e.type, wind = M.phase === 'windup', swing = M.phase === 'attack';
  let claw = null;
  if (k === 'capivara') {
    const lean = -2.5 * M.prep + 3 * M.hit + M.follow * 0.9 + M.settle * 1.5, crouch = 1.5 * M.prep + M.settle * 1.5;
    legs([-7, -4, 5, 8], -5 + crouch, 5, 2, '#2a3420', 2.3, 2);
    group(lean * 0.35, bob + crouch, () => {
      blob(0, -9, 11, 5, '#3e4c2c'); blob(-1, -11, 9, 3, '#4e5e36'); A(-10, -8, 3, 3, '#2a3420');
      spikes(-9, 6, -13, 7, 6, '#2a1830'); seg(-7, -13, -5, -17, 2, '#263023'); seg(0, -13, 1, -17, 1.5, '#263023'); veins([[-8, -7], [-3, -10], [2, -8], [7, -11]]); deco([[-6, -14], [-1, -15], [4, -14]], -5);
    });
    group(lean, bob + crouch - M.scan * 1.5, () => {
      A(8, -13, 7, 6, '#3e4c2c'); A(13, -11 + M.hit, 2, 4, '#2a3420'); A(9, -14 - M.scan, 2, 2, '#2a3420'); A(8, -13, 4, 1, '#647047'); eye(11, -12); snarl(12, -9, 3, M.prep + M.hit);
      if (wind) thin(14, -9, 15 + M.prep, -9 + M.prep, '#a8805a');
    });
  } else if (k === 'tatu') {
    const tuck = wind ? M.prep : swing ? 1 : M.settle, rolling = swing || Math.abs(e.vx) > (e.spd || 32) * 1.5;
    if (rolling) {
      // enrolado: bola de carapaça com as cintas girando
      const rot = ph + M.p * HPI * 2;
      blob(0, -6, 6, 6, '#5a5e64'); blob(-1, -7, 4, 4, '#6e737a');
      for (let i = 0; i < 3; i++) { const a = rot + i * HPI * 2 / 3; seg(Math.cos(a) * 5, -6 + Math.sin(a) * 5, -Math.cos(a) * 5, -6 - Math.sin(a) * 5, 1, '#34383c'); }
      raw(() => { A(Math.round(Math.cos(rot) * 3), Math.round(-6 + Math.sin(rot) * 3), 1, 1, vein); A(-2, -10, 2, 1, '#8a9098'); });
      for (let i = 0; i < 5; i++) { const a = rot + i * HPI * 2 / 5; seg(Math.cos(a) * 5, -6 + Math.sin(a) * 5, Math.cos(a) * 7.5, -6 + Math.sin(a) * 7.5, 1, '#3a2a42'); }
      deco([[0, -12]], -1);
    } else {
      // tatu-peba: casco em cúpula com cintas, escudos na frente e atrás, cabeça cônica com orelhas e rabo anelado
      legs([-4 + tuck, -1, 3, 5 - tuck], -3 + tuck, 3, 2, '#3a3430', 1.4, 1.4);
      seg(-7, -3, -10 + tuck * 3, -2 - tuck, 2, '#5a5e64'); seg(-10 + tuck * 3, -2 - tuck, -13 + tuck * 7, -1 - tuck * 2, 1, '#5a5e64');
      group(0, bob - tuck, () => {
      blob(0, -5, 7, 4, '#5a5e64'); blob(-1, -6, 5, 2, '#6e737a');
      for (let i = -3; i <= 3; i += 2) A(i, -8, 1, 6, '#34383c');
      for (let i = -6; i <= 5; i += 3) A(i, -2, 2, 1, '#44484e');
      A(-5, -7, 1, 1, '#8a9098'); A(-1, -9, 2, 1, '#8a9098'); A(4, -7, 1, 1, '#8a9098');
      for (let i = -5; i <= 4; i += 3) { seg(i, -8, i - 1, -11, 1.5, '#34303e'); raw(() => A(i - 1, -11, 1, 0.5, '#a899b5')); }
      group(-tuck * 5, tuck * 1.5 - M.scan, () => {
        A(6, -6, 3, 3, '#7a6a62'); seg(8, -5, 11, -3, 2, '#7a6a62'); A(12, -3, 1, 1, '#1a1010'); A(9, -3, 3, 1, '#5a4a44');
        A(6, -8 - M.scan, 1, 2, '#7a6a62'); A(7, -9, 1, 2, '#6a5a54'); eye(8, -6); snarl(10, -3, 2, tuck * 0.5);
      });
      veins([[-3, -7], [-3, -3]]); veins([[1, -8], [1, -4], [3, -3]]);
      deco([[-4, -8], [0, -10], [4, -8]], -1);
      });
    }
  } else if (k === 'lobo' || k === 'jaguatirica') {
    const wolf = k === 'lobo';
    const body = wolf ? ['#512b20', '#87492c', '#211214'] : ['#211a2c', '#45314e', '#0d0a13'];
    const crouch = 3 * M.prep + 1.8 * M.settle, stretch = swing, legLen = wolf ? 9 : 6, top = -legLen - 1 + crouch + bob;
    if (stretch) {
      const reach = Math.sin(M.p * HPI) * 5;
      seg(-6, top, -8 - reach, top + 3 + M.follow * 3, 2, body[2]); seg(-3, top, -6 - reach, top + 4, 2, body[0]);
      seg(6, top, 9 + reach, top + 2 + M.follow * 3, 2, body[2]); seg(8, top, 11 + reach, top + 3 + M.follow * 3, 2, body[0]);
    }
    else legs([-6, -3, 5, 8], top, legLen, 2, body[2], wolf ? 3 : 4, 2);
    blob(1, top - 3, 9, 4, body[0]); blob(0, top - 5, 7, 2, body[1]);
    // Cernelha forte e juba em pontas, sem alterar o corpo físico do animal.
    blob(6, top - 4.5, 4.5, 4.5, body[0]); seg(5, top - 7, 8, top - 9, 2, body[1]);
    if (wolf) {
      A(-4, top - 8, 10, 3, '#160e12');
      for (let i = 0; i < 5; i++) seg(-6 + i * 2.5, top - 6, -8 + i * 2.5, top - 10 - (i % 2), 2, '#211219');
      A(4, top - 5, 2, 3, '#9c5d38');
    } else {
      for (let i = -6; i <= 6; i += 3) A(i, top - 4 + (i % 2), 1.5, 1, '#73566e');
      spikes(-5, 5, top - 6, 4, 3.5, '#1a1023');
    }
    const hx = 10 - M.prep * 1.5 + M.hit * 2.5, hy = top - 6 + M.prep * 2 - M.scan * 2;
    A(hx - 1, hy, 6, 5, body[0]); A(hx + 3, hy + 1.5, wolf ? 6 : 4, 2, body[1]); A(hx + (wolf ? 8 : 6), hy + 2, 1.5, 1, '#10090c');
    // Orelha pontuda, bochecha eriçada e mandíbula sempre tensa; abre mais no aviso e no bote.
    seg(hx - 0.5, hy, hx - 1.5, hy - (wolf ? 5 : 3), 1.5, body[0]); A(hx - 1, hy - 3, 0.5, 2, '#b07b61');
    seg(hx - 1, hy + 3, hx - 3, hy + 5, 1.5, body[2]); A(hx + 1, hy - 1, 3, 1, body[1]);
    eye(hx + 2, hy + 1); snarl(hx + 4, hy + 3.5, wolf ? 5 : 3.5, 0.5 + M.prep + M.hit * 1.5);
    A(hx + 2, hy + 5 + M.prep + M.hit, wolf ? 5 : 4, 1, body[2]);
    if (stretch) raw(() => { A(10 + M.hit * 5, top + 3 + M.follow * 3, 2.5, 0.5, '#e6d8be'); A(12 + M.hit * 5, top + 4 + M.follow * 3, 2, 0.5, '#c1af91'); });
    const tailLift = Math.sin(ph * 0.5 + 0.7) * 2 - M.prep * 3 + M.hit * 3;
    seg(-9, top - 3, -12, top - (wolf ? 1 : 4) + tailLift * 0.5, wolf ? 3 : 2, body[2]);
    seg(-12, top - (wolf ? 1 : 4) + tailLift * 0.5, -16, top - (wolf ? 1 : 6) + tailLift, wolf ? 2 : 1.5, body[0]);
    branches(-5, top - 6, '#3a2a24'); veins([[-7, top - 2], [-2, top - 4], [3, top - 2], [8, top - 4]]); deco([[-7, top - 7], [1, top - 8], [6, top - 7]], top + 1);
  } else if (k === 'tamandua') {
    const lean = -2.5 * M.prep + 3 * M.hit + M.settle, armX = 10 - M.prep * 5 + M.hit * (M.variant === 'lunge' ? 11 : 8), armY = -3 - M.prep * 15 + M.follow * 3 - M.settle * 2;
    legs([-7, -4, 4], -6 + M.settle, 6, 2, '#1a1a20', 2.5, 1.5);
    group(lean * 0.35, bob, () => { blob(0, -10, 10, 5, '#3a3a44'); seg(-6, -14, 6, -8, 3, '#d8d4cc'); seg(-6, -15, 6, -9, 1, '#1a1a20'); });
    seg(8 + lean, -11 + bob - M.scan, 18 + lean, -7 + bob - M.scan, 2, '#4a4a54'); A(18 + lean, -7 + bob - M.scan, 2, 1, '#1a1a20'); eye(10 + lean, -12 + bob - M.scan);
    seg(2, -12 + bob, 5, -17 + bob, 2, '#24202e'); raw(() => { A(18 + lean, -6 + bob - M.scan, 2, 0.5, '#b6a6c8'); });
    const elbowX = (7 + armX) * 0.5 - M.prep * 2, elbowY = (-8 + armY) * 0.5 - 2;
    seg(7, -8 + bob, elbowX, elbowY, 2, '#1a1a20'); seg(elbowX, elbowY, armX, armY, 2, '#1a1a20');
    for (let i = 0; i < 3; i++) raw(() => { seg(armX + i, armY, armX + i + 2 + M.hit * 2, armY + 4, 1, '#e8e0d0'); A(armX + i + 2 + M.hit * 2, armY + 4, 1, 0.5, '#a99a80'); });
    for (let i = 0; i < 6; i++) seg(-9, -11 + bob, -16 - i, -18 + i * 2 + Math.sin(ph * 0.6 + i * 0.3) * 1.3, 1, i % 2 ? '#5a4a3a' : '#7a6a54');
    spikes(-6, 4, -14, 4, 5, '#2a1830'); veins([[-7, -9], [-1, -12], [4, -9]]); deco([[-8, -15], [0, -16], [6, -14]], -6);
    if (swing && M.p < 0.85) claw = { x: armX, y: armY, k: M.hit };
  } else if (k === 'queixada') {
    const lean = -3 * M.prep + 4 * M.hit + M.follow * 1.2 + M.settle * 1.5, crouch = M.prep * 1.5 + M.settle * 1.5;
    legs([-7, -4, 4, 7], -5 + crouch, 5, 2, '#1e140e', 2.5, 2);
    if (wind) { const scrape = Math.sin(M.p * HPI * 3); seg(6, -5, 7 - scrape * 2, -1 - Math.max(0, scrape), 1.5, '#3a2a1e'); }
    group(lean * 0.3, bob + crouch, () => { blob(0, -9, 10, 5, '#3a2a1e'); blob(-2, -12, 8, 2, '#2a1c12'); });
    for (let i = -8; i <= 4; i += 2) A(i, -15 - (i % 4 === 0 ? 1 : 0), 1, 3 + (hash(i + 9) * 2 | 0), '#1a100a');
    group(lean, bob + crouch + M.prep * 1.5 - M.scan, () => {
      A(8, -12, 7, 6, '#3a2a1e'); A(14, -9, 3, 3, '#6c4930'); A(16, -8, 1, 1, '#120a0a');
      seg(9, -11, 12, -13, 2, '#513625'); eye(10, -11); snarl(12, -7, 4, M.hit, true);
      raw(() => { seg(13, -6, 15, -10.5 + M.hit, 1.5, '#efe8dc'); seg(15, -7, 17, -10 + M.hit, 1, '#bbaa89'); });
    });
    veins([[-7, -8], [-2, -11], [3, -8], [7, -10]]); deco([[-5, -15], [3, -14]], -5);
    thin(-10, -8, -12, -10 + Math.sin(ph * 0.7) * 2, '#3a2a1e');
  } else if (k === 'cobra') {
    const slither = moving ? Math.sin(ph) * 0.8 : 0, back = -3.5 * M.prep + 7 * M.hit + M.follow * 2 + M.settle * 2 + slither, open = wind || swing;
    for (let i = 0; i < 20; i++) { const a = i / 20 * HPI * 2, cx = -2 + Math.cos(a) * (6 - M.prep * 0.5) + (moving ? Math.sin(a + ph) * 0.75 : 0), cy = -3 + Math.sin(a + M.breath * 0.2) * 2.5; A(snap(cx), snap(cy), 2.5, 2, i % 5 < 3 ? '#a01e24' : '#1a0e10'); }
    const neck = [[2 - slither, -4], [4 + back * 0.3, -8 - M.prep + slither], [5 + back, -12 - M.prep * 2 - M.scan]];
    for (let i = 0; i < neck.length - 1; i++) seg(neck[i][0], neck[i][1], neck[i + 1][0], neck[i + 1][1], 3, i ? '#c02a30' : '#a01e24');
    const headY = -13 - M.prep * 2 - M.scan;
    // Cabeça triangular e arco superciliar; a mandíbula acompanha o avanço do bote.
    A(3 + back, headY - 1, 5, 4, '#8e1b25'); A(6 + back, headY - 2, 4, 3, '#c02a30'); A(9 + back, headY - 1, 2, 2, '#8e1b25');
    A(4 + back, headY + 1, 2, 3, '#7a1418'); eye(7 + back, headY - 1);
    const gape = open ? 1 + M.prep * 2 + M.hit * 2 + M.follow * 1.5 : 0.5;
    snarl(8.5 + back, headY + 0.5, 3, gape);
    A(7 + back + M.follow * 2, headY + 2 + gape, 4, 1, '#8e1b25');
    if (open) raw(() => { A(9 + back, headY + 1, 1, 2 + M.follow * 2, '#efe1bf'); thin(11 + back, headY + 2 + gape, 13 + back + M.follow * 4, headY + 2 + gape, '#b868c8'); });
    veins([[-6, -3], [-2, -4], [2, -3]]); deco([[-6, -5], [-1, -6]], -1);
  } else if (k === 'urubu') {
    const cycle = Math.floor(t * (M.settle > 0 ? 1.2 : 2.4) * 12) / 12 * HPI * 2;
    const flap = wind ? -8 * M.prep : swing ? 2 + M.follow * 2 : Math.sin(cycle) * (6 - M.settle * 3) + M.settle * 2, span = swing ? 5 + (1 - M.hit) * 2 : 10 + Math.cos(cycle) * 1.3 - M.settle * 3;
    group(0, wind ? M.prep : Math.sin(cycle) * 0.5, () => {
      blob(0, -6, 5, 3, '#14101a'); A(-7, -5, 3, 2, '#14101a'); A(4 + M.hit, -9 + M.hit, 3, 3, '#a45763');
      raw(() => { A(7 + M.hit, -8 + M.hit, 3, 1, '#e3c595'); A(9 + M.hit, -7 + M.hit, 1, 2, '#bd9a73'); }); eye(5 + M.hit, -9 + M.hit);
      for (let i = 0; i < 3; i++) seg(-2 + i * 2, -8, -4 + i * 2, -11, 1, '#302033');
    });
    for (const side of [-1, 1]) {
      const elbow = [side * span * 0.5, -6 + flap * 0.55], tip = [side * span, -6 + flap];
      seg(side, -7, elbow[0], elbow[1], 2.5, '#1e1828'); seg(elbow[0], elbow[1], tip[0], tip[1], 2, '#1e1828');
      for (let i = 0; i < 4; i++) thin(tip[0] - side * i * 1.3, tip[1], tip[0] - side * i * 1.3 - side, tip[1] + 2 + i * 0.3, '#2a2238');
    }
    for (const side of [-1, 1]) {
      const grab = swing ? M.hit * 4 : 0;
      seg(side * 2, -3, 2 + grab + side * 2, -1 + M.hit, 1, '#8a7060');
      raw(() => { seg(2 + grab + side * 2, -1 + M.hit, 4 + grab + side * 2, -2 + M.hit, 0.5, '#dbc9a5'); A(4 + grab + side * 2, -2 + M.hit, 0.5, 1.5, '#b79f80'); });
    }
    veins([[-4, -6], [0, -7], [3, -6]]); deco([[-1, -9]], -4);
  } else return false;
  c.fillStyle = '#08060a';
  for (const q of R) { if (q[5]) continue; const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillRect(snap(sx) - 0.5, snap(y + q[1]) - 0.5, Math.max(0.5, snap(q[2])) + 1, Math.max(0.5, snap(q[3])) + 1); }
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillStyle = flash ? '#fff' : q[6] ? q[4] : furTint(q[4], fur); c.fillRect(snap(sx), snap(y + q[1]), Math.max(0.5, snap(q[2])), Math.max(0.5, snap(q[3]))); }
  if (claw) for (let i = 0; i < 3; i++) line(c, x + f * (claw.x - 3 - i), y + claw.y - 4 + i * 2, x + f * (claw.x + 2 + claw.k * 3 - i), y + claw.y + i * 2, '#e4d9c1', 0.5);
  if (wind && M.p > 0.6) { line(c, x + f * 9, y - e.h - 3, x + f * 10, y - e.h - 5, '#e6bb80', 0.5); line(c, x + f * 12, y - e.h - 2, x + f * 14, y - e.h - 3, '#e6bb80', 0.5); }
  return true;
}
