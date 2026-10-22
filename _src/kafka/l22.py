TITLE='事件溯源与 CQRS';DESC='把“发生过什么”作为唯一的事实来源，而当前状态只是事件的折叠结果——这就是事件溯源。Kafka 的日志天然适合存放事件，CQRS 则把写模型与读模型分开，各自优化。本课讲事件溯源的建模、用 Kafka 做事件存储的长处与局限、用 Streams 或消费者构建读模型（物化视图），以及重放、快照和事件演进。';NEXT='错误处理：重试主题与死信队列';MIN=60
SUM=['<b>事件溯源</b>：不存“账户余额 = 70”，而存 <code>Opened(100)</code>、<code>Withdrawn(50)</code>、<code>Deposited(20)</code>。当前状态 = 对事件按顺序做 fold。好处：完整审计、可以重建任意时间点的状态、可以为新需求从头计算新视图。',
'<b>CQRS</b>（命令查询职责分离）：写端接受命令、校验业务规则、产生事件；读端订阅事件，构建为查询优化的视图（数据库表、搜索索引、缓存）。读写可以独立扩展，读模型是<b>最终一致</b>的。',
'用 Kafka 存事件：按聚合 ID 做 key，同一聚合的事件在同一分区内有序；主题设置 <code>retention.ms=-1</code> 永久保留（或配合分层存储降低成本）。读模型就是一个消费者组，新视图只需新建一个组并 <code>--reset-offsets --to-earliest</code> 重放。',
'局限：Kafka <b>不能按 key 高效读取</b>某一个聚合的全部事件，也不支持“期望版本”的乐观并发写入。所以写端校验通常依赖本地状态：Streams 的状态存储（按 key 分区、changelog 备份），或者把事件同时存入数据库事件表（再 Outbox 到 Kafka）。',
'<b>快照</b>：事件很多时，从头 fold 很慢。定期保存状态快照（例如压缩主题 <code>account-snapshots</code>，key 为账户 ID），恢复时从快照加后续事件开始。Streams 的 KTable + changelog 本质上就是这个机制。',
'<b>事件演进</b>：事件永久保存，所以结构只能兼容地演进（第 13 课的 Schema 兼容性）；事件命名用过去时、描述业务事实（<code>OrderShipped</code> 而不是 <code>UpdateOrder</code>）；不要删除或修改历史事件，用补偿事件纠正。']
def secs(prac,E):
    return [
('状态是事件的折叠','从事件序列计算当前状态。','<div id="p1"></div>'),
('动手：重放到某一时刻','拖动位置，查看那一时刻的账户状态。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('CQRS 的数据流','命令、事件与多个读模型。','<div id="p2"></div>'),
('相关命令','事件主题、重放与快照主题。','<div id="t4"></div>'),
('在你的电脑上练习','在单节点 kafka 容器中（<code>docker exec -it kafka bash; cd /opt/kafka</code>）。',prac([
 ('创建永久保留的事件主题和压缩的快照主题。','bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic account-events --partitions 3 --config retention.ms=-1\nbin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic account-snapshots --partitions 3 --config cleanup.policy=compact','Created topic account-events.\nCreated topic account-snapshots.'),
 ('写入事件（key 为账户 ID）。','printf \'%s\\n\' \'A1:{"type":"Opened","amount":100}\' \'A2:{"type":"Opened","amount":10}\' \'A1:{"type":"Withdrawn","amount":50}\' \'A1:{"type":"Deposited","amount":20}\' | bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic account-events --property parse.key=true --property key.separator=:',''),
 ('用一个“读模型”消费者组读全部事件。','bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic account-events --group balance-view --from-beginning --property print.key=true --timeout-ms 5000','A1\t{"type":"Opened","amount":100}\nA1\t{"type":"Withdrawn","amount":50}\nA1\t{"type":"Deposited","amount":20}\nA2\t{"type":"Opened","amount":10}'),
 ('新需求：建一个新视图，从头重放。','bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group audit-view --topic account-events --reset-offsets --to-earliest --execute','GROUP       TOPIC          PARTITION  NEW-OFFSET\naudit-view  account-events 0          0\n…'),
 ('写一个快照，再查看压缩主题。','printf \'%s\\n\' \'A1:{"balance":70,"upTo":"account-events-1@2"}\' | bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic account-snapshots --property parse.key=true --property key.separator=:\nbin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic account-snapshots --from-beginning --property print.key=true --timeout-ms 5000','A1\t{"balance":70,"upTo":"account-events-1@2"}')],
 ('为银行账户设计事件溯源','需求：开户、存款、取款（余额不能为负）、查询余额、按月出对账单、风控需要“过去 1 小时取款总额”。请设计：① 事件类型；② 主题与 key；③ 写端如何保证“余额不能为负”；④ 需要哪些读模型，各用什么存储；⑤ 某个取款事件金额写错了怎么办。',
 '<ol><li>事件：<code>AccountOpened</code>、<code>MoneyDeposited</code>、<code>MoneyWithdrawn</code>、<code>WithdrawalRejected</code>（可选，用于审计）。</li><li>主题 <code>account-events</code>，key = 账户 ID（同账户有序），<code>retention.ms=-1</code>，开启分层存储；分区数按吞吐预留（以后不能改 key 分布）。</li><li>写端：命令主题 <code>account-commands</code>（同样以账户 ID 为 key）→ Streams 应用，在状态存储中按账户保存余额，校验通过才输出 <code>MoneyWithdrawn</code>，否则输出拒绝事件；配合 <code>exactly_once_v2</code>，状态与输出原子一致。同一账户的命令在同一分区串行处理，不会并发透支。</li><li>读模型：余额查询 → KTable 物化 / Redis；月度对账单 → 写入 PostgreSQL 按月分区的表；风控 1 小时取款总额 → Streams 跳跃窗口聚合（第 16 课）。各自一个消费者组，可独立重建。</li><li>不修改历史：追加补偿事件 <code>WithdrawalCorrected</code>（或冲正 + 重新入账），读模型据此更新；审计保留完整轨迹。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
