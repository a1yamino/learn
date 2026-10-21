TITLE='本地集群与 kubectl';DESC='本课把工具用熟：用 kind 搭多节点集群，理解 kubeconfig 和 context，掌握 kubectl 的 get、describe、explain、apply、logs、exec，以及用 YAML 描述资源。';NEXT='Pod：最小的部署单元';MIN=45
SUM=['kind 用 Docker 容器模拟节点，适合学习和 CI。其他选择：minikube、k3d、Docker Desktop 自带的 Kubernetes。',
'kubeconfig（<code>~/.kube/config</code>）包含 clusters、users、contexts。<b>context = 集群 + 用户 + 默认命名空间</b>。执行命令前确认当前 context。',
'kubectl 的每条命令都是对 API Server 的 HTTP 请求。<code>-v=6</code> 可以看到请求的 URL。',
'每个资源都有 <code>apiVersion</code>、<code>kind</code>、<code>metadata</code>、<code>spec</code>，系统写回 <code>status</code>。<code>kubectl explain</code> 查字段含义。',
'命令式（<code>create</code>、<code>scale</code>）适合试验；声明式（YAML + <code>apply</code>）适合正式使用，文件放进 git。',
'<code>--dry-run=client -o yaml</code> 生成 YAML 模板；<code>kubectl diff</code> 在 apply 前看差异。']
def secs(prac,E):
    return [
('kubectl 发出一个请求','kubectl get pods 背后发生了什么？','<div id="p1"></div>'),
('资源的结构','一个 YAML 文件的四个部分。','<div id="p2"></div>'),
('动手：切换 context','你的 kubeconfig 里有三个 context。选择当前 context，再看同一条命令会作用到哪里。','<div class="chal"><div class="cmds" id="cx"></div><div class="log" id="cl"></div><div class="msg" id="cm"></div></div>'),
('kubectl 常用命令','查看、详情、文档、应用、日志、进入。','<div id="t4"></div>'),
('在你的电脑上练习','一个三节点集群，和一个完全用 YAML 管理的应用。',prac([
 ('删掉第 1 课的集群，用配置文件创建 1 个控制平面 + 2 个工作节点。','kind delete cluster --name learn\ncat > kind.yaml <<\'EOF\'\nkind: Cluster\napiVersion: kind.x-k8s.io/v1alpha4\nnodes:\n- role: control-plane\n- role: worker\n- role: worker\nEOF\nkind create cluster --name learn --config kind.yaml\nkubectl get nodes','NAME                  STATUS   ROLES           AGE   VERSION\nlearn-control-plane   Ready    control-plane   50s   v1.31.0\nlearn-worker          Ready    <none>          30s   v1.31.0\nlearn-worker2         Ready    <none>          30s   v1.31.0'),
 ('查看 context。','kubectl config get-contexts','CURRENT   NAME         CLUSTER      AUTHINFO     NAMESPACE\n*         kind-learn   kind-learn   kind-learn'),
 ('看 kubectl 发出的 HTTP 请求。','kubectl get pods -A -v=6 2>&1 | grep GET','GET https://127.0.0.1:41235/api/v1/pods?limit=500 200 OK in 9 milliseconds'),
 ('生成 YAML 模板，而不是直接创建。','kubectl create deployment web --image=nginx:alpine --replicas=2 --dry-run=client -o yaml > web.yaml\ngrep -E "^kind|replicas|image:" web.yaml','kind: Deployment\n  replicas: 2\n      - image: nginx:alpine'),
 ('应用，修改，看差异，再应用。','kubectl apply -f web.yaml\nsed -i.bak "s/replicas: 2/replicas: 4/" web.yaml\nkubectl diff -f web.yaml | grep replicas\nkubectl apply -f web.yaml','deployment.apps/web created\n-  replicas: 2\n+  replicas: 4\ndeployment.apps/web configured'),
 ('Pod 分布在哪些节点上？','kubectl get pods -o wide --no-headers | awk \'{print $1, $7}\'','web-5d9c7f6b8-2bxkq learn-worker\nweb-5d9c7f6b8-8jz4n learn-worker2\nweb-5d9c7f6b8-mm7wl learn-worker\nweb-5d9c7f6b8-t6vfr learn-worker2'),
 ('查字段文档。','kubectl explain deployment.spec.strategy.rollingUpdate.maxSurge | head -6','GROUP:      apps\nKIND:       Deployment\nVERSION:    v1\n\nFIELD: maxSurge <IntOrString>'),
 ('日志与进入容器。','P=$(kubectl get pod -l app=web -o name | head -1)\nkubectl exec $P -- nginx -v\nkubectl logs $P --tail 2','nginx version: nginx/1.27.2\n2024/10/21 11:20:01 [notice] 1#1: start worker process 30\n2024/10/21 11:20:01 [notice] 1#1: start worker process 31')],
 ('不用 kubectl 访问 API','用 <code>kubectl proxy</code> 在本地开一个已认证的代理，然后只用 curl 列出 default 命名空间里所有 Pod 的名字，并把 web 的副本数改成 1。说明为什么“kubectl 只是一个 API 客户端”。',
 '<pre class="cmd">kubectl proxy --port 8001 &amp;\ncurl -s localhost:8001/api/v1/namespaces/default/pods | python3 -c "import json,sys;[print(i[\'metadata\'][\'name\']) for i in json.load(sys.stdin)[\'items\']]"\ncurl -s -X PATCH -H "Content-Type: application/merge-patch+json" \\\n  -d \'{"spec":{"replicas":1}}\' \\\n  localhost:8001/apis/apps/v1/namespaces/default/deployments/web/scale | grep \'"replicas"\'\nkubectl get deploy web\nkill %1</pre><pre class="out">web-5d9c7f6b8-2bxkq\n…\n    "replicas": 1\nNAME   READY   UP-TO-DATE   AVAILABLE   AGE\nweb    1/1     1            1           6m</pre><p>Pod 在 <code>/api/v1</code>（核心组），Deployment 在 <code>/apis/apps/v1</code>。proxy 用 kubeconfig 里的证书完成认证，所以 curl 不需要凭证。kubectl、Dashboard、CI 工具、控制器，全都是在调用同一组 REST API。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
