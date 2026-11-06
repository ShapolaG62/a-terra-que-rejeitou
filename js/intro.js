'use strict';
// Os dois vídeos são exibidos em sequência antes do menu principal. O vídeo narrado toca só depois de Novo jogo (ver tocarAbertura).
const INTRO = {
  clips: [{ src: 'assets/videos/intro-1.mp4', rate: 1.5 }, { src: 'assets/videos/intro-2.mp4', rate: 1.5 }],
  index: -1, active: false, attempt: 0, veu: false,
};

function setupIntro() {
  const video = $('#introVideo');
  INTRO.active = true;
  G.state = 'intro';
  $('#title').hidden = true;
  $('#intro').hidden = false;
  $('#bIntroSkip').onclick = () => { audioInit(); finishIntro(); };
  video.addEventListener('ended', () => { if (video.ended) nextIntroClip(); });
  video.addEventListener('error', () => { if (video.error) nextIntroClip(); });
  video.addEventListener('playing', () => { if (INTRO.active) $('#introStatus').hidden = true; });
  video.addEventListener('waiting', () => { if (INTRO.active) $('#introStatus').hidden = false; });
  // o navegador pode começar os vídeos sem som: o primeiro toque ou tecla liga o áudio
  const liga = () => { audioInit(); if (INTRO.active) video.muted = !AU.on; };
  for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, liga, { once: true });
  nextIntroClip();
}

// ---------- Fumaça: cobre a tela aos poucos e depois se abre sobre o que estiver por baixo ----------
const FUMACA = (() => {
  const N = 64, ruido = new Float32Array(N * N);
  let semente = 7;
  for (let i = 0; i < ruido.length; i++) { semente = (semente * 1664525 + 1013904223) >>> 0; ruido[i] = semente / 4294967296; }
  const am = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const v = (a, b) => ruido[((b & 63) << 6) | (a & 63)];
    return (v(xi, yi) * (1 - ux) + v(xi + 1, yi) * ux) * (1 - uy) + (v(xi, yi + 1) * (1 - ux) + v(xi + 1, yi + 1) * ux) * uy;
  };
  const liso = v => { const u = v < 0 ? 0 : v > 1 ? 1 : v; return u * u * (3 - 2 * u); };
  function pinta(cv2, x2, img, p, abrindo, t) {
    const w = cv2.width, h = cv2.height, d = img.data, c = p * 1.5;
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
      // três camadas de ruído subindo em velocidades diferentes, entortadas umas pelas outras
      const dobra = am(x * 0.02 + t * 0.12, y * 0.025 - t * 0.2) * 3;
      const n = am(x * 0.03 + dobra, y * 0.04 - t * 0.35) * 0.55 + am(x * 0.07 - t * 0.2, y * 0.09 - t * 0.6 + dobra) * 0.3 + am(x * 0.16 + t * 0.3, y * 0.2 - t * 0.9) * 0.15;
      const dx = (x - w / 2) / (w / 2), dy = (y - h / 2) / (h / 2), centro = Math.min(1, Math.hypot(dx, dy)), baixo = y / h;
      // chega de baixo e pelas bordas; quando abre, o buraco nasce no meio
      const v = n * 0.55 + (abrindo ? centro : Math.max(centro * 0.7, baixo)) * 0.45;
      const e = (v + c - 1) / 0.5;
      if (e <= 0) { d[i + 3] = 0; continue; }
      const s = liso(e / 0.7), f = liso((e - 0.5) / 0.5); // o véu engrossa e só no fim escurece
      d[i] = 128 + (9 - 128) * f; d[i + 1] = 116 + (7 - 116) * f; d[i + 2] = 102 + (7 - 102) * f; d[i + 3] = s * 255;
    }
    x2.putImageData(img, 0, 0);
  }
  function roda(cobrindo, dur) {
    const cv2 = $('#fumaca'), x2 = cv2.getContext('2d'), img = x2.createImageData(cv2.width, cv2.height);
    cv2.hidden = false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) dur = Math.min(dur, 0.2);
    return new Promise(res => {
      const t0 = performance.now();
      const passo = () => {
        const u = Math.min(1, (performance.now() - t0) / 1000 / dur), s = u * u * (3 - 2 * u);
        pinta(cv2, x2, img, cobrindo ? s : 1 - s, !cobrindo, performance.now() / 1000);
        if (u < 1) requestAnimationFrame(passo);
        else { if (!cobrindo) cv2.hidden = true; res(); }
      };
      passo();
    });
  }
  return { cobre: dur => roda(true, dur), abre: dur => roda(false, dur) };
})();

// Novo jogo: a fumaça toma a tela, o vídeo narrado começa por trás dela e ela se abre; termina ao acabar ou ao pular.
async function tocarAbertura() {
  INTRO.veu = true;
  if (AU.ctx && AU.on) soundAir(2.4, 0.09, 420, 160, 0, 'lowpass', 0.5, 0.9);
  await FUMACA.cobre(1.2);
  const fim = new Promise(res => { INTRO.depois = res; });
  INTRO.clips = [{ src: 'assets/videos/abertura-narrada.mp4', rate: 1 }];
  INTRO.index = -1; INTRO.active = true;
  G.state = 'intro';
  musicSet(null); // a trilha já está no vídeo
  $('#title').hidden = true;
  $('#intro').hidden = false;
  nextIntroClip();
  // espera o vídeo aparecer, sem prender a abertura se ele demorar
  const video = $('#introVideo'), t0 = performance.now();
  await new Promise(res => { const v = () => (!INTRO.active || !video.paused && video.currentTime > 0 || performance.now() - t0 > 1500) ? res() : setTimeout(v, 40); v(); });
  INTRO.veu = false;
  FUMACA.abre(1.4);
  return fim;
}

function nextIntroClip() {
  if (!INTRO.active) return;
  INTRO.index++;
  if (INTRO.index >= INTRO.clips.length) { finishIntro(); return; }
  const video = $('#introVideo');
  const clip = INTRO.clips[INTRO.index];
  video.src = clip.src;
  video.muted = !AU.on; video.volume = musicVol();
  video.load();
  video.defaultPlaybackRate = clip.rate;
  video.playbackRate = clip.rate;
  playIntroClip();
}

function playIntroClip() {
  if (!INTRO.active) return;
  const attempt = ++INTRO.attempt, video = $('#introVideo');
  $('#introStatus').hidden = false;
  video.play().catch(error => {
    if (!INTRO.active || attempt !== INTRO.attempt) return;
    if (error.name === 'AbortError') return;
    // sem permissão para tocar com som: tenta mudo; se nem assim der, segue adiante
    if (error.name === 'NotAllowedError' && !video.muted) { video.muted = true; playIntroClip(); }
    else nextIntroClip();
  });
}

function introTick() {
  if (I.pressed.pause || I.pressed.dodge) finishIntro();
}

function finishIntro() {
  if (!INTRO.active) return;
  INTRO.active = false;
  INTRO.attempt++;
  const video = $('#introVideo');
  video.pause();
  video.removeAttribute('src');
  video.load();
  $('#intro').hidden = true;
  if (INTRO.depois) { const depois = INTRO.depois; INTRO.depois = null; depois(); return; }
  G.state = 'title';
  musicSet('menu');
  const title = $('#title');
  title.hidden = false;
  title.querySelector('button:not([hidden])').focus({ preventScroll: true });
}
