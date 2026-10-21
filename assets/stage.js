/* Stage engine: elements keep identity across scenes; changing scene moves them (magic move). */
window.Stage=function(o){const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const board=document.querySelector('.board'),stage=document.querySelector('.stage'),E={};
for(const[id,d]of Object.entries(o.els)){const n=document.createElement('div');n.className='el off '+(d.cls||'');n.style.width=d.w?d.w+'px':'max-content';if(d.h)n.style.height=d.h+'px';n.innerHTML=d.html||'';n.dataset.id=id;board.appendChild(n);E[id]={n,x:0,y:0,s:.96,placed:false}}
function fit(){const r=stage.getBoundingClientRect(),k=Math.min((r.width-48)/1000,(r.height-48)/600);board.style.transform=`scale(${k}) translate(-500px,-300px)`}
addEventListener('resize',fit);fit();
const S=o.scenes,ticks=document.querySelector('.ticks'),cnt=document.querySelector('.count'),prev=document.getElementById('prev'),next=document.getElementById('next'),pnl=document.querySelector('.swap');
let lastCh=null;S.forEach((s,i)=>{if(lastCh!==null&&s.ch!==lastCh){const g=document.createElement('span');g.className='gap';ticks.appendChild(g)}lastCh=s.ch;const b=document.createElement('button');b.setAttribute('aria-label',`第 ${i+1} 幕：${s.t}`);b.onclick=()=>go(i);ticks.appendChild(b)});
let cur=-1;
function place(id,v){const e=E[id];const[x,y,opt={}]=v;const first=!e.placed;e.x=x;e.y=y;e.placed=true;
 if(first){e.n.style.transition='none';e.n.style.transform=`translate(${x}px,${y+12}px) scale(.96)`;e.n.offsetWidth;e.n.style.transition=''}
 e.n.style.transform=`translate(${x}px,${y}px) scale(${opt.s||1})`;e.n.classList.remove('off');if(opt.html!==undefined)e.n.innerHTML=opt.html;if(opt.cls!==undefined)e.n.className='el '+opt.cls;e.n.style.transitionDelay=(opt.d||0)+'ms'}
function go(i,fromHash){if(i<0||i>=S.length||i===cur)return;const s=S[i];cur=i;
 const set=s.set||{};for(const id in E){if(set[id])place(id,set[id]);else{const e=E[id];e.n.classList.add('off');e.n.style.transitionDelay='0ms';if(e.placed)e.n.style.transform=`translate(${e.x}px,${e.y-10}px) scale(.97)`}}
 pnl.classList.add('out');setTimeout(()=>{document.querySelector('.panel .ch').textContent=s.ch;document.querySelector('.panel h1').innerHTML=s.t;document.querySelector('.panel .body').innerHTML=s.b;const act=document.querySelector('.panel .act');act.innerHTML='';if(s.act)s.act(act);pnl.classList.remove('out')},RM?0:200);
 [...ticks.querySelectorAll('button')].forEach((b,k)=>{b.className=k<i?'done':k===i?'cur':''});cnt.textContent=String(i+1).padStart(2,'0')+' / '+String(S.length).padStart(2,'0');
 prev.disabled=i===0;next.textContent=i===S.length-1?(o.nextLabel||'完成'):'下一步 →';if(!fromHash)history.replaceState(null,'','#'+(i+1));if(s.on)s.on(E)}
prev.onclick=()=>go(cur-1);next.onclick=()=>{if(cur===S.length-1&&o.nextHref)location.href=o.nextHref;else go(cur+1)};
addEventListener('keydown',e=>{if(e.target.closest('input,textarea'))return;if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();next.click()}if(e.key==='ArrowLeft')go(cur-1)});
addEventListener('hashchange',()=>{const k=parseInt(location.hash.slice(1));if(k>0&&k<=S.length)go(k-1,true)});const h=parseInt(location.hash.slice(1));go(h>0&&h<=S.length?h-1:0,true);return{go,E}};
