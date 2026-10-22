TITLE='保留策略与日志压缩';DESC='Kafka 不会因为消息被消费就删除它，那数据什么时候消失？本课讲两种清理策略：按时间或大小删除旧段，以及按 key 只保留最新值的日志压缩。会讲到压缩线程如何选择要清理的分区、墓碑消息如何删除一个 key、压缩后偏移量为何不连续，以及分层存储如何把旧数据放到对象存储上。';NEXT='序列化与 Schema Registry';MIN=60
SUM=['<code>cleanup.policy=delete</code>（默认）：段中最新消息早于 <code>retention.ms</code>（默认 7 天）或分区总大小超过 <code>retention.bytes</code>（默认不限）时删除最旧的段。设为 <code>-1</code> 表示永久保留。删除以段为单位（第 3 课）。',
'<code>cleanup.policy=compact</code>：对每个 key 只保留<b>最新的一条</b>。适合“当前状态”类数据：用户资料、商品价格、配置、Kafka Streams 状态存储的变更日志、<code>__consumer_offsets</code>。消费者从头读一遍压缩主题，就能重建每个 key 的最新状态。也可以 <code>compact,delete</code> 两者同时使用。',
'日志分为已清理的 <b>tail</b> 和未清理的 <b>head</b>（活跃段永远不清理）。清理线程（<code>log.cleaner.threads</code>）选择脏数据比例超过 <code>min.cleanable.dirty.ratio</code>（默认 0.5）的分区，扫描 head 建立“key → 最新偏移量”的映射，然后重写段，只保留每个 key 的最新记录。',
'压缩后记录的<b>偏移量不变</b>，只是中间出现空洞；同一个 key 的顺序和最新值得以保留。<code>min.compaction.lag.ms</code> 保证消息至少存活这么久才可能被压缩掉（给消费者读到中间值的机会）；<code>max.compaction.lag.ms</code> 保证消息在这个时间内一定会被考虑压缩。',
'<b>墓碑</b>：value 为 null 的消息表示删除该 key。压缩后墓碑本身还会保留 <code>delete.retention.ms</code>（默认 1 天），让落后的消费者也能看到删除；之后墓碑也被移除。消费者只要在这个时间内读完，就不会漏掉删除。',
'<b>分层存储</b>（KIP-405，3.9 起正式可用）：<code>remote.log.storage.system.enable=true</code> 并配置远程存储插件后，主题设置 <code>remote.storage.enable=true</code>，已关闭的段会上传到对象存储（S3 等）；<code>local.retention.ms</code> 控制本地保留多久，<code>retention.ms</code> 控制总保留时间。本地磁盘只放热数据，长期保留的成本大幅下降。']
def secs(prac,E):
    return [
('压缩：每个 key 只保留最新值','清理前后的同一段日志。','<div id="p1"></div>'),
('动手：写入并压缩','对一个压缩主题写入消息，然后运行一次清理。value 为空表示墓碑。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:110px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('分层存储','热数据在本地，冷数据在对象存储。','<div id="p2"></div>'),
('相关命令','配置清理策略。','<div id="t4"></div>'),
('在你的电脑上练习','单节点容器。为了尽快看到压缩，使用很小的段和很低的脏比例。',prac([
 ('创建压缩主题。','bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic prices --partitions 1 --config cleanup.policy=compact --config segment.ms=10000 --config min.cleanable.dirty.ratio=0.01 --config delete.retention.ms=10000','Created topic prices.'),
 ('写入同一些 key 的多个版本，以及一个墓碑（null.marker 把 NULL 当作空值）。','printf "p1:100\\np2:50\\np1:120\\np3:9\\np2:55\\np1:99\\np3:NULL\\n" | bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic prices --property parse.key=true --property key.separator=: --property null.marker=NULL','（无输出）'),
 ('等待约 30 秒后再写一条（让旧段滚动、成为可清理的 tail）。','sleep 30; echo "p4:1" | bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic prices --property parse.key=true --property key.separator=:','（无输出）'),
 ('再等片刻，从头读取。','sleep 30; bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic prices --from-beginning --property print.key=true --property print.offset=true --timeout-ms 5000','Offset:4\tp2\t55\nOffset:5\tp1\t99\nOffset:7\tp4\t1'),
 ('查看清理日志。','grep -i "cleaned" /opt/kafka/logs/log-cleaner.log | tail -n 2','… Cleaner 0: Cleaning log prices-0 … Cleaned log prices-0 … 7 messages in, 2 messages out …'),
 ('设置按大小的保留：每个分区最多 1 GB。','bin/kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name jobs --alter --add-config retention.bytes=1073741824','Completed updating config for topic jobs.')],
 ('为四类数据选择清理策略','为下面的主题选择 <code>cleanup.policy</code> 和关键参数：① <code>user-profiles</code>：用户资料变更，下游服务启动时要加载所有用户的最新资料，用户注销要删除；② <code>page-views</code>：点击流，保留 3 天；③ <code>audit-log</code>：审计日志，合规要求保留 7 年，近 30 天会被频繁查询；④ <code>device-status</code>：设备每 10 秒上报状态，下游需要每台设备的最新状态，也需要分析最近 24 小时的历史。',
 '<ol><li><code>user-profiles</code>：<code>compact</code>，key = 用户 ID；注销时发送 value 为 null 的墓碑；<code>delete.retention.ms</code> 大于下游最长停机时间（如 7 天），确保下游一定能看到删除；<code>min.compaction.lag.ms</code> 视需要设置。</li><li><code>page-views</code>：<code>delete</code>，<code>retention.ms=259200000</code>，key 可为空。</li><li><code>audit-log</code>：<code>delete</code>，<code>retention.ms</code> 约 7 年（或 -1 再由归档流程处理）；启用分层存储，<code>local.retention.ms</code> = 30 天，旧段在对象存储中；副本因子 3，且考虑另外导出到合规存储。</li><li><code>device-status</code>：<code>compact,delete</code> + <code>retention.ms=86400000</code>：24 小时内的历史因为还没到 tail 清理或保留时间而被保留（配合较大的 <code>min.compaction.lag.ms</code>，如 24 小时，保证 24 小时内的记录不被压缩掉），超过 24 小时的被压缩成每个设备最新一条——但注意 delete 策略也会删除 24 小时前的最新状态，如果设备长时间不上报，最新状态会消失。更清晰的做法是拆成两个主题：<code>device-status-history</code>（delete，24 小时）和 <code>device-status-latest</code>（compact）。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
