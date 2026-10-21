const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={dcs:B('etcd','leader 锁：node1 · TTL 30s','sig',220),n1:B('node1','主库','ok'),n2:B('node2','同步备库'),n3:B('node3','异步备库'),x:P('node1 宕机，无法续约','bad'),exp:P('30 秒后锁过期','sig'),win:P('node2 抢到锁 → pg_promote','ok'),ha:P('HAProxy 检查 /primary → 流量切到 node2','ok'),fo:P('node3 改为跟随 node2','mute')};
const N={n1:[0,90],n2:[170,90],n3:[340,90]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'正常运行',p:'每个节点的 Patroni 每 10 秒（loop_wait）检查一次。主库的 Patroni 持续续约 leader 锁。',set:{...N,dcs:[100,0]}},
 {t:'主库故障',p:'node1 所在机器宕机，没有人续约。',d:3400,set:{...N,n1:[0,90,{cls:'blk bad'}],dcs:[100,0],x:[0,150]}},
 {t:'选举',p:'锁过期后，健康的备库比较各自的 WAL 位置，在同步模式下只有同步备库有资格。node2 用原子操作写入锁并提升自己。',d:4400,set:{...N,n1:[0,90,{cls:'blk bad'}],n2:[170,90,B('node2','新主库','ok')],dcs:[100,0,B('etcd','leader 锁：node2','sig',220)],exp:[0,150],win:[170,150]}},
 {t:'恢复服务',p:'负载均衡器通过健康检查发现新主库；其他备库改为跟随它。node1 恢复后，Patroni 用 pg_rewind 把它变成备库。',d:4200,set:{...N,n1:[0,90,{cls:'blk mute'}],n2:[170,90,B('node2','新主库','ok')],dcs:[100,0,B('etcd','leader 锁：node2','sig',220)],ha:[0,150],fo:[0,190]}}]});
const e2={a:{w:260,h:160,cls:'frame',html:'<i>机房 A</i>'},b:{w:260,h:160,cls:'frame',html:'<i>机房 B</i>'},p1:B('旧主库','仍在运行','ok'),p2:B('备库','','',150),c1:P('部分应用','mute'),c2:P('部分应用','mute'),cut:P('⚡ 网络分区','bad'),p2b:B('新主库','被提升','ok'),w1:P('写入订单 1001','bad'),w2:P('也写入订单 1001','bad'),fx:P('失去多数派的一侧必须停止写入：Patroni 主库无法续约 → 自降为只读','ok')};
const A={a:[0,0],b:[320,0],p1:[20,40],p2:[340,40]};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'正常',p:'主库在机房 A，备库在机房 B。',set:A},
 {t:'分区',p:'两个机房之间的网络断开。机房 B 的监控以为主库挂了。',d:3400,set:{...A,cut:[260,170]}},
 {t:'两个主库',p:'如果只是简单地“联系不上就提升”，B 的备库成为主库，而 A 的旧主库仍在为 A 的应用服务。两边各自写入，主键冲突、余额分叉，事后无法自动合并。',d:4600,set:{...A,p2:[340,40,B('新主库','被提升','ok')],c1:[20,110],c2:[340,110],w1:[120,110],w2:[440,110]}},
 {t:'防止脑裂',p:'关键是让旧主库在被替换前一定停止写入：通过共识系统的租约（拿不到多数派就降级），必要时再加上隔离（关掉旧主库的虚拟机或网络端口，STONITH）。',d:4400,set:{...A,p1:[20,40,B('旧主库','只读','mute')],p2:[340,40,B('新主库','被提升','ok')],fx:[0,170]}}]});
