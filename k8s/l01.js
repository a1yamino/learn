const S=(t,s,c='',w=140)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const H=i=>({w:170,h:140,cls:'frame',html:`<i>服务器 ${i}</i>`});const C=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{h1:H(1),h2:H(2),h3:H(3),a1:C('api'),a2:C('api'),a3:C('api'),w1:C('web'),me:{cls:'pill mute',html:'你：ssh + docker run'},x:{cls:'pill bad',html:'宕机'},k:{w:560,h:44,cls:'blk sig',html:'Kubernetes：“api 要 3 个副本”'},n:{w:640,cls:'tag'}},scenes:[
 {t:'一台机器',p:'Compose 能很好地管理一台机器上的服务。但这台机器宕机，所有服务一起停。',set:{h1:[0,40],a1:[20,90],w1:[90,90]}},
 {t:'多台机器，手工管理',p:'加了两台机器。现在你要决定每个容器放在哪台、登录每台去启动、记住谁在哪、更新时逐台操作。',d:3800,set:{h1:[0,40],h2:[210,40],h3:[420,40],a1:[20,90],w1:[90,90],a2:[230,90],a3:[440,90],me:[0,0]}},
 {t:'凌晨三点',p:'服务器 2 宕机。在你被叫醒、登录、在别处重新启动之前，api 少了一个副本。',d:3600,set:{h1:[0,40],h2:[210,40,{cls:'frame dim'}],h3:[420,40],a1:[20,90],w1:[90,90],a2:[230,90,{cls:'pill mute'}],a3:[440,90],x:[230,200],me:[0,0]}},
 {t:'声明期望状态',p:'换一种方式：你只告诉系统“api 要 3 个副本”。放在哪里、坏了怎么补、怎么滚动更新，都由系统持续处理。',d:4000,set:{h1:[0,40],h2:[210,40,{cls:'frame dim'}],h3:[420,40],a1:[20,90],w1:[90,90],a2:[460,90],a3:[440,130],k:[0,-30]}}]});
const cp=[['api','API Server','唯一入口'],['etcd','etcd','保存所有状态'],['sch','Scheduler','决定 Pod 去哪个节点'],['cm','Controller Manager','各种控制循环']];const wk=[['kl','kubelet','管理本节点的 Pod'],['rt','containerd','运行容器'],['kp','kube-proxy','Service 转发规则']];
const e2={cpf:{w:340,h:330,cls:'frame',html:'<i>控制平面</i>'},wkf:{w:340,h:270,cls:'frame',html:'<i>工作节点（每个节点都有）</i>'},you:{cls:'pill mute',html:'kubectl'},n:{w:740,cls:'tag'}};cp.forEach(([k,t,s])=>e2[k]=S(t,s,'',290));wk.forEach(([k,t,s])=>e2[k]=S(t,s,'',290));
const P2={cpf:[0,0],wkf:[400,0],api:[25,40],etcd:[25,110],sch:[25,180],cm:[25,250],kl:[425,40],rt:[425,110],kp:[425,180]};
const pick=(...ks)=>{const o={};for(const k in P2)o[k]=P2[k];ks.forEach(k=>o[k]=[P2[k][0],P2[k][1],{cls:'blk sig'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'两部分',p:'<b>控制平面</b>做决定，<b>工作节点</b>运行容器。小集群里控制平面也可以和工作节点在同一台机器上。',set:P2},
 {t:'一切都经过 API Server',p:'kubectl、kubelet、调度器、控制器都只和 API Server 通信。只有 API Server 读写 etcd。',d:3800,set:{...pick('api','etcd'),you:[25,-40]}},
 {t:'创建 Deployment 时',p:'API Server 把对象写入 etcd → 控制器发现需要 3 个 Pod，创建 Pod 对象 → 调度器给每个 Pod 选节点。',d:4000,set:pick('api','cm','sch')},
 {t:'节点上',p:'节点的 kubelet 发现有 Pod 被分配给自己，调用 containerd 拉镜像、启动容器，并把状态报告回 API Server。第 11、13 课会详细讲这个过程。',d:4000,set:pick('api','kl','rt')}]});
