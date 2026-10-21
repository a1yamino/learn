const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
Player(document.getElementById('p1'),{els:{k:S('kubectl','get pods'),kc:{w:200,h:90,cls:'frame',html:'<i>~/.kube/config</i><br>server · 证书 · namespace'},api:S('API Server','认证 → 授权 → 读取'),et:S('etcd','/registry/pods/…'),rq:{cls:'pill sig',html:'GET /api/v1/namespaces/default/pods'},rs:{cls:'pill mute',html:'200 · PodList (JSON)'},tb:{w:360,h:60,cls:'blk',html:'NAME   READY   STATUS<br>web-…  1/1     Running'},n:{w:640,cls:'tag'}},scenes:[
 {t:'读取 kubeconfig',p:'kubectl 先读 kubeconfig 的当前 context：API Server 地址、客户端证书或令牌、默认命名空间。',set:{k:[0,40],kc:[0,130]}},
 {t:'发送 HTTP 请求',p:'<code>kubectl get pods</code> 变成一个 HTTPS 请求。资源有固定的 URL 结构：组、版本、命名空间、资源类型。',d:3800,set:{k:[0,40],kc:[0,130],api:[440,40],rq:[110,0]}},
 {t:'API Server 处理',p:'验证你是谁（认证），检查你能不能做（授权，第 20 课），然后从 etcd 读取数据。',set:{k:[0,40],api:[440,40,{cls:'blk sig'}],et:[440,150]}},
 {t:'格式化输出',p:'返回 JSON。kubectl 把它渲染成表格。<code>-o yaml</code>、<code>-o json</code>、<code>-o jsonpath</code> 可以看到原始数据或取出某个字段。',d:3800,set:{k:[0,40],api:[440,40],rs:[110,100],tb:[0,170]}}]});
const Y=(t)=>({w:520,h:30,cls:'blk',html:t});
Player(document.getElementById('p2'),{els:{a:Y('apiVersion: apps/v1'),b:Y('kind: Deployment'),c:{w:520,h:52,cls:'blk',html:'metadata:<br>&nbsp;&nbsp;name: web · labels: { app: web }'},d:{w:520,h:52,cls:'blk',html:'spec:<br>&nbsp;&nbsp;replicas: 3 · template: …'},e:{w:520,h:52,cls:'blk dim',html:'status:<br>&nbsp;&nbsp;readyReplicas: 3（系统写入）'},n:{w:640,cls:'tag'}},scenes:[
 {t:'类型',p:'<code>apiVersion</code> + <code>kind</code> 决定这是什么资源。Deployment 属于 apps 组的 v1 版本。',set:{a:[0,0,{cls:'blk sig'}],b:[0,40,{cls:'blk sig'}]}},
 {t:'身份',p:'<code>metadata</code>：名字、命名空间、标签、注解。同一命名空间里同类资源名字唯一。',set:{a:[0,0],b:[0,40],c:[0,80,{cls:'blk sig'}]}},
 {t:'期望状态',p:'<code>spec</code> 是你写的部分：你想要什么。每种资源的 spec 字段不同，用 <code>kubectl explain</code> 查看。',d:3600,set:{a:[0,0],b:[0,40],c:[0,80],d:[0,142,{cls:'blk sig'}]}},
 {t:'实际状态',p:'<code>status</code> 由控制器写回：现在是什么样子。控制循环就是不断让 status 接近 spec。你不写 status。',d:3600,set:{a:[0,0],b:[0,40],c:[0,80],d:[0,142],e:[0,204],n:[0,270,{html:'spec（期望）←→ status（实际）'}]}}]});
