'use strict';
// Mundo: estado do jogo, formas do espírito, física, jogador, inimigos, projéteis, perigos e desenho.

const G = {
  state: 'title', save: newSave(), lvl: null, P: null, ents: [], projs: [], parts: [], hazards: [], boss: null,
  cam: { x: 0, y: 0, shake: 0 }, t: 0, rt: 0, freeze: false, lock: 0, auto: 0, hitstop: 0, heat: 0, heatMul: 1,
  dynShade: [], waits: [], interact: null, flash: 0, flashCol: '#fff', dark: 0, sceneDraw: null, rain: 0, flags: {}, speedMul: 1, camTarget: null, fx: [], bfx: [],
};

// Dificuldade: monstros e chefes 50% mais duros que a base anterior (dano e vida ×1,5; chefes um pouco mais rápidos)
const DIFF = { dmg: 1.73, enemyHp: 1.8, bossHp: 1.8, bossSpeed: 1.25 };

// ---------- Formas (cada povo ensina um jeito de lutar) ----------
const FORMS = {
  espirito: { nome: 'Espírito sem forma', atk: { type: 'melee', dur: 0.34, act: [0.08, 0.18], range: 17, h: 22, dmg: 10, st: 10 }, shot: { dmg: 6, spd: 220, kind: 'orb' }, sp: null, roll: { dur: 0.34, spd: 170 } },
  zarabatana: { nome: 'Caçador da zarabatana', povo: 'Amazônia', atk: { type: 'melee', dur: 0.3, act: [0.07, 0.16], range: 20, h: 22, dmg: 11, st: 9 }, shot: { dmg: 10, spd: 320, kind: 'dart', st: 7 }, sp: { type: 'burst', dur: 0.5, st: 45, cd: 1.2, dmg: 6 }, roll: { dur: 0.42, spd: 215 } },
  arco: { nome: 'Arqueira do cerrado', povo: 'Cerrado', atk: { type: 'combo', st: 11, hits: [{ dur: 0.3, act: [0.07, 0.16], range: 22, h: 22, dmg: 12 }, { dur: 0.3, act: [0.07, 0.16], range: 22, h: 22, dmg: 12 }, { dur: 0.46, act: [0.14, 0.26], range: 26, h: 24, dmg: 20 }] }, shot: { dmg: 11, spd: 330, kind: 'arrow' }, sp: { type: 'firearrow', dur: 0.5, st: 45, cd: 1.3, dmg: 14 }, roll: { dur: 0.34, spd: 185 }, track: true },
  lanca: { nome: 'Canoeiro das águas', povo: 'Pantanal', atk: { type: 'melee', dur: 0.42, act: [0.12, 0.24], range: 34, h: 14, dmg: 17, st: 13 }, shot: { dmg: 9, spd: 260, kind: 'javelin', grav: 60 }, sp: { type: 'throw', dur: 0.45, st: 45, cd: 1.2, dmg: 24 }, roll: { dur: 0.34, spd: 180 }, water: true },
  cabaca: { nome: 'Lanceira da cabaça', povo: 'Caatinga', atk: { type: 'melee', dur: 0.38, act: [0.1, 0.22], range: 28, h: 20, dmg: 16, st: 12 }, shot: { dmg: 9, spd: 250, kind: 'drop', grav: 120 }, sp: { type: 'splash', dur: 0.5, st: 42, cd: 1.4, dmg: 16 }, roll: { dur: 0.34, spd: 180 }, heatRes: 0.7 },
  semente: { nome: 'Anciã das sementes', povo: 'Mata Atlântica', atk: { type: 'melee', dur: 0.36, act: [0.1, 0.22], range: 24, h: 22, dmg: 17, st: 11 }, shot: { dmg: 10, spd: 280, kind: 'seed' }, sp: { type: 'roots', dur: 0.5, st: 48, cd: 1.4, dmg: 28 }, roll: { dur: 0.36, spd: 190 } },
};
const FORM_ORDER = ['zarabatana', 'arco', 'lanca', 'cabaca', 'semente'];

// ---------- Construtor de fases ----------
function LV(o) {
  const L = Object.assign({ solids: [], water: [], shade: [], grass: [], spawns: [], npcs: [], fires: [], props: [], triggers: [], decor: [], ramps: [], vines: [], canopies: [], thorns: [], stumps: [], chests: [], areas: [], dthorns: [], hvines: [], gates: [], murals: [], doors: [], bridges: [], lights: [] }, o);
  L.g = (x0, x1, y = GY) => (L.solids.push({ x: x0, y, w: x1 - x0, h: 240 - y, t: 'g' }), L);
  L.b = (x, y, w, h) => (L.solids.push({ x, y, w, h, t: 'g', block: true }), L);
  L.p = (x, y, w, move) => (L.solids.push({ x, y, w, h: 4, t: 'p', ox: x, oy: y, move, mdx: 0, mdy: 0 }), L);
  // peças do tileset: galho, ilha, tronco-rampa, cipó escalável, copa, espinhos e toco
  L.br = (x, y, w) => (L.solids.push({ x, y, w, h: 4, t: 'p', kind: 'branch' }), L);
  L.flog = (x, y, w) => (L.solids.push({ x, y, w, h: 4, t: 'p', kind: 'flog', ox: x, oy: y, move: { dx: 0, dy: 1.5, spd: 1.6 }, mdx: 0, mdy: 0 }), L);
  L.isl = (x, y) => (L.solids.push({ x, y, w: 26, h: 4, t: 'p', kind: 'island' }), L);
  L.ramp = (x0, y0, x1, y1) => (L.ramps.push({ x0, y0, x1, y1 }), L);
  L.vine = (x, y0, y1 = GY) => (L.vines.push({ x, y0, y1 }), L);
  L.can = (x, w, vines) => (L.canopies.push({ x, w, vines }), L);
  L.th = (x0, x1, y = GY) => (L.thorns.push({ x0, x1, y }), L);
  L.stump = x => (L.stumps.push({ x, y: GY }), L.solids.push({ x: x - 12, y: GY - 12, w: 24, h: 12, t: 'g', block: true, vis: 'none' }), L);
  // elementos interativos: baú, tronco cortado, marca de área, planta sombria e cipós pendentes
  L.chest = (x, id, y = GY) => (L.chests.push({ x, y, id }), L);
  L.log = x => (L.solids.push({ x: x - 15, y: GY - 18, w: 30, h: 18, t: 'g', block: true, vis: 'log' }), L);
  L.area = x => (L.areas.push({ x }), L);
  L.dthorn = x => (L.dthorns.push({ x }), L);
  L.hv = x => (L.hvines.push({ x }), L);
  L.wt = (x0, x1, y = 152) => (L.water.push({ x: x0, y, w: x1 - x0, h: 240 - y }), L);
  L.sh = (x0, x1, kind = 'rock') => (L.shade.push({ x: x0, w: x1 - x0, kind }), L);
  L.gr = (x0, x1) => (L.grass.push({ x: x0, w: x1 - x0 }), L);
  L.e = (type, x, y) => (L.spawns.push({ type, x, y }), L);
  L.n = o2 => (L.npcs.push(Object.assign({ f: 1, anim: 'idle' }, o2)), L);
  L.f = (x, id) => (L.fires.push({ x, id }), L);
  L.echo = (x, y, id) => (L.echoAt = { x, y, id }, L);
  L.pr = (kind, x, y, o2) => (L.props.push(Object.assign({ kind, x, y }, o2 || {})), L);
  L.tr = (x, fn) => (L.triggers.push({ x, fn, done: false }), L);
  L.ar = (x0, boss) => (L.arena = { x0, boss, active: false }, L);
  // Gruta dos Antigos e revisitas: Cipós-de-Sangue (selo), pintura rupestre, porta, ponte de atalho e luz fixa
  L.gate = (x, id, o2) => (L.gates.push(Object.assign({ x, id, y: GY, w: 18, h: 56, solid: true, kind: 'parede' }, o2 || {})), L);
  L.mural = (x, id, o2) => (L.murals.push(Object.assign({ x, id, y: GY - 66, w: 60, h: 40, lit: 0 }, o2 || {})), L);
  L.door = (x, to, toX, label, o2) => (L.doors.push(Object.assign({ x, to, toX, label }, o2 || {})), L);
  L.bridge = (x0, x1, y, id, lx) => (L.bridges.push({ x0, x1, y, id, lx }), L);
  L.light = (x, y, r) => (L.lights.push({ x, y, r }), L);
  return L;
}
function groundY(x, from = -50) {
  let best = 999;
  for (const s of G.lvl.solids) if (x >= s.x && x <= s.x + s.w && s.y >= from && s.y < best && !s.wall) best = s.y;
  return best;
}
function solidAt(x, y) { for (const s of G.lvl.solids) if (x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) return s; return null; }

function loadLevel(id) {
  const L = LEVELS[id]();
  L.id = id;
  L.solids.push({ x: -20, y: -200, w: 20, h: 500, t: 'g', wall: true }, { x: L.w, y: -200, w: 20, h: 500, t: 'g', wall: true });
  applyWorldState(L);
  // tufos de grama decorativos
  const r = seeded(id.length * 97 + 3);
  for (const s of L.solids) if (s.t === 'g' && !s.wall && !s.block) for (let x = s.x + 2; x < s.x + s.w - 2; x += 3 + r() * 9 | 0) L.decor.push({ x, y: s.y, h: 1 + r() * 4 | 0, c: r() });
  G.lvl = L; G.fx = []; G.bfx = []; G.projs = []; G.parts = []; G.hazards = []; G.boss = null; G.dynShade = []; G.heat = 0; G.heatMul = 1; G.dark = 0;
  for (const n of L.npcs) n.t = rnd(0, 5);
  spawnEnemies();
  musicSet(L.biome === 'mata' ? 'mata' : L.biome);
}

// ---------- Jogador ----------
function statMax() { const s = G.save; return { hp: 100 + s.vig * 15 + itemBonus('hp'), st: 100 + s.fol * 12 + itemBonus('st'), flasks: Math.min(9, 3 + Math.floor(s.act / 2) + (s.bonusFlask || 0) + itemBonus('flask')) }; }
function makePlayer(x, y) {
  const m = statMax();
  return { hpMax: () => statMax().hp, stMax: () => statMax().st, form: 'espirito', x, y: y - 22, w: 10, h: 22, vx: 0, vy: 0, f: 1, onG: false, coy: 0, jbuf: 0, hp: m.hp, st: m.st, stDelay: 0, inv: 0, state: 'normal', stT: 0, combo: 0, queued: false, hitSet: null, def: null, spCd: 0, flasks: m.flasks, ph: 0, airDash: true, drop: 0, plat: null, safe: { x, y: y - 22 }, inWater: false, slow: 0, stun: 0, ab: { jump: true, attack: true, dodge: true, special: true, heal: true } };
}
const GRAV = 900, JUMP = 292;
function dmgMul() { return (1 + 0.1 * G.save.forc + 0.08 * G.save.frag + itemBonus('dmg')); }
// cada ato pesa mais: golpes, esquivas e especiais gastam 10% a mais de energia por ato
function useSt(n) { const P = G.P; P.st -= n * (1 + 0.1 * ((G.lvl && G.lvl.act) || 0)); P.stDelay = 0.45; }

