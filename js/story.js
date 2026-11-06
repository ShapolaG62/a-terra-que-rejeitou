'use strict';
// História, fases, interface (diálogo, menus, HUD), fluxo dos atos e laço principal.

// ---------- Interface ----------
const UI = { dialog: false, menu: false, card: false };
let DQ = null;
const dEl = $('#dialog'), dWho = dEl.querySelector('.who'), dTxt = dEl.querySelector('.txt'), dCh = dEl.querySelector('.choices'), dNx = dEl.querySelector('.nx');
// quem ainda esperava uma resposta é liberado: nenhuma cena pode ficar parada para sempre
function liberaFala() { if (!DQ) return; const r = DQ.res, c = DQ.choices; DQ = null; r(c ? Math.max(0, c.findIndex(o => !o.disabled)) : undefined); }
function say(who, text) {
  liberaFala();
  convSpeaker(who);
  return new Promise(res => {
    UI.dialog = true; CONV.fundoOk = false; if (dEl.hidden) { dEl.hidden = false; layout(); }
    dWho.textContent = who && who !== 'Espírito' ? who : (who === 'Espírito' ? 'Espírito' : '');
    dTxt.classList.toggle('narr', !who || who === 'Espírito');
    dCh.innerHTML = ''; dNx.hidden = true;
    DQ = { res, full: text, n: 0, typing: true, choices: null, t0: G.rt };
  });
}
function choose(text, opts, who) {
  liberaFala();
  convSpeaker(who);
  return new Promise(res => {
    UI.dialog = true; CONV.fundoOk = false; if (dEl.hidden) { dEl.hidden = false; layout(); }
    dWho.textContent = who || ''; dTxt.classList.toggle('narr', !who); dTxt.textContent = text; dNx.hidden = true;
    dCh.innerHTML = '';
    DQ = { res, full: text, n: text.length, typing: false, choices: opts, sel: opts.findIndex(o => !o.disabled), t0: G.rt };
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.innerHTML = o.label + (o.sub ? `<small>${o.sub}</small>` : '');
      if (o.disabled) b.disabled = true;
      b.addEventListener('click', e => { e.stopPropagation(); pickChoice(i); });
      dCh.appendChild(b);
    });
    markChoice();
  });
}
function markChoice() { [...dCh.children].forEach((b, i) => b.classList.toggle('sel', i === DQ.sel)); }
function pickChoice(i) { if (!DQ || !DQ.choices || DQ.choices[i].disabled) return; const r = DQ.res; SFX.ui(); DQ = null; dCh.innerHTML = ''; r(i); }
function closeDialog() { DQ = null; UI.dialog = false; dEl.hidden = true; CONV.partner = null; CONV.fundoOk = false; }
// Conversa com NPC (ou guardião): os dois aparecem grandes, o espírito à esquerda e quem conversa à direita;
// quem está falando fica iluminado e mexe ao falar, o outro fica na sombra
const RETRATO = { 'Cecília': 'arqueira', 'Bento': 'canoeiro', 'Rosa': 'lanceira', 'Celina': 'ancia', 'Davi': 'cacador', 'Lia': 'mestraA', 'Nina': 'nina', 'Caçador': 'cacador', 'Mestra da zarabatana': 'mestraA', 'Mestra do arco': 'arqueira', 'Velho canoeiro': 'canoeiro', 'Lanceira da cabaça': 'lanceira', 'Anciã das sementes': 'ancia', 'Anciã': 'ancia' };
const RETRATO_BOSS = { 'Mapinguari': 'mapinguari', 'Capelobo': 'capelobo', 'Pai do Mato': 'paidomato', 'Labatut': 'labatut', 'Corpo-seco': 'corposeco' };
const CONV = { partner: null, who: null, t0: 0, tw: 0 };
const [convC, convX] = mk(90, 100);
const [convBC, convBX] = mk(300, 260);
const [fundoC, fundoX] = mk(W, H);
// quem não está falando fica na sombra: uma camada escura só sobre o desenho
function sombraRetrato(x, w, h) { x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.58; x.fillStyle = '#07050a'; x.fillRect(0, 0, w, h); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
function convSpeaker(who) {
  if (RETRATO[who] || (RETRATO_BOSS[who] && BOSSES[RETRATO_BOSS[who]])) { if (!CONV.partner) CONV.t0 = G.rt; if (CONV.partner !== who) CONV.partner = who; }
  if (CONV.who !== who) CONV.tw = G.rt;
  CONV.who = who;
}
function drawConversation() {
  const t = G.rt, a = clamp((t - CONV.t0) / 0.35, 0, 1), e = 1 - (1 - a) ** 3, partner = CONV.partner;
  const me = CONV.who === 'Espírito', them = CONV.who === partner, talking = DQ && DQ.typing && Math.sin(t * 18) > 0 ? 1 : 0;
  const base = L.portrait ? H - 4 : H - 6, lx = Math.round(W * 0.21 - (1 - e) * 140), rx = Math.round(W * 0.79 + (1 - e) * 140);
  // o cenário escurece, com uma faixa de luz no chão
  ctx.globalAlpha = 0.68 * e; rect(ctx, 0, 0, W, H, '#07050a'); ctx.globalAlpha = 1;
  const glow = (x, on) => { const sw = clamp((t - CONV.tw) / 0.25, 0, 1), k = on ? sw : 1 - sw * 0.4; if (!on && k <= 0.6) return; softGlow(ctx, x, base - 70, 90, 90, on ? '#f2c14e' : '#8a7ab0', e * (on ? k * 0.3 : 0.1)); };
  glow(lx, me); glow(rx, them);
  if (L.portrait) for (const x of [lx, rx]) { ctx.globalAlpha = 0.5 * e; ell(ctx, x, base, 34, 4, '#000'); ctx.globalAlpha = 1; }
  // Retratos em resolução fina, mantendo o tamanho e a posição da conversa.
  convX.clearRect(0, 0, 90, 100);
  drawHuman(convX, 45, 96 - (me ? talking : 0), 1, { kind: 'idle', t }, playerSpec(G.P.form));
  if (!me && them) sombraRetrato(convX, 90, 100);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = e; ctx.drawImage(convC, lx - 135, base - 288, 270, 300);
  // quem conversa: gente do povo ampliada 3×, guardião ampliado 2×
  const quieto = !them && me;
  if (RETRATO[partner]) {
    convX.clearRect(0, 0, 90, 100);
    convX.save(); convX.translate(45, 96 - (them ? talking : 0));
    const scale = partner === 'Nina' ? 0.76 : 1;
    convX.scale(scale, scale);
    drawHuman(convX, 0, 0, -1, { kind: 'idle', t }, NPC[RETRATO[partner]]);
    convX.restore();
    if (quieto) sombraRetrato(convX, 90, 100);
    ctx.drawImage(convC, rx - 135, base - 288, 270, 300);
  } else {
    // o guardião vai para uma tela própria; calado, ele só é redesenhado a cada três quadros
    if (!quieto || CONV.bossDe !== partner || (CONV.vez = (CONV.vez || 0) + 1) % 3 === 0) {
      const k = RETRATO_BOSS[partner], live = G.boss && G.boss.kind === k ? G.boss : null;
      const B = Object.assign({ kind: k, t, st: 'idle', mood: 'povo', hits: 0 }, live || {}, { x: 0, y: 0, f: -1, flash: 0 });
      const real = ctx, alpha = ctx.globalAlpha;
      convBX.clearRect(0, 0, 300, 260);
      ctx = convBX; ctx.save(); ctx.translate(150, 250 - (them ? talking * 2 : 0)); ctx.scale(2, 2);
      try { BOSSES[k].draw(B); } catch (err) {}
      ctx.restore(); ctx = real; ctx.globalAlpha = alpha;
      if (quieto) sombraRetrato(convBX, 300, 260);
      CONV.bossDe = partner;
    }
    ctx.drawImage(convBC, rx - 150, base - 250, 300, 260);
  }
  ctx.globalAlpha = 1;
}
async function talk(lines) { for (const [w, t] of lines) await say(w, t); closeDialog(); }
dEl.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; advanceDialog(); });
function advanceDialog() {
  if (!DQ || DQ.choices) return;
  if (DQ.typing) { DQ.n = DQ.full.length; return; }
  const r = DQ.res; DQ = null; r();
}
function dialogTick(dt) {
  if (!DQ) { closeDialog(); return; }
  if (G.rt - DQ.t0 < 0.2) for (const a of ['confirm', 'attack', 'interact']) I.pressed[a] = false;
  if (DQ.choices) {
    if (I.pressed.up || I.pressed.down) { const n = DQ.choices.length; let s = DQ.sel; do { s = (s + (I.pressed.down ? 1 : n - 1)) % n; } while (DQ.choices[s].disabled); DQ.sel = s; markChoice(); SFX.ui(); }
    if (I.pressed.confirm || I.pressed.attack || I.pressed.interact) pickChoice(DQ.sel);
    return;
  }
  if (DQ.typing) { const antes = Math.floor(DQ.n); DQ.n += dt * 60; if (DQ.n >= DQ.full.length) { DQ.n = DQ.full.length; DQ.typing = false; dNx.hidden = false; dTxt.textContent = DQ.full; } else if (Math.floor(DQ.n) !== antes || antes === 0) dTxt.textContent = DQ.full.slice(0, Math.floor(DQ.n)); }
  if (I.pressed.confirm || I.pressed.attack || I.pressed.interact) advanceDialog();
}
function wait(s) { return new Promise(res => G.waits.push({ t: s, res })); }
function waitUntil(fn, limite = 12) { const t0 = G.rt; return new Promise(res => G.waits.push({ fn: () => fn() || G.rt - t0 > limite, res })); }
async function scene(fn) {
  G.lock++; G.interact = null; $('#prompt').hidden = true;
  $('#touch [data-a="interact"]').classList.remove('ready');
  // só fecha o diálogo se ninguém estiver esperando resposta nele
  try { await fn(); } finally { G.lock = Math.max(0, G.lock - 1); if (!DQ) closeDialog(); }
}

let toastT = null;
function showToast(big, small, dur = 2.4) {
  const t = $('#toast'); t.querySelector('.big').textContent = big; t.querySelector('.sm').textContent = small || '';
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), dur * 1000);
}
let hintT = null;
function hint(keys, touch, dur = 5) {
  const h = $('#hint'); h.innerHTML = L.touch ? touch : keys; h.classList.add('on');
  clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('on'), dur * 1000);
}
function fade(on, white) { const f = $('#fade'); f.classList.toggle('white', !!white); f.classList.toggle('on', on); return wait(0.85); }
function showCard(k, t, s, l, minT = 0.8) {
  return new Promise(res => {
    const c = $('#card'); c.hidden = false; UI.card = { res, t0: G.rt + minT };
    c.querySelector('.k').textContent = k; c.querySelector('.t').textContent = t; c.querySelector('.s').textContent = s || ''; c.querySelector('.l').textContent = l || '';
  });
}
function cardTick() { if (UI.card && G.rt > UI.card.t0 && I.any) closeCard(); }
function closeCard() { const r = UI.card.res; UI.card = false; $('#card').hidden = true; SFX.ui(); r(); }
$('#card').addEventListener('pointerdown', () => { if (UI.card && G.rt > UI.card.t0) closeCard(); });

// Menus (fogueira, pausa, diário...)
const mEl = $('#menu'), mPanel = mEl.querySelector('.panel');
function menu(html) {
  return new Promise(res => {
    UI.menu = { res, sel: 0 }; mEl.hidden = false; mPanel.innerHTML = html; mPanel.scrollTop = 0;
    mPanel.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; SFX.ui(); closeMenu(b.dataset.act); }));
    navMark(mPanel, 0);
  });
}
function closeMenu(act) { const r = UI.menu.res; UI.menu = false; mEl.hidden = true; r(act); }
function navMark(root, i) { const bs = [...root.querySelectorAll('.btn:not([hidden])')]; bs.forEach((b, k) => b.classList.toggle('sel', k === i)); return bs; }
function navTick(root, state) {
  const bs = [...root.querySelectorAll('.btn:not([hidden])')]; if (!bs.length) return;
  const atual = bs[state.sel];
  if (atual && atual.classList && atual.classList.contains('slot') && (I.pressed.left || I.pressed.right || I.pressed.up || I.pressed.down)) {
    const slots = bs.filter(b => b.classList.contains('slot')), i = slots.indexOf(atual);
    const cols = Math.max(1, root.querySelector('.slots') ? getComputedStyle(root.querySelector('.slots')).gridTemplateColumns.split(' ').length : 1);
    let alvo = I.pressed.left ? slots[i - 1] : I.pressed.right ? slots[i + 1] : I.pressed.up ? slots[i - cols] : slots[i + cols];
    if (!alvo) alvo = I.pressed.up || I.pressed.left ? bs[(bs.indexOf(slots[0]) + bs.length - 1) % bs.length] : bs[bs.indexOf(slots[slots.length - 1]) + 1] || bs[0];
    state.sel = bs.indexOf(alvo); navMark(root, state.sel); SFX.ui(); return;
  }
  const vr = atual && atual.querySelector('input[data-vol]');
  if ((I.pressed.left || I.pressed.right) && vr) { const k = vr.dataset.vol; audioInit(); setVolume(k, AU[k] + (I.pressed.right ? 0.1 : -0.1)); (k === 'sfx' ? SFX.hit : SFX.ui)(); }
  if (I.pressed.up || I.pressed.down) { state.sel = (state.sel + (I.pressed.down ? 1 : bs.length - 1)) % bs.length; navMark(root, state.sel); bs[state.sel].scrollIntoView({ block: 'nearest' }); SFX.ui(); }
  if (I.pressed.confirm || I.pressed.attack || I.pressed.interact) { const b = bs[state.sel]; if (b && !b.disabled) b.click(); }
  if ((I.pressed.pause || I.pressed.inv) && UI.menu) { const back = root.querySelector('[data-act="back"]'); if (back) back.click(); }
}

