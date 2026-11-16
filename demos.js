/* ══════════════════════════════════════════════════════════
   demos.js — one playable module per system
   Every demo mirrors the real system's own logic.
   ══════════════════════════════════════════════════════════ */

function vd(kind, title, body){
  const ic = {good:'✓', warn:'!', crit:'✕', info:'i'}[kind];
  return `<div class="verdict v-${kind}"><span class="ic">${ic}</span>
    <span><b>${esc(title)}</b>${esc(body)}</span></div>`;
}
const pad2 = n => String(n).padStart(2,'0');
function addDays(d, n){ const x = new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
function fmtDate(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }

/* ── shared: redraw hooks for demos whose drawing depends on width ── */
const RESIZERS = [];
function onResize(fn){ RESIZERS.push(fn); }
function clearResizers(){ RESIZERS.length = 0; }
let _rzT = null;
window.addEventListener('resize', () => {
  clearTimeout(_rzT);
  _rzT = setTimeout(()=> RESIZERS.forEach(f => { try{ f(); }catch(e){} }), 160);
}, {passive:true});

/* ── shared: motion, sound, typing ────────────────────────── */
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── sound ────────────────────────────────────────────────
   Everything is synthesised on the fly — no audio files, so the page
   stays one small bundle. Nothing plays until the visitor has clicked
   something, and the speaker button in the header silences all of it.
   ───────────────────────────────────────────────────────── */
const SPEECH_LANG = { zh:'zh-TW', en:'en-GB', ja:'ja-JP', vi:'vi-VN', ko:'ko-KR' };

const Snd = {
  ac: null, muted: false, gestured: false, loop: null, voicesReady: false,

  init(){
    try{ this.muted = localStorage.getItem('sn_mute') === '1'; }catch(e){}
    document.addEventListener('pointerdown', ()=>{ this.gestured = true; this.ctx(); }, {once:true});
    try{
      if(window.speechSynthesis){
        const warm = ()=>{ this.voicesReady = true; };
        speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', warm);
      }
    }catch(e){}
  },
  ctx(){
    try{
      this.ac = this.ac || new (window.AudioContext || window.webkitAudioContext)();
      if(this.ac.state === 'suspended') this.ac.resume();
      return this.ac;
    }catch(e){ return null; }
  },
  setMuted(m){
    this.muted = m;
    try{ localStorage.setItem('sn_mute', m ? '1':'0'); }catch(e){}
    if(m){ this.stopLoop(); this.hush(); }
  },

  /* one shaped tone */
  tone(f, t0, dur, type, vol, f2){
    const ac = this.ctx(); if(!ac || this.muted) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    const at = ac.currentTime + t0;
    o.frequency.setValueAtTime(f, at);
    if(f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol || 0.07, at + Math.min(0.02, dur*0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(at); o.stop(at + dur + 0.03);
  },
  seq(notes){ notes.forEach(n => this.tone(n[0], n[1], n[2], n[3], n[4], n[5])); },

  /* ── confirmation ── */
  ok(){   this.tone(2100, 0, 0.09, 'square', 0.05); },
  done(){ this.seq([[1500,0,0.08,'square',0.05],[2200,0.1,0.12,'square',0.05]]); },
  tick(){ this.tone(1200, 0, 0.04, 'square', 0.03); },
  fail(){ this.seq([[380,0,0.18,'sawtooth',0.05],[300,0.16,0.26,'sawtooth',0.05]]); },
  buzz(){ this.tone(170, 0, 0.26, 'square', 0.045); },

  /* ── public-address chime, the three notes before an announcement ── */
  chime(){ this.seq([[523.25,0,0.55,'sine',0.085],[659.25,0.22,0.55,'sine',0.085],[783.99,0.44,0.9,'sine',0.085]]); },

  /* ── nurse call: keeps ringing until somebody answers ── */
  nurseCall(kind){
    this.stopLoop();
    if(this.muted) return;
    const pat = kind==='c-crit' ? {gap:1250, hits:[[0,880],[0.16,1046],[0.32,880]], v:0.075}
              : kind==='c-warn' ? {gap:1700, hits:[[0,740],[0.2,620]], v:0.06}
              :                   {gap:2600, hits:[[0,523]], v:0.05};
    const ring = ()=> pat.hits.forEach(h => this.tone(h[1], h[0], 0.14, 'square', pat.v));
    ring();
    this.loop = setInterval(ring, pat.gap);
  },
  stopLoop(){ if(this.loop){ clearInterval(this.loop); this.loop = null; } },

  /* ── infusion pump, after IEC 60601-1-8 priority patterns ── */
  pumpWarn(){ this.seq([[660,0,0.14,'square',0.06],[660,0.26,0.14,'square',0.06]]); },
  pumpAlarm(){
    const burst = o => this.seq([
      [988,o,0.11,'square',0.075],[988,o+0.17,0.11,'square',0.075],[988,o+0.34,0.11,'square',0.075],
      [988,o+0.72,0.11,'square',0.075],[988,o+0.89,0.11,'square',0.075]]);
    burst(0); burst(1.5);
  },

  /* ── fire alarm bell ── */
  fireBell(secs){
    if(this.muted) return;
    const n = Math.round((secs||2.4)/0.14);
    for(let i=0;i<n;i++) this.tone(i%2 ? 1000 : 820, i*0.14, 0.12, 'square', 0.055);
  },

  /* ── monitoring alert ── */
  alert(){ this.seq([[784,0,0.16,'sine',0.07],[1046,0.18,0.16,'sine',0.07],[784,0.36,0.16,'sine',0.07]]); },

  /* ── synthesised speech, in whichever language is showing ── */
  speak(text, opts){
    opts = opts || {};
    if(this.muted || !this.gestured) return false;
    try{
      if(!window.speechSynthesis) return false;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = SPEECH_LANG[typeof LANG !== 'undefined' ? LANG : 'en'] || 'en-GB';
      u.rate = opts.rate || 0.95; u.pitch = opts.pitch || 1; u.volume = opts.volume || 1;
      const vs = speechSynthesis.getVoices() || [];
      const pref = vs.find(v => v.lang && v.lang.toLowerCase() === u.lang.toLowerCase())
                || vs.find(v => v.lang && v.lang.toLowerCase().slice(0,2) === u.lang.slice(0,2).toLowerCase());
      if(pref) u.voice = pref;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  },
  /* chime, then the announcement */
  announce(text, delay){
    this.chime();
    setTimeout(()=> this.speak(text), delay || 1200);
  },
  hush(){ try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){} }
};
Snd.init();

/* kept for readability at the call sites */
const beepOk   = () => Snd.ok();
const beepDone = () => Snd.done();
const beepFail = () => Snd.fail();
function beep(f, d, type){ Snd.tone(f, 0, (d||80)/1000, type || 'square', 0.055); }

/* Types text into el; calls onTick each frame so a mouth can move with it. */
function typeInto(el, text, speed, onTick, done){
  if(reduced()){ el.textContent = text; if(onTick) onTick(false); if(done) done(); return ()=>{}; }
  let i = 0; el.textContent = '';
  const iv = setInterval(()=>{
    el.textContent = text.slice(0, ++i);
    if(onTick) onTick(true);
    if(i >= text.length){ clearInterval(iv); if(onTick) onTick(false); if(done) done(); }
  }, speed);
  return ()=>{ clearInterval(iv); el.textContent = text; if(onTick) onTick(false); };
}

/* Counts a number up, for score reveals. */
function countUp(el, to, dur, suffix){
  if(reduced()){ el.textContent = to + (suffix||''); return; }
  const t0 = performance.now();
  (function step(now){
    const p = Math.min(1, (now - t0)/dur);
    const e = 1 - Math.pow(1-p, 3);
    el.textContent = Math.round(to*e) + (suffix||'');
    if(p < 1) requestAnimationFrame(step);
  })(t0);
}

/* ══ 01 智慧病房 ═══════════════════════════════════════════ */
function demoWard(root){
  let page = 1, call = null, tick = null, sec = 0;
  const calls = [
    {k:'d.ward.c1', bed:'562', cls:'c-crit'},
    {k:'d.ward.c2', bed:'566', cls:'c-warn'},
    {k:'d.ward.c3', bed:'568', cls:'c-norm'}
  ];

  function card(){
    const rows = page===1
      ? [['d.ward.bed','562'],['d.ward.name',t('d.ward.demoName')],['d.ward.doc','◯◯◯'],
         ['d.ward.diag','Pneumonia'],['d.ward.allergy','Penicillin'],
         ['d.ward.fall',t('d.ward.vhigh')],['d.ward.npo',t('d.ward.yes')]]
      : [['d.ward.diet',t('d.ward.npo')+' · 06:00–12:00'],['d.ward.tube','IV · NG'],
         ['d.ward.act','Bed rest'],['d.ward.fall',t('d.ward.vhigh')],
         ['d.ward.npo',t('d.ward.yes')],['d.ward.allergy','Penicillin'],['d.ward.bed','562']];
    return `<div class="bcard">
      <div class="bcard-top"><span class="bcard-bed num">562</span>
        <span class="bcard-pg">${esc(t('d.ward.pg',{n:page}))} · ${esc(t(page===1?'d.ward.pg1':'d.ward.pg2'))}</span></div>
      <dl class="bcard-dl">${rows.map(r=>
        `<dt>${esc(t(r[0]))}</dt><dd${(r[1]===t('d.ward.vhigh'))?' class="hi"':''}>${esc(r[1])}</dd>`).join('')}</dl>
      <div class="bcard-dots"><i class="${page===1?'on':''}"></i><i class="${page===2?'on':''}"></i></div>
    </div>`;
  }

  function panel(){
    if(!call) return `<div class="np-idle">${esc(t('d.ward.idle'))}</div>`;
    return `<div class="np-row ${call.cls}">
        <span class="np-bed num">${call.bed}</span>
        <span class="np-type">${esc(t(call.k))}</span>
        <span class="np-time num">${call.time}</span></div>
      <div class="np-phone">
        <div class="np-ph-h">${esc(t('d.ward.phone'))}</div>
        <div class="np-push ${call.cls}">
          <b>${call.bed} · ${esc(t(call.k))}</b>
          <span class="num">${call.ack!==null ? esc(t('d.ward.acked',{s:call.ack})) : esc(t('d.ward.elapsed',{s:sec}))}</span>
        </div>
        ${call.ack===null?`<button class="btn sm" data-ack="1">${esc(t('d.ward.ack'))}</button>`
          :`<div class="np-ok">${esc(t('d.ward.pushed'))}</div>`}
      </div>`;
  }

  function draw(){
    root.innerHTML = `<div class="wgrid">
      <div>${card()}<button class="btn ghost sm" data-flip="1" style="margin-top:12px">${esc(t('d.ward.flip'))}</button></div>
      <div><div class="sub-h">${esc(t('d.ward.callt'))}</div>
        <div class="callbtns">${calls.map((c,i)=>
          `<button class="callb ${c.cls}" data-call="${i}">${esc(t(c.k))}<small class="num">${c.bed}</small></button>`).join('')}</div>
        <div class="sub-h" style="margin-top:16px">${esc(t('d.ward.board'))}</div>
        <div class="npanel">${panel()}</div>
      </div></div>`;
  }

  root.addEventListener('click', e => {
    if(e.target.closest('[data-flip]')){ page = page===1?2:1; draw(); return; }
    const cb = e.target.closest('[data-call]');
    if(cb){
      const now = new Date();
      call = Object.assign({}, calls[+cb.dataset.call],
        {time: pad2(now.getHours())+':'+pad2(now.getMinutes()), ack:null});
      sec = 0; clearInterval(tick);
      tick = setInterval(()=>{ sec++; if(call && call.ack===null) draw(); }, 1000);
      Snd.nurseCall(call.cls);
      draw(); return;
    }
    if(e.target.closest('[data-ack]')){
      call.ack = sec; clearInterval(tick); Snd.stopLoop(); Snd.ok(); draw();
    }
  });
  draw();
}

/* ══ 02 智慧 Pump ══════════════════════════════════════════ */
function demoPump(root){
  const DRUGS = [
    {k:'d.pump.d1', u:'U/hr',    lo:500, hi:2000, hard:2500, def:1200, step:50},
    {k:'d.pump.d2', u:'U/hr',    lo:0.5, hi:10,   hard:20,   def:4,    step:0.5},
    {k:'d.pump.d3', u:'mcg/min', lo:2,   hi:20,   hard:30,   def:8,    step:1},
    {k:'d.pump.d4', u:'mEq/hr',  lo:5,   hi:10,   hard:20,   def:10,   step:1},
    {k:'d.pump.d5', u:'mg/hr',   lo:50,  hi:250,  hard:400,  def:150,  step:10}
  ];
  let di = 0, dose = DRUGS[0].def, sent = false;

  function evaluate(){
    const d = DRUGS[di];
    if(dose > d.hard)  return ['crit','d.pump.block','d.pump.blockd'];
    if(dose > d.hi)    return ['warn','d.pump.warn','d.pump.warnd'];
    if(dose < d.lo)    return ['warn','d.pump.low','d.pump.lowd'];
    return ['good','d.pump.ok','d.pump.okd'];
  }

  const px = v => { const d=DRUGS[di]; return Math.min(100, Math.max(0,(v/(d.hard*1.12))*100)); };

  /* the shell is drawn once per drug so the number field never rebuilds under the cursor */
  function draw(){
    const d = DRUGS[di];
    root.innerHTML = `
      <div class="row" style="margin-bottom:16px">
        <div class="field" style="flex:2 1 220px"><label for="pd">${esc(t('d.pump.drug'))}</label>
          <select id="pd">${DRUGS.map((x,i)=>`<option value="${i}"${i===di?' selected':''}>${esc(t(x.k))}</option>`).join('')}</select></div>
        <div class="field" style="flex:1 1 130px"><label for="pv">${esc(t('d.pump.dose'))} (${d.u})</label>
          <input id="pv" type="number" step="${d.step}" min="0" value="${dose}"></div>
        <button class="btn" data-send="1">${esc(t('d.pump.check'))}</button>
      </div>
      <div class="ders">
        <div class="ders-bar">
          <span class="ders-zone ok" style="left:${px(d.lo)}%;width:${px(d.hi)-px(d.lo)}%"></span>
          <span class="ders-zone soft" style="left:${px(d.hi)}%;width:${px(d.hard)-px(d.hi)}%"></span>
          <span class="ders-mark" id="pmark" style="left:${px(dose)}%"></span>
        </div>
        <div class="ders-key">
          <span><i class="k-ok"></i>${esc(t('d.pump.range'))} ${d.lo}–${d.hi} ${d.u}</span>
          <span><i class="k-soft"></i>${esc(t('d.pump.soft'))} ${d.hi}</span>
          <span><i class="k-hard"></i>${esc(t('d.pump.hard'))} ${d.hard}</span>
        </div>
      </div>
      <div id="pout"></div>
      <p class="notes">${esc(t('d.pump.disc'))}</p>`;
    refresh();
  }
  function refresh(){
    const m = root.querySelector('#pmark'); if(m) m.style.left = px(dose)+'%';
    const out = root.querySelector('#pout'); if(!out) return;
    if(!sent){ out.innerHTML = ''; return; }
    const r = evaluate();
    out.innerHTML = vd(r[0], t(r[1]), t(r[2]))
      + (r[0]==='good' ? `<div class="readout" style="margin-top:12px">
          <dl><dt>${esc(t('d.pump.nis'))}</dt><dd>${esc(t('d.pump.nisv'))}</dd></dl></div>` : '');
  }

  root.addEventListener('change', e => {
    if(e.target.id==='pd'){ di = +e.target.value; dose = DRUGS[di].def; sent=false; draw(); }
  });
  root.addEventListener('input', e => {
    if(e.target.id==='pv'){ dose = parseFloat(e.target.value)||0; sent=false; refresh(); }
  });
  root.addEventListener('click', e => {
    if(e.target.closest('[data-send]')){
      sent = true; refresh();
      const k = evaluate()[0];
      if(k === 'good') Snd.done(); else if(k === 'warn') Snd.pumpWarn(); else Snd.pumpAlarm();
    }
  });
  draw();
}

/* ══ 03 智慧床墊 ═══════════════════════════════════════════ */
function demoMattress(root){
  let mode = 2;
  const N = 49;                               /* 20:00 → 04:00, every 10 min */
  const label = i => { const m = 20*60 + i*10; return pad2(Math.floor(m/60)%24)+':'+pad2(m%60); };
  const hr = [], rr = [];
  for(let i=0;i<N;i++){
    const w = Math.sin(i*1.7)*1.6;
    if(i < 39){ hr.push(73 + w); rr.push(16 + w*0.3); }
    else { const p = (i-39)/(N-1-39); hr.push(73 + p*46 + w); rr.push(16 + p*12 + w*0.3); }
  }
  const roundIdx = [12, 24, 36, 48];          /* 22:00 00:00 02:00 04:00 */
  const alertIdx = 43;                        /* 03:10 */

  function mini(series, lo, hi, caption, showAlert){
    const avail = (root.clientWidth || 900) - 36;
    const W = Math.max(330, Math.min(1000, Math.round(avail)));
    const narrow = W < 560;
    const H = narrow ? 150 : 160, P = narrow ? 30 : 42;
    const x = i => P + (i/(N-1))*(W-P-14);
    const y = v => H-24 - ((v-lo)/(hi-lo))*(H-50);
    let g='';
    for(let k=0;k<=2;k++){ const v = lo+(hi-lo)*k/2, yy=y(v);
      g += `<line class="ch-grid" x1="${P}" y1="${yy}" x2="${W-14}" y2="${yy}"/>
            <text class="ch-lbl" x="0" y="${yy+4}">${Math.round(v)}</text>`; }
    let path='';
    if(mode===2) path = `<path d="${series.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(v).toFixed(1)).join('')}"
        fill="none" stroke="var(--c-after)" stroke-width="2" stroke-linejoin="round"/>`;
    let dots = roundIdx.map(i=>
      `<circle cx="${x(i)}" cy="${y(series[i])}" r="4.5" fill="var(--sc)" stroke="#fff" stroke-width="2"/>
       <title>${label(i)}</title>`).join('');
    if(mode===1) dots = roundIdx.map(i=>
      `<g><title>${label(i)} · ${Math.round(series[i])}</title>
       <circle cx="${x(i)}" cy="${y(series[i])}" r="5" fill="var(--sc)" stroke="#fff" stroke-width="2"/>
       <text class="ch-lbl" x="${x(i)}" y="${y(series[i])-10}" text-anchor="middle">${Math.round(series[i])}</text></g>`).join('');
    let al='';
    if(mode===2 && showAlert) al = `<g><line x1="${x(alertIdx)}" y1="12" x2="${x(alertIdx)}" y2="${H-24}"
        stroke="var(--st-crit)" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="${x(alertIdx)}" cy="${y(series[alertIdx])}" r="5" fill="var(--st-crit)" stroke="#fff" stroke-width="2"/>
      <text class="ch-val" x="${x(alertIdx)-7}" y="20" text-anchor="end" fill="var(--st-crit)">03:10 ${esc(t('d.mattress.alert'))}</text></g>`;
    const ticks = narrow ? [0,24,48] : [0,12,24,36,48];
    let ax = ticks.map((i,n)=>`<text class="ch-lbl" x="${x(i)}" y="${H-6}" text-anchor="${n===0?'start':n===ticks.length-1?'end':'middle'}">${label(i)}</text>`).join('');
    return `<figure class="panel" style="margin:0 0 12px">
      <figcaption class="panel-cap">${esc(caption)}</figcaption>
      <svg viewBox="0 0 ${W} ${H}">${g}<line class="ch-base" x1="${P}" y1="${H-24}" x2="${W-14}" y2="${H-24}"/>${path}${dots}${al}${ax}</svg>
    </figure>`;
  }

  function draw(){
    root.innerHTML = `
      <div class="seg">
        <button class="segb ${mode===1?'on':''}" data-m="1">${esc(t('d.mattress.mode1'))}</button>
        <button class="segb ${mode===2?'on':''}" data-m="2">${esc(t('d.mattress.mode2'))}</button>
      </div>
      ${mini(hr, 60, 130, t('d.mattress.hr'), true)}
      ${mini(rr, 10, 32, t('d.mattress.rr'), false)}
      ${mode===1 ? vd('warn', t('d.mattress.mode1'), t('d.mattress.cap1'))
                 : vd('good', t('d.mattress.lead'), t('d.mattress.cap2'))}`;
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-m]');
    if(b){ mode = +b.dataset.m; draw(); if(mode === 2) setTimeout(()=>Snd.alert(), 260); }
  });
  onResize(draw);
  draw();
}

/* ══ 04 UDI ════════════════════════════════════════════════ */
function demoUdi(root){
  const BASE = new Date(2026,10,16);
  const PACKS = [
    {k:'d.udi.i1', dept:'ORT', loc:'B3-3', gtin:'04711234500017', ster:-150, life:180, n:23, m:'d.udi.m1'},
    {k:'d.udi.i2', dept:'GS',  loc:'A1-2', gtin:'04711234500024', ster:-175, life:180, n:4,  m:'d.udi.m2'},
    {k:'d.udi.i3', dept:'OBG', loc:'C4-1', gtin:'04711234500031', ster:-20,  life:180, n:31, m:'d.udi.m1'},
    {k:'d.udi.i4', dept:'CVS', loc:'D2-5', gtin:'04711234500048', ster:-200, life:180, n:7,  m:'d.udi.m2'}
  ];
  const USER = {id:'N-B6142', k:'d.udi.badgeU'};
  const PACKER = {id:'P-C2071', k:'d.udi.badgeP'};

  /* stage: pick → scanning → steps → printing → label */
  let pi = -1, step = 0, busy = false, printed = false, off = 0;

  /* GS1 DataMatrix-looking symbol: solid L finder, alternating timing, hashed data */
  function dmx(seed, px){
    let h = 0; for(const c of seed) h = (h*31 + c.charCodeAt(0)) >>> 0;
    const N = 14; let cells = '';
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      h = (h*1103515245 + 12345) >>> 0;
      let on;
      if(x===0 || y===N-1) on = 1;                       /* solid L */
      else if(y===0 || x===N-1) on = (x+y)%2===0 ? 1:0;  /* timing */
      else on = (h>>17)&1;
      if(on) cells += '<rect x="'+x+'" y="'+y+'" width="1" height="1"/>';
    }
    return '<svg class="dmx" style="width:'+px+'px;height:'+px+'px" viewBox="0 0 '+N+' '+N+'" aria-hidden="true">'+cells+'</svg>';
  }

  const ymd = d => String(d.getFullYear()).slice(2)+pad2(d.getMonth()+1)+pad2(d.getDate());

  function read(){
    const p = PACKS[pi];
    const sterD = addDays(BASE, p.ster), expD = addDays(sterD, p.life), today = addDays(BASE, off);
    const left = Math.round((expD - today)/86400000);
    const st = left <= 0 ? ['crit','d.udi.over','d.udi.overd',-left]
             : left <= 30 ? ['warn','d.udi.near','d.udi.neard',left]
             : ['good','d.udi.ok','d.udi.okd',left];
    return {p, sterD, expD, today, left, st};
  }

  /* the GS1 element string the scanner actually returns */
  function gs1(){
    const {p, sterD, expD} = read();
    return [
      ['01', p.gtin,      'd.udi.ai01'],
      ['11', ymd(sterD),  'd.udi.ai11'],
      ['17', ymd(expD),   'd.udi.ai17'],
      ['30', String(p.n), 'd.udi.ai30']
    ];
  }

  function targetHtml(){
    if(step===0) return PACKS.map((p,i)=>
      '<button class="utgt pack" data-t="'+i+'">'
      + '<span class="utgt-n">'+esc(t(p.k))+'</span>'
      + dmx(p.gtin, 54)
      + '<span class="utgt-c code">'+p.gtin+'</span>'
      + '<span class="laser"></span></button>').join('');
    if(step===1) return '<button class="utgt badge" data-t="u">'
      + '<span class="utgt-n">'+esc(t(USER.k))+'</span>'
      + dmx(USER.id, 48)
      + '<span class="utgt-c code">'+USER.id+'</span>'
      + '<span class="laser"></span></button>';
    if(step===2) return '<button class="utgt badge" data-t="p">'
      + '<span class="utgt-n">'+esc(t(PACKER.k))+'</span>'
      + dmx(PACKER.id, 48)
      + '<span class="utgt-c code">'+PACKER.id+'</span>'
      + '<span class="laser"></span></button>';
    return '';
  }

  function stepsHtml(){
    const names = ['d.udi.sc1','d.udi.sc2','d.udi.sc3'];
    return names.map((k,i)=>
      '<li class="'+(i<step?'done':i===step?'now':'')+'">'
      + '<i>'+(i<step?'✓':(i+1))+'</i>'+esc(t(k))+'</li>').join('');
  }

  function decodeHtml(){
    if(step===0 || pi<0) return '<div class="uterm-idle">'+esc(t('d.udi.waiting'))+'</div>';
    return '<div class="uterm-rows">' + gs1().map(r=>
      '<div class="uterm-row"><b>('+r[0]+')</b><span class="code">'+r[1]+'</span><em>'+esc(t(r[2]))+'</em></div>'
    ).join('') + '</div>'
    + (step>=2 ? '<div class="uterm-row extra"><b>USR</b><span class="code">'+USER.id+'</span><em>'+esc(t('d.udi.sc2'))+'</em></div>' : '')
    + (step>=3 ? '<div class="uterm-row extra"><b>PKG</b><span class="code">'+PACKER.id+'</span><em>'+esc(t('d.udi.sc3'))+'</em></div>' : '');
  }

  function labelHtml(){
    const {p, sterD, expD, st} = read();
    return '<div class="ulabel '+st[0]+'" id="ulab">'
      + '<div class="ulabel-h"><b>'+esc(t(p.k))+'</b>'+dmx(p.gtin,58)+'</div>'
      + '<dl>'
      + '<dt>'+esc(t('d.udi.dept'))+'</dt><dd>'+p.dept+'</dd>'
      + '<dt>'+esc(t('d.udi.loc'))+'</dt><dd class="code">'+p.loc+'</dd>'
      + '<dt>'+esc(t('d.udi.method'))+'</dt><dd>'+esc(t(p.m))+'</dd>'
      + '<dt>'+esc(t('d.udi.ster'))+'</dt><dd class="num">'+fmtDate(sterD)+'</dd>'
      + '<dt>'+esc(t('d.udi.exp'))+'</dt><dd class="num">'+fmtDate(expD)+'</dd>'
      + '<dt>'+esc(t('d.udi.cnt'))+'</dt><dd class="num">'+p.n+' '+esc(t('d.udi.pieces'))+'</dd>'
      + '<dt>'+esc(t('d.udi.by'))+'</dt><dd class="code">'+USER.id+' / '+PACKER.id+'</dd>'
      + '</dl>'
      + '<div class="ulabel-code code">'+p.gtin+'</div></div>';
  }

  function draw(){
    const scanning = step<3;
    root.innerHTML =
      '<div class="ubench">'
      + '<div class="ubench-l">'
        + '<div class="sub-h">'+esc(t(scanning?'d.udi.bench':'d.udi.printed'))+'</div>'
        + (scanning
            ? '<div class="uscanner"><span class="usc-head"></span><span class="usc-beam"></span>'
              + '<span class="usc-lbl code">SCANNER</span></div>'
              + '<div class="utargets" id="utg">'+targetHtml()+'</div>'
              + '<p class="notes">'+esc(t(step===0?'d.udi.hint1':'d.udi.hint2'))+'</p>'
            : '<div class="uprinter'+(printed?' out':'')+'">'
              + '<span class="uprn-slot"></span>'
              + '<div class="uprn-paper">'+labelHtml()+'</div></div>'
              + (printed ? '' : '<p class="notes">'+esc(t('d.udi.ready'))+'</p>'))
      + '</div>'
      + '<div class="ubench-r">'
        + '<div class="sub-h">'+esc(t('d.udi.term'))+'</div>'
        + '<div class="uterm" id="uterm">'+decodeHtml()+'</div>'
        + '<ol class="usteps">'+stepsHtml()+'</ol>'
        + (step>=3 && !printed
            ? '<button class="btn" data-print="1">'+esc(t('d.udi.print'))+'</button>' : '')
        + (printed
            ? '<div class="field" style="margin-top:4px"><label for="ut">'+esc(t('d.udi.today'))
              + ' — <span class="num" id="utd">'+fmtDate(read().today)+'</span></label>'
              + '<input id="ut" type="range" min="0" max="220" value="'+off+'"></div>'
              + '<div class="sub-h" style="margin-top:12px">'+esc(t('d.udi.st'))+'</div>'
              + '<div id="uout"></div>'
              + '<button class="btn ghost sm" data-again="1" style="margin-top:12px">'+esc(t('d.udi.again'))+'</button>'
            : '')
      + '</div></div>';
    if(printed) refresh();
  }

  function refresh(){
    const {today, st} = read();
    const d = root.querySelector('#utd'); if(d) d.textContent = fmtDate(today);
    const l = root.querySelector('#ulab'); if(l) l.className = 'ulabel ' + st[0];
    const o = root.querySelector('#uout');
    if(o) o.innerHTML = vd(st[0], t(st[1]), t(st[2], {d:st[3]}));
  }

  /* laser sweep over the chosen symbol, then the code lands in the terminal */
  function runScan(el, after){
    if(busy) return; busy = true;
    const sc = root.querySelector('.uscanner');
    if(sc) sc.classList.add('on');
    el.classList.add('scanning');
    const wait = reduced() ? 120 : 950;
    setTimeout(()=>{
      el.classList.remove('scanning'); el.classList.add('hit');
      beepOk();
      if(sc) sc.classList.remove('on');
      setTimeout(()=>{ busy = false; after(); }, reduced()?60:260);
    }, wait);
  }

  root.addEventListener('click', e => {
    const tg = e.target.closest('[data-t]');
    if(tg && !busy){
      const v = tg.dataset.t;
      if(step===0) pi = +v;
      runScan(tg, ()=>{ step++; if(step===3) beepDone(); draw(); });
      return;
    }
    if(e.target.closest('[data-print]')){
      printed = true; beep(900,70); draw();
      const pr = root.querySelector('.uprinter');
      if(pr && !reduced()){ pr.classList.remove('out'); requestAnimationFrame(()=>pr.classList.add('out')); }
      return;
    }
    if(e.target.closest('[data-again]')){
      pi = -1; step = 0; printed = false; off = 0; draw();
    }
  });
  root.addEventListener('input', e => { if(e.target.id==='ut'){ off = +e.target.value; refresh(); }});
  draw();
}

