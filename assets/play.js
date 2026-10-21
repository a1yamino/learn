/* Theme */
(function(){const k='learn.theme',r=document.documentElement;window.setTheme=t=>{r.dataset.theme=t;try{localStorage.setItem(k,t)}catch(e){}document.querySelectorAll('[data-theme-btn]').forEach(b=>b.textContent=t==='dark'?'浅色':'深色')};
 document.addEventListener('DOMContentLoaded',()=>{setTheme(r.dataset.theme);document.querySelectorAll('[data-theme-btn]').forEach(b=>b.addEventListener('click',()=>setTheme(r.dataset.theme==='dark'?'light':'dark')))})})();
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const IC={play:'<svg viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',pause:'<svg viewBox="0 0 16 16"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>',re:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 8a5.5 5.5 0 1 0 1.7-4"/><path d="M2.5 2v3h3"/></svg>'};
/* Player: a self-contained diagram animation. Auto-plays once when it enters view. */
window.Player=function(root,o){
 const notes=o.scenes.map(s=>`<li><h4>${s.t}</h4><p>${s.p}</p></li>`).join('');
 root.classList.add('watch');root.innerHTML=`<div class="pv"><div class="board"></div></div><div class="pc"><button class="btn pri pp"></button><button class="btn rp">${IC.re}重播</button><div class="tl">${o.scenes.map(()=>'<i><b></b></i>').join('')}</div><button class="btn pr" aria-label="上一步">‹</button><button class="btn nx" aria-label="下一步">›</button></div><ol class="notes">${notes}</ol>`;
 const pv=root.querySelector('.pv'),board=root.querySelector('.board'),pp=root.querySelector('.pp'),ticks=[...root.querySelectorAll('.tl i')],lis=[...root.querySelectorAll('.notes li')],E={},S=o.scenes;
 for(const[id,d]of Object.entries(o.els)){const n=document.createElement('div');n.className='el '+(d.cls||'');n.style.width=d.w?d.w+'px':'max-content';if(d.h)n.style.height=d.h+'px';n.innerHTML=d.html||'';n.style.opacity=0;board.appendChild(n);E[id]={n,d,vis:false,key:null}}
 let cur=-1,playing=false,tm=null,started=false,userPaused=false;
 const dur=i=>S[i].d||3200;
 function cam(i,inst){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const id in S[i].set){const v=S[i].set[id],n=E[id].n;x0=Math.min(x0,v[0]);y0=Math.min(y0,v[1]);x1=Math.max(x1,v[0]+n.offsetWidth);y1=Math.max(y1,v[1]+n.offsetHeight)}
  const r=pv.getBoundingClientRect(),pad=Math.min(r.width,r.height)*.1,k=Math.min(1.5,(r.width-pad*2)/(x1-x0),(r.height-pad*2)/(y1-y0));
  if(inst)board.style.transition='none';board.style.transform=`scale(${k}) translate(${-(x0+x1)/2}px,${-(y0+y1)/2}px)`;if(inst){board.offsetWidth;board.style.transition=''}}
 function show(i,inst){cur=i;const s=S[i];
  for(const id in E){const e=E[id],v=s.set[id];
   if(v){const opt=v[2]||{},key=JSON.stringify(opt);if(key!==e.key){e.key=key;e.n.innerHTML=opt.html!==undefined?opt.html:(e.d.html||'');e.n.className='el '+(opt.cls!==undefined?opt.cls:(e.d.cls||''))}
    if(!e.vis||inst){e.n.style.transition='none';e.n.style.transform=`translate(${v[0]}px,${v[1]+(inst||RM?0:14)}px)`;e.n.offsetWidth;e.n.style.transition=''}
    e.n.style.transform=`translate(${v[0]}px,${v[1]}px)`;e.n.style.opacity=1;e.vis=true}
   else if(e.vis){e.n.style.opacity=0;e.vis=false}}
  cam(i,inst);lis.forEach((l,k)=>l.classList.toggle('on',k===i));ticks.forEach((t,k)=>{t.className=k<i?'d':k===i?'c':'';});
  root.style.setProperty('--dur',dur(i)+'ms');ticks[i].querySelector('b').style.animation='none';ticks[i].offsetWidth;ticks[i].querySelector('b').style.animation='';
  if(s.on)s.on(E);sched();ui()}
 function sched(){clearTimeout(tm);if(!playing)return;tm=setTimeout(()=>{if(cur<S.length-1)show(cur+1);else{playing=false;ticks[cur].className='d';ui()}},dur(cur))}
 function ui(){const end=!playing&&cur===S.length-1&&ticks[cur].className==='d';pp.innerHTML=playing?IC.pause+'暂停':end?IC.re+'再看一遍':IC.play+'播放';root.classList.toggle('paused',!playing);
  root.querySelector('.pr').disabled=cur<=0;root.querySelector('.nx').disabled=cur>=S.length-1}
 function play(){if(cur===S.length-1&&!playing){playing=true;show(0);return}playing=true;userPaused=false;show(cur<0?0:cur)}
 function pause(u){playing=false;clearTimeout(tm);if(u)userPaused=true;ui()}
 pp.addEventListener('click',()=>playing?pause(true):play());
 root.querySelector('.rp').addEventListener('click',()=>{playing=true;userPaused=false;show(0)});
 root.querySelector('.pr').addEventListener('click',()=>{pause(true);show(Math.max(0,cur-1))});
 root.querySelector('.nx').addEventListener('click',()=>{pause(true);show(Math.min(S.length-1,cur+1))});
 lis.forEach((l,k)=>l.addEventListener('click',()=>{pause(true);show(k)}));
 show(0,true);pause();
 new IntersectionObserver(([e])=>{if(e.isIntersecting){if(!started){started=true;playing=true;show(0)}else if(!userPaused&&cur<S.length-1&&!playing){playing=true;show(cur)}}else if(playing){pause()}},{threshold:.55}).observe(pv);
 addEventListener('resize',()=>cam(cur,true));
 return{show,play,pause,E}};
