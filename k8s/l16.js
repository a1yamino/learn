const S=(t,s,c='',w=150)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{api:S('API Server','PVC / PV / VolumeAttachment','',200),cf:{w:330,h:140,cls:'frame',html:'<i>CSI controller（Deployment）</i>'},pv:S('external-provisioner','PVC → CreateVolume','',150),at:S('external-attacher','VA → ControllerPublish','',150),nf:{w:330,h:140,cls:'frame',html:'<i>CSI node（每个节点，DaemonSet）</i>'},kl:S('kubelet','','',130),dr:S('驱动 node 插件','NodeStage / Publish','',160),cloud:S('云存储 API','创建、挂接磁盘','',150),n:{w:700,cls:'tag'}},scenes:[
 {t:'两部分',p:'CSI 驱动由厂商实现。controller 部分负责集群级操作（建盘、挂到哪台机器），node 部分在每个节点上处理设备和挂载。',set:{api:[260,0],cf:[0,90],nf:[380,90]}},
 {t:'controller 侧',p:'社区 sidecar watch API 对象，把它们翻译成 gRPC 调用发给同 Pod 里的驱动容器；驱动再调用云厂商 API。',d:4000,set:{api:[260,0],cf:[0,90],pv:[10,120,{cls:'blk sig'}],at:[170,120,{cls:'blk sig'}],nf:[380,90],cloud:[90,260]}},
 {t:'node 侧',p:'kubelet 通过本地 unix socket 直接调用节点上的驱动：格式化、挂载、bind mount 进 Pod 目录。',d:3600,set:{api:[260,0],cf:[0,90],pv:[10,120],at:[170,120],nf:[380,90],kl:[390,120,{cls:'blk sig'}],dr:[540,120,{cls:'blk sig'}],cloud:[90,260]}}]});
const ST=[['pr','Provision','CreateVolume → 生成 PV'],['at','Attach','磁盘挂到节点 /dev/xvdf'],['sg','Stage','mkfs + mount 到全局目录'],['pb','Publish','bind mount 到 Pod 目录']];
const e2={c:S('容器','/data','',120),n:{w:700,cls:'tag'}};ST.forEach(([k,t,s])=>e2[k]=S(t,s,'',165));const pos=i=>[i*175,20];
const s2=n=>{const o={};ST.forEach(([k],i)=>o[k]=[pos(i)[0],pos(i)[1],{cls:i<n?'blk sig':'blk mute'}]);return o};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'Provision',p:'PVC 出现（WaitForFirstConsumer 时要等 Pod 调度完），external-provisioner 调 CreateVolume，在节点所在可用区建盘，创建 PV 并绑定。',d:4000,set:s2(1)},
 {t:'Attach',p:'attach-detach 控制器创建 VolumeAttachment；external-attacher 调 ControllerPublishVolume，云盘挂到这台机器上，出现块设备。NFS 这类网络文件系统没有这一步。',d:4200,set:s2(2)},
 {t:'Stage',p:'kubelet 调 NodeStageVolume：首次使用时格式化，挂载到节点上一个全局目录。同一节点多个 Pod 共用这一次挂载。',d:3800,set:s2(3)},
 {t:'Publish',p:'NodePublishVolume 把全局目录 bind mount 到 <code>/var/lib/kubelet/pods/&lt;uid&gt;/volumes/…</code>，容器启动时再挂到 /data。删除时倒序：Unpublish → Unstage → Detach → （回收策略为 Delete 时）DeleteVolume。',d:4600,set:{...s2(4),c:[525,110,{cls:'blk ok'}]}}]});
