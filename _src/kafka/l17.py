TITLE='性能调优：零拷贝、页缓存与批量';DESC='一个普通的 Kafka 集群每台机器每秒能处理几百 MB 数据，靠的不是复杂的优化，而是几个简单的设计：顺序读写、依赖操作系统页缓存、用 sendfile 零拷贝把数据从磁盘直接送到网卡、以及端到端的批量和压缩。本课讲这些机制，然后给出生产者、Broker、消费者和操作系统层面的调优清单，以及如何用压测验证。';NEXT='监控与消费延迟';MIN=65
SUM=['<b>顺序 I/O</b>：写入只追加到活跃段末尾，读取按偏移量顺序进行。即使在机械硬盘上顺序读写也能达到几百 MB/s，SSD 更高。',
'<b>页缓存</b>：Kafka 写入时只调用 write 进入操作系统页缓存，由内核异步刷盘（<code>log.flush.*</code> 默认不强制 fsync，持久性依靠副本）。跟得上的消费者读取的正是刚写入、仍在页缓存中的数据，完全不碰磁盘。因此 Broker 的 JVM 堆通常只给 4–8 GB，其余内存留给页缓存；页缓存命中率是消费性能的关键。',
'<b>零拷贝</b>：Broker 向消费者（和 Follower）发送数据时使用 <code>sendfile</code>（Java 的 <code>FileChannel.transferTo</code>），数据从页缓存直接进入网卡，不经过用户空间和 JVM 堆。前提是 Broker 不需要解开数据：批次以生产者写入的格式原样存储和发送。启用 TLS 时需要在用户空间加密，零拷贝失效，CPU 开销上升。',
'<b>端到端批量与压缩</b>：生产者凑批（<code>linger.ms</code>、<code>batch.size</code>）并压缩，Broker 原样存储，消费者按批拉取（<code>fetch.min.bytes</code>、<code>fetch.max.wait.ms</code>）后在客户端解压。如果主题的 <code>compression.type</code> 与生产者不同（且不是 <code>producer</code>），Broker 就要解压再压缩，消耗大量 CPU。',
'Broker 调优要点：<code>num.network.threads</code>（处理网络请求，默认 3）和 <code>num.io.threads</code>（处理磁盘，默认 8）按 CPU 和磁盘数调整；多个数据盘配置多个 <code>log.dirs</code>；<code>num.replica.fetchers</code> 增加复制线程；<code>socket.send.buffer.bytes</code> 等在高延迟网络中调大。分区数要适中：每个分区都有文件句柄、内存和元数据开销。',
'操作系统：XFS 或 ext4，挂载时 <code>noatime</code>；<code>vm.swappiness=1</code>；<code>vm.dirty_background_ratio</code> 和 <code>vm.dirty_ratio</code> 适当调低让刷盘更平滑；文件句柄数（<code>ulimit -n</code>）至少 10 万，<code>vm.max_map_count</code>（每个段的索引都会 mmap）调大。用 <code>kafka-producer-perf-test.sh</code> 与 <code>kafka-consumer-perf-test.sh</code> 在接近生产的条件下压测，一次只改一个参数。']
def secs(prac,E):
    return [
('传统读取与零拷贝','把文件数据发送到网络。','<div id="p1"></div>'),
('动手：消费者落后时会怎样','一台 Broker 有 64 GB 内存，堆 6 GB；写入 200 MB/s。选择消费者的落后程度，看数据从哪里读取。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('端到端批量','一个批次从生产者到消费者都保持原样。','<div id="p2"></div>'),
('相关命令','压测与观察。','<div id="t4"></div>'),
('在你的电脑上练习','单节点容器，用自带的压测工具。',prac([
 ('创建主题。','bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic bench --partitions 6','Created topic bench.'),
 ('生产者压测：不压缩。','bin/kafka-producer-perf-test.sh --topic bench --num-records 2000000 --record-size 512 --throughput -1 --producer-props bootstrap.servers=localhost:9092 linger.ms=10 batch.size=262144','2000000 records sent, 351234.6 records/sec (171.50 MB/sec), …'),
 ('消费者压测（数据在页缓存中）。','bin/kafka-consumer-perf-test.sh --bootstrap-server localhost:9092 --topic bench --messages 2000000 --show-detailed-stats --reporting-interval 5000 | tail -n 2','… 977.0 MB … 512.3 MB/sec …'),
 ('主题级压缩与生产者不一致：在宿主机另一个终端运行 docker stats 观察 Broker CPU。','bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name bench --alter --add-config compression.type=gzip\nbin/kafka-producer-perf-test.sh --topic bench --num-records 1000000 --record-size 512 --throughput -1 --producer-props bootstrap.servers=localhost:9092 compression.type=lz4 linger.ms=10 batch.size=262144\n# 宿主机：docker stats --no-stream kafka','… CPU % 大幅上升 …'),
 ('改回 producer（保留生产者的压缩格式）。','bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name bench --alter --add-config compression.type=producer','Completed updating config for topic bench.'),
 ('查看网络与 I/O 线程配置。','bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type brokers --entity-name 1 --describe --all | grep -E "num.(network|io).threads"','num.io.threads=8 …\nnum.network.threads=3 …')],
 ('为一个日志集群做容量规划','需求：峰值写入 600 MB/s（压缩前，压缩率约 4 倍），副本因子 3，保留 3 天；有 3 个消费者组都会读取全部数据；消费者通常实时，但每天会有一个离线任务从 24 小时前开始重读。估算：总磁盘、每台 Broker 的网络带宽（假设 6 台 Broker）、内存需求，并指出最可能成为瓶颈的地方。',
 '<ul><li><b>写入</b>：压缩后 150 MB/s。磁盘写入 = 150 × 3（副本）= 450 MB/s，集群 3 天 ≈ 150 MB × 259200 × 3 ≈ 117 TB，再留 30% 余量约 150 TB，每台约 25 TB。</li><li><b>网络（每台）</b>：入：生产 150/6 = 25 MB/s + 复制入 50 MB/s = 75 MB/s；出：复制 50 MB/s + 3 个消费者组 75 MB/s（+ 离线任务 25 MB/s）≈ 150 MB/s ≈ 1.2 Gb/s。万兆网卡足够，但要留出 Broker 故障和重分配时的余量。</li><li><b>内存</b>：实时消费者读最近几十秒的数据，页缓存只需容纳几分钟的写入：每台 25 MB/s × 300 s ≈ 7.5 GB；64 GB 内存、6 GB 堆绰绰有余。</li><li><b>瓶颈</b>：离线任务读取 24 小时前的数据（每台约 2 TB）不在页缓存中，会产生大量随机/冷读，并把实时数据挤出页缓存，导致实时消费者也去读磁盘，延迟上升。对策：给离线任务限流（客户端配额，第 19 课），使用分层存储让冷读走对象存储，或使用更快的磁盘；如果启用 TLS 还要评估零拷贝失效后的 CPU。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
