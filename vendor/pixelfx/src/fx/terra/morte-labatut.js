// O Labatut vira pedra e racha: um sol branco atrás, trincas subindo pelo corpo, lascas caindo em ondas e areia escorrendo até o chão.
import { Particles, Lights, P, Rng, fit, clamp, sparkle } from "../../core/index.js";
import { Pedacos } from "./_lib.js";

export const meta = { name: "Morte: Labatut", desc: "Trincas sobem pelo corpo, lascas de pedra caem em ondas e a areia escorre, com um sol branco atrás.", tags: ["death", "boss", "stone", "desert", "terra", "one-shot"], size: [280, 210], origin: [140, 180], duration: 4.8, loop: false, fps: 30, bg: "ground", options: { palette: ["#2a2018", "#5a4a38", "#8a7a64", "#b8a68a", "#e0d0b0", "#fff8e0"], sol: "#ffdc8a", altura: 96, seed: 53 } };

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed), lights = new Lights(), H = o.altura;
  const ps = new Particles({ rng: R, ground: () => 0 }), lascas = new Pedacos(0);
  lights.add(0, -H * 0.75, 90, C[4], 0.7, 1.2);
  // trincas: várias linhas em zigue-zague subindo, com atraso
  const tr = Array.from({ length: 11 }, (_, i) => { let x = (i - 5) * 4.5 + R.range(-2, 2), y = 0; const pts = [[x, y]]; while (y > -H) { x += R.range(-6, 6); y -= R.range(6, 14); pts.push([clamp(x, -30, 30), Math.max(y, -H)]); } return { pts, d: R.range(0, 0.35) }; });
  // lascas soltam em três ondas, de cima para baixo
  const onda = (t0, n, y0, y1) => { for (let i = 0; i < n; i++) lascas.add({ x: R.range(-26, 26), y: -R.range(y0, y1), vx: R.range(-70, 70), vy: R.range(-40, 40), a: R.range(0, 6), va: R.range(-8, 8), w: R.range(3, 7), h: R.range(2, 5), c: C[R.range(0, 1) > 0.5 ? 2 : 1], c2: C[3], life: 99, nasce: t0 + R.range(0, 0.25), max: 99, bounce: 0.3, g: 0.9 }); };
  onda(0.65, 22, H * 0.65, H); onda(1.05, 24, H * 0.32, H * 0.7); onda(1.45, 24, 2, H * 0.36);
  for (const b of lascas.list) { b.life = 99; b.vivo = false; }
  for (let i = 0; i < 18; i++) ps.spawn(P.DUST, R.range(-30, 30), -1, R.range(-70, 70), -R.range(2, 14), R.range(0.8, 1.6), C[3], R.range(2, 3.6), R.range(0.9, 1.9));
  // areia escorrendo em fios
  const fios = Array.from({ length: 16 }, () => ({ x: R.range(-24, 24), y: -R.range(H * 0.2, H * 0.8), d: R.range(0.7, 2), l: R.range(1, 1.8) }));
  let t = 0;
  return {
    update(dt) {
      t += dt; lights.update(dt); ps.update(dt);
      const vivos = lascas.list.filter((b) => { if (!b.vivo && t > b.nasce) { b.vivo = true; b.life = 2 + R.range(0, 0.6); b.max = b.life; } return b.vivo; });
      const so = lascas.list; lascas.list = vivos; lascas.update(dt); lascas.list = so;
    },
    draw(p) {
      // o sol branco atrás dele, que nasce e encolhe
      const s = clamp(t / 0.25) * clamp((2.2 - t) / 1.2);
      if (s > 0) p.glow(0, -H * 0.8, 70 * s, C[4], 0.55 * s);
      // trincas acendendo de baixo para cima, depois escurecendo
      for (const c of tr) {
        const u = clamp((t - c.d) / 0.42), a = clamp((1.9 - t) / 0.5); if (u <= 0 || a <= 0) continue;
        const n = Math.ceil((c.pts.length - 1) * u);
        for (let i = 0; i < n; i++) { const [x0, y0] = c.pts[i], [x1, y1] = c.pts[i + 1], q = t < 0.9; p.line(x0, y0, x1, y1, q ? C[5] : C[0], a); if (q) p.glowLine(x0, y0, x1, y1, 4, C[4], 0.35 * a); }
      }
      for (const f of fios) { const u = (t - f.d) / f.l; if (u <= 0 || u >= 1) continue; const y = f.y + (-f.y) * u, a = Math.sin(u * Math.PI); for (let k = 0; k < 6; k++) p.dot(f.x + Math.sin(k + t * 3) * 0.6, Math.min(-1, y - k * 3), k % 2 ? C[3] : C[4], a); }
      const so = lascas.list; lascas.list = so.filter((b) => b.vivo); lascas.draw(p); lascas.list = so;
      if (t < 0.08) sparkle(p, 0, -H * 0.5, 20, C[5], C[4]);
      ps.draw(p); lights.draw(p);
    },
  };
}
