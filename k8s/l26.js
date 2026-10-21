const S=(t,s,c='',w=120)=>({w,h:52,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});const P=(t,c='sig')=>({cls:'pill '+c,html:t});
const m=(i,z,c='')=>S('etcd-'+i,'zone '+z,c);
Player(document.getElementById('p1'),{els:{a:m(1,'a'),b:m(2,'b'),c:m(3,'c'),w:P('写入：leader 复制到多数（2/3）后确认','mute'),x:P('2/3 存活：仍可读写','ok'),y:P('1/3：只读也不可靠，API Server 无法写入','bad'),n:{w:700,cls:'tag'}},scenes:[
 {t:'三个成员',p:'一个 leader、两个 follower，分布在三个可用区。',set:{a:[0,20,{cls:'blk sig'}],b:[180,20],c:[360,20]}},
 {t:'多数派写入',p:'写请求由 leader 记录日志并复制，<b>多数</b>成员持久化后才确认。所以 etcd 对磁盘延迟非常敏感，要用 SSD。',d:3800,set:{a:[0,20,{cls:'blk sig'}],b:[180,20,{cls:'blk sig'}],c:[360,20],w:[0,110]}},
 {t:'坏一个',p:'zone c 故障。剩下 2 个仍是多数（2 &gt; 3/2），集群照常工作；如果坏的是 leader，剩下的会在约一秒内选出新 leader。',d:4000,set:{a:[0,20,{cls:'blk sig'}],b:[180,20,{cls:'blk ok'}],c:[360,20,{cls:'blk bad'}],x:[0,110]}},
 {t:'坏两个',p:'只剩 1 个，不到多数，拒绝写入：不能创建、修改任何对象。已运行的 Pod 继续运行（kubelet 不依赖 etcd），但不会被调度或修复。',d:4200,set:{a:[0,20,{cls:'blk bad'}],b:[180,20,{cls:'blk ok'}],c:[360,20,{cls:'blk bad'}],y:[0,110]}}]});
const N=k=>({w:200,h:140,cls:'frame',html:`<i>${k}</i>`});
Player(document.getElementById('p2'),{els:{n1:N('node-1'),n2:N('node-2'),n3:N('node-3'),p1:S('web-a','','',90),p2:S('web-b','','',90),p3:S('web-c','','',90),pdb:P('PDB maxUnavailable: 1','mute'),c:P('cordon：不再调度新 Pod','mute'),ev:P('Eviction API：PDB 允许才驱逐','sig'),up:P('升级 kubelet → uncordon','ok'),n:{w:700,cls:'tag'}},scenes:[
 {t:'起点',p:'web 3 个副本分布在 3 个节点上，PDB 允许同时最多 1 个不可用。',set:{n1:[0,0],n2:[230,0],n3:[460,0],p1:[20,40],p2:[250,40],p3:[480,40],pdb:[0,170]}},
 {t:'cordon',p:'drain 先把 node-1 标记为不可调度。',set:{n1:[0,0,{cls:'frame'}],n2:[230,0],n3:[460,0],p1:[20,40],p2:[250,40],p3:[480,40],c:[0,170]}},
 {t:'按 PDB 驱逐',p:'drain 通过 Eviction API 请求驱逐 web-a。PDB 当前允许 1 次中断，于是批准；web-a 优雅终止，Deployment 在 node-2 或 node-3 上补一个新副本。在新副本就绪前，其他驱逐请求会被拒绝并重试。',d:4600,set:{n1:[0,0],n2:[230,0],n3:[460,0],p1:[20,40,{cls:'blk bad'}],p2:[250,40],p3:[480,40],ev:[0,170]}},
 {t:'升级并恢复',p:'节点空了：升级 kubelet（和运行时），重启，uncordon。再对下一个节点重复。云上常见做法是创建新版本的节点，再把旧节点逐个 drain 掉。',d:4200,set:{n1:[0,0],n2:[230,0],n3:[460,0],p2:[250,40],p3:[480,40],up:[0,170]}}]});
