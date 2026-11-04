// Memórias se soltando: um clarão pequeno e fagulhas azuis e douradas que sobem em espiral e se apagam.
import { Lights, Rng, fit, sparkle, clamp, TAU } from "../../core/index.js";

export const meta = {
  name: "Memórias subindo",
  desc: "Um clarão e fagulhas de memória que sobem em espiral, ao matar um bicho ou recolher memórias.",
  tags: ["pickup", "memory", "soul", "terra", "one-shot"],
  size: [72, 84],
  origin: [36, 70],
  duration: 1.5,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#2a4a7a", "#5a98d8", "#bfe4ff", "#f6e3a6", "#ffffff"], count: 12, seed: 11 },
};

export function create(o) {
  const C = fit(o.palette, 5), R = new Rng(o.seed), lights = new Lights();
  lights.add(0, -8, 22, C[2], 0.6, 0.35);
  const ms = Array.from({ length: o.count }, () => ({ a: R.range(0, TAU), r: R.range(4, 12), v: R.range(20, 46), w: R.range(3, 6) * R.sign(), d: R.range(0, 0.35), l: R.range(0.7, 1.05), c: R.range(0, 1) }));
  let t = 0;
  return {
    update(dt) { t += dt; lights.update(dt); },
    draw(p) {
      if (t < 0.14) sparkle(p, 0, -8, 7 * (1 - t / 0.14) + 1, C[4], C[2]);
      for (const m of ms) {
        const u = (t - m.d) / m.l; if (u <= 0 || u >= 1) continue;
        const a = m.a + m.w * u * 1.4, r = m.r * (1 - u * 0.5), x = Math.cos(a) * r, y = -6 - m.v * u * 1.2 - u * 18, al = clamp(Math.min(u * 6, (1 - u) * 2.2));
        const c = m.c > 0.72 ? C[3] : u < 0.5 ? C[2] : C[1];
        p.dot(x, y, c, al); p.dot(x - Math.cos(a), y + 1.5, C[1], al * 0.5);
        p.glow(x, y, 3, c, 0.3 * al);
      }
      lights.draw(p);
    },
  };
}
