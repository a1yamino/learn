const S=(t,s,c='',w=130)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
Player(document.getElementById('p1'),{els:{h1:{w:280,h:190,cls:'frame',html:'<i>主机 A · 192.168.1.10</i>'},h2:{w:280,h:190,cls:'frame',html:'<i>主机 B · 192.168.1.11</i>'},c1:S('web','10.0.1.5'),c2:S('api','10.0.1.6'),ov:{w:640,h:36,cls:'blk sig',html:'overlay 网络 appnet · 10.0.1.0/24'},pk:{cls:'pill sig',html:'10.0.1.5 → 10.0.1.6'},pk2:{cls:'pill mute',html:'UDP 4789 [ VXLAN [ 10.0.1.5 → 10.0.1.6 ] ]'},n:{w:640,cls:'tag'}},scenes:[
 {t:'两台主机',p:'web 在主机 A，api 在主机 B。各自的 bridge 网络互相看不到。',set:{h1:[0,0],h2:[360,0],c1:[20,60],c2:[380,60]}},
 {t:'一个 overlay 网络',p:'两个容器都加入 overlay 网络 appnet，分到同一个子网的地址。它们认为彼此在同一个二层网络里。',d:3600,set:{h1:[0,0],h2:[360,0],c1:[20,60],c2:[380,60],ov:[0,220]}},
 {t:'封装',p:'web 发出的包目标是 10.0.1.6。主机 A 的内核把整个帧装进一个 UDP 包，发往主机 B 的 4789 端口。',d:3800,set:{h1:[0,0],h2:[360,0],c1:[20,60],c2:[380,60],ov:[0,220],pk:[20,130],pk2:[100,270]}},
 {t:'解封装',p:'主机 B 拆开 UDP 包，把原始帧交给 api。容器完全感知不到底层的物理网络。主机之间需要开放 UDP 4789、TCP/UDP 7946（节点通信）、TCP 2377（管理）。',d:4000,set:{h1:[0,0],h2:[360,0],c1:[20,60],c2:[380,60],ov:[0,220],pk:[380,130]}}]});
const N=i=>({w:150,h:150,cls:'frame',html:`<i>node${i}</i>`});
Player(document.getElementById('p2'),{els:{n1:N(1),n2:N(2),n3:N(3),t1:{cls:'pill sig',html:'web.1'},t2:{cls:'pill sig',html:'web.2'},t3:{cls:'pill sig',html:'web.3'},want:{cls:'pill mute',html:'期望：replicas 3'},x:{cls:'pill bad',html:'宕机'},n:{w:560,cls:'tag'}},scenes:[
 {t:'声明',p:'<code>docker service create --replicas 3 web</code>。manager 记录这个期望状态。',set:{n1:[0,40],n2:[190,40],n3:[380,40],want:[0,0]}},
 {t:'调度',p:'调度器把 3 个 task 分配到节点上，默认尽量分散。每个 task 对应一个容器。',set:{n1:[0,40],n2:[190,40],n3:[380,40],want:[0,0],t1:[30,90],t2:[220,90],t3:[410,90]}},
 {t:'节点宕机',p:'node3 失联。实际状态变成 2 个副本，和期望不一致。',set:{n1:[0,40],n2:[190,40],n3:[380,40,{cls:'frame dim'}],want:[0,0],t1:[30,90],t2:[220,90],t3:[410,90,{cls:'pill mute'}],x:[410,200]}},
 {t:'自动恢复',p:'manager 在其他节点上重新创建 web.3。不需要人介入。这个“观察 → 比较 → 修正”的循环，就是 Kubernetes 控制器的核心思想。',d:3800,set:{n1:[0,40],n2:[190,40],n3:[380,40,{cls:'frame dim'}],want:[0,0],t1:[30,90],t2:[220,70],t3:[220,110],n:[0,220,{html:'实际状态 → 期望状态'}]}}]});
