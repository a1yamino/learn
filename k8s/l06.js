const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{cm:{w:200,h:110,cls:'frame',html:'<i>ConfigMap app</i><br>LOG_LEVEL: info<br>app.conf: …'},pod:{w:280,h:170,cls:'frame',html:'<i>容器</i>'},ev:P('$LOG_LEVEL=info'),fv:P('/etc/app/LOG_LEVEL','mute'),fv2:P('/etc/app/app.conf','mute'),n:{w:640,cls:'tag'}},scenes:[
 {t:'一份配置',p:'ConfigMap 是键值对。值可以是一个短字符串，也可以是整个配置文件的内容。',set:{cm:[0,30]}},
 {t:'环境变量',p:'<code>envFrom</code> 或 <code>env.valueFrom</code>：容器启动时，kubelet 把值放进环境变量。之后就固定了。',set:{cm:[0,30],pod:[300,0],ev:[320,40]}},
 {t:'文件',p:'作为卷挂载：每个键成为一个文件，文件名是键，内容是值。适合完整的配置文件（nginx.conf、application.yaml）。',d:3600,set:{cm:[0,30],pod:[300,0],ev:[320,40],fv:[320,90],fv2:[320,130]}},
 {t:'更新时的区别',p:'修改 ConfigMap 后：卷里的文件约一分钟内被替换，环境变量不会变。应用读文件时也要自己重新读取或监听变化。',d:3800,set:{cm:[0,30,{html:'<i>ConfigMap app</i><br>LOG_LEVEL: debug<br>app.conf: …'}],pod:[300,0],ev:[320,40,{cls:'pill bad',html:'$LOG_LEVEL=info（旧）'}],fv:[320,90,{cls:'pill ok',html:'/etc/app/LOG_LEVEL = debug'}],fv2:[320,130]}}]});
Player(document.getElementById('p2'),{els:{y:{w:300,h:90,cls:'blk',html:'kind: Secret<br>data:<br>&nbsp;&nbsp;password: czNjcjN0'},d:P('base64 -d → s3cr3t','bad'),et:S('etcd','默认明文存储','',170),g:P('提交到 git = 泄露','bad'),ok1:P('RBAC：限制谁能 get secrets','ok'),ok2:P('etcd 静态加密','ok'),ok3:P('Sealed / External Secrets','ok'),n:{w:640,cls:'tag'}},scenes:[
 {t:'看起来像加密',p:'Secret 的值以 base64 存储。这只是编码（为了能存二进制数据），任何人都能解码。',set:{y:[0,0]}},
 {t:'实际上',p:'能读取这个 Secret 的人，就能拿到明文。默认情况下 etcd 里也是明文。',set:{y:[0,0],d:[340,30],et:[340,100]}},
 {t:'常见错误',p:'把 Secret 的 YAML 提交到 git。base64 不提供任何保护。',set:{y:[0,0],d:[340,30],g:[0,120]}},
 {t:'真正的保护',p:'用 RBAC 限制读取（第 20 课）、开启 etcd 静态加密、在 git 里只存加密后的 SealedSecret，或用 External Secrets 从 Vault / 云密钥服务同步。Secret 相对 ConfigMap 的好处：可以单独做权限控制，kubelet 只把它放在内存（tmpfs）里。',d:4400,set:{y:[0,0],ok1:[340,0],ok2:[340,45],ok3:[340,90]}}]});
