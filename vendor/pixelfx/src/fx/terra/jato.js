// A água do Canoeiro: a remada joga um leque de gotas para a frente. o.impacto: em vez disso, a água batendo e espirrando em volta.
import { Particles, Lights, P, Rng, fit, sparkle } from "../../core/index.js";

export const meta = { name: "Jato d'água", desc: "Um leque de gotas ao jogar a água com o remo; ou o estouro de água ao bater.", tags: ["water", "projectile", "terra", "one-shot"], size: [120, 80], origin: [30, 44], duration: 0.45, loop: false, fps: 30, bg: "dark", options: { palette: ["#0e2e5a", "#1c76bc", "#5ab8ec", "#b8e8ff", "#ffffff"], impacto: false, seed: 67 } };

export function create(o) {
  const C = fit(o.palette, 5), R = new Rng(o.seed), lights = new Lights(), ps = new Particles({ rng: R, ground: () => 34, sparks: [C[4], C[3], C[2], C[1]] });
  const n = o.impacto ? 7 : 5;
  for (let i = 0; i < n; i++) {
    const a = o.impacto ? R.range(0, 6.28) : R.range(-0.8, 0.45), sp = o.impacto ? R.range(30, 80) : R.range(50, 110);
    ps.spawn(P.SPARK, Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * sp, Math.sin(a) * sp - (o.impacto ? 30 : 10), R.range(0.15, 0.3));
  }
  let t = 0;
  return {
    update(dt) { t += dt; ps.update(dt); lights.update(dt); },
    draw(p) { if (t < 0.05) sparkle(p, 0, 0, o.impacto ? 3 : 2, C[4], C[3]); ps.draw(p); lights.draw(p); },
  };
}
