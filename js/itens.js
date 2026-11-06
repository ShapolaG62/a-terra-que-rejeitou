'use strict';
// Itens dos baús: runas, partes de itens e ferramentas. Ficam equipados assim que são coletados e somam status.

const RELICS = {
  no_da_margem: { n: 'Nó da margem', d: 'A fibra que segurei com Lia. Nina já atravessa a passarela. Um lugar para lembrar e ao qual voltar.', icon: 'colar', col: '#cead6a', fixed: true },
  fita_do_caminho: { n: 'Fita do caminho', d: 'Cecília guardou um pedaço da fita do marco. Um caminho pode apontar para alguém.', icon: 'pena', col: '#d7ad67', fixed: true },
  lasca_do_remo: { n: 'Lasca do remo', d: 'Bento deu a lasca que tirou do remo. O risco que mede o filho continua na madeira.', icon: 'parte', col: '#b49463', fixed: true },
  retalho_de_sombra: { n: 'Retalho de sombra', d: 'Um remendo que sobrou da esteira de Rosa. Ainda cabe mais alguém na sombra.', icon: 'cesto', col: '#c9aa70', fixed: true },
  casca_da_semente: { n: 'Casca da semente', d: 'Celina deixou a casca na minha mão. A semente ficou na terra e tem tempo para crescer.', icon: 'parte', col: '#a9ba7d', fixed: true },
  runa_raiz: { n: 'Runa da Raiz', d: '+20 de vida', hp: 20, icon: 'runa', col: '#6fbf73' },
  runa_sopro: { n: 'Runa do Sopro', d: '+20 de energia (fôlego para golpes e esquiva)', st: 20, icon: 'runa', col: '#9fd0e0' },
  runa_fogo: { n: 'Runa do Fogo', d: '+10% de dano', dmg: 0.1, icon: 'runa', col: '#e0703a' },
  runa_agua: { n: 'Runa da Água', d: 'aguenta 40% mais tempo sem ar; o calor sobe 25% mais devagar', breath: 0.4, heat: 0.25, icon: 'runa', col: '#5aa8d0' },
  dente_onca: { n: 'Colar de dente de onça', d: '+8% de dano', dmg: 0.08, icon: 'colar', col: '#efe8dc' },
  pena_gaviao: { n: 'Pena de gavião', d: '+8% de velocidade e esquiva mais longa', speed: 0.08, roll: 0.2, icon: 'pena', col: '#c8a46a' },
  cabaca_grande: { n: 'Cabaça grande', d: '+1 gole de cura e cada gole cura +15', flask: 1, heal: 15, icon: 'cabaca', col: '#d8b04a' },
  tipiti: { n: 'Tipiti trançado', d: '+1 gole de cura', flask: 1, icon: 'cesto', col: '#c8a46a' },
  machadinha: { n: 'Machadinha de pedra', d: 'ferramenta: +6% de dano', dmg: 0.06, icon: 'ferramenta', col: '#8a8e98' },
  ponta_lanca: { n: 'Ponta de lança antiga', d: 'parte 1 de 3 da Lança dos Antigos', part: 'lanca_antiga', icon: 'parte', col: '#d8d8d0' },
  haste_lanca: { n: 'Haste trançada', d: 'parte 2 de 3 da Lança dos Antigos', part: 'lanca_antiga', icon: 'parte', col: '#8a6a3a' },
  amarra_lanca: { n: 'Amarra de fibra', d: 'parte 3 de 3 da Lança dos Antigos', part: 'lanca_antiga', icon: 'parte', col: '#a8c870' },
  lanca_antiga: { n: 'Lança dos Antigos', d: 'montada com as 3 partes: +15% de dano', dmg: 0.15, icon: 'ferramenta', col: '#f2c14e' },
  // recompensas fixas dos selos de Cipós-de-Sangue (não saem nos baús comuns)
  olho_fogo_frio: { n: 'Olho de Fogo Frio', d: 'luz ancestral; purifica Cipós-de-Sangue; brasa que interrompe bichos corrompidos', icon: 'runa', col: '#bfe4ff', fixed: true },
  seiva_antiga: { n: 'Seiva da Árvore Oca', d: '+25 de vida', hp: 25, icon: 'cabaca', col: '#8fd06a', fixed: true },
  coracao_antigo: { n: 'Coração do Primeiro Povo', d: '+30 de vida e +15 de energia', hp: 30, st: 15, icon: 'runa', col: '#e0a050', fixed: true },
  cinza_ancestral: { n: 'Cinza do Altar', d: '+12% de dano', dmg: 0.12, icon: 'runa', col: '#c8b8a8', fixed: true },
  escama_rio: { n: 'Escama do Rio Sepultado', d: 'aguenta 30% mais tempo sem ar e +10 de vida', breath: 0.3, hp: 10, icon: 'parte', col: '#9fd0e0', fixed: true },
};
const PARTS = { lanca_antiga: ['ponta_lanca', 'haste_lanca', 'amarra_lanca'] };

