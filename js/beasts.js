'use strict';
// Desenho dos guardiões seguindo as pranchas de referência (Mapinguari, Capelobo, Pai do Mato, Labatut, Corpo-seco):
// corpo de fera com poses (andar, correr, mordida, garra, pancada, rugido, atordoado, queda) e efeitos de golpe.

// esqueleto de cada corpo: quadril, ombro, cabeça, peito e ventre (cx, cy, rx, ry), grossura e comprimento de pernas e braços
const BODY = {
  // urso em pé como gente: tronco ereto, pernas longas e grossas, braços compridos, cabeça sobre os ombros
  urso: { hip: -24, sh: -48, head: [4, -56], chest: [1, -39, 15, 10], belly: [1, -29, 14, 9], legT: 10, footW: 12, armT: 8, up: 14, fore: 15, sx: [-11, 11], lean0: 0, fist: 5 },
  mapinguari: { hip: -25, sh: -47, head: [3, -55], chest: [0, -39, 16, 11], belly: [2, -27, 13, 10], legT: 10, footW: 12, armT: 9, up: 14, fore: 16, sx: [-11, 11], lean0: 0, fist: 6 },
  // magro e corcunda: cintura fina, costelas, braços compridos quase no chão e pernas de joelho invertido
  esguio: { hip: -24, sh: -44, head: [14, -45], chest: [4, -36, 11, 8], belly: [1, -29, 6, 6], legT: 5, footW: 9, armT: 4, up: 15, fore: 17, sx: [-4, 8], lean0: 4, fist: 3, digi: true },
  // velho humano e magro: proporção de gente, pernas compridas e finas, braços finos, ombros estreitos
  velho: { hip: -27, sh: -47, head: [5, -54], chest: [1, -40, 7, 8], belly: [0, -32, 6, 6], legT: 4, footW: 7, armT: 3, up: 13, fore: 12, sx: [-3, 4], lean0: 1, fist: 2, human: true },
  // brutamontes: ombros e peito imensos em V, cintura fina, braços de gorila com punhos enormes, pernas curtas arqueadas
  bruto: { hip: -20, sh: -50, head: [9, -55], chest: [3, -41, 19, 11], belly: [1, -28, 8, 8], legT: 8, footW: 11, armT: 8, up: 16, fore: 17, sx: [-13, 14], lean0: 1, fist: 7, bow: true },
};
const BEAST = {
  // guardião antigo: pelagem de carvão, musgo nas costas, um olho âmbar e a boca no ventre
  mapinguari: { body: 'urso', skeleton: 'mapinguari', guardian: true, S: 1.4, aura: '#7b993b', amb: 'moscas', fur: ['#19251f', '#39483b', '#70765c'], face: '#625748', crescent: '#a49b73', head: 'bear', eyes: 1, belly: true, shaggy: true, bigClaw: true, claw: '#e1d2aa' },
  // corpo de homem musculoso e avermelhado, cabeça de tamanduá com focinho longo e juba escura nas costas
  capelobo: { body: 'esguio', S: 1.25, aura: '#c8402e', amb: 'fumaca', fur: ['#4a2a24', '#7a4a3e', '#a8705e'], face: '#9a8478', head: 'anteater', eyes: 2, mane: '#22160f', muscle: true, bigClaw: true, claw: '#e8dcd0' },
  // velho da mata: cabelo e barba longos e grisalhos, cocar de penas, saco nas costas e lamparina na mão
  paidomato: { body: 'velho', S: 1.25, aura: '#8fe37a', amb: 'vagalumes', fur: ['#3a2418', '#5a3a26', '#7a5236'], face: '#8a5e3e', head: 'oldman', eyes: 2, loin: ['#4a3a22', '#6a5a32'], sack: true, lantern: true, tunic: true, claw: '#c8a080' },
  // fera peluda de espinhos, um olho vermelho na testa e presas enormes subindo da boca
  labatut: { body: 'bruto', S: 1.4, aura: '#ff6a2a', amb: 'brasas', fur: ['#2a1c18', '#4a3026', '#6a4634'], skin: ['#5a3a34', '#8a5e50', '#b0806a'], quills: true, face: '#6a4a42', head: 'ape', eyes: 1, mane: '#1a1416', tusks: true, spikes: true, muscle: true, claw: '#e8e0d0' },
};

// pose conforme o estado de cada chefe
function beastPose(B) {
  const st = B.st, k = B.kind;
  // derrotado: cambaleia, depois fica de joelhos (o Pai do Mato só se ajoelha)
  if (st === 'down') return CHEFES.pose(B);
  if (st === 'intro') return 'roar';
  const M = {
    mapinguari: { walk: 'walk', biteW: 'biteW', bite: 'bite', clawW: 'clawW', claw: 'claw', slamW: 'slamW', slam: 'slam', gasW: 'breath', gas: 'breath', chargeW: 'crouch', charge: 'run', dazed: 'dazed', roar: 'roar', rec: 'idle' },
    capelobo: { stalk: 'run', hide: 'run', clawW: 'biteW', claw: 'bite', leapW: 'crouch', leap: 'jump', ambush: 'run', howlW: 'roar', howl: 'roar', rec: 'idle' },
    paidomato: { glide: 'walk', staffW: 'clawW', staff: 'claw', birdsW: 'roar', jacareW: 'slamW', waveW: 'slamW', ask: 'idle', yield: 'kneel', rec: B.last === 'jacareW' || B.last === 'waveW' ? 'slam' : 'idle' },
    labatut: { idle: B.tt > 0 ? 'walk' : 'idle', rockW: 'throw', stompW: 'slamW', sunW: 'roar', grabW: 'biteW', grab: 'run', lost: 'dazed', slashW: 'clawW', slash: 'claw', rec: B.last === 'stompW' ? 'slam' : 'idle' },
  }[k] || {};
  return M[st] || 'idle';
}