function updatePlayer(dt) {
  const P = G.P, F = FORMS[P.form] || FORMS.espirito;
  const ctl = G.lock === 0 && P.state !== 'dead';
  let mx = ctl ? (I.down.right ? 1 : 0) - (I.down.left ? 1 : 0) : 0;
  if (G.auto) mx = G.auto;
  if (P.stun > 0) { P.stun -= dt; mx = 0; }
  P.inv -= dt; P.stDelay -= dt; P.spCd -= dt; P.jbuf -= dt; P.drop -= dt; P.slow -= dt;
  const hot = G.heat >= 100;
  if (P.stDelay <= 0 && P.state !== 'roll' && P.state !== 'attack') P.st = Math.min(P.stMax(), P.st + (hot ? 22 : 48) * dt);
  const water = P.inWater && !F.water, wform = P.inWater && F.water;
  let spd = 88 * (1 + itemBonus('speed')) * (water ? 0.55 : wform ? 1.12 : 1) * (P.slow > 0 ? 0.55 : 1) * (G.speedMul || 1) * (G.lvl.cave && I.down.down && P.onG ? 0.45 : 1);
  const press = a => ctl && P.stun <= 0 && I.pressed[a];
  const vine = P.state === 'normal' && nearVine(P);
  if (vine && press('up') && P.ab.jump) grabVine(vine);
  if (P.state === 'normal') {
    P.vx = lerp(P.vx, mx * spd, P.onG ? 0.35 : 0.18);
    if (mx) P.f = mx;
    if (press('jump')) P.jbuf = 0.13;
    if (P.jbuf > 0 && (P.onG || P.coy > 0) && P.ab.jump) {
      if (I.down.down && P.plat && P.plat.t === 'p') { P.drop = 0.25; P.jbuf = 0; }
      else { P.vy = -JUMP * (water ? 0.8 : wform ? 1.15 : 1); P.jbuf = 0; P.coy = 0; P.jumping = true; SFX.jump(); if (P.inWater) splash(P.x + 5, P.y + P.h); }
    }
    if (P.jumping && !I.down.jump && P.vy < -110) { P.vy = -110; P.jumping = false; }
    if (press('attack') && P.ab.attack && P.st > 0) startAttack();
    else if (press('shoot') && P.ab.attack && P.st > 0) startShot();
    else if (press('special') && P.ab.special && F.sp && P.spCd <= 0 && P.st > 4) startSpecial();
    else if (press('dodge') && P.ab.dodge && P.st > 0 && (P.onG || P.airDash)) startRoll();
    else if (press('heal') && P.ab.heal && P.onG) { if (P.flasks > 0) { P.state = 'heal'; P.stT = 0; P.healed = false; } else floatText(P.x + 5, P.y - 4, 'cabaça vazia'); }
    else if (press('swap') && G.save.forms.length > 2 && G.lvl.biome === 'mata' && !G.flags.final) swapForm();
  } else if (P.state === 'attack' || P.state === 'special') {
    P.stT += dt;
    P.vx = lerp(P.vx, P.onG ? 0 : P.vx, 0.15);
    if (P.state === 'attack') attackTick(); else specialTick();
    if (press('attack') && P.state === 'attack' && P.stT > P.def.dur * 0.4) P.queued = true;
    if (P.stT >= P.def.dur) {
      P.state = 'normal';
      if (P.queued && F.atk.type === 'combo' && P.def.type !== 'shot' && P.combo < 2 && P.st > 0) { P.combo++; startAttack(true); }
      else P.combo = 0;
      P.queued = false;
    }
  } else if (P.state === 'roll') {
    P.stT += dt; const R = F.roll;
    P.vx = P.f * R.spd * (1 - P.stT / R.dur * 0.4) * (water ? 0.6 : 1);
    if (!P.onG) P.vy = Math.min(P.vy, 30);
    if (P.stT >= R.dur) { P.state = 'normal'; P.y -= 10; P.h = 22; if (solidAt(P.x + 5, P.y + 1)) { P.y += 10; P.h = 12; P.state = 'roll'; P.stT = R.dur * 0.7; } }
  } else if (P.state === 'heal') {
    P.stT += dt; P.vx = 0;
    if (!P.healed && P.stT > 0.45) { P.healed = true; P.flasks--; P.hp = Math.min(P.hpMax(), P.hp + 45 + G.save.vig * 4 + itemBonus('heal')); SFX.heal(); for (let i = 0; i < 10; i++) part(P.x + 5 + rnd(-6, 6), P.y + rnd(0, 20), rnd(-10, 10), rnd(-40, -10), 0.8, '#f2c14e'); }
    if (P.stT >= 0.7) P.state = 'normal';
  } else if (P.state === 'hurt') {
    P.stT += dt; P.vx = lerp(P.vx, 0, 0.1);
    if (P.stT >= 0.28) P.state = 'normal';
  } else if (P.state === 'climb') {
    // cipó: sobe e desce sem gravidade; direção + pulo solta, no topo sobe para o lado
    const v = P.vine, up = ctl && (I.down.up || I.down.jump), dn = ctl && I.down.down;
    P.vx = 0; P.x = v.x - 5; P.vy = ((dn ? 1 : 0) - (up ? 1 : 0)) * 58;
    if (mx) P.f = mx;
    if (mx && press('jump')) { P.state = 'normal'; P.vy = -JUMP * 0.85; P.vx = mx * 110; P.jumping = true; SFX.jump(); }
    else if (press('dodge')) P.state = 'normal';
    else if (up && P.y + P.h <= v.y0 + 2) { P.state = 'normal'; P.vy = -210; P.vx = (mx || P.f) * 70; }
    else if (dn && P.y + P.h >= v.y1) P.state = 'normal';
  } else if (P.state === 'dead') { P.vx = 0; P.deadT = (P.deadT || 0) + dt; }
  // física
  const wasG = P.onG;
  if (P.state === 'climb') {
    P.y = clamp(P.y + P.vy * dt, P.vine.y0 - P.h, P.vine.y1 - P.h); P.onG = false; P.plat = null;
    if (P.vy && Math.random() < 0.08) SFX.step();
  } else {
    const g = GRAV * (P.inWater ? 0.5 : 1) * (P.vy > 0 ? 1.15 : 1);
    P.vy = Math.min(P.vy + g * dt, P.inWater ? 120 : 420);
    if (P.plat && P.plat.mdx !== undefined && P.onG) { P.x += P.plat.mdx; P.y += P.plat.mdy; }
    moveBody(P, dt);
  }
  // espinhos: dano fixo, empurrão para trás e para cima (inimigos não sofrem)
  for (const th of G.lvl.thorns) if (P.state !== 'dead' && overlap(P, { x: th.x0 + 2, y: th.y - 10, w: th.x1 - th.x0 - 4, h: 10 })) hurtPlayer(THORN_DMG, (th.x0 + th.x1) / 2, { fixed: true });
  for (const d of G.lvl.dthorns) if (P.state !== 'dead' && overlap(P, { x: d.x - 7, y: GY - 16, w: 14, h: 16 })) hurtPlayer(THORN_DMG, d.x, { fixed: true });
  if (P.onG) { P.coy = 0.1; P.airDash = true; P.jumping = false; if (!wasG && P.vy >= 0) { SFX.land(); } } else P.coy -= dt;
  if (P.onG && P.plat && P.plat.t === 'g' && !P.plat.wall && P.state !== 'roll' && P.x >= P.plat.x + 6 && P.x + P.w <= P.plat.x + P.plat.w - 6) P.safe = { x: P.x, y: P.y };
  // água
  const wasW = P.inWater; P.inWater = false;
  for (const w of G.lvl.water) if (P.x + 5 > w.x && P.x + 5 < w.x + w.w && P.y + P.h > w.y + 3) P.inWater = true;
  if (P.inWater !== wasW && Math.abs(P.vy) > 40) splash(P.x + 5, (G.lvl.water[0] || {}).y || P.y + P.h);
  // queda em abismo
  if (P.y > (G.lvl.h || H) + 40 && P.state !== 'dead') { P.x = P.safe.x; P.y = P.safe.y; P.vx = P.vy = 0; P.jbuf = 0; hurtPlayer(15, null, { pit: true }); }
  // passos e animação
  P.ph += Math.abs(P.vx) * dt * 0.22;
  if (P.onG && Math.abs(P.vx) > 30 && Math.sin(P.ph) * Math.sin(P.ph - Math.abs(P.vx) * dt * 0.22) < 0) SFX.step();
  // calor (Caatinga): 1 s no sol sem sombra e começa a queimar; no sol a pino queima mais rápido
  if (G.lvl.biome === 'caatinga' && P.state !== 'dead') {
    const sh = inShade(P.x + 5);
    if (sh) G.heat = Math.max(0, G.heat - 60 * dt);
    else G.heat = Math.min(100, G.heat + 100 * (F.heatRes || 1) * (1 - itemBonus('heat')) * dt * (G.lock ? 0 : 1));
    if (G.heat >= 100) { P.burn = (P.burn || 0) - dt; if (P.burn <= 0) { P.burn = G.heatMul > 1 ? 0.3 : 0.5; P.hp -= 5; floatText(P.x + 5, P.y - 2, 'calor', '#ff8a5a'); if (P.hp <= 0) die(); } }
    else if (G.heat >= 75 && Math.random() < 0.08) part(P.x + 5 + rnd(-4, 4), P.y + rnd(0, 6), 0, rnd(-30, -10), 0.6, '#fff0c0');
    // sol a pino também fora da luta: de tempos em tempos a queimadura acelera por alguns segundos
    if (!G.boss) { G.sunCd = (G.sunCd == null ? 20 : G.sunCd) - dt; if (G.sunT > 0) { G.sunT -= dt; G.heatMul = 2; if (G.sunT <= 0) G.heatMul = 1; } else if (G.sunCd <= 0 && !G.lock) { G.sunCd = rnd(22, 34); G.sunT = 5; showToast('Sol a pino', 'procure a sombra', 1.6); } }
  }
  // afogamento: encostou na água, tem 0,5 s para sair antes de começar a perder vida (o canoeiro aguenta o dobro)
  if (P.inWater && P.state !== 'dead' && !G.lock) {
    P.breath = Math.max(0, (P.breath == null ? 100 : P.breath) - (F.water ? 100 : 200) * (1 - itemBonus('breath')) * dt);
    if (P.breath <= 0) { P.drown = (P.drown || 0) - dt; if (P.drown <= 0) { P.drown = 0.5; P.hp -= 6; floatText(P.x + 5, P.y - 2, 'afogando', '#9fd0e0'); SFX.splash(); if (P.hp <= 0) die(); } }
    if (Math.random() < 0.06) part(P.x + 5 + rnd(-3, 3), P.y + 4, 0, -25, 0.8, '#c8e8f8');
  } else { P.breath = Math.min(100, (P.breath == null ? 100 : P.breath) + 70 * dt); P.drown = 0; }
  // memórias deixadas na morte
  const d = G.save.drop;
  if (d && d.lvl === G.lvl.id && Math.abs(P.x + 5 - d.x) < 10 && Math.abs(P.y + 11 - d.y) < 22) { G.save.mem += d.mem; floatText(d.x, d.y - 10, '+' + d.mem + ' memórias'); SFX.echo(); G.save.drop = null; writeSave(); }
}
function inShade(x) {
  for (const s of G.lvl.shade) if (x > s.x && x < s.x + s.w) return true;
  for (const s of G.dynShade) if (x > s.x && x < s.x + s.w) return true;
  return false;
}
const THORN_DMG = 10;
const RAMP_PLAT = { t: 'p', ramp: true };
function nearVine(P) { for (const v of G.lvl.vines) if (Math.abs(P.x + 5 - v.x) < 8 && P.y + P.h > v.y0 + 4 && P.y < v.y1 - 4) return v; return null; }
function grabVine(v) { const P = G.P; Object.assign(P, { state: 'climb', vine: v, vx: 0, vy: 0, jbuf: 0, jumping: false }); if (P.h !== 22) { P.y -= 22 - P.h; P.h = 22; } }
function moveBody(b, dt) {
  const S = G.lvl.solids;
  b.hitWall = false;
  b.x += b.vx * dt;
  for (const s of S) if (s.t === 'g' && overlap(b, s)) {
    // bichos que andam sobem degraus baixos (terreno elevado, toco) em vez de bater na parede
    if (b.stepH && b.onG && !s.wall && s.y >= b.y + b.h - b.stepH) { b.y = s.y - b.h; continue; }
    if (b.x + b.w / 2 < s.x + s.w / 2) b.x = s.x - b.w; else b.x = s.x + s.w; b.hitWall = true; }
  const prevB = b.y + b.h;
  b.y += b.vy * dt; b.onG = false; b.plat = null;
  for (const s of S) {
    if (!overlap(b, s)) continue;
    if (s.t === 'g') {
      if (b.vy >= 0 && prevB <= s.y + 6) { b.y = s.y - b.h; b.vy = 0; b.onG = true; b.plat = s; }
      else if (b.vy < 0) { b.y = s.y + s.h; b.vy = 0; }
    } else if (s.t === 'p' && b.vy >= 0 && prevB <= s.y + 2 + Math.abs(s.mdy || 0) && !(b.drop > 0)) { b.y = s.y - b.h; b.vy = 0; b.onG = true; b.plat = s; }
  }
  // rampas (tronco caído): só o topo conta; quem já está nela acompanha a descida
  const wasRamp = b.onRamp; b.onRamp = false;
  if (!(b.drop > 0)) for (const r of G.lvl.ramps) {
    const cx = b.x + b.w / 2; if (cx < Math.min(r.x0, r.x1) || cx > Math.max(r.x0, r.x1)) continue;
    const ry = r.y0 + (r.y1 - r.y0) * (cx - r.x0) / (r.x1 - r.x0), foot = b.y + b.h, slack = wasRamp ? 6 : 0;
    if (b.vy >= 0 && foot >= ry - slack && prevB <= ry + 4 + slack && !(b.onG && b.y + b.h < ry)) { b.y = ry - b.h; b.vy = 0; b.onG = true; b.onRamp = true; b.plat = RAMP_PLAT; }
  }
}
function startAttack(cont) {
  const P = G.P, F = FORMS[P.form] || FORMS.espirito, A = F.atk;
  if (!cont) P.combo = 0;
  faceMouse();
  P.def = A.type === 'combo' ? Object.assign({ type: 'melee' }, A.hits[P.combo]) : A;
  P.state = 'attack'; P.stT = 0; P.hitSet = new Set(); P.shot = false;
  useSt(A.st); SFX.swing();
  if (P.onG) P.vx = P.f * 30;
  emitNoise(P.x + 5, P.y + 11, 70);
}
function startShot() {
  const P = G.P, F = FORMS[P.form] || FORMS.espirito;
  faceMouse();
  P.def = Object.assign({ type: 'shot', dur: 0.3, at: 0.08, st: 9 }, F.shot);
  P.state = 'attack'; P.stT = 0; P.combo = 0; P.shot = false;
  useSt(P.def.st); SFX.dart();
}
// Clique do mouse vira o personagem para o lado do cursor
function faceMouse() { const P = G.P; if (performance.now() - I.mouseT < 150) P.f = Math.sign(I.mouseWX - (P.x + 5)) || P.f; }
// Mira automática: o alvo mais próximo à frente (inclusive voadores), num cone generoso
function aimAt(x, y, range) {
  const P = G.P, cands = [];
  for (const e of G.ents) if (e.hp > 0) cands.push([e.x + e.w / 2, e.y + e.h / 2]);
  const B = G.boss;
  if (B && !B.noAim && !(B.hidden && !(FORMS[P.form] || {}).track) && !['down', 'still', 'ask', 'intro'].includes(B.st)) cands.push([B.x, B.y - B.h * 0.55]);
  let best = null, bd = range; aimAt.d = 0;
  for (const [cx, cy] of cands) {
    const dx = (cx - x) * P.f, dy = cy - y;
    if (dx < 4 || dx > range || Math.abs(dy) > dx * 1.4 + 14) continue;
    const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = [cx, cy]; }
  }
  if (!best) return 0;
  aimAt.d = bd;
  return clamp(Math.atan2(best[1] - y, (best[0] - x) * P.f), -1.05, 1.05);
}
function attackTick() {
  const P = G.P, D = P.def;
  if (D.type === 'shot') {
    if (!P.shot && P.stT >= D.at) {
      P.shot = true;
      const x = P.x + 5 + P.f * 8, y = P.y + 10, a = aimAt(x, y, 200);
      const g = D.grav || 0, comp = aimAt.d ? g * (aimAt.d / D.spd) / 2 : 0;
      shoot({ x, y, vx: P.f * Math.cos(a) * D.spd, vy: Math.sin(a) * D.spd - comp, w: 9, h: 9, dmg: D.dmg * dmgMul(), kind: D.kind, grav: D.grav || 0 });
    }
    return;
  }
  if (P.stT >= D.act[0] && P.stT <= D.act[1]) {
    const hb = { x: P.f > 0 ? P.x + P.w - 2 : P.x + 2 - D.range, y: P.y + 10 - D.h / 2, w: D.range, h: D.h };
    meleeHit(hb, D.dmg * dmgMul(), P.hitSet, { melee: true });
    if (G.debug) G.lastHB = hb;
  }
}
function meleeHit(hb, dmg, set, o) {
  const P = G.P;
  let any = false;
  for (const e of G.ents) if (!set.has(e) && e.hp > 0 && overlap(hb, e)) { set.add(e); hitEnemy(e, dmg, P.f, o); any = true; }
  const B = G.boss;
  if (B && !set.has(B) && overlap(hb, bossBox(B))) { set.add(B); if (bossHurt(B, dmg, P.f)) any = true; }
  if (any) { G.hitstop = 0.045; }
  return any;
}
function startSpecial() {
  const P = G.P, F = FORMS[P.form];
  P.def = F.sp; P.state = 'special'; P.stT = 0; P.hitSet = new Set(); P.shots = 0;
  useSt(Math.min(P.st, F.sp.st)); P.spCd = F.sp.cd;
}
function specialTick() {
  const P = G.P, D = P.def, m = dmgMul(), cx = P.x + 5;
  if (D.type === 'burst') {
    while (P.shots < 3 && P.stT >= 0.08 + P.shots * 0.11) { P.shots++; SFX.dart(); shoot({ x: cx + P.f * 10, y: P.y + 10, vx: P.f * 320, vy: (P.shots - 2) * 25, w: 6, h: 6, dmg: D.dmg * m, kind: 'dart', poison: true }); }
  } else if (D.type === 'firearrow') {
    if (!P.shots && P.stT >= 0.28) { P.shots = 1; SFX.fire(); shoot({ x: cx + P.f * 10, y: P.y + 8, vx: P.f * 250, vy: -60, w: 8, h: 2, dmg: D.dmg * m, kind: 'fire', grav: 220 }); }
  } else if (D.type === 'throw') {
    if (!P.shots && P.stT >= 0.2) { P.shots = 1; SFX.swing(); shoot({ x: cx + P.f * 8, y: P.y + 6, vx: P.f * 330, vy: -10, w: 18, h: 2, dmg: D.dmg * m, kind: 'spear', pierce: true, grav: 40 }); }
  } else if (D.type === 'splash') {
    if (!P.shots && P.stT >= 0.22) {
      P.shots = 1; SFX.splash(); G.heat = Math.max(0, G.heat - 45);
      const hb = { x: cx + (P.f > 0 ? -6 : -40), y: P.y - 8, w: 46, h: 34 };
      meleeHit(hb, D.dmg * m, P.hitSet, { cool: true, melee: true });
      for (let i = 0; i < 24; i++) part(cx + P.f * rnd(4, 36), P.y + rnd(0, 20), P.f * rnd(10, 60), rnd(-90, -20), 0.6, i % 2 ? '#9fd0e0' : '#e8f4f8', 1, 300);
    }
  } else if (D.type === 'roots') {
    if (!P.shots && P.stT >= 0.25) {
      P.shots = 1;
      let tx = cx + P.f * 50, best = 160;
      const cands = G.ents.filter(e => e.hp > 0).map(e => e.x + e.w / 2); if (G.boss) cands.push(G.boss.x);
      for (const x of cands) { const d = (x - cx) * P.f; if (d > 0 && d < best) { best = d; tx = x; } }
      addHazard({ kind: 'proots', x: tx - 12, y: groundY(tx, P.y) - 26, w: 24, h: 26, t: 0, life: 0.75, dmg: D.dmg * m, team: 'p', set: new Set() });
    }
  }
}
function startRoll() {
  const P = G.P;
  if (!P.onG) P.airDash = false;
  P.state = 'roll'; P.stT = 0; useSt(18); P.inv = Math.max(P.inv, (FORMS[P.form] || FORMS.espirito).roll.dur * (0.85 + itemBonus('roll'))); P.y += 10; P.h = 12; SFX.roll();
}
function swapForm() {
  const P = G.P, list = G.save.forms.filter(f => f !== 'espirito');
  const i = (list.indexOf(P.form) + 1) % list.length; setForm(list[i]);
  for (let k = 0; k < 14; k++) part(P.x + 5 + rnd(-8, 8), P.y + rnd(0, 22), rnd(-20, 20), rnd(-40, 0), 0.6, '#8fe37a');
  SFX.ui();
}
function setForm(f) { G.P.form = f; G.save.form = f; updateHudForm(); }

