TITLE='Kafka 是什么：日志、主题与分区';DESC='Kafka 是一个分布式的、持久化的提交日志：生产者把消息追加到日志末尾，消费者按自己的进度读取，读过的消息不会被删除。本课讲清楚这个模型和消息队列的区别，介绍主题、分区、偏移量、Broker、副本和消费者组这几个核心概念，以及 Kafka 4.x 的版本现状（KRaft 取代 ZooKeeper）。';NEXT='动手：命令行工具与第一个主题';MIN=50
SUM=['Kafka 的核心是<b>日志</b>：只追加、不可修改、按顺序编号的记录序列。每条记录在分区中的编号叫<b>偏移量</b>（offset）。消费不会删除消息，消息按保留策略（时间或大小）过期。',
'<b>主题</b>（topic）是一类消息的名字，例如 <code>orders</code>。一个主题分成多个<b>分区</b>（partition），每个分区是一条独立的日志。顺序只在分区内保证；相同 key 的消息默认进入同一个分区，所以同一个订单的事件是有序的。',
'<b>Broker</b> 是 Kafka 服务器进程。每个分区有多个<b>副本</b>分布在不同 Broker 上，其中一个是 Leader，负责读写；其余是 Follower，复制 Leader 的数据（第 9 课）。',
'<b>消费者组</b>：同一组内的消费者分摊一个主题的分区，每个分区同一时刻只被组内一个消费者读取；不同组互不影响，各自读到全部消息。组的消费进度（每个分区的偏移量）保存在内部主题 <code>__consumer_offsets</code> 中。',
'与传统消息队列（RabbitMQ 等）的区别：消息被持久保存、可以回放；多个消费者组独立读取同一份数据；按分区顺序读、批量读写，吞吐量很高；但不支持按单条消息确认和删除、没有内建的延迟消息和优先级。',
'版本：Kafka 4.0（2025 年 3 月）起完全移除 ZooKeeper，只支持 <b>KRaft</b> 模式（元数据由 Kafka 自己的 Raft 控制器管理，第 10 课），并默认启用新的消费者再平衡协议。本课程使用 2026 年 10 月发布的 4.4.0（Docker 镜像 <code>apache/kafka:4.4.0</code>）；Kafka 采用 Apache License 2.0。']
def secs(prac,E):
    return [
('日志：只追加，按偏移量读','生产者写到末尾，消费者各自记住读到哪里。','<div id="p1"></div>'),
('主题、分区与消费者组','分区是并行和顺序的单位。','<div id="p2"></div>'),
('动手：key 决定分区','主题 orders 有 3 个分区。点击发送消息，观察 key 相同的消息落在哪里，以及每个分区内的顺序。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:100px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('看一看集群里有什么','几个只读命令（在容器的 /opt/kafka 下执行）。','<div id="t4"></div>'),
('在你的电脑上练习','启动一个单节点 Kafka（KRaft 模式，镜像自带默认配置）。',prac([
 ('启动 Kafka。','docker run -d --name kafka -p 9092:9092 apache/kafka:4.4.0\ndocker logs kafka 2>&1 | grep "Kafka Server started"','… [KafkaRaftServer nodeId=1] Kafka Server started (kafka.server.KafkaRaftServer)'),
 ('进入容器，命令行工具在 /opt/kafka/bin。','docker exec -it kafka bash\ncd /opt/kafka\nbin/kafka-topics.sh --version','4.4.0'),
 ('创建一个 3 分区的主题。','bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic orders --partitions 3 --replication-factor 1','Created topic orders.'),
 ('带 key 发送几条消息（key 与值用冒号分隔，输入后按 Ctrl-D）。','bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic orders --property parse.key=true --property key.separator=:\no1:created\no2:created\no1:paid','>>>'),
 ('从头读取，显示分区和偏移量。','bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --from-beginning --property print.key=true --property print.partition=true --property print.offset=true --timeout-ms 5000','Partition:0\tOffset:0\to2\tcreated\nPartition:2\tOffset:0\to1\tcreated\nPartition:2\tOffset:1\to1\tpaid\nProcessed a total of 3 messages'),
 ('再读一遍：消息没有被删除。','bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic orders --from-beginning --timeout-ms 5000 | wc -l','3')],
 ('为一个外卖系统划分主题','外卖平台有这些事件：用户下单、支付成功、商家接单、骑手位置（每 3 秒一次，每秒 5 万条）、订单完成、用户评价。消费方：订单状态服务（要按订单顺序处理）、数据仓库（要全部数据）、骑手地图（只关心最新位置）。请设计主题、每个主题的 key，并说明顺序和消费者组的安排。',
 '<ul><li><code>order-events</code>：下单、支付、接单、完成都是同一个订单的状态变化，放在一个主题，key 为订单号，保证同一订单的事件在同一分区内有序。分区数按吞吐估算（如 12）。</li><li><code>rider-locations</code>：量大、语义不同，单独一个主题，key 为骑手 ID，分区多一些（如 48）；保留时间短（几小时），或开启压缩只保留每个骑手最新位置（第 12 课）。</li><li><code>reviews</code>：评价，key 为订单号或商家 ID。</li><li>消费者组：<code>order-status</code> 组读 order-events；<code>dwh</code> 组读全部三个主题；<code>rider-map</code> 组读 rider-locations。三个组互不影响，各自拥有完整数据。</li><li>不需要“全局顺序”：只有同一订单内的顺序有意义，用 key 就能保证；全局有序要求单分区，会失去并行能力。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