function drawBeast(B, D) {
  if (B.kind === 'mapinguari') drawMapinguariWarnings(B);
  const pose = beastPose(B), S = D.S, t = B.t, f = B.f;
  const R = []; let lantern = null, eyeP = null;
  // cada retângulo vai para a grade de pixels já escalada, sem buracos entre linhas vizinhas
  const A = (dx, dy, w, h, col) => { const X = Math.round(dx * S), Y = Math.round(dy * S); R.push([X, Y, Math.max(1, Math.round((dx + w) * S) - X), Math.max(1, Math.round((dy + h) * S) - Y), col]); };
  const blob = (cx, cy, rx, ry, col) => { for (let dy = -ry; dy <= ry; dy++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2))); A(cx - hw, cy + dy, hw * 2, 1, col); } };
  const seg = (x0, y0, x1, y1, th, col) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) A(Math.round(x0 + (x1 - x0) * i / n - th / 2), Math.round(y0 + (y1 - y0) * i / n - th / 2), th, th, col); };
  const [fd, fm, fl] = D.fur, Y = BODY[D.skeleton || D.body];
  // parâmetros da pose
  let lean = 0, crouch = 0, aF = [0.2, 0.2], aB = [0.15, 0.2], mouth = 0.25, tilt = 0, feet = [[-6, 0], [6, 0]], kneel = false;
  const breath = Math.sin(t * 2.2) > 0 ? 1 : 0;
  if (pose === 'idle') { crouch = breath; }
  else if (pose === 'walk') { const p = Math.sin(t * 8); feet = [[-6 - p * 5, Math.max(0, -p) * 3], [6 + p * 5, Math.max(0, p) * 3]]; aF = [0.2 - p * 0.4, 0.3]; aB = [0.2 + p * 0.4, 0.3]; }
  else if (pose === 'run') { const p = Math.sin(t * 15); lean = 6; crouch = 2; feet = [[-6 - p * 9, Math.max(0, -p) * 5], [7 + p * 9, Math.max(0, p) * 5]]; aF = [1.1 + p * 0.6, 0.4]; aB = [-0.6 - p * 0.5, 0.3]; tilt = 2; }
  else if (pose === 'biteW' || pose === 'breath') { lean = -3; mouth = 0.6; aF = [-0.5, 0.6]; aB = [-0.7, 0.5]; tilt = -2; }
  else if (pose === 'bite') { lean = 6; mouth = 1; aF = [1.2, 0.2]; aB = [0.9, 0.3]; tilt = 2; feet = [[-8, 0], [10, 0]]; }
  else if (pose === 'clawW') { lean = -2; aF = [-1.5, 0.4]; aB = [0.5, 0.3]; mouth = 0.5; }
  else if (pose === 'claw') { lean = 5; aF = [2.0, -0.3]; aB = [0.3, 0.3]; mouth = 0.7; feet = [[-8, 0], [10, 0]]; }
  else if (pose === 'slamW') { lean = -2; aF = [HPI - 0.2, 0.2]; aB = [HPI - 0.5, 0.2]; mouth = 0.8; tilt = -3; }
  else if (pose === 'slam') { lean = 4; crouch = 6; aF = [0.5, 0.2]; aB = [0.6, 0.2]; mouth = 0.6; }
  else if (pose === 'roar') { aF = [2.5, 0.4]; aB = [2.2, 0.4]; mouth = 1; tilt = -4; crouch = -1; }
  else if (pose === 'dazed') { crouch = 3; aF = [0.05, 0.1]; aB = [0.05, 0.1]; tilt = 3; mouth = 0.4; }
  else if (pose === 'crouch') { crouch = 7; lean = 3; aF = [0.9, 0.3]; aB = [0.7, 0.3]; }
  else if (pose === 'jump') { feet = [[-4, 8], [6, 9]]; aF = [1.7, 0.2]; aB = [1.2, 0.3]; lean = 4; mouth = 0.8; }
  else if (pose === 'throw') { aF = [HPI + 0.6, 0.2]; aB = [1.0, 0.3]; lean = -2; mouth = 0.5; }
  else if (pose === 'stagger') { lean = -4; tilt = -4; aF = [2.6, 0.5]; aB = [-2.2, 0.4]; mouth = 1; feet = [[-11, 0], [4, 3]]; }
  else if (pose === 'kneel') { kneel = true; crouch = 12 + breath; lean = 4; aF = [0.55, -0.15]; aB = [0.35, 0.2]; tilt = 4; mouth = 0.15; feet = [[-12, 0], [-4, 0]]; }
  if (D.guardian && B.st !== 'down') {
    const p = B.stateDur > 0 ? clamp(1 - B.tt / B.stateDur, 0, 1) : 0;
    const ease = p * p * (3 - 2 * p);
    const elapsed = B.stateT == null ? p * (B.stateDur || 0) : B.stateT;
    if (B.st === 'idle') { crouch = Math.sin(t * 2.5) * 0.6; aF = [0.05, 0.15]; aB = [-0.1, 0.2]; }
    else if (B.st === 'walk') { const step = Math.sin(t * 6); lean = 1; feet = [[-6 - step * 5, Math.max(0, -step) * 2], [7 + step * 5, Math.max(0, step) * 2]]; aF = [0.15 - step * 0.25, 0.18]; aB = [-0.1 + step * 0.25, 0.2]; }
    else if (B.st === 'biteW') { lean = -1 - ease * 2; aF = [-0.55, 0.2]; aB = [-0.7, 0.3]; mouth = 0.3 + ease * 0.7; tilt = -2; }
    else if (B.st === 'bite') { lean = 5; crouch = 2; aF = [1.15, 0.15]; aB = [0.8, 0.2]; mouth = 1 - ease * 0.7; feet = [[-9, 0], [11, 0]]; }
    else if (B.st === 'clawW') { lean = -1 - ease * 3; crouch = 1; aF = [-1.4 - ease * 0.8, 0.4]; aB = [0.4, 0.2]; mouth = 0.35 + ease * 0.35; }
    else if (B.st === 'claw') {
      const stroke = B.phase === 2 && elapsed >= 0.43 ? elapsed - 0.43 : elapsed;
      const swing = clamp(stroke / 0.08, 0, 1), recover = clamp((stroke - 0.18) / 0.14, 0, 1), drive = swing * (1 - recover);
      lean = 2 + drive * 4; aF = [lerp(lerp(-1.8, 1.9, swing), -1.8, recover), 0.12]; aB = [0.5, 0.2];
      mouth = 0.6 + drive * 0.15; feet = [[-8, 0], [8 + drive * 3, 0]];
    }
    else if (B.st === 'slamW') { lean = -2; crouch = -ease * 2; aF = [2.4 + ease * 0.55, 0.12]; aB = [2.2 + ease * 0.5, 0.1]; mouth = 0.4 + ease * 0.4; tilt = -3; }
    else if (B.st === 'slam') {
      const smooth = v => { const k = clamp(v, 0, 1); return k * k * (3 - 2 * k); };
      let lift = elapsed < 0.12 ? 1 - smooth(elapsed / 0.12) : 0;
      if (B.phase === 2 && elapsed >= 0.28 && elapsed < 0.5) lift = smooth((elapsed - 0.28) / 0.22);
      else if (B.phase === 2 && elapsed >= 0.5 && elapsed < 0.62) lift = 1 - smooth((elapsed - 0.5) / 0.12);
      lean = lerp(5, -2, lift); crouch = lerp(9, -2, lift); tilt = -3 * lift;
      aF = [lerp(0.45, 2.95, lift), lerp(0.05, 0.12, lift)]; aB = [lerp(0.55, 2.7, lift), lerp(0.05, 0.1, lift)];
      mouth = 0.8; feet = [[-9, 0], [10, 0]];
    }
    else if (B.st === 'gasW') { lean = -1 - ease * 3; crouch = -1; aF = [-0.65, 0.2]; aB = [-0.8, 0.25]; mouth = 0.25 + ease * 0.75; tilt = -2; }
    else if (B.st === 'gas') { lean = 5; crouch = 2; aF = [0.6, 0.1]; aB = [-0.5, 0.3]; mouth = 1; tilt = 2; }
    else if (B.st === 'chargeW') { lean = 3 + ease * 3; crouch = 3 + ease * 4; aF = [0.8, 0.15]; aB = [-0.9, 0.2]; mouth = 0.55; feet = [[-10, 0], [9, 0]]; }
    else if (B.st === 'charge') { lean = 7; crouch = 4; mouth = 0.75; }
    else if (B.st === 'rec') { crouch = (B.last === 'slamW' ? 7 : 2) * (1 - ease); lean = 2 * (1 - ease); aF = [0.1, 0.1]; aB = [-0.1, 0.2]; mouth = 0.2; }
  }
  {
    lean += Y.lean0;
    const hipY = Y.hip + crouch, shY = Y.sh + crouch, hx = Y.head[0] + lean + tilt * 0.3, hy = Y.head[1] + crouch + tilt;
    const [cX, cY, cRx, cRy] = Y.chest, [vX, vY, vRx, vRy] = Y.belly, chX = cX + lean * 0.6, chY = cY + crouch;
    if (D.guardian) {
      // raízes presas à pelagem formam uma silhueta antiga, sem esconder os braços.
      for (let i = 0; i < 5; i++) {
        const rx = chX - cRx + 1 + i * 2.6, ry = chY - 7 + i * 3;
        seg(rx, ry, rx - 5 - (i % 2) * 3, ry - 5 - i, 2, '#302f20');
        seg(rx - 4, ry - 4, rx - 3, ry - 9 - i, 1, '#797249');
        A(rx - 7, ry - 7 - i, 3, 2, '#6c813d');
      }
    }
    // pernas (a de trás mais escura)
    const leg = (hx2, ft, col) => {
      const fx = ft[0] * (Y.footW / 11), fy = -ft[1], L = -Y.hip / 2 + 1, d = Math.hypot(fx - hx2, fy - hipY) || 1, T2 = Y.legT;
      let kx = (hx2 + fx) / 2, ky = (hipY + fy) / 2;
      if (d < L * 2) { const hh = Math.sqrt(Math.max(0, L * L - (d / 2) ** 2)); kx += hh * 0.8; ky -= 1; }
      if (Y.bow) kx -= 3;
      if (kneel) { kx = hx2 + 8; ky = -3; }
      if (Y.digi && !kneel) {
        // joelho para a frente e calcanhar alto para trás, como bicho
        const ax = fx - 4, ay = fy - 7;
        seg(hx2, hipY, kx + 3, ky, T2 + 1, col); seg(kx + 3, ky, ax, ay, T2, col); seg(ax, ay, fx, fy - 2, T2 - 1, col);
        if (col === fm) seg(hx2 + 2, hipY, kx + 4, ky, 1, fl);
      } else {
        seg(hx2, hipY, kx, ky, T2, col); seg(kx, ky, fx, fy - 2, T2 - 1, col);
        if (col === fm) { seg(hx2 + 2, hipY, kx + 2, ky, 2, fl); seg(kx + 2, ky, fx + 2, fy - 4, 1, fl); } // luz na perna da frente
      }
      const fw = Y.footW;
      if (Y.human) { A(fx - fw / 2, fy - 2, fw, 2, D.face); A(fx - fw / 2, fy - 1, fw, 1, '#4a3420'); } // pé descalço com sandália de fibra
      else { A(fx - fw / 2, fy - 3, fw, 3, col); A(fx + fw / 2 - 1, fy - 2, 2, 2, D.claw); if (fw > 11) A(fx + fw / 2 - 4, fy - 2, 2, 2, D.claw); if (D.guardian) { A(fx + fw / 2 - 7, fy - 1, 2, 2, D.claw); A(fx - 4, fy - 4, 4, 1, '#7b8452'); } }
    };
    leg(Y.sx[0] * 0.6, feet[0], fd);
    // braço de trás
    const arm = (sx, sy, ang, col, front) => {
      const e = [sx + Math.sin(ang[0]) * Y.up, sy + Math.cos(ang[0]) * Y.up], b = ang[0] + ang[1], h = [e[0] + Math.sin(b) * Y.fore, e[1] + Math.cos(b) * Y.fore];
      seg(sx, sy, e[0], e[1], Y.armT, col); seg(e[0], e[1], h[0], h[1], Math.max(3, Y.armT - 1), col); blob(h[0], h[1], Y.fist, Y.fist - 1, col);
      if (front) { seg(sx + 1, sy - 2, e[0] + 1, e[1] - 2, 2, fl); seg(e[0] + 1, e[1] - 1, h[0], h[1] - 2, 1, fl); } // luz no braço da frente
      const cl = Y.human ? 2 : D.bigClaw ? 7 : 4;
      // urso: franja de pelo pendendo do antebraço; bruto: espinhos saindo do antebraço
      if (D.shaggy) for (let i = 2; i < 10; i += 2) { const px = e[0] + (h[0] - e[0]) * i / 10, py = e[1] + (h[1] - e[1]) * i / 10; A(px - 4, py + 2, 2, 3 + (i % 4), front ? fl : fd); }
      if (D.guardian) {
        blob(sx, sy + 1, 6, 5, front ? fm : fd);
        for (let i = 0; i < 5; i++) { const px = sx - 4 + i * 2, py = sy - 2 + (i % 2); A(px, py, 2, 3 + (i % 3), front ? '#788747' : '#465535'); A(px, py, 2, 1, '#a0a45b'); }
        seg(e[0] - 2, e[1] - 1, h[0] - 3, h[1] - 4, 2, '#222f25');
        if (front) { seg(e[0] + 1, e[1] + 3, e[0] + 5, e[1] + 1, 1, '#b39869'); seg(e[0] + 2, e[1] + 6, e[0] + 6, e[1] + 4, 1, '#b39869'); }
      }
      if (D.quills) for (let i = 2; i < 9; i += 3) { const px = e[0] + (h[0] - e[0]) * i / 10, py = e[1] + (h[1] - e[1]) * i / 10; seg(px - 2, py, px - 7, py - 4 - (i % 2) * 2, 1, D.mane); }
      for (let i = -1; i <= 1; i++) {
        const tx = h[0] + Math.sin(b + 0.3) * (3 + cl) + i * 2, ty = h[1] + Math.cos(b + 0.3) * (3 + cl);
        seg(h[0] + Math.sin(b) * 3 + i * 2, h[1] + Math.cos(b) * 3, tx, ty, D.guardian ? 2 : 1, D.claw);
        if (D.guardian) { seg(tx, ty, tx + Math.sin(b + 0.6) * 2, ty + Math.cos(b + 0.6) * 2, 1, '#fff0c8'); A(h[0] - 3 + i * 3, h[1] - 2, 2, 1, '#817d58'); }
      }
      return h;
    };
    if (D.mane) { blob(hx - 6, hy + 10, 9, 14, D.mane); for (let i = 0; i < 6; i++) A(hx - 13 + i * 2, hy + 18, 1, 6 + (i % 3) * 2, D.mane); }
    // saco de estopa nas costas (Pai do Mato), com gravetos e penas saindo pela boca
    if (D.sack) {
      const sx = Y.sx[0] - 10 + lean * 0.4, sy = shY + 9;
      for (const [x1, y1, c] of [[-6, -18, '#6a4428'], [-2, -21, '#8a5a30'], [2, -17, '#5a3a22'], [-9, -14, '#c8703a']]) seg(sx + x1 * 0.3, sy - 9, sx + x1, sy + y1, 1, c);
      blob(sx, sy, 12, 13, '#5e4628'); blob(sx - 1, sy - 1, 11, 12, '#8a6a44'); blob(sx + 3, sy - 4, 6, 6, '#a8865a');
      for (let i = -8; i <= 8; i += 4) A(sx + i, sy + (hash(i + 5) * 8 | 0) - 4, 2, 1, '#6a4e30');
      A(sx - 3, sy - 12, 7, 2, '#4a3420');
    }
    arm(Y.sx[0] + lean, shY + 2, aB, fd, false);
    // tronco do tipo de corpo: peito e ventre (com cintura entre eles)
    const vx2 = vX + lean * 0.3, vy2 = vY + crouch;
    const [kd, km, kl] = D.skin || [fd, fm, fl];
    blob(vx2, vy2, vRx, vRy, km); blob(chX, chY, cRx, cRy, km);
    blob(chX + cRx * 0.25, chY - cRy * 0.35, cRx * 0.6 | 0, cRy * 0.5 | 0, kl);
    blob(vx2, vy2 + vRy * 0.6, vRx * 0.8 | 0, Math.max(1, vRy * 0.35 | 0), fd); // sombra embaixo do ventre
    // textura de pelo/pele com pontos fixos dentro do peito e do ventre (não piscam)
    for (let i = 0; i < 60; i++) {
      const inC = i % 2 === 0, [ox, oy, rx, ry] = inC ? [chX, chY, cRx, cRy] : [vx2, vy2, vRx, vRy];
      const px = ox + (hash(i * 3 + 1) * 2 - 1) * rx, py = oy + (hash(i * 7 + 2) * 2 - 1) * ry;
      if (!D.skin && ((px - ox) / rx) ** 2 + ((py - oy) / ry) ** 2 < 0.8) A(Math.round(px), Math.round(py), 1, i % 3 ? 1 : 2, i % 4 < 2 ? fd : fl);
    }
    // ombro de trás com luz de recorte
    A(chX - cRx + 1, chY - cRy + 2, cRx * 0.5 | 0, 1, fl);
    // urso: corcova de pelo nos ombros e tufos pendurados por todo o corpo
    if (D.body === 'urso') {
      blob(chX - 4, chY - cRy + 1, 11, 6, fm); blob(chX - 5, chY - cRy, 8, 3, fl);
      // contorno de pelo eriçado em volta do corpo (silhueta irregular de urso)
      for (let i = 0; i < 26; i++) { const a = -HPI + i / 25 * HPI * 1.6, rx = cRx + 1, ry = cRy + 1; A(chX + Math.cos(a) * rx - 1, chY + Math.sin(a) * ry - 1, 2, 2 + (i % 3), i % 2 ? fm : fd); }
      // meia-lua clara no peito, como urso-de-colar
      for (let i = 0; i <= 12; i++) { const a = HPI * 0.15 + i / 12 * HPI * 0.7; A(chX + 1 + Math.cos(a) * 9, chY - 7 + Math.sin(a) * 5, 2, 2, D.crescent); }
    }
    if (D.shaggy) for (let i = -cRx; i <= cRx; i += 2) { const yy = chY - cRy + (hash(i + 31) * (cRy * 2 + vRy) | 0); A(chX + i, yy, 1, 3 + (hash(i + 3) * 3 | 0), i % 4 ? fl : fd); }
    if (D.guardian) {
      // mechas sobrepostas: volumes escuros no peito e reflexos oliva no pelo grosso.
      for (let i = 0; i < 18; i++) {
        const px = chX - 13 + (i % 6) * 4.5, py = chY - 8 + Math.floor(i / 6) * 5 + hash(i + 71) * 2;
        A(px, py, 3, 5 + (i % 3), i % 3 ? '#293b2d' : '#53604a');
        A(px + 1, py, 1, 3, '#7a8061');
      }
      for (let i = 0; i < 8; i++) {
        const px = chX - 13 + i * 2.4, py = chY - cRy + 2 + (i % 3);
        A(px, py, 3, 2 + (i % 3), '#6c813d'); A(px + 1, py, 2, 1, '#a0a45b');
        if (i % 2 === 0) { seg(px, py + 2, px + 1, py + 7, 1, '#64733b'); A(px, py + 7, 2, 1, '#8d984b'); }
      }
      // cicatrizes claras cruzam a pelagem e tornam o peito reconhecível à distância.
      for (let i = 0; i < 3; i++) { seg(chX + 5 + i * 2, chY - 8, chX + 2 + i * 2, chY - 1, 1, '#a88d60'); A(chX + 5 + i * 2, chY - 8, 1, 2, '#dbbd86'); }
      seg(vx2 - 10, vy2 - 5, vx2 - 12, vy2 + 5, 2, '#65573b'); seg(vx2 - 10, vy2 - 5, vx2 - 13, vy2, 1, '#a38e59');
    }
    // esguio: costelas marcadas e cintura de vespa
    if (D.body === 'esguio') { for (let r = 0; r < 4; r++) seg(chX - 6, chY - 2 + r * 3, chX + 6, chY - 4 + r * 3, 1, fd); A(vx2 - 1, vy2 - 3, 1, 5, fd); }
    // bruto: trapézio alto, ombros redondos e peitoral em placas
    if (D.body === 'bruto') {
      // ombros cobertos de pelo escuro (o peito fica nu) e espinhos longos saindo dos ombros e das costas
      blob(chX - 6, chY - cRy, 10, 5, fm); blob(chX + cRx - 5, chY - cRy + 4, 7, 6, fm); blob(chX - cRx + 5, chY - cRy + 4, 7, 6, fd); blob(chX + cRx - 4, chY - cRy + 3, 4, 3, fl);
      for (let i = 0; i < 11; i++) { const bx = chX - cRx + 2 + i * 3, by = chY - cRy + 1 + Math.abs(i - 4) * 0.6, l = 7 + (i % 3) * 3; seg(bx, by, bx - 4 - i * 0.3, by - l, 1, i % 2 ? D.mane : fd); A(bx - 4 - i * 0.3, by - l - 1, 1, 1, '#8a7060'); }
      // peitoral em placas, abdômen em gomos e veias saltadas
      A(chX - 1, chY - 6, 1, 12, kd); A(chX - cRx * 0.6, chY + 3, cRx * 1.2 | 0, 1, kd);
      for (let r = 0; r < 3; r++) { A(vx2 - 4, vy2 - 5 + r * 4, 3, 2, kl); A(vx2 + 1, vy2 - 5 + r * 4, 3, 2, kl); A(vx2 - 1, vy2 - 5 + r * 4, 1, 3, kd); }
      seg(chX + 6, chY - 2, chX + 9, chY + 4, 1, kd); seg(chX - 8, chY, chX - 10, chY + 6, 1, kd);
    }
    // músculos: peitoral e abdômen marcados
    if (D.muscle && D.body !== 'bruto') { const mx = chX, my = chY - 1; A(mx - cRx * 0.5, my + 4, cRx | 0, 1, fd); A(mx, my - 4, 1, 8, fd); for (let r = 0; r < 3; r++) { A(vx2 - 4, vy2 - 4 + r * 4, 3, 1, fd); A(vx2 + 2, vy2 - 4 + r * 4, 3, 1, fd); } A(mx - 5, my - 3, 4, 2, fl); A(mx + 2, my - 3, 4, 2, fl); }
    // túnica de estopa rasgada e comprida e colares de contas (Pai do Mato)
    if (D.tunic) {
      const tx = chX, ty = chY + 6;
      blob(tx, ty + 2, 8, 15, '#4a3c26'); blob(tx + 1, ty - 4, 6, 7, '#5e4e32'); A(tx - 1, ty + 2, 1, 13, '#3a2e1c'); A(tx + 3, ty + 4, 1, 11, '#3a2e1c');
      A(tx - 7, ty - 1, 15, 1, '#2a1a10'); A(tx + 4, ty, 1, 4, '#2a1a10');
      for (let i = -7; i <= 7; i += 2) A(tx + i, ty + 15, 1, 2 + (hash(i + 17) * 4 | 0), i % 4 ? '#4a3c26' : '#3a5a2a');
      for (let i = 0; i < 9; i++) { const a = i / 8 * HPI; A(tx + 4 - Math.cos(a) * 7, ty - 8 + Math.sin(a) * 6, 1, 1, ['#c8402e', '#efe8dc', '#3a8a5a'][i % 3]); A(tx + 4 - Math.cos(a) * 9, ty - 8 + Math.sin(a) * 9, 1, 1, ['#efe8dc', '#d8a040'][i % 2]); }
      seg(tx - 10, ty - 10, tx + 9, ty + 6, 1, '#3a2a18');
    }
    // Mapinguari: barriga saliente e sem pelo, onde fica a única boca (desenhada depois do braço, para nunca sumir)
    const bellyX = Math.round(vx2) + 1, bellyY = Math.round(vy2) - 1;
    if (D.belly) { blob(bellyX + 1, bellyY, 14, 10, fm); blob(bellyX + 4, bellyY, 10, 8, D.face); blob(bellyX + 6, bellyY - 3, 5, 3, D.guardian ? '#998565' : '#6a666e'); }
    if (D.loin && !D.tunic) for (let i = -10; i <= 10; i += 3) A(i, hipY - 2, 3, 7 + (hash(i) * 4 | 0), i % 2 ? D.loin[0] : D.loin[1]);
    leg(Y.sx[1] * 0.5, feet[1], fm);
    // cabeça
    const calmEye = B.mood === 'calm' || B.mood === 'povo';
    if (D.head === 'anteater') {
      // cabeça de tamanduá: crânio coberto de pelo escuro, orelha pequena e focinho comprido curvado para baixo
      for (let i = 0; i < 7; i++) A(hx - 10 - i, hy + 2 + i * 3, 4, 4, D.mane);
      blob(hx, hy, 7, 7, D.mane); blob(hx + 2, hy + 1, 5, 5, fd);
      A(hx - 2, hy - 8, 3, 4, D.face); A(hx - 1, hy - 7, 1, 2, '#c89a8a');
      const sn = mouth > 0.6 ? 2 : 0;
      seg(hx + 4, hy + 1, hx + 12, hy + 3, 6, D.face); seg(hx + 12, hy + 3, hx + 18, hy + 8 + sn, 4, D.face); seg(hx + 18, hy + 8 + sn, hx + 20, hy + 14 + sn, 3, D.face);
      A(hx + 7, hy - 1, 6, 1, '#b8a498'); A(hx + 19, hy + 14 + sn, 3, 2, '#1a1410');
      if (mouth > 0.6) seg(hx + 20, hy + 15 + sn, hx + 24, hy + 22, 1, '#d0607a'); // língua comprida
      A(hx + 3, hy - 2, 2, 2, calmEye ? '#f4ecd0' : '#ff3a2a'); A(hx + 4, hy - 2, 1, 1, '#1a0806'); eyeP = [hx + 4, hy - 1];
    } else if (D.head === 'oldman') {
      // velho de cabelo comprido grisalho, barba até o peito, pintura vermelha no rosto e cocar de penas
      blob(hx - 4, hy + 3, 8, 12, '#7a7a72'); for (let i = 0; i < 8; i++) A(hx - 12 + i * 2, hy + 4, 1, 12 + (hash(i + 21) * 10 | 0), i % 2 ? '#9a9a90' : '#6a6a62');
      blob(hx + 1, hy, 7, 8, D.face); blob(hx + 3, hy + 1, 4, 5, '#9a6e4a');
      const ey = calmEye ? '#f4ecd0' : '#f6e8a0';
      A(hx + 1, hy - 2, 2, 1, ey); A(hx + 5, hy - 2, 2, 1, ey); A(hx + 2, hy - 2, 1, 1, '#1a0c08'); A(hx + 6, hy - 2, 1, 1, '#1a0c08'); eyeP = [hx + 4, hy - 2];
      A(hx, hy - 4, 8, 1, '#5a3a26'); A(hx + 1, hy, 7, 1, '#a02a1a'); A(hx + 7, hy - 1, 2, 3, '#6a4428');
      for (let i = 0; i < 6; i++) A(hx + 1 + i, hy + 4, 1, 12 + (hash(i + 41) * 8 | 0) - Math.abs(i - 3), i % 2 ? '#b8b8ae' : '#8a8a82');
      A(hx + 3, hy + 5, 3, 1, '#3a1a10');
      A(hx - 6, hy - 7, 14, 2, '#7a3a1a');
      for (let i = 0; i < 7; i++) { const fx = hx - 6 + i * 2.2, fl2 = 9 + (i % 3) * 3; const ex = fx + (i - 3) * 2.2 - 2; seg(fx, hy - 8, ex, hy - 8 - fl2, 1, ['#c8703a', '#8a5a30', '#b0783a'][i % 3]); A(ex, hy - 9 - fl2, 1, 2, '#2a1a10'); }
    } else if (D.head === 'bear') {
      // cabeça de urso: orelhas redondas, focinho claro com nariz preto e um único olho no meio da testa
      if (D.guardian) {
        blob(hx - 6, hy - 8, 3, 3, fd); blob(hx + 5, hy - 9, 3, 3, fd);
        A(hx - 7, hy - 9, 2, 2, '#767754'); A(hx + 4, hy - 10, 2, 2, '#8b865b');
        blob(hx - 1, hy, 10, 9, fm); blob(hx - 3, hy - 4, 8, 5, '#56634a');
        for (let i = 0; i < 5; i++) { A(hx - 11 + i, hy - 3 + i * 2, 3, 4, i % 2 ? fd : '#293b2d'); A(hx - 8 + i * 3, hy - 9 - (i % 2), 2, 3, '#88916a'); }
        // focinho sem boca: a mandíbula do guardião fica no ventre.
        blob(hx + 6, hy + 4, 6, 4, D.face); A(hx + 4, hy + 1, 6, 2, '#9e8e6b');
        A(hx + 10, hy + 1, 4, 3, '#151b16'); A(hx + 10, hy + 1, 2, 1, '#83886a');
        A(hx + 5, hy + 7, 6, 1, '#3a392a'); A(hx + 7, hy + 8, 2, 2, '#8a7754');
        const quiet = calmEye || B.st === 'down', eyeC = quiet ? '#d5d3a3' : B.phase === 2 || B.mood === 'agr' ? '#ff9b35' : '#e9ba56';
        blob(hx + 2, hy - 3, 5, 4, '#101811'); A(hx - 1, hy - 5, 6, 4, eyeC);
        A(hx, hy - 5, 4, 1, quiet ? '#e9e4c4' : '#fff0a2'); A(hx + 2, hy - 4, 1, 3, '#251a0e'); A(hx, hy - 4, 1, 1, '#fff8d0');
        A(hx - 3, hy - 7, 5, 2, '#1b2c1f'); A(hx + 2, hy - 7, 5, 2, '#283629');
        A(hx - 2, hy - 8, 5, 1, '#90936a'); A(hx + 4, hy - 6, 2, 1, '#b3a772');
        seg(hx - 6, hy - 5, hx - 8, hy + 1, 1, '#b29b70');
        eyeP = [hx + 2, hy - 3];
      } else {
        blob(hx - 5, hy - 8, 3, 3, fd); blob(hx + 4, hy - 9, 3, 3, fd); A(hx - 6, hy - 9, 2, 2, fl); A(hx + 3, hy - 10, 2, 2, fl);
        blob(hx, hy, 9, 8, fm); blob(hx - 2, hy - 3, 7, 4, fl);
        blob(hx + 7, hy + 3, 5, 4, D.face); A(hx + 10, hy + 1, 3, 2, '#0e0a0c'); A(hx + 6, hy + 6, 5, 1, '#1a1214');
        const eyeC = B.mood === 'agr' ? '#ff3a2a' : B.mood ? '#f4ecd0' : '#f6e8a0', iris = B.mood && B.mood !== 'agr' ? '#3a2a1a' : '#c8202a';
        blob(hx + 2, hy - 3, 3, 2, '#1a0c08'); A(hx, hy - 4, 5, 3, eyeC); A(hx + 2, hy - 3, 2, 2, iris); A(hx - 1, hy - 6, 7, 1, fd); eyeP = [hx + 3, hy - 2];
      }
    } else {
      // juba de espinhos em volta da cabeça e dos ombros
      if (D.spikes) for (let i = 0; i < 15; i++) { const a = -3.3 + i * 0.3, l = 6 + (i % 3) * 3; seg(hx - 3 + Math.cos(a) * 6, hy + 1 + Math.sin(a) * 6, hx - 3 + Math.cos(a) * (6 + l), hy + 1 + Math.sin(a) * (6 + l), 2, i % 2 ? D.mane : fd); }
      blob(hx, hy, 8, 8, fm); blob(hx - 2, hy - 4, 7, 4, fd);
      if (!D.belly) blob(hx + 4, hy + 3, 5, 4, D.face);
      const eyeC = B.mood === 'agr' ? '#ff3a2a' : B.mood ? '#f4ecd0' : '#f6e8a0', iris = B.mood && B.mood !== 'agr' ? '#3a2a1a' : '#c8202a';
      if (D.eyes === 1) { blob(hx + 2, hy - 2, 3, 2, '#1a0c08'); A(hx, hy - 3, 4, 3, eyeC); A(hx + 2, hy - 2, 2, 2, iris); }
      else { A(hx + 1, hy - 2, 2, 2, eyeC); A(hx + 5, hy - 2, 2, 2, eyeC); A(hx + 2, hy - 1, 1, 1, iris); A(hx + 6, hy - 1, 1, 1, iris); }
      A(hx - 4, hy - 5, 10, 1, fd); eyeP = [hx + 3, hy - 1];
      const mo = Math.round(mouth * 4);
      if (!D.belly) { A(hx + 3, hy + 4, 6, 1 + mo, '#3a060a'); if (mo > 1) { A(hx + 3, hy + 4, 1, 1, '#efe8dc'); A(hx + 7, hy + 4, 1, 1, '#efe8dc'); } }
      if (D.tusks) { seg(hx + 3, hy + 6, hx + 1, hy - 4, 2, '#efe8dc'); seg(hx + 9, hy + 6, hx + 12, hy - 4, 2, '#efe8dc'); A(hx + 1, hy - 5, 1, 1, '#fff'); A(hx + 12, hy - 5, 1, 1, '#fff'); }
      if (D.mane) for (let i = 0; i < 9; i++) A(hx - 9 + i * 2, hy - 9 + (i % 2), 2, 4, D.mane);
    }
    const hand = arm(Y.sx[1] + lean, shY + 1, aF, fm, true);
    // lamparina pendurada na mão da frente (Pai do Mato)
    if (D.lantern) { A(hand[0], hand[1] + 2, 1, 3, '#3a2a1a'); blob(hand[0], hand[1] + 9, 4, 5, '#4a2e16'); A(hand[0] - 2, hand[1] + 7, 5, 5, B.lampOff ? '#3a2a1a' : '#ffb84a'); A(hand[0] - 1, hand[1] + 8, 3, 3, B.lampOff ? '#241810' : '#fff0b0'); for (let i = -3; i <= 3; i += 2) A(hand[0] + i, hand[1] + 5, 1, 9, '#2a1a0c'); lantern = hand; }
    if (D.belly) {
      // boca do ventre: na frente da barriga, abre mais na mordida e no rugido e acompanha o corpo em qualquer pose
      const cx = bellyX + 8, cy = bellyY + 1, oh = clamp(Math.round(2 + mouth * 7), 2, 9);
      blob(cx, cy, 9, oh + 2, '#27281b'); blob(cx, cy, 8, oh + 1, '#76553b');
      blob(cx, cy, 7, oh, '#140c0d'); blob(cx + 1, cy + 2, 5, Math.max(1, oh - 3), '#5a2026');
      if (oh > 3) { blob(cx + 1, cy + oh - 3, 4, 2, '#a44c4d'); A(cx, cy + oh - 4, 1, 2, '#d68a73'); }
      for (let i = -5; i <= 5; i += 2) {
        const edge = Math.abs(i) === 5, len = Math.max(1, Math.round((edge ? 4 : 2 + (i % 3 === 0 ? 1 : 0)) * Math.min(1, oh / 4)));
        for (let j = 0; j < len; j++) { const w = j < len - 1 ? 2 : 1; A(cx + i, cy - oh + j, w, 1, j ? '#e8d2a2' : '#fff1cb'); A(cx + i + 1, cy + oh - j, w, 1, j ? '#cdb78e' : '#f6e6bf'); }
      }
      for (const side of [-1, 1]) { seg(cx + side * 8, cy - 3, cx + side * 10, cy - 6, 1, '#c49c6a'); seg(cx + side * 8, cy + 2, cx + side * 10, cy + 5, 1, '#a9875b'); }
      if (mouth > 0.6 && B.st !== 'down') { A(cx - 5, cy + oh + 1, 1, 3 + Math.round(Math.sin(t * 4) + 1), '#9ba85c'); A(cx + 5, cy + oh + 1, 1, 2, '#c6ca87'); }
    }
  }
  const x = B.x, y = B.y, flash = B.flash > 0, a0 = ctx.globalAlpha, down = B.st === 'down' || B.st === 'yield';
  const P2 = (lx, ly) => [f > 0 ? x + lx * S : x - lx * S, y + ly * S]; // ponto local → tela
  // sombra no chão e aura de fúria (cresce na fase 2), atrás do corpo
  ctx.globalAlpha = a0 * 0.3; ell(ctx, x, y, 20 * S | 0, 3, '#000');
  if (!down) { const ph = B.phase || 1; ctx.globalAlpha = a0 * (0.06 + ph * 0.06 + Math.sin(t * 3) * 0.03); ell(ctx, x + f * 2 * S, y - 30 * S, (24 + ph * 5) * S | 0, (34 + ph * 3) * S | 0, D.aura); }
  ctx.globalAlpha = a0;
  ctx.fillStyle = '#0c0806';
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; ctx.fillRect(Math.round(sx) - 1, Math.round(y + q[1]) - 1, q[2] + 2, q[3] + 2); }
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; ctx.fillStyle = flash ? '#fff' : q[4]; ctx.fillRect(Math.round(sx), Math.round(y + q[1]), q[2], q[3]); }
  // brilho do olho (mais forte na fase 2; apaga quando cai ou se acalma)
  if (eyeP && !down && !(B.mood === 'calm' || B.mood === 'povo')) { const [ex, ey] = P2(eyeP[0], eyeP[1]), k = (Math.sin(t * 5) + 1) / 2; ctx.globalAlpha = a0 * (0.2 + k * 0.12 + ((B.phase || 1) - 1) * 0.15); ell(ctx, ex, ey, 4 + (B.phase || 1), 3 + (B.phase || 1), D.guardian ? (B.phase === 2 ? '#ff9f3d' : '#ffd170') : '#ff4a2a'); ctx.globalAlpha = a0; }
  // ambiente de cada guardião, desenhado em volta do corpo
  if (!down) {
    if (D.amb === 'moscas') for (let i = 0; i < 5; i++) { const a = t * (3 + i * 0.4) + i * 1.3, [mx, my] = P2(12 + Math.cos(a) * (10 + i * 2), -24 + Math.sin(a * 1.3) * 7); rect(ctx, mx, my, 1, 1, '#141014'); if (Math.sin(t * 30 + i) > 0) rect(ctx, mx, my - 1, 1, 1, '#c8d0d8'); }
    if (D.amb === 'moscas' || D.amb === 'fumaca') for (let i = 0; i < 4; i++) { const p = (t * 0.5 + i / 4) % 1, [mx, my] = D.amb === 'moscas' ? P2(11 + Math.sin(p * 6 + i) * 4, -22 - p * 30) : P2(-6 + Math.sin(p * 5 + i) * 5, -46 - p * 26); ctx.globalAlpha = a0 * (1 - p) * 0.5; ell(ctx, mx, my, 2 + p * 3 | 0, 2 + p * 2 | 0, D.amb === 'moscas' ? '#8ab050' : '#3a3434'); }
    if (D.amb === 'vagalumes') for (let i = 0; i < 6; i++) { const a = t * 0.9 + i * 1.05, [mx, my] = P2(4 + Math.cos(a) * (22 + (i % 3) * 5), -30 + Math.sin(a * 1.7) * 20); ctx.globalAlpha = a0 * (0.5 + Math.sin(t * 6 + i) * 0.5); rect(ctx, mx, my, 1, 1, '#e8ff8a'); ctx.globalAlpha *= 0.4; ell(ctx, mx, my, 2, 2, '#c8f060'); }
    if (D.amb === 'brasas') for (let i = 0; i < 6; i++) { const p = (t * 0.6 + i / 6) % 1, [mx, my] = P2(-12 + i * 5 + Math.sin(p * 8 + i) * 3, -8 - p * 60); ctx.globalAlpha = a0 * (1 - p); rect(ctx, mx, my, 1, 1 + (i % 2), i % 2 ? '#ff8a3a' : '#ffd27a'); }
    ctx.globalAlpha = a0;
  }
  if (lantern && !B.lampOff) { const [lx, ly] = P2(lantern[0], lantern[1] + 9); ctx.globalAlpha = a0 * (0.18 + Math.sin(t * 6) * 0.04); ell(ctx, lx, ly, 20, 17, '#ffb84a'); ctx.globalAlpha = a0 * 0.25; ell(ctx, lx, ly, 8, 7, '#fff0b0'); ctx.globalAlpha = a0; }
  if (pose === 'dazed') drawStars(x + f * 8 * S, y - 60 * S, t);
}

