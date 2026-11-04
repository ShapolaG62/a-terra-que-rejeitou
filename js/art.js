// ---------- Personagens humanos (forma do espírito e povos) ----------
const SK = { skin: '#8a5434', skinD: '#5e3622', skinL: '#a86c44', foot: '#3a2014' };
const PELE = { ...SK, hair: '#14100e', eye: '#ffe066', armBand: '#e8dcc0', shin: '#3a2418', wstyle: 'tribal' };
const VARIANTES = {
  arqueiro: [
    { ...PELE, hairStyle: 'long', acc: 'cocar', top: { k: 'straps', col: '#e8dcc0' }, necklace: 'beads', bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, back: 'quiver', stripe: '#e8dcc0' },
    { ...PELE, hairStyle: 'hood', hood: '#9a2a22', cape: '#9a2a22', top: { k: 'tunic', col: '#2a1c16' }, bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, back: 'quiver', armBand: '#a8302a' },
    { ...PELE, hairStyle: 'long', acc: 'skull', fur: '#d8c8a8', top: { k: 'warpaint', col: '#2a1a14' }, necklace: 'beads', bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, back: 'quiver', armBand: '#a8302a' },
  ],
  lanceiro: [
    { ...PELE, hairStyle: 'long', acc: 'cocar', top: { k: 'bare', col: '#e8dcc0' }, necklace: true, armPaint: '#e8dcc0', bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, stripe: '#e8dcc0' },
    { ...PELE, hairStyle: 'hood', hood: '#8a2420', cape: '#8a2420', top: { k: 'tunic', col: '#2a1c16' }, necklace: true, bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, armBand: '#a8302a' },
    { ...PELE, hairStyle: 'long', acc: 'skull', fur: '#d8c8a8', top: { k: 'warpaint', col: '#2a1a14' }, necklace: true, bottom: { k: 'panel', col: '#a8302a', hem: '#d8c8a8' }, armBand: '#a8302a' },
  ],
};
const VARIANTE_NOMES = ['Do povo', 'Cocar', 'Manto', 'Caveira'];
const FORMA_CORPO = { zarabatana: 'arqueiro', arco: 'arqueiro', lanca: 'lanceiro', cabaca: 'lanceiro', semente: 'lanceiro' };

function variantesLiberadas() { const act = (G.save && G.save.act) || 0; return act >= 5 ? 4 : act >= 3 ? 3 : 2; }
function varianteAtual() { const n = variantesLiberadas(), v = G.save && G.save.look; return v != null && v < n ? v : 0; }

function playerSpec(form) {
  const corpo = FORMA_CORPO[form], base = SPEC[form] || SPEC.espirito;
  const v = varianteAtual();
  if (!corpo || v === 0) return base;
  return { ...VARIANTES[corpo][v - 1], weapon: base.weapon, hip: base.hip };
}

const SPEC = {
  espirito: { skin: '#0c0a10', skinD: '#09070c', skinL: '#1a1624', foot: '#09070c', hair: '#0c0a10', hairStyle: 'short', eye: '#ffe066', outline: '#6a5a8a', weapon: null },
  zarabatana: { ...SK, hair: '#14100e', hairStyle: 'short', acc: 'feather1', facePaint: '#c8302a', leafCollar: true, top: { k: 'paint', col: '#b8302a' }, bottom: { k: 'leaves' }, armBand: '#4a8a3a', armPaint: '#b8302a', shin: '#3a2418', weapon: 'blowgun', gunCol: '#2a2420', eye: '#ffe066' },
  arco: { ...SK, hair: '#14100e', hairStyle: 'long', acc: 'yellowfeathers', top: { k: 'bandeau', col: '#c8a878' }, bottom: { k: 'skirt', col: '#a0522d', len: 3 }, armBand: '#d8a040', shin: '#6a4a2a', back: 'quiver', weapon: 'bow', bowCol: '#8a5a2a', eye: '#ffe066' },
  lanca: { ...SK, hair: '#14100e', hairStyle: 'short', acc: 'strawhat', top: { k: 'shirt', col: '#34486e' }, sleeve: '#34486e', pants: '#6a5a4a', weapon: 'paddle', eye: '#ffe066' },
  cabaca: { ...SK, hair: '#14100e', hairStyle: 'long', acc: 'redband', top: { k: 'bandeau', col: '#e8dcc0' }, bottom: { k: 'skirt', col: '#8a3a2a', len: 4 }, hip: 'gourd', armBand: '#e8dcc0', weapon: 'spear', eye: '#ffe066' },
  semente: { ...SK, hair: '#a8a8a0', hairStyle: 'whitelong', top: { k: 'shawl', col: '#3a5a2e' }, bottom: { k: 'dress', col: '#4a6a3a' }, weapon: 'staff', wstyle: 'leafy', eye: '#ffe066' },
};

const NPC_BASE = {
  zarabatana: { ...SK, hair: '#1a1210', hairStyle: 'short', acc: 'crown', top: { k: 'band', col: '#b8402e' }, neck: '#e8d8b8', bottom: { col: '#7a4a2a', len: 4, hem: '#a8744a' }, legBand: '#e8d8b8', back: 'bag', weapon: 'blowgun' },
  arco: { ...SK, hair: '#14100e', hairStyle: 'long', acc: 'tuft', top: { k: 'cords', col: '#c8402e' }, bottom: { col: '#b8402e', len: 1, hem: '#e8d8b8' }, legBand: '#1a1210', back: 'quiver', weapon: 'bow', paint: '#1a1210' },
  lanca: { ...SK, hair: '#e8e4dc', hairStyle: 'white', acc: 'plume', top: { k: 'sash', col: '#c8b48a' }, bottom: { col: '#7aaab0', len: 1, hem: '#5a8a90' }, back: 'bag', weapon: 'spear' },
  cabaca: { ...SK, hair: '#14100e', hairStyle: 'braid', acc: 'fan', top: { k: 'sash', col: '#e8dcc0' }, bottom: { col: '#e8dcc0', len: 5, hem: '#b8402e' }, hip: 'gourd', weapon: 'spear' },
  semente: { ...SK, hair: '#ece6dc', hairStyle: 'whitelong', acc: 'sprouts', top: { k: 'shirt', col: '#34446e', dots: '#f2e6a0' }, bottom: { col: '#e8e0cc', len: 6, hem: '#b8402e' }, back: 'basket', weapon: 'staff' },
};
function npcSpec(form, over) { return Object.assign({}, NPC_BASE[form] || SPEC[form], { eye: '#20140e' }, over || {}); }

const HPI = Math.PI;

// Easing suave — suaviza entradas e saídas de forma mais orgânica
const ez  = v => v * v * (3 - 2 * v);                          // smoothstep clássico
const ez2 = v => v < 0.5 ? 2*v*v : 1 - 2*(1-v)*(1-v);         // easeInOut quadrático
const ezOut = v => 1 - (1 - v) * (1 - v);                      // easeOut quadrático — decaimento natural
const ezIn  = v => v * v;                                       // easeIn quadrático
// spring: overshoota levemente como mola amortecida
const spring = (v, ov = 0.18) => v + Math.sin(v * HPI * 2) * ov * (1 - v);
// lerp linear — já esperado globalmente
const _lerp = (a, b, t) => a + (b - a) * t;

