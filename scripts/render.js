/* =========================================================================
   Zostava — nákresy cvikov (SVG), verzia 2

   Nákres sa NEHÁDA z textu. Každý cvik má vlastný popis scény (`scene`),
   ktorý hovorí presne, čo sa má nakresliť. Popis aj text cviku pochádzajú
   z jedného zdroja, takže obrázok vždy sedí k zadaniu.

   Súradnice sú v METROCH, počiatok vľavo hore. Nákres je v mierke —
   ihrisko 40×30 m vyzerá inak než 20×15 m.

   Popis scény:
   {
     w: 40, h: 30,                        // rozmery hracej plochy v metroch
     marks: 'none'|'half'|'full'|'box'|'boxB'|'boxL'|'boxR',
     zones:  [{x,y,w,h,label,fill}],
     goals:  [{x,y,w,side:'l'|'r'|'t'|'b',gk:true,mini:true}],
     gates:  [{x,y,w,dir:'v'|'h'}],
     cones:  [[x,y],...],
     mann:   [[x,y],...],                 // figuríny
     players:[{x,y,t:'a'|'d'|'n'|'gk',n:'1'}],
     balls:  [[x,y],...],
     acts:   [{k:'pass'|'drib'|'run'|'shot',p:[[x,y],[x,y],...],n:1}],
     dims:   true,
     note:   'krátky popis pod nákresom'
   }
   ========================================================================= */