/* ══ 05 AI Verti ═══════════════════════════════════════════ */
function demoVerti(root){
  const IND  = ['d.verti.i1','d.verti.i2','d.verti.i3','d.verti.i4'];
  const OPTS = [
    {k:'d.verti.o1', s:'d.verti.o1s'},
    {k:'d.verti.o2', s:'d.verti.o2s'},
    {k:'d.verti.o3', s:'d.verti.o3s'}
  ];
  /* turn 1 → turn 2 → summary */
  let turn = 1, phase = 'speak', mood = 'worried', last = null, hist = [];
  let stopType = null, mouthTimer = null;

  const words = k => t(k).split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const hits = (txt, k) => words(k).filter(w => txt.includes(w)).length;

  /* keyword scoring, per language, mirroring what the real system rewards */
  function scoreText(raw){
    const txt = raw.toLowerCase();
    const len = raw.replace(/\s/g,'').length;
    const asks = /[?？]/.test(raw);
    const emp  = hits(txt,'d.verti.kw.emp');
    const pall = hits(txt,'d.verti.kw.pall');
    const open = hits(txt,'d.verti.kw.open');
    const defl = hits(txt,'d.verti.kw.defl');
    const jrg  = hits(txt,'d.verti.kw.jargon');

    let i1 = 18 + Math.min(emp,3)*26 + (asks?10:0);
    let i2 = 22 + Math.min(pall,3)*22 + (len>24?10:0);
    let i3 = 20 + Math.min(pall,2)*20 + Math.min(emp,2)*14;
    let i4 = 46 + (len>=14 && len<=90 ? 22 : 0) + (asks?10:0) - jrg*18;
    if(defl){ i1 -= 24; i3 -= 20; i2 -= 10; }
    if(open) { i1 += 10; i3 += 8; }
    if(len < 6){ i1 -= 20; i2 -= 20; i3 -= 20; i4 -= 10; }
    const ind = [i1,i2,i3,i4].map(v => Math.max(5, Math.min(99, Math.round(v))));
    const score = Math.round(ind.reduce((a,b)=>a+b,0)/4);
    return {ind, score, defl:!!defl, asks, emp};
  }

  function feedbackFor(r){
    if(r.defl)            return 'd.verti.f3';
    if(r.score >= 78)     return 'd.verti.f2';
    if(r.emp && !r.asks)  return 'd.verti.f4';
    return 'd.verti.f1';
  }

  /* ── the virtual human ── */
  function avatar(){
    return `<svg class="vh" viewBox="0 0 150 160" aria-hidden="true">
      <defs>
        <linearGradient id="vhg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f3e2d4"/><stop offset="100%" stop-color="#e6cdb8"/>
        </linearGradient>
        <clipPath id="vhc"><rect x="0" y="0" width="150" height="160" rx="12"/></clipPath>
      </defs>
      <g clip-path="url(#vhc)">
        <rect width="150" height="160" fill="#f6f4f0"/>
        <g class="vh-scan"><rect width="150" height="3" y="0" fill="#A87C00" opacity=".16"/></g>
        <path d="M34 160c0-24 18-36 41-36s41 12 41 36z" fill="#d8dee2"/>
        <path d="M46 150c0-16 12-24 29-24s29 8 29 24z" fill="#eef1f3"/>
        <ellipse cx="75" cy="78" rx="34" ry="40" fill="url(#vhg)"/>
        <path d="M41 70c0-24 15-38 34-38s34 14 34 38c0-6-6-14-13-16-10 6-32 7-44 1-6 3-11 9-11 15z" fill="#4a3a33"/>
        <g class="vh-eyes">
          <ellipse class="vh-eye" cx="62" cy="76" rx="4.6" ry="5.2" fill="#2b2320"/>
          <ellipse class="vh-eye" cx="88" cy="76" rx="4.6" ry="5.2" fill="#2b2320"/>
        </g>
        <path class="vh-brow vh-brow-l" d="M54 64 Q62 60 70 63" stroke="#4a3a33" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path class="vh-brow vh-brow-r" d="M80 63 Q88 60 96 64" stroke="#4a3a33" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <ellipse class="vh-mouth" cx="75" cy="99" rx="8" ry="3" fill="#8a4a44"/>
        <path class="vh-smile" d="M65 97 Q75 105 85 97" stroke="#8a4a44" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path class="vh-frown" d="M65 103 Q75 96 85 103" stroke="#8a4a44" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse class="vh-blush vh-bl" cx="54" cy="88" rx="7" ry="4" fill="#e4a893" opacity=".4"/>
        <ellipse class="vh-blush vh-br" cx="96" cy="88" rx="7" ry="4" fill="#e4a893" opacity=".4"/>
      </g>
    </svg>`;
  }

  function setMood(m){
    mood = m;
    const el = root.querySelector('.vhwrap');
    if(el) el.className = 'vhwrap mood-' + m;
  }

  /* mouth opens and closes while the line is being spoken */
  function mouth(on){
    const m = root.querySelector('.vh-mouth');
    const w = root.querySelector('.vhwrap');
    if(w) w.classList.toggle('speaking', !!on);
    if(!m) return;
    clearInterval(mouthTimer); mouthTimer = null;
    if(!on || reduced()){ m.setAttribute('ry','3'); return; }
    let k = 0;
    mouthTimer = setInterval(()=>{
      k++; m.setAttribute('ry', String(2 + (k%3===0 ? 5.5 : k%2 ? 3.5 : 1.6)));
    }, 110);
  }

  function say(text, after){
    const b = root.querySelector('#vsay');
    if(!b) return;
    const wave = root.querySelector('.vwave');
    if(wave) wave.classList.add('on');
    if(stopType) stopType();
    /* on first load nothing has been clicked yet, so the voice stays quiet
       and the replay button offers it instead */
    Snd.speak(text, {rate:0.92, pitch:1.06});
    stopType = typeInto(b, text, 34,
      live => mouth(live),
      ()=>{ if(wave) wave.classList.remove('on'); if(after) after(); });
  }
  function sayAgain(){
    const txt = lineFor();
    const wave = root.querySelector('.vwave');
    if(wave){ wave.classList.add('on'); setTimeout(()=>wave.classList.remove('on'), 3600); }
    mouth(true); setTimeout(()=>mouth(false), 3400);
    Snd.speak(txt, {rate:0.92, pitch:1.06});
  }

  function lineFor(){
    if(turn === 1) return t('d.verti.say');
    return last && last.score >= 78 ? t('d.verti.say2a') : t('d.verti.say2b');
  }

  function draw(){
    const scored = phase === 'scored' || phase === 'done';
    root.innerHTML = `
      <div class="vstage">
        <div class="vhwrap mood-${mood}">
          ${avatar()}
          <span class="vh-tag">${esc(t('d.verti.vh'))}</span>
        </div>
        <div class="vtalk">
          <div class="vtalk-h"><b>${esc(t('d.verti.who'))}</b>
            <span class="vwave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
            <button class="vhear" data-hear="1" title="${esc(t('d.verti.hear'))}">
              <span class="pa-spk on" aria-hidden="true"><i></i><i></i><i></i></span>
              ${esc(t('d.verti.hear'))}</button>
            <span class="vturn code">${esc(t('d.verti.turn',{n:turn}))}</span></div>
          <p class="vbubble2" id="vsay"></p>
        </div>
      </div>

      ${hist.length ? `<div class="vlog">${hist.map(h=>
        `<div class="vlog-row"><em>${esc(t('d.verti.youSaid'))}</em><span>${esc(h.text)}</span>
         <b class="num">${h.score}</b></div>`).join('')}</div>` : ''}

      <div class="vinput" ${phase==='speak'?'hidden':''}>
        <div class="sub-h">${esc(t('d.verti.typeIt'))}</div>
        <textarea id="vta" rows="2" placeholder="${esc(t('d.verti.ph'))}" ${scored?'disabled':''}></textarea>
        <div class="vchips">
          ${OPTS.map((o,i)=>`<button class="vchip" data-fill="${i}" ${scored?'disabled':''}>${esc(t(o.s))}</button>`).join('')}
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn" data-send="1" ${scored?'disabled':''}>${esc(t('d.verti.send'))}</button>
          <span class="notes" style="margin:0">${esc(t('d.verti.micoff'))}</span>
        </div>
      </div>

      <div id="vthink"></div>
      <div id="vres"></div>
      <p class="notes">${esc(t('d.verti.realnote'))}</p>`;

    if(phase === 'speak'){
      setMood(turn===1 ? 'worried' : (last && last.score>=78 ? 'softening' : 'tense'));
      say(lineFor(), ()=>{
        phase = 'answer';
        const v = root.querySelector('.vinput');
        if(!v) return;
        v.hidden = false;
        /* only pull focus once the visitor is actually here — focusing on
           first load would scroll the whole page down to this section */
        const ta = root.querySelector('#vta');
        if(ta && Snd.gestured) ta.focus();
      });
    } else {
      const b = root.querySelector('#vsay'); if(b) b.textContent = lineFor();
    }
  }

  function showResult(r, text){
    const res = root.querySelector('#vres');
    if(!res) return;
    res.innerHTML = `
      <div class="vresult">
        <div class="vscore"><span class="num" id="vsc">0</span><em>${esc(t('d.verti.score'))}</em></div>
        <div class="vbars"><div class="sub-h">${esc(t('d.verti.ind'))}</div>
          ${IND.map((k,i)=>`<div class="vbar"><span>${esc(t(k))}</span>
            <span class="vtrack"><i data-w="${r.ind[i]}" style="width:0%"></i></span>
            <b class="num" data-n="${r.ind[i]}">0%</b></div>`).join('')}</div>
      </div>
      ${vd(r.score>=78?'good':'warn', t(r.score>=78?'d.verti.good':'d.verti.poor'), t(feedbackFor(r)))}
      <div class="row" style="margin-top:12px">
        ${turn===1 ? `<button class="btn" data-next2="1">${esc(t('d.verti.cont'))}</button>` : ''}
        <button class="btn ghost sm" data-reset="1">${esc(t('d.verti.retry'))}</button>
      </div>`;
    countUp(root.querySelector('#vsc'), r.score, 850);
    requestAnimationFrame(()=>{
      res.querySelectorAll('.vtrack i').forEach(i => i.style.width = i.dataset.w + '%');
      res.querySelectorAll('.vbar b').forEach(b => countUp(b, +b.dataset.n, 900, '%'));
    });
    setMood(r.score>=78 ? 'relieved' : 'tense');
  }

  function submit(){
    const ta = root.querySelector('#vta');
    const text = (ta ? ta.value : '').trim();
    if(!text){ if(ta) ta.focus(); return; }
    const r = scoreText(text);
    last = r; hist.push({text, score:r.score});
    phase = 'scored';
    ta.disabled = true;
    root.querySelectorAll('[data-send],[data-fill]').forEach(b=>b.disabled=true);
    /* the system "listens", then answers — same beat as the real tool */
    const th = root.querySelector('#vthink');
    th.innerHTML = `<div class="vthink"><i></i><i></i><i></i><span>${esc(t('d.verti.analysing'))}</span></div>`;
    setTimeout(()=>{
      th.innerHTML = ''; showResult(r, text);
      r.score >= 78 ? Snd.done() : Snd.pumpWarn();
    }, reduced()?80:1150);
  }

  root.addEventListener('click', e => {
    if(e.target.closest('[data-hear]')){ sayAgain(); return; }
    const f = e.target.closest('[data-fill]');
    if(f){ const ta = root.querySelector('#vta');
      ta.value = t(OPTS[+f.dataset.fill].k); ta.focus(); return; }
    if(e.target.closest('[data-send]')){ submit(); return; }
    if(e.target.closest('[data-next2]')){ turn = 2; phase = 'speak'; draw(); return; }
    if(e.target.closest('[data-reset]')){
      Snd.hush();
      turn = 1; phase = 'speak'; last = null; hist = []; mood = 'worried'; draw();
    }
  });
  root.addEventListener('keydown', e => {
    if(e.target.id==='vta' && (e.metaKey||e.ctrlKey) && e.key==='Enter'){ e.preventDefault(); submit(); }
  });
  draw();
}

