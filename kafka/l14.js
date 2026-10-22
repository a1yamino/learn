const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,s,c='',w=150)=>({w,h:44,cls:'blk '+c,html:`${t}<br><span style="font-size:11px;opacity:.7">${s}</span>`});
const e={w1:B('Worker 1','mysql-src task0、es-sink task0'),w2:B('Worker 2','es-sink task1、es-sink task2'),w3:B('Worker 3','es-sink task3'),it:P('connect-configs / connect-offsets / connect-status','sig'),x:P('Worker 2 宕机','bad'),r:P('Task 重新分配：task1 → Worker 1，task2 → Worker 3；从已保存的偏移量继续','ok')};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'集群',p:'三个 Worker 共享 group.id，Task 分布在各 Worker 上。',set:{w1:[0,0],w2:[170,0],w3:[340,0]}},
 {t:'内部主题',p:'配置、Source 偏移量和状态都存在 Kafka 主题中，Worker 本身无状态。',d:3400,set:{w1:[0,0],w2:[170,0],w3:[340,0],it:[0,70]}},
 {t:'故障',p:'一个 Worker 宕机。',d:3000,set:{w1:[0,0],w2:[170,0,B('Worker 2','宕机','bad')],w3:[340,0],x:[0,70]}},
 {t:'重新分配',p:'其余 Worker 接管它的 Task。',d:3800,set:{w1:[0,0,B('Worker 1','… + es-sink task1','ok')],w2:[170,0,B('Worker 2','宕机','bad')],w3:[340,0,B('Worker 3','… + es-sink task2','ok')],r:[0,70]}}]});
const e2={ex:B('外部系统','MySQL / 文件'),sc:B('Source Task','poll() → SourceRecord'),sm:B('SMT 链','逐条转换','sig'),cv:B('Converter','→ 字节'),k:B('Kafka','主题'),s1:P('Source：外部偏移量写入 connect-offsets','sig'),s2:P('Sink：Kafka → Converter → SMT → SinkTask.put() → 外部系统；成功后提交消费者偏移量','sig')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'读取',p:'Source Task 从外部系统读取并生成 SourceRecord（带外部偏移量）。',set:{ex:[0,0],sc:[170,0]}},
 {t:'转换',p:'经过 SMT 修改，再由 Converter 序列化。',d:3400,set:{ex:[0,0],sc:[170,0],sm:[340,0],cv:[340,60]}},
 {t:'写入',p:'框架用生产者写入 Kafka，并定期提交外部偏移量。',d:3400,set:{ex:[0,0],sc:[170,0],sm:[340,0],cv:[340,60],k:[170,60],s1:[0,130]}},
 {t:'Sink',p:'反方向：框架用消费者读取，交给 SinkTask 写出。',d:3800,set:{k:[170,60],s2:[0,130]}}]});
(()=>{const S=[['默认（errors.tolerance=none）','Task 抛出 DataException → 状态 FAILED\n后续消息全部停止，LAG 增长','bad','一条坏消息让整个管道停止，需要人工处理后重启 Task。'],['errors.tolerance=all','坏消息被跳过，Task 继续运行\n没有任何记录','sig','不会卡住，但数据悄悄丢失，难以发现。'],['all + errors.log.enable=true','跳过并在 Worker 日志中记录\n（可加 errors.log.include.messages=true）','sig','能排查，但需要从日志中找回原始数据。'],['all + DLQ 主题 + context headers','坏消息写入 dlq.products-es\nheader：__connect.errors.exception.class.name 等\nTask 继续运行','ok','推荐：可监控、可修复后重放。DLQ 仅适用于 Sink 连接器。'],['ES 返回 503（可重试错误）','errors.retry.timeout=600000：最多重试 10 分钟\n期间不提交偏移量','ok','暂时性错误应该重试而不是丢弃。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 S.forEach(([t,r,c,x])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(y=>y.classList.toggle('pri',y===b));p.textContent=r;m.className='msg '+c;m.innerHTML=x});q.appendChild(b)});
 m.className='msg';m.innerHTML='选择配置。'})();
Term(document.getElementById('t4'),[
['curl -s localhost:8083/connector-plugins','[{"class":"org.apache.kafka.connect.file.FileStreamSinkConnector","type":"sink","version":"4.4.0"}, …]','已安装的插件。'],
['curl -s -X PUT -H "Content-Type: application/json" localhost:8083/connectors/es-sink/config -d @es-sink.json','{"name":"es-sink","config":{…},"tasks":[…],"type":"sink"}','创建或更新连接器（幂等，推荐用 PUT）。'],
['curl -s localhost:8083/connectors/es-sink/status','{"name":"es-sink","connector":{"state":"RUNNING",…},"tasks":[{"id":0,"state":"FAILED","trace":"org.apache.kafka.connect.errors.DataException: …"}]}','查看状态与错误堆栈。'],
['curl -s -X POST "localhost:8083/connectors/es-sink/restart?includeTasks=true&onlyFailed=true"','{"name":"es-sink",…}','只重启失败的 Task。'],
['curl -s -X PUT localhost:8083/connectors/es-sink/pause\ncurl -s localhost:8083/connectors/file-src/offsets','（202）\n{"offsets":[{"partition":{"filename":"/tmp/in.txt"},"offset":{"position":8}}]}','暂停连接器；查看（停止状态下可修改）Source 偏移量。']]);
Quiz(document.getElementById('qs'),[
['分布式模式下 Source 的外部偏移量存在？',['Worker 本地文件','offset.storage.topic','ZooKeeper'],1,''],
['Sink 连接器的消费者组名？',['connect-<连接器名>','sink','随机'],0,''],
['SMT 适合做什么？',['多流关联','轻量的逐条修改','聚合'],1,''],
['死信队列适用于？',['Source 连接器','Sink 连接器','两者'],1,''],
['默认遇到无法转换的消息时？',['跳过','Task 失败停止','写入 DLQ'],1,'']]);
