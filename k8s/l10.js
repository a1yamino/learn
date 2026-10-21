const S=(t,s,c='',w=170)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{cl:{w:640,h:250,cls:'frame',html:'<i>集群</i>'},a:{w:180,h:180,cls:'frame',html:'<i>team-a</i>'},b:{w:180,h:180,cls:'frame',html:'<i>team-b</i>'},s:{w:180,h:180,cls:'frame',html:'<i>kube-system</i>'},wa:P('web'),wb:P('web'),q:P('配额 CPU 4 · Pod 20','mute'),r:P('RBAC：team-a 组可写','mute'),x:P('web.team-b 可以访问','bad'),n:{w:640,cls:'tag'}},scenes:[
 {t:'名字的范围',p:'命名空间里的名字唯一。team-a 和 team-b 都可以有叫 web 的 Service。',set:{cl:[0,0],a:[20,40],b:[230,40],s:[440,40],wa:[40,90],wb:[250,90]}},
 {t:'权限和配额的单位',p:'RBAC 授权、ResourceQuota、LimitRange 都按命名空间设置：team-a 只能动 team-a 里的东西，总共只能用 4 核。',d:3600,set:{cl:[0,0],a:[20,40,{cls:'frame sig'}],b:[230,40],s:[440,40],wa:[40,90],wb:[250,90],q:[30,150],r:[30,185]}},
 {t:'不是网络隔离',p:'默认情况下，team-a 的 Pod 可以访问 <code>web.team-b</code>。网络隔离需要 NetworkPolicy（第 21 课）。',d:3600,set:{cl:[0,0],a:[20,40],b:[230,40],s:[440,40],wa:[40,90],wb:[250,90],x:[120,130]}},
 {t:'集群级资源',p:'有些资源不属于任何命名空间：Node、PersistentVolume、StorageClass、Namespace 本身、ClusterRole。<code>kubectl api-resources --namespaced=false</code> 列出它们。',d:3800,set:{cl:[0,0],a:[20,40],b:[230,40],s:[440,40],n:[0,270,{html:'Node · PV · StorageClass · ClusterRole …'}]}}]});
Player(document.getElementById('p2'),{els:{d:S('Deployment web','selector: app=web'),rs:S('ReplicaSet','app=web, pod-template-hash=7c5b'),svc:S('Service web','selector: app=web'),p1:P('app=web'),p2:P('app=web'),p3:P('app=web, track=canary'),own:P('ownerReferences','mute'),n:{w:640,cls:'tag'}},scenes:[
 {t:'Pod 带着标签',p:'Pod 模板里的标签会出现在每个 Pod 上。',set:{p1:[0,180],p2:[110,180],p3:[220,180]}},
 {t:'ReplicaSet 用选择器数 Pod',p:'ReplicaSet 用 <code>app=web</code> + 模板哈希选择“自己的” Pod，数量不够就补。所以手动改掉一个 Pod 的标签，它就不再被算进去（第 5 课）。',d:4000,set:{rs:[0,80,{cls:'blk sig'}],p1:[0,180],p2:[110,180],p3:[220,180]}},
 {t:'Service 用选择器找端点',p:'Service 的选择器是 <code>app=web</code>，所以也会选中 canary 的 Pod：这正是金丝雀发布的一种简单做法。',d:3800,set:{rs:[0,80],svc:[300,80,{cls:'blk sig'}],p1:[0,180],p2:[110,180],p3:[220,180,{cls:'pill ok',html:'app=web, track=canary'}]}},
 {t:'所有权',p:'选择器决定“管理哪些”，ownerReferences 决定“属于谁”：删除 Deployment 时，级联删除它的 ReplicaSet 和 Pod。',set:{d:[0,0],rs:[0,80],own:[200,15],p1:[0,180],p2:[110,180]}}]});
