// O Pai do Mato se entrega à água: anéis abrindo, a lamparina apaga numa fumacinha, bolhas e vaga-lumes sobem e pétalas caem na água.
import { Particles, Lights, P, Rng, fit, clamp, TAU, ease } from "../../core/index.js";
import { Folhas } from "./_lib.js";

export const meta = { name: "Morte: Pai do Mato", desc: "Anéis na água, a lamparina se apagando, bolhas, vaga-lumes subindo e pétalas caindo.", tags: ["death", "boss", "water", "nature", "terra", "one-shot"], size: [300, 190], origin: [150, 150], duration: 5.2, loop: false, fps: 30, bg: "dark", options: { palette: ["#1a1438", "#3a2a6a", "#6a58a8", "#a898d8", "#d8d0f0", "#ffffff"], luz: ["#c88a2a", "#ffd27a", "#fff6c8"], vaga: ["#6a8a1a", "#c8f05a", "#f4ffb8"], petala: ["#e070a8", "#f8b8d8"], lx: 26, ly: -36, seed: 47 } };

export function create(o) {
  const C = fit(o.palette, 6), Lz = fit(o.luz, 3), V = fit(o.vaga, 3), Pt = fit(o.petala, 2), R = new Rng(o.seed), lights = new Lights();
  const ps = new Particles({ rng: R, ground: () => 40 }), pet = new Folhas(0);
  lights.add(o.lx, o.ly, 50, Lz[1], 0.8, 1.1);
  for (let i = 0; i < 7; i++) ps.spawn(P.VAPOUR, o.lx + R.range(-2, 2), o.ly - 2, R.range(-6, 6), -R.range(14, 32), R.range(0.8, 1.5), C[3], R.range(1.2, 2), 0.7 + i * 0.07);
  const aneis = Array.from({ length: 3 }, (_, i) => ({ d: i * 0.9, l: 2 + R.range(0, 0.6), r: 70 + R.range(0, 40), x: R.range(-12, 12) }));
  const bolhas = Array.from({ length: 12 }, () => ({ x: R.range(-26, 26), d: R.range(0, 2.8), l: R.range(0.5, 1.1), h: R.range(16, 46), r: R.range(0, 1) > 0.7 ? 2 : 1 }));
  const vaga = Array.from({ length: 26 }, () => ({ x: R.range(-30, 30), y: -R.range(4, 50), d: R.range(0.8, 2.6), l: R.range(1.4, 2.4), v: R.range(30, 62), ax: R.range(8, 24), ph: R.range(0, TAU) }));
  for (let i = 0; i < 18; i++) pet.add({ x: R.range(-70, 70), y: -R.range(60, 130), v: R.range(14, 28), ph: R.range(0, 6), l: 1.6, sw: R.range(5, 11), c: Pt[i % 2], delay: R.range(1, 3) });
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); lights.update(dt); pet.update(dt); },
    draw(p) {
      for (const a of aneis) {
        const u = (t - a.d) / a.l; if (u <= 0 || u >= 1) continue;
        const r = 6 + ease.outCubic(u) * a.r, al = (1 - u) ** 1.3;
        for (let k = 0; k < 64; k++) { const g = (k / 64) * TAU; if (k % 9 === 8) continue; p.dot(a.x + Math.cos(g) * r, Math.sin(g) * r * 0.2, k % 3 ? C[3] : C[4], al); }
      }
      // a lamparina: a chama diminui e pisca antes de apagar
      const ch = clamp((1.1 - t) / 0.9), pis = Math.sin(t * 28) > -0.4 ? 1 : 0.35;
      if (ch > 0) { const h = 7 * ch; p.disc(o.lx, o.ly - h * 0.5, 2 + 2 * ch, Lz[1], pis); p.dot(o.lx, o.ly - h, Lz[2], pis); p.glow(o.lx, o.ly - 2, 22 * ch + 4, Lz[1], 0.6 * ch * pis); }
      for (const b of bolhas) { const u = (t - b.d) / b.l; if (u <= 0 || u >= 1) continue; const y = -u * b.h, x = b.x + Math.sin(u * 8 + b.h) * 2, al = clamp((1 - u) * 2); p.dot(x, y, C[4], al); if (b.r > 1) { p.dot(x + 1, y, C[3], al); p.dot(x, y - 1, C[5], al); p.dot(x - 1, y, C[3], al); } }
      for (const v of vaga) { const u = (t - v.d) / v.l; if (u <= 0 || u >= 1) continue; const x = v.x + Math.sin(u * 5 + v.ph) * v.ax, y = v.y - u * v.v, pulso = Math.max(0, Math.sin(u * 18 + v.ph)) * Math.sin(u * Math.PI); if (pulso < 0.05) continue; p.dot(x, y, pulso > 0.5 ? V[2] : V[1], 1); p.dot(x + 1, y, V[1], pulso); p.dot(x, y + 1, V[1], pulso); p.glow(x, y, 9, V[1], 0.8 * pulso); }
      pet.draw(p, clamp((5 - t) / 0.6));
      ps.draw(p); lights.draw(p);
    },
  };
}
