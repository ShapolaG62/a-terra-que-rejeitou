'use strict';
// Os dois vídeos são exibidos em sequência antes do menu principal.
const INTRO = {
  clips: ['assets/videos/intro-1.mp4', 'assets/videos/intro-2.mp4'],
  index: -1, active: false, waiting: false, attempt: 0,
};

function setupIntro() {
  const video = $('#introVideo');
  INTRO.active = true;
  G.state = 'intro';
  $('#title').hidden = true;
  $('#intro').hidden = false;
  const start = () => { audioInit(); if (INTRO.index < 0) nextIntroClip(); else playIntroClip(); };
  $('#bIntroPlay').onclick = start;
  $('#bIntroSkip').onclick = () => { audioInit(); finishIntro(); };
  video.addEventListener('ended', () => { if (video.ended) nextIntroClip(); });
  video.addEventListener('error', () => { if (video.error) nextIntroClip(); });
  video.addEventListener('playing', () => {
    if (!INTRO.active) return;
    INTRO.waiting = false;
    $('#introStart').hidden = true;
    $('#introStatus').hidden = true;
  });
  video.addEventListener('waiting', () => {
    if (INTRO.active && !INTRO.waiting) $('#introStatus').hidden = false;
  });
  // A arte e o botão aparecem antes de qualquer vídeo ou tentativa de autoplay.
  INTRO.waiting = true;
  $('#introStart').hidden = false;
  $('#introStatus').hidden = true;
}

function nextIntroClip() {
  if (!INTRO.active) return;
  INTRO.index++;
  if (INTRO.index >= INTRO.clips.length) { finishIntro(); return; }
  const video = $('#introVideo');
  video.src = INTRO.clips[INTRO.index];
  video.muted = !AU.on; video.volume = musicVol();
  video.load();
  video.defaultPlaybackRate = 1.5;
  video.playbackRate = 1.5;
  playIntroClip();
}

function playIntroClip() {
  if (!INTRO.active) return;
  const attempt = ++INTRO.attempt;
  INTRO.waiting = false;
  $('#introStart').hidden = true;
  $('#introStatus').hidden = false;
  // Se o navegador exigir um gesto para liberar o áudio, oferece o botão de início.
  $('#introVideo').play().catch(error => {
    if (!INTRO.active || attempt !== INTRO.attempt) return;
    if (error.name === 'NotAllowedError') {
      INTRO.waiting = true;
      $('#introStatus').hidden = true;
      $('#introStart').hidden = false;
      $('#bIntroPlay').focus({ preventScroll: true });
    } else if (error.name !== 'AbortError') nextIntroClip();
  });
}

function introTick() {
  if (I.pressed.pause || I.pressed.dodge) finishIntro();
  else if (INTRO.waiting && I.pressed.confirm) { audioInit(); if (INTRO.index < 0) nextIntroClip(); else playIntroClip(); }
}

function finishIntro() {
  if (!INTRO.active) return;
  INTRO.active = false;
  INTRO.waiting = false;
  INTRO.attempt++;
  const video = $('#introVideo');
  video.pause();
  video.removeAttribute('src');
  video.load();
  $('#intro').hidden = true;
  G.state = 'title';
  musicSet('menu');
  const title = $('#title');
  title.hidden = false;
  title.querySelector('button:not([hidden])').focus({ preventScroll: true });
}