// ---------- HUD ----------
const hud = { el: $('#hud'), boss: $('#bossbar'), cache: {} };
function setC(k, v, fn) { if (hud.cache[k] !== v) { hud.cache[k] = v; fn(v); } }
function updateHud() {
  const P = G.P; if (!P) return;
  const B = G.boss;
  setC('boss', B ? B.kind + (B.st === 'down') : '', () => { hud.boss.hidden = !B || B.st === 'down'; });
  const sw = $('#touch [data-a="swap"]');
  setC('swap', G.save.forms.length > 2 && G.lvl.biome === 'mata' && !G.flags.final, v => sw.hidden = !v);
}
function updateHudForm() { drawHudFace(); }
// rosto da forma atual no medalhão (desenha o corpo pequeno e recorta a cabeça)
const faceC = document.createElement('canvas'); faceC.width = 40; faceC.height = 64;
function drawHudFace() {
  const fc = $('#hudFace'), x = faceC.getContext('2d'); if (!fc || !G.P) return;
  x.clearRect(0, 0, 40, 64); drawHuman(x, 20, 62, 1, { kind: 'idle', t: 0 }, playerSpec(G.P.form));
  const d = x.getImageData(0, 0, 40, 64).data, op = (xx, y) => d[(y * 40 + xx) * 4 + 3] > 0; let y0 = 0;
  find: for (let y = 0; y < 64; y++) for (let xx = 0; xx < 40; xx++) if (op(xx, y)) { y0 = y; break find; }
  // centro do rosto: média das colunas ocupadas na altura da cabeça (pula enfeites altos como penas e cocar)
  let sx = 0, n = 0; for (let y = y0 + 4; y < y0 + 12; y++) for (let xx = 0; xx < 40; xx++) if (op(xx, y)) { sx += xx; n++; }
  const cx = n ? Math.round(sx / n) : 20;
  fc.width = fc.height = 18; const f = fc.getContext('2d'); f.clearRect(0, 0, 18, 18);
  f.drawImage(faceC, cx - 9, Math.max(0, y0 + 1), 18, 18, 0, 0, 18, 18);
}

// ---------- Ecos do Corpo-seco e notas ----------
function journalHTML() {
  const e = ECHO_ORDER.map(id => { const has = G.save.echoes.includes(id), E = ECHOES[id]; return `<div class="e ${has ? '' : 'no'}"><b>${has ? E.t : '???'}</b><span>${has ? E.x : 'Um eco ainda não encontrado.'}</span></div>`; }).join('');
  const n = NOTES.map(([t, x]) => `<div class="e"><b>${t}</b><span>${x}</span></div>`).join('');
  return `<h2>Diário</h2>${journeyJournalHTML()}<p>Ecos do Corpo-seco (${G.save.echoes.length}/6)</p><div class="journal">${e}</div>${caveJournalHTML()}<h2 style="margin-top:16px">Lenda e invenção</h2><div class="journal">${n}</div><div class="btns"><button class="btn" data-act="back">Voltar</button></div>`;
}
function keysHTML() {
  return `<h2>Controles</h2><div class="keys">
  <kbd>A D / ← →</kbd><span>andar</span><kbd>W / ↑ / Espaço</kbd><span>pular (segure para pular mais alto; ↓ + pular desce da plataforma)</span>
  <kbd>J / Z / clique esquerdo</kbd><span>golpe de perto (empurra o monstro)</span><kbd>K / X / clique direito</kbd><span>tiro à distância (mira sozinho no alvo mais perto, até nos voadores)</span><kbd>U / V</kbd><span>especial da forma</span><kbd>L / C / Shift</kbd><span>dash (fica invulnerável)</span>
  <kbd>F</kbd><span>beber da cabaça de memória (cura)</span><kbd>E</kbd><span>agir: conversar, descansar, lembrar</span>
  <kbd>Q</kbd><span>trocar de forma (Mata Atlântica)</span>
  <kbd>I / Tab</kbd><span>inventário (itens dos baús)</span><kbd>Esc / P</kbd><span>pausa</span></div>
  <p style="margin-top:10px">No celular use os botões na tela. Controle de videogame também funciona.</p>
  <div class="btns"><button class="btn" data-act="back">Voltar</button></div>`;
}
function statsHTML(fire) {
  const s = G.save, lv = s.vig + s.forc + s.fol, cost = 30 + lv * 15, can = s.mem >= cost;
  const row = (id, nome, desc, v) => `<button class="btn" data-act="${id}" ${can ? '' : 'disabled'}><span>${nome} <small>${desc}</small></span><small>nível ${v}</small></button>`;
  return `<h2>${fire ? 'Contar histórias' : 'Espírito'}</h2>
  <p>${fire ? 'Ao redor do fogo, as memórias viram força. Cada história contada custa ' + cost + ' memórias.' : 'O que você carrega.'}</p>
  <div class="stats"><span>Memórias</span><span class="v">◆ ${s.mem}</span><span>Vida</span><span class="v">${statMax().hp}</span><span>Fôlego</span><span class="v">${statMax().st}</span><span>Força</span><span class="v">×${dmgMul().toFixed(2)}</span><span>Cabaças</span><span class="v">${statMax().flasks}</span><span>Formas</span><span class="v">${s.forms.filter(f => f !== 'espirito').length}/5</span></div>
  ${fire ? `<div class="btns">${row('vig', 'Vigor', '+15 vida', s.vig)}${row('forc', 'Força', '+10% dano', s.forc)}${row('fol', 'Fôlego', '+12 fôlego', s.fol)}</div>` : ''}
  <div class="btns"><button class="btn" data-act="back">Voltar</button></div>`;
}
async function fireMenu() {
  for (;;) {
    const a = await menu(`<h2>Fogueira de histórias</h2><p>${pick(REST_LINES)} A vida e as cabaças voltam, e as sombras do esquecimento também.</p><div class="btns">
      <button class="btn" data-act="inv">Inventário <small>${(G.save.items || []).length} itens</small></button>
      <button class="btn" data-act="up">Contar histórias <small>◆ ${G.save.mem}</small></button>
      <button class="btn" data-act="j">Diário</button>
      <button class="btn" data-act="look">Visual do espírito <small>${VARIANTE_NOMES[varianteAtual()]}</small></button>
      ${G.save.cold ? '<button class="btn" data-act="go">Viajar <small>fogueiras já acesas</small></button>' : ''}
      <button class="btn" data-act="back">Seguir viagem</button></div>`);
    if (a === 'look') {
      const n = variantesLiberadas(), quando = ['', '', 'libera no Pantanal', 'libera na Mata Atlântica'];
      const b = await menu(`<h2>Visual do espírito</h2><p>O jeito com que o espírito veste as formas dos povos.</p><div class="btns">${VARIANTE_NOMES.map((nm, i) => `<button class="btn" data-act="v${i}" ${i < n ? '' : 'disabled'}>${nm} <small>${i < n ? (i === varianteAtual() ? 'em uso' : 'liberado') : quando[i]}</small></button>`).join('')}<button class="btn" data-act="back">Voltar</button></div>`);
      if (b && b[0] === 'v') { G.save.look = +b.slice(1); writeSave(); drawHudFace(); }
      continue;
    }
    if (a === 'go') { const to = await travelMenu(); if (to) { await travelTo(to); return; } continue; }
    if (a === 'up') {
      for (;;) {
        const b = await menu(statsHTML(true));
        if (b === 'back') break;
        const lv = G.save.vig + G.save.forc + G.save.fol, cost = 30 + lv * 15;
        if (G.save.mem >= cost) { G.save.mem -= cost; G.save[b]++; SFX.rest(); VFX.heal(G.P); G.P.hp = statMax().hp; G.P.st = statMax().st; writeSave(); }
      }
    } else if (a === 'j') await menu(journalHTML());
    else if (a === 'inv') await menu(inventoryHTML());
    else break;
  }
}
// tecla I / Tab (ou o botão ▤ no celular): abre o inventário com os itens dos baús
async function openInventory() { G.paused = true; await menu(inventoryHTML()); G.paused = false; }
// configuração de som: liga/desliga e os três volumes
async function soundMenu() {
  for (;;) {
    const a = await menu(`<h2>Som</h2><div class="btns">
      <button class="btn" data-act="m">Som <small>${AU.on ? 'ligado' : 'desligado'}</small></button>
      ${volHTML('vol', 'Volume geral')}${volHTML('mus', 'Música')}${volHTML('sfx', 'Efeitos e ambiente')}
      <button class="btn" data-act="back">Voltar</button></div><p class="hint">Efeitos e ambiente: golpes, passos, pulos, interações, vento, água e sons da mata.</p>`);
    if (a === 'm') { audioInit(); setSound(!AU.on); continue; }
    break;
  }
}
async function pauseMenu() {
  G.paused = true;
  for (;;) {
    const a = await menu(`<h2>Pausa</h2><p>${G.lvl.name}</p><div class="btns">
      <button class="btn" data-act="back">Continuar</button>
      <button class="btn" data-act="s">Espírito</button><button class="btn" data-act="itens">Inventário</button>
      <button class="btn" data-act="j">Diário <small>${G.save.echoes.length}/6 ecos</small></button>
      <button class="btn" data-act="conq">Conquistas</button>
      <button class="btn" data-act="est">Estatísticas <small>${CONQ.tempoTxt(G.save.tempo)}</small></button>
      <button class="btn" data-act="k">Controles</button>
      <button class="btn" data-act="explore">Exploração temporária <small>${G.exploring ? 'ligada' : 'sem dano · não salva'}</small></button>
      <button class="btn" data-act="som">Som <small>${AU.on ? 'ligado' : 'desligado'} · ${Math.round(AU.vol * 100)}%</small></button>
      <button class="btn" data-act="t">Voltar ao título</button></div>`);
    if (a === 'back') break;
    if (a === 'explore') { const era = G.exploring; if (!era) writeSave(); G.exploring = true; const foi = await explorationMenu(); if (foi) break; G.exploring = era; continue; }
    if (a === 'conq') await menu(CONQ.conquistasHTML());
    if (a === 'est') await menu(CONQ.estatisticasHTML(G.save));
    if (a === 's') await menu(statsHTML(false));
    if (a === 'itens') await menu(inventoryHTML());
    if (a === 'j') await menu(journalHTML());
    if (a === 'k') await menu(keysHTML());
    if (a === 'som') await soundMenu();
    if (a === 't') { writeSave(); location.reload(); return; }
  }
  G.paused = false;
}

