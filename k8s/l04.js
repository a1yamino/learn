const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{d:S('Deployment web','replicas 3 · nginx:1.26','',200),r1:S('ReplicaSet','web-7c5b… · 1.26','',180),r2:S('ReplicaSet','web-6b7f… · 1.27','',180),a1:P('pod'),a2:P('pod'),a3:P('pod'),b1:P('pod'),b2:P('pod'),b3:P('pod'),n:{w:640,cls:'tag'}},scenes:[
 {t:'Deployment',p:'你只创建这一个对象：副本数、Pod 模板、更新策略。',set:{d:[0,0]}},
 {t:'ReplicaSet',p:'Deployment 控制器根据 Pod 模板的哈希创建 ReplicaSet。ReplicaSet 的唯一职责：保持 N 个匹配标签的 Pod。',d:3600,set:{d:[0,0],r1:[0,100],a1:[0,190],a2:[60,190],a3:[120,190]}},
 {t:'修改模板',p:'镜像改成 1.27：模板哈希变了，Deployment 创建<b>新的</b> ReplicaSet，然后逐步调整两个 ReplicaSet 的副本数。',d:3800,set:{d:[0,0,{html:'Deployment web<br><span style="font-size:11px;opacity:.7">replicas 3 · nginx:1.27</span>'}],r1:[0,100],r2:[260,100,{cls:'blk sig'}],a1:[0,190],a2:[60,190],b1:[260,190]}},
 {t:'旧 ReplicaSet 保留',p:'更新完成后，旧 ReplicaSet 副本数为 0 但不删除。回滚就是把它重新扩大，不需要重新创建任何东西。',d:3800,set:{d:[0,0],r1:[0,100,{cls:'blk dim',html:'ReplicaSet<br><span style="font-size:11px;opacity:.7">web-7c5b… · 0 个</span>'}],r2:[260,100,{cls:'blk sig'}],b1:[260,190],b2:[320,190],b3:[380,190],n:[0,250,{html:'kubectl rollout undo = 扩大旧的、缩小新的'}]}}]});
const V=(v,x,c)=>[x,40,{cls:'pill '+c,html:v}];
const pe={};for(let i=0;i<5;i++)pe['p'+i]=P('v1');const vs=(arr)=>{const o={};arr.forEach((a,i)=>o['p'+i]=V(a[0],i*80,a[1]));return o};
Player(document.getElementById('p2'),{els:{...pe,n:{w:620,cls:'tag'}},scenes:[
 {t:'开始',p:'4 个 v1 Pod。默认策略：maxSurge 25%（向上取整 = 1），maxUnavailable 25%（向下取整 = 1）。',set:{...vs([['v1','sig'],['v1','sig'],['v1','sig'],['v1','sig']]),n:[0,100,{html:'可用 4'}]}},
 {t:'第一步',p:'最多 5 个 Pod（4+1），最少 3 个可用（4−1）。创建 1 个 v2，同时终止 1 个 v1。',d:3600,set:{...vs([['v1','sig'],['v1','sig'],['v1','sig'],['v1 终止','mute'],['v2 启动','mute']]),n:[0,100,{html:'可用 3'}]}},
 {t:'等待就绪',p:'v2 通过 readiness 检查之后才算可用。之后继续下一轮。',d:3400,set:{...vs([['v1','sig'],['v1','sig'],['v2','ok'],['v1 终止','mute'],['v2 启动','mute']]),n:[0,100,{html:'可用 3'}]}},
 {t:'完成',p:'重复直到全部是 v2。整个过程中至少 3 个 Pod 在服务。',set:{...vs([['v2','ok'],['v2','ok'],['v2','ok'],['v2','ok']]),n:[0,100,{html:'可用 4'}]}}]});
