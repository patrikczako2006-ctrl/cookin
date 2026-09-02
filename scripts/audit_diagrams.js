/* Kontrola nákresov: sedí nákres k cviku a je čitateľný?
   Beží nad `scenes.json`, ktorý zloží `scripts/build_scenes.js`. */
const fs=require('fs'), path=require('path');
const R=require(path.join(__dirname,'render.js'));
const root=path.join(__dirname,'..');
const ex=JSON.parse(fs.readFileSync(path.join(root,'exercises.json'),'utf8'));
const sc=JSON.parse(fs.readFileSync(path.join(root,'scenes.json'),'utf8'));

/* rozmery z nákresu musia sedieť s rozmermi napísanými v cviku */
function stated(s){
  const all=[...String(s||'').matchAll(/(\d+)\s*[×x]\s*(\d+)/g)];
  if(!all.length) return null;
  const m=all[all.length-1];
  return [+m[1],+m[2]];
}
/* bránka v nákrese <-> brankár alebo bránka spomenutá v texte */
const wantsGoal=e=>/brankár/i.test(
  [e.setup,e.steps,e.gear].join(' ').replace(/bez\s+brankár\w*/gi,''));

let bad=0, warn=0;
ex.forEach(e=>{
  const s=sc[e.id], say=m=>{console.log(`${e.id} „${e.name}“ — ${m}`);};
  if(!s){ bad++; say('chýba nákres'); return; }

  const err=R.validate(s);
  if(err.length){ bad++; err.forEach(x=>say(x)); }

  const st=stated(e.space);
  /* pri viacerých poliach a štandardkách je rozmer v cviku iný než celý nákres */
  if(st && s.shape!=='multi' && s.shape!=='setpiece'
     && (Math.abs(s.w-st[0])>0.6 || Math.abs(s.h-st[1])>0.6)){
    /* pri cvikoch typu „12×10 m na pole“ je rozmer jedného poľa, nie celku */
    if(!/pole|dvojic|polovic|vápno|ihrisk/i.test(e.space)){
      warn++; say(`nákres ${s.w}×${s.h} m, v cviku je uvedené ${st[0]}×${st[1]} m`);
    }
  }
  if(!(s.acts||[]).length){ warn++; say('nákres nemá ani jednu šípku'); }
  if((s.players||[]).length<2){ warn++; say('nákres má menej než dvoch hráčov'); }
  if(wantsGoal(e) && !(s.goals||[]).length && !(s.cones||[]).length){
    warn++; say('cvik má brankára, nákres nemá bránku');
  }
});

/* dva cviky nesmú mať úplne rovnaký nákres */
const seen=new Map();
Object.keys(sc).forEach(id=>{
  const k=JSON.stringify(sc[id]);
  if(seen.has(k)){ bad++; console.log(`${id} má rovnaký nákres ako ${seen.get(k)}`); }
  else seen.set(k,id);
});

console.log(`\nnákresov: ${Object.keys(sc).length} / ${ex.length}`
  +`  ·  chýb: ${bad}  ·  upozornení: ${warn}`);
process.exit(bad?1:0);
