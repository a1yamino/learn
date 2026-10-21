const S=(t,s,c='',w=140)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const R=[['u','用户','503 / 超时'],['g','Gateway / Ingress','路由、TLS'],['sv','Service','有端点吗'],['po','Pod','Ready 吗'],['ap','应用','日志、依赖']];const O=[['d','Deployment','rollout status'],['rs','ReplicaSet','新旧副本'],['pd','Pod','status · events'],['c','容器','退出码 · logs']];
const e={n:{w:700,cls:'tag'}};R.forEach(([k,t,s])=>e[k]=S(t,s,'',130));O.forEach(([k,t,s])=>e[k]=S(t,s,'',130));
const row=(L,y,hl)=>{const o={};L.forEach(([k],i)=>o[k]=[i*145,y,{cls:hl.includes(k)?'blk sig':'blk'}]);return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'先止血',p:'先看最近有没有发布或变更。有，就先回滚，恢复服务后再查原因。排障时间就是故障时间。',set:{n:[0,60,{html:'kubectl rollout history · argocd app history · 变更日历'}]}},
 {t:'沿请求路径',p:'请求失败时，从外到内逐跳检查：网关的路由和后端状态 → Service 有没有端点 → Pod 是否 Ready → 应用日志和依赖。找到第一个不正常的环节。',d:4200,set:row(R,0,['g','sv','po'])},
 {t:'沿对象层级',p:'Pod 起不来或发布卡住时，从上往下：Deployment 的 conditions → ReplicaSet 的副本 → Pod 的 status 和 events → 容器的退出码与上一次日志。',d:4200,set:{...row(R,0,[]),...row(O,110,['d','rs','pd','c'])}},
 {t:'交汇处',p:'两条线常在 Pod 汇合：Service 没有端点，往往是 Pod 不 Ready；Pod 不 Ready，再看探针和应用。每一步都用一条命令验证，而不是猜。',d:4000,set:{...row(R,0,['sv','po']),...row(O,110,['pd'])}}]});
const B=[10,20,40,80,160,300,300];const e2={n:{w:700,cls:'tag'},r:P('kubelet 重启容器','mute'),ok:P('运行 10 分钟无故障 → 退避重置','ok')};B.forEach((b,i)=>e2['b'+i]={w:Math.max(30,b/300*190),h:30,cls:'blk',html:b+'s'});
const bars=n=>{const o={};B.forEach((b,i)=>o['b'+i]=[0,i*36,{cls:i<n?'blk sig':'blk mute'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'第一次退出',p:'容器退出（restartPolicy: Always）。kubelet 等 10 秒后重启。',set:{...bars(1),r:[260,0]}},
 {t:'指数退避',p:'每次失败后等待时间翻倍：10s、20s、40s、80s、160s……状态在两次重启之间显示 CrashLoopBackOff。',d:4000,set:{...bars(5),r:[260,0]}},
 {t:'封顶',p:'上限 5 分钟。所以一个持续崩溃的容器看起来“很久才动一下”，这不是卡住，而是在退避。',d:3800,set:{...bars(7),n:[260,60,{html:'logs --previous 看上一次崩溃的输出'}]}},
 {t:'重置',p:'容器连续运行 10 分钟后，计数和退避时间才重置。修好后可以删除 Pod 立即重建，不必等待。',d:3600,set:{...bars(7),ok:[260,0]}}]});