/* ══ 06 探視管理 ═══════════════════════════════════════════ */
function demoVisit(root){
  let temp = 36.6, booked = true, sym = {s1:false,s2:false,s3:false,s4:false}, done = false;

  function judge(){
    if(temp >= 37.5) return ['crit','d.visit.fever','d.visit.feverd',{t:temp.toFixed(1)}];
    if(sym.s1 || sym.s2) return ['crit','d.visit.symf','d.visit.symfd',{}];
    if(sym.s4) return ['crit','d.visit.symf','d.visit.symfd',{}];
    if(sym.s3) return ['warn','d.visit.travel','d.visit.traveld',{}];
    return ['good','d.visit.pass','d.visit.passd',{}];
  }

  function draw(){
    const j = judge(), flagged = done && j[0]!=='good';
    root.innerHTML = `
      <div class="row" style="margin-bottom:14px">
        <div class="field" style="flex:0 1 150px"><label for="vt">${esc(t('d.visit.temp'))}</label>
          <input id="vt" type="number" step="0.1" min="34" max="41" value="${temp.toFixed(1)}"></div>
        <div class="field" style="flex:0 1 170px"><label for="vb">${esc(t('d.visit.booked'))}</label>
          <select id="vb"><option value="1"${booked?' selected':''}>${esc(t('d.infect.yes'))}</option>
            <option value="0"${!booked?' selected':''}>${esc(t('d.infect.no'))}</option></select></div>
      </div>
      <div class="sub-h">${esc(t('d.visit.sym'))}</div>
      <div class="chks">${['s1','s2','s3','s4'].map(s=>
        `<label class="chk"><input type="checkbox" data-s="${s}" ${sym[s]?'checked':''}>${esc(t('d.visit.'+s))}</label>`).join('')}
        <p class="notes" style="margin-top:4px">${esc(t('d.visit.none'))}：${['s1','s2','s3','s4'].every(s=>!sym[s])?'✓':'—'}</p></div>
      <button class="btn" data-go="1" style="margin-top:6px">${esc(t('d.visit.submit'))}</button>
      ${done?vd(j[0], t(j[1]), t(j[2], j[3])):''}
      ${done && !booked ? vd('info', t('d.visit.nobook'), t('d.visit.nobookd')) : ''}
      ${done?`<div class="alertbox ${flagged?'on':''}">
        <div class="sub-h">${esc(t('d.visit.alert'))}</div>
        <div class="ab-grid">
          <div class="ab-screen"><em>${esc(t('d.visit.screen'))}</em>
            <span>${flagged?'562 · '+esc(t(j[1])):esc(t('d.visit.quiet'))}</span></div>
          <div class="ab-voice"><em>${esc(t('d.visit.voice'))}</em>
            ${flagged?`<div class="pa"><span class="pa-spk" id="paspk" aria-hidden="true">
                 <i></i><i></i><i></i></span>
               <q class="pa-say">${esc(t('d.visit.voicesay'))}</q></div>
               <button class="btn ghost sm" data-replay="1">${esc(t('d.visit.replay'))}</button>
               <p class="notes" style="margin-top:8px">${esc(t('d.visit.voicemsg'))}</p>`
              :`<span>—</span>`}</div>
        </div></div>`:''}`;
  }
  root.addEventListener('change', e => {
    if(e.target.id==='vt'){ temp = parseFloat(e.target.value)||36.6; done=false; draw(); }
    if(e.target.id==='vb'){ booked = e.target.value==='1'; done=false; draw(); }
    if(e.target.dataset.s){ sym[e.target.dataset.s] = e.target.checked; done=false; draw(); }
  });
  function broadcast(){
    const spk = root.querySelector('#paspk');
    if(spk){ spk.classList.add('on'); setTimeout(()=>spk.classList.remove('on'), 4200); }
    Snd.announce(t('d.visit.voicesay'), 1250);
  }
  root.addEventListener('click', e => {
    if(e.target.closest('[data-replay]')){ broadcast(); return; }
    if(e.target.closest('[data-go]')){
      done = true; draw();
      if(judge()[0] === 'good') Snd.ok(); else broadcast();
    }
  });
  draw();
}