// ---------- Fluxo dos atos ----------
const ACTS = ['prologo', 'amazonia', 'cerrado', 'pantanal', 'caatinga', 'mata', 'coracao'];
const CARDS = [
  ['Prólogo', 'O despertar', '', 'Um lugar onde ninguém mais conta a sua história.'],
  ['Ato I', 'Amazônia', 'O Mapinguari', 'Onde a floresta é tão alta que o céu chega aos pedaços.'],
  ['Ato II', 'Cerrado', 'O Capelobo', 'Onde o fogo é antigo e sabe queimar sem matar a raiz.'],
  ['Ato III', 'Pantanal', 'O Pai do Mato', 'Onde a água é chão por metade do ano.'],
  ['Ato IV', 'Caatinga', 'O Labatut', 'Onde o sol também é guardião.'],
  ['Ato V', 'Mata Atlântica', 'O Corpo-seco', 'A primeira a cair. Foi aqui que tudo começou.'],
  ['Final', 'O coração da mata', '', 'Abrir mão.'],
];
// A passagem dissolve o cenário no mesmo lugar; a chegada mantém o corpo em movimento.
const [transC] = mk(W, H);
function snapshotScene() { transC.getContext('2d').drawImage(cv, 0, 0); }
function captureTravelArrival(A, B, from, to, card, form) {
  // Não desenha o quadro sem personagem no canvas visível, nem por um único frame.
  const visible = ctx, offscreen = transC.getContext('2d');
  ctx = offscreen; offscreen.save();
  try {
    offscreen.imageSmoothingEnabled = false; offscreen.clearRect(0, 0, W, H); offscreen.translate(0, DY);
    drawTravel(1, VIAGEM_DUR, A, B, from, to, card, form, true);
  } finally { offscreen.restore(); ctx = visible; }
}
function startBlend(kind = 'scene', dur = 0.65) { G.trans = { t0: G.rt, dur, kind }; }
function drawTransition() {
  const transition = G.trans, k = clamp((G.rt - transition.t0) / transition.dur, 0, 1);
  if (k >= 1) { G.trans = null; return; }
  const e = k * k * (3 - 2 * k);
  ctx.globalAlpha = 1 - e; ctx.drawImage(transC, 0, 0); ctx.globalAlpha = 1;
  // A captura de chegada não contém o espírito: há um único corpo, já na fase jogável.
  if (transition.kind === 'arrival' && G.P) {
    ctx.save(); ctx.translate(-G.cam.x, DY); drawPlayer(G.P, G.t); ctx.restore();
  }
}
// ---------- Cutscene de viagem entre biomas ----------
// O espírito atravessa a paisagem correndo: o bioma de onde sai se dissolve no próximo (céu, fundo, chão e árvores),
// com faixas de cinema, letreiro do ato, partículas da região e a rota da jornada. Uns 6 s; pula depois do 1º segundo.
const ROTA = ['prologo', 'amazonia', 'cerrado', 'pantanal', 'caatinga', 'mata', 'coracao'];
const ROTA_NOME = { prologo: 'Prólogo', amazonia: 'Amazônia', cerrado: 'Cerrado', gruta: 'Gruta', pantanal: 'Pantanal', caatinga: 'Caatinga', mata: 'Mata Atlântica', coracao: 'Coração' };
// cor das partículas e direção (1 cai, -1 sobe, 0 flutua)
const VIAGEM_PART = { prologo: ['#8a8ab0', 0], amazonia: ['#c8f060', 0], cerrado: ['#ffb04a', -1], gruta: ['#8a7a6a', 1], pantanal: ['#f8d8e8', 0], caatinga: ['#e8d8b0', 0.4], mata: ['#9fe0d0', 1], coracao: ['#7af0e0', -1] };
async function travelScene(from, to, card) {
  const form = G.P ? G.P.form : 'espirito', dur = VIAGEM_DUR, t0 = G.rt, A = biome(from), B = biome(to);
  let skip = false; const onTap = () => { if (G.rt - t0 > 1) skip = true; };
  stage.addEventListener('pointerdown', onTap);
  $('#hud').hidden = true; closeDialog();
  G.state = 'scene';
  G.sceneDraw = () => drawTravel(Math.min(1, (G.rt - t0) / dur), G.rt - t0, A, B, from, to, card, form);
  await waitUntil(() => skip || G.rt - t0 > dur || (G.rt - t0 > 1 && (I.pressed.confirm || I.pressed.jump || I.pressed.pause || I.pressed.attack || I.pressed.interact)));
  stage.removeEventListener('pointerdown', onTap);
  const elapsed = Math.min(dur, G.rt - t0);
  if (elapsed < dur) {
    // Pular a viagem acelera o trecho final, chegando à paisagem de destino.
    const finishT = G.rt;
    G.sceneDraw = () => { const p = clamp((G.rt - finishT) / 0.3, 0, 1), t = lerp(elapsed, dur, 1 - (1 - p) ** 3); drawTravel(t / dur, t, A, B, from, to, card, form); };
    await wait(0.3);
  }
  // Captura exata do destino, sem personagem ou letreiros, para a dissolução estacionária.
  captureTravelArrival(A, B, from, to, card, form);
  G.sceneDraw = null;
  G.arrivalSeed = { to, form, ph: dur * VIAGEM_VEL * 0.22 };
}
// cenário da viagem: um trecho de mundo com as peças do jogo (chão, copas, troncos, cipós, samambaias, tronco caído);
// até Xb é o bioma de saída, depois o de chegada. Gerado uma vez por par de biomas.
const VIAGEM_VEL = 78, VIAGEM_DUR = 7, VIAGEM_PX = Math.round(W * 0.4);
const TRAVEL_CACHE = {};
function travelWorld(from, to) {
  const key = from + '>' + to; if (TRAVEL_CACHE[key]) return TRAVEL_CACHE[key];
  const Xb = Math.round(VIAGEM_DUR * VIAGEM_VEL * 0.42 + VIAGEM_PX), end = VIAGEM_DUR * VIAGEM_VEL + W + 120;
  const r = seeded(ROTA.indexOf(from) * 31 + ROTA.indexOf(to) * 7 + 3), bio = x => x < Xb ? from : to;
  const trees = [], vines = [], ferns = [], hopX = Math.round(VIAGEM_PX + VIAGEM_DUR * VIAGEM_VEL * 0.2);
  for (let x = -20; x < end; x += 90 + r() * 60) {
    if (Math.abs(x - Xb) < 46 || Math.abs(x - hopX) < 30) continue;
    const w = 56 + 10 * (r() * 5 | 0), b = bio(x);
    trees.push({ x: Math.round(x - w / 2), w, y: r() * 22 | 0, vines: 2 + (r() * 3 | 0), b, tx: Math.round(x), tw: clamp(Math.round(w * 0.17), 8, 14) });
  }
  for (let x = 60; x < end; x += 110 + r() * 110) if (Math.abs(x - Xb) > 40 && r() < 0.55) vines.push({ x: Math.round(x), b: bio(x) });
  for (let x = 6; x < end; x += 16 + r() * 26) ferns.push({ x: Math.round(x), b: bio(x), s: 0.6 + r() * 0.7, seed: r() * 1e4 | 0, front: r() < 0.25 });
  return (TRAVEL_CACHE[key] = { Xb, trees, vines, ferns, hopX, bio });
}
// teto de pedra da gruta (dentes de rocha e raízes penduradas) entre x0 e x1, aparecendo na boca da caverna
function caveCeiling(x0, x1, mouth, dir, t) {
  const P = tpal('gruta'), top = -DY;
  for (let x = Math.floor(x0 / 2) * 2; x < x1; x += 2) {
    const d = dir > 0 ? x - mouth : mouth - x; if (d < -30) continue;
    const ramp = clamp((d + 30) / 70, 0, 1), h = Math.round((DY + 10 + hash(x >> 2) * 18 + (hash(x >> 4) < 0.3 ? hash(x) * 30 : 0)) * ramp);
    if (h <= 0) continue;
    rect(ctx, x, top, 2, h, P.stone[2]); rect(ctx, x, top + h - 3, 2, 3, P.out); if (hash(x * 3) < 0.25) rect(ctx, x, top + h - 6, 1, 2, P.stone[1]);
    if (ramp > 0.9 && hash(x * 7) < 0.05) { const len = 12 + hash(x * 11) * 34; vineStrand(x, top + h - 2, len, P, t, x, true); }
  }
}
function drawTravel(k, tt, A, B, from, to, card, form, hideHero = false) {
  const V = travelWorld(from, to), cam = tt * VIAGEM_VEL, top = -DY, bot = H - DY;
  const heroX = cam + VIAGEM_PX, e0 = clamp((heroX - (V.Xb - 70)) / 140, 0, 1), e = e0 * e0 * (3 - 2 * e0);
  // fundo: o céu e as camadas do bioma de saída cedem para o de chegada quando o espírito cruza a fronteira
  drawBackground(A, cam, tt);
  if (e > 0) { ctx.globalAlpha = e; drawBackground(B, cam, tt); ctx.globalAlpha = 1; }
  ctx.save(); ctx.translate(-cam, 0);
  const vis = x => x > cam - 120 && x < cam + W + 120;
  // troncos e copas (na gruta, o teto de pedra faz o papel das árvores)
  for (const cn of V.trees) if (vis(cn.tx) && cn.b !== 'gruta') { const h = GY - (24 + cn.y); ctx.globalAlpha = 0.92; ctx.drawImage(trunkPiece(cn.b, cn.tw, h, cn.x), cn.tx - 15 - Math.floor(cn.tw / 2), 24 + cn.y); ctx.globalAlpha = 1; }
  for (const cn of V.trees) if (vis(cn.tx) && cn.b !== 'gruta') drawCanopy(cn, cn.b, tt);
  for (const o of V.vines) if (vis(o.x) && o.b !== 'gruta') { ctx.globalAlpha = 0.92; ctx.drawImage(trunkPiece(o.b, 6, GY - 10, o.x + 7), o.x - 18, 10); ctx.globalAlpha = 1; drawHangingVines(o, o.b, tt); }
  if (from === 'gruta' || to === 'gruta') caveCeiling(cam - 4, cam + W + 4, V.Xb, to === 'gruta' ? 1 : -1, tt);
  // chão com os ladrilhos do jogo: musgo, terra, pedras e capim
  for (let tx = Math.floor(cam / TILE) * TILE; tx < cam + W + TILE; tx += TILE) {
    const b = V.bio(tx), P = tpal(b);
    ctx.drawImage(groundTile(b, hash((tx / TILE | 0) * 17 + 3) < 0.22), tx, GY);
    rect(ctx, tx, GY + TILE, TILE, bot - GY - TILE, P.deep);
  }
  for (let x = cam - (cam % 3); x < cam + W; x += 3) { const b = V.bio(x), P = tpal(b), bg = biome(b), h2 = 1 + (hash(x) * 4 | 0); rect(ctx, x, GY - h2, 1, h2, hash(x + 7) > 0.7 && bg.grass ? bg.grass : P.moss[hash(x + 3) > 0.4 ? 2 : 1]); }
  for (const f of V.ferns) if (!f.front && vis(f.x)) fern(ctx, f.x, GY + 1, tpal(f.b), seeded(f.seed), f.s);
  // tronco caído no caminho: o espírito pula por cima
  ctx.drawImage(logPiece(V.bio(V.hopX)), V.hopX - 17, GY - 18);
  // o espírito correndo com a forma que está usando (e a chama do fogo frio, se já tiver)
  const dh = heroX - V.hopX + 34, air = dh > 0 && dh < 52, jy = air ? Math.round(-Math.sin(dh / 52 * Math.PI) * 22) : 0;
  const px = heroX, py = GY + jy;
  if (!hideHero) {
    if (form === 'espirito') softGlow(ctx, px, py - 13, 24, 30, '#8a7ab0', 0.25);
    // riscos de vento passando pelo corpo (dá a sensação de velocidade)
    for (let i = 0; i < 5; i++) { const p = (tt * 2.2 + i * 0.37) % 1, wy = py - 8 - (i * 9) % 34; ctx.globalAlpha = 0.35 * Math.sin(p * Math.PI); rect(ctx, px + 14 - p * 46, wy, 8 + (i % 3) * 4, 1, '#f4ecd8'); }
    ctx.globalAlpha = 1;
    drawHuman(ctx, px, py, 1, air ? { kind: dh < 26 ? 'jump' : 'fall' } : { kind: 'run', ph: tt * VIAGEM_VEL * 0.22, t: tt }, playerSpec(form));
    if (G.save.cold) drawSparkle(ctx, px - 16, py - 36 + Math.sin(tt * 2.5) * 2, tt, '#bfe4ff');
    if (!air) for (let i = 0; i < 4; i++) { const p = (tt * 3 + i / 4) % 1; ctx.globalAlpha = 0.5 * (1 - p); rect(ctx, px - 8 - p * 22, GY - 2 - p * 4, 2, 1, biome(V.bio(px)).ground.top); }
    ctx.globalAlpha = 1;
  }
  // samambaias de primeiro plano passando na frente
  for (const f of V.ferns) if (f.front && vis(f.x)) fern(ctx, f.x, GY + 3, tpal(f.b), seeded(f.seed), f.s * 1.3);
  ctx.restore();
  // bando de pássaros cruzando o céu (morcegos na gruta)
  const birdT = (tt - 1.2) / 3.4;
  if (birdT > 0 && birdT < 1) {
    const cave = V.bio(heroX) === 'gruta', col = cave ? '#1a1412' : tpal(V.bio(heroX)).out;
    for (let i = 0; i < 6; i++) {
      const bx = W + 20 - birdT * (W + 80) + i * 13 + (i % 2) * 6, by = top + 30 + i * 5 - (i % 3) * 9 + Math.sin(tt * 3 + i) * 3, fl = Math.sin(tt * 14 + i * 1.7) > 0 ? -1 : 1;
      rect(ctx, bx, by, 2, 1, col); rect(ctx, bx - 2, by + fl, 2, 1, col); rect(ctx, bx + 2, by + fl, 2, 1, col);
    }
  }
  // partículas da região, conforme o lado da fronteira
  const [pc, dir] = VIAGEM_PART[e > 0.5 ? to : from] || ['#ffffff', 0];
  for (let i = 0; i < 40; i++) {
    const x = ((hash(i) * W * 2 - cam * (0.4 + hash(i + 3) * 0.9)) % W + W) % W;
    const y = ((hash(i + 7) * 160 + dir * tt * 20 * (0.5 + hash(i + 1)) + Math.sin(tt * 2 + i) * 4) % 160 + 160) % 160 + top + 18;
    ctx.globalAlpha = 0.45 + 0.45 * Math.sin(tt * 4 + i); rect(ctx, x, y, 1 + (i % 4 === 0 ? 1 : 0), 1 + (i % 7 === 0 ? 1 : 0), pc);
  }
  ctx.globalAlpha = 1;
  // entra a partir da última imagem da fase anterior
  if (tt < 0.6) { ctx.globalAlpha = 1 - tt / 0.6; ctx.drawImage(transC, 0, top); ctx.globalAlpha = 1; }
  // faixas de cinema (a de baixo leva a rota)
  const out = k > 0.93 ? (1 - k) / 0.07 : 1, lb = Math.round(24 * Math.min(1, tt / 0.5) * out);
  rect(ctx, 0, top, W, lb, '#000'); rect(ctx, 0, bot - lb, W, lb, '#000');
  // letreiro: o ato desce, o nome nasce letra por letra, o traço dourado abre e a frase vai sendo escrita
  const ts = k * VIAGEM_DUR - VIAGEM_DUR * 0.3, ta = clamp(ts / 0.4, 0, 1) * clamp((0.97 - k) / 0.07, 0, 1);
  if (ts > 0 && ta > 0) {
    const y0 = top + lb + 12;
    ctx.save(); ctx.globalAlpha = ta * 0.5;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + 82); g.addColorStop(0, '#0a080600'); g.addColorStop(0.25, '#0a0806'); g.addColorStop(0.75, '#0a0806'); g.addColorStop(1, '#0a080600');
    ctx.fillStyle = g; ctx.fillRect(0, y0, W, 82);
    ctx.globalAlpha = ta * clamp(ts / 0.5, 0, 1);
    drawPx(card[0].toUpperCase(), W / 2, y0 + 4 - Math.round((1 - clamp(ts / 0.5, 0, 1)) * 6), { align: 'center', sp: 2, col: '#ffd870', col2: '#c8902a' });
    // título, uma letra de cada vez subindo
    const T = card[1], TS = 3, tw = pxW(T) * TS; let lx = W / 2 - tw / 2, li = 0;
    for (const ch of T) {
      const p = clamp((ts - 0.25 - li * 0.045) / 0.25, 0, 1);
      if (p > 0) { ctx.globalAlpha = ta * p; drawPx(ch, lx, y0 + 18 + Math.round((1 - p) * 8), { s: TS, col: p < 1 ? '#ffffff' : '#fff4dc', col2: p < 1 ? '#ffffff' : '#d8c098' }); }
      lx += (pxGlyph(ch).w + 1) * TS; li++;
    }
    // traço dourado abrindo do centro, com losangos nas pontas
    const lp = clamp((ts - 0.6) / 0.6, 0, 1), lw = Math.round((tw / 2 + 14) * lp * (2 - lp));
    if (lw > 0) {
      ctx.globalAlpha = ta; rect(ctx, W / 2 - lw, y0 + 49, lw * 2, 1, '#f2c14e'); rect(ctx, W / 2 - lw, y0 + 50, lw * 2, 1, '#8a6a2a');
      for (const s of [-1, 1]) { const dx = W / 2 + s * lw; rect(ctx, dx - 1, y0 + 48, 3, 3, '#f2c14e'); rect(ctx, dx, y0 + 47, 1, 5, '#f2c14e'); }
    }
    if (card[2]) { ctx.globalAlpha = ta * clamp((ts - 0.9) / 0.4, 0, 1); drawPx(card[2], W / 2, y0 + 55, { align: 'center', col: '#ffb880', col2: '#c86a3a' }); }
    // a frase vai sendo escrita (centrada pela frase inteira, para não pular de lugar)
    if (card[3]) { const n = Math.floor(clamp((ts - 1.2) * 40, 0, card[3].length)); ctx.globalAlpha = ta; drawPx(card[3].slice(0, n), W / 2 - pxW(card[3]) / 2, y0 + 67, { col: '#f4ead4', col2: '#c8b898' }); }
    ctx.restore();
  }
  // rota da jornada: de onde vem para onde vai
  const i0 = Math.max(0, ROTA.indexOf(from)), i1 = Math.max(0, ROTA.indexOf(to)), x0 = 52, x1 = W - 52, ry = bot - lb + 8, step = (x1 - x0) / (ROTA.length - 1);
  ctx.globalAlpha = Math.min(1, tt / 0.8) * out;
  rect(ctx, x0, ry, x1 - x0, 1, '#5a4e44');
  const pm = clamp((k - 0.25) / 0.5, 0, 1), pe = pm * pm * (3 - 2 * pm), mx = x0 + (i0 + (i1 - i0) * pe) * step;
  rect(ctx, x0, ry, mx - x0, 1, '#f2c14e');
  ROTA.forEach((id, i) => { const x = Math.round(x0 + i * step), done = i <= i0 || (i === i1 && pe >= 1); rect(ctx, x - 2, ry - 2, 5, 5, '#0a0806'); rect(ctx, x - 1, ry - 1, 3, 3, done ? '#f2c14e' : i === i1 ? (Math.sin(tt * 6) > 0 ? '#f4ecd8' : '#8a7a6a') : '#4a4038'); });
  rect(ctx, Math.round(mx) - 1, ry - 6 + Math.round(Math.sin(tt * 8)), 3, 3, '#bfe4ff'); rect(ctx, Math.round(mx), ry - 7 + Math.round(Math.sin(tt * 8)), 1, 1, '#ffffff');
  drawPx(ROTA_NOME[from] || '', x0 + i0 * step, ry + 4, { align: 'center', col: '#c8b8a0', col2: '#9a8a74' });
  drawPx(ROTA_NOME[to] || '', x0 + i1 * step, ry + 4, { align: 'center', col: '#fff4dc', col2: '#e0c890' });
  if (tt > 1 && k < 0.93) { ctx.globalAlpha *= 0.85; drawPx(L.touch ? 'toque para pular' : 'Enter: pular', W - 6, top + lb - 16, { align: 'right', col: '#b8a88a', col2: '#8a7a6a' }); }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
