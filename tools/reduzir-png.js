// Reduz PNGs RGB/RGBA (8 bits, sem entrelaçamento) por um fator inteiro, pela média de cada bloco.
// Uso: node tools/reduzir-png.js <fator> <saida-dir> <arquivo1.png> [arquivo2.png ...]
// Usado para trazer o parallax do Cerrado (2172x724) para a resolução do jogo (320x180).
const fs = require('fs'), zlib = require('zlib'), path = require('path');

function decode(buf) {
  let p = 8, w, h, ct, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12]) throw new Error('formato não suportado'); }
    if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0; if (!bpp) throw new Error('tipo de cor não suportado: ' + ct);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride), cur;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]; cur = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      if (f === 1) cur[i] = (cur[i] + a) & 255;
      else if (f === 2) cur[i] = (cur[i] + b) & 255;
      else if (f === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 255;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255; }
    }
    for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; out[o] = cur[x * bpp]; out[o + 1] = cur[x * bpp + 1]; out[o + 2] = cur[x * bpp + 2]; out[o + 3] = bpp === 4 ? cur[x * bpp + 3] : 255; }
    prev = cur;
  }
  return { w, h, px: out };
}
function crc(buf) { let x = 0xffffffff; for (const b of buf) { x ^= b; for (let k = 0; k < 8; k++) x = x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1; } return (x ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); }
function encode(w, h, px) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const [k, outDir, ...files] = process.argv.slice(2);
const F = +k; fs.mkdirSync(outDir, { recursive: true });
for (const f of files) {
  const img = decode(fs.readFileSync(f)), w = Math.floor(img.w / F), h = Math.floor(img.h / F), px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = [0, 0, 0, 0];
    for (let j = 0; j < F; j++) for (let i = 0; i < F; i++) { const o = ((y * F + j) * img.w + x * F + i) * 4; for (let c = 0; c < 4; c++) s[c] += img.px[o + c]; }
    for (let c = 0; c < 4; c++) px[(y * w + x) * 4 + c] = Math.round(s[c] / (F * F));
  }
  const out = path.join(outDir, path.basename(f));
  fs.writeFileSync(out, encode(w, h, px));
  console.log(out, w + 'x' + h);
}