function hurtPlayer(dmg, srcX, o = {}) {
  const P = G.P;
  if (!P || P.state === 'dead') return false;
  if (!o.pit && (P.inv > 0 || G.lock > 0 && !o.force)) return false;
  if (!o.pit && !o.fixed) dmg = Math.round(dmg * DIFF.dmg);
  P.hp -= dmg; P.inv = 0.85; SFX.hurt(); G.cam.shake = Math.max(G.cam.shake, 4); G.flash = 0.08; G.flashCol = '#c8402e';
  if (!o.pit) { const dir = srcX == null ? -P.f : (P.x + 5 < srcX ? -1 : 1); P.vx = dir * 120; P.vy = -130; if (P.state === 'roll') { P.y -= 10; P.h = 22; } P.state = 'hurt'; P.stT = 0; }
  for (let i = 0; i < 8; i++) part(P.x + 5, P.y + 10, rnd(-60, 60), rnd(-80, -10), 0.4, '#c8402e');
  if (P.hp <= 0) die();
  return true;
}

// ---------- Inimigos ----------
const ET = {
  crawler: { w: 14, h: 9, hp: 22, dmg: 12, spd: 30, mem: 8 },
  flyer: { w: 14, h: 11, hp: 15, dmg: 10, spd: 40, mem: 7, fly: true },
  spitter: { w: 10, h: 14, hp: 20, dmg: 11, mem: 9 },
  brute: { w: 16, h: 24, hp: 60, dmg: 22, spd: 26, mem: 18, reach: 22, wind: 0.5 },
  lanceiro: { w: 12, h: 22, hp: 45, dmg: 18, spd: 32, mem: 14, reach: 34, wind: 0.42 },
  wolf: { w: 26, h: 15, hp: 120, dmg: 14, spd: 95, mem: 30 },
  // fauna corrompida: cada bicho usa um dos comportamentos acima (ai)
  tatu: { ai: 'crawler', w: 14, h: 9, hp: 24, dmg: 12, spd: 32, mem: 8 },
  capivara: { ai: 'crawler', w: 20, h: 13, hp: 40, dmg: 14, spd: 22, mem: 11 },
  urubu: { ai: 'flyer', w: 16, h: 10, hp: 16, dmg: 10, spd: 42, mem: 8, fly: true },
  cobra: { ai: 'spitter', w: 14, h: 12, hp: 22, dmg: 11, mem: 9 },
  queixada: { ai: 'brute', w: 20, h: 14, hp: 58, dmg: 20, spd: 30, mem: 16, reach: 20, wind: 0.48 },
  tamandua: { ai: 'brute', w: 22, h: 16, hp: 66, dmg: 22, spd: 22, mem: 18, reach: 26, wind: 0.55 },
  jaguatirica: { ai: 'wolf', w: 22, h: 13, hp: 42, dmg: 14, spd: 100, mem: 15 },
  lobo: { ai: 'wolf', w: 22, h: 16, hp: 46, dmg: 15, spd: 88, mem: 15 },
};
// qual bicho ocupa cada papel em cada bioma
const FAUNA = {
  prologo: { crawler: ['tatu'], flyer: ['urubu'], spitter: ['cobra'], brute: ['queixada'], lanceiro: ['lobo'] },
  amazonia: { crawler: ['capivara', 'tatu'], flyer: ['urubu'], spitter: ['cobra'], brute: ['queixada'], lanceiro: ['jaguatirica'] },
  cerrado: { crawler: ['tatu'], flyer: ['urubu'], spitter: ['cobra'], brute: ['tamandua'], lanceiro: ['lobo'] },
  pantanal: { crawler: ['capivara'], flyer: ['urubu'], spitter: ['cobra'], brute: ['queixada'], lanceiro: ['jaguatirica'] },
  caatinga: { crawler: ['tatu'], flyer: ['urubu'], spitter: ['cobra'], brute: ['queixada'], lanceiro: ['lobo'] },
  mata: { crawler: ['capivara', 'tatu'], flyer: ['urubu'], spitter: ['cobra'], brute: ['tamandua', 'queixada'], lanceiro: ['jaguatirica'] },
};
const EYE = { prologo: '#ffe066', amazonia: '#c8f060', cerrado: '#ff8a3a', pantanal: '#e070c0', caatinga: '#ffd27a', mata: '#9fe0d0', coracao: '#ff6a3a' };
function spawnEnemies() { G.ents = G.lvl.spawns.map(s => makeEnemy(s.type, s.x, s.y)); }
function makeEnemy(type, x, y) {
  const fz = FAUNA[G.lvl.biome] || FAUNA.amazonia;
  if (fz[type]) { const opts = fz[type]; type = opts[Math.floor(hash(Math.round(x) * 7 + 3) * opts.length)]; }
  // cada fase deixa a fauna mais resistente, mais forte e um pouco mais rápida
  const d = ET[type], a = G.lvl.act || 0, mul = 1 + 0.45 * a;
  const e = { type, x, y: 0, w: d.w, h: d.h, vx: 0, vy: 0, f: -1, hp: Math.round(d.hp * mul * DIFF.enemyHp), dmg: Math.round(d.dmg * (1 + 0.25 * a)), spd: (d.spd || 0) * (1 + 0.08 * a), t: rnd(0, 5), flash: 0, wind: 0, swing: 0, rec: 0, cd: rnd(0.6, 2), hx: x, hy: y, poison: 0, pt: 0, mem: d.mem + a * 3, mode: 'home', onG: false };
  e.hpMax = e.hp; e.ai = d.ai || type;
  e.y = (y == null ? groundY(x + d.w / 2) : y) - d.h;
  if (d.fly) { e.hy = e.y; } else e.stepH = 18;
  return e;
}
function updateEnemies(dt) {
  // logo depois de renascer na fogueira os monstros levam 1 s para reagir
  if (G.grace > 0) { G.grace -= dt; for (const e of G.ents) e.t += dt; return; }
  const P = G.P, px = P.x + 5, py = P.y + 11;
  for (const e of G.ents) {
    if (e.hp <= 0) continue;
    e.t += dt; e.flash -= dt;
    if (e.poison > 0) { e.poison -= dt; e.pt -= dt; if (e.pt <= 0) { e.pt = 0.5; e.hp -= 3; e.flash = 0.06; part(e.x + e.w / 2, e.y, 0, -20, 0.5, '#8fe37a'); if (e.hp <= 0) { killEnemy(e); continue; } } }
    const d = ET[e.type], dx = px - (e.x + e.w / 2), dy = py - (e.y + e.h / 2);
    if (Math.abs(dx) > 260) continue;
    if (e.stag > 0) {
      e.stag -= dt; e.vx *= Math.pow(0.02, dt);
      if (ET[e.type].fly) { e.x += e.vx * dt; e.y += e.vy * dt; e.vy *= Math.pow(0.05, dt); }
      else { e.vy += GRAV * dt; moveBody(e, dt); }
      if (e.y > (G.lvl.h || H) + 60) e.hp = 0;
      continue;
    }
    if (e.ai === 'crawler') {
      e.calm = (e.calm || 0) - dt;
      const near = e.calm <= 0 && Math.abs(dx) < 110 && Math.abs(dy) < 40;
      if (near) e.f = Math.sign(dx) || e.f;
      const ahead = e.f > 0 ? e.x + e.w + 2 : e.x - 2;
      // tronco caído também conta como beirada: bicho rasteiro não sobe na rampa
      const ramp = !e.onRamp && G.lvl.ramps.some(r => ahead > Math.min(r.x0, r.x1) - 2 && ahead < Math.max(r.x0, r.x1) + 2);
      const edge = e.onG && (ramp || pitAhead(e));
      // no buraco ele dá meia-volta em vez de ficar parado em cima de quem sobe
      if (edge) { e.f *= -1; if (near) e.calm = 1.2; }
      e.vx = lerp(e.vx, edge ? 0 : e.f * e.spd * (near ? 2.0 : 1), 0.2);
      e.vy += GRAV * dt; moveBody(e, dt); if (e.hitWall) e.f *= -1;
    } else if (e.ai === 'flyer') {
      e.cd -= dt;
      // voador: avisa (para e pisca), mergulha e depois fica cansado perto do chão — a hora de acertar
      if (e.mode === 'aim') {
        e.st -= dt; e.wind = 1;
        if (e.st <= 0) { const L2 = Math.hypot(dx, dy) || 1; e.vx = dx / L2 * 120; e.vy = dy / L2 * 120; e.st = 0.75; e.mode = 'swoop'; e.wind = 0; }
      } else if (e.mode === 'swoop') {
        e.st -= dt; e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.y + e.h > groundY(e.x + e.w / 2, e.y) - 2) { e.y = groundY(e.x + e.w / 2, e.y) - e.h - 2; e.vy = 0; }
        if (e.st <= 0) { e.mode = 'tired'; e.st = 0.9; }
      } else if (e.mode === 'tired') {
        e.st -= dt; e.x += e.vx * 0.15 * dt; e.y += Math.sin(e.t * 6) * 6 * dt;
        if (e.st <= 0) e.mode = 'home';
      } else {
        const tx = e.hx + Math.sin(e.t * 1.3) * 30, ty = e.hy + Math.sin(e.t * 2.1) * 8;
        e.x += clamp(tx - e.x, -1, 1) * e.spd * dt; e.y += clamp(ty - e.y, -1, 1) * e.spd * dt;
        if (Math.abs(dx) < 95 && Math.abs(dy) < 90 && e.cd <= 0) { e.mode = 'aim'; e.st = 0.36; e.cd = 2.3; }
      }
      e.f = Math.sign(dx) || 1;
    } else if (e.ai === 'spitter') {
      e.f = Math.sign(dx) || 1;
      if (e.wind > 0) {
        e.wind -= dt;
        if (e.wind <= 0) {
          const T = 0.85; shoot({ team: 'e', x: e.x + e.w / 2, y: e.y + 4, vx: clamp(dx / T, -150, 150), vy: clamp((dy - 0.5 * 400 * T * T) / T, -260, 0), w: 5, h: 5, dmg: e.dmg, kind: 'blob', grav: 400 });
        }
      } else { e.cd -= dt; if (e.cd <= 0 && Math.abs(dx) < 170 && Math.abs(dy) < 80) { e.wind = 0.42; e.cd = 1.9; } }
      e.vy += GRAV * dt; e.vx = 0; moveBody(e, dt);
    } else if (e.ai === 'brute' || e.ai === 'lanceiro') {
      if (e.swing > 0) {
        e.swing -= dt;
        const hb = { x: e.f > 0 ? e.x + e.w : e.x - d.reach, y: e.y + 2, w: d.reach, h: e.h - 4 };
        if (!e.hitDone && overlap(hb, P)) { e.hitDone = hurtPlayer(e.dmg, e.x + e.w / 2); }
        if (e.swing <= 0) e.rec = 0.6;
      } else if (e.wind > 0) { e.wind -= dt; if (e.wind <= 0) { e.swing = 0.18; e.hitDone = false; SFX.swing(); } }
      else if (e.rec > 0) e.rec -= dt;
      else if (Math.abs(dx) < 130 && Math.abs(dy) < 40) { e.f = Math.sign(dx) || 1; if (Math.abs(dx) < d.reach + 6) { e.wind = e.windMax = d.wind; e.vx = 0; } else e.vx = pitAhead(e) ? 0 : e.f * e.spd; }
      else e.vx = 0;
      if (e.wind > 0 || e.swing > 0) e.vx = 0;
      e.vy += GRAV * dt; moveBody(e, dt);
    } else if (e.ai === 'wolf') updateWolf(e, dt, dx, dy);
    else if (CAVE_AI[e.ai]) CAVE_AI[e.ai](e, dt, dx, dy);
    if (overlap(e, P) && !e.noTouch && e.ai !== 'brute' && e.ai !== 'lanceiro' && !(e.ai === 'wolf' && e.st === 'rest')) hurtPlayer(e.dmg, e.x + e.w / 2);
    if (e.y > (G.lvl.h || H) + 60) e.hp = 0;
  }
  G.ents = G.ents.filter(e => e.hp > 0 || e.keep);
}
// buraco à frente: nada firme até 40 px abaixo do pé (desníveis menores o bicho desce andando)
function pitAhead(e, look = 2) {
  const ax = e.f > 0 ? e.x + e.w + look : e.x - look, foot = e.y + e.h;
  for (let y = foot + 1; y <= foot + 40; y += 2) if (solidAt(ax, y)) return false;
  for (const r of G.lvl.ramps) if (ax > Math.min(r.x0, r.x1) && ax < Math.max(r.x0, r.x1)) return false;
  return true;
}
function updateWolf(e, dt, dx) {
  e.st = e.st || 'run'; e.tt = (e.tt || 0) - dt;
  if (e.st === 'run') { e.f = Math.sign(dx) || 1; e.vx = e.onG && pitAhead(e) ? 0 : e.f * (e.spd || 85) * (Math.abs(dx) > 200 ? 0.4 : 1); if (Math.abs(dx) < 55 && e.onG) { e.st = 'wind'; e.tt = 0.4; e.vx = 0; } }
  else if (e.st === 'wind') { e.vx = 0; if (e.tt <= 0 && pitAhead(e, 34)) { e.st = 'rest'; e.tt = 0.6; } else if (e.tt <= 0) { e.st = 'leap'; e.vy = -230; e.vx = e.f * 150; SFX.roar(); } }
  else if (e.st === 'leap') { if (e.onG && e.vy >= 0) { e.st = 'rest'; e.tt = 0.8; e.vx = 0; G.cam.shake = 2; } }
  else if (e.st === 'rest') { e.vx = lerp(e.vx, 0, 0.2); if (e.tt <= 0) e.st = 'run'; }
  e.vy += GRAV * dt; moveBody(e, dt);
}
function hitEnemy(e, dmg, dir, o = {}) {
  if (e.shell && dir && dir === -e.f) { shellBlock(e); return false; }
  e.hp -= dmg; e.flash = 0.1; SFX.hit();
  if (e.fixed) { /* não se move */ }
  else if (o.melee && dir) {
    // golpe de perto empurra e atordoa um instante: o monstro não fica colado causando dano
    const heavy = e.ai === 'brute' || e.ai === 'lanceiro';
    e.vx = dir * (heavy ? 110 : 190); e.stag = heavy ? 0.22 : 0.38;
    if (ET[e.type].fly) { e.vy = -50; e.mode = 'home'; } else if (!heavy) e.vy = -90;
    if (heavy) { e.wind = 0; e.swing = 0; e.rec = 0.2; }
  } else if (e.ai !== 'brute' && e.ai !== 'wolf') { e.vx += dir * 50; if (!ET[e.type].fly) e.vy = -40; }
  if (o.poison) e.poison = 3;
  for (let i = 0; i < 5; i++) part(e.x + e.w / 2, e.y + e.h / 2, dir * rnd(20, 80), rnd(-60, 10), 0.35, '#2a2230');
  if (e.hp <= 0) killEnemy(e);
  return true;
}
function killEnemy(e) {
  e.hp = 0;
  const eye = EYE[G.lvl.biome];
  for (let i = 0; i < 16; i++) part(e.x + e.w / 2, e.y + e.h / 2, rnd(-70, 70), rnd(-90, 10), rnd(0.4, 0.9), i % 4 ? '#1c1622' : eye);
  G.save.mem += e.mem; floatText(e.x + e.w / 2, e.y - 4, '+' + e.mem); SFX.mem();
  if (e.onDeath) e.onDeath(e);
}