function itemBonus(k) { let v = 0; for (const id of (G.save && G.save.items) || []) { const r = RELICS[id]; if (r && r[k]) v += r[k]; } return v; }
function giveRelic(id) {
  const S = G.save; S.items = S.items || [];
  if (!RELICS[id] || S.items.includes(id)) return null;
  S.items.push(id);
  for (const [whole, parts] of Object.entries(PARTS)) if (!S.items.includes(whole) && parts.every(p => S.items.includes(p))) {
    S.items.push(whole); setTimeout(() => showToast('Item montado', RELICS[whole].n, 2.6), 1400);
  }
  return RELICS[id];
}

// ícones pequenos (dataURL) para o inventário
const RICON = {};
function relicIcon(id) {
  if (RICON[id]) return RICON[id];
  const r = RELICS[id], [c, x] = mk(14, 14), col = r.col;
  if (r.icon === 'runa') { rect(x, 2, 1, 10, 12, '#120a06'); rect(x, 3, 2, 8, 10, '#6a6e78'); rect(x, 3, 2, 8, 1, '#8a8e98'); line(x, 7, 4, 7, 10, col); line(x, 5, 6, 9, 6, col); line(x, 5, 9, 7, 7, col); }
  else if (r.icon === 'colar') { for (let i = 0; i < 9; i++) rect(x, 2 + i, 3 + Math.round(Math.sin(i / 8 * Math.PI) * 5), 1, 1, '#8a6a3a'); for (let i = 0; i < 3; i++) { rect(x, 4 + i * 3, 8, 2, 4, '#120a06'); rect(x, 4 + i * 3, 8, 1, 3, col); } }
  else if (r.icon === 'pena') { line(x, 3, 12, 11, 2, '#6a4428'); for (let i = 0; i < 6; i++) { line(x, 4 + i, 11 - i, 2 + i, 7 - i, col); line(x, 4 + i, 11 - i, 8 + i, 13 - i, '#a8845a'); } }
  else if (r.icon === 'cabaca') { ell(x, 7, 9, 4, 4, '#120a06'); ell(x, 7, 9, 3, 3, col); ell(x, 7, 4, 2, 2, col); rect(x, 6, 1, 2, 2, '#6a4428'); rect(x, 5, 7, 2, 1, '#fff6c0'); }
  else if (r.icon === 'cesto') { rect(x, 2, 4, 10, 8, '#120a06'); rect(x, 3, 5, 8, 6, col); for (let i = 3; i < 11; i += 2) rect(x, i, 5, 1, 6, '#8a6a3a'); rect(x, 3, 7, 8, 1, '#8a6a3a'); }
  else if (r.icon === 'parte') { line(x, 2, 12, 11, 3, '#120a06'); line(x, 3, 12, 11, 4, col); rect(x, 10, 1, 3, 3, col); }
  else { line(x, 2, 12, 9, 5, '#8a6a3a'); rect(x, 8, 1, 5, 5, '#120a06'); rect(x, 9, 2, 3, 3, col); }
  return (RICON[id] = c.toDataURL());
}
function inventoryHTML() {
  const items = (G.save.items || []).filter(id => RELICS[id]);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  // espaços vazios completam a grade, de seis em seis
  const total = Math.max(18, Math.ceil(items.length / 6) * 6);
  const rows = items.map(id => `<button class="btn slot" aria-label="${esc(RELICS[id].n)}" data-n="${esc(RELICS[id].n)}" data-d="${esc(RELICS[id].d)}"><img src="${relicIcon(id)}" alt=""></button>`).join('') + '<div class="slot"></div>'.repeat(total - items.length);
  const parts = PARTS.lanca_antiga, have = parts.filter(p => items.includes(p)).length;
  const prog = items.includes('lanca_antiga') ? '' : `<p style="margin-top:8px">Lança dos Antigos: ${have}/3 partes</p>`;
  const m = statMax();
  return `<div class="mochila"><h2>Inventário</h2><div class="stats"><span>Vida</span><span class="v">${m.hp}</span><span>Energia</span><span class="v">${m.st}</span><span>Dano</span><span class="v">×${dmgMul().toFixed(2)}</span><span>Goles de cura</span><span class="v">${m.flasks}</span></div><div class="slots">${rows}</div><div class="slotinfo"></div>${items.length ? '' : '<p style="margin-top:8px">Nenhum item ainda. Abra os baús pelo caminho.</p>'}${prog}<div class="btns"><button class="btn" data-act="back">Voltar</button></div></div>`;
}
