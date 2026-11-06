'use strict';
// Conquistas e estatísticas. O perfil fica fora do save: zerar ou começar um novo jogo apaga o save, mas não o que já foi conquistado.
// Nada conta na exploração temporária (sem dano e sem gravar).

const PERFIL_KEY = 'terra-que-rejeitou-perfil-v1';
const CONQ = (() => {
  const LISTA = [
    ['lobo', 'O Medo que Restou', 'Derrote a fera do Prólogo.'],
    ['mapinguari', 'O Peso da Floresta', 'Derrote o Mapinguari.'],
    ['capelobo', 'A Sede do Cerrado', 'Derrote o Capelobo.'],
    ['boitata', 'Fogo Libertado', 'Quebre as correntes do Boitatá.'],
    ['paidomato', 'Digno da Mata', 'Passe pelo teste do Pai do Mato.'],
    ['labatut', 'Quem Eu Era', 'Derrote o Labatut.'],
    ['cinco', 'Os Cinco Povos', 'Receba a forma de todos os cinco povos.'],
    ['ecos', 'Todos os Ecos', 'Encontre os 6 ecos do Corpo-seco.'],
    ['pinturas', 'As Paredes Lembram', 'Revele todas as pinturas da Gruta e das Ruínas.'],
    ['nivel10', 'Contador de Histórias', 'Chegue ao nível 10.'],
    ['abates', 'Mão Pesada', 'Derrote 100 bichos corrompidos (somando todas as jornadas).'],
    ['fim', 'A Terra que Rejeitou', 'Zere o jogo.'],
    ['semmorrer', 'Sem Morrer', 'Zere o jogo sem morrer nenhuma vez.'],
    ['pacto', 'O Pacto Guardado', 'Zere o jogo poupando todos os guardiões.'],
    ['forca', 'Força Arrancada', 'Zere o jogo purificando todos os guardiões à força.'],
    ['platina', 'Platina: A Terra Lembra', 'Conquiste todas as outras conquistas.'],
  ];
  const NOMES = Object.fromEntries(LISTA.map(a => [a[0], a]));
  const GUARDIOES = ['mapinguari', 'capelobo', 'paidomato', 'labatut'];
  const novo = () => ({ ach: {}, zerou: 0, melhorTempo: 0, ultimoTempo: 0, ultimoNivel: 0, ultimasMortes: 0, menosMortes: null, mortes: 0, abates: 0 });
  let p = novo();
  try { p = Object.assign(novo(), JSON.parse(localStorage.getItem(PERFIL_KEY)) || {}); } catch (e) {}
  const salvar = () => { try { localStorage.setItem(PERFIL_KEY, JSON.stringify(p)); } catch (e) {} };

  // aviso de conquista, um de cada vez
  const fila = []; let avisoEl = null, mostrando = false;
  function proximoAviso() {
    if (mostrando || !fila.length) return;
    if (!avisoEl) { avisoEl = document.createElement('div'); avisoEl.id = 'achToast'; avisoEl.setAttribute('role', 'status'); document.body.appendChild(avisoEl); }
    const a = fila.shift(), plat = a[0] === 'platina';
    mostrando = true; SFX.echo();
    avisoEl.className = 'on' + (plat ? ' plat' : '');
    avisoEl.innerHTML = `<i>${plat ? '★' : '◆'}</i><span><small>Conquista desbloqueada</small><b>${a[1]}</b></span>`;
    setTimeout(() => { avisoEl.className = plat ? 'plat' : ''; setTimeout(() => { mostrando = false; proximoAviso(); }, 450); }, plat ? 5000 : 3400);
  }
  function ganhar(id) {
    if (G.exploring || G.teste || p.ach[id] || !NOMES[id]) return;
    p.ach[id] = Date.now(); salvar();
    fila.push(NOMES[id]); proximoAviso();
    if (id !== 'platina' && LISTA.every(a => a[0] === 'platina' || p.ach[a[0]])) ganhar('platina');
  }

  const nivelDe = s => 1 + (s.vig || 0) + (s.forc || 0) + (s.fol || 0);
  function tempoTxt(seg) {
    const t = Math.floor(seg || 0), h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60, d = n => String(n).padStart(2, '0');
    return h ? `${h}h ${d(m)}min ${d(s)}s` : `${m}min ${d(s)}s`;
  }
  // o que depende só do estado do save; roda uma vez por segundo, durante o jogo
  function checar() {
    const s = G.save; if (!s) return;
    if (FORM_ORDER.every(f => s.forms.includes(f))) ganhar('cinco');
    if (s.echoes.length >= 6) ganhar('ecos');
    if (Object.keys(MURALS).every(m => (s.murals || []).includes(m))) ganhar('pinturas');
    if (nivelDe(s) >= 10) ganhar('nivel10');
    if (p.abates >= 100) ganhar('abates');
  }
  let umSeg = 0, vinteSeg = 0;
  function tick(dt) {
    if (G.exploring || G.teste || !G.save) return;
    G.save.tempo = (G.save.tempo || 0) + dt;
    if ((umSeg += dt) >= 1) { umSeg = 0; checar(); }
    if ((vinteSeg += dt) >= 20) { vinteSeg = 0; writeSave(); }
  }
  function morte() { if (G.exploring || G.teste) return; G.save.mortes = (G.save.mortes || 0) + 1; p.mortes++; salvar(); }
  function abate() { if (G.exploring || G.teste) return; p.abates++; if (p.abates % 5 === 0 || p.abates === 100) salvar(); }
  function chefe(k) { ganhar(k); }
  // fim da jornada: guarda os números antes de o save ser apagado
  function fim() {
    if (G.exploring || G.teste) return;
    const s = G.save, h = s.harmony || {};
    ganhar('fim');
    if (!s.mortes && !s.semRegistro) ganhar('semmorrer');
    if (GUARDIOES.every(k => h[k] === 'poupar')) ganhar('pacto');
    if (GUARDIOES.every(k => h[k] === 'purificar')) ganhar('forca');
    const t = s.tempo || 0;
    p.zerou++; p.ultimoTempo = t; p.ultimasMortes = s.mortes || 0; p.ultimoNivel = nivelDe(s);
    if (!p.melhorTempo || t < p.melhorTempo) p.melhorTempo = t;
    if (!s.semRegistro && (p.menosMortes == null || p.ultimasMortes < p.menosMortes)) p.menosMortes = p.ultimasMortes;
    salvar();
  }
  const resumo = () => `Tempo: ${tempoTxt(p.ultimoTempo)} · Mortes: ${p.ultimasMortes} · Nível ${p.ultimoNivel}`;

  // ---------- telas ----------
  function conquistasHTML() {
    const n = LISTA.filter(a => p.ach[a[0]]).length;
    const linhas = LISTA.map(([id, nome, desc]) => {
      const ok = p.ach[id], plat = id === 'platina', quando = ok ? new Date(ok).toLocaleDateString('pt-BR') : '';
      return `<div class="btn ach${ok ? ' ok' : ''}${plat ? ' plat' : ''}"><i>${plat ? '★' : ok ? '◆' : '◇'}</i><span><b>${nome}</b><small>${desc}</small></span>${ok ? `<em>${quando}</em>` : ''}</div>`;
    }).join('');
    return `<div class="conqs"><h2>Conquistas</h2><p>${n} de ${LISTA.length} desbloqueadas</p><div class="achbar"><i style="width:${(n / LISTA.length * 100).toFixed(1)}%"></i></div><div class="btns lista">${linhas}</div><div class="btns"><button class="btn" data-act="back">Voltar</button></div></div>`;
  }
  function estatisticasHTML(save) {
    const s = save && !save.done ? save : null, lin = (a, b) => `<span>${a}</span><span class="v">${b}</span>`;
    const atual = s ? lin('Tempo de jogo', tempoTxt(s.tempo)) + lin('Mortes', s.semRegistro ? `${s.mortes || 0}*` : (s.mortes || 0)) + lin('Nível do personagem', nivelDe(s)) : '';
    const fins = p.zerou ? lin('Vezes que zerou', p.zerou) + lin('Tempo para zerar (melhor)', tempoTxt(p.melhorTempo)) + lin('Tempo para zerar (último)', tempoTxt(p.ultimoTempo)) + lin('Menos mortes numa jornada', p.menosMortes == null ? '—' : p.menosMortes) + lin('Nível ao zerar (último)', p.ultimoNivel) : lin('Tempo para zerar', 'ainda não zerou');
    const n = LISTA.filter(a => p.ach[a[0]]).length;
    return `<h2>Estatísticas</h2>
      ${s ? `<h3 class="sttl">Jornada atual</h3><div class="stats">${atual}</div>${s.semRegistro ? '<p class="hint">* Este save é anterior às estatísticas: as mortes antigas não foram registradas.</p>' : ''}` : ''}
      <h3 class="sttl">Jogo completo</h3><div class="stats">${fins}</div>
      <h3 class="sttl">Em todas as jornadas</h3><div class="stats">${lin('Mortes', p.mortes)}${lin('Bichos derrotados', p.abates)}${lin('Conquistas', `${n}/${LISTA.length}`)}</div>
      ${G.exploring ? '<p class="hint">A exploração temporária não conta nas estatísticas.</p>' : ''}
      <div class="btns"><button class="btn" data-act="back">Voltar</button></div>`;
  }
  return { ganhar, checar, tick, morte, abate, chefe, fim, resumo, conquistasHTML, estatisticasHTML, nivelDe, tempoTxt, perfil: () => p, LISTA };
})();