(()=>{let surge=1,unav=1,st;const N=4;const ms=document.getElementById('ms'),mu=document.getElementById('mu'),rs=document.getElementById('rs'),rm=document.getElementById('rm');
 const mk=(el,lab,vals,set,get)=>{el.innerHTML=`<span style="font:500 13px var(--m);margin-right:6px">${lab}</span>`;vals.forEach(v=>{const b=document.createElement('button');b.className='btn';b.textContent=v;b.dataset.v=v;b.addEventListener('click',()=>{set(v);reset()});el.appendChild(b)})};
 mk(ms,'maxSurge：',[0,1,2,4],v=>surge=v);mk(mu,'maxUnavailable：',[0,1,2,4],v=>unav=v);
 function reset(){st={old:N,oldT:0,neu:0,neuR:0,step:0,minAv:N,maxTot:N};draw('点“下一步”。')}
 function step(){if(surge===0&&unav===0){draw();return}
  // finish terminations & readiness from previous step
  st.old-=st.oldT;st.oldT=0;st.neuR=st.neu;
  if(st.neuR>=N&&st.old===0){draw();return}
  st.step++;const avail=st.old+st.neuR;const tot=st.old+st.neu;
  let create=Math.min(N+surge-tot,N-st.neu);create=Math.max(create,0);st.neu+=create;
  let kill=Math.min(avail-(N-unav),st.old);kill=Math.max(kill,0);st.oldT=kill;
  st.minAv=Math.min(st.minAv,st.old-st.oldT+st.neuR);st.maxTot=Math.max(st.maxTot,st.old+st.neu);draw()}
 function draw(m){ms.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',+b.dataset.v===surge));mu.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',+b.dataset.v===unav));
  const pills=[];for(let i=0;i<st.old;i++)pills.push(i<st.old-st.oldT?['v1','sig']:['v1 终止中','mute']);for(let i=0;i<st.neu;i++)pills.push(i<st.neuR?['v2','ok']:['v2 启动中','mute']);
  rs.innerHTML=pills.map(([t,c])=>`<span class="pill ${c}" style="position:static">${t}</span>`).join('');
  const av=st.old-st.oldT+st.neuR,done=st.neuR>=N&&st.old===0;
  if(surge===0&&unav===0){rm.className='msg bad';rm.innerHTML='两个都是 0：既不能多建，也不能先删，滚动无法开始。Kubernetes 会拒绝这个配置。';return}
  if(m){rm.className='msg';rm.innerHTML=m;return}
  if(done){rm.className='msg ok';rm.innerHTML=`完成，用了 ${st.step} 步。过程中最少 <b>${st.minAv}</b> 个可用，最多同时存在 <b>${st.maxTot}</b> 个 Pod。`+(unav===0?' maxUnavailable 0：容量从不下降，代价是需要额外资源。':st.minAv<=N/2?' 可用数量下降很多：如果 4 个副本刚好够承载流量，这期间会过载。':'')+(surge===0?' maxSurge 0：不需要额外资源，但只能先删后建。':'')}
  else{rm.className='msg';rm.innerHTML=`第 ${st.step} 步：可用 ${av}，总数 ${st.old+st.neu}（上限 ${N+surge}，可用下限 ${N-unav}）。`}}
 document.getElementById('step').addEventListener('click',step);document.getElementById('rst').addEventListener('click',reset);reset()})();
Term(document.getElementById('t4'),[
['kubectl set image deployment/web nginx=nginx:1.27-alpine','deployment.apps/web image updated','命令式更新镜像。更推荐修改 YAML 后 <code>kubectl apply</code>，变更留在 git 里。'],
['kubectl rollout status deployment/web --timeout=120s','Waiting for deployment "web" rollout to finish: 3 of 4 updated replicas are available...\ndeployment "web" successfully rolled out','等待完成，失败或超时返回非 0。部署脚本和 CI 用它判断是否成功。'],
['kubectl get rs -l app=web','NAME             DESIRED   CURRENT   READY   AGE\nweb-6b7f9c8d5d   4         4         4       1m\nweb-7c5b8d6f9b   0         0         0       10m','每个版本一个 ReplicaSet。'],
['kubectl rollout history deployment/web --revision=2','deployment.apps/web with revision #2\nPod Template:\n  Labels:  app=web  pod-template-hash=6b7f9c8d5d\n  Annotations:  kubernetes.io/change-cause: v2 nginx 1.27\n  Containers:\n   nginx:\n    Image:  nginx:1.27-alpine','查看某个版本的完整模板。'],
['kubectl rollout undo deployment/web','deployment.apps/web rolled back','回到上一个版本。<code>--to-revision=N</code> 指定版本。'],
['kubectl rollout pause deployment/web','deployment.apps/web paused','暂停：之后的多次修改（镜像、环境变量、资源）不会各自触发滚动，<code>rollout resume</code> 后一次性生效。'],
['kubectl rollout restart deployment/web','deployment.apps/web restarted','不改内容，滚动重启所有 Pod（例如 ConfigMap 更新后让应用重新读取）。原理是在模板里加一个时间戳注解。']]);
Quiz(document.getElementById('qs'),[
['只把 replicas 从 3 改成 5，会创建新的 ReplicaSet 吗？',['会','不会，只有 Pod 模板变化才会','取决于镜像'],1,'副本数不在模板里。'],
['4 副本，maxSurge 1、maxUnavailable 0。更新过程中最少有几个可用 Pod？',['3','4','5'],1,'容量从不下降。'],
['新镜像拉取失败，滚动更新会怎样？',['所有旧 Pod 被删除，服务中断','卡住，剩余旧 Pod 继续服务','自动回滚'],1,'需要 rollout undo，或 CI 发现超时后回滚。'],
['为什么 rollout undo 很快？',['旧 ReplicaSet 还在，只需改副本数','它跳过了 readiness 检查','它重启节点'],0,'revisionHistoryLimit 默认保留 10 个。']]);
