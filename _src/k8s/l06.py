TITLE='ConfigMap 与 Secret';DESC='把配置和代码分开：同一个镜像在开发、测试、生产使用不同的配置。本课讲 ConfigMap 和 Secret 的创建与使用方式（环境变量、文件），配置更新后应用能否感知，以及 Secret 的真实安全性。';NEXT='存储：PV、PVC 与 StorageClass';MIN=45
SUM=['ConfigMap 存非敏感配置，Secret 存敏感数据。两者都可以作为<b>环境变量</b>或<b>挂载为文件</b>使用。',
'环境变量只在容器<b>启动时</b>读取，之后修改 ConfigMap 不会生效，需要重启 Pod（<code>kubectl rollout restart</code>）。',
'挂载为卷的文件会在约一分钟内<b>自动更新</b>（kubelet 同步周期），但 <code>subPath</code> 挂载不会更新。应用还需要自己重新读取文件。',
'Secret 默认只是 <b>base64 编码</b>，不是加密。保护它靠：RBAC 限制读取、etcd 静态加密、不要提交到 git（用 Sealed Secrets、External Secrets 等）。',
'常见做法：不可变的配置版本（<code>immutable: true</code> + 名字带哈希，Kustomize 自动生成），修改配置 = 新名字 = 触发滚动更新，可回滚。']
def secs(prac,E):
    return [
('两种使用方式','环境变量和文件。','<div id="p1"></div>'),
('Secret 有多“秘密”','base64 不是加密。','<div id="p2"></div>'),
('动手：配置更新后会怎样','ConfigMap <code>app</code> 里 <code>LOG_LEVEL=info</code>。选择 Pod 使用它的方式，然后把值改成 <code>debug</code>，看应用什么时候能看到新值。','<div class="chal"><div class="cmds" id="mode"></div><div class="cmds"><button class="btn pri" id="edit">kubectl edit：改成 debug</button><button class="btn" id="wait">等 60 秒</button><button class="btn" id="rr">rollout restart</button><button class="btn" id="cr">重置</button></div><div class="log" id="cl" style="height:auto;min-height:120px"></div><div class="msg" id="cm"></div></div>'),
('相关命令','创建、查看、使用、更新。','<div id="t4"></div>'),
('在你的电脑上练习','两种方式使用配置，亲手验证更新行为。',prac([
 ('从字面值和文件创建 ConfigMap。','echo "max_conn = 100" > app.conf\nkubectl create configmap app --from-literal=LOG_LEVEL=info --from-file=app.conf\nkubectl get configmap app -o yaml | grep -A3 "^data"','data:\n  LOG_LEVEL: info\n  app.conf: |\n    max_conn = 100'),
 ('创建 Secret，然后看它是怎么存的。','kubectl create secret generic db --from-literal=password=s3cr3t\nkubectl get secret db -o jsonpath="{.data.password}"; echo\nkubectl get secret db -o jsonpath="{.data.password}" | base64 -d; echo','czNjcjN0\ns3cr3t'),
 ('一个 Pod 同时用环境变量和文件两种方式读取。','cat > cfg.yaml <<\'EOF\'\napiVersion: v1\nkind: Pod\nmetadata: { name: cfg }\nspec:\n  containers:\n  - name: app\n    image: busybox\n    command: ["sh","-c","sleep 3600"]\n    envFrom: [{ configMapRef: { name: app } }]\n    env:\n    - name: DB_PASSWORD\n      valueFrom: { secretKeyRef: { name: db, key: password } }\n    volumeMounts: [{ name: conf, mountPath: /etc/app }]\n  volumes:\n  - name: conf\n    configMap: { name: app }\nEOF\nkubectl apply -f cfg.yaml && kubectl wait --for=condition=Ready pod/cfg\nkubectl exec cfg -- sh -c \'echo $LOG_LEVEL $DB_PASSWORD; cat /etc/app/LOG_LEVEL; echo\'','info s3cr3t\ninfo'),
 ('修改 ConfigMap。','kubectl patch configmap app -p \'{"data":{"LOG_LEVEL":"debug"}}\'\nsleep 70\nkubectl exec cfg -- sh -c \'echo env=$LOG_LEVEL; echo file=$(cat /etc/app/LOG_LEVEL)\'','env=info\nfile=debug'),
 ('文件已更新，环境变量没有。看看文件是怎么原子替换的。','kubectl exec cfg -- ls -la /etc/app','lrwxrwxrwx  ..data -> ..2026_10_21_11_40_12.381\nlrwxrwxrwx  LOG_LEVEL -> ..data/LOG_LEVEL\nlrwxrwxrwx  app.conf -> ..data/app.conf'),
 ('清理。','kubectl delete pod cfg; kubectl delete configmap app; kubectl delete secret db','pod "cfg" deleted')],
 ('配置变更触发滚动更新','用 Kustomize（kubectl 内置）的 <code>configMapGenerator</code> 为一个 Deployment 生成 ConfigMap。修改配置值后重新 apply，确认：生成了新名字的 ConfigMap、Deployment 自动滚动更新、可以用 <code>rollout undo</code> 回到旧配置。',
 '<pre class="cmd">mkdir kz &amp;&amp; cd kz\ncat > kustomization.yaml <<\'EOF\'\nresources: [deploy.yaml]\nconfigMapGenerator:\n- name: app\n  literals: [LOG_LEVEL=info]\nEOF\nkubectl create deployment web --image=busybox --dry-run=client -o yaml -- sleep 3600 > deploy.yaml\n# 在 deploy.yaml 的容器下加入：envFrom: [{ configMapRef: { name: app } }]\nkubectl apply -k . &amp;&amp; kubectl get cm | grep app-\nsed -i.bak "s/LOG_LEVEL=info/LOG_LEVEL=debug/" kustomization.yaml\nkubectl apply -k . &amp;&amp; kubectl rollout status deploy web\nkubectl get cm | grep app-\nkubectl rollout undo deploy web\nkubectl exec deploy/web -- printenv LOG_LEVEL</pre><pre class="out">app-g7hk2m9c5f   1      3s\nconfigmap/app-5c8b6tf2d4 created\ndeployment.apps/web configured\ndeployment "web" successfully rolled out\napp-5c8b6tf2d4   1      5s\napp-g7hk2m9c5f   1      40s\ninfo</pre><p>名字里的哈希由内容计算。内容变了 → 名字变了 → Deployment 的 Pod 模板引用了新名字 → 模板变化 → 滚动更新（第 4 课）。旧 ConfigMap 仍在，所以 undo 后旧 ReplicaSet 引用的旧配置依然有效。这比原地修改 ConfigMap 更可控。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
