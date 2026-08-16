/* =========================================================================
   Zostava — generátor nákresov cvikov (SVG)
   Jeden zdroj pravdy: vkladá sa do index.html medzi značky
   __DIAGRAM_START__/__DIAGRAM_END__ a používa sa aj pri generovaní PDF.

   Nákres sa prispôsobuje konkrétnemu cviku: šablóna sa vyberá podľa názvu
   a popisu, rozmiestnenie podľa formátu (4v1, 8v8+3), počtu hráčov, zón,
   prítomnosti brankára a bránok. Každý cvik má vlastný „seed“ (id + názov),
   z ktorého sa odvodzujú varianty šablóny — dva cviky s rovnakou šablónou
   tak nikdy nevyzerajú rovnako.
   ========================================================================= */
(function(root){
  const W=100,H=62;

  const PAL={
    dark:{pitch:'#0E1712',line:'rgba(255,255,255,.16)',line2:'rgba(255,255,255,.30)',att:'#2BE58A',attTxt:'#06070A',
          def:'#FF5C6C',neu:'#FFB020',neuTxt:'#1A0E06',ball:'#FFFFFF',cone:'#FFB020',arrow:'#8BF7C0',
          pass:'#49C6F5',goal:'rgba(255,255,255,.55)',zone:'rgba(255,255,255,.05)'},
    light:{pitch:'#F2F7F3',line:'#CBD9CE',line2:'#9FB3A6',att:'#1F7A45',attTxt:'#FFFFFF',
          def:'#C0392B',neu:'#D98218',neuTxt:'#FFFFFF',ball:'#16233A',cone:'#E08A1E',arrow:'#2F8F5B',
          pass:'#2C6DA8',goal:'#7C9488',zone:'rgba(0,0,0,.035)'}
  };

  /* ---------------- primitívy ---------------- */
  const P=(x,y,c,t,tc)=>`<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`+
    (t?`<text x="${x}" y="${y+1.1}" font-size="3" font-weight="700" text-anchor="middle" fill="${tc}" font-family="Arial">${t}</text>`:'');
  const Df=(x,y,c)=>`<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="${c}" stroke-width="1.1"/>`+
    `<path d="M${x-1.45} ${y-1.45}L${x+1.45} ${y+1.45}M${x+1.45} ${y-1.45}L${x-1.45} ${y+1.45}" stroke="${c}" stroke-width="1.1" stroke-linecap="round"/>`;
  const Cone=(x,y,c)=>`<path d="M${x} ${y-2.5}L${x+2.1} ${y+1.7}L${x-2.1} ${y+1.7}Z" fill="${c}"/>`;
  const Ball=(x,y,c,s)=>`<circle cx="${x}" cy="${y}" r="1.6" fill="${c}" stroke="${s}" stroke-width=".45"/>`;
  const GK=(x,y,c)=>`<rect x="${x-2.6}" y="${y-2.6}" width="5.2" height="5.2" rx="1.2" fill="none" stroke="${c}" stroke-width="1.2"/>`;
  const Goal=(x,y,w,c,vert)=>vert
    ? `<rect x="${x-1.4}" y="${y-w/2}" width="2.8" height="${w}" fill="none" stroke="${c}" stroke-width="1.2"/>`
    : `<rect x="${x-w/2}" y="${y-1.4}" width="${w}" height="2.8" fill="none" stroke="${c}" stroke-width="1.2"/>`;
  const Arr=(x1,y1,x2,y2,c,dash,m)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.05"
    ${dash?'stroke-dasharray="2.4 1.9"':''} marker-end="url(#${m})" stroke-linecap="round"/>`;
  const Zone=(x,y,w,h,p,dash)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${p.zone}" stroke="${p.line}" stroke-width=".8" ${dash?'stroke-dasharray="3 2"':''}/>`;
  function Wave(pts,c,m){let d='M'+pts[0][0]+' '+pts[0][1];
    for(let i=1;i<pts.length;i++){const [px,py]=pts[i-1],[x,y]=pts[i];
      d+=` Q ${(px+x)/2+(i%2?4:-4)} ${(py+y)/2} ${x} ${y}`;}
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.05" marker-end="url(#${m})" stroke-linecap="round"/>`;}
  const ring=(cx,cy,r,n,rot)=>Array.from({length:n},(_,i)=>{
    const a=(rot===undefined?-Math.PI/2:rot)+i*2*Math.PI/n; return [cx+r*Math.cos(a),cy+r*Math.sin(a)*0.86];});
  const box=(x,y,w,h,p)=>`<path d="M${x-w/2} ${y}L${x-w/2} ${y+h}L${x+w/2} ${y+h}L${x+w/2} ${y}" fill="none" stroke="${p.line}" stroke-width=".8"/>`;
  /* spojnica dvoch bodov so skrátením o polomer hráča */
  function link(a,b,c,dash,m,gap){const g=gap===undefined?4:gap;
    const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;
    return Arr(a[0]+dx/L*g,a[1]+dy/L*g,b[0]-dx/L*g,b[1]-dy/L*g,c,dash,m);}

  /* rozostavenie n hráčov do 1–3 stĺpcov (aby 3v3 a 8v8 vyzerali naozaj inak) */
  function squad(n,x0,step,i,key){
    const cols=n<=3?1:(n<=6?2:3), per=Math.ceil(n/cols), out=[];
    for(let k=0;k<n;k++){
      const c=Math.floor(k/per), r=k%per, inCol=Math.min(per,n-c*per);
      const gap=Math.min(17,42/Math.max(1,inCol));
      out.push([x0+c*step+i.J(key+k,1.8), 31-((inCol-1)/2)*gap+r*gap+i.J(key+40+k,1.8)]);
    }
    return out;
  }

  /* z ponuky pozícií vyber tie, ktoré nekolidujú s už obsadenými (hráč má r=3) */
  function avoid(cands,taken,n,minD){const d=minD||7.5,out=[];
    for(const c of cands){ if(out.length>=n) break;
      if(![...taken,...out].some(t=>Math.hypot(t[0]-c[0],t[1]-c[1])<d)) out.push(c);}
    let k=0; while(out.length<n&&k<cands.length){ const c=cands[k++];
      if(!out.includes(c)) out.push([c[0],c[1]]);}
    return out.slice(0,n);}

  /* ---------------- rozbor cviku ---------------- */
  function seedOf(s){let h=0;for(let i=0;i<String(s).length;i++)h=(h*31+String(s).charCodeAt(i))>>>0;return h;}
  function mix(a,b){let h=(a^Math.imul(b+1,2654435761))>>>0;
    h=Math.imul(h^(h>>>15),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0;
    return (h^(h>>>16))>>>0;}

  function info(ex){
    const sd=seedOf((ex.id||'')+'|'+(ex.name||'')+'|'+(ex.phase||''));
    const txt=((ex.name||'')+' '+(ex.steps||'')+' '+(ex.setup||'')+' '+(ex.players||'')).toLowerCase();
    const all=((ex.name||'')+' '+(ex.theme||'')+' '+(ex.setup||'')+' '+(ex.steps||'')+' '+(ex.constraints||'')+' '+(ex.coach||'')).toLowerCase();
    const fmt=txt.match(/(\d+)\s*v(?:s)?\s*(\d+)(?:\s*\+\s*(\d+))?/);
    const R=k=>mix(sd,k)/4294967296;          // 0..1
    const I=(k,n)=>mix(sd,k)%n;               // celé číslo 0..n-1
    const J=(k,a)=>Math.round((R(k)-.5)*2*a*10)/10;  // posun ±a
    return {
      txt:all, sd, R, I, J,
      v:sd%3, v2:(sd>>>3)%2, v3:(sd>>>5)%4,
      a:fmt?Math.min(+fmt[1],10):0, b:fmt?Math.min(+fmt[2],8):0, n:fmt&&fmt[3]?Math.min(+fmt[3],3):0,
      gk:/brankár|gk/.test(all),
      zones:/tri zón|troch zón|3 zón/.test(all)?3:(/štyri zón|štyroch zón/.test(all)?4:(/dve zón|dvoch zón|dva štvorc|dve polovic/.test(all)?2:0)),
      goals4:/štyri bránky|štyroch bránok|4 bránky|4 malé bránky/.test(all),
      small:/malé bránky|malú bránku|métové|z mét/.test(all)
    };
  }

  /* ---------------- šablóny ---------------- */
  const T={
    /* vedenie cez kužele */
    slalom(p,i){let s='';
      const n=4+i.I(1,3), step=(72-18)/n, amp=6+i.I(2,3)*2, mode=i.I(3,3);
      const pts=[[14,31]];
      for(let k=0;k<n;k++){const x=22+k*step, dy=(k%2?amp:-amp);
        if(mode===2){s+=Cone(x,31-amp,p.cone)+Cone(x,31+amp,p.cone);}
        else s+=Cone(x,31+(mode===1?dy*.35:0),p.cone);
        pts.push([x,31+dy]);}
      pts.push([88,31]);
      s+=Wave(pts,p.arrow,'ar');
      s+=P(12,31,p.att,'',p.attTxt)+Ball(16.5,31,p.ball,p.line);
      if(i.I(4,3)===1) s+=Goal(94,31,14,p.goal,true);
      else if(i.I(4,3)===2) s+=P(92,31,p.att,'',p.attTxt);
      return s;},

    /* prechod farebnými bránami */
    gates(p,i){let s='';
      const pool=[[24,14],[62,16],[34,46],[72,44],[48,30],[80,24],[16,40]];
      const n=4+i.I(1,3), vert=i.I(2,2)===1;
      const g=pool.slice(0,n).map(([x,y],k)=>[x+i.J(30+k,2.5),y+i.J(40+k,2.5)]);
      g.forEach(([x,y])=>{ if(vert) s+=Cone(x,y-3.4,p.cone)+Cone(x,y+3.4,p.cone);
        else s+=Cone(x-3.4,y,p.cone)+Cone(x+3.4,y,p.cone);});
      s+=P(12,31,p.att,'',p.attTxt)+Ball(16.5,31,p.ball,p.line);
      const route=[[17,31],g[0],g[4]||g[2],g[1]];
      s+=Wave(route,p.arrow,'ar');
      if(i.I(3,2)) s+=P(12,50,p.att,'',p.attTxt)+Ball(16.5,50,p.ball,p.line);
      return s;},

    /* individuálna práca s loptou */
    mastery(p,i){let s='';
      const n=4+i.I(1,3)*2, mode=i.I(2,3);
      if(mode===0){
        ring(50,31,i.I(3,2)?21:17,n,-Math.PI/2+i.R(4)*.6).forEach(q=>{
          s+=P(q[0],q[1],p.att,'',p.attTxt)+Ball(q[0]+4.3,q[1],p.ball,p.line);});
      } else if(mode===1){
        const cols=n===4?2:3, rows=Math.ceil(n/cols);
        for(let k=0;k<n;k++){const c=k%cols,r=Math.floor(k/cols);
          const x=50-(cols-1)*16+c*32+i.J(10+k,2), y=31-(rows-1)*11+r*22+i.J(20+k,2);
          s+=P(x,y,p.att,'',p.attTxt)+Ball(x+4.5,y,p.ball,p.line);}
      } else {
        for(let k=0;k<n;k++){const x=14+k*(72/(n-1)), y=(k%2?22:42)+i.J(50+k,2.5);
          s+=P(x,y,p.att,'',p.attTxt)+Ball(x+4.3,y,p.ball,p.line);}
      }
      if(i.I(5,2)) for(let k=0;k<4;k++) s+=Cone(16+k*23,57,p.cone);
      return s;},

    /* naháňačka / hra o loptu vo voľnom priestore */
    tag(p,i){let s='';
      const all=[[20,18],[46,14],[74,22],[30,44],[62,46],[84,38],[52,30],[16,36]];
      const n=5+i.I(1,4);
      const pos=[];
      all.slice(0,n).forEach(([x,y],k)=>{const px=x+i.J(10+k,3),py=y+i.J(20+k,3);
        pos.push([px,py]); s+=P(px,py,p.att,'',p.attTxt)+Ball(px+4.3,py,p.ball,p.line);});
      const hunters=avoid([[52,31],[70,36],[36,26],[58,44],[40,40],[66,16]]
        .map((q,k)=>[q[0]+i.J(30+k,3),q[1]+i.J(40+k,3)]),pos,1+i.I(2,3));
      hunters.forEach(([x,y])=>s+=Df(x,y,p.def));
      s+=Arr(hunters[0][0]+3,hunters[0][1],hunters[0][0]+15,hunters[0][1]-6,p.arrow,false,'ar');
      if(i.I(3,2)) s+=Zone(8,8,84,46,p,true);
      return s;},

    /* 1v1 na dve malé bránky — podporní hráči podľa formátu */
    duel(p,i){let s='';
      const g=i.I(1,4);
      if(g===0){s+=Goal(80,16,13,p.goal)+Goal(80,46,13,p.goal);}
      else if(g===1){s+=Goal(88,31,16,p.goal,true);}
      else if(g===2){s+=Cone(84,16,p.cone)+Cone(84,31,p.cone)+Cone(84,46,p.cone);}
      else {s+=Goal(90,18,12,p.goal,true)+Goal(90,44,12,p.goal,true);}
      const extra=Math.max(0,Math.min((i.a||1)-1,3));
      const dx=44+i.I(2,4)*4, dy=31+i.J(3,6);
      s+=P(22+i.J(4,4),31,p.att,'',p.attTxt)+Ball(28.5,31,p.ball,p.line)+Df(dx,dy,p.def);
      s+=Arr(32,29,dx-4,18,p.arrow,false,'ar')+Arr(32,33,dx-4,44,p.arrow,true,'ap');
      [[14,13],[14,49],[34,8]].slice(0,extra).forEach((q,k)=>s+=P(q[0]+i.J(20+k,2.5),q[1]+i.J(30+k,2.5),p.att,'',p.attTxt));
      [[dx+10,14],[dx+10,48],[dx+16,31]].slice(0,extra).forEach((q,k)=>s+=Df(q[0]+i.J(50+k,2.5),q[1]+i.J(60+k,2.5),p.def));
      if(!extra&&i.I(5,2)) s+=P(14,50,p.att,'',p.attTxt)+P(14,12,p.att,'',p.attTxt);
      return s;},

    /* vlny 1v1 na bránku s brankárom */
    duelWave(p,i){let s='';
      const gw=20+i.I(1,3)*3;
      s+=Goal(50,6,gw,p.goal)+GK(50,11,p.goal)+box(50,6,42,17,p);
      const q=2+i.I(2,2);
      for(let k=0;k<q;k++) s+=P(22,50+k*6,p.att,'',p.attTxt);
      s+=Ball(26.5,50,p.ball,p.line);
      const dx=40+i.I(3,4)*4, dy=30+i.J(4,6);
      s+=Df(dx,dy,p.def);
      s+=Wave([[27,49],[dx-10,dy+8],[dx-2,dy]],p.arrow,'ar');
      s+=Arr(dx+1,dy-4,50,14,p.pass,false,'ap');
      if(i.I(5,2)) for(let k=0;k<q;k++) s+=P(78,50+k*6,p.att,'',p.attTxt);
      else s+=Cone(78,50,p.cone)+Cone(78,56,p.cone);
      return s;},

    /* súboj v koridore */
    channel(p,i){let s='';
      const h=18+i.I(1,3)*4, y=31-h/2;
      s+=Zone(16,y,68,h,p,true);
      s+=`<line x1="84" y1="${y}" x2="84" y2="${y+h}" stroke="${p.line2}" stroke-width="1.1" stroke-dasharray="2 2"/>`;
      s+=P(24,31,p.att,'',p.attTxt)+Ball(28.5,31,p.ball,p.line);
      const dx=42+i.I(2,4)*6;
      s+=Df(dx,31+i.J(3,4),p.def);
      if(i.I(4,3)===0) s+=Df(dx+18,31+i.J(5,6),p.def);
      s+=Arr(32,31,80,31,p.arrow,false,'ar');
      if(i.I(6,2)) s+=Cone(16,y,p.cone)+Cone(16,y+h,p.cone)+Cone(84,y,p.cone)+Cone(84,y+h,p.cone);
      return s;},

    /* rondo — počet podľa formátu */
    rondo(p,i){let s='';const cx=50,cy=31;
      const out=Math.max(3,Math.min(i.a||(4+i.I(1,4)),8)), inn=Math.max(1,Math.min(i.b||(1+i.I(2,2)),4));
      const r=(out>6?21:19)+i.J(7,1.6), rot=-Math.PI/2+(i.R(3)-.5)*.8;
      const shape=i.I(4,3);
      if(shape===0) s+=`<circle cx="${cx}" cy="${cy}" r="${r+4.5}" fill="none" stroke="${p.line}" stroke-width=".8" stroke-dasharray="2.5 2"/>`;
      else if(shape===1) s+=Zone(cx-r-5,cy-r*.86-5,(r+5)*2,(r*.86+5)*2,p,true);
      else [[cx-r-4,cy-r*.7-4],[cx+r+4,cy-r*.7-4],[cx-r-4,cy+r*.7+4],[cx+r+4,cy+r*.7+4]].forEach(q=>s+=Cone(q[0],q[1],p.cone));
      const pts=ring(cx,cy,r,out,rot);
      const arrows=i.I(5,2)?out:Math.max(2,out-2);
      for(let k=0;k<arrows;k++){const a=pts[k],b=pts[(k+1)%out];
        s+=link(a,b,p.pass,true,'ap',3.6);}
      pts.forEach((q,k)=>s+=P(q[0],q[1],p.att,String(k+1),p.attTxt));
      ring(cx,cy,inn>1?3.4+inn*2.3:0,inn,rot+.5).forEach(q=>s+=Df(q[0],q[1],p.def));
      const st=i.I(6,out);
      s+=Ball(pts[st][0]+4,pts[st][1]+2,p.ball,p.line);
      if(i.I(8,3)===0) s+=P(cx,cy+r*.86+9,p.neu,'N',p.neuTxt);
      return s;},

    /* pozičná hra s neutrálmi */
    positional(p,i){let s='';
      const z=i.zones===4?4:(i.zones===2?2:(2+i.I(1,3))), w=(W-12)/z;
      for(let k=0;k<z;k++) s+=Zone(6+k*w,8,w,46,p,true);
      const na=Math.max(5,Math.min(i.a||(5+i.I(2,4)),8));
      const ap=[];
      [[18,18],[18,44],[34,31],[50,16],[50,46],[66,31],[82,20],[82,42]].slice(0,na)
        .forEach((q,k)=>{const x=q[0]+i.J(10+k,2.5),y=q[1]+i.J(20+k,2.5);
          ap.push([x,y]); s+=P(x,y,p.att,'',p.attTxt);});
      const nd=Math.max(2,Math.min(i.b||(2+i.I(3,3)),4));
      avoid([[40,20],[42,42],[60,24],[62,40],[28,31],[74,31]]
        .map((q,k)=>[q[0]+i.J(30+k,2.5),q[1]+i.J(40+k,2.5)]),ap,nd)
        .forEach(q=>s+=Df(q[0],q[1],p.def));
      const nn=i.n||i.I(4,3);
      if(nn) [[50,5],[50,57],[6,31]].slice(0,nn).forEach(q=>s+=P(q[0],q[1],p.neu,'N',p.neuTxt));
      if(i.I(5,2)) s+=Arr(37,31,47,18,p.pass,true,'ap')+Arr(53,17,64,30,p.pass,true,'ap');
      else s+=Arr(37,31,48,45,p.pass,true,'ap')+Arr(53,46,66,33,p.pass,true,'ap');
      s+=Ball(38,34,p.ball,p.line);return s;},

    /* postup cez zóny */
    zones(p,i){let s='';const z=i.zones===4?4:(i.zones===2?2:3),w=(W-8)/z;
      for(let k=0;k<z;k++) s+=Zone(4+k*w,6,w,50,p,k%2===1);
      if(i.I(1,3)===0){s+=Goal(4,31,16,p.goal,true)+Goal(96,31,16,p.goal,true);}
      else if(i.I(1,3)===1){s+=Goal(96,31,16,p.goal,true)+GK(90,31,p.goal);}
      else {s+=Zone(90,10,8,42,p,true);}
      s+=P(16,31+i.J(2,5),p.att,'',p.attTxt)+Ball(20.5,31,p.ball,p.line);
      s+=P(44,18+i.J(3,4),p.att,'',p.attTxt)+P(44,44+i.J(4,4),p.att,'',p.attTxt)+P(72,31+i.J(5,6),p.att,'',p.attTxt);
      const nd=2+i.I(6,3);
      [[32,31],[58,22],[58,42],[76,31]].slice(0,nd).forEach((q,k)=>s+=Df(q[0],q[1]+i.J(7+k,3),p.def));
      s+=Arr(23,30,41,19,p.pass,true,'ap')+Arr(47,20,69,29,p.pass,true,'ap');return s;},

    /* trojuholník / kosoštvorec prihrávok */
    pass3(p,i){let s='';
      const shapes=[[[20,46],[50,15],[80,46]],[[18,20],[50,48],[82,20]],
                    [[16,31],[50,13],[84,31]],[[24,44],[50,22],[76,44]],
                    [[20,16],[20,46],[76,31]]];
      const [A,B,C]=shapes[i.I(1,5)].map((q,k)=>[q[0]+i.J(10+k,3),q[1]+i.J(20+k,3)]);
      const diamond=i.I(2,3)===0;
      const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
      const D=[clamp((A[0]+C[0])/2,8,92),clamp((A[1]+C[1])/2+(B[1]<31?24:-24),8,54)];
      s+=link(A,B,p.pass,true,'ap')+link(B,C,p.pass,true,'ap');
      if(diamond){s+=link(C,D,p.pass,true,'ap')+link(D,A,p.pass,true,'ap');}
      else s+=link(C,A,p.pass,true,'ap');
      s+=P(A[0],A[1],p.att,'A',p.attTxt)+P(B[0],B[1],p.att,'B',p.attTxt)+P(C[0],C[1],p.att,'C',p.attTxt);
      if(diamond) s+=P(D[0],D[1],p.att,'D',p.attTxt);
      if(i.I(3,3)===0) s+=Df(50,31,p.def);
      if(i.I(4,2)) s+=Cone(A[0]-5,A[1],p.cone)+Cone(C[0]+5,C[1],p.cone);
      s+=Ball(A[0]+4,A[1]-4.5,p.ball,p.line);return s;},

    /* narážačka okolo obrancu */
    wall(p,i){let s='';const flip=i.I(1,2)===1, Y=y=>flip?62-y:y;
      const A=[16+i.J(2,3),Y(44)], B=[56+i.I(3,4)*6,Y(16)], C=[84,Y(44)];
      s+=P(A[0],A[1],p.att,'A',p.attTxt)+Ball(A[0]+4.5,A[1]-1,p.ball,p.line);
      s+=P(B[0],B[1],p.att,'B',p.attTxt);
      s+=Df(40+i.I(4,3)*5,Y(30),p.def);
      s+=link(A,B,p.pass,true,'ap');
      s+=Arr(B[0]-2,B[1]+3,A[0]+16,A[1]-4,p.pass,true,'ap');
      s+=Arr(A[0]+4,A[1]+4,A[0]+34,A[1]+5,p.arrow,false,'ar');
      if(i.I(5,3)!==0) s+=P(C[0],C[1],p.att,'C',p.attTxt);
      if(i.I(6,2)) s+=Goal(94,31,14,p.goal,true);
      return s;},

    /* cieľový hráč chrbtom (pivot) — podpora podľa formátu */
    pivot(p,i){let s='';
      const zw=22+i.I(1,3)*4, zx=W-4-zw;
      s+=Zone(zx,10,zw,42,p,true);
      const px=zx+zw/2+i.J(2,3);
      s+=P(px,31,p.att,'P',p.attTxt)+Df(px+6,31+i.J(3,4),p.def);
      const ns=Math.max(2,Math.min((i.a||3)-1,5));
      squad(ns,16,15,i,10).forEach(q=>s+=P(q[0],q[1],p.att,'',p.attTxt));
      s+=Ball(22,18,p.ball,p.line);
      s+=Arr(24,20,px-6,29,p.pass,true,'ap');
      s+=Arr(px-3,36,54,46,p.pass,true,'ap');
      s+=Arr(22,46,52,50,p.arrow,false,'ar');
      const nd=Math.max(0,Math.min((i.b||1)-1,3));
      [[42,20],[42,44],[56,31]].slice(0,nd).forEach((q,k)=>s+=Df(q[0],q[1]+i.J(70+k,3),p.def));
      if(!nd&&i.I(5,2)) s+=Df(44,24+i.J(6,6),p.def);
      return s;},

    /* kolmica za obranu */
    through(p,i){let s='';
      const lx=50+i.I(1,4)*4, nd=3+i.I(2,2);
      if(i.I(3,2)) s+=Goal(94,31,16,p.goal,true)+GK(88,31,p.goal);
      else s+=Goal(94,31,16,p.goal,true);
      const ys=nd===4?[13,26,38,50]:[18,31,44];
      ys.forEach((y,k)=>s+=Df(lx+i.J(10+k,2.5),y,p.def));
      s+=`<line x1="${lx}" y1="10" x2="${lx}" y2="52" stroke="${p.def}" stroke-width=".7" stroke-dasharray="2 2" opacity=".55"/>`;
      s+=P(20,31+i.J(4,5),p.att,'',p.attTxt)+Ball(24.5,31,p.ball,p.line);
      s+=Arr(27,31,80,31,p.pass,true,'ap');
      const ry=i.I(5,2)?50:12;
      s+=P(42,ry,p.att,'',p.attTxt)+Arr(45,ry+(ry>31?-3:3),76,31+(ry>31?5:-5),p.arrow,false,'ar');
      return s;},

    /* vysoká línia + ofsajd */
    offside(p,i){let s='';
      s+=Goal(94,31,16,p.goal,true)+GK(88,31,p.goal);
      const lx=48+i.I(1,4)*3;
      s+=`<line x1="${lx}" y1="8" x2="${lx}" y2="54" stroke="${p.def}" stroke-width="1" stroke-dasharray="3 2"/>`;
      const nd=3+i.I(2,2), ys=nd===4?[12,24,38,50]:[14,31,48];
      ys.forEach((y,k)=>s+=Df(lx+i.J(10+k,2),y,p.def));
      s+=P(22,31+i.J(3,5),p.att,'',p.attTxt)+Ball(26.5,31,p.ball,p.line);
      const dpos=ys.map((y,k)=>[lx+i.J(10+k,2),y]);
      avoid([[lx-8,16],[lx-8,46],[lx-9,31],[lx-7,36],[lx-7,22]]
        .map((q,k)=>[q[0],q[1]+i.J(20+k,3)]),dpos,2+i.I(4,2))
        .forEach(q=>s+=P(q[0],q[1],p.att,'',p.attTxt));
      s+=Arr(29,30,78,22,p.pass,true,'ap');
      s+=Arr(lx-1,15,76,20,p.arrow,false,'ar');return s;},

    /* zakončenie z uhlov */
    shoot(p,i){let s='';
      s+=Goal(50,6,24,p.goal)+GK(50,11,p.goal)+box(50,6,44,18,p);
      const mode=i.I(1,3);
      if(mode!==2){const cx=30+i.I(2,3)*4; s+=Cone(cx,40,p.cone)+Cone(100-cx,40,p.cone);}
      const sx=[20,34,14,44][i.I(3,4)]+i.J(7,2.5), sy=50+i.J(8,3);
      s+=P(sx,sy,p.att,'',p.attTxt)+Ball(sx+4.5,sy,p.ball,p.line);
      s+=Wave([[sx+5,sy],[sx+12,sy-7],[sx+20,sy-14]],p.arrow,'ar')+Arr(sx+22,sy-16,49,14,p.pass,false,'ap');
      if(i.I(4,2)) s+=Df(sx+26,30+i.J(5,4),p.def);
      if(i.I(6,3)!==0) s+=P(78+i.J(9,4),48+i.J(11,3),p.att,'',p.attTxt)+Arr(76,44,58,26,p.arrow,true,'ar');
      return s;},

    /* center z krídla */
    cross(p,i){let s='';const flip=i.I(1,2)===1, X=x=>flip?100-x:x;
      s+=Goal(50,6,24,p.goal)+GK(50,11,p.goal)+box(50,6,44,18,p);
      const wy=30+i.I(2,3)*4;
      s+=P(X(10),wy,p.att,'',p.attTxt)+Ball(X(14.5),wy,p.ball,p.line);
      s+=Arr(X(16),wy-1,X(42),17,p.pass,true,'ap');
      const na=2+i.I(3,3), ap=[];
      [[38,26],[58,24],[50,40],[68,34]].slice(0,na).forEach((q,k)=>{
        const y=q[1]+i.J(10+k,2.5); ap.push([X(q[0]),y]); s+=P(X(q[0]),y,p.att,'',p.attTxt);});
      avoid([[46,20],[62,32],[40,36],[54,16],[68,22]].map(q=>[X(q[0]),q[1]]),ap,1+i.I(4,2))
        .forEach(q=>s+=Df(q[0],q[1],p.def));
      s+=Arr(X(38),23,X(42),14,p.arrow,false,'ar')+Arr(X(58),21,X(54),13,p.arrow,false,'ar');
      if(i.I(5,2)) s+=P(X(90),wy,p.att,'',p.attTxt);
      return s;},

    /* 1v1 s brankárom */
    gk1v1(p,i){let s='';
      s+=Goal(50,6,24,p.goal)+GK(50,11+i.I(1,3),p.goal)+box(50,6,44,18,p);
      const sx=[50,36,64,44][i.I(2,4)];
      s+=P(sx,50,p.att,'',p.attTxt)+Ball(sx+4,49,p.ball,p.line);
      const swerve=i.I(3,2)?-8:8;
      s+=Wave([[sx+4,48],[sx+swerve,38],[sx+swerve/2,26]],p.arrow,'ar');
      if(i.I(4,3)!==0) s+=Df(sx+12,44,p.def)+Arr(sx+10,41,sx+4,32,p.pass,true,'ap');
      if(i.I(5,2)) s+=Cone(sx-10,52,p.cone)+Cone(sx+10,52,p.cone);
      return s;},

    /* malá hra na dve bránky — počet hráčov podľa formátu cviku */
    ssg(p,i){let s='';
      const n=Math.max(3,Math.min(i.a||(3+i.I(3,4)),8));
      const big=n>=5||i.I(1,3)!==0;
      if(big){s+=Goal(5,31,17,p.goal,true)+Goal(95,31,17,p.goal,true);}
      else {s+=Goal(5,20,11,p.goal,true)+Goal(5,42,11,p.goal,true)+Goal(95,20,11,p.goal,true)+Goal(95,42,11,p.goal,true);}
      if((i.gk||n>=6)&&big){s+=GK(11,31,p.goal)+GK(89,31,p.goal);}
      if(i.I(2,2)) s+=`<line x1="50" y1="5" x2="50" y2="57" stroke="${p.line}" stroke-width=".8" stroke-dasharray="2.5 2"/>`;
      const x0=n<=3?26:(n<=6?22:18), step=n<=6?15:13;
      const A=squad(n,x0,step,i,10), B=squad(n,100-x0,-step,i,60);
      A.forEach(q=>s+=P(q[0],q[1],p.att,'',p.attTxt));
      B.forEach(q=>s+=Df(q[0],q[1],p.def));
      if(i.n) s+=P(50,i.I(5,2)?6:56,p.neu,'N',p.neuTxt);
      const a=A[A.length-1], b=B[B.length-1];
      s+=link(a,b,p.pass,true,'ap')+Ball(a[0]-4,a[1]-4,p.ball,p.line);return s;},

    /* hra na štyri bránky */
    ssg4(p,i){let s='';
      if(i.I(1,2)){s+=Goal(6,20,13,p.goal,true)+Goal(6,42,13,p.goal,true)+Goal(94,20,13,p.goal,true)+Goal(94,42,13,p.goal,true);}
      else {s+=Goal(28,6,13,p.goal)+Goal(72,6,13,p.goal)+Goal(28,56,13,p.goal)+Goal(72,56,13,p.goal);}
      const n=3+i.I(2,2);
      [[28,18],[28,44],[40,31],[20,31]].slice(0,n).forEach((q,k)=>s+=P(q[0]+i.J(10+k,2.5),q[1]+i.J(20+k,2.5),p.att,'',p.attTxt));
      [[60,18],[60,44],[72,31],[80,31]].slice(0,n).forEach((q,k)=>s+=Df(q[0]+i.J(30+k,2.5),q[1]+i.J(40+k,2.5),p.def));
      s+=Arr(43,31,57,31,p.pass,true,'ap')+Ball(38,26,p.ball,p.line);return s;},

    /* hra s cieľovými zónami */
    targetZone(p,i){let s='';
      const zw=10+i.I(1,3)*3;
      s+=Zone(4,8,zw,46,p,true)+Zone(W-4-zw,8,zw,46,p,true);
      const n=3+i.I(2,2);
      [[30,18],[30,44],[44,31],[22,31]].slice(0,n).forEach((q,k)=>s+=P(q[0]+i.J(10+k,2.5),q[1]+i.J(20+k,2.5),p.att,'',p.attTxt));
      [[58,18],[58,44],[66,31],[74,31]].slice(0,n).forEach((q,k)=>s+=Df(q[0]+i.J(30+k,2.5),q[1]+i.J(40+k,2.5),p.def));
      if(i.I(3,2)) s+=P(W-4-zw/2,31,p.att,'',p.attTxt);
      s+=Arr(47,31,W-6-zw,31,p.pass,true,'ap')+Ball(40,27,p.ball,p.line);return s;},

    /* obranný blok — počet a tvar podľa formátu */
    block(p,i){let s='';
      s+=Goal(50,6,22,p.goal)+GK(50,11,p.goal);
      const tot=Math.max(4,Math.min(i.b||i.a||7,9));
      const back=Math.min(5,Math.max(2,Math.round(tot/2))), mid=Math.max(2,tot-back);
      const y1=20+i.I(2,3)*4, y2=y1+14;
      const row=(n,y,key)=>{let o='';const step=n>1?68/(n-1):0, x0=n>1?16:50;
        for(let k=0;k<n;k++) o+=Df(x0+k*step+i.J(key+k,1.8),y+i.J(key+50+k,1.8),p.def);return o;};
      s+=row(back,y1,10)+row(mid,y2,60);
      s+=`<line x1="14" y1="${y1}" x2="86" y2="${y1}" stroke="${p.def}" stroke-width=".7" stroke-dasharray="2 2" opacity=".5"/>`;
      s+=`<line x1="20" y1="${y2}" x2="80" y2="${y2}" stroke="${p.def}" stroke-width=".7" stroke-dasharray="2 2" opacity=".5"/>`;
      const na=Math.max(2,Math.min(i.a||3,4));
      [[30,52],[58,52],[44,58],[74,50]].slice(0,na).forEach(q=>s+=P(q[0],q[1],p.att,'',p.attTxt));
      s+=Ball(34,50,p.ball,p.line)+Arr(37,50,55,50,p.pass,true,'ap');return s;},

    /* pressing / counter-pressing */
    press(p,i){let s='';
      const bx=16+i.I(1,4)*6, r=12+i.I(2,3)*3;
      s+=P(bx,31,p.att,'',p.attTxt)+Ball(bx+4.5,31,p.ball,p.line);
      const np=2+i.I(3,2);
      const pr=[[bx+28,16],[bx+28,46],[bx+20,31]].slice(0,np);
      pr.forEach((q,k)=>s+=Df(q[0],q[1]+i.J(10+k,3),p.def));
      s+=`<circle cx="${bx+4}" cy="31" r="${r}" fill="none" stroke="${p.def}" stroke-width=".8" stroke-dasharray="2.5 2"/>`;
      pr.forEach(q=>s+=Arr(q[0]-2,q[1]+(q[1]>31?-2:(q[1]<31?2:0)),bx+8,31+(q[1]>31?4:(q[1]<31?-4:0)),p.arrow,false,'ar'));
      if(i.I(4,2)) s+=P(70,20,p.att,'',p.attTxt)+P(70,44,p.att,'',p.attTxt);
      else s+=P(74,31,p.att,'',p.attTxt)+Arr(72,28,60,22,p.pass,true,'ap');
      return s;},

    /* rozohrávka od brankára — počet hráčov podľa formátu */
    buildup(p,i){let s='';
      s+=Goal(6,31,18,p.goal,true)+GK(14,31,p.goal)+Ball(18,31,p.ball,p.line);
      const na=Math.max(3,Math.min(i.a||4,7));
      const A=squad(na,30,16,i,10);
      A.forEach(q=>s+=P(q[0],q[1],p.att,'',p.attTxt));
      const nd=Math.max(1,Math.min(i.b||2,4));
      const cand=[[46,14],[46,48],[60,31],[60,10],[60,52],[72,20],[72,42],[52,31]]
        .map((q,k)=>[q[0]+i.J(30+k,2),q[1]+i.J(40+k,2)]);
      avoid(cand,A,nd).forEach(q=>s+=Df(q[0],q[1],p.def));
      s+=Arr(20,30,A[0][0]-4,A[0][1],p.pass,true,'ap');
      if(A[1]) s+=link(A[0],A[1],p.pass,true,'ap');
      if(i.I(5,3)===0){s+=Goal(96,31,16,p.goal,true);}
      else {s+=Cone(88,20,p.cone)+Cone(88,42,p.cone);}
      const last=A[A.length-1];
      s+=Arr(last[0]+4,last[1],86,31,p.pass,true,'ap');return s;},

    /* rohový kop */
    corner(p,i){let s='';const flip=i.I(1,2)===1, X=x=>flip?100-x:x;
      s+=Goal(50,6,24,p.goal)+GK(50,12,p.goal)+box(50,6,46,20,p);
      s+=`<path d="M${X(6)} 6 A 7 7 0 0 ${flip?1:0} ${X(13)} 13" fill="none" stroke="${p.line}" stroke-width=".8"/>`;
      s+=P(X(8),10,p.att,'',p.attTxt)+Ball(X(12.5),13,p.ball,p.line);
      const near=i.I(2,2)===1;
      s+=Arr(X(15),14,X(near?38:52),near?14:18,p.pass,true,'ap');
      const nb=3+i.I(3,3);
      [[34,30],[50,32],[64,28],[50,44],[70,40]].slice(0,nb)
        .forEach((q,k)=>s+=P(X(q[0]),q[1]+i.J(10+k,2.5),p.att,'',p.attTxt));
      const nd=2+i.I(4,2);
      [[40,24],[58,24],[50,20]].slice(0,nd).forEach(q=>s+=Df(X(q[0]),q[1],p.def));
      s+=Arr(X(34),27,X(42),17,p.arrow,false,'ar')+Arr(X(64),25,X(58),16,p.arrow,false,'ar');
      if(i.I(5,3)===0) s+=P(X(20),44,p.att,'',p.attTxt);
      return s;},

    /* priamy kop s múrom */
    freekick(p,i){let s='';
      s+=Goal(50,6,24,p.goal)+GK(46+i.I(1,3)*2,12,p.goal)+box(50,6,46,20,p);
      const nw=3+i.I(2,3), wx=50-(nw-1)*2.5+i.J(3,4), wy=26+i.I(4,3)*2;
      for(let k=0;k<nw;k++) s+=Df(wx+k*5,wy,p.def);
      const bx=44+i.I(5,4)*4;
      s+=P(bx-4,50,p.att,'',p.attTxt)+Ball(bx,49,p.ball,p.line);
      const cx=bx+(i.I(6,2)?12:-12);
      s+=`<path d="M${bx} 48 Q ${cx} 28 ${55} 10" fill="none" stroke="${p.pass}" stroke-width="1.05" marker-end="url(#ap)"/>`;
      if(i.I(7,3)!==0) s+=P(70,44,p.att,'',p.attTxt)+Arr(68,41,60,34,p.arrow,true,'ar');
      return s;},

    /* aut */
    throwin(p,i){let s='';const flip=i.I(1,2)===1, X=x=>flip?100-x:x;
      s+=`<line x1="${X(10)}" y1="6" x2="${X(10)}" y2="56" stroke="${p.line2}" stroke-width="1.1"/>`;
      const ty=24+i.I(2,3)*7;
      s+=P(X(10),ty,p.att,'',p.attTxt)+Ball(X(10),ty-5,p.ball,p.line);
      const sup=[[34,ty-15],[34,ty+15],[56,ty]].slice(0,2+i.I(3,2));
      sup.forEach((q,k)=>s+=P(X(q[0]),Math.max(10,Math.min(52,q[1]+i.J(10+k,3))),p.att,'',p.attTxt));
      s+=Df(X(46),ty-9,p.def);
      s+=Arr(X(14),ty-2,X(31),ty-14,p.pass,true,'ap')+Arr(X(14),ty+2,X(31),ty+14,p.pass,true,'ap');
      s+=Arr(X(37),ty+13,X(54),ty+3,p.arrow,false,'ar');
      if(i.I(4,2)) s+=Goal(X(96),31,14,p.goal,true);
      return s;},

    /* krytie lopty v štvorci */
    grid(p,i){let s='';
      const w=[48,40,56,44][i.I(1,4)], x=(100-w)/2, h=[38,32,44][i.I(2,3)], y=(62-h)/2;
      s+=Zone(x,y,w,h,p,true);
      [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(q=>s+=Cone(q[0],q[1],p.cone));
      const ax=44+i.J(3,5), ay=31+i.J(4,5);
      s+=P(ax,ay,p.att,'',p.attTxt)+Ball(ax+4.5,ay+1.5,p.ball,p.line)+Df(ax+12,ay+i.J(5,4),p.def);
      if(i.I(6,3)===1) s+=Df(ax-8,ay+5,p.def);
      if(i.I(7,3)===0) s+=P(x+3,y+h-3,p.att,'',p.attTxt);
      s+=Arr(ax-3,ay-4,ax-10,ay-11,p.arrow,false,'ar');return s;}
  };

  /* ---------------- výber šablóny ---------------- */
  /* [kľúč, regex, priorita] — špecifické šablóny majú vyššiu prioritu než generické */
  const RULES=[
    ['throwin',  /vhadzov|\baut\b|autov/, 1.8],
    ['freekick', /priam[yý] kop|múr z|cez múr|voľn[ýy] kop/, 1.8],
    ['corner',   /roh(ov[ýé]|u|y)?\s*kop|rohov|nábeh na (prednú|zadnú)|štandard/, 1.5],
    ['buildup',  /rozohrávk|rozohráv|zaklada|od brankára|brankár.*rozohr|4\+gk/, 1.6],
    ['press',    /counter-press|counterpress|pressing|presing|spúšťa|napádan|rest defence|6 sekúnd|zisk lopty do/, 1.5],
    ['rondo',    /\brondo\b|\brondá\b|\brond[eu]\b/, 2.0],
    ['gk1v1',    /1v1 s brankár|sám na brankára|rieši brankára|proti vybiehajúcemu brankár|obídení brankár/, 2.0],
    ['duelWave', /\bvln[ay]?\b|rad útočník|rad obranc|striedavo.*bránk/, 2.0],
    ['cross',    /center|centri|centr(uje|om|y)|spätn[áúej]+ prihrávk|na prednú|zadnú tyč|na tyče|krídl.*center/, 1.7],
    ['offside',  /ofsajd|vysok[áúa] líni|drž.*líniu/, 1.7],
    ['mastery',  /ball mastery|žonglov|podrážk.*prešľap|séria: podrážky/, 1.8],
    ['tag',      /naháňačk|lovec|rybár|vypichnú|zbieran|poklad|kráľ zvierat|vlci|vlk|krokodíl/, 1.8],
    ['gates',    /farebn[éý].*(brán|mét)|brán[ay] danej farby|prejsť bránou|cez most|mostom|mosty|semafor|zavolá farbu|ukáže farb/, 1.7],
    ['channel',  /koridor|v koridore|prejsť.*čiar.*súper/, 1.6],
    ['duel',     /1v1 na (dve|tri|štyri)|súboj na štyri|turnaj 1v1|turnaj súboj/, 2.4],
    ['ssg4',     /štyri (malé )?bránk|štyroch bránok|4 (malé )?bránk|na 4 bránky/, 1.8],
    ['targetZone',/cieľov[ýáéu][a-z]*\s*(zón|líni|čiar)|za líniu|za súperovu líniu|dovedie.*za|cieľovej zóne/, 1.5],
    ['pivot',    /pivot|cieľov[ýe] hráč|\bchrbtom\b|hrot|otoč.*chrbtom|medzi líniami/, 1.6],
    ['wall',     /narážačk|dá-bež|prihraj a bež|na tretieho|wall pass/, 1.6],
    ['rondo',    /rondo|\d+v\d+ v štvorci|kruh|držan.*lopt|udržan\w* lopt|na udržanie|udrž.*prihráv/, 1.3],
    ['positional',/poziční|pozičn|neutrál|obsadenie priestoru|\d+v\d+\s*\+\s*\d/, 1.5],
    ['zones',    /tri zón|troch zón|štyri zón|cez zón|cez všetky.*zón|postup.*zón|prechod.*zón|zóny vpred/, 1.4],
    ['block',    /\bblok\b|priestorov|obrann[áéy]|posun bloku|kompakt|istenie|bránen|bráň |brániť|tieň|medzi loptu a svoju|za úrovňou lopty|isť[ií]|zomkn/, 1.3],
    ['through',  /kolmic|prienikov|prienik|do behu|za obranu|za chrbát|medzi líniami/, 1.2],
    ['shoot',    /zakonč|strel(a|y|ba|ou)|volej|finish|na bránu/, 1.1],
    ['slalom',   /slalom|\bvedeni|\bvedie|dribl|prekáž|pretek|štafet|koordina/, 1.1],
    ['grid',     /kryti|chráň|chrán|mriežk|štvorc|súboj o loptu|chrániť/, 1.1],
    ['duel',     /1v1|duel|súboj|kľučk|zaseká|obísť|prekona|zrkadl|dvere/, 0.9],
    ['pass3',    /prihráv|prihrá|spracov|prvý dotyk|jeden dotyk|otvor.*telo|skenov/, 0.8],
    ['ssg',      /hra|zápas|ssg|malá hra|voľná hra|\dv\d/, 0.45],
  ];
  const WEIGHT={name:5,theme:2,setup:2,steps:1,coach:1};
  function pick(ex){
    const f={name:(ex.name||'').toLowerCase(),theme:(ex.theme||'').toLowerCase(),
             setup:(ex.setup||'').toLowerCase(),steps:(ex.steps||'').toLowerCase(),
             coach:((ex.coach||'')+' '+(ex.constraints||'')).toLowerCase()};
    let best=null,bs=0;
    for(const [key,re,prio] of RULES){
      let sc=0;
      for(const k in WEIGHT) if(re.test(f[k])) sc+=WEIGHT[k];
      sc*=(prio||1);
      if(sc>bs){bs=sc;best=key;}
    }
    if(best) return best;
    return ex.phase==='ZČ'?'ssg':(ex.phase==='PČ'?'slalom':'pass3');
  }

  function drillSVG(ex,opts){
    const o=opts||{}; const p=PAL[o.theme==='light'?'light':'dark'];
    const i=info(ex||{}); const key=pick(ex||{});
    const scene=(T[key]||T.ssg)(p,i);
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nákres cviku">
      <defs>
        <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto-start-reverse">
          <path d="M0 1L9 5L0 9z" fill="${p.arrow}"/></marker>
        <marker id="ap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto-start-reverse">
          <path d="M0 1L9 5L0 9z" fill="${p.pass}"/></marker>
      </defs>
      <rect x="0" y="0" width="${W}" height="${H}" rx="3" fill="${p.pitch}"/>
      <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="2" fill="none" stroke="${p.line}" stroke-width=".9"/>
      ${scene}
    </svg>`;
  }
  const legendItems=[['att','Útočiaci hráč'],['def','Brániaci hráč'],['neu','Neutrálny hráč'],
    ['cone','Kužeľ / méta'],['pass','Prihrávka'],['arrow','Pohyb hráča / vedenie']];

  const api={drillSVG,pick,PAL,legendItems,templates:Object.keys(T)};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Diagram=api;
})(typeof window!=='undefined'?window:globalThis);
