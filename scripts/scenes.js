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
  /* každý cvik má vlastný seed — dva rovnako zadané cviky sa tak mierne líšia */
  const jit=(R,m)=>(R()-0.5)*2*(m==null?0.7:m);
  const jp=(R,q,m)=>[round(q[0]+jit(R,m)),round(q[1]+jit(R,m))];

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
  /* na veľkom ihrisku je aj „krátka“ prihrávka dlhá — inak nákres zhustne */
  const minLen=(w,h)=>Math.max(MINLEN,Math.min(9.5,Math.min(w,h)*0.22));

  function segInt(a,b,c,d){
    const s=(p,q,r)=>Math.sign((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]));
    if(dist(a,c)<0.2||dist(a,d)<0.2||dist(b,c)<0.2||dist(b,d)<0.2) return false;
    return s(a,b,c)!==s(a,b,d) && s(c,d,a)!==s(c,d,b);
  }
  function clearLine(a,b,all,skip,ml){
    if(dist(a,b)<(ml||MINLEN)) return false;
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
  function passChain(att,def,startIdx,count,fwd,R,neigh,ml){
    const all=att.concat(def);
    const chain=[startIdx], segs=[];
    let cur=startIdx, prev=null;
    for(let n=0;n<count;n++){
      const cand=[];
      for(let i=0;i<att.length;i++){
        if(chain.indexOf(i)>=0) continue;
        if(neigh&&neigh(cur,i)===false) continue;
        if(!clearLine(att[cur],att[i],all,[cur,i],ml)) continue;
        if(!turnOk(prev,att[cur],att[i])) continue;
        if(segs.some(([c,d])=>segInt(att[cur],att[i],c,d))) continue;
        const gain=att[i][0]-att[cur][0];
        if(fwd&&gain<-1.5) continue;
        cand.push({i,score:(fwd?gain*1.5:0)-Math.abs(dist(att[cur],att[i])-(ml||MINLEN)*1.6)*0.5+R()*1.2});
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
    const per=[], cw=w-in_*2, ch=h-in_*2, L=2*(cw+ch), off=((s.rot!=null?s.rot:R()*0.22))*L;
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
      const a=(i/nd)*Math.PI*2+0.7+R()*0.9, r=Math.min(w,h)*(nd>2?0.20:0.15)*(0.85+R()*0.3);
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
    const chain=passChain(targets,d,0,Math.min(3,targets.length-1),true,R,null,minLen(w,h));
    const gw=s.goalW||(w>44?7:5);
    return {w,h,marks:s.marks||'none',players,
            goals:s.gk?[{x:0,y:h/2,w:gw,side:'l',gk:true},{x:w,y:h/2,w:gw,side:'r',gk:true}]:undefined,
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
    if(s.targets) g.players=g.players.concat([
      {x:round(zw*0.5),y:round(h*0.5),t:'n'},{x:round(w-zw*0.5),y:round(h*0.5),t:'n'}]);
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
    const chain=passChain(a,d,0,Math.min(2,na-1),false,R,null,minLen(w,h));
    for(let i=1;i<chain.length;i++) acts.push({k:'pass',p:[a[chain[i-1]],a[chain[i]]],n:i});
    const carrier=a[chain[chain.length-1]];
    const shotFrom=[round(lerp(carrier[0],w/2,0.6)), round(Math.max(h*0.14,carrier[1]-h*0.32))];
    if(dist(carrier,shotFrom)>=MINLEN) acts.push({k:'run',p:[carrier,shotFrom],n:acts.length+1});
    const src=acts.length&&acts[acts.length-1].k==='run'?shotFrom:carrier;
    const all=players.map(q=>[q.x,q.y]);
    let goalPt=null, bestGap=-1;
    for(let i=0;i<=8;i++){
      const c=[round(w/2+lerp(-gw*0.42,gw*0.42,i/8)), 0.5];
      if(dist(src,c)<MINLEN) continue;
      let gap=99; all.forEach(q=>{ if(dist(q,src)>=0.6) gap=Math.min(gap,segDist(q,src,c)); });
      if(gap>bestGap){bestGap=gap;goalPt=c;}
      if(gap>CLEAR) break;
    }
    if(goalPt) acts.push({k:'shot',p:[src,goalPt],n:acts.length+1});
    return {w,h,marks:s.marks||'box',goals:[{x:w/2,y:0,w:gw,side:'t',gk:s.gk!==false}],
            players,balls:[nearBall(a[chain[0]],a[chain[1]]||shotFrom)],acts};
  };

  /* centre z krídla */
  SHAPES.cross=function(s,R){
    const w=s.w,h=s.h,gw=s.goalW||7, rt=(s.side||'r')==='r', sg=rt?1:-1;
    const wing=jp(R,[rt?w-4:4, h*0.84],w*0.02);
    const up=jp(R,[rt?w-4.5:4.5, h*0.44],h*0.03);
    const boxPt=[round(w/2+sg*gw*0.5), round(h*0.19)];
    const runner=[round(w/2+sg*w*0.19), round(h*0.55)];
    const far=[round(w/2-sg*w*0.16), round(h*0.42)];
    const edge=[round(w/2+sg*w*0.04), round(h*0.7)];
    const raw=[runner,far,edge,[round(rt?w-9:9),round(h*0.72)],[round(w/2-sg*w*0.06),round(h*0.3)]].map(q=>jp(R,q,Math.min(w,h)*0.035));
    const S1=spread(raw,4.6,[2.2,h*0.24],[w-2.2,h-2.2],R);
    const players=[{x:wing[0],y:wing[1],t:'a',n:1},{x:S1[0][0],y:S1[0][1],t:'a',n:2},
                   {x:S1[1][0],y:S1[1][1],t:'a',n:3},{x:S1[2][0],y:S1[2][1],t:'a',n:4},
                   {x:S1[3][0],y:S1[3][1],t:'d'},{x:S1[4][0],y:S1[4][1],t:'d'}];
    runner[0]=S1[0][0]; runner[1]=S1[0][1];
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
    const ng=(s.goalsN==null?2:s.goalsN);
    const goals=[];
    for(let i=0;i<ng;i++)
      goals.push({x:w,y:round(ng===1?h/2:lerp(h*0.22,h*0.78,i/(ng-1))),
                  w:ng===1?gw+1.5:gw,side:'r',gk:ng===1&&!!s.gk});
    const A=[],D=[];
    for(let i=0;i<na;i++) A.push(jp(R,[w*0.16, h*(na===1?0.5:0.3+0.4*i)],Math.min(w,h)*0.05));
    for(let i=0;i<nd;i++) D.push(jp(R,[w*0.58, h*(nd===1?0.5:0.32+0.36*i)],Math.min(w,h)*0.06));
    const players=A.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+1}))
      .concat(D.map(q=>({x:q[0],y:q[1],t:'d'})));
    const gi=ng?Math.min(ng-1,Math.floor(R()*ng)):0;
    const gy=ng?goals[gi].y:round(h*(R()<0.5?0.25:0.75));
    const side=gy<D[0][1]?-1:1;
    const mid=[round(lerp(A[0][0],w*0.82,0.5)), round(Math.max(2.5,Math.min(h-2.5,D[0][1]+side*Math.max(4,h*0.26))))];
    const end=[round(ng?w-1.0:w-2.0), gy];
    const acts=[{k:'drib',p:[A[0],mid],n:1}];
    if(dist(mid,end)>=MINLEN) acts.push({k:'drib',p:[mid,end],n:2});
    return {w,h,marks:'none',goals,
            cones:s.cones||[[round(w*0.07),2],[round(w*0.07),round(h-2)]],
            players,balls:[nearBall(A[0],mid)],acts};
  };

  /* brány z mét — vedenie cez bránu, alebo prihrávka cez bránu vo dvojiciach */
  SHAPES.gates=function(s,R){
    const w=s.w,h=s.h,n=s.gates||4,gwd=s.gateW||2.4,pass=(s.via==='pass');
    const players=[],balls=[],gates=[];
    if(pass){
      /* dvojice oproti sebe, medzi každou z nich jedna brána */
      const pairs=Math.max(2,Math.min(n, Math.floor((h*0.66)/3.4)+1));
      for(let i=0;i<pairs;i++){
        const y=round(lerp(h*0.20,h*0.80,pairs<2?0.5:i/(pairs-1)));
        players.push({x:round(w*0.14),y,t:'a',n:i*2+1});
        players.push({x:round(w*0.86),y,t:'a',n:i*2+2});
        gates.push({x:round(w*0.5),y,w:gwd,dir:'v'});
      }
      const from=[round(w*0.14),players[0].y], to=[round(w*0.86),players[1].y];
      balls.push([round(from[0]+1.4),from[1]]);
      return {w,h,marks:'none',gates,players,balls,
              acts:dist(from,to)>=MINLEN?[{k:'pass',p:[from,to],n:1}]:[]};
    }
    const cols=Math.min(3,Math.ceil(n/2)), rows=Math.ceil(n/cols);
    for(let i=0;i<n;i++){
      const c=i%cols, r=Math.floor(i/cols);
      gates.push({x:round(lerp(w*0.30,w*0.80,cols<2?0.5:c/(cols-1))),
                  y:round(lerp(h*0.20,h*0.80,rows<2?0.5:r/(rows-1))),
                  w:gwd,dir:(i%2)?'h':'v'});
    }
    const np=Math.min(s.att||6,6);
    const fit=Math.max(2,Math.min(np,Math.floor((h*0.72)/2.8)+1));
    const P=[];
    for(let i=0;i<fit;i++)
      P.push([round(w*0.10+(i%2?1.6:0)), round(lerp(h*0.14,h*0.86,fit<2?0.5:i/(fit-1)))]);
    P.forEach((q,i)=>{players.push({x:q[0],y:q[1],t:'a',n:i+1}); balls.push([round(q[0]+1.3),q[1]]);});
    const g0=gates[0], from=P[Math.min(1,P.length-1)], thru=[g0.x,g0.y];
    const on=[round(Math.min(w-1.5,g0.x+6)), round(Math.max(1.8,Math.min(h-1.8,g0.y+(R()-0.5)*4)))];
    const acts=[];
    if(dist(from,thru)>=MINLEN) acts.push({k:'drib',p:[from,thru],n:1});
    if(dist(thru,on)>=MINLEN) acts.push({k:'drib',p:[thru,on],n:acts.length+1});
    return {w,h,marks:'none',gates,players,balls,acts};
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
    const g=SHAPES.grid({w,h,att:s.att||4,def:s.def||3,neu:0,gk:s.gk,goalW:s.goalW,box:[0.08,0.14,0.90,0.86]},R);
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
        const back=Math.max(L,Math.max(8.2,w*0.17));
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


  /* štandardná situácia — roh, priamy kop, aut */
  SHAPES.setpiece=function(s,R){
    const w=s.w,h=s.h,gw=s.goalW||7,kind=s.kind||'corner';
    const goal={x:w/2,y:0,w:gw,side:'t',gk:s.gk!==false};
    const players=[],acts=[],cones=[],mann=[];
    if(kind==='corner'){
      const rt=(s.side||'r')==='r', sg=rt?1:-1, X=v=>round(w/2+sg*v);
      const ball=[X(w/2-1.2),1.2];
      players.push({x:ball[0],y:1.2,t:'a',n:1});
      const raw=[[X(-4),3.6],[X(4),4.4],[X(0),8],[X(7),13],
                 [X(-2.2),6.2],[X(3.4),7.4],[X(0),12.2]].map(q=>jp(R,q,0.8));
      const S1=spread(raw,3.0,[1.5,1.5],[w-1.5,h-1.5],R);
      S1.slice(0,4).forEach((q,i)=>players.push({x:q[0],y:q[1],t:'a',n:i+2}));
      S1.slice(4).forEach(q=>players.push({x:q[0],y:q[1],t:'d'}));
      acts.push({k:'pass',p:[ball,[X(2.5),2.5]],n:1});
      acts.push({k:'run', p:[S1[3],[X(3),8]],n:2});
      return {w,h,marks:'box',goals:[goal],players,balls:[[X(w/2-2.6),2.2]],acts};
    }
    if(kind==='throwin'){
      const y0=1.0, thrower=[round(w*0.5),y0];
      const raw=[[w*0.26,h*0.30],[w*0.74,h*0.26],[w*0.50,h*0.52],[w*0.38,h*0.16],[w*0.62,h*0.42]].map(q=>jp(R,q,1.0));
      const S1=spread(raw,4.6,[2.0,Math.max(4.0,h*0.16)],[w-2.0,h-2.0],R);
      players.push({x:thrower[0],y:y0,t:'a',n:1});
      S1.slice(0,3).forEach((q,i)=>players.push({x:q[0],y:q[1],t:'a',n:i+2}));
      S1.slice(3).forEach(q=>players.push({x:q[0],y:q[1],t:'d'}));
      acts.push({k:'pass',p:[thrower,S1[1]],n:1});
      acts.push({k:'run', p:[S1[0],[S1[0][0],round(Math.min(h-2,S1[0][1]+Math.max(4.5,h*0.30)))]],n:2});
      return {w,h,marks:s.goal?'boxR':(s.marks||'none'),players,
              goals:s.goal?[{x:w,y:h/2,w:s.goalW||7,side:'r',gk:true}]:undefined,
              balls:[[thrower[0],round(y0-0.6)]],acts,cones:[[1.2,y0],[round(w-1.2),y0]]};
    }
    /* priamy kop */
    const bx=round(w/2+(s.off!=null?s.off:jit(R,w*0.06))), by=round(h*0.62+jit(R,1.2));
    players.push({x:bx,y:by,t:'a',n:1});
    players.push({x:round(bx-4.5),y:round(by+1.6),t:'a',n:2});
    players.push({x:round(w/2-gw*0.5),y:round(h*0.22),t:'a',n:3});
    for(let i=0;i<4;i++) mann.push([round(bx-3+i*1.1),round(by-9.15)]);
    return {w,h,marks:'box',goals:[goal],players,mann,balls:[[round(bx-1.3),by]],
      acts:[{k:'shot',p:[[bx,by],[round(w/2+gw*0.35),0.5]],n:1},
            {k:'run', p:[[round(w/2-gw*0.5),round(h*0.22)],[round(w/2-gw*0.2),round(h*0.10)]],n:2}]};
  };

  /* niekoľko malých ihrísk vedľa seba (turnaj 1v1 / 2v2) */
  SHAPES.multi=function(s,R){
    const n=s.fields||4, fw=s.fw||10, fh=s.fh||8, gap=s.gap||2.0, na=s.att||1;
    const cols=Math.max(1,Math.min(n,s.cols||(n<=2?1:2))), rows=Math.ceil(n/cols);
    const w=cols*fw+(cols-1)*gap, h=rows*fh+(rows-1)*gap;
    const zones=[],players=[],acts=[],cones=[]; let first=null;
    for(let i=0;i<n;i++){
      const c=i%cols, r=Math.floor(i/cols);
      const x0=c*(fw+gap), y0=r*(fh+gap);
      zones.push({x:round(x0),y:round(y0),w:fw,h:fh,label:s.labels===false?null:'pole '+(i+1)});
      cones.push([round(x0+0.5),round(y0+fh/2-1.2)],[round(x0+0.5),round(y0+fh/2+1.2)]);
      cones.push([round(x0+fw-0.5),round(y0+fh/2-1.2)],[round(x0+fw-0.5),round(y0+fh/2+1.2)]);
      for(let k=0;k<na;k++){
        players.push({x:round(x0+fw*0.25),y:round(y0+fh*(na===1?0.62:0.45+0.35*k)),t:'a',n:k+1});
        const dq=jp(R,[x0+fw*(0.62+0.10*k), y0+fh*(na===1?0.40:0.28+0.24*k)],Math.min(fw,fh)*0.12);
        players.push({x:dq[0],y:dq[1],t:'d'});
      }
      if(i===0) first={x0,y0};
    }
    if(first){
      const own=players.filter(p=>p.x>=first.x0&&p.x<=first.x0+fw&&p.y>=first.y0&&p.y<=first.y0+fh)
                       .map(p=>[p.x,p.y]);
      const start=[round(first.x0+fw*0.25),round(first.y0+fh*(na===1?0.62:0.45))];
      const end=[round(first.x0+fw*0.94),round(first.y0+fh*0.5)];
      let best=null,bestGap=-1;
      for(const k of [0.93,0.07,0.82,0.18,0.70,0.30]){
        const mid=[round(first.x0+fw*0.50),round(first.y0+fh*k)];
        let gap=99;
        own.forEach(q=>{ if(dist(q,start)>=0.6&&dist(q,end)>=0.6)
          gap=Math.min(gap,segDist(q,start,mid),segDist(q,mid,end)); });
        if(gap>bestGap){bestGap=gap;best=mid;}
        if(gap>CLEAR) break;
      }
      acts.push({k:'drib',p:[start,best,end],n:1});
    }
    return {w:round(w),h:round(h),marks:'none',zones,cones,players,
            balls:[[round(fw*0.25+1.3),round(fh*(na===1?0.62:0.45))]],acts,dims:s.dims!==false};
  };

  /* vlny — rad hráčov nabieha po jednom proti obrane a zakončuje */
  SHAPES.wave=function(s,R){
    const w=s.w,h=s.h,gw=s.goalW||6,q=s.queue||3;
    const players=[],cones=[];
    const qx=round(w*0.12);
    for(let i=0;i<q;i++) players.push({x:qx,y:round(h-2.2-i*2.6),t:'a',n:i+1});
    if(s.def!==0){const d=jp(R,[w*0.52,h*0.42],Math.min(w,h)*0.05); players.push({x:d[0],y:d[1],t:'d'});}
    if(s.server!==false) players.push({x:round(w*0.85),y:round(h*0.74),t:'n'});
    const start=[qx,round(h-2.2)];
    const mid=jp(R,[w*0.42,h*0.62],Math.min(w,h)*0.05);
    const shotFrom=jp(R,[w*0.46,h*0.28],Math.min(w,h)*0.04);
    const acts=[];
    if(s.server!==false) acts.push({k:'pass',p:[[round(w*0.85),round(h*0.74)],start],n:1});
    acts.push({k:'drib',p:[start,mid],n:acts.length+1});
    acts.push({k:'drib',p:[mid,shotFrom],n:acts.length+1});
    acts.push({k:'shot',p:[shotFrom,[round(w/2+gw*0.3),0.5]],n:acts.length+1});
    return {w,h,marks:'box',goals:[{x:w/2,y:0,w:gw,side:'t',gk:s.gk!==false}],
            players,cones:[[round(w*0.12),round(h-0.9)]],balls:[[round(qx+1.3),round(h-2.2)]],acts};
  };


  /* voľné vedenie lopty v priestore — každý má loptu, jeden či dvaja lovci */
  SHAPES.free=function(s,R){
    const w=s.w,h=s.h,na=s.att||6,nd=s.def||2;
    const A=[],D=[];
    for(let i=0;i<na;i++){
      const c=i%3, r=Math.floor(i/3), rows=Math.max(1,Math.ceil(na/3));
      A.push([round(lerp(w*0.14,w*0.86,c/2)), round(lerp(h*0.18,h*0.82,rows<2?0.5:r/(rows-1)))]);
    }
    for(let i=0;i<nd;i++) D.push([round(w*(0.36+0.30*i)), round(h*(i%2?0.30:0.70))]);
    const S1=spread(A.concat(D),4.6,[1.8,1.8],[w-1.8,h-1.8],R);
    const a=S1.slice(0,na), d=S1.slice(na);
    const players=a.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+1}))
      .concat(d.map(q=>({x:q[0],y:q[1],t:'d'})));
    const from=a[0], all=a.concat(d);
    let to=null;
    for(let i=0;i<36&&!to;i++){
      const ang=((i%18)/18)*Math.PI*2+0.3;
      const L=(i<18?Math.min(7.5,Math.min(w,h)*0.42):MINLEN+0.5);
      const c=[round(from[0]+Math.cos(ang)*L), round(from[1]+Math.sin(ang)*L)];
      if(c[0]<1.4||c[1]<1.4||c[0]>w-1.4||c[1]>h-1.4) continue;
      if(dist(from,c)<MINLEN) continue;
      if(all.every(q=>dist(q,from)<0.6||segDist(q,from,c)>CLEAR)) to=c;
    }
    const acts=[];
    if(to) acts.push({k:'drib',p:[from,to],n:1});
    const near=to?d.slice().sort((x,y)=>dist(x,to)-dist(y,to))[0]:null;
    if(near){
      const L=dist(near,to)||1, keep=L-2.8;
      const t2=[round(near[0]+(to[0]-near[0])/L*keep), round(near[1]+(to[1]-near[1])/L*keep)];
      if(dist(near,t2)>=3.2) acts.push({k:'run',p:[near,t2],n:acts.length+1});
    }
    return {w,h,marks:'none',players,balls:a.map(q=>[round(q[0]+1.3),q[1]]),acts};
  };

  /* príjem chrbtom k bránke — nahrávač, hráč v strede, obranca za ním, cieľ */
  SHAPES.back=function(s,R){
    const w=s.w,h=s.h;
    const P=jp(R,[w*0.12,h*0.5],h*0.04);          // nahrávač
    const M=jp(R,[w*0.50,h*0.5],h*0.04);          // hráč chrbtom k cieľu
    const gap=Math.max(2.9,w*0.10);                 // obranca stojí za ním, nie na ňom
    const Dp=[round(M[0]+gap*0.78),round(M[1]-gap*0.62)];
    const players=[{x:P[0],y:P[1],t:'a',n:1},{x:M[0],y:M[1],t:'a',n:2},
                   {x:Dp[0],y:Dp[1],t:'d'}];
    const sup=s.support||0;
    for(let i=0;i<sup;i++)
      players.push({x:round(w*0.34),y:round(i%2?h*0.14:h*0.86),t:'a',n:3+i});
    const out=[round(w*0.88),round(h*0.62)];
    const acts=[{k:'pass',p:[P,M],n:1},{k:'drib',p:[M,out],n:2}];
    const zones=(s.zone===false||s.goal)?undefined
      :[{x:round(w*0.80),y:0,w:round(w*0.20),h,label:s.label||'cieľová zóna',tone:'target'}];
    return {w,h,marks:'none',zones,players,balls:[nearBall(P,M)],acts,
            goals:s.goal?[{x:w,y:h/2,w:s.goalW||5,side:'r',gk:true}]:undefined,
            cones:s.goal?undefined:(s.cones||[[round(w*0.94),round(h*0.28)],[round(w*0.94),round(h*0.72)]])};
  };


  /* prihrávka do behu za obrancu */
  SHAPES.thru=function(s,R){
    const w=s.w,h=s.h;
    const P=jp(R,[w*0.12,h*0.62],h*0.04);               // hráč s loptou
    const Rn=jp(R,[w*0.34,h*0.28],h*0.04);              // nabiehajúci hráč
    const Dm=[round(w*0.56),round(h*0.52)];              // obranca / figurína
    const land=[round(w*0.84),round(h*0.22)];            // priestor za obrancom
    const players=[{x:P[0],y:P[1],t:'a',n:1},{x:Rn[0],y:Rn[1],t:'a',n:2}];
    if(s.mannequin!==false) players.push({x:Dm[0],y:Dm[1],t:'d'});
    return {w,h,marks:s.marks||'none',
      goals:s.goal?[{x:w,y:h/2,w:s.goalW||6,side:'r',gk:true}]:undefined,
      zones:(s.zone===false||s.goal)?undefined:[{x:round(w*0.72),y:0,w:round(w*0.28),h,
        label:s.label||'priestor za obranou',tone:'target'}],
      players,balls:[nearBall(P,land)],
      acts:[{k:'run', p:[Rn,[round(w*0.66),round(h*0.16)]],n:1},
            {k:'pass',p:[P,land],n:2}]};
  };

  /* narážačka / hra na tretieho */
  SHAPES.combo=function(s,R){
    const w=s.w,h=s.h;
    const A=jp(R,[w*0.12,h*0.62],w*0.02);
    const B=jp(R,[w*0.52,h*0.76],w*0.03);
    const land=jp(R,[w*0.72,h*0.28],w*0.03);
    const players=[{x:A[0],y:A[1],t:'a',n:1},{x:B[0],y:B[1],t:'a',n:2}];
    if(s.third) players.push({x:round(w*0.86),y:round(h*0.60),t:'a',n:3});
    for(let i=0;i<(s.def||0);i++)
      players.push({x:round(w*0.44),y:round(lerp(h*0.16,h*0.68,(s.def||1)<2?0.5:i/((s.def||1)-1))),t:'d'});
    return {w,h,marks:'none',
      zones:s.zone?[{x:round(w*0.72),y:0,w:round(w*0.28),h,label:s.label||'cieľová zóna',tone:'target'}]:undefined,
      gates:s.gate===false?undefined:[{x:round(w*0.44),y:round(h*0.42),w:s.gateW||2.6,dir:'h'}],
      players,balls:[nearBall(A,B)],
      acts:[{k:'pass',p:[A,B],n:1},
            {k:'pass',p:[B,land],n:2},
            {k:'run', p:[A,land],n:3}]};
  };

  /* zakladanie útoku od brankára cez tretiny */
  SHAPES.build=function(s,R){
    const w=s.w,h=s.h,na=s.att||4,nd=s.def||2,gw=s.goalW||6;
    const A=layout(na,w,h,false,R,[0.16,0.14,0.62,0.86]);
    const D=layout(nd,w,h,true, R,[0.34,0.20,0.72,0.80]);
    const S1=spread(A.concat(D),4.6,[3.0,1.8],[w-2.5,h-1.8],R);
    const a=S1.slice(0,na), d=S1.slice(na);
    const players=a.map((q,i)=>({x:q[0],y:q[1],t:'a',n:i+2}))
      .concat(d.map(q=>({x:q[0],y:q[1],t:'d'})));
    const gk=[round(1.6),round(h/2)];
    const chain=passChain(a,d,0,Math.min(2,na-1),true,R,null,minLen(w,h));
    const acts=[];
    if(clearLine(gk,a[chain[0]],a.concat(d),[chain[0]]))
      acts.push({k:'pass',p:[gk,a[chain[0]]],n:1});
    for(let i=1;i<chain.length;i++) acts.push({k:'pass',p:[a[chain[i-1]],a[chain[i]]],n:acts.length+1});
    const from=a[chain[chain.length-1]];
    const to=aim(from,w-1.6,3,h-3,a.concat(d),R);
    if(to) acts.push({k:'run',p:[from,to],n:acts.length+1});
    const zw=round(w*0.30);
    return {w,h,marks:'none',
      zones:[{x:0,y:0,w:zw,h,label:s.labelOwn||'vlastná tretina',tone:'own'},
             {x:w-zw,y:0,w:zw,h,label:s.labelTarget||'cieľová zóna',tone:'target'}],
      goals:[{x:0,y:h/2,w:gw,side:'l',gk:true}],
      players,balls:[[round(gk[0]+1.4),round(gk[1]-0.6)]],acts};
  };

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
  const OVERRIDE=['marks','zones','goals','gates','cones','mann','players','balls','acts','dims','note'];
  const ARR=['zones','goals','gates','cones','mann','players','balls','acts'];

  function build(spec,key,validate){
    const fn=SHAPES[spec.shape];
    if(!fn) throw new Error('neznámy tvar nákresu: '+spec.shape);
    let best=null,bestErr=null;
    for(let i=0;i<8;i++){
      const sc=fn(spec,rnd((key||'x')+'#'+i));
      sc.shape=spec.shape;
      /* čokoľvek z predpisu sa dá dokresliť alebo prebiť ručne */
      OVERRIDE.forEach(k=>{
        const v=spec[k];
        if(v===undefined) return;
        /* číslo v poli ako `gates:4` je pokyn pre staviteľa, nie hotový zoznam */
        if(ARR.indexOf(k)>=0 && !Array.isArray(v)) return;
        sc[k]=v;
      });
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
