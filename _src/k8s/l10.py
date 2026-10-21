TITLE='命名空间、标签与 kubectl 进阶';DESC='组织和查询集群里的大量对象：用命名空间划分团队和环境，用 ResourceQuota 和 LimitRange 设置边界，用标签和选择器把对象串起来，以及高效使用 kubectl 的技巧。';NEXT='控制平面：API Server、etcd、调度器、控制器';MIN=45
SUM=['命名空间划分名字和权限（RBAC、配额、网络策略都按命名空间配置）。它<b>不</b>隔离网络：不同命名空间的 Pod 默认可以互相访问（第 21 课）。',
'ResourceQuota 限制整个命名空间的总量（CPU、内存、Pod 数、PVC 数…）；LimitRange 给没写 requests/limits 的容器设置默认值和上下限。',
'<b>标签</b>用来选择（Service、Deployment、查询），<b>注解</b>存放给工具看的元数据（变更原因、构建信息）。推荐标签：<code>app.kubernetes.io/name</code>、<code>/instance</code>、<code>/version</code>、<code>/component</code>、<code>/part-of</code>。',
'选择器：等值（<code>app=web</code>、<code>env!=prod</code>）和集合（<code>env in (dev,staging)</code>、<code>!canary</code>）。Deployment 的选择器创建后不能修改。',
'kubectl 技巧：<code>-o custom-columns</code>、<code>-o jsonpath</code>、<code>--field-selector</code>、<code>--sort-by</code>、<code>kubectl api-resources</code>、<code>kubectl auth can-i</code>、别名和自动补全。']
def secs(prac,E):
    return [
('命名空间与配额','一个集群，多个团队。','<div id="p1"></div>'),
('标签把对象串起来','Deployment、ReplicaSet、Pod、Service 之间靠什么关联？','<div id="p2"></div>'),
('动手：标签选择器','集群里有 8 个 Pod。写选择器，看哪些被选中。','<div class="chal"><div class="cmds" id="qs1"></div><div id="pods" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0"></div><div class="msg" id="lm"></div></div>'),
('kubectl 进阶','让查询和排查更快。','<div id="t4"></div>'),
('在你的电脑上练习','给团队建一个有边界的命名空间。',prac([
 ('创建命名空间，并把它设为当前 context 的默认值。','kubectl create namespace team-a\nkubectl config set-context --current --namespace=team-a\nkubectl config view --minify -o jsonpath="{..namespace}"','namespace/team-a created\nContext "kind-learn" modified.\nteam-a'),
 ('设置配额和默认值。','kubectl apply -f - <<\'EOF\'\napiVersion: v1\nkind: ResourceQuota\nmetadata: { name: quota }\nspec:\n  hard: { requests.cpu: "1", requests.memory: 1Gi, limits.memory: 2Gi, pods: "10" }\n---\napiVersion: v1\nkind: LimitRange\nmetadata: { name: defaults }\nspec:\n  limits:\n  - type: Container\n    default: { cpu: 200m, memory: 256Mi }\n    defaultRequest: { cpu: 100m, memory: 128Mi }\nEOF\nkubectl create deployment web --image=nginx:alpine --replicas=3\nkubectl get pod -l app=web -o jsonpath="{.items[0].spec.containers[0].resources}"','{"limits":{"cpu":"200m","memory":"256Mi"},"requests":{"cpu":"100m","memory":"128Mi"}}'),
 ('扩容超出配额。','kubectl scale deploy web --replicas=12\nsleep 3; kubectl get deploy web\nkubectl get events --field-selector reason=FailedCreate | tail -1','NAME   READY   UP-TO-DATE   AVAILABLE\nweb    8/12    8            8\nWarning  FailedCreate  replicaset/web-…  Error creating: pods "web-…" is forbidden: exceeded quota: quota, requested: requests.memory=128Mi, used: requests.memory=1Gi, limited: requests.memory=1Gi'),
 ('查看配额使用情况。','kubectl describe quota quota','Resource         Used   Hard\n--------         ----   ----\nlimits.memory    2Gi    2Gi\npods             8      10\nrequests.cpu     800m   1\nrequests.memory  1Gi    1Gi'),
 ('自定义列和排序。','kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,START:.status.startTime --sort-by=.status.startTime | head -3','NAME                  NODE            START\nweb-5d9c7f6b8-2bxkq   learn-worker    2026-10-21T11:56:01Z\nweb-5d9c7f6b8-8jz4n   learn-worker2   2026-10-21T11:56:01Z'),
 ('跨命名空间按字段筛选：所有不在 Running 的 Pod。','kubectl get pods -A --field-selector=status.phase!=Running','No resources found'),
 ('切回 default，删除命名空间（其中的一切都会被删除）。','kubectl config set-context --current --namespace=default\nkubectl delete namespace team-a','namespace "team-a" deleted')],
 ('一行命令的排查报告','写一条（可以用管道的）命令：列出<b>所有命名空间</b>里重启次数大于 0 的容器，输出“命名空间/Pod/容器 重启次数”，按重启次数从大到小排序。提示：<code>-o jsonpath</code> 的 range。',
 '<pre class="cmd">kubectl get pods -A -o jsonpath=\'{range .items[*]}{.metadata.namespace}{"/"}{.metadata.name}{" "}{range .status.containerStatuses[*]}{.name}{"="}{.restartCount}{" "}{end}{"\\n"}{end}\' \\\n | awk \'{for(i=2;i&lt;=NF;i++){split($i,a,"=");if(a[2]&gt;0)print a[2], $1"/"a[1]}}\' | sort -rn</pre><pre class="out">3 kube-system/kindnet-x7k2p/kindnet-cni\n1 default/lv/lv</pre><p>jsonpath 的 range 可以嵌套，但内层无法引用外层字段，所以先把每个 Pod 输出成一行（Pod 名 + 所有容器的“名=次数”），再交给 awk 拆开过滤。也可以用 <code>-o json | jq</code>：<code>jq -r \'.items[] | .metadata as $m | .status.containerStatuses[]? | select(.restartCount&gt;0) | "\\(.restartCount) \\($m.namespace)/\\($m.name)/\\(.name)"\' | sort -rn</code>。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
