const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{ch:S('chart web','templates/ + values.yaml','',180),v:S('values','-f prod.yaml --set …','',160),r:S('渲染','Go 模板 → YAML','',130),k:S('API Server','apply 清单','',130),s1:P('Secret sh.helm.release.v1.web.v1','mute'),s2:P('Secret …web.v2','sig'),s3:P('Secret …web.v3（内容同 v1）','ok'),n:{w:700,cls:'tag'}},scenes:[
 {t:'渲染',p:'Helm 把 chart 的默认 values、-f 文件、--set 依次合并，代入模板，得到普通的 Kubernetes 清单。<code>helm template</code> 到这一步为止。',d:3800,set:{ch:[0,0],v:[0,90],r:[230,45,{cls:'blk sig'}]}},
 {t:'install',p:'清单发给 API Server 创建资源。release 的信息（chart、合并后的 values、渲染出的清单）压缩后存进一个 Secret，这就是 revision 1。',d:4000,set:{ch:[0,0],v:[0,90],r:[230,45],k:[410,45,{cls:'blk sig'}],s1:[230,160]}},
 {t:'upgrade',p:'再次渲染，与上一个 revision 的清单做三方合并后更新资源，记为 revision 2。<code>--atomic</code> 失败时自动回滚，<code>--wait</code> 等资源就绪。',d:4000,set:{ch:[0,0],v:[0,90,{cls:'blk sig'}],r:[230,45],k:[410,45,{cls:'blk sig'}],s1:[230,160],s2:[230,200]}},
 {t:'rollback',p:'回滚就是取出旧 revision 存的清单重新应用，并记为新的 revision 3。历史保留数量由 <code>--history-max</code> 控制（默认 10）。',d:4000,set:{k:[410,45,{cls:'blk ok'}],s1:[230,160],s2:[230,200],s3:[230,240]}}]});
Player(document.getElementById('p2'),{els:{b:{w:240,h:150,cls:'frame',html:'<i>base/</i>'},bd:S('Deployment api','replicas 1 · nginx:1.27','',200),bs:S('Service api','','',200),o:{w:280,h:150,cls:'frame',html:'<i>overlays/prod/kustomization.yaml</i>'},o1:P('namePrefix: prod-','mute'),o2:P('images: newTag 1.27.3','mute'),o3:P('replicas: 4 · patches: patch.yaml','mute'),out:S('prod-api','replicas 4 · nginx:1.27.3 · env=prod','ok',260),n:{w:700,cls:'tag'}},scenes:[
 {t:'base',p:'base 是一组完整、可以直接 apply 的清单，没有任何占位符。',set:{b:[0,0],bd:[20,30],bs:[20,90]}},
 {t:'overlay',p:'overlay 引用 base，并声明要做的变换：加前缀和标签、改镜像标签、改副本数、打补丁、生成 ConfigMap。',d:3800,set:{b:[0,0],bd:[20,30],bs:[20,90],o:[290,0],o1:[305,30],o2:[305,65],o3:[305,100]}},
 {t:'输出',p:'<code>kubectl kustomize overlays/prod</code> 输出合并后的 YAML。引用关系（如 Service 的 selector、envFrom 的 ConfigMap 名）会被同步修改。',d:4000,set:{b:[0,0],bd:[20,30],bs:[20,90],o:[290,0],o1:[305,30],o2:[305,65],o3:[305,100],out:[290,190]}}]});
