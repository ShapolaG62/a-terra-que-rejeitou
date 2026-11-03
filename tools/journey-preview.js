'use strict';
// Carregado somente pelo iframe da ferramenta. O index normal não inclui este arquivo.
const JOURNEY_PREVIEW = JSON.parse(document.getElementById('journeyPreviewConfig').textContent);
const PREVIEW_ORIGIN = new URL(document.baseURI).origin;
const previewPost = (type, data) => parent.postMessage({ journeyPreview: type, ...data }, PREVIEW_ORIGIN);
writeSave = () => previewPost('save', { save: JSON.parse(JSON.stringify(G.save)) });
clearSave = () => {};
loadSave = () => null;
setupIntro = () => { INTRO.active = false; $('#intro').hidden = true; G.state = 'title'; };
addEventListener('error', e => previewPost('error', { text: e.message + ' · ' + e.filename + ':' + e.lineno }));
addEventListener('unhandledrejection', e => previewPost('error', { text: String(e.reason && (e.reason.stack || e.reason)) }));
addEventListener('message', e => {
  if (e.source !== parent || e.origin !== PREVIEW_ORIGIN) return;
  if (e.data.journeyPreview === 'advance' && DQ && !DQ.choices) {
    DQ.typing = false; DQ.n = DQ.full.length; dTxt.textContent = DQ.full; advanceDialog();
  }
  if (e.data.journeyPreview === 'interact' && G.interact && !G.lock && !UI.dialog && !UI.menu) { audioInit(); G.interact.fn(); }
  if (e.data.journeyPreview === 'skip-travel' && G.state === 'scene') $('#stage').dispatchEvent(new Event('pointerdown'));
  if (e.data.journeyPreview === 'immortal') JOURNEY_PREVIEW.immortal = e.data.value;
});
addEventListener('DOMContentLoaded', () => {
  const mode = JOURNEY_PREVIEW.mode, s = JOURNEY_PREVIEW.save || newSave();
  const [regionalAction, regionalId] = mode.split('-'), regional = COMPANIONS[regionalId];
  const [travelFrom, travelTo] = (JOURNEY_PREVIEW.route || 'amazonia:cerrado').split(':');
  if (!JOURNEY_PREVIEW.save) {
    s.act = mode === 'prologo' ? 0 : 1;
    if (s.act) { s.forms.push('zarabatana'); s.form = 'zarabatana'; s.seen.prol = 1; s.journey = { metDavi: true }; }
    if (mode === 'bridge') s.journey.metLia = true;
    if (['camp','shelter','boss','decision','spare','purify'].includes(mode)) Object.assign(s.journey, { metLia: true, bridgeHelped: true });
    if (['shelter','boss','decision','spare','purify'].includes(mode)) {
      Object.assign(s.journey, { campShared: true, campChoice: JOURNEY_PREVIEW.campChoice });
      s.items.push('no_da_margem'); s.lit.a1 = 1;
    }
    if (['boss','decision','spare','purify'].includes(mode)) s.journey.witnessedShelter = true;
    if (mode === 'spare' || mode === 'purify') { s.harmony.mapinguari = mode === 'spare' ? 'poupar' : 'purificar'; s.frag = mode === 'purify' ? 1 : 0; }
    if (regional || mode === 'travel') {
      const id = regional ? regionalId : travelFrom;
      s.act = id === 'gruta' ? 2 : ACTS.indexOf(id); s.sub = id === 'gruta' ? 'gruta' : null;
      s.forms = ['espirito', ...FORM_ORDER.slice(0, s.act)];
      s.form = regional ? regional.form : s.forms.at(-1);
      s.journey = { metDavi: true, metLia: true, bridgeHelped: true, campShared: true, returned: true, regions: {} };
      if (regional) {
        const r = s.journey.regions[id] = { met: regionalAction !== 'meet' };
        if (regionalAction === 'camp' || regionalAction === 'return') r.helped = true;
        if (regionalAction === 'return' && regional.exitX) { r.shared = true; r.choice = regional.choices[0].key; s.harmony[regional.boss] = JOURNEY_PREVIEW.outcome; s.frag = JOURNEY_PREVIEW.outcome === 'purificar' ? 1 : 0; s.items.push(regional.item); }
        s.lit[{ cerrado: 'c1', pantanal: 'p1', caatinga: 'k1', mata: 'm1' }[id]] = 1;
      }
      if (mode === 'travel') {
        s.ev.grutaIn = 1;
        for (const [key, c] of Object.entries(COMPANIONS)) if (c.act <= s.act) s.journey.regions[key] = { met: true, helped: true, shared: true, returned: true, choice: c.choices[0].key };
      }
    }
  }
  G.save = s;
  const lvl = regional ? regionalId : mode === 'travel' ? travelFrom : JOURNEY_PREVIEW.save ? homeLevel(s.act) : s.act === 0 ? 'prologo' : 'amazonia';
  loadLevel(lvl); G.flags = {};
  const x = JOURNEY_PREVIEW.save ? (s.fire && s.fire.lvl === lvl ? s.fire.x : 30) : regional ? (regionalAction === 'meet' ? regional.meetX + 1 : regionalAction === 'task' ? regional.taskX - 5 : regional.camp - 4) : mode === 'travel' ? (COMPANIONS[lvl] ? COMPANIONS[lvl].camp : lvl === 'amazonia' ? 440 : 280) : ({ prologo: 40, amazonia: 260, bridge: 319, camp: 437, shelter: 606, boss: 2005, decision: 2040, spare: 440, purify: 440 }[mode] || 30);
  G.P = makePlayer(x, groundY(x)); G.P.form = s.form; G.P.onG = true;
  G.cam.x = clamp(x - W / 2, 0, G.lvl.w - W); G.state = 'play';
  $('#title').hidden = true; $('#intro').hidden = true; $('#hud').hidden = false; $('#fade').classList.remove('on');
  $('#stage').tabIndex = 0;
  for (const t of G.lvl.triggers) if (t.x < x - 10 || mode === 'travel') t.done = true;
  updateHudForm(); hud.cache = {};
  if (mode === 'travel') scene(() => travelFrom === 'cerrado' && travelTo === 'gruta' ? enterGruta() : nextAct());
  else if (mode === 'boss') startBoss();
  else if (mode === 'decision') {
    G.boss = makeBoss('mapinguari', G.lvl.arena.x0 + AW - 65);
    G.boss.st = 'down'; G.boss.hp = 0; G.lvl.arena.active = true;
    scene(() => STORY.bossDown(G.boss));
  } else if (G.lvl.onStart) scene(G.lvl.onStart);
  const normalHurt = hurtPlayer;
  hurtPlayer = (...args) => JOURNEY_PREVIEW.immortal ? false : normalHurt(...args);
  const normalDie = die;
  die = () => {
    if (!JOURNEY_PREVIEW.immortal) return normalDie();
    G.P.hp = statMax().hp; G.P.breath = 100; G.heat = 0;
  };
  setInterval(() => {
    if (!G.P) return;
    const j = journeyState(), choice = { memory: 'lembrança do guardião', fear: 'medo compartilhado', silence: 'silêncio junto ao fogo' }[j.campChoice] || 'ainda não conversaram';
    const c = COMPANIONS[G.lvl.id], r = c && companionState(G.lvl.id);
    const details = c ? `${c.who} · Gesto: ${r.helped ? 'concluído' : 'por fazer'} · Conversa: ${r.shared ? 'lembrada' : 'por conhecer'} · Reencontro: ${r.returned ? 'concluído' : 'ainda não'}` : G.lvl.id === 'amazonia' ? `Passarela: ${G.lvl.solids.some(s => s.kind === 'journeyBridge') ? 'pronta' : 'em reparo'} · Fogueira: ${choice}` : G.lvl.cave ? 'Exploração da gruta' : G.lvl.id === 'prologo' ? 'Encontro com Davi' : 'O coração da mata';
    previewPost('status', { text: `${G.lvl.name} · x ${Math.round(G.P.x)} · ${details} · Cena: ${G.state === 'scene' ? 'viagem' : G.arriving ? 'chegada contínua' : G.lock ? 'em andamento' : 'livre'}${G.boss ? ' · Guardião: ' + G.boss.st : ''}` });
  }, 350);
});
