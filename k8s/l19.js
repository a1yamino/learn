const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{y:S('CRD YAML','websites.example.com','',170),api:S('API Server','','',150),et:S('etcd','','',110),ep:P('/apis/example.com/v1/namespaces/*/websites','mute'),sc:P('schema 校验：replicas ≤ 5','mute'),cr:S('Website blog','spec.image, spec.replicas','',190),k:P('kubectl get ws','ok'),nothing:P('没有控制器：只是一条数据','bad'),n:{w:700,cls:'tag'}},scenes:[
 {t:'注册类型',p:'apply 一个 CRD 对象。API Server 动态增加一组 REST 路径，无需重启。',d:3400,set:{y:[0,40,{cls:'blk sig'}],api:[260,40],ep:[180,130]}},
 {t:'创建实例',p:'之后可以创建 Website 对象。请求先经过 CRD 中的 OpenAPI schema 校验（类型、必填、范围、默认值），再存入 etcd。',d:3800,set:{cr:[0,40,{cls:'blk sig'}],api:[260,40],et:[480,40],sc:[180,130]}},
 {t:'和内置资源一样',p:'kubectl get、watch、label selector、RBAC、审计全部可用。additionalPrinterColumns 决定 kubectl get 显示哪些列。',d:3600,set:{cr:[0,40],api:[260,40],et:[480,40],k:[260,130]}},
 {t:'但还不会发生任何事',p:'没有控制器 watch 它，Website 不会变成 Deployment。把它变成现实是 Operator 的工作。',d:3600,set:{cr:[0,40],api:[260,40],et:[480,40],nothing:[180,130]}}]});
const R=[['g','读取 CR','Get Website blog'],['o','读取子资源','Deployment、Service'],['d','比对差异','应有 vs 现有'],['a','执行一步','创建 / 更新'],['s','写 status','ready、conditions'],['q','结束或重新排队','RequeueAfter']];
const e2={n:{w:700,cls:'tag'}};R.forEach(([k,t,s])=>e2[k]=S(t,s,'',150));const G={g:[0,0],o:[180,0],d:[360,0],a:[540,0],s:[360,110],q:[180,110]};
const on=(...k)=>{const o={};R.forEach(([x])=>o[x]=[G[x][0],G[x][1],{cls:k.includes(x)?'blk sig':'blk mute'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'触发',p:'CR 或它拥有的子资源发生变化（或定期 resync），对象的 namespace/name 被放入工作队列。Reconcile 只拿到名字，不知道“发生了什么”。',d:4000,set:on('g')},
 {t:'观察',p:'从本地缓存读取 CR 和它拥有的对象。CR 已不存在就直接返回（子资源由垃圾回收处理）。',d:3600,set:on('g','o')},
 {t:'行动',p:'计算应有的子资源，与现有的对比，创建或更新缺少和不一致的部分。每次只做需要的步骤，可以安全地重复执行。',d:3800,set:on('g','o','d','a')},
 {t:'汇报',p:'把观察到的情况写入 status（不是 spec）。需要等待外部操作时返回 RequeueAfter，过一会儿再调和。出错返回 error，队列按指数退避重试。',d:4200,set:on('g','o','d','a','s','q')}]});