(()=>{const M={Immediate:['创建 PVC','  provisioner 立即 CreateVolume：调度信息未知，随机选了 zone a','  PV pvc-91… 已创建，nodeAffinity: zone=a，PVC Bound','创建 Pod','  调度器过滤：PV 要求 zone=a；zone a 节点 CPU 不足','  zone b 节点：volume node affinity conflict','  Pod 一直 Pending'],WaitForFirstConsumer:['创建 PVC','  PVC Pending：waiting for first consumer','创建 Pod','  调度器把卷拓扑一起考虑，选中 zone b 的节点（选定节点写到 PVC 注解）','  provisioner 在 zone b CreateVolume','  PV 绑定，attach → stage → publish','  Pod Running']};
 const bm=document.getElementById('bm'),bl=document.getElementById('bl'),mm=document.getElementById('bmm');
 Object.keys(M).forEach(k=>{const b=document.createElement('button');b.className='btn';b.dataset.v=k;b.textContent=k;b.addEventListener('click',()=>run(k));bm.appendChild(b)});
 function run(k){bm.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===k));bl.innerHTML='';const L=M[k];let i=0;mm.className='msg';mm.innerHTML='';
  const tick=()=>{if(i<L.length){bl.insertAdjacentHTML('beforeend',`<div${L[i].startsWith('  ')?' style="opacity:.8"':' style="font-weight:600"'}>${L[i].startsWith('  ')?'&nbsp;&nbsp;'+L[i].trim():'$ '+L[i]}</div>`);i++;setTimeout(tick,320)}else{const ok=k!=='Immediate';mm.className='msg '+(ok?'ok':'bad');mm.innerHTML=ok?'卷跟着 Pod 走：先选节点，再在那个可用区建盘。多可用区集群里使用块存储，StorageClass 都应使用这个模式。':'卷先建好就把 Pod 锁死在 zone a。云盘不能跨可用区挂载，只能删掉 PVC 重建，或者给 zone a 扩容。'}};tick()}
 run('Immediate')})();
Term(document.getElementById('t4'),[
['kubectl get csidrivers','NAME              ATTACHREQUIRED   PODINFOONMOUNT   MODES\nebs.csi.aws.com   true             false            Persistent','集群里注册的 CSI 驱动。ATTACHREQUIRED=false 的驱动（如 NFS）跳过 Attach。'],
['kubectl get volumeattachments','NAME          ATTACHER          PV            NODE           ATTACHED\ncsi-3a1f…     ebs.csi.aws.com   pvc-91c2…     ip-10-0-1-12   true','哪块盘挂在哪个节点上。排查 Multi-Attach 时先看这里。'],
['kubectl get csinode ip-10-0-1-12 -o jsonpath="{.spec.drivers[0].allocatable.count}"','25','节点能挂的卷数上限（云厂商限制）。调度器会考虑它。'],
['kubectl patch pvc data -p \'{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}\'\nkubectl get pvc data -o jsonpath="{.status.capacity.storage}"','persistentvolumeclaim/data patched\n20Gi','在线扩容（StorageClass 需 allowVolumeExpansion: true）。不能缩小。'],
['kubectl apply -f snap.yaml && kubectl get volumesnapshot','NAME     READYTOUSE   SOURCEPVC   RESTORESIZE\nsnap-1   true         data        20Gi','快照需要安装 snapshot CRD 和控制器。新 PVC 用 <code>dataSource: {kind: VolumeSnapshot, name: snap-1}</code> 从快照恢复。'],
['kubectl get pv pvc-91c2… -o jsonpath="{.spec.persistentVolumeReclaimPolicy}"\nkubectl patch pv pvc-91c2… -p \'{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}\'','Delete\npersistentvolume/pvc-91c2… patched','重要数据改为 Retain：删除 PVC 后磁盘保留。']]);
Quiz(document.getElementById('qs'),[
['哪个组件把 PVC 翻译成 CreateVolume 调用？',['kubelet','external-provisioner','kube-scheduler'],1,'controller 侧的 sidecar。'],
['同一节点上两个 Pod 使用同一个 RWX 卷，格式化/全局挂载发生几次？',['每个 Pod 一次','每个节点一次（Stage）','每次容器重启一次'],1,'Publish 才是每个 Pod 一次。'],
['多可用区集群的块存储 StorageClass 应设？',['Immediate','WaitForFirstConsumer','Retain'],1,'先调度再建盘。'],
['把 PVC 从 20Gi 改成 10Gi？',['在线缩容','被拒绝','自动迁移数据'],1,'只能扩容。']]);