// ---------- Projéteis ----------
function shoot(o) { G.projs.push(Object.assign({ team: 'p', life: 2.2, grav: 0, set: new Set() }, o)); }
function updateProjs(dt) {
  const P = G.P;
  for (const p of G.projs) {
    p.life -= dt; p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    const box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
    if (p.kind === 'fire' && Math.random() < 0.6) part(p.x, p.y, rnd(-10, 10), rnd(-20, 0), 0.3, pick(['#ffd27a', '#e0703a']));
    const s = solidAt(p.x, p.y);
    if (s && s.t === 'g') {
      p.life = 0;
      if (p.team === 'p') emitNoise(p.x, p.y, 120);
      if (p.land) p.land(p, s);
      if (p.kind === 'fire') addHazard({ kind: 'pfire', x: p.x - 18, y: s.y - 10, w: 36, h: 10, t: 0, life: 3, dmg: 4, team: 'p', tick: 0 });
      if (p.kind === 'rock') { SFX.boom(); G.cam.shake = 3; for (let i = 0; i < 4; i++) shoot({ team: 'e', x: p.x, y: s.y - 4, vx: rnd(-90, 90), vy: rnd(-180, -80), w: 4, h: 4, dmg: 8, kind: 'pebble', grav: 500, life: 1.2 }); }
      for (let i = 0; i < 4; i++) part(p.x, p.y, rnd(-30, 30), rnd(-40, 0), 0.3, '#5a4a40');
      continue;
    }
    if (p.team === 'p') {
      for (const e of G.ents) if (e.hp > 0 && !p.set.has(e) && overlap(box, e)) { p.set.add(e); if (hitEnemy(e, p.dmg, Math.sign(p.vx), p) === false) { p.life = 0; break; } if (p.kind === 'fire') addHazard({ kind: 'pfire', x: e.x + e.w / 2 - 18, y: groundY(e.x + e.w / 2, e.y) - 10, w: 36, h: 10, t: 0, life: 3, dmg: 4, team: 'p', tick: 0 }); if (!p.pierce) { p.life = 0; break; } }
      const B = G.boss;
      if (p.life > 0 && B && !p.set.has(B) && overlap(box, bossBox(B))) { p.set.add(B); if (bossHurt(B, p.dmg, Math.sign(p.vx), p)) { if (p.kind === 'fire') addHazard({ kind: 'pfire', x: B.x - 18, y: GY - 10, w: 36, h: 10, t: 0, life: 3, dmg: 4, team: 'p', tick: 0 }); if (!p.pierce) p.life = 0; } }
    } else if (overlap(box, P)) {
      if (hurtPlayer(p.dmg, p.x)) { if (p.onHit) p.onHit(p); p.life = 0; }
    }
  }
  G.projs = G.projs.filter(p => p.life > 0 && p.x > G.cam.x - 80 && p.x < G.cam.x + W + 80 && p.y < (G.lvl.h || H) + 40 && p.y > G.cam.y - 120);
}

