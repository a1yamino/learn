const S=(t,s,c='',w=170)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{st:S('startupProbe','启动完成了吗？'),lv:S('livenessProbe','还活着吗？'),rd:S('readinessProbe','能接流量吗？'),a1:P('失败 → 重启（超过阈值）','bad'),a2:P('失败 → 重启容器','bad'),a3:P('失败 → 从端点摘除，不重启','mute'),hold:P('其余探针暂停中','mute'),n:{w:680,cls:'tag'}},scenes:[
 {t:'startupProbe',p:'应用启动期间只运行它。成功一次后，交给 liveness 和 readiness。允许的启动时间 = failureThreshold × periodSeconds。',d:3800,set:{st:[0,0,{cls:'blk sig'}],lv:[0,80,{cls:'blk dim'}],rd:[0,160,{cls:'blk dim'}],a1:[200,12],hold:[200,92]}},
 {t:'livenessProbe',p:'定期检查进程是否卡死（死锁、无限循环）。连续失败达到阈值 → kubelet 重启容器。',set:{st:[0,0,{cls:'blk dim'}],lv:[0,80,{cls:'blk sig'}],rd:[0,160],a2:[200,92]}},
 {t:'readinessProbe',p:'贯穿整个生命周期。失败时 Pod 仍在运行，只是不再接收 Service 的流量；恢复后自动加回。适合“暂时忙不过来”或“正在预热”。',d:3800,set:{st:[0,0,{cls:'blk dim'}],lv:[0,80],rd:[0,160,{cls:'blk sig'}],a2:[200,92],a3:[200,172]}},
 {t:'常见误用',p:'liveness 去检查数据库：数据库一抖，所有 Pod 一起被重启，雪上加霜。外部依赖的问题交给 readiness（或者干脆应用内部处理）。',d:4000,set:{lv:[0,80,{cls:'blk',html:'livenessProbe<br><span style="font-size:11px;opacity:.7">✗ 检查数据库连接</span>'}],rd:[0,160],a2:[200,92,{cls:'pill bad',html:'数据库抖动 → 全部重启'}],n:[0,250,{html:'liveness 只看自身；依赖交给 readiness'}]}}]});
const bar=(w,c)=>({w,h:22,cls:'',html:`<div style="width:${w}px;height:22px;border-radius:5px;background:${c}"></div>`});
Player(document.getElementById('p2'),{els:{node:{w:420,h:200,cls:'frame',html:'<i>节点 · 可分配 4 CPU</i>'},a:bar(150,'var(--sig)'),b:bar(150,'var(--sig)'),c:bar(150,'var(--ink3,#666)'),la:P('A: requests 1.5','mute'),lb:P('B: requests 1.5','mute'),lc:P('C: requests 1.5 → Pending','bad'),use:P('实际使用可以超过 requests，直到 limits','ok'),q1:P('Guaranteed','ok'),q2:P('Burstable','sig'),q3:P('BestEffort','bad'),n:{w:620,cls:'tag'}},scenes:[
 {t:'调度看 requests',p:'调度器把 requests 当作“预订”。节点可分配 4 CPU，A 和 B 各预订 1.5，还剩 1。',set:{node:[0,0],a:[20,50],la:[190,50],b:[20,90],lb:[190,90]}},
 {t:'放不下就 Pending',p:'C 也要 1.5，剩余 1 不够，调度器不会放在这里，即使 A 和 B 实际只用了很少的 CPU。',d:3600,set:{node:[0,0],a:[20,50],la:[190,50],b:[20,90],lb:[190,90],lc:[20,140]}},
 {t:'运行时看 limits',p:'容器可以使用超过 requests 的空闲资源，直到 limits。CPU 到上限被节流，内存到上限被 OOMKill。',d:3600,set:{node:[0,0],a:[20,50],b:[20,90],use:[20,140]}},
 {t:'QoS 与驱逐',p:'节点内存不足时，kubelet 按 QoS 驱逐：BestEffort 先走，然后是超出 requests 最多的 Burstable，Guaranteed 最后。',d:3800,set:{q3:[0,30],q2:[0,80],q1:[0,130],n:[160,80,{html:'← 驱逐顺序：先上后下'}]}}]});
