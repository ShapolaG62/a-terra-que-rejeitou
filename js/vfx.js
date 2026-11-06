'use strict';
// Efeitos visuais do pixelfx dentro do jogo (biblioteca em vendor/pixelfx, efeitos próprios em vendor/pixelfx/src/fx/terra,
// tudo reunido em js/pixelfx.bundle.js por tools/build-vfx.mjs). São só visuais: não mudam dano, colisão nem hitbox.
// As cores vão num buffer normal e a luz num buffer somado à cena, como a biblioteca recomenda.

const VFX = (() => {
  const { createFrame, createFx, PAL, fx: LIB } = PXFX;
  // dois buffers que são o próprio ImageData, assim basta um putImageData
  const imgC = new ImageData(W, H), imgL = new ImageData(W, H);
  const frame = createFrame(W, H, 0, -DY);
  frame.color = new Uint32Array(imgC.data.buffer); frame.light = new Uint32Array(imgL.data.buffer);
  // telas de 1 pixel por unidade do jogo, de propósito: não usam mk(), que dobra a resolução (putImageData escreve em pixels crus)
  const buffer = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
  // cada camada tem as suas telas, para poder repetir o último desenho sem recalcular
  const camadas = {};
  const camada = nome => camadas[nome] || (camadas[nome] = (() => { const [c, x] = buffer(), [cl, xl] = buffer(); return { c, x, cl, xl, vez: 0, cx: 0, x0: 0, y0: 0, bw: 0, bh: 0, lit: false, pronta: false }; })());
  let list = [], kept = {}, tick = 0, air = [];
  // qualidade: 0 cheia; 1 redesenha tudo em meia taxa e usa menos efeitos; 2 também tira o ambiente. Só desce, e sozinha.
  let Q = 0, media = 1 / 60, desde = 0;
  const TETO = [24, 14, 8];

  const seed = () => 1 + (Math.random() * 1e6 | 0);
  function add(id, x, y, o = {}) {
    const mod = LIB[id]; if (!mod) return null;
    if (list.length >= TETO[Q]) return null;
    const { delay = 0, dur = 0, ...opts } = o; let layer = o.layer || 'front'; delete opts.layer;
    if (layer === 'front' && G.lvl && G.lvl.cave) layer = 'top';
    for (const k in opts) if (opts[k] === undefined) delete opts[k];
    const e = { fx: createFx(mod, { seed: seed(), ...opts, x: Math.round(x), y: Math.round(y) }), layer, delay, dur, age: 0 };
    list.push(e); return e;
  }
  const play = (id, x, y, o) => add(id, x, y, o);
  // efeito que dura enquanto alguém o pede a cada quadro (fogueira, tornado, sol); some sozinho quando param de pedir
  function keep(key, id, x, y, o) {
    let e = kept[key];
    if (!e) { e = kept[key] = add(id, x, y, o); if (!e) { delete kept[key]; return; } }
    e.seen = tick; e.fx.options.x = Math.round(x); e.fx.options.y = Math.round(y);
  }
  // um efeito que dá erro é só um enfeite: sai de cena e o jogo continua
  function descarta(e, err) { e.ruim = true; e.layer = null; console.error('efeito descartado:', err); }
  function afere(dt) {
    media += (dt - media) * 0.02; desde++;
    if (Q < 2 && desde > 150 && media > 0.026) {
      Q++; desde = 0;
      if (Q === 2) { for (const a of air) if (a) a.fx.stop(); air = []; }
    }
  }
  function update(dt) {
    tick++; afere(dt);
    for (const k in kept) if (kept[k].seen < tick - 2) { kept[k].fx.stop(); delete kept[k]; }
    for (const e of list) {
      if (e.delay > 0) { e.delay -= dt; continue; }
      try { e.fx.update(dt); } catch (err) { descarta(e, err); continue; }
      e.age += dt;
      if (e.dur && e.age > e.dur) e.fx.stop();
    }
    list = list.filter(e => !e.ruim && !e.fx.done());
  }
  function mostra(S) {
    if (!S.bw || !S.bh) return;
    ctx.drawImage(S.c, S.x0, S.y0, S.bw, S.bh, S.cx + S.x0, S.y0 - DY, S.bw, S.bh);
    if (S.lit) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(S.cl, S.x0, S.y0, S.bw, S.bh, S.cx + S.x0, S.y0 - DY, S.bw, S.bh); ctx.globalCompositeOperation = 'source-over'; }
  }
  function render(layer, cx) {
    const S = camada(layer);
    S.vez++;
    // o ambiente muda devagar: basta recalcular em quadros alternados (e tudo, se a máquina estiver sofrendo)
    if (S.pronta && S.vez % 2 && (Q > 0 || layer === 'air' || layer === 'back')) return mostra(S);
    let x0 = W, y0 = H, x1 = 0, y1 = 0, any = false;
    frame.ox = cx; frame.oy = -DY;
    for (const e of list) {
      if (e.layer !== layer || e.delay > 0) continue;
      const m = e.fx.meta, o = e.fx.options, [w, h] = m.size || [W, H], [ox, oy] = m.origin || [0, 0];
      const left = (o.flip ? o.x - (w - ox) : o.x - ox) - cx - 8, top = o.y - oy + DY - 8;
      if (left > W || left + w + 16 < 0 || top > H || top + h + 16 < 0) continue;
      if (!any) { frame.color.fill(0); frame.light.fill(0); any = true; }
      try { e.fx.draw(frame); } catch (err) { descarta(e, err); continue; }
      x0 = Math.min(x0, left); y0 = Math.min(y0, top); x1 = Math.max(x1, left + w + 16); y1 = Math.max(y1, top + h + 16);
    }
    S.pronta = true; S.bw = S.bh = 0; S.lit = false; S.cx = cx;
    if (!any) return;
    x0 = Math.max(0, x0 | 0); y0 = Math.max(0, y0 | 0); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
    const bw = x1 - x0, bh = y1 - y0;
    if (bw <= 0 || bh <= 0) return;
    S.x0 = x0; S.y0 = y0; S.bw = bw; S.bh = bh;
    S.x.putImageData(imgC, 0, 0, x0, y0, bw, bh);
    // a luz soma com o que já está na tela (precisa de alfa cheio para somar tudo)
    const Lb = frame.light;
    for (let y = y0; y < y1; y++) for (let i = y * W + x0, e = i + bw; i < e; i++) if (Lb[i] & 0xffffff) { Lb[i] |= 0xff000000; S.lit = true; }
    if (S.lit) S.xl.putImageData(imgL, 0, 0, x0, y0, bw, bh);
    mostra(S);
  }

  // ---------- ambiente de cada bioma ----------
  const AR = {
    prologo: { kind: 'cinzas', palette: ['#2a2c3a', '#5a6078', '#8a90a8', '#c8cce0'] },
    amazonia: { kind: 'folhas', palette: ['#2a5226', '#4a842c', '#8cbc3a', '#d8c84a'] },
    cerrado: { kind: 'brasas', palette: ['#3a1a10', '#c8402e', '#ff9a3a', '#ffd27a'] },
    gruta: { kind: 'gruta', palette: ['#1c1714', '#6a5a4a', '#a89880', '#9fd0e0'] },
    pantanal: { kind: 'vagalumes', palette: ['#2a3a10', '#7aa82a', '#c8f05a', '#f4ffb8'], bichos: true },
    caatinga: { kind: 'poeira', palette: ['#5a3e2e', '#a88860', '#d8c098', '#f4e6c4'] },
    mata: { kind: 'sementes', palette: ['#6a5a3a', '#c8c0a0', '#e8e4d0', '#ffffff'] },
    coracao: { kind: 'vagalumes', palette: ['#10303a', '#2a8a8a', '#7af0e0', '#e0fff8'] },
  };
  const DUST = { prologo: PAL.smoke, amazonia: PAL.earth, cerrado: PAL.ember, gruta: PAL.stone, pantanal: PAL.earth, caatinga: PAL.dust, mata: PAL.earth, coracao: PAL.cyber };
  function setLevel(L) {
    list = []; kept = {}; air = [];
    for (const k in camadas) { camadas[k].pronta = false; camadas[k].bw = 0; }
    const A = AR[L.biome]; if (!A || Q >= 2) return;
    air.push(add('terra/ar', 0, -DY, { kind: A.kind, palette: A.palette, bichos: A.bichos, seed: 7, layer: 'air' }));
  }
  // o que depende da câmera e do estado da luta, a cada quadro
  function world(cx) {
    for (const a of air) if (a) { const o = a.fx.options; o.x = cx; o.camx = cx; }
    const B = G.boss;
    if (B && B.sunT > 0) keep('sol', 'holy/sunburst', cx + W / 2, 24, { layer: 'front', light: 0.7 });
  }

  // ---------- momentos do jogo ----------
  const FORM_FX = {
    espirito: [['melee/sword-slash', { radius: 32 }]],
    zarabatana: [['melee/sword-slash', { radius: 34, palette: PAL.leaf }]],
    arco: [['melee/sword-slash', { radius: 36, palette: PAL.fire }], ['melee/double-slash', { palette: PAL.fire }], ['melee/spin-slash', { radius: 38, palette: PAL.fire }]],
    lanca: [['melee/thrust', { reach: 52, palette: PAL.water }]],
    cabaca: [['melee/thrust', { reach: 44, palette: PAL.gold }]],
    semente: [['melee/sword-slash', { radius: 38, palette: PAL.heal }]],
  };
  function slash(P) {
    const opts = FORM_FX[P.form] || FORM_FX.espirito, [id, o] = opts[Math.min(P.combo || 0, opts.length - 1)];
    play(id, P.x + 5, P.y + P.h, { ...o, flip: P.f < 0, delay: (P.def.act && P.def.act[0]) || 0.06 });
  }
  const stop = s => { G.hitstop = Math.max(G.hitstop || 0, s); };
  function hitE(e, dir, o) {
    play('impacts/hit-spark', e.x + e.w / 2, e.y + e.h, { height: Math.max(5, e.h / 2), flip: dir < 0 });
    if (o.melee) stop(0.035);
  }
  function kill(e, eye) {
    const cx = e.x + e.w / 2, gy = e.y + e.h;
    play('spawn/poof', cx, gy, { palette: ['#0c0a10', '#1c1622', '#3a2e44', '#5a4e68', eye, '#ffffff'], stars: [eye, eye, '#ffffff'] });
    play('terra/memoria', cx, gy, { count: 9 });
    stop(0.05);
  }
  function hitB(B, dir, o) {
    play('impacts/hit-spark', B.x, B.y, { height: Math.max(12, B.h * 0.6), flip: dir < 0, palette: PAL.lava });
    if (o.melee) { play('impacts/blunt-hit', B.x + (dir || 0) * 6, B.y, { height: Math.max(12, B.h * 0.55) }); stop(0.04); }
  }
  function bossDown(B) {
    play('impacts/crit-hit', B.x, B.y, { height: Math.max(14, B.h * 0.6), flip: B.f > 0 });
    stop(0.16);
  }
  const hurt = P => { play('impacts/hit-spark', P.x + 5, P.y + P.h, { height: 16, palette: PAL.blood, flip: P.f > 0 }); stop(0.05); };
  const heal = P => { play('holy/heal-aoe', P.x + 5, P.y + P.h, { reach: 34, palette: PAL.gold, dur: 1.2 }); play('terra/memoria', P.x + 5, P.y + P.h, { count: 14, palette: ['#4a2c08', '#c48412', '#ffe066', '#fff6c4', '#ffffff'] }); };
  const dust = (x, y, dir, power) => play('terra/poeira', x, y, { dir, power, palette: DUST[G.lvl.biome] || PAL.dust });
  const queda = (x, y) => play('terra/jato', x, y, { impacto: true, palette: G.lvl.biome === 'pantanal' ? ['#5a3a7a', '#8a6ab0', '#c8b0e0', '#e8d8f0', '#ffffff'] : undefined });
  const splash = (x, y) => play('water/splash', x, y, { stone: false, palette: G.lvl.biome === 'pantanal' ? ['#2a1a4a', '#5a3a7a', '#8a6ab0', '#c8b0e0', '#e8d8f0', '#ffffff'] : PAL.water });
  const memory = (x, y, count = 22) => play('terra/memoria', x, y, { count });
  function chest(c) {
    play('pickups/collect-burst', c.x, c.y, { palette: PAL.gold });
    play('terra/memoria', c.x, c.y, { count: 18, palette: ['#4a2c08', '#c48412', '#ffe066', '#fff6c4', '#ffffff'] });
  }
  function burst(x, y) { const d = DUST[G.lvl.biome] || PAL.dust; play('impacts/ground-slam', x, y, { reach: 56, palette: d, stone: d[3], dur: 1.4 }); }
  const form = P => { play('holy/holy-pillar', P.x + 5, P.y + P.h, { dur: 2 }); play('holy/feather-burst', P.x + 5, P.y + 4); };
  const death = P => play('spawn/soul-rise', P.x + 5, P.y + P.h);
  const respawn = P => play('holy/heal-aoe', P.x + 5, P.y + P.h, { reach: 60, palette: PAL.ember });
  const rest = (x, y) => play('holy/heal-aoe', x, y, { reach: 70, palette: PAL.ember });
  const blink = B => { play('explosions/implosion', B.x, B.y - 34, { palette: PAL.shadow }); };

  return { conta: () => list.length, qual: () => Q, play, keep, update, render, setLevel, world, slash, hitE, kill, hitB, bossDown, hurt, heal, dust, splash, queda, memory, chest, burst, form, death, respawn, rest, blink, PAL };
})();
