// O Mapinguari desaba: o peso racha o chão, levanta uma parede de poeira e terra, e a mata solta folhas e musgo por cima.
import { Particles, Lights, P, Rng, fit, TAU, clamp, ease } from "../../core/index.js";
import { Pedacos, Folhas } from "./_lib.js";

export const meta = { name: "Morte: Mapinguari", desc: "Um baque enorme: rachaduras correndo pelo chão, parede de poeira, torrões de terra e folhas caindo.", tags: ["death", "boss", "earth", "terra", "one-shot"], size: [420, 190], origin: [210, 160], duration: 4.6, loop: false, fps: 30, bg: "ground", options: { palette: ["#1c1610", "#3a2c1c", "#5e4830", "#8a6e4c", "#b89a70", "#e0ccA4"], leaf: ["#1e3a1c", "#3a6a28", "#6a9a30", "#a8c84a"], seed: 37 } };
const BAQUE = 0.28;

export function create(o) {
  const C = fit(o.palette, 6), L = fit(o.leaf, 4), R = new Rng(o.seed), lights = new Lights(), ps = new Particles({ rng: R, ground: () => 0 });
  const terra = new Pedacos(0), folhas = new Folhas(0);
  for (let i = 0; i < 38; i++) { const s = R.sign(), sp = R.range(60, 210); terra.add({ x: s * R.range(4, 30), y: -3, vx: s * sp * 0.75, vy: -R.range(90, 300), a: R.range(0, 6), va: R.range(-11, 11), w: R.range(2, 6), h: R.range(2, 4), c: C[R.range(0, 1) > 0.5 ? 2 : 1], c2: C[3], life: R.range(1.1, 2.3), delay: 0 }); }
  for (let i = 0; i < 46; i++) folhas.add({ x: R.range(-120, 120), y: -R.range(40, 150), v: R.range(20, 42), ph: R.range(0, 6.28), l: R.range(1.5, 3), sw: R.range(5, 12), c: L[1 + (i % 3)], delay: BAQUE + R.range(0, 0.9) });
  const ondas = Array.from({ length: 60 }, (_, i) => ({ s: i % 2 ? 1 : -1, sp: R.range(20, 150), r: R.range(4, 11), h: R.range(0, 22), d: BAQUE + R.range(0, 0.22), l: R.range(0.9, 1.8) }));
  const racha = [-1, 1].flatMap((s) => [0, 1].map((k) => { let x = s * 4, y = 0; const pts = [[x, y]]; const n = 9 - k * 3; for (let i = 0; i < n; i++) { x += s * R.range(9, 17); y = R.range(-1, 4 + k * 3); pts.push([x, y]); } return { pts }; }));
  let t = 0, fired = false;
  return {
    update(dt) {
      t += dt; lights.update(dt); folhas.update(dt);
      if (t > BAQUE) { terra.update(dt); ps.update(dt); }
      if (!fired && t > BAQUE) { fired = true; lights.add(0, -8, 100, C[4], 0.6, 0.45); for (let i = 0; i < 26; i++) { const a = R.range(-Math.PI, 0), sp = R.range(70, 240); ps.spawn(P.GRIT, Math.cos(a) * 8, -3, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.4, 0.9), C[2], 1); } for (let i = 0; i < 12; i++) ps.spawn(P.SMOKE, R.range(-40, 40), -6, R.range(-30, 30), -R.range(8, 34), R.range(1.2, 2.2), 0, R.range(2, 3.4), R.range(0, 0.4)); }
    },
    draw(p) {
      // antes do baque, o ar é sugado: poeira correndo para dentro
      if (t < BAQUE) { const u = t / BAQUE; for (let i = 0; i < 30; i++) { const a = (i / 30) * TAU, r = 80 * (1 - u) * (0.6 + (i % 5) * 0.1); p.dot(Math.cos(a) * r, -6 + Math.sin(a) * r * 0.14, C[4], u); } }
      const u0 = clamp((t - BAQUE) / 0.35);
      if (t > BAQUE) {
        const fade = clamp((3.6 - t) / 1.2);
        for (const c of racha) { const n = Math.ceil((c.pts.length - 1) * ease.outQuart(u0)); for (let i = 0; i < n; i++) { const [x0, y0] = c.pts[i], [x1, y1] = c.pts[i + 1]; p.line(x0, y0 + 1, x1, y1 + 1, C[0], fade); if (t < BAQUE + 0.5) p.line(x0, y0, x1, y1, C[5], 1 - (t - BAQUE) / 0.5); } }
        if (t < BAQUE + 0.1) { p.rect(-140, -6, 280, 6, C[5], 0.7); }
        // parede de poeira: dois rolos abrindo para os lados
        for (const w of ondas) { const v = (t - w.d) / w.l; if (v <= 0 || v >= 1) continue; const e = ease.outQuart(v), x = w.s * (10 + w.sp * e), y = -w.h * e - w.r * 0.4, r = w.r * (0.45 + 0.6 * e), a = (1 - v) ** 1.6; p.disc(x, y, r, C[1], a * 0.34); p.disc(x - w.s * 1.5, y - r * 0.3, r * 0.68, C[2], a * 0.34); p.disc(x - w.s * 2, y - r * 0.5, r * 0.34, C[3], a * 0.3); }
      }
      terra.draw(p); ps.draw(p); folhas.draw(p, clamp((4.5 - t) / 0.6)); lights.draw(p);
    },
  };
}
