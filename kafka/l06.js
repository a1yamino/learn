const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=140)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={br:B('Broker','分区 Leader'),f:B('Fetcher','后台拉取'),buf:B('消费者缓存','已拉回 1200 条','sig'),pl:P('poll() → 最多 max.poll.records = 500 条','sig'),pr:B('处理','业务逻辑'),cm:P('提交偏移量 → __consumer_offsets','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'拉取',p:'FetchRequest：Broker 等到至少 fetch.min.bytes 或 fetch.max.wait.ms 才返回。',set:{br:[0,0],f:[180,0]}},
 {t:'缓存',p:'拉回的数据先放在消费者内存中，下一次 poll 可能不需要网络请求。',d:3200,set:{br:[0,0],f:[180,0],buf:[360,0]}},
 {t:'poll',p:'每次 poll 返回最多 500 条。',d:3000,set:{br:[0,0],f:[180,0],buf:[360,0],pl:[180,70]}},
 {t:'处理与提交',p:'处理完成后提交偏移量（默认每 5 秒自动提交，第 8 课详细讲）。然后进入下一次 poll。',d:3800,set:{br:[0,0],f:[180,0],buf:[360,0],pl:[180,70],pr:[180,110],cm:[180,170]}}]});
(()=>{const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 [1,2,3,4,6,8].forEach(n=>{const b=document.createElement('button');b.className='btn';b.textContent=n+' 个消费者';b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));const a=Array.from({length:n},()=>[]);for(let i=0;i<6;i++)a[i%n].push(i);p.textContent=a.map((x,i)=>`消费者 ${i+1}: `+(x.length?x.map(v=>'P'+v).join(' '):'（空闲）')).join('\n');m.className='msg '+(n>6?'bad':n===6?'ok':'sig');m.innerHTML=n>6?'消费者比分区多，多出来的空闲（可作为热备）。':n===6?'每个消费者一个分区：达到最大并行度。':'每个消费者负责多个分区。'});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择消费者数量。'})();
const e2={c:B('消费者','poll 后处理 500 条'),t:{w:440,h:40,cls:'frame',html:'<span style="font-family:monospace">0s ─────── 300s(max.poll.interval.ms) ───</span>'},h:P('心跳线程：每 3 秒一次，正常','ok'),x:P('处理用了 400 秒，期间没有调用 poll','bad'),l:P('消费者主动离开组 → 分区被分给其他成员 → 之前处理的结果无法提交 → 被重复处理','bad'),f:P('解决：减小 max.poll.records、加快处理，或增大 max.poll.interval.ms','ok')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'两种超时',p:'心跳由后台线程发送（session.timeout.ms 检测进程宕机）；poll 间隔由 max.poll.interval.ms 检测处理卡住。',set:{c:[0,0],t:[0,60],h:[0,110]}},
 {t:'处理太慢',p:'一批消息处理时间超过 5 分钟。',d:3400,set:{c:[0,0],t:[0,60],h:[0,110],x:[0,150]}},
 {t:'被踢出',p:'超时后消费者离开组，它持有的分区被重新分配。',d:4000,set:{c:[0,0,B('消费者','已离开组','bad')],t:[0,60],x:[0,110],l:[0,150]}},
 {t:'调整',p:'让每次 poll 的处理时间远小于 max.poll.interval.ms。',d:3200,set:{c:[0,0],t:[0,60],f:[0,110]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list --state','GROUP STATE\nw     Stable\ng1    Empty','组和状态：Empty 表示没有活跃成员。'],
['bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group w','GROUP TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG CONSUMER-ID HOST CLIENT-ID\nw     jobs  0         4012           4020           8   console-…   /127.0.0.1 console-consumer\n…','每个分区由谁消费、积压多少。'],
['bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic jobs --group w --consumer-property max.poll.records=10','…','传递消费者参数。'],
['bin/kafka-share-groups.sh --bootstrap-server localhost:9092 --list','（共享组列表）','共享组有单独的管理工具（需要 Broker 启用共享组功能）。']]);
Quiz(document.getElementById('qs'),[
['Kafka 消费者是推模式还是拉模式？',['推','拉','都有'],1,''],
['组内活跃消费者数的上限？',['分区数','Broker 数','没有上限'],0,'共享组除外。'],
['处理一批消息超过 max.poll.interval.ms 会怎样？',['什么都不发生','消费者离开组，触发再平衡','消息被删除'],1,''],
['KafkaConsumer 可以被多个线程同时调用吗？',['可以','不可以','只有 poll 可以'],1,''],
['消费者能读到未被 ISR 全部复制的消息吗？',['能','不能，只能读到高水位之前','取决于 acks'],1,'']]);
