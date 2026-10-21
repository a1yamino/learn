/* Scroll-scrubbed stage: element states are interpolated between consecutive scenes by scroll position. */
window.ScrollStage=function(o){const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage=document.querySelector('.story .stage'),board=stage.querySelector('.board'),steps=[...document.querySelectorAll('.st')],E={};
for(const[id,d]of Object.entries(o.els)){const n=document.createElement('div');n.className='el '+(d.cls||'');n.style.transition='none';n.style.width=d.w?d.w+'px':'max-content';if(d.h)n.style.height=d.h+'px';n.innerHTML=d.html||'';n.style.opacity=0;board.appendChild(n);E[id]={n,base:d,key:null}}
const S=o.scenes;// S[i].set id->[x,y,opts]
board.style.transformOrigin='0 0';addEventListener('resize',()=>upd());
// camera: fit each scene's content bbox to the stage, interpolated between scenes
const camC={};function cam(i){if(camC[i])return camC[i];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const id in S[i].set){const v=S[i].set[id],n=E[id].n;x0=Math.min(x0,v[0]);y0=Math.min(y0,v[1]);x1=Math.max(x1,v[0]+n.offsetWidth);y1=Math.max(y1,v[1]+n.offsetHeight)}return camC[i]={cx:(x0+x1)/2,cy:(y0+y1)/2,w:x1-x0,h:y1-y0}}
function view(a,b,t){const r=stage.getBoundingClientRect(),pad=Math.min(r.width,r.height)*.12;const k=c=>Math.min(1.7,(r.width-pad*2)/c.w,(r.height-pad*2)/c.h);
 const A=cam(a),B=cam(b),tt=RM?(t<.5?0:1):t,cx=A.cx+(B.cx-A.cx)*tt,cy=A.cy+(B.cy-A.cy)*tt,kk=Math.exp(Math.log(k(A))+(Math.log(k(B))-Math.log(k(A)))*tt);
 board.style.transform=`scale(${kk}) translate(${-cx}px,${-cy}px)`}
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; // cubic in-out for on-screen movement
function st(i,id){const v=S[i]&&S[i].set[id];return v?{x:v[0],y:v[1],o:1,opt:v[2]||{}}:null}
function apply(id,a,b,t){const e=E[id];let A=a,B=b;if(!A&&!B){e.n.style.opacity=0;return}
 if(!A)A={...B,y:B.y+14,o:0,opt:B.opt};if(!B)B={...A,y:A.y-14,o:0,opt:A.opt};
 const tt=RM?(t<.5?0:1):t,x=A.x+(B.x-A.x)*tt,y=A.y+(B.y-A.y)*tt,op=RM?(A.o+(B.o-A.o)*t):A.o+(B.o-A.o)*t;
 e.n.style.transform=`translate(${x}px,${y}px)`;e.n.style.opacity=op;
 const use=(t<.5?A:B).opt,key=JSON.stringify(use);if(key!==e.key){e.key=key;e.n.innerHTML=use.html!==undefined?use.html:(e.base.html||'');e.n.className='el '+(use.cls!==undefined?use.cls:(e.base.cls||''))}}
let last=-1;
function upd(){const mid=innerHeight*.5;let i=0,f=0;
 for(let k=0;k<steps.length;k++){const r=steps[k].getBoundingClientRect();if(r.top<=mid){i=k;f=Math.min(1,Math.max(0,(mid-r.top)/r.height))}}
 const z=.6,t=ease(Math.min(1,Math.max(0,(f-z)/(1-z))));const j=Math.min(S.length-1,i+1),tt=i===S.length-1?0:t;
 view(i,j,tt);for(const id in E)apply(id,st(i,id),st(j,id),tt);
 const act=tt>.5?j:i;if(act!==last){last=act;steps.forEach((s,k)=>s.classList.toggle('on',k===act));if(S[act].on)S[act].on(E)}}
let q=false;addEventListener('scroll',()=>{if(!q){q=true;requestAnimationFrame(()=>{q=false;upd()})}},{passive:true});upd();
const p=document.querySelector('.prog');if(p){const u=()=>{const h=document.documentElement;p.style.setProperty('--p',h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight))};addEventListener('scroll',u,{passive:true});u()}
return E};