// ---------- Perigos (gás, fogo, ondas de choque, raízes...) ----------
function addHazard(h) { G.hazards.push(Object.assign({ t: 0, tick: 0 }, h)); return h; }
const HZ = {
  pfire: { update(h, dt) { h.tick -= dt; if (h.tick <= 0) { h.tick = 0.4; for (const e of G.ents) if (e.hp > 0 && overlap(h, e)) hitEnemy(e, h.dmg, 0); const B = G.boss; if (B && overlap(h, bossBox(B))) bossHurt(B, h.dmg, 0, { quiet: true }); } if (Math.random() < 0.5) part(h.x + rnd(0, h.w), h.y + h.h, rnd(-5, 5), rnd(-40, -15), 0.4, pick(['#ffd27a', '#e0703a', '#c8402e'])); },
    draw(h) { for (let i = 0; i < h.w; i += 3) { const fh = 3 + Math.abs(Math.sin(G.t * 9 + i)) * 6 * Math.min(1, h.life); rect(ctx, h.x + i, h.y + h.h - fh, 2, fh, i % 2 ? '#e0703a' : '#ffd27a'); } } },
  fire: { update(h, dt) { h.tick -= dt; if (h.t > 0.6 && overlap(h, G.P) && h.tick <= 0) { h.tick = 0.45; hurtPlayer(h.dmg, null, { force: false }) || (G.P.inv <= 0 && 0); } if (Math.random() < 0.6) part(h.x + rnd(0, h.w), h.y + h.h, rnd(-5, 5), rnd(-50, -20), 0.5, pick(['#ffd27a', '#e0703a', '#c8402e'])); },
    draw(h) { const k = Math.min(1, h.t / 0.6); ctx.globalAlpha = h.t < 0.6 ? 0.5 + Math.sin(G.t * 30) * 0.3 : 1; for (let i = 0; i < h.w; i += 2) { const fh = (4 + Math.abs(Math.sin(G.t * 8 + i * 0.7)) * 9) * k; rect(ctx, h.x + i, h.y + h.h - fh, 2, fh, i % 4 ? '#e0703a' : '#ffd27a'); } ctx.globalAlpha = 1; } },
  gas: { update(h, dt) { h.x += h.vx * dt; h.y += Math.sin(h.t * 2) * 6 * dt; if (overlap(h, G.P) && G.P.state !== 'dead') { G.P.slow = 0.3; G.P.st = Math.max(0, G.P.st - 30 * dt); G.P.stDelay = 0.3; if (h.stun && !h.used) { h.used = true; G.P.stun = 0.6; floatText(G.P.x + 5, G.P.y - 6, 'atordoado', '#c8f060'); } } },
    draw(h) { const a = Math.min(1, h.life) * 0.55; ctx.globalAlpha = a; for (let i = 0; i < 6; i++) ell(ctx, h.x + h.w / 2 + Math.sin(G.t * 2 + i) * h.w * 0.3, h.y + h.h / 2 + Math.cos(G.t * 1.7 + i * 2) * h.h * 0.25, h.w * 0.32 | 0, h.h * 0.3 | 0, i % 2 ? '#7a9a3a' : '#9aba4a'); ctx.globalAlpha = 1; } },
  shock: { update(h, dt) { h.x += h.vx * dt; if (!h.hit && overlap(h, G.P)) h.hit = hurtPlayer(h.dmg, h.x); if (Math.random() < 0.7) part(h.x + h.w / 2, h.y + h.h, rnd(-20, 20), rnd(-60, -20), 0.3, h.col || '#7a5a3a'); if (solidAt(h.x + (h.vx > 0 ? h.w : 0), h.y + h.h - 2)) h.life = 0; },
    draw(h) { for (let i = 0; i < 4; i++) rect(ctx, h.x + i * 2, h.y + h.h - (6 - Math.abs(i - 1.5) * 2) * 1.6, 2, (6 - Math.abs(i - 1.5) * 2) * 1.6, h.col || '#a87a4a'); } },
  roots: { update(h, dt) { if (h.t > h.warn && !h.hit && overlap(h, G.P)) h.hit = hurtPlayer(h.dmg, h.x + h.w / 2); if (h.t > h.warn && !h.snd) { h.snd = true; SFX.hit(); } },
    draw(h) { const gy = h.y + h.h; if (h.t < h.warn) { ctx.globalAlpha = 0.5 + Math.sin(G.t * 25) * 0.4; for (let i = 0; i < h.w; i += 3) rect(ctx, h.x + i, gy - 1, 2, 1, h.col || '#c8803a'); ctx.globalAlpha = 1; } else { const k = Math.min(1, (h.t - h.warn) / 0.08) * Math.min(1, h.life / 0.2); for (let i = 0; i < h.w; i += 4) { const hh = h.h * k * (0.6 + 0.4 * Math.abs(Math.sin(i))); line(ctx, h.x + i + 2, gy, h.x + i + 2 + Math.sin(i) * 3, gy - hh, h.col2 || '#5a3a22', 2); } } } },
  proots: { update(h) { if (h.t > 0.22) { for (const e of G.ents) if (e.hp > 0 && !h.set.has(e) && overlap(h, e)) { h.set.add(e); hitEnemy(e, h.dmg, 0); } const B = G.boss; if (B && !h.set.has(B) && overlap(h, bossBox(B))) { h.set.add(B); bossHurt(B, h.dmg, 0); } } },
    draw(h) { drawRootBurst(h); } },
};
function updateHazards(dt) {
  for (const h of G.hazards) { h.t += dt; h.life -= dt; const d = HZ[h.kind] || h; if (d.update) d.update(h, dt); }
  G.hazards = G.hazards.filter(h => h.life > 0);
}

