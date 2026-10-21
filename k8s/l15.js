const S=(t,s,c='',w=140)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const nd=(k,c)=>({...S('node-'+k,'',c,110)});
Player(document.getElementById('p1'),{els:{q:S('调度队列','Pod web-7f…（Pending）','',170),n1:nd(1),n2:nd(2),n3:nd(3),n4:nd(4),f:P('过滤：资源、污点、亲和性、端口、卷拓扑…','mute'),s:P('打分：资源均衡、偏好亲和、镜像已存在…','mute'),s3:P('72','mute'),s4:P('88','ok'),b:P('Binding：nodeName = node-4','ok'),n:{w:700,cls:'tag'}},scenes:[
 {t:'取出 Pod',p:'调度器 watch 到 nodeName 为空的 Pod，放进队列，按优先级逐个处理。',set:{q:[0,40],n1:[260,0],n2:[400,0],n3:[540,0],n4:[680,0]}},
 {t:'过滤',p:'对每个节点运行一组过滤插件。node-1 剩余 CPU 不够 requests，node-2 有 Pod 不容忍的污点：排除。',d:3800,set:{q:[0,40],n1:[260,0,{cls:'blk bad'}],n2:[400,0,{cls:'blk bad'}],n3:[540,0],n4:[680,0],f:[260,80]}},
 {t:'打分',p:'剩下的节点由打分插件各给 0–100 分，按权重加总。分数只用来排序。',d:3600,set:{q:[0,40],n1:[260,0,{cls:'blk mute'}],n2:[400,0,{cls:'blk mute'}],n3:[540,0],n4:[680,0,{cls:'blk sig'}],s:[260,80],s3:[575,120],s4:[715,120]}},
 {t:'绑定',p:'调度器向 API Server 写一个 Binding（设置 nodeName）。接下来是 node-4 上 kubelet 的事（第 13 课）。没有节点通过过滤时，Pod 留在 Pending，事件列出每个原因的节点数。',d:4000,set:{q:[0,40,{cls:'blk ok'}],n4:[680,0,{cls:'blk ok'}],b:[260,80]}}]});
Player(document.getElementById('p2'),{els:{nf:{w:330,h:170,cls:'frame',html:'<i>node-4（已满）</i>'},l1:S('batch-1','priority 0','',130),l2:S('batch-2','priority 0','',130),w:S('payment','priority 1000','',150),ev:P('驱逐 batch-2（优雅终止）','bad'),nm:P('nominatedNodeName: node-4','mute'),n:{w:700,cls:'tag'}},scenes:[
 {t:'放不下',p:'高优先级的 payment Pod 来了，所有节点都通过不了资源过滤。',set:{nf:[0,0],l1:[20,40],l2:[170,40],w:[420,40]}},
 {t:'寻找牺牲者',p:'调度器模拟：在哪个节点上驱逐一些<b>更低优先级</b>的 Pod 后就能放下？尽量选影响最小的方案，并尊重 PodDisruptionBudget（尽力而为）。',d:4200,set:{nf:[0,0],l1:[20,40],l2:[170,40,{cls:'blk bad'}],w:[420,40,{cls:'blk sig'}],nm:[420,110]}},
 {t:'驱逐并等待',p:'被选中的 Pod 按 grace period 优雅终止。高优先级 Pod 记下 nominatedNodeName，资源释放后进入该节点。',d:4000,set:{nf:[0,0],l1:[20,40],w:[170,40,{cls:'blk ok'}],ev:[420,110]}},
 {t:'用好优先级',p:'给关键服务高于批处理任务的 PriorityClass；不要把所有东西都设成高优先级，否则等于没有。不想抢占别人但想排在队列前面：<code>preemptionPolicy: Never</code>。',d:4000,set:{nf:[0,0],l1:[20,40],w:[170,40,{cls:'blk ok'}]}}]});
