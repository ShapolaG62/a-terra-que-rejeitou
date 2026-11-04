// A fogueira pega: um sopro quente sobre o chão, labaredas curtas que viram fumaça e fagulhas subindo.
import { Particles, Lights, P, PF, Rng, fit, sparkle, TAU, ease } from "../../core/index.js";

export const meta = {
  name: "Fogueira acendendo",
  desc: "O fogo pega: anel de calor no chão, labaredas curtas, fagulhas e fumaça subindo.",
  tags: ["fire", "campfire", "checkpoint", "terra", "one-shot"],
  size: [136, 112],
  origin: [68, 96],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#5a1a0a", "#c8402e", "#f08a3a", "#ffd27a", "#fff4d0"], seed: 13 },
};

export function create(o) {
  const C = fit(o.palette, 5), R = new Rng(o.seed), ps = new Particles({ rng: R, ground: () => 0, sparks: [C[4], C[3], C[2], C[1]] }), lights = new Lights();
  lights.add(0, -10, 56, C[2], 0.7, 0.9); lights.add(0, -8, 22, C[4], 0.8, 0.22);
  for (let i = 0; i < 16; i++) { const s = R.range(-1, 1); ps.spawn(P.FIRE, s * 9, -3, s * 22, -R.range(36, 84), R.range(0.4, 0.8), 0, R.range(1.2, 2.4), R.range(0, 0.18), i % 3 ? 0 : PF.SMOKES); }
  for (let i = 0; i < 26; i++) { const a = R.range(-Math.PI, 0), sp = R.range(50, 170); ps.spawn(P.SPARK, Math.cos(a) * 3, -5, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.3, 0.8), 0, 1, R.range(0, 0.1)); }
  for (let i = 0; i < 12; i++) ps.spawn(P.EMBER, R.range(-12, 12), -6, R.range(-14, 14), -R.range(26, 60), R.range(0.9, 1.6), C[3], 1, R.range(0.1, 0.5));
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); lights.update(dt); },
    draw(p) {
      // anel de calor correndo pelo chão, em perspectiva
      if (t < 0.5) { const u = t / 0.5, r = 6 + ease.outQuart(u) * 44, a = (1 - u) * 0.9; for (let k = 0; k < 60; k++) { const g = (k / 60) * TAU; p.dot(Math.cos(g) * r, -1 + Math.sin(g) * r * 0.16, k % 2 ? C[3] : C[2], a); } p.glowRing(0, -1, r, 3, C[2], 0.2 * a); }
      if (t < 0.1) sparkle(p, 0, -8, 12 * (1 - t / 0.1) + 2, C[4], C[3]);
      ps.draw(p); lights.draw(p);
    },
  };
}
