'use strict';
// O jeito de cada chefe: como o corpo se move em cada golpe, os efeitos desses golpes e a sua morte.
// Tudo aqui é só visual: não muda dano, colisão nem caixa de acerto.
const CHEFES = (() => {
  const sat = v => clamp(v, 0, 1);
  const suave = v => { const u = sat(v); return u * u * (3 - 2 * u); };

  // ---------- Paletas ----------
  const BRASA = ['#2a0a06', '#6a1a0a', '#c8401a', '#ff8a2a', '#ffd06a', '#fff4d0'];
  const MUSGO = ['#1c1610', '#3a2c1c', '#5a6a2c', '#8a9a48', '#c8c878', '#f0ecc0'];
  const FOLHA = ['#123818', '#2f7a2a', '#6cb83a', '#a8d858', '#e0f090', '#fafff0'];
  const AGUA = ['#0e2e5a', '#1c76bc', '#5ab8ec', '#b8e8ff', '#ffffff'];
  const AREIA = ['#2a2018', '#5a4a38', '#8a7a64', '#b8a68a', '#e0d0b0', '#fff8e0'];
  const FERRUGEM = ['#2a1208', '#6a2c12', '#a85a26', '#d89a54', '#f4d8a0', '#fff6e0'];
  const ROXO = ['#2a1040', '#4f1f78', '#8a3cc0', '#c070f0', '#f0b0ff', '#ffffff'];
  const MATA = ['#1c5a20', '#3a9a30', '#6cd040', '#a8f058', '#e0ff90', '#ffffff'];
  // cor com que o corpo acende na preparação de um golpe
  const AVISO = { lobo: '#ffffff', mapinguari: '#e8f090', capelobo: '#ff9060', paidomato: '#c8ffb0', labatut: '#ffd080', corposeco: '#e0a0ff' };
  const FRIO = ['#0a1a3a', '#1a4a8a', '#2a8ad0', '#7ae0ff', '#d8f8ff', '#ffffff'];
  const LUA = ['#14141c', '#2e2e3a', '#5a5a6c', '#8a8ca0', '#c8cadc', '#ffffff'];

  // efeito na frente do chefe: dx para onde ele olha, dy para cima a partir dos pés
  const fx = (id, dx, dy, o) => B => VFX.play(id, B.x + B.f * dx, B.y - dy, { flip: B.f < 0, ...o });
  const poeira = (dx, power, palette) => B => VFX.play('terra/poeira', B.x + B.f * dx, B.y, { dir: B.f, power, palette });
  const tudo = (...fs) => B => { for (const f of fs) f(B); };
  const treme = n => () => { G.cam.shake = Math.max(G.cam.shake || 0, n); };

  // ---------- Golpes ----------
  // estado em que entrou -> efeitos. 'fim:X' roda ao sair de X para a recuperação (o golpe acabou de bater).
  const GOLPES = {
    lobo: {
      wind: poeira(-6, 0.6, LUA),
      leap: fx('melee/claw-swipe', 4, 4, { palette: LUA, sparks: ['#ffffff', '#c8cadc', '#8a8ca0', '#5a5a6c'], dur: 0.5 }),
    },
    mapinguari: {
      chargeW: poeira(-14, 1, MUSGO),
      claw: fx('melee/claw-swipe', 14, 22, { palette: MUSGO, sparks: ['#f0ecc0', '#c8c878', '#8a9a48', '#5a6a2c'], dur: 0.55 }),
      bite: fx('melee/claw-swipe', 18, 34, { palette: MUSGO, sparks: ['#ffffff', '#f0ecc0', '#c8c878', '#8a9a48'], dur: 0.4 }),
      slam: tudo(fx('nature/quake', 14, 0, { palette: AREIA, dur: 1.1 }), treme(4)),
    },
    capelobo: {
      clawW: poeira(-6, 0.5, BRASA),
      claw: fx('melee/claw-swipe', 6, 14, { palette: BRASA, dur: 0.5 }),
      leapW: poeira(-8, 1, BRASA),
      'fim:leap': tudo(fx('impacts/heavy-landing', 0, 0, { palette: BRASA, stone: '#4a1a0c', dur: 0.9 }), treme(3)),
      hide: fx('spawn/poof', 0, 12, { palette: BRASA }),
      ambush: tudo(fx('melee/claw-swipe', 8, 10, { palette: BRASA, dur: 0.5 }), poeira(-8, 1, BRASA)),
      howl: tudo(fx('terra/uivo', 12, 42, { palette: ['#5a1a0a', '#c8401a', '#ffb070', '#ffe0c8', '#ffffff'] }), treme(3)),
    },
    paidomato: {
      staff: fx('nature/vine-whip', 6, 6, { dur: 0.9, palette: MATA, light: 1 }),
      birdsW: fx('nature/leaf-storm', 0, 6, { dur: 1, palette: ['#3a6a50', '#6aa080', '#a0d0a8', '#d0f0c8', '#f0ffe0', '#ffffff'], light: 1 }),
      'fim:jacareW': fx('terra/jato', 26, 4, { impacto: true }),
      'fim:waveW': fx('terra/jato', 26, 4, { impacto: true }),
    },
    labatut: {
      rockW: poeira(-10, 0.8, AREIA),
      grab: poeira(-12, 1.2, AREIA),
      sunW: fx('holy/sunburst', 0, 40, { dur: 1 }),
      slash: fx('melee/heavy-cleave', 8, 0, { palette: FERRUGEM, stone: '#6a2c12', dur: 0.95 }),
      'fim:stompW': tudo(fx('impacts/heavy-landing', 14, 0, { palette: AREIA, stone: '#5a4a38', dur: 1 }), fx('nature/quake', 14, 0, { palette: AREIA, dur: 1 }), treme(5)),
    },
    corposeco: {
      scratch: fx('melee/scythe-reap', 0, 0, { palette: ROXO, dur: 0.95, light: 1 }),
      rootsW: fx('shadow/grasping-hands', 18, 0, { dur: 1.2, palette: ROXO, light: 1 }),
      drainW: fx('shadow/soul-drain', 8, 26, { dur: 1.2, palette: ROXO, soul: ['#7a1a20', '#e8402e', '#ffb090', '#ffffff'], light: 1 }),
      summon: fx('shadow/hex-sigil', 0, 0, { dur: 1.3, palette: ROXO, light: 1 }),
      rainW: fx('shadow/curse', 0, 8, { dur: 1.1, palette: ROXO, light: 1 }),
    },
    boitata: {
      chargeW: fx('fire/spirit-flame', 16, 0, { palette: BRASA, dur: 0.8 }),
      tailW: fx('fire/fire-ring', -30, 0, { palette: BRASA, dur: 0.7 }),
      fireW: fx('fire/spirit-flame', 20, 0, { palette: BRASA, dur: 0.9 }),
      breathW: fx('fire/fire-breath', 18, 4, { palette: BRASA, dur: 1 }),
      diveW: fx('fire/flame-pillar', 0, 0, { palette: BRASA, height: 100, dur: 1.1 }),
      stun: fx('impacts/crit-hit', 0, 0, { palette: BRASA, height: 22 }),
    },
  };

  // ---------- O corpo em cada estado ----------
  // sx/sy esticam e achatam a partir dos pés; rot inclina (positivo = para onde olha); dx/dy deslocam.
  // k é o peso: alto é nervoso, baixo é lento e pesado. 'seco' faz o movimento saltar em vez de deslizar.
  const CORPO = {
    lobo: {
      k: 24,
      wind: () => ({ sx: 1.18, sy: 0.74, rot: -0.1 }),
      leap: () => ({ sx: 0.9, sy: 1.16, rot: 0.2 }),
      run: e => ({ sx: 1.06, sy: 0.96 + Math.sin(e * 22) * 0.05 }),
      rest: e => ({ sx: 1.02, sy: 0.94 + Math.sin(e * 9) * 0.04 }),
    },
    mapinguari: {
      k: 11,
      base: e => ({ sx: 1 + Math.sin(e * 1.6) * 0.012, sy: 1 - Math.sin(e * 1.6) * 0.016 }),
      walk: e => ({ rot: Math.sin(e * 4.2) * 0.035, sy: 1 - Math.abs(Math.sin(e * 4.2)) * 0.03 }),
      biteW: () => ({ rot: -0.1, sy: 1.05 }),
      bite: () => ({ rot: 0.15, dx: 5, sx: 1.05 }),
      clawW: () => ({ rot: -0.12, sx: 0.96, sy: 1.05 }),
      claw: () => ({ rot: 0.14, dx: 6, sx: 1.08 }),
      slamW: () => ({ sy: 1.14, sx: 0.94, rot: -0.1, dy: -3 }),
      slam: () => ({ sy: 0.82, sx: 1.2, rot: 0.08 }),
      gasW: e => ({ sx: 1.04 + e * 0.03, sy: 1.04 + e * 0.03, rot: -0.05 }),
      gas: e => ({ sx: 1.08 - Math.min(e, 1) * 0.08, sy: 1.02, rot: 0.08 }),
      chargeW: () => ({ sy: 0.84, sx: 1.14, rot: 0.1 }),
      charge: e => ({ rot: 0.14 + Math.sin(e * 14) * 0.02, sx: 1.06 }),
    },
    capelobo: {
      k: 26,
      base: e => ({ sy: 0.97 + Math.sin(e * 5) * 0.02, rot: 0.04 }),
      stalk: e => ({ sx: 1.08, sy: 0.9, rot: 0.1 + Math.sin(e * 15) * 0.03 }),
      clawW: () => ({ sx: 1.12, sy: 0.84, rot: -0.14 }),
      claw: () => ({ sx: 1.16, sy: 0.96, rot: 0.24, dx: 7 }),
      leapW: e => ({ sx: 1.2, sy: 0.72, rot: 0.08, dx: Math.sin(e * 70) * 0.8 }),
      leap: () => ({ sx: 0.86, sy: 1.22, rot: 0.2 }),
      hide: () => ({ sx: 1.22, sy: 0.76 }),
      ambushW: () => ({ sx: 1.18, sy: 0.76, rot: 0.1 }),
      ambush: () => ({ sx: 1.2, sy: 0.9, rot: 0.22, dx: 4 }),
      howlW: () => ({ sx: 0.94, sy: 1.08, rot: -0.2 }),
      howl: e => ({ sx: 0.96, sy: 1.16, rot: -0.26, dx: Math.sin(e * 60) * 1.2 }),
    },
    paidomato: {
      k: 6,
      base: e => ({ dy: Math.sin(e * 1.9) * 2, rot: Math.sin(e * 1.3) * 0.02 }),
      glide: e => ({ rot: 0.08, dy: Math.sin(e * 2.6) * 2.5, sy: 1.02 }),
      staffW: () => ({ dy: -6, sy: 1.08, rot: -0.1 }),
      staff: () => ({ rot: 0.2, dx: 5, dy: -2, sx: 1.06 }),
      birdsW: e => ({ dy: -8 + Math.sin(e * 5) * 1.5, sy: 1.1, sx: 0.96 }),
      jacareW: () => ({ dy: -12, sy: 1.1, rot: -0.08 }),
      waveW: e => ({ dy: -6, rot: Math.sin(e * 5) * 0.12, sy: 1.06 }),
    },
    labatut: {
      k: 9,
      base: e => ({ rot: Math.sin(e * 1.1) * 0.012 }),
      lost: e => ({ rot: Math.sin(e * 3.4) * 0.09, dx: Math.sin(e * 1.7) * 3 }),
      rockW: () => ({ rot: -0.14, sx: 0.95, sy: 1.04 }),
      stompW: e => ({ rot: -0.12, dy: -Math.min(e * 14, 7), sy: 1.08, sx: 0.96 }),
      sunW: e => ({ sy: 1.12, sx: 0.95, rot: -0.1 + Math.sin(e * 3) * 0.02 }),
      grabW: () => ({ sy: 0.86, sx: 1.12, rot: 0.1 }),
      grab: e => ({ rot: 0.26, sx: 1.12, dy: Math.abs(Math.sin(e * 12)) * -1.5 }),
      slashW: () => ({ sx: 0.84, sy: 1.06, rot: -0.14 }),
      slash: () => ({ sx: 1.2, sy: 0.98, rot: 0.17, dx: 5 }),
    },
    corposeco: {
      k: 0, seco: true, // ele não desliza: salta de uma pose errada para outra
      base: e => ({ rot: Math.sin(Math.floor(e * 6) * 1.7) * 0.02, sy: 1 + Math.sin(Math.floor(e * 4) * 2.3) * 0.01 }),
      rootsW: e => ({ dy: 5, sy: 0.92, sx: 1.05, dx: Math.sin(e * 41) * 1 }),
      thornsW: () => ({ sy: 1.12, sx: 0.92, rot: -0.05 }),
      drainW: e => ({ sx: 0.86, sy: 1.18, rot: -0.1, dx: Math.sin(e * 37) * 0.6 }),
      summon: e => ({ sy: 1.1, sx: 0.92, rot: Math.sin(e * 23) * 0.04 }),
      blink: e => ({ sx: Math.max(0.1, 1 - e * 4), sy: 1 + e * 0.8 }),
      scratchW: e => ({ rot: -0.24, sx: 0.9, sy: 1.06, dx: Math.sin(e * 53) * 0.8 }),
      scratch: () => ({ sx: 1.26, sy: 0.96, rot: 0.24, dx: 6 }),
      tornadoW: e => ({ sx: 0.3 + Math.abs(Math.cos(e * 11)) * 0.75, sy: 1.04 }), // gira como papel
      rainW: e => ({ sy: 1.1, rot: Math.sin(e * 29) * 0.05 }),
    },
  };
  const PARADO = { sx: 1, sy: 1, rot: 0, dx: 0, dy: 0 };

  // ---------- A morte de cada um ----------
  // efeito: o que aparece em volta do corpo na hora da derrota; corpo(d, fim, B): d é o tempo desde a queda, fim vai
  // de 0 a 1 quando ele some de vez, depois do diálogo. pose: pose do desenho durante a queda.
  // mapinguari: empina, tomba para trás com um baque e fica caído; no fim vira folhas.
  // capelobo: se debate queimando por dentro e sobra um corpo carvoado; no fim vira cinza de baixo para cima.
  // paidomato: a lamparina apaga e ele afunda devagar na água.
  // labatut: vira pedra de braços erguidos, e racha e desmorona de cima para baixo.
  // corposeco: as raízes o puxam para dentro da terra. lobo: vira cinza e o vento leva. boitata: o fogo frio se solta e sobe.
  const MORTE = {
    lobo: {
      efeito: B => VFX.play('terra/morte-lobo', B.x, B.y, { flip: B.f < 0, altura: 22, largura: 16 }),
      espera: 1.5,
      sobra: ['#5a5a6c', '#8a8ca0', '#c8cadc'],
      corpo: d => ({ tints: [['#8a8ca0', sat(d / 0.4) * 0.85]], hole: (d - 0.1) / 1.1, dir: 'desce', frozen: true, alt: 34 }),
    },
    mapinguari: {
      efeito: B => VFX.play('terra/morte-mapinguari', B.x - B.f * 34, B.y, { delay: 0.5 }),
      eventos: [[0.78, () => { treme(10)(); SFX.boom(); SFX.mapSlam(); }]],
      espera: 2.2,
      sobra: ['#3a6a28', '#6a9a30', '#a8c84a'],
      pose: d => d < 0.5 ? 'roar' : d < 0.78 ? 'stagger' : 'kneel',
      corpo: (d, f, B) => {
        const v = d < 0.5 ? 0.14 * suave(d / 0.5) : d < 0.78 ? 0.14 + 1.28 * ((d - 0.5) / 0.28) ** 2 : 1.42 - Math.sin(sat((d - 0.78) / 0.24) * Math.PI) * 0.1;
        return { rot: -B.f * v, dy: -B.h * 0.2 * sat(v / 1.42), tints: [['#2a2a1a', sat((d - 0.8) / 1) * 0.3], ['#3a6a28', f * 0.6]], hole: f * 1.02, dir: 'sobe' };
      },
    },
    capelobo: {
      efeito: B => VFX.play('terra/morte-capelobo', B.x, B.y),
      eventos: [[0, () => { SFX.fire(); SFX.roar(); }], [1.2, () => { treme(4)(); SFX.fire(); }]],
      espera: 2.4,
      sobra: ['#ff8a2a', '#ffd06a', '#3a3438'],
      pose: d => d < 1.2 ? 'roar' : 'kneel',
      corpo: (d, f) => ({
        dx: d < 1.2 ? Math.sin(d * 48) * 1.5 : 0, rot: d < 1.2 ? Math.sin(d * 31) * 0.06 : 0, sy: 1 - sat(d / 1.6) * 0.07, sx: 1 + sat(d / 1.6) * 0.03,
        tints: [['#ff7a2a', (d < 1.7 ? 0.45 + Math.sin(d * 19) * 0.15 : 0) * sat(d / 0.2)], ['#140c0a', sat((d - 0.9) / 1) * 0.74]],
        hole: f * 1.02, dir: 'sobe',
      }),
    },
    paidomato: {
      efeito: B => VFX.play('terra/morte-paidomato', B.x, B.y, { flip: B.f < 0, lx: 22, ly: -40 }),
      eventos: [[0.1, () => SFX.splash()], [1.1, B => { B.lampOff = true; }]],
      espera: 3,
      sobra: ['#a898d8', '#c8f05a', '#f8b8d8'],
      pose: () => 'kneel',
      corpo: (d, f, B) => ({
        dy: B.h * 0.4 * suave(d / 3) + B.h * 0.9 * suave(f), rot: -0.05 * B.f * sat(d / 2) + Math.sin(d * 1.4) * 0.012,
        tints: [['#241a58', sat(d / 3) * 0.34 + f * 0.3]], clip: B.y + 1,
      }),
    },
    labatut: {
      efeito: B => VFX.play('terra/morte-labatut', B.x, B.y, { altura: B.h + 12 }),
      eventos: [[0, () => SFX.roar()], [0.65, () => SFX.boom()], [1.45, () => { treme(6)(); SFX.boom(); }]],
      espera: 2.4,
      sobra: ['#8a7a64', '#b8a68a', '#e0d0b0'],
      pose: () => 'roar',
      corpo: (d, f) => ({
        dx: d < 0.62 ? Math.sin(d * 70) * 1 : 0, dy: f * 8, frozen: true,
        tints: [['#4e453c', sat((d - 0.05) / 0.8) * 0.74]], hole: sat((d - 0.65) / 1.1) * 0.2 + f * 0.85, dir: 'desce',
      }),
    },
    corposeco: {
      sobra: ['#6a3080', '#3a1a4a', '#8fe37a'],
      corpo: (d, f, B) => ({
        dy: B.h * 0.98 * suave(f), dx: Math.sin(f * 90) * (1 - f) * 1, rot: Math.sin(f * 37) * 0.03 * (1 - f),
        tints: [['#1c0e26', f * 0.85]], clip: B.y + 1,
      }),
    },
    boitata: {
      efeito: B => VFX.play('terra/morte-boitata', B.x, GY),
      eventos: [[0, () => SFX.echo()]],
      sobra: ['#7ae0ff', '#d8f8ff', '#2a8ad0'],
    },
  };

  // ---------- O tempo ----------
  function entrou(B, prev) {
    B.enterT = B.t;
    const G0 = GOLPES[B.kind] || {};
    if (G0[B.st]) G0[B.st](B);
    if (prev && G0['fim:' + prev]) G0['fim:' + prev](B);
    if (B.st === 'down' || B.st === 'freed') comecaMorte(B);
  }
  function comecaMorte(B) {
    const M = MORTE[B.kind]; if (!M || B.morreu) return;
    B.morreu = true; B.downAt = B.t; B.dT = 0; B.evento = 0;
    if (M.efeito) M.efeito(B);
  }
  function tick(B, dt) {
    if (B.morreu) {
      B.dT = B.t - B.downAt;
      const ev = MORTE[B.kind].eventos || [];
      while (B.evento < ev.length && B.dT >= ev[B.evento][0]) ev[B.evento++][1](B);
      return;
    }
    const C = CORPO[B.kind]; if (!C) return;
    const fn = C[B.st] || C.base, alvo = fn ? fn(B.t - (B.enterT || 0)) : PARADO;
    const a = B.an || (B.an = { ...PARADO }), peso = C.seco ? 1 : 1 - Math.exp(-C.k * dt);
    for (const k in PARADO) a[k] += ((alvo[k] ?? PARADO[k]) - a[k]) * peso;
  }
  // pose durante a queda; null deixa o padrão (de joelhos)
  const pose = B => { const M = MORTE[B.kind]; return M && M.pose ? M.pose(B.dT || 0) : 'kneel'; };
  const espera = k => (MORTE[k] && MORTE[k].espera) || 1.2;
  // o último instante: o corpo vai sumindo do jeito de cada um
  function sai(B, u) {
    B.fim = u;
    const cores = (MORTE[B.kind] || {}).sobra || ['#f6e3a6', '#bfe4ff', '#8fe37a'];
    for (let i = 0; i < 4; i++) part(B.x + rnd(-B.w / 2 - 4, B.w / 2 + 4), B.y - rnd(0, B.h), rnd(-10, 10), rnd(-60, -20), 1.6, pick(cores), pick([1, 2]), -20);
  }

  // ---------- O desenho ----------
  // Pinta o chefe numa tela à parte para poder inclinar, esticar, tingir e furar o corpo sem abrir frestas entre os pixels.
  let tela = null, tx = null;
  function estilo(B) {
    if (B.fim != null || B.st === 'down') {
      const M = MORTE[B.kind];
      return M && M.corpo ? M.corpo(B.dT || 0, B.fim || 0, B) : null;
    }
    const a = B.an;
    if (!a || (Math.abs(a.sx - 1) < 0.008 && Math.abs(a.sy - 1) < 0.008 && Math.abs(a.rot) < 0.006 && Math.abs(a.dx) < 0.2 && Math.abs(a.dy) < 0.2)) return null;
    return { sx: a.sx, sy: a.sy, rot: a.rot * B.f, dx: a.dx * B.f, dy: a.dy };
  }
  function desenha(B, pinta) {
    let s = estilo(B);
    // preparando um golpe: o corpo pisca na cor do chefe, sem mexer no estado guardado
    if (AVISO[B.kind] && /W$/.test(B.st) && B.fim == null) s = { sx: 1, sy: 1, rot: 0, dx: 0, dy: 0, ...s, tints: [...((s && s.tints) || []), [AVISO[B.kind], 0.28 + Math.sin(B.t * 22) * 0.2]] };
    if (!s || typeof ctx.getTransform !== 'function') return pinta();
    if (!tela) { tela = document.createElement('canvas'); tx = renderContext(tela, W, H); }
    const T = ctx.getTransform(), q = T.a, fx0 = T.a * B.x + T.e, fy0 = T.d * B.y + T.f, real = ctx, alpha = ctx.globalAlpha;
    const x0 = Math.max(0, Math.floor(fx0 - 170 * q)), y0 = Math.max(0, Math.floor(fy0 - 190 * q)), w = Math.min(tela.width, Math.ceil(fx0 + 170 * q)) - x0, h = Math.min(tela.height, Math.ceil(fy0 + 40 * q)) - y0;
    if (w <= 0 || h <= 0) return;
    tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalAlpha = 1; tx.globalCompositeOperation = 'source-over'; tx.clearRect(x0, y0, w, h);
    tx.setTransform(T);
    const t0 = B.t;
    if (s.frozen) { if (B.gelo == null) B.gelo = B.t; B.t = B.gelo; }
    ctx = tx;
    try { pinta(); } finally { ctx = real; B.t = t0; }
    tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalAlpha = 1;
    if (s.hole > 0) {
      // fura o corpo em blocos: uma ordem fixa por bloco, puxada de cima ou de baixo
      // (posição inteira: em meio pixel sobrariam fiapos entre um bloco e outro)
      const c = Math.max(2, Math.round(3 * q)), altura = s.alt || B.h, top = altura * 2.4 * q, larg = Math.max(B.w, 40) * 1.8 * q, de = s.dir === 'desce', X = Math.round(fx0), Y = Math.round(fy0);
      if (s.hole >= 1) tx.clearRect(x0, y0, w, h);
      else for (let iy = -3; iy * c < top; iy++) {
        const alt = clamp((iy * c) / (altura * q * 1.1), 0, 1);
        for (let ix = -Math.ceil(larg / c); ix * c < larg; ix++) {
          const ord = hash(ix * 97 + iy * 1013) * 0.4 + (de ? 1 - alt : alt) * 0.6;
          if (ord < s.hole) tx.clearRect(X + ix * c, Y - (iy + 1) * c, c, c);
        }
      }
    }
    if (s.tints) {
      tx.globalCompositeOperation = 'source-atop';
      for (const [cor, a] of s.tints) if (a > 0.004) { tx.globalAlpha = Math.min(1, a); tx.fillStyle = cor; tx.fillRect(x0, y0, w, h); }
      tx.globalCompositeOperation = 'source-over'; tx.globalAlpha = 1;
    }
    real.save();
    real.setTransform(1, 0, 0, 1, 0, 0);
    real.globalAlpha = alpha;
    if (s.clip != null) { real.beginPath(); real.rect(0, 0, cv.width, T.d * s.clip + T.f); real.clip(); }
    real.translate(fx0 + (s.dx || 0) * q, fy0 + (s.dy || 0) * q);
    if (s.rot) real.rotate(s.rot);
    real.scale(s.sx ?? 1, s.sy ?? 1);
    real.translate(-fx0, -fy0);
    real.imageSmoothingEnabled = false;
    real.nativeDrawImage(tela, x0, y0, w, h, x0, y0, w, h);
    real.restore();
  }

  return { entrou, tick, pose, espera, sai, desenha, comecaMorte, GOLPES, CORPO, MORTE };
})();
