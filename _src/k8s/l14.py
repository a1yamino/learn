TITLE='集群网络：CNI、kube-proxy 与 DNS';DESC='Kubernetes 只规定网络模型，具体由插件实现。本课讲每个 Pod 一个 IP 的模型、CNI 插件如何连接 Pod 和跨节点路由、kube-proxy 如何把 ClusterIP 变成真实的 Pod 地址，以及集群 DNS 的解析过程和 ndots 的坑。';NEXT='调度深入：亲和性、污点、拓扑分布、优先级';MIN=55
SUM=['网络模型：每个 Pod 一个集群内唯一的 IP；所有 Pod 之间<b>不经 NAT</b> 直接互通；节点和 Pod 之间也互通。',
'CNI 插件（kindnet、Calico、Cilium、Flannel、云厂商插件）在 Pod 创建时被调用：建 veth 对、分配 IP、设置路由。跨节点用路由（BGP、云路由表）或封装（VXLAN、Geneve）。',
'ClusterIP 不在任何网卡上。kube-proxy 在每个节点写入 iptables / nftables（或 IPVS）规则：发往 ClusterIP:port 的包被 <b>DNAT</b> 到某个端点 Pod。Cilium 等可用 eBPF 完全替代 kube-proxy。',
'CoreDNS 是集群 DNS，本身也是一个 Deployment + Service（10.96.0.10）。Pod 的 resolv.conf 指向它。',
'<code>ndots:5</code>：名字里少于 5 个点就先依次尝试 search 域。查 <code>api.example.com</code> 会先产生 3 次无用查询。高频访问外部域名时用完整域名加尾点（<code>api.example.com.</code>）或调低 ndots。',
'NetworkPolicy 也由 CNI 插件执行；不支持它的插件（如 Flannel）会静默忽略策略（第 21 课）。']
def secs(prac,E):
    return [
('Pod 网络：同节点与跨节点','包是怎么从一个 Pod 到另一个 Pod 的。','<div id="p1"></div>'),
('ClusterIP 背后：DNAT','访问一个不存在于任何网卡上的 IP。','<div id="p2"></div>'),
('动手：DNS 查询过程','Pod 在 <code>shop</code> 命名空间，resolv.conf 为 <code>search shop.svc.cluster.local svc.cluster.local cluster.local</code>、<code>ndots:5</code>。选择要解析的名字，看实际发出了哪些查询。','<div class="chal"><div class="cmds" id="dn"></div><div class="log" id="dq" style="height:auto;min-height:100px"></div><div class="msg" id="dm"></div></div>'),
('相关命令','从 Pod、节点和规则三个层面看网络。','<div id="t4"></div>'),
('在你的电脑上练习','在 kind 集群里追踪真实的网络配置。kind 默认的 CNI 是 kindnet（基于路由）。',prac([
 ('每个节点分到一段 Pod 网段。','kubectl get nodes -o custom-columns=NAME:.metadata.name,PODCIDR:.spec.podCIDR,IP:.status.addresses[0].address','NAME                  PODCIDR         IP\nlearn-control-plane   10.244.0.0/24   172.18.0.2\nlearn-worker          10.244.1.0/24   172.18.0.3\nlearn-worker2         10.244.2.0/24   172.18.0.4'),
 ('节点的路由表：去往其他节点的 Pod 网段，下一跳是那个节点。','docker exec learn-worker ip route | grep 10.244','10.244.0.0/24 via 172.18.0.2 dev eth0\n10.244.1.2 dev veth3a9c1f2e scope host\n10.244.2.0/24 via 172.18.0.4 dev eth0'),
 ('跨节点 Pod 直接互通，看到的源 IP 就是对方 Pod 的 IP（没有 NAT）。','kubectl run a --image=nginx:alpine --overrides=\'{"spec":{"nodeName":"learn-worker"}}\'\nkubectl run b --image=busybox --overrides=\'{"spec":{"nodeName":"learn-worker2"}}\' -- sleep 3600\nkubectl wait --for=condition=Ready pod/a pod/b\nkubectl exec b -- wget -qO- $(kubectl get pod a -o jsonpath="{.status.podIP}") &gt;/dev/null\nkubectl logs a | tail -1 | cut -d" " -f1; kubectl get pod b -o jsonpath="{.status.podIP}"','10.244.2.7\n10.244.2.7'),
 ('ClusterIP 的 iptables 规则。','kubectl expose pod a --port 80\nIP=$(kubectl get svc a -o jsonpath="{.spec.clusterIP}")\ndocker exec learn-worker iptables -t nat -S KUBE-SERVICES | grep $IP','-A KUBE-SERVICES -d 10.96.88.14/32 -p tcp -m comment --comment "default/a cluster IP" -m tcp --dport 80 -j KUBE-SVC-…'),
 ('顺着链找到 DNAT 目标：就是 Pod a 的 IP。','C=$(docker exec learn-worker iptables -t nat -S KUBE-SERVICES | grep $IP | grep -o "KUBE-SVC-[A-Z0-9]*")\nE=$(docker exec learn-worker iptables -t nat -S $C | grep -o "KUBE-SEP-[A-Z0-9]*" | head -1)\ndocker exec learn-worker iptables -t nat -S $E | grep DNAT','-A KUBE-SEP-… -p tcp -m comment --comment "default/a" -m tcp -j DNAT --to-destination 10.244.1.9:80'),
 ('ndots 的效果：外部域名先尝试 search 域。','kubectl exec b -- sh -c "nslookup -debug example.com 2>&1 | grep -E \'QUESTIONS|example\' | head -4" ','    example.com.default.svc.cluster.local, type = A, class = IN\n    example.com.svc.cluster.local, type = A, class = IN\n    example.com.cluster.local, type = A, class = IN\n    example.com, type = A, class = IN')],
 ('多副本时的负载均衡规则','把 Service a 背后的 Pod 变成 3 个（创建一个 <code>app=a</code> 的 Deployment 并让 Service 选择它）。查看 iptables 的 KUBE-SVC 链：kube-proxy 用什么规则在 3 个端点间分配？概率分别是多少，为什么最终是均匀的？',
 '<pre class="cmd">kubectl create deployment a3 --image=nginx:alpine --replicas=3\nkubectl expose deployment a3 --port 80\nIP=$(kubectl get svc a3 -o jsonpath="{.spec.clusterIP}")\nC=$(docker exec learn-worker iptables -t nat -S KUBE-SERVICES | grep $IP | grep -o "KUBE-SVC-[A-Z0-9]*")\ndocker exec learn-worker iptables -t nat -S $C | grep KUBE-SEP</pre><pre class="out">-A KUBE-SVC-… -m statistic --mode random --probability 0.33333333349 -j KUBE-SEP-AAA\n-A KUBE-SVC-… -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-BBB\n-A KUBE-SVC-… -j KUBE-SEP-CCC</pre><p>规则从上到下匹配：第一条以 1/3 概率命中；没命中的（2/3）进入第二条，以 1/2 命中，即总体 2/3 × 1/2 = 1/3；剩下的 1/3 落到最后一条。每个端点各 1/3。这是<b>按连接</b>随机，不是按请求：HTTP/2、gRPC 的长连接会一直粘在同一个 Pod 上，需要客户端负载均衡或服务网格。端点很多时 iptables 规则线性增长，大集群改用 IPVS、nftables 模式或 eBPF。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
