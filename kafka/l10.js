const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={ad:B('管理客户端','CreateTopics'),ac:B('控制器 1','活跃','ok'),c2:B('控制器 2','热备'),c3:B('控制器 3','热备'),lg:P('追加 TopicRecord + PartitionRecord ×3 到 __cluster_metadata','sig'),cm:P('多数控制器写入 → 提交（HW 前进）','ok'),b1:B('Broker 4','元数据镜像'),b2:B('Broker 5','元数据镜像'),ap:P('Broker 拉取新记录，更新镜像：成为新分区的 Leader/Follower','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'请求',p:'请求被转发到活跃控制器。',set:{ad:[0,0],ac:[180,0],c2:[360,0],c3:[360,60]}},
 {t:'追加',p:'活跃控制器校验后，把变更写成元数据记录追加到日志。',d:3600,set:{ad:[0,0],ac:[180,0],c2:[360,0],c3:[360,60],lg:[0,120]}},
 {t:'提交',p:'其他控制器以 Raft Follower 身份拉取；多数写入后提交，返回成功。',d:3600,set:{ad:[0,0],ac:[180,0],c2:[360,0,B('控制器 2','已复制','ok')],c3:[360,60],cm:[0,120]}},
 {t:'传播',p:'Broker 也拉取这条日志（只读），在本地应用变更。',d:3800,set:{ac:[180,0],c2:[360,0],c3:[360,60],b1:[0,150],b2:[180,150],ap:[0,210]}}]});
const e2={c1:B('控制器 1','活跃 · epoch 3','ok'),c2:B('控制器 2','Follower'),c3:B('控制器 3','Follower'),x:P('控制器 1 宕机，Follower 收不到拉取响应','bad'),v:P('控制器 3 发起选举（epoch 4），获得自己和控制器 2 的票','sig'),n:P('控制器 3 已有完整元数据，立即成为活跃控制器；Broker 转向它拉取','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'正常',p:'活跃控制器处理所有变更，Follower 持续复制。',set:{c1:[0,0],c2:[180,0],c3:[360,0]}},
 {t:'宕机',p:'超时后 Follower 认为 Leader 失效。',d:3200,set:{c1:[0,0,B('控制器 1','宕机','bad')],c2:[180,0],c3:[360,0],x:[0,70]}},
 {t:'选举',p:'候选者请求投票；日志至少和自己一样新的才投票，所以新 Leader 拥有全部已提交记录。',d:3800,set:{c1:[0,0,B('控制器 1','宕机','bad')],c2:[180,0],c3:[360,0,B('控制器 3','候选 · epoch 4','sig')],v:[0,70]}},
 {t:'接管',p:'热备切换通常在数秒内完成，不需要重新加载元数据。',d:3600,set:{c1:[0,0,B('控制器 1','宕机','bad')],c2:[180,0],c3:[360,0,B('控制器 3','活跃 · epoch 4','ok')],n:[0,70]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');let n=3,f=1;
 const upd=()=>{const maj=Math.floor(n/2)+1,ok=n-f>=maj;p.textContent=`控制器 ${n} 个，多数 = ${maj}\n故障 ${f} 个，存活 ${n-f} 个`;m.className='msg '+(ok?'ok':'bad');m.innerHTML=ok?'可以选出活跃控制器并提交元数据变更。':'达不到多数：无法提交任何元数据变更。已有分区的 Leader 继续服务读写，但 ISR 变化、Leader 切换、创建主题都无法进行。';q.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.k==='n'+n||b.dataset.k==='f'+f))};
 [1,3,4,5].forEach(v=>{const b=document.createElement('button');b.className='btn';b.dataset.k='n'+v;b.textContent=v+' 个控制器';b.addEventListener('click',()=>{n=v;if(f>n)f=n;upd()});q.appendChild(b)});
 [0,1,2,3].forEach(v=>{const b=document.createElement('button');b.className='btn';b.dataset.k='f'+v;b.textContent=v+' 个故障';b.addEventListener('click',()=>{f=Math.min(v,n);upd()});q.appendChild(b)});upd()})();
Term(document.getElementById('t4'),[
['bin/kafka-storage.sh random-uuid','4L6g3nShT-eMCtK--X86sw','生成集群 ID。'],
['bin/kafka-storage.sh format -t 4L6g3nShT-eMCtK--X86sw -c config/server.properties --standalone','Formatting metadata directory /tmp/kraft-combined-logs with metadata.version 4.4-IV….','首次启动前格式化存储（--standalone 创建只有自己的初始 quorum）。'],
['bin/kafka-metadata-quorum.sh --bootstrap-controller ctl1:9093 add-controller --command-config controller.properties','Added controller 4 with directory id … and endpoints: CONTROLLER://ctl4:9093','动态添加控制器（需在新节点上运行）。'],
['bin/kafka-features.sh $B upgrade --metadata 4.4','metadata.version was upgraded to 4.4-IV….','所有节点升级后提升功能版本。'],
['bin/kafka-cluster.sh cluster-id $B','Cluster ID: 4L6g3nShT-eMCtK--X86sw','查看集群 ID。']]);
Quiz(document.getElementById('qs'),[
['KRaft 元数据保存在？',['ZooKeeper','__cluster_metadata 主题','每个 Broker 的配置文件'],1,''],
['3 个控制器能容忍几个故障？',['0','1','2'],1,''],
['4 个控制器比 3 个多容忍故障吗？',['是','否，多数是 3，仍只容忍 1 个','容忍 3 个'],1,''],
['Broker 心跳超时后会？',['被隔离，Leader 迁走','被删除','重启'],0,''],
['从 ZooKeeper 集群升级到 4.x 的前提？',['直接升级','先在 3.x 上迁移到 KRaft','清空数据'],1,'']]);
