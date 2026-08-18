/* Kontrola, či nákres sedí k téme cviku:  node scripts/audit_diagrams.js */
const D=require('./diagram.js');
const ex=JSON.parse(require('fs').readFileSync(__dirname+'/../exercises.json','utf8'));

/* aké šablóny dávajú zmysel pre ktorú tému */
const OK={
 'Rýchlym vedením lopty':['slalom','gates','channel','through','ssg','duel','grid','tag','press','zones','mastery','targetZone'],
 '1v1 KÚ/KO':['duel','channel','cross','ssg','duelWave','gk1v1','shoot','zones'],
 '1v1 SÚ/SSH/KÚ (chrbtom k bránke)':['pivot','through','grid','ssg','duel','positional','zones'],
 '1v1 SO/SSH/SÚ (v čelnom postavení)':['duel','grid','ssg','channel','zones','ssg4'],
 'Prvým dotykom (ofenzívny / otvorený)':['pass3','positional','zones','ssg','grid','through','rondo','pivot','mastery','gates','targetZone'],
 'Prienikovou prihrávkou':['through','pass3','wall','positional','zones','targetZone','ssg'],
 'Prihrávkou do behu (za brániaceho hráča)':['through','offside','targetZone','ssg','pass3','wall','zones','positional'],
 'Hrou na jeden dotyk (narážačka / na tretieho)':['wall','rondo','pass3','positional','zones','ssg','through'],
 'Krytie lopty (jednotlivca)':['grid','ssg','tag','press','duel','channel','mastery','pivot','zones'],
 'Držanie lopty (skupinou hráčov)':['rondo','positional','ssg','grid','zones','targetZone'],
 'Zakončenie po vedení lopty / kľučke':['shoot','duel','gk1v1','through','duelWave','ssg'],
 'Zakončenie po prihrávke / z prvého dotyku':['shoot','cross','pass3','ssg','gk1v1','wall','zones'],
 'Zakladanie útoku':['buildup','zones','ssg','positional','press'],
 'Základy priestorovej obrany':['block','press','ssg','duel','zones'],
 'Štandardné situácie (roh, priamy kop, aut)':['corner','freekick','throwin','ssg','block','cross'],
};

let bad=[],broken=0;
const uniq=new Set(), tpl={};
for(const e of ex){
  const k=D.pick(e), svg=D.drillSVG(e);
  uniq.add(svg); tpl[k]=(tpl[k]||0)+1;
  if(/undefined|NaN/.test(svg)){broken++;bad.push(`${e.id}: chybný SVG`);}
  const allow=OK[e.theme];
  if(!allow) bad.push(`${e.id}: neznáma téma ${e.theme}`);
  else if(!allow.includes(k)) bad.push(`${e.id} „${e.name}“ → šablóna '${k}' nesedí k téme „${e.theme}“`);
  /* hráči musia zostať na ihrisku a nesmú sa prekrývať */
  const pts=[...svg.matchAll(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="3"/g)].map(m=>[+m[1],+m[2]]);
  for(const [x,y] of pts)
    if(x<3.5||x>96.5||y<3.5||y>58.5) bad.push(`${e.id}: hráč mimo ihriska (${x},${y})`);
  outer: for(let a=0;a<pts.length;a++) for(let c=a+1;c<pts.length;c++)
    if(Math.hypot(pts[a][0]-pts[c][0],pts[a][1]-pts[c][1])<5){
      bad.push(`${e.id} „${e.name}“: dvaja hráči sa prekrývajú`); break outer;}
}
console.log(`cvikov ${ex.length} | unikátnych nákresov ${uniq.size} | šablón ${Object.keys(tpl).length} | chybných SVG ${broken}`);
console.log(Object.entries(tpl).sort((a,b)=>b[1]-a[1]).map(x=>x[0]+':'+x[1]).join(' '));
if(bad.length){console.log('\n❌ PROBLÉMY ('+bad.length+'):'); bad.slice(0,40).forEach(x=>console.log('  -',x)); process.exit(1);}
if(uniq.size!==ex.length){console.log(`\n❌ ${ex.length-uniq.size} cvikov má rovnaký nákres ako iný`); process.exit(1);}
console.log('\n✅ Každý nákres sedí k téme, je unikátny a celý sa zmestí na ihrisko.');
