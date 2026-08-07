/* =========================================================================
   Zostava — generátor nákresov cvikov (SVG)
   Jeden zdroj pravdy: vkladá sa do index.html medzi značky
   __DIAGRAM_START__/__DIAGRAM_END__ a používa sa aj pri generovaní PDF.
   ========================================================================= */
(function(root){
  const W=100, H=62;                 // súradnicový systém nákresu

  const PAL={
    dark:{pitch:'#0E1712',line:'rgba(255,255,255,.16)',att:'#2BE58A',attTxt:'#06070A',
          def:'#FF5C6C',ball:'#FFFFFF',cone:'#FFB020',arrow:'#8BF7C0',pass:'#49C6F5',goal:'rgba(255,255,255,.5)',label:'#98A1B2'},
    light:{pitch:'#F2F7F3',line:'#CBD9CE',att:'#1F7A45',attTxt:'#FFFFFF',
          def:'#C0392B',ball:'#16233A',cone:'#E08A1E',arrow:'#2F8F5B',pass:'#2C6DA8',goal:'#8AA294',label:'#55655C'}
  };

  /* ---------- primitívy ---------- */
  const el=(s)=>s;
  function player(x,y,c,txt,label){
    return `<circle cx="${x}" cy="${y}" r="3.1" fill="${c}"/>`+
           (txt?`<text x="${x}" y="${y+1.15}" font-size="3.1" font-weight="700" text-anchor="middle" fill="${label}" font-family="Arial">${txt}</text>`:'');
  }
  function defender(x,y,c){
    return `<circle cx="${x}" cy="${y}" r="3.1" fill="none" stroke="${c}" stroke-width="1.1"/>`+
           `<path d="M${x-1.5} ${y-1.5}L${x+1.5} ${y+1.5}M${x+1.5} ${y-1.5}L${x-1.5} ${y+1.5}" stroke="${c}" stroke-width="1.1" stroke-linecap="round"/>`;
  }
  function cone(x,y,c){return `<path d="M${x} ${y-2.6}L${x+2.2} ${y+1.8}L${x-2.2} ${y+1.8}Z" fill="${c}"/>`;}
  function ball(x,y,c,stroke){return `<circle cx="${x}" cy="${y}" r="1.7" fill="${c}" stroke="${stroke}" stroke-width=".5"/>`;}
  function arrow(x1,y1,x2,y2,c,dashed,id){
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.1"
      ${dashed?'stroke-dasharray="2.6 2"':''} marker-end="url(#a${id})" stroke-linecap="round"/>`;
  }
  function wave(pts,c,id){
    let d='M'+pts[0][0]+' '+pts[0][1];
    for(let i=1;i<pts.length;i++){const [px,py]=pts[i-1],[x,y]=pts[i];
      d+=` Q ${(px+x)/2+(i%2?4:-4)} ${(py+y)/2} ${x} ${y}`;}
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.1" marker-end="url(#a${id})" stroke-linecap="round"/>`;
  }
  function goal(x,y,w,c){return `<rect x="${x-w/2}" y="${y-1.4}" width="${w}" height="2.8" fill="none" stroke="${c}" stroke-width="1.2"/>`;}

  /* ---------- šablóny scén ---------- */
  const T={
    slalom(p){ let s='';
      const xs=[26,40,54,68];
      xs.forEach(x=>s+=cone(x,31,p.cone));
      s+=wave([[14,31],[26,24],[40,38],[54,24],[68,38],[86,31]],p.arrow,'1');
      s+=player(12,31,p.att,'',p.attTxt)+ball(17,31,p.ball,p.line);
      return s;},
    duel(p){ let s='';
      s+=goal(78,16,14,p.goal)+goal(78,46,14,p.goal);
      s+=player(26,31,p.att,'',p.attTxt)+ball(31,31,p.ball,p.line);
      s+=defender(52,31,p.def);
      s+=arrow(34,29,50,18,p.arrow,false,'1');
      s+=arrow(34,33,50,44,p.arrow,true,'1');
      return s;},
    rondo(p){ let s='';
      const cx=50,cy=31,r=19;
      const pts=[[cx,cy-r],[cx+r*0.95,cy-r*0.35],[cx+r*0.6,cy+r*0.85],[cx-r*0.6,cy+r*0.85],[cx-r*0.95,cy-r*0.35]];
      s+=`<circle cx="${cx}" cy="${cy}" r="${r+4}" fill="none" stroke="${p.line}" stroke-width=".8" stroke-dasharray="2 2"/>`;
      for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];
        s+=arrow(a[0]+(b[0]-a[0])*0.18,a[1]+(b[1]-a[1])*0.18,a[0]+(b[0]-a[0])*0.82,a[1]+(b[1]-a[1])*0.82,p.pass,true,'2');}
      pts.forEach((q,i)=>s+=player(q[0],q[1],p.att,String(i+1),p.attTxt));
      s+=defender(cx-4,cy,p.def)+defender(cx+5,cy+3,p.def);
      s+=ball(cx,cy-r+5,p.ball,p.line);
      return s;},
    shoot(p){ let s='';
      s+=goal(50,7,26,p.goal);
      s+=`<path d="M30 7 L30 20 L70 20 L70 7" fill="none" stroke="${p.line}" stroke-width=".8"/>`;
      s+=cone(38,42,p.cone)+cone(62,42,p.cone);
      s+=player(28,50,p.att,'',p.attTxt)+ball(33,50,p.ball,p.line);
      s+=wave([[33,50],[40,44],[46,36]],p.arrow,'1');
      s+=arrow(47,33,50,12,p.pass,false,'2');
      s+=player(72,46,p.att,'',p.attTxt);
      s+=arrow(70,42,56,26,p.arrow,true,'1');
      return s;},
    pass3(p){ let s='';
      const A=[20,46],B=[50,16],C=[80,46];
      s+=arrow(A[0]+4,A[1]-3,B[0]-4,B[1]+3,p.pass,true,'2');
      s+=arrow(B[0]+4,B[1]+3,C[0]-4,C[1]-3,p.pass,true,'2');
      s+=arrow(C[0]-4,C[1]+2,A[0]+4,A[1]+2,p.pass,true,'2');
      s+=player(A[0],A[1],p.att,'A',p.attTxt)+player(B[0],B[1],p.att,'B',p.attTxt)+player(C[0],C[1],p.att,'C',p.attTxt);
      s+=ball(A[0]+4,A[1]-4,p.ball,p.line);
      return s;},
    through(p){ let s='';
      s+=goal(84,31,16,p.goal);
      [20,31,42].forEach(y=>s+=defender(56,y,p.def));
      s+=player(22,31,p.att,'',p.attTxt)+ball(27,31,p.ball,p.line);
      s+=arrow(29,31,74,31,p.pass,true,'2');
      s+=player(44,50,p.att,'',p.attTxt);
      s+=arrow(46,47,72,35,p.arrow,false,'1');
      return s;},
    ssg(p){ let s='';
      s+=goal(6,31,18,p.goal)+goal(94,31,18,p.goal);
      s+=`<line x1="50" y1="4" x2="50" y2="58" stroke="${p.line}" stroke-width=".8" stroke-dasharray="2 2"/>`;
      [[26,16],[26,46],[38,31]].forEach(q=>s+=player(q[0],q[1],p.att,'',p.attTxt));
      [[62,16],[62,46],[74,31]].forEach(q=>s+=defender(q[0],q[1],p.def));
      s+=arrow(41,31,59,31,p.pass,true,'2');
      s+=ball(36,26,p.ball,p.line);
      return s;},
    corner(p){ let s='';
      s+=goal(50,7,26,p.goal);
      s+=`<path d="M26 7 L26 24 L74 24 L74 7" fill="none" stroke="${p.line}" stroke-width=".8"/>`;
      s+=`<path d="M8 7 A 6 6 0 0 0 14 13" fill="none" stroke="${p.line}" stroke-width=".8"/>`;
      s+=player(9,10,p.att,'',p.attTxt)+ball(13,13,p.ball,p.line);
      s+=arrow(15,14,44,16,p.pass,true,'2');
      [[38,30],[52,32],[64,28]].forEach(q=>s+=player(q[0],q[1],p.att,'',p.attTxt));
      s+=arrow(38,27,42,18,p.arrow,false,'1');
      s+=arrow(64,25,60,17,p.arrow,false,'1');
      return s;},
    block(p){ let s='';
      s+=goal(50,7,24,p.goal);
      [22,40,58,76].forEach(x=>s+=defender(x,26,p.def));
      s+=`<line x1="18" y1="26" x2="80" y2="26" stroke="${p.def}" stroke-width=".7" stroke-dasharray="2 2" opacity=".6"/>`;
      [[34,48],[62,48]].forEach(q=>s+=player(q[0],q[1],p.att,'',p.attTxt));
      s+=ball(39,46,p.ball,p.line);
      s+=arrow(42,46,58,46,p.pass,true,'2');
      s+=arrow(22,30,30,38,p.arrow,false,'1');
      return s;},
    grid(p){ let s='';
      s+=`<rect x="24" y="10" width="52" height="42" fill="none" stroke="${p.line}" stroke-width=".9" stroke-dasharray="3 2"/>`;
      [[24,10],[76,10],[24,52],[76,52]].forEach(q=>s+=cone(q[0],q[1],p.cone));
      s+=player(42,31,p.att,'',p.attTxt)+ball(46,33,p.ball,p.line);
      s+=defender(56,31,p.def);
      s+=arrow(40,26,34,18,p.arrow,false,'1');
      return s;}
  };

  /* ---------- výber šablóny podľa cviku ----------
     Váhované skóre: zhoda v názve váži najviac, potom téma, potom popis. */
  const MATCH=[
    ['corner', /roh|priam[yý] kop|\baut\b|vhadzov|štandard|múr/],
    ['rondo',  /rondo|držan|udržan|\d+v\d+\s*\+?\s*\d*\s*(v štvorci)?|prihráv(ok|iek) za sebou|neutrál/],
    ['shoot',  /zakonč|strel|volej|center|finish|zakončuje|na bránu/],
    ['duel',   /1v1|duel|súboj|kľučk|zaseká|obísť|prekona|zrkadl/],
    ['through',/do behu|kolmic|prienik|za obranu|ofsajd|za chrbát/],
    ['block',  /blok|pressing|presing|priestorov|bránen|obrann|posun|kompakt|istenie|odobrat/],
    ['grid',   /kryti|chráň|chrán|udrž|mriežk|štvorc|naháňačk/],
    ['slalom', /vedeni|vedie|slalom|dribl|prekáž|pretek|koordina|semafor|rýchlos/],
    ['pass3',  /narážačk|prihráv|prihrá|na tretieho|jeden dotyk|prvý dotyk|spracov|rozohrá|zaklada/],
    ['ssg',    /hra|zápas|ssg|malá hra|voľná hra/],
  ];
  const WEIGHT={name:4,theme:2,steps:1};
  function pick(ex){
    const f={name:(ex.name||'').toLowerCase(),theme:(ex.theme||'').toLowerCase(),steps:((ex.steps||'')+' '+(ex.coach||'')).toLowerCase()};
    let best=null,bestScore=0;
    for(const [key,re] of MATCH){
      let sc=0;
      for(const k in WEIGHT) if(re.test(f[k])) sc+=WEIGHT[k];
      if(sc>bestScore){bestScore=sc;best=key;}
    }
    if(best) return best;
    return ex.phase==='ZČ'?'ssg':(ex.phase==='PČ'?'slalom':'pass3');
  }

  /* ---------- hlavná funkcia ---------- */
  function drillSVG(ex,opts){
    const o=opts||{}; const p=PAL[o.theme==='light'?'light':'dark'];
    const key=pick(ex); const scene=T[key](p);
    const defs=`<defs>
      <marker id="a1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
        <path d="M0 1L9 5L0 9z" fill="${p.arrow}"/></marker>
      <marker id="a2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
        <path d="M0 1L9 5L0 9z" fill="${p.pass}"/></marker>
    </defs>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nákres cviku">
      ${defs}
      <rect x="0" y="0" width="${W}" height="${H}" rx="3" fill="${p.pitch}"/>
      <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="2" fill="none" stroke="${p.line}" stroke-width=".9"/>
      ${scene}
    </svg>`;
  }
  const legendItems=[['att','Hráč s loptou / útočiaci'],['def','Brániaci hráč'],['cone','Kužeľ / méta'],['pass','Prihrávka'],['arrow','Pohyb hráča / vedenie']];

  const api={drillSVG,pick,PAL,legendItems};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Diagram=api;
})(typeof window!=='undefined'?window:globalThis);
