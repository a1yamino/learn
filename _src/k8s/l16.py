TITLE='存储原理：CSI 与卷的生命周期';DESC='第 7 课从使用者角度讲了 PVC。本课看下面发生了什么：CSI 驱动的组成、动态供应、Attach / Mount 的分工、WaitForFirstConsumer 为什么重要，以及卷扩容和快照。';NEXT='有状态与批处理：StatefulSet、DaemonSet、Job、CronJob';MIN=50
SUM=['CSI（Container Storage Interface）是存储厂商实现的 gRPC 接口。驱动分两部分：<b>controller</b>（Deployment，负责创建/删除/挂接云盘）和 <b>node</b>（DaemonSet，负责在节点上格式化和挂载）。',
'Kubernetes 社区提供的 sidecar 把 API 对象翻译成 CSI 调用：external-provisioner（PVC → CreateVolume）、external-attacher（VolumeAttachment → ControllerPublish）、external-resizer、external-snapshotter。',
'一块卷的生命周期：<b>Provision</b> 创建磁盘并生成 PV → <b>Attach</b> 把磁盘挂到节点（块设备出现）→ <b>Stage</b> 在节点上格式化并挂载到全局目录 → <b>Publish</b> bind mount 到 Pod 目录。删除时倒序。',
'<code>volumeBindingMode: WaitForFirstConsumer</code>：等 Pod 调度后，在 Pod 所在的可用区创建磁盘。用 <code>Immediate</code> 时磁盘可能建在别的可用区，Pod 永远调度不上去。',
'扩容：StorageClass 设 <code>allowVolumeExpansion: true</code> 后修改 PVC 的 requests；只能变大。快照：VolumeSnapshot / VolumeSnapshotClass，可以从快照创建新 PVC（dataSource）。',
'local PV 和 hostPath 没有 attach，数据绑定在一个节点上；节点坏了数据就不可用。']
def secs(prac,E):
    return [
('CSI 的组成','谁在监听什么，调用什么。','<div id="p1"></div>'),
('从 PVC 到容器里的目录','一块云盘的四个阶段。','<div id="p2"></div>'),
('动手：绑定模式与可用区','集群有可用区 a、b 两个节点，a 节点资源已满，Pod 只能调度到 b。选择 StorageClass 的绑定模式，看会发生什么。','<div class="chal"><div class="cmds" id="bm"></div><div class="log" id="bl" style="height:auto;min-height:120px"></div><div class="msg" id="bmm"></div></div>'),
('相关命令','从 API 对象和节点两个层面看卷。','<div id="t4"></div>'),
('在你的电脑上练习','kind 自带的 local-path-provisioner 不是 CSI 驱动，但同样走动态供应和 WaitForFirstConsumer，适合观察流程。',prac([
 ('默认 StorageClass 的绑定模式。','kubectl get storageclass','NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION\nstandard (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   false'),
 ('只创建 PVC：保持 Pending，等待使用者。','kubectl apply -f - <<EOT\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata: {name: data}\nspec:\n  accessModes: [ReadWriteOnce]\n  resources: {requests: {storage: 1Gi}}\nEOT\nkubectl describe pvc data | tail -1','  Normal  WaitForFirstConsumer  3s    persistentvolume-controller  waiting for first consumer to be created before binding'),
 ('创建 Pod 后，调度器先选节点，provisioner 在该节点上创建卷。','kubectl run u --image=busybox --overrides=\'{"spec":{"containers":[{"name":"u","image":"busybox","command":["sleep","3600"],"volumeMounts":[{"name":"d","mountPath":"/data"}]}],"volumes":[{"name":"d","persistentVolumeClaim":{"claimName":"data"}}]}}\'\nkubectl wait --for=condition=Ready pod/u\nkubectl get pv -o custom-columns=PV:.metadata.name,NODE:.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0]','PV                                         NODE\npvc-6b1d2a8e-4c1f-4a8e-9a77-0f3c2d1e5b90   learn-worker'),
 ('卷在节点上的真实位置，以及 PV 的节点亲和性（Pod 以后只能调度到这个节点）。','kubectl exec u -- sh -c "echo hi > /data/f"\ndocker exec learn-worker ls /var/local-path-provisioner/','pvc-6b1d2a8e-4c1f-4a8e-9a77-0f3c2d1e5b90_default_data'),
 ('删除 PVC，回收策略 Delete 会把目录一起删掉。','kubectl delete pod u --now; kubectl delete pvc data\nsleep 5; docker exec learn-worker ls /var/local-path-provisioner/ | wc -l','0')],
 ('节点坏了，数据卷怎么办','上面的 Pod 用的是 local-path 卷。假设 learn-worker 永久损坏，Pod 被删除后重建会怎样？如果换成云盘（如 EBS 的 CSI 驱动，RWO），重建的 Pod 又会经历什么？各自需要什么人工处理？',
 '<pre class="cmd">kubectl describe pod u   # 重建后</pre><pre class="out">Warning  FailedScheduling  0/3 nodes are available: 1 node(s) had volume node affinity conflict, …</pre><p>local-path：PV 带节点亲和性，绑死在 learn-worker 上。节点没了，Pod 一直 Pending，数据随节点丢失；只能删 PVC 重新建（空卷）并从备份恢复。所以本地卷只适合自带复制的系统（如数据库副本、Kafka）。</p><p>云盘：数据在网络存储上，可以挂到同可用区的其他节点。但旧节点失联时 VolumeAttachment 还在，新 Pod 会报 <code>Multi-Attach error</code>，约 6 分钟后 attach-detach 控制器强制解除挂载才能继续；确认旧节点已关机时，可给节点加 <code>node.kubernetes.io/out-of-service</code> 污点立即释放。云盘只在一个可用区内，可用区整体故障时仍需要快照或跨区复制。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