/* ══ 07 消防桌上模擬 ═══════════════════════════════════════ */
const MARKER = `<defs><marker id="fah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
    <path d="M0,0 L6,3 L0,6 Z" fill="var(--st-good)"/></marker></defs>`;
function demoFire(root){
  const ROOMS = [101,102,103,104,105,106,107,108,109,110,111,112];
  let fire = -1, step = 0;
  const RES = [['d.fire.m1','d.fire.carry1'],['d.fire.m2','d.fire.carry2'],['d.fire.m3','d.fire.carry3']];

  /* Wide screens get the real shape: two room rows either side of a corridor.
     A phone gets the same plan stood on end, so rooms stay big enough to tap. */
  function plan(){
    const avail = (root.clientWidth || 900);
    const narrow = avail < 620;
    return narrow ? planTall() : planWide();
  }

  function exitOf(i){ return (root.clientWidth || 900) < 620 ? (Math.floor(i/2) < 3 ? 'A' : 'B')
                                                             : (i % 6 < 3 ? 'A' : 'B'); }

  function roomCell(i, r, x, y, rw, rh, fs){
    const isFire = i === fire, lit = step > 0;
    const fill = isFire ? (lit?'#fcdede':'#fdf0f0') : (lit?'#e9f0fa':'#fff');
    const stroke = isFire ? 'var(--st-crit)' : (lit?'var(--c-before)':'#d2ded7');
    return `<g class="froom" data-r="${i}" tabindex="0" role="button" aria-label="${esc(t('d.fire.room',{n:r}))}">
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="${isFire?2.5:1}"/>
      <text x="${x+rw/2}" y="${y+rh*0.46}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#0b1f17">${r}</text>
      <text x="${x+rw/2}" y="${y+rh*0.76}" text-anchor="middle" font-size="${Math.round(fs*0.58)}" fill="${isFire?'#d32f2f':'#74867c'}">${
        isFire?esc(t('d.fire.evac')):(lit?esc(t('d.fire.shelter')):'')}</text>
      ${isFire?`<text x="${x+rw-16}" y="${y+22}" font-size="${Math.round(fs*0.8)}" text-anchor="middle">🔥</text>`:''}
    </g>`;
  }

  function exitBox(x, y, w, h, id, on, fs){
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${on?'var(--st-good)':'#dbe3dd'}"/>
      <text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="${fs}"
        fill="${on?'#fff':'#42534b'}">${esc(t('d.fire.exit'))} ${id}</text></g>`;
  }

  function planWide(){
    const W=1000, H=360, rw=140, rh=108, gap=8, L=96;
    const rx = c => L + c*(rw+gap);
    let s=`<svg viewBox="0 0 ${W} ${H}" role="img">${MARKER}
      <rect x="0" y="0" width="${W}" height="${H}" fill="#f1f5f2" rx="10"/>
      <rect x="${L}" y="${(H-60)/2}" width="${W-L-26}" height="60" fill="#e6ebe7"/>`;
    ROOMS.forEach((r,i)=>{
      const row = i<6?0:1, col = i%6;
      s += roomCell(i, r, rx(col), row? H-14-rh : 14, rw, rh, 22);
    });
    s+=`<rect x="8" y="${(H-88)/2}" width="78" height="88" rx="7" fill="#0b1f17"/>
        <text x="47" y="${H/2-4}" text-anchor="middle" font-size="12.5" fill="#fff">${esc(t('d.fire.ns'))}</text>
        <text x="47" y="${H/2+15}" text-anchor="middle" font-size="12.5" fill="#8ba79a">NS</text>`;
    ['A','B'].forEach(id=>{
      const on = step>0 && fire>=0 && exitOf(fire) === id;
      s += exitBox(id==='A' ? L : W-26-92, H/2-16, 92, 32, id, on, 12.5);
    });
    if(step>0 && fire>=0){
      const col=fire%6, row=fire<6?0:1;
      const fx = rx(col)+rw/2, fy = row? H-14-rh : 14+rh;
      const ex = (col<3)? L+46 : W-26-46;
      s+=`<path d="M${fx},${fy} L${fx},${H/2} L${ex},${H/2}" fill="none" stroke="var(--st-good)"
             stroke-width="3" stroke-dasharray="7 5" marker-end="url(#fah)"/>`;
    }
    return s+`</svg>`;
  }

  function planTall(){
    const W=360, rw=142, rh=72, gapY=8, cor=56, top=46, bot=46;
    const H = top + 6*(rh+gapY) + bot + 8;
    const colX = c => c===0 ? 6 : W-6-rw;
    const midX = W/2;
    let s=`<svg viewBox="0 0 ${W} ${H}" role="img">${MARKER}
      <rect x="0" y="0" width="${W}" height="${H}" fill="#f1f5f2" rx="10"/>
      <rect x="${midX-cor/2}" y="${top-6}" width="${cor}" height="${6*(rh+gapY)+6}" fill="#e6ebe7"/>`;
    ROOMS.forEach((r,i)=>{
      const col = i%2, row = Math.floor(i/2);
      s += roomCell(i, r, colX(col), top + row*(rh+gapY), rw, rh, 20);
    });
    ['A','B'].forEach(id=>{
      const on = step>0 && fire>=0 && exitOf(fire) === id;
      s += exitBox(midX-52, id==='A' ? 6 : H-38, 104, 32, id, on, 12.5);
    });
    s+=`<rect x="6" y="6" width="86" height="32" rx="6" fill="#0b1f17"/>
        <text x="49" y="26" text-anchor="middle" font-size="12" fill="#fff">${esc(t('d.fire.ns'))}</text>`;
    if(step>0 && fire>=0){
      const col=fire%2, row=Math.floor(fire/2);
      const fx = col===0 ? colX(0)+rw : colX(1);
      const fy = top + row*(rh+gapY) + rh/2;
      const ey = exitOf(fire)==='A' ? 44 : H-40;
      s+=`<path d="M${fx},${fy} L${midX},${fy} L${midX},${ey}" fill="none" stroke="var(--st-good)"
             stroke-width="3" stroke-dasharray="7 5" marker-end="url(#fah)"/>`;
    }
    return s+`</svg>`;
  }

  function steps(){
    if(fire < 0) return [];
    const r = t('d.fire.room', {n: ROOMS[fire]});
    const e = t('d.fire.exit') + ' ' + exitOf(fire);
    return [t('d.fire.k1',{r}), t('d.fire.k2'), t('d.fire.k3',{r}), t('d.fire.k4'),
            t('d.fire.k5'), t('d.fire.k6',{r}), t('d.fire.k7'), t('d.fire.k8',{e})];
  }

  function paText(){
    if(fire < 0) return '';
    return t('d.fire.pa', {r: t('d.fire.room',{n:ROOMS[fire]})});
  }

  function draw(){
    const S = steps();
    root.innerHTML = `
      <div class="fplan">${plan()}</div>
      <div class="row" style="margin-top:12px">
        <button class="btn" data-run="1" ${fire<0?'disabled':''}>${esc(t('d.fire.run'))}</button>
        ${step>0?`<button class="btn ghost sm" data-reset="1">${esc(t('lab.reset'))}</button>`:''}
        <span class="notes" style="margin:0">${fire<0?esc(t('d.fire.setfire')):''}</span>
      </div>
      ${step>0?`
        <div class="pabar${step>=2?' live':''}">
          <span class="pa-spk${step===2?' on':''}" aria-hidden="true"><i></i><i></i><i></i></span>
          <b>${esc(t('d.fire.palabel'))}</b>
          <q>${step>=2?esc(paText()):'—'}</q>
          ${step>=2?`<button class="btn ghost sm" data-pa="1">${esc(t('d.visit.replay'))}</button>`:''}
        </div>
        <ol class="fsteps">${S.slice(0,step).map((x,i)=>
          `<li${i===step-1?' class="cur"':''}><b>${esc(t('d.fire.step',{n:i+1}))}</b>${esc(x)}</li>`).join('')}</ol>
        ${step>=6?`<div class="readout" style="margin-top:12px"><div class="sub-h">${esc(t('d.fire.res'))}</div>
          <dl>${RES.map(x=>`<dt>${esc(t(x[0]))}</dt><dd>${esc(t(x[1]))}</dd>`).join('')}</dl></div>`:''}
        ${step>=S.length?vd('good', t('d.fire.done'), t('d.fire.doned')):''}`:''}
      <p class="notes">${esc(t('d.fire.simple'))}</p>`;
  }

  root.addEventListener('click', e => {
    const g = e.target.closest('.froom');
    if(g){ fire = +g.dataset.r; step = 0; draw(); return; }
    if(e.target.closest('[data-pa]')){ Snd.announce(paText(), 1250); return; }
    if(e.target.closest('[data-run]')){
      const total = steps().length;
      step = 1; draw();
      Snd.fireBell(2.6);
      const iv = setInterval(()=>{
        step++; draw();
        if(step === 2) Snd.announce(paText(), 1250);
        if(step === 4) Snd.seq([[1400,0,0.12,'square',0.05],[1100,0.16,0.12,'square',0.05],[1400,0.32,0.12,'square',0.05]]);
        if(step >= total){ clearInterval(iv); Snd.done(); }
      }, 1700);
      return;
    }
    if(e.target.closest('[data-reset]')){ fire=-1; step=0; Snd.hush(); draw(); }
  });
  onResize(draw);
  draw();
}

/* ══ 08 預班 ═══════════════════════════════════════════════ */
function demoRoster(root){
  const DAYS = 14, CAP = {r1:2, r2:3};
  const SEED = {r1:[0,1,0,2,1,0,0,1,1,0,2,0,1,0], r2:[1,0,2,3,1,1,0,2,0,1,3,1,0,2]};
  let role = 'r1', mine = {r1:[], r2:[]};

  function count(d){ return SEED[role][d] + (mine[role].includes(d)?1:0); }
  function state(d){ const c = count(d), cap = CAP[role];
    return c>=cap ? 'full' : c===cap-1 ? 't2' : 't1'; }

  function draw(){
    const cap = CAP[role];
    root.innerHTML = `
      <div class="row" style="margin-bottom:12px">
        <div class="field" style="flex:0 1 190px"><label for="rr">${esc(t('d.roster.role'))}</label>
          <select id="rr"><option value="r1"${role==='r1'?' selected':''}>${esc(t('d.roster.r1'))} · ${esc(t('d.roster.cap'))} ${CAP.r1}</option>
            <option value="r2"${role==='r2'?' selected':''}>${esc(t('d.roster.r2'))} · ${esc(t('d.roster.cap'))} ${CAP.r2}</option></select></div>
        <button class="btn ghost sm" data-clr="1">${esc(t('d.roster.clear'))}</button>
      </div>
      <div class="tband">${Array.from({length:DAYS},(_,d)=>
        `<span class="tb ${state(d)}" title="${d+1}"></span>`).join('')}</div>
      <div class="rcal">${Array.from({length:DAYS},(_,d)=>{
        const c = count(d), st = state(d), isMine = mine[role].includes(d);
        return `<button class="rday ${st}${isMine?' mine':''}" data-d="${d}">
          <span class="rd-n num">${d+1}</span>
          <span class="rd-c num">${c}/${cap}</span>
          <span class="rd-s">${esc(t(st==='full'?'d.roster.full':st==='t2'?'d.roster.t2':'d.roster.t1'))}</span>
        </button>`; }).join('')}</div>
      <div class="ch-legend" style="margin-top:12px">
        <span><i style="background:var(--st-good)"></i>${esc(t('d.roster.t1'))}</span>
        <span><i style="background:var(--st-warn)"></i>${esc(t('d.roster.t2'))}</span>
        <span><i style="background:var(--st-crit)"></i>${esc(t('d.roster.full'))}</span>
      </div>
      <p class="notes">${esc(t('d.roster.legend'))} · ${esc(t('d.roster.mine'))}: <b class="num">${mine[role].length}</b></p>`;
  }

  root.addEventListener('change', e => { if(e.target.id==='rr'){ role = e.target.value; draw(); }});
  root.addEventListener('click', e => {
    if(e.target.closest('[data-clr]')){ mine[role] = []; draw(); return; }
    const b = e.target.closest('[data-d]'); if(!b) return;
    const d = +b.dataset.d, arr = mine[role], i = arr.indexOf(d);
    if(i>=0){ arr.splice(i,1); Snd.tick(); draw(); return; }
    if(SEED[role][d] >= CAP[role]){
      Snd.buzz(); draw();
      root.insertAdjacentHTML('beforeend', vd('warn', t('d.roster.full'), t('d.roster.fullmsg')));
      return;
    }
    arr.push(d); Snd.ok(); draw();
  });
  draw();
}

/* ══ 09 感染收案五步驟 ═════════════════════════════════════ */
function demoInfect(root){
  const SYM = ['d.infect.y1','d.infect.y2','d.infect.y3','d.infect.y4','d.infect.y5','d.infect.y6','d.infect.y7'];
  let step = 1, site = '', cath = null, picked = [], sent = 'yes';

  const need = () => cath === 'y' ? 1 : 3;
  function dots(){
    const ks = ['d.infect.st1','d.infect.st2','d.infect.st3','d.infect.st4','d.infect.st5'];
    let s = '<div class="stepdots">';
    ks.forEach((k,i)=>{ const n=i+1;
      s += `<i class="${n<step?'done':n===step?'on':''}">${n<step?'✓':n}</i>`;
      if(i<4) s += `<u class="${n<step?'done':''}"></u>`; });
    return s + '</div><div class="steplbls">' + ks.map((k,i)=>
      `<span class="${i+1===step?'on':''}">${esc(t(k))}</span>`).join('') + '</div>';
  }

  function body(){
    if(step===1) return `<div class="sub-h">${esc(t('d.infect.pickres'))}</div>
      <button class="opt" data-res="1" aria-pressed="true">${esc(t('d.infect.res'))} A<small>${esc(t('d.infect.resd'))}</small></button>`;
    if(step===2) return `<div class="sub-h">${esc(t('d.infect.picksite'))}</div>
      <div class="opts">${[1,2,3,4,5].map(i=>
        `<button class="opt" data-site="${i}" aria-pressed="${site==String(i)}">${esc(t('d.infect.site'+i))}</button>`).join('')}</div>`;
    if(step===3){
      if(site!=='2') return `<div class="sub-h">${esc(t('d.infect.symt'))}</div>
        <p class="notes">${esc(t('d.infect.rule'))}</p>`;
      return `<div class="cathq">${esc(t('d.infect.cath'))}</div>
        <div class="opts" style="margin-bottom:14px">
          <button class="opt" data-c="y" aria-pressed="${cath==='y'}">${esc(t('d.infect.cathy'))}</button>
          <button class="opt" data-c="n" aria-pressed="${cath==='n'}">${esc(t('d.infect.cathn'))}</button></div>
        ${cath?`<div class="ruleline">${esc(t(cath==='y'?'d.infect.needy':'d.infect.needn'))}</div>
          <div class="sub-h">${esc(t('d.infect.symt'))}</div>
          <div class="chks">${SYM.map((k,i)=>
            `<label class="chk"><input type="checkbox" data-y="${i}" ${picked.includes(i)?'checked':''}>${esc(t(k))}</label>`).join('')}</div>
          <div class="cnt ${picked.length>=need()?'ok':''}">${esc(t('d.infect.count',{n:picked.length, need:need()}))}</div>
          <p class="notes">${esc(t('d.infect.rule'))}</p>`:''}`;
    }
    if(step===4) return `<div class="row">
        <div class="field" style="flex:0 1 180px"><label for="idt">${esc(t('d.infect.date'))}</label>
          <input id="idt" type="date" value="2026-11-14"></div>
        <div class="field" style="flex:0 1 150px"><label for="isn">${esc(t('d.infect.sent'))}</label>
          <select id="isn"><option value="yes"${sent==='yes'?' selected':''}>${esc(t('d.infect.yes'))}</option>
            <option value="no"${sent==='no'?' selected':''}>${esc(t('d.infect.no'))}</option></select></div></div>`;
    const ok = picked.length >= need();
    return ok
      ? vd('good', t('d.infect.in'), t('d.infect.ind',{c:t(cath==='y'?'d.infect.cathy':'d.infect.cathn'), n:picked.length}))
      : vd('warn', t('d.infect.out'), t('d.infect.outd',{n:picked.length, need:need()}));
  }

  function canNext(){
    if(step===2) return !!site;
    if(step===3) return site==='2' ? !!cath : true;
    return true;
  }

  function draw(){
    root.innerHTML = dots() + `<div class="wiz">${body()}</div>
      <div class="row" style="margin-top:16px">
        ${step>1?`<button class="btn ghost sm" data-prev="1">${esc(t('lab.prev'))}</button>`:''}
        ${step<5?`<button class="btn" data-next="1" ${canNext()?'':'disabled'}>${esc(t('lab.next'))}</button>`:
          `<button class="btn ghost sm" data-restart="1">${esc(t('lab.reset'))}</button>`}
      </div>`;
  }

  root.addEventListener('click', e => {
    const s = e.target.closest('[data-site]'); if(s){ site = s.dataset.site; cath=null; picked=[]; draw(); return; }
    const c = e.target.closest('[data-c]');    if(c){ cath = c.dataset.c; picked=[]; draw(); return; }
    if(e.target.closest('[data-next]')){
      step = Math.min(5, step+1); if(step===3 && site!=='2') step=4; draw();
      if(step === 5){ (picked.length >= need()) ? Snd.done() : Snd.pumpWarn(); } else Snd.tick();
      return;
    }
    if(e.target.closest('[data-prev]')){ step = Math.max(1, step-1); if(step===3 && site!=='2') step=2; draw(); return; }
    if(e.target.closest('[data-restart]')){ step=1; site=''; cath=null; picked=[]; draw(); }
  });
  root.addEventListener('change', e => {
    if(e.target.dataset.y !== undefined){
      const i = +e.target.dataset.y, k = picked.indexOf(i);
      if(e.target.checked && k<0) picked.push(i); else if(!e.target.checked && k>=0) picked.splice(k,1);
      draw(); return;
    }
    if(e.target.id==='isn') sent = e.target.value;
  });
  draw();
}

/* ══ 10 智慧庫存 ═══════════════════════════════════════════ */
function demoStock(root){
  const BASE = new Date(2026,10,16);
  const ITEMS = [
    {k:'d.stock.i1', lot:'PF07-8',  exp:  42, qty:10, safe:30, u:'d.stock.box'},
    {k:'d.stock.i2', lot:'PF07-5',  exp:  18, qty:29, safe:30, u:'d.stock.box'},
    {k:'d.stock.i3', lot:'26008095',exp: 120, qty: 8, safe: 6, u:'d.stock.pc'},
    {k:'d.stock.i4', lot:'G4-2201', exp: 260, qty:54, safe:20, u:'d.stock.box'},
    {k:'d.stock.i5', lot:'AW-7731', exp:   6, qty:12, safe:10, u:'d.stock.box'},
    {k:'d.stock.i6', lot:'NG14-03', exp: 310, qty:22, safe:10, u:'d.stock.pc'},
    {k:'d.stock.i7', lot:'SM-5512', exp:  95, qty: 4, safe:15, u:'d.stock.box'},
    {k:'d.stock.i8', lot:'US-0098', exp:  -4, qty: 9, safe: 8, u:'d.stock.pc'}
  ];
  let off = 0, counts = {}, open = -1;

  const left = it => it.exp - off;
  function stat(it){
    const l = left(it);
    if(l <= 0) return 'over';
    if(l <= 30) return 'near';
    return (counts[it.k] !== undefined ? counts[it.k] : it.qty) < it.safe ? 'low' : 'ok';
  }

  /* the range input is built once; only the body below it re-renders */
  function draw(){
    root.innerHTML = `
      <div class="field" style="max-width:320px"><label for="st">${esc(t('d.stock.today'))} — <span class="num" id="std">${fmtDate(addDays(BASE,off))}</span></label>
        <input id="st" type="range" min="0" max="300" value="${off}"></div>
      <div id="sbody"></div>`;
    refresh();
  }

  function refresh(){
    const po = ITEMS.filter(it => { const s = stat(it); return s==='low' || s==='over'; });
    const done = Object.keys(counts).length;
    root.querySelector('#std').textContent = fmtDate(addDays(BASE, off));
    root.querySelector('#sbody').innerHTML = `
      <div class="scount">${esc(t('d.stock.scanned',{n:done, t:ITEMS.length}))}</div>
      <div class="shelf">${ITEMS.map((it,i)=>{
        const s = stat(it), l = left(it), cur = counts[it.k];
        return `<button class="scell ${s}${open===i?' open':''}" data-i="${i}">
          <span class="sc-top"><b>${esc(t(it.k))}</b><em class="sc-st">${esc(t('d.stock.'+s))}</em></span>
          <span class="sc-meta code">${it.lot} · ${fmtDate(addDays(BASE,it.exp))}</span>
          <span class="sc-q"><span class="num">${cur!==undefined?cur:it.qty}</span>
            <i>${esc(t(it.u))} · ${esc(t('d.stock.safe'))} ${it.safe}</i></span>
          <span class="sc-days num">${l>0?`${l} ${esc(t('d.udi.days'))}`:'—'}</span>
        </button>`;}).join('')}</div>
      ${open>=0?(()=>{ const it=ITEMS[open], cur=counts[it.k];
        return `<div class="readout" style="margin-top:14px">
          <div class="sub-h">${esc(t('d.stock.docount'))} — ${esc(t(it.k))}</div>
          <div class="row">
            <div class="field" style="flex:0 1 160px"><label for="sq">${esc(t('d.stock.enter'))}</label>
              <input id="sq" type="number" min="0" value="${cur!==undefined?cur:it.qty}"></div>
            <button class="btn sm" data-save="${open}">${esc(t('d.stock.save'))}</button>
          </div>
          ${cur!==undefined?`<dl style="margin-top:10px">
            <dt>${esc(t('d.stock.qty'))}</dt><dd>${it.qty}</dd>
            <dt>${esc(t('d.stock.count'))}</dt><dd>${cur}</dd>
            <dt>${esc(t('d.stock.diff'))}</dt><dd class="${cur-it.qty?'diff':''}">${cur-it.qty>0?'+':''}${cur-it.qty}</dd></dl>`:''}
        </div>`;})():''}
      <div class="sub-h" style="margin-top:18px">${esc(t('d.stock.po'))}</div>
      ${po.length?`<ul class="polist">${po.map(it=>{
        const cur = counts[it.k]!==undefined?counts[it.k]:it.qty;
        const n = stat(it)==='over' ? it.safe : Math.max(0, it.safe-cur);
        return `<li><span>${esc(t(it.k))}</span><em class="sc-st ${stat(it)}">${esc(t('d.stock.'+stat(it)))}</em>
          <b class="num">+${n} ${esc(t(it.u))}</b></li>`;}).join('')}</ul>
        <p class="notes">${esc(t('d.stock.pod'))}</p>`
        :`<p class="notes">${esc(t('d.stock.none'))}</p>`}`;
  }

  root.addEventListener('input', e => { if(e.target.id==='st'){ off = +e.target.value; refresh(); }});
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-i]'); if(c){ const i=+c.dataset.i; open = (open===i?-1:i); refresh(); return; }
    const sv = e.target.closest('[data-save]');
    if(sv){ const it = ITEMS[+sv.dataset.save]; const v = root.querySelector('#sq');
      counts[it.k] = Math.max(0, parseInt(v.value,10)||0); refresh();
      stat(it) === 'over' ? Snd.fail() : Snd.ok(); }
  });
  draw();
}
