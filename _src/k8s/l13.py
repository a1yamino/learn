TITLE='kubelet、CRI 与 Pod 的一生';DESC='调度器只写了一个节点名，之后的一切都由节点上的 kubelet 完成。本课追踪 kubelet 如何通过 CRI 让 containerd 创建沙箱和容器、如何调用 CNI 配置网络、挂载卷、执行探针，以及 Pod 被删除时的终止过程。';NEXT='集群网络：CNI、kube-proxy 与 DNS';MIN=50
SUM=['kubelet 是节点代理：watch 分配给本节点的 Pod，不断让节点上的实际状态（容器、卷、网络）符合 Pod spec，并把状态写回。它也是一个控制循环。',
'CRI（容器运行时接口）是 kubelet 和运行时之间的 gRPC 接口。Kubernetes 1.24 起移除了 dockershim，常用运行时是 containerd 和 CRI-O，底层仍是 runc（Docker 第 14 课）。',
'创建顺序：挂载卷 → <code>RunPodSandbox</code>（pause 容器 + 调用 <b>CNI</b> 分配 IP）→ 拉镜像 → init 容器依次运行 → 创建并启动应用容器 → 探针。',
'每一步失败都对应一种状态：卷挂不上 → ContainerCreating；镜像拉不下 → ErrImagePull / ImagePullBackOff；配置引用缺失 → CreateContainerConfigError；启动后退出 → CrashLoopBackOff。',
'终止：标记删除 → 从端点摘除 &amp; preStop → SIGTERM → 等待 grace period → SIGKILL → 清理沙箱和网络。',
'kubelet 还负责：节点资源压力时驱逐 Pod、镜像和容器的垃圾回收、运行静态 Pod、为容器配置 cgroup。']
def secs(prac,E):
    return [
('从 nodeName 到运行中','kubelet 一步步做了什么。','<div id="p1"></div>'),
('终止的顺序','删除一个 Pod 时，哪些事按什么顺序发生。','<div id="p2"></div>'),
('动手：哪一步出了问题','根据 Pod 的状态和事件，判断 kubelet 卡在哪一步，以及该查什么。','<div class="chal"><div id="cases"></div><div class="msg" id="km"></div></div>'),
('相关命令','从节点上直接看运行时。','<div id="t4"></div>'),
('在你的电脑上练习','kind 节点里有 containerd 和 crictl，可以直接观察 CRI 层。',prac([
 ('节点上的运行时和 kubelet 版本。','kubectl get nodes -o custom-columns=NAME:.metadata.name,RUNTIME:.status.nodeInfo.containerRuntimeVersion,KUBELET:.status.nodeInfo.kubeletVersion','NAME                  RUNTIME                  KUBELET\nlearn-control-plane   containerd://1.7.18      v1.31.0\nlearn-worker          containerd://1.7.18      v1.31.0'),
 ('创建一个 Pod，找到它所在的节点。','kubectl run life --image=nginx:alpine\nkubectl wait --for=condition=Ready pod/life\nN=$(kubectl get pod life -o jsonpath="{.spec.nodeName}"); echo $N','learn-worker'),
 ('在节点上用 crictl 看沙箱（pause）和容器。','docker exec $N crictl pods --name life\ndocker exec $N crictl ps --name life','POD ID         CREATED     STATE   NAME   NAMESPACE   ATTEMPT   RUNTIME\n5a1c…          20s ago     Ready   life   default     0         (default)\nCONTAINER      IMAGE       CREATED   STATE     NAME   ATTEMPT   POD ID\n9e2f…          a5d7…       19s ago   Running   life   0         5a1c…'),
 ('沙箱的网络命名空间和 IP。','S=$(docker exec $N crictl pods --name life -q)\ndocker exec $N crictl inspectp $S | grep -E \'"ip"|netns\' | head -2','        "ip": "10.244.1.12",\n          "path": "/var/run/netns/cni-7d1e…"'),
 ('kubelet 的日志：对这个 Pod 做了什么。','docker exec $N journalctl -u kubelet --no-pager | grep life | tail -3','"SyncLoop ADD" source="api" pods=["default/life"]\n"RunPodSandbox from runtime service succeeded" podSandboxID="5a1c…"\n"Container started" pod="default/life" containerName="life"'),
 ('删除，观察终止事件。','kubectl delete pod life && kubectl get events --field-selector involvedObject.name=life --sort-by=.lastTimestamp -o custom-columns=REASON:.reason | tail -4','REASON\nPulled\nCreated\nStarted\nKilling')],
 ('静态 Pod','在一个 worker 节点的 <code>/etc/kubernetes/manifests/</code> 下放一个 nginx Pod 的 YAML（kind 的 worker 节点已配置该路径）。在 API Server 里能看到它吗？名字是什么？用 kubectl 删除它会发生什么？删除文件又会怎样？',
 '<pre class="cmd">kubectl run static-web --image=nginx:alpine --dry-run=client -o yaml | docker exec -i learn-worker tee /etc/kubernetes/manifests/static-web.yaml &gt;/dev/null\nsleep 15; kubectl get pods -o wide | grep static\nkubectl delete pod static-web-learn-worker; sleep 5; kubectl get pods | grep static\ndocker exec learn-worker rm /etc/kubernetes/manifests/static-web.yaml; sleep 15; kubectl get pods | grep static</pre><pre class="out">static-web-learn-worker   1/1   Running   0   12s   learn-worker\nstatic-web-learn-worker   1/1   Running   0   3s\n（无输出）</pre><p>kubelet 直接读取文件运行 Pod，不经过 API Server 和调度器。为了让人能看到，它在 API Server 里创建一个只读的“镜像 Pod”，名字加上节点名后缀。用 kubectl 删除的只是镜像，kubelet 马上重建；只有删除文件才能真正停掉它。控制平面组件就是这样自举的：API Server 自己也是一个静态 Pod。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
