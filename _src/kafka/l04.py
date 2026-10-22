TITLE='生产者：发送流程、分区器与批处理';DESC='调用 send() 并不会立刻发出一个网络请求。本课跟着一条消息走一遍生产者内部：序列化、选择分区、进入按分区组织的记录累加器、由 Sender 线程按 Broker 合并成请求发送，以及 batch.size、linger.ms、压缩和 buffer.memory 如何决定吞吐和延迟。';NEXT='生产者可靠性：acks、重试与幂等';MIN=60
SUM=['<code>send(record)</code> 在调用线程中完成：拦截器 → key/value 序列化 → <b>分区器</b>选分区 → 追加到<b>记录累加器</b>（RecordAccumulator）中该分区的当前批次，然后立即返回一个 Future；真正的网络发送由后台 <b>Sender 线程</b>完成。',
'分区规则：指定了分区就用它；有 key 时用 <code>murmur2(keyBytes) % 分区数</code>；没有 key 时使用<b>粘性分区</b>：一直往同一个分区追加，直到当前批次满或被发送，再换分区（Kafka 3.3 起还会避开响应慢的 Broker）。这样无 key 消息也能凑成大批次。',
'批次在满足任一条件时可以发送：达到 <code>batch.size</code>（默认 16384 字节）；等待超过 <code>linger.ms</code>（Kafka 4.0 起默认 5 ms，之前为 0）。Sender 把发往同一个 Broker 的多个分区的批次合并成一个 ProduceRequest，每个连接最多 <code>max.in.flight.requests.per.connection</code>（默认 5）个未完成请求。',
'<b>压缩</b>（<code>compression.type</code>：none、gzip、snappy、lz4、zstd）按批次进行，批次越大压缩率越高。CPU 花在生产者上，Broker 通常原样存储，网络和磁盘都受益。日志类数据常用 lz4 或 zstd。',
'累加器总大小由 <code>buffer.memory</code>（默认 32 MB）限制；满了以后 send() 阻塞，最多 <code>max.block.ms</code>（默认 60 秒）后抛异常。单条消息上限 <code>max.request.size</code>（默认 1 MB），还要与 Broker/主题的 <code>message.max.bytes</code> 一致。',
'回调（或 Future）在收到 Broker 响应后触发，在 Sender 线程（I/O 线程）中执行，所以回调里不要做慢操作。<code>flush()</code> 立即发送所有批次并等待完成；<code>close()</code> 前会 flush。生产者是线程安全的，一个进程通常共用一个实例。']
def secs(prac,E):
    return [
('一条消息在生产者里的路径','从 send() 返回到 Broker 确认。','<div id="p1"></div>'),
('动手：batch.size 与 linger.ms','每秒 2000 条、每条 500 字节，发往一个分区。调整参数，看批次大小、请求数和增加的延迟。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('分区器','有 key、无 key 和指定分区。','<div id="p2"></div>'),
('相关命令','用性能测试工具比较参数。','<div id="t4"></div>'),
('在你的电脑上练习','在单节点容器的 /opt/kafka 下。',prac([
 ('创建主题。','bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic perf --partitions 6','Created topic perf.'),
 ('linger.ms=0、小批次。','bin/kafka-producer-perf-test.sh --topic perf --num-records 500000 --record-size 200 --throughput -1 --producer-props bootstrap.servers=localhost:9092 linger.ms=0 batch.size=1024','500000 records sent, 61230.1 records/sec (11.68 MB/sec), 312.4 ms avg latency …'),
 ('增大批次并等待 20 ms。','bin/kafka-producer-perf-test.sh --topic perf --num-records 500000 --record-size 200 --throughput -1 --producer-props bootstrap.servers=localhost:9092 linger.ms=20 batch.size=131072','500000 records sent, 412371.1 records/sec (78.66 MB/sec), 45.2 ms avg latency …'),
 ('加上压缩（测试数据是随机字符，压缩率不高；真实 JSON 通常能压缩 3–10 倍）。','bin/kafka-producer-perf-test.sh --topic perf --num-records 500000 --record-size 200 --throughput -1 --producer-props bootstrap.servers=localhost:9092 linger.ms=20 batch.size=131072 compression.type=zstd','500000 records sent, 398000.4 records/sec …'),
 ('查看批次中的记录数。','bin/kafka-dump-log.sh --files /tmp/kraft-combined-logs/perf-0/00000000000000000000.log | sed -n 3p','baseOffset: 0 lastOffset: 607 count: 608 … compresscodec: zstd …'),
 ('用 Python 客户端发送（宿主机，pip install confluent-kafka）。','python3 -c "\nfrom confluent_kafka import Producer\np=Producer({\'bootstrap.servers\':\'localhost:9092\',\'linger.ms\':10})\nfor i in range(3): p.produce(\'perf\',key=f\'o{i}\',value=b\'x\',callback=lambda e,m: print(m.partition(),m.offset()))\np.flush()"','3 0\n1 0\n5 0')],
 ('为两种数据选择生产者参数','① 应用访问日志：每秒 20 万条、每条约 1 KB JSON、能容忍秒级延迟；② 支付指令：每秒 200 条、每条约 2 KB，端到端延迟要求 P99 &lt; 50 ms。分别给出 <code>linger.ms</code>、<code>batch.size</code>、<code>compression.type</code>、<code>buffer.memory</code> 的建议和理由，并说明 key 怎么选。',
 '<ul><li><b>访问日志</b>：<code>linger.ms=50–100</code>，<code>batch.size=256KB–1MB</code>，<code>compression.type=zstd</code>（或 lz4 节省 CPU），<code>buffer.memory=128MB</code> 以上，防止 Broker 短暂变慢时阻塞应用线程。无 key（粘性分区，批次大、分布均匀）；如果下游需要按用户聚合再用用户 ID 作 key。</li><li><b>支付指令</b>：流量小，批次本来就凑不满，<code>linger.ms</code> 保持默认 5 或设为 0–1，避免为等批次增加延迟；<code>batch.size</code> 默认即可；<code>compression.type=lz4</code> 或 none（数据量小，收益不大）；<code>buffer.memory</code> 默认。key 用账户 ID 或支付单号，保证同一账户的指令有序；可靠性配置见下一课（acks=all、幂等）。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