async function enterAct(n, o = {}) {
  G.save.act = n; writeSave();
  const lvl = homeLevel(n), card = lvl === 'gruta' ? GRUTA_CARD : CARDS[n];
  if (!o.smooth) G.state = 'card';
  if (!o.skipCard && !o.smooth) await showCard(...card);
  loadLevel(lvl);
  G.flags = { final: n === 6 };
  let x = G.lvl.start;
  const F = G.save.fire && G.save.fire.lvl === G.lvl.id ? G.save.fire : null;
  if (F) x = F.x;
  const arrival = o.smooth && !F && G.arrivalSeed && G.arrivalSeed.to === lvl ? G.arrivalSeed : null;
  G.arrivalSeed = null;
  if (arrival) x = VIAGEM_PX - 5;
  if (!arrival) for (const t of G.lvl.triggers) if (t.x < x - 10 && !t.always) t.done = true;
  G.P = makePlayer(x, groundY(x));
  G.P.form = n === 0 ? 'espirito' : (G.save.forms.includes(G.save.form) ? G.save.form : G.save.forms[G.save.forms.length - 1]);
  // vindo do mapa anterior: entra caminhando pela borda esquerda enquanto a tela clareia
  const walkIn = !arrival && o.walkIn && !F;
  if (walkIn) { G.P.x = Math.max(2, x - 46); G.P.f = 1; G.auto = 1; G.lock++; }
  if (arrival) {
    G.P.form = arrival.form; G.P.ph = arrival.ph; G.P.vx = VIAGEM_VEL; G.P.onG = true;
    G.auto = 1; G.lock++; G.arriving = true;
  }
  G.cam.x = clamp(G.P.x - W / 2, 0, G.lvl.w - W);
  G.cam.shake = 0;
  G.state = 'play'; $('#hud').hidden = false; updateHudForm(); hud.cache = {};
  if (o.smooth) { startBlend(arrival ? 'arrival' : 'scene'); if (!o.noToast) showToast(card[0] + ' · ' + card[1], card[3] || card[2], 3.2); }
  if (arrival) {
    $('#fade').classList.remove('on', 'white');
    try { await wait(0.65); } finally { G.auto = 0; G.lock = Math.max(0, G.lock - 1); G.arriving = false; }
  } else if (walkIn) { const t0 = G.rt; fade(false); await waitUntil(() => G.P.x >= x || G.rt - t0 > 1.6); G.auto = 0; G.lock--; } else await fade(false);
  if (G.lvl.onStart) await scene(G.lvl.onStart);
}
// Sai caminhando; a captura conduz à paisagem da viagem.
async function walkOut() {
  if (G.P && G.state === 'play') {
    G.lvl.solids = G.lvl.solids.filter(s => !s.arenaWall); closeDialog();
    G.P.state = 'normal'; G.P.f = 1; G.auto = 1; await wait(0.7); G.auto = 0;
  }
  snapshotScene();
}
// Fase atual do ato, incluindo o interior do Cerrado nos saves da gruta.
function homeLevel(n = G.save.act) { return n === 2 && G.save.sub === 'gruta' ? 'gruta' : ACTS[n]; }
async function enterGruta() {
  return useCavePassage('down');
}
async function nextAct() {
  if (G.lvl.id === 'gruta') return;
  await walkOut();
  const from = G.lvl.biome;
  G.save.act++; G.save.sub = null; G.save.fire = null; G.save.drop = null; writeSave();
  hud.boss.hidden = true;
  const to = homeLevel(G.save.act);
  await travelScene(from, to, to === 'gruta' ? GRUTA_CARD : CARDS[G.save.act]);
  return enterAct(G.save.act, { walkIn: true, smooth: true, noToast: true });
}
function grantForm(f) {
  if (!G.save.forms.includes(f)) G.save.forms.push(f);
  setForm(f); writeSave(); VFX.form(G.P);
  const P = G.P; for (let i = 0; i < 30; i++) part(P.x + 5 + rnd(-10, 10), P.y + rnd(-4, 24), rnd(-30, 30), rnd(-60, 0), 1, pick(['#f2c14e', '#efe0c0', '#e0703a']));
  SFX.echo(); G.flash = 0.25; G.flashCol = '#f4ecd8';
  showToast('Nova forma', FORMS[f].nome, 2.6);
}

// ---------- Interação, gatilhos, arena ----------
// Interação: zona de alcance ao redor de cada elemento; só o mais próximo; só parado ou andando no chão
const INTERACT_R = 30;
function interactables() {
  const P = G.P, L2 = G.lvl, out = [];
  const add = (x, y, label, fn) => out.push({ x, y, label, fn });
  for (const n of L2.npcs) if (!n.hidden && n.talk) add(n.x, groundY(n.x, n.y0 || 0), 'Conversar', () => scene(n.talk));
  for (const f of L2.fires) {
    const company = journeyFireAction(f);
    const localCompany = typeof companionFireAction === 'function' && companionFireAction(f);
    add(f.x, groundY(f.x), company ? 'Sentar com Lia e Nina' : localCompany ? 'Sentar com ' + COMPANIONS[L2.id].who : !G.save.lit[f.id] ? 'Acender a fogueira' : 'Fogueira', () => company ? scene(journeyCamp) : localCompany ? scene(() => companionCamp(L2.id)) : restAt(f));
  }
  for (const c of L2.chests) if (!G.save.opened[c.id] && (!c.need || gateOpen(c.need))) add(c.x, c.y, 'Abrir', () => openChest(c));
  caveInteractables(add);
  journeyInteractables(add);
  if (P && P.state === 'normal') { const v = nearVine(P); if (v) add(P.x + 5, P.y + P.h, 'Agarrar cipó', () => grabVine(v)); }
  if (L2.echoAt && L2.echoAt.id !== 'engenho') add(L2.echoAt.x, L2.echoAt.y, G.save.echoes.includes(L2.echoAt.id) ? 'Lembrar de novo' : 'Lembrar', () => scene(() => remember(L2.echoAt.id)));
  return out;
}
function checkInteract() {
  const P = G.P, px = P.x + 5;
  let best = null, bd = INTERACT_R;
  for (const z of interactables()) { const d = Math.abs(z.x - px); if (d < bd && Math.abs(z.y - (P.y + P.h)) < 30) { bd = d; best = z; } }
  G.interact = (G.lock || P.state !== 'normal' || !P.onG || G.boss && G.boss.st !== 'down') ? null : best;
  const pr = $('#prompt'), ib = $('#touch [data-a="interact"]');
  if (G.interact) {
    pr.hidden = false; pr.textContent = (L.touch ? 'Agir: ' : 'E: ') + best.label;
    pr.style.left = ((best.x - G.cam.x) / W * 100) + '%'; pr.style.top = ((best.y - 30 - G.cam.y) / H * 100) + '%';
    ib.classList.add('ready');
    if (I.pressed.interact) best.fn();
  } else { pr.hidden = true; ib.classList.remove('ready'); }
  // entrada da arena: anuncia o nome da área do guardião
  for (const o of G.lvl.areas) if (!o.seen && px > o.x) { o.seen = true; showToast(AREAS[G.lvl.biome] || '', 'o guardião está perto', 2.6); }
}
async function remember(id) {
  SFX.echo(); G.flash = 0.35; G.flashCol = '#000';
  const isNew = !G.save.echoes.includes(id);
  await say('', ECHOES[id].x);
  if (isNew) { G.save.echoes.push(id); writeSave(); VFX.memory(G.P.x + 5, G.P.y + G.P.h, 32); showToast('Eco do Corpo-seco', ECHOES[id].t + ' · ' + G.save.echoes.length + '/6', 2.6); }
}
function openChest(c) {
  // loot sorteado: um item que você ainda não tem (runa, ferramenta ou parte) e um punhado de memórias
  const owned = G.save.items || [], pool = Object.keys(RELICS).filter(id => !PARTS[id] && !RELICS[id].fixed && !owned.includes(id));
  const item = c.item && !owned.includes(c.item) ? c.item : pool.length && Math.random() < 0.85 ? pick(pool) : null, act = G.lvl.act || 0;
  const R2 = { item, mem: Math.round((rnd(20, 50) + act * 15) * (item ? 1 : 2)) };
  G.save.opened[c.id] = 1; c.openT = G.t; VFX.chest(c);
  const parts = [];
  if (R2.item) { const r = giveRelic(R2.item); if (r) parts.push(r.n + ' (' + r.d + ')'); }
  if (R2.mem) { G.save.mem += R2.mem; parts.push(R2.mem + ' memórias'); }
  G.P.flasks = statMax().flasks; G.P.hp = Math.min(G.P.hp + (R2.item && RELICS[R2.item].hp || 0), statMax().hp);
  writeSave(); SFX.echo(); hud.cache = {};
  floatText(c.x, c.y - 18, R2.item ? RELICS[R2.item].n : R2.mem + ' memórias', '#f2c14e');
  hint('Baú: <b>' + parts.join(' + ') + '</b>', 'Baú: <b>' + parts.join(' + ') + '</b>', 4);
}
// Fogueira: toda vez que interage, acende (se preciso), descansa e abre o menu com inventário
function restAt(f) {
  scene(async () => {
    const P = G.P, m = statMax(), gy = groundY(f.x);
    if (!G.save.lit[f.id]) { G.save.lit[f.id] = 1; SFX.fire(); VFX.play('terra/acende', f.x, gy); for (let i = 0; i < 24; i++) part(f.x + rnd(-6, 6), gy - 4, rnd(-20, 20), rnd(-60, -20), 1, pick(['#ffd27a', '#e0703a', '#c8402e'])); }
    P.hp = m.hp; P.st = m.st; P.flasks = m.flasks; G.heat = 0; P.vx = 0; P.breath = 100;
    G.save.fire = { lvl: G.lvl.id, x: f.x }; writeSave();
    spawnEnemies(); G.grace = 1; P.inv = 1; SFX.rest(); VFX.rest(f.x, gy);
    for (let i = 0; i < 20; i++) part(f.x + rnd(-6, 6), gy - 6, rnd(-15, 15), rnd(-50, -10), 1.2, pick(['#ffd27a', '#e0703a']));
    await fireMenu();
  });
}
function checkTriggers() {
  if (G.arriving || G.cavePassage) return;
  const px = G.P.x + 5;
  // uma cena por vez: as outras disparam quando esta acabar
  if (G.lock) return;
  for (const t of G.lvl.triggers) if (!t.done && px > t.x) { t.done = true; scene(t.fn); return; }
}
function checkArena() {
  const A = G.lvl.arena;
  if (!A || A.active || A.cleared || G.lock) return;
  if (G.P.x > A.x0 + 40) startBoss();
}
function startBoss() {
  const A = G.lvl.arena; A.active = true;
  G.lvl.solids.push({ x: A.x0 - 20, y: -200, w: 20, h: 500, t: 'g', wall: true, arenaWall: true }, { x: A.x0 + AW, y: -200, w: 20, h: 500, t: 'g', wall: true, arenaWall: true });
  const B = G.boss = makeBoss(A.boss, A.x0 + AW - 60);
  if (A.boss === 'labatut') G.dynShade = [{ x: A.x0 + 60, w: 48, vx: 20 }];
  musicSet('boss'); hud.cache = {};
  const D = BOSSES[A.boss];
  showToast(D.nome, D.sub, 2.8); SFX.roar(); G.cam.shake = 4;
  const intro = A.boss === 'mapinguari' ? journeyBossIntro() : BOSS_INTRO[A.boss];
  if (intro && !G.save.seen[A.boss]) { G.save.seen[A.boss] = 1; writeSave(); B.tt = 99; scene(async () => { await wait(0.8); await talk(intro); B.tt = 0.3; }); }
}
function resetArena() {
  const L2 = G.lvl, A = L2.arena;
  L2.solids = L2.solids.filter(s => !s.arenaWall);
  if (A) A.active = false;
  G.boss = null; G.dynShade = []; G.heatMul = 1; G.dark = 0; hud.boss.hidden = true; hud.cache = {};
  musicSet(L2.biome);
}
function onBossDown(B) { hud.boss.hidden = true; VFX.bossDown(B); CONQ.chefe(B.kind); scene(() => STORY.bossDown(B)); }

