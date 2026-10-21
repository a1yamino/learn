const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const ST=[['an','认证','证书 / 令牌'],['az','授权','RBAC'],['mu','变更准入','补默认值、注入'],['va','校验准入','策略检查'],['sc','结构校验','schema'],['et','etcd','持久化']];
const e1={rq:P('POST /apis/apps/v1/…/deployments','mute'),x:P('','bad'),n:{w:900,cls:'tag'}};ST.forEach(([k,t,s])=>e1[k]=S(t,s,'',130));const G1={};ST.forEach(([k],i)=>G1[k]=[i*145,60]);
const hl=(n,extra={})=>{const o={...G1};ST.slice(0,n).forEach(([k],i)=>o[k]=[i*145,60,{cls:'blk sig'}]);return {...o,...extra}};
Player(document.getElementById('p1'),{els:e1,scenes:[
 {t:'认证与授权',p:'先确认身份（客户端证书、ServiceAccount 令牌、OIDC），再用 RBAC 检查：这个身份能不能在这个命名空间创建 Deployment？不能 → 403。',d:3800,set:hl(2,{rq:[0,0]})},
 {t:'变更准入',p:'准入控制器（内置插件和 webhook）可以<b>修改</b>对象：补默认值、注入 sidecar、加标签。',set:hl(3,{rq:[0,0]})},
 {t:'校验准入',p:'然后由校验型准入<b>拒绝或放行</b>：Pod Security、自定义策略（Kyverno、Gatekeeper、ValidatingAdmissionPolicy，第 21 课）。被拒绝 → 带原因的错误。',d:3800,set:hl(4,{rq:[0,0]})},
 {t:'写入 etcd',p:'结构校验通过后写入 etcd，分配 resourceVersion，返回 201。到这里 API Server 的工作就结束了：它<b>不</b>创建任何 Pod。之后的事由 watch 这个对象的控制器完成。',d:4000,set:hl(6,{rq:[0,0],n:[0,140,{html:'201 Created · 剩下的交给控制器'}]})}]});
const C=[['api','API Server','',0,110],['dc','Deployment 控制器','',-0,0],['rc','ReplicaSet 控制器','',0,220],['sch','调度器','',420,0],['kl','kubelet','节点上',420,220]];
const e2={n:{w:640,cls:'tag'},w1:P('watch','mute'),w2:P('watch','mute'),w3:P('watch','mute'),w4:P('watch','mute')};
e2.api=S('API Server','+ etcd','',170);e2.dc=S('Deployment 控制器','watch Deployment','',170);e2.rc=S('ReplicaSet 控制器','watch ReplicaSet','',170);e2.sch=S('调度器','watch 未调度 Pod','',170);e2.kl=S('kubelet','watch 本节点 Pod','',170);
const G2={api:[220,110],dc:[0,0],rc:[0,220],sch:[440,0],kl:[440,220]};
const on=(...k)=>{const o={...G2};k.forEach(x=>o[x]=[G2[x][0],G2[x][1],{cls:'blk sig'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'都连着 API Server',p:'每个组件都对 API Server 发起长连接的 watch，订阅自己关心的对象。组件之间没有直接通信。',set:{...G2,api:[220,110,{cls:'blk sig'}]}},
 {t:'Deployment → ReplicaSet',p:'Deployment 控制器看到新 Deployment，创建 ReplicaSet 对象（写回 API Server）。',set:on('api','dc')},
 {t:'ReplicaSet → Pod',p:'ReplicaSet 控制器看到新 ReplicaSet，创建 2 个 Pod 对象，此时 nodeName 为空。',set:on('api','rc')},
 {t:'调度 → 运行',p:'调度器看到未调度的 Pod，选节点写入 nodeName。对应节点的 kubelet 看到“分配给我的 Pod”，启动容器并更新 status。',d:3800,set:{...on('api','sch','kl'),n:[0,300,{html:'每一步：watch 到变化 → 做自己的事 → 写回 API Server'}]}}]});
