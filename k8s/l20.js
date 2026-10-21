const S=(t,s,c='',w=140)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{c:S('kubectl / Pod','携带证书或令牌','',150),au:S('认证','你是谁','',120),az:S('授权 RBAC','能做吗','',120),ad:S('准入','要修改或拒绝吗','',140),et:S('etcd','','',90),u:P('user: alice · groups: [dev]','mute'),r:P('verb=delete resource=pods ns=shop','mute'),x:P('403 Forbidden','bad'),n:{w:700,cls:'tag'}},scenes:[
 {t:'认证',p:'API Server 依次尝试认证方式：客户端证书（CN 为用户名、O 为组）、OIDC 令牌、ServiceAccount 令牌。失败返回 401。结果是一个用户名和一组组名。',d:4200,set:{c:[0,40],au:[180,40,{cls:'blk sig'}],az:[330,40],ad:[480,40],et:[650,40],u:[130,130]}},
 {t:'授权',p:'请求被描述为属性：谁、动词、资源、命名空间。RBAC 查找所有绑定到这个用户或组的规则，任何一条允许即通过；都不允许返回 403。',d:4200,set:{c:[0,40],au:[180,40],az:[330,40,{cls:'blk sig'}],ad:[480,40],et:[650,40],u:[130,130],r:[330,170]}},
 {t:'拒绝',p:'RBAC 没有“拒绝”规则，只有缺少允许。错误信息会说明是谁、对什么资源、缺少哪个动词。',d:3600,set:{c:[0,40],au:[180,40],az:[330,40,{cls:'blk bad'}],ad:[480,40],et:[650,40],x:[330,130]}},
 {t:'通过后',p:'写请求还要经过准入控制器（变更、校验，第 21 课），最后才写入 etcd。读请求授权通过后直接返回。',d:3600,set:{c:[0,40],au:[180,40,{cls:'blk ok'}],az:[330,40,{cls:'blk ok'}],ad:[480,40,{cls:'blk sig'}],et:[650,40]}}]});
Player(document.getElementById('p2'),{els:{ro:S('Role pod-reader','pods: get, list, watch','',180),rb:S('RoleBinding','roleRef → subjects','',150),sa:S('ServiceAccount','reader','',140),po:S('Pod','serviceAccountName: reader','',190),tk:P('投射令牌（约 1 小时，绑定 Pod）','sig'),cr:S('ClusterRole view','可复用的规则','',170),nf:P('RoleBinding 引用 ClusterRole：只在本命名空间生效','mute'),n:{w:700,cls:'tag'}},scenes:[
 {t:'规则',p:'Role 列出允许的动作：哪个 API 组、哪些资源、哪些动词。它本身不授予任何人。',set:{ro:[0,40,{cls:'blk sig'}]}},
 {t:'绑定',p:'RoleBinding 把一个 Role 授予主体（用户、组、ServiceAccount）。绑定的 roleRef 创建后不能修改。',d:3600,set:{ro:[0,40],rb:[230,40,{cls:'blk sig'}],sa:[430,40]}},
 {t:'Pod 拿到身份',p:'Pod 指定 serviceAccountName。kubelet 通过 TokenRequest API 获取一个短期 JWT 挂载进容器，并在过期前自动刷新。Pod 删除后令牌失效。',d:4200,set:{ro:[0,40],rb:[230,40],sa:[430,40],po:[400,140,{cls:'blk sig'}],tk:[160,160]}},
 {t:'复用规则',p:'通用的权限写成 ClusterRole（内置的有 view、edit、admin），在各命名空间用 RoleBinding 引用。用 ClusterRoleBinding 则在全集群生效。',d:4000,set:{cr:[0,40,{cls:'blk sig'}],rb:[230,40],sa:[430,40],nf:[0,140]}}]});
