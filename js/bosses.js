'use strict';
// Os guardiões: Mapinguari, Capelobo, Pai do Mato, Labatut e o Corpo-seco.

function makeBoss(kind, x) {
  const D = BOSSES[kind];
  const B = { kind, x, y: GY, f: -1, t: 0, st: 'intro', tt: 1.4, flash: 0, phase: 1, vx: 0, vy: 0, contact: 12, poison: 0, pt: 0, last: '' };
  Object.assign(B, D.init(B)); B.hp = Math.round(B.hp * DIFF.bossHp); B.hpMax = B.hp;
  return B;
}
function bossBox(B) { return { x: B.x - B.w / 2, y: B.y - B.h, w: B.w, h: B.h }; }
function arenaX() { const A = G.lvl.arena; return [A.x0 + 16, A.x0 + AW - 16]; }
function go(B, st, tt) {
  B.st = st; B.tt = tt; B.done = false;
  if (B.kind === 'mapinguari') { B.stateDur = tt; B.stateT = 0; B.fxT = 0; B.hitDmg = 0; }
}
function bossHurt(B, dmg, dir, o = {}) {
  if (['intro', 'down', 'still', 'ask', 'yield'].includes(B.st) || B.inv) return false;
  if (B.hidden && !(FORMS[G.P.form] || {}).track) return false;
  B.hp -= dmg; B.flash = 0.1;
  if (B.kind === 'corposeco' && B.hp < 1) B.hp = 1; // ele não cai: para de atacar (ver corpoStill)
  if (!o.quiet) { SFX.hit(); VFX.hitB(B, dir, o); }
  if (o.poison) B.poison = 3;
  for (let i = 0; i < 4; i++) part(B.x, B.y - B.h * 0.6, (dir || 0) * rnd(20, 80) + rnd(-20, 20), rnd(-70, 0), 0.4, '#2a2230');
  const D = BOSSES[B.kind];
  if (D.onHurt) D.onHurt(B);
  if (B.hp <= 0) { B.hp = 0; B.hidden = false; go(B, 'down', 0); G.hazards = G.hazards.filter(h => h.team === 'p'); G.projs = []; onBossDown(B); }
  return true;
}
function updateBoss(dt) {
  updateBossFx(dt);
  const B = G.boss; if (!B) return;
  B.t += dt; B.flash -= dt; B.tt -= dt * DIFF.bossSpeed;
  if (B.kind === 'mapinguari') B.stateT = (B.stateT || 0) + dt * DIFF.bossSpeed;
  if (B.st !== B.prevSt) {
    const prev = B.prevSt; B.prevSt = B.st;
    if (B.kind !== 'mapinguari' && FX_ENTER[B.st]) FX_ENTER[B.st](B);
    if (B.st === 'down') { B.downAt = B.t; B.knelt = false; }
    if (B.st === 'rec' && ['slamW', 'stompW', 'jacareW', 'waveW'].includes(prev)) bossFx('burst', B.x + B.f * 22, B.kind === 'paidomato' ? 152 : GY, B.f, { col: B.kind === 'labatut' ? '#d8b890' : '#c8b088' });
  }
  if ((B.st === 'charge' || B.st === 'grab' || B.st === 'ambush' || B.st === 'stalk') && Math.random() < 0.7) part(B.x - B.f * 10, B.y - 1, -B.f * rnd(20, 60), rnd(-40, -10), 0.5, '#c8a888', 2, 60);
  if (B.poison > 0 && B.st !== 'down') { B.poison -= dt; B.pt -= dt; if (B.pt <= 0) { B.pt = 0.5; bossHurt(B, 3, 0, { quiet: true }); } }
  if (B.st === 'down' && !B.knelt && B.kind !== 'corposeco' && B.t - (B.downAt || 0) > 0.6) {
    // cai de joelhos: poeira e tremor; depois respira ofegante soltando faíscas de memória
    B.knelt = true; G.cam.shake = 5; SFX.boom(); bossFx('burst', B.x, B.kind === 'paidomato' ? 152 : GY, B.f, { col: '#c8b088' });
    for (let i = 0; i < 16; i++) part(B.x + rnd(-20, 20), GY - 2, rnd(-60, 60), rnd(-50, -10), 0.8, '#c8b088', 2, 120);
  }
  if (B.st === 'down' && B.knelt && Math.random() < 0.25) part(B.x + rnd(-14, 14), B.y - rnd(10, B.h), rnd(-6, 6), rnd(-30, -12), 1.4, pick(['#f6e3a6', '#bfe4ff', '#8fe37a']), 1, -10);
  if (B.st === 'intro') { if (B.tt <= 0) go(B, 'idle', 0.5); }
  else if (B.st !== 'down') BOSSES[B.kind].update(B, dt);
  const [a0, a1] = arenaX(); B.x = clamp(B.x, a0 + B.w / 2 - 8, a1 - B.w / 2 + 8);
  const contactActive = B.kind !== 'mapinguari' || B.st === 'walk' || B.st === 'charge';
  if (contactActive && B.contact && !B.hidden && !['down', 'intro', 'still', 'ask', 'yield'].includes(B.st) && overlap(bossBox(B), G.P)) hurtPlayer(B.hitDmg || B.contact, B.x);
}
function drawBoss(B) {
  if (B.hidden) {
    if ((FORMS[G.P.form] || {}).track) { ctx.globalAlpha = 0.35; BOSSES[B.kind].draw(B); ctx.globalAlpha = 1; rect(ctx, B.x + B.f * 8, B.y - 28, 2, 1, '#ff4a2a'); }
    return;
  }
  if (B.alpha != null) ctx.globalAlpha = Math.max(0, B.alpha);
  BOSSES[B.kind].draw(B);
  ctx.globalAlpha = 1;
}
function pdx() { return G.P.x + 5 - G.boss.x; }
function strands(P, x0, y0, w, h, col, seed) { for (let i = 0; i < w; i += 2) { const hh = 3 + hash(seed + i) * h * 0.4; P(x0 + i, y0 + hash(seed + i * 3) * (h - hh), 1, hh, col); } }