(()=>{const Q=[['主库进程崩溃',"node1: postgres 进程退出\nnode1 Patroni: 尝试原地重启 PostgreSQL → 成功\n（leader 锁一直在 node1）\n停机约 5 秒，无切换",'ok','Patroni 先尝试在本机恢复，进程崩溃无需切换。'],
['主库所在机器宕机',"t=0    node1 宕机\nt≈30s  leader 锁过期\nt≈35s  node2（同步备库）获得锁并提升，时间线 2\nt≈40s  HAProxy 切流量；node3 跟随 node2\n丢失数据：0（synchronous_mode）",'ok','RTO 约 30–45 秒，由 ttl 和 loop_wait 决定。'],
['主库与 etcd 断开，但能连应用',"node1: 无法续约 leader 锁\nnode1 Patroni: 在 TTL 到期前把 PostgreSQL 降为只读并停止接受写入\nnode2 获得锁并提升\n应用写入 node1：ERROR: cannot execute INSERT in a read-only transaction → 重连到新主库",'ok','这就是防脑裂：主库失去与多数派的联系时主动下台。Patroni 的 watchdog 还能在 Patroni 自身卡死时重启机器。'],
['同步备库宕机',"node2 宕机\nPatroni: 把 node3 设为同步备库（更新 synchronous_standby_names）\n主库写入短暂等待后恢复",'ok','有多个候选时，同步备库可以自动替换。'],
['两个备库都宕机（strict 模式）',"synchronous_mode_strict: true\n没有可用的同步备库\n主库：所有 COMMIT 等待\n应用：写入超时",'bad','为了保证 RPO = 0 而牺牲可用性。非 strict 模式会降级为异步继续写入。'],
['etcd 失去多数派',"etcd 3 个节点中 2 个不可用\n所有 Patroni 无法读写 leader 锁\n主库降为只读（failsafe_mode 关闭时）\n集群只读，直到 etcd 恢复",'bad','共识存储本身也必须高可用，并且最好与数据库节点分布在相同的故障域中。Patroni 3.0+ 的 failsafe_mode 可以在所有节点都能互相通信时保持主库可写。'],
['误执行 DROP TABLE orders',"主库：DROP TABLE orders; COMMIT\n同步复制 → 两个备库立即重放\n所有节点上 orders 都消失了",'bad','高可用不是备份。逻辑错误会被忠实地复制。需要 PITR 恢复到删除前的时间点，或者使用延迟备库（recovery_min_apply_delay = \'1h\'）。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='node1 主库，node2 同步备库，node3 异步备库；ttl 30s，synchronous_mode 开启。'})();
Term(document.getElementById('t4'),[
['patronictl -c /etc/patroni.yml list','+ Cluster: shop -------+---------+-----------+----+-----------+\n| Member | Host     | Role    | State     | TL | Lag in MB |\n+--------+----------+---------+-----------+----+-----------+\n| node1  | 10.0.1.1 | Leader  | running   |  3 |           |\n| node2  | 10.0.2.1 | Sync Standby | streaming |  3 |         0 |\n| node3  | 10.0.3.1 | Replica | streaming |  3 |         0 |','集群成员、角色、时间线和延迟。'],
['patronictl switchover --leader node1 --candidate node2','Successfully switched over to "node2"','计划内切换（维护、升级），先等同步再切，不丢数据，通常几秒。'],
['patronictl failover --candidate node3','…','手动故障切换到指定节点（主库已不可用时）。'],
['SELECT pg_promote(wait => true, wait_seconds => 60);',' pg_promote\n------------\n t','不用 Patroni 时手动提升备库。'],
['psql "host=10.0.1.1,10.0.2.1,10.0.3.1 dbname=shop target_session_attrs=read-write"','shop=>','libpq 依次尝试列出的主机，直到连上一个可写的。JDBC、psycopg 等都支持类似参数。'],
['curl -s -o /dev/null -w "%{http_code}" http://10.0.2.1:8008/primary','200','Patroni REST 健康检查：主库返回 200，备库返回 503。HAProxy 据此路由。']]);
Quiz(document.getElementById('qs'),[
['RPO 指的是？',['恢复服务需要的时间','最多可能丢失的数据量','副本数'],1,''],
['备库被提升后时间线 ID 会？',['不变','加一','重置为 1'],1,''],
['旧主库恢复后要成为新主库的备库，通常用？',['pg_rewind','VACUUM FULL','pg_dump'],0,''],
['Patroni 防脑裂的关键机制是？',['带 TTL 的 leader 锁，失去锁的主库自降','定时 ping','人工确认'],0,''],
['高可用集群能防止误删表吗？',['能','不能，需要备份和 PITR','同步复制能'],1,'']]);
