TITLE='Kafka Connect';DESC='把数据库、文件、搜索引擎、对象存储和 Kafka 连起来，是很多团队最常写、也最容易写错的代码。Kafka Connect 是一个专门做这件事的框架：用配置而不是代码描述数据管道，由框架负责分布式运行、偏移量管理、重试和扩缩容。本课讲 Source 与 Sink、Worker 与 Task、分布式模式的内部主题、转换器与单消息转换（SMT），以及错误处理和死信队列。';NEXT='Kafka Streams：拓扑与无状态处理';MIN=60
SUM=['<b>Connector</b> 是一个插件：<b>Source</b> 从外部系统读出数据写入 Kafka（如 Debezium 读 MySQL binlog、JDBC Source），<b>Sink</b> 从 Kafka 读出写到外部系统（如 Elasticsearch、S3、JDBC Sink）。Connector 把工作拆成多个 <b>Task</b>（<code>tasks.max</code>），由 <b>Worker</b> 进程运行。',
'<b>分布式模式</b>：多个 Worker 使用相同的 <code>group.id</code> 组成集群，通过三个内部主题协作：<code>config.storage.topic</code>（连接器配置）、<code>offset.storage.topic</code>（Source 读到外部系统的哪里）、<code>status.storage.topic</code>（运行状态）。Worker 增减或宕机时，Task 在 Worker 之间重新分配（增量协作再平衡）。管理通过 REST 接口（默认 8083 端口）。<b>独立模式</b>只有一个进程，偏移量存在本地文件，适合开发和边缘场景。',
'Sink 连接器本质上是一个消费者组（<code>connect-&lt;连接器名&gt;</code>），偏移量存在 <code>__consumer_offsets</code>；Source 的“外部偏移量”（binlog 位置、文件行号、自增 ID）存在 offset 主题。',
'<b>转换器</b>（Converter，<code>key.converter</code>/<code>value.converter</code>）在 Connect 的内部数据格式与 Kafka 字节之间转换：<code>JsonConverter</code>（<code>schemas.enable</code> 决定是否附带 schema）、<code>StringConverter</code>、Avro/Protobuf 转换器（配合 Schema Registry）。',
'<b>单消息转换（SMT）</b>：在 Source 写入前或 Sink 写出前对每条记录做轻量修改，如 <code>InsertField</code>、<code>ReplaceField</code>、<code>MaskField</code>、<code>TimestampRouter</code>、<code>RegexRouter</code>、<code>ExtractField</code>；配合<b>谓词</b>只对部分记录生效。复杂的处理（关联、聚合）应该放到 Kafka Streams 或 Flink 中。',
'<b>错误处理</b>：<code>errors.tolerance=all</code> 跳过无法转换或处理的记录，<code>errors.deadletterqueue.topic.name</code> 把它们写入死信主题（只适用于 Sink），<code>errors.deadletterqueue.context.headers.enable=true</code> 在 header 中记录错误原因，<code>errors.log.enable</code> 记录日志；<code>errors.retry.timeout</code> 控制可重试错误的重试时长。']
def secs(prac,E):
    return [
('Worker、Connector 与 Task','分布式模式下的三个 Worker。','<div id="p1"></div>'),
('一条记录经过的步骤','Source 与 Sink 两个方向。','<div id="p2"></div>'),
('动手：错误处理配置','Sink 连接器遇到一条格式错误的消息。选择配置，看连接器的行为。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('REST 接口','管理连接器。','<div id="t4"></div>'),
('在你的电脑上练习','在单节点 kafka 容器里用自带的文件连接器跑一个独立模式的管道。',prac([
 ('准备配置：把文件连接器加入插件路径。','cp config/connect-standalone.properties /tmp/w.properties\necho "plugin.path=/opt/kafka/libs/connect-file-4.4.0.jar" >> /tmp/w.properties\nprintf "a\\nb\\nc\\n" > /tmp/in.txt','（无输出）'),
 ('Source：读取文件写入主题 lines。','cat > /tmp/src.properties <<\'X\'\nname=file-src\nconnector.class=FileStreamSource\ntasks.max=1\nfile=/tmp/in.txt\ntopic=lines\nX','（无输出）'),
 ('Sink：从 lines 读取写入另一个文件。','cat > /tmp/sink.properties <<\'X\'\nname=file-sink\nconnector.class=FileStreamSink\ntasks.max=1\ntopics=lines\nfile=/tmp/out.txt\nX','（无输出）'),
 ('启动独立模式 Worker（后台）。','bin/connect-standalone.sh /tmp/w.properties /tmp/src.properties /tmp/sink.properties > /tmp/connect.log 2>&1 &\nsleep 15; cat /tmp/out.txt','a\nb\nc'),
 ('追加一行，观察传递。','echo d >> /tmp/in.txt; sleep 5; tail -n 1 /tmp/out.txt','d'),
 ('Sink 连接器就是一个消费者组。','bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group connect-file-sink','GROUP             TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG …\nconnect-file-sink lines 0         4              4              0')],
 ('设计一个 MySQL → Kafka → Elasticsearch 的管道','把 MySQL 的 <code>products</code> 表同步到 Elasticsearch，用于搜索：每秒约 500 次变更，要求删除也同步，ES 短暂不可用时不丢数据，个别字段格式异常的记录不能卡住整个管道。写出两个连接器的关键配置和理由（Connect 集群、转换器、主题、SMT、错误处理）。',
 '<ul><li><b>Connect 集群</b>：分布式模式 3 个 Worker，内部主题副本因子 3，<code>offset.storage.topic</code> 等使用 compact。</li><li><b>Source</b>：Debezium MySQL 连接器读 binlog（而不是 JDBC 轮询，才能捕获删除和每次变更）；<code>tasks.max=1</code>（binlog 单线程读取）；输出主题 <code>db.shop.products</code>，key 为主键；使用 Avro 转换器 + Schema Registry；SMT <code>ExtractNewRecordState</code>（Debezium 提供）把变更信封展开为新行，删除生成墓碑（<code>delete.handling.mode</code> + <code>drop.tombstones=false</code>）。主题可以开启压缩，方便重建索引。</li><li><b>Sink</b>：Elasticsearch Sink，<code>key.ignore=false</code>（主键作为文档 ID，写入是 upsert，重复写入幂等），<code>behavior.on.null.values=delete</code>（墓碑 → 删除文档）；<code>tasks.max</code> 与分区数一致（如 6）。</li><li><b>错误处理</b>：<code>errors.tolerance=all</code>，<code>errors.deadletterqueue.topic.name=dlq.products-es</code>，开启 context headers，监控 DLQ 增长；<code>errors.retry.timeout=600000</code> 让 ES 短暂不可用时持续重试而不是失败；Sink 只有在写入成功后才提交偏移量，所以 ES 恢复后从未确认的位置继续。</li></ul>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
