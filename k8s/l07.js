const S=(t,s,c='',w=160)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
Player(document.getElementById('p1'),{els:{pod:S('Pod','claimName: data'),pvc:S('PVC data','1Gi · RWO · standard'),sc:S('StorageClass','standard · local-path'),pv:S('PV pvc-3f1e…','1Gi · 节点 worker2'),disk:S('实际存储','云盘 / 本地目录','dim'),st:P('Pending','mute'),n:{w:640,cls:'tag'}},scenes:[
 {t:'应用提出申请',p:'应用创建 PVC：要多大、什么访问模式、哪个 StorageClass。它不关心存储具体在哪里。',set:{pvc:[0,80],st:[0,40]}},
 {t:'等待第一个使用者',p:'<code>WaitForFirstConsumer</code>：PVC 先 Pending。等 Pod 被调度到某个节点（或某个可用区），再在那里创建卷，避免卷和 Pod 不在一起。',d:4000,set:{pvc:[0,80],st:[0,40],pod:[0,180],sc:[230,80]}},
 {t:'动态供应',p:'供应器（CSI 驱动）根据 StorageClass 的参数创建实际的存储，并创建对应的 PV 对象。',d:3600,set:{pvc:[0,80],pod:[0,180],sc:[230,80,{cls:'blk sig'}],pv:[460,80],disk:[460,180]}},
 {t:'绑定',p:'PV 和 PVC 一对一绑定（Bound）。Pod 通过 PVC 使用它；Pod 被删除重建，只要还用这个 PVC，数据就在。',d:3600,set:{pvc:[0,80,{cls:'blk sig'}],pod:[0,180],sc:[230,80],pv:[460,80,{cls:'blk sig'}],disk:[460,180,{cls:'blk'}],st:[0,40,{cls:'pill ok',html:'Bound'}],n:[0,260,{html:'Pod → PVC → PV → 存储'}]}}]});
Player(document.getElementById('p2'),{els:{n1:{w:200,h:120,cls:'frame',html:'<i>节点 1</i>'},n2:{w:200,h:120,cls:'frame',html:'<i>节点 2</i>'},d:S('卷','','',120),a:P('Pod A'),b:P('Pod B'),x:P('无法挂载','bad'),rd:P('Delete：PV 和磁盘一起删除','bad'),rr:P('Retain：PV 变成 Released，数据保留','ok'),n:{w:640,cls:'tag'}},scenes:[
 {t:'RWO',p:'ReadWriteOnce：同一时间只能被<b>一个节点</b>挂载读写。同一节点上的多个 Pod 可以共用。大多数云盘（EBS、PD）是 RWO。',d:3800,set:{n1:[0,0],n2:[260,0],a:[20,40],b:[280,40],d:[40,160],x:[280,80]}},
 {t:'RWX',p:'ReadWriteMany：多个节点同时读写。需要网络文件系统（NFS、CephFS、云厂商的文件存储）。RWOP 则限定只有一个 Pod。',d:3600,set:{n1:[0,0],n2:[260,0],a:[20,40],b:[280,40],d:[150,160,{cls:'blk sig',html:'NFS 卷<br><span style="font-size:11px;opacity:.7">RWX</span>'}]}},
 {t:'删除 PVC 之后',p:'回收策略决定 PV 的命运。动态供应默认 <code>Delete</code>：删除 PVC = 删除数据。',set:{d:[0,0],rd:[0,80]}},
 {t:'Retain',p:'<code>Retain</code>：PV 保留，需要管理员手动清理或重新绑定。数据库等重要数据用 Retain 的 StorageClass。',set:{d:[0,0],rd:[0,80],rr:[0,130]}}]});
