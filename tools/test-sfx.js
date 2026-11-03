'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const core = fs.readFileSync(path.join(__dirname, '../js/core.js'), 'utf8');
const code = core.slice(core.indexOf('// ---------- Áudio'), core.indexOf('// ---------- Save'));
function fixture(audioCode = code) {
  const sources = [], filters = [];
  let buffers = 0;
  const param = () => ({ value: 0, events: [],
    setValueAtTime(value, time) { assert.ok(Number.isFinite(value) && time >= 0); this.events.push(['set',value,time]); },
    exponentialRampToValueAtTime(value, time) { assert.ok(Number.isFinite(value) && value > 0 && time >= 0); this.events.push(['ramp',value,time]); },
  });
  const node = () => ({ disconnected: false, connect() {}, disconnect() { this.disconnected = true; } });
  const c = { currentTime: 0, sampleRate: 48000,
    createGain() { return { ...node(), gain: param() }; },
    createOscillator() { const s = { ...node(), frequency: param(), start(t) { this.startAt=t; }, stop(t) { this.stopAt=t; } }; sources.push(s); return s; },
    createBufferSource() { const s = { ...node(), start(t) { this.startAt=t; }, stop(t) { this.stopAt=t; } }; sources.push(s); return s; },
    createBiquadFilter() { const f = { ...node(), Q:param(), frequency:param() }; filters.push(f); return f; },
    createBuffer() { buffers++; return { getChannelData: () => new Float32Array(48000) }; },
  };
  const music = { muted:false, volume:0 };
  let seed = 12345; const math = Object.create(Math);
  math.random = () => ((seed = Math.imul(seed,1664525) + 1013904223 >>> 0) / 4294967296);
  const scope = vm.createContext({ Math:math, document: { addEventListener() {}, querySelectorAll: () => [], getElementById:()=>music}, localStorage:{getItem:()=>null} });
  vm.runInContext(audioCode,scope);
  const {AU,SFX} = vm.runInContext('({AU,SFX})',scope);
  return {AU,SFX,c,sources,filters,buffers:()=>buffers};
}
test('todos os efeitos ficam silenciosos sem contexto ou com Som desligado',()=>{
  const {AU,SFX,c,sources}=fixture();
  for(const play of Object.values(SFX)) play();
  AU.ctx=c; AU.on=false;
  for(const play of Object.values(SFX)) play();
  assert.equal(sources.length,0);
});
test('todos os timbres têm envelopes válidos, terminam e liberam suas fontes',()=>{
  const {AU,SFX,c,sources,filters,buffers}=fixture(); AU.ctx=c; AU.master=c.createGain();
  for(const play of Object.values(SFX)) play();
  assert.ok(sources.length>50);
  assert.equal(buffers(),4,'as quatro texturas são criadas uma única vez');
  for(const s of sources){ assert.ok(s.stopAt>s.startAt && s.stopAt-s.startAt<2); if(s.type)assert.equal(s.type,'sine'); s.onended(); assert.equal(s.disconnected,true); }
  assert.ok(filters.every(f=>f.disconnected));
});
test('as versões alternam timbre e duração sem repetir a versão anterior',()=>{
  for(const name of ['step','hit','swing','dash','mapClaw','mapSlam','mapRoar']) {
    const {AU,SFX,c,sources,filters}=fixture(); AU.ctx=c; AU.master=c.createGain();
    const signatures=[];
    for(let i=0;i<12;i++) {
      const start=sources.length, firstFilter=filters.length;
      SFX[name]();
      signatures.push(JSON.stringify([
        sources.slice(start).map(s=>[+(s.stopAt-s.startAt).toFixed(6),s.frequency?.events.map(e=>e[1])]),
        filters.slice(firstFilter).map(f=>[f.type,f.frequency.events.map(e=>e[1])]),
      ]));
      c.currentTime+=2;
    }
    assert.equal(new Set(signatures.slice(0,4)).size,4,name);
    for(let i=1;i<signatures.length;i++) assert.notEqual(signatures[i],signatures[i-1],name);
  }
});
test('sequências longas reutilizam texturas em vez de criar um buffer a cada passo',()=>{
  const {AU,SFX,c,buffers}=fixture(); AU.ctx=c; AU.master=c.createGain();
  for(let i=0;i<80;i++){ SFX.step(); SFX.hit(); SFX.mapRoar(); c.currentTime+=2; }
  assert.equal(buffers(),4);
});
test('a segunda pancada e o choque na parede têm acentos diferentes',()=>{
  const signature = kind => {
    const {AU,SFX,c,sources,filters}=fixture(); AU.ctx=c; AU.master=c.createGain(); SFX.mapSlam(kind);
    return JSON.stringify([sources.map(s=>[s.stopAt,s.frequency?.events]), filters.map(f=>[f.type,f.frequency.events])]);
  };
  assert.notEqual(signature('heavy'),signature('echo'));
  assert.notEqual(signature('heavy'),signature('wall'));
});
test('repetições rápidas são limitadas e voltam a tocar após o intervalo',()=>{
  const {AU,SFX,c,sources}=fixture(); AU.ctx=c; AU.master=c.createGain();
  SFX.ui(); const count=sources.length;
  for(let i=0;i<120;i++) SFX.ui();
  assert.equal(sources.length,count);
  c.currentTime=0.1; SFX.ui();
  assert.equal(sources.length,count*2);
});