// ---------- Morte e retorno ----------
function die() {
  const P = G.P; if (P.state === 'dead') return;
  P.state = 'dead'; P.hp = 0; G.lock++; SFX.lose(); VFX.death(P); CONQ.morte();
  if (G.save.mem > 0) { const fell = P.y > GY + 20; G.save.drop = { lvl: G.lvl.id, x: (fell ? P.safe.x : P.x) + 5, y: (fell ? P.safe.y : P.y) + 12, mem: G.save.mem }; }
  G.save.mem = 0; writeSave();
  closeDialog();
  $('#dead').classList.add('on');
  setTimeout(async () => {
    await fade(true);
    $('#dead').classList.remove('on');
    respawn();
    await fade(false);
    G.lock = 0;
  }, 2200);
}
function respawn() {
  resetArena();
  const L2 = G.lvl, F = G.save.fire && G.save.fire.lvl === L2.id ? G.save.fire : null;
  const x = F ? F.x : L2.start;
  const form = G.P.form, ab = G.P.ab;
  G.P = makePlayer(x, groundY(x)); G.P.form = form; if (G.flags.final) G.P.ab = ab;
  for (const t of L2.triggers) if (t.retry && !t.completed) t.done = false;
  spawnEnemies(); G.projs = []; G.hazards = []; G.heat = 0; G.camTarget = null; G.auto = 0;
  G.grace = 1; G.P.inv = 1; VFX.respawn(G.P);
  G.cam.x = clamp(x - W / 2, 0, L2.w - W); updateHudForm();
}

