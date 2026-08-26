/* =========================================================================
   Zostava — stavba scén pre nákresy cvikov.

   Každý cvik má v `data/scenes/*.json` vlastný predpis, napr.
     "E001": {"shape":"gates","w":25,"h":20,"gates":4,"att":6}

   Predpis hovorí, čo na nákrese je. Rozostavenie dopočíta staviteľ tvaru
   nižšie — hráčov rozloží tak, aby nestáli na sebe, a šípky vedie len tam,
   kde je čisto (nie cez hráča, nie kratšie než 4 m). Výsledok prejde
   kontrolou `render.validate()`; ak neprejde, skúsi sa iné rozloženie.

   Nič sa nehádа z textu cviku — predpis je napísaný ku každému cviku ručne.
   ========================================================================= */
(function(root){

  /* deterministický generátor — rovnaký cvik má vždy rovnaký nákres */
  function rnd(str){
    let h=2166136261>>>0;
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
    return function(){h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);
      t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  }
  const lerp=(a,b,t)=>a+(b-a)*t;
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const round=v=>Math.round(v*10)/10;

  /* vzdialenosť bodu od úsečky */
  function segDist(p,a,b){
    const L=(b[0]-a[0])**2+(b[1]-a[1])**2;
    if(!L) return dist(p,a);
    let t=((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/L;
    t=Math.max(0,Math.min(1,t));
    return dist(p,[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t]);
  }

  /* rozostavenie bez toho, aby hráči stáli na sebe */
  function spread(pts,minD,lo,hi,R){
    const P=pts.map(q=>q.slice());
    for(let it=0;it<160;it++){
      let moved=false;
      for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){
        const d=dist(P[i],P[j]);
        if(d<minD&&d>0.001){
          const k=(minD-d)/d/2;
          const dx=(P[i][0]-P[j][0])*k, dy=(P[i][1]-P[j][1])*k;
          P[i][0]+=dx;P[i][1]+=dy;P[j][0]-=dx;P[j][1]-=dy;moved=true;
        }
      }
      P.forEach(q=>{q[0]=Math.max(lo[0],Math.min(hi[0],q[0]));
                    q[1]=Math.max(lo[1],Math.min(hi[1],q[1]));});
      if(!moved) break;
    }
    return P.map(q=>[round(q[0]),round(q[1])]);
  }

  /* -------------------------------------------------------------------------
     Výber akcií. Prihrávka sa vedie len tam, kde je čisto — pomedzi hráčov,
     nie cez nich, a dve šípky sa nikdy neprekrížia ani sa nevracajú späť.
     Preto nákres nevyzerá ako klbko čiar.
  ------------------------------------------------------------------------- */
  const CLEAR=2.2, MINLEN=4.2;

  function segInt(a,b,c,d){
    const s=(p,q,r)=>Math.sign((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]));
    if(dist(a,c)<0.2||dist(a,d)<0.2||dist(b,c)<0.2||dist(b,d)<0.2) return false;
    return s(a,b,c)!==s(a,b,d) && s(c,d,a)!==s(c,d,b);
  }
  function clearLine(a,b,all,skip){
    if(dist(a,b)<MINLEN) return false;
    for(let i=0;i<all.length;i++){
      if(skip.indexOf(i)>=0) continue;
      if(segDist(all[i],a,b)<CLEAR) return false;
    }
    return true;
  }
  /* uhol lomu — prihrávka sa nesmie vracať tam, odkiaľ prišla */
  function turnOk(prev,a,b){
    if(!prev) return true;
    const u=[a[0]-prev[0],a[1]-prev[1]], v=[b[0]-a[0],b[1]-a[1]];
    const lu=Math.hypot(u[0],u[1])||1, lv=Math.hypot(v[0],v[1])||1;
    return (u[0]*v[0]+u[1]*v[1])/(lu*lv) > -0.35;
  }

  /* reťaz prihrávok medzi útočníkmi, pokiaľ možno smerom dopredu */
  function passChain(att,def,startIdx,count,fwd,R,neigh){
    const all=att.concat(def);
    const chain=[startIdx], segs=[];
    let cur=startIdx, prev=null;
    for(let n=0;n<count;n++){
      const cand=[];
      for(let i=0;i<att.length;i++){
        if(chain.indexOf(i)>=0) continue;
        if(neigh&&neigh(cur,i)===false) continue;
        if(!clearLine(att[cur],att[i],all,[cur,i])) continue;
        if(!turnOk(prev,att[cur],att[i])) continue;
        if(segs.some(([c,d])=>segInt(att[cur],att[i],c,d))) continue;
        const gain=att[i][0]-att[cur][0];
        if(fwd&&gain<-1.5) continue;
        cand.push({i,score:(fwd?gain*1.5:0)-Math.abs(dist(att[cur],att[i])-9)*0.5+R()*1.2});
      }
      if(!cand.length) break;
      cand.sort((a,b)=>b.score-a.score);
      segs.push([att[cur],att[cand[0].i]]);
      prev=att[cur]; cur=cand[0].i; chain.push(cur);
    }
    return chain;
  }

  function actsFromChain(att,chain,kind){
    const A=[];
    for(let i=1;i<chain.length;i++)
      A.push({k:kind||'pass', p:[att[chain[i-1]],att[chain[i]]], n:i});
    return A;
  }

  /* -------------------------------------------------------------------------
     Rozostavenie. Družstvo nestojí náhodne — má tvar, ktorý dáva vo futbale
     zmysel (trojuholník, kosoštvorec, 2-3-1). Súper stojí oproti nemu.
  ------------------------------------------------------------------------- */
  const SHAPE_ATT={
    1:[[0.20,0.50]],
    2:[[0.18,0.32],[0.18,0.68]],
    3:[[0.14,0.50],[0.44,0.22],[0.44,0.78]],
    4:[[0.12,0.50],[0.40,0.20],[0.40,0.80],[0.68,0.50]],
    5:[[0.10,0.50],[0.34,0.20],[0.34,0.80],[0.62,0.32],[0.62,0.68]],
    6:[[0.10,0.34],[0.10,0.66],[0.38,0.18],[0.38,0.82],[0.66,0.34],[0.66,0.66]],
    7:[[0.09,0.50],[0.30,0.20],[0.30,0.80],[0.52,0.36],[0.52,0.64],[0.76,0.24],[0.76,0.76]],
    8:[[0.08,0.34],[0.08,0.66],[0.30,0.16],[0.30,0.84],[0.52,0.38],[0.52,0.62],[0.76,0.26],[0.76,0.74]]
  };
  const anchors=n=>SHAPE_ATT[Math.max(1,Math.min(8,n))]||SHAPE_ATT[8];

  function layout(n,w,h,mirror,R,box){
    const B=box||[0.06,0.10,0.94,0.90];
    return anchors(n).map(([x,y])=>{
      const X=mirror?1-x:x;
      return [round(lerp(B[0],B[2],X)*w + (R()-0.5)*w*0.03),
              round(lerp(B[1],B[3],y)*h + (R()-0.5)*h*0.04)];
    });
  }

  /* -------------------------------------------------------------------------
     Staviteľia tvarov
  ------------------------------------------------------------------------- */
  const SHAPES={};

  /* rondo — útočníci po obvode, obrancovia v strede, prihrávka len k susedovi */
  SHAPES.rondo=function(s,R){
    const w=s.w,h=s.h,na=s.att||5,nd=s.def||2, in_=Math.min(2.0,Math.min(w,h)*0.14);
    const per=[], cw=w-in_*2, ch=h-in_*2, L=2*(cw+ch), off=(s.rot||0.02)*L;
    for(let i=0;i<na;i++){
      let t=(off+(i/na)*L)%L, x,y;
      if(t<cw){x=in_+t;y=in_;}
      else if(t<cw+ch){x=w-in_;y=in_+(t-cw);}
      else if(t<2*cw+ch){x=w-in_-(t-cw-ch);y=h-in_;}
      else {x=in_;y=h-in_-(t-2*cw-ch);}
      per.push([round(x),round(y)]);
    }
    const dfs=[];
    for(let i=0;i<nd;i++){
      const a=(i/nd)*Math.PI*2+0.7, r=Math.min(w,h)*(nd>2?0.20:0.15);
      dfs.push([round(w/2+Math.cos(a)*r), round(h/2+Math.sin(a)*r)]);
    }
    const players=per.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+1}))
      .concat(dfs.map(q=>({x:q[0],y:q[1],t:'d'})));
    /* len k susedovi po obvode alebo cez jedného — nie cez celý štvorec */
    const neigh=(a,b)=>{const d=Math.min((b-a+na)%na,(a-b+na)%na); return d>=1&&d<=2;};
    const chain=passChain(per,dfs,0,Math.min(3,na-1),false,R,neigh);
    return {w,h,marks:'none',players,balls:[nearBall(per[0],per[chain[1]!=null?chain[1]:0])],
            acts:actsFromChain(per,chain)};
  };

  /* držanie lopty — dve družstvá v tvare, prípadne neutráli na stranách */
  SHAPES.grid=function(s,R){
    const w=s.w,h=s.h,na=s.att||4,nd=s.def||4,nn=s.neu||0;
    const box=s.box||[0.07,0.12,0.93,0.88];
    const A=layout(na,w,h,false,R,box);
    const D=layout(nd,w,h,true,R,[Math.max(box[0],0.30),box[1],box[2],box[3]]);
    const N=[];
    for(let i=0;i<nn;i++){
      const k=Math.floor(i/2), rows=Math.max(1,Math.ceil(nn/2));
      N.push([round(lerp(w*0.30,w*0.72,rows<2?0.5:k/(rows-1))), round(i%2?h-1.5:1.5)]);
    }
    const S1=spread(A.concat(D).concat(N),4.4,[1.6,1.4],[w-1.6,h-1.4],R);
    const a=S1.slice(0,na), d=S1.slice(na,na+nd), nz=S1.slice(na+nd);
    const players=a.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+1}))
      .concat(d.map(q=>({x:q[0],y:q[1],t:'d'})))
      .concat(nz.map(q=>({x:q[0],y:q[1],t:'n'})));
    const targets=a.concat(nz);
    const chain=passChain(targets,d,0,Math.min(3,targets.length-1),true,R);
    return {w,h,marks:s.marks||'none',players,
            balls:[nearBall(targets[0],targets[chain[1]!=null?chain[1]:0])],
            acts:actsFromChain(targets,chain)};
  };

  /* hra na cieľové zóny — bod za prienik do zóny súpera */
  SHAPES.zones=function(s,R){
    const w=s.w,h=s.h,zw=s.zoneW||Math.max(2.5,Math.round(w*0.1));
    const inner=(zw+1.2)/w;
    const g=SHAPES.grid({w,h,att:s.att||4,def:s.def||4,neu:s.neu||0,
                         box:[inner,0.12,1-inner,0.88]},R);
    g.zones=[{x:0,y:0,w:zw,h:h,label:s.labelL||'cieľová zóna',tone:'target'},
             {x:w-zw,y:0,w:zw,h:h,label:s.labelR||'cieľová zóna',tone:'target'}];
    const last=g.acts[g.acts.length-1];
    if(last){
      const from=last.p[1], all=g.players.map(q=>[q.x,q.y]);
      const to=aim(from,w-zw*0.5,2.6,h-2.6,all,R);
      if(to) g.acts.push({k:s.into||'drib', p:[from,to], n:g.acts.length+1});
    }
    return g;
  };

  /* prípravná hra / zápas na dve bránky s brankármi */
  SHAPES.ssg=function(s,R){
    const w=s.w,h=s.h,gw=s.goalW||(w>44?7:5);
    const g=SHAPES.grid({w,h,att:s.att||4,def:s.def||4,neu:s.neu||0,
                         box:[0.09,0.14,0.86,0.86]},R);
    g.marks=s.marks||(w>=45?'half':'none');
    g.goals=[{x:0,y:h/2,w:gw,side:'l',gk:s.gk!==false},
             {x:w,y:h/2,w:gw,side:'r',gk:s.gk!==false}];
    const last=g.acts[g.acts.length-1];
    if(last&&s.shot!==false){
      const from=last.p[1], all=g.players.map(q=>[q.x,q.y]);
      const to=(from[0]>w*0.5)?aim(from,w-0.5,h/2-gw*0.4,h/2+gw*0.4,all,R):null;
      if(to&&dist(from,to)<=Math.max(16,w*0.42)) g.acts.push({k:'shot',p:[from,to],n:g.acts.length+1});
    }
    return g;
  };

  /* zakončenie na jednu bránku — útok hrá zdola nahor proti obrane a brankárovi */
  SHAPES.finish=function(s,R){
    const w=s.w,h=s.h,gw=s.goalW||7,na=s.att||3,nd=s.def||2;
    const A=layout(na,h,w,false,R,[0.10,0.10,0.62,0.90]).map(q=>[q[1],round(h-q[0])]);
    const D=layout(nd,h,w,true, R,[0.40,0.16,0.80,0.84]).map(q=>[q[1],round(h-q[0])]);
    const S1=spread(A.concat(D),4.6,[2.2,2.2],[w-2.2,h-2.2],R);
    const a=S1.slice(0,na), d=S1.slice(na);
    const players=a.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+1}))
      .concat(d.map(q=>({x:q[0],y:q[1],t:'d'})));
    const acts=[];
    const up=(x,y)=>[x,y];
    const chain=passChain(a,d,0,Math.min(2,na-1),false,R);
    for(let i=1;i<chain.length;i++) acts.push({k:'pass',p:[a[chain[i-1]],a[chain[i]]],n:i});
    const carrier=a[chain[chain.length-1]];
    const shotFrom=[round(lerp(carrier[0],w/2,0.6)), round(Math.max(h*0.14,carrier[1]-h*0.32))];
    if(dist(carrier,shotFrom)>=MINLEN) acts.push({k:'run',p:[carrier,shotFrom],n:acts.length+1});
    const src=acts.length&&acts[acts.length-1].k==='run'?shotFrom:carrier;
    const all=players.map(q=>[q.x,q.y]);
    let goalPt=null;
    for(let i=0;i<9;i++){
      const c=[round(w/2+(i===0?0:(R()-0.5)*gw*0.7)), 0.5];
      if(dist(src,c)>=MINLEN&&all.every(q=>dist(q,src)<0.6||segDist(q,src,c)>CLEAR)){goalPt=c;break;}
    }
    if(goalPt) acts.push({k:'shot',p:[src,goalPt],n:acts.length+1});
    return {w,h,marks:s.marks||'box',goals:[{x:w/2,y:0,w:gw,side:'t',gk:s.gk!==false}],
            players,balls:[nearBall(a[chain[0]],a[chain[1]]||shotFrom)],acts};
  };

  /* centre z krídla */
  SHAPES.cross=function(s,R){
    const w=s.w,h=s.h,gw=s.goalW||7, rt=(s.side||'r')==='r', sg=rt?1:-1;
    const wing=[round(rt?w-4:4), round(h*0.84)];
    const up=[round(rt?w-4.5:4.5), round(h*0.44)];
    const boxPt=[round(w/2+sg*gw*0.5), round(h*0.19)];
    const runner=[round(w/2+sg*w*0.19), round(h*0.55)];
    const far=[round(w/2-sg*w*0.16), round(h*0.42)];
    const edge=[round(w/2+sg*w*0.04), round(h*0.7)];
    const players=[{x:wing[0],y:wing[1],t:'a',n:1},{x:runner[0],y:runner[1],t:'a',n:2},
                   {x:far[0],y:far[1],t:'a',n:3},{x:edge[0],y:edge[1],t:'a',n:4},
                   {x:round(rt?w-9:9),y:round(h*0.72),t:'d'},
                   {x:round(w/2-sg*w*0.06),y:round(h*0.3),t:'d'}];
    return {w,h,marks:'box',goals:[{x:w/2,y:0,w:gw,side:'t',gk:s.gk!==false}],players,
      balls:[nearBall(wing,up)],
      acts:[{k:'drib',p:[wing,up],n:1},
            {k:'pass',p:[up,boxPt],n:2},
            {k:'run', p:[runner,boxPt],n:3},
            {k:'shot',p:[boxPt,[round(w/2-sg*gw*0.25),0.5]],n:4}]};
  };

  /* súboj 1v1 / 2v1 / 2v2 na malé bránky */
  SHAPES.duel=function(s,R){
    const w=s.w,h=s.h,na=s.att||1,nd=s.def||1,gw=s.goalW||3;
    const one=(s.goals===1);
    const goals=one?[{x:w,y:h/2,w:gw+1.5,side:'r',gk:!!s.gk}]
                   :[{x:w,y:round(h*0.26),w:gw,side:'r'},{x:w,y:round(h*0.74),w:gw,side:'r'}];
    const A=[],D=[];
    for(let i=0;i<na;i++) A.push([round(w*0.16), round(h*(na===1?0.5:0.3+0.4*i))]);
    for(let i=0;i<nd;i++) D.push([round(w*0.58), round(h*(nd===1?0.5:0.32+0.36*i))]);
    const players=A.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+1}))
      .concat(D.map(q=>({x:q[0],y:q[1],t:'d'})));
    const gi=one?0:(R()<0.5?0:1);
    const side=one?(R()<0.5?-1:1):(gi?1:-1);
    const mid=[round(lerp(A[0][0],w*0.82,0.5)), round(Math.max(2.5,Math.min(h-2.5,D[0][1]+side*Math.max(4,h*0.26))))];
    const end=[round(w-1.0), round(goals[gi].y)];
    const acts=[{k:'drib',p:[A[0],mid],n:1}];
    if(dist(mid,end)>=MINLEN) acts.push({k:'drib',p:[mid,end],n:2});
    return {w,h,marks:'none',goals,
            cones:s.cones||[[round(w*0.07),2],[round(w*0.07),round(h-2)]],
            players,balls:[nearBall(A[0],mid)],acts};
  };

  /* vedenie lopty cez brány z mét */
  SHAPES.gates=function(s,R){
    const w=s.w,h=s.h,n=s.gates||4,np=Math.min(s.att||6,6),gwd=s.gateW||2.4;
    const cols=Math.min(3,Math.ceil(n/2)), rows=Math.ceil(n/cols);
    const gates=[];
    for(let i=0;i<n;i++){
      const c=i%cols, r=Math.floor(i/cols);
      gates.push({x:round(lerp(w*0.30,w*0.80,cols<2?0.5:c/(cols-1))),
                  y:round(lerp(h*0.24,h*0.76,rows<2?0.5:r/(rows-1))),
                  w:gwd,dir:(i%2)?'h':'v'});
    }
    const P=[];
    for(let i=0;i<np;i++) P.push([round(w*0.10), round(lerp(h*0.14,h*0.86,np<2?0.5:i/(np-1)))]);
    const players=P.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+1}));
    const g0=gates[0], from=P[Math.min(1,P.length-1)];
    const thru=[g0.x,g0.y];
    const on=[round(Math.min(w-1.5,g0.x+6)), round(Math.max(1.8,Math.min(h-1.8,g0.y+(R()-0.5)*4)))];
    const acts=[];
    if(dist(from,thru)>=MINLEN) acts.push({k:'drib',p:[from,thru],n:1});
    if(dist(thru,on)>=MINLEN) acts.push({k:'drib',p:[thru,on],n:acts.length+1});
    return {w,h,marks:'none',gates,players,balls:P.map(q=>[round(q[0]+1.3),q[1]]),acts};
  };

  /* nacvičená kombinácia cez stanovištia */
  SHAPES.pattern=function(s,R){
    const w=s.w,h=s.h,st=Math.max(3,s.stations||4);
    const pts=[];
    for(let i=0;i<st;i++){
      const t=i/(st-1);
      pts.push([round(lerp(w*0.10,w*0.88,t)),
                round(h*0.5+Math.sin(t*Math.PI*(s.zig||1))*h*(i%2?0.30:-0.30))]);
    }
    const players=pts.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+1}));
    const acts=[];
    for(let i=1;i<pts.length;i++)
      if(dist(pts[i-1],pts[i])>=MINLEN) acts.push({k:'pass',p:[pts[i-1],pts[i]],n:acts.length+1});
    return {w,h,marks:s.marks||'none',mann:s.mann||[],cones:s.cones||[],
            players,balls:[nearBall(pts[0],pts[1])],acts};
  };

  /* presing — po prihrávke súpera vybieha obrana na loptu */
  SHAPES.press=function(s,R){
    const w=s.w,h=s.h,zx=s.zoneX!=null?s.zoneX:round(w*0.55);
    const g=SHAPES.grid({w,h,att:s.att||4,def:s.def||3,neu:0,box:[0.08,0.14,0.90,0.86]},R);
    g.zones=[{x:zx,y:0,w:s.zoneW||round(w-zx),h,label:s.label||'zóna presingu',tone:'own'}];
    /* nechaj len prvú prihrávku a k nej výbeh dvoch obrancov */
    const first=g.acts[0];
    if(first){
      const recv=first.p[1];
      const ds=g.players.filter(p=>p.t==='d')
        .sort((a,b)=>dist([a.x,a.y],recv)-dist([b.x,b.y],recv)).slice(0,2);
      const acts=[Object.assign({},first,{n:1})];
      ds.forEach(D=>{
        const L=dist([D.x,D.y],recv)||1;
        const ux=(D.x-recv[0])/L, uy=(D.y-recv[1])/L;
        /* posuň obrancu tak, aby mal odkiaľ vybehnúť (aspoň 8 m od lopty) */
        const back=Math.max(L,8.2);
        D.x=round(Math.max(1.5,Math.min(w-1.5,recv[0]+ux*back)));
        D.y=round(Math.max(1.5,Math.min(h-1.5,recv[1]+uy*back)));
        const L2=dist([D.x,D.y],recv)||1, keep=L2-2.8;
        const to=[round(D.x+(recv[0]-D.x)/L2*keep), round(D.y+(recv[1]-D.y)/L2*keep)];
        if(dist([D.x,D.y],to)>=3.2) acts.push({k:'run',p:[[D.x,D.y],to],n:acts.length+1});
      });
      g.acts=acts;
    }
    return g;
  };

  /* namier akciu na zvislý cieľ (zóna, bránka) tak, aby čiara nešla cez hráča */
  function aim(from,x,ymin,ymax,all,R){
    if(x<=from[0]+2.5) return null;
    const cand=[];
    for(let i=0;i<=10;i++) cand.push(round(lerp(ymin,ymax,i/10)));
    cand.sort((a,b)=>Math.abs(a-from[1])-Math.abs(b-from[1]));
    for(const y of cand){
      const to=[round(x),y];
      if(dist(from,to)<MINLEN) continue;
      if(all.every(q=>dist(q,from)<0.6||segDist(q,from,to)>CLEAR)) return to;
    }
    return null;
  }

  function nearBall(a,b){
    if(!a) return [0,0];
    if(!b) return [round(a[0]+1.3),round(a[1])];
    const L=dist(a,b)||1;
    return [round(a[0]+(b[0]-a[0])/L*1.35), round(a[1]+(b[1]-a[1])/L*1.35)];
  }

  /* -------------------------------------------------------------------------
     Postav scénu podľa predpisu. Ak nákres neprejde kontrolou, skúsi sa
     iné rozloženie (iný seed) — až osemkrát; potom sa vráti to najlepšie.
  ------------------------------------------------------------------------- */
  /* polia, ktoré sa dajú v predpise zadať priamo (prebijú staviteľa tvaru) */
  const OVERRIDE=['marks','zones','cones','mann','players','balls','acts','dims','note'];

  function build(spec,key,validate){
    const fn=SHAPES[spec.shape];
    if(!fn) throw new Error('neznámy tvar nákresu: '+spec.shape);
    let best=null,bestErr=null;
    for(let i=0;i<8;i++){
      const sc=fn(spec,rnd((key||'x')+'#'+i));
      /* čokoľvek z predpisu sa dá dokresliť alebo prebiť ručne */
      OVERRIDE.forEach(k=>{ if(spec[k]!==undefined) sc[k]=spec[k]; });
      const err=validate?validate(sc):[];
      if(!err.length) return sc;
      if(best===null||err.length<bestErr.length){best=sc;bestErr=err;}
    }
    best.__err=bestErr;
    return best;
  }

  const api={build,SHAPES,rnd};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Scenes=api;
})(typeof window!=='undefined'?window:globalThis);
