// O Capelobo é consumido por dentro: rachaduras de brasa pelo corpo, labaredas subindo em volta, e sobra uma coluna de fumaça com fagulhas.
import { Particles, Lights, P, PF, Rng, fit, clamp, sparkle } from "../../core/index.js";

export const meta = { name: "Morte: Capelobo", desc: "Rachaduras de brasa no corpo, fogo subindo em espiral e uma coluna de fumaça com fagulhas.", tags: ["death", "boss", "fire", "terra", "one-shot"], size: [240, 230], origin: [120, 200], duration: 5, loop: false, fps: 30, bg: "dark", options: { palette: ["#2a0a06", "#6a1a0a", "#c8401a", "#ff8a2a", "#ffd06a", "#fff4d0"], seed: 41 } };

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed), lights = new Lights();
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[5], C[4], C[3], C[2]] });
  lights.add(0, -30, 90, C[3], 0.75, 2.4); lights.add(0, -30, 34, C[5], 0.8, 0.4);
  for (let i = 0; i < 70; i++) { const a = i * 0.55, h = i * 1.1; ps.spawn(P.FIRE, Math.cos(a) * (18 - h * 0.12), -2 - (i % 12) * 2, Math.cos(a) * 8, -R.range(50, 120), R.range(0.45, 0.95), 0, R.range(1.3, 2.8), i * 0.022, i % 4 ? 0 : PF.SMOKES); }
  for (let i = 0; i < 16; i++) ps.spawn(P.SMOKE, R.range(-12, 12), -R.range(20, 50), R.range(-10, 10), -R.range(20, 50), R.range(1.6, 2.8), 0, R.range(2.4, 4), 1 + R.range(0, 1.4), PF.BIG);
  for (let i = 0; i < 44; i++) ps.spawn(P.EMBER, R.range(-20, 20), -R.range(2, 50), R.range(-24, 24), -R.range(30, 80), R.range(1, 2.4), C[R.range(0, 1) > 0.5 ? 3 : 4], 1, R.range(0.1, 2.2));
  for (let i = 0; i < 30; i++) { const a = R.range(-Math.PI, 0), sp = R.range(70, 200); ps.spawn(P.SPARK, Math.cos(a) * 8, -28, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.3, 0.8), 0, 1, R.range(0, 0.3)); }
  // rachaduras em cima do corpo, que acendem do chão para cima
  const rach = Array.from({ length: 9 }, () => { let x = R.range(-14, 14), y = -R.range(0, 8); const pts = [[x, y]]; const n = 4 + (R.range(0, 4) | 0); for (let i = 0; i < n; i++) { x += R.range(-5, 5); y -= R.range(4, 9); pts.push([x, y]); } return { pts, d: R.range(0, 0.5) }; });
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); lights.update(dt); },
    draw(p) {
      for (const c of rach) {
        const u = clamp((t - c.d) / 0.5), a = clamp((2 - t) / 0.7); if (u <= 0 || a <= 0) continue;
        const n = Math.ceil((c.pts.length - 1) * u);
        for (let i = 0; i < n; i++) { const [x0, y0] = c.pts[i], [x1, y1] = c.pts[i + 1]; p.line(x0, y0, x1, y1, i % 2 ? C[4] : C[5], a); p.glowLine(x0, y0, x1, y1, 5, C[3], 0.4 * a); }
      }
      // brasa no chão, que vai esfriando
      const b = clamp((4.8 - t) / 2);
      for (let i = -16; i <= 16; i += 2) { const on = Math.sin(i * 1.7 + t * 5) > -0.2; if (on) p.dot(i, -1, t < 2.6 ? C[3] : C[2], b); }
      p.glow(0, -2, 34, C[2], 0.4 * b);
      if (t < 0.1) sparkle(p, 0, -30, 14, C[5], C[4]);
      ps.draw(p); lights.draw(p);
    },
  };
}
