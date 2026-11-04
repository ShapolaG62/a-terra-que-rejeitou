'use strict';
// Somente a prévia carrega este arquivo; nenhum progresso do jogo é lido ou gravado.
const MOB_PREVIEW = JSON.parse(document.getElementById('mobPreviewConfig').textContent);
const MOB_ORIGIN = new URL(document.baseURI).origin;
const MOB_LABELS = { tatu:'Tatu', capivara:'Capivara', lobo:'Lobo-guará', jaguatirica:'Jaguatirica', tamandua:'Tamanduá', queixada:'Queixada', cobra:'Cobra', urubu:'Urubu', lacraia:'Lacraia', morcego:'Morcego', sapo:'Sapo-pedra', besouro:'Besouro de cristal', wolf:'Lobo do prólogo', crawler:'Sombra rastejante', flyer:'Sombra alada', spitter:'Sombra cuspidora', brute:'Sombra bruta', lanceiro:'Lanceiro', boitata:'Boitatá', 'boss-lobo':'Guardião lobo' };
const mobPost = (type, data) => parent.postMessage({ mobPreview: type, ...data }, MOB_ORIGIN);
const mobBossKind = () => MOB_PREVIEW.type === 'boitata' ? 'boitata' : MOB_PREVIEW.type === 'boss-lobo' ? 'lobo' : null;
const mobAppearance = () => MOB_PREVIEW.encounter === 'appearance';
writeSave = () => {}; clearSave = () => {}; loadSave = () => null;
setupIntro = () => { INTRO.active = false; $('#intro').hidden = true; G.state = 'title'; };
addEventListener('error', e => mobPost('error', { text: e.message + ' · ' + e.filename + ':' + e.lineno }));
addEventListener('unhandledrejection', e => mobPost('error', { text: String(e.reason && (e.reason.stack || e.reason)) }));
let mobsPaused = false, buildMobPreview;
addEventListener('message', e => {
  if (e.source !== parent || e.origin !== MOB_ORIGIN) return;
  if (e.data.mobPreview === 'reset' && buildMobPreview) { Object.assign(MOB_PREVIEW, e.data.config); mobsPaused = false; audioInit(); buildMobPreview(); }
  if (e.data.mobPreview === 'pause') mobsPaused = !!e.data.value;
  if (e.data.mobPreview === 'immortal') MOB_PREVIEW.immortal = !!e.data.value;
});

function drawMobAppearance() {
  const name = MOB_LABELS[MOB_PREVIEW.type] || MOB_PREVIEW.type, boss = G.boss, enemy = G.ents[0];
  ctx.save();
  try {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1014'); bg.addColorStop(0.75, '#182024'); bg.addColorStop(1, '#0c1114');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    rect(ctx, 24, H - 31, W - 48, 1, '#46504b'); rect(ctx, 24, H - 30, W - 48, 13, '#151b1d');
    drawPx(name.toUpperCase(), W / 2, 17, { align:'center', sp:2, col:'#e9dfc5', col2:'#827d6c' });
    drawPx('APARÊNCIA', W / 2, 35, { align:'center', sp:1, col:'#87978b' });
    const scale = boss ? boss.kind === 'boitata' ? 1.1 : 3 : 3;
    const anchorX = boss ? boss.x : enemy.x + enemy.w / 2, anchorY = boss ? GY : enemy.y + enemy.h;
    const center = boss && boss.kind === 'boitata' ? W * 0.44 : W / 2;
    ctx.globalAlpha = 0.55; ell(ctx, W / 2, H - 34, boss && boss.kind === 'boitata' ? 92 : 48, 5, '#060809'); ctx.globalAlpha = 1;
    ctx.translate(center - anchorX * scale, H - 34 - anchorY * scale); ctx.scale(scale, scale);
    if (boss) drawBoss(boss);
    else if (enemy) drawEnemy(ctx, enemy, enemy.x + enemy.w / 2, enemy.y + enemy.h, enemy.t, EYE[G.lvl.biome] || '#ff5a3a');
  } finally { ctx.restore(); }
}

