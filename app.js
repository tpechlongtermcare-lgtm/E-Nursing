/* ══════════════════════════════════════════════════════════
   app.js — render, translate, chart
   ══════════════════════════════════════════════════════════ */

let LANG = 'zh';

function t(key, vars){
  const dict = I18N[LANG] || {};
  let s = dict[key];
  if (s === undefined) s = (I18N.zh[key] !== undefined ? I18N.zh[key] : key);
  if (vars) for (const k in vars) s = s.split('{'+k+'}').join(vars[k]);
  return s;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el = (sel, root) => (root||document).querySelector(sel);
const els = (sel, root) => Array.from((root||document).querySelectorAll(sel));

/* ── flags ────────────────────────────────────────────────── */
function starPath(cx, cy, r){
  let p = '';
  for (let i=0;i<5;i++){
    const ao = -Math.PI/2 + i*2*Math.PI/5;
    const ai = ao + Math.PI/5;
    p += (i?'L':'M') + (cx+r*Math.cos(ao)).toFixed(2) + ',' + (cy+r*Math.sin(ao)).toFixed(2);
    p += 'L' + (cx+r*0.382*Math.cos(ai)).toFixed(2) + ',' + (cy+r*0.382*Math.sin(ai)).toFixed(2);
  }
  return p + 'Z';
}
function sunRays(cx, cy, rOut, rIn, n){
  let p = '';
  for (let i=0;i<n;i++){
    const a = i*2*Math.PI/n, w = Math.PI/n*0.52;
    p += 'M' + (cx+rOut*Math.cos(a)).toFixed(2) + ',' + (cy+rOut*Math.sin(a)).toFixed(2);
    p += 'L' + (cx+rIn*Math.cos(a-w)).toFixed(2) + ',' + (cy+rIn*Math.sin(a-w)).toFixed(2);
    p += 'L' + (cx+rIn*Math.cos(a+w)).toFixed(2) + ',' + (cy+rIn*Math.sin(a+w)).toFixed(2) + 'Z';
  }
  return p;
}
const FLAGS = {
  tw: `<svg viewBox="0 0 60 40" role="img"><rect width="60" height="40" fill="#FE0000"/>
    <rect width="30" height="20" fill="#000095"/>
    <path d="${sunRays(15,10,8,4.4,12)}" fill="#fff"/><circle cx="15" cy="10" r="4.4" fill="#000095"/>
    <circle cx="15" cy="10" r="3.6" fill="#fff"/></svg>`,
  gb: `<svg viewBox="0 0 60 40" role="img"><rect width="60" height="40" fill="#012169"/>
    <path d="M0,0 60,40 M60,0 0,40" stroke="#fff" stroke-width="9"/>
    <path d="M0,0 60,40 M60,0 0,40" stroke="#C8102E" stroke-width="4.5"/>
    <path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="13"/>
    <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" stroke-width="7.5"/></svg>`,
  jp: `<svg viewBox="0 0 60 40" role="img"><rect width="60" height="40" fill="#fff"/>
    <circle cx="30" cy="20" r="12" fill="#BC002D"/></svg>`,
  vn: `<svg viewBox="0 0 60 40" role="img"><rect width="60" height="40" fill="#DA251D"/>
    <path d="${starPath(30,20,11)}" fill="#FF0"/></svg>`,
  kr: `<svg viewBox="0 0 60 40" role="img"><rect width="60" height="40" fill="#fff"/>
    <g transform="rotate(-33.69 30 20)">
      <path d="M22,20 A8,8 0 0,1 38,20 A4,4 0 0,1 30,20 A4,4 0 0,0 22,20 Z" fill="#CD2E3A"/>
      <path d="M22,20 A8,8 0 0,0 38,20 A4,4 0 0,1 30,20 A4,4 0 0,0 22,20 Z" fill="#0047A0"/>
    </g>
    <g fill="#000" transform="translate(30 20)">
      <g transform="rotate(-56.31) translate(0 -15.5)">
        <rect x="-4.5" y="-2.6" width="9" height="1.5"/><rect x="-4.5" y="-.75" width="9" height="1.5"/><rect x="-4.5" y="1.1" width="9" height="1.5"/></g>
      <g transform="rotate(56.31) translate(0 -15.5)">
        <rect x="-4.5" y="-2.6" width="9" height="1.5"/>
        <rect x="-4.5" y="-.75" width="3.8" height="1.5"/><rect x=".7" y="-.75" width="3.8" height="1.5"/>
        <rect x="-4.5" y="1.1" width="9" height="1.5"/></g>
      <g transform="rotate(123.69) translate(0 -15.5)">
        <rect x="-4.5" y="-2.6" width="3.8" height="1.5"/><rect x=".7" y="-2.6" width="3.8" height="1.5"/>
        <rect x="-4.5" y="-.75" width="9" height="1.5"/>
        <rect x="-4.5" y="1.1" width="3.8" height="1.5"/><rect x=".7" y="1.1" width="3.8" height="1.5"/></g>
      <g transform="rotate(-123.69) translate(0 -15.5)">
        <rect x="-4.5" y="-2.6" width="3.8" height="1.5"/><rect x=".7" y="-2.6" width="3.8" height="1.5"/>
        <rect x="-4.5" y="-.75" width="3.8" height="1.5"/><rect x=".7" y="-.75" width="3.8" height="1.5"/>
        <rect x="-4.5" y="1.1" width="3.8" height="1.5"/><rect x=".7" y="1.1" width="3.8" height="1.5"/></g>
    </g></svg>`
};

/* ── charts (plain HTML bars: type stays at its intended size) ── */
function bline(pct, cls, val, title){
  return `<div class="bline" title="${esc(title)}">
    <span class="btrack"><i class="bbar ${cls}" style="width:${Math.max(pct,0.6).toFixed(2)}%"></i></span>
    <b class="bval num">${esc(val)}</b></div>`;
}
const fmtN = v => (v % 1 ? String(v) : String(v));

/* paired before/after bars; the label sits above its pair, so any language fits */
function chartBA(cfg){
  const rows = cfg.rows, maxv = Math.max(...rows.flatMap(r=>[r.before,r.after])) || 1;
  const u = cfg.unit ? ' '+cfg.unit : '';
  const la = t(cfg.legendK ? cfg.legendK[0] : 'lab.before');
  const lb = t(cfg.legendK ? cfg.legendK[1] : 'lab.after');
  const body = rows.map(r => `<div class="brow"><div class="blab">${esc(t(r.k))}</div>
      ${bline(r.before/maxv*100, 'before', fmtN(r.before)+u, la+' · '+t(r.k)+' · '+fmtN(r.before)+u)}
      ${bline(r.after /maxv*100, 'after',  fmtN(r.after)+u,  lb+' · '+t(r.k)+' · '+fmtN(r.after)+u)}
    </div>`).join('');
  return legend([['var(--c-before)', la], ['var(--c-after)', lb]]) + `<div class="bchart">${body}</div>`;
}

/* three ordered periods */
function chartGrp3(cfg){
  const rows = cfg.rows, maxv = Math.max(1, ...rows.flatMap(r=>r.v));
  const cls = ['o1','o2','o3'];
  const body = rows.map(r => `<div class="brow"><div class="blab">${esc(t(r.k))}</div>
      ${r.v.map((v,j)=>bline(v/maxv*100, cls[j], String(v), cfg.cols[j]+' · '+t(r.k)+' · '+v)).join('')}
    </div>`).join('');
  return legend(cfg.cols.map((c,j)=>['var(--c-o'+(j+1)+')', c]))
    + `<div class="bchart">${body}</div>`;
}

/* single series, cross-system — no legend, the title names it */
function chartPct(rows, unit){
  const maxv = Math.max(...rows.map(r=>r.pct)) || 1;
  return `<div class="bchart tight">` + rows.map(r =>
    `<div class="brow"><div class="blab">${esc(t(r.k))}</div>
     ${bline(r.pct/maxv*100, 'after', r.pct+unit, t(r.k)+' · '+r.pct+unit)}</div>`).join('') + `</div>`;
}

function legend(pairs){
  return `<div class="ch-legend">` + pairs.map(p =>
    `<span><i style="background:${p[0]}"></i>${esc(p[1])}</span>`).join('') + `</div>`;
}

/* chart + its data table (the relief rule: every value is also readable as text) */
function chartBlock(id, inner, tableRows, heads){
  const tid = 'tb_'+id;
  let tb = `<table class="dtable" id="${tid}" hidden><thead><tr>`
    + heads.map((h,i)=>`<th>${esc(h)}</th>`).join('') + `</tr></thead><tbody>`
    + tableRows.map(r=>`<tr>`+r.map(c=>`<td>${esc(c)}</td>`).join('')+`</tr>`).join('')
    + `</tbody></table>`;
  return inner
    + `<button class="tablink" data-tbl="${tid}">${esc(t('lab.table'))}</button>`
    + tb;
}

/* ── architecture diagram (hover a system, or click an outcome) ──── */
const ARCH_DOMS = [
  {key:'ward',     go:'sys-ward',     name:'ward.name',     c:'var(--g-acute)'},
  {key:'pump',     go:'sys-pump',     name:'pump.name',     c:'var(--g-acute)'},
  {key:'mattress', go:'sys-mattress', name:'mattress.name', c:'var(--g-acute)'},
  {key:'udi',      go:'sys-udi',      name:'udi.name',      c:'var(--g-or)'},
  {key:'verti',    go:'sys-verti',    name:'verti.name',    c:'var(--g-edu)'},
  {key:'ltcg',     go:'sys-visit',    name:'grp.ltc',       c:'var(--g-ltc)'}
];
/* which systems actually moved each outcome */
const OUTCOMES = {
  o1: {doms:['pump','mattress','udi','ltcg'], sys:['pump','mattress','udi','visit','fire','infect']},
  o2: {doms:['ward','mattress','verti','ltcg'], sys:['ward','mattress','verti','visit','infect']},
  o3: {doms:['ward','pump','udi','ltcg'], sys:['ward','pump','udi','roster','stock']}
};

function archSvg(){
  const W=1000, H=430;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('arch.title'))}">
   <defs><marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
     <path d="M0,0 L7,3.5 L0,7 Z" fill="#94a79c"/></marker></defs>`;

  const ph=[['arch.structure','arch.sdesc'],['arch.process','arch.pdesc'],['arch.result','arch.rdesc']];
  ph.forEach((p,i)=>{
    const x=i*334+2, w=326;
    s+=`<rect x="${x}" y="0" width="${w}" height="40" rx="7" fill="#e6ebe7"/>
        <text x="${x+16}" y="19" font-size="14" font-weight="600" fill="#0b1f17">${esc(t(p[0]))}</text>
        <text x="${x+16}" y="33" font-size="11.5" fill="#74867c">${esc(t(p[1]))}</text>`;
    if(i<2) s+=`<path d="M${x+w+2},20 L${x+w+28},20" stroke="#94a79c" stroke-width="1.5" marker-end="url(#ah)"/>`;
  });

  ARCH_DOMS.forEach((d,i)=>{
    const x=i*166+2, w=158, y=70;
    s+=`<g class="archdom" data-key="${d.key}" data-jump="${d.go}" tabindex="0" role="button"
           aria-label="${esc(t(d.name))}">
        <rect x="${x}" y="${y}" width="${w}" height="54" rx="7" fill="#fff" stroke="#d2ded7"/>
        <rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="${d.c}"/>
        <foreignObject x="${x+10}" y="${y+10}" width="${w-20}" height="42">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font:600 12.5px/1.25 var(--sans);color:#0b1f17">${esc(t(d.name))}</div>
        </foreignObject></g>
        <path class="archlink" data-key="${d.key}" d="M${x+w/2},${y+56} L${x+w/2},${y+86}"
              stroke="#94a79c" stroke-width="1.3" marker-end="url(#ah)"/>`;
  });

  s+=`<rect x="110" y="166" width="780" height="70" rx="10" fill="#0b1f17"/>
      <text x="500" y="196" text-anchor="middle" font-size="15.5" font-weight="600" fill="#fff">${esc(t('arch.core'))}</text>
      <text x="500" y="216" text-anchor="middle" font-size="11.5" fill="#9fb2a8">${esc(t('arch.coresub'))}</text>`;

  const outs=[['o1','arch.o1','arch.o1d'],['o2','arch.o2','arch.o2d'],['o3','arch.o3','arch.o3d']];
  outs.forEach((o,i)=>{
    const x=110+i*266, w=248, y=288;
    s+=`<path d="M${x+w/2},248 L${x+w/2},${y-2}" stroke="#94a79c" stroke-width="1.3" marker-end="url(#ah)"/>
        <g class="archout" data-out="${o[0]}" tabindex="0" role="button" aria-pressed="false"
           aria-label="${esc(t(o[1]))}">
        <rect x="${x}" y="${y}" width="${w}" height="76" rx="8" fill="#fff" stroke="#d2ded7"/>
        <text x="${x+16}" y="${y+26}" font-size="14" font-weight="600" fill="#0b1f17">${esc(t(o[1]))}</text>
        <foreignObject x="${x+16}" y="${y+34}" width="${w-32}" height="40">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font:400 11.5px/1.4 var(--sans);color:#42534b">${esc(t(o[2]))}</div>
        </foreignObject></g>`;
  });
  return s+`</svg>`;
}

/* ── chapter navigation: left rail on wide screens, pill on narrow ─── */
let NAV = { items: [], active: -1, io: null };

function buildNav(){
  NAV.items = SYSTEMS.map(s => ({ id:'sys-'+s.id, idx:s.idx, name:t(s.id+'.name'), color:s.color }));

  let rail = el('#railnav');
  if(!rail){
    rail = document.createElement('nav');
    rail.className = 'railnav'; rail.id = 'railnav';
    document.body.appendChild(rail);
  }
  rail.setAttribute('aria-label', t('nav.sections'));
  rail.innerHTML =
    `<button class="rail-end" data-jump="top" title="${esc(t('nav.top'))}"><i></i></button>`
    + NAV.items.map((n,i)=>
      `<button class="rail-i" data-jump="${n.id}" data-i="${i}" style="--rc:${n.color}">
         <i></i><span><b>${n.idx}</b>${esc(n.name)}</span></button>`).join('')
    + `<button class="rail-end" data-jump="close" title="${esc(t('nav.compare'))}"><i></i></button>`;

  let pill = el('#pillnav');
  if(!pill){
    pill = document.createElement('div');
    pill.className = 'pillnav'; pill.id = 'pillnav';
    document.body.appendChild(pill);
  }
  pill.innerHTML =
    `<div class="pill-sheet" id="pillSheet" hidden>
       <button class="psheet-i" data-jump="top">${esc(t('nav.top'))}</button>
       ${NAV.items.map(n=>`<button class="psheet-i" data-jump="${n.id}">
          <i style="background:${n.color}"></i><b>${n.idx}</b>${esc(n.name)}</button>`).join('')}
       <button class="psheet-i" data-jump="close">${esc(t('nav.compare'))}</button>
     </div>
     <div class="pill-bar">
       <button class="pill-b" data-step="-1" aria-label="${esc(t('nav.prev'))}">‹</button>
       <button class="pill-mid" id="pillMid" aria-expanded="false"><b class="num">—</b><span></span></button>
       <button class="pill-b" data-step="1" aria-label="${esc(t('nav.next'))}">›</button>
     </div>`;

  setActive(NAV.active >= 0 ? NAV.active : -1);
  observeSections();
}

function setActive(i){
  NAV.active = i;
  els('.rail-i').forEach((b,k)=> b.classList.toggle('on', k === i));
  const mid = el('#pillMid');
  if(mid){
    const n = NAV.items[i];
    mid.querySelector('b').textContent = n ? `${n.idx}/10` : '—';
    mid.querySelector('span').textContent = n ? n.name : t('nav.sections');
  }
  const shown = i >= 0;
  const r = el('#railnav'), p = el('#pillnav');
  if(r) r.classList.toggle('show', shown);
  if(p) p.classList.toggle('show', shown);
}

/* Which section owns the viewport is decided by measurement, not by the
   order IntersectionObserver happens to hand back overlapping entries. */
function pickActive(){
  const mark = window.innerHeight * 0.38;
  let best = -1;
  for(let i = 0; i < NAV.items.length; i++){
    const node = el('#' + NAV.items[i].id);
    if(!node) continue;
    const r = node.getBoundingClientRect();
    if(r.top <= mark && r.bottom > mark){ best = i; break; }
    if(r.top > mark) break;
    best = i;                       /* past this one, keep it until the next starts */
  }
  const first = el('#' + NAV.items[0].id);
  if(first && first.getBoundingClientRect().top > mark) best = -1;
  const close = el('.close');
  if(close && close.getBoundingClientRect().top <= mark) best = NAV.items.length - 1;
  if(best !== NAV.active) setActive(best);
}

let navTick = false, lastY = 0, pillIdle = null;
function onNavScroll(){
  if(navTick) return;
  navTick = true;
  requestAnimationFrame(()=>{
    navTick = false;
    pickActive();
    sweepCounters();
    const y = window.scrollY, p = el('#pillnav');
    if(p){
      const sheetOpen = el('#pillSheet') && !el('#pillSheet').hidden;
      const down = y > lastY + 6;
      /* out of the way during a downward swipe, back as soon as you stop */
      if(!sheetOpen && down && y > 220) p.classList.add('tuck');
      if(!sheetOpen && y <= 220) p.classList.remove('tuck');
      clearTimeout(pillIdle);
      pillIdle = setTimeout(()=>{ p.classList.remove('tuck'); }, 700);
    }
    if(Math.abs(y - lastY) > 6) lastY = y;
  });
}

function observeSections(){
  window.removeEventListener('scroll', onNavScroll);
  window.addEventListener('scroll', onNavScroll, {passive:true});
  window.removeEventListener('resize', onNavScroll);
  window.addEventListener('resize', onNavScroll, {passive:true});
  pickActive();
}

function jumpTo(target){
  if(target === 'top'){ window.scrollTo({top:0, behavior:'smooth'}); setActive(-1); return; }
  const node = target === 'close' ? el('.close') : el('#'+target);
  if(!node) return;
  node.scrollIntoView({behavior:'smooth', block:'start'});
  if(target.startsWith('sys-')){
    try{ history.replaceState(null, '', '#'+target); }catch(e){}
  }
}

/* ── count the key numbers up, once, as they come into view ──────
   A scroll sweep rather than IntersectionObserver: jumping straight past
   an element produces no intersection change, which would leave it
   showing 0 — a wrong number is worse than no animation. */
let CNT_PENDING = [];
function parseNum(txt){
  const clean = String(txt).replace(/,/g,'');
  return /^-?\d+(\.\d+)?$/.test(clean) ? parseFloat(clean) : null;
}
function runCounter(node){
  const raw = node.dataset.n, v = parseNum(raw);
  if(v === null){ return; }
  if(v === 0 || matchMedia('(prefers-reduced-motion: reduce)').matches){ node.textContent = raw; return; }
  const dec = (raw.split('.')[1] || '').length;
  const grp = raw.indexOf(',') >= 0;
  const t0 = performance.now(), dur = 900;
  (function step(now){
    const p = Math.min(1, (now - t0)/dur), k = 1 - Math.pow(1-p, 3);
    let s = (v*k).toFixed(dec);
    if(grp) s = Number(s).toLocaleString('en-US', {minimumFractionDigits:dec, maximumFractionDigits:dec});
    node.textContent = s;
    if(p < 1) requestAnimationFrame(step); else node.textContent = raw;
  })(t0);
}
function sweepCounters(){
  if(!CNT_PENDING.length) return;
  const line = window.innerHeight * 0.92;
  CNT_PENDING = CNT_PENDING.filter(node => {
    if(!node.isConnected) return false;
    if(node.getBoundingClientRect().top > line) return true;
    runCounter(node);
    return false;
  });
}
function setupCounters(){
  CNT_PENDING = [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  els('[data-n]').forEach(n => {
    if(parseNum(n.dataset.n) === null) return;
    if(reduce){ n.textContent = n.dataset.n; return; }
    n.textContent = /\./.test(n.dataset.n) ? '0.0' : '0';
    CNT_PENDING.push(n);
  });
  sweepCounters();
}

/* ── render ───────────────────────────────────────────────── */
function renderLangs(){
  el('#langs').innerHTML = LANGS.map(l => {
    const ready = !!I18N[l.id];
    return `<button class="lang-b${ready?'':' pending'}" data-l="${l.id}" ${ready?'':'disabled'}
       aria-current="${l.id===LANG}" title="${esc(l.label)}${ready?'':' — 準備中 / coming up'}" lang="${l.code}">
       ${FLAGS[l.flag]}<span>${esc(l.label)}</span></button>`; }).join('');
  el('.topbar-rail').innerHTML = ['var(--brand)','var(--brand-red)','var(--brand-blue)','var(--brand-yellow)']
    .map(c=>`<span style="background:${c}"></span>`).join('');
}

function renderHero(){
  el('#heroStats').innerHTML = HERO_STATS.map(h =>
    `<div class="hstat"><div class="hstat-v num"><span data-n="${h.v}">${h.v}</span>${h.u?`<small>${h.u}</small>`:''}</div>
     <div class="hstat-l">${esc(t(h.k))}</div></div>`).join('');

  el('#groupKey').innerHTML = [['acute','grp.hospital'],['or','grp.or'],['edu','grp.edu'],['ltc','grp.ltc']]
    .map(g=>`<span><i style="background:var(--g-${g[0]})"></i>${esc(t(g[1]))}</span>`).join('');

  el('#board').innerHTML = SYSTEMS.map(s => {
    const m = s.stats[s.head || 0];
    return `<button class="tile" style="--tc:${s.color}" data-jump="sys-${s.id}">
      <span class="tile-n">${s.idx}</span>
      <span class="tile-t">${esc(t(s.id+'.name'))}</span>
      <span class="tile-m">
        <span class="tile-mv">${m.v}${m.u?`<small style="font-size:.6em"> ${m.u}</small>`:''}</span>
        <span class="tile-ml">${esc(t(m.k))}</span>
      </span></button>`;
  }).join('');
}

function listOf(sys, kind, n){
  let o='';
  for(let i=1;i<=n;i++) o += `<li>${esc(t(sys.id+'.'+kind+i))}</li>`;
  return o;
}

function renderSystems(){
  el('#systems').innerHTML = SYSTEMS.map(s => {
    const shots = s.shots.length ? `
      <details class="fold fold-shots">
        <summary><span>${esc(t('lab.shots'))}</span><em>${s.shots.length} ${esc(t('fold.pics'))}</em></summary>
        <div class="shots">${s.shots.map(sh=>`
          <figure class="shot"><img src="${sh.src}" alt="${esc(t(sh.k))}" loading="lazy" data-cap="${esc(t(sh.k))}">
            <figcaption>${esc(t(sh.k))}</figcaption></figure>`).join('')}</div>
      </details>` : '';

    const stats = `<div class="stats">${s.stats.map(m=>{
      const d = m.from ? `<div class="stat-d ${m.dir==='down'?'d-down':m.dir==='up'?'d-up':'d-flat'}">
          ${esc(m.from)} → ${esc(m.v)}${m.u?' '+esc(m.u):''}${m.pct!==undefined?`　${m.pct>0?'+':''}${m.pct}%`:''}</div>`
        : (m.note?`<div class="stat-d d-flat">${esc(m.note)}</div>`:'');
      const cv = /^[\d.,]+$/.test(m.v) && !m.small ? ` data-n="${esc(m.v)}"` : '';
      return `<div class="stat">
        <div class="stat-v num${m.small?' code':''}" ${m.small?'style="font-size:17px"':''}><span${cv}>${esc(m.v)}</span>${m.u&&!m.small?`<small>${esc(m.u)}</small>`:''}${m.small&&m.u?` <small>${esc(m.u)}</small>`:''}</div>
        <div class="stat-l">${esc(t(m.k))}</div>${d}</div>`;
    }).join('')}</div>`;

    let charts = '';
    [s.chart, s.chart2].forEach((c,ci)=>{
      if(!c) return;
      const id = s.id+'_'+ci;
      let inner, rows, heads;
      if(c.type==='ba'){
        inner = chartBA(c);
        heads = [t('lab.item'), t(c.legendK?c.legendK[0]:'lab.before'), t(c.legendK?c.legendK[1]:'lab.after')];
        rows = c.rows.map(r=>[t(r.k), r.before+(c.unit||''), r.after+(c.unit||'')]);
      } else {
        inner = chartGrp3(c);
        heads = [t('lab.item'), ...c.cols];
        rows = c.rows.map(r=>[t(r.k), ...r.v]);
      }
      charts += `<figure class="panel panel-chart">
        <figcaption class="panel-cap">${esc(t(c.k))}</figcaption>
        ${chartBlock(id, inner, rows, heads)}</figure>`;
    });

    const note = I18N[LANG] && (I18N[LANG][s.id+'.note']||I18N.zh[s.id+'.note'])
      ? `<p class="notes">${esc(t(s.id+'.note'))}</p>` : '';

    return `<section class="sys" id="sys-${s.id}" style="--sc:${s.color}">
      <div class="wrap">
        <div class="sys-head">
          <div class="sys-rail"></div>
          <div class="sys-ident">
            <div class="sys-grp"><span class="dot"></span>${esc(t('grp.'+s.grp))}<span class="ix">${s.idx}</span></div>
            <h2 class="sys-t">${esc(t(s.id+'.name'))}</h2>
            <p class="sys-pain">${esc(t(s.id+'.pain'))}</p>
          </div>
        </div>

        <div class="sys-body">
        <details class="fold fold-sp">
          <summary><span>${esc(t('fold.detail'))}</span>
            <em>${s.structure + s.process} ${esc(t('fold.items'))}</em></summary>
          <div class="sp">
            <div class="panel"><div class="panel-cap">${esc(t('lab.structure'))}</div>
              <ul class="plist">${listOf(s,'s',s.structure)}</ul></div>
            <div class="panel"><div class="panel-cap">${esc(t('lab.process'))}</div>
              <ul class="plist steps">${listOf(s,'p',s.process)}</ul></div>
          </div>
        </details>
        ${shots}

        <div class="demo">
          <div class="demo-bar"><span class="tag">${esc(t('lab.try'))}</span>
            <h3>${esc(t('d.'+s.id+'.t'))}</h3>
            <span class="hint">${esc(t('d.'+s.id+'.hint'))}</span></div>
          <div class="demo-body" id="demo-${s.id}"></div>
        </div>

        <div class="res"><div class="res-h">${esc(t('lab.result'))}</div>
          ${stats}${charts}${note}</div>
        </div>
      </div></section>`;
  }).join('');

  syncFolds();
  if(typeof clearResizers === 'function') clearResizers();
  SYSTEMS.forEach(s => { if (window[s.demo]) window[s.demo](el('#demo-'+s.id), s); });
}

const WIDE = () => matchMedia('(min-width: 861px)').matches;
function syncFolds(){
  const wide = WIDE();
  els('details.fold').forEach(d => { if(!d.dataset.touched) d.open = wide; });
}
document.addEventListener('toggle', e => {
  if(e.target.matches && e.target.matches('details.fold')) e.target.dataset.touched = '1';
}, true);
try{ matchMedia('(min-width: 861px)').addEventListener('change', syncFolds); }catch(e){}

function renderClose(){
  el('#chartTime').innerHTML = chartBlock('ct', chartPct(CLOSE_TIME,'%'),
    CLOSE_TIME.map(r=>[t(r.k), r.pct+'%']), [t('lab.item'), t('close.unit')]);
  el('#chartSafety').innerHTML = chartBlock('cf',
    chartBA({rows:CLOSE_SAFETY, unit:'', k:'close.c2'}),
    CLOSE_SAFETY.map(r=>[t(r.k), r.before, r.after]),
    [t('lab.item'), t('lab.before'), t('lab.after')]);
}

function renderSound(){
  const b = el('#sndb'); if(!b) return;
  const on = !Snd.muted;
  b.setAttribute('aria-pressed', String(on));
  b.classList.toggle('off', !on);
  b.title = t(on ? 'ui.soundOn' : 'ui.soundOff');
  el('#sndlbl').textContent = t('ui.sound');
}

function applyStatic(){
  els('[data-i]').forEach(n => { n.textContent = t(n.getAttribute('data-i')); });
  el('#archBox').innerHTML = archSvg()
    + `<div class="arch-outbtns">`
      + [['o1','arch.o1'],['o2','arch.o2'],['o3','arch.o3']].map(o=>
          `<button class="archbtn" data-out="${o[0]}">${esc(t(o[1]))}</button>`).join('')
    + `</div>`
    + `<p class="arch-hint">${esc(t('arch.hint'))}</p><div class="arch-note" id="archNote" hidden></div>`;
  document.title = t('ui.org') + ' · ' + (LANG==='zh'?'智慧護理':'Smart Nursing');
}

const FONT_URL = {
  ja:'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap',
  ko:'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap'
};
function ensureFont(lang){
  if(!FONT_URL[lang] || document.getElementById('f_'+lang)) return;
  const l = document.createElement('link');
  l.id='f_'+lang; l.rel='stylesheet'; l.href=FONT_URL[lang];
  document.head.appendChild(l);
}

function setLang(id){
  if(typeof Snd !== 'undefined'){ Snd.stopLoop(); Snd.hush(); }
  LANG = id;
  const L = LANGS.find(l=>l.id===id) || LANGS[0];
  document.documentElement.lang = L.code;
  document.documentElement.setAttribute('data-lang', id);
  ensureFont(id);
  renderLangs(); applyStatic(); renderSound(); renderHero(); renderSystems(); renderClose();
  buildNav(); setupCounters();
  try { localStorage.setItem('sn_lang', id); } catch(e){}
}

/* ── outcome highlighting in the diagram ─────────────────── */
let ARCH_SEL = null;
function toggleOutcome(key){
  const box = el('#archBox'), note = el('#archNote');
  ARCH_SEL = (ARCH_SEL === key) ? null : key;
  els('.archout', box).forEach(g => {
    const on = g.dataset.out === ARCH_SEL;
    g.classList.toggle('sel', on);
    g.setAttribute('aria-pressed', String(on));
  });
  els('.archbtn', box).forEach(btn => btn.classList.toggle('on', btn.dataset.out === ARCH_SEL));
  const keep = ARCH_SEL ? OUTCOMES[ARCH_SEL].doms : null;
  els('.archdom', box).forEach(g => g.classList.toggle('dim', !!keep && keep.indexOf(g.dataset.key) < 0));
  els('.archlink', box).forEach(p => p.classList.toggle('dim', !!keep && keep.indexOf(p.dataset.key) < 0));
  if(!ARCH_SEL){ note.hidden = true; note.innerHTML = ''; return; }
  const names = OUTCOMES[ARCH_SEL].sys.map(id => t(id + '.name'));
  note.hidden = false;
  note.innerHTML = `<b>${esc(t('arch.contrib'))}</b>`
    + names.map(n=>`<span>${esc(n)}</span>`).join('')
    + `<button class="tablink" data-clear="1">${esc(t('arch.clear'))}</button>`;
}

/* ── lightbox ─────────────────────────────────────────────── */
function initLightbox(){
  const lb = document.createElement('div');
  lb.className='lb'; lb.innerHTML = `<button class="lb-x" aria-label="close">&times;</button><img alt=""><p class="lb-cap"></p>`;
  document.body.appendChild(lb);
  const close = ()=>{ lb.classList.remove('on'); };
  lb.addEventListener('click', e => { if(e.target===lb || e.target.classList.contains('lb-x')) close(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') close(); });
  document.addEventListener('click', e => {
    const img = e.target.closest('.shot img');
    if(!img) return;
    el('img',lb).src = img.src; el('.lb-cap',lb).textContent = img.dataset.cap||'';
    lb.classList.add('on');
  });
}

/* ── boot ─────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const g = e.target.closest && e.target.closest('.archdom, .archout');
  if(!g) return;
  e.preventDefault();
  g.classList.contains('archout') ? toggleOutcome(g.dataset.out) : jumpTo(g.dataset.jump);
});

document.addEventListener('click', e => {
  const sb = e.target.closest('#sndb');
  if(sb){ Snd.setMuted(!Snd.muted); renderSound(); if(!Snd.muted) Snd.ok(); return; }
  const b = e.target.closest('.lang-b'); if(b){ setLang(b.dataset.l); return; }
  const g = e.target.closest('[data-jump]');
  if(g){
    jumpTo(g.dataset.jump);
    const sheet = el('#pillSheet');
    if(sheet && !sheet.hidden){ sheet.hidden = true; el('#pillMid').setAttribute('aria-expanded','false'); }
    return;
  }
  const st = e.target.closest('[data-step]');
  if(st){
    const n = Math.max(0, Math.min(NAV.items.length-1, (NAV.active<0?0:NAV.active) + (+st.dataset.step)));
    jumpTo(NAV.items[n].id); setActive(n); return;
  }
  if(e.target.closest('#pillMid')){
    const sheet = el('#pillSheet'), mid = el('#pillMid');
    sheet.hidden = !sheet.hidden;
    mid.setAttribute('aria-expanded', String(!sheet.hidden));
    return;
  }
  if(e.target.closest('[data-clear]')){ toggleOutcome(ARCH_SEL); return; }
  const out = e.target.closest('.archout, .archbtn');
  if(out){ toggleOutcome(out.dataset.out); return; }
  const tl = e.target.closest('.tablink');
  if(tl){ const tb = el('#'+tl.dataset.tbl); tb.hidden = !tb.hidden;
    tl.textContent = tb.hidden ? t('lab.table') : t('lab.hidetable'); return; }
});

(function init(){
  let saved = 'zh';
  try { saved = localStorage.getItem('sn_lang') || 'zh'; } catch(e){}
  if(!LANGS.some(l=>l.id===saved)) saved='zh';
  setLang(saved);
  initLightbox();

  const h = (location.hash || '').replace('#','');
  if(/^sys-[a-z]+$/.test(h) && el('#'+h)){
    setTimeout(()=>el('#'+h).scrollIntoView({block:'start'}), 120);
  }

  /* one orchestrated moment: the board comes up channel by channel */
  const board = el('#board');
  if(board && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    board.classList.add('booting');
    const tiles = els('.tile', board);
    tiles.forEach((tile,i)=> setTimeout(()=>tile.classList.add('lit'), 90+i*55));
    setTimeout(()=>board.classList.remove('booting'), 180+tiles.length*55+400);
  }
})();