(()=>{const want=3;let pods=[],id=0,events=0;const mk=()=>({id:'web-'+(Math.random().toString(36).slice(2,7)),st:'Running'});
 const ev=document.getElementById('ev'),pe=document.getElementById('pods'),act=document.getElementById('act'),rm=document.getElementById('rm');
 const E=[['节点宕机（2 个 Pod 丢失）',()=>{pods.splice(0,2)}],['容器崩溃',()=>{if(pods[0])pods[0].st='CrashLoop'}],['有人多跑了一个',()=>pods.push(mk())],['期望改为 5',null]];let W=want;
 E.forEach(([l,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.addEventListener('click',()=>{if(f)f();else W=W===5?3:5;events++;draw('事故发生了。比较期望和实际。')});ev.appendChild(b)});
 [['新建一个 Pod',()=>pods.push(mk())],['删除一个 Pod',()=>pods.pop()],['替换崩溃的 Pod',()=>{const i=pods.findIndex(p=>p.st!=='Running');if(i>=0)pods[i]=mk()}]].forEach(([l,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.addEventListener('click',()=>{f();draw()});act.appendChild(b)});
 function draw(msg){const ok=pods.filter(p=>p.st==='Running').length;
  pe.innerHTML=pods.map(p=>`<span class="pill ${p.st==='Running'?'sig':'bad'}" style="position:static">${p.id}${p.st!=='Running'?' · '+p.st:''}</span>`).join('')||'<span style="opacity:.5">（没有 Pod）</span>';
  const diff=`期望 ${W}，实际运行中 ${ok}${pods.length!==ok?'（另有 '+(pods.length-ok)+' 个异常）':''}。`;
  if(ok===W&&pods.length===W){rm.className='msg ok';rm.innerHTML=diff+(events?' 一致了。真实的控制器每时每刻都在做这件事，而且不会睡着。':' 一致。点上面的按钮制造一次事故。')}
  else{rm.className='msg';rm.innerHTML=(msg?msg+' ':'')+diff}}
 for(let i=0;i<3;i++)pods.push(mk());draw()})();
Term(document.getElementById('t4'),[
['kubectl create deployment web --image=nginx:alpine --replicas=3','deployment.apps/web created','创建一个 Deployment 对象：期望 3 个 nginx 副本。命令立刻返回，后面的工作由控制器完成。'],
['kubectl get deployment,replicaset,pod','NAME                  READY   UP-TO-DATE   AVAILABLE\ndeployment.apps/web   3/3     3            3\n\nNAME                             DESIRED   CURRENT   READY\nreplicaset.apps/web-7c5b8d6f9b   3         3         3\n\nNAME                       READY   STATUS\npod/web-7c5b8d6f9b-4kq2x   1/1     Running\npod/web-7c5b8d6f9b-h8zmw   1/1     Running\npod/web-7c5b8d6f9b-tq9ps   1/1     Running','Deployment 创建了 ReplicaSet，ReplicaSet 创建了 Pod。三层对象，各有自己的控制器（第 4 课）。'],
['kubectl delete pod web-7c5b8d6f9b-4kq2x','pod "web-7c5b8d6f9b-4kq2x" deleted','直接删除一个 Pod。'],
['kubectl get pods','NAME                   READY   STATUS              AGE\nweb-7c5b8d6f9b-h8zmw   1/1     Running             2m\nweb-7c5b8d6f9b-tq9ps   1/1     Running             2m\nweb-7c5b8d6f9b-x2v7d   0/1     ContainerCreating   1s','ReplicaSet 控制器发现只剩 2 个，立刻补了一个。名字不同：Pod 是可替换的，不要依赖某个具体的 Pod。'],
['kubectl get events --sort-by=.lastTimestamp | tail -3','Normal  SuccessfulCreate  replicaset/web-7c5b8d6f9b  Created pod: web-7c5b8d6f9b-x2v7d\nNormal  Scheduled         pod/web-7c5b8d6f9b-x2v7d   Successfully assigned default/web-… to learn-control-plane\nNormal  Pulled            pod/web-7c5b8d6f9b-x2v7d   Container image "nginx:alpine" already present','事件记录了每个组件做了什么：控制器创建 Pod，调度器分配节点，kubelet 启动容器。']]);
Quiz(document.getElementById('qs'),[
['Kubernetes 的“声明式”指的是？',['用 YAML 写配置','提交期望状态，系统持续让实际状态符合它','命令执行得更快'],1,'核心是控制循环。'],
['哪个组件是集群唯一的入口？',['etcd','kubelet','API Server'],2,'包括其他组件之间也通过它通信。'],
['删除一个 Deployment 管理的 Pod 后会怎样？',['副本永久减少','控制器很快创建一个新的','整个 Deployment 被删除'],1,'期望副本数没变。'],
['Kubernetes 负责构建镜像吗？',['负责','不负责，镜像仍用 Docker/BuildKit 构建并推送到仓库','只在 kind 里负责'],1,'它只拉取和运行。']]);
