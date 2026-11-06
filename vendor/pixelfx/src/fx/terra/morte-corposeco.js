// A terra enfim aceita o Corpo-seco: raízes rompem o chão, curvam-se sobre ele e o puxam para baixo; miasma roxo escapa, ossos caem e almas pálidas vão embora.
import { Particles, Lights, P, Rng, fit, clamp, TAU, ease } from "../../core/index.js";
import { Pedacos } from "./_lib.js";

export const meta = { name: "Morte: Corpo-seco", desc: "Raízes rompem o chão, curvam-se sobre ele e voltam para baixo levando-o; miasma roxo, ossos caindo e almas que vão embora.", tags: ["death", "boss", "shadow", "terra", "one-shot"], size: [320, 260], origin: [160, 220], duration: 6, loop: false, fps: 30, bg: "dark", options: { palette: ["#07040c", "#1c0e26", "#3a1a4a", "#6a3080", "#a860c0", "#e8c8f0"], osso: ["#8a8070", "#d8d0c0", "#f4efe2"], alma: "#bcd8e8", seed: 59 } };

export function create(o) {
  const C = fit(o.palette, 6), Os = fit(o.osso, 3), R = new Rng(o.seed), lights = new Lights();
  const ps = new Particles({ rng: R, ground: () => 0 }), ossos = new Pedacos(0);
  lights.add(0, -50, 90, C[3], 0.55, 1.6);
  for (let i = 0; i < 26; i++) ps.spawn(P.VAPOUR, R.range(-22, 22), -R.range(4, 60), R.range(-34, 34), -R.range(8, 38), R.range(1.3, 2.6), C[2 + (i % 2)], R.range(3, 6), R.range(0.1, 2.6));
  for (let i = 0; i < 18; i++) ossos.add({ x: R.range(-22, 22), y: -R.range(30, 96), vx: R.range(-60, 60), vy: -R.range(10, 90), a: R.range(0, 6), va: R.range(-9, 9), w: R.range(4, 9), h: 1, c: Os[1], c2: Os[2], life: R.range(2.2, 3.6), g: 0.7, bounce: 0.25 });
  // raízes: nascem longe, curvam-se para ele e voltam para o chão, como quem puxa
  const raizes = Array.from({ length: 12 }, (_, i) => { const s = i % 2 ? 1 : -1, x0 = s * R.range(26, 110); return { x0, s, h: R.range(40, 100), d: R.range(0, 0.5), ph: R.range(0, 6), w: R.range(2, 4) }; });
  const almas = Array.from({ length: 12 }, () => ({ x: R.range(-20, 20), y: -R.range(20, 70), d: R.range(1, 3.2), l: R.range(1.4, 2.4), s: R.sign(), ph: R.range(0, TAU) }));
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); ossos.update(dt); lights.update(dt); },
    draw(p) {
      for (const r of raizes) {
        const v = t - r.d, sobe = ease.outCubic(clamp(v / 0.5)), recua = clamp((v - 1.3) / 0.9) ** 2, k = sobe * (1 - recua); if (k <= 0.01) continue;
        const n = 16, pts = [];
        for (let i = 0; i <= n; i++) { const u = (i / n) * k, x = r.x0 + (-r.s) * u * u * Math.abs(r.x0) * 0.72 * (1 - recua * 0.5) + Math.sin(u * 5 + r.ph) * 4, y = -u * r.h; pts.push([x, y, u]); }
        for (let i = 0; i < n; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], w = r.w * (1 - i / n) + 0.6; p.beam(x0, y0, x1, y1, w + 1, C[1]); p.line(x0 - 1, y0, x1 - 1, y1, C[3], 1); if (i % 3 === 0) p.dot(x0 + 1, y0, C[4], 1); }
        // ponta com espinho e terra saltando na base
        const [xe, ye] = pts[n]; p.dot(xe, ye - 1, C[3], 1);
        if (v < 0.25) for (let i = 0; i < 4; i++) p.dot(r.x0 + (i - 2) * 4, -2 - v * 22 * (i % 2 ? 1 : 0.6), C[1], 1);
      }
      ossos.draw(p);
      for (const a of almas) {
        const u = (t - a.d) / a.l; if (u <= 0 || u >= 1) continue;
        const x = a.x + a.s * u * 46 + Math.sin(u * 6 + a.ph) * 6, y = a.y - u * 90, al = Math.sin(u * Math.PI) * 0.85;
        p.disc(x, y, 2.6, 0xe8d8bc, al * 0.6); p.dot(x, y - 1, 0xffffff, al); for (let k = 1; k < 5; k++) p.dot(x - Math.sin(u * 6 + k) * 1.5, y + k * 1.6, 0xe8d8bc, al * (1 - k / 5)); p.glow(x, y, 8, 0xe8d8bc, 0.3 * al);
      }
      ps.draw(p); lights.draw(p);
    },
  };
}
