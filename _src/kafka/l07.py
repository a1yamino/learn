TITLE='再平衡：协议、分配策略与 KIP-848';DESC='消费者加入、离开或主题分区变化时，组要重新分配分区，这就是再平衡。本课比较经典协议中“全部停下来再分配”的急切再平衡与增量协作再平衡，介绍几种分配策略和静态成员，然后讲 Kafka 4.0 正式发布的新消费者组协议（KIP-848）：由 Broker 计算分配、按成员逐个增量调整，不再需要全组同步。';NEXT='位移：提交、重置与交付语义';MIN=65
SUM=['触发再平衡：成员加入或离开（包括超时被踢出）、订阅的主题分区数变化、订阅的正则匹配到新主题。再平衡期间被移动的分区暂停消费，频繁再平衡是消费延迟抖动的常见原因。',
'<b>经典协议</b>（<code>group.protocol=classic</code>）：所有成员发送 JoinGroup，协调器选一个成员作为 Leader，Leader 在客户端执行分配策略，再通过 SyncGroup 下发。<b>急切</b>模式下每个成员先撤销全部分区，整个组停顿；<b>协作</b>模式（<code>CooperativeStickyAssignor</code>）只撤销需要移动的分区，分两轮完成，其他分区持续消费。',
'分配策略：<code>RangeAssignor</code>（按主题连续分段，多主题时前几个成员偏多）、<code>RoundRobinAssignor</code>、<code>StickyAssignor</code>（尽量保持原分配）、<code>CooperativeStickyAssignor</code>（粘性 + 协作）。Java 客户端经典协议默认 <code>[RangeAssignor, CooperativeStickyAssignor]</code>。',
'<b>静态成员</b>：设置 <code>group.instance.id</code>（如 Pod 名），成员重启时只要在 <code>session.timeout.ms</code> 内回来，就拿回原来的分区，不触发再平衡。适合滚动发布。',
'<b>新协议 KIP-848</b>（<code>group.protocol=consumer</code>，Kafka 4.0 GA，服务端默认启用）：没有 JoinGroup/SyncGroup，成员只通过 ConsumerGroupHeartbeat 上报订阅、领取目标分配；<b>分配在协调器上计算</b>（<code>group.remote.assignor</code>：<code>uniform</code> 或 <code>range</code>），每个成员独立地撤销和获得分区，一个成员的变化不会让其他成员停顿；也不再依赖客户端实现分配器。',
'迁移：Broker 4.x 支持经典与新协议的成员在同一组中混合，滚动升级时逐个实例改为 <code>group.protocol=consumer</code>，组会在线转换。新协议下 <code>session.timeout.ms</code>、心跳间隔改由 Broker 端的 <code>group.consumer.*</code> 配置控制。']
def secs(prac,E):
    return [
('急切与协作','新成员加入时，经典协议的两种做法。','<div id="p1"></div>'),
('KIP-848：Broker 计算分配','每个成员通过心跳独立地收敛到目标分配。','<div id="p2"></div>'),
('动手：分配策略','两个主题 A、B 各 3 个分区，组内 2 个消费者，然后加入第 3 个。比较策略。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','观察再平衡。','<div id="t4"></div>'),
('在你的电脑上练习','单节点容器，使用上一课的 jobs 主题（6 个分区），三个终端。',prac([
 ('终端 1：用新协议启动消费者。','bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic jobs --group n1 --consumer-property group.protocol=consumer > /dev/null','（持续运行）'),
 ('终端 3：查看组类型和分配器。','bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group n1 --state','GROUP COORDINATOR (ID) ASSIGNMENT-STRATEGY STATE  #MEMBERS\nn1    localhost:9092 (1) uniform             Stable 1'),
 ('终端 2：加入第二个成员，看成员的目标分配。','bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic jobs --group n1 --consumer-property group.protocol=consumer > /dev/null\n# 终端 3：\nbin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group n1 --members --verbose','GROUP CONSUMER-ID … EPOCH TARGET-ASSIGNMENT-EPOCH ASSIGNMENT        TARGET-ASSIGNMENT\nn1    Xk2…        … 3     3                        jobs:0,1,2        jobs:0,1,2\nn1    9Lp…        … 3     3                        jobs:3,4,5        jobs:3,4,5'),
 ('用经典协议 + 静态成员启动一个组。','bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic jobs --group s1 --consumer-property group.instance.id=pod-a --consumer-property session.timeout.ms=60000 > /dev/null','（持续运行）'),
 ('Ctrl-C 后 30 秒内重启同一命令，分配不变，日志中没有新的再平衡。','bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group s1 --members','GROUP CONSUMER-ID HOST CLIENT-ID #PARTITIONS\ns1    pod-a-…     …    …         6'),
 ('查看 Broker 上新协议的相关配置。','bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type brokers --entity-name 1 --describe --all | grep group.consumer','group.consumer.session.timeout.ms=45000 …\ngroup.consumer.heartbeat.interval.ms=5000 …\ngroup.consumer.assignors=uniform,range …')],
 ('减少滚动发布带来的消费停顿','一个消费服务在 Kubernetes 上有 20 个 Pod，消费 3 个主题共 120 个分区，每次滚动发布（逐个重启 Pod）都会产生 20 次以上的再平衡，期间 LAG 飙升到几十万。现在使用经典协议、默认分配策略。给出改进方案，按“改动小到大”排序，并说明每一步的效果与注意事项。',
 '<ol><li><b>协作再平衡</b>：<code>partition.assignment.strategy=CooperativeStickyAssignor</code>（从默认列表移除 Range，需滚动两次完成切换）。再平衡时只有被移动的分区暂停，其他 Pod 持续消费。</li><li><b>静态成员</b>：<code>group.instance.id=$POD_NAME</code>（StatefulSet 名字稳定），<code>session.timeout.ms</code> 大于单个 Pod 重启耗时（如 60 秒）。Pod 重启时不触发再平衡，回来后拿回原分区。注意：真正宕机的实例要等 session 超时才会被替换，期间它的分区无人消费。</li><li><b>优雅关闭</b>：收到 SIGTERM 时停止 poll、处理完当前批次并同步提交偏移量后再 close，<code>terminationGracePeriodSeconds</code> 足够长，减少重复处理。</li><li><b>迁移到新协议</b>：Broker 已是 4.x 时，逐个 Pod 设置 <code>group.protocol=consumer</code>；分配由 Broker 计算、按成员增量调整，单个成员的进出不影响其他成员。新协议下 session 超时在 Broker 端配置（<code>group.consumer.session.timeout.ms</code>），静态成员仍然可用。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