(()=>{const ST=[
 {q:'用户报告 shop.example.com 返回 503。第一步？',o:[['kubectl get nodes','全部 Ready。没有直接线索，节点不是首要怀疑对象。',0],['kubectl -n shop rollout history deploy/api','REVISION  CHANGE-CAUSE\n11        api:1.4.2\n12        api:1.4.3   ← 3 分钟前','有：3 分钟前刚发布了 1.4.3。记下来，同时确认请求路径哪里断了。',1],['kubectl delete pod -n shop --all','不要这样做：删除所有 Pod 会让情况更糟，而且丢掉了排查证据。',0]]},
 {q:'网关返回 503 通常意味着没有可用的后端。下一步？',o:[['kubectl -n shop get endpointslices -l kubernetes.io/service-name=api','NAME        ADDRESSTYPE   PORTS   ENDPOINTS   AGE\napi-x8k2m   IPv4          8080    <unset>     40d','Service 没有任何就绪的端点。问题在 Pod 一侧。',1],['kubectl -n shop logs deploy/api','只显示其中一个 Pod 的日志，还不知道问题在哪一层，先确定断点。',0],['kubectl get pods -A','信息太多。先沿请求路径缩小到 shop/api。',0]]},
 {q:'端点为空。看 Pod：',o:[['kubectl -n shop get pods -l app=api','NAME              READY   STATUS    RESTARTS   AGE\napi-7f9c-x2k9l    0/1     Running   0          3m\napi-7f9c-qw8r4    0/1     Running   0          3m\napi-7f9c-k2p9x    0/1     Running   0          3m','都在运行但 0/1 Ready：没有崩溃，是 readiness 失败。而且旧版本的 Pod 已经一个都没有了。',1],['kubectl top pods -n shop','资源用量正常，不能解释没有端点。',0]]},
 {q:'Pod Running 但不 Ready。为什么？',o:[['kubectl -n shop describe pod api-7f9c-x2k9l | tail -3','Events:\n  Warning  Unhealthy  10s (x18 over 3m)  kubelet  Readiness probe failed: HTTP probe failed with statuscode: 503','readiness 探针 /ready 返回 503。应用认为自己没准备好。',1],['kubectl -n shop exec api-7f9c-x2k9l -- reboot','没有意义，也可能没有权限。',0]]},
 {q:'应用为什么返回 not ready？',o:[['kubectl -n shop logs api-7f9c-x2k9l | tail -2','level=warn msg="dependency check failed" dep=redis err="REDIS_URL not set"\nlevel=warn msg="not ready"','1.4.3 需要新的环境变量 REDIS_URL，prod 配置漏了。根因找到了。',1],['kubectl -n shop logs api-7f9c-x2k9l --previous','容器没有重启过，没有上一次的日志。',0]]},
 {q:'现在怎么办？',o:[['kubectl -n shop rollout undo deploy/api','deployment.apps/api rolled back\n…\nkubectl -n shop get endpointslices …   ENDPOINTS 10.244.1.9,10.244.2.7,10.244.2.8','先恢复服务：回到 1.4.2，端点恢复，503 消失。然后在 Git 里补上 REDIS_URL（或 revert），并调查为什么旧 Pod 全被删了：Deployment 用了 Recreate 策略。改进措施见本课挑战。',1],['kubectl -n shop set env deploy/api REDIS_URL=redis://redis:6379','能恢复，但在 GitOps 下这是漂移：会被改回或与 Git 不一致。先回滚，再通过 Git 修复。',0]]}];
 const ic=document.getElementById('ic'),im=document.getElementById('im');let step=0;const ch={};
 function draw(){ic.innerHTML='';ST.slice(0,step+1).forEach((s,i)=>{const d=document.createElement('div');d.style.cssText='padding:12px 0;border-bottom:1px solid var(--line)';d.innerHTML=`<div style="font-weight:600;margin-bottom:8px">${i+1}. ${s.q}</div><div class="cmds" style="margin:0"></div><pre class="log" style="height:auto;margin:8px 0 0;white-space:pre-wrap;display:none"></pre>`;const c=d.querySelector('.cmds'),lg=d.querySelector('pre');
  s.o.forEach(([cmd,out,why,ok])=>{const b=document.createElement('button');b.className='btn';b.textContent=cmd;b.dataset.ok=ok===1||why===1?1:0;b.addEventListener('click',()=>{c.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const good=typeof why==='string'&&ok===1;
   if(typeof why!=='string'){im.className='msg bad';im.innerHTML=out;lg.style.display='none';return}
   ch[i]=cmd;lg.style.display='block';lg.textContent='$ '+cmd+'\n'+out;im.className='msg ok';im.innerHTML=why;if(i===step&&step<ST.length-1){step++;draw()}});c.appendChild(b);if(ch[i]===cmd){b.classList.add('pri');lg.style.display='block';lg.textContent='$ '+cmd+'\n'+out}});ic.appendChild(d)})}
 draw();im.className='msg';im.innerHTML='选择一条命令。'})();
Term(document.getElementById('t4'),[
['kubectl get events -n shop --sort-by=.lastTimestamp | tail -5','LAST SEEN   TYPE      REASON      OBJECT                  MESSAGE\n10s         Warning   Unhealthy   pod/api-7f9c-x2k9l      Readiness probe failed…','按时间排序的事件，排障第一眼看这里。'],
['kubectl -n shop rollout status deploy/api --timeout=10s','Waiting for deployment "api" rollout to finish: 0 of 3 updated replicas are available...\nerror: timed out waiting for the condition','发布是否卡住。'],
['kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded','NAMESPACE   NAME             READY   STATUS             RESTARTS\nshop        worker-5d8b-x2   0/1     ImagePullBackOff   0','全集群不正常的 Pod。'],
['kubectl get pod api-7f9c-x2k9l -o jsonpath="{.status.containerStatuses[0].lastState}"','{"terminated":{"exitCode":137,"reason":"OOMKilled"}}','上一次退出的原因和退出码：137=SIGKILL（常见 OOM），143=SIGTERM，1=应用错误。'],
['kubectl debug -it api-7f9c-x2k9l --image=nicolaka/netshoot --target=api','Targeting container "api". If you don\'t see processes from this container…\n~ # ss -tnp','临时调试容器，共享目标容器的进程命名空间。'],
['kubectl describe node learn-worker | grep -A6 Conditions','Conditions:\n  MemoryPressure   False\n  DiskPressure     True    KubeletHasDiskPressure\n  PIDPressure      False\n  Ready            True','节点压力会导致驱逐和调度限制。']]);
Quiz(document.getElementById('qs'),[
['Service 的 EndpointSlice 为空，最可能的原因？',['DNS 故障','selector 不匹配或 Pod 都不 Ready','节点 NotReady'],1,'先查这两点。'],
['容器退出码 137 通常表示？',['应用正常退出','被 SIGKILL，常见为 OOMKilled','镜像不存在'],1,'128+9。'],
['刚发布后出现大面积错误，第一步？',['查看所有日志找原因','回滚，恢复后再查','重启所有节点'],1,'先止血。'],
['镜像里没有 shell，想在 Pod 网络里调试，用？',['kubectl exec','kubectl debug 临时容器','重新构建镜像'],1,'--target 共享进程命名空间。']]);
