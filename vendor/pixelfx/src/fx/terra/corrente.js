// Uma corrente do Boitatá se parte: estalo branco, onda de choque, elos grossos de ferro voando e quicando no chão,
// e línguas de fogo frio escapando para cima pelo buraco.
import { Particles, Lights, P, Rng, fit, sparkle, flare, clamp, TAU, GRAVITY, ease } from "../../core/index.js";

export const meta = {
  name: "Corrente partida",
  desc: "Um estalo branco parte a corrente: onda de choque, elos de ferro voam e quicam, fogo frio escapa para cima.",
  tags: ["chain", "break", "impact", "boss", "terra", "one-shot"],
  size: [256, 176],
  origin: [128, 132],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#1a3a6a", "#3a8ad8", "#7ad8ff", "#e8fbff"], iron: ["#14141c", "#44444e", "#8a8a96", "#d8d8e4"], floor: 30, seed: 17 },
};

export function create(o) {
  const C = fit(o.palette, 4), I = fit(o.iron, 4), R = new Rng(o.seed), floor = () => o.floor;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[3], C[2], C[1], C[0]] }), lights = new Lights();
  lights.add(0, 0, 80, C[1], 0.9, 1.1); lights.add(0, 0, 28, C[3], 1, 0.2);
  for (let i = 0; i < 46; i++) { const a = R.range(0, TAU), sp = R.range(80, 320); ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp - 50, R.range(0.3, 0.95)); }
  for (let i = 0; i < 16; i++) ps.spawn(P.VAPOUR, R.range(-8, 8), R.range(-4, 4), R.range(-30, 30), -R.range(18, 54), R.range(0.8, 1.6), C[0], R.range(2.5, 5), R.range(0.05, 0.4));
  for (let i = 0; i < 16; i++) ps.spawn(P.EMBER, R.range(-10, 10), R.range(-6, 6), R.range(-22, 22), -R.range(30, 80), R.range(0.9, 1.8), C[2], 1, R.range(0.1, 0.8));
  // elos grossos, de dois tamanhos, que giram e quicam
  const links = Array.from({ length: 10 }, (_, i) => { const a = R.range(-Math.PI * 0.95, -Math.PI * 0.05), sp = R.range(80, 215); return { x: R.range(-3, 3), y: R.range(-3, 3), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, a: R.range(0, TAU), va: R.range(-14, 14), r: i % 3 ? 4 : 5, life: R.range(1.6, 2.5) }; });
  // línguas de fogo frio saindo do ponto partido
  const tongues = Array.from({ length: 9 }, () => ({ x: R.range(-13, 13), d: R.range(0, 0.5), h: R.range(18, 44), l: R.range(0.55, 0.95), ph: R.range(0, TAU) }));
  let t = 0;
  return {
    update(dt) {
      t += dt; ps.update(dt); lights.update(dt);
      for (const l of links) {
        l.life -= dt; if (l.life <= 0) continue;
        l.vy += GRAVITY * 0.8 * dt; l.x += l.vx * dt; l.y += l.vy * dt; l.a += l.va * dt;
        if (l.y > o.floor - 3) { l.y = o.floor - 3; if (Math.abs(l.vy) > 40) { l.vy *= -0.45; l.vx *= 0.7; l.va *= 0.6; } else { l.vy = 0; l.vx *= 0.8; l.va = 0; l.a = 0; } }
      }
    },
    draw(p) {
      if (t < 0.09) flare(p, 0, 0, 44 * (1 - t / 0.09) + 12, 1, [C[1], C[2], C[3], C[3]]);
      else if (t < 0.2) sparkle(p, 0, 0, 12, C[3], C[2]);
      // onda de choque: um anel fino que abre e some
      if (t < 0.4) { const u = t / 0.4, r = 8 + ease.outQuart(u) * 58, a = (1 - u) ** 2; for (let k = 0; k < 80; k++) { const g = (k / 80) * TAU; p.dot(Math.cos(g) * r, Math.sin(g) * r * 0.82, k % 2 ? C[3] : C[2], a); } p.glowRing(0, 0, r, 4, C[1], 0.25 * a); }
      for (const f of tongues) {
        const u = (t - f.d) / f.l; if (u <= 0 || u >= 1) continue;
        const top = -f.h * ease.outQuart(Math.min(1, u * 1.6)) * (1 - u * 0.25), a = clamp((1 - u) * 1.8);
        for (let i = 0; i <= 1; i += 0.06) { const y = top * i, w = (1 - i) * 3.4 * (1 - u * 0.5) + 0.4, x = f.x * (1 - i * 0.45) + Math.sin(i * 7 + t * 12 + f.ph) * 2.2 * i; p.line(x - w, y, x + w, y, i < 0.3 ? C[3] : i < 0.65 ? C[2] : C[1], a); }
        p.glow(f.x, top * 0.4, 12, C[1], 0.22 * a);
      }
      for (const l of links) {
        if (l.life <= 0) continue;
        const a = clamp(l.life / 0.4), r = l.r, ca = Math.cos(l.a), sa = Math.sin(l.a);
        // o elo: anel achatado de dois pixels, escuro por fora e aceso no lado de cima
        for (let k = 0; k < 22; k++) { const g = (k / 22) * TAU; for (const q of [1, 0.62]) { const ex = Math.cos(g) * r * q, ey = Math.sin(g) * r * 0.62 * q, x = l.x + ex * ca - ey * sa, y = l.y + ex * sa + ey * ca; p.dot(x, y, q === 1 ? I[0] : y < l.y ? I[3] : I[2], a); } }
      }
      ps.draw(p); lights.draw(p);
    },
  };
}
