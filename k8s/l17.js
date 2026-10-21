const S=(t,s,c='',w=130)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const e={hs:S('Service db','clusterIP: None','',170),n:{w:700,cls:'tag'}};[0,1,2].forEach(i=>{e['p'+i]=S('db-'+i,'db-'+i+'.db.ns.svc');e['v'+i]=S('data-db-'+i,'PVC','',130)});
const at=(i,c='')=>({['p'+i]:[180+i*165,30,{cls:'blk '+c}],['v'+i]:[180+i*165,130]});
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'按序号创建',p:'StatefulSet 先创建 db-0 和它的 PVC data-db-0，等 db-0 Ready 后才创建 db-1（podManagementPolicy: OrderedReady）。',d:3600,set:{hs:[0,30],...at(0,'sig')}},
 {t:'依次就绪',p:'每个副本一个自己的 PVC。名字可预测，应用可以据此配置：例如约定 db-0 是主库，其他是从库。',d:3600,set:{hs:[0,30],...at(0,'ok'),...at(1,'ok'),...at(2,'sig')}},
 {t:'稳定的 DNS',p:'headless Service（clusterIP: None）不做负载均衡，而是为每个 Pod 创建 DNS 记录 <code>db-1.db.ns.svc.cluster.local</code>。客户端可以连接指定的副本。',d:3800,set:{hs:[0,30,{cls:'blk sig'}],...at(0,'ok'),...at(1,'sig'),...at(2,'ok')}},
 {t:'重建后身份不变',p:'db-1 被删除或所在节点故障：新 Pod 仍叫 db-1，仍挂 data-db-1，DNS 名不变，只是 IP 可能变。滚动更新从最大序号开始倒序进行。',d:4200,set:{hs:[0,30],...at(0,'ok'),...at(1,'bad'),...at(2,'ok'),n:[180,220,{html:'Pod IP 会变，所以客户端应使用 DNS 名，不要缓存 IP'}]}}]});
const jb=i=>S('Pod '+i,'','',90);const e2={j:S('Job','completions 4 · parallelism 2','',200),cj:S('CronJob','*/5 * * * *','',150),a:jb(1),b:jb(2),c:jb(3),d:jb(4),f:P('失败 → 新 Pod（backoffLimit 计数）','bad'),cp:P('concurrencyPolicy: Forbid → 上一个没跑完就跳过','mute'),n:{w:700,cls:'tag'}};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'并发运行',p:'Job 同时最多运行 parallelism 个 Pod。',set:{j:[0,40],a:[260,0,{cls:'blk sig'}],b:[260,80,{cls:'blk sig'}]}},
 {t:'失败重试',p:'Pod 2 失败。restartPolicy: Never 时 Job 创建新 Pod 替代，间隔指数增长；失败次数超过 backoffLimit，整个 Job 失败。',d:4000,set:{j:[0,40],a:[260,0,{cls:'blk ok'}],b:[260,80,{cls:'blk bad'}],c:[380,0,{cls:'blk sig'}],d:[380,80,{cls:'blk sig'}],f:[260,160]}},
 {t:'完成',p:'成功数达到 completions，Job 标记 Complete，不再创建 Pod。已完成的 Pod 保留，便于查看日志，直到 Job 被删除或 TTL 到期。',d:3600,set:{j:[0,40,{cls:'blk ok'}],a:[260,0,{cls:'blk ok'}],b:[260,80,{cls:'blk mute'}],c:[380,0,{cls:'blk ok'}],d:[380,80,{cls:'blk ok'}]}},
 {t:'CronJob',p:'CronJob 控制器按时间表创建 Job（名字带时间戳）。如果到点时上一个 Job 还在运行，由 concurrencyPolicy 决定：Allow 并行、Forbid 跳过、Replace 删掉旧的。',d:4200,set:{cj:[0,40,{cls:'blk sig'}],j:[220,40],cp:[220,130]}}]});
