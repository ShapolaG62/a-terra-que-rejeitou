// O Boitatá é solto: uma serpente de fogo frio sobe em espiral até sumir no alto, escamas caem brilhando e o chão fica azul por um tempo.
import { Particles, Lights, P, Rng, fit, clamp, TAU, sparkle, ease } from "../../core/index.js";

export const meta = { name: "Libertação: Boitatá", desc: "Uma serpente de fogo frio sobe em espiral até sumir, deixando escamas caindo e luz azul no chão.", tags: ["death", "boss", "fire", "spirit", "terra", "one-shot"], size: [320, 330], origin: [160, 300], duration: 4.6, loop: false, fps: 30, bg: "dark", options: { palette: ["#0a1a3a", "#1a4a8a", "#2a8ad0", "#7ae0ff", "#d8f8ff", "#ffffff"], seed: 43 } };

export function create(o) {
  const C = fit(o.palette, 6), R = new Rng(o.seed), lights = new Lights();
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [C[5], C[4], C[3], C[2]] });
  lights.add(0, -60, 110, C[2], 0.7, 2.6);
  for (let i = 0; i < 34; i++) { const a = R.range(0, TAU), sp = R.range(40, 150); ps.spawn(P.SPARK, Math.cos(a) * 10, -8, Math.cos(a) * sp, Math.sin(a) * sp * 0.6 - 90, R.range(0.4, 0.9)); }
  // escamas caindo, girando e piscando
  const esc = Array.from({ length: 34 }, () => ({ x: R.range(-60, 60), y: -R.range(60, 250), v: R.range(30, 62), d: R.range(0.5, 1.9), ph: R.range(0, TAU), sw: R.range(4, 12) }));
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); lights.update(dt); },
    draw(p) {
      // a serpente: uma fita contínua, da cabeça ao rabo, seguindo a mesma espiral até sair pelo alto
      const sobe = Math.min(1, t / 3.8), cab = sobe * sobe * (3 - 2 * sobe) * 2.3, N = 96;
      for (let i = N; i >= 0; i--) {
        const u = cab - i * 0.0115; if (u <= 0 || u > 1.15) continue;
        const y = -4 - u * 262, r = 40 * (1 - u * 0.65), a = u * 13, x = Math.cos(a) * r, frente = Math.sin(a) > 0, k = 1 - i / N;
        const w = 1 + 5 * Math.sin(k * Math.PI * 0.9 + 0.1);
        const al = clamp((1.15 - u) / 0.2) * (frente ? 1 : 0.55);
        p.disc(x, y, w + 1, C[frente ? 2 : 1], al);
        if (i % 2 === 0) p.disc(x, y, w * 0.55, C[frente ? 3 : 2], al);
        if (i % 7 === 0) { p.dot(x, y, C[5], al); p.glow(x, y, w * 4, C[2], 0.3 * al); }
        if (i === 0) { p.disc(x, y, w + 2, C[4], al); p.dot(x + 2, y - 1, C[5], al); sparkle(p, x, y, 6, C[5], C[4], al); }
      }
      for (const e of esc) { const q = t - e.d; if (q <= 0) continue; const y = e.y + e.v * q; if (y > -1) continue; const x = e.x + Math.sin(q * 2.2 + e.ph) * e.sw, on = Math.sin(q * 11 + e.ph) > -0.2, al = clamp((4.5 - t) / 0.6); p.dot(x, y, on ? C[4] : C[2], al); p.dot(x + 1, y, C[2], al * 0.7); if (on) p.glow(x, y, 3, C[3], 0.25 * al); }
      // o chão fica azul e vai apagando
      const ch = clamp(t / 0.3) * clamp((4.4 - t) / 1.6);
      for (let i = 0; i < 48; i++) { const g = (i / 48) * TAU, r = 18 + ease.outQuart(clamp(t / 1)) * 46; p.dot(Math.cos(g) * r, Math.sin(g) * r * 0.16 - 1, i % 2 ? C[3] : C[2], ch); }
      p.glow(0, -1, 56, C[2], 0.3 * ch);
      ps.draw(p); lights.draw(p);
    },
  };
}