// ---------- Fases ----------
const NPC = {
  cacador: npcSpec('zarabatana', { weapon: 'blowgun' }),
  mestraA: npcSpec('zarabatana', { weapon: null, hair: '#3a3430', acc: 'crown', bottom: { col: '#6a3e22', len: 6, hem: '#a8744a' } }),
  nina: npcSpec('zarabatana', { weapon: null, acc: null, hair: '#201b17', bottom: { col: '#875132', len: 6, hem: '#c69b65' } }),
  arqueira: npcSpec('arco'),
  canoeiro: npcSpec('lanca'),
  lanceira: npcSpec('cabaca'),
  ancia: npcSpec('semente'),
};
const LEVELS = {
  prologo() {
    const L2 = LV({ act: 0, biome: 'prologo', name: 'Prólogo — o despertar', w: 1440, start: 40 });
    L2.g(0, 520).g(560, 1440);
    L2.p(250, 124, 36).p(320, 108, 40).b(700, 132, 26, 18).p(860, 118, 40);
    L2.stump(180).can(150, 70, 3).th(905, 955).can(980, 80, 3).area(1112);
    L2.g(380, 470, 136).g(740, 830, 134).dthorn(1000).chest(340, 'p_trilha', 108);
    L2.e('crawler', 300).e('crawler', 420).e('flyer', 660, 96).e('spitter', 790).e('crawler', 900).e('flyer', 980, 90);
    L2.f(620, 'p1');
    L2.echo(480, GY, 'pegadas');
    L2.n({ x: 1395, spec: NPC.cacador, f: -1, anim: 'kneel', id: 'cacador' });
    L2.ar(1100, 'lobo');
    L2.tr(30, async () => { hint('<kbd>A</kbd> <kbd>D</kbd> andar · <kbd>W</kbd> / <kbd>Espaço</kbd> pular', '◀ ▶ para andar · <b>Pular</b> para pular', 6); });
    L2.tr(210, async () => { hint('<kbd>J</kbd> / clique esquerdo: golpe de perto · <kbd>K</kbd> / clique direito: tiro · <kbd>L</kbd> dash', '<b>Golpe</b> de perto · <b>Tiro</b> à distância · <b>Dash</b> avança sem tomar dano', 7); });
    L2.tr(560, async () => { hint('<kbd>F</kbd> beber da cabaça (cura) · <kbd>E</kbd> agir', '<b>Cura</b> bebe da cabaça · <b>Agir</b> conversa e descansa', 6); });
    L2.tr(1050, async () => {
      if (G.save.seen.prolEvent) return;
      G.save.seen.prolEvent = 1;
      G.camTarget = 1100;
      await wait(0.6);
      await talk([['', 'Um grito corta a mata.'], ['Davi', 'Para! Você sempre protegeu a gente!'], ['Espírito', 'Davi!'], ['Espírito', 'A Lei antiga diz que a mata não luta contra os seus. Mas ele não está reconhecendo ninguém.']]);
      await choose('', [{ label: 'Romper a Lei', sub: 'lutar para libertar, não para destruir' }]);
      closeDialog(); G.flash = 0.4; G.flashCol = '#f4ecd8'; SFX.boom(); showToast('A Lei foi rompida', 'lutar é um ato de amor, não de ódio', 2.6);
      G.camTarget = null;
    });
    L2.onStart = async () => {
      if (G.save.seen.prol) return; G.save.seen.prol = 1;
      G.P.kneel = true; await wait(1);
      await talk([['', 'O espírito acorda fraco. Quase esquecido.'], ['Espírito', '...ninguém mais conta a minha história aqui.']]);
      G.P.kneel = false;
    };
    return L2;
  },
  amazonia() {
    const L2 = LV({ act: 1, biome: 'amazonia', name: 'Ato I — Amazônia', w: 2280, start: 30 });
    // seções do mapa do tileset: 1 entrada, 2 rampa, 3 saltos, 4 espinhos, 5 subida, 6 arena
    L2.g(0, 900).g(972, 2280);
    L2.stump(1750).can(160, 80).pr('malocas', 300).n({ x: 150, spec: NPC.mestraA, f: -1, id: 'mestra', talk: () => talk([['Mestra da zarabatana', 'Quem sopra a zarabatana precisa de fôlego, não de força. Segure o ar e solte três vezes.'], ['Mestra da zarabatana', 'E não respire perto quando a nuvem verde subir.']]) });
    L2.f(230, 'a1');
    L2.ramp(470, 150, 600, 106).br(608, 98, 40);
    L2.isl(922, 128).p(984, 106, 40).br(1048, 80, 44);
    L2.echo(405, GY, 'machado').chest(660, 'a_rampa').hv(540).chest(1066, 'a_galho', 80).log(1030);
    L2.dthorn(1520).hv(1420).area(1975);
    L2.th(1330, 1500).p(1296, 116, 40).isl(1360, 100).p(1420, 112, 40);
    L2.p(1690, 108, 40).vine(1815, 96).b(1830, 100, 40, 50).b(1880, 136, 26, 14).can(1700, 90);
    L2.can(2040, 120, 5);
    L2.g(700, 860, 136).g(1150, 1250, 136).g(1560, 1660, 138).chest(1850, 'a_subida', 100);
    L2.e('crawler', 380).e('spitter', 625, 98).e('crawler', 780).e('flyer', 1000, 60).e('brute', 1100).e('lanceiro', 1200).e('crawler', 1270).e('flyer', 1430, 60).e('brute', 1600).e('spitter', 1705, 108).e('lanceiro', 1760);
    L2.f(1925, 'a2');
    L2.tr(1740, async () => { hint('<kbd>W</kbd> / <kbd>↑</kbd> agarra o cipó · <kbd>W</kbd> sobe · direção + <kbd>Espaço</kbd> salta', '<b>Agir</b> agarra o cipó · segure <b>Pular</b> para subir · ◀▶ + <b>Pular</b> salta', 7); });
    L2.ar(1960, 'mapinguari');
    L2.tr(110, async () => {
      if (G.save.seen.a1) return; G.save.seen.a1 = 1;
      await talk([
        ['Mestra da zarabatana', 'Então é verdade. O caçador disse que você voltou sem corpo e saiu com o nosso jeito.'],
        ['Mestra da zarabatana', 'Quem sopra a zarabatana precisa de fôlego, não de força. Segure o ar e solte três vezes.'],
        ['Mestra da zarabatana', 'O Mapinguari afastava quem vinha derrubar a floresta. Agora derruba o que encontra.'],
        ['Mestra da zarabatana', 'Dizem que o cheiro dele tonteia. Quando a nuvem verde subir, saia de perto.'],
      ]);
      hint('<kbd>U</kbd> especial: três dardos envenenados', '<b>Especial</b>: três dardos envenenados', 6);
    });
    return L2;
  },
  cerrado() {
    const L2 = LV({ act: 2, biome: 'cerrado', name: 'Ato II — Cerrado', w: 2280, start: 30 });
    L2.g(0, 620).g(670, 1400).g(1450, 2280);
    L2.pr('hut', 200).n({ x: 270, spec: NPC.arqueira, f: -1, id: 'arqueira', talk: () => talk([['Mestra do arco', 'Olha o chão, não o bicho. O rastro não mente.']]) });
    L2.f(325, 'c1');
    L2.b(500, 128, 40, 22).p(560, 106, 40).p(642, 124, 20).b(800, 134, 30, 16).b(1000, 120, 50, 30).p(1060, 100, 40).p(1420, 124, 20);
    L2.gr(380, 420).gr(880, 930).gr(1230, 1280).gr(1700, 1750);
    L2.ramp(1290, 150, 1398, 116).th(1520, 1610).can(300, 60, 2).br(1150, 96, 40);
    L2.chest(1025, 'c_pedra', 120).area(1975);
    L2.echo(1150, GY, 'lanterna');
    L2.g(720, 790, 138).g(1760, 1860, 136).chest(580, 'c_chapada', 106).chest(1720, 'c_capim');
    L2.e('crawler', 420).e('flyer', 560, 80).e('lanceiro', 700).e('spitter', 1020, 120).e('brute', 1200).e('flyer', 1500, 90).e('brute', 1640).e('spitter', 1780).e('crawler', 1840).e('lanceiro', 900);
    L2.f(1890, 'c2');
    L2.gr(2000, 2040).gr(2200, 2245);
    L2.ar(1960, 'capelobo');
    L2.tr(230, async () => {
      if (G.save.forms.includes('arco')) return;
      await talk([
        ['Mestra do arco', 'Você chega com cheiro de floresta molhada. Aqui é diferente.'],
        ['Mestra do arco', 'No cerrado a gente rastreia. Olha o chão, não o bicho.'],
        ['Mestra do arco', 'E o fogo daqui é antigo. Sabe queimar sem matar a raiz. Leva ele na ponta da flecha.'],
      ]);
      grantForm('arco');
      await wait(0.6);
      await talk([['Mestra do arco', 'O Capelobo some no capim e aparece onde você não olha. Com esse jeito, você enxerga o rastro dele.']]);
      hint('<kbd>J</kbd> três golpes seguidos · <kbd>U</kbd> flecha de fogo', '<b>Golpe</b> três vezes seguidas · <b>Especial</b>: flecha de fogo', 6);
    });
    return L2;
  },
  pantanal() {
    const L2 = LV({ act: 3, biome: 'pantanal', name: 'Ato III — Pantanal', w: 2440, start: 30 });
    L2.g(0, 400).wt(400, 880).g(400, 880, 172).g(880, 1240).wt(1240, 1700).g(1240, 1700, 172).g(1700, 2160).wt(2160, 2400).g(2160, 2400, 172).g(2400, 2440);
    L2.pr('stilts', 110).n({ x: 230, spec: NPC.canoeiro, f: -1, id: 'canoeiro', talk: () => talk([['Velho canoeiro', 'Na água quem manda é o remo. Fica de pé na canoa e a água vira chão.']]) });
    L2.f(300, 'p1');
    L2.flog(410, 142, 30).p(478, 146, 34, { dx: 14, spd: 0.9, canoe: true }).flog(552, 142, 28).p(618, 146, 34, { dx: 16, spd: 0.7, canoe: true }).flog(690, 142, 28).p(756, 146, 34, { dx: 14, spd: 1.1, canoe: true }).flog(830, 140, 30);
    L2.b(960, 132, 30, 18).p(1000, 114, 36);
    L2.flog(1252, 142, 28).p(1318, 146, 34, { dx: 14, spd: 0.8, canoe: true }).flog(1392, 142, 28).p(1458, 146, 34, { dx: 16, spd: 1, canoe: true }).flog(1532, 142, 28).p(1598, 146, 34, { dx: 14, spd: 0.9, canoe: true }).flog(1662, 140, 28);
    L2.flog(2172, 142, 28).p(2232, 146, 34, { dx: 18, spd: 0.6, canoe: true }).flog(2296, 142, 26).p(2350, 146, 34, { dx: 14, spd: 0.75, canoe: true });
    L2.echo(1110, GY, 'escritura');
    L2.can(250, 90, 4).th(1760, 1830).vine(1180, 74).br(1166, 70, 36).can(2000, 90, 4);
    L2.chest(1060, 'p_ilha').area(2135);
    L2.g(1860, 1960, 136).chest(150, 'p_palafita').chest(975, 'p_tronco', 132);
    L2.e('crawler', 940).e('spitter', 1010, 114).e('lanceiro', 1080).e('flyer', 1150, 80).e('flyer', 1450, 96).e('flyer', 1560, 90).e('brute', 1800).e('crawler', 1900).e('spitter', 1990);
    L2.f(2050, 'p2');
    L2.ar(2120, 'paidomato');
    L2.tr(200, async () => {
      if (G.save.forms.includes('lanca')) return;
      await talk([
        ['Velho canoeiro', 'Eu vi você chegar pela margem. Andando na lama como quem não sabe nadar.'],
        ['Velho canoeiro', 'Na água quem manda é o remo. Fica de pé na canoa e a água vira chão. E a lança alcança longe.'],
      ]);
      grantForm('lanca');
      await wait(0.6);
      await talk([['Velho canoeiro', 'O Pai do Mato ainda não enlouqueceu. É o único. Mas ele sabe que você rompeu a Lei.'], ['Velho canoeiro', 'Ele vai querer ver se você merece.']]);
      hint('<kbd>J</kbd> estocada longa (de longe, o remo joga água) · <kbd>U</kbd> arremesso de lança · na água você anda e pula melhor', '<b>Golpe</b>: estocada longa · <b>Especial</b>: arremesso · na água você anda e pula melhor', 7);
    });
    return L2;
  },
  caatinga() {
    const L2 = LV({ act: 4, biome: 'caatinga', name: 'Ato IV — Caatinga', w: 2380, start: 30 });
    L2.g(0, 700).g(750, 1500).g(1550, 2380);
    L2.p(715, 124, 22).p(1515, 124, 22).b(1100, 130, 40, 20).p(1150, 110, 36);
    L2.sh(160, 240, 'awning').sh(420, 460, 'tree').sh(640, 680, 'rock').sh(900, 940, 'tree').sh(1180, 1220, 'tree').sh(1420, 1460, 'rock').sh(1700, 1740, 'tree').sh(1960, 2020, 'awning');
    L2.sh(2310, 2350, 'rock');
    L2.n({ x: 205, spec: NPC.lanceira, f: -1, id: 'lanceira', talk: () => talk([['Lanceira da cabaça', 'Anda de sombra em sombra. Quando a pele arder, bebe da cabaça ou procura abrigo.']]) });
    L2.f(225, 'k1');
    L2.pr('skull', 560).pr('cross', 1290).pr('skull', 1830);
    L2.th(480, 560).th(1610, 1690).th(1860, 1920);
    L2.chest(1168, 'k_lajedo', 110).area(2075);
    L2.echo(1265, GY, 'poco');
    L2.g(300, 390, 138).g(820, 900, 136).g(1320, 1410, 136).g(1750, 1850, 138).chest(930, 'k_sombra').chest(1715, 'k_cruz');
    L2.e('crawler', 380).e('spitter', 600).e('flyer', 800, 90).e('lanceiro', 860).e('brute', 1000).e('crawler', 1120, 130).e('spitter', 1360).e('lanceiro', 1460).e('brute', 1600).e('flyer', 1800, 80).e('crawler', 1900);
    L2.f(1990, 'k2');
    L2.ar(2060, 'labatut');
    L2.tr(150, async () => {
      if (G.save.forms.includes('cabaca')) return;
      await talk([
        ['Lanceira da cabaça', 'Sai desse sol! Aqui o sol também é guardião. Tem que respeitar.'],
        ['Lanceira da cabaça', 'Anda de sombra em sombra. E carrega água: a cabaça cura, refresca e, jogada com força, derruba.'],
      ]);
      grantForm('cabaca');
      await wait(0.6);
      await talk([['Lanceira da cabaça', 'O Labatut... quase ninguém conta mais a história dele. Sobrou pouco. Sobrou a fome.']]);
      hint('Fique na <b>sombra</b> para esfriar · <kbd>U</kbd> joga água: dano e alívio do calor', 'Fique na <b>sombra</b> para esfriar · <b>Especial</b> joga água: dano e alívio do calor', 7);
    });
    return L2;
  },
  mata() {
    const L2 = LV({ act: 5, biome: 'mata', name: 'Ato V — Mata Atlântica', w: 2580, start: 30 });
    L2.g(0, 800).g(850, 1700).g(1750, 2580);
    L2.pr('ruin', 300, null, { w: 40, h: 50, arch: true }).pr('ruin', 1000, null, { w: 30, h: 40 }).pr('ruin', 1880, null, { w: 44, h: 56, arch: true });
    L2.b(560, 120, 40, 30).p(612, 100, 34).p(820, 124, 24).b(1100, 126, 36, 24).p(1150, 104, 40).p(1720, 124, 24).b(2000, 128, 36, 22);
    L2.can(140, 90, 4).th(1200, 1290).ramp(1760, 150, 1880, 112).can(1300, 100, 5).vine(680, 66).br(688, 62, 40).can(2300, 120, 5);
    L2.chest(2018, 'm_ruina', 128).area(2275).log(950);
    L2.n({ x: 175, spec: NPC.ancia, f: -1, id: 'ancia', talk: () => talk([['Anciã das sementes', 'O que você carrega é emprestado. Lembra disso quando chegar a hora.']]) });
    L2.f(235, 'm1');
    L2.pr('engenho', 1460);
    L2.echoAt = { x: 1460, y: GY, id: 'engenho' };
    L2.g(380, 470, 136).g(2060, 2150, 136).chest(629, 'm_arco', 100);
    L2.e('crawler', 420).e('flyer', 500, 80).e('spitter', 575, 120).e('brute', 920).e('crawler', 1060).e('lanceiro', 1080).e('flyer', 1200, 70).e('brute', 1320).e('spitter', 1650).e('brute', 1900).e('flyer', 2000, 80).e('lanceiro', 2040).e('crawler', 2120);
    L2.f(1580, 'm2'); L2.f(2190, 'm3');
    L2.ar(2260, 'corposeco');
    L2.tr(140, async () => {
      if (G.save.forms.includes('semente')) return;
      await talk([
        ['Anciã das sementes', 'Eu sei quem você é. Minha avó me contou, e a avó dela contou para ela.'],
        ['Anciã das sementes', 'Você carrega um pouco de cada povo agora. Não é seu. É emprestado.'],
        ['Anciã das sementes', 'Então use tudo junto. Semente, fogo, água, sopro. Uma coisa puxa a outra.'],
      ]);
      grantForm('semente');
      await wait(0.6);
      await talk([['Anciã das sementes', 'A Mata Atlântica foi a primeira a cair. Foi aqui que ele começou. No engenho velho, no meio das ruínas.']]);
      hint('<kbd>Q</kbd> troca de forma a qualquer hora · <kbd>U</kbd> raízes sob o inimigo', '<b>⟳</b> no alto troca de forma · <b>Especial</b>: raízes sob o inimigo', 7);
    });
    L2.tr(1420, async () => {
      if (G.save.echoes.includes('engenho')) return;
      G.camTarget = 1460 - W / 2; await wait(0.7);
      G.dark = 0.45; SFX.echo();
      await talk([
        ['', 'As ruínas do engenho. O eco aqui é forte demais para ignorar.'],
        ['', 'Um homem jovem, com uma cuia na mão, dá de beber a um trabalhador caído no sol.'],
        ['', 'Um senhor de terras oferece um saco de moedas: "A mata é sua, se você limpar o caminho. Os que vivem nela, mande embora."'],
        ['', 'Ele olha a cuia. Olha o ouro.'],
        ['', 'Joga a cuia no chão.'],
        ['', 'Queimou a mata, secou o rio, calou as vozes. Quando morreu, a terra não o quis.'],
      ]);
      G.dark = 0; G.camTarget = null;
      G.save.echoes.push('engenho'); writeSave(); showToast('Eco do Corpo-seco', ECHOES.engenho.t + ' · ' + G.save.echoes.length + '/6', 2.6);
    });
    return L2;
  },
  coracao() {
    const L2 = LV({ act: 6, biome: 'coracao', name: 'O coração da mata', w: 1440, start: 40 });
    L2.g(0, 1440);
    L2.pr('heart', 1340, null, {});
    const drop = (x, text, fn) => L2.tr(x, async () => { G.auto = 0; await talk([['', text]]); if (fn) fn(); SFX.lose(); });
    const loseForm = (f, col) => () => {
      const P = G.P; G.save.forms = G.save.forms.filter(k => k !== f);
      for (let i = 0; i < 20; i++) part(P.x + 5, P.y + 10, rnd(-80, -20), rnd(-80, 0), 1.4, col, 2, 30);
      const left = G.save.forms.filter(k => k !== 'espirito');
      setForm(left.length ? left[left.length - 1] : 'espirito');
    };
    L2.tr(120, async () => { await talk([['', 'O solo se abriu. Lá embaixo, o coração da mata bate devagar.'], ['Espírito', 'Tudo o que eu juntei pesa.'], ['', 'Cada passo é seu. Ninguém vai empurrar.']]); });
    drop(240, 'A zarabatana volta para a Amazônia.', loseForm('zarabatana', '#f2c14e'));
    drop(340, 'O arco e o fogo voltam para o Cerrado.', loseForm('arco', '#e0703a'));
    drop(440, 'A lança e o remo voltam para o Pantanal.', loseForm('lanca', '#7aaab0'));
    drop(540, 'A cabaça volta para a Caatinga.', loseForm('cabaca', '#d8b04a'));
    drop(640, 'As sementes voltam para a Mata Atlântica.', () => { loseForm('semente', '#8fe37a')(); setForm('espirito'); });
    drop(740, '', () => {});
    L2.triggers[L2.triggers.length - 1].fn = async () => {
      if (G.save.frag > 0) { await talk([['', 'A força que você arrancou dos guardiões volta para eles.']]); G.save.frag = 0; SFX.lose(); }
      else await talk([['', 'Você não tomou nada à força. Não há o que devolver.']]);
    };
    drop(830, 'A esquiva se desfaz.', () => { G.P.ab.dodge = false; });
    drop(920, 'O golpe se desfaz.', () => { G.P.ab.attack = false; G.P.ab.special = false; });
    drop(1010, 'O salto se desfaz.', () => { G.P.ab.jump = false; });
    drop(1100, 'A cabaça de memória se esvazia. O passo fica lento.', () => { G.P.ab.heal = false; G.P.flasks = 0; G.speedMul = 0.55; });
    L2.tr(1230, () => STORY.offer());
    L2.onStart = async () => { G.speedMul = 1; showToast('O coração da mata', 'abrir mão', 2.6); };
    return L2;
  },
};