(()=>{let M=3,F=1,A=32,K=31,C=32;
 const mk=(id,lab,vals,get,set,fmt=v=>v)=>{const el=document.getElementById(id);el.innerHTML=`<span style="font:600 12px var(--m);opacity:.7;margin-right:6px">${lab}</span>`;vals.forEach(v=>{const b=document.createElement('button');b.className='btn';b.dataset.v=v;b.textContent=fmt(v);b.addEventListener('click',()=>{set(v);draw()});el.appendChild(b)});el.style.alignItems='center'};
 mk('qm','etcd 成员',[1,3,4,5],()=>M,v=>M=v);mk('qf','故障成员',[0,1,2,3],()=>F,v=>F=v);
 mk('va','API Server',[31,32,33],()=>A,v=>A=v,v=>'1.'+v);mk('vk','kubelet',[28,29,30,31,32,33],()=>K,v=>K=v,v=>'1.'+v);mk('vc','kubectl',[30,31,32,33,34],()=>C,v=>C=v,v=>'1.'+v);
 function draw(){const sel=(id,v)=>document.querySelectorAll('#'+id+' .btn').forEach(b=>b.classList.toggle('pri',+b.dataset.v===v));sel('qm',M);sel('qf',F);sel('va',A);sel('vk',K);sel('vc',C);
  const q=Math.floor(M/2)+1,alive=Math.max(0,M-F),ok=alive>=q,tol=M-q;const qr=document.getElementById('qr');qr.className='msg '+(ok?'ok':'bad');
  qr.innerHTML=`多数派 = ⌊${M}/2⌋+1 = ${q}，最多容忍 ${tol} 个故障。存活 ${alive}：${ok?'可以读写。':'<b>不可写</b>，集群控制平面停止工作。'}`+(M===4?' 4 个成员和 3 个一样只容忍 1 个故障，却多了一个可能出故障的成员：不要用偶数。':'')+(M===1?' 单成员没有任何容错，只适合测试。':'');
  const v=[];if(K>A)v.push('kubelet 比 API Server 新：不允许（升级时必须先升控制平面）');else if(A-K>3)v.push(`kubelet 落后 ${A-K} 个小版本，超过 3`);if(Math.abs(C-A)>1)v.push(`kubectl 与 API Server 相差 ${Math.abs(C-A)}，超过 1`);
  const vr=document.getElementById('vr');vr.className='msg '+(v.length?'bad':'ok');vr.innerHTML=v.length?v.join('；')+'。':`符合版本偏差规则。kubelet 落后 ${A-K} 个小版本${A-K>=2?'：下次控制平面升级前要先升级节点':''}。控制平面每次只能升一个小版本（1.${A} → 1.${A+1}）。`}
 draw()})();
Term(document.getElementById('t4'),[
['kubectl -n kube-system get lease kube-scheduler kube-controller-manager -o custom-columns=NAME:.metadata.name,HOLDER:.spec.holderIdentity','NAME                      HOLDER\nkube-scheduler            cp-2_3f1e…\nkube-controller-manager   cp-1_9a8c…','当前是哪个控制平面实例在工作（选主）。'],
['etcdctl endpoint status --cluster -w table','| ENDPOINT          | IS LEADER | RAFT TERM | DB SIZE |\n| https://10.0.1.10 | false     | 7         | 48 MB   |\n| https://10.0.2.10 | true      | 7         | 48 MB   |\n| https://10.0.3.10 | false     | 7         | 48 MB   |','etcd 成员、leader 和数据库大小（需要证书参数）。'],
['kubeadm upgrade plan','COMPONENT   CURRENT   TARGET\nkubelet     3 x v1.31.0   v1.32.4\nkube-apiserver  v1.31.0   v1.32.4\n…\nYou can now apply the upgrade by executing: kubeadm upgrade apply v1.32.4','kubeadm 集群的升级计划。托管集群用云厂商的命令或控制台。'],
['kubectl get pdb -A','NAMESPACE   NAME   MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS\nshop        api    N/A             1                 1\nshop        db     1               N/A               0','ALLOWED DISRUPTIONS 为 0 的 PDB 会阻塞 drain。'],
['velero backup create shop-$(date +%F) --include-namespaces shop --snapshot-volumes','Backup request "shop-2026-10-21" submitted successfully.','按命名空间备份对象和卷快照。'],
['velero restore create --from-backup shop-2026-10-21 --namespace-mappings shop:shop-restore','Restore request "shop-2026-10-21-20261021153012" submitted successfully.','恢复到另一个命名空间验证备份，不影响线上。']]);
Quiz(document.getElementById('qs'),[
['5 个成员的 etcd 最多容忍几个成员故障？',['1','2','4'],1,'多数派为 3。'],
['API Server 是 1.32，kubelet 可以是？',['1.33','1.29','1.27'],1,'不能更新，最多旧 3 个。'],
['集群从 1.30 升到 1.32，应该？',['直接升到 1.32','先升到 1.31，再升到 1.32','先升节点'],1,'控制平面一次一个小版本。'],
['只备份 GitOps 仓库够吗？',['够','不够，PV 数据和运行时对象不在其中','够，etcd 不需要备份'],1,'数据要单独备份。']]);
