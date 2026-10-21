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