const BOSS_INTRO = {
  mapinguari: [['', 'Árvores que ele mesmo guardava estão caídas ao redor.'], ['', 'O Mapinguari não reconhece mais a própria floresta.']],
  capelobo: [['', 'O capim estala. Alguma coisa respira ali dentro, com sede.']],
  paidomato: [['Pai do Mato', 'Você quebrou o pacto que nos fez.'], ['Pai do Mato', 'Mostre que ainda merece a mata.']],
  labatut: [['', 'Um gigante no fim do mundo. Ele olha para você como quem tenta lembrar uma palavra.']],
  corposeco: [['Corpo-seco', 'A terra não me quis.'], ['Corpo-seco', 'Então eu como a terra.']],
};

// Guardião menor do prólogo (usa o desenho do lobo-sombra)
BOSSES.lobo = {
  nome: 'GUARDIÃO MENOR', sub: 'o pacto já foi quebrado pelo outro lado',
  init: () => ({ w: 24, h: 15, hp: 110, contact: 12, vy: 0 }),
  update(B, dt) {
    const dx = pdx();
    if (B.y < GY || B.vy < 0) { B.vy += GRAV * dt; B.y += B.vy * dt; if (B.y >= GY) { B.y = GY; B.vy = 0; if (B.st === 'leap') { go(B, 'rest', 0.8); G.cam.shake = 2; SFX.land(); } } }
    switch (B.st) {
      case 'idle': if (B.tt <= 0) go(B, 'run', 2); break;
      case 'run': B.f = Math.sign(dx) || B.f; B.x += B.f * 80 * dt; if (Math.abs(dx) < 60 || B.tt <= 0) go(B, 'wind', 0.45); break;
      case 'wind': if (B.tt <= 0) { go(B, 'leap', 3); B.vy = -230; B.vx = B.f * 150; SFX.roar(); } break;
      case 'leap': B.x += B.vx * dt; B.hitDmg = 16; break;
      case 'rest': B.hitDmg = 0; if (B.tt <= 0) go(B, 'idle', 0.2); break;
    }
  },
  draw(B) { ctx.save(); ctx.translate(B.x, B.y); ctx.scale(1.35, 1.35); drawFauna(ctx, { type: 'lobo', f: B.f, flash: B.flash, x: B.x, t: B.t, vx: B.st === 'run' ? B.f * 80 : 0, st: B.st === 'leap' ? 'leap' : B.st === 'wind' ? 'wind' : 'run' }, 0, 0, B.t); ctx.restore(); },
};

// ---------- Roteiro ----------
const STORY = {
  async bossDown(B) {
    const k = B.kind, A = G.lvl.arena;
    musicSet('victory'); G.dark = 0; G.heatMul = 1; G.dynShade = [];
    await wait(CHEFES.espera(k));
    if (k === 'lobo') {
      await wait(0.5); B.alpha = 0;
      await talk([['', 'O guardião se desfaz em cinza. Ele não morreu: virou só o medo que ficou. E agora, nem isso.']]);
      G.boss = null; A.cleared = true; resetArena();
      G.auto = 1; await waitUntil(() => G.P.x > 1360); G.auto = 0; G.P.f = 1;
      const n = G.lvl.npcs[0]; n.anim = 'idle';
      return journeyPrologueGift();
    }
    if (k === 'mapinguari') return journeyMapinguariDown(B);
    const pre = {
      mapinguari: [['Mapinguari', '...a floresta... ninguém... canta mais...']],
      capelobo: [['Capelobo', '...sede... tanta sede...']],
      paidomato: [['Pai do Mato', 'Basta.'], ['Pai do Mato', 'Você ainda é digno. Mas romper a Lei teve um custo, e você vai sentir quando chegar a hora.']],
      labatut: [['Labatut', '...quem... eu... era...?']],
    }[k];
    await talk(pre);
    const tk = k === 'paidomato'
      ? [{ label: 'Poupar', sub: 'agradecer o teste e seguir' }, { label: 'Purificar', sub: 'tomar a força dele (+poder) — ele não está corrompido' }]
      : [{ label: 'Poupar', sub: 'sentar ao lado e lembrar junto' }, { label: 'Purificar', sub: 'arrancar a corrupção à força (+poder)' }];
    const c = await choose('O guardião está de joelhos.', tk);
    closeDialog();
    if (c === 0) {
      G.save.harmony[k] = 'poupar';
      const extra = {
        mapinguari: [['', 'Você se senta ao lado dele. Começa a contar a história dele, do jeito que o povo contava.'], ['Mapinguari', 'Eu lembro... das crianças que corriam com medo de mim e voltavam rindo.'], ['Mapinguari', 'O medo era uma história. Uma história que protegia.']],
        capelobo: [['', 'Você espera a sede dele passar. Leva tempo.'], ['Capelobo', 'Eu caçava à noite para que ninguém caçasse demais.'], ['Capelobo', 'Era isso que eu era. A noite que dava limite.']],
        paidomato: [['Pai do Mato', 'Obrigado por não tomar o que eu ofereci de graça.'], ['Pai do Mato', 'Os bichos lembram de quem respeita. Eu também.']],
        labatut: [['', 'Você conta a história dele para ele mesmo. Devagar.'], ['', 'Ele escuta como uma criança escuta pela primeira vez.'], ['Labatut', '...fim do mundo... eu guardava o fim do mundo. Para ninguém passar dele.']],
      }[k];
      await talk(extra);
    } else {
      G.save.harmony[k] = 'purificar'; G.save.frag++;
      for (let i = 0; i < 40; i++) part(B.x + rnd(-14, 14), B.y - rnd(0, B.h), (G.P.x - B.x) * rnd(0.8, 1.4), rnd(-40, 20), 1, pick(['#1c1622', '#3a3448', '#c8402e']), 2, 0);
      SFX.boom(); G.flash = 0.3; G.flashCol = '#c8402e';
      await wait(0.8);
      const t = {
        mapinguari: 'A corrupção sai dele como fumaça escura, e a força que sobra entra em você. Ele foge para a mata funda sem olhar para trás.',
        capelobo: 'Você arranca a sede dele à força. Ele uiva e some no capim queimado.',
        paidomato: 'Ele não resiste. Deixa você tomar. "Era isso que você queria?"',
        labatut: 'Você arranca o pouco que restava da fúria. Ele fica parado, vazio, olhando o sol.',
      }[k];
      await talk([['', t]]);
      showToast('Força do guardião', '+8% de dano', 2.2);
    }
    const lesson = {
      mapinguari: 'Você lembra: a memória pode ser recuperada. Vencer um guardião devolve lembranças, não só poder.',
      capelobo: 'Você lembra: cada guardião carrega uma história ferida. A luta não é só contra monstros.',
      paidomato: 'Você lembra: romper a Lei teve um custo. É preciso merecer o que se reconstrói.',
      labatut: 'Você lembra: o custo real do esquecimento não é morrer. É não saber mais quem se é.',
    }[k];
    SFX.echo(); await talk([['', lesson]]);
    const returnTo = typeof prepareCompanionReturn === 'function' ? prepareCompanionReturn(k) : null;
    // o guardião se desfaz em memória: luz subindo enquanto some
    for (let i = 0; i < 36; i++) {
      CHEFES.sai(B, i / 35);
      await wait(0.05);
    }
    G.flash = 0.3; G.flashCol = '#f4ecd8'; SFX.echo();
    G.boss = null; A.cleared = true;
    if (returnTo) return companionReturn(returnTo);
    if (k === 'capelobo') return enterGruta();
    return nextAct();
  },

  async paiAsk(B) {
    scene(async () => {
      await wait(0.6);
      await talk([['Pai do Mato', 'Espera.']]);
      const c = await choose('Diga, espírito. Por que levantou a mão contra os seus?', [
        { label: '"Para libertá-los."', sub: 'lutar é um ato de amor, não de ódio' },
        { label: '"Porque atacaram primeiro. Mereciam."', sub: '' },
      ], 'Pai do Mato');
      closeDialog();
      G.save.answer = c === 0 ? 'amor' : 'raiva'; writeSave();
      if (c === 0) await talk([['Pai do Mato', 'Então lute com isso no peito. Eu ainda vou testar você.']]);
      else { B.harsh = true; await talk([['Pai do Mato', 'Então você já começou a esquecer também.']]); }
      go(B, 'idle', 0.6);
    });
  },

  async corpoStill(B) {
    scene(async () => {
      G.boss.contact = 0; hud.boss.hidden = true; musicSet('victory');
      await wait(0.8);
      const [a0, a1] = arenaX();
      for (let k = 0; k < 14; k++) part(B.x, B.y - 16, rnd(-50, 50), rnd(-50, 20), 0.6, '#6a5a48');
      B.x = G.P.x + 5 < (a0 + a1) / 2 ? a1 - 24 : a0 + 24; B.f = Math.sign(G.P.x + 5 - B.x) || 1;
      await wait(0.6);
      await talk([['', 'Ele parou de atacar.']]);
      const ab = G.P.ab; ab.attack = false; ab.special = false;
      showToast('Aproxime-se', 'no seu tempo', 3);
      G.lock--;
      const lines = ['Tanta fome... e nada nunca encheu.', 'Eu tinha um nome. A água apagou. O fogo apagou.', 'Eu mesmo apaguei.'];
      let i = 0, lastT = -9;
      await waitUntil(() => {
        const d = Math.abs(G.P.x + 5 - B.x);
        if (!DQ && i < lines.length && d < 170 - i * 45 && G.rt - lastT > 1.6) { say('Corpo-seco', lines[i]).then(closeDialog); lastT = G.rt; i++; }
        return !DQ && i >= lines.length && G.rt - lastT > 1.2 && d < 30 && G.P.onG;
      }, Infinity);
      G.lock++;
      G.P.vx = 0; G.P.state = 'normal'; G.P.f = Math.sign(B.x - G.P.x) || 1;
      await talk([['Corpo-seco', 'Você ainda tem algo que eu nunca tive. Abriu mão da Lei pelos outros.']]);
      await choose('', [{ label: 'Estender a mão' }]);
      closeDialog();
      await talk([
        ['Corpo-seco', 'Eu escolhi errado. Toda vez.'],
        ['Corpo-seco', 'Toma o que sobrou de mim. Devolve pra ela.'],
        ['', 'Ele entrega o próprio espírito à mata.'],
      ]);
      // as raízes vêm buscá-lo: a terra o puxa para dentro
      VFX.play('terra/morte-corposeco', B.x, GY); SFX.boom();
      await wait(0.5);
      for (let k = 0; k < 64; k++) { B.fim = k / 63; G.cam.shake = Math.max(G.cam.shake || 0, 1.2); part(B.x + rnd(-12, 12), GY, rnd(-20, 20), rnd(-40, -10), 1, pick(['#6a5a48', '#6a3080', '#8fe37a']), 1, 40); await wait(0.05); }
      B.alpha = 0;
      G.cam.shake = 8; SFX.boom();
      await talk([['', 'A terra, que o rejeitava, finalmente o aceita.'], ['', 'E essa aceitação reabre o solo.']]);
      G.save.harmony.corposeco = 'aceito';
      ab.attack = true; ab.special = true;
      G.boss = null; G.lvl.arena.cleared = true;
      return nextAct();
    });
  },

  async offer() {
    G.auto = 0;
    G.P.fadeA = 1;
    if (typeof companionFinalMemory === 'function') await talk(companionFinalMemory());
    await talk([['', 'Diante do coração, tudo o que você acumulou se ergue de volta. A força de cada guardião. O jeito de cada povo.'], ['', 'Pode ser seu. Para sempre.']]);
    let tries = 0;
    for (;;) {
      const c = await choose('O que fazer com todo o poder?', [{ label: 'Absorver todo o poder', sub: tries ? 'a terra lembra' : '' }, { label: 'Deixar ir', sub: 'devolver às lendas e aos povos' }]);
      closeDialog();
      if (c === 1) break;
      tries++;
      G.flash = 0.6; G.flashCol = '#c8402e'; G.cam.shake = 10; SFX.boom();
      await wait(0.6);
      await talk(tries === 1
        ? [['', 'A terra treme.'], ['', 'Ela já rejeitou alguém que quis tudo para si. Não vai aceitar outro.']]
        : [['', 'A terra lembra.'], ['', 'É a mesma escolha que ele fez, no engenho, com a cuia na mão.']]);
    }
    await this.dissolve();
  },

  async dissolve() {
    const P = G.P;
    G.flags.noGlow = true;
    await talk([['', 'O espírito não morre.']]);
    G.rain = 0.2;
    const heart = G.lvl.props.find(p => p.kind === 'heart');
    for (let i = 0; i < 80; i++) {
      P.fadeA = Math.max(0, 1 - i / 70); G.rain = Math.min(1, 0.2 + i / 60);
      part(P.x + 5 + rnd(-6, 6), P.y + rnd(0, 22), rnd(-40, 60), rnd(-60, 10), 2, pick(['#8fe37a', '#f2c14e', '#9fc0d8', '#efe0c0']), pick([1, 2]), 20);
      if (i % 10 === 0) addHazard({ kind: 'proots', x: P.x - 30 + rnd(0, 60), y: GY - 26, w: 24, h: 26, life: 2, dmg: 0, team: 'p', set: new Set() });
      if (i === 40 && heart) heart.green = true;
      await wait(0.06);
    }
    P.hidden = true;
    await talk([['', 'Ele se desfaz em chuva, semente, vento e raiz.'], ['', 'Cada poder vira uma semente. E uma semente cai no coração de cada povo.'], ['', 'As lendas não voltam iguais. Vivem de ser contadas: o espírito não as restaura. Ele as devolve aos povos, para que sejam recontadas.']]);
    await fade(true);
    G.rain = 0;
    await this.epilogue();
  },

  async epilogue() {
    CONQ.fim();
    G.save.done = true; writeSave();
    $('#hud').hidden = true; $('#touch').classList.add('epi');
    musicSet('mata');
    const h = G.save.harmony, e = G.save.echoes;
    const mood = (k, ech) => h[k] === 'purificar' ? 'agr' : e.includes(ech) ? 'povo' : 'calm';
    const T = {
      mapinguari: { povo: 'Na Amazônia, o Mapinguari renasceu perto das aldeias. À noite ele ronda as roças, e quem derruba árvore demais ouve o grito dele.', calm: 'Na Amazônia, o Mapinguari dorme debaixo da samaúma. Só acorda quando alguém esquece de pedir licença à floresta.', agr: 'Na Amazônia, o Mapinguari renasceu arisco. Ninguém entra na mata funda sem lembrar o nome dele.' },
      capelobo: { povo: 'No Cerrado, o Capelobo voltou a caçar à noite, para que ninguém cace demais. As crianças aprendem o rastro dele antes de aprender o caminho.', calm: 'No Cerrado, o Capelobo anda quieto pelo capim. O fogo antigo voltou a queimar sem matar a raiz.', agr: 'No Cerrado, o Capelobo renasceu faminto de medo. As fogueiras ficam acesas até de manhã.' },
      paidomato: { povo: 'No Pantanal, o Pai do Mato anda sobre a água ao lado dos canoeiros. Ainda testa quem chega. Mas agora sorri.', calm: 'No Pantanal, o Pai do Mato guarda os bichos em silêncio, como sempre guardou.', agr: 'No Pantanal, o Pai do Mato não esqueceu que você tomou a força dele. Guarda os bichos, e desconfia de quem chega.' },
      labatut: { povo: 'Na Caatinga, o Labatut lembrou quem era, porque o povo voltou a contar. Na seca, ele guarda os poços.', calm: 'Na Caatinga, o Labatut caminha devagar no fim do mundo. Lembra pouco, mas lembra o bastante.', agr: 'Na Caatinga, o Labatut renasceu bravo como o sol do meio-dia. Os viajantes respeitam a sombra.' },
    };
    const stops = [
      ['amazonia', 'mapinguari', 'machado', 'mestraA'], ['cerrado', 'capelobo', 'lanterna', 'arqueira'], ['pantanal', 'paidomato', 'escritura', 'canoeiro'], ['caatinga', 'labatut', 'poco', 'lanceira'],
    ];
    G.state = 'scene';
    for (const [bio, k, ech, npc] of stops) {
      const m = mood(k, ech);
      const fake = { kind: k, x: 200, y: k === 'paidomato' ? 152 : GY, f: -1, t: 0, st: 'idle', flash: 0, mood: m, hits: 0 };
      G.sceneDraw = t => { fake.t = t; epiScene(bio, t, () => { BOSSES[k].draw(fake); if (m === 'povo') drawHuman(ctx, 150, GY, 1, { kind: 'idle', t }, NPC[npc]); }); };
      await fade(false);
      const lines = [['', T[k][m]]];
      if (k === 'paidomato' && G.save.answer === 'amor') lines.push(['', 'Os canoeiros contam que o espírito respondeu: "para libertá-los". E que o Pai do Mato guardou essa resposta.']);
      await talk(lines);
      await fade(true);
    }
    G.sceneDraw = t => epiScene('mata', t, () => { ctx.globalAlpha = 0.6; drawBoss({ kind: 'corposeco', x: 210, y: GY, f: -1, t, st: 'still', flash: 0, alpha: 0.35 }); ctx.globalAlpha = 1; });
    await fade(false);
    await talk([['', 'Na Mata Atlântica, o Corpo-seco não voltou como guardião. Voltou como história de advertência: a de um homem que quis tudo, e da chance que ele teve de voltar atrás.']]);
    await fade(true);
    G.sceneDraw = t => {
      ctx.drawImage(biome('prologo').sky, 0, 0); rect(ctx, 0, GY, W, 30, '#191c25'); rect(ctx, 0, GY, W, 2, '#3b4252');
      softGlow(ctx, 160, 140, 90, 65, '#ffb050', 0.3);
      drawFire(ctx, 160, GY, t, true);
      drawHuman(ctx, 132, GY, 1, { kind: 'kneel', t }, NPC.ancia);
      drawChild(ctx, 188, GY, -1);
      for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i / 3) % 1; ctx.globalAlpha = 1 - k; rect(ctx, 160 + Math.sin(k * 6 + i) * 4, GY - 14 - k * 50, 1, 1, '#ffd27a'); }
      ctx.globalAlpha = 1;
    };
    await fade(false);
    await talk([
      ['Anciã', '...e foi assim que o espírito virou chuva, semente, vento e raiz.'],
      ['Criança', 'E ele ainda está aqui?'],
      ['Anciã', 'Enquanto a gente contar, está.'],
      ['', 'O pacto agora está nas pessoas.'],
    ]);
    await fade(true);
    G.state = 'card';
    await showCard('Fim', 'A Terra que Rejeitou', `Ecos encontrados: ${e.length}/6 · ${CONQ.resumo()}`, 'Mundo fictício, inspirado nos biomas e nos povos do Brasil. Mapinguari, Capelobo, Pai do Mato, Labatut e Corpo-seco vêm de lendas contadas pelo país; o pacto, a Lei antiga e os ecos são criações do jogo. Obrigado por jogar.', 2);
    G.save = newSave(); G.save.done = true; writeSave(); clearSave();
    location.reload();
  },
};
function epiScene(bio, t, fg) {
  const b = biome(bio);
  drawBackground(b, t * 12, t);
  rect(ctx, 0, GY, W, 30, b.ground.fill); rect(ctx, 0, GY, W, 2, b.ground.top);
  if (bio === 'pantanal') { ctx.globalAlpha = 0.55; rect(ctx, 0, 152, W, 30, '#5a3a7a'); ctx.globalAlpha = 1; }
  fg();
  for (let i = 0; i < 20; i++) { const x = (hash(i) * W + t * 8 * (hash(i + 1) - 0.5)) % W, y = 60 + hash(i + 2) * 90 + Math.sin(t + i) * 4; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + i); rect(ctx, x, y, 1, 1, b.motes); }
  ctx.globalAlpha = 1;
}

