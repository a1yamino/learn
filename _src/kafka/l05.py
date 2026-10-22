TITLE='生产者可靠性：acks、重试与幂等';DESC='“消息发出去了”到底意味着什么？本课讲 acks 的三种取值分别在什么时候确认、和 min.insync.replicas 一起如何决定能容忍几台机器故障；重试为什么会带来重复和乱序；幂等生产者如何用生产者 ID 和序列号在 Broker 端去重；以及 delivery.timeout.ms 等超时参数之间的关系。';NEXT='消费者与消费者组';MIN=65
SUM=['<code>acks=0</code>：发出即成功，不等响应；<code>acks=1</code>：Leader 写入本地日志就确认，Leader 在 Follower 复制前宕机会丢数据；<code>acks=all</code>（-1）：等 ISR 中所有副本都写入才确认。Kafka 3.0 起生产者默认 <code>acks=all</code>。',
'<code>acks=all</code> 等的是<b>当前 ISR</b>，ISR 可能缩到只剩 Leader。所以要配合主题/Broker 配置 <code>min.insync.replicas</code>（默认 1，常用 2）：ISR 小于它时写入返回 <code>NotEnoughReplicas</code>。副本因子 3 + min.insync.replicas 2 + acks=all：任意一个副本故障仍可写入，且每条确认的消息至少在两台机器上。',
'失败的发送会自动<b>重试</b>：<code>retries</code> 默认为极大值，由 <code>delivery.timeout.ms</code>（默认 120 秒）限制从 send() 到最终成功或失败的总时间；它须不小于 <code>linger.ms + request.timeout.ms</code>（默认 30 秒）。重试间隔 <code>retry.backoff.ms</code>（默认 100 ms，指数退避到 <code>retry.backoff.max.ms</code>）。',
'没有幂等时，重试会造成<b>重复</b>（请求已写入但响应丢失）和<b>乱序</b>（多个在途请求中前一个失败重试、后一个先成功）。',
'<b>幂等生产者</b>（3.0 起默认 <code>enable.idempotence=true</code>）：生产者启动时获得一个 producerId（PID），每个分区的批次带递增的序列号；Broker 为每个 PID+分区记住最近 5 个批次的序列号，重复的直接返回成功，跳号的拒绝。因此要求 <code>acks=all</code>、<code>max.in.flight.requests.per.connection ≤ 5</code>，同时保证单分区内不重复、不乱序。',
'幂等只覆盖<b>单个生产者会话</b>：应用重启后 PID 改变，应用层自己重发的消息仍会重复；跨分区、跨会话的保证需要事务（第 11 课）。最终仍失败的消息（超时、消息过大、无权限）会在回调中报错，应用必须处理：记录、告警、写入备用存储。']
def secs(prac,E):
    return [
('acks 的三种取值','确认发生在哪一刻。','<div id="p1"></div>'),
('动手：能容忍几个副本故障','副本因子 3。选择 acks 和 min.insync.replicas，再让 Broker 故障，看写入是否成功、是否可能丢失。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:100px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('重试、重复与幂等','响应丢失后重发同一个批次。','<div id="p2"></div>'),
('相关命令','配置与观察。','<div id="t4"></div>'),
('在你的电脑上练习','用第 2 课的三节点集群（docker compose up -d），在 k1 中 cd /opt/kafka; B="--bootstrap-server k1:19092"。',prac([
 ('本实验临时用 min.insync.replicas=3，以便只停一台组合节点就触发写入不足，同时保留控制器多数。','bin/kafka-topics.sh $B --create --topic pay --partitions 1 --replication-factor 3 --config min.insync.replicas=3','Created topic pay.'),
 ('acks=all 写入成功。','echo hello | bin/kafka-console-producer.sh $B --topic pay --producer-property acks=all && echo OK','OK'),
 ('在宿主机只停 k3，保留 k1/k2 两个控制器；若同时停两台会失去 KRaft 多数，无法单独观察 ISR 行为。','docker compose stop k3','✔ Container k3 Stopped …'),
 ('等 describe 显示 ISR 为两个节点后再写入：2 小于本实验的 minISR 3。','echo world | bin/kafka-console-producer.sh $B --topic pay --producer-property acks=all --producer-property delivery.timeout.ms=10000 --producer-property request.timeout.ms=5000','ERROR Error when sending message to topic pay … org.apache.kafka.common.errors.NotEnoughReplicasException: Messages are rejected since there are fewer in-sync replicas than required.'),
 ('acks=1 不要求满足 minISR，仍可响应成功；确认时只保证 Leader 已写入。ELR启用时低于minISR可能阻止HW推进，消费者要等同步副本恢复后才能读到。','echo risky | bin/kafka-console-producer.sh $B --topic pay --producer-property acks=1 && echo OK','OK'),
 ('在宿主机恢复 k3 后回到 k1 查看状态。生产常用 RF=3/minISR=2；这里为演示使用了 minISR=3。','docker compose start k3\nbin/kafka-dump-log.sh --files /tmp/kafka-logs/pay-0/00000000000000000000.log | grep producerId','… producerId: 1000 producerEpoch: 0 … baseSequence: 0 …\n… producerId: 1002 producerEpoch: 0 … baseSequence: 0 …')],
 ('给订单服务配置生产者','订单服务把“订单已创建”事件发到 <code>orders</code>（副本因子 3）。要求：Broker 返回成功的事件即使一台 Broker 磁盘损坏也不丢；同一订单的事件严格有序；Kafka 短暂不可用（最长 1 分钟）时应用不报错；超过之后要能发现并补偿。写出生产者与主题配置，并说明应用侧如何处理最终失败。',
 '<ul><li>主题：<code>replication.factor=3</code>，<code>min.insync.replicas=2</code>，<code>unclean.leader.election.enable=false</code>（默认）。</li><li>生产者：<code>acks=all</code>，<code>enable.idempotence=true</code>（默认），<code>max.in.flight.requests.per.connection=5</code>，key = 订单号（单分区内有序且不因重试乱序）。</li><li>超时：<code>delivery.timeout.ms=120000</code>（覆盖 1 分钟不可用），<code>request.timeout.ms=30000</code>，<code>buffer.memory</code> 足够容纳 1 分钟的积压（或接受 <code>max.block.ms</code> 后的阻塞失败）。</li><li>最终失败：回调中拿到异常后，把事件写入本地数据库的“待重发”表并告警，由后台任务重发；更可靠的做法是 Outbox 模式：在下单的同一个数据库事务里写入事件表，再由中继进程发送到 Kafka（第 21 课），这样应用永远不会“下单成功但事件丢失”。重发可能导致重复，消费者需要按事件 ID 幂等。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
