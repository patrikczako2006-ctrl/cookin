/* Zloží predpisy z data/scenes/*.json, postaví z nich nákresy a skontroluje ich.
   Výstup: scenes.json (id -> hotová scéna). */
const fs=require('fs'), path=require('path');
const R=require(path.join(__dirname,'render.js'));
const S=require(path.join(__dirname,'scenes.js'));
const root=path.join(__dirname,'..');

const spec={};
const dir=path.join(root,'data','scenes');
fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort().forEach(f=>{
  const j=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  Object.keys(j).forEach(k=>{ if(spec[k]) console.log('! dvakrát:',k); spec[k]=j[k]; });
});

const ex=JSON.parse(fs.readFileSync(path.join(root,'exercises.json'),'utf8'));
const out={}; let bad=0, miss=[];
ex.forEach(e=>{
  const sp=spec[e.id];
  if(!sp){ miss.push(e.id); return; }
  const sc=S.build(sp,e.id,R.validate);
  if(sc.__err){ bad++; console.log(e.id+' „'+e.name+'“\n  '+sc.__err.join('\n  ')); delete sc.__err; }
  out[e.id]=sc;
});
const extra=Object.keys(spec).filter(k=>!ex.some(e=>e.id===k));
if(extra.length) console.log('predpis bez cviku:',extra.join(', '));
fs.writeFileSync(path.join(root,'scenes.json'),JSON.stringify(out));
console.log(`hotových nákresov: ${Object.keys(out).length} / ${ex.length}`
  +(miss.length?`  · bez predpisu: ${miss.length}`:'')+(bad?`  · s chybou: ${bad}`:'  · všetky bez chyby'));
if(miss.length&&process.argv[2]==='-v') console.log(miss.join(' '));