// Corpo-seco: esqueleto ressecado, pano esfarrapado, garras longas, flutua sem tocar o chão
function drawCorpoSeco(B) {
  const st = B.st, f = B.f, t = B.t, R = [], S = 1.8; // chefe final: desenhado quase no dobro do tamanho
  const A = (dx, dy, w, h, col) => R.push([Math.round(dx * S), Math.round(dy * S), Math.max(1, Math.round(w * S)), Math.max(1, Math.round(h * S)), col]);
  const seg = (x0, y0, x1, y1, th, col) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * S)); for (let i = 0; i <= n; i++) A(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, th, th, col); };
  const ph = B.phase || 1, ember = ph === 3 ? '#ff4a2a' : ph === 2 ? '#c8402e' : '#7a2a1e';
  // aura de fome que cresce a cada fase
  if (st !== 'still') { const a0 = ctx.globalAlpha; ctx.globalAlpha *= 0.12 + ph * 0.06 + Math.sin(t * 3) * 0.03; ell(ctx, B.x, B.y - 40, 26 + ph * 6, 46 + ph * 4, ember); ctx.globalAlpha = a0; }
  // coroa de galhos secos saindo do crânio
  for (const [x0, x1, y1] of [[-2, -8, -56], [0, -4, -60], [2, 4, -59], [3, 9, -54]]) { seg(x0, -44, x1, y1, 1, '#3a2a1c'); seg(x1, y1, x1 + (x1 < 0 ? -2 : 2), y1 + 2, 1, '#3a2a1c'); }
  // raízes mortas penduradas dos pés, balançando
  for (let i = -1; i <= 1; i += 2) for (let k = 0; k < 2; k++) seg(i * 3, -2, i * (4 + k * 3) + Math.sin(t * 2 + k) * 1.5, 6 + k * 2, 1, '#4a3424');
  // manto rasgado comprido atrás do corpo
  for (let i = -8; i <= 7; i++) A(i, -34, 1, 18 + (hash(i + 11) * 12 | 0) + Math.sin(t * 2.5 + i) * 1.5, i % 2 ? '#2e3a30' : '#1e2820');
  // brasa da fome no peito (cresce nas fases)
  A(-2, -28, 4, 4, ember); if (ph > 1) A(-1, -27, 2, 2, '#ffb08a');
  const bone = '#c8b898', boneD = '#8a7a5e', cloth = '#4a5a4a', cloth2 = '#2e3a30', dark = '#1a120c';
  const raise = st === 'thornsW' || st === 'rootsW' || st === 'drainW', claw = st === 'scratch', clawW = st === 'scratchW';
  const sway = Math.sin(t * 2) * 1;
  // pernas finas e pés pendurados (a terra não o recebe)
  seg(-2, -14, -3, -2, 2, boneD); seg(2, -14, 3 + sway, -3, 2, bone);
  // pano esfarrapado
  for (let i = -5; i <= 5; i++) A(i, -18, 1, 7 + (hash(i + 3) * 6 | 0), i % 2 ? cloth : cloth2);
  // costelas e coluna (a brasa da fome brilha por entre as costelas)
  A(-4, -32, 9, 14, dark); A(-2, -28, 5, 5, ember); A(-1, -27, 3, 3, ph > 1 ? '#ffb08a' : ember); for (let r = 0; r < 5; r++) A(-4, -31 + r * 3, 9, 1, bone); A(0, -32, 1, 14, boneD);
  A(-5, -34, 11, 3, cloth); A(-6, -33, 3, 6, cloth2);
  // braços longos com garras
  const armTo = claw ? [[4, -30], [18, -26], [24, -20]] : clawW ? [[4, -30], [-6, -36], [-12, -40]] : raise ? [[4, -30], [8, -40], [10, -48]] : st === 'still' ? [[4, -30], [8, -22], [14, -20]] : [[4, -30], [6, -20], [7 + sway, -12]];
  seg(armTo[0][0], armTo[0][1], armTo[1][0], armTo[1][1], 2, bone); seg(armTo[1][0], armTo[1][1], armTo[2][0], armTo[2][1], 2, bone);
  for (let i = -1; i <= 1; i++) seg(armTo[2][0], armTo[2][1], armTo[2][0] + 3 + (claw ? 3 : 0), armTo[2][1] + 3 + i * 2, 1, '#e8e0d0');
  seg(-4, -30, -7, -20, 2, boneD); seg(-7, -20, -6 - sway, -12, 2, boneD);
  // crânio
  A(-3, -42, 8, 8, bone); A(-3, -42, 2, 8, boneD); A(1, -39, 2, 2, dark); A(-2, -39, 2, 2, dark);
  A(2, -38, 1, 1, st === 'still' ? '#8a7a68' : '#ff4a2a'); A(-1, -38, 1, 1, st === 'still' ? '#8a7a68' : '#ff4a2a');
  A(0, -35, 4, 1, dark); A(1, -35, 1, 1, bone); A(3, -35, 1, 1, bone);
  A(-4, -44, 6, 2, '#5a4a38');
  const x = B.x, y = B.y, flash = B.flash > 0;
  ctx.globalAlpha *= 0.3; ell(ctx, x, GY, 16, 3, '#000'); ctx.globalAlpha /= 0.3;
  ctx.fillStyle = '#0c0806';
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; ctx.fillRect(Math.round(sx) - 1, Math.round(y + q[1]) - 1, q[2] + 2, q[3] + 2); }
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; ctx.fillStyle = flash ? '#fff' : q[4]; ctx.fillRect(Math.round(sx), Math.round(y + q[1]), q[2], q[3]); }
}