(()=>{const A=[['none','只有 readiness'],['lv','liveness（10s 后开始，3 次失败）'],['st','startup（最多 90s）+ liveness']],B=[['self','liveness 检查 /healthz（自身）'],['db','liveness 检查数据库连接']];let a='lv',b='self';
 const pa=document.getElementById('pa'),pb=document.getElementById('pb'),pt=document.getElementById('pt'),pm=document.getElementById('pm');
 const mk=(el,L,set)=>L.forEach(([v,l])=>{const x=document.createElement('button');x.className='btn';x.textContent=l;x.dataset.v=v;x.addEventListener('click',()=>{set(v);draw()});el.appendChild(x)});mk(pa,A,v=>a=v);mk(pb,B,v=>b=v);
 function draw(){pa.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x.dataset.v===a));pb.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x.dataset.v===b));pb.style.opacity=a==='none'?.4:1;
  const L=[];let m,ok;
  if(a==='lv'){L.push('0:00  容器启动，Java 开始加载','0:10  liveness 开始检查 → 失败 (1/3)','0:20  失败 (2/3)','0:30  失败 (3/3) → <b style="color:var(--bad)">重启容器</b>','0:30  重新启动，还是要 45 秒…','1:00  再次重启 … RESTARTS 不断增加，CrashLoopBackOff');ok=0;m='应用永远等不到启动完成：45 秒的启动时间超过了 liveness 允许的 30 秒。这是最常见的探针事故。用 startupProbe 保护启动阶段，而不是把 initialDelaySeconds 调得很大（那样运行中卡死时发现也慢）。'}
  else{L.push('0:00  容器启动'+(a==='st'?'，startupProbe 每 5 秒检查一次':''),'0:45  启动完成，/healthz 返回 200'+(a==='st'?'，startupProbe 成功，交给 liveness':''),'0:45  readiness 通过，加入 Service 端点');
   if(a==='none'){L.push('1:30  数据库断开 → 请求出错，但 Pod 不受影响','2:30  数据库恢复');L.push('…    如果进程死锁：没有 liveness，Pod 一直挂着，永远不会被重启');ok=1;m='启动没问题。但没有 liveness，进程卡死时不会被发现。加上 startup + liveness 更好。'}
   else if(b==='db'){L.push('1:30  数据库断开 → liveness 失败','1:45  <b style="color:var(--bad)">所有副本同时被重启</b>','1:45  重启后又要 45 秒启动；数据库已恢复，但服务完全不可用','2:30  服务恢复，中断时间比数据库故障还长');ok=0;m='liveness 检查了外部依赖：数据库一出问题，所有 Pod 被一起重启，把一次局部故障放大成全面中断。liveness 只检查进程自身。'}
   else{L.push('1:30  数据库断开 → 应用返回错误，/healthz 仍正常，不重启','2:30  数据库恢复，请求恢复');ok=1;m='正确：startupProbe 保护了 45 秒的启动，liveness 只看自身，数据库故障不会触发重启。'}}
  pt.innerHTML=L.map(x=>`<div>${x}</div>`).join('');pm.className='msg '+(ok?'ok':'bad');pm.innerHTML=m}draw()})();
Term(document.getElementById('t4'),[
['kubectl get pod api-7d9f -o yaml | grep -A8 startupProbe','    startupProbe:\n      httpGet: { path: /healthz, port: 8080 }\n      periodSeconds: 5\n      failureThreshold: 18\n    livenessProbe:\n      httpGet: { path: /healthz, port: 8080 }\n      periodSeconds: 10','启动最多等 5×18 = 90 秒。之后 liveness 接管。'],
['kubectl describe pod api-7d9f | grep -E "Unhealthy|Killing"','Warning  Unhealthy  Readiness probe failed: HTTP probe failed with statuscode: 503\nNormal   Killing    Container api failed liveness probe, will be restarted','事件里能看到哪个探针失败、失败原因。'],
['kubectl top pods','NAME        CPU(cores)   MEMORY(bytes)\napi-7d9f    112m         381Mi\nweb-5d9c    3m           12Mi','实际使用量，需要 metrics-server（第 18 课安装）。和 requests 对比，判断设得是否合理。'],
['kubectl get pod api-7d9f -o jsonpath="{.status.qosClass}"','Burstable','QoS 等级由 requests/limits 自动决定。'],
['kubectl describe node learn-worker | grep -A4 Conditions','Conditions:\n  Type             Status  Reason\n  MemoryPressure   False   KubeletHasSufficientMemory\n  DiskPressure     False   KubeletHasNoDiskPressure','节点压力状态。True 时 kubelet 开始驱逐 Pod。'],
['kubectl get pods --field-selector=status.phase=Failed -A','NAMESPACE   NAME        READY   STATUS    REASON\nshop        api-6b8c    0/1     Evicted   The node was low on resource: memory.','被驱逐的 Pod。Deployment 会在别处重建，但要查明原因：通常是 requests 设得太低或没设。']]);
Quiz(document.getElementById('qs'),[
['readinessProbe 失败会怎样？',['重启容器','从 Service 端点摘除，不重启','删除 Pod'],1,'恢复后自动加回。'],
['应用启动需要 60 秒，最好的做法是？',['initialDelaySeconds 设 120','startupProbe','不要 liveness'],1,'既保护启动，又不影响运行时的检测速度。'],
['调度器根据什么判断节点放不放得下？',['实际使用量','requests','limits'],1,'requests 是预订。'],
['requests 和 limits 都没设的 Pod，QoS 是？',['Guaranteed','Burstable','BestEffort'],2,'资源紧张时最先被驱逐。']]);