(function(root){

  const PAL={
    dark:{
      pitch:'#0F1A14', bg:'#0B1410', line:'rgba(255,255,255,.34)', line2:'rgba(255,255,255,.15)',
      att:'#2BE58A', attTxt:'#06120B', def:'#FF5C6C', defTxt:'#2A0509',
      neu:'#FFC24D', neuTxt:'#22160A', gk:'#8BB8FF', gkTxt:'#0A1424',
      ball:'#FFFFFF', ballLine:'#0B1A12', cone:'#FFB020', mann:'#C9D6CF',
      pass:'#5CD2FF', drib:'#2BE58A', run:'#E8EFEA', shot:'#FF9F45',
      zone:'rgba(255,255,255,.05)', zoneLine:'rgba(255,255,255,.24)',
      zoneTarget:'rgba(43,229,138,.13)', zoneOwn:'rgba(255,92,108,.055)',
      txt:'rgba(255,255,255,.74)', dim:'rgba(255,255,255,.45)', badge:'#0B140F',
      stripe:'rgba(255,255,255,.022)', legend:'rgba(255,255,255,.60)',
      legendBg:'rgba(255,255,255,.035)', chip:'rgba(255,255,255,.07)',
      title:'#F3F6FA', task:'rgba(255,255,255,.72)'
    },
    light:{
      pitch:'#EDF4EE', bg:'#FFFFFF', line:'#7E9A88', line2:'#C3D4C9',
      att:'#1F7A45', attTxt:'#FFFFFF', def:'#C0392B', defTxt:'#FFFFFF',
      neu:'#D98218', neuTxt:'#FFFFFF', gk:'#2C6DA8', gkTxt:'#FFFFFF',
      ball:'#16233A', ballLine:'#FFFFFF', cone:'#E08A1E', mann:'#5A6B61',
      pass:'#2C6DA8', drib:'#1F7A45', run:'#55655C', shot:'#C2691B',
      zone:'rgba(0,0,0,.05)', zoneLine:'rgba(0,0,0,.24)',
      zoneTarget:'rgba(31,122,69,.15)', zoneOwn:'rgba(192,57,43,.07)',
      txt:'#33463C', dim:'#6E8177', badge:'#FFFFFF',
      stripe:'rgba(0,0,0,.035)', legend:'#4A5C52',
      legendBg:'rgba(0,0,0,.035)', chip:'rgba(0,0,0,.05)',
      title:'#16233A', task:'#3C4C44'
    }
  };

  const FONT='Manrope, Arial, sans-serif';
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const f=n=>(Math.round(n*10)/10);

  /* -------------------------------------------------------------------------
     Mierka. Ihrisko vždy vyplní plochu nákresu — okraje sú v pixeloch, nie
     v metroch, takže veľké ihrisko nemá okolo seba prázdny pás. Značky
     (hráči, text) majú veľkosť obmedzenú, aby malé ihrisko nemalo obrích
     hráčov a veľké ihrisko neviditeľné bodky.
  ------------------------------------------------------------------------- */
  const BOX_W=700, BOX_H=460, GD=3.0;   // GD = miesto za bránkovou čiarou (m)
  function mk(scene){
    const w=+scene.w||30, h=+scene.h||20, D=scene.dims!==false;
    /* bránka stojí ZA čiarou — na tú stranu si nákres nechá miesto navyše */
    let gl=0,gr=0,gt=0,gb=0;
    (scene.goals||[]).forEach(g=>{
      if(g.side==='l') gl=GD; else if(g.side==='r') gr=GD;
      else if(g.side==='b') gb=GD; else gt=GD;
    });
    const TW=w+gl+gr, TH=h+gt+gb;
    const PL=D?30:14, PR=14, PT=14, PB=D?30:14;
    const S=Math.min((BOX_W-PL-PR)/TW,(BOX_H-PT-PB)/TH);
    const VW=TW*S+PL+PR, VH=TH*S+PT+PB;
    const U=Math.min(VW,VH)/38;
    const m={w,h,S,VW,VH,U,
      X:x=>PL+(x+gl)*S, Y:y=>PT+(y+gt)*S, L:v=>v*S,
      C:(mtr,lo,hi)=>Math.max(U*lo,Math.min(U*hi,mtr*S))};
    m.R=m.C(1.15,0.82,1.45);          // polomer hráča
    m.LW=m.C(0.26,0.13,0.26);         // hrúbka čiary ihriska
    return m;
  }

  /* ---------- primitívy ---------- */
  function player(m,p,pl){
    const r=m.R, x=m.X(pl.x), y=m.Y(pl.y);
    const col={a:p.att,d:p.def,n:p.neu,gk:p.gk}[pl.t]||p.att;
    const tc={a:p.attTxt,d:p.defTxt,n:p.neuTxt,gk:p.gkTxt}[pl.t]||p.attTxt;
    let s=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}"`;
    s+= pl.t==='d' ? ` stroke="${p.pitch}" stroke-width="${f(r*0.2)}"/>` : `/>`;
    const lbl = pl.n!=null ? String(pl.n) : (pl.t==='gk'?'B':'');
    if(lbl) s+=`<text x="${f(x)}" y="${f(y+r*0.37)}" font-size="${f(r*1.12)}" font-weight="800"`
      +` text-anchor="middle" fill="${tc}" font-family="${FONT}">${esc(lbl)}</text>`;
    return s;
  }
  function cone(m,p,x,y){
    const r=m.C(0.85,0.62,0.9), X=m.X(x), Y=m.Y(y);
    /* méta má podstavu — bez nej splýva so šípkou */
    return `<ellipse cx="${f(X)}" cy="${f(Y+r*0.62)}" rx="${f(r*0.95)}" ry="${f(r*0.3)}"`
      +` fill="${p.cone}" fill-opacity=".35"/>`
      +`<path d="M${f(X)} ${f(Y-r)}L${f(X+r*0.85)} ${f(Y+r*0.62)}L${f(X-r*0.85)} ${f(Y+r*0.62)}Z"`
      +` fill="${p.cone}"/>`;
  }

  /* pokosené pásy — nákres má na prvý pohľad vyzerať ako ihrisko */
  function stripes(m,p){
    const n=6, bw=m.L(m.w)/n; let s='';
    for(let i=0;i<n;i+=2)
      s+=`<rect x="${f(m.X(0)+i*bw)}" y="${f(m.Y(0))}" width="${f(bw)}" height="${f(m.L(m.h))}" fill="${p.stripe}"/>`;
    return `<g clip-path="url(#pclip)">${s}</g>`;
  }

  /* smer útoku — tréner musí hneď vidieť, kam sa hrá */
  function dirOf(scene){
    const sides={};
    (scene.goals||[]).forEach(g=>{sides[g.side||'t']=1;});
    const k=Object.keys(sides);
    if(k.length===1) return k[0];
    /* bránky na oboch stranách — smer je vždy pozdĺžny, nie do strany */
    const axis = (sides.l&&sides.r) ? 'x' : (sides.t&&sides.b) ? 'y' : null;
    const sh=(scene.acts||[]).filter(a=>a.k==='shot').pop()
          || (scene.acts||[])[(scene.acts||[]).length-1];
    if(sh&&sh.p&&sh.p.length>1){
      const a=sh.p[0], b=sh.p[sh.p.length-1];
      const dx=b[0]-a[0], dy=b[1]-a[1];
      if(axis==='x') return dx>=0?'r':'l';
      if(axis==='y') return dy>=0?'b':'t';
      if(Math.abs(dx)>=Math.abs(dy)*1.15) return dx>=0?'r':'l';
      if(Math.abs(dy)>Math.abs(dx)*1.15) return dy>=0?'b':'t';
    }
    return null;
  }
  function dirSym(p,d,cx,cy,fs){
    const L=fs*2.0, rot={r:0,l:180,t:-90,b:90}[d]||0, x0=cx-L/2;
    return `<g transform="rotate(${rot} ${f(cx)} ${f(cy)})">`
      +`<path d="M${f(x0)} ${f(cy)}L${f(x0+L-fs*0.3)} ${f(cy)}" stroke="${p.att}"`
      +` stroke-width="${f(fs*0.26)}" stroke-linecap="round"/>`
      +`<path d="M${f(x0+L-fs*0.5)} ${f(cy-fs*0.38)}L${f(x0+L)} ${f(cy)}L${f(x0+L-fs*0.5)} ${f(cy+fs*0.38)}"`
      +` fill="${p.att}" stroke="${p.att}" stroke-width="${f(fs*0.12)}" stroke-linejoin="round"/></g>`;
  }
  function mann(m,p,x,y){
    const w=m.C(0.7,0.42,0.7), h=m.C(1.8,1.1,1.8);
    return `<rect x="${f(m.X(x)-w/2)}" y="${f(m.Y(y)-h/2)}" width="${f(w)}" height="${f(h)}" rx="${f(w/2)}"`
      +` fill="none" stroke="${p.mann}" stroke-width="${f(m.C(0.22,0.13,0.22))}"/>`;
  }
  function ball(m,p,x,y){
    const r=m.C(0.55,0.34,0.55);
    return `<circle cx="${f(m.X(x))}" cy="${f(m.Y(y))}" r="${f(r)}" fill="${p.ball}"`
      +` stroke="${p.ballLine}" stroke-width="${f(r*0.28)}"/>`;
  }

  /* Bránka: brvno na bránkovej čiare, hĺbka a sieťka za ňou — mimo hraciu
     plochu, tak ako v skutočnosti. Miesto na ňu vyhradí `mk()`. */
  function goal(m,p,g){
    const t=m.C(0.4,0.24,0.42), gw=m.L(g.w||5), x=m.X(g.x), y=m.Y(g.y);
    const vert=(g.side==='l'||g.side==='r');
    const dep=m.L(2.2)*(g.side==='l'||g.side==='t'?-1:1);
    const A=vert?[x,y-gw/2]:[x-gw/2,y], B=vert?[x,y+gw/2]:[x+gw/2,y];
    const off=vert?[dep,0]:[0,dep];
    let net='';
    for(let i=1;i<=3;i++){
      const k=i/4;
      const px=A[0]+(B[0]-A[0])*k, py=A[1]+(B[1]-A[1])*k;
      net+=`M${f(px)} ${f(py)}L${f(px+off[0])} ${f(py+off[1])}`;
    }
    return `<path d="${net}" fill="none" stroke="${p.line2}" stroke-width="${f(t*0.45)}"/>`
      +`<path d="M${f(A[0])} ${f(A[1])}L${f(A[0]+off[0])} ${f(A[1]+off[1])}`
      +`L${f(B[0]+off[0])} ${f(B[1]+off[1])}L${f(B[0])} ${f(B[1])}"`
      +` fill="none" stroke="${p.line}" stroke-width="${f(t)}" stroke-linejoin="miter"/>`
      +`<path d="M${f(A[0])} ${f(A[1])}L${f(B[0])} ${f(B[1])}" stroke="${p.line}"`
      +` stroke-width="${f(t*1.5)}" stroke-linecap="round"/>`;
  }
  const goalGk=g=>{
    if(!g.gk) return null;
    const o=1.6;
    return {t:'gk', x:g.side==='l'?g.x+o:g.side==='r'?g.x-o:g.x,
                    y:g.side==='t'?g.y+o:g.side==='b'?g.y-o:g.y};
  };

  function gate(m,p,g){
    const half=(g.w||2)/2, hor=(g.dir==='h');
    const a=hor?[g.x-half,g.y]:[g.x,g.y-half], b=hor?[g.x+half,g.y]:[g.x,g.y+half];
    return `<path d="M${f(m.X(a[0]))} ${f(m.Y(a[1]))}L${f(m.X(b[0]))} ${f(m.Y(b[1]))}"`
      +` stroke="${p.cone}" stroke-opacity=".45" stroke-width="${f(m.U*0.13)}"`
      +` stroke-dasharray="${f(m.U*0.32)} ${f(m.U*0.32)}"/>`
      +cone(m,p,a[0],a[1])+cone(m,p,b[0],b[1]);
  }

  function zone(m,p,z){
    const x=m.X(z.x),y=m.Y(z.y),w=m.L(z.w),h=m.L(z.h);
    const fill=z.fill||(z.tone==='target'?p.zoneTarget:z.tone==='own'?p.zoneOwn:p.zone);
    return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"`
      +` stroke="${p.zoneLine}" stroke-width="${f(m.C(0.13,0.08,0.14))}"`
      +` stroke-dasharray="${f(m.U*0.7)} ${f(m.U*0.55)}"/>`;
  }
  /* popis zóny sa kreslí až nakoniec a na podložke — inak ho prekryje hráč */
  function zoneLabel(m,p,z){
    if(!z.label) return '';
    const x=m.X(z.x), y=m.Y(z.y), w=m.L(z.w);
    const fs=m.U*0.95, tx=x+w/2, ty=y+fs*1.45;
    const tw=String(z.label).length*fs*0.55+fs*0.8;
    return `<rect x="${f(tx-tw/2)}" y="${f(ty-fs*1.05)}" width="${f(tw)}" height="${f(fs*1.45)}"`
      +` rx="${f(fs*0.4)}" fill="${p.pitch}" fill-opacity=".82"/>`
      +`<text x="${f(tx)}" y="${f(ty)}" font-size="${f(fs)}" text-anchor="middle" fill="${p.txt}"`
      +` font-family="${FONT}" font-weight="700" letter-spacing=".4">${esc(z.label)}</text>`;
  }

  /* ---------- čiary ihriska ---------- */
  function marks(m,p,kind){
    const line=(x1,y1,x2,y2)=>`<path d="M${f(m.X(x1))} ${f(m.Y(y1))}L${f(m.X(x2))} ${f(m.Y(y2))}"`
      +` stroke="${p.line2}" stroke-width="${f(m.LW*0.8)}" fill="none"/>`;
    const rect=(x,y,w,h)=>`<rect x="${f(m.X(x))}" y="${f(m.Y(y))}" width="${f(m.L(w))}" height="${f(m.L(h))}"`
      +` fill="none" stroke="${p.line2}" stroke-width="${f(m.LW*0.8)}"/>`;
    const circ=(x,y,r)=>`<circle cx="${f(m.X(x))}" cy="${f(m.Y(y))}" r="${f(m.L(r))}" fill="none"`
      +` stroke="${p.line2}" stroke-width="${f(m.LW*0.8)}"/>`;
    let s='';
    if(kind==='half'||kind==='full'){
      s+=line(m.w/2,0,m.w/2,m.h)+circ(m.w/2,m.h/2,Math.min(9.15,m.w/6));
    }
    if(kind==='box'||kind==='boxB'){                    // pokutové územie hore / dole
      const top=(kind==='box');
      const bw=Math.min(m.w*0.74,40.3), bh=Math.min(m.h*0.44,16.5);
      const sw=Math.min(m.w*0.36,18.3), sh=Math.min(m.h*0.17,5.5);
      const by=top?0:m.h-bh, sy=top?0:m.h-sh;
      s+=rect((m.w-bw)/2,by,bw,bh)+rect((m.w-sw)/2,sy,sw,sh);
      s+=circ(m.w/2,top?bh*0.68:m.h-bh*0.68,0.4);       // pokutový bod
    }
    if(kind==='boxL'||kind==='boxR'){                   // pokutové územie vľavo / vpravo
      const rgt=(kind==='boxR');
      const bh=Math.min(m.h*0.74,40.3), bw=Math.min(m.w*0.44,16.5);
      const sh=Math.min(m.h*0.36,18.3), sw=Math.min(m.w*0.17,5.5);
      s+=rect(rgt?m.w-bw:0,(m.h-bh)/2,bw,bh)+rect(rgt?m.w-sw:0,(m.h-sh)/2,sw,sh);
      s+=circ(rgt?m.w-bw*0.68:bw*0.68,m.h/2,0.4);
    }
    return s;
  }

  /* -------------------------------------------------------------------------
     Akcie. Čiara sa oreže tak, aby nezačínala ani nekončila v hráčovi —
     hrot šípky je vždy vidno vedľa krúžku, nie pod ním. Číslo poradia sa
     posunie kolmo od čiary tak, aby neležalo na hráčovi ani na inom čísle.
  ------------------------------------------------------------------------- */
  const STYLE={
    pass:{c:'pass', w:0.30, lo:0.15, hi:0.30, dash:null,     head:'ap', wavy:false},
    drib:{c:'drib', w:0.30, lo:0.15, hi:0.30, dash:null,     head:'ad', wavy:true },
    run :{c:'run',  w:0.26, lo:0.13, hi:0.26, dash:[1.4,1.1],head:'ar', wavy:false},
    shot:{c:'shot', w:0.46, lo:0.22, hi:0.44, dash:null,     head:'as', wavy:false}
  };

  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

  function trim(P,obst,r){
    if(P.length<2) return P;
    const Q=P.map(q=>q.slice());
    const near=(pt)=>{let best=null,bd=1e9;
      obst.forEach(o=>{const d=dist(pt,o); if(d<bd){bd=d;best=o;}}); return {o:best,d:bd};};
    let a=near(Q[0]);
    if(a.o&&a.d<r*1.9){
      const b=Q[1], L=dist(a.o,b)||1;
      Q[0]=[a.o[0]+(b[0]-a.o[0])/L*(r*1.35), a.o[1]+(b[1]-a.o[1])/L*(r*1.35)];
    }
    const li=Q.length-1; let z=near(Q[li]);
    if(z.o&&z.d<r*1.9){
      const b=Q[li-1], L=dist(z.o,b)||1;
      Q[li]=[z.o[0]+(b[0]-z.o[0])/L*(r*1.45), z.o[1]+(b[1]-z.o[1])/L*(r*1.45)];
    }
    return Q;
  }

  function dOf(P,wavy,m){
    if(wavy){
      const A=P[0], B=P[P.length-1];
      const dx=B[0]-A[0], dy=B[1]-A[1], len=Math.hypot(dx,dy)||1;
      const nx=-dy/len, ny=dx/len;
      const amp=Math.min(m.U*0.42,len/18), n=Math.max(2,Math.min(5,Math.round(len/(m.U*4.6))))*2;
      let d=`M${f(A[0])} ${f(A[1])}`;
      for(let i=1;i<=n;i++){
        const t=i/n, px=A[0]+dx*t, py=A[1]+dy*t, s=(i%2?1:-1)*amp;
        const cx=A[0]+dx*(t-0.5/n)+nx*s, cy=A[1]+dy*(t-0.5/n)+ny*s;
        d+=`Q${f(cx)} ${f(cy)} ${f(px)} ${f(py)}`;
      }
      return d;
    }
    if(P.length===2) return `M${f(P[0][0])} ${f(P[0][1])}L${f(P[1][0])} ${f(P[1][1])}`;
    let d=`M${f(P[0][0])} ${f(P[0][1])}`;
    for(let i=1;i<P.length-1;i++){
      const a=P[i], b=P[i+1];
      d+=`Q${f(a[0])} ${f(a[1])} ${f((a[0]+b[0])/2)} ${f((a[1]+b[1])/2)}`;
    }
    d+=`L${f(P[P.length-1][0])} ${f(P[P.length-1][1])}`;
    return d;
  }

  /* bod v podiele t (0-1) dĺžky lomenej čiary + smerový vektor */
  function along(P,t){
    let tot=0; const seg=[];
    for(let i=1;i<P.length;i++){const d=dist(P[i-1],P[i]); seg.push(d); tot+=d;}
    let want=tot*t;
    for(let i=0;i<seg.length;i++){
      if(want<=seg[i]||i===seg.length-1){
        const k=seg[i]?want/seg[i]:0, a=P[i], b=P[i+1];
        const L=seg[i]||1;
        return {p:[a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k], u:[(b[0]-a[0])/L,(b[1]-a[1])/L], len:tot};
      }
      want-=seg[i];
    }
    return {p:P[0],u:[1,0],len:tot};
  }

  function badge(m,p,P,col,n,taken){
    const r=m.U*0.86, gap=r*1.15;
    let best=null,bestScore=-1e9;
    /* na krátkej šípke by číslo sedelo na hrote — vtedy ho vždy posunieme nabok */
    const short=along(P,1).len < r*9;
    const ts=short?[0.45,0.55,0.35]:[0.5,0.4,0.6,0.32,0.68,0.24];
    const offs=short?[1.5,-1.5,2.4,-2.4]:[0,1,-1,1.9,-1.9,2.8,-2.8];
    outer:
    for(const t of ts){
      const a=along(P,t);
      for(const k of offs){
        const c=[a.p[0]-a.u[1]*gap*k, a.p[1]+a.u[0]*gap*k];
        let clear=1e9;
        taken.forEach(o=>{clear=Math.min(clear, dist(c,[o.x,o.y])-o.r-r);});
        if(clear>bestScore){bestScore=clear;best=c;}
        if(clear>m.U*0.25) break outer;
      }
    }
    if(!best) best=along(P,0.5).p;
    taken.push({x:best[0],y:best[1],r});
    /* poradie akcie je ŠTVOREC, hráč je KRUH — aby sa čísla neplietli */
    return `<rect x="${f(best[0]-r)}" y="${f(best[1]-r)}" width="${f(r*2)}" height="${f(r*2)}"`
      +` rx="${f(r*0.42)}" fill="${col}"/>`
      +`<text x="${f(best[0])}" y="${f(best[1]+r*0.37)}" font-size="${f(r*1.12)}" font-weight="800"`
      +` text-anchor="middle" fill="${p.badge}" font-family="${FONT}">${esc(n)}</text>`;
  }

  /* -------------------------------------------------------------------------
     Legenda. Najdôležitejšia zmena oproti verzii 2: tréner nemusí hádať,
     čo znamená červený krúžok ani modrá čiara. Vypíšu sa len tie značky,
     ktoré sa v tomto nákrese naozaj vyskytujú.
  ------------------------------------------------------------------------- */
  const LBL={a:'Útočiaci',d:'Brániaci',n:'Neutrál',gk:'Brankár',
    ball:'Lopta',cone:'Méta',mann:'Figurína',
    pass:'Prihrávka',drib:'Vedenie lopty',run:'Beh bez lopty',shot:'Streľba'};
  const RANK=['a','d','n','gk','ball','cone','mann','pass','drib','run','shot'];

  function legendKeys(scene){
    const seen={};
    (scene.players||[]).forEach(q=>seen[q.t||'a']=1);
    (scene.goals||[]).forEach(g=>{if(g.gk) seen.gk=1;});
    if((scene.balls||[]).length||scene.ball) seen.ball=1;
    if((scene.cones||[]).length||(scene.gates||[]).length) seen.cone=1;
    if((scene.mann||[]).length) seen.mann=1;
    (scene.acts||[]).forEach(a=>seen[a.k||'pass']=1);
    return RANK.filter(k=>seen[k]);
  }

  function legSym(p,k,cx,cy,fs){
    const col={a:p.att,d:p.def,n:p.neu,gk:p.gk}[k];
    if(col){
      let s=`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(fs*0.62)}" fill="${col}"`;
      s+= k==='d'?` stroke="${p.pitch}" stroke-width="${f(fs*0.13)}"/>`:`/>`;
      return s;
    }
    if(k==='ball') return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(fs*0.36)}" fill="${p.ball}"`
      +` stroke="${p.ballLine}" stroke-width="${f(fs*0.1)}"/>`;
    if(k==='cone') return `<path d="M${f(cx)} ${f(cy-fs*0.58)}L${f(cx+fs*0.52)} ${f(cy+fs*0.42)}`
      +`L${f(cx-fs*0.52)} ${f(cy+fs*0.42)}Z" fill="${p.cone}"/>`;
    if(k==='mann') return `<rect x="${f(cx-fs*0.26)}" y="${f(cy-fs*0.62)}" width="${f(fs*0.52)}"`
      +` height="${f(fs*1.24)}" rx="${f(fs*0.26)}" fill="none" stroke="${p.mann}"`
      +` stroke-width="${f(fs*0.14)}"/>`;
    /* akcie — rovnaký tvar čiary ako v nákrese */
    const c=p[{pass:'pass',drib:'drib',run:'run',shot:'shot'}[k]];
    const L=fs*2.2, x0=cx-L/2, x1=cx+L/2;
    let d=`M${f(x0)} ${f(cy)}L${f(x1-fs*0.3)} ${f(cy)}`;
    if(k==='drib'){d=`M${f(x0)} ${f(cy)}`;
      const n=4,st=(L-fs*0.3)/n;
      for(let i=1;i<=n;i++) d+=`Q${f(x0+st*(i-0.5))} ${f(cy+(i%2?-fs*0.34:fs*0.34))} ${f(x0+st*i)} ${f(cy)}`;}
    const w=k==='shot'?fs*0.3:k==='run'?fs*0.17:fs*0.2;
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round"`
      +(k==='run'?` stroke-dasharray="${f(fs*0.36)} ${f(fs*0.3)}"`:'')+`/>`
      +`<path d="M${f(x1-fs*0.46)} ${f(cy-fs*0.32)}L${f(x1)} ${f(cy)}L${f(x1-fs*0.46)} ${f(cy+fs*0.32)}"`
      +` fill="${c}" stroke="${c}" stroke-width="${f(fs*0.1)}" stroke-linejoin="round"/>`;
  }

  function legend(m,p,scene,VW){
    const keys=legendKeys(scene);
    const dir=dirOf(scene);
    if(dir) keys.unshift('_dir');
    if(!keys.length) return {h:0,svg:''};
    LBL._dir='SMER HRY';
    const fs=Math.max(10.5,Math.min(13.5,m.U*0.92));
    const PADX=12, gapX=fs*1.05, symW=fs*2.6;
    const wOf=k=>symW+String(LBL[k]).length*fs*0.53+gapX;
    /* rozdelíme na riadky, ktoré sa zmestia do šírky */
    const rows=[[]]; let w=0, maxW=VW-PADX*2;
    keys.forEach(k=>{const iw=wOf(k);
      if(w+iw>maxW&&rows[rows.length-1].length){rows.push([]);w=0;}
      rows[rows.length-1].push(k); w+=iw;});
    const rowH=fs*2.0, h=rows.length*rowH+fs*0.9;
    let s=`<rect x="0" y="0" width="${f(VW)}" height="${f(h)}" fill="${p.legendBg}"/>`;
    rows.forEach((row,ri)=>{
      const tot=row.reduce((a,k)=>a+wOf(k),0);
      let x=(VW-tot)/2, cy=fs*0.9+ri*rowH+rowH*0.3;
      row.forEach(k=>{
        s+= k==='_dir' ? dirSym(p,dir,x+symW/2,cy,fs) : legSym(p,k,x+symW/2,cy,fs);
        s+=`<text x="${f(x+symW)}" y="${f(cy+fs*0.36)}" font-size="${f(fs)}"`
          +` fill="${k==='_dir'?p.att:p.legend}" font-family="${FONT}"`
          +` font-weight="${k==='_dir'?800:600}"`
          +(k==='_dir'?' letter-spacing=".4"':'')+`>${esc(LBL[k])}</text>`;
        x+=wOf(k);
      });
    });
    return {h, svg:s};
  }

  /* ---------- rozmery ---------- */
  /* Popisy rozmerov sedia na okraji celého nákresu, nie pri čiare ihriska —
     inak by ich prekryla bránka stojaca za čiarou. */
  function dims(m,p){
    const fs=m.U*1.0, bx=m.VW-9, by=m.VH-9, cy=m.Y(m.h/2);
    return `<text x="${f(m.X(m.w/2))}" y="${f(by)}" font-size="${f(fs)}" text-anchor="middle"`
      +` fill="${p.dim}" font-family="${FONT}" font-weight="600">${m.w} m</text>`
      +`<text x="11" y="${f(cy)}" font-size="${f(fs)}" text-anchor="middle"`
      +` fill="${p.dim}" font-family="${FONT}" font-weight="600"`
      +` transform="rotate(-90 11 ${f(cy)})">${m.h} m</text>`;
  }

  /* -------------------------------------------------------------------------
     Hlavička. Aby tréner nemusel čítať odsek: názov, formát a jedna veta,
     čo sa hrá. Nákres tak funguje aj vytlačený samostatne.
  ------------------------------------------------------------------------- */
  function wrap(txt,maxCh){
    const w=String(txt).split(/\s+/), out=[]; let ln='';
    w.forEach(t=>{ if((ln+' '+t).trim().length>maxCh&&ln){out.push(ln);ln=t;} else ln=(ln?ln+' ':'')+t; });
    if(ln) out.push(ln); return out;
  }
  function header(m,p,hd,VW){
    if(!hd||!hd.name) return {h:0,svg:''};
    const fs=Math.max(11,Math.min(15,m.U*1.0)), PADX=14;
    const nameLines=wrap(hd.name,Math.floor((VW-PADX*2)/(fs*1.30*0.56)));
    const chips=(hd.chips||[]).filter(Boolean);
    const task=hd.task?wrap(hd.task,Math.floor((VW-PADX*2)/(fs*0.95*0.53))).slice(0,2):[];
    let y=fs*1.9, s='';
    nameLines.forEach(l=>{
      s+=`<text x="${f(VW/2)}" y="${f(y)}" font-size="${f(fs*1.3)}" text-anchor="middle"`
        +` fill="${p.title}" font-family="${FONT}" font-weight="800">${esc(l)}</text>`;
      y+=fs*1.6;
    });
    if(chips.length){
      const cfs=fs*0.88, txt=chips.join('   ·   ');
      s+=`<text x="${f(VW/2)}" y="${f(y)}" font-size="${f(cfs)}" text-anchor="middle"`
        +` fill="${p.att}" font-family="${FONT}" font-weight="700" letter-spacing=".3">${esc(txt)}</text>`;
      y+=fs*1.5;
    }
    task.forEach(l=>{
      s+=`<text x="${f(VW/2)}" y="${f(y)}" font-size="${f(fs*0.95)}" text-anchor="middle"`
        +` fill="${p.task}" font-family="${FONT}" font-weight="500">${esc(l)}</text>`;
      y+=fs*1.35;
    });
    const h=y-fs*0.5;
    return {h, svg:`<rect x="0" y="0" width="${f(VW)}" height="${f(h)}" fill="${p.legendBg}"/>`+s};
  }

  /* ---------- hlavné vykreslenie ---------- */
  function render(scene,opts){
    const o=opts||{}, p=PAL[o.theme==='light'?'light':'dark'], m=mk(scene);
    const head=(c,id,w)=>`<marker id="${id}" viewBox="0 0 10 10" refX="8.2" refY="5"`
      +` markerWidth="${w}" markerHeight="${w}" orient="auto-start-reverse">`
      +`<path d="M0 1L9.4 5L0 9z" fill="${c}"/></marker>`;

    const players=(scene.players||[]).slice();
    (scene.goals||[]).forEach(g=>{const k=goalGk(g); if(k) players.push(k);});

    let s='';
    s+=`<rect x="0" y="0" width="${f(m.VW)}" height="${f(m.VH)}" fill="${p.bg}"/>`;
    s+=`<rect x="${f(m.X(0))}" y="${f(m.Y(0))}" width="${f(m.L(m.w))}" height="${f(m.L(m.h))}"`
      +` rx="${f(m.U*0.3)}" fill="${p.pitch}"/>`;
    s+=stripes(m,p);
    (scene.zones||[]).forEach(z=>s+=zone(m,p,z));
    s+=marks(m,p,scene.marks||'none');
    s+=`<rect x="${f(m.X(0))}" y="${f(m.Y(0))}" width="${f(m.L(m.w))}" height="${f(m.L(m.h))}"`
      +` rx="${f(m.U*0.3)}" fill="none" stroke="${p.line}" stroke-width="${f(m.LW)}"/>`;
    (scene.goals||[]).forEach(g=>s+=goal(m,p,g));
    (scene.gates||[]).forEach(g=>s+=gate(m,p,g));
    (scene.cones||[]).forEach(c=>s+=cone(m,p,c[0],c[1]));
    (scene.mann||[]).forEach(c=>s+=mann(m,p,c[0],c[1]));

    /* akcie pod hráčmi, čísla nad všetkým */
    const obst=players.map(pl=>[m.X(pl.x),m.Y(pl.y)]);
    const taken=players.map(pl=>({x:m.X(pl.x),y:m.Y(pl.y),r:m.R*1.15}));
    let badges='';
    (scene.acts||[]).forEach(a=>{
      const st=STYLE[a.k]||STYLE.pass, col=p[st.c];
      const P=trim(a.p.map(([x,y])=>[m.X(x),m.Y(y)]),obst,m.R);
      s+=`<path d="${dOf(P,st.wavy,m)}" fill="none" stroke="${col}"`
        +` stroke-width="${f(m.C(st.w,st.lo,st.hi))}" stroke-linecap="round" stroke-linejoin="round"`
        +` marker-end="url(#${st.head})"`
        +(st.dash?` stroke-dasharray="${f(m.C(st.dash[0],0.7,1.5))} ${f(m.C(st.dash[1],0.55,1.2))}"`:'')
        +`/>`;
      if(a.n!=null) badges+=badge(m,p,P,col,a.n,taken);
    });

    players.forEach(pl=>s+=player(m,p,pl));
    (scene.balls||(scene.ball?[scene.ball]:[])).forEach(b=>s+=ball(m,p,b[0],b[1]));
    (scene.zones||[]).forEach(z=>s+=zoneLabel(m,p,z));
    s+=badges;
    if(scene.dims!==false) s+=dims(m,p);

    const hd=(o.head===false)?{h:0,svg:''}:header(m,p,o.head,m.VW);
    const lg=(o.legend===false)?{h:0,svg:''}:legend(m,p,scene,m.VW);
    s=`<g transform="translate(0 ${f(hd.h)})">${s}</g>`;
    if(hd.h) s=hd.svg+s;
    if(lg.h) s+=`<g transform="translate(0 ${f(hd.h+m.VH)})">${lg.svg}</g>`;
    const TH=hd.h+m.VH+lg.h;

    return `<svg viewBox="0 0 ${f(m.VW)} ${f(TH)}" width="100%" xmlns="http://www.w3.org/2000/svg"`
      +` role="img" aria-label="${esc(o.alt||'Nákres cviku')}">`
      +`<defs>${head(p.pass,'ap',3.6)}${head(p.drib,'ad',3.6)}${head(p.run,'ar',3.8)}${head(p.shot,'as',3.2)}`
      +`<clipPath id="pclip"><rect x="${f(m.X(0))}" y="${f(m.Y(0))}" width="${f(m.L(m.w))}"`
      +` height="${f(m.L(m.h))}" rx="${f(m.U*0.3)}"/></clipPath></defs>`
      +`<rect x="0" y="0" width="${f(m.VW)}" height="${f(TH)}" fill="${p.bg}"/>`
      +s+`</svg>`;
  }

  /* -------------------------------------------------------------------------
     Kontrola scény — používa `scripts/audit_diagrams.js`. Nájde chyby, ktoré
     v nákrese vidno na prvý pohľad: prvok mimo ihriska, hráči na sebe,
     akcia kratšia než 3 m (nečitateľná šípka) a čiara vedená cez hráča.
  ------------------------------------------------------------------------- */
  function validate(scene){
    const err=[], w=+scene.w||30, h=+scene.h||20;
    const inside=(x,y,tol)=>x>=-tol&&y>=-tol&&x<=w+tol&&y<=h+tol;
    /* brankár stojí v bránke — strela cez neho je v poriadku, do kontroly nejde */
    const P=(scene.players||[]).filter(q=>q.t!=='gk').map(q=>[q.x,q.y]);
    (scene.players||[]).forEach((q,i)=>{ if(!inside(q.x,q.y,0.6)) err.push(`hráč #${i+1} je mimo ihriska (${q.x};${q.y})`); });
    (scene.cones||[]).concat(scene.mann||[]).forEach(c=>{ if(!inside(c[0],c[1],0.6)) err.push(`pomôcka mimo ihriska (${c[0]};${c[1]})`); });
    for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++)
      if(Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1])<2.2) err.push(`hráči #${i+1} a #${j+1} sú príliš blízko`);
    (scene.acts||[]).forEach((a,ai)=>{
      if(!a.p||a.p.length<2){ err.push(`akcia #${ai+1} nemá dva body`); return; }
      let len=0; for(let i=1;i<a.p.length;i++) len+=Math.hypot(a.p[i][0]-a.p[i-1][0],a.p[i][1]-a.p[i-1][1]);
      if(len<3) err.push(`akcia #${ai+1} je krátka (${len.toFixed(1)} m) — šípka bude nečitateľná`);
      a.p.forEach(pt=>{ if(!inside(pt[0],pt[1],1.5)) err.push(`akcia #${ai+1} vedie mimo ihriska`); });
      /* čiara nesmie prechádzať cez hráča, ktorý nie je jej začiatkom ani koncom */
      for(let i=1;i<a.p.length;i++){
        const A=a.p[i-1], B=a.p[i], L=Math.hypot(B[0]-A[0],B[1]-A[1])||1;
        P.forEach((q,qi)=>{
          const t=((q[0]-A[0])*(B[0]-A[0])+(q[1]-A[1])*(B[1]-A[1]))/(L*L);
          if(t<=0.12||t>=0.88) return;
          const cx=A[0]+(B[0]-A[0])*t, cy=A[1]+(B[1]-A[1])*t;
          if(Math.hypot(q[0]-cx,q[1]-cy)<1.6) err.push(`akcia #${ai+1} vedie cez hráča #${qi+1}`);
        });
      }
    });
    return err;
  }

  const legendItems=[
    ['att','Útočiaci hráč'],['def','Brániaci hráč'],['neu','Neutrálny hráč'],['gk','Brankár'],
    ['cone','Kužeľ / méta'],['mann','Figurína'],['ball','Lopta'],
    ['pass','Prihrávka'],['drib','Vedenie lopty'],['run','Beh bez lopty'],['shot','Streľba']
  ];

  const api={render, validate, PAL, legendItems};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Diagram2=api;
})(typeof window!=='undefined'?window:globalThis);