/* Game state */
window.Game=function(key,missions){let st={done:[]};try{st=JSON.parse(localStorage.getItem(key))||st}catch(e){}
 const total=missions.reduce((a,m)=>a+m.xp,0),xpEl=document.querySelector('.xp b'),bar=document.querySelector('.xp .bar');
 const xp=()=>missions.filter(m=>st.done.includes(m.id)).reduce((a,m)=>a+m.xp,0);let shown=xp();
 function paint(anim){const v=xp();bar.style.setProperty('--x',v/total);
  if(!anim||RM){xpEl.textContent=v;shown=v}else{const a=shown,t0=performance.now();const f=t=>{const p=Math.min(1,(t-t0)/600),e=1-Math.pow(1-p,3);xpEl.textContent=Math.round(a+(v-a)*e);if(p<1)requestAnimationFrame(f);else shown=v};requestAnimationFrame(f)}
  missions.forEach(m=>{const d=st.done.includes(m.id);document.getElementById(m.id).classList.toggle('done',d);const li=document.querySelector(`.ms li[data-m="${m.id}"]`);if(li){li.classList.toggle('done',d);li.querySelector('.s').textContent=d?'已完成':'未完成'}});
  const all=missions.every(m=>st.done.includes(m.id)),fin=document.getElementById('final');if(fin)fin.classList.toggle('on',all)}
 function complete(id){const m=missions.find(x=>x.id===id),c=document.querySelector('#'+id+' .clear');if(c&&!c.classList.contains('on'))c.classList.add('on');
  if(!st.done.includes(id)){st.done.push(id);try{localStorage.setItem(key,JSON.stringify(st))}catch(e){}paint(true)}}
 document.querySelector('.xp .t').textContent='/ '+total+' XP';paint(false);
 return{complete,isDone:id=>st.done.includes(id),reset(){st={done:[]};try{localStorage.removeItem(key)}catch(e){}location.reload()}}};
/* Drag a chip onto zones (pointer) or tap chip then tap zone (keyboard/touch). */
window.dragDrop=function(chips,zones,onDrop){let armed=null;
 const arm=c=>{armed=c;chips.forEach(x=>x.setAttribute('aria-pressed',x===c));zones.forEach(z=>z.classList.toggle('armed',!!c))};
 zones.forEach(z=>{z.addEventListener('click',()=>{if(armed){const c=armed;arm(null);onDrop(c,z)}})});
 chips.forEach(c=>{let sx,sy,moved=false,id=null;
  c.addEventListener('pointerdown',e=>{if(e.button)return;id=e.pointerId;sx=e.clientX;sy=e.clientY;moved=false;c.setPointerCapture(id)});
  c.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(!moved&&Math.hypot(dx,dy)<5)return;moved=true;c.classList.add('drag');c.classList.remove('back');c.style.transform=`translate(${dx}px,${dy}px) scale(1.03)`;
   const over=zones.find(z=>{const r=z.getBoundingClientRect();return e.clientX>r.left&&e.clientX<r.right&&e.clientY>r.top&&e.clientY<r.bottom});zones.forEach(z=>z.classList.toggle('over',z===over))});
  const up=e=>{if(e.pointerId!==id)return;id=null;c.classList.remove('drag');const over=zones.find(z=>z.classList.contains('over'));zones.forEach(z=>z.classList.remove('over'));
   if(!moved)return;c.dataset.dragged=1;c.classList.add('back');c.style.transform='';if(over){arm(null);onDrop(c,over)}};
  c.addEventListener('click',()=>{if(c.dataset.dragged){delete c.dataset.dragged;return}arm(armed===c?null:c)});
  c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up)})};
window.shake=n=>{n.classList.remove('shake');n.offsetWidth;n.classList.add('shake')};
/* FLIP: animate layout changes of children */
window.flip=(nodes,change)=>{const a=new Map(nodes().map(n=>[n,n.getBoundingClientRect()]));change();if(RM)return;nodes().forEach(n=>{const r=a.get(n);if(!r)return;const b=n.getBoundingClientRect(),dx=r.left-b.left,dy=r.top-b.top;if(!dx&&!dy)return;n.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:420,easing:'cubic-bezier(0.23,1,0.32,1)'})})};
document.addEventListener('DOMContentLoaded',()=>{const p=document.querySelector('.prog');if(!p)return;let q=0;const u=()=>{q=0;const h=document.documentElement;p.style.setProperty('--p',h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight))};addEventListener('scroll',()=>{if(!q){q=1;requestAnimationFrame(u)}},{passive:true});u()});
