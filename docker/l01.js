const kv=rows=>rows.map(([k,v,x])=>`<div class="kv${x?' x':''}"><span>${k}</span><span>${v}</span></div>`).join('');
const blk=(t,c='')=>({cls:'blk '+c,html:t});
/* ---------- Mission 1 animation ---------- */
const SRV_NEW=`<h6>生产服务器 · 只装了 Docker</h6>`+kv([['python','3.12'],['openssl','3.0'],['requests','2.31']]);
Player(document.getElementById('p1'),{els:{
 lap:{w:280,cls:'card',html:`<h6>你的电脑</h6>`+kv([['python','3.12'],['openssl','3.0'],['requests','2.31']])},
 srv:{w:280,cls:'card',html:`<h6>生产服务器</h6>`+kv([['python','3.8',1],['openssl','1.1',1],['requests','2.20',1]])},
 arrow:{w:140,cls:'tag',html:'<div style="text-align:center;font-size:13px">部署<br><span style="font-size:28px;color:var(--ink)">→</span></div>'},
 okL:{cls:'pill ok',html:'运行正常'},stS:{cls:'pill bad',html:'ImportError · SSL 错误'},pkg:{w:310,h:206,cls:'frame',html:'<i>镜像 myapp:1.0</i>'}},
 scenes:[
 {t:'本地一切正常',p:'Python 3.12、OpenSSL 3.0、requests 2.31。测试全部通过。',set:{lap:[110,150],okL:[110,370]}},
 {t:'服务器上跑不起来',p:'服务器的三个版本都更旧。同样的代码报 <b>ImportError</b> 和 SSL 错误。代码没变，变的是环境。',d:3600,set:{lap:[110,150],okL:[110,370],arrow:[430,220],srv:[610,150],stS:[610,370]}},
 {t:'把环境和代码一起打包',p:'Docker 把应用连同运行时、依赖、配置打包成一个<b>镜像</b>。',set:{lap:[110,150],okL:[110,370],pkg:[95,128],arrow:[430,220],srv:[610,150],stS:[610,370]}},
 {t:'在服务器上运行同一个镜像',p:'服务器只需要安装 Docker。镜像里的版本和本地完全一样。',d:3800,set:{lap:[110,150],okL:[110,370],arrow:[430,220],pkg:[595,128],srv:[610,150,{html:SRV_NEW}],stS:[610,370,{html:'运行正常',cls:'pill ok'}]}}]});
/* ---------- Mission 2 animation ---------- */
const VM={hw:[300,500],os:[300,452],hv:[300,404,{html:'Hypervisor',cls:'blk'}],g1:[300,356],g2:[436,356],g3:[572,356],d1:[300,308],d2:[436,308],d3:[572,308],a1:[300,260],a2:[436,260],a3:[572,260],lab:[300,222,{html:'<b>虚拟机</b> · 每个应用一套完整操作系统'}]};
const CT={hw:[300,500],os:[300,452,{html:'宿主机操作系统 · 共享内核'}],hv:[300,404,{html:'Docker Engine',cls:'blk ink'}],d1:[300,356],d2:[436,356],d3:[572,356],a1:[300,308],a2:[436,308],a3:[572,308],lab:[300,270,{html:'<b>容器</b> · 只有应用和它的依赖'}]};
Player(document.getElementById('p2'),{els:{
 hw:{w:400,h:40,...blk('硬件','dim')},os:{w:400,h:40,...blk('宿主机操作系统','dim')},hv:{w:400,h:40,...blk('Hypervisor')},
 g1:{w:128,h:40,...blk('Guest OS','dim')},g2:{w:128,h:40,...blk('Guest OS','dim')},g3:{w:128,h:40,...blk('Guest OS','dim')},
 d1:{w:128,h:40,...blk('依赖')},d2:{w:128,h:40,...blk('依赖')},d3:{w:128,h:40,...blk('依赖')},
 a1:{w:128,h:40,...blk('App A','sig')},a2:{w:128,h:40,...blk('App B','sig')},a3:{w:128,h:40,...blk('App C','sig')},lab:{w:400,cls:'tag'},
 m1:{w:220,html:'<div class="big">数十秒</div><div class="tag">虚拟机启动</div>'},m2:{w:220,html:'<div class="big" style="color:var(--sig)">&lt; 1 秒</div><div class="tag">容器启动</div>'}},
 scenes:[
 {t:'虚拟机：每个应用一套系统',p:'Hypervisor 模拟出多台“电脑”，每台装自己的操作系统（<b>Guest OS</b>），各占 GB 级磁盘和内存。',d:3600,set:VM},
 {t:'容器：共享宿主机内核',p:'去掉 Guest OS，只留应用和依赖。隔离靠内核的 <code>namespace</code> 和 <code>cgroups</code>。容器就是被隔离的普通进程。',d:4200,set:CT},
 {t:'结果：更快、更小',p:'不用启动操作系统，容器通常不到一秒启动。代价：隔离不如虚拟机彻底，且必须用宿主机内核。',d:3600,set:{...CT,m1:[740,250],m2:[740,370]}}]});