(()=>{const PODS=[['web-1',{app:'web',env:'prod',tier:'frontend'}],['web-2',{app:'web',env:'prod',tier:'frontend'}],['web-c',{app:'web',env:'prod',tier:'frontend',track:'canary'}],['api-1',{app:'api',env:'prod',tier:'backend'}],['api-s',{app:'api',env:'staging',tier:'backend'}],['db-0',{app:'db',env:'prod',tier:'backend'}],['web-d',{app:'web',env:'dev',tier:'frontend'}],['job-x',{app:'migrate',env:'prod'}]];
 const Qs=['app=web','app=web,env=prod','app=web,!track','env in (staging,dev)','tier!=frontend','tier','env=prod,tier=backend,app notin (db)'];
 const parse=q=>{const parts=q.match(/[^,]+\([^)]*\)|[^,]+/g).map(s=>s.trim());return l=>parts.every(p=>{let m;
  if(m=p.match(/^(\w+)\s+in\s+\(([^)]*)\)$/))return m[2].split(',').map(x=>x.trim()).includes(l[m[1]]);
  if(m=p.match(/^(\w+)\s+notin\s+\(([^)]*)\)$/))return !m[2].split(',').map(x=>x.trim()).includes(l[m[1]]);
  if(m=p.match(/^(\w+)!=(\w+)$/))return l[m[1]]!==m[2];if(m=p.match(/^(\w+)=(\w+)$/))return l[m[1]]===m[2];
  if(m=p.match(/^!(\w+)$/))return !(m[1] in l);if(m=p.match(/^(\w+)$/))return m[1] in l;return false})};
 const NOTE={'app=web':'包含了 canary 和 dev 环境的 Pod。','app=web,env=prod':'逗号表示“并且”。','app=web,!track':'<code>!track</code>：没有 track 这个标签。排除了 canary。','env in (staging,dev)':'集合选择器。','tier!=frontend':'注意：<b>没有 tier 标签</b>的 job-x 也被选中了。!= 也匹配“不存在”。','tier':'只写键：选中所有带这个标签的，值不限。','env=prod,tier=backend,app notin (db)':'notin 同样会匹配不存在该标签的对象。'};
 const el=document.getElementById('qs1'),pe=document.getElementById('pods'),lm=document.getElementById('lm');let cur=Qs[0];
 Qs.forEach(q=>{const b=document.createElement('button');b.className='btn';b.textContent='-l '+q;b.dataset.v=q;b.addEventListener('click',()=>{cur=q;draw()});el.appendChild(b)});
 function draw(){el.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===cur));const f=parse(cur);let n=0;
  pe.innerHTML=PODS.map(([name,l])=>{const hit=f(l);if(hit)n++;return `<div class="frame" style="position:static;padding:10px;transition:opacity 240ms ease,border-color 240ms ease;opacity:${hit?1:.35};${hit?'border-color:var(--sig)':''}"><div style="font:600 13px var(--m)">${name}</div><div style="font:400 11px/1.5 var(--m);opacity:.75;margin-top:4px">${Object.entries(l).map(([k,v])=>k+'='+v).join('<br>')}</div></div>`}).join('');
  lm.className='msg';lm.innerHTML=`选中 ${n} 个。${NOTE[cur]||''}`}draw()})();
Term(document.getElementById('t4'),[
['kubectl api-resources --namespaced=false | head -6','NAME                SHORTNAMES   APIVERSION                     NAMESPACED   KIND\ncomponentstatuses   cs           v1                             false        ComponentStatus\nnamespaces          ns           v1                             false        Namespace\nnodes               no           v1                             false        Node\npersistentvolumes   pv           v1                             false        PersistentVolume\nclusterroles                     rbac.authorization.k8s.io/v1   false        ClusterRole','所有资源类型及简写。去掉参数列出全部，包括 CRD（第 19 课）。'],
['kubectl get pods -l "app=web,!track" -L env,version','NAME          READY   STATUS    ENV    VERSION\nweb-5d9c-2b   1/1     Running   prod   1.4.2','<code>-L</code> 把标签显示成列。'],
['kubectl label pods -l app=web owner=team-a','pod/web-5d9c-2b labeled\npod/web-5d9c-8j labeled','批量打标签。<code>owner-</code> 删除标签。<code>--overwrite</code> 修改已有值。'],
['kubectl get events -A --field-selector type=Warning --sort-by=.lastTimestamp | tail -3','shop    2m   Warning  BackOff           pod/api-6b8c   Back-off restarting failed container\nshop    1m   Warning  FailedScheduling  pod/big-0      0/3 nodes are available: 3 Insufficient cpu.','全集群最近的警告。日常巡检第一条命令。'],
['kubectl auth can-i delete deployments -n team-b','no','检查自己（或 <code>--as=用户</code>）有没有某个权限（第 20 课）。'],
['kubectl get deploy -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,IMAGE:.spec.template.spec.containers[*].image','NS       NAME   IMAGE\nshop     api    ghcr.io/acme/api:1.4.2\nshop     web    ghcr.io/acme/web:2.0.1','全集群在跑什么镜像、什么版本。'],
['alias k=kubectl; source <(kubectl completion bash); complete -o default -F __start_kubectl k','','别名 + 自动补全（包括资源名）。社区工具 kubectx / kubens 快速切换 context 和命名空间，k9s 提供终端界面。']]);
Quiz(document.getElementById('qs'),[
['不同命名空间的 Pod 默认能互相访问吗？',['不能','能，需要 NetworkPolicy 才能隔离','只能访问 kube-system'],1,'命名空间不是网络边界。'],
['给没写 requests 的容器自动设置默认值，用？',['ResourceQuota','LimitRange','PriorityClass'],1,'Quota 限制总量，LimitRange 设置单个容器的默认值和范围。'],
['-l tier!=frontend 会选中没有 tier 标签的对象吗？',['会','不会','报错'],0,'不等于也匹配“不存在”。'],
['删除 Deployment 时，它的 Pod 为什么也被删除？',['标签选择器','ownerReferences 级联删除','命名空间'],1,'所有权链：Deployment → ReplicaSet → Pod。']]);