addEventListener('DOMContentLoaded', () => {
  G.exploring = false;
  buildMobPreview = () => {
    closeDialog(); G.save = newSave(); G.save.act = 2; G.save.forms = ['espirito', ...FORM_ORDER]; G.save.form = 'arco';
    const kind = mobBossKind(), cave = MOB_PREVIEW.biome === 'gruta' || kind === 'boitata';
    G.lvl = LV({ id:'mobs-preview', w:1100, start:135, biome:cave ? 'gruta' : MOB_PREVIEW.biome, act:2, cave, name:'Fauna viva' }).g(0, 1100).f(88, 'preview-fire').f(640, 'preview-far');
    if (kind) G.lvl.ar(0, kind);
    if (cave) G.lvl.light(320, 26, 42); else G.lvl.can(190, 70, 2).can(520, 64, 3);
    G.save.lit['preview-fire'] = G.save.lit['preview-far'] = 1;
    if (!cave) prepareTrees(G.lvl);
    G.flags = {}; G.cam = { x:0, y:-DY, shake:0 }; G.auto = 0; G.camTarget = null; G.lock = 0;
    G.P = makePlayer(kind ? 80 : 135, GY); G.P.form = 'arco'; G.P.onG = true;
    G.ents = []; G.projs = []; G.parts = []; G.bfx = []; G.fx = []; G.hazards = []; G.boss = null;
    G.grace = 0; G.heat = 0; G.heatMul = 1; G.dynShade = []; G.dark = 0; G.trans = null; G.cavePassage = null; G.torchOut = 0; G.noises = [];
    G.hitstop = 0; G.flash = 0; G.interact = null; G.sceneDraw = null; G.rain = 0;
    if (kind) {
      G.lvl.arena.active = true;
      G.boss = makeBoss(kind, 310); G.boss.st = 'idle'; G.boss.tt = 1.2; G.boss.f = -1; G.boss.onGround = true;
      // Inicializa a continuidade do corpo pelo próprio modelo do guardião.
      if (kind === 'boitata') BOSSES.boitata.update(G.boss, 0);
    } else {
      const count = MOB_PREVIEW.encounter === 'group' ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const x = MOB_PREVIEW.encounter === 'patrol' ? 365 : count === 1 ? 245 : 205 + i * 60;
        const enemy = makeEnemy(MOB_PREVIEW.type, x, ['urubu','morcego','flyer'].includes(MOB_PREVIEW.type) ? 40 : null);
        enemy.f = -1; enemy.onG = !ET[enemy.type].fly; G.ents.push(enemy);
      }
    }
    G.state = 'play'; $('#title').hidden = true; $('#intro').hidden = true; $('#hud').hidden = mobAppearance(); $('#bossbar').hidden = mobAppearance() || !kind; $('#fade').classList.remove('on');
    $('#stage').tabIndex = 0; hud.cache = {}; updateHudForm(); musicSet(cave ? 'gruta' : MOB_PREVIEW.biome);
  };
  const normalUpdate = update, normalRenderWorld = renderWorld, normalHud = drawHudCanvas;
  update = dt => {
    if (mobsPaused) return;
    if (mobAppearance()) {
      G.t += dt;
      if (G.boss) G.boss.t += dt;
      for (const e of G.ents) e.t += dt;
      return;
    }
    normalUpdate(dt);
  };
  renderWorld = () => mobAppearance() ? drawMobAppearance() : normalRenderWorld();
  drawHudCanvas = () => { if (!mobAppearance()) normalHud(); };
  const normalHurt = hurtPlayer;
  hurtPlayer = (...args) => MOB_PREVIEW.immortal ? false : normalHurt(...args);
  const normalDie = die;
  die = () => { if (!MOB_PREVIEW.immortal) return normalDie(); G.P.hp = statMax().hp; G.P.breath = 100; G.heat = 0; };
  buildMobPreview();
  const names = { idle:'observando', move:'em movimento', alert:'em alerta', windup:'preparando', attack:'atacando', recover:'recuperando' };
  setInterval(() => {
    const label = MOB_LABELS[MOB_PREVIEW.type] || MOB_PREVIEW.type;
    const text = mobAppearance() ? label + ' · aparência' : G.boss ? label + ' · guardião em combate' : G.ents.filter(e => e.hp > 0).map(e => label + ': ' + (names[e.motion && e.motion.phase] || e.mode || 'patrulhando')).join(' · ') || 'Encontro concluído — use Reiniciar encontro';
    mobPost('status', { text:(mobsPaused ? 'Pausado · ' : '') + text });
  }, 200);
});
