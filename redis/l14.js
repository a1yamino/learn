const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={m:B('主库','运行中','ok'),r1:B('副本 1','offset 900'),r2:B('副本 2','offset 1000'),s1:B('S1','',''),s2:B('S2',''),s3:B('S3',''),n:P('','sig'),c:B('客户端','写 主库','',120)};
const base={m:[0,0],r1:[0,60],r2:[0,120],s1:[200,0],s2:[200,60],s3:[200,120],c:[400,60]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'监控',p:'三个 Sentinel 每秒 PING 主库和副本。',set:base},
 {t:'主观下线',p:'主库宕机。S1 在 down-after-milliseconds 内收不到回复，标记 SDOWN。',d:3800,set:{...base,m:[0,0,B('主库','宕机','bad')],s1:[200,0,B('S1','SDOWN','sig')]}},
 {t:'客观下线',p:'S1 询问其他 Sentinel，S2 也认为下线：2 ≥ quorum 2 → ODOWN。',d:3800,set:{...base,m:[0,0,B('主库','宕机','bad')],s1:[200,0,B('S1','ODOWN','sig')],s2:[200,60,B('S2','SDOWN','sig')]}},
 {t:'选领导者',p:'S1 请求投票，获得 S1、S2、S3 中至少 2 票（多数），成为领导者。',d:3800,set:{...base,m:[0,0,B('主库','宕机','bad')],s1:[200,0,B('S1','领导者','ok')],n:[200,180,P('需要多数：3 个中 2 个','sig')]}},
 {t:'提升',p:'副本 2 的偏移量更大（数据更新），被选中：REPLICAOF NO ONE；副本 1 改为复制它。',d:4200,set:{...base,m:[0,0,B('主库','宕机','bad')],r2:[0,120,B('副本 2','新主库','ok')],r1:[0,60,B('副本 1','复制 副本 2')],s1:[200,0,B('S1','领导者','ok')]}},
 {t:'通知',p:'发布 +switch-master，客户端重新查询主库地址，连到新主库。',d:3800,set:{...base,m:[0,0,B('主库','宕机','bad')],r2:[0,120,B('副本 2','新主库','ok')],r1:[0,60,B('副本 1','复制 副本 2')],c:[400,60,B('客户端','写 副本 2','ok',120)]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [5,4,3,2,1].forEach(n=>{const b=document.createElement('button');b.className='btn';b.textContent=n+' 个存活';b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const od=n>=2,maj=n>=3;p.textContent=`判定 ODOWN：${n} ≥ quorum 2？${od?'是':'否'}\n选领导者：${n} ≥ 多数 3？${maj?'是':'否'}`;m.className='msg '+(od&&maj?'ok':'bad');m.innerHTML=od&&maj?'可以完成故障切换。':od?'能判定主库下线，但选不出领导者，不会切换。':'连故障都无法判定。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='quorum 只用于判定故障；执行切换需要所有 Sentinel 中的多数。'})();
const e2={a:{w:230,h:150,cls:'frame',html:'<i>分区 1</i>'},b:{w:250,h:150,cls:'frame',html:'<i>分区 2</i>'},om:B('旧主库','',''),c1:B('客户端 X','写入'),nm:B('副本','',''),ss:B('S1 S2 S3','')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'隔离',p:'网络分区：旧主库和部分客户端在分区 1；副本和所有 Sentinel 在分区 2。',set:{a:[0,0],b:[260,0],om:[20,30],c1:[20,90],nm:[280,30],ss:[280,90]}},
 {t:'两个主库',p:'分区 2 提升副本为新主库。客户端 X 还在往旧主库写。',d:4000,set:{a:[0,0],b:[260,0],om:[20,30,B('旧主库','仍在写入','bad')],c1:[20,90],nm:[280,30,B('新主库','','ok')],ss:[280,90]}},
 {t:'恢复',p:'网络恢复后旧主库被降级为副本，全量同步新主库，期间的写入全部丢失。min-replicas-to-write 能让旧主库在失去副本 10 秒后拒绝写入。',d:4600,set:{a:[0,0],b:[260,0],om:[20,30,B('旧主库→副本','写入丢失','bad')],nm:[280,30,B('新主库','','ok')],ss:[280,90]}}]});
Term(document.getElementById('t4'),[
['SENTINEL masters','1) 1) "name" 2) "mymaster"\n   …\n   "num-slaves" "2"\n   "num-other-sentinels" "2"\n   "quorum" "2"','监控的主库。'],
['SENTINEL replicas mymaster','1) 1) "name" 2) "172.18.0.3:6379"\n   …\n   "flags" "slave"','副本列表。'],
['SENTINEL ckquorum mymaster','OK 3 usable Sentinels. Quorum and failover authorization can be reached','检查当前能否判定故障并授权切换。'],
['SENTINEL failover mymaster','OK','手动触发切换（维护时使用）。'],
['SUBSCRIBE +switch-master','1) "message"\n2) "+switch-master"\n3) "mymaster 172.18.0.2 6379 172.18.0.4 6379"','在 Sentinel 上订阅切换事件。']]);
Quiz(document.getElementById('qs'),[
['quorum 的作用？',['判定客观下线所需的 Sentinel 数','切换所需的副本数','副本数量'],0,''],
['执行故障切换还需要？',['所有 Sentinel 同意','多数 Sentinel 投票选出领导者','quorum 个副本'],1,''],
['新主库优先选择？',['优先级高、偏移量大的副本','IP 最小的','随机'],0,''],
['客户端应如何找到主库？',['写死 IP','询问 Sentinel','DNS 轮询'],1,''],
['只有两个可用区时 Sentinel 的问题？',['延迟高','某个区整体故障时可能没有多数','不能复制'],1,'']]);
