// Peças em comum dos efeitos do jogo: pedaços que giram e quicam, e folhas que caem balançando.
import { clamp, GRAVITY } from "../../core/index.js";

export class Pedacos {
  constructor(floor = 0) { this.floor = floor; this.list = []; }
  add(o) { this.list.push({ a: 0, va: 0, w: 3, h: 2, g: 0.85, bounce: 0.35, life: 1.5, ...o, max: o.life || 1.5 }); }
  update(dt) {
    for (const b of this.list) {
      b.life -= dt; if (b.life <= 0) continue;
      b.vy += GRAVITY * b.g * dt; b.vx *= 1 - 0.5 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
      if (b.y > this.floor - 1) { b.y = this.floor - 1; if (Math.abs(b.vy) > 45) { b.vy *= -b.bounce; b.vx *= 0.65; b.va *= 0.55; } else { b.vy = 0; b.vx *= 0.7; b.va = 0; } }
    }
  }
  draw(p) {
    for (const b of this.list) {
      if (b.life <= 0) continue;
      const al = clamp(b.life / 0.35), ca = Math.cos(b.a), sa = Math.sin(b.a), W2 = b.w / 2, H2 = b.h / 2;
      for (let u = -W2; u <= W2; u += 1) for (let v = -H2; v <= H2; v += 1) {
        const edge = v - 1 < -H2;
        p.dot(b.x + u * ca - v * sa, b.y + u * sa + v * ca, edge ? (b.c2 ?? b.c) : b.c, al);
      }
    }
  }
}
export class Folhas {
  constructor(floor = 0) { this.floor = floor; this.list = []; }
  add(o) { this.list.push({ v: 26, ph: 0, l: 2, sw: 8, delay: 0, age: 0, ...o }); }
  update(dt) { for (const f of this.list) { f.age += dt; if (f.age < f.delay) continue; f.vy = (f.vy ?? 0); f.vy += (f.v - f.vy) * Math.min(1, dt * 2.2); f.vx = (f.vx ?? 0) * (1 - dt * 1.6); f.x += f.vx * dt; f.y += f.vy * dt; } }
  draw(p, fim) {
    for (const f of this.list) {
      if (f.age < f.delay || f.y > this.floor - 1) continue;
      const u = f.age, x = f.x + Math.sin(u * 2.3 + f.ph) * f.sw, d = Math.cos(u * 3.1 + f.ph) * f.l;
      p.line(x - d, f.y - f.l * 0.3, x + d, f.y + f.l * 0.3, f.c, fim);
    }
  }
}