/* ---------- Mission 3 animation ---------- */
const IMG={L1:[290,470],L2:[290,418],L3:[290,366],imgLab:[290,530]},W={1:[290,318],2:[434,318],3:[578,318]};
Player(document.getElementById('p3'),{els:{
 L1:{w:420,h:46,...blk('① FROM python:3.12-slim','dim')},L2:{w:420,h:46,...blk('② RUN pip install -r requirements.txt','dim')},L3:{w:420,h:46,...blk('③ COPY app.py .','dim')},
 imgLab:{w:420,cls:'tag',html:'<b>镜像 myapp:1.0</b> · 3 个只读层 · 磁盘上只有 1 份'},
 W1:{w:132,h:40,...blk('容器 1 · 可写层','hatch')},W2:{w:132,h:40,...blk('容器 2 · 可写层','hatch')},W3:{w:132,h:40,...blk('容器 3 · 可写层','hatch')},f1:{cls:'pill sig',html:'+ log.txt'}},
 scenes:[
 {t:'镜像由只读层组成',p:'每一层记录一次文件变化：基础系统、依赖、代码。层生成后不再改变。',set:IMG},
 {t:'docker run：加一层可写层',p:'Docker 不复制镜像，只在上面加一层<b>可写层</b>并启动进程。这就是<b>容器</b>。',set:{...IMG,W1:W[1]}},
 {t:'多个容器共享同一份镜像',p:'三个容器，只读层在磁盘上仍然<b>只有一份</b>。',set:{...IMG,W1:W[1],W2:W[2],W3:W[3]}},
 {t:'写入只影响自己',p:'容器 1 写入 <code>/tmp/log.txt</code>，只进入它自己的可写层。这叫<b>写时复制</b>。',set:{...IMG,W1:W[1],W2:W[2],W3:W[3],f1:[308,280]}},
 {t:'删除容器，镜像不变',p:'<code>docker rm</code> 删除容器 3 和它的可写层。要保存的数据放在 <b>Volume</b> 里。',set:{...IMG,W1:W[1],W2:W[2],f1:[308,280]}}]});
/* ---------- Hands-on ---------- */
(()=>{const host=document.getElementById('host3'),ws=document.getElementById('ws3'),n=document.getElementById('n3'),ma=document.getElementById('msg3a'),mb=document.getElementById('msg3b'),b3=document.getElementById('b3'),img=document.getElementById('img3');let c=0;
 dragDrop([img],[host],()=>{if(c>=2)return;c++;n.textContent=c;const d=document.createElement('div');d.className='blk hatch enter';d.style.height='38px';d.textContent=`容器 ${c} · 可写层`;ws.appendChild(d);
  ma.className='msg';ma.textContent=c===1?'docker run：只多了一层可写层。再运行一个。':'两个容器，只读层仍然只有 1 份。';
  if(c===2){img.classList.add('used');b3.hidden=false;b3.classList.add('enter')}});
 let solved=false;document.getElementById('pick3').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||solved)return;const a=b.dataset.a;
  if(a==='ok'){solved=true;b.innerHTML='容器 1 · 可写层 <span class="pill sig" style="margin-left:8px;padding:4px 8px">+ log.txt</span>';b.classList.add('enter');mb.className='msg ok';mb.textContent='对。镜像和容器 2 都看不到这个文件。';}
  else{shake(b);mb.className='msg bad';mb.textContent=a==='ro'?'镜像层是只读的，不能修改。':'这是容器 2 的可写层。容器 1 写不到这里。'}})})();
