const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=130)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={u:B('应用线程','send(record)'),s:P('拦截器 → 序列化 → 分区器','sig'),acc:{w:240,h:150,cls:'frame',html:'<i>记录累加器</i>'},b0:B('P0 批次','12 KB','',100),b1:B('P1 批次','16 KB 已满','ok',100),b3:B('P3 批次','3 KB','',100),snd:B('Sender 线程','','sig'),br:B('Broker 2','P1、P3 的 Leader'),rq:P('ProduceRequest {P1, P3}','sig'),cb:P('响应 → 回调 / Future 完成','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'调用线程',p:'send() 在调用线程中序列化、选分区，然后把记录追加到该分区的批次，立即返回。',set:{u:[0,0],s:[0,60]}},
 {t:'累加器',p:'每个分区有一个双端队列，最后一个批次是正在填充的。',d:3600,set:{u:[0,0],s:[0,60],acc:[160,0],b0:[175,30],b1:[175,80],b3:[285,30]}},
 {t:'发送',p:'P1 批次满了；P3 等待超过 linger.ms。Sender 把发往同一 Broker 的批次合并成一个请求。',d:4200,set:{acc:[160,0],b0:[175,30],b1:[175,80],b3:[285,30,B('P3 批次','等待 5 ms','ok',100)],snd:[420,0],br:[420,90],rq:[160,170]}},
 {t:'确认',p:'Broker 写入后返回每个分区的偏移量，触发回调。',d:3400,set:{snd:[420,0],br:[420,90],cb:[160,170]}}]});
(()=>{const rate=2000,size=500;let bs=16384,lg=5;const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 const upd=()=>{const perMs=rate/1000;const fillMs=bs/size/perMs;const wait=Math.min(fillMs,lg);const recs=Math.max(1,Math.min(bs/size,Math.round(perMs*Math.max(wait,0.5))));const req=Math.round(rate/recs);p.textContent=`batch.size=${bs} linger.ms=${lg}\n写满一个批次需要 ${fillMs.toFixed(1)} ms\n实际批次：约 ${recs} 条（${(recs*size/1024).toFixed(1)} KB）\n请求数：约 ${req} 个/秒，额外延迟最多 ${wait.toFixed(1)} ms`;m.className='msg '+(req>800?'bad':'ok');m.innerHTML=req>800?'批次很小，请求很多：吞吐低、压缩效果差。':'批次较大，请求少；代价是最多等待 linger.ms。';q.querySelectorAll('.btn').forEach(b=>b.classList.toggle('pri',b.dataset.k==='b'+bs||b.dataset.k==='l'+lg))};
 [16384,65536,262144].forEach(v=>{const b=document.createElement('button');b.className='btn';b.dataset.k='b'+v;b.textContent='batch.size '+(v/1024)+'K';b.addEventListener('click',()=>{bs=v;upd()});q.appendChild(b)});
 [0,5,20,100].forEach(v=>{const b=document.createElement('button');b.className='btn';b.dataset.k='l'+v;b.textContent='linger.ms '+v;b.addEventListener('click',()=>{lg=v;upd()});q.appendChild(b)});upd()})();
const e2={k:P('key = "o42" → murmur2 % 6 = 3','sig'),n:P('无 key → 粘性：当前批次的分区（如 P1），批次发送后换一个','sig'),x:P('指定 partition = 5 → P5','sig'),ps:{w:460,h:44,cls:'frame',html:'P0 &nbsp; P1 &nbsp; P2 &nbsp; P3 &nbsp; P4 &nbsp; P5'},w:P('增加分区：6 → 8，"o42" 变为 murmur2 % 8 = 7，顺序在扩容瞬间不再保证','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'有 key',p:'哈希取模，相同 key 永远在同一个分区（只要分区数不变）。',set:{ps:[0,0],k:[0,60]}},
 {t:'无 key',p:'粘性分区器让无 key 消息集中填满一个批次，分布在时间上仍然均匀。',d:3600,set:{ps:[0,0],k:[0,60],n:[0,100]}},
 {t:'指定分区',p:'也可以直接指定分区，或实现自定义分区器。',d:3200,set:{ps:[0,0],k:[0,60],n:[0,100],x:[0,140]}},
 {t:'扩分区',p:'分区数改变后，key 的映射改变。需要严格顺序的主题在创建时就要预留足够分区。',d:4000,set:{ps:[0,0],w:[0,60]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-producer-perf-test.sh --topic perf --num-records 100000 --record-size 200 --throughput 10000 --producer-props bootstrap.servers=localhost:9092','… 10000.0 records/sec … 3.1 ms avg latency, 25 ms max latency, 2 ms 50th, 9 ms 95th, 14 ms 99th …','--throughput 限速，观察稳定负载下的延迟分位数。'],
['bin/kafka-producer-perf-test.sh … --producer-props bootstrap.servers=localhost:9092 acks=1 linger.ms=50','…','任意生产者参数都可以用 --producer-props 传入。'],
['bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic perf --producer-property linger.ms=1000','>','控制台生产者也能设置参数：输入后约 1 秒才发送。'],
['bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name perf --alter --add-config max.message.bytes=5242880','Completed updating config for topic perf.','允许该主题接收更大的批次（还需调大生产者 max.request.size）。']]);
Quiz(document.getElementById('qs'),[
['send() 返回时消息已发到 Broker 了吗？',['已发送','通常没有，只是进入累加器','已写入磁盘'],1,''],
['Kafka 4.0 起 linger.ms 的默认值？',['0','5','100'],1,''],
['无 key 消息默认如何分区？',['轮询每条','粘性分区：一个批次一个分区','全部进分区 0'],1,''],
['压缩的效果与什么关系最大？',['批次大小','分区数','副本数'],0,''],
['buffer.memory 满了会怎样？',['丢弃消息','send() 阻塞，超时后抛异常','自动扩容'],1,'']]);
