'use strict';
// Núcleo: tela, layout, entrada (teclado, toque, controle), áudio e save.
const W = 432, H = 243, GY = 150; // Campo de visão 12,5% maior, mantendo a proporção 16:9.
const DY = H - 180, AW = W;            // DY: céu a mais em cima; AW: largura das arenas dos guardiões (a tela inteira)
const WORLD_H = 216;                  // Limite de queda independente do tamanho da câmera.
const RENDER_SCALE = 2;               // Resolução alta para exibir a textura clássica com nitidez.
function renderContext(canvas, w, h, scale = RENDER_SCALE) {
  canvas.width = Math.ceil(w * scale); canvas.height = Math.ceil(h * scale); canvas.renderScale = scale;
  const c = canvas.getContext('2d');
  c.setTransform(scale, 0, 0, scale, 0, 0);
  c.imageSmoothingEnabled = false;
  // Peças e recortes continuam sendo desenhados em unidades do mundo.
  const nativeDraw = Object.prototype.hasOwnProperty.call(c, 'nativeDrawImage') ? c.nativeDrawImage : c.drawImage.bind(c);
  c.nativeDrawImage = nativeDraw;
  c.drawImage = function (source, ...a) {
    const s = source.renderScale || 1;
    if (a.length === 2) return nativeDraw(source, a[0], a[1], source.width / s, source.height / s);
    if (a.length === 8 && s !== 1) for (let i = 0; i < 4; i++) a[i] *= s;
    return nativeDraw(source, ...a);
  };
  return c;
}
const cv = document.getElementById('cv');
let ctx = renderContext(cv, W, H);
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

// ---------- Layout: palco 432x243 escalado; no retrato fica no alto com os controles embaixo ----------
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

// ---------- Áudio: efeitos sintetizados e trilhas em MP3 ----------
const AU = { ctx: null, master: null, music: document.getElementById('music'), on: true, biome: null, track: null, musicAttempt: 0, musicPending: false, musicBlocked: false, vol: 0.8, mus: 1, sfx: 1 };
// volumes (0 a 1): geral (tudo), música (trilhas e vídeo da abertura) e efeitos (golpes, dano, passos, interações)
function auGain() { return AU.on ? 0.55 * AU.vol * AU.sfx : 0; }
function musicVol() { return AU.vol * AU.mus * (AU.journeyMix ?? 1); }
function audioInit() {
  AU.musicBlocked = false; musicTick();
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AU.master = AU.ctx.createGain(); AU.master.gain.value = auGain(); AU.master.connect(AU.ctx.destination);
  } catch (e) { AU.ctx = null; }
}
function setSound(on) {
  AU.on = on;
  if (AU.master) AU.master.gain.value = auGain();
  AU.music.muted = !on;
  const video = document.getElementById('introVideo');
  if (video) video.muted = !on;
  if (!on) { AU.musicAttempt++; AU.musicPending = false; AU.music.pause(); }
  else { AU.musicBlocked = false; musicTick(); }
  try { localStorage.setItem('terra-som', on ? '1' : '0'); } catch (e) {}
}
try { AU.on = localStorage.getItem('terra-som') !== '0'; } catch (e) {}
AU.music.muted = !AU.on;