(()=>{const CX=[['kind-learn','kind-learn','default','kind-learn','本机 kind 集群'],['staging','staging-eks','shop','alice@staging','测试环境'],['prod','prod-eks','shop','alice@prod','生产环境']];let cur=0;
 const cx=document.getElementById('cx'),cl=document.getElementById('cl'),cm=document.getElementById('cm');
 CX.forEach(([n],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=n;b.addEventListener('click',()=>{cur=i;draw()});cx.appendChild(b)});
 function draw(){cx.querySelectorAll('.btn').forEach((b,i)=>b.classList.toggle('pri',i===cur));const [n,c,ns,u,d]=CX[cur];
  cl.innerHTML=[`$ kubectl config use-context ${n}`,`Switched to context "${n}".`,'',`$ kubectl delete deployment web`,`→ 集群：${c}（${d}）`,`→ 用户：${u}`,`→ 命名空间：${ns}`,`deployment.apps "web" deleted`].map(x=>`<div>${x||'&nbsp;'}</div>`).join('');
  if(cur===2){cm.className='msg bad';cm.innerHTML='同样一条命令，删掉了<b>生产环境</b>的 web。context 是全局状态，切换后对之后所有命令生效。习惯：执行写操作前看一眼 <code>kubectl config current-context</code>，把它显示在命令行提示符里；生产操作显式加 <code>--context prod</code>。'}
  else if(cur===1){cm.className='msg';cm.innerHTML='作用在测试集群的 shop 命名空间。注意：这里没写 <code>-n</code>，用的是 context 里的默认命名空间。'}
  else{cm.className='msg ok';cm.innerHTML='本机 kind 集群，随便试。切到其他 context 看看同一条命令会怎样。'}}draw()})();
Term(document.getElementById('t4'),[
['kubectl get pods -o wide','NAME                  READY   STATUS    RESTARTS   AGE   IP           NODE\nweb-5d9c7f6b8-2bxkq   1/1     Running   0          3m    10.244.1.3   learn-worker\nweb-5d9c7f6b8-8jz4n   1/1     Running   0          3m    10.244.2.2   learn-worker2','<code>-o wide</code> 多显示 IP 和节点。<code>-A</code> 所有命名空间，<code>-l app=web</code> 按标签过滤，<code>-w</code> 持续观察变化。'],
['kubectl describe pod web-5d9c7f6b8-2bxkq','Name:         web-5d9c7f6b8-2bxkq\nNode:         learn-worker/172.18.0.3\nStatus:       Running\nContainers:\n  nginx:\n    Image:   nginx:alpine\n    State:   Running\nEvents:\n  Normal  Scheduled  3m  default-scheduler  Successfully assigned default/web-… to learn-worker\n  Normal  Started    3m  kubelet            Started container nginx','人读的详细信息，末尾的 Events 是排查问题的第一站。'],
['kubectl get deploy web -o jsonpath="{.spec.replicas} {.status.readyReplicas}"','4 4','取出某个字段，适合脚本。'],
['kubectl explain pod.spec.containers.imagePullPolicy','FIELD: imagePullPolicy <string>\nDESCRIPTION:\n    Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always\n    if :latest tag is specified, or IfNotPresent otherwise.','内置的字段文档，不用离开终端。<code>--recursive</code> 列出整棵字段树。'],
['kubectl apply -f web.yaml','deployment.apps/web configured','声明式：创建或更新为文件里描述的状态。可以是目录（<code>-f k8s/</code>）或 URL。'],
['kubectl logs -l app=web --tail 1 --prefix','[pod/web-5d9c7f6b8-2bxkq/nginx] 10.244.1.1 - - "GET / HTTP/1.1" 200\n[pod/web-5d9c7f6b8-8jz4n/nginx] 10.244.2.1 - - "GET / HTTP/1.1" 200','按标签看多个 Pod 的日志。<code>-f</code> 跟踪，<code>--previous</code> 看上一次崩溃前的日志。'],
['kubectl exec -it deploy/web -- sh','/ # ','进入 Deployment 的某个 Pod。和 docker exec 一样。'],
['kubectl port-forward deploy/web 8080:80','Forwarding from 127.0.0.1:8080 -> 80','把本机端口转发到 Pod，用于调试。浏览器打开 localhost:8080。']]);
Quiz(document.getElementById('qs'),[
['context 由哪三部分组成？',['集群、用户、默认命名空间','节点、Pod、容器','镜像、标签、仓库'],0,'切换 context 会影响之后的所有命令。'],
['资源 YAML 里哪一部分由系统写入？',['metadata','spec','status'],2,'spec 是期望，status 是实际。'],
['想生成一个 Deployment 的 YAML 模板而不创建它？',['kubectl get -o yaml','kubectl create … --dry-run=client -o yaml','kubectl explain'],1,'然后修改并 apply。'],
['kubectl 和 API Server 之间是？',['SSH','HTTPS REST 请求','直接读 etcd'],1,'-v=6 可以看到。']]);