// Mapinguari: avisos âmbar precedem o golpe; terra e folhas acompanham o impacto.
function mapinguariDebris(x, y, count, leaves = false) {
  for (let i = 0; i < count; i++) part(x + rnd(-20, 20), y - rnd(1, 5), rnd(-75, 75), rnd(-100, -25), rnd(0.35, 0.7), leaves && i % 2 ? '#9aab63' : i % 3 ? '#947b54' : '#d1b77e', i % 4 ? 1 : 2, leaves ? 80 : 220);
}
function mapinguariImpact(B, second) {
  SFX.mapSlam(second ? 'echo' : 'heavy'); G.cam.shake = Math.max(G.cam.shake, second ? 5 : 7);
  bossFx('mapImpact', B.x, GY, B.f, { life: 0.6, r: second ? 58 : 48 });
  mapinguariDebris(B.x, GY, 24);
  const box = { x: B.x - 40, y: GY - 18, w: 80, h: 18 };
  if (overlap(box, G.P)) hurtPlayer(second ? 18 : 22, B.x);
  for (const s of [-1, 1]) addHazard({ kind: 'mapShock', owner: B, x: B.x + s * 27 - 7, y: GY - 14, w: 14, h: 14, vx: s * (second ? 125 : 150), life: 2.6, dmg: second ? 18 : 20, update: mapinguariShockUpdate, draw: mapinguariShockDraw });
}
function mapinguariHazardActive(h) {
  return G.boss === h.owner && h.owner.st !== 'down' && h.owner.hp > 0;
}
function mapinguariShockUpdate(h, dt) {
  if (!mapinguariHazardActive(h)) { h.life = 0; return; }
  h.x += h.vx * dt;
  const [a0, a1] = arenaX();
  if (h.x + h.w < a0 || h.x > a1 || solidAt(h.x + (h.vx > 0 ? h.w : 0), h.y + h.h - 2)) { h.life = 0; return; }
  if (!h.hit && overlap(h, G.P)) h.hit = hurtPlayer(h.dmg, h.x + h.w / 2);
  h.dust = (h.dust || 0) - dt;
  if (h.dust <= 0) { h.dust = 0.07; part(h.x + 7, GY, -Math.sign(h.vx) * rnd(12, 30), rnd(-45, -20), 0.3, '#c2a472', 1, 130); }
}
function mapinguariShockDraw(h) {
  const base = ctx.globalAlpha;
  ctx.globalAlpha = base * Math.min(1, h.life * 3);
  for (let i = 0; i < 7; i++) {
    const height = 4 + Math.sin(i / 6 * HPI) * 10;
    rect(ctx, h.x + i * 2, GY - height, 2, height, i % 2 ? '#62543c' : '#a08c5e');
    rect(ctx, h.x + i * 2, GY - height, 2, 2, '#e7cb8b');
  }
  line(ctx, h.x - 5, GY - 1, h.x + h.w + 5, GY - 1, '#bd995d');
  ctx.globalAlpha = base;
}
function mapinguariGasUpdate(h, dt) {
  if (!mapinguariHazardActive(h)) { h.life = 0; return; }
  h.x += h.vx * dt;
  const [a0, a1] = arenaX();
  if (h.x + h.w < a0 || h.x > a1) { h.life = 0; return; }
  const P = G.P;
  if (h.t < 0.22 || P.state === 'dead' || P.inv > 0 || G.lock > 0 || !overlap(h, P)) return;
  P.slow = 0.25; P.st = Math.max(0, P.st - 24 * dt); P.stDelay = 0.35;
  if (h.stun && !h.used) { h.used = true; P.stun = 0.35; floatText(P.x + 5, P.y - 6, 'atordoado', '#c9d88c'); }
}
function mapinguariGasDraw(h) {
  const base = ctx.globalAlpha, fade = Math.min(1, h.t / 0.3, h.life / 0.65);
  for (let i = 0; i < 9; i++) {
    const x = h.x + 8 + i / 8 * (h.w - 16), y = h.y + h.h / 2 + Math.sin(h.t * 3 + i * 2.2) * 7;
    ctx.globalAlpha = base * fade * (i % 2 ? 0.24 : 0.4);
    ell(ctx, x, y, 13, 10, i % 2 ? '#b1c86a' : '#617a37');
    ctx.globalAlpha = base * fade * 0.65;
    rect(ctx, x + Math.sin(h.t * 4 + i) * 6, y - 6, 2, 1, '#dbdf92');
  }
  ctx.globalAlpha = base;
}
function mapinguariRing(x, y, rx, ry, col, alpha) {
  const base = ctx.globalAlpha;
  ctx.globalAlpha = base * alpha;
  for (let i = 0; i < 40; i++) { const a = i / 40 * HPI * 2; rect(ctx, x + Math.cos(a) * rx, y + Math.sin(a) * ry, 2, 1, col); }
  ctx.globalAlpha = base;
}
function drawMapinguariWarnings(B) {
  if (B.mood || ['intro', 'down', 'dazed', 'idle', 'rec', 'walk'].includes(B.st)) return;
  const base = ctx.globalAlpha, p = B.stateDur > 0 ? clamp(1 - B.tt / B.stateDur, 0, 1) : 0;
  const pulse = 0.45 + Math.sin(B.t * 14) * 0.12, gold = '#e5c77e';
  if (B.st === 'slamW' || B.st === 'slam' && B.phase === 2 && B.stateT > 0.28 && B.stateT < 0.62) {
    const k = B.st === 'slamW' ? p : (B.stateT - 0.28) / 0.34;
    mapinguariRing(B.x, GY - 1, 40 + k * 18, 5 + k * 3, gold, pulse);
    mapinguariRing(B.x, GY - 1, 27, 4, '#7f9850', 0.6);
    for (let i = 0; i < 6; i++) rect(ctx, B.x - 24 + i * 9, GY - 4 - Math.sin(k * HPI) * (3 + i % 3), 2, 2, '#a38a58');
  } else if (B.st === 'chargeW') {
    const [a0, a1] = arenaX(), length = B.f > 0 ? a1 - B.x : B.x - a0;
    ctx.globalAlpha = base * (0.25 + p * 0.4);
    for (let x = 28; x < length; x += 18) {
      const px = B.x + B.f * x;
      line(ctx, px - B.f * 4, GY - 5, px, GY - 2, gold);
      line(ctx, px - B.f * 4, GY + 1, px, GY - 2, gold);
    }
    mapinguariRing(B.x, GY - 1, 26, 4, gold, 0.6);
  } else if (B.st === 'biteW' || B.st === 'clawW') {
    const reach = B.st === 'biteW' ? 57 : 74;
    ctx.globalAlpha = base * pulse;
    for (let x = 10; x < reach; x += 5) rect(ctx, B.x + B.f * x, GY - 2, 3, 1, gold);
    mapinguariRing(B.x + B.f * 16, B.y - 36, 6 + p * 4, 8 + p * 4, gold, pulse);
  } else if (B.st === 'gasW') {
    mapinguariRing(B.x + B.f * 15, B.y - 36, 7 + p * 5, 7 + p * 4, '#c7d779', pulse);
    ctx.globalAlpha = base * (0.25 + p * 0.3);
    for (let i = 0; i < 5; i++) rect(ctx, B.x + B.f * (18 + p * 12 + i * 5), B.y - 38 + Math.sin(B.t * 5 + i) * 6, 2, 2, '#a9bf67');
  }
  ctx.globalAlpha = base;
}
function drawMapinguariFx() {
  const base = ctx.globalAlpha;
  for (const e of G.bfx) {
    if (!e.k.startsWith('map')) continue;
    const p = clamp(e.t / e.life, 0, 1), fade = 1 - p;
    if (e.k === 'mapClaw') {
      for (let l = 0; l < 3; l++) for (let i = 0; i < 18; i++) {
        const a = (-1.15 + i / 17 * 2.3) * (e.reverse ? -1 : 1), r = 49 + l * 4;
        ctx.globalAlpha = base * fade * (0.35 + i / 26);
        const x = e.x + e.f * Math.cos(a) * r, y = e.y + Math.sin(a) * (15 + l * 3);
        rect(ctx, x - e.f * 2, y, 3, 2, '#a75e35'); rect(ctx, x, y, 2, 1, '#fff0ba');
      }
    } else if (e.k === 'mapBite') {
      const open = Math.sin(p * HPI) * 16;
      ctx.globalAlpha = base * fade;
      for (const s of [-1, 1]) for (let i = 0; i < 12; i++) {
        const x = e.x + e.f * i * 3, y = e.y + s * (open * Math.sin(i / 11 * HPI) + 2);
        rect(ctx, x, y, 3, 2, '#e0c389'); if (i % 3 === 0) rect(ctx, x, y - s * 2, 2, 4, '#fff0cb');
      }
    } else if (e.k === 'mapImpact') {
      mapinguariRing(e.x, e.y - 1, e.r * p, 3 + p * 8, '#e5c485', fade * 0.85);
      mapinguariRing(e.x, e.y, e.r * p * 0.7, 2 + p * 5, '#8b9c57', fade * 0.6);
      ctx.globalAlpha = base * fade;
      for (let i = -4; i <= 4; i++) { const x = e.x + i * p * 9, y = e.y - Math.sin(p * HPI) * (18 - Math.abs(i) * 2); rect(ctx, x, y, 2 + Math.abs(i % 2), 3, i % 2 ? '#af9463' : '#e7cc91'); }
    } else if (e.k === 'mapRoar') {
      for (let i = 0; i < 3; i++) { const k = clamp(p * 1.5 - i * 0.2, 0, 1); mapinguariRing(e.x, e.y, e.r * k, e.r * k * 0.7, i % 2 ? '#b6c779' : '#e7cd91', (1 - k) * 0.65); }
    } else if (e.k === 'mapBreath') {
      ctx.globalAlpha = base * fade * 0.45;
      for (let i = 0; i < 6; i++) ell(ctx, e.x + e.f * (p * 45 + i * 6), e.y + Math.sin(i * 2 + p * 5) * 8, 4 + i, 3 + i, i % 2 ? '#c4d67b' : '#7c984a');
    } else if (e.k === 'mapTrail') {
      ctx.globalAlpha = base * fade * 0.4;
      for (let i = 0; i < 4; i++) rect(ctx, e.x - e.f * (p * 18 + i * 4), e.y - 18 + i * 12, 6 + i * 2, 1, i % 2 ? '#c3c17c' : '#718049');
    }
    ctx.globalAlpha = base;
  }
}

