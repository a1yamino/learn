const S=(t,s,c='',w=170)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{o:S('观察','读 spec 和实际状态'),c:S('比较','期望 3，实际 2'),a:S('行动','创建 1 个 Pod'),w:S('写回','status.replicas=3'),q:P('工作队列','mute'),ev:P('事件只是“该看看了”的提示','mute'),n:{w:640,cls:'tag'}},scenes:[
 {t:'观察',p:'控制器从本地缓存（informer，基于 watch）读取对象的 spec 以及它管理的实际资源。',set:{o:[0,0,{cls:'blk sig'}],c:[220,0],a:[220,100],w:[0,100]}},
 {t:'比较',p:'计算期望与实际的差异。',set:{o:[0,0],c:[220,0,{cls:'blk sig'}],a:[220,100],w:[0,100]}},
 {t:'行动并写回',p:'只执行缩小差异的一步，把观察到的情况写入 status。然后回到开头。',set:{o:[0,0],c:[220,0],a:[220,100,{cls:'blk sig'}],w:[0,100,{cls:'blk sig'}]}},
 {t:'事件只是触发器',p:'watch 事件把对象的 key 放进工作队列，但控制器处理时<b>重新读取当前完整状态</b>，不看事件内容。多个事件合并成一次处理；错过事件，周期性的重新同步也会补上。',d:4200,set:{o:[0,0],c:[220,0],a:[220,100],w:[0,100],q:[440,50],ev:[0,190]}}]});
Player(document.getElementById('p2'),{els:{obj:S('Deployment web','resourceVersion 100','',200),A:S('客户端 A','读到 rv=100','',150),B:S('客户端 B','读到 rv=100','',150),ok:P('A 写入成功 → rv=101','ok'),cf:P('B：409 Conflict','bad'),rt:P('B 重新读取 rv=101，再写 → rv=102','ok'),n:{w:640,cls:'tag'}},scenes:[
 {t:'同时读取',p:'A 和 B 都读到同一个版本 100。A 想改镜像，B 想加一个标签。',set:{obj:[180,0],A:[0,110],B:[390,110]}},
 {t:'A 先写',p:'A 提交更新时带着 rv=100。和存储里的版本一致，写入成功，版本变成 101。',set:{obj:[180,0,{cls:'blk sig',html:'Deployment web<br><span style="font-size:11px;opacity:.7">resourceVersion 101</span>'}],A:[0,110],B:[390,110],ok:[0,190]}},
 {t:'B 冲突',p:'B 也带着 rv=100 提交，但存储里已经是 101。API Server 拒绝：409 Conflict。如果不检查，B 会用旧数据覆盖掉 A 的修改。',d:3800,set:{obj:[180,0],A:[0,110],B:[390,110],ok:[0,190],cf:[390,190]}},
 {t:'重试',p:'B 重新读取最新对象，重新应用自己的修改，再提交。控制器的标准做法就是“冲突就重新排队”。<code>kubectl apply</code> 和 <code>patch</code> 在服务器端合并，通常不会遇到冲突。',d:4000,set:{obj:[180,0,{cls:'blk sig',html:'Deployment web<br><span style="font-size:11px;opacity:.7">resourceVersion 102</span>'}],A:[0,110],B:[390,110],rt:[200,250]}}]});
