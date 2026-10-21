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

(()=>{const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
DC.confetti=function(n=160){if(RM)return;const c=document.createElement('canvas');c.id='confetti';document.body.appendChild(c);const x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
const C=['#38bdf8','#a855f7','#f472b6','#34d399','#fbbf24'],P=Array.from({length:n},()=>({x:innerWidth/2,y:innerHeight*.6,vx:(Math.random()-.5)*16,vy:-Math.random()*18-6,r:Math.random()*6+3,c:C[Math.random()*5|0],a:Math.random()*6,s:(Math.random()-.5)*.3}));let t=0;
(function f(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.vy+=.45;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.s;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r,-p.r/2,p.r*2,p.r);x.restore()});if(++t<180)requestAnimationFrame(f);else c.remove()})()};
function bg(){if(RM)return;const c=document.createElement('canvas');c.id='bgfx';document.body.prepend(c);const x=c.getContext('2d');let W,H,P;
function rs(){W=c.width=innerWidth;H=c.height=innerHeight;P=Array.from({length:Math.min(70,W/18|0)},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35}))}rs();addEventListener('resize',rs);
let mx=-999,my=-999;addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
(function f(){if(document.hidden){requestAnimationFrame(f);return}x.clearRect(0,0,W,H);for(const p of P){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;x.fillStyle='#7dd3fc';x.beginPath();x.arc(p.x,p.y,1.6,0,7);x.fill()}
for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<130){x.strokeStyle=`rgba(125,160,255,${(1-d/130)*.35})`;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}}
for(const p of P){const d=Math.hypot(p.x-mx,p.y-my);if(d<180){x.strokeStyle=`rgba(168,85,247,${(1-d/180)*.6})`;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(mx,my);x.stroke()}}requestAnimationFrame(f)})()}
function hero(){const h=document.querySelector('header');if(!h)return;for(const cls of['hero3d','hero3d l']){const d=document.createElement('div');d.className=cls;d.setAttribute('aria-hidden','true');for(let i=0;i<4;i++){const s=document.createElement('div');s.className='slab';s.style.transform=`translateZ(${i*22}px)`;s.style.opacity=1-i*.15;d.appendChild(s)}h.appendChild(d)}}
function reveal(){const els=document.querySelectorAll('main section,.toc a.card,.stat');if(RM||!('IntersectionObserver' in window))return;const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});els.forEach((e,i)=>{e.classList.add('rv');e.style.transitionDelay=(e.matches('.card')?Math.min(i,10)*60:0)+'ms';io.observe(e)})}
function tilt(){if(RM)return;document.querySelectorAll('.toc a.card,.box,.pc,.stat').forEach(el=>{el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;el.style.setProperty('--mx',px*100+'%');el.style.setProperty('--my',py*100+'%');el.style.transform=`perspective(800px) rotateY(${(px-.5)*8}deg) rotateX(${(.5-py)*8}deg) translateY(-3px)`});el.addEventListener('mouseleave',()=>el.style.transform='')})}
function quizFx(){const s=document.getElementById('score');if(!s)return;new MutationObserver(()=>{if(s.textContent.includes('🎉')&&!s.dataset.c){s.dataset.c=1;DC.confetti()}}).observe(s,{childList:true,subtree:true,characterData:true})}
addEventListener('DOMContentLoaded',()=>{bg();hero();reveal();tilt();quizFx()})})();
