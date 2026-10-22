const P=(t,c='sig')=>({cls:'pill '+c,html:t});const S=(t,ms,w,c='')=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${ms}</span>`});
const e={rq:S('RequestQueue','等 I/O 线程',110),lc:S('Local','写入日志',90),rm:S('Remote','等 Follower',120),rs:S('ResponseQueue','',100),sd:S('Send','',60),n:P('TotalTimeMs = 各段之和','sig'),a:P('RequestQueue 高 → I/O 线程不够或被慢请求占满','bad'),b:P('Local 高 → 磁盘慢、页缓存压力','bad'),c:P('Remote 高 → Follower 复制慢、网络或某个 Broker 有问题','bad')};
const N={rq:[0,0],lc:[115,0],rm:[210,0],rs:[335,0],sd:[440,0]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'组成',p:'Produce 请求依次经过这几个阶段，每段都有独立指标。',set:{...N,n:[0,70]}},
 {t:'排队',p:'请求在网络线程和 I/O 线程之间的队列中等待。',d:3400,set:{...N,rq:[0,0,S('RequestQueue','45 ms',110,'bad')],a:[0,70]}},
 {t:'本地写入',p:'Leader 追加到日志。',d:3200,set:{...N,lc:[115,0,S('Local','30 ms',90,'bad')],b:[0,70]}},
 {t:'等待复制',p:'acks=all 时等待 ISR 中的 Follower 拉取；这一段最常见地高。',d:3600,set:{...N,rm:[210,0,S('Remote','80 ms',120,'bad')],c:[0,70]}}]});
(()=>{const S=[['LAG 在 0 附近波动','提交偏移量：持续前进\nLAG：200, 0, 450, 30, 0','ok','健康。批量提交导致的锯齿形是正常的。'],['LAG 很大但在减少','提交偏移量：持续前进\nLAG：80 万, 60 万, 40 万','sig','正在追赶（例如重启或回放之后），观察趋势即可。'],['LAG 持续增加，偏移量在前进','提交偏移量：前进但很慢\nLAG：1 万, 3 万, 6 万','bad','消费速度跟不上生产速度：扩容或优化处理。'],['偏移量不变，LAG 增加','提交偏移量：10 分钟没变化\nLAG：持续增加','bad','消费者停止或卡住（死锁、处理异常重试、被踢出后没有回来）。'],['偏移量不变，LAG 为 0','提交偏移量：没变化\nLAG：0\n生产：没有新消息','sig','无法判断：可能只是没有数据。需要结合组成员数或金丝雀消息。'],['LAG 为 0，但下游数据不对','LAG：0\n错误日志：大量反序列化失败','bad','消费者在跳过消息（例如 errors.tolerance=all 或 catch 后忽略）。LAG 看不出处理质量，需要错误率和 DLQ 监控。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r;m.className='msg '+c;m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择一种观察结果。'})();
const B=(t,s,c='',w=230)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e2={a:B('clicks：每秒 10 万条','LAG 10000'),b:B('refunds：每秒 2 条','LAG 10000'),ta:P('≈ 0.1 秒','ok'),tb:P('≈ 83 分钟','bad'),n:P('按时间而不是条数设置告警阈值','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'相同的 LAG',p:'两个主题都落后 1 万条。',set:{a:[0,0],b:[0,60]}},
 {t:'换算成时间',p:'用生产速率或消息时间戳换算。',d:3600,set:{a:[0,0],b:[0,60],ta:[250,10],tb:[250,70]}},
 {t:'结论',p:'同一个阈值不适用于所有主题。',d:3000,set:{a:[0,0],b:[0,60],ta:[250,10],tb:[250,70],n:[0,130]}}]});
Term(document.getElementById('t4'),[
['curl -s localhost:7071/metrics | grep kafka_server_replicamanager_underreplicatedpartitions','kafka_server_replicamanager_underreplicatedpartitions 0.0','JMX Exporter 以 Java agent 方式运行时的输出。'],
['curl -s localhost:9308/metrics | grep kafka_consumergroup_lag{','kafka_consumergroup_lag{consumergroup="lg",partition="0",topic="lagdemo"} 50000','kafka-exporter 从外部计算的 LAG。'],
['bin/kafka-consumer-groups.sh $B --describe --all-groups | awk \'$6 > 10000\'','lg lagdemo 0 0 50000 50000 …','快速找出 LAG 大的分区。'],
['bin/kafka-run-class.sh org.apache.kafka.tools.JmxTool --object-name kafka.server:type=KafkaRequestHandlerPool,name=RequestHandlerAvgIdlePercent --one-time true …','…,0.87','I/O 线程空闲率，低于 0.3 说明处理能力不足。']]);
Quiz(document.getElementById('qs'),[
['OfflinePartitionsCount > 0 表示？',['有分区没有 Leader，不可读写','副本不足','消费者离线'],0,''],
['acks=all 时 Produce 延迟中 RemoteTimeMs 高说明？',['磁盘慢','等待 Follower 复制慢','排队'],1,''],
['为什么时间延迟比偏移量延迟更有意义？',['不同主题速率不同，条数不可比','更容易计算','Kafka 只提供时间'],0,''],
['提交偏移量长时间不变、LAG 增加意味着？',['正常','消费者停止或卡住','生产者故障'],1,''],
['LAG 为 0 能证明消费者正常吗？',['能','不能，可能没有数据或在跳过消息','只在白天能'],1,'']]);
