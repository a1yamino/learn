TITLE='自动扩缩容：HPA、VPA 与节点扩缩';DESC='负载变化时，Kubernetes 可以在三个层面自动调整：Pod 的数量（HPA）、Pod 的资源大小（VPA）、节点的数量（Cluster Autoscaler、Karpenter）。本课讲它们的算法、相互关系和常见的配置错误。';NEXT='CRD 与 Operator：扩展 Kubernetes API';MIN=50
SUM=['HPA 公式：<code>期望副本 = ceil(当前副本 × 当前指标 / 目标指标)</code>。CPU 利用率是相对 <b>requests</b> 计算的，没有 requests 的 Pod 无法按 CPU 扩缩。',
'HPA 每 15 秒计算一次；比值在 ±10% 容差内不调整；缩容默认有 5 分钟稳定窗口，防止抖动。<code>behavior</code> 字段可以控制扩缩速度。',
'指标来源：metrics-server（CPU、内存）、custom metrics（如 Prometheus Adapter 提供的 QPS）、external metrics（如队列长度）。KEDA 基于事件扩缩，可以缩到 0。',
'VPA 根据历史用量推荐或自动修改 requests。不要让 VPA 和 HPA 同时基于 CPU 工作：一个改分母，一个改副本数，会互相干扰。',
'节点扩缩：Pod 因资源不足 Pending → Cluster Autoscaler / Karpenter 添加节点；节点长时间利用率低且 Pod 能挪走 → 删除节点。它们看的也是 <b>requests</b>，不是实际用量。',
'扩容链条有延迟：指标采集 + HPA 周期 + 调度 + 新节点启动（分钟级）+ 镜像拉取 + 应用启动。突发流量需要预留余量或提前扩容。']
def secs(prac,E):
    return [
('HPA 的控制循环','从指标到副本数。','<div id="p1"></div>'),
('节点自动扩缩','Pod 放不下时加节点，空闲时减节点。','<div id="p2"></div>'),
('动手：HPA 怎么算','Deployment 当前 4 个副本，每个 requests <code>cpu: 500m</code>，HPA 目标利用率 60%，min 2、max 10。选择当前的平均 CPU 用量，看 HPA 的决定。','<div class="chal"><div class="cmds" id="hl"></div><div class="log" id="hc" style="height:auto;min-height:90px"></div><div class="msg" id="hm"></div></div>'),
('相关命令','查看指标和扩缩容决策。','<div id="t4"></div>'),
('在你的电脑上练习','kind 默认没有 metrics-server，先安装（kind 的 kubelet 使用自签名证书，需要 <code>--kubelet-insecure-tls</code>）。',prac([
 ('安装 metrics-server。','kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml\nkubectl -n kube-system patch deploy metrics-server --type=json -p \'[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]\'\nkubectl -n kube-system rollout status deploy/metrics-server; sleep 30; kubectl top nodes','NAME                  CPU(cores)   CPU(%)   MEMORY(bytes)   MEMORY(%)\nlearn-control-plane   142m         1%       712Mi           9%\nlearn-worker          31m          0%       245Mi           3%'),
 ('部署一个带 requests 的应用。','kubectl create deployment php --image=registry.k8s.io/hpa-example\nkubectl set resources deploy php --requests=cpu=200m\nkubectl expose deploy php --port 80','deployment.apps/php created\ndeployment.apps/php resource requirements updated\nservice/php exposed'),
 ('创建 HPA。','kubectl autoscale deploy php --cpu-percent=50 --min=1 --max=8\nkubectl get hpa php','NAME   REFERENCE        TARGETS       MINPODS   MAXPODS   REPLICAS\nphp    Deployment/php   cpu: 0%/50%   1         8         1'),
 ('另开一个终端施加负载。','kubectl run load --image=busybox --restart=Never -- sh -c "while true; do wget -q -O- http://php; done"','pod/load created'),
 ('观察扩容（约 1 分钟后）。','kubectl get hpa php --watch','php    Deployment/php   cpu: 248%/50%   1   8   1\nphp    Deployment/php   cpu: 248%/50%   1   8   5\nphp    Deployment/php   cpu: 62%/50%    1   8   5\nphp    Deployment/php   cpu: 51%/50%    1   8   7'),
 ('停止负载，5 分钟稳定窗口后才缩容。','kubectl delete pod load\nkubectl describe hpa php | tail -3','  Normal  SuccessfulRescale  6m   horizontal-pod-autoscaler  New size: 7; reason: cpu resource utilization (percentage of request) above target\n  Normal  SuccessfulRescale  12s  horizontal-pod-autoscaler  New size: 1; reason: All metrics below target')],
 ('更快扩容、更慢缩容','流量突增时上面的 HPA 每次只能翻倍（默认每 15 秒最多 100% 或 4 个 Pod，取大者）。改写为 <code>autoscaling/v2</code>：扩容时每 15 秒最多增加 4 倍、无稳定窗口；缩容时 10 分钟稳定窗口，每分钟最多减少 1 个 Pod。并解释为什么副本数达到 max 后 CPU 仍然超标也不会继续扩。',
 '<pre class="cmd">apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata: {name: php}\nspec:\n  scaleTargetRef: {apiVersion: apps/v1, kind: Deployment, name: php}\n  minReplicas: 1\n  maxReplicas: 8\n  metrics:\n  - type: Resource\n    resource: {name: cpu, target: {type: Utilization, averageUtilization: 50}}\n  behavior:\n    scaleUp:\n      stabilizationWindowSeconds: 0\n      policies: [{type: Percent, value: 300, periodSeconds: 15}]\n    scaleDown:\n      stabilizationWindowSeconds: 600\n      policies: [{type: Pods, value: 1, periodSeconds: 60}]</pre><pre class="out">kubectl describe hpa php | grep ScalingLimited\n  ScalingLimited  True  TooManyReplicas  the desired replica count is more than the maximum replica count</pre><p>增加 300% 即变为 4 倍。maxReplicas 是硬上限：条件 ScalingLimited 会显示 TooManyReplicas。这时要么提高上限，要么检查瓶颈是否根本不在这个服务（例如数据库），否则加副本也没用。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