(()=>{const CFG=`# Role shop/app-ops
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "patch"]
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
# RoleBinding shop/app-ops → Role app-ops
subjects: [{kind: Group, name: dev}, {kind: ServiceAccount, name: ci, namespace: tools}]
# ClusterRoleBinding all-view → ClusterRole view
subjects: [{kind: Group, name: auditors}]`;
 document.getElementById('rb').textContent=CFG;
 const Q=[['alice（组 dev）patch deployments -n shop',1,'组 dev 通过 RoleBinding app-ops 获得 apps/deployments 的 patch。'],
  ['alice（组 dev）patch deployments -n prod',0,'RoleBinding 只在 shop 命名空间生效。prod 里没有授予 dev 的绑定。'],
  ['alice（组 dev）get secrets -n shop',0,'规则里没有 secrets。RBAC 默认拒绝，只能显式允许。'],
  ['alice（组 dev）create pods/exec -n shop',0,'pods/exec 是独立的子资源，单写 pods 不包含它；也没有 create 动词。'],
  ['system:serviceaccount:tools:ci get pods/log -n shop',1,'ServiceAccount 可以被其他命名空间的 RoleBinding 授权：tools 里的 ci 在 shop 中有日志读权限。'],
  ['bob（组 auditors）list deployments -n prod',1,'ClusterRoleBinding 让 view 在所有命名空间生效。view 不包括 secrets。'],
  ['bob（组 auditors）get secrets -n prod',0,'内置的 view 刻意不包含 secrets（否则可以读到 ServiceAccount 令牌等，相当于提权）。']];
 const rq=document.getElementById('rq'),rl=document.getElementById('rl'),rm=document.getElementById('rm');
 Q.forEach(([q,ok,why],i)=>{const b=document.createElement('button');b.className='btn';b.dataset.v=i;b.textContent=q;b.addEventListener('click',()=>{rq.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));let who,req;if(q.includes('）')){const [x,y]=q.split('）');const [u,g]=x.split('（组 ');who=`--as=${u} --as-group=${g}`;req=y}else{const i=q.indexOf(' ');who='--as='+q.slice(0,i);req=q.slice(i+1)}
  rl.innerHTML=`<div>$ kubectl auth can-i ${req} ${who}</div><div><b>${ok?'yes':'no'}</b></div>`;rm.className='msg '+(ok?'ok':'bad');rm.innerHTML=why});rq.appendChild(b)});
 rm.className='msg';rm.innerHTML='选择一个请求。'})();
Term(document.getElementById('t4'),[
['kubectl auth can-i --list -n rbac --as=system:serviceaccount:rbac:reader','Resources                 Non-Resource URLs   Resource Names   Verbs\npods                      []                  []               [get list watch]\nselfsubjectreviews…       []                  []               [create]','列出某个身份的全部权限。'],
['kubectl get clusterrolebindings -o wide | grep cluster-admin','cluster-admin   ClusterRole/cluster-admin   12d   system:masters','谁拥有 cluster-admin。定期审查这个列表。'],
['kubectl describe clusterrole view | grep -c secrets','0','内置 view 不能读 Secret。'],
['kubectl create token reader -n rbac --duration=10m','eyJhbGciOiJSUzI1NiIsImtpZCI6…','手动签发一个短期令牌，例如给集群外的脚本临时使用。'],
['kubectl get rolebindings,clusterrolebindings -A -o json | jq -r \'.items[] | select(.subjects[]?.name=="reader") | .metadata.name\'','reader','查找授予某个主体的所有绑定。'],
['kubectl patch sa default -n rbac -p \'{"automountServiceAccountToken":false}\'','serviceaccount/default patched','命名空间默认 SA 不挂载令牌：不需要访问 API 的 Pod 就拿不到令牌。']]);
Quiz(document.getElementById('qs'),[
['RBAC 能否写一条规则“禁止 alice 删除 Pod”？',['能，用 deny','不能，只能不授予','能，用 verbs: ["!delete"]'],1,'RBAC 只有允许。'],
['RoleBinding 引用了一个 ClusterRole，权限范围是？',['整个集群','RoleBinding 所在的命名空间','ClusterRole 指定的命名空间'],1,'Binding 决定范围。'],
['以下哪个权限最接近“可以拿到其他身份”？',['list pods','create pods','get configmaps'],1,'可以创建挂载任意 SA 的 Pod。'],
['Pod 不需要访问 API，最好？',['用 default SA','automountServiceAccountToken: false','给它 view 权限'],1,'不挂载就没有令牌可被盗用。']]);