(()=>{const A=[['create','kubectl apply Database（replicas: 3）',['Reconcile db：StatefulSet 不存在 → 创建 db（3 副本）、Service db','添加 finalizer example.com/backup','status.phase = Provisioning；RequeueAfter 10s','Reconcile db：3/3 Ready → status.phase = Ready'],'ok','一个 CR 变成了一组子资源，status 汇报进度。'],
 ['pod','kubectl delete pod db-1',['（Operator 无动作：Pod 归 StatefulSet 管）','StatefulSet 控制器重建 db-1','StatefulSet status 变化 → 按 ownerReference 触发 Reconcile db','Reconcile db：一切一致，status 不变'],'','Operator 只管理自己直接创建的对象，下层交给内置控制器。'],
 ['scale','kubectl patch database db --type=merge -p {"spec":{"replicas":5}}',['Reconcile db：期望 5，StatefulSet 是 3 → 更新 replicas = 5','status.phase = Scaling','Reconcile db：5/5 Ready → status.phase = Ready'],'ok','用户只改 CR 的 spec，具体怎么扩由 Operator 决定。'],
 ['sts','kubectl delete statefulset db',['StatefulSet 删除事件 → 按 ownerReference 触发 Reconcile db','Reconcile db：StatefulSet 不存在 → 重新创建','（PVC 保留，数据还在）'],'ok','被手动删掉的子资源会被修回来：这就是 watch 子资源（Owns）的作用。'],
 ['edit','kubectl edit statefulset db（改镜像为 postgres:15）',['Reconcile db：StatefulSet 的镜像与 spec.version 不一致','→ 改回 postgres:17'],'bad','直接改子资源会被 Operator 覆盖。要改就改 CR。'],
 ['del','kubectl delete database db',['API Server 设置 deletionTimestamp（有 finalizer，对象暂不删除）','Reconcile db：正在删除 → 触发最终备份到对象存储','备份完成 → 移除 finalizer','对象从 etcd 删除；垃圾回收器级联删除 StatefulSet、Service'],'ok','finalizer 让控制器在对象消失前完成清理。Operator 不在了，删除会一直卡在 Terminating。']];
 const op=document.getElementById('op'),ol=document.getElementById('ol'),om=document.getElementById('om');
 A.forEach(([k,t,L,c,m])=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.textContent=t;b.addEventListener('click',()=>{op.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));ol.innerHTML=`<div style="font-weight:600">$ ${t}</div>`+L.map(x=>`<div style="opacity:.85">&nbsp;&nbsp;${x}</div>`).join('');om.className='msg '+c;om.innerHTML=m});op.appendChild(b)});
 om.className='msg';om.innerHTML='选择一个操作。建议从第一个开始依次点击。'})();
Term(document.getElementById('t4'),[
['kubectl get crd | head -4','NAME                          CREATED AT\ncertificates.cert-manager.io  2026-10-01T03:12:44Z\nwebsites.example.com          2026-10-21T12:40:02Z','集群里所有 CRD。'],
['kubectl explain website.spec','FIELDS:\n  image\t<string> -required-\n  replicas\t<integer>','CRD 的 schema 让 explain 也能用。'],
['kubectl get ws blog -o jsonpath="{.metadata.finalizers}"','["example.com/backup"]','有 finalizer 的对象删除时会先停在 Terminating。'],
['kubectl patch ws blog --type=merge -p \'{"metadata":{"finalizers":null}}\'','website.example.com/blog patched','强行移除 finalizer：外部资源可能不会被清理。只在 Operator 已卸载、确认清理过时使用。'],
['kubectl get deploy blog -o jsonpath="{.metadata.ownerReferences[0].kind}/{.metadata.ownerReferences[0].name}"','Website/blog','子资源指向它的所有者。'],
['kubebuilder init --domain example.com && kubebuilder create api --group web --version v1 --kind Website','INFO Writing scaffold for you to edit...\nINFO api/v1/website_types.go\nINFO internal/controller/website_controller.go','生成项目骨架：在 *_types.go 定义 spec/status，在 Reconcile 里写逻辑，make manifests 生成 CRD。']]);
Quiz(document.getElementById('qs'),[
['只安装 CRD 不安装控制器，创建自定义对象会？',['报错','存入 etcd，但不会产生任何效果','自动生成 Pod'],1,'需要控制器。'],
['Operator 应该把观察到的状态写在哪里？',['spec','status','annotations'],1,'spec 是用户的期望。'],
['删除 CR 前需要先删除云上的数据库，用？',['ownerReference','finalizer','label'],1,'ownerReference 只管集群内对象的级联删除。'],
['Reconcile 被同一个对象连续触发 3 次，正确的实现应该？',['创建 3 份资源','结果和触发 1 次一样','报错'],1,'幂等。']]);