// ---------- Título ----------
function renderTitle(t) {
  const b = biome('prologo');
  drawBackground(b, t * 6, t);
  rect(ctx, 0, GY, W, 30, b.ground.fill); rect(ctx, 0, GY, W, 2, b.ground.top);
  softGlow(ctx, W / 2, GY - 13, 28, 35, '#8a7ab0', 0.25 + Math.sin(t * 3) * 0.04);
  drawHuman(ctx, W / 2, GY, 1, { kind: 'idle', t }, SPEC.espirito);
  for (let i = 0; i < 24; i++) { const x = (hash(i) * W + t * 6 * (hash(i + 1) - 0.5) * 2 + W) % W, y = 40 + hash(i + 2) * 110 + Math.sin(t * 0.7 + i) * 6; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)); rect(ctx, x, y, 1, 1, '#b8b0e0'); }
  ctx.globalAlpha = 1;
}
const titleNav = { sel: 0 };
function setupTitle() {
  if (G.teste) { const m = document.createElement('div'); m.textContent = 'MODO DE TESTE'; m.style.cssText = 'position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:70;pointer-events:none;font-size:12px;padding:1px 6px;color:#1a110b;background:#f2c14e'; document.body.appendChild(m); }
  const s = loadSave();
  const bc = $('#bContinue');
  if (s && !s.done) { bc.hidden = false; bc.innerHTML = `Continuar <small>${CARDS[s.act][0]} · ${CARDS[s.act][1]}</small>`; }
  $('#bKeys').insertAdjacentHTML('afterend', '<button class="btn" id="bSom">Som</button>');
  $('#bSom').onclick = async () => { audioInit(); $('#title').hidden = true; await soundMenu(); $('#title').hidden = false; };
  $('#bKeys').insertAdjacentHTML('beforebegin', '<button class="btn" id="bConq">Conquistas</button><button class="btn" id="bEst">Estatísticas</button>');
  const tela = html => async () => { audioInit(); $('#title').hidden = true; await menu(html()); $('#title').hidden = false; };
  $('#bConq').onclick = tela(() => CONQ.conquistasHTML());
  $('#bEst').onclick = tela(() => CONQ.estatisticasHTML(loadSave()));
  navMark($('#title'), 0);
  bc.onclick = () => { audioInit(); G.save = s; startGame(false); };
  $('#bNew').onclick = async () => {
    audioInit();
    if (s && !s.done) { $('#title').hidden = true; const a = await menu('<h2>Novo jogo</h2><p>Começar de novo apaga o progresso salvo.</p><div class="btns"><button class="btn" data-act="ok">Começar do início</button><button class="btn" data-act="back">Voltar</button></div>'); if (a !== 'ok') { $('#title').hidden = false; return; } }
    clearSave(); G.save = newSave();
    await tocarAbertura();
    startGame(true);
  };
  $('#bKeys').onclick = async () => { $('#title').hidden = true; await menu(keysHTML()); $('#title').hidden = false; };
}
async function startGame(fresh) {
  $('#title').hidden = true;
  musicSet('theme');
  G.state = 'card';
  if (fresh) {
    await showCard('', 'Uma brasa ainda acesa', '', 'Um assobio atravessa a mata. Há alguém cuidando do fogo.', 0.8);
  }
  enterAct(G.save.act);
}

// ---------- Laço principal ----------
function updatePlatforms() {
  for (const s of G.lvl.solids) if (s.move) {
    const k = Math.sin(G.t * s.move.spd);
    const nx = s.ox + k * (s.move.dx || 0), ny = s.oy + k * (s.move.dy || 0) + (s.move.canoe ? Math.sin(G.t * 2.3 + s.ox) * 0.6 : 0);
    s.mdx = nx - s.x; s.mdy = ny - s.y; s.x = nx; s.y = ny;
  }
}
function update(dt) {
  G.t += dt;
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  updatePlatforms();
  updateJourney(dt);
  updatePlayer(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateProjs(dt);
  updateHazards(dt);
  updateCave(dt);
  updateParts(dt);
  updateCamera(dt);
  G.flash -= dt;
  if (G.state !== 'play') return;
  checkTriggers(); checkArena(); checkInteract();
}
let last = 0;
// Um erro aqui dentro não pode parar o laço, ou o jogo congela para sempre: perde-se um quadro e segue.
function frame(ts) {
  try { quadro(ts); } catch (err) {
    console.error(err);
    ctx.setTransform(cv.renderScale, 0, 0, cv.renderScale, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  requestAnimationFrame(frame);
}
function quadro(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
  pollInput(); musicTick(); journeyAmbience(dt);
  if (I.pressed.debug) G.debug = !G.debug;
  G.rt += dt;
  for (const w of G.waits.slice()) { if (w.fn ? w.fn() : (w.t -= (DQ || UI.menu ? 0 : dt)) <= 0) { G.waits.splice(G.waits.indexOf(w), 1); w.res(); } }
  if (G.state === 'intro') introTick();
  else if (UI.card) cardTick();
  else if (UI.menu) navTick(mPanel, UI.menu);
  else if (UI.dialog) dialogTick(dt);
  else if (G.state === 'title') { if (!$('#title').hidden && !INTRO.veu) navTick($('#title'), titleNav); }
  else if (G.state === 'play') {
    if (I.pressed.pause && !G.lock) pauseMenu();
    else if (I.pressed.inv && !G.lock) openInventory();
    else if (!(G.hitstop > 0)) update(dt);
  } else if (G.state === 'scene') { G.t += dt; }
  const fundoParado = G.state === 'play' && UI.dialog && CONV.partner && G.rt - CONV.t0 > 0.4 && !G.trans;
  if (G.hitstop > 0) G.hitstop -= dt; else if (!UI.menu && !G.paused && !(fundoParado && CONV.fundoOk)) VFX.update(dt);
  if (G.state === 'play' && !UI.menu && !G.paused) CONQ.tick(dt);
  if (G.state === 'play' || G.state === 'scene') {
    if (G.state === 'play' && UI.dialog) { G.t += dt * 0.15; updateParts(dt * 0.3); }
  }
  ctx.clearRect(0, 0, W, H);
  if (G.state === 'title') { ctx.save(); ctx.translate(0, DY); renderTitle(G.rt); ctx.restore(); }
  else if (G.state === 'scene' && G.sceneDraw) { ctx.save(); ctx.translate(0, DY); G.sceneDraw(G.rt); ctx.restore(); }
  else if (G.lvl && G.P) {
    if (fundoParado && CONV.fundoOk) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.nativeDrawImage(fundoC, 0, 0); ctx.restore(); }
    else { renderWorld(); if (fundoParado) { fundoX.save(); fundoX.setTransform(1, 0, 0, 1, 0, 0); fundoX.clearRect(0, 0, fundoC.width, fundoC.height); fundoX.nativeDrawImage(cv, 0, 0); fundoX.restore(); CONV.fundoOk = true; } }
    drawHudCanvas(); if (G.state === 'play' && UI.dialog && CONV.partner) drawConversation(); if (G.trans) drawTransition(); }
  else { rect(ctx, 0, 0, W, H, '#000'); }
  if (G.state === 'play') updateHud();
}

setupTouch();
layout();
setupTitle();
setupIntro();
requestAnimationFrame(frame);
