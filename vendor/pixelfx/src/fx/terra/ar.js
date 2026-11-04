// O ar de cada bioma, na largura da tela do jogo (432 x 243): folhas, brasas, poeira, vaga-lumes, cinzas, sementes
// e o ar parado da gruta. Em três profundidades, seguindo a câmera com parallax (o.camx).
import { cycle, fit, clamp, TAU } from "../../core/index.js";

const W = 432, H = 243, D = 12;
export const meta = {
  name: "Ar do bioma",
  desc: "Partículas de ambiente de cada bioma, em três profundidades, com parallax.",
  tags: ["ambient", "weather", "terra", "loop"],
  size: [W, H],
  origin: [0, 0],
  duration: D,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { kind: "folhas", camx: 0, palette: ["#2a5226", "#4a842c", "#8cbc3a", "#d8c84a"], seed: 7 },
};

const wrap = (x) => ((x % W) + W) % W;
const fade = (age, L, k = 0.15) => clamp(Math.min(age, L - age) / (L * k));

// bichos miúdos na escala do jogo: borboletas de 3 px batendo asa e bandos distantes em V
function bichos(p, t, o, cols) {
  cycle(t, D, 7, o.seed + 21, (g) => 7 + g.next() * 4, (age, L, r, i) => {
    const ph = r.next() * TAU, x0 = r.next() * W, y0 = 120 + r.next() * 90, c = cols[i % cols.length];
    const x = wrap(x0 + 7 * age + Math.sin(age * 0.8 + ph) * 18 - o.camx * 0.75), y = y0 + Math.sin(age * 1.7 + ph) * 9 + Math.sin(age * 7 + ph) * 1.5;
    const a = fade(age, L), up = Math.sin(age * 16 + ph) > 0;
    p.dot(x, y, 0x1a1414, a);
    p.dot(x - 1, y + (up ? -1 : 0), c, a); p.dot(x + 1, y + (up ? -1 : 0), c, a);
    if (up) { p.dot(x - 2, y - 2, c, a * 0.8); p.dot(x + 2, y - 2, c, a * 0.8); } else { p.dot(x - 2, y, c, a * 0.8); p.dot(x + 2, y, c, a * 0.8); }
  });
  cycle(t, D, 2, o.seed + 22, 9, (age, L, r) => {
    const x0 = r.next() * W, y0 = 30 + r.next() * 50, a = fade(age, L) * 0.8;
    for (let k = 0; k < 5; k++) { const s = k % 2 ? 1 : -1, n = (k + 1) >> 1, x = wrap(x0 + 26 * age - n * 6 - o.camx * 0.12), y = y0 + s * n * 3 + Math.sin(age + k); const up = Math.sin(age * 11 + k) > 0 ? -1 : 0; p.dot(x, y, 0x241a1c, a); p.dot(x - 1, y + up, 0x241a1c, a); p.dot(x + 1, y + up, 0x241a1c, a); }
  });
}