const VOL_KEY = { vol: 'terra-vol', mus: 'terra-vol-music', sfx: 'terra-vol-sfx' };
for (const k in VOL_KEY) try { const v = parseFloat(localStorage.getItem(VOL_KEY[k])); if (v >= 0 && v <= 1) AU[k] = v; } catch (e) {}
AU.music.volume = 0.35 * musicVol();
function setVolume(k, v) {
  AU[k] = Math.round(clamp(v, 0, 1) * 20) / 20;
  if (AU.master) AU.master.gain.value = auGain();
  AU.music.volume = 0.35 * musicVol();
  const video = document.getElementById('introVideo');
  if (video) video.volume = musicVol();
  for (const r of document.querySelectorAll(`input[data-vol="${k}"]`)) { r.value = Math.round(AU[k] * 100); r.nextElementSibling.textContent = Math.round(AU[k] * 100) + '%'; }
  try { localStorage.setItem(VOL_KEY[k], String(AU[k])); } catch (e) {}
}
// controle deslizante de um dos volumes; arrastar com o dedo/mouse ou ← → no teclado/controle
function volHTML(k, label) { const p = Math.round(AU[k] * 100); return `<label class="btn vol"><span>${label}</span><input type="range" min="0" max="100" step="5" value="${p}" data-vol="${k}" aria-label="${label}"><b>${p}%</b></label>`; }
document.addEventListener('input', e => { if (e.target.matches('input[data-vol]')) { audioInit(); setVolume(e.target.dataset.vol, e.target.value / 100); } });
// ao soltar, toca um exemplo: um golpe para os efeitos, o clique da interface para os outros
document.addEventListener('change', e => { if (e.target.matches('input[data-vol]')) (e.target.dataset.vol === 'sfx' ? SFX.hit : SFX.ui)(); });
let noiseBuf = null;
// Paleta original de materiais: madeira oca, sementes, pele percutida e ar.
// Inspiração sonora para o mundo fictício; não reproduz cantos ou ritos de um povo.
const sfxLast = Object.create(null);
const sfxVariants = Object.create(null), sfxTextures = Object.create(null);
function soundPick(name, count) {
  const bag = sfxVariants[name] || (sfxVariants[name] = { remaining: [], last: -1 });
  if (!bag.remaining.length) {
    bag.remaining = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag.remaining[i], bag.remaining[j]] = [bag.remaining[j], bag.remaining[i]]; }
    if (count > 1 && bag.remaining[0] === bag.last) [bag.remaining[0], bag.remaining[1]] = [bag.remaining[1], bag.remaining[0]];
  }
  bag.last = bag.remaining.shift();
  return bag.last;
}
function soundCue(name, spacing, play) {
  return (...args) => {
    if (!AU.ctx || !AU.on) return;
    const now = AU.ctx.currentTime;
    if (now - (sfxLast[name] ?? -Infinity) < spacing) return;
    sfxLast[name] = now;
    play(...args);
  };
}
function soundNote(freq, dur, vol, delay = 0, bend = 0, attack = 0.003) {
  const c = AU.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
  if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(25, freq + bend), t + dur * 0.75);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(attack, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + 0.02);
  o.onended = () => { o.disconnect(); g.disconnect(); };
}
function soundTexture(kind) {
  const c = AU.ctx, key = kind + c.sampleRate;
  if (sfxTextures[key]) return sfxTextures[key];
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate), data = b.getChannelData(0);
  let low = 0, previous = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1, t = i / c.sampleRate;
    low = (low + white * 0.07) / 1.07;
    if (kind === 'earth') data[i] = low * 2.5 + white * 0.13;
    else if (kind === 'leaf') data[i] = (white - previous) * (0.18 + 0.18 * Math.sin(t * 137) ** 2);
    else data[i] = (low * 2 + white * 0.2) * (0.25 + 0.75 * Math.sin(t * 39 * Math.PI) ** 2);
    previous = white;
  }
  sfxTextures[key] = b; return b;
}
function soundAir(dur, vol, from, to, delay = 0, type = 'bandpass', q = 0.8, attack = 0.012, texture = 'air') {
  const c = AU.ctx, t = c.currentTime + delay;
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = texture === 'air' ? noiseBuf : soundTexture(texture); s.loop = true; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(attack, dur * 0.2));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(AU.master); s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.02);
  s.onended = () => { s.disconnect(); f.disconnect(); g.disconnect(); };
}
function soundWood(freq = 310, weight = 1, delay = 0) {
  soundNote(freq, 0.095, 0.065 * weight, delay, -freq * 0.12);
  soundNote(freq * 2.76, 0.035, 0.019 * weight, delay);
  soundAir(0.035, 0.035 * weight, 1300, 480, delay);
}
function soundDrum(freq = 90, weight = 1, delay = 0, ring = 1) {
  soundNote(freq * 1.8, 0.32 * ring, 0.14 * weight, delay, -freq * 0.8);
  soundNote(freq * 1.49, 0.18 * ring, 0.042 * weight, delay, -freq * 0.12);
  soundAir(0.075, 0.075 * weight, 900, 180, delay, 'lowpass');
}
function soundSeeds(count = 3, weight = 1, delay = 0) {
  for (let i = 0; i < count; i++) {
    const at = delay + i * 0.018 + Math.random() * 0.007;
    soundAir(0.022 + Math.random() * 0.012, 0.045 * weight, 2400 + Math.random() * 700, 1300, at, 'bandpass', 1.1);
    soundNote(850 + Math.random() * 450, 0.018, 0.009 * weight, at);
  }
}
function soundFlute(freq, dur = 0.42, weight = 1, delay = 0) {
  soundNote(freq, dur, 0.11 * weight, delay, freq * 0.012, 0.045);
  soundNote(freq * 2, dur * 0.65, 0.011 * weight, delay, 0, 0.04);
  soundAir(dur * 0.85, 0.045 * weight, 1700, 950, delay, 'bandpass', 1.5);
  // Reflexo discreto: dá espaço aos sons de memória sem prolongar os golpes.
  soundNote(freq, dur * 0.7, 0.012 * weight, delay + 0.13, 0, 0.035);
}
function soundGrowl(weight = 1, variant = 0) {
  const pitch = [1, 0.9, 1.08, 0.96][variant], length = [0.62, 0.48, 0.72, 0.57][variant];
  soundNote(64 * pitch, length, 0.07 * weight, 0, -22 * pitch, 0.035);
  soundAir(length, 0.32 * weight, 470 * pitch, 115, 0, 'lowpass', 1.2, 0.025, 'rough');
  soundAir(length * 0.7, 0.16 * weight, [880, 660, 1050, 740][variant], 250, 0.025, 'bandpass', 2.4, 0.02, 'rough');
  if (variant === 2) soundAir(0.15, 0.1 * weight, 750, 370, length * 0.6, 'bandpass', 1.2);
}
const SFX = {
  jump: soundCue('jump', 0.08, () => { soundAir(0.14, 0.17, 650, 1800); soundWood(240 + Math.random() * 35, 0.55); }),
  land: soundCue('land', 0.1, () => {
    const v = soundPick('land', 3);
    soundDrum([100, 88, 110][v], 0.38, 0, [0.65, 0.8, 0.5][v]);
    soundAir([0.08, 0.12, 0.065][v], 0.11, [800, 550, 1000][v], 150, 0, 'lowpass', 0.7, 0.003, 'earth');
  }),
  swing: soundCue('swing', 0.045, (form) => {
    const v = soundPick('swing', 4), heavy = form === 'lanca' || form === 'semente';
    soundAir([0.13, 0.18, 0.11, 0.16][v], 0.3, [650, 1000, 1800, 450][v], [2300, 550, 950, 1700][v], 0, 'bandpass', [0.8, 1.1, 0.7, 1.4][v], [0.015, 0.025, 0.006, 0.02][v]);
    if (heavy) soundWood([150, 175, 135, 160][v], 0.35, 0.035);
  }),
  dart: soundCue('dart', 0.035, () => { soundAir(0.13, 0.35, 1900, 650, 0, 'bandpass', 1.8); soundWood(480, 0.7, 0.015); }),
  hit: soundCue('hit', 0.055, () => {
    const v = soundPick('hit', 4);
    soundAir([0.065, 0.045, 0.09, 0.055][v], [0.36, 0.3, 0.4, 0.32][v], [1500, 2300, 800, 1800][v], [300, 700, 160, 450][v], 0, 'lowpass', 0.8, 0.002, v === 1 ? 'leaf' : 'earth');
    if (v === 1) soundWood(145, 0.8);
    else soundDrum([115, 105, 82, 132][v], 0.7, 0, [0.5, 0.4, 0.65, 0.38][v]);
  }),
  hurt: soundCue('hurt', 0.1, () => {
    const v = soundPick('hurt', 3);
    soundDrum([72, 62, 82][v], 0.95, 0, [0.7, 0.9, 0.55][v]);
    soundAir([0.14, 0.2, 0.12][v], 0.22, [650, 450, 850][v], 150, 0.015, 'bandpass', 1.1, 0.012, 'rough');
  }),
  dash: soundCue('dash', 0.08, () => {
    const v = soundPick('dash', 4);
    soundAir([0.2, 0.24, 0.18, 0.22][v], 0.28, [2200, 1650, 2600, 1800][v], [450, 600, 700, 350][v], 0, 'bandpass', [0.8, 1, 0.7, 1.1][v], 0.016);
    if (v === 2) soundAir(0.09, 0.05, 1800, 900, 0.04, 'highpass', 0.7, 0.01, 'leaf');
  }),
  heal: soundCue('heal', 0.15, () => { soundSeeds(5, 0.8); soundFlute(392, 0.46, 0.9, 0.05); soundFlute(523.25, 0.55, 0.65, 0.23); }),
  mem: soundCue('mem', 0.09, () => { soundWood(640, 0.4); soundFlute(784, 0.22, 0.7, 0.015); }),
  fire: soundCue('fire', 0.12, () => { soundAir(0.42, 0.23, 1800, 330, 0, 'lowpass'); soundSeeds(6, 0.85); soundDrum(78, 0.35); }),
  boom: soundCue('boom', 0.12, () => {
    const v = soundPick('boom', 3);
    soundDrum([52, 58, 46][v], 1.3, 0, [1, 0.8, 1.15][v]);
    soundAir([0.38, 0.48, 0.32][v], 0.3, [700, 950, 500][v], 90, 0, 'lowpass', 0.8, 0.003, 'earth');
    soundWood([115, 140, 95][v], 0.65, [0.025, 0.055, 0.015][v]);
  }),
  roar: soundCue('roar', 0.35, () => soundGrowl(1, soundPick('roar', 4))),
  splash: soundCue('splash', 0.08, () => {
    const v = soundPick('splash', 3);
    soundAir([0.25, 0.2, 0.29][v], 0.25, [2200, 1700, 2600][v], 600, 0, 'lowpass');
    soundAir([0.22, 0.16, 0.25][v], 0.14, [850, 650, 1100][v], 250, [0.06, 0.035, 0.08][v], 'bandpass', 2.5);
  }),
  echo: soundCue('echo', 0.2, () => { soundSeeds(3, 0.45); [392, 523.25, 587.33].forEach((f, i) => soundFlute(f, 0.65, 0.7, i * 0.16)); }),
  rest: soundCue('rest', 0.25, () => { soundDrum(105, 0.5); soundSeeds(5, 0.5, 0.13); [293.66, 392, 523.25].forEach((f, i) => soundFlute(f, 0.7, 0.7, 0.08 + i * 0.23)); }),
  ui: soundCue('ui', 0.075, () => { const v = soundPick('ui', 3); soundWood([430, 390, 465][v], [0.72, 0.78, 0.65][v]); }),
  step: soundCue('step', 0.11, () => {
    const v = soundPick('step', 4);
    soundAir([0.055, 0.085, 0.045, 0.07][v], [0.085, 0.07, 0.11, 0.08][v], [1300, 2200, 750, 1700][v], [420, 950, 220, 600][v], 0, v === 1 ? 'highpass' : 'lowpass', 0.7, [0.003, 0.009, 0.002, 0.006][v], v % 2 ? 'leaf' : 'earth');
    if (v === 2) soundNote(128, 0.04, 0.015);
  }),
  mapStep: soundCue('mapStep', 0.22, () => { const v = soundPick('mapStep', 3); soundDrum([68, 75, 62][v], 0.32, 0, 0.5); soundAir(0.12, 0.12, [650, 900, 500][v], 140, 0, 'lowpass', 0.8, 0.003, 'earth'); }),
  mapClaw: soundCue('mapClaw', 0.08, () => {
    const v = soundPick('mapClaw', 4);
    soundAir([0.16, 0.21, 0.13, 0.19][v], 0.34, [500, 1900, 850, 2300][v], [2400, 550, 1700, 800][v], 0, 'bandpass', [0.8, 1.3, 1, 0.7][v], [0.012, 0.025, 0.007, 0.018][v]);
    soundAir(0.065, 0.09, [1900, 1400, 2200, 1700][v], 600, 0.025, 'highpass', 0.7, 0.003, 'leaf');
  }),
  mapBite: soundCue('mapBite', 0.15, () => { const v = soundPick('mapBite', 3); soundWood([160, 135, 180][v], 1.7); soundAir([0.11, 0.08, 0.14][v], 0.5, [800, 1100, 650][v], 200, 0.018, 'bandpass', 1.6, 0.003, 'rough'); }),
  mapSlam: soundCue('mapSlam', 0.1, (kind = 'heavy') => {
    const v = soundPick('mapSlam', 4), echo = kind === 'echo';
    soundDrum([48, 52, 45, 50][v] * (echo ? 1.15 : 1), echo ? 1.25 : 1.5, 0, echo ? 0.7 : [1, 0.92, 1.08, 0.96][v]);
    soundAir([0.4, 0.32, 0.46, 0.36][v], 0.3, [550, 900, 420, 750][v], 75, 0, 'lowpass', 0.8, 0.003, 'earth');
    if (kind === 'wall' || v === 1) soundWood([105, 145, 95, 125][v], 0.85, 0.018);
    else soundAir(0.09, 0.12, 2300, 1100, 0.04, 'highpass', 0.7, 0.002, 'leaf');
  }),
  mapRoar: soundCue('mapRoar', 0.4, () => soundGrowl(1.3, soundPick('mapRoar', 4))),
  mapSnort: soundCue('mapSnort', 0.25, () => { const v = soundPick('mapSnort', 3); soundAir([0.22, 0.27, 0.19][v], 0.3, [600, 850, 470][v], 180, 0, 'bandpass', 1.5, 0.02, 'rough'); }),
  mapCharge: soundCue('mapCharge', 0.25, () => { const v = soundPick('mapCharge', 3); soundAir(0.3, 0.28, [440, 600, 350][v], 140, 0, 'lowpass', 1.2, 0.025, 'rough'); soundDrum([58, 65, 54][v], 0.7, 0, 0.7); }),
  mapBreath: soundCue('mapBreath', 0.18, () => { soundAir(0.8, 0.35, 1000, 180, 0, 'bandpass', 2); soundAir(0.6, 0.14, 400, 90, 0.08, 'lowpass'); }),
  bird: soundCue('bird', 0.08, () => { soundFlute(1174.66, 0.12, 0.6); soundFlute(1567.98, 0.15, 0.4, 0.1); }),
  lose: soundCue('lose', 0.3, () => { soundDrum(60, 0.7); soundFlute(293.66, 0.75, 0.8, 0.06); soundFlute(196, 0.9, 0.65, 0.35); }),
};
// Uma única faixa por vez; mudar de bioma mantém o tema na mesma posição.
const MUSIC_TRACKS = {
  menu: 'assets/audio/menu.mp3',
  theme: 'assets/audio/tema.mp3',
  boss: 'assets/audio/batalha-boss.mp3',
  victory: 'assets/audio/vitoria-boss.mp3',
};
function musicSet(biome) {
  const track = biome ? (Object.hasOwn(MUSIC_TRACKS, biome) ? biome : 'theme') : null;
  AU.biome = biome;
  if (track !== AU.track) {
    AU.musicAttempt++; AU.musicPending = false; AU.musicBlocked = false;
    AU.music.pause(); AU.track = track;
    if (track) { AU.music.src = MUSIC_TRACKS[track]; AU.music.loop = true; }
    else AU.music.removeAttribute('src');
    AU.music.load();
  }
  musicTick();
}
function musicTick() {
  if (!AU.on || !AU.track || AU.musicBlocked || AU.musicPending || !AU.music.paused) return;
  const attempt = ++AU.musicAttempt;
  AU.musicPending = true;
  AU.music.play().then(() => {
    if (attempt === AU.musicAttempt) AU.musicPending = false;
  }).catch(() => {
    if (attempt !== AU.musicAttempt) return;
    AU.musicPending = false; AU.musicBlocked = true;
  });
}

// ---------- Save ----------
const SAVE_KEY = 'terra-que-rejeitou-v1';
function newSave() {
  return { act: 0, mem: 0, vig: 0, forc: 0, fol: 0, forms: ['espirito'], form: 'espirito', echoes: [], harmony: {}, frag: 0, answer: null, fire: null, drop: null, done: false, seen: {}, lit: {}, opened: {}, bonusFlask: 0, items: [], cold: false, ev: {}, gates: [], murals: [], seenGates: [], sub: null };
}
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && typeof s.act === 'number' ? Object.assign(newSave(), s) : null; } catch (e) { return null; } }
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) {} }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