(()=>{const nodes=[{n:'node1',mgr:true,up:true},{n:'node2',mgr:true,up:true},{n:'node3',mgr:true,up:true},{n:'node4',mgr:false,up:true}];
 const nb=document.getElementById('nb'),cl=document.getElementById('cl'),nm=document.getElementById('nm');
 nodes.forEach((d,i)=>{const b=document.createElement('button');b.className='btn';b.textContent=d.n+' 宕机';b.dataset.v=i;b.addEventListener('click',()=>{d.up=!d.up;b.textContent=d.n+(d.up?' 宕机':' 恢复');draw()});nb.appendChild(b)});
 function draw(){const up=nodes.filter(d=>d.up),mUp=nodes.filter(d=>d.mgr&&d.up).length,quorum=mUp>=2;
  let tasks=nodes.map(()=>0);if(quorum&&up.length){for(let k=0;k<4;k++){const i=nodes.indexOf(up[k%up.length]);tasks[i]++}}else{nodes.forEach((d,i)=>tasks[i]=d.up?1:0)}
  nb.querySelectorAll('.btn').forEach((b,i)=>b.classList.toggle('pri',!nodes[i].up));
  cl.innerHTML=nodes.map((d,i)=>`<div class="frame" style="position:static;padding:12px;min-height:110px;opacity:${d.up?1:.4}"><div style="font:500 12px var(--m)">${d.n} · ${d.mgr?'manager':'worker'}</div><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">${Array(tasks[i]).fill('<span class="pill sig" style="position:static">web</span>').join('')}</div></div>`).join('');
  const down=nodes.length-up.length;const run=tasks.reduce((a,b)=>a+b,0);
  if(!down){nm.className='msg';nm.innerHTML='4 个副本分布在 4 个节点。3 个 manager 通过 Raft 保持一致，多数派是 2。'}
  else if(quorum){nm.className='msg ok';nm.innerHTML=`${down} 个节点宕机，manager 还剩 ${mUp} 个（≥ 2，多数派仍在）。宕机节点上的任务已在其他节点重建，运行中 ${run}/4。`}
  else{nm.className='msg bad';nm.innerHTML=`manager 只剩 ${mUp} 个，<b>失去多数派</b>。已经运行的容器继续服务（${run} 个），但集群无法调度、无法补齐副本、无法更新。3 个 manager 最多容忍 1 个故障；要容忍 2 个需要 5 个。`}}draw()})();
Term(document.getElementById('t4'),[
['docker swarm init --advertise-addr 192.168.1.10','Swarm initialized: current node (k3x…) is now a manager.\n\nTo add a worker to this swarm, run the following command:\n    docker swarm join --token SWMTKN-1-… 192.168.1.10:2377','join 令牌就是加入集群的凭证，不要泄露。<code>docker swarm join-token manager</code> 获取加入为 manager 的令牌。'],
['docker node ls','ID      HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS\nk3x… *  node1     Ready   Active        Leader\nq8a…    node2     Ready   Active        Reachable\nz1p…    node3     Ready   Active        Reachable\nm2c…    node4     Ready   Active','维护节点前：<code>docker node update --availability drain node4</code>，任务会迁移到其他节点。'],
['docker service create --name api --replicas 3 --network appnet --limit-memory 256m --secret db_password ghcr.io/alice/api:1.4.2','overall progress: 3 out of 3 tasks\nverify: Service api converged','Swarm 原生支持 secret：加密存储在 Raft 中，以文件形式挂载到 <code>/run/secrets/db_password</code>（第 9 课）。'],
['docker service scale api=6','api scaled to 6','扩缩容。'],
['docker service update --image ghcr.io/alice/api:1.4.3 --update-parallelism 1 --update-delay 10s --update-failure-action rollback api','1/6: running\n2/6: running\n…\nverify: Service api converged','每次替换 1 个，间隔 10 秒。新任务失败则自动回滚。手动回滚：<code>docker service rollback api</code>。'],
['docker stack deploy -c compose.yaml shop','Creating network shop_default\nCreating service shop_api\nCreating service shop_web','用 Compose 文件部署。<code>deploy:</code> 下的副本、资源、更新策略在这里生效；<code>build:</code> 会被忽略，镜像要先推送到仓库。']]);
Quiz(document.getElementById('qs'),[
['overlay 网络怎么让不同主机上的容器通信？',['共享宿主机网络','把帧封装在 UDP（VXLAN）里在主机之间传','用 NAT 端口映射'],1,'UDP 4789。'],
['3 个 manager 的集群最多容忍几个 manager 故障？',['0','1','2'],1,'需要多数派（2/3）。'],
['一个节点宕机后，它上面的服务副本？',['永久丢失','被调度到其他节点','等节点恢复'],1,'Swarm 持续把实际状态拉回期望状态。'],
['docker stack deploy 会忽略 Compose 文件里的？',['image','build','ports'],1,'集群节点需要从仓库拉取镜像。']]);
