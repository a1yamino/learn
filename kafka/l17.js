const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=120)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={d:B('磁盘',''),pc:B('页缓存','内核'),ub:B('用户缓冲区','JVM 堆','bad'),sb:B('socket 缓冲区','内核'),nic:B('网卡',''),t1:P('read()：内核 → 用户空间（拷贝）','bad'),t2:P('write()：用户空间 → socket（拷贝），再到网卡；共 4 次拷贝、4 次上下文切换','bad'),z:P('sendfile()：页缓存 → 网卡（DMA），数据不进入用户空间','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'传统方式',p:'应用先把文件读进自己的缓冲区，再写到 socket。',set:{d:[0,0],pc:[140,0],ub:[280,0],sb:[420,0],nic:[420,70],t1:[0,140]}},
 {t:'两次额外拷贝',p:'数据在内核与用户空间之间来回拷贝，还要经过 JVM 堆和 GC。',d:3800,set:{d:[0,0],pc:[140,0],ub:[280,0],sb:[420,0],nic:[420,70],t1:[0,140],t2:[0,180]}},
 {t:'零拷贝',p:'Kafka 用 transferTo（sendfile），数据直接从页缓存发往网卡。消费者越多，节省越明显。',d:4000,set:{d:[0,0],pc:[140,0,B('页缓存','命中','ok')],nic:[420,70],z:[0,140]}}]});
(()=>{const S=[['实时（落后 1 秒）','需要的数据：最近 200 MB\n页缓存可用约 50 GB（≈ 4 分钟写入量）\n→ 全部命中页缓存，零磁盘读取','ok','最理想的状态：读写都在内存中完成。'],['落后 2 分钟','需要的数据：最近 24 GB\n→ 仍在页缓存中','ok','页缓存越大，容忍的落后越多。'],['落后 1 小时','需要的数据：1 小时前开始的 720 GB\n→ 页缓存未命中，从磁盘读取\n读取的冷数据进入页缓存，挤出最新的数据','bad','落后的消费者会拖慢实时消费者：实时数据被挤出页缓存，也开始读磁盘。'],['落后 1 小时 + 分层存储','旧段在对象存储中\n→ Broker 从远程拉取，不污染本地页缓存的热数据（远程读有独立缓存）','sig','冷读与热读隔离；单次读取延迟更高。'],['堆设为 48 GB','页缓存只剩约 10 GB（≈ 50 秒写入量）\n→ 落后 1 分钟就开始读盘，GC 停顿也变长','bad','不要给 Broker 很大的堆。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r;m.className='msg '+c;m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择消费者的状态。'})();
const e2={p:B('生产者','攒批 + lz4 压缩'),b:B('Broker','校验后原样写入'),f:B('Follower','原样复制'),c:B('消费者','按批拉取、解压'),n:P('批次在整个链路中只压缩一次、只解压一次','ok'),x:P('主题 compression.type=gzip 而生产者用 lz4 → Broker 解压再压缩：CPU 暴涨、零拷贝的好处被抵消','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'生产',p:'生产者把多条消息压缩成一个批次。',set:{p:[0,0]}},
 {t:'存储',p:'Broker 校验批次（CRC、偏移量分配）后直接追加，不解压每条记录。',d:3400,set:{p:[0,0],b:[140,0],f:[280,0]}},
 {t:'消费',p:'消费者收到的就是这个压缩批次。',d:3400,set:{p:[0,0],b:[140,0],f:[280,0],c:[420,0],n:[0,70]}},
 {t:'反例',p:'压缩格式不一致会迫使 Broker 重新压缩。',d:3600,set:{p:[0,0],b:[140,0,B('Broker','解压 + 重压缩','bad')],x:[0,70]}}]});
Term(document.getElementById('t4'),[
['bin/kafka-consumer-perf-test.sh --bootstrap-server localhost:9092 --topic bench --messages 1000000 --consumer.config c.properties','start.time, end.time, data.consumed.in.MB, MB.sec, data.consumed.in.nMsg, nMsg.sec, …','消费者压测（c.properties 中可设 fetch.min.bytes 等）。'],
['bin/kafka-e2e-latency.sh localhost:9092 bench 10000 all 512','… Avg latency: 3.2100 ms\nPercentiles: 50th = 3, 99th = 9, 99.9th = 21','端到端延迟。'],
['free -g; cat /proc/meminfo | grep -E "^(Cached|Dirty)"','              total  used  free  shared  buff/cache  available\nMem:             62     7     1       0          54         54\nCached:  56123456 kB\nDirty:     152340 kB','Broker 机器上的页缓存与脏页。'],
['sysctl vm.swappiness vm.max_map_count; ulimit -n','vm.swappiness = 1\nvm.max_map_count = 262144\n100000','关键内核参数。']]);
Quiz(document.getElementById('qs'),[
['Kafka 消费快的主要原因？',['JVM 缓存','页缓存 + 零拷贝 + 批量','每次 fsync'],1,''],
['启用 TLS 后零拷贝？',['仍然有效','失效，需要在用户空间加密','更快'],1,''],
['Broker 的 JVM 堆应该？',['尽量大','适中（如 6 GB），留内存给页缓存','和内存一样大'],1,''],
['主题 compression.type 推荐？',['gzip','producer（保留生产者格式）','none'],1,''],
['落后很多的消费者对实时消费者的影响？',['没有影响','挤出页缓存，导致实时消费也读盘','提高命中率'],1,'']]);
