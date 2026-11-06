#!/usr/bin/env node
// Junta a biblioteca pixelfx (vendor/pixelfx) e os efeitos usados pelo jogo em js/pixelfx.bundle.js.
// Precisa do esbuild: `npx esbuild` por padrão, ou o caminho do executável em ESBUILD_BIN.
//
//   node tools/build-vfx.mjs
//
// Para usar outro efeito: acrescente o id em USED; copie o arquivo para vendor/pixelfx/src/fx se ainda não estiver lá.

import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const USED = [
  // golpes do jogador
  "melee/sword-slash", "melee/double-slash", "melee/spin-slash", "melee/thrust",
  // impactos
  "impacts/hit-spark", "impacts/blunt-hit", "impacts/crit-hit", "impacts/ground-slam",
  // fogo, água e natureza
  "fire/fire-ring", "water/splash", "nature/quake", "nature/thorns", "nature/tornado",
  // vida, morte e recompensa
  "spawn/poof", "spawn/soul-rise", "explosions/implosion", "shadow/dark-explosion", "pickups/collect-burst",
  "holy/heal-aoe", "holy/holy-pillar", "holy/feather-burst", "holy/sunburst",
  // feitos para o jogo
  "terra/fogueira", "terra/ar", "terra/poeira", "terra/memoria", "terra/acende", "terra/corrente", "terra/selo", "terra/jato", "terra/uivo",
  "terra/morte-lobo", "terra/morte-mapinguari", "terra/morte-capelobo", "terra/morte-boitata", "terra/morte-paidomato", "terra/morte-labatut", "terra/morte-corposeco",
  // golpes dos chefes
  "melee/claw-swipe", "melee/heavy-cleave", "melee/scythe-reap", "nature/vine-whip", "nature/leaf-storm",
  "impacts/heavy-landing", "shadow/grasping-hands", "shadow/soul-drain", "shadow/hex-sigil", "shadow/curse", "fire/spirit-flame", "fire/fire-breath", "fire/flame-pillar",
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const lines = ['export { createFrame, createFx } from "./vendor/pixelfx/src/core/fx.js";', 'export { PAL } from "./vendor/pixelfx/src/core/color.js";'];
  USED.forEach((id, i) => lines.push(`import * as f${i} from "./vendor/pixelfx/src/fx/${id}.js";`));
  lines.push(`export const fx = { ${USED.map((id, i) => `"${id}": f${i}`).join(", ")} };`);
  const entry = join(root, ".vfx-entry.mjs");
  writeFileSync(entry, lines.join("\n"));
  const args = [entry, "--bundle", "--minify", "--format=iife", "--global-name=PXFX", "--legal-comments=none", "--target=es2019", `--outfile=${join(root, "js", "pixelfx.bundle.js")}`];
  const banner = "// pixelfx (MIT, Patch) e efeitos de Sprite Fusion (MIT, Hugo Duprez): ver vendor/pixelfx. Gerado por tools/build-vfx.mjs.";
  args.push(`--banner:js=${banner}`);
  try {
    if (process.env.ESBUILD_BIN) execFileSync(process.env.ESBUILD_BIN, args, { stdio: "inherit" });
    else execFileSync("npx", ["esbuild", ...args], { stdio: "inherit", shell: true });
  } finally { rmSync(entry, { force: true }); }
}
