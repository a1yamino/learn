TITLE='消费者与消费者组';DESC='消费者主动从 Broker 拉取数据。本课讲 poll 循环里发生了什么：拉取请求如何攒批、一次 poll 返回多少条、为什么处理太慢会被踢出组；组协调器如何管理成员和分区分配；并行度的上限在哪里，以及需要更高并行度时的做法，包括 Kafka 4.x 的共享组。';NEXT='再平衡：协议、分配策略与 KIP-848';MIN=60
SUM=['消费者的核心是一个循环：<code>while (running) { records = consumer.poll(Duration.ofMillis(500)); 处理; 提交偏移量 }</code>。Kafka 是<b>拉模式</b>：消费者按自己的速度读取，Broker 不需要跟踪每个消费者的推送状态。',
'拉取在后台按分区 Leader 合并：<code>fetch.min.bytes</code>（默认 1）和 <code>fetch.max.wait.ms</code>（默认 500）决定 Broker 等多少数据再返回；<code>max.partition.fetch.bytes</code>（默认 1 MB）和 <code>fetch.max.bytes</code>（默认 50 MB）限制大小。拉回的数据缓存在消费者内，每次 poll 最多返回 <code>max.poll.records</code>（默认 500）条。',
'消费者只能读到<b>高水位</b>（已被 ISR 全部复制的位置）之前的消息，事务主题在 <code>read_committed</code> 下还要排除未提交的事务（第 9、11 课）。',
'每个组有一个<b>组协调器</b>（某个 Broker，由组 ID 的哈希决定 <code>__consumer_offsets</code> 的哪个分区，其 Leader 即协调器）。消费者通过心跳表明存活：超过 <code>session.timeout.ms</code>（默认 45 秒）没有心跳被认为宕机；两次 poll 间隔超过 <code>max.poll.interval.ms</code>（默认 5 分钟）被认为处理卡住，主动离开组。两种情况都会触发分区重新分配。',
'<b>并行度</b>：组内每个分区同时只属于一个消费者，所以活跃消费者数 ≤ 分区数。单个消费者处理慢时可以在实例内使用线程池并行处理（注意每个分区内的顺序和提交位置），或者增加分区。<code>KafkaConsumer</code> 不是线程安全的，只能由一个线程调用。',
'<b>共享组</b>（share group，KIP-932，Kafka 4.x 引入）：组内多个消费者可以同时消费同一个分区，按单条消息确认、失败可重新投递，行为更像传统队列，适合不要求顺序、需要超过分区数并行的任务处理。']
def secs(prac,E):
    return [
('poll 循环','拉取、缓存、返回、处理、提交。','<div id="p1"></div>'),
('动手：分区与消费者数量','主题有 6 个分区。改变组内消费者数量，看分配结果。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('处理太慢会被踢出','max.poll.interval.ms 与心跳。','<div id="p2"></div>'),
('相关命令','观察组与成员。','<div id="t4"></div>'),
('在你的电脑上练习','单节点容器即可。打开三个终端，都执行 docker exec -it kafka bash 并 cd /opt/kafka。',prac([
 ('创建 6 个分区的主题并写入数据。','bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic jobs --partitions 6\nbin/kafka-producer-perf-test.sh --topic jobs --num-records 60000 --record-size 50 --throughput 200 --producer-props bootstrap.servers=localhost:9092 &','Created topic jobs.'),
 ('终端 1：启动组 w 中的一个消费者。','bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic jobs --group w > /dev/null','（持续运行）'),
 ('终端 3：查看分配。','bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group w --members --verbose','GROUP CONSUMER-ID … #PARTITIONS ASSIGNMENT\nw     console-…a1  … 6           jobs(0,1,2,3,4,5)'),
 ('终端 2：再启动一个，然后再看分配。','bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic jobs --group w > /dev/null\n# 终端 3：\nbin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group w --members --verbose','w     console-…a1  … 3           jobs(0,1,2)\nw     console-…b7  … 3           jobs(3,4,5)'),
 ('停掉终端 1（Ctrl-C），分区转给另一个消费者。','bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group w --members --verbose','w     console-…b7  … 6           jobs(0,1,2,3,4,5)'),
 ('查看组的状态与协议类型。','bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group w --state','GROUP COORDINATOR (ID)    ASSIGNMENT-STRATEGY STATE  #MEMBERS\nw     localhost:9092 (1)   range               Stable 1')],
 ('设计一个图片处理服务的消费方式','主题 <code>image-tasks</code> 有 12 个分区，每条消息是一张待处理图片，处理一张需要 0.5–20 秒（平均 2 秒），峰值每秒 100 张；任务之间没有顺序要求，个别图片处理失败需要重试 3 次。现在用 12 个消费者实例、每个单线程处理，积压严重。分析瓶颈并给出至少两种方案，说明各自需要注意的配置。',
 '<ul><li>瓶颈：每秒 100 张 × 2 秒 = 需要约 200 个并行处理单元，而 12 个分区 × 单线程只有 12 个。另外单张 20 秒、<code>max.poll.records=500</code> 时一次 poll 的处理时间可能远超 <code>max.poll.interval.ms</code>，导致消费者被踢出、反复再平衡。</li><li><b>方案 1：增加分区 + 实例</b>：分区扩到 240 以上（无 key，扩分区无顺序问题），部署 200 个实例。简单，但实例多、分区多有成本。</li><li><b>方案 2：实例内线程池</b>：每个实例 poll 后把记录交给 20 个线程的线程池并行处理；<code>max.poll.records</code> 调小（如 20），只在一批全部处理完后提交偏移量；处理期间用 <code>pause()</code> 暂停拉取、继续调用 poll 维持存活，完成后 <code>resume()</code>。失败的图片发到重试主题（第 23 课）。</li><li><b>方案 3：共享组</b>：用 Kafka 4.x 的共享组，多个消费者同时消费同一分区，逐条确认，失败可重新投递并限制投递次数，天然符合“无顺序要求的任务队列”。</li><li>任一方案都要：处理幂等（同一图片可能被处理两次），设置合理的 <code>max.poll.interval.ms</code>，监控 LAG。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
