TITLE='复制：Leader、ISR 与高水位';DESC='Kafka 的持久性来自副本而不是 fsync。本课讲 Follower 如何拉取 Leader 的数据、什么样的副本算“同步”、高水位（HW）和日志末端偏移量（LEO）如何前进以及为什么消费者只能读到 HW，Leader 切换时如何用 Leader epoch 截断日志避免不一致，以及 unclean 选举和机架感知。';NEXT='KRaft：控制器与元数据日志';MIN=65
SUM=['每个分区的副本中有一个 <b>Leader</b> 处理所有写入（默认也处理读取），<b>Follower</b> 像消费者一样向 Leader 发送 Fetch 请求，拉取并追加到自己的日志。',
'<b>ISR</b>（in-sync replicas）：与 Leader 保持同步的副本集合（包括 Leader）。Follower 在 <code>replica.lag.time.max.ms</code>（默认 30 秒）内没有追上 Leader 的末尾，就被移出 ISR；追上后重新加入。ISR 的变化由 Leader 提交给控制器记录在元数据中。',
'<b>LEO</b>（log end offset）是每个副本日志中下一条消息的位置；<b>高水位 HW</b> 是 ISR 中所有副本 LEO 的最小值。HW 之前的消息已被全部 ISR 复制，称为“已提交”，<code>acks=all</code> 的写入在 HW 越过它后才确认；消费者只能读到 HW 之前，这样 Leader 切换后消费者读到过的消息不会消失。',
'Follower 通过下一次 Fetch 的响应得知新的 HW，所以 Follower 的 HW 会稍落后于 Leader。旧版本仅靠 HW 截断会在连续故障时丢数据或产生分歧，现在使用 <b>Leader epoch</b>：每次选出新 Leader，epoch 加 1，并记录该 epoch 的起始偏移量；Follower 重新加入时询问新 Leader“我的最后一个 epoch 在你那里结束于哪里”，把超出部分截断，再继续复制。',
'Leader 宕机时，控制器从 ISR 中选新 Leader，所以已提交的消息不会丢。如果 ISR 中没有存活副本：默认 <code>unclean.leader.election.enable=false</code>，分区不可用，直到 ISR 中的副本恢复；设为 true 则允许不同步的副本成为 Leader，换取可用性但会丢失消息。Kafka 4.x 还引入了 ELR（Eligible Leader Replicas，KIP-966），在 ISR 缩小后仍记住可以安全当选的副本。',
'<b>机架感知</b>：为 Broker 设置 <code>broker.rack</code>（如可用区），创建主题时副本会分布在不同机架。消费者设置 <code>client.rack</code>，并在 Broker 上配置 <code>replica.selector.class=org.apache.kafka.common.replica.RackAwareReplicaSelector</code>，可以从同机架的 Follower 读取，节省跨可用区流量。']
def secs(prac,E):
    return [
('LEO、HW 与一次写入','三个副本，acks=all。','<div id="p1"></div>'),
('动手：ISR 变化与高水位','三个副本。点击事件，看每个副本的 LEO、ISR 和 HW。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('Leader epoch 与截断','旧 Leader 恢复后的数据处理。','<div id="p2"></div>'),
('相关命令','观察复制状态。','<div id="t4"></div>'),
('在你的电脑上练习','三节点集群（第 2 课），在 k1 中 cd /opt/kafka; B="--bootstrap-server k1:19092"。',prac([
 ('创建主题并写入。','bin/kafka-topics.sh $B --create --topic rep --partitions 1 --replication-factor 3 --config min.insync.replicas=2\nbin/kafka-producer-perf-test.sh --topic rep --num-records 10000 --record-size 100 --throughput -1 --producer-props bootstrap.servers=k1:19092','Created topic rep.\n10000 records sent …'),
 ('查看 Leader 与 ISR。','bin/kafka-topics.sh $B --describe --topic rep','\tTopic: rep\tPartition: 0\tLeader: 3\tReplicas: 3,1,2\tIsr: 3,1,2\tElr: \tLastKnownElr: '),
 ('查看每个副本的 LEO 与落后量。','bin/kafka-log-dirs.sh $B --describe --topic-list rep | tail -n 1 | python3 -m json.tool | grep -E "broker|offsetLag"','"broker": 1, … "offsetLag": 0 …'),
 ('停掉 Leader 所在的 Broker（假设是 k3），再查看。','docker compose stop k3\nbin/kafka-topics.sh $B --describe --topic rep','\tTopic: rep\tPartition: 0\tLeader: 1\tReplicas: 3,1,2\tIsr: 1,2 …'),
 ('写入更多数据后恢复 k3，查看 epoch 文件。','bin/kafka-producer-perf-test.sh --topic rep --num-records 1000 --record-size 100 --throughput -1 --producer-props bootstrap.servers=k1:19092\ndocker compose start k3\ncat /tmp/kraft-combined-logs/rep-0/leader-epoch-checkpoint','…\n0\n2\n0 0\n1 10000'),
 ('看哪些分区副本不足（巡检）。','bin/kafka-topics.sh $B --describe --under-min-isr-partitions\nbin/kafka-topics.sh $B --describe --unavailable-partitions','（无输出：k3 已追上）')],
 ('为跨可用区部署选择复制配置','一个集群部署在三个可用区，每个区 2 台 Broker。核心主题要求：任意一个可用区整体故障时可读可写、已确认的数据不丢；消费者大多和 Broker 在同一个区，跨区流量很贵。写出 Broker、主题、生产者和消费者的相关配置，并说明一个区故障时会发生什么。',
 '<ul><li>Broker：<code>broker.rack=az-a/az-b/az-c</code>；<code>replica.selector.class=org.apache.kafka.common.replica.RackAwareReplicaSelector</code>；<code>unclean.leader.election.enable=false</code>。</li><li>主题：<code>replication.factor=3</code>（机架感知分配保证三个副本在三个不同的区），<code>min.insync.replicas=2</code>。</li><li>生产者：<code>acks=all</code>、幂等（默认）。确认时数据至少在两个区。</li><li>消费者：<code>client.rack=&lt;所在区&gt;</code>，从同区副本读取（Follower 读取到的数据仍受 HW 限制）。</li><li>一个区故障：每个分区失去一个副本，ISR 剩 2 个 ≥ 2，读写继续；原 Leader 在该区的分区由控制器在剩余 ISR 中选新 Leader，客户端短暂重试后恢复。该区恢复后副本追上并回到 ISR，首选 Leader 选举恢复均衡。若再失去一个区则 ISR 为 1 &lt; 2，写入失败但已确认数据不丢。生产者跨区写入 Leader 的流量无法避免。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