function humanPose(a, s) {
  const k = a.kind, p = clamp(a.p || 0, 0, 1), t = a.t || 0, wp = s.weapon;

  // Pose padrão — valores neutros
  const P = {
    bob: 0, lean: 0, head: 0, crouch: 0,
    fb: [-2, 0], ff: [2, 0],
    ab: [0.15, 0.2], af: [0.25, 0.9],
    wa: HPI - 0.1,
    slash: null, lie: false, blink: false, puff: false,
    draw: 0, arrow: false, gourd: false, noWeapon: false,
    mouth: false, scaleX: 1, scaleY: 1, rot: 0
  };

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (k === 'idle') {
    const breathe  = Math.sin(t * 2.1);          
    const breathe2 = Math.sin(t * 4.2) * 0.3;    
    const breath   = breathe + breathe2;

    P.bob = breath > 0.25 ? 0 : 1;
    P.ab = [0.11 + breathe * 0.06, 0.18 + breathe2 * 0.04];
    P.scaleY = 1 + breathe * 0.025;
    P.scaleX = 1 - breathe * 0.012;
    P.lean = breathe * 0.3;
    P.blink = (t % 3.7) < 0.12 || ((t % 5.1) > 4.9);

    if (wp === 'bow') { P.af = [0.15, 0.4]; P.wa = HPI / 2 + 0.25; }

  // ── WALK / RUN ────────────────────────────────────────────────────────────
  } else if (k === 'run' || k === 'walk') {
    const run  = k === 'run';
    const ph   = a.ph || 0;                       
    const s1   = Math.sin(ph);
    const c1   = Math.cos(ph);
    const s2   = Math.sin(ph * 2);               

    const amp  = run ? 4.2 : 2.8;                
    const lift = run ? 2.8 : 1.2;                

    const liftF = Math.max(0,  c1);
    const liftB = Math.max(0, -c1);
    P.ff = [1 + s1 * amp,   ezOut(liftF) * lift];
    P.fb = [-2 - s1 * amp,  ezOut(liftB) * lift];

    P.bob = Math.abs(c1) > 0.65 ? 1 : 0;
    const leanBase = run ? 1.8 : 0.6;
    P.lean = leanBase + Math.sin(ph) * (run ? 0.4 : 0.15);
    P.rot = run ? Math.sin(ph) * 0.07 : Math.sin(ph) * 0.02;

    const stretchT = Math.abs(s1);
    P.scaleY = 1 + stretchT * 0.04 - (1 - stretchT) * 0.02;
    P.scaleX = 1 - stretchT * 0.025;

    const armSwing = run ? 0.9 : 0.5;
    P.af = [-s1 * armSwing + 0.25, 0.85 + liftF * 0.1];
    P.ab = [ s1 * armSwing * 0.9,  0.65 + liftB * 0.1];

    P.wa = wp === 'bow'   ? HPI / 2 + 0.4 :
           wp === 'spear' ? HPI / 2 + 0.1 + s1 * 0.05 :
           2.3 + s1 * 0.1;

  // ── DASH ─────────────────────────────────────────────────────────────────
  // Animação reformulada com física orgânica (windup, stretch e decaimento)
  } else if (k === 'dash') {
    const windup  = p < 0.18 ? ezIn(p / 0.18) : 1;              
    const stretch = p >= 0.18 && p < 0.65 
      ? ezOut((p - 0.18) / 0.47)                                
      : 1 - ezIn((p - 0.65) / 0.35);                            

    const decay   = 1 - ezOut(p);                              

    if (p < 0.18) {
      P.scaleX = _lerp(1.0, 0.85, windup);                     
      P.scaleY = _lerp(1.0, 1.15, windup);
    } else {
      P.scaleX = _lerp(0.85, 1.35, stretch);                    
      P.scaleY = _lerp(1.15, 0.72, stretch);
    }

    P.lean = _lerp(1.5, 4.5, Math.sin(p * Math.PI));            
    P.rot  = _lerp(0.2, -0.05, ez(p));                          
    P.head = 1;                                                 
    P.crouch = _lerp(1, 3, Math.sin(p * Math.PI));              

    P.ff = [_lerp(2, 6.5, stretch), _lerp(1, 0.4, stretch)];    
    P.fb = [_lerp(-2, -8.0, stretch), _lerp(1, 2.2, stretch)];  

    P.af = [_lerp(-0.3, -1.2, stretch), 0.35];                  
    P.ab = [_lerp(-0.5, -1.6, stretch), 0.15];                  
    P.wa = 2.4 + decay * 0.3;                                   

  // ── JUMP ─────────────────────────────────────────────────────────────────
  } else if (k === 'jump') {
    const stretch = ezOut(clamp(p * 3, 0, 1)); 
    P.scaleX = _lerp(1.1, 0.82, stretch);       
    P.scaleY = _lerp(0.85, 1.25, stretch);      
    P.rot    = -0.06 * stretch;                 

    const legOpen = ezOut(clamp(p * 2, 0, 1));
    P.ff = [_lerp(1, 3.5, legOpen), _lerp(1, 4.5, legOpen)];
    P.fb = [_lerp(-1, -2.5, legOpen), _lerp(0.5, 2.2, legOpen)];

    P.af = [_lerp(0.5, 2.2, legOpen), 0.4];
    P.ab = [_lerp(0.1, -1.1, legOpen), 0.3];
    P.wa = 2.4;

  // ── FALL ─────────────────────────────────────────────────────────────────
  } else if (k === 'fall') {
    const openT = ezOut(clamp(p * 2, 0, 1));
    P.scaleX = 0.95 + openT * 0.05;
    P.scaleY = _lerp(1.1, 0.95, openT);        
    P.rot    = openT * 0.04;                    

    P.ff = [_lerp(1, 2.5, openT), _lerp(1, 0.5, openT)];
    P.fb = [_lerp(-2, -3.5, openT), _lerp(0, 1.2, openT)];

    P.af = [_lerp(1.2, 1.8, openT),  0.2];
    P.ab = [_lerp(-0.8, -1.5, openT), 0.2];
    P.wa = 2.0;

  // ── CLIMB ────────────────────────────────────────────────────────────────
  } else if (k === 'climb') {
    const s1 = Math.sin(t * 9) * (a.moving ? 1 : 0);
    P.af = [HPI - 0.2 + s1 * 0.3, 0.2];
    P.ab = [HPI - 0.4 - s1 * 0.3, 0.2];
    P.ff = [2, 3 + s1 * 2];
    P.fb = [-1, 3 - s1 * 2];
    P.noWeapon = true;
    P.lean = 1;

  // ── KNEEL ────────────────────────────────────────────────────────────────
  } else if (k === 'kneel') {
    P.crouch = 5; P.ff = [4, 0]; P.fb = [-4, 0];
    P.af = [0.4, 0.6]; P.ab = [0.1, 0.2];
    P.head = 1; P.wa = 2.2; P.scaleY = 0.85;

  // ── HEAL ─────────────────────────────────────────────────────────────────
  } else if (k === 'heal') {
    const sip = Math.sin(t * 6) * 0.15;
    P.af = [2.6 + sip, 2.3 + sip * 0.5];
    P.ab = [0.25, 0.3];
    P.head = -1;
    P.gourd = true;
    P.noWeapon = wp !== 'bow';
    P.wa = 0.3;

  // ── HURT ─────────────────────────────────────────────────────────────────
  } else if (k === 'hurt') {
    const recoil  = p < 0.2 ? ez(p / 0.2) : ezOut(1 - (p - 0.2) / 0.8); 
    const bounce  = p > 0.3 ? Math.sin((p - 0.3) * HPI * 3) * 0.08 : 0;  

    P.lean   = -2.5 * recoil + bounce;          
    P.head   = -1 * recoil;
    P.scaleX = 1 + recoil * 0.15;               
    P.scaleY = 1 - recoil * 0.12;
    P.rot    = recoil * 0.08;                    

    P.af = [1.9 - p * 0.5, 0.3 + recoil * 0.2];
    P.ab = [-1.6 + recoil * 0.3, 0.4];
    P.ff = [3 + recoil, 2];
    P.fb = [-2 - recoil * 0.5, 0];
    P.wa = 2.6;

  // ── DEAD ─────────────────────────────────────────────────────────────────
  } else if (k === 'dead') {
    if (p < 0.45) {
      P.crouch = 5 * ez(p / 0.45);
      P.ff = [4, 0]; P.fb = [-4, 0];
      P.af = [0.3, 0.2]; P.ab = [0.1, 0.1];
      P.head = 1; P.wa = 1.4;
    } else P.lie = true;

  // ── ATTACK ───────────────────────────────────────────────────────────────
  } else if (k === 'attack') {
    const st = a.style || 'thrust';
    const w  = p < 0.3 ? ez(p / 0.3)  : 1;
    const sk = p < 0.3 ? 0 : p < 0.55 ? ez((p - 0.3) / 0.25) : 1;

    if (st === 'over') {
      const a1 = p < 0.3 ? _lerp(0.9, HPI + 0.55, w) : _lerp(HPI + 0.55, 0.55, sk);
      P.af = [a1, 0.15]; P.wa = a1 + 0.1;
      P.lean = p < 0.3 ? -w : _lerp(-1, 2, sk);
      P.ff = [1 + 3 * sk, 0]; P.ab = [-0.6 + sk, 0.4];
      if (p >= 0.3) P.slash = { st, a0: HPI + 0.55, a1, r: wp ? 15 : 10 };
    } else if (st === 'sweep' || st === 'claw') {
      const a1 = p < 0.3 ? _lerp(0.4, -1.4, w) : _lerp(-1.4, 2.0, sk);
      P.af = [a1, 0.1]; P.wa = a1;
      P.lean = p < 0.3 ? -w : _lerp(0, 2, sk);
      P.ff = [1 + 2 * sk, 0]; P.ab = [0.6 - sk, 0.5];
      if (p >= 0.3) P.slash = { st, a0: -1.4, a1, r: st === 'claw' ? 10 : 14 };
      if (st === 'claw') P.noWeapon = true;
    } else {
      const jab   = st === 'jab', reach = jab ? 0.6 : 1;
      const bend  = p < 0.3 ? _lerp(0.6, 1.5, w) : _lerp(1.5, 0, sk);
      P.af = [_lerp(0.7, HPI / 2, p < 0.3 ? 0 : sk), bend]; P.wa = HPI / 2;
      P.lean = p < 0.3 ? -w : _lerp(-1, 3 * reach, sk);
      P.ff = [2 + 4 * reach * sk, 0]; P.fb = [-2 - 2 * reach * sk, 0]; P.ab = [0.8, 0.9];
      if (p >= 0.32 && p < 0.75) P.slash = { st: 'thrust', len: jab ? 10 : 16 };
    }

  // ── SHOT / SPECIAL ────────────────────────────────────────────────────────
  } else if (k === 'shot' || k === 'special') {
    const sh    = a.shot || 'orb', rel = a.at || 0.28;
    const w     = p < rel ? ez(p / rel) : 1;
    const after = p < rel ? 0 : ez(clamp((p - rel) / 0.3, 0, 1));
    if (sh === 'arrow' || sh === 'firearrow') {
      P.af = [HPI / 2 + 0.05, 0]; P.ab = [HPI / 2 + 0.1, _lerp(0.4, 2.5, w) * (1 - after)];
      P.wa = HPI / 2; P.draw = p < rel ? w : 0; P.arrow = p < rel; P.lean = -after;
    } else if (sh === 'dart' || sh === 'burst') {
      P.af = [2.0, 0.7]; P.ab = [2.1, 0.9]; P.wa = HPI / 2; P.mouth = true;
      P.puff = (p > rel - 0.05 && p < rel + 0.15) || (sh === 'burst' && Math.sin(p * 30) > 0.3);
    } else if (sh === 'javelin' || sh === 'throw') {
      const a1 = p < rel ? _lerp(1.0, HPI + 0.75, w) : _lerp(HPI + 0.75, 1.2, after);
      P.af = [a1, 0.2]; P.wa = a1 + 0.15;
      P.lean = p < rel ? -w : 2 * after; P.ff = [2 + 2 * after, 0];
      if (p >= rel) P.noWeapon = sh === 'throw';
    } else if (sh === 'drop' || sh === 'splash') {
      const a1 = p < rel ? _lerp(0.2, -0.9, w) : _lerp(-0.9, 2.2, after);
      P.af = [a1, 0.3]; P.gourd = true; P.noWeapon = true; P.lean = after;
      if (sh === 'splash' && p >= rel) P.slash = { st: 'sweep', a0: -0.9, a1, r: 12, water: true };
    } else if (sh === 'roots') {
      const a1 = p < rel ? _lerp(0.9, HPI + 0.3, w) : _lerp(HPI + 0.3, 0.2, after);
      P.af = [a1, 0.1]; P.wa = a1; P.crouch = 3 * after; P.lean = after;
    } else if (sh === 'seed') {
      const a1 = p < rel ? _lerp(0.6, HPI, w) : _lerp(HPI, 1.7, after);
      P.af = [a1, 0.1]; P.wa = a1; P.lean = after;
    } else {
      P.af = [HPI / 2, _lerp(0.8, 0, w)]; P.ab = [0.4, 0.4]; P.lean = w; P.noWeapon = true;
    }
  }

  return P;
}

