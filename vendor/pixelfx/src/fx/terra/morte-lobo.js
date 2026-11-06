// A fera do Prólogo vira cinza: um clarão frio, o corpo se desfaz da cabeça para os pés e o vento leva tudo para o lado.
import { Particles, Lights, P, Rng, fit, sparkle, clamp, ease } from "../../core/index.js";

export const meta = { name: "Morte: fera do Prólogo", desc: "O corpo se desfaz em cinza que o vento leva, com dois olhos que demoram a apagar.", tags: ["death", "boss", "ash", "terra", "one-shot"], size: [320, 160], origin: [90, 130], duration: 4, loop: false, fps: 30, bg: "dark", options: { palette: ["#14141c", "#2e2e3a", "#5a5a6c", "#8a8ca0", "#c8cadc", "#ffffff"], altura: 56, largura: 24, seed: 31 } };

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed), lights = new Lights(), ps = new Particles({ rng: R, ground: () => 0 });
  lights.add(0, -o.altura * 0.5, 60, C[4], 0.7, 0.5);
  // cada grão nasce no corpo (de cima para baixo, com atraso) e é levado pelo vento, que aumenta
  const A = o.altura, L = o.largura;
  const graos = Array.from({ length: 300 }, () => { const y = -R.range(1, A), w = L * (1 - Math.abs(y + A / 2) / (A * 0.72)); return { x: R.range(-w, w), y, d: 0.12 + (A + y) / A * 0.75 + R.range(0, 0.3), l: R.range(1.4, 2.6), v: R.range(55, 140), up: R.range(4, 26), ph: R.range(0, 6.28), tom: R.range(0, 1), big: R.range(0, 1) > 0.55 }; });
  for (let i = 0; i < 10; i++) ps.spawn(P.VAPOUR, R.range(-14, 14), -R.range(1, o.altura),R.range(20, 60), -R.range(2, 14), R.range(0.9, 1.7), C[2], R.range(2.5, 4.5), R.range(0.2, 1));
  for (let i = 0; i < 8; i++) ps.spawn(P.DUST, R.range(-18, 18), -1, R.range(10, 60), -R.range(0, 6), R.range(0.6, 1.2), C[2], R.range(1.5, 3), R.range(0.3, 1));
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); lights.update(dt); },
    draw(p) {
      if (t < 0.12) sparkle(p, 0, -o.altura * 0.6, 18 * (1 - t / 0.12) + 3, C[5], C[4]);
      for (const g of graos) {
        const u = (t - g.d) / g.l; if (u <= 0 || u >= 1) { if (u <= 0 && t > g.d - 0.5) p.dot(g.x, g.y, C[1], 0.5); continue; }
        const e = ease.inQuad ? ease.inQuad(u) : u * u, x = g.x + g.v * e * 1.5, y = g.y - g.up * u + Math.sin(u * 7 + g.ph) * 3 * u, al = clamp((1 - u) * 1.6), c = C[g.tom < 0.4 ? 2 : g.tom < 0.8 ? 3 : 4];
        p.dot(x, y, c, al); if (g.big) { p.dot(x + 1, y, c, al * 0.8); p.dot(x, y + 1, C[1], al * 0.7); }
      }
      // os dois olhos ficam por último e se apagam juntos
      const olho = clamp((2.1 - t) / 0.5) * (t < 0.1 ? 0 : 1);
      if (olho > 0) { const dy = Math.max(0, t - 1) * 3; for (const dx of [L * 0.6, L * 0.6 + 4]) { p.dot(dx, -A * 0.78 - dy, C[5], olho); p.glow(dx, -A * 0.78 - dy, 6, C[4], 0.4 * olho); } }
      ps.draw(p); lights.draw(p);
    },
  };
}
