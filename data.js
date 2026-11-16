/* ══════════════════════════════════════════════════════════
   data.js — language-independent structure
   Numbers, images, colours, chart series. All text lives in i18n.js
   Source: 仁愛院區護理科 智慧護理成果報告 2026.11.16
   ══════════════════════════════════════════════════════════ */

const HERO_STATS = [
  { v: '10',   u: '',  k: 'hero.s1' },   // systems
  { v: '4',    u: '',  k: 'hero.s2' },   // care settings, = the four brand colours
  { v: '97.9', u: '%', k: 'hero.s3' },   // best time cut
  { v: '0',    u: '',  k: 'hero.s4' }    // medication-error events
];

/* delta helper: dir 'down' = lower is better */
const SYSTEMS = [
  /* ── 01 ───────────────────────────────────────────────── */
  {
    id:'ward', idx:'01', grp:'hospital', color:'var(--g-acute)', hex:'#1A57BE',
    demo:'demoWard',
    structure:4, process:3,
    shots:[
      { src:'img/image1.png', k:'ward.sh1' },
      { src:'img/image4.png', k:'ward.sh2' },
      { src:'img/image2.png', k:'ward.sh3' },
      { src:'img/image3.png', k:'ward.sh4' }
    ],
    stats:[
      { v:'2',  u:'min', k:'ward.r1', from:'10 min', pct:-80,   dir:'down' },
      { v:'2',  u:'min', k:'ward.r2', from:'15 min', pct:-86.7, dir:'down' },
      { v:'100',u:'%',   k:'ward.r3', from:'98.3%',  dir:'up' },
      { v:'12,768,000', u:'NT$', k:'ward.r4', small:true }
    ],
    chart:{ type:'ba', unit:'min', k:'ward.ch',
      rows:[ {k:'ward.ch1', before:10, after:2}, {k:'ward.ch2', before:15, after:2} ] }
  },

  /* ── 02 ───────────────────────────────────────────────── */
  {
    id:'pump', idx:'02', grp:'hospital', color:'var(--g-acute)', hex:'#1A57BE',
    demo:'demoPump',
    structure:4, process:5,
    shots:[ { src:'img/image5.jpeg', k:'pump.sh1' } ],
    stats:[
      { v:'0',   u:'', k:'pump.r1', from:'4', dir:'down' },
      { v:'145', u:'s', k:'pump.r2', from:'285 s', pct:-49.1, dir:'down' },
      { v:'85',  u:'s', k:'pump.r3', from:'145 s', pct:-41.4, dir:'down' },
      { v:'30',  u:'s', k:'pump.r4', from:'150 s', pct:-80,   dir:'down' },
      { v:'93.5',u:'%', k:'pump.r5', note:'n=306' }
    ],
    chart:{ type:'ba', unit:'s', k:'pump.ch',
      rows:[ {k:'pump.ch1', before:285, after:145},
             {k:'pump.ch2', before:145, after:85},
             {k:'pump.ch3', before:150, after:30} ] }
  },

  /* ── 03 ───────────────────────────────────────────────── */
  {
    id:'mattress', idx:'03', grp:'hospital', color:'var(--g-acute)', hex:'#1A57BE',
    demo:'demoMattress', head:2,
    structure:3, process:3,
    shots:[
      { src:'img/image6.jpeg', k:'mattress.sh1' },
      { src:'img/image7.jpeg', k:'mattress.sh2' }
    ],
    stats:[
      { v:'120', u:'', k:'mattress.r1' },
      { v:'110', u:'%', k:'mattress.r2', note:'6,083 / 5,530' },
      { v:'0',   u:'%', k:'mattress.r3' },
      { v:'0',   u:'', k:'mattress.r4', from:'6', pct:-100, dir:'down' }
    ],
    chart:{ type:'grp3', k:'mattress.ch', unit:'',
      cols:['2025','2026 1–7','2026 8–10'],
      rows:[ {k:'mattress.u1', v:[6,2,0]},
             {k:'mattress.u2', v:[2,0,0]},
             {k:'mattress.u3', v:[1,2,1]},
             {k:'mattress.u4', v:[0,0,0]} ] },
    chart2:{ type:'grp3', k:'mattress.ch2', unit:'',
      cols:['2025','2026 1–7','2026 8–10'],
      rows:[ {k:'mattress.u1', v:[3,2,0]},
             {k:'mattress.u2', v:[3,2,0]},
             {k:'mattress.u3', v:[0,1,0]},
             {k:'mattress.u4', v:[0,0,0]} ] }
  },

  /* ── 04 ───────────────────────────────────────────────── */
  {
    id:'udi', idx:'04', grp:'or', color:'var(--g-or)', hex:'#B52259',
    demo:'demoUdi',
    structure:3, process:4,
    shots:[
      { src:'img/image9.png',  k:'udi.sh1' },
      { src:'img/image11.png', k:'udi.sh2' },
      { src:'img/image8.jpeg', k:'udi.sh3' },
      { src:'img/image13.png', k:'udi.sh4' },
      { src:'img/image10.png', k:'udi.sh5' },
      { src:'img/image12.png', k:'udi.sh6' }
    ],
    stats:[
      { v:'0',  u:'', k:'udi.r1', from:'32', pct:-100, dir:'down' },
      { v:'0',  u:'', k:'udi.r2', from:'18', pct:-100, dir:'down' },
      { v:'20', u:'min', k:'udi.r3', from:'120 min', pct:-84, dir:'down' },
      { v:'2',  u:'s', k:'udi.r4', from:'35 min', dir:'down' },
      { v:'M658867', u:'', k:'udi.r5', small:true }
    ],
    chart:{ type:'ba', unit:'', k:'udi.ch',
      rows:[ {k:'udi.ch1', before:32, after:0},
             {k:'udi.ch2', before:18, after:0},
             {k:'udi.ch3', before:85, after:2},
             {k:'udi.ch4', before:52, after:2},
             {k:'udi.ch5', before:32, after:4} ] }
  },

  /* ── 05 ───────────────────────────────────────────────── */
  {
    id:'verti', idx:'05', grp:'edu', color:'var(--g-edu)', hex:'#A87C00',
    demo:'demoVerti',
    structure:3, process:5,
    shots:[ { src:'img/image14.png', k:'verti.sh1' } ],
    stats:[
      { v:'82', u:'', k:'verti.r1', from:'65', pct:26.15, dir:'up' },
      { v:'65', u:'', k:'verti.r2' },
      { v:'18', u:'', k:'verti.r3' }
    ],
    chart:{ type:'ba', unit:'%', k:'verti.ch', legendK:['verti.pre','verti.post'],
      rows:[ {k:'verti.e1', before:61.54, after:93.85},
             {k:'verti.e2', before:64.62, after:95.38},
             {k:'verti.e3', before:70.77, after:98.46},
             {k:'verti.e4', before:66.16, after:93.85} ] }
  },

  /* ── 06 ───────────────────────────────────────────────── */
  {
    id:'visit', idx:'06', grp:'ltc', color:'var(--g-ltc)', hex:'#00653C',
    demo:'demoVisit',
    structure:6, process:6,
    shots:[ { src:'img/image16.png', k:'visit.sh1' } ],
    stats:[
      { v:'95', u:'%', k:'visit.r1', from:'82%', dir:'up' },
      { v:'11', u:'', k:'visit.r2', from:'42', pct:-73.8, dir:'down' },
      { v:'85', u:'%', k:'visit.r3', dir:'down' },
      { v:'15', u:'%', k:'visit.r4', note:'464 / 3,091' }
    ],
    chart:{ type:'ba', unit:'%', k:'visit.ch',
      rows:[ {k:'visit.ch1', before:82, after:95} ] }
  },

  /* ── 07 ───────────────────────────────────────────────── */
  {
    id:'fire', idx:'07', grp:'ltc', color:'var(--g-ltc)', hex:'#00653C',
    demo:'demoFire',
    structure:8, process:7,
    shots:[],
    stats:[
      { v:'100', u:'%', k:'fire.r1', from:'63.16%', dir:'up', note:'19 / 19' },
      { v:'1,631', u:'m²', k:'fire.r2', small:true }
    ],
    chart:{ type:'ba', unit:'%', k:'fire.ch',
      rows:[ {k:'fire.ch1', before:63.16, after:100} ] }
  },

  /* ── 08 ───────────────────────────────────────────────── */
  {
    id:'roster', idx:'08', grp:'ltc', color:'var(--g-ltc)', hex:'#00653C',
    demo:'demoRoster',
    structure:8, process:7,
    shots:[
      { src:'img/image17.png', k:'roster.sh1' },
      { src:'img/image18.png', k:'roster.sh2' }
    ],
    stats:[
      { v:'60',  u:'min', k:'roster.r1', from:'480 min', pct:-87.5, dir:'down' },
      { v:'100', u:'%', k:'roster.r2' },
      { v:'100', u:'%', k:'roster.r3' }
    ],
    chart:{ type:'ba', unit:'min', k:'roster.ch',
      rows:[ {k:'roster.ch1', before:480, after:60} ] }
  },

  /* ── 09 ───────────────────────────────────────────────── */
  {
    id:'infect', idx:'09', grp:'ltc', color:'var(--g-ltc)', hex:'#00653C',
    demo:'demoInfect',
    structure:7, process:7,
    shots:[
      { src:'img/image21.png', k:'infect.sh1' },
      { src:'img/image22.png', k:'infect.sh2' },
      { src:'img/image19.png', k:'infect.sh3' },
      { src:'img/image20.png', k:'infect.sh4' }
    ],
    stats:[
      { v:'100', u:'%', k:'infect.r1' },
      { v:'100', u:'%', k:'infect.r2' },
      { v:'5',   u:'', k:'infect.r3' }
    ]
  },

  /* ── 10 ───────────────────────────────────────────────── */
  {
    id:'stock', idx:'10', grp:'ltc', color:'var(--g-ltc)', hex:'#00653C',
    demo:'demoStock',
    structure:8, process:7,
    shots:[ { src:'img/image23.png', k:'stock.sh1' } ],
    stats:[
      { v:'10',  u:'min', k:'stock.r1', from:'480 min', pct:-97.9, dir:'down' },
      { v:'0',   u:'', k:'stock.r2', from:'12', pct:-100, dir:'down' },
      { v:'124', u:'', k:'stock.r3' }
    ],
    chart:{ type:'ba', unit:'min', k:'stock.ch',
      rows:[ {k:'stock.ch1', before:480, after:10} ] }
  }
];

/* cross-system comparison, closing section */
const CLOSE_TIME = [
  { k:'stock.n',   pct:97.9 },
  { k:'roster.n',  pct:87.5 },
  { k:'ward.n2',   pct:86.7 },
  { k:'udi.n',     pct:84.0 },
  { k:'ward.n1',   pct:80.0 },
  { k:'pump.n3',   pct:80.0 },
  { k:'pump.n1',   pct:49.1 },
  { k:'pump.n2',   pct:41.4 }
];

const CLOSE_SAFETY = [
  { k:'cs.1', before:4,  after:0 },
  { k:'cs.2', before:32, after:0 },
  { k:'cs.3', before:18, after:0 },
  { k:'cs.4', before:12, after:0 },
  { k:'cs.5', before:9,  after:0 },
  { k:'cs.6', before:6,  after:0 }
];