(()=>{const TL=[[0,'期望 3，实际 3',3,3,true],[1,'期望改为 5',5,3,true],[2,'控制器断线',5,3,false],[3,'有人删除了 1 个 Pod',5,2,false],[4,'期望改为 6',6,2,false],[5,'控制器恢复',6,2,true]];
 let mode='level';const ct=document.getElementById('ct'),cl=document.getElementById('cl2'),cm=document.getElementById('cm2');
 [['edge','边沿触发：按收到的事件增减'],['level','水平触发：每次比较完整状态']].forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{mode=v;run()});ct.appendChild(b)});
 function run(){ct.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===mode));const L=[];let actual=3;let lastWant=3;
  for(const [t,ev,want,,up] of TL){let line=`t${t}  ${ev}`;
   if(ev.includes('删除'))actual-=1;
   if(up){if(mode==='level'){if(actual!==want){line+=`  → 比较：期望 ${want}，实际 ${actual}，${actual<want?'创建':'删除'} ${Math.abs(want-actual)} 个`;actual=want}}
    else{if(ev.includes('期望改为')){const d=want-lastWant;line+=`  → 收到事件“+${d}”，创建 ${d} 个`;actual+=d}else if(ev.includes('恢复'))line+='  → 断线期间的事件已丢失，什么也不做'}}
   else line+='  （控制器收不到）';if(ev.includes('期望改为'))lastWant=want;L.push(line+`　｜ 实际：${actual}`)}
  cl.innerHTML=L.map(x=>`<div>${x}</div>`).join('');const fin=TL[TL.length-1][2];
  if(actual===fin){cm.className='msg ok';cm.innerHTML=`最终实际 ${actual}，等于期望 ${fin}。恢复后的第一次调和直接看当前状态，断线期间发生了什么都不重要。这就是 Kubernetes 控制器的写法。`}
  else{cm.className='msg bad';cm.innerHTML=`最终实际 ${actual}，期望 ${fin}，<b>永远不会自己纠正</b>。基于事件增减的逻辑一旦错过事件（断线、重启、事件合并），状态就永久偏离。`}}run()})();
Term(document.getElementById('t4'),[
['kubectl get deploy web -o jsonpath="{.metadata.generation} {.status.observedGeneration}"','7 6','generation 7 还没被处理（控制器忙或卡住）。CI 等待部署完成时，<code>rollout status</code> 会检查两者相等。'],
['kubectl get deploy web -o yaml --show-managed-fields | grep -B1 -A2 "manager:"','  - apiVersion: apps/v1\n    manager: kubectl\n    operation: Apply\n  - apiVersion: apps/v1\n    manager: kube-controller-manager\n    operation: Update','每个管理者负责的字段集合。控制器写 status，你写 spec。'],
['kubectl apply --server-side --force-conflicts -f web.yaml','deployment.apps/web serverside-applied','强制接管有冲突的字段。只在确认要从别的管理者手里拿回所有权时使用。'],
['kubectl get ns stuck -o jsonpath="{.spec.finalizers} {.status.phase}"','["kubernetes"] Terminating','命名空间卡在 Terminating：里面还有对象的 finalizer 没被处理（常见于负责的控制器已被卸载）。先找出是哪些对象，再处理，不要盲目删除 finalizer。'],
['kubectl api-resources --verbs=list --namespaced -o name | xargs -n1 kubectl get -n stuck --ignore-not-found --no-headers 2>/dev/null','certificate.cert-manager.io/old   False   old-tls   40d','找出 Terminating 命名空间里剩下的对象。'],
['kubectl delete deploy web --cascade=orphan','deployment.apps "web" deleted','只删除 Deployment，保留 ReplicaSet 和 Pod（移除 ownerReferences）。默认 <code>--cascade=background</code> 级联删除。']]);
Quiz(document.getElementById('qs'),[
['控制器断线期间错过了几个事件，恢复后会怎样？',['永久偏离期望','第一次调和就基于当前状态纠正','需要人工重放事件'],1,'水平触发。'],
['更新时返回 409 Conflict，正确的处理是？',['强制覆盖','重新读取最新版本，重新应用修改后再提交','等待一小时'],1,'乐观并发。'],
['generation 是 5，observedGeneration 是 4，说明？',['对象被删除','最新的 spec 修改还没被控制器处理','出错了'],1,'等待两者相等。'],
['对象有 deletionTimestamp 但还在，原因是？',['etcd 慢','还有 finalizer 没被移除','RBAC'],1,'等待负责的控制器完成清理。']]);