(()=>{let pods=['db-0','db-1'],pvc=['data-db-0','data-db-1'],ver={},dataLost=false;
 const A=[['up3','扩容到 3'],['down1','缩容到 1'],['up3b','再扩容到 3'],['del','删除 PVC data-db-2'],['up3c','删 Pod db-2 让它重建']];
 const so=document.getElementById('so'),sv=document.getElementById('sv'),sm=document.getElementById('sm');
 const T={up3:()=>{pods=['db-0','db-1','db-2'];if(!pvc.includes('data-db-2'))pvc.push('data-db-2');return '按序创建 db-2，并为它创建新的 PVC data-db-2（空卷）。'},
  down1:()=>{pods=['db-0'];return '倒序删除：先 db-2，再 db-1。<b>PVC 保留</b>，不会因为缩容丢数据。'},
  up3b:()=>{pods=['db-0','db-1','db-2'];return 'db-1、db-2 重新创建，挂回原来的 data-db-1、data-db-2，数据还在。'},
  del:()=>{if(pods.includes('db-2')){return 'PVC 被 db-2 使用中，进入 Terminating（kubernetes.io/pvc-protection 保护），要等 Pod 删除后才真正删除。'+(pvc.includes('data-db-2')?(pvc=pvc.map(x=>x==='data-db-2'?'data-db-2 (Terminating)':x),''):'')}pvc=pvc.filter(x=>!x.startsWith('data-db-2'));return 'PVC 已删除。'},
  up3c:()=>{if(pvc.includes('data-db-2 (Terminating)')){pvc=pvc.filter(x=>!x.startsWith('data-db-2'));pvc.push('data-db-2');return 'Pod 删除后旧 PVC 真正删除；StatefulSet 重建 db-2 时按模板<b>新建</b>了一个空的 data-db-2。db-2 的数据丢了，需要从其他副本同步。'}pods=['db-0','db-1','db-2'];return 'db-2 重建，挂回 data-db-2。'}};
 A.forEach(([k,t])=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.textContent=t;b.addEventListener('click',()=>{so.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const m=T[k]();draw();sm.className='msg';sm.innerHTML=m});so.appendChild(b)});
 function draw(){const row=(l,a,c)=>`<div style="display:flex;gap:8px;align-items:center;margin:10px 0;flex-wrap:wrap"><span style="width:60px;font:600 12px var(--m);opacity:.7">${l}</span>${a.map(x=>`<span class="pill ${/Terminating/.test(x)?'bad':c}">${x}</span>`).join('')}</div>`;sv.innerHTML=row('Pod',pods,'ok')+row('PVC',pvc,'sig')}
 draw();sm.className='msg';sm.innerHTML='从左到右依次点击。'})();
Term(document.getElementById('t4'),[
['kubectl get sts db','NAME   READY   AGE\ndb     3/3     5m','StatefulSet 简写 sts。'],
['kubectl rollout status sts/db\nkubectl patch sts db -p \'{"spec":{"updateStrategy":{"rollingUpdate":{"partition":2}}}}\'','partitioned roll out complete: 3 new pods have been updated...\nstatefulset.apps/db patched','partition=2：只有序号 ≥ 2 的副本更新，用于金丝雀式发布。'],
['kubectl get ds -A','NAMESPACE     NAME         DESIRED   CURRENT   READY   NODE SELECTOR\nkube-system   kindnet      3         3         3       <none>\nkube-system   kube-proxy   3         3         3       kubernetes.io/os=linux','CNI 和 kube-proxy 本身就是 DaemonSet。'],
['kubectl create job manual --from=cronjob/tick','job.batch/manual created','手动立即触发一次 CronJob。'],
['kubectl patch cronjob tick -p \'{"spec":{"suspend":true}}\'','cronjob.batch/tick patched','暂停定时调度，不影响已在运行的 Job。'],
['kubectl logs job/batch','done','直接看 Job 的某个 Pod 日志。']]);
Quiz(document.getElementById('qs'),[
['StatefulSet 从 3 缩到 1，data-db-2 PVC 会？',['被删除','保留','被 db-0 挂载'],1,'默认保留。'],
['StatefulSet 需要配合哪种 Service 才有每个 Pod 的 DNS 名？',['NodePort','headless（clusterIP: None）','LoadBalancer'],1,'serviceName 指向它。'],
['日志采集代理每个节点一份，用？',['Deployment','DaemonSet','StatefulSet'],1,'新节点自动补上。'],
['CronJob 上一次还没跑完，希望本次跳过，设置？',['Allow','Forbid','Replace'],1,'Replace 会删掉旧的。']]);