// ---------- Partículas e textos flutuantes ----------
function part(x, y, vx, vy, life, col, s = 1, g = 120) { if (G.parts.length < 600) G.parts.push({ x, y, vx, vy, life, max: life, col, s, g }); }
function splash(x, y) { SFX.splash(); for (let i = 0; i < 12; i++) part(x + rnd(-6, 6), y, rnd(-40, 40), rnd(-110, -40), 0.5, i % 2 ? '#c8d8f0' : '#8aa8d0', 1, 400); }
function updateParts(dt) {
  for (const p of G.parts) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  G.parts = G.parts.filter(p => p.life > 0);
  const b = G.lvl && biome(G.lvl.biome);
  if (b && Math.random() < 0.08) G.parts.push({ x: G.cam.x + rnd(0, W), y: rnd(50, 148), vx: rnd(-6, 6), vy: rnd(-5, 2), life: 4, max: 4, col: b.motes, s: 1, g: 0, mote: true });
}
function floatText(wx, wy, txt, col) {
  const el = document.createElement('span');
  el.textContent = txt; if (col) el.style.color = col;
  el.style.left = ((wx - G.cam.x) / W * 100) + '%'; el.style.top = ((wy - G.cam.y) / H * 100) + '%';
  $('#float').appendChild(el); setTimeout(() => el.remove(), 1000);
}

// ---------- Câmera ----------
function updateCamera(dt) {
  const P = G.P, L = G.lvl, A = L.arena;
  let tx = P.x + 5 - W / 2 + P.f * 22;
  let lo = 0, hi = L.w - W;
  if (A && A.active) { lo = hi = A.x0; }
  if (G.camTarget != null) tx = G.camTarget;
  tx = clamp(tx, lo, hi);
  G.cam.x = lerp(G.cam.x, tx, Math.min(1, dt * 6));
  if (Math.abs(G.cam.x - tx) < 0.2) G.cam.x = tx;
  G.cam.shake = Math.max(0, G.cam.shake - dt * 18);
}

