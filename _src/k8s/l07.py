TITLE='存储：PV、PVC 与 StorageClass';DESC='容器的文件系统随 Pod 消失。本课讲 Kubernetes 怎样给 Pod 提供持久存储：卷的种类、PersistentVolume 与 PersistentVolumeClaim 的分工、StorageClass 动态供应、访问模式、回收策略和扩容。';NEXT='Ingress 与 Gateway API';MIN=45
SUM=['emptyDir 随 Pod 生灭，适合临时文件和容器间共享；hostPath 绑死在某个节点，普通应用不要用。',
'<b>PVC</b> 是应用的“申请”（要多大、什么访问模式、哪个 StorageClass）；<b>PV</b> 是实际的存储；两者一对一绑定。',
'StorageClass 让存储<b>动态供应</b>：创建 PVC 时，供应器（CSI 驱动）自动创建云盘或本地卷和对应的 PV。<code>WaitForFirstConsumer</code> 让卷在 Pod 调度后再创建，保证在同一可用区。',
'访问模式：RWO（单节点读写，大多数云盘）、RWOP（单 Pod）、RWX（多节点读写，需要 NFS、CephFS 等）、ROX。',
'回收策略：<code>Delete</code>（动态供应的默认值，删 PVC 就删数据）和 <code>Retain</code>（保留，手动处理）。重要数据用 Retain，并单独备份。',
'Deployment 的多个副本共享同一个 RWO PVC 通常行不通；每个副本需要自己的卷时用 StatefulSet（第 17 课）。']
def secs(prac,E):
    return [
('申请与供应','应用说“我要 10Gi”，谁去准备磁盘？','<div id="p1"></div>'),
('访问模式与回收策略','谁能挂载，删了以后怎样。','<div id="p2"></div>'),
('动手：数据还在吗？','选择卷的类型，再选择一个事件，看数据是否保留。','<div class="chal"><div class="cmds" id="vt"></div><div class="cmds" id="evs"></div><div class="msg" id="vm"></div></div>'),
('相关命令','查看、绑定、扩容、排查。','<div id="t4"></div>'),
('在你的电脑上练习','kind 自带一个 local-path 的 StorageClass，可以体验动态供应。',prac([
 ('查看默认 StorageClass。','kubectl get storageclass','NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION\nstandard (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   false'),
 ('创建 PVC。注意它处于 Pending：WaitForFirstConsumer。','kubectl apply -f - <<\'EOF\'\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata: { name: data }\nspec:\n  accessModes: [ReadWriteOnce]\n  resources: { requests: { storage: 1Gi } }\nEOF\nkubectl get pvc data','NAME   STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE\ndata   Pending                                      standard       2s'),
 ('一个使用它的 Pod，写入数据。','kubectl run writer --image=busybox --overrides=\'{"spec":{"volumes":[{"name":"d","persistentVolumeClaim":{"claimName":"data"}}],"containers":[{"name":"w","image":"busybox","command":["sh","-c","echo hello > /d/f; sleep 3600"],"volumeMounts":[{"name":"d","mountPath":"/d"}]}]}}\'\nkubectl wait --for=condition=Ready pod/writer\nkubectl get pvc data; kubectl get pv','data   Bound    pvc-3f1e…   1Gi   RWO   standard   40s\nNAME        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM\npvc-3f1e…   1Gi        RWO            Delete           Bound    default/data'),
 ('删除 Pod，新 Pod 挂同一个 PVC，数据还在。','kubectl delete pod writer\nkubectl run reader --rm -it --restart=Never --image=busybox --overrides=\'{"spec":{"volumes":[{"name":"d","persistentVolumeClaim":{"claimName":"data"}}],"containers":[{"name":"r","image":"busybox","command":["cat","/d/f"],"volumeMounts":[{"name":"d","mountPath":"/d"}]}]}}\'','hello'),
 ('PV 实际在节点的哪里？','kubectl get pv -o jsonpath="{.items[0].spec.hostPath.path}{\'\\n\'}{.items[0].spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0]}"','/var/local-path-provisioner/pvc-3f1e…_default_data\nlearn-worker2'),
 ('删除 PVC：回收策略是 Delete，PV 和数据都没了。','kubectl delete pvc data; sleep 5; kubectl get pv','No resources found')],
 ('保住数据','创建一个 <code>reclaimPolicy: Retain</code> 的 StorageClass <code>keep</code>（供应器同样是 <code>rancher.io/local-path</code>，绑定模式 WaitForFirstConsumer），用它申请 PVC 并写入数据。删除 PVC 后，让一个<b>新的</b> PVC 重新绑定到这个旧 PV，读出原来的数据。',
 '<pre class="cmd">kubectl apply -f - <<\'EOF\'\napiVersion: storage.k8s.io/v1\nkind: StorageClass\nmetadata: { name: keep }\nprovisioner: rancher.io/local-path\nreclaimPolicy: Retain\nvolumeBindingMode: WaitForFirstConsumer\nEOF\n# 用 storageClassName: keep 创建 PVC data，按练习第 3 步写入 hello\nkubectl delete pod writer; kubectl delete pvc data\nPV=$(kubectl get pv -o jsonpath="{.items[?(@.spec.storageClassName==\'keep\')].metadata.name}")\nkubectl get pv $PV               # STATUS: Released\nkubectl patch pv $PV -p \'{"spec":{"claimRef":null}}\'   # 变回 Available\n# 新 PVC，指定 volumeName 绑定到这个 PV\nkubectl apply -f - <<EOF\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata: { name: data2 }\nspec:\n  storageClassName: keep\n  volumeName: $PV\n  accessModes: [ReadWriteOnce]\n  resources: { requests: { storage: 1Gi } }\nEOF\n# 按练习第 4 步用 claimName: data2 读取</pre><pre class="out">pvc-8a2c…   1Gi   RWO   Retain   Released   default/data   keep\npersistentvolume/pvc-8a2c… patched\nhello</pre><p>Retain 让 PV 在 PVC 删除后进入 Released 状态，数据保留。它仍记着旧的 claimRef，所以要清掉才能被重新绑定；<code>volumeName</code> 让新 PVC 精确地绑到这个 PV。生产中，重要数据还要有独立于集群的备份（第 26 课 Velero）。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