(()=>{const RIGHT=['kubectl 发送 POST 请求','API Server 认证、授权、准入','Deployment 写入 etcd','Deployment 控制器创建 ReplicaSet','ReplicaSet 控制器创建 2 个 Pod','调度器为 Pod 选节点并绑定','kubelet 拉取镜像、启动容器','kubelet 更新 Pod 状态为 Running','Deployment 控制器更新 status.availableReplicas'];
 const sh=[...RIGHT].sort(()=>Math.random()-.5);let got=[];const st=document.getElementById('steps'),seq=document.getElementById('seq'),sm=document.getElementById('sm');
 const WHY={'Deployment 控制器创建 ReplicaSet':'控制器只在对象已写入 etcd、watch 收到事件后才行动。','调度器为 Pod 选节点并绑定':'调度器处理的是已存在的 Pod 对象，所以要等 ReplicaSet 控制器先创建 Pod。','kubelet 拉取镜像、启动容器':'kubelet 只处理 nodeName 等于自己的 Pod，要等调度器绑定。','ReplicaSet 控制器创建 2 个 Pod':'Pod 由 ReplicaSet 创建，而不是 Deployment 直接创建。','API Server 认证、授权、准入':'写入 etcd 之前要先通过检查。','Deployment 写入 etcd':'先有对象，控制器才能 watch 到。','kubelet 更新 Pod 状态为 Running':'容器启动后才有状态可报告。','Deployment 控制器更新 status.availableReplicas':'Deployment 的状态汇总自 Pod，是最后一步。'};
 function draw(){st.innerHTML='';sh.forEach(t=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.disabled=got.includes(t);b.addEventListener('click',()=>{const need=RIGHT[got.length];if(t===need){got.push(t);sm.className='msg ok';sm.innerHTML=got.length===RIGHT.length?'全部正确。注意 API Server 在第 3 步之后就不再主动做任何事：后面每一步都是某个组件 watch 到变化后自己行动。':'对。'}else{sm.className='msg bad';sm.innerHTML=`还没到这一步。${WHY[t]||''}`;if(window.shake)shake(b)}draw()});st.appendChild(b)});
  seq.innerHTML=got.map((t,i)=>`<div>${i+1}. ${t}</div>`).join('')||'<div style="opacity:.5">（按顺序点击）</div>'}
 sm.className='msg';sm.innerHTML='从第一步开始。';draw()})();
Term(document.getElementById('t4'),[
['kubectl get --raw /readyz?verbose | tail -4','[+]poststarthook/apiservice-registration-controller ok\n[+]autoregister-completion ok\n[+]poststarthook/apiservice-openapi-controller ok\nreadyz check passed','API Server 的健康检查端点，逐项列出内部检查。'],
['kubectl get --raw /metrics | grep ^apiserver_request_total | head -3','apiserver_request_total{code="200",component="apiserver",group="apps",resource="deployments",verb="LIST",version="v1"} 42\n…','API Server 的 Prometheus 指标：请求量、延迟、etcd 延迟（第 24 课）。'],
['kubectl -n kube-system logs kube-scheduler-learn-control-plane --tail 3','I1021 12:04:11 schedule_one.go:286] "Successfully bound pod to node" pod="default/w-6f9c7d8b5-4kq2x" node="learn-worker"','调度器日志。加 <code>-v=4</code> 等级能看到每个节点的过滤和打分。'],
['kubectl get lease -n kube-system','NAME                      HOLDER                                            AGE\nkube-controller-manager   learn-control-plane_7f3e…                         2h\nkube-scheduler            learn-control-plane_a1c9…                         2h','高可用时有多个调度器、控制器管理器实例，通过 Lease 对象选主，同一时间只有一个在工作。'],
['kubectl get apiservices | head -4','NAME                       SERVICE   AVAILABLE   AGE\nv1.                        Local     True        2h\nv1.apps                    Local     True        2h\nv1beta1.metrics.k8s.io     kube-system/metrics-server   True   1h','API 由多个组聚合而成，有些由外部服务提供（如 metrics-server）。'],
['kubectl get validatingwebhookconfigurations,mutatingwebhookconfigurations','NAME                                                   WEBHOOKS   AGE\nvalidatingwebhookconfiguration.admissionregistration.k8s.io/kyverno-resource-validating   1   3d','集群里注册的准入 webhook。webhook 故障或超时，会让对应的写操作全部失败，是常见的集群级事故原因。']]);
Quiz(document.getElementById('qs'),[
['哪个组件直接读写 etcd？',['所有控制器','只有 API Server','kubelet'],1,'其余组件都通过 API Server。'],
['3 个成员的 etcd 集群挂了 2 个，会怎样？',['正常读写','失去多数派，无法写入','自动恢复'],1,'Raft 需要多数确认。'],
['调度器停止运行时，新建的 Pod 会怎样？',['在随机节点运行','停在 Pending','创建失败'],1,'没有人设置 nodeName。'],
['注入 sidecar 是在请求处理的哪个阶段？',['认证','变更型准入','etcd 写入后'],1,'变更准入可以修改对象。']]);