// ---------- Desenho do mundo ----------
function renderWorld() {
  const L = G.lvl, b = biome(L.biome), cx = Math.round(G.cam.x), t = G.t;
  drawBackground(b, cx, t);
  if (L.biome === 'cerrado' && G.save.ev && G.save.ev.boitata) drawSkyBoitata(t);
  // cenário progressivo: o fundo escurece e se corrompe à medida que o guardião se aproxima
  const prog = clamp(cx / Math.max(1, (L.arena ? L.arena.x0 : L.w - W)), 0, 1);
  if (prog > 0) { ctx.globalAlpha = prog * 0.38; rect(ctx, 0, 0, W, H, tpal(L.biome).corrupt); ctx.globalAlpha = 1; }
  ctx.globalAlpha = 0.1; rect(ctx, 0, 118, W, 32, b.mist); ctx.globalAlpha = 0.06; rect(ctx, 0, 132, W, 20, b.mist); ctx.globalAlpha = 1;
  const sx = G.cam.shake ? rnd(-G.cam.shake, G.cam.shake) : 0, sy = G.cam.shake ? rnd(-G.cam.shake, G.cam.shake) : 0;
  ctx.save(); ctx.translate(-cx + Math.round(sx), Math.round(sy));
  const gp = b.ground;
  // sombras da caatinga
  for (const s of L.shade) drawShadeZone(s, b);
  for (const s of G.dynShade) {
    ctx.globalAlpha = 0.85; ell(ctx, s.x + s.w / 2, 26, s.w / 2 + 10, 6, '#f4ecd8'); ell(ctx, s.x + s.w / 2 - 6, 22, s.w / 3, 4, '#fffaf0');
    ctx.globalAlpha = 0.1; rect(ctx, s.x, 32, s.w, GY - 32, '#3a2a20');
    ctx.globalAlpha = 1;
  }
  // decoração de fundo
  for (const p of L.props) if (p.x > cx - 120 && p.x < cx + W + 120) drawProp(p, t);
  for (const f of L.fires) if (f.x > cx - 40 && f.x < cx + W + 40) drawFire(ctx, f.x, groundY(f.x), t, !!G.save.lit[f.id]);
  drawCaveBack(L, cx, t);
  const E = L.echoAt;
  if (E && E.x > cx - 40 && E.x < cx + W + 40) drawEcho(E, t);
  const d = G.save.drop;
  if (d && d.lvl === L.id) drawSparkle(ctx, d.x, d.y + 3, t, '#f6e3a6');
  // chão e plataformas
  for (const s of L.solids) { if (s.wall || s.x > cx + W || s.x + s.w < cx) continue; drawSolid(s, gp, cx); }
  const TP = tpal(L.biome);
  for (const dc of L.decor) if (dc.x > cx - 4 && dc.x < cx + W + 4) rect(ctx, dc.x, dc.y - dc.h, 1, dc.h, dc.c > 0.7 && b.grass ? b.grass : TP.moss[dc.c > 0.35 ? 2 : 1]);
  for (const r of L.ramps) if (Math.max(r.x0, r.x1) > cx - 20 && Math.min(r.x0, r.x1) < cx + W + 20) drawRampPiece(r, L.biome);
  for (const st of L.stumps) if (st.x > cx - 30 && st.x < cx + W + 30) drawStumpPiece(st, L.biome);
  for (const th of L.thorns) if (th.x1 > cx && th.x0 < cx + W) drawThornPiece(th, L.biome);
  for (const v of L.vines) if (v.x > cx - 10 && v.x < cx + W + 10) drawVinePiece(v, L.biome, t);
  for (const c of L.chests) if (c.x > cx - 20 && c.x < cx + W + 20 && (!c.need || gateOpen(c.need))) drawChest(c, t);
  for (const d of L.dthorns) if (d.x > cx - 20 && d.x < cx + W + 20) drawDarkThorn(d, t);
  ctx.globalAlpha = 0.45; for (const s of L.shade.concat(G.dynShade)) rect(ctx, s.x, GY - 2, s.w, 32, '#1a100a'); ctx.globalAlpha = 1;
  // perigos de fundo
  for (const h of G.hazards) if (h.kind !== 'gas') (HZ[h.kind] || h).draw(h);
  // NPCs
  for (const n of L.npcs) { if (n.hidden) continue; n.t += 1 / 60; const gy = groundY(n.x, n.y0 || 0); drawHuman(ctx, n.x, gy, n.f, { kind: n.anim, t: n.t }, n.spec); }
  // inimigos
  const eye = EYE[L.biome];
  for (const e of G.ents) if (e.hp > 0 && e.x > cx - 40 && e.x < cx + W + 40) drawEnemy(ctx, e, e.x + e.w / 2, e.y + e.h, e.t, eye);
  if (G.boss) drawBoss(G.boss);
  drawBossFx();
  // jogador
  if (G.P && !G.P.hidden) drawPlayer(G.P, t);
  drawCaveFront(L, t);
  // projéteis
  for (const p of G.projs) drawProj(p);
  for (const h of G.hazards) if (h.kind === 'gas') HZ.gas.draw(h);
  // água (na frente)
  for (const w of L.water) {
    if (w.x > cx + W || w.x + w.w < cx) continue;
    ctx.globalAlpha = 0.55; rect(ctx, w.x, w.y, w.w, H - w.y, '#5a3a7a'); ctx.globalAlpha = 0.8;
    for (let x = Math.max(w.x, cx - 4); x < Math.min(w.x + w.w, cx + W + 4); x += 6) { const o = Math.sin(t * 2 + x * 0.3) * 2; rect(ctx, x + o, w.y + ((x / 6 | 0) % 3), 4, 1, '#d8a8c8'); }
    ctx.globalAlpha = 1;
  }
  // capim alto (na frente)
  for (const g of L.grass) drawGrass(g, t, b);
  // partículas
  for (const p of G.parts) {
    if (p.mote) { ctx.globalAlpha = Math.min(1, p.life) * (0.4 + 0.6 * Math.abs(Math.sin(G.t * 3 + p.x))); rect(ctx, p.x, p.y, 1, 1, p.col); continue; }
    ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); rect(ctx, p.x, p.y, p.s, p.s, p.col);
  }
  ctx.globalAlpha = 1;
  for (const cn of L.canopies) if (cn.x + cn.w > cx - 10 && cn.x < cx + W + 10) drawCanopy(cn, L.biome, t);
  for (const o of L.hvines) if (o.x > cx - 30 && o.x < cx + W + 30) drawHangingVines(o, L.biome, t);
  if (G.debug) {
    // modo de depuração (tecla ` ou F2): sólidos em vermelho, espinhos em laranja, cipós em azul
    ctx.globalAlpha = 0.35;
    for (const s of L.solids) if (!s.wall) rect(ctx, s.x, s.y, s.w, Math.min(s.h, H - s.y + 4), s.t === 'p' ? '#ff6060' : '#ff0000');
    for (const th of L.thorns) rect(ctx, th.x0 + 2, th.y - 10, th.x1 - th.x0 - 4, 10, '#ff9a20');
    for (const v of L.vines) rect(ctx, v.x - 8, v.y0, 16, v.y1 - v.y0, '#4080ff');
    for (const d of L.dthorns) rect(ctx, d.x - 7, GY - 16, 14, 16, '#ff9a20');
    for (const z of interactables()) rect(ctx, z.x - INTERACT_R, z.y - 30, INTERACT_R * 2, 30, '#40a0ff');
    ctx.globalAlpha = 1;
    for (const r of L.ramps) line(ctx, r.x0, r.y0, r.x1, r.y1, '#ff0000');
    if (G.lastHB) { ctx.strokeStyle = '#ff0'; ctx.strokeRect(G.lastHB.x, G.lastHB.y, G.lastHB.w, G.lastHB.h); }
  }
  ctx.restore();
  // efeitos de tela
  if (L.biome === 'caatinga' && G.heat > 40) { ctx.globalAlpha = (G.heat - 40) / 60 * 0.22 * (G.heatMul > 1 ? 1.5 : 1); rect(ctx, 0, 0, W, H, '#ffe0a0'); ctx.globalAlpha = 1; }
  if (G.dark > 0) { ctx.globalAlpha = G.dark; rect(ctx, 0, 0, W, H, '#000'); ctx.globalAlpha = 1; }
  if (L.cave) drawCaveDark();
  if (G.flash > 0) { ctx.globalAlpha = Math.min(0.5, G.flash * 4); rect(ctx, 0, 0, W, H, G.flashCol); ctx.globalAlpha = 1; }
  if (G.rain > 0) for (let i = 0; i < 60 * G.rain; i++) { const x = (hash(i) * W + G.t * 40 * (1 + hash(i + 9))) % W, y = (hash(i + 3) * H + G.t * 260 * (1 + hash(i + 5))) % H; rect(ctx, x, y, 1, 4, '#9fc0d8'); }
}
function drawSolid(s, gp, cx) {
  const b = G.lvl.biome;
  if (s.t === 'p' && !(s.move && s.move.canoe)) return drawPlatSolid(s, b);
  if (s.t === 'g' && s.block) return drawBlockSolid(s, b);
  if (s.t === 'g') return drawGroundSolid(s, b, cx);
  const x0 = Math.max(s.x, cx - 2), x1 = Math.min(s.x + s.w, cx + W + 2);
  if (s.t === 'p') {
    if (s.move && s.move.canoe) { drawCanoe(s); return; }
    rect(ctx, s.x, s.y, s.w, 4, gp.plat); rect(ctx, s.x, s.y, s.w, 1, gp.top); rect(ctx, s.x, s.y + 4, s.w, 1, '#0006');
    rect(ctx, s.x + 3, s.y + 4, 2, 4, gp.plat); rect(ctx, s.x + s.w - 5, s.y + 4, 2, 4, gp.plat);
    return;
  }
  const bot = Math.min(H + 10, s.y + s.h);
  rect(ctx, x0, s.y, x1 - x0, bot - s.y, gp.fill);
  rect(ctx, x0, s.y, x1 - x0, 2, gp.top);
  if (bot - s.y > 22) rect(ctx, x0, s.y + 18, x1 - x0, bot - s.y - 18, gp.dark);
  for (let x = Math.floor(x0 / 4) * 4; x < x1; x += 4) { const hv = hash(x + s.y * 7); if (hv > 0.55) rect(ctx, x, s.y + 4 + (hash(x + 3) * 12 | 0), 2, 1, gp.speck); }
  if (s.block) { rect(ctx, s.x, s.y, 1, s.h, '#0005'); rect(ctx, s.x + s.w - 1, s.y, 1, s.h, '#0005'); }
}
function drawCanoe(s) {
  rect(ctx, s.x, s.y, s.w, 4, '#6a4428'); rect(ctx, s.x + 2, s.y + 4, s.w - 4, 2, '#4a2e1a'); rect(ctx, s.x, s.y, s.w, 1, '#8a5c36');
  rect(ctx, s.x - 2, s.y - 1, 3, 2, '#6a4428'); rect(ctx, s.x + s.w - 1, s.y - 1, 3, 2, '#6a4428');
}
function drawShadeZone(s, b) {
  ctx.globalAlpha = 0.14; rect(ctx, s.x, 70, s.w, GY - 70, '#2a1c14'); ctx.globalAlpha = 1;
  const cx = s.x + s.w / 2;
  if (s.kind === 'tree') {
    const r = seeded(s.x | 0);
    line(ctx, cx, GY, cx - 2, 70, '#3a2a20', 3);
    branch(ctx, cx - 2, 72, -Math.PI / 2 - 0.6, 18, 3, '#3a2a20', r); branch(ctx, cx - 2, 72, -Math.PI / 2 + 0.6, 18, 3, '#3a2a20', r);
    ell(ctx, cx, 58, s.w / 2 + 4, 10, '#4a5a3a'); ell(ctx, cx - 4, 54, s.w / 3, 7, '#5a6a44');
  } else if (s.kind === 'rock') {
    rect(ctx, s.x - 6, 64, s.w + 12, 12, '#6a4a38'); rect(ctx, s.x - 6, 64, s.w + 12, 2, '#8a6448'); rect(ctx, s.x + s.w - 4, 76, 10, GY - 76, '#5a3e2e'); rect(ctx, s.x + s.w - 4, 76, 2, GY - 76, '#7a5a42');
  } else if (s.kind === 'awning') {
    rect(ctx, s.x - 4, 78, s.w + 8, 4, '#8a6a3a'); for (let i = 0; i < s.w + 8; i += 3) rect(ctx, s.x - 4 + i, 76, 2, 3, '#c8a46a');
    rect(ctx, s.x, 82, 2, GY - 82, '#5a3e2e'); rect(ctx, s.x + s.w - 2, 82, 2, GY - 82, '#5a3e2e');
  }
}
function drawGrass(g, t, b) {
  for (let x = g.x; x < g.x + g.w; x += 2) {
    const h = 10 + hash(x) * 10, sw = Math.sin(t * 2 + x * 0.2) * 1.5 + (G.boss && G.boss.rustle && Math.abs(G.boss.rustle - x) < 20 ? Math.sin(t * 40) * 3 : 0);
    line(ctx, x, GY, x + sw, GY - h, hash(x + 1) > 0.5 ? (b.grass || '#c8903a') : '#8a5a2a');
  }
}
function drawEcho(E, t) {
  const seen = G.save.echoes.includes(E.id);
  // enquanto não foi lido: anel de luz girando no chão, fiapos subindo e a chama-espírito por cima
  if (!seen) {
    for (let i = 0; i < 28; i++) { const a = i / 28 * HPI * 2 + t * 0.6, front = Math.sin(a) > 0; ctx.globalAlpha = (i % 3 ? 0.35 : 0.7) * (front ? 1 : 0.5); rect(ctx, E.x + Math.round(Math.cos(a) * 14), E.y - 1 + Math.round(Math.sin(a) * 3), 1, 1, i % 3 ? '#7ab8e8' : '#e0f4ff'); }
    for (let i = 0; i < 5; i++) { const p = (t * 0.35 + i / 5) % 1; ctx.globalAlpha = (1 - p) * 0.7; rect(ctx, E.x + Math.round(Math.sin(p * 7 + i * 2) * 7), E.y - 2 - Math.round(p * 30), 1, 2, '#bfe4ff'); }
    ctx.globalAlpha = 1;
  }
  ECHO_ART[E.id] && ECHO_ART[E.id](E.x, E.y, t);
  if (!seen) drawSparkle(ctx, E.x, E.y - 36 + Math.round(Math.sin(t * 1.8) * 2), t, '#9fd8ff');
}
const ECHO_ART = {
  pegadas(x, y) { for (let i = 0; i < 5; i++) { rect(ctx, x - 16 + i * 8, y - 1 - (i % 2), 3, 1, '#0b0d14'); rect(ctx, x - 15 + i * 8, y - 2 - (i % 2), 1, 1, '#0b0d14'); } },
  machado(x, y) { axeStump(x, y); },
  lanterna(x, y) { rect(ctx, x - 3, y - 9, 6, 8, '#3a3028'); rect(ctx, x - 2, y - 8, 4, 5, '#5a6060'); rect(ctx, x - 1, y - 11, 2, 2, '#3a3028'); for (let i = 0; i < 6; i++) rect(ctx, x + 10 + i * 9, y - 1, 6, 1, '#140a0a'); },
  escritura(x, y) { rect(ctx, x - 5, y - 4, 10, 4, '#d8c8a0'); rect(ctx, x - 5, y - 4, 10, 1, '#efe0c0'); rect(ctx, x + 2, y - 3, 2, 2, '#a8302a'); rect(ctx, x - 3, y - 2, 4, 1, '#8a7a60'); },
  poco(x, y) { rect(ctx, x - 9, y - 7, 18, 7, '#7a6a5a'); rect(ctx, x - 7, y - 7, 14, 2, '#1a1410'); rect(ctx, x - 9, y - 8, 18, 1, '#9a8a78'); rect(ctx, x + 14, y - 14, 1, 14, '#4a3428'); rect(ctx, x + 12, y - 11, 5, 1, '#4a3428'); rect(ctx, x - 6, y - 10, 4, 2, '#c8a46a'); rect(ctx, x - 5, y - 10, 2, 1, '#7aa8c0'); },
  engenho() {},
};
function drawProp(p, t) {
  const gy = p.y != null ? p.y : groundY(p.x);
  if (p.kind === 'hut') { rect(ctx, p.x - 18, gy - 14, 36, 14, '#5a3e24'); for (let i = 0; i < 22; i++) rect(ctx, p.x - 22 + i, gy - 14 - i * 0.7, 44 - i * 2, 1, i % 3 ? '#8a6a3a' : '#a8844a'); rect(ctx, p.x - 3, gy - 9, 6, 9, '#1a100a'); }
  if (p.kind === 'malocas') { for (let k = 0; k < 2; k++) { const x = p.x + k * 50; for (let i = 0; i < 18; i++) ell(ctx, x, gy - i, 22 - i * 0.6 | 0, 1, i % 3 ? '#7a5a2e' : '#9a7a40'); rect(ctx, x - 3, gy - 7, 6, 7, '#1a100a'); } }
  if (p.kind === 'stilts') { for (let i = 0; i < 4; i++) rect(ctx, p.x - 16 + i * 10, gy - 20, 2, 20, '#4a3020'); rect(ctx, p.x - 20, gy - 22, 40, 3, '#6a4428'); for (let i = 0; i < 16; i++) rect(ctx, p.x - 22 + i, gy - 22 - i * 0.6 - 1, 44 - i * 2, 1, i % 2 ? '#a8844a' : '#8a6a3a'); }
  if (p.kind === 'cross') { rect(ctx, p.x, gy - 14, 2, 14, '#4a3428'); rect(ctx, p.x - 3, gy - 11, 8, 2, '#4a3428'); }
  if (p.kind === 'skull') { rect(ctx, p.x - 3, gy - 3, 6, 3, '#efe8dc'); rect(ctx, p.x - 6, gy - 5, 3, 1, '#efe8dc'); rect(ctx, p.x + 3, gy - 5, 3, 1, '#efe8dc'); rect(ctx, p.x - 1, gy - 2, 1, 1, '#2a2018'); }
  if (p.kind === 'ruin') { rect(ctx, p.x, gy - p.h, p.w, p.h, '#2e4448'); rect(ctx, p.x, gy - p.h, p.w, 2, '#4a6466'); if (p.arch) { ell(ctx, p.x + p.w / 2, gy - p.h * 0.45, p.w * 0.3 | 0, p.h * 0.25 | 0, '#16262a'); rect(ctx, p.x + p.w * 0.2, gy - p.h * 0.45, p.w * 0.6, p.h * 0.45, '#16262a'); } for (let i = 0; i < 4; i++) rect(ctx, p.x + hash(p.x + i) * p.w, gy - hash(p.x + i * 3) * p.h, 1, 6, '#3d6a4a'); }
  if (p.kind === 'engenho') drawEngenho(p.x, gy, t);
  if (p.kind === 'heart') drawHeart(p.x, gy, t, p.green);
  if (p.kind === 'npcfire') drawFire(ctx, p.x, gy, t, true);
}
function drawEngenho(x, gy, t) {
  rect(ctx, x - 50, gy - 46, 100, 46, '#2a3a3c'); rect(ctx, x - 56, gy - 50, 112, 5, '#3d5560');
  for (let i = 0; i < 4; i++) { rect(ctx, x - 42 + i * 24, gy - 36, 10, 14, '#0e1618'); }
  rect(ctx, x - 6, gy - 22, 12, 22, '#0e1618');
  rect(ctx, x + 30, gy - 80, 10, 34, '#3a3434'); rect(ctx, x + 28, gy - 82, 14, 3, '#4a4444');
  for (let i = 0; i < 6; i++) rect(ctx, x - 50 + hash(i + 40) * 100, gy - 50 + hash(i) * 40, 1, 8 + hash(i + 2) * 10, '#3d6a4a');
  ell(ctx, x - 70, gy - 6, 12, 6, '#4a4040'); rect(ctx, x - 72, gy - 14, 4, 8, '#3a3030');
}
function drawProj(p) {
  const f = Math.sign(p.vx) || 1;
  if (p.kind === 'dart') { rect(ctx, p.x - 3, p.y, 6, 1, '#d8c8a0'); rect(ctx, p.x + (f > 0 ? 2 : -3), p.y, 1, 1, p.poison ? '#8fe37a' : '#fff'); rect(ctx, p.x - f * 3, p.y - 1, 1, 3, '#c8402e'); }
  else if (p.kind === 'orb') { ctx.globalAlpha = 0.4; ell(ctx, p.x, p.y, 4, 4, '#8a7ab0'); ctx.globalAlpha = 1; rect(ctx, p.x - 2, p.y - 2, 4, 4, '#c8b8f0'); rect(ctx, p.x - 1, p.y - 1, 2, 2, '#ffe066'); }
  else if (p.kind === 'arrow' || p.kind === 'javelin') { const L2 = p.kind === 'arrow' ? 9 : 13, a = Math.atan2(p.vy, p.vx), cx = Math.cos(a), cy = Math.sin(a); for (let i = 0; i < L2; i++) rect(ctx, p.x - cx * i, p.y - cy * i, 1, 1, p.kind === 'arrow' ? '#c8a46a' : '#8a6a3a'); rect(ctx, p.x - 1 + cx, p.y - 1 + cy, 2, 2, '#d8d8d0'); rect(ctx, p.x - cx * (L2 - 1), p.y - cy * (L2 - 1) - 1, 1, 2, '#efe8dc'); }
  else if (p.kind === 'drop') { rect(ctx, p.x - 2, p.y - 2, 4, 4, '#9fd0e0'); rect(ctx, p.x - 1, p.y - 2, 1, 1, '#ffffff'); rect(ctx, p.x - 3 - f * 2, p.y, 2, 1, '#9fd0e0'); }
  else if (p.kind === 'seed') { rect(ctx, p.x - 2, p.y - 1, 4, 3, '#a8844a'); rect(ctx, p.x - 1, p.y - 3, 1, 2, '#8fe37a'); rect(ctx, p.x - f * 4, p.y, 2, 1, '#6fd36a'); }
  else if (p.kind === 'fire') { rect(ctx, p.x - 4, p.y, 8, 1, '#c8a46a'); rect(ctx, p.x + f * 3, p.y - 1, 3, 3, '#ffd27a'); rect(ctx, p.x + f * 4, p.y, 1, 1, '#fff'); }
  else if (p.kind === 'spear') { rect(ctx, p.x - 9, p.y, 18, 1, '#8a6a3a'); rect(ctx, p.x + (f > 0 ? 8 : -11), p.y - 1, 3, 3, '#d8d8d0'); }
  else if (p.kind === 'crescentp') { for (let i = 0; i <= 12; i++) { const a = -1.2 + i / 12 * 2.4, th = Math.sin(i / 12 * HPI) * 4; for (let k = 0; k < th; k++) rect(ctx, p.x + f * Math.cos(a) * (10 - k), p.y + Math.sin(a) * 11, 2, 1, k < 1 ? '#ffd0c0' : '#c8202a'); } }
  else if (p.kind === 'blob') { rect(ctx, p.x - 2, p.y - 2, 5, 5, '#0d0a10'); rect(ctx, p.x - 1, p.y - 1, 2, 2, EYE[G.lvl.biome]); }
  else if (p.kind === 'rock') { ell(ctx, p.x, p.y, 6, 5, '#6a5a4a'); rect(ctx, p.x - 3, p.y - 3, 3, 2, '#8a7a68'); }
  else if (p.kind === 'pebble') rect(ctx, p.x - 2, p.y - 2, 4, 4, '#6a5a4a');
  else if (p.kind === 'thorn') { rect(ctx, p.x - 3, p.y, 6, 1, '#6a4a2a'); rect(ctx, p.x + f * 2, p.y - 1, 2, 3, '#c8a46a'); }
  else if (p.kind === 'bird') { const w = Math.sin(G.t * 20) > 0; rect(ctx, p.x - 3, p.y - 1, 7, 3, '#efe8dc'); rect(ctx, p.x + f * 4, p.y, 3, 1, '#2a2018'); rect(ctx, p.x - 6, p.y - (w ? 4 : -1), 5, 2, '#d8d0c0'); rect(ctx, p.x + 1, p.y - (w ? 4 : -1), 5, 2, '#d8d0c0'); }
  else if (p.kind === 'drain') { ctx.globalAlpha = 0.85; rect(ctx, p.x - 4, p.y - 2, 8, 4, '#3a1a10'); rect(ctx, p.x - 2, p.y - 1, 4, 2, '#c8402e'); ctx.globalAlpha = 1; }
  else rect(ctx, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, '#fff');
}
function drawPlayer(P, t) {
  if (P.inv > 0 && P.state !== 'roll' && Math.floor(t * 20) % 2 === 0 && P.state !== 'dead') return;
  const s = P.state, F = FORMS[P.form] || FORMS.espirito;
  let a;
  const wpn = (SPEC[P.form] || {}).weapon;
  if (s === 'roll') a = { kind: 'roll', p: P.stT / F.roll.dur };
  else if (s === 'attack' && P.def.type === 'shot') a = { kind: 'shot', p: P.stT / P.def.dur, shot: P.def.kind, at: P.def.at / P.def.dur };
  else if (s === 'attack') a = { kind: 'attack', p: P.stT / P.def.dur, style: wpn === 'bow' ? ['over', 'sweep', 'thrust'][P.combo] : wpn === 'spear' ? 'thrust' : wpn === 'staff' ? 'over' : wpn === 'blowgun' ? 'jab' : 'claw' };
  else if (s === 'special') a = { kind: 'special', p: P.stT / P.def.dur, shot: P.def.type, at: { burst: 0.16, firearrow: 0.56, throw: 0.44, splash: 0.44, roots: 0.5 }[P.def.type] };
  else if (s === 'heal') a = { kind: 'heal', t };
  else if (s === 'hurt') a = { kind: 'hurt', p: P.stT / 0.28 };
  else if (s === 'dead') a = { kind: 'dead', p: (P.deadT || 0) / 1.2 };
  else if (s === 'climb') a = { kind: 'climb', t, moving: Math.abs(P.vy) > 5 };
  else if (!P.onG) a = { kind: P.vy < 0 ? 'jump' : 'fall' };
  else if (Math.abs(P.vx) > 12) a = { kind: Math.abs(P.vx) > 55 ? 'run' : 'walk', ph: P.ph };
  else a = { kind: P.kneel ? 'kneel' : 'idle', t };
  const spec = SPEC[P.form] || SPEC.espirito;
  const alpha = P.fadeA != null ? P.fadeA : undefined;
  if (P.form === 'espirito' && !G.flags.noGlow) { ctx.globalAlpha = 0.15 + Math.sin(t * 3) * 0.05; ell(ctx, P.x + 5, P.y + P.h - 11, 10, 13, '#8a7ab0'); ctx.globalAlpha = 1; }
  drawHuman(ctx, P.x + 5, P.y + P.h, P.f, a, spec, P.state === 'hurt' && P.stT < 0.08, alpha);
  if (P.stun > 0) for (let i = 0; i < 3; i++) rect(ctx, P.x + 5 + Math.cos(t * 8 + i * 2) * 6, P.y - 4 + Math.sin(t * 8 + i * 2) * 2, 1, 1, '#c8f060');
}