const KINDS = {
  // folhas girando enquanto caem; as de perto são maiores e passam mais rápido
  folhas(p, t, o, C) {
    cycle(t, D, 24, o.seed, (g) => 7 + g.next() * 4, (age, L, r, i) => {
      const d = i % 3, x0 = r.next() * W, ph = r.next() * TAU, vy = 16 + d * 8, y = -6 + vy * age + r.next() * 30;
      if (y > H) return;
      const x = wrap(x0 + 9 * age + Math.sin(age * 1.3 + ph) * (10 + d * 6) - o.camx * (0.2 + d * 0.3));
      const ang = age * (1.5 + r.next() * 1.5) + ph, l = 1 + d, c = C[(i % 2) + 1 + (d > 1 ? 1 : 0)], a = fade(age, L) * (0.5 + d * 0.22);
      const dx = Math.cos(ang) * l, dy = Math.sin(ang) * l * 0.7;
      p.line(x - dx, y - dy, x + dx, y + dy, c, a);
      if (d === 2) p.dot(x, y + 1, C[0], a);
    });
    bichos(p, t, o, [0xecb848, 0x4ec1f2, 0x3a70e0]);
  },
  // brasas subindo do capim queimado, esfriando, e cinza caindo devagar
  brasas(p, t, o, C) {
    cycle(t, D, 64, o.seed, (g) => 2.5 + g.next() * 3, (age, L, r, i) => {
      const d = i % 3, u = age / L, x0 = r.next() * W, y0 = 150 + r.next() * 90, vy = 18 + r.next() * 20 + d * 6, ph = r.next() * TAU;
      const x = wrap(x0 + 14 * age + Math.sin(age * 2.4 + ph) * 6 - o.camx * (0.25 + d * 0.25)), y = y0 - vy * age;
      const fl = 0.75 + 0.25 * Math.sin(age * 15 + ph), a = Math.min(1, fade(age, L, 0.12) * fl * 1.4);
      const c = C[u < 0.4 ? 3 : u < 0.75 ? 2 : 1];
      p.dot(x, y, c, a);
      if (d > 0) p.glow(x, y, 2 + d * 1.5, C[2], 0.32 * a);
      if (d === 2) { p.dot(x, y + 1, c, a * 0.8); p.dot(x - 1, y + 2, C[1], a * 0.6); }
    });
    cycle(t, D, 14, o.seed + 1, (g) => 6 + g.next() * 4, (age, L, r) => {
      const x = wrap(r.next() * W + 8 * age - o.camx * 0.35), y = r.next() * 60 + 12 * age;
      p.dot(x, y, 0x2a2a3a, fade(age, L) * 0.5);
    });
  },
  // vento quente: riscos de areia, grãos rápidos e nuvens baixas de pó
  poeira(p, t, o, C) {
    cycle(t, D, 7, o.seed + 2, (g) => 7 + g.next() * 4, (age, L, r) => {
      const y = 196 + r.next() * 34, x = wrap(r.next() * W + 34 * age - o.camx * 0.9), s = 12 + r.next() * 16;
      p.disc(x, y, s * (0.8 + 0.2 * Math.sin(age)), C[1], fade(age, L, 0.3) * 0.16);
    });
    cycle(t, D, 34, o.seed, (g) => 1.2 + g.next() * 1.6, (age, L, r, i) => {
      const d = i % 3, y = 70 + r.next() * 165, sp = 110 + d * 70 + r.next() * 40, len = 5 + d * 7;
      const x = wrap(r.next() * W + sp * age - o.camx * (0.3 + d * 0.3)), a = fade(age, L, 0.3) * (0.42 + d * 0.18), yy = y + Math.sin(age * 3);
      p.line(x - len, yy, x, yy, C[2], a);
    });
    cycle(t, D, 46, o.seed + 3, (g) => 1 + g.next() * 1.4, (age, L, r) => {
      const y = 150 + r.next() * 85 + Math.sin(age * 6) * 2, x = wrap(r.next() * W + (170 + r.next() * 60) * age - o.camx * 0.8);
      p.dot(x, y, C[3], fade(age, L, 0.25) * 0.95);
    });
  },
  // vaga-lumes que acendem e apagam em ritmos próprios
  vagalumes(p, t, o, C) {
    cycle(t, D, 22, o.seed, (g) => 4 + g.next() * 4, (age, L, r, i) => {
      const d = i % 3, x0 = r.next() * W, y0 = 90 + r.next() * 130, ph = r.next() * TAU, ax = 10 + r.next() * 16;
      const x = wrap(x0 + Math.sin(age * 0.9 + ph) * ax - o.camx * (0.2 + d * 0.3)), y = y0 + Math.sin(age * 1.3 + ph * 2) * 8;
      const pulse = Math.max(0, Math.sin(age * (1.5 + r.next()) + ph)) ** 2 * fade(age, L);
      if (pulse < 0.04) return;
      p.dot(x, y, pulse > 0.5 ? C[3] : C[2], pulse);
      p.glow(x, y, 5 + d * 2, C[2], 0.45 * pulse);
    });
    if (o.bichos) bichos(p, t, o, [0xc8a0f0, 0x4ec1f2]);
  },
  // cinzas frias caindo no nada
  cinzas(p, t, o, C) {
    cycle(t, D, 30, o.seed, (g) => 7 + g.next() * 5, (age, L, r, i) => {
      const d = i % 3, ph = r.next() * TAU, x = wrap(r.next() * W + 4 * age + Math.sin(age * 0.8 + ph) * 9 - o.camx * (0.2 + d * 0.25)), y = r.next() * 80 + (7 + d * 5) * age;
      const a = fade(age, L) * (0.35 + d * 0.15);
      p.dot(x, y, C[1 + (i % 2)], a);
      if (d === 2 && i % 4 === 0) { p.dot(x + 1, y, C[1], a * 0.7); p.dot(x, y + 1, C[0], a * 0.7); }
    });
  },
  // sementes de paina: um pontinho com pluma, boiando devagar
  sementes(p, t, o, C) {
    cycle(t, D, 16, o.seed, (g) => 8 + g.next() * 3, (age, L, r, i) => {
      const d = i % 3, ph = r.next() * TAU, x = wrap(r.next() * W + (10 + d * 5) * age + Math.sin(age * 0.7 + ph) * 8 - o.camx * (0.2 + d * 0.3));
      const y = 50 + r.next() * 130 + Math.sin(age * 0.9 + ph) * 12 + 3 * age, a = fade(age, L) * (0.55 + d * 0.15), sw = Math.round(Math.sin(age * 2 + ph));
      p.dot(x, y, C[0], a);
      p.dot(x + sw, y - 1, C[2], a); p.dot(x - 1 + sw, y - 2, C[3], a * 0.8); p.dot(x + 1 + sw, y - 2, C[3], a * 0.8); p.dot(x + sw, y - 3, C[3], a * 0.8);
      p.glow(x, y - 2, 3, C[3], 0.08 * a);
    });
    bichos(p, t, o, [0xffd87a, 0xc8a0f0, 0x4ec1f2]);
  },
  // gruta: pó parado na pouca luz e gotas pingando do teto
  gruta(p, t, o, C) {
    cycle(t, D, 22, o.seed, (g) => 6 + g.next() * 5, (age, L, r, i) => {
      const d = i % 3, ph = r.next() * TAU, x = wrap(r.next() * W + Math.sin(age * 0.5 + ph) * 12 - o.camx * (0.2 + d * 0.3)), y = 50 + r.next() * 150 + Math.sin(age * 0.7 + ph) * 8;
      p.dot(x, y, C[1 + (i % 2)], fade(age, L, 0.3) * (0.3 + d * 0.15));
    });
    cycle(t, D, 6, o.seed + 4, 0.9, (age, L, r) => {
      const x = wrap(r.next() * W - o.camx * 0.8), y = 20 + 240 * age * age;
      if (y < H) p.line(x, y - 3, x, y, C[3], 0.7);
    });
  },
};

export function draw(p, t, o) { const C = fit(o.palette, 4); (KINDS[o.kind] || KINDS.cinzas)(p, t, o, C); }