(()=>{const T=[['ed','emptyDir'],['hp','hostPath'],['pd','PVC（Delete）'],['pr','PVC（Retain）']];const E=[['cr','容器崩溃重启'],['pd','Pod 被删除并重建'],['mv','Pod 被调度到另一个节点'],['pvc','删除 PVC']];let t='ed',e='cr';
 const R={ed:{cr:[1,'emptyDir 属于 Pod，容器重启不影响。'],pd:[0,'Pod 删除，emptyDir 随之删除。'],mv:[0,'新 Pod 是全新的 emptyDir。'],pvc:[null,'emptyDir 不涉及 PVC。']},
  hp:{cr:[1,'目录在节点上。'],pd:[1,'只要新 Pod 还在<b>同一个节点</b>，就能看到。'],mv:[0,'新节点上的同一路径是另一个目录，数据看不到。而且 hostPath 能访问节点文件系统，安全风险大。'],pvc:[null,'hostPath 不涉及 PVC。']},
  pd:{cr:[1,'卷不受影响。'],pd:[1,'新 Pod 挂载同一个 PVC，数据还在。'],mv:[1,'网络存储会跟着挂到新节点（RWO 先从旧节点卸载）。本地卷（local-path）则会让 Pod 只能调度回原节点。'],pvc:[0,'回收策略 Delete：PV 和底层存储被删除。']},
  pr:{cr:[1,'卷不受影响。'],pd:[1,'数据还在。'],mv:[1,'同上。'],pvc:[1,'回收策略 Retain：PV 进入 Released，数据保留，需要手动重新绑定（见挑战）。']}};
 const vt=document.getElementById('vt'),ev=document.getElementById('evs'),vm=document.getElementById('vm');
 const mk=(el,lab,L,set)=>{el.innerHTML=`<span style="font:500 13px var(--m);margin-right:6px">${lab}</span>`;L.forEach(([v,l])=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.dataset.v=v;b.addEventListener('click',()=>{set(v);draw()});el.appendChild(b)})};
 mk(vt,'卷：',T,v=>t=v);mk(ev,'事件：',E,v=>e=v);
 function draw(){vt.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===t));ev.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.v===e));
  const [k,why]=R[t][e];vm.className='msg '+(k===1?'ok':k===0?'bad':'');vm.innerHTML=(k===1?'<b>数据还在。</b>':k===0?'<b>数据没了。</b>':'')+why}draw()})();
Term(document.getElementById('t4'),[
['kubectl get pvc,pv','NAME                         STATUS   VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS\npersistentvolumeclaim/data   Bound    pvc-3f1e…   1Gi        RWO            standard\n\nNAME                         CAPACITY   RECLAIM POLICY   STATUS   CLAIM\npersistentvolume/pvc-3f1e…   1Gi        Delete           Bound    default/data','PVC 属于命名空间，PV 是集群级别的。'],
['kubectl describe pvc data','Status:        Pending\nEvents:\n  Normal  WaitForFirstConsumer  persistentvolume-controller  waiting for first consumer to be created before binding','Pending 时看 Events。另一个常见原因：没有默认 StorageClass，或 StorageClass 名字写错。'],
['kubectl patch pvc data -p \'{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}\'','persistentvolumeclaim/data patched','扩容：StorageClass 需要 <code>allowVolumeExpansion: true</code>。只能扩，不能缩。'],
['kubectl get storageclass gp3 -o yaml','provisioner: ebs.csi.aws.com\nparameters:\n  type: gp3\n  iops: "3000"\nreclaimPolicy: Retain\nvolumeBindingMode: WaitForFirstConsumer\nallowVolumeExpansion: true','一个云上的 StorageClass 示例：参数传给 CSI 驱动。'],
['kubectl get pod writer -o jsonpath="{.spec.volumes}"','[{"name":"d","persistentVolumeClaim":{"claimName":"data"}}]','Pod 只引用 PVC 名字，和具体的存储解耦。同一份 YAML 在不同云上都能用。'],
['kubectl get volumeattachments','NAME          ATTACHER          PV          NODE           ATTACHED\ncsi-8b2f…     ebs.csi.aws.com   pvc-3f1e…   ip-10-0-1-23   true','云盘挂载到了哪个节点。Pod 卡在 ContainerCreating 且报 Multi-Attach 错误时查这里（第 16 课）。']]);
Quiz(document.getElementById('qs'),[
['PVC 和 PV 的关系是？',['PVC 是申请，PV 是实际存储，一对一绑定','它们是同一个东西','PV 属于命名空间'],0,'PVC 在命名空间里，PV 是集群级别的。'],
['PVC 一直 Pending，事件显示 WaitForFirstConsumer，说明？',['存储坏了','还没有 Pod 使用它，这是正常的','需要删除重建'],1,'Pod 调度后才会创建卷。'],
['3 个 Deployment 副本分布在 3 个节点，共用一个 RWO 的 PVC，会怎样？',['正常工作','只有一个节点上的 Pod 能挂载','数据自动同步'],1,'RWO 是单节点。'],
['动态供应的 PV 默认回收策略是？',['Retain','Delete','Recycle'],1,'重要数据换成 Retain。']]);
