// O uivo do Capelobo: arcos de som saindo da boca para a frente, faíscas de capim e o ar tremendo.
import { Rng, fit, clamp, ease } from "../../core/index.js";

export const meta = { name: "Uivo", desc: "Arcos de som abrindo a partir da boca, voltados para a frente, com capim seco voando.", tags: ["howl", "boss", "sound", "terra", "one-shot"], size: [280, 170], origin: [40, 90], duration: 1.3, loop: false, fps: 30, bg: "dark", options: { palette: ["#3a0a0a", "#8a1a1a", "#d8402a", "#ff9a6a", "#ffe0c8"], seed: 61 } };

export function draw(p, t, o) {
  const C = fit(o.palette, 5), R = new Rng(o.seed);
  for (let i = 0; i < 5; i++) {
    const u = clamp((t - i * 0.13) / 0.8); if (u <= 0 || u >= 1) continue;
    const r = 12 + ease.outCubic(u) * 200, a = (1 - u) ** 1.4, ab = 0.75 - u * 0.2;
    for (let k = 0; k <= 60; k++) {
      const g = -ab + (k / 60) * ab * 2, x = Math.cos(g) * r, y = Math.sin(g) * r * 0.8;
      if (Math.sin(k * 0.9 + i) < -0.75) continue;
      p.dot(x, y, k % 4 ? C[2] : C[3], a);
      if (i < 2 && u < 0.5) p.dot(x - 2, y, C[4], a * 0.7);
    }
    p.glow(r * 0.8, 0, 22, C[2], 0.2 * a);
  }
  for (let i = 0; i < 26; i++) {
    const d = R.range(0, 0.4), sp = R.range(60, 200), an = R.range(-0.7, 0.7), l = R.range(1, 3), u = clamp((t - d) / 0.8); const th = R.range(0, 6);
    if (u <= 0 || u >= 1) continue;
    const x = Math.cos(an) * sp * u, y = Math.sin(an) * sp * u + 18 * u * u;
    p.line(x, y, x + Math.cos(th + u * 8) * l, y + Math.sin(th + u * 8) * l, 0xd8a83a, 1 - u);
  }
}
