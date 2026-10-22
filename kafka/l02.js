const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={k1:B('k1','broker + controller'),k2:B('k2','broker + controller'),k3:B('k3','broker + controller'),q:P('控制器 quorum：3 个投票者，1 个活跃控制器','sig'),cl:B('客户端','bootstrap: k1','',140),md:P('① 从任意 Broker 取得元数据','sig'),dl:P('② 直接连接各分区 Leader 读写','ok')};
const N={k1:[0,0],k2:[170,0],k3:[340,0]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'节点',p:'三个节点各自运行 Broker 和控制器两种角色。生产环境通常把控制器单独部署。',set:N},
 {t:'控制器',p:'三个控制器组成 Raft quorum，选出一个活跃控制器管理元数据。',d:3600,set:{...N,q:[0,60]}},
 {t:'客户端',p:'客户端只需知道一个地址，拿到元数据后直接连接每个分区的 Leader。',d:4000,set:{...N,cl:[170,130],md:[0,190],dl:[0,226]}}]});
(()=>{const S={'初始':['Partition: 0  Leader: 2  Replicas: 2,3,1  Isr: 2,3,1','Partition: 1  Leader: 3  Replicas: 3,1,2  Isr: 3,1,2','Partition: 2  Leader: 1  Replicas: 1,2,3  Isr: 1,2,3','ok','每个分区的 Leader 分布在不同 Broker 上，ISR 包含所有副本。'],'k2 宕机':['Partition: 0  Leader: 3  Replicas: 2,3,1  Isr: 3,1','Partition: 1  Leader: 3  Replicas: 3,1,2  Isr: 3,1','Partition: 2  Leader: 1  Replicas: 1,2,3  Isr: 1,3','sig','分区 0 的 Leader 从 2 切换到 3；k2 从所有 ISR 中移除。Replicas 列表不变。'],'k2 恢复后':['Partition: 0  Leader: 3  Replicas: 2,3,1  Isr: 3,1,2','Partition: 1  Leader: 3  Replicas: 3,1,2  Isr: 3,1,2','Partition: 2  Leader: 1  Replicas: 1,2,3  Isr: 1,3,2','sig','k2 追上数据后回到 ISR，但分区 0 的 Leader 仍是 3：k3 现在承担两个 Leader。'],'首选 Leader 选举后':['Partition: 0  Leader: 2  Replicas: 2,3,1  Isr: 3,1,2','Partition: 1  Leader: 3  Replicas: 3,1,2  Isr: 3,1,2','Partition: 2  Leader: 1  Replicas: 1,2,3  Isr: 1,3,2','ok','Replicas 中的第一个是“首选 Leader”。auto.leader.rebalance.enable（默认开启）或 kafka-leader-election.sh 会把 Leader 移回去，恢复均衡。'],'k2、k3 都宕机':['Partition: 0  Leader: 1  Replicas: 2,3,1  Isr: 1','Partition: 1  Leader: 1  Replicas: 3,1,2  Isr: 1','Partition: 2  Leader: 1  Replicas: 1,2,3  Isr: 1','bad','这是仅有数据 Broker 故障且控制器 quorum 仍存活的示意。当前三台都是组合节点，同时停掉 k2/k3 会失去 2/3 控制器，无法完成这里展示的 Leader/ISR 变更；本地实验只停一台。']};
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Object.keys(S).forEach(k=>{const b=document.createElement('button');b.className='btn';b.textContent=k;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const s=S[k];p.textContent=s.slice(0,3).join('\n');m.className='msg '+s[3];m.innerHTML=s[4]});q.appendChild(b)});
 p.textContent=S['初始'].slice(0,3).join('\n');m.className='msg';m.innerHTML='点击事件。'})();
const bar=(c,e,l)=>({w:420,h:40,cls:'frame',html:`<span style="font-family:monospace">已提交 ${c} │ 末尾 ${e} │ <b>LAG ${l}</b></span>`});
const e2={b:bar(300,334,34),pr:P('生产速度 1000 条/秒','sig'),cs:P('消费速度 1200 条/秒','ok'),cs2:P('消费速度 600 条/秒','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'定义',p:'LAG = LOG-END-OFFSET − CURRENT-OFFSET，即还没处理的消息数。',set:{b:[0,0]}},
 {t:'追上',p:'消费比生产快，LAG 下降并保持在接近 0。',d:3600,set:{b:[0,0,{cls:'frame',html:'<span style="font-family:monospace">已提交 9990 │ 末尾 10000 │ <b>LAG 10</b></span>'}],pr:[0,60],cs:[0,100]}},
 {t:'积压',p:'消费比生产慢，LAG 持续上升；需要扩容消费者（不超过分区数）或提升单个消费者的处理速度。',d:4000,set:{b:[0,0,{cls:'frame',html:'<span style="font-family:monospace">已提交 6000 │ 末尾 10000 │ <b style="color:var(--bad)">LAG 4000 ↑</b></span>'}],pr:[0,60],cs2:[0,100]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-topics.sh $B --alter --topic orders --partitions 6','（无输出）','只能增加分区；已有 key 的映射会改变。'],
['bin/kafka-topics.sh $B --describe --under-replicated-partitions','\tTopic: orders\tPartition: 0\tLeader: 3\tReplicas: 2,3,1\tIsr: 3,1','只列出 ISR 不完整的分区，巡检常用。'],
['bin/kafka-consumer-groups.sh $B --describe --group g1 --members','GROUP CONSUMER-ID HOST CLIENT-ID #PARTITIONS\ng1    console-…   /10.0.0.5 console-consumer 3','组成员与分区数量。'],
['bin/kafka-leader-election.sh $B --election-type PREFERRED --all-topic-partitions','Successfully completed leader election (PREFERRED) for partitions orders-0','把 Leader 移回首选副本。'],
['bin/kafka-topics.sh $B --delete --topic orders','（无输出）','删除主题（delete.topic.enable 默认为 true）。']]);
Quiz(document.getElementById('qs'),[
['LAG 的含义？',['网络延迟','末尾偏移量减去已提交偏移量','副本落后量'],1,''],
['增加分区数的副作用？',['数据丢失','key 到分区的映射改变','需要重启'],1,''],
['Replicas 列表中的第一个副本是？',['首选 Leader','控制器','最慢的副本'],0,''],
['客户端需要配置所有 Broker 地址吗？',['需要','不需要，一个可达的就能拿到元数据','只配置控制器'],1,'一般配置 2–3 个以防其中一个不可用。'],
['Broker 宕机后 Replicas 列表会变吗？',['会','不会，变的是 Leader 和 ISR','删除该副本'],1,'']]);
