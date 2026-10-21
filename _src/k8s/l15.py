TITLE='调度深入：亲和性、污点、拓扑分布与优先级';DESC='调度器只做一件事：给 nodeName 为空的 Pod 选一个节点。本课讲调度周期的过滤和打分、用 nodeSelector / 亲和性 / 污点与容忍控制 Pod 的去向、用拓扑分布约束把副本分散到各可用区，以及资源不足时的优先级与抢占。';NEXT='存储原理：CSI 与卷的生命周期';MIN=55
SUM=['调度周期：<b>过滤</b>（Filter）排除不满足条件的节点，<b>打分</b>（Score）给剩下的排序，选最高分，然后 <b>绑定</b>（写 nodeName）。没有节点通过过滤 → Pending，事件里写明每类原因的节点数。',
'过滤看 <b>requests</b> 而不是实际用量：节点可分配量减去已有 Pod 的 requests 总和不够，就不能放。',
'<code>nodeSelector</code> / <code>nodeAffinity</code> 是 Pod 主动选节点；<b>污点</b>（taint）是节点拒绝 Pod，只有带对应<b>容忍</b>（toleration）的 Pod 能放上去。专用节点要两者同时用：污点挡住别人，亲和性把自己引过去。',
'<code>required…</code> 是硬条件（参与过滤），<code>preferred…</code> 是软条件（参与打分）。podAntiAffinity 用于“同一应用的副本不要在一起”。',
'<code>topologySpreadConstraints</code> 按 <code>topology.kubernetes.io/zone</code> 等标签控制副本分布的最大偏差（maxSkew），比反亲和更灵活，是跨可用区高可用的推荐方式。',
'PriorityClass：高优先级 Pod 放不下时，调度器可以<b>抢占</b>（驱逐）低优先级 Pod。系统组件用 <code>system-cluster-critical</code>。']
def secs(prac,E):
    return [
('调度周期','一个 Pod 从 Pending 到绑定的过程。','<div id="p1"></div>'),
('优先级与抢占','集群满了，重要的 Pod 怎么办。','<div id="p2"></div>'),
('动手：哪些节点能放','4 个节点，标签、污点和剩余资源各不相同。给 Pod 打开或关闭约束，看过滤结果和最终选择。','<div class="chal"><div class="cmds" id="sc"></div><div id="nodes"></div><div class="msg" id="sm"></div></div>'),
('相关命令','查看调度原因、节点容量和约束。','<div id="t4"></div>'),
('在你的电脑上练习','在 3 节点 kind 集群里实际观察调度决策。',prac([
 ('给两个 worker 打上模拟的可用区标签。','kubectl label node learn-worker topology.kubernetes.io/zone=a\nkubectl label node learn-worker2 topology.kubernetes.io/zone=b\nkubectl get nodes -L topology.kubernetes.io/zone','NAME                  STATUS   ROLES           ZONE\nlearn-control-plane   Ready    control-plane\nlearn-worker          Ready    <none>          a\nlearn-worker2         Ready    <none>          b'),
 ('控制平面节点有污点，普通 Pod 不会放上去。','kubectl describe node learn-control-plane | grep Taints','Taints:             node-role.kubernetes.io/control-plane:NoSchedule'),
 ('requests 太大：Pending，事件写明原因。','kubectl run big --image=nginx:alpine --overrides=\'{"spec":{"containers":[{"name":"big","image":"nginx:alpine","resources":{"requests":{"cpu":"64"}}}]}}\'\nkubectl get events --field-selector involvedObject.name=big -o custom-columns=MSG:.message | tail -1','0/3 nodes are available: 1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: }, 2 Insufficient cpu. preemption: 0/3 nodes are available: 1 Preemption is not helpful for scheduling, 2 No preemption victims found for incoming pod.'),
 ('给 worker2 加污点，新 Pod 全部去 worker。','kubectl delete pod big\nkubectl taint node learn-worker2 dedicated=gpu:NoSchedule\nkubectl create deployment t --image=nginx:alpine --replicas=4\nkubectl get pods -l app=t -o custom-columns=NODE:.spec.nodeName --no-headers | sort | uniq -c','      4 learn-worker'),
 ('拓扑分布约束：去掉污点，副本按可用区均分。','kubectl taint node learn-worker2 dedicated-\nkubectl delete deploy t\nkubectl apply -f - <<EOT\napiVersion: apps/v1\nkind: Deployment\nmetadata: {name: s}\nspec:\n  replicas: 4\n  selector: {matchLabels: {app: s}}\n  template:\n    metadata: {labels: {app: s}}\n    spec:\n      topologySpreadConstraints:\n      - maxSkew: 1\n        topologyKey: topology.kubernetes.io/zone\n        whenUnsatisfiable: DoNotSchedule\n        labelSelector: {matchLabels: {app: s}}\n      containers: [{name: n, image: nginx:alpine}]\nEOT\nkubectl get pods -l app=s -o custom-columns=NODE:.spec.nodeName --no-headers | sort | uniq -c','      2 learn-worker\n      2 learn-worker2')],
 ('专用节点','把 learn-worker2 设成只给 <code>team=ml</code> 的工作负载用：其他 Pod 不能放上去，并且 ml 的 Pod 只能放在它上面。写出节点上的操作和 Pod 模板里需要的字段，并说明只用其中一半会出现什么问题。',
 '<pre class="cmd">kubectl taint node learn-worker2 team=ml:NoSchedule\nkubectl label node learn-worker2 team=ml</pre><pre class="out">spec:\n  tolerations:\n  - {key: team, operator: Equal, value: ml, effect: NoSchedule}\n  affinity:\n    nodeAffinity:\n      requiredDuringSchedulingIgnoredDuringExecution:\n        nodeSelectorTerms:\n        - matchExpressions:\n          - {key: team, operator: In, values: [ml]}</pre><p>只有污点和容忍：别人进不来，但 ml 的 Pod 仍可能被放到普通节点（容忍只是“允许”，不是“要求”）。只有标签和亲和性：ml 的 Pod 会去 worker2，但其他 Pod 也能挤占它。两者一起才是“专用”。另外 NoSchedule 不驱逐已在运行的 Pod；要清走已有的，用 <code>NoExecute</code> 或 <code>kubectl drain</code>。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
