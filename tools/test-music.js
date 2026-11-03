'use strict';
// Execute: node --test tools/test-music.js
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = readFileSync(path.join(root, 'js/core.js'), 'utf8');
const audioCode = source.slice(source.indexOf('// ---------- Áudio'), source.indexOf('// ---------- Save'));
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

function audio(savedSound = '1') {
  const music = {
    src: '', paused: true, muted: false, currentTime: 0, playCount: 0, loadCount: 0,
    play() { this.playCount++; this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; },
    load() { this.loadCount++; this.currentTime = 0; },
    removeAttribute(name) { if (name === 'src') this.src = ''; },
  };
  const video = { muted: false };
  const saved = { 'terra-som': savedSound };
  const sandbox = vm.createContext({
    document: { getElementById: id => id === 'music' ? music : video },
    localStorage: { getItem: key => saved[key], setItem: (key, value) => { saved[key] = value; } },
    window: { AudioContext: class {
      constructor() { this.state = 'running'; this.destination = {}; }
      createGain() { return { gain: { value: 0 }, connect() {} }; }
    } },
  });
  vm.runInContext(audioCode, sandbox);
  return { ...vm.runInContext('({ AU, MUSIC_TRACKS, musicSet, musicTick, setSound, audioInit })', sandbox), music, video, saved };
}

test('as quatro músicas existem e são escolhidas conforme o momento do jogo', async () => {
  const { MUSIC_TRACKS, musicSet, music, AU } = audio();
  for (const file of Object.values(MUSIC_TRACKS)) assert.ok(existsSync(path.join(root, file)), file);
  for (const [scene, track] of [['menu', 'menu'], ['prologo', 'theme'], ['gruta', 'theme'], ['boss', 'boss'], ['victory', 'victory']]) {
    musicSet(scene); await flush();
    assert.equal(AU.track, track);
    assert.equal(music.src, MUSIC_TRACKS[track]);
    assert.equal(music.paused, false);
    assert.equal(music.loop, true);
  }
});

test('mudar de bioma não reinicia a música tema', async () => {
  const { musicSet, musicTick, music } = audio();
  musicSet('amazonia'); await flush();
  music.currentTime = 42;
  for (const biome of ['cerrado', 'pantanal', 'caatinga', 'mata', 'coracao', 'gruta']) {
    musicSet(biome); musicTick();
  }
  assert.equal(music.currentTime, 42);
  assert.equal(music.loadCount, 1);
  assert.equal(music.playCount, 1);
});

test('a transição menu → exploração → luta → vitória → exploração troca uma única faixa', async () => {
  const { musicSet, music, AU } = audio();
  for (const track of ['menu', 'theme', 'boss', 'victory', 'theme']) {
    music.currentTime = 17;
    musicSet(track); await flush();
    assert.equal(AU.track, track);
    assert.equal(music.currentTime, 0);
  }
  assert.equal(music.playCount, 5);
  assert.equal(music.loadCount, 5);
  musicSet(null);
  assert.equal(music.paused, true);
  assert.equal(music.src, '');
});

test('a opção Som pausa e retoma a trilha e controla os efeitos e vídeos', async () => {
  const { musicSet, setSound, audioInit, music, video, AU, saved } = audio();
  audioInit(); musicSet('boss'); await flush();
  music.currentTime = 23;
  setSound(false);
  assert.equal(music.muted, true);
  assert.equal(music.paused, true);
  assert.equal(video.muted, true);
  assert.equal(AU.master.gain.value, 0);
  assert.equal(saved['terra-som'], '0');
  setSound(true); await flush();
  assert.equal(music.muted, false);
  assert.equal(music.paused, false);
  assert.equal(music.currentTime, 23);
  assert.equal(video.muted, false);
  assert.equal(AU.master.gain.value, 0.55);
  assert.equal(saved['terra-som'], '1');
});

test('respeita a preferência de som desligado ao carregar e trocar de cena', async () => {
  const { musicSet, musicTick, music, setSound } = audio('0');
  musicSet('menu'); musicTick(); musicSet('boss');
  assert.equal(music.muted, true);
  assert.equal(music.playCount, 0);
  setSound(true); await flush();
  assert.equal(music.paused, false);
  assert.ok(music.src.endsWith('batalha-boss.mp3'));
});

test('aguarda um gesto quando o navegador bloqueia áudio, sem repetir a tentativa a cada frame', async () => {
  const { musicSet, musicTick, audioInit, music, AU } = audio();
  const play = music.play;
  music.play = function () { this.playCount++; return Promise.reject(new Error('NotAllowedError')); };
  musicSet('menu'); await flush();
  for (let i = 0; i < 120; i++) musicTick();
  assert.equal(music.playCount, 1);
  assert.equal(AU.musicBlocked, true);
  music.play = play;
  audioInit(); await flush();
  assert.equal(music.playCount, 2);
  assert.equal(music.paused, false);
  assert.equal(AU.musicBlocked, false);
});

test('uma tentativa antiga de reprodução não bloqueia a faixa da cena seguinte', async () => {
  const { musicSet, music, AU } = audio();
  let rejectOld;
  const play = music.play;
  music.play = () => new Promise((resolve, reject) => { rejectOld = reject; });
  musicSet('menu');
  music.play = play;
  musicSet('boss'); await flush();
  rejectOld(new Error('AbortError')); await flush();
  assert.equal(AU.track, 'boss');
  assert.equal(AU.musicBlocked, false);
  assert.equal(AU.musicPending, false);
  assert.equal(music.paused, false);
});
