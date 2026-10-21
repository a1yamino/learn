const DC={};
DC.sl=ms=>new Promise(r=>setTimeout(r,ms));
DC.quiz=function(Q,nextTxt){const qz=document.getElementById('quiz'),scE=document.getElementById('score');let sc=0,done=0;
Q.forEach((q,qi)=>{const d=document.createElement('div');d.className='q';d.innerHTML=`<b>Q${qi+1}. ${q[0]}</b>`;const fb=document.createElement('div');fb.className='fb';
q[1].forEach((o,oi)=>{const l=document.createElement('label');l.textContent=o;l.onclick=()=>{if(d.dataset.a)return;d.dataset.a=1;done++;
if(oi==q[2]){l.className='right';sc++;fb.innerHTML='<span class="good">✅ '+q[3]+'</span>'}else{l.className='wrong';d.querySelectorAll('label')[q[2]].className='right';fb.innerHTML='<span class="bad">❌ 正确答案已标绿：</span>'+q[3].replace(/^对！/,'')}
if(done==Q.length)scE.innerHTML=`得分 <b>${sc}/${Q.length}</b> ${sc==Q.length?'🎉 完美！'+(nextTxt||''):'— 回看对应章节再试（刷新重做）'}`};d.appendChild(l)});d.appendChild(fb);qz.appendChild(d)})};
// terminal: el id, items [[label,cmd,output,explain]]
DC.term=function(id,items){const w=document.getElementById(id);w.innerHTML='<p class="chips"></p><pre class="term" style="min-height:140px">点击上面的命令 ↑</pre><div class="box">解释会出现在这里。</div>';
const [bar,pre,ex]=w.children;let ti;items.forEach(([lb,cmd,out,exp])=>{const b=document.createElement('button');b.className='sec';b.style.fontFamily='ui-monospace,monospace';b.style.fontSize='12px';b.textContent=lb;
b.onclick=()=>{clearInterval(ti);const s='$ '+cmd+'\n'+out;let k=0;pre.textContent='';ex.innerHTML='…';ti=setInterval(()=>{pre.textContent=s.slice(0,k+=5);if(k>=s.length){clearInterval(ti);ex.innerHTML=exp}},10)};bar.appendChild(b)})};
// tabs: container with buttons[data-i], target pre/div id, contents array (html)
DC.tabs=function(id,target,arr,isHtml){const c=document.getElementById(id),t=document.getElementById(target);c.classList.add('tabs');
c.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{c.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');isHtml?t.innerHTML=arr[i]:t.textContent=arr[i]});c.querySelector('button').click()};
// stepper: steps [html], with buttons inside container id
DC.steps=function(id,steps,onStep){const c=document.getElementById(id);c.innerHTML='<div class="anim box"></div><p><button>下一步 ▶</button><button class="sec">重来</button> <span class="mu"></span></p>';
const box=c.children[0],[nx,rs,ct]=c.children[1].children;let i=0;const go=()=>{if(i>=steps.length)return;const d=document.createElement('div');d.style.animation='pop .4s';d.style.margin='6px 0';d.innerHTML=steps[i];box.appendChild(d);i++;ct.textContent=i+'/'+steps.length;onStep&&onStep(i)};
nx.onclick=go;rs.onclick=()=>{box.innerHTML='';i=0;ct.textContent='';onStep&&onStep(0);go()};go()};

(()=>{const RM=matchMedia('(prefers-reduced-motion: reduce)').matches,FINE=matchMedia('(hover:hover) and (pointer:fine)').matches;
/* --- spring: semi-implicit Euler, k=170 c=26 (default) — interruptible, starts from current value --- */
DC.spring=function(apply,o={}){const k=o.k||170,c=o.c||26;let x=o.from??0,v=0,t=x,raf=0,last=0;
function step(now){const dt=Math.min(.032,(now-last)/1000||.016);last=now;const a=k*(t-x)-c*v;v+=a*dt;x+=v*dt;apply(x);if(Math.abs(t-x)>.001||Math.abs(v)>.001)raf=requestAnimationFrame(step);else{x=t;apply(x);raf=0}}
return{set(n,vel){t=n;if(vel!==undefined)v=vel;if(RM){x=t;apply(x);return}if(!raf){last=performance.now();raf=requestAnimationFrame(step)}},jump(n){x=t=n;v=0;apply(x)},get value(){return x}}};
/* --- confetti: rare celebration only (quiz perfect score) --- */
DC.confetti=function(n=140){if(RM)return;const c=document.createElement('canvas');c.id='confetti';document.body.appendChild(c);const x=c.getContext('2d'),d=devicePixelRatio||1;c.width=innerWidth*d;c.height=innerHeight*d;x.scale(d,d);
const C=['#38bdf8','#8b5cf6','#34d399','#fbbf24','#f472b6'],P=Array.from({length:n},(_,i)=>{const a=-Math.PI/2+(Math.random()-.5)*1.4,s=9+Math.random()*9;return{x:innerWidth/2,y:innerHeight*.72,vx:Math.cos(a)*s,vy:Math.sin(a)*s,w:5+Math.random()*5,c:C[i%5],r:Math.random()*6,vr:(Math.random()-.5)*.35}});let f=0;
(function tick(){x.clearRect(0,0,innerWidth,innerHeight);const fade=Math.max(0,1-Math.max(0,f-90)/60);P.forEach(p=>{p.vy+=.38;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.globalAlpha=fade;x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.w/4,p.w,p.w/2);x.restore()});if(++f<150)requestAnimationFrame(tick);else c.remove()})()};
/* --- generic drag with pointer capture, grab offset, spring return; onDrop(zoneEl) returns true to accept --- */
DC.drag=function(el,zones,onDrop){el.classList.add('draggable');let sx,sy,dragging=false,id=null,tx=0,ty=0;const SX=DC.spring(v=>{tx=v;paint()}),SY=DC.spring(v=>{ty=v;paint()});
function paint(){el.style.transform=`translate(${tx}px,${ty}px)`+(dragging?' scale(1.04) rotate(-1.5deg)':'')}
const hit=e=>zones().find(z=>{const r=z.getBoundingClientRect();return e.clientX>r.left&&e.clientX<r.right&&e.clientY>r.top&&e.clientY<r.bottom});
el.addEventListener('pointerdown',e=>{if(id!==null)return;id=e.pointerId;el.setPointerCapture(id);sx=e.clientX-tx;sy=e.clientY-ty;dragging=true;el.classList.add('dragging');paint()});
el.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;SX.jump(e.clientX-sx);SY.jump(e.clientY-sy);zones().forEach(z=>z.classList.toggle('over',z===hit(e)))});
const end=e=>{if(e.pointerId!==id)return;id=null;dragging=false;el.classList.remove('dragging');const z=hit(e);zones().forEach(z=>z.classList.remove('over'));if(z)onDrop(z,el);SX.set(0);SY.set(0)};
el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end)};
/* --- hero: masked dot field (pauses offscreen) + 3D image-layer stacks following pointer via spring --- */
function hero(){const h=document.querySelector('header');if(!h)return;
const mk=(cls,labels)=>{const s=document.createElement('div');s.className='stack3d '+cls;s.setAttribute('aria-hidden','true');const rig=document.createElement('div');rig.className='rig';labels.forEach((l,i)=>{const d=document.createElement('div');d.className='slab'+(l.startsWith('✏')?' w':'');d.textContent=l;d.style.transform=`translateZ(${i*24}px)`;rig.appendChild(d)});s.appendChild(rig);h.appendChild(s);return rig};
const r1=mk('',['FROM base','RUN install','COPY app','✏ 可写层']),r2=mk('l',['layer','layer','layer']);
if(!RM&&FINE){const RX=DC.spring(()=>0),rs=[[r1,-38],[r2,38]];let mx=0,my=0;const sx=DC.spring(v=>{mx=v;upd()}),sy=DC.spring(v=>{my=v;upd()});
function upd(){rs.forEach(([r,z])=>r.style.transform=`rotateX(${58-my*10}deg) rotateZ(${z+mx*14}deg)`)}
h.addEventListener('pointermove',e=>{const b=h.getBoundingClientRect();sx.set((e.clientX-b.left)/b.width-.5);sy.set((e.clientY-b.top)/b.height-.5)});h.addEventListener('pointerleave',()=>{sx.set(0);sy.set(0)})}
if(RM)return;const c=document.createElement('canvas');c.id='herofx';h.prepend(c);const x=c.getContext('2d');let W,H,on=true,t0=performance.now();
const rs=()=>{const d=Math.min(2,devicePixelRatio||1);W=h.clientWidth;H=h.clientHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0)};rs();addEventListener('resize',rs);
new IntersectionObserver(([e])=>{on=e.isIntersecting;if(on)requestAnimationFrame(draw)}).observe(h);
function draw(now){if(!on||document.hidden){if(!document.hidden)return;requestAnimationFrame(draw);return}const t=(now-t0)/1000;x.clearRect(0,0,W,H);const g=28;
for(let i=0;i<W/g+1;i++)for(let j=0;j<H/g+1;j++){const px=i*g,py=j*g,w=Math.sin(i*.35+t*.6)*Math.cos(j*.4+t*.45);x.fillStyle=`rgba(${w>0?'125,211,252':'167,139,250'},${.12+Math.abs(w)*.45})`;x.beginPath();x.arc(px,py+w*3,1+Math.abs(w)*1.1,0,6.3);x.fill()}
requestAnimationFrame(draw)}requestAnimationFrame(draw);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&on)requestAnimationFrame(draw)})}
/* --- reveal once with 50ms stagger --- */
function reveal(){if(!('IntersectionObserver' in window))return;const io=new IntersectionObserver(es=>{let k=0;es.forEach(e=>{if(e.isIntersecting){e.target.style.transitionDelay=(k++*50)+'ms';e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.06,rootMargin:'0px 0px -60px 0px'});
document.querySelectorAll('main section,.toc a.card').forEach(e=>{e.classList.add('rv');io.observe(e)})}
/* --- cards: spotlight + spring tilt, fine pointers only --- */
function cards(){if(RM||!FINE)return;document.querySelectorAll('.toc a.card:not(.soon)').forEach(el=>{let rx=0,ry=0;const ap=()=>el.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;const X=DC.spring(v=>{rx=v;ap()},{k:200,c:24}),Y=DC.spring(v=>{ry=v;ap()},{k:200,c:24});
el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;el.style.setProperty('--mx',px*100+'%');el.style.setProperty('--my',py*100+'%');X.set((.5-py)*5);Y.set((px-.5)*5)});
el.addEventListener('pointerleave',()=>{X.set(0);Y.set(0)})})}
function quizFx(){const s=document.getElementById('score');if(!s)return;new MutationObserver(()=>{if(s.textContent.includes('🎉')&&!s.dataset.c){s.dataset.c=1;DC.confetti()}}).observe(s,{childList:true,subtree:true,characterData:true})}
function progress(){const rp=document.getElementById('rp');if(!rp)return;const u=()=>{const h=document.documentElement;rp.style.setProperty('--p',h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight))};addEventListener('scroll',u,{passive:true});u()}
addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('header h1,.toc .num,h2 span').forEach(h=>h.innerHTML=h.innerHTML.replace(/(\p{Extended_Pictographic}\uFE0F?)/gu,'<span class="emo">$1</span>'));hero();reveal();cards();quizFx();progress()})})();