function drawStars(x, y, t) {
  for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1, sx = x + Math.cos(a) * 10, sy = y + Math.sin(a) * 3; rect(ctx, sx - 1, sy, 3, 1, '#f2c14e'); rect(ctx, sx, sy - 1, 1, 3, '#f2c14e'); rect(ctx, sx, sy, 1, 1, '#fff6c0'); }
}

// ---------- efeitos de golpe dos chefes (como nas pranchas) ----------
function bossFx(k, x, y, f, o = {}) { if (k === 'burst') VFX.burst(x, y); if (k === 'ring' && o.r < 100) VFX.play('fire/fire-ring', x, y + 6, { reach: o.r, dur: 0.8 }); G.bfx.push(Object.assign({ k, x, y, f, t: 0, life: k === 'burst' ? 0.35 : k === 'ring' ? 0.8 : 0.25 }, o)); }
function updateBossFx(dt) { for (const e of G.bfx) e.t += dt; G.bfx = G.bfx.filter(e => e.t < e.life); }
function drawBossFx() {
  for (const e of G.bfx) {
    const p = e.t / e.life;
    if (e.k === 'crescent') {
      // meia-lua vermelha da mordida/garra
      const r = (e.r || 22) * (0.7 + p * 0.4);
      for (let i = 0; i <= 18; i++) {
        const a = -HPI / 2 - 0.9 + i / 18 * (HPI + 1.8), th = Math.sin(i / 18 * HPI) * 5;
        for (let k = 0; k < th; k++) { ctx.globalAlpha = (1 - p) * (k < 2 ? 1 : 0.7); rect(ctx, e.x + e.f * Math.cos(a) * (r - k), e.y + Math.sin(a) * (r - k), 2, 2, k < 2 ? (e.col2 || '#ffd0c0') : (e.col || '#a01828')); }
      }
    } else if (e.k === 'claw') {
      for (let l = 0; l < 3; l++) for (let i = 0; i <= 12; i++) { const a = -1 + i / 12 * 2; ctx.globalAlpha = (1 - p) * 0.9; rect(ctx, e.x + e.f * (Math.cos(a) * (16 + l * 4)), e.y + Math.sin(a) * (12 + l * 3) + l * 2, 2, 1, l === 1 ? '#fff0e0' : '#c8402e'); }
    } else if (e.k === 'burst') {
      // estouro de terra/pedra no chão
      for (let i = -4; i <= 4; i++) { const h = (14 - Math.abs(i) * 2.4) * Math.sin(Math.min(1, p * 2.5) * HPI) * (1 - p * 0.6); ctx.globalAlpha = 1 - p * 0.7; rect(ctx, e.x + i * 4, e.y - h, 3, h, i % 2 ? (e.col || '#e8d0a8') : '#fff4dc'); }
    } else if (e.k === 'ring') {
      const r = (e.r || 110) * p; ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 40; i++) { const a = i / 40 * HPI * 2; rect(ctx, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * 0.5, 2, 2, i % 2 ? '#e8e0f0' : '#8a8ab0'); }
    }
  }
  ctx.globalAlpha = 1;
}
// liga os desenhos novos aos chefes e aumenta o tamanho de quem ficou pequeno perto das pranchas
for (const k of Object.keys(BEAST)) BOSSES[k].draw = B => drawBeast(B, BEAST[k]);
BOSSES.corposeco.draw = drawCorpoSeco;
