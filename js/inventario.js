'use strict';
// O inventário: texturas de casca, palha trançada, tábua e grafismo desenhadas aqui mesmo, pixel a pixel,
// e o detalhe do item que acompanha o toque, o cursor, o teclado e o controle.
(() => {
  // gerador fixo: as texturas saem iguais toda vez
  const rng = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const CEL = 2; // cada "pixel" da textura ocupa 2 pixels da tela, assim fica nítido sem depender de escala
  function tela(n, m, pinta) {
    const c = document.createElement('canvas'); c.width = n * CEL; c.height = m * CEL;
    const x = c.getContext('2d');
    pinta((px, py, cor) => { x.fillStyle = cor; x.fillRect(px * CEL, py * CEL, CEL, CEL); });
    return `url(${c.toDataURL()})`;
  }
  const escolhe = (r, l) => l[Math.floor(r() * l.length) % l.length];

  // casca escura: o fundo, nas cores dos painéis do jogo, com fibras curtas
  function casca(cores, seed) {
    return tela(32, 32, P => {
      const r = rng(seed);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) P(x, y, escolhe(r, cores));
      for (let i = 0; i < 22; i++) { let x = Math.floor(r() * 32), y = Math.floor(r() * 32); const n = 2 + Math.floor(r() * 4), c = r() > 0.5 ? cores[0] : cores[cores.length - 1]; for (let k = 0; k < n; k++) P((x + k) & 31, y, c); }
    });
  }
  // palha trançada: a moldura, como um cesto
  function palha() {
    return tela(32, 32, P => {
      const r = rng(5), T = ['#5a3f1e', '#6e4e26', '#7c5a2c', '#4a3218'];
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const deitada = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0, u = deitada ? y % 4 : x % 4, v = deitada ? x % 4 : y % 4;
        const base = u === 0 ? '#9a7638' : u === 3 ? '#2e1e0e' : T[(Math.floor(deitada ? y / 4 : x / 4)) % T.length];
        P(x, y, v === 3 && u !== 3 ? '#3a2612' : r() > 0.9 ? '#4a3218' : base);
      }
    });
  }
  // tábua escura: onde ficam os espaços
  function tabua() {
    return tela(32, 32, P => {
      const r = rng(29), T = ['#33241a', '#3a2a1e', '#2e2017', '#372719'];
      for (let y = 0; y < 32; y++) { const base = T[Math.floor(y / 8) % T.length]; for (let x = 0; x < 32; x++) P(x, y, y % 8 === 7 ? '#1a110b' : r() > 0.84 ? '#2a1c12' : base); }
    });
  }
  // grafismo em zigue-zague, o mesmo das faixas do vídeo de abertura
  function grafismo() {
    return tela(16, 5, P => {
      for (let x = 0; x < 16; x++) for (let y = 0; y < 5; y++) {
        const d = Math.abs((x % 8) - 3.5), alto = 4 - Math.floor(d);
        P(x, y, y >= 5 - alto ? (y === 5 - alto ? '#f2c14e' : '#a8782a') : '#1a110b');
      }
    });
  }

  const raiz = document.documentElement.style;
  raiz.setProperty('--tx-fundo', casca(['#14100f', '#17120f', '#1a1411', '#110d0c', '#1d1612'], 11));
  raiz.setProperty('--tx-rebaixo', casca(['#0d0a09', '#100c0a', '#0f0b09', '#0b0807', '#130e0c'], 41));
  raiz.setProperty('--tx-palha', palha());
  raiz.setProperty('--tx-tabua', tabua());
  raiz.setProperty('--tx-grafismo', grafismo());

  // ---------- Detalhe do item ----------
  function detalhe(painel) {
    const info = painel.querySelector('.slotinfo'); if (!info) return;
    const s = painel.querySelector('.slot.sel');
    // só escreve quando mudou: o observador do painel vê esta troca, e reescrever sempre o faria rodar sem fim
    const qual = s ? s.dataset.n : '';
    if (info.dataset.qual === qual && info.firstChild) return;
    info.dataset.qual = qual;
    info.textContent = '';
    if (s) { const b = document.createElement('b'); b.textContent = s.dataset.n; info.appendChild(b); }
    const m = document.createElement('small'); m.textContent = s ? s.dataset.d : 'Passe o dedo ou o cursor num espaço para ver o item.'; info.appendChild(m);
  }
  function marca(s) {
    const p = s.closest('.panel'); if (!p) return;
    p.querySelectorAll('.btn.sel').forEach(b => b.classList.remove('sel'));
    s.classList.add('sel'); detalhe(p);
    if (UI.menu) UI.menu.sel = [...p.querySelectorAll('.btn:not([hidden])')].indexOf(s);
  }
  function liga() {
    const noSlot = e => e.target.closest && e.target.closest('.slot.btn');
    document.addEventListener('pointerover', e => { const s = noSlot(e); if (s) marca(s); });
    document.addEventListener('click', e => { const s = noSlot(e); if (s) { marca(s); SFX.ui(); } });
    // o painel é trocado a cada tela e a seleção muda pelo teclado: mantém o detalhe em dia
    const painel = document.querySelector('#menu .panel');
    if (painel) new MutationObserver(() => detalhe(painel)).observe(painel, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', liga); else liga();
})();
