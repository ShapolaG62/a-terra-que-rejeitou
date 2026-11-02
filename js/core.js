'use strict';
// Núcleo: tela, layout, entrada (teclado, toque, controle), áudio e save.
const W = 384, H = 216, GY = 150; // GY = altura padrão do chão (área visível 20% maior que 320×180)
const DY = H - 180, AW = 320;          // DY: céu a mais em cima; AW: largura das arenas dos guardiões
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function hash(n) { n = Math.imul(n | 0, 374761393); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
function seeded(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }

// ---------- Layout: palco 320x180 escalado; no retrato fica no alto com os controles embaixo ----------
const stage = $('#stage');
const L = { s: 1, x: 0, y: 0, w: W, h: H, portrait: false, touch: false };
function layout() {
  const vw = innerWidth, vh = innerHeight;
  const portrait = vh > vw * 1.05;
  let s = portrait ? vw / W : Math.min(vw / W, vh / H);
  if (!portrait && s > 2) s = Math.floor(s * 4) / 4;
  const w = Math.round(W * s), h = Math.round(H * s);
  const x = Math.round((vw - w) / 2);
  const y = portrait ? Math.round(clamp((vh - h) / 2 - 150, 40, 110)) : Math.round((vh - h) / 2);
  Object.assign(L, { s, x, y, w, h, portrait });
  Object.assign(stage.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  stage.style.setProperty('--fs', clamp(s * 4.4, 11, 22).toFixed(1) + 'px');
  document.body.classList.toggle('portrait', portrait);
  document.body.classList.toggle('landscape', !portrait);
  const d = $('#dialog');
  if (portrait) Object.assign(d.style, { left: '10px', right: '10px', top: (y + h + 10) + 'px', bottom: 'auto', width: 'auto' });
  else Object.assign(d.style, { left: (x + w * 0.06) + 'px', right: 'auto', width: (w * 0.88) + 'px', top: 'auto', bottom: Math.max(8, vh - (y + h) + h * 0.04) + 'px' });
  const r = $('#rotate');
  r.hidden = !(portrait && L.touch);
  r.style.top = (y - 22) + 'px';
}
addEventListener('resize', layout);
addEventListener('orientationchange', () => setTimeout(layout, 150));

// ---------- Entrada ----------
const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'shoot', 'special', 'dodge', 'heal', 'interact', 'swap', 'pause', 'confirm', 'debug', 'inv', 'slot0', 'slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6', 'slot7'];
const KEYMAP = {
  ArrowLeft: ['left'], KeyA: ['left'], ArrowRight: ['right'], KeyD: ['right'],
  ArrowUp: ['up', 'jump'], KeyW: ['up', 'jump'], ArrowDown: ['down'], KeyS: ['down'],
  Space: ['jump', 'confirm'], KeyJ: ['attack'], KeyZ: ['attack'], KeyK: ['shoot'], KeyX: ['shoot'], KeyU: ['special'], KeyV: ['special'],
  KeyL: ['dodge'], KeyC: ['dodge'], ShiftLeft: ['dodge'], ShiftRight: ['dodge'],
  KeyF: ['heal'], KeyE: ['interact'], KeyQ: ['swap'], Escape: ['pause'], KeyP: ['pause'], Enter: ['confirm'], Backquote: ['debug'], F2: ['debug'], KeyI: ['inv'], Tab: ['inv'],
  Digit1: ['slot0'], Digit2: ['slot1'], Digit3: ['slot2'], Digit4: ['slot3'], Digit5: ['slot4'], Digit6: ['slot5'], Digit7: ['slot6'], Digit8: ['slot7'],
};
const I = { down: {}, pressed: {}, any: false, mouseT: -1e9, mouseWX: 0 };
const kb = {}, tc = {}, gp = {}, ms = {}, hit = {};
let prevDown = {};
addEventListener('keydown', e => {
  const m = KEYMAP[e.code]; if (!m) return;
  if (e.code === 'Space' || e.code === 'F2' || e.code === 'Tab' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return;
  for (const a of m) { kb[a] = true; hit[a] = true; }
  audioInit();
});
addEventListener('keyup', e => { const m = KEYMAP[e.code]; if (m) for (const a of m) kb[a] = false; });
addEventListener('blur', () => { for (const k in kb) kb[k] = false; for (const k in tc) tc[k] = false; for (const k in ms) ms[k] = false; });
// Mouse: botão esquerdo = golpe corpo a corpo, direito = tiro (o personagem vira para o cursor)
const MOUSE = { 0: 'attack', 2: 'shoot' };
stage.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' || !(e.button in MOUSE)) return;
  e.preventDefault(); audioInit();
  const a = MOUSE[e.button]; ms[a] = true; hit[a] = true;
  const r = stage.getBoundingClientRect();
  I.mouseSX = e.clientX; I.mouseSY = e.clientY; if (r.width > 0) { I.mouseT = performance.now(); I.mouseWX = G.cam.x + (e.clientX - r.left) / r.width * W; }
});
addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button in MOUSE) ms[MOUSE[e.button]] = false; });
stage.addEventListener('contextmenu', e => e.preventDefault());
// posição do mouse e roda
stage.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { I.mouseSX = e.clientX; I.mouseSY = e.clientY; I.mouseT = performance.now(); } });
stage.addEventListener('wheel', e => { I.wheel = Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

function readGamepad() {
  for (const a of ACTIONS) gp[a] = false;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const p = pads && [...pads].find(Boolean); if (!p) return;
  const b = i => p.buttons[i] && p.buttons[i].pressed;
  const ax = p.axes[0] || 0;
  gp.left = ax < -0.4 || b(14); gp.right = ax > 0.4 || b(15);
  gp.up = (p.axes[1] || 0) < -0.6 || b(12); gp.down = (p.axes[1] || 0) > 0.6 || b(13);
  gp.jump = b(0); gp.confirm = b(0); gp.attack = b(2); gp.shoot = b(3); gp.special = b(5); gp.dodge = b(1);
  gp.heal = b(4); gp.interact = b(13) || b(7); gp.swap = b(6); gp.pause = b(9);
}
function pollInput() {
  readGamepad();
  I.any = false;
  for (const a of ACTIONS) {
    const d = !!(kb[a] || tc[a] || gp[a] || ms[a]);
    I.pressed[a] = (d && !prevDown[a]) || !!hit[a];
    I.down[a] = d;
    prevDown[a] = d; hit[a] = false;
    if (I.pressed[a]) I.any = true;
  }
}

// Botões de toque (multitoque com pointer events)
function setupTouch() {
  const el = $('#touch');
  const show = () => { if (!L.touch) { L.touch = true; el.hidden = false; layout(); } };
  if (matchMedia('(pointer: coarse)').matches) show();
  addEventListener('touchstart', show, { passive: true });
  for (const b of el.querySelectorAll('button')) {
    const a = b.dataset.a; let id = null;
    const on = e => { e.preventDefault(); audioInit(); id = e.pointerId; try { b.setPointerCapture(id); } catch (_) {} tc[a] = true; hit[a] = true; if (a === 'interact') { tc.confirm = true; hit.confirm = true; } b.classList.add('on'); };
    const off = e => { if (id !== null && e.pointerId !== id) return; id = null; tc[a] = false; if (a === 'interact') tc.confirm = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
}

// ---------- Áudio (sintetizado, sem arquivos) ----------
const AU = { ctx: null, master: null, music: null, on: true, biome: null, nextNote: 0, drone: null };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AU.master = AU.ctx.createGain(); AU.master.gain.value = AU.on ? 0.55 : 0; AU.master.connect(AU.ctx.destination);
    AU.music = AU.ctx.createGain(); AU.music.gain.value = 0.32; AU.music.connect(AU.master);
  } catch (e) { AU.ctx = null; }
}
function setSound(on) { AU.on = on; if (AU.master) AU.master.gain.value = on ? 0.55 : 0; try { localStorage.setItem('terra-som', on ? '1' : '0'); } catch (e) {} }
try { AU.on = localStorage.getItem('terra-som') !== '0'; } catch (e) {}
function tone(freq, dur, type = 'square', vol = 0.12, slide = 0, delay = 0, dest) {
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime + delay;
  const o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AU.master); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noise(dur, vol = 0.2, freq = 1000, delay = 0) {
  if (!AU.ctx) return;
  if (!noiseBuf) { noiseBuf = AU.ctx.createBuffer(1, AU.ctx.sampleRate, AU.ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = AU.ctx.currentTime + delay;
  const s = AU.ctx.createBufferSource(), f = AU.ctx.createBiquadFilter(), g = AU.ctx.createGain();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const SFX = {
  jump: () => tone(220, 0.12, 'square', 0.05, 160),
  land: () => noise(0.06, 0.08, 500),
  swing: () => noise(0.09, 0.12, 2400),
  dart: () => { tone(900, 0.07, 'triangle', 0.08, -500); noise(0.05, 0.06, 4000); },
  hit: () => { noise(0.1, 0.25, 1400); tone(140, 0.08, 'square', 0.06, -60); },
  hurt: () => { tone(180, 0.2, 'sawtooth', 0.12, -120); noise(0.15, 0.2, 800); },
  roll: () => noise(0.18, 0.1, 700),
  heal: () => { tone(523, 0.18, 'triangle', 0.08); tone(784, 0.3, 'triangle', 0.07, 0, 0.12); },
  mem: () => tone(1046, 0.08, 'triangle', 0.04, 300),
  fire: () => { noise(0.4, 0.14, 900); tone(110, 0.3, 'sawtooth', 0.04, 60); },
  boom: () => { noise(0.45, 0.35, 300); tone(70, 0.4, 'sine', 0.25, -30); },
  roar: () => { tone(95, 0.7, 'sawtooth', 0.14, -40); noise(0.7, 0.14, 500); },
  splash: () => noise(0.3, 0.18, 1800),
  echo: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.6, 'sine', 0.06, 0, i * 0.12)); },
  rest: () => { [392, 494, 587].forEach((f, i) => tone(f, 0.9, 'triangle', 0.06, 0, i * 0.18)); },
  ui: () => tone(660, 0.05, 'square', 0.04),
  step: () => noise(0.03, 0.03, 600),
  lose: () => { tone(330, 0.6, 'triangle', 0.08, -150); tone(220, 0.9, 'triangle', 0.07, -100, 0.3); },
};
// Música ambiente: drone + notas pentatônicas esparsas, uma escala por bioma
const SCALES = {
  prologo: [146.8, 174.6, 196, 220, 261.6], amazonia: [196, 220, 261.6, 293.7, 329.6, 392],
  cerrado: [174.6, 207.7, 233.1, 261.6, 311.1, 349.2], pantanal: [220, 246.9, 293.7, 329.6, 370, 440],
  caatinga: [164.8, 196, 220, 246.9, 293.7, 329.6], mata: [146.8, 174.6, 220, 261.6, 293.7, 349.2],
  coracao: [130.8, 155.6, 196, 233.1, 261.6], boss: [110, 130.8, 146.8, 164.8, 196],
};
function musicSet(biome) { AU.biome = biome; }
function musicTick() {
  if (!AU.ctx || !AU.biome || !AU.on) return;
  const now = AU.ctx.currentTime;
  if (now < AU.nextNote) return;
  const sc = SCALES[AU.biome] || SCALES.prologo;
  const boss = AU.biome === 'boss';
  const f = pick(sc) * (Math.random() < 0.3 ? 2 : 1);
  tone(f, boss ? 0.5 : 1.6, boss ? 'sawtooth' : 'triangle', boss ? 0.05 : 0.07, 0, 0, AU.music);
  if (Math.random() < 0.35) tone(sc[0] / 2, boss ? 0.4 : 2.4, 'sine', 0.1, 0, 0, AU.music);
  if (boss && Math.random() < 0.5) noise(0.08, 0.07, 300);
  AU.nextNote = now + (boss ? rnd(0.25, 0.5) : rnd(0.7, 1.8));
}

// ---------- Save ----------
const SAVE_KEY = 'terra-que-rejeitou-v1';
function newSave() {
  return { act: 0, mem: 0, vig: 0, forc: 0, fol: 0, forms: ['espirito'], form: 'espirito', echoes: [], harmony: {}, frag: 0, answer: null, fire: null, drop: null, done: false, seen: {}, lit: {}, opened: {}, bonusFlask: 0, items: [], cold: false, ev: {}, gates: [], murals: [], seenGates: [], sub: null };
}
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && typeof s.act === 'number' ? Object.assign(newSave(), s) : null; } catch (e) { return null; } }
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) {} }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
