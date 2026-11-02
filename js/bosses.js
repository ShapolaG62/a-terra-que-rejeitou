'use strict';
// Os guardiões: Mapinguari, Capelobo, Pai do Mato, Labatut e o Corpo-seco.

function makeBoss(kind, x) {
  const D = BOSSES[kind];
  const B = { kind, x, y: GY, f: -1, t: 0, st: 'intro', tt: 1.4, flash: 0, phase: 1, vx: 0, vy: 0, contact: 12, poison: 0, pt: 0, last: '' };
  Object.assign(B, D.init(B)); B.hp = Math.round(B.hp * DIFF.bossHp); B.hpMax = B.hp;
  return B;
}
function bossBox(B) { return { x: B.x - B.w / 2, y: B.y - B.h, w: B.w, h: B.h }; }
function arenaX() { const A = G.lvl.arena; return [A.x0 + 16, A.x0 + W - 16]; }
function go(B, st, tt) { B.st = st; B.tt = tt; B.done = false; }
function bossHurt(B, dmg, dir, o = {}) {
  if (['intro', 'down', 'still', 'ask', 'yield'].includes(B.st) || B.inv) return false;
  if (B.hidden && !(FORMS[G.P.form] || {}).track) return false;
  B.hp -= dmg; B.flash = 0.1;
  if (B.kind === 'corposeco' && B.hp < 1) B.hp = 1; // ele não cai: para de atacar (ver corpoStill)
  if (!o.quiet) SFX.hit();
  if (o.poison) B.poison = 3;
  for (let i = 0; i < 4; i++) part(B.x, B.y - B.h * 0.6, (dir || 0) * rnd(20, 80) + rnd(-20, 20), rnd(-70, 0), 0.4, '#2a2230');
  const D = BOSSES[B.kind];
  if (D.onHurt) D.onHurt(B);
  if (B.hp <= 0) { B.hp = 0; B.hidden = false; go(B, 'down', 0); G.hazards = G.hazards.filter(h => h.team === 'p'); G.projs = []; onBossDown(B); }
  return true;
}
function updateBoss(dt) {
  const B = G.boss; if (!B) return;
  B.t += dt; B.flash -= dt; B.tt -= dt * DIFF.bossSpeed;
  updateBossFx(dt);
  if (B.st !== B.prevSt) {
    const prev = B.prevSt; B.prevSt = B.st;
    if (FX_ENTER[B.st]) FX_ENTER[B.st](B);
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
  if (B.contact && !B.hidden && !['down', 'intro', 'still', 'ask', 'yield'].includes(B.st) && overlap(bossBox(B), G.P)) hurtPlayer(B.hitDmg || B.contact, B.x);
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

const BOSSES = {
  // ---------------- Amazônia ----------------
  mapinguari: {
    nome: 'MAPINGUARI', sub: 'guardião da Amazônia',
    init: () => ({ w: 40, h: 84, hp: 430, contact: 14 }),
    update(B, dt) {
      const dx = pdx(), adx = Math.abs(dx), ph2 = B.phase === 2;
      if (B.phase === 1 && B.hp < B.hpMax / 2) { B.phase = 2; go(B, 'roar', 1.2); SFX.roar(); G.cam.shake = 5; floatText(B.x, B.y - 60, 'RUGIDO', '#c8f060'); return; }
      B.hitDmg = 0;
      switch (B.st) {
        case 'idle': {
          if (B.tt > 0) break;
          B.f = Math.sign(dx) || B.f;
          const r = Math.random();
          let n;
          if (adx < 46) n = r < 0.6 ? 'biteW' : 'slamW';
          else if (ph2 && r < 0.25) n = 'chargeW';
          else if (r < 0.4) n = 'walk'; else if (r < 0.7) n = 'slamW'; else n = B.last === 'gasW' ? 'walk' : 'gasW';
          B.last = n;
          go(B, n, { walk: 1.6, biteW: 0.5, slamW: ph2 ? 0.7 : 0.9, gasW: 0.6, chargeW: 0.8 }[n]);
          if (n === 'chargeW') SFX.roar();
          break;
        }
        case 'walk': B.f = Math.sign(dx) || B.f; B.x += B.f * (ph2 ? 34 : 26) * dt; if (B.t % 0.5 < dt) { SFX.land(); G.cam.shake = 1; } if (B.tt <= 0 || adx < 40) go(B, 'idle', 0.15); break;
        case 'biteW': if (B.tt <= 0) { go(B, 'bite', 0.25); SFX.roar(); } break;
        case 'bite': {
          const hb = { x: B.f > 0 ? B.x : B.x - 44, y: B.y - 48, w: 44, h: 28 };
          if (!B.done && overlap(hb, G.P)) B.done = hurtPlayer(28, B.x);
          if (B.tt <= 0) go(B, 'rec', 0.6); break;
        }
        case 'slamW': if (B.tt <= 0) {
          SFX.boom(); G.cam.shake = 7;
          for (const s of [-1, 1]) addHazard({ kind: 'shock', x: B.x + s * 16 - 4, y: GY - 10, w: 8, h: 10, vx: s * 140, life: 2.5, dmg: 20 });
          if (ph2) setTimeout(() => { if (G.boss === B && B.st !== 'down') for (const s of [-1, 1]) addHazard({ kind: 'shock', x: B.x + s * 16 - 4, y: GY - 10, w: 8, h: 10, vx: s * 110, life: 2.5, dmg: 18 }); }, 450);
          go(B, 'rec', 0.8);
        } break;
        case 'gasW': if (B.tt <= 0) {
          SFX.splash();
          for (let i = 0; i < (ph2 ? 3 : 2); i++) addHazard({ kind: 'gas', x: B.x + B.f * (10 + i * 22) - 20, y: GY - 44 - i * 6, w: 40, h: 32, vx: B.f * (22 + i * 10), life: 6, stun: ph2 });
          floatText(B.x, B.y - 58, 'cheiro forte', '#c8f060');
          go(B, 'rec', 0.6);
        } break;
        case 'chargeW': B.f = Math.sign(dx) || B.f; if (B.tt <= 0) go(B, 'charge', 2); break;
        case 'charge': {
          B.x += B.f * 175 * dt; B.hitDmg = 26;
          if (Math.random() < 0.5) part(B.x - B.f * 12, B.y, -B.f * 40, -30, 0.4, '#5a4030');
          const [a0, a1] = arenaX();
          if (B.x - B.w / 2 <= a0 - 6 || B.x + B.w / 2 >= a1 + 6 || B.tt <= 0) { SFX.boom(); G.cam.shake = 8; go(B, 'dazed', 1.4); floatText(B.x, B.y - 58, 'tonto'); }
          break;
        }
        case 'dazed': case 'roar': case 'rec': if (B.tt <= 0) go(B, 'idle', ph2 ? 0.2 : 0.45); break;
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
        if (x != null) { addHazard({ kind: 'fire', x, y: GY - 14, w: 40, h: 14, life: 999, dmg: 10 }); SFX.fire(); floatText(x + 20, GY - 24, 'o capim pega fogo', '#ff8a3a'); }
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
            shoot({ team: 'e', x: sx, y: sy, vx: (tx - sx) / L2 * 150 * sp, vy: (ty - sy) / L2 * 150 * sp, w: 8, h: 4, dmg: 14, kind: 'bird', life: 3.5 }); tone(1400, 0.15, 'triangle', 0.05, -400);
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
          addHazard({ kind: 'wave', x: fromL ? a0 - 20 : a1, y: GY - 18, w: 20, h: 20, vx: (fromL ? 1 : -1) * 125, life: 3.2, dmg: 20, update: waveUpd, draw: waveDraw });
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
        case 'stompW': if (B.tt <= 0) { SFX.boom(); G.cam.shake = 7; for (const s of [-1, 1]) addHazard({ kind: 'shock', x: B.x + s * 14, y: GY - 9, w: 8, h: 9, vx: s * 150, life: 2.2, dmg: 18, col: '#b08a70' }); for (let i = 0; i < 20; i++) part(B.x + rnd(-30, 30), GY, rnd(-40, 40), rnd(-60, -10), 0.9, '#c8a488', 2, 40); go(B, 'rec', 0.7); } break;
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
      if (B.phase === 1 && B.hp < B.hpMax * 0.6) { B.phase = 2; SFX.roar(); G.cam.shake = 6; floatText(B.x, B.y - 82, 'a fome cresce', '#c8402e'); bossFx('ring', B.x, B.y - 40, B.f, { r: 150 }); }
      if (B.phase === 2 && B.hp < B.hpMax * 0.3) { B.phase = 3; SFX.roar(); G.cam.shake = 8; floatText(B.x, B.y - 82, 'a terra me pertence', '#ff4a2a'); bossFx('ring', B.x, B.y - 40, B.f, { r: 180 }); }
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
        case 'blink': if (B.tt <= 0) {
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

function howlUpd(h, dt) { h.r += 170 * dt; const P = G.P, d = Math.hypot(P.x + 5 - h.x, (P.y + 11 - h.y) * 2); if (!h.hit && Math.abs(d - h.r) < 9 && P.state !== 'roll') { h.hit = hurtPlayer(14, h.x); if (h.hit) P.slow = 1; } }
function tornadoUpd(h, dt) { const P = G.P; h.x += clamp(P.x + 5 - (h.x + h.w / 2), -1, 1) * 46 * dt; h.tick -= dt; if (h.tick <= 0 && overlap(h, P)) { h.tick = 0.5; if (hurtPlayer(h.dmg, h.x + h.w / 2)) P.vy = -200; } if (Math.random() < 0.8) part(h.x + rnd(0, h.w), GY - rnd(0, 6), rnd(-30, 30), rnd(-80, -30), 0.6, pick(['#8a7a5e', '#c8b898', '#5a4a38']), 1, -20); }
function tornadoDraw(h) { const k = Math.min(1, h.t / 0.4) * Math.min(1, h.life); ctx.globalAlpha = 0.75 * k; for (let i = 0; i < h.h; i += 2) { const w = 4 + i / h.h * 16, o = Math.sin(G.t * 9 + i * 0.25) * 3; rect(ctx, h.x + h.w / 2 - w / 2 + o, GY - i, w, 2, i % 6 < 3 ? '#a8987a' : '#6a5a44'); } ctx.globalAlpha = 1; }
