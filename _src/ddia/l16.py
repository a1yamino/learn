TITLE='再平衡、请求路由与二级索引';DESC='第 7 章后半部分。分片之后还有三个问题：节点增减时如何把分片挪来挪去（自动还是人工），客户端怎么知道某个键在哪个节点上（请求路由），以及按非分片键查询时怎么办（本地二级索引与全局二级索引）。练习用 PostgreSQL 分区表观察“分散—聚集”查询，并对照 Kafka 的分区重分配。';NEXT='事务与 ACID';MIN=55
SUM=['<b>再平衡</b>：节点加入、离开或负载不均时，把分片从一些节点移到另一些节点。要求：再平衡后负载均匀；过程中继续服务读写；只移动必要的数据。使用固定数量分片（第 15 课）时，再平衡只是改映射表并复制整片数据。',
'<b>自动还是人工</b>：全自动再平衡省事，但与故障检测结合时很危险：一个节点因过载变慢，被误判为宕机，系统开始把它的分片迁走——迁移本身又加重了它和网络的负载，可能引发级联故障。很多系统采用折中：系统给出建议，由人确认后执行（如 Kafka 的分区重分配工具，<a href="../kafka/l20.html">Kafka 第 20 课</a>）。云服务的自动伸缩则把这件事完全交给平台。',
'<b>请求路由</b>：这是“服务发现”问题的一个实例。三种做法：① 客户端连任意节点，节点不负责该键时转发（Cassandra 的协调节点、Redis Cluster 的 MOVED 重定向）；② 一个分片感知的<b>路由层</b>（MongoDB 的 mongos、Vitess 的 vtgate）；③ 客户端自己知道映射（智能客户端）。映射表本身必须让所有参与者达成一致——通常存放在一个<b>协调服务</b>里（ZooKeeper、etcd，第 24 课），或者通过 gossip 协议在节点间传播（最终一致）。',
'<b>本地二级索引</b>（按文档分片的索引）：每个分片只为自己的数据建立索引。写入只涉及一个分片，简单；按二级键查询时，不知道匹配的数据在哪个分片，要发给所有分片再合并结果（<b>分散—聚集</b>）——尾延迟放大（第 2 课），分片越多越慢。MongoDB、Cassandra、Elasticsearch、PostgreSQL 分区表都使用本地索引。',
'<b>全局二级索引</b>（按词项分片的索引）：索引本身也分片，但按<b>索引的值</b>分片：例如“颜色 = 红”的所有条目都在索引分片 2。读取只需访问一个索引分片；写入一条记录可能要更新多个索引分片，通常是<b>异步</b>的（DynamoDB 的 GSI），所以写入后立刻按索引读可能读不到。若要同步更新，就需要分布式事务（第 20 课）。']
def secs(prac,E):
    return [
('请求路由的三种方式','客户端如何找到负责某个键的节点。','<div id="p1"></div>'),
('本地索引与全局索引','按颜色查询红色的车。','<div id="p2"></div>'),
('动手：查询要访问几个分片','选择索引方式和查询类型。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('Redis Cluster 的重定向','路由方式 ①：节点告诉客户端去哪里。','<div id="t4"></div>'),
('在你的电脑上练习','使用 <code>pg</code> 容器：哈希分区表上的本地索引。',prac([
 ('创建按 user_id 哈希分区的表（4 个分区）。','CREATE TABLE cars(id int, user_id int, color text) PARTITION BY HASH (user_id);\nCREATE TABLE cars0 PARTITION OF cars FOR VALUES WITH (MODULUS 4, REMAINDER 0);\nCREATE TABLE cars1 PARTITION OF cars FOR VALUES WITH (MODULUS 4, REMAINDER 1);\nCREATE TABLE cars2 PARTITION OF cars FOR VALUES WITH (MODULUS 4, REMAINDER 2);\nCREATE TABLE cars3 PARTITION OF cars FOR VALUES WITH (MODULUS 4, REMAINDER 3);\nINSERT INTO cars SELECT g, g % 1000, (ARRAY[\'红\',\'蓝\',\'白\'])[1 + g % 3] FROM generate_series(1, 100000) g;','CREATE TABLE\n…\nINSERT 0 100000'),
 ('在分区表上建索引：实际是每个分区各建一个本地索引。','CREATE INDEX ON cars(color);\n\\di cars*','                  List of relations\n … cars0_color_idx | index | … | cars0\n … cars1_color_idx | index | … | cars1\n … cars2_color_idx | index | … | cars2\n … cars3_color_idx | index | … | cars3'),
 ('按分片键查询：分区裁剪，只访问一个分区。','EXPLAIN (COSTS OFF) SELECT * FROM cars WHERE user_id = 42;',' Seq Scan on cars2 cars\n   Filter: (user_id = 42)\n（具体是哪个分区取决于哈希值）'),
 ('按二级键查询：分散—聚集，访问所有分区。','EXPLAIN (COSTS OFF) SELECT * FROM cars WHERE color = \'红\';',' Append\n   ->  … on cars0 …\n   ->  … on cars1 …\n   ->  … on cars2 …\n   ->  … on cars3 …'),
 ('“全局索引”可以用一张按颜色分区的派生表模拟：写入时要同时维护（这里用触发器，同步但代价更高）。','CREATE TABLE cars_by_color(color text, id int, user_id int) PARTITION BY LIST (color);\nCREATE TABLE cbc_red PARTITION OF cars_by_color FOR VALUES IN (\'红\');\nCREATE TABLE cbc_other PARTITION OF cars_by_color DEFAULT;\nINSERT INTO cars_by_color SELECT color, id, user_id FROM cars;\nEXPLAIN (COSTS OFF) SELECT id FROM cars_by_color WHERE color = \'红\';','…\n Seq Scan on cbc_red cars_by_color\n   Filter: (color = \'红\'::text)')],
 ('为电商订单选择二级索引方式','订单表按 order_id 哈希分成 64 个分片。需求：Q1 用户查看自己的订单（按 user_id，每秒 5 万次，要求读己之写）；Q2 商家后台按 merchant_id 查订单（每秒 500 次，可以延迟几秒）；Q3 客服按手机号查订单（每秒 10 次）。请为每个查询选择方案。',
 '<ol><li><b>Q1</b>：最好的办法是改变分片键——按 user_id 分片（订单号中编码 user_id 或分片号，这样按订单号也能直接路由）。这样 Q1 只访问一个分片，并且与写入在同一分片上，读己之写容易保证。如果分片键不能改，全局索引是异步的，不满足读己之写；本地索引需要访问 64 个分片，每秒 5 万 × 64 次请求不可接受。</li><li><b>Q2</b>：异步维护的全局二级索引（或用 CDC 把订单同步到按 merchant_id 分片的派生表/搜索引擎），几秒延迟可以接受；大商家可能形成热点，可在索引键中加时间分桶。</li><li><b>Q3</b>：频率很低，可以接受分散—聚集查询本地索引（64 个分片并行，p99 会差一些）；或者放进同一个按手机号分片的全局索引。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