/* ---------- Mission 4: terminal ---------- */
const T=[['docker run hello-world',`Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c1ec31eb5944: Pull complete
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.`,'<b>发生了四件事：</b>本地找不到镜像 → 从 Docker Hub 下载（<code>c1ec31eb5944</code> 是其中一层）→ 用镜像创建容器 → 容器打印信息后退出。'],
['docker ps -a',`CONTAINER ID   IMAGE         COMMAND    STATUS                    NAMES
3f2a9c1b7d4e   hello-world   "/hello"   Exited (0) 1 minute ago   happy_turing`,'<code>docker ps</code> 只列出运行中的容器，加 <code>-a</code> 才显示已退出的。<b>Exited (0)</b> 表示正常结束。'],
['docker images',`REPOSITORY    TAG       IMAGE ID       SIZE
hello-world   latest    d2c94e258dcb   13.3kB`,'列出本地镜像。<b>REPOSITORY:TAG</b> 是名字和版本。只有 13KB，因为里面没有操作系统。']];
(()=>{const el=document.getElementById('term'),tabs=el.querySelector('.tabs'),pre=el.querySelector('pre'),ex=document.getElementById('ex');let tm;const ran=new Set();const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
 
 T.forEach(([c,o,x],i)=>{const b=document.createElement('button');b.setAttribute('role','tab');b.textContent='$ '+c;b.addEventListener('click',()=>{tabs.querySelectorAll('button').forEach(z=>z.setAttribute('aria-selected',z===b));clearInterval(tm);let k=0;ex.innerHTML='';
  const done=()=>{ex.innerHTML=x;b.classList.add('ran');ran.add(i);};
  const draw=()=>pre.innerHTML=`<b>$ ${c}</b>\n<span>${esc(o.slice(0,k))}</span>`;if(RM){k=o.length;draw();done();return}tm=setInterval(()=>{k+=6;draw();if(k>=o.length){clearInterval(tm);done()}},14)});tabs.appendChild(b)})})();
/* ---------- Mission 5: quiz ---------- */
const Q=[['镜像和容器的关系，哪一项最准确？',['镜像是运行中的进程，容器是文件','镜像是只读的层；容器是镜像加一层可写层，并作为进程运行','两者是同一个东西的不同叫法'],1,'容器在镜像的只读层上加了自己的可写层。'],
['用同一个镜像启动 3 个容器，镜像的只读层在磁盘上有几份？',['1 份，被共享','3 份','4 份'],0,'只读层共享，每个容器只多一层可写层。'],
['容器比虚拟机轻量的主要原因是？',['容器用的编程语言更快','容器共享宿主机内核，不需要各自运行操作系统','容器不能联网'],1,'没有 Guest OS，所以启动快、体积小。']];
(()=>{const el=document.getElementById('qs');let ok=0;
 Q.forEach((q,qi)=>{const d=document.createElement('div');d.className='q';d.innerHTML=`<h4>${qi+1}. ${q[0]}</h4>`+q[1].map((o,i)=>`<button class="op" data-i="${i}"><i>${'ABC'[i]}</i><span>${o}</span></button>`).join('')+'<div class="fb" aria-live="polite"></div>';
  d.addEventListener('click',e=>{const b=e.target.closest('.op');if(!b||d.classList.contains('ok'))return;const fb=d.querySelector('.fb');
   if(+b.dataset.i===q[2]){b.classList.add('r');d.classList.add('ok');fb.textContent='正确。'+q[3];ok++}else{b.classList.add('w');shake(b);fb.textContent='不对，再选一次。'}});el.appendChild(d)})})();