(()=>{const M=[['env','环境变量 envFrom'],['vol','卷挂载（整个目录）'],['sub','卷挂载 subPath（单个文件）']];let mode='env',cm='info',env='info',file='info',t=0,restarted=false;const L=[];
 const md=document.getElementById('mode'),cl=document.getElementById('cl'),cmm=document.getElementById('cm');
 M.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{mode=v;reset()});md.appendChild(b)});
 const seen=()=>mode==='env'?env:file;
 function reset(){cm='info';env='info';file='info';t=0;L.length=0;L.push(`t=0s  Pod 启动，应用读到 LOG_LEVEL=${seen()}`);draw()}
 document.getElementById('edit').addEventListener('click',()=>{cm='debug';L.push(`t=${t}s  ConfigMap 改为 debug`);L.push(`t=${t}s  应用看到：${seen()}`);draw()});
 document.getElementById('wait').addEventListener('click',()=>{t+=60;if(mode==='vol')file=cm;L.push(`t=${t}s  应用看到：${seen()}`);draw()});
 document.getElementById('rr').addEventListener('click',()=>{env=cm;file=cm;t+=10;L.push(`t=${t}s  rollout restart，新 Pod 启动，应用看到：${seen()}`);draw()});
 document.getElementById('cr').addEventListener('click',reset);
 function draw(){md.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===mode));cl.innerHTML=L.map(x=>`<div>${x}</div>`).join('');
  const s=seen();if(cm==='info'){cmm.className='msg';cmm.innerHTML='先修改 ConfigMap。'}
  else if(s==='debug'){cmm.className='msg ok';cmm.innerHTML=(L.some(x=>x.includes('restart'))?'重启后新 Pod 在启动时读取了最新值。这对所有方式都有效，也是最可预期的做法。':'卷里的文件被 kubelet 自动替换了（通过符号链接原子切换）。但应用必须自己重新读取文件，很多程序只在启动时读一次。')}
  else{cmm.className='msg bad';cmm.innerHTML=mode==='env'?'环境变量在进程启动时确定，之后不会改变。需要重启 Pod。':mode==='sub'?'subPath 挂载的是文件的一个固定副本，<b>不会</b>随 ConfigMap 更新。这是常见的坑。需要重启 Pod。':'kubelet 定期同步卷（默认最长约 1 分钟），稍等。'}}reset()})();
Term(document.getElementById('t4'),[
['kubectl create configmap nginx-conf --from-file=nginx.conf --dry-run=client -o yaml','apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: nginx-conf\ndata:\n  nginx.conf: |\n    server { listen 80; … }','生成 YAML，放进 git。<code>--from-env-file=.env</code> 从 env 文件逐行导入。'],
['kubectl create secret generic db --from-literal=password=s3cr3t --dry-run=client -o yaml','apiVersion: v1\nkind: Secret\ndata:\n  password: czNjcjN0','注意：这样生成的 YAML 不能提交到 git。'],
['kubectl create secret docker-registry ghcr --docker-server=ghcr.io --docker-username=alice --docker-password=$TOKEN','secret/ghcr created','拉取私有镜像的凭证，在 Pod 里用 <code>imagePullSecrets: [{name: ghcr}]</code> 引用。'],
['kubectl create secret tls web-tls --cert=tls.crt --key=tls.key','secret/web-tls created','TLS 证书，Ingress 使用（第 8 课）。'],
['kubectl get secret db -o jsonpath="{.data.password}" | base64 -d','s3cr3t','有读取权限的人都能拿到明文。'],
['kubectl rollout restart deployment web','deployment.apps/web restarted','环境变量方式修改配置后，让 Pod 重新读取。'],
['kubectl get configmap app -o yaml | grep immutable','immutable: true','不可变：防止误改，大量 Pod 时也减轻 API Server 负担。修改 = 创建新的。']]);
Quiz(document.getElementById('qs'),[
['修改 ConfigMap 后，通过环境变量使用它的 Pod 会怎样？',['立刻看到新值','约一分钟后看到','重启前都看不到'],2,'环境变量在启动时确定。'],
['subPath 挂载的 ConfigMap 文件会自动更新吗？',['会','不会','只有 Secret 会'],1,'常见的坑。'],
['Secret 的 data 字段是？',['AES 加密','base64 编码','哈希'],1,'需要 RBAC、etcd 加密等额外保护。'],
['Kustomize configMapGenerator 在名字里加哈希的好处是？',['名字更短','配置变化触发滚动更新，且可以回滚','加密配置'],1,'模板引用变了 → 新 ReplicaSet。']]);