const BOSSES = {
  // ---------------- Amazônia ----------------
  mapinguari: {
    nome: 'MAPINGUARI', sub: 'guardião da Amazônia',
    init: () => ({ w: 40, h: 84, hp: 430, contact: 14, stateDur: 1.4, stateT: 0, fxT: 0, slamHits: 0, swing: 0 }),
    update(B, dt) {
      const dx = pdx(), adx = Math.abs(dx), ph2 = B.phase === 2;
      if (B.phase === 1 && B.hp < B.hpMax / 2) {
        B.phase = 2; go(B, 'roar', 1.45); SFX.mapRoar();
        G.hazards = G.hazards.filter(h => h.owner !== B);
        G.cam.shake = Math.max(G.cam.shake, 5);
        bossFx('mapRoar', B.x, B.y - 42, B.f, { life: 1.1, r: 94 });
        mapinguariDebris(B.x, B.y, 24, true);
        floatText(B.x, B.y - 88, 'A MATA RUGE', '#e6c978'); return;
      }
      B.hitDmg = 0;
      B.fxT -= dt;
      if (B.st.endsWith('W') && B.fxT <= 0) {
        B.fxT = 0.1;
        const gas = B.st === 'gasW';
        part(B.x + B.f * rnd(8, 20), B.y - rnd(gas ? 30 : 45, gas ? 45 : 64), -B.f * rnd(3, 12), rnd(-20, -8), 0.35, gas ? '#a8c66b' : '#d7ba79', 1, -10);
      }
      switch (B.st) {
        case 'idle': {
          if (B.tt > 0) break;
          B.f = Math.sign(dx) || B.f;
          const r = Math.random();
          let n = adx < 58 ? (r < 0.4 ? 'biteW' : r < 0.78 ? 'clawW' : 'slamW')
            : ph2 && adx > 96 && r < 0.28 ? 'chargeW'
            : r < 0.32 ? 'walk' : r < 0.64 ? 'slamW' : 'gasW';
          if (n === B.last) n = n === 'gasW' ? 'walk' : adx < 82 ? (n === 'clawW' ? 'biteW' : 'clawW') : n === 'slamW' ? 'gasW' : 'slamW';
          B.last = n;
          go(B, n, { walk: 1.35, biteW: 0.72, clawW: 0.86, slamW: ph2 ? 0.94 : 1.08, gasW: 1.0, chargeW: 1.1 }[n]);
          if (n === 'chargeW') SFX.mapSnort();
          break;
        }
        case 'walk':
          B.f = Math.sign(dx) || B.f; B.x += B.f * (ph2 ? 35 : 27) * dt;
          if (B.fxT <= 0) { B.fxT = 0.48; SFX.mapStep(); G.cam.shake = Math.max(G.cam.shake, 1.2); mapinguariDebris(B.x, B.y, 4); }
          if (B.tt <= 0 || adx < 52) go(B, 'idle', 0.22); break;
        case 'biteW': if (B.tt <= 0) { go(B, 'bite', 0.34); SFX.mapBite(); bossFx('mapBite', B.x + B.f * 20, B.y - 36, B.f, { life: 0.3 }); } break;
        case 'bite': {
          if (B.stateT < 0.18) B.x += B.f * 58 * dt;
          const hb = { x: B.f > 0 ? B.x + 5 : B.x - 57, y: B.y - 42, w: 52, h: 36 };
          if (B.stateT >= 0.06 && B.stateT <= 0.26 && !B.done && overlap(hb, G.P)) B.done = hurtPlayer(28, B.x);
          if (B.tt <= 0) go(B, 'rec', 0.82); break;
        }
        case 'clawW': if (B.tt <= 0) { go(B, 'claw', ph2 ? 0.78 : 0.42); B.swing = -1; } break;
        case 'claw': {
          const swing = ph2 && B.stateT >= 0.43 ? 1 : 0, at = B.stateT - swing * 0.43;
          if (at >= 0.08 && B.swing !== swing) {
            B.swing = swing; B.done = false; SFX.mapClaw();
            bossFx('mapClaw', B.x + B.f * 12, B.y - 35, B.f, { life: 0.28, reverse: !!swing });
          }
          const hb = { x: B.f > 0 ? B.x + 6 : B.x - 74, y: B.y - 39, w: 68, h: 34 };
          if (at >= 0.08 && at <= 0.28 && !B.done && overlap(hb, G.P)) B.done = hurtPlayer(21, B.x);
          if (B.tt <= 0) go(B, 'rec', ph2 ? 0.78 : 0.92); break;
        }
        case 'slamW': if (B.tt <= 0) { go(B, 'slam', ph2 ? 1.15 : 0.62); B.slamHits = 0; } break;
        case 'slam':
          if (B.slamHits === 0 && B.stateT >= 0.12) { B.slamHits = 1; mapinguariImpact(B, false); }
          if (ph2 && B.slamHits === 1 && B.stateT >= 0.62) { B.slamHits = 2; mapinguariImpact(B, true); }
          if (B.tt <= 0) go(B, 'rec', 1.05); break;
        case 'gasW': if (B.tt <= 0) { go(B, 'gas', 0.7); SFX.mapBreath(); } break;
        case 'gas':
          if (!B.done && B.stateT >= 0.1) {
            B.done = true;
            const w = ph2 ? 86 : 68;
            addHazard({ kind: 'mapGas', owner: B, x: B.f > 0 ? B.x + 12 : B.x - 12 - w, y: GY - 45, w, h: 40, vx: B.f * (ph2 ? 35 : 28), life: ph2 ? 4.8 : 4.2, stun: ph2, update: mapinguariGasUpdate, draw: mapinguariGasDraw });
            bossFx('mapBreath', B.x + B.f * 16, B.y - 36, B.f, { life: 0.55 });
          }
          if (B.tt <= 0) go(B, 'rec', 0.9); break;
        case 'chargeW':
          if (B.tt > 0.4) B.f = Math.sign(dx) || B.f;
          if (B.tt <= 0) { go(B, 'charge', 2.1); SFX.mapCharge(); } break;
        case 'charge': {
          B.x += B.f * 185 * dt; B.hitDmg = 26;
          if (B.fxT <= 0) { B.fxT = 0.08; mapinguariDebris(B.x - B.f * 12, B.y, 4); bossFx('mapTrail', B.x - B.f * 12, B.y - 30, B.f, { life: 0.22 }); }
          const [a0, a1] = arenaX();
          if (B.x - B.w / 2 <= a0 - 6 || B.x + B.w / 2 >= a1 + 6 || B.tt <= 0) {
            SFX.mapSlam('wall'); G.cam.shake = Math.max(G.cam.shake, 7); go(B, 'dazed', 1.65);
            bossFx('mapImpact', B.x + B.f * 20, B.y - 15, B.f, { life: 0.55, r: 34 });
            mapinguariDebris(B.x + B.f * 18, B.y, 20);
            floatText(B.x, B.y - 88, 'vulnerável', '#e6c978');
          }
          break;
        }
        case 'dazed': case 'roar': case 'rec': if (B.tt <= 0) go(B, 'idle', ph2 ? 0.32 : 0.5); break;
      }
    },
  },

  // ---------------- Cerrado ----------------
  capelobo: {
    nome: 'CAPELOBO', sub: 'guardião do Cerrado',
    init: () => ({ w: 22, h: 58, hp: 400, contact: 13, fires: 0 }),
    onHurt(B) {
      const k = Math.floor((1 - B.hp / B.hpMax) * 5);
      while (B.fires < Math.min(4, k)) {
        B.fires++;
        const [a0] = arenaX();
        const slots = [20, 85, 160, 230].map(v => a0 + v).filter(x => !G.hazards.some(h => h.kind === 'fire' && Math.abs(h.x - x) < 10));
        const x = pick(slots);
        if (x != null) { addHazard({ kind: 'fire', x, y: GY - 14, w: 40, h: 14, life: 999, dmg: 10 }); SFX.fire(); VFX.play('terra/acende', x + 20, GY); floatText(x + 20, GY - 24, 'o capim pega fogo', '#ff8a3a'); }
      }
    },
    update(B, dt) {
      const dx = pdx(), adx = Math.abs(dx), sp = B.phase === 2 ? 1.25 : 1;
      if (B.phase === 1 && B.hp < B.hpMax / 2) { B.phase = 2; G.dark = 0.25; SFX.roar(); floatText(B.x, B.y - 40, 'uivo', '#ff8a3a'); }
      B.hitDmg = 0;
      // física de pulo
      if (!B.onGround) { B.vy += GRAV * dt; B.y += B.vy * dt; B.x += B.vx * dt; if (B.y >= GY) { B.y = GY; B.vy = 0; B.onGround = true; if (B.st === 'leap') { SFX.land(); G.cam.shake = 3; for (const s of [-1, 1]) addHazard({ kind: 'shock', x: B.x + s * 8, y: GY - 6, w: 6, h: 6, vx: s * 110, life: 0.8, dmg: 12, col: '#c8903a' }); go(B, 'rec', 0.5); } } }
      switch (B.st) {
        case 'idle': {
          if (B.tt > 0) break;
          B.f = Math.sign(dx) || B.f;
          const r = Math.random();
          let n = adx < 34 ? 'clawW' : B.phase === 2 && r < 0.2 && B.last !== 'howlW' ? 'howlW' : r < (B.phase === 2 ? 0.45 : 0.3) ? 'hide' : r < 0.65 ? 'leapW' : 'stalk';
          if (n === 'hide' && B.last === 'hide') n = 'stalk';
          B.last = n; go(B, n, { clawW: 0.35, leapW: 0.4, stalk: 1.2, hide: 3, howlW: 0.6 }[n]);
          break;
        }
        case 'stalk': B.f = Math.sign(dx) || B.f; B.x += B.f * 80 * sp * dt; if (adx < 30 || B.tt <= 0) go(B, adx < 30 ? 'clawW' : 'idle', 0.35); break;
        case 'clawW': B.f = Math.sign(dx) || B.f; if (B.tt <= 0) { go(B, 'claw', 0.36); B.hits = 0; SFX.swing(); } break;
        case 'claw': {
          const k = B.tt > 0.18 ? 1 : 2;
          if (k !== B.hits) { B.hits = k; B.done = false; if (k === 2) SFX.swing(); }
          const hb = { x: B.f > 0 ? B.x + 4 : B.x - 34, y: B.y - 34, w: 30, h: 28 };
          if (!B.done && overlap(hb, G.P)) B.done = hurtPlayer(16, B.x);
          B.x += B.f * 40 * dt;
          if (B.tt <= 0) go(B, 'rec', 0.5 / sp); break;
        }
        case 'leapW': B.f = Math.sign(dx) || B.f; if (B.tt <= 0) { B.vy = -270; B.vx = clamp(dx / 0.6, -200, 200); B.onGround = false; go(B, 'leap', 2); SFX.roar(); } break;
        case 'leap': B.hitDmg = 20; break;
        case 'hide': {
          if (!B.hidden) {
            const [a0, a1] = arenaX(); const grass = G.lvl.grass.filter(g => g.x >= a0 - 20 && g.x < a1);
            const tgt = grass.length ? grass.reduce((a, g) => Math.abs(g.x + g.w / 2 - B.x) < Math.abs(a.x + a.w / 2 - B.x) ? g : a) : null;
            const tx = tgt ? tgt.x + tgt.w / 2 : B.x;
            B.f = Math.sign(tx - B.x) || B.f; B.x += B.f * 130 * sp * dt;
            if (Math.abs(tx - B.x) < 6 || B.tt < 2) { B.hidden = true; B.hideT = rnd(1.1, 2) / sp; SFX.step(); }
          } else {
            B.hideT -= dt;
            if (B.t % 0.35 < dt) part(B.x + rnd(-6, 6), GY - 1, 0, 0, 1.2, '#140a0a', 2, 0);
            B.x += Math.sign(dx) * 30 * dt;
            if (B.hideT <= 0) { B.x = G.P.x + 5 + (Math.random() < 0.5 ? -1 : 1) * rnd(34, 46); B.rustle = B.x; B.f = Math.sign(G.P.x + 5 - B.x) || 1; go(B, 'ambushW', 0.55 / sp); SFX.step(); }
          }
          break;
        }
        case 'ambushW': if (B.tt <= 0) { B.hidden = false; B.rustle = 0; B.f = Math.sign(pdx()) || B.f; go(B, 'ambush', 0.32); SFX.roar(); } break;
        case 'ambush': B.x += B.f * 230 * dt; B.hitDmg = 22; if (B.tt <= 0) go(B, 'rec', 0.6); break;
        case 'howlW': if (B.tt <= 0) { SFX.roar(); G.cam.shake = 5; addHazard({ kind: 'howl', x: B.x, y: B.y - 20, r: 0, life: 0.85, update: howlUpd, draw: () => {} }); go(B, 'howl', 0.5); } break;
        case 'howl': if (B.tt <= 0) go(B, 'rec', 0.4); break;
        case 'rec': if (B.tt <= 0 && B.onGround !== false) go(B, 'idle', B.phase === 2 ? 0.15 : 0.35); break;
      }
      if (B.onGround === undefined) B.onGround = true;
    },
  },

  // ---------------- Pantanal ----------------
  paidomato: {
    nome: 'PAI DO MATO', sub: 'guardião do Pantanal — o único que ainda resiste',
    init: () => ({ w: 22, h: 70, hp: 460, contact: 9, y: 152 }),
    update(B, dt) {
      const dx = pdx(), adx = Math.abs(dx), sp = B.harsh ? 1.3 : 1;
      B.y = 152 + Math.sin(B.t * 1.5) * 1.5;
      if (!B.asked && B.hp < B.hpMax / 2) { B.asked = true; go(B, 'ask', 99); STORY.paiAsk(B); return; }
      if (B.asked && B.phase === 1 && B.st !== 'ask') B.phase = 2;
      switch (B.st) {
        case 'idle': {
          if (B.tt > 0) { B.x += clamp(dx, -1, 1) * 18 * dt; break; }
          B.f = Math.sign(dx) || B.f;
          const r = Math.random();
          let n = adx < 46 ? 'staffW' : r < 0.35 ? 'birdsW' : r < 0.7 ? 'jacareW' : (B.phase === 2 && B.last !== 'waveW' ? 'waveW' : 'glide');
          B.last = n; go(B, n, { staffW: 0.5 / sp, birdsW: 0.7 / sp, jacareW: 0.45 / sp, waveW: 0.9, glide: 1.2 }[n]);
          if (n === 'glide') { const [a0, a1] = arenaX(); B.gx = G.P.x + 5 < (a0 + a1) / 2 ? a1 - 50 : a0 + 50; }
          break;
        }
        case 'glide': B.f = Math.sign(B.gx - B.x) || B.f; B.x += clamp(B.gx - B.x, -1, 1) * 90 * dt; if (B.tt <= 0 || Math.abs(B.gx - B.x) < 4) go(B, 'idle', 0.3); break;
        case 'staffW': B.f = Math.sign(dx) || B.f; if (B.tt <= 0) { go(B, 'staff', 0.2); SFX.swing(); } break;
        case 'staff': { const hb = { x: B.f > 0 ? B.x : B.x - 54, y: B.y - 52, w: 54, h: 44 }; if (!B.done && overlap(hb, G.P)) B.done = hurtPlayer(18, B.x); if (B.tt <= 0) go(B, 'rec', 0.6 / sp); break; }
        case 'birdsW': if (B.tt <= 0) {
          const [a0, a1] = arenaX(); const P2 = G.P;
          for (let i = 0; i < (B.phase === 2 ? 4 : 3); i++) setTimeout(() => {
            if (G.boss !== B || B.st === 'down' || B.st === 'ask' || B.st === 'yield') return;
            const sx = i % 2 ? a1 + 10 : a0 - 10, sy = 20 + i * 6, tx = P2.x + 5, ty = P2.y + 8, L2 = Math.hypot(tx - sx, ty - sy);
            shoot({ team: 'e', x: sx, y: sy, vx: (tx - sx) / L2 * 150 * sp, vy: (ty - sy) / L2 * 150 * sp, w: 8, h: 4, dmg: 14, kind: 'bird', life: 3.5 }); SFX.bird();
          }, i * 380);
          go(B, 'rec', 0.8);
        } break;
        case 'jacareW': if (B.tt <= 0) {
          const tgt = G.P.x + 5;
          addHazard({ kind: 'jacare', x: B.x, y: 140, w: 26, h: 16, tx: tgt, vx: Math.sign(tgt - B.x) * 130 * sp, life: 2.6, update: jacareUpd, draw: jacareDraw });
          go(B, 'rec', 0.7);
        } break;
        case 'waveW': if (B.tt <= 0) {
          const [a0, a1] = arenaX(); const fromL = G.P.x + 5 > B.x;
          addHazard({ kind: 'wave', x: fromL ? a0 - 20 : a1, y: GY - 18, w: 20, h: 20, vx: (fromL ? 1 : -1) * 125, life: 3.2, dmg: 20, update: waveUpd, draw: waveDraw }); VFX.splash(fromL ? a0 : a1, GY);
          SFX.splash(); go(B, 'rec', 1);
        } break;
        case 'rec': if (B.tt <= 0) go(B, 'idle', (B.phase === 2 ? 0.3 : 0.6) / sp); break;
      }
    },
  },

  // ---------------- Caatinga ----------------
  labatut: {
    nome: 'LABATUT', sub: 'guardião da Caatinga — quase sem memória',
    init: () => ({ w: 48, h: 74, hp: 520, contact: 16 }),
    update(B, dt) {
      const dx = pdx(), adx = Math.abs(dx);
      if (B.phase === 1 && B.hp < B.hpMax / 2) { B.phase = 2; SFX.roar(); G.cam.shake = 5; }
      if (B.sunT > 0) { B.sunT -= dt; G.heatMul = 2.6; if (B.sunT <= 0) G.heatMul = 1; }
      const sh = G.dynShade[0];
      if (sh) { sh.x += sh.vx * dt; const [a0, a1] = arenaX(); if (sh.x < a0 - 10 || sh.x + sh.w > a1 + 10) sh.vx *= -1; }
      B.hitDmg = 0;
      switch (B.st) {
        case 'idle': {
          if (B.tt > 0) { B.f = Math.sign(dx) || B.f; B.x += B.f * 16 * dt; break; }
          B.f = Math.sign(dx) || B.f;
          const r = Math.random();
          let n;
          if (r < 0.13 && B.last !== 'lost') n = 'lost';
          else if (adx < 44) n = r < 0.6 ? 'stompW' : 'grabW';
          else n = r < 0.3 ? 'rockW' : r < 0.47 ? 'slashW' : r < 0.62 ? (B.sunT > 0 ? 'rockW' : 'sunW') : r < 0.8 ? 'grabW' : 'stompW';
          B.last = n; go(B, n, { lost: 1.9, stompW: 0.75, grabW: 0.55, rockW: 0.6, sunW: 0.9, slashW: 0.55 }[n]);
          if (n === 'lost') floatText(B.x, B.y - 62, pick(['...quem... eu era?', '...o que eu guardava?', '...esqueci...']), '#d8ccb4');
          break;
        }
        case 'lost': if (B.tt <= 0) go(B, 'idle', 0.3); break;
        case 'rockW': if (B.tt <= 0) {
          const T = 1.0, d2 = G.P.x + 5 - B.x, dy = (G.P.y + 11) - (B.y - 80);
          shoot({ team: 'e', x: B.x + B.f * 10, y: B.y - 80, vx: d2 / T, vy: (dy - 0.5 * 420 * T * T) / T, w: 10, h: 10, dmg: 20, kind: 'rock', grav: 420, life: 3 });
          if (B.phase === 2) shoot({ team: 'e', x: B.x, y: B.y - 80, vx: d2 / T * 0.6, vy: (dy - 0.5 * 420 * T * T) / T, w: 10, h: 10, dmg: 18, kind: 'rock', grav: 420, life: 3 });
          SFX.swing(); go(B, 'rec', 0.5);
        } break;
        case 'stompW': if (B.tt <= 0) { SFX.boom(); G.cam.shake = 7; VFX.play('nature/quake', B.x, GY, { dur: 1.2 }); for (const s of [-1, 1]) addHazard({ kind: 'shock', x: B.x + s * 14, y: GY - 9, w: 8, h: 9, vx: s * 150, life: 2.2, dmg: 18, col: '#b08a70' }); for (let i = 0; i < 20; i++) part(B.x + rnd(-30, 30), GY, rnd(-40, 40), rnd(-60, -10), 0.9, '#c8a488', 2, 40); go(B, 'rec', 0.7); } break;
        case 'sunW': if (B.tt <= 0) { B.sunT = 5; showToast('Sol a pino', 'procure a sombra', 1.6); SFX.fire(); go(B, 'rec', 0.6); } break;
        case 'grabW': B.f = Math.sign(dx) || B.f; if (B.tt <= 0) { go(B, 'grab', 1); SFX.roar(); } break;
        case 'grab': { B.x += B.f * 150 * dt; B.hitDmg = 24; const [a0, a1] = arenaX(); if (B.x - 15 <= a0 || B.x + 15 >= a1 || B.tt <= 0) go(B, 'rec', 0.8); break; }
        case 'slashW': B.f = Math.sign(dx) || B.f; if (B.tt <= 0) { shoot({ team: 'e', x: B.x + B.f * 22, y: B.y - 34, vx: B.f * 175, vy: 0, w: 14, h: 28, dmg: 18, kind: 'crescentp', life: 2.4 }); SFX.swing(); go(B, 'slash', 0.25); } break;
        case 'slash': if (B.tt <= 0) go(B, 'rec', 0.5); break;
        case 'rec': if (B.tt <= 0) go(B, 'idle', B.phase === 2 ? 0.25 : 0.5); break;
      }
    },
  },

  // ---------------- Mata Atlântica ----------------
  corposeco: {
    nome: 'CORPO-SECO', sub: 'o homem que a terra rejeitou',
    init: () => ({ w: 24, h: 74, hp: 980, contact: 16, y: GY - 8 }),
    update(B, dt) {
      const dx = pdx(), adx = Math.abs(dx), ph2 = B.phase === 2;
      B.y = GY - 8 + Math.sin(B.t * 1.6) * 3;
      if (Math.random() < 0.5) part(B.x + rnd(-9, 9), B.y + 2, rnd(-5, 5), rnd(10, 30), 0.8, '#6a5a48', 1, 60);
      // três fases: a fome cresce (60%) e depois a terra inteira se volta contra você (30%)
      if (B.phase === 1 && B.hp < B.hpMax * 0.6) { B.phase = 2; SFX.roar(); G.cam.shake = 6; VFX.play('shadow/dark-explosion', B.x, GY, { dur: 2.2 }); floatText(B.x, B.y - 82, 'a fome cresce', '#c8402e'); bossFx('ring', B.x, B.y - 40, B.f, { r: 150 }); }
      if (B.phase === 2 && B.hp < B.hpMax * 0.3) { B.phase = 3; SFX.roar(); G.cam.shake = 8; VFX.play('shadow/dark-explosion', B.x, GY, { dur: 2.2 }); floatText(B.x, B.y - 82, 'a terra me pertence', '#ff4a2a'); bossFx('ring', B.x, B.y - 40, B.f, { r: 180 }); }
      const ph3 = B.phase === 3;
      if (B.hp <= B.hpMax * 0.15 && B.st !== 'still') { go(B, 'still', 999); G.hazards = G.hazards.filter(h => h.team === 'p'); G.projs = G.projs.filter(p => p.team === 'p'); for (const e of G.ents) e.hp = 0; STORY.corpoStill(B); return; }
      switch (B.st) {
        case 'idle': {
          const want = G.P.x + 5 - Math.sign(dx || 1) * 90;
          B.x += clamp(want - B.x, -1, 1) * (ph3 ? 40 : 30) * dt; B.f = Math.sign(dx) || B.f;
          if (B.tt > 0) break;
          const r = Math.random();
          let n = r < 0.26 ? 'rootsW' : r < 0.48 ? 'thornsW' : r < 0.64 ? 'drainW' : r < 0.76 && G.ents.length < (ph3 ? 4 : 3) ? 'summon' : r < 0.88 ? 'rainW' : 'blink';
          if (ph2 && r > 0.82 && !G.hazards.some(h => h.kind === 'tornado')) n = 'tornadoW';
          if (n === B.last) n = 'rootsW';
          if (adx < 56) n = 'scratchW';
          B.last = n; go(B, n, { rootsW: 0.4, thornsW: 0.45, drainW: 0.55, summon: 0.7, blink: 0.35, scratchW: 0.32, tornadoW: 0.6, rainW: 0.6 }[n]);
          break;
        }
        case 'rootsW': if (B.tt <= 0) {
          const px = G.P.x + 5, n = ph3 ? 7 : ph2 ? 5 : 4;
          for (let i = 0; i < n; i++) { const x = px + (i - (n - 1) / 2) * 28; addHazard({ kind: 'roots', x: x - 10, y: GY - 36, w: 20, h: 36, warn: 0.7 + i * 0.07, life: 1.2 + i * 0.07, dmg: 26, col: '#c8803a', col2: '#4a3424' }); }
          go(B, 'rec', ph3 ? 0.7 : 0.9);
        } break;
        case 'thornsW': if (B.tt <= 0) {
          const a0 = Math.atan2(G.P.y + 11 - (B.y - 40), dx);
          for (let i = -3; i <= 3; i++) { const a = a0 + i * 0.18; shoot({ team: 'e', x: B.x, y: B.y - 40, vx: Math.cos(a) * 165, vy: Math.sin(a) * 165, w: 5, h: 3, dmg: 16, kind: 'thorn', life: 2.5 }); }
          if (ph2) setTimeout(() => { if (G.boss === B && B.st !== 'still') for (let i = -2; i <= 2; i++) { const a = Math.atan2(G.P.y + 11 - (B.y - 40), G.P.x + 5 - B.x) + i * 0.25; shoot({ team: 'e', x: B.x, y: B.y - 40, vx: Math.cos(a) * 185, vy: Math.sin(a) * 185, w: 5, h: 3, dmg: 16, kind: 'thorn', life: 2.5 }); } }, 380);
          SFX.swing(); go(B, 'rec', 0.7);
        } break;
        case 'drainW': if (B.tt <= 0) {
          const a = Math.atan2(G.P.y + 11 - (B.y - 36), dx);
          for (const da of ph3 ? [-0.25, 0, 0.25] : [0]) shoot({ team: 'e', x: B.x, y: B.y - 36, vx: Math.cos(a + da) * 115, vy: Math.sin(a + da) * 115, w: 8, h: 6, dmg: 18, kind: 'drain', life: 3, onHit: () => { if (G.boss === B) { B.hp = Math.min(B.hpMax, B.hp + 45); floatText(B.x, B.y - 80, 'suga a vida', '#c8402e'); } } });
          go(B, 'rec', 0.6);
        } break;
        case 'summon': if (B.tt <= 0) {
          const [a0, a1] = arenaX();
          for (const x of [a0 + 30, a1 - 40]) { const e = makeEnemy(pick(['flyer', 'crawler', 'lanceiro', 'brute']), x, null); if (ET[e.type].fly) { e.y = 90; e.hy = 90; } e.mem = 0; G.ents.push(e); for (let i = 0; i < 10; i++) part(x, e.y, rnd(-30, 30), rnd(-40, 0), 0.6, '#1c1622'); }
          go(B, 'rec', 0.8);
        } break;
        case 'blink': if (B.tt <= 0) { VFX.blink(B);
          for (let i = 0; i < 14; i++) part(B.x, B.y - 34, rnd(-60, 60), rnd(-60, 20), 0.6, '#6a5a48');
          const [a0, a1] = arenaX(); B.x = ph3 ? clamp(G.P.x + 5 - G.P.f * 50, a0 + 20, a1 - 20) : G.P.x + 5 < (a0 + a1) / 2 ? a1 - 30 : a0 + 30; // na fase 3 aparece nas suas costas
          for (let i = 0; i < 14; i++) part(B.x, B.y - 34, rnd(-60, 60), rnd(-60, 20), 0.6, '#6a5a48');
          go(B, 'rec', 0.5);
        } break;
        case 'scratchW': B.f = Math.sign(dx) || B.f; if (B.tt <= 0) { go(B, 'scratch', 0.22); SFX.swing(); } break;
        case 'scratch': { const hb = { x: B.f > 0 ? B.x : B.x - 46, y: B.y - 66, w: 46, h: 60 }; if (!B.done && overlap(hb, G.P)) B.done = hurtPlayer(28, B.x); B.x += B.f * 80 * dt; if (B.tt <= 0) go(B, 'rec', 0.5); break; }
        case 'tornadoW': if (B.tt <= 0) { addHazard({ kind: 'tornado', x: B.x - 11, y: GY - 80, w: 22, h: 80, life: ph3 ? 6 : 4.5, dmg: 12, update: tornadoUpd, draw: tornadoDraw }); SFX.fire(); go(B, 'rec', 0.6); } break;
        case 'rainW': if (B.tt <= 0) {
          // chuva de espinhos: cai do alto em volta de você
          const px = G.P.x + 5, n = ph3 ? 9 : 6;
          for (let i = 0; i < n; i++) { const x = px + (i - (n - 1) / 2) * 22 + rnd(-6, 6); setTimeout(() => { if (G.boss === B && B.st !== 'still') shoot({ team: 'e', x, y: -10, vx: 0, vy: 190, w: 4, h: 6, dmg: 16, kind: 'thorn', life: 2 }); }, i * 90); }
          SFX.swing(); go(B, 'rec', 0.8);
        } break;
        case 'rec': if (B.tt <= 0) go(B, 'idle', ph3 ? 0.2 : ph2 ? 0.3 : 0.55); break;
      }
    },
  },
};
function jacareUpd(h, dt) {
  if (!h.jaws) { h.x += h.vx * dt; if (Math.random() < 0.6) part(h.x + 13, 152, rnd(-20, 20), rnd(-30, -10), 0.3, '#d8a8c8'); if ((h.vx > 0 && h.x + 13 >= h.tx) || (h.vx < 0 && h.x + 13 <= h.tx) || h.t > 1.6) { h.jaws = 0.4; SFX.splash(); } }
  else { h.jaws -= dt; const box = { x: h.x, y: 128, w: 26, h: 26 }; if (!h.hit && h.jaws < 0.3 && overlap(box, G.P)) h.hit = hurtPlayer(22, h.x + 13); if (h.jaws <= 0) h.life = 0; }
}
function jacareDraw(h) {
  if (!h.jaws) { rect(ctx, h.x + 4, 151, 18, 1, '#2a1c14'); rect(ctx, h.x + 18, 150, 3, 1, '#ffd27a'); return; }
  const o = clamp((0.4 - h.jaws) * 60, 0, 14);
  rect(ctx, h.x, 150 - o, 26, 4, '#3a4a2a'); rect(ctx, h.x, 150 + 2, 26, 3, '#3a4a2a');
  for (let i = 0; i < 6; i++) { rect(ctx, h.x + 2 + i * 4, 154 - o, 1, 2, '#efe8dc'); rect(ctx, h.x + 3 + i * 4, 150, 1, 2, '#efe8dc'); }
  rect(ctx, h.x + 20, 148 - o, 2, 2, '#ffd27a');
}
function waveUpd(h, dt) { h.x += h.vx * dt; if (!h.hit && overlap(h, G.P)) h.hit = hurtPlayer(h.dmg, h.x + 10); if (Math.random() < 0.8) part(h.x + 10, h.y, rnd(-20, 20), rnd(-60, -20), 0.4, '#c8d8f0'); const [a0, a1] = arenaX(); if (h.x < a0 - 40 || h.x > a1 + 20) h.life = 0; }
function waveDraw(h) { for (let i = 0; i < h.w; i++) { const hh = h.h * Math.sin(i / h.w * Math.PI); rect(ctx, h.x + i, h.y + h.h - hh, 1, hh, i % 3 ? '#7a8ab8' : '#c8d8f0'); } }

