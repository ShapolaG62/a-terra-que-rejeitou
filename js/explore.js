'use strict';
// Exploração temporária: preserva o save enquanto permite visitar todas as regiões.
G.exploring = true;
const exploreWrite = writeSave, exploreHurt = hurtPlayer, exploreDie = die, exploreUpdate = updatePlayer;
writeSave = () => { if (!G.exploring) exploreWrite(); };
hurtPlayer = (...args) => G.exploring ? false : exploreHurt(...args);
die = () => { if (!G.exploring) return exploreDie(); G.P.hp = statMax().hp; G.heat = 0; G.P.breath = 100; };
updatePlayer = dt => {
  if (G.exploring) { G.P.hp = statMax().hp; G.P.breath = 100; G.heat = 0; }
  exploreUpdate(dt);
  if (G.exploring) G.P.hp = statMax().hp;
};
// Novo jogo também não apaga o progresso anterior durante a exploração.
const exploreClear = clearSave;
clearSave = () => { if (!G.exploring) exploreClear(); };
async function explorationMenu() {
  const places = ['prologo', 'amazonia', 'cerrado', 'gruta', 'pantanal', 'caatinga', 'mata', 'coracao'];
  const a = await menu('<h2>Exploração temporária</h2><p>Sem dano. Esta exploração não grava progresso.</p><div class="btns">' + places.map(id => `<button class="btn" data-act="${id}">${ROTA_NOME[id]}</button>`).join('') + '<button class="btn" data-act="off">Desligar e restaurar progresso salvo</button><button class="btn" data-act="back">Voltar</button></div>');
  if (a === 'off') { G.exploring = false; G.save = loadSave() || newSave(); await enterAct(G.save.act, { skipCard: true }); return; }
  if (!places.includes(a)) return;
  G.save = JSON.parse(JSON.stringify(G.save));
  G.save.act = a === 'gruta' ? 2 : ACTS.indexOf(a); G.save.sub = a === 'gruta' ? 'gruta' : null;
  G.save.forms = ['espirito', ...FORM_ORDER]; G.save.form = 'semente';
  loadLevel(a); G.flags = { final: a === 'coracao' }; G.auto = 0; G.camTarget = null;
  G.P = makePlayer(G.lvl.start, groundY(G.lvl.start)); G.P.form = 'semente';
  G.cam.x = 0; G.cam.shake = 0; G.state = 'play'; G.trans = null;
  for (const t of G.lvl.triggers) t.done = true;
  if (G.lvl.arena) G.lvl.arena.cleared = true;
  hud.cache = {}; updateHudForm(); showToast('Exploração temporária', ROTA_NOME[a] + ' · sem dano · progresso não salvo', 4);
}