(()=>{const T=`# templates/deployment.yaml（片段）
replicas: {{ .Values.replicaCount }}
image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
resources: {{- toYaml .Values.resources | nindent 2 }}
{{- if .Values.ingress.enabled }}   # templates/ingress.yaml
host: {{ .Values.ingress.host }}
{{- end }}

# values.yaml：replicaCount: 1 · image: {repository: nginx, tag: ""} · resources: {} · ingress: {enabled: false}
# values-prod.yaml：replicaCount: 3 · resources: {requests: {cpu: 200m}} · ingress: {enabled: true, host: shop.example.com}
# Chart.yaml：appVersion: "1.27"`;document.getElementById('ht').textContent=T;
 const base={rc:[1,'values.yaml'],tag:['','values.yaml'],res:['{}','values.yaml'],ing:[false,'values.yaml']};
 const prod={rc:[3,'values-prod.yaml'],res:['\n  requests:\n    cpu: 200m','values-prod.yaml'],ing:[true,'values-prod.yaml']};
 const Q=[['helm install web ./web',{},'只用默认值。tag 为空，default 取 Chart 的 appVersion。'],
  ['helm install web ./web -f values-prod.yaml',prod,'-f 文件覆盖默认值；没写到的键（image）保持默认。ingress 打开后多渲染出一个 Ingress。'],
  ['helm install web ./web -f values-prod.yaml --set image.tag=1.27.3',{...prod,tag:['1.27.3','--set']},'--set 优先级最高，适合 CI 中传入镜像版本。'],
  ['helm install web ./web --set replicaCount=5 -f values-prod.yaml',{...prod,rc:[5,'--set']},'参数顺序不重要：--set 总是在所有 -f 之后合并。'],
  ['helm upgrade web ./web --set image.tag=1.28',{tag:['1.28','--set']},'upgrade 不带 -f 时，<b>不会</b>沿用上次的 values-prod.yaml：副本回到 1，requests 和 Ingress 都没了。每次都要传完整的值，或用 --reset-then-reuse-values（谨慎）。'],
  ['helm upgrade web ./web --reuse-values --set image.tag=1.28',{...prod,tag:['1.28','--set'],_r:1},'--reuse-values 沿用上次合并后的值再叠加 --set。但 chart 新版本增加的默认值不会被带入，容易埋坑；更推荐在 Git 里保存 values 文件，每次显式传入。']];
 const hv=document.getElementById('hv'),ho=document.getElementById('ho'),hm=document.getElementById('hm');
 Q.forEach(([c,v,m],i)=>{const b=document.createElement('button');b.className='btn';b.dataset.v=i;b.textContent=c;b.addEventListener('click',()=>run(i));hv.appendChild(b)});
 function run(i){hv.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',+b.dataset.v===i));const [c,o,m]=Q[i];const V={...base,...o};if(o._r)for(const k of ['rc','res','ing'])V[k]=[prod[k][0],'上次的值'];
  const tag=V.tag[0]||'1.27',tsrc=V.tag[0]?V.tag[1]:'Chart.appVersion';
  ho.textContent=`replicas: ${V.rc[0]}            # ← ${V.rc[1]}\nimage: "nginx:${tag}"     # ← tag 来自 ${tsrc}\nresources: ${V.res[0]}   # ← ${V.res[1]}`+(V.ing[0]?`\n---\nkind: Ingress\nhost: shop.example.com   # ← ${V.ing[1]}`:'\n# Ingress 未渲染（ingress.enabled=false）');
  hm.className='msg '+(i===4?'bad':'ok');hm.innerHTML=m}
 run(0)})();
Term(document.getElementById('t4'),[
['helm repo add traefik https://traefik.github.io/charts && helm search repo traefik','NAME              CHART VERSION   APP VERSION   DESCRIPTION\ntraefik/traefik   37.1.2          v3.5.3        A Traefik based Kubernetes ingress controller','添加仓库并搜索 chart。OCI 仓库可直接 <code>helm install x oci://…</code>。'],
['helm show values traefik/traefik | head -5','# Default values for Traefik\nimage:\n  registry: docker.io\n  repository: traefik\n  tag:','安装前先看有哪些可配置的值。'],
['helm get values web','USER-SUPPLIED VALUES:\nimage:\n  tag: "1.28"','某个 release 当前使用的用户值。<code>--all</code> 显示合并后的全部值。'],
['helm get manifest web | kubectl diff -f -','diff -u -N /tmp/LIVE-…/apps.v1.Deployment.default.web\n-  replicas: 3\n+  replicas: 1','对比 release 记录的清单与集群实际状态，检查是否被手动改过。'],
['helm list -A','NAME   NAMESPACE   REVISION   STATUS     CHART       APP VERSION\nweb    default     4          deployed   web-0.1.0   1.27','所有命名空间的 release。'],
['kubectl diff -k kz/prod','diff -u -N /tmp/LIVE-…/apps.v1.Deployment.default.prod-api\n-  replicas: 2\n+  replicas: 4','Kustomize 渲染后与集群对比，相当于 Helm 的 diff 插件。']]);
Quiz(document.getElementById('qs'),[
['-f values-prod.yaml 和 --set replicaCount=5 同时给出，replicaCount 是？',['values-prod.yaml 中的值','5','取决于参数顺序'],1,'--set 优先。'],
['Helm 3 把 release 的历史存在哪里？',['Tiller','命名空间中的 Secret','本地 ~/.helm'],1,'每个 revision 一个 Secret。'],
['改了 configMapGenerator 的内容后 apply，Pod 会？',['不变','滚动更新','立即被删除'],1,'名字带哈希，引用随之变化。'],
['Kustomize 和 Helm 最本质的区别？',['Kustomize 只能用于测试','Kustomize 不用模板，用补丁修改合法的 YAML','Helm 不能用于多环境'],1,'也不记录发布历史。']]);