const HUMAN_S = 1.45;

function drawHuman(c, x, y, f, a, s, flash, alpha) {
  const P = humanPose(a, s);

  c.save();
  c.translate(x, y);
  c.rotate(P.rot * f);
  c.scale(P.scaleX, P.scaleY);
  c.translate(-x, -y);

  if (a.kind === 'dash') {
    const baseAlpha = alpha !== undefined ? alpha : 1;
    c.globalAlpha = baseAlpha * 0.18;
    drawHumanBase(c, x - f * 12, y, f, a, s, flash);
    c.globalAlpha = baseAlpha * 0.35;
    drawHumanBase(c, x - f * 7,  y, f, a, s, flash);
    c.globalAlpha = baseAlpha * 0.55;
    drawHumanBase(c, x - f * 3,  y, f, a, s, flash);
  }

  drawHumanBase(c, x, y, f, a, s, flash, alpha);
  c.restore();
}

function drawHumanBase(c, x, y, f, a, s, flash, alpha) {
  const R = [];
  const A = (dx, dy, w, h, col) => { const X = Math.round(dx * HUMAN_S), Y = Math.round(dy * HUMAN_S); R.push([X, Y, Math.max(1, Math.round((dx + w) * HUMAN_S) - X), Math.max(1, Math.round((dy + h) * HUMAN_S) - Y), col]); };
  const seg = (x0, y0, x1, y1, col, th) => { const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) A(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), th, th, col); };
  const limb = (x0, y0, x1, y1, t0, t1, col, lit, drk) => {
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.max(2, Math.ceil(L * 2)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    for (let i = 0; i <= n; i++) { const k = i / n, th = t0 + (t1 - t0) * k; A(x0 + (x1 - x0) * k - th / 2, y0 + (y1 - y0) * k - th / 2, th, th, col); }
    for (let i = 2; i < n - 1; i += 3) { const k = i / n, px = x0 + (x1 - x0) * k, py = y0 + (y1 - y0) * k, th = t0 + (t1 - t0) * k; if (lit) A(px + nx * th * 0.3 - 0.35, py + ny * th * 0.3 - 0.35, 0.7, 0.7, lit); if (drk) A(px - nx * th * 0.35 - 0.35, py - ny * th * 0.35 - 0.35, 0.7, 0.7, drk); }
  };
  const hair = s.hair, skin = s.skin, skinD = s.skinD, skinL = s.skinL || skin, esp = !!s.outline, deep = esp ? '#050307' : '#3e2214', mixC = (p, q) => '#' + [1, 3, 5].map(i => Math.round((parseInt(p.slice(i, i + 2), 16) + parseInt(q.slice(i, i + 2), 16)) / 2).toString(16).padStart(2, '00')).join(''), skinM = mixC(skin, skinD);
  let slash = null, shF = null, tip = 8;
  {
    const P = humanPose(a, s);
    if (P.lie) {
      A(-12, -5, 6, 5, skin); A(-13, -6, 4, 5, hair); A(-6, -5, 9, 4, skin);
      if (s.top) A(-6, -5, 9, 2, s.top.col);
      if (s.bottom) A(2, -5, 4, 4, s.bottom.col);
      A(5, -3, 8, 2, skin); A(5, -5, 7, 2, skinD); A(12, -4, 1, 3, s.foot); A(-8, -2, 6, 2, skinD);
    } else {
      const top = -22 + P.bob + P.crouch, hipY = -8 + P.crouch + P.bob * 0.5, Ln = P.lean;
      const sh = (dx, row) => dx + Math.round(Ln * (1 - row / 8));
      shF = [1 + Ln, top + 8];
      const shB = [-2 + Ln, top + 8];
      const arm = (sp, ang) => { const e = [sp[0] + Math.sin(ang[0]) * 4, sp[1] + Math.cos(ang[0]) * 4]; const b = ang[0] + ang[1]; return [e, [e[0] + Math.sin(b) * 4, e[1] + Math.cos(b) * 4]]; };
      const leg = (hx, ft) => {
        const fx = ft[0], fy = -ft[1], d = Math.hypot(fx - hx, fy - hipY) || 1;
        let kx = (hx + fx) / 2, ky = (hipY + fy) / 2;
        if (d < 8) { const hh = Math.sqrt(Math.max(0, 16 - (d / 2) ** 2)); kx += Math.abs(fy - hipY) / d * hh; ky -= (fx - hx) / d * hh * 0.4; }
        return [[kx, ky], [fx, fy]];
      };
      const drawLeg = (hx, ft, col, band) => {
        const [kn, fo] = leg(hx, ft), front = col === skin;
        const mid = [(kn[0] * 0.55 + fo[0] * 0.45), (kn[1] * 0.55 + fo[1] * 0.45)], lit = null, drk = front ? skinM : null;
        A(hx - 1.4, hipY, 2.8, 2, col);
        limb(hx, hipY, kn[0], kn[1], 2.9, 2.1, col, lit, drk);
        limb(kn[0], kn[1], mid[0], mid[1], 2.1, 2.4, col, lit, drk);
        limb(mid[0], mid[1], fo[0], fo[1] - 1, 2.4, 1.5, col, null, drk);
        if (front) A(kn[0] + 0.6, kn[1] - 0.4, 0.8, 0.8, skinL);
        A(fo[0] - 1, fo[1] - 1.3, 4, 1.3, s.foot); A(fo[0] - 1, fo[1] - 1.3, 0.8, 1.3, s.foot);
        if (!esp) { A(fo[0] + 2.2, fo[1] - 1.3, 0.7, 0.7, front ? skinL : skin); A(fo[0] + 1.2, fo[1] - 0.6, 1.6, 0.6, '#2a1408'); }
        if (s.pants) { const pc = col === skin ? s.pants : '#4a3e34'; limb(hx, hipY, kn[0], kn[1], 3.1, 2.4, pc, null, '#2a2420'); limb(kn[0], kn[1], (kn[0] + fo[0] * 2) / 3, (kn[1] + fo[1] * 2) / 3, 2.4, 2.4, pc, null, '#2a2420'); }
        if (s.shin) limb(mid[0], mid[1], fo[0], fo[1] - 1, 2.5, 1.7, s.shin, null, null);
        if (band) A(Math.round((kn[0] + fo[0]) / 2), Math.round((kn[1] + fo[1]) / 2), 2, 1, band);
      };
      const armBand = (e, h) => { if (s.armBand) A(Math.round((e[0] + h[0]) / 2), Math.round((e[1] + h[1]) / 2), 2, 1, s.armBand); };
      if (s.cape) { const fl = a.kind === 'run' ? 2 : a.kind === 'walk' ? 1 : 0; for (let r = 0; r < 13; r++) { const w2 = 3 + Math.floor(r * 0.35), x0 = sh(-4, r) - Math.floor(r * (0.35 + fl * 0.15)); A(x0 - w2 + 3, top + 6 + r, w2, 1, r % 3 ? s.cape : '#6a1814'); } for (let i = 0; i < 4; i++) A(sh(-4, 12) - 9 - fl * 2 + i * 2, top + 19 + (i % 2), 1, 1, '#6a1814'); }
      if (s.back === 'bag') A(sh(-6, 2), top + 8, 3, 6, '#c8a46a');
      if (s.back === 'quiver') { A(sh(-6, 0), top + 4, 2, 10, '#7a4a2a'); A(sh(-6, 0), top + 2, 1, 2, '#e8d8b8'); A(sh(-5, 0), top + 1, 1, 3, '#e8d8b8'); }
      if (s.back === 'basket') { A(sh(-9, 1), top + 6, 5, 8, '#a88a5a'); A(sh(-9, 1), top + 8, 5, 1, '#7a5a3a'); A(sh(-8, 0), top + 3, 1, 3, '#6fd36a'); A(sh(-6, 0), top + 2, 1, 4, '#8fe37a'); }
      const hx = -3 + Ln + P.head, hy = top + (P.head > 0 ? 1 : 0);
      if (s.hairStyle === 'long') { A(hx - 2, top + 2, 3, 13, hair); A(hx - 1.4, top + 4, 0.6, 9, '#2e241e'); A(hx - 2.4, top + 13, 1, 2, hair); }
      if (s.hairStyle === 'hood') { A(hx - 2, top + 1, 3, 9, s.hood); A(hx - 3, top + 4, 1, 6, '#6a1814'); }
      if (s.hairStyle === 'wild') { A(hx - 2, top + 1, 4, 11, hair); A(hx - 3, top + 3, 1, 6, hair); A(hx - 1, top + 12, 2, 2, hair); A(hx - 4, top + 5, 1, 2, hair); }
      if (s.hairStyle === 'wild' && s.back === 'quiver') { A(sh(-6, 0), top + 1, 1, 4, '#e8d8b8'); A(sh(-5, 0), top, 1, 4, '#efe8dc'); A(sh(-6, 0), top + 1, 1, 1, '#a8302a'); A(sh(-4, 0), top + 2, 1, 3, '#7a4a2a'); }
      if (s.hairStyle === 'topknot') { A(hx - 3, top - 2, 2, 3, hair); A(hx - 4, top, 2, 6, hair); A(hx - 5, top + 5, 2, 3, hair); A(hx - 5, top + 8, 1, 2, hair); }
      if (s.hairStyle === 'whitelong') { A(hx - 2, top + 2, 3, 16, hair); A(hx - 1.4, top + 4, 0.6, 11, '#d0d0c8'); A(hx - 0.6, top + 6, 0.6, 9, '#888880'); }
      if (s.hairStyle === 'braid') { A(hx - 2, top + 3, 2, 14, hair); A(hx - 2, top + 10, 2, 1, '#c8402e'); }
      const [eB, hB] = arm(shB, P.ab);
      A(shB[0] - 1.4, shB[1] - 1.2, 2.8, 2.2, skinD);
      limb(shB[0], shB[1], eB[0], eB[1], 2.5, 1.8, skinD, null, null); limb(eB[0], eB[1], hB[0], hB[1], 2, 1.4, skinD, null, null);
      A(hB[0] - 0.9, hB[1] - 0.7, 1.9, 1.8, skinD); armBand(eB, hB);
      if (s.sleeve) limb(shB[0], shB[1], eB[0], eB[1], 2.7, 2.2, '#24324e', null, null);
      drawLeg(-2, P.fb, skinD, s.legBand);
      const TX = [-1, -4, -4, -3, -3, -3, -3, -3], TW = [3, 7, 7, 6, 6, 5, 5, 6];
      for (let r = 0; r < 8; r++) { A(sh(TX[r], r), top + 6 + r, TW[r], 1, skin); A(sh(TX[r], r), top + 6 + r, 1, 1, skinD); if (r > 0 && r < 7) A(sh(TX[r] + TW[r] - 1, r), top + 6 + r, 1, 1, skinL); }
      A(sh(-2, 3), top + 9, 2, 1, skinD); A(sh(1, 3), top + 9, 1, 1, skinD);
      A(sh(0, 5), top + 11, 1, 1, skinD); A(sh(-1, 6), top + 12, 1, 1, skinD);
      A(sh(1, 2), top + 8, 1, 1, skinL);
      if (s.top) {
        const T = s.top;
        if (T.k === 'band') { A(sh(-3, 3), top + 9, 6, 2, T.col); A(sh(-2, 6), top + 12, 1, 1, '#f2c14e'); A(sh(1, 6), top + 12, 1, 1, '#c8402e'); }
        if (T.k === 'cords') { A(sh(-3, 2), top + 8, 6, 1, T.col); A(sh(-3, 5), top + 11, 6, 1, T.col); A(sh(-3, 3), top + 9, 6, 1, '#1a1210'); }
        if (T.k === 'sash') for (let i = 0; i < 6; i++) A(sh(-3 + i, i), top + 6 + i, 1, 2, T.col);
        if (T.k === 'poncho') {
          const dk = '#6a1a16', wt = '#e8d8c0';
          for (let r = 0; r < 5; r++) A(sh(-4 - (r >> 1), r), top + 6 + r, 9 + (r >> 1), 1, r === 0 ? dk : T.col);
          for (let r = 5; r < 9; r++) A(sh(-5, r), top + 6 + r, 2, 1, r % 2 ? dk : T.col);
          for (let i = 0; i < 5; i++) A(sh(-4 + i * 2, 2), top + 8 + (i % 2), 1, 1, wt);
          A(sh(-3, 3), top + 10, 7, 1, dk); for (let i = 0; i < 4; i++) A(sh(-3 + i * 2, 4), top + 11, 1, 1, dk);
        }
        if (T.k === 'paint') { A(sh(-2, 3), top + 9, 1, 1, T.col); A(sh(1, 3), top + 9, 1, 1, T.col); A(sh(-1, 5), top + 11, 2, 1, T.col); A(sh(-3, 6), top + 12, 1, 1, T.col); }
        if (T.k === 'bandeau') { A(sh(-3, 2), top + 8, 6, 3, T.col); A(sh(-3, 2), top + 10, 6, 1, '#8a6a4a'); for (let i = 0; i < 4; i++) A(sh(-3 + i, i), top + 6 + i, 1, 1, '#6a4a2a'); }
        if (T.k === 'shawl') { for (let r = 0; r < 6; r++) A(sh(-4, r), top + 6 + r, 8, 1, r % 2 ? T.col : '#2e4a24'); for (let i = 0; i < 4; i++) A(sh(-4 + i * 2, 5), top + 12, 1, 2, '#2e4a24'); }
        if (T.k === 'straps') { for (let i = 0; i < 6; i++) { A(sh(-3 + i, i), top + 7 + i, 1, 1, T.col); A(sh(2 - i, i), top + 7 + i, 1, 1, T.col); } A(sh(-1, 3), top + 9, 2, 1, '#a8302a'); }
        if (T.k === 'tunic') { for (let r = 0; r < 7; r++) A(sh(-3, r), top + 6 + r, 6, 1, r < 2 ? '#3a2a22' : T.col); A(sh(-1, 4), top + 10, 2, 1, '#a8302a'); }
        if (T.k === 'warpaint') { A(sh(-3, 2), top + 8, 6, 1, T.col); A(sh(-2, 5), top + 11, 4, 1, T.col); A(sh(0, 3), top + 9, 1, 2, '#a8302a'); }
        if (T.k === 'bare') {
          A(sh(-2, 3), top + 9, 1, 3, T.col); A(sh(1, 3), top + 9, 1, 2, T.col);
          for (let i = 0; i < 6; i++) A(sh(-3 + i, i), top + 7 + i, 1, 1, '#3a2014');
        }
        if (T.k === 'shirt') { for (let r = 0; r < 7; r++) A(sh(-3, r), top + 6 + r, 6, 1, T.col); if (T.dots) { A(sh(-1, 2), top + 8, 1, 1, T.dots); A(sh(1, 4), top + 10, 1, 1, T.dots); } }
      }
      if (s.neck) A(sh(-2, 1), top + 7, 4, 1, s.neck);
      if (s.leafCollar) { A(sh(-3, 0), top + 6, 7, 1, '#3a7a2a'); for (let i = 0; i < 7; i += 2) A(sh(-3 + i, 0), top + 7, 1, 2, i % 4 ? '#5a9a3a' : '#2e6a24'); }
      if (s.necklace === 'beads') { for (let i = 0; i < 5; i++) A(sh(-2 + i, 1), top + 7 + (i % 2 ? 1 : 0), 1, 1, i % 2 ? '#a8302a' : '#e8dcc0'); }
      else if (s.necklace) { A(sh(-2, 1), top + 7, 5, 1, '#3a2014'); for (let i = 0; i < 5; i++) A(sh(-2 + i, 1), top + 8, 1, 1 + (i % 2), '#f0e8d8'); }
      if (s.fur) { A(sh(-5, 0), top + 5, 4, 3, s.fur); A(sh(-5, 0), top + 8, 1, 1, '#a89878'); A(sh(-3, 0), top + 8, 1, 1, '#a89878'); }
      if (s.sash) { A(sh(-3, 7), top + 12, 7, 1, s.sash); A(sh(1, 7), top + 13, 2, 3, s.sash); }
      drawLeg(1, P.ff, skin, s.legBand);
      if (s.bottom && s.bottom.k === 'leaves') { A(-3, top + 13, 7, 1, '#2e5a24'); for (let i = -3; i <= 3; i++) A(i, top + 14, 1, 4 + ((i + 3) % 2), (i + 3) % 2 ? '#4a8a3a' : '#2e6a24'); }
      else if (s.bottom && s.bottom.k === 'skirt') { const B = s.bottom; A(-3, top + 13, 7, 1, '#5a3a20'); A(-3, top + 14, 7, 2 + B.len, B.col); A(-3, top + 14, 7, 1, '#c8a878'); for (let i = 0; i < 7; i += 2) A(-3 + i, top + 16 + B.len, 1, 1, B.col); }
      else if (s.bottom && s.bottom.k === 'dress') { const B = s.bottom; for (let r = 0; r < 8; r++) A(-3 - (r >> 2), top + 13 + r, 7 + (r >> 1), 1, r % 3 ? B.col : '#3a5a2e'); A(-4, top + 20, 9, 1, '#2e4a24'); }
      else if (s.bottom && s.bottom.k === 'panel') { const B = s.bottom; A(-3, top + 14, 7, 2, '#3a2418'); A(-4, top + 14, 2, 4, B.hem); A(-3, top + 13, 7, 1, '#7a1e1a'); A(-1, top + 13, 1, 1, '#e8dcc0'); A(2, top + 13, 1, 1, '#e8dcc0'); A(0, top + 14, 3, 6, B.col); A(1, top + 16, 1, 1, '#e8dcc0'); A(0, top + 17, 1, 1, '#e8dcc0'); A(2, top + 17, 1, 1, '#e8dcc0'); A(0, top + 20, 1, 1, '#7a1e1a'); A(2, top + 20, 1, 1, '#7a1e1a'); }
      else if (s.bottom && s.bottom.k === 'loin') { const B = s.bottom; A(-3, top + 13, 7, 3 + B.len, B.col); for (let i = 0; i < 7; i += 2) A(-3 + i, top + 16 + B.len, 1, 1 + (i % 4 ? 1 : 0), B.hem); }
      else if (s.bottom && s.bottom.k === 'apron') { const B = s.bottom; A(-3, top + 13, 7, 1, B.hem); A(-4, top + 14, 1, 4, B.hem); A(-1, top + 14, 4, 2 + B.len, B.col); A(-1, top + 16, 4, 1, B.hem); A(1, top + 14, 1, 2 + B.len, B.hem); for (let i = 0; i < 4; i += 2) A(-1 + i, top + 16 + B.len, 1, 1, B.col); }
      else if (s.bottom) { const B = s.bottom; A(-3, top + 13, 7, 3 + B.len, B.col); A(-3, top + 15 + B.len, 7, 1, B.hem); }
      if (s.pants) A(-3, top + 13, 7, 2, s.pants);
      if (s.hip === 'gourd' && !P.gourd) { A(-5, top + 13, 3, 4, '#d8b04a'); A(-4, top + 12, 1, 1, '#7a5a2a'); }
      A(hx + 1.4, hy + 5.4, 2.6, 1.6, skin); A(hx + 1.4, hy + 5.4, 0.7, 1.6, skinD);
      A(hx + 1, hy, 4, 1, skin); A(hx, hy + 1, 6, 4, skin); A(hx + 1, hy + 5, 4.6, 1, skin);
      A(hx + 6, hy + 1.8, 0.8, 1.8, skin); A(hx + 6.2, hy + 1.8, 0.6, 0.8, skinL);
      A(hx + 5.8, hy + 3.4, 0.7, 0.6, skinD);
      A(hx + 0.8, hy + 2.6, 1.4, 2.2, skin); A(hx + 0.9, hy + 2.8, 0.6, 1.6, skinD); if (!esp) A(hx + 1.5, hy + 3.2, 0.6, 0.8, '#3a1e12');
      A(hx + 4.8, hy + 3.2, 1, 0.7, skinL);
      if (!esp) { A(hx + 4.4, hy + 4.4, 1.8, 0.6, '#5a2a20'); A(hx + 4.6, hy + 5, 1.2, 0.5, '#8a4a38'); }
      A(hx + 1, hy + 4.6, 2.6, 0.8, skinD);
      A(hx + 1.4, hy + 6, 2.4, 0.7, skinD);
      if (s.paint) A(hx + 4, hy + 4, 2, 1, s.paint);
      if (s.stripe) { A(hx + 3, hy + 3, 3, 1, s.stripe); A(hx + 2, hy + 4, 1, 1, s.stripe); }
      if (s.facePaint) A(hx + 1, hy + 2, 6, 1, s.facePaint);
      if (!P.blink) { A(hx + 3.6, hy + 2, 1.2, 1, s.skin === SPEC.espirito.skin ? s.eye : '#f0e8d8'); A(hx + 4.8, hy + 2, 1.2, 1, s.eye); A(hx + 3.6, hy + 1.4, 2.4, 0.6, skinD); } else A(hx + 4, hy + 3, 2, 1, skinD);
      if (P.puff) A(hx + 5, hy + 4, 2, 2, skin);
      if (s.hairStyle === 'white') { A(hx - 1, hy - 1, 7, 3, hair); A(hx - 1, hy + 2, 2, 3, hair); A(hx + 4, hy + 4, 3, 3, hair); }
      else if (s.hairStyle === 'hood') {
        A(hx - 1, hy - 2, 7, 3, s.hood); A(hx - 1, hy + 1, 2, 5, s.hood); A(hx + 5, hy - 1, 2, 2, s.hood); A(hx, hy - 2, 5, 1, '#c8402e');
        A(hx + 2, hy + 1, 3, 1, skinD); seg(hx, hy - 2, hx - 2, hy - 6, '#e8dcc0', 1); seg(hx + 1, hy - 2, hx, hy - 7, '#a8302a', 1); A(hx - 2, hy - 6, 1, 1, '#2a1a14');
      }
      else if (s.hairStyle === 'wild') { A(hx - 1, hy - 1, 7, 3, hair); A(hx - 1, hy + 2, 2, 4, hair); A(hx + 4, hy + 1, 2, 1, hair); A(hx + 5, hy + 2, 1, 1, hair); A(hx, hy - 2, 2, 1, hair); A(hx + 3, hy - 2, 1, 1, hair); }
      else if (s.hairStyle === 'topknot') { A(hx - 1, hy - 1, 7, 2, hair); A(hx - 1, hy + 1, 2, 4, hair); A(hx + 5, hy, 2, 2, hair); A(hx, hy - 3, 3, 2, hair); }
      else { A(hx - 1, hy - 1, 7, 3, hair); A(hx - 1, hy + 2, 2, 3, hair); A(hx + 5, hy, 2, 1, hair); }
      const ax = hx + 3, ay = hy;
      if (s.acc === 'crown') { for (let i = 0; i < 7; i++) A(ax - 3 + i, ay - 3 - (i % 2), 1, 3 + (i % 2), i % 2 ? '#f2c14e' : '#e0703a'); A(ax - 3, ay, 7, 1, '#c8402e'); }
      if (s.acc === 'tuft') { A(ax - 7, ay - 1, 4, 1, '#efe8dc'); A(ax - 8, ay, 4, 1, '#c8402e'); A(ax - 6, ay + 1, 2, 1, '#efe8dc'); }
      if (s.acc === 'plume') { A(ax - 1, ay - 5, 1, 4, '#f4f0e8'); A(ax, ay - 7, 1, 4, '#f4f0e8'); A(ax - 2, ay - 4, 1, 2, '#d8d4cc'); }
      if (s.acc === 'fan') { for (let i = -3; i <= 3; i++) A(ax + i, ay - 4 + (Math.abs(i) >> 1), 1, 3, i % 2 ? '#b8b0a0' : '#d8d0c0'); A(ax - 4, ay + 1, 8, 1, '#c8402e'); }
      if (s.acc === 'cocar' || s.acc === 'skull') {
        const cores = ['#a8302a', '#e8dcc0', '#c8402e', '#2a1a14', '#e8dcc0', '#a8302a', '#e8dcc0'], n = s.acc === 'skull' ? 5 : 7;
        for (let i = 0; i < n; i++) { const ang = -HPI * 0.92 + i * (HPI * 0.62 / (n - 1)), L2 = 6 + (i % 2) * 2, bx = hx + 2, by = hy - 1, ex = bx + Math.cos(ang) * L2, ey = by + Math.sin(ang) * L2; seg(bx, by, ex, ey, cores[i], 1); A(Math.round(ex), Math.round(ey), 1, 1, i % 2 ? '#2a1a14' : '#f4f0e8'); }
        if (s.acc === 'cocar') { A(hx - 1, hy + 1, 7, 1, '#a8302a'); A(hx + 4, hy + 1, 2, 1, '#e8dcc0'); A(hx + 1, hy + 1, 1, 1, '#e8dcc0'); }
      }
      if (s.acc === 'skull') {
        A(hx + 1, hy - 1, 6, 5, '#e8e0d0'); A(hx + 1, hy - 1, 6, 1, '#f8f4ec'); A(hx + 6, hy, 1, 3, '#c8c0b0');
        A(hx + 3, hy + 1, 1, 2, '#120a08'); A(hx + 5, hy + 1, 1, 2, '#120a08'); A(hx + 5, hy + 1, 1, 1, '#ff4a2a'); A(hx + 4, hy + 3, 1, 1, '#3a3028');
        A(hx + 2, hy + 4, 5, 1, '#e8e0d0'); A(hx + 3, hy + 4, 1, 1, '#3a3028'); A(hx + 5, hy + 4, 1, 1, '#3a3028');
      }
      if (s.acc === 'headband') { A(hx - 1, hy + 1, 7, 1, '#a8302a'); A(hx + 1, hy + 1, 1, 1, '#e8d8c0'); A(hx + 3, hy + 1, 1, 1, '#e8d8c0'); A(hx - 3, hy - 3, 1, 4, '#efe8dc'); A(hx - 2, hy - 5, 1, 5, '#efe8dc'); A(hx - 2, hy - 5, 1, 1, '#a8302a'); A(hx - 4, hy - 1, 1, 3, '#c8402e'); }
      if (s.acc === 'knotfeather') { A(hx + 1, hy - 6, 1, 3, '#efe8dc'); A(hx + 2, hy - 5, 1, 2, '#a8302a'); A(hx, hy - 2, 3, 1, '#a8302a'); }
      if (s.acc === 'feather1') { A(hx - 1, hy - 4, 1, 4, '#e8dcc0'); A(hx, hy - 5, 1, 4, '#a8302a'); A(hx, hy - 5, 1, 1, '#2a1a14'); A(hx - 1, hy - 4, 1, 1, '#c8402e'); }
      if (s.acc === 'yellowfeathers') { A(hx - 1, hy + 1, 7, 1, '#6a4a2a'); A(hx - 1, hy - 4, 1, 4, '#e8c040'); A(hx, hy - 6, 1, 5, '#f0d050'); A(hx + 1, hy - 4, 1, 3, '#c8a030'); A(hx, hy - 6, 1, 1, '#fff0a0'); }
      if (s.acc === 'redband') { A(hx - 1, hy + 1, 7, 1, '#a8302a'); A(hx - 2, hy + 1, 1, 3, '#a8302a'); }
      if (s.acc === 'strawhat') { A(hx - 1, hy - 3, 7, 3, '#e0c07a'); A(hx - 1, hy - 1, 7, 1, '#7a4a2a'); A(hx - 4, hy, 13, 1, '#d8b46a'); A(hx - 4, hy + 1, 13, 1, '#8a6a3a'); for (let i = 0; i < 6; i++) A(hx - 3 + i * 2, hy, 1, 1, '#b8944a'); A(hx + 1, hy - 3, 1, 1, '#f0d898'); }
      if (s.acc === 'sprouts') { A(ax - 2, ay - 4, 1, 4, '#6fd36a'); A(ax, ay - 5, 1, 5, '#8fe37a'); A(ax + 2, ay - 3, 1, 3, '#6fd36a'); A(ax - 3, ay, 7, 1, '#c8402e'); }
      const [eF, hF0] = arm(shF, P.af);
      const hF = P.mouth ? [hx + 6, hy + 4] : hF0;
      const d = [Math.sin(P.wa), Math.cos(P.wa)], wood = '#8a6a3a', metal = '#d8d8d0';
      if (s.weapon && !P.noWeapon) {
        if (s.weapon === 'spear' && s.wstyle === 'tribal') {
          const n = [Math.cos(P.wa), -Math.sin(P.wa)], at = L2 => [hF[0] + d[0] * L2, hF[1] + d[1] * L2];
          seg(hF[0] - d[0] * 8, hF[1] - d[1] * 8, at(19)[0], at(19)[1], '#4a2a1a', 1);
          const [bx, by] = at(17); A(Math.round(bx), Math.round(by), 1, 1, '#e8d8c0');
          for (const o of [-1, 1]) { const fx = Math.round(bx + n[0] * o * 2), fy = Math.round(by + n[1] * o * 2); A(fx, fy, 1, 3, '#a01e1e'); A(fx, fy + 3, 1, 1, '#e8d8c0'); }
          for (let L2 = 20; L2 <= 24; L2++) { const [px, py] = at(L2), w2 = L2 < 23 ? 1 : 0; for (let k = -w2; k <= w2; k++) A(Math.round(px + n[0] * k), Math.round(py + n[1] * k), 1, 1, k ? '#a8a094' : '#e0d8cc'); }
        } else if (s.weapon === 'spear') { seg(hF[0] - d[0] * 8, hF[1] - d[1] * 8, hF[0] + d[0] * 19, hF[1] + d[1] * 19, wood, 1); const tx = Math.round(hF[0] + d[0] * 21), ty = Math.round(hF[1] + d[1] * 21); A(tx - 1, ty - 1, 3, 3, metal); A(Math.round(hF[0] + d[0] * 23), Math.round(hF[1] + d[1] * 23), 1, 1, metal); }
        if (s.weapon === 'paddle') {
          const n = [Math.cos(P.wa), -Math.sin(P.wa)], at = L2 => [hF[0] + d[0] * L2, hF[1] + d[1] * L2];
          seg(hF[0] - d[0] * 6, hF[1] - d[1] * 6, at(14)[0], at(14)[1], '#8a5a2a', 1);
          for (let L2 = 14; L2 <= 22; L2++) { const [px, py] = at(L2), w2 = L2 < 15 || L2 > 21 ? 1 : 2; for (let k = -w2; k <= w2; k++) A(Math.round(px + n[0] * k), Math.round(py + n[1] * k), 1, 1, Math.abs(k) === w2 ? '#5a3a1a' : '#9a6a32'); }
          A(Math.round(hF[0] - d[0] * 6) - 1, Math.round(hF[1] - d[1] * 6) - 1, 2, 2, '#6a4220');
        }
        if (s.weapon === 'staff' && s.wstyle === 'leafy') {
          seg(hF[0] - d[0] * 9, hF[1] - d[1] * 9, hF[0] + d[0] * 14, hF[1] + d[1] * 14, '#6a4a2a', 1);
          const tx = hF[0] + d[0] * 15, ty = hF[1] + d[1] * 15;
          for (const [ox, oy, c2] of [[-2, -1, '#4a8a3a'], [2, 0, '#6aaa4a'], [-1, -3, '#5a9a3a'], [1, -4, '#8fd06a'], [3, -2, '#4a8a3a'], [-3, 1, '#6aaa4a'], [0, 3, '#4a8a3a']]) A(Math.round(tx + ox), Math.round(ty + oy), 1, 1, c2);
          A(Math.round(tx), Math.round(ty) - 1, 2, 2, '#7a5a32'); A(Math.round(tx + 2), Math.round(ty - 5), 1, 1, '#c8f060');
        } else if (s.weapon === 'staff') { seg(hF[0] - d[0] * 9, hF[1] - d[1] * 9, hF[0] + d[0] * 14, hF[1] + d[1] * 14, wood, 1); A(Math.round(hF[0] + d[0] * 15) - 1, Math.round(hF[1] + d[1] * 15) - 1, 3, 3, '#a87a4a'); }
        if (s.weapon === 'pick' || s.weapon === 'axe') {
          const tc = s.toolCol || '#c8ccd4', ex = hF[0] + d[0] * 9, ey = hF[1] + d[1] * 9, n = [Math.cos(P.wa), -Math.sin(P.wa)];
          seg(hF[0] - d[0] * 2, hF[1] - d[1] * 2, ex, ey, wood, 1);
          if (s.weapon === 'pick') seg(ex - n[0] * 5 - d[0] * 2, ey - n[1] * 5 - d[1] * 2, ex + n[0] * 5 - d[0] * 2, ey + n[1] * 5 - d[1] * 2, tc, 2);
          else A(Math.round(ex + n[0]) - 1, Math.round(ey + n[1]) - 2, 3, 4, tc);
        }
        if (s.weapon === 'blowgun') { const b = P.mouth ? 1 : 4; seg(hF[0] - d[0] * b, hF[1] - d[1] * b, hF[0] + d[0] * 16, hF[1] + d[1] * 16, s.gunCol || wood, 1); if (s.gunCol) A(Math.round(hF[0] + d[0] * 16), Math.round(hF[1] + d[1] * 16), 1, 1, '#5a4a40'); }
        if (s.weapon === 'bow') {
          const n = [Math.cos(P.wa), -Math.sin(P.wa)];
          const tribal = s.wstyle === 'tribal';
          for (let k = -8; k <= 8; k++) { const bulge = 2.2 * (1 - (k / 8) ** 2), tipC = tribal && Math.abs(k) === 8 ? -1 : 0; A(Math.round(hF[0] + n[0] * k + d[0] * (bulge + tipC)), Math.round(hF[1] + n[1] * k + d[1] * (bulge + tipC)), 1, 1, tribal ? (Math.abs(k) === 5 ? '#c02a2a' : k === 0 ? '#e8d8c0' : '#7a3a22') : k === 0 ? '#c8a46a' : (s.bowCol || '#c8a46a')); }
          if (tribal) { const gx = Math.round(hF[0] + d[0] * 2 - n[0] * 2), gy = Math.round(hF[1] + d[1] * 2 - n[1] * 2); A(gx, gy + 1, 1, 3, '#a01e1e'); A(gx + 1, gy + 2, 1, 2, '#c8402e'); A(gx, gy + 4, 1, 1, '#e8d8c0'); }
          const nock = [hF[0] - d[0] * (1 + P.draw * 6), hF[1] - d[1] * (1 + P.draw * 6)];
          seg(hF[0] + n[0] * 8, hF[1] + n[1] * 8, nock[0], nock[1], '#e8d8b8', 1); seg(nock[0], nock[1], hF[0] - n[0] * 8, hF[1] - n[1] * 8, '#e8d8b8', 1);
          if (P.arrow) { seg(nock[0], nock[1], hF[0] + d[0] * 5, hF[1] + d[1] * 5, '#efe0c0', 1); A(Math.round(nock[0]), Math.round(nock[1]), 1, 1, '#c8402e'); }
        }
      }
      if (P.gourd) { A(Math.round(hF[0]) - 1, Math.round(hF[1]) - 2, 3, 4, '#d8b04a'); A(Math.round(hF[0]), Math.round(hF[1]) - 3, 1, 1, '#7a5a2a'); }
      A(shF[0] - 1.5, shF[1] - 1.3, 3, 2.4, skin); A(shF[0] - 0.6, shF[1] - 1.3, 1.4, 0.7, skinL);
      limb(shF[0], shF[1], eF[0], eF[1], 2.6, 1.9, skin, null, skinM); A((shF[0] + eF[0]) / 2 - 0.3, (shF[1] + eF[1]) / 2 - 0.6, 0.7, 0.7, skinL);
      A(eF[0] - 0.35, eF[1] - 0.35, 0.7, 0.7, skinD);
      limb(eF[0], eF[1], hF[0], hF[1], 2.1, 1.5, skin, null, skinM);
      A(hF[0] - 1, hF[1] - 0.8, 2.1, 2, skin); A(hF[0] + 0.6, hF[1] - 1.3, 0.8, 0.9, skin);
      A(hF[0] - 0.8, hF[1] + 0.6, 1.8, 0.6, skinD); A(hF[0] + 0.3, hF[1] - 0.8, 0.6, 0.6, skinL);
      armBand(eF, hF);
      if (s.sleeve) { limb(shF[0], shF[1], eF[0], eF[1], 2.8, 2.3, s.sleeve, '#4a64a0', '#24324e'); A(shF[0] - 1.6, shF[1] - 1.4, 3.2, 2.4, s.sleeve); }
      if (s.armPaint) A(Math.round((shF[0] + eF[0]) / 2), Math.round((shF[1] + eF[1]) / 2), 1, 1, s.armPaint);
      if (s.fur) { A(Math.round(shF[0]) - 2, Math.round(shF[1]) - 2, 4, 3, s.fur); A(Math.round(shF[0]) - 1, Math.round(shF[1]) + 1, 1, 1, '#a89878'); A(Math.round(shF[0]) + 1, Math.round(shF[1]) + 1, 1, 1, '#a89878'); }
      slash = P.slash; tip = s.weapon === 'spear' ? 22 : s.weapon === 'paddle' ? 20 : s.weapon === 'staff' ? 15 : 8;
    }
  }
  if (alpha !== undefined) c.globalAlpha = alpha;
  c.fillStyle = s.outline || '#120a08';
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillRect(Math.round(sx) - 1, Math.round(y + q[1]) - 1, q[2] + 2, q[3] + 2); }
  for (const q of R) { const sx = f > 0 ? x + q[0] : x - q[0] - q[2]; c.fillStyle = flash ? '#ffffff' : q[4]; c.fillRect(Math.round(sx), Math.round(y + q[1]), q[2], q[3]); }
  if (slash) drawSlash(c, x, y, f, Object.assign({}, slash, { r: slash.r && slash.r * HUMAN_S, len: slash.len && slash.len * HUMAN_S }), [shF[0] * HUMAN_S, shF[1] * HUMAN_S], tip * HUMAN_S, s);
  if (alpha !== undefined) c.globalAlpha = 1;
}
