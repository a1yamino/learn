TITLE='Deployment：滚动更新与回滚';DESC='Deployment 是运行无状态服务的标准方式。本课讲 Deployment、ReplicaSet、Pod 三层关系，滚动更新如何在不停机的情况下替换所有 Pod，maxSurge 和 maxUnavailable 怎么取值，以及回滚和暂停。';NEXT='Service：服务发现与负载均衡';MIN=45
SUM=['Deployment 管理 ReplicaSet，ReplicaSet 管理 Pod。修改 Pod 模板（镜像、环境变量…）会创建一个<b>新的 ReplicaSet</b>；只改副本数不会。',
'滚动更新：逐步扩大新 ReplicaSet、缩小旧 ReplicaSet。<code>maxSurge</code> 是允许多出的 Pod 数，<code>maxUnavailable</code> 是允许不可用的 Pod 数。',
'新 Pod 只有<b>就绪</b>（readiness，第 9 课）后才算可用，滚动才继续。新版本起不来，滚动会卡住，旧 Pod 仍在服务。',
'旧 ReplicaSet 保留（<code>revisionHistoryLimit</code>，默认 10），所以 <code>kubectl rollout undo</code> 能快速回滚。',
'<code>strategy: Recreate</code> 先删光旧 Pod 再建新的，会中断服务，只用于不能同时运行两个版本的应用。',
'<code>progressDeadlineSeconds</code>：超时未完成，Deployment 标记为失败，<code>rollout status</code> 返回非 0，CI 据此判断。']
def secs(prac,E):
    return [
('三层对象','你创建 Deployment，它创建其余的一切。','<div id="p1"></div>'),
('滚动更新','从 v1 到 v2，服务一直在线。','<div id="p2"></div>'),
('动手：调整滚动参数','4 个副本，从 v1 更新到 v2。设置 maxSurge 和 maxUnavailable，然后一步一步执行，看每一步有几个 Pod 在服务。','<div class="chal"><div class="cmds" id="ms"></div><div class="cmds" id="mu"></div><div class="cmds"><button class="btn pri" id="step">下一步</button><button class="btn" id="rst">重新开始</button></div><div id="rs" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-height:40px;margin:12px 0"></div><div class="msg" id="rm"></div></div>'),
('相关命令','更新、观察、回滚、暂停。','<div id="t4"></div>'),
('在你的电脑上练习','完整走一遍：部署、更新、坏版本、回滚。',prac([
 ('先删除第 2 课留下的 web（仅限本地 learn 练习集群），再部署本课 v1，避免同名对象和版本历史冲突。--record 已弃用，用注解记录变更原因。','kubectl delete deployment web --ignore-not-found\nkubectl create deployment web --image=nginx:1.26-alpine --replicas=4\nkubectl annotate deployment web kubernetes.io/change-cause="v1 nginx 1.26"\nkubectl rollout status deployment web','deployment "web" successfully rolled out'),
 ('更新到 v2，同时观察 ReplicaSet。','kubectl set image deployment web nginx=nginx:1.27-alpine\nkubectl annotate deployment web kubernetes.io/change-cause="v2 nginx 1.27" --overwrite\nkubectl rollout status deployment web\nkubectl get rs','Waiting for deployment "web" rollout to finish: 2 out of 4 new replicas have been updated...\ndeployment "web" successfully rolled out\nNAME             DESIRED   CURRENT   READY   AGE\nweb-6b7f9c8d5d   4         4         4       20s\nweb-7c5b8d6f9b   0         0         0       2m'),
 ('部署一个不存在的镜像。','kubectl set image deployment web nginx=nginx:9.9-doesnotexist\nkubectl rollout status deployment web --timeout=30s; echo exit=$?\nkubectl get pods','error: timed out waiting for the condition\nexit=1\nweb-6b7f9c8d5d-…   1/1   Running        (×3)\nweb-85d4c7b9f-…    0/1   ErrImagePull   (×2)'),
 ('注意：旧版本仍有 3 个在服务（maxUnavailable 默认 25% = 1）。查看历史并回滚。','kubectl rollout history deployment web\nkubectl rollout undo deployment web\nkubectl rollout status deployment web','REVISION  CHANGE-CAUSE\n1         v1 nginx 1.26\n2         v2 nginx 1.27\n3         v2 nginx 1.27\ndeployment.apps/web rolled back\ndeployment "web" successfully rolled out'),
 ('回滚到指定版本。','kubectl rollout undo deployment web --to-revision=1\nkubectl get deploy web -o jsonpath="{.spec.template.spec.containers[0].image}"','deployment.apps/web rolled back\nnginx:1.26-alpine'),
 ('改副本数不产生新 ReplicaSet。','kubectl scale deployment web --replicas=6 && kubectl get rs --no-headers | wc -l','3')],
 ('零中断更新','用 YAML 管理 web：4 副本，<code>maxUnavailable: 0</code>、<code>maxSurge: 1</code>，nginx 带一个 readinessProbe（HTTP GET /）。在另一个终端用 <code>kubectl port-forward</code> 不可行（只连一个 Pod），改为在集群里运行一个循环请求的 Pod，持续请求 Service（先 <code>kubectl expose deployment web --port 80</code>）。更新镜像，统计失败请求数。',
 '<pre class="cmd">spec:\n  replicas: 4\n  strategy:\n    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }\n  template:\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:1.26-alpine\n        readinessProbe:\n          httpGet: { path: /, port: 80 }\n          periodSeconds: 2</pre><pre class="cmd">kubectl apply -f web.yaml &amp;&amp; kubectl expose deployment web --port 80\nkubectl run probe --image=busybox -- sh -c \'ok=0; bad=0; while true; do if wget -qO- -T1 web >/dev/null; then ok=$((ok+1)); else bad=$((bad+1)); fi; echo "ok=$ok bad=$bad"; sleep 0.2; done\'\nkubectl set image deployment web nginx=nginx:1.27-alpine &amp;&amp; kubectl rollout status deployment web\nkubectl logs probe --tail 1</pre><pre class="out">ok=412 bad=0</pre><p><code>maxUnavailable: 0</code> 保证任何时刻至少 4 个就绪 Pod；新 Pod 只有通过 readinessProbe 才会接收流量。真实应用还要处理关闭：收到 SIGTERM 后停止接收新请求、处理完已有请求再退出（第 9 课会讲 preStop 和优雅终止）。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
