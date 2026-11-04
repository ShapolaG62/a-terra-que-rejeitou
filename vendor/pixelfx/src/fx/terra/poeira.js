// Poeira de pé: um sopro rente ao chão ao pousar, pular ou dar o impulso. o.dir: 0 para os dois lados, 1 ou -1 para trás de um impulso.
import { Particles, P, Rng, fit } from "../../core/index.js";

export const meta = {
  name: "Poeira de pé",
  desc: "Sopro de poeira rente ao chão ao pousar, pular ou dar impulso, com alguns grãos saltando.",
  tags: ["dust", "landing", "terra", "one-shot"],
  size: [96, 40],
  origin: [48, 34],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#5a4a3a", "#8a7458", "#b8a080", "#e0d0b0"], dir: 0, power: 1, seed: 3 },
};

export function create(o) {
  const C = fit(o.palette, 4), R = new Rng(o.seed), k = o.power;
  const ps = new Particles({ rng: R, ground: () => 0 });
  const side = () => (o.dir ? o.dir : R.sign());
  for (let i = 0; i < 6 + 3 * k; i++) { const s = side(); ps.spawn(P.DUST, s * R.range(0, 4), -1, s * R.range(18, 62) * k, -R.range(1, 9), R.range(0.28, 0.5), C[i % 2 ? 1 : 2], R.range(1.3, 2.4) * Math.sqrt(k), R.range(0, 0.04)); }
  for (let i = 0; i < 3 + 3 * k; i++) { const s = side(); ps.spawn(P.GRIT, s * R.range(0, 3), -1, s * R.range(10, 44) * k, -R.range(24, 62) * k, R.range(0.25, 0.42), C[0], 1); }
  return { update(dt) { ps.update(dt); }, draw(p) { ps.draw(p); } };
}
