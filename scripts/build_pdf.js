/* Zloží PDF databázu cvikov (svetlá paleta, na tlač).
   Spustenie:  node scripts/build_pdf.js  ->  cviky-databaza.pdf            */
const fs=require('fs'), path=require('path');
const R=require(path.join(__dirname,'render.js'));
const { chromium } = require('playwright');
const root=path.join(__dirname,'..');
const ex=JSON.parse(fs.readFileSync(path.join(root,'exercises.json'),'utf8'));
const sc=JSON.parse(fs.readFileSync(path.join(root,'scenes.json'),'utf8'));

const esc=s=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const P=R.PAL.light;

function legend(id){
  const s=sc[id]; if(!s) return '';
  const has={};
  (s.players||[]).forEach(p=>has[{a:'att',d:'def',n:'neu',gk:'gk'}[p.t]||'att']=1);
  (s.goals||[]).forEach(g=>{ if(g.gk) has.gk=1; });
  if((s.cones||[]).length||(s.gates||[]).length) has.cone=1;
  if((s.mann||[]).length) has.mann=1;
  if((s.balls||[]).length) has.ball=1;
  (s.acts||[]).forEach(a=>has[a.k]=1);
  return '<div class="leg">'+R.legendItems.filter(([k])=>has[k]).map(([k,t])=>{
    const c=P[k]||P.att;
    const mark=['pass','drib','run','shot'].includes(k)
      ? `<i style="width:16px;height:0;border-top:${k==='shot'?3:2}px ${k==='run'?'dashed':'solid'} ${c}"></i>`
      : k==='cone' ? `<i class="tri" style="border-bottom-color:${c}"></i>`
      : `<i style="width:9px;height:9px;border-radius:50%;background:${c}"></i>`;
    return `<span>${mark}${t}</span>`;}).join('')+'</div>';
}

const row=(l,v)=>v?`<p><b>${l}</b> ${esc(v)}</p>`:'';
const card=e=>`<section class="d">
  <header><span class="tag">${esc(e.phase)} · ${esc(e.theme)}</span>
    <h2>${esc(e.name)}</h2>
    <p class="meta">${esc(e.age)} · ${esc(e.players)} hráčov · ${esc(e.space)} · ${esc(e.time)} · ${esc(e.gear)}</p></header>
  <div class="fig">${sc[e.id]?R.render(sc[e.id],{theme:'light',alt:e.name}):''}</div>
  ${legend(e.id)}
  <div class="txt">
    ${row('Prečo to trénujeme:',e.why)}
    ${row('Rozostavenie:',e.setup)}
    ${row('Priebeh:',e.steps)}
    ${row('Podmienky:',e.constraints)}
    ${row('Sťaženie:',e.progression)}
    ${row('Zjednodušenie:',e.regression)}
    ${row('Na čo dbať:',e.coach)}
    ${row('Dávkovanie:',e.load)}
  </div>
  <footer>${esc(e.id)}</footer>
</section>`;

const html=`<!doctype html><meta charset="utf-8"><title>Zostava — databáza cvikov</title><style>
@page{size:A4;margin:12mm 11mm}
*{box-sizing:border-box}
body{margin:0;font:10.5px/1.45 "Helvetica Neue",Arial,sans-serif;color:#22302A}
h1{font-size:26px;margin:0 0 6px}
.cover{height:250mm;display:flex;flex-direction:column;justify-content:center;page-break-after:always}
.cover p{color:#55665D;max-width:120mm}
.d{page-break-inside:avoid;page-break-after:always;position:relative;padding-bottom:6mm}
.d:last-child{page-break-after:auto}
.tag{font-size:9px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#1F7A45}
h2{font-size:16px;margin:2px 0 3px}
.meta{margin:0 0 7px;color:#5A6B61;font-size:9.5px}
.fig{border:1px solid #D3DED7;border-radius:6px;overflow:hidden;background:#fff;line-height:0}
.fig svg{display:block;width:100%;height:auto}
.leg{display:flex;flex-wrap:wrap;gap:3px 12px;margin:5px 0 8px;font-size:8.5px;color:#5A6B61}
.leg span{display:inline-flex;align-items:center;gap:4px}
.leg i{display:inline-block;flex:0 0 auto}
.leg .tri{width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:8px solid}
.txt p{margin:0 0 4px}
.txt b{color:#1F7A45}
footer{position:absolute;right:0;bottom:0;font-size:8px;color:#93A39B}
</style>
<div class="cover"><h1>Zostava — databáza cvikov</h1>
  <p>${ex.length} cvikov pre kategórie U6 – U19, rozdelených podľa tém a častí tréningu
  (prípravná, hlavná, záverečná). Ku každému cviku patrí nákres v mierke: čiary ihriska,
  rozostavenie hráčov a číslované poradie akcií — prihrávka, vedenie lopty, beh bez lopty a streľba.</p></div>
${ex.map(card).join('')}`;

(async()=>{
  const out=path.join(root,'cviky-databaza.pdf');
  const b=await chromium.launch({executablePath:process.env.CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await (await b.newContext()).newPage();
  await p.setContent(html,{waitUntil:'load'});
  await p.pdf({path:out,format:'A4',printBackground:true});
  await b.close();
  console.log(`hotovo: ${out} (${ex.length} cvikov, ${(fs.statSync(out).size/1048576).toFixed(1)} MB)`);
})();
