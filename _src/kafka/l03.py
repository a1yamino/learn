TITLE='日志存储：分区、段与索引';DESC='Kafka 的高吞吐来自它简单的存储结构。本课打开一个分区目录，看日志如何被切成多个段文件、每个段的稀疏偏移量索引和时间索引如何把“读偏移量 N”变成一次二分查找加一次顺序读，记录批次（RecordBatch）的格式，以及段如何滚动和被删除。';NEXT='生产者：发送流程、分区器与批处理';MIN=60
SUM=['每个分区在 Broker 的 <code>log.dirs</code> 下有一个目录，如 <code>orders-0/</code>。分区被切成多个<b>段</b>（segment），每个段由同名的三个文件组成：<code>00000000000000000000.log</code>（数据）、<code>.index</code>（偏移量索引）、<code>.timeindex</code>（时间索引），文件名是该段第一条记录的偏移量（base offset）。',
'只有最后一个段（活跃段）可以写入，写入就是追加到文件末尾。段达到 <code>segment.bytes</code>（默认 1 GB）或 <code>segment.ms</code>（默认 7 天）时滚动出新段。保留策略以段为单位删除：整个段都过期才删，所以实际保留时间会比 <code>retention.ms</code> 稍长。',
'<b>偏移量索引是稀疏的</b>：每写入约 <code>index.interval.bytes</code>（默认 4 KB）数据才加一项“相对偏移量 → 文件位置”。查找偏移量 N：先按文件名二分找到段，再在索引中二分找到不大于 N 的最近一项，然后从该位置顺序扫描。索引文件通过 mmap 映射到内存。',
'<b>时间索引</b>记录“时间戳 → 偏移量”，支持 <code>offsetsForTimes</code>（按时间查找起点）和基于时间的保留。',
'数据以 <b>RecordBatch</b> 为单位存储：批次头包含 baseOffset、长度、分区 Leader epoch、魔数 2、CRC、属性（压缩类型、是否事务、是否控制批次）、producerId/epoch/baseSequence（幂等与事务，第 5、11 课），后面是若干条记录（各自用变长整数存相对偏移量、时间戳增量、key、value、headers）。压缩以批次为单位，Broker 一般原样存储生产者发来的压缩批次。',
'Kafka 不自己缓存数据，依靠操作系统的<b>页缓存</b>：刚写入的数据在页缓存里，跟得上的消费者直接从内存读；fsync 默认交给操作系统，持久性靠副本保证（第 9、17 课）。']
def secs(prac,E):
    return [
('段、索引与一次查找','读偏移量 2357 的过程。','<div id="p1"></div>'),
('动手：在稀疏索引中查找','一个段的 base offset 为 2000，索引每隔约 100 条有一项。输入偏移量，看查找的步骤。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('段的滚动与删除','保留策略以段为单位工作。','<div id="p2"></div>'),
('相关命令','查看段文件的内容。','<div id="t4"></div>'),
('在你的电脑上练习','用第 1 课的单节点容器（docker start kafka），进入 /opt/kafka。',prac([
 ('创建段很小的主题，便于观察滚动。','bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic seg --partitions 1 --config segment.bytes=102400','Created topic seg.'),
 ('写入 5000 条 100 字节的消息。','bin/kafka-producer-perf-test.sh --topic seg --num-records 5000 --record-size 100 --throughput -1 --producer-props bootstrap.servers=localhost:9092','5000 records sent …'),
 ('查看分区目录（镜像默认的 log.dirs 是 /tmp/kraft-combined-logs）。','ls -l /tmp/kraft-combined-logs/seg-0/','00000000000000000000.index\n00000000000000000000.log\n00000000000000000000.timeindex\n00000000000000000903.index\n00000000000000000903.log\n…\nleader-epoch-checkpoint\npartition.metadata'),
 ('查看批次头。','bin/kafka-dump-log.sh --files /tmp/kraft-combined-logs/seg-0/00000000000000000000.log | head -n 4','Dumping …/00000000000000000000.log\nLog starting offset: 0\nbaseOffset: 0 lastOffset: 151 count: 152 baseSequence: 0 lastSequence: 151 producerId: 0 producerEpoch: 0 partitionLeaderEpoch: 0 isTransactional: false … position: 0 CreateTime: 1761124800123 size: 16209 magic: 2 compresscodec: none crcValid: true'),
 ('查看稀疏索引。','bin/kafka-dump-log.sh --files /tmp/kraft-combined-logs/seg-0/00000000000000000000.index | head -n 4','Dumping …/00000000000000000000.index\noffset: 152 position: 16209\noffset: 304 position: 32418\noffset: 456 position: 48627'),
 ('按时间查找偏移量。','bin/kafka-get-offsets.sh --bootstrap-server localhost:9092 --topic seg --time -1\nbin/kafka-get-offsets.sh --bootstrap-server localhost:9092 --topic seg --time 1761124800000','seg:0:5000\nseg:0:0')],
 ('估算段与索引','一个分区每秒写入 5 MB，<code>segment.bytes</code> 为默认 1 GB，<code>retention.ms</code> 为 3 天，<code>index.interval.bytes</code> 为 4 KB。估算：① 多久滚动一个段；② 稳定时该分区有多少个段、占多少磁盘；③ 每个段的偏移量索引大约有多少项、多大（每项 8 字节）；④ 如果流量降到每秒 10 KB，保留会有什么变化，怎么处理。',
 '<ol><li>1 GB ÷ 5 MB/s ≈ 205 秒，约 3.4 分钟滚动一次。</li><li>3 天 = 259200 秒，约 1265 个段，加上活跃段；磁盘约 5 MB × 259200 ≈ 1.24 TB（每个副本）。</li><li>1 GB ÷ 4 KB ≈ 26 万项 × 8 字节 ≈ 2 MB；索引文件预分配 <code>segment.index.bytes</code>（默认 10 MB），段关闭时截断到实际大小。</li><li>每秒 10 KB 时写满 1 GB 要约 29 小时，但 <code>segment.ms</code> 默认 7 天，所以段通常按大小滚动；保留按“整个段过期”删除，最旧的消息可能在 3 天 + 约 29 小时后才被删除。如需更精确的保留（例如合规要求），把 <code>segment.ms</code> 设为 1 天或更小（段太多也会增加文件句柄和恢复时间）。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