// Coração da mata: semente viva num berço de raízes (vermelha enquanto corrompida, verde quando devolvida)
function drawHeart(x, gy, t, green) {
  const k = (Math.sin(t * 2) + 1) / 2, cy = gy - 42;
  const glow = green ? '#7af0c0' : '#e0904a', core = green ? ['#1e6a4a', '#3aa070', '#9af0c0'] : ['#5a2010', '#a04a20', '#f0b060'];
  ctx.globalAlpha = 0.1 + k * 0.08; ell(ctx, x, cy, 34 + k * 4 | 0, 30 + k * 4 | 0, glow); ctx.globalAlpha = 0.16 + k * 0.1; ell(ctx, x, cy, 20, 18, glow); ctx.globalAlpha = 1;
  // raízes: saem do chão, abraçam a semente e se fecham por cima
  const roots = [[-34, 0, -24, -22, -10, -40], [-20, 0, -16, -26, -6, -50], [34, 0, 24, -22, 10, -40], [20, 0, 16, -26, 6, -50], [-6, 0, -12, -18, -12, -30], [6, 0, 12, -18, 12, -30]];
  for (const [a, b, c2, d, e, f2] of roots) { const pts = curve(x + a, gy + b, x + c2, gy + d, x + e, gy + f2, 22); strokePath(ctx, pts, 3, '#3a2a40', '#0a0610'); pts.forEach(([px, py], i) => { if (i % 4 === 2) rect(ctx, px, py - 1, 1, 1, green ? '#5ae0b0' : '#c8803a'); }); }
  ell(ctx, x, cy + 1, 11, 13, '#0a0610'); ell(ctx, x, cy, 10, 12, core[0]); ell(ctx, x - 1, cy - 1, 7, 9, core[1]); ell(ctx, x - 2, cy - 3, 3 + k * 1.5 | 0, 4 + k * 1.5 | 0, core[2]); rect(ctx, x - 4, cy - 7, 2, 2, '#fff8e0');
  for (let i = 0; i < 3; i++) { const a = t * 1.5 + i * 2.1; rect(ctx, x + Math.cos(a) * 16, cy + Math.sin(a) * 12, 1, 1, glow); }
}
// raízes que brotam do chão (especial das sementes e dissolução): rachadura, depois raízes curvas com folhas
function drawRootBurst(h) {
  const gy = h.y + h.h, r = seeded(Math.round(h.x));
  if (h.t < 0.22) { for (let i = 0; i < h.w; i += 2) rect(ctx, h.x + i, gy - 1 - (i % 4 === 0 ? 1 : 0), 1, 1, i % 4 ? '#2a1a10' : '#8fe37a'); return; }
  const k = Math.min(1, (h.t - 0.22) / 0.1) * Math.min(1, h.life / 0.25);
  for (let i = 0; i < 4; i++) {
    const bx = h.x + 3 + i * (h.w - 6) / 3, lean = (r() - 0.5) * 10, hh = h.h * k * (0.6 + r() * 0.4);
    const pts = curve(bx, gy, bx + lean * 0.3, gy - hh * 0.6, bx + lean, gy - hh, 12);
    strokePath(ctx, pts, 2, '#5a3a22', '#1a0e08');
    pts.forEach(([px, py], j) => { if (j % 3 === 1) rect(ctx, px + 1, py, 1, 1, '#6aa04a'); });
    const [tx, ty] = pts[pts.length - 1]; rect(ctx, tx - 2, ty - 1, 3, 2, '#4a8a3a'); rect(ctx, tx, ty - 2, 3, 2, '#8fe37a');
  }
  for (let i = 0; i < h.w; i += 3) rect(ctx, h.x + i, gy - 1, 2, 1, '#3a2a1a');
}
