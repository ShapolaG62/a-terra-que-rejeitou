// Um selo de cipó-de-sangue se rompe: um rasgo vermelho em zigue-zague, seiva espirrando, pedaços de vinha caindo e
// quicando, folhas secas descendo e poeira no chão.
import { Particles, Lights, P, Rng, fit, sparkle, clamp, TAU, GRAVITY } from "../../core/index.js";

export const meta = {
  name: "Selo de sangue rompido",
  desc: "Os cipós-de-sangue se rasgam: rasgo vermelho, seiva, pedaços de vinha caindo e folhas secas descendo.",
  tags: ["gate", "vine", "blood", "break", "terra", "one-shot"],
  size: [188, 144],
  origin: [94, 128],
  duration: 3.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a0a10", "#6a1020", "#c8203a", "#ff6a5a", "#ffd0c0"], leaf: ["#3a2a18", "#6a5228", "#9a7a3a"], height: 90, seed: 19 },
};

export function create(o) {
  const C = fit(o.palette, 5), L = fit(o.leaf, 3), R = new Rng(o.seed), h = o.height;
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[4], C[3], C[2], C[1]] }), lights = new Lights();
  lights.add(0, -h / 2, 58, C[2], 0.9, 0.8); lights.add(0, -h / 2, 22, C[4], 0.9, 0.16);
  for (let i = 0; i < 34; i++) { const a = R.range(-Math.PI, 0.2), sp = R.range(50, 190), y = -R.range(6, h); ps.spawn(P.SPARK, R.range(-5, 5), y, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.3, 0.8)); }
  for (let i = 0; i < 12; i++) ps.spawn(P.DUST, R.range(-16, 16), -1, R.range(-44, 44), -R.range(2, 12), R.range(0.5, 1), L[1], R.range(1.8, 3.2), R.range(0.15, 0.5));
  // o rasgo: uma linha em zigue-zague de cima a baixo
  const tear = []; { let x = 0; for (let y = -h; y <= 0; y += 6) { x = clamp(x + R.range(-5, 5), -8, 8); tear.push([x, y]); } }
  // pedaços de vinha: arcos curtos que giram, caem e quicam
  const ch = Array.from({ length: 20 }, (_, i) => ({ x: R.range(-9, 9), y: -R.range(6, h), vx: R.range(-85, 85), vy: R.range(-90, 0), a: R.range(0, TAU), va: R.range(-9, 9), l: R.range(3, 7), c: i % 3 ? C[1] : C[2], life: R.range(1.3, 2.5) }));
  const leaves = Array.from({ length: 14 }, (_, i) => ({ x: R.range(-34, 34), y: -R.range(10, h + 10), ph: R.range(0, TAU), v: R.range(18, 34), d: R.range(0.05, 0.5), c: L[i % 2 ? 1 : 2] }));
  let t = 0;
  return {
    update(dt) {
      t += dt; ps.update(dt); lights.update(dt);
      for (const f of ch) {
        f.life -= dt; if (f.life <= 0) continue;
        f.vy += GRAVITY * 0.7 * dt; f.vx *= 1 - 0.8 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.a += f.va * dt;
        if (f.y > -1) { f.y = -1; if (Math.abs(f.vy) > 40) { f.vy *= -0.3; f.vx *= 0.6; f.va *= 0.5; } else { f.vy = 0; f.vx *= 0.7; f.va = 0; f.a = 0; } }
      }
    },
    draw(p) {
      if (t < 0.22) {
        const u = t / 0.22, a = 1 - u, w = 1 + (1 - u) * 2;
        for (let i = 0; i + 1 < tear.length; i++) { const [x0, y0] = tear[i], [x1, y1] = tear[i + 1]; p.beam(x0, y0, x1, y1, w, u < 0.4 ? C[4] : C[3], a); p.glowLine(x0, y0, x1, y1, 8, C[2], 0.35 * a); }
        if (t < 0.08) { const m = tear[tear.length >> 1]; sparkle(p, m[0], m[1], 15, C[4], C[3]); }
      }
      const fa = clamp(3.2 - t);
      for (const f of leaves) {
        const u = t - f.d; if (u <= 0) continue;
        const y = f.y + f.v * u; if (y > -1) continue;
        const x = f.x + Math.sin(u * 2.4 + f.ph) * 7, a = Math.cos(u * 3 + f.ph) * 2;
        p.line(x - a, y, x + a, y + 1, f.c, fa);
      }
      for (const f of ch) {
        if (f.life <= 0) continue;
        const a = clamp(f.life / 0.4), dx = Math.cos(f.a) * f.l, dy = Math.sin(f.a) * f.l, mx = -dy * 0.28, my = dx * 0.28;
        p.line(f.x - dx, f.y - dy, f.x + mx, f.y + my, f.c, a); p.line(f.x + mx, f.y + my, f.x + dx, f.y + dy, f.c, a);
        p.line(f.x - dx, f.y - dy - 1, f.x + mx, f.y + my - 1, C[0], a);
      }
      ps.draw(p); lights.draw(p);
    },
  };
}
