TITLE='健康检查、资源请求与限制';DESC='让 Kubernetes 知道你的应用是否活着、是否能接收流量、需要多少资源。本课讲三种探针的区别和常见误用、优雅终止，以及 requests、limits 和 QoS 等级如何影响调度与驱逐。';NEXT='命名空间、标签与 kubectl 进阶';MIN=50
SUM=['<b>readinessProbe</b>：失败就从 Service 端点中摘除，不重启。<b>livenessProbe</b>：失败就重启容器。<b>startupProbe</b>：启动完成前暂停另外两个探针，保护慢启动的应用。',
'liveness 只检查进程自身是否卡死，<b>不要</b>检查数据库等外部依赖：依赖出问题时重启所有 Pod 只会让情况更糟。',
'优雅终止：Pod 删除时同时开始“从端点摘除”和“发 SIGTERM”。用 <code>preStop</code> 短暂等待，应用收到 SIGTERM 后处理完已有请求再退出，在 <code>terminationGracePeriodSeconds</code>（默认 30 秒）内完成。',
'<b>requests</b> 用于调度：节点上 requests 之和不能超过可分配资源。<b>limits</b> 是运行时上限：CPU 超了被节流，内存超了被 OOMKill（Docker 第 21 课）。',
'QoS：requests = limits → Guaranteed；只设了部分 → Burstable；都没设 → BestEffort。节点内存紧张时，BestEffort 最先被驱逐。',
'常见做法：内存 requests = limits；CPU 设 requests，不设或放宽 limits，避免节流。']
def secs(prac,E):
    return [
('三种探针','它们问的是不同的问题。','<div id="p1"></div>'),
('requests 与 limits','调度看 requests，运行时看 limits。','<div id="p2"></div>'),
('动手：配置探针','一个 Java 服务启动需要约 45 秒，之后在 /healthz 响应。依赖的数据库偶尔会断开 1 分钟。选择探针配置，看 3 分钟内发生了什么。','<div class="chal"><div class="cmds" id="pa"></div><div class="cmds" id="pb"></div><div class="log" id="pt" style="height:auto;min-height:120px"></div><div class="msg" id="pm"></div></div>'),
('相关命令','观察探针、资源、QoS、驱逐。','<div id="t4"></div>'),
('在你的电脑上练习','亲手看到每种探针的效果。',prac([
 ('readiness 失败：Pod 不重启，但从端点消失。','kubectl create deployment rd --image=nginx:alpine --replicas=2\nkubectl patch deployment rd --type=json -p=\'[{"op":"add","path":"/spec/template/spec/containers/0/readinessProbe","value":{"httpGet":{"path":"/ready","port":80},"periodSeconds":2}}]\'\nkubectl expose deployment rd --port 80\nsleep 15; kubectl get pods -l app=rd; kubectl get endpointslices -l kubernetes.io/service-name=rd -o jsonpath="{.items[0].endpoints[*].conditions.ready}"','rd-5c9f…   0/1   Running   0   12s\nrd-5c9f…   0/1   Running   0   12s\nfalse false'),
 ('让其中一个 Pod 就绪（创建 /ready 文件）。','P=$(kubectl get pod -l app=rd -o name | head -1)\nkubectl exec $P -- sh -c "echo ok > /usr/share/nginx/html/ready"\nsleep 4; kubectl get pods -l app=rd','rd-5c9f…-a   1/1   Running   0   40s\nrd-5c9f…-b   0/1   Running   0   40s'),
 ('liveness 失败：容器被重启。','kubectl run lv --image=busybox --overrides=\'{"spec":{"containers":[{"name":"lv","image":"busybox","command":["sh","-c","touch /tmp/ok; sleep 20; rm /tmp/ok; sleep 600"],"livenessProbe":{"exec":{"command":["cat","/tmp/ok"]},"periodSeconds":3,"failureThreshold":2}}]}}\'\nsleep 40; kubectl get pod lv; kubectl describe pod lv | grep -m1 Unhealthy','lv   1/1   Running   1 (8s ago)   40s\nWarning  Unhealthy  … Liveness probe failed: cat: can\'t open \'/tmp/ok\': No such file or directory'),
 ('QoS 等级。','kubectl run g --image=nginx:alpine --overrides=\'{"spec":{"containers":[{"name":"g","image":"nginx:alpine","resources":{"requests":{"cpu":"100m","memory":"64Mi"},"limits":{"cpu":"100m","memory":"64Mi"}}}]}}\'\nkubectl get pod g lv -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass','NAME   QOS\ng      Guaranteed\nlv     BestEffort'),
 ('节点上已经被预留了多少？','kubectl describe node learn-worker | grep -A6 "Allocated resources"','Allocated resources:\n  Resource           Requests     Limits\n  --------           --------     ------\n  cpu                200m (2%)    100m (1%)\n  memory             64Mi (0%)    64Mi (0%)'),
 ('requests 太大，无法调度。','kubectl run big --image=nginx:alpine --overrides=\'{"spec":{"containers":[{"name":"b","image":"nginx:alpine","resources":{"requests":{"cpu":"500"}}}]}}\'\nsleep 3; kubectl get pod big; kubectl describe pod big | grep -m1 FailedScheduling','big   0/1   Pending   0   3s\nWarning  FailedScheduling  0/3 nodes are available: 3 Insufficient cpu.'),
 ('清理。','kubectl delete deploy rd; kubectl delete svc rd; kubectl delete pod lv g big','pod "big" deleted')],
 ('优雅终止','部署 3 副本的 nginx + Service，用第 4 课挑战里的 probe Pod 持续请求。分别在<b>没有</b>和<b>有</b> <code>preStop: sleep 5</code> 的情况下执行 <code>kubectl rollout restart</code>，比较失败请求数，并解释原因。',
 '<pre class="cmd">        lifecycle:\n          preStop:\n            exec: { command: ["sleep", "5"] }\n      terminationGracePeriodSeconds: 30</pre><pre class="out">没有 preStop：ok=503 bad=4\n有 preStop：  ok=511 bad=0</pre><p>删除 Pod 时，两件事<b>并行</b>开始：(1) 端点控制器把 Pod 从 EndpointSlice 删除，各节点 kube-proxy 再更新规则；(2) kubelet 向容器发送 SIGTERM。nginx 收到 SIGTERM 很快就退出了，而有些节点的转发规则还没更新，仍在把请求发给它 → 失败。preStop 先睡 5 秒，等规则传播完毕再让进程开始退出。preStop 的时间计入 terminationGracePeriodSeconds。（新版本 Kubernetes 也可以用 <code>sleep</code> 动作代替 exec。）</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