(()=>{const N=[{n:'node-1',z:'a',cpu:0.5,lab:'disk=hdd',t:''},{n:'node-2',z:'a',cpu:3,lab:'gpu=true',t:'gpu=true:NoSchedule'},{n:'node-3',z:'b',cpu:2,lab:'disk=ssd',t:'',api:1},{n:'node-4',z:'b',cpu:4,lab:'disk=ssd',t:''}];
 const O=[['sel','nodeSelector: disk=ssd'],['tol','容忍 gpu 污点'],['anti','反亲和：不与 app=api 同节点（required）'],['pref','偏好 zone=a（preferred）']];const on={};
 const sc=document.getElementById('sc'),el=document.getElementById('nodes'),sm=document.getElementById('sm');
 O.forEach(([k,t])=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.textContent=t;b.addEventListener('click',()=>{on[k]=!on[k];b.classList.toggle('pri',on[k]);draw()});sc.appendChild(b)});
 function draw(){const R=N.map(x=>{let why='';if(x.cpu<1)why='CPU 不足（剩 0.5，需要 1）';else if(x.t&&!on.tol)why='有不容忍的污点 '+x.t;else if(on.sel&&x.lab!=='disk=ssd')why='不匹配 nodeSelector';else if(on.anti&&x.api)why='已有 app=api 的 Pod';
   const s=why?null:Math.round(x.cpu/4*60)+(on.pref&&x.z==='a'?40:0);return{...x,why,s}});const ok=R.filter(r=>r.s!==null);const best=ok.sort((a,b)=>b.s-a.s)[0];
  el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:14px 0">'+R.map(r=>`<div class="blk ${r.why?'bad':best&&r.n===best.n?'ok':''}" style="display:block;height:auto;padding:10px;text-align:left;font-size:12px;line-height:1.6"><b>${r.n}</b> · zone ${r.z}<br>剩余 CPU ${r.cpu} · ${r.lab}<br>${r.t?'污点 '+r.t:'无污点'}${r.api?'<br>运行着 app=api':''}<br><span style="opacity:.85">${r.why?'✗ '+r.why:'✓ 通过 · 得分 '+r.s}</span></div>`).join('')+'</div>';
  sm.className='msg '+(best?'ok':'bad');sm.innerHTML=best?`选择 <b>${best.n}</b>（${ok.length} 个节点通过过滤）。`+(on.pref&&best.z!=='a'?' 偏好 zone=a 只是加分，a 区节点都被过滤掉了，所以仍落在 b 区。':''):`0/4 nodes are available：Pod 保持 Pending。${R.map(r=>r.why).join('；')}。`}
 draw()})();
Term(document.getElementById('t4'),[
['kubectl describe node learn-worker | sed -n "/Allocated resources/,/Events/p"','Allocated resources:\n  Resource           Requests     Limits\n  --------           --------     ------\n  cpu                850m (10%)   100m (1%)\n  memory             190Mi (2%)   390Mi (4%)','调度器按这里的 Requests 判断剩余空间，不看实际用量。'],
['kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints[*].key','NAME                  TAINTS\nlearn-control-plane   node-role.kubernetes.io/control-plane\nlearn-worker          <none>\nlearn-worker2         dedicated','一次看所有节点的污点。'],
['kubectl get pod web-7f -o jsonpath="{.status.conditions[?(@.type==\'PodScheduled\')].message}"','0/3 nodes are available: 1 node(s) had untolerated taint {dedicated: gpu}, 2 node(s) didn\'t match pod anti-affinity rules.','Pending 的原因写在 PodScheduled 条件和事件里。'],
['kubectl get priorityclass','NAME                      VALUE        GLOBAL-DEFAULT\nsystem-cluster-critical   2000000000   false\nsystem-node-critical      2000001000   false','内置的两个高优先级类，留给系统组件。'],
['kubectl cordon learn-worker2','node/learn-worker2 cordoned','标记不可调度（加 unschedulable 污点），已有 Pod 不受影响。<code>uncordon</code> 恢复。'],
['kubectl drain learn-worker2 --ignore-daemonsets --delete-emptydir-data','evicting pod default/s-6c9d…\npod/s-6c9d… evicted\nnode/learn-worker2 drained','cordon + 逐个驱逐（遵守 PDB）。维护节点前的标准操作。']]);
Quiz(document.getElementById('qs'),[
['节点实际 CPU 使用率 10%，但 requests 已分配满，新 Pod 能调度上去吗？',['能','不能','看 limits'],1,'调度只看 requests。'],
['只给节点加污点、给 Pod 加容忍，Pod 一定会去这个节点吗？',['一定会','不一定，容忍只是允许','一定不会'],1,'要再加节点亲和性。'],
['preferredDuringScheduling 的规则无法满足时？',['Pod Pending','仍会调度到其他节点','报错'],1,'软条件只影响打分。'],
['把 4 个副本均匀分到 2 个可用区，推荐用？',['nodeName','topologySpreadConstraints','PriorityClass'],1,'maxSkew 控制偏差。']]);