function howlUpd(h, dt) { h.r += 170 * dt; const P = G.P, d = Math.hypot(P.x + 5 - h.x, (P.y + 11 - h.y) * 2); if (!h.hit && Math.abs(d - h.r) < 9 && P.state !== 'dash') { h.hit = hurtPlayer(14, h.x); if (h.hit) P.slow = 1; } }
function tornadoUpd(h, dt) { const P = G.P; h.x += clamp(P.x + 5 - (h.x + h.w / 2), -1, 1) * 46 * dt; h.tick -= dt; if (h.tick <= 0 && overlap(h, P)) { h.tick = 0.5; if (hurtPlayer(h.dmg, h.x + h.w / 2)) P.vy = -200; } if (Math.random() < 0.8) part(h.x + rnd(0, h.w), GY - rnd(0, 6), rnd(-30, 30), rnd(-80, -30), 0.6, pick(['#8a7a5e', '#c8b898', '#5a4a38']), 1, -20); }
function tornadoDraw(h) { VFX.keep('tornado', 'nature/tornado', h.x + h.w / 2, GY, { height: 88, palette: VFX.PAL.shadow, dust: VFX.PAL.bone, layer: 'front' }); return; const k = Math.min(1, h.t / 0.4) * Math.min(1, h.life); ctx.globalAlpha = 0.75 * k; for (let i = 0; i < h.h; i += 2) { const w = 4 + i / h.h * 16, o = Math.sin(G.t * 9 + i * 0.25) * 3; rect(ctx, h.x + h.w / 2 - w / 2 + o, GY - i, w, 2, i % 6 < 3 ? '#a8987a' : '#6a5a44'); } ctx.globalAlpha = 1; }
