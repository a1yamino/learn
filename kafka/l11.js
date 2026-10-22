const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={app:B('处理程序','tx.id = enricher-3'),tc:B('事务协调器','__transaction_state','sig',150),in:B('orders','输入'),out:B('enriched-0/1','输出'),co:B('__consumer_offsets','组偏移量'),s1:P('begin → 登记分区 → send 结果','sig'),s2:P('sendOffsetsToTransaction(orders@120)','sig'),s3:P('commit：PREPARE_COMMIT → 各分区写 COMMIT 标记 → COMPLETE','ok'),s4:P('read_committed 消费者此时才看到结果；偏移量同时生效','ok')};
const N={app:[0,60],tc:[180,0],in:[0,140],out:[360,60],co:[360,140]};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'开始',p:'读到一批 orders 后开始事务，写入前向协调器登记要写的分区。',set:{...N,s1:[0,210]}},
 {t:'写入',p:'结果写入 enriched 的两个分区；这些消息已在日志中，但还没有提交。',d:3400,set:{...N,out:[360,60,B('enriched-0/1','未提交的消息','sig')],s1:[0,210]}},
 {t:'偏移量',p:'把输入的消费位置作为事务的一部分发送。',d:3400,set:{...N,out:[360,60,B('enriched-0/1','未提交的消息','sig')],co:[360,140,B('__consumer_offsets','未提交的偏移量','sig')],s2:[0,210]}},
 {t:'提交',p:'协调器先持久化“准备提交”，再向所有涉及的分区写提交标记。',d:4000,set:{...N,out:[360,60,B('enriched-0/1','COMMIT','ok')],co:[360,140,B('__consumer_offsets','COMMIT','ok')],s3:[0,210]}},
 {t:'可见',p:'输出消息和偏移量同时生效。崩溃在任何一步，事务要么完成要么中止，不会只发生一半。',d:3600,set:{...N,out:[360,60,B('enriched-0/1','COMMIT','ok')],co:[360,140,B('__consumer_offsets','COMMIT','ok')],s4:[0,210]}}]});
(()=>{const log=[['a1','T1'],['b1','T2'],['a2','T1'],['x','—'],['b2','T2']];let st={T1:'open',T2:'open'};const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const show=t=>{const lso=(()=>{for(let i=0;i<log.length;i++){const tx=log[i][1];if(tx!=='—'&&st[tx]==='open')return i}return log.length})();
 const ru=log.map(x=>x[0]).join(' ');const rc=log.filter((x,i)=>i<lso&&(x[1]==='—'||st[x[1]]==='commit')).map(x=>x[0]).join(' ')||'（无）';
 p.textContent=`分区：`+log.map((x,i)=>`${i}:${x[0]}(${x[1]})`).join('  ')+`\nT1 ${st.T1}   T2 ${st.T2}   LSO = ${lso}\nread_uncommitted 读到：${ru}\nread_committed 读到：${rc}`;m.className='msg sig';m.innerHTML=t};
 [['提交 T2',()=>{st.T2='commit';show('T2 提交了，但 T1 仍未完成：LSO 停在 T1 的第一条（0），read_committed 什么也读不到。')}],['提交 T1',()=>{st.T1='commit';show('LSO 前进。')}],['中止 T1',()=>{st.T1='abort';show('中止的消息被 read_committed 消费者跳过。')}],['重置',()=>{st={T1:'open',T2:'open'};show('两个事务都未完成。')}]].forEach(([t,f])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',f);q.appendChild(b)});
 show('两个事务都未完成，非事务消息 x 也被挡在 LSO 之后。')})();
const e2={o:B('实例 A','epoch 5'),n:B('实例 B','—'),tc:B('协调器','enricher-3 epoch 5','sig',160),x:P('A 与集群失联（GC 停顿、网络分区），编排系统启动替代实例 B','bad'),i:P('B：initTransactions() → epoch 6，A 未完成的事务被中止','sig'),f:P('A 恢复后以 epoch 5 写入/提交 → ProducerFenced，A 必须退出','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'运行',p:'实例 A 持有 transactional.id enricher-3，epoch 5。',set:{o:[0,0],tc:[200,0]}},
 {t:'失联',p:'A 看起来死了，但其实还活着。',d:3200,set:{o:[0,0,B('实例 A','失联…','bad')],tc:[200,0],x:[0,70]}},
 {t:'接管',p:'B 用同一个 transactional.id 初始化，epoch 加 1。',d:3600,set:{o:[0,0,B('实例 A','失联…','bad')],n:[0,140,B('实例 B','epoch 6','ok')],tc:[200,0,B('协调器','enricher-3 epoch 6','ok',160)],i:[0,70]}},
 {t:'隔离',p:'僵尸 A 的任何事务操作都被拒绝，不会产生重复输出。',d:3600,set:{o:[0,0,B('实例 A','已被隔离','bad')],n:[0,140,B('实例 B','epoch 6','ok')],tc:[200,0,B('协调器','enricher-3 epoch 6','ok',160)],f:[0,70]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-transactions.sh --bootstrap-server localhost:9092 find-hanging --broker-id 1','Topic Partition ProducerId ProducerEpoch CoordinatorEpoch StartOffset LastTimestamp Duration(min)\n（无挂起事务）','查找挂起（长时间未完成、阻塞 LSO）的事务。'],
['bin/kafka-transactions.sh --bootstrap-server localhost:9092 abort --topic tx-out --partition 0 --start-offset 120','…','手动中止挂起事务（谨慎使用）。'],
['bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group g','… CURRENT-OFFSET LOG-END-OFFSET LAG …','事务主题中 LAG 包含控制标记，所以不会降到 0 以下但可能显示 1。'],
['bin/kafka-features.sh --bootstrap-server localhost:9092 describe | grep transaction','Feature: transaction.version … FinalizedVersionLevel: 2','事务协议 v2 已启用。']]);
Quiz(document.getElementById('qs'),[
['transactional.id 应该如何选择？',['每次启动随机生成','每个逻辑实例固定且唯一','所有实例相同'],1,''],
['read_committed 消费者最多读到？',['HW','LSO','LEO'],1,''],
['僵尸生产者如何被隔离？',['IP 黑名单','epoch 增加后旧 epoch 的请求被拒绝','删除 transactional.id'],1,''],
['Kafka 事务能覆盖写数据库吗？',['能','不能，外部副作用需要幂等或 Outbox','只能覆盖 MySQL'],1,''],
['长时间未完成的事务会？',['阻塞 read_committed 消费者','删除数据','加速消费'],0,'']]);
