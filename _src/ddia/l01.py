TITLE='架构中的权衡：事务型与分析型、记录系统与派生数据';DESC='DDIA 第 1 章的主题：没有“最好的”数据系统，只有针对具体需求的权衡。本课区分事务型（OLTP）与分析型（OLAP）两类负载，解释数据仓库、数据湖与 ETL 的由来，区分“记录系统”（事实的权威来源）与“派生数据”（缓存、索引、物化视图），并讨论云服务与自托管、分布式与单机、微服务与 Serverless 各自的代价，以及法律与隐私对数据架构的约束。';NEXT='非功能需求：以社交网络时间线为例';MIN=50
SUM=['<b>事务型系统（OLTP）</b>：面向用户的应用后端，每次请求按键读写少量记录，要求低延迟；数据代表“当前状态”。<b>分析型系统（OLAP）</b>：面向分析师和报表，一次扫描大量记录做聚合，查询是临时的、多变的；数据通常是历史事件。两者的访问模式差别大到值得用不同的存储引擎（第 6–8 课）。',
'<b>数据仓库</b>：把多个 OLTP 系统的数据通过 <b>ETL</b>（抽取—转换—加载）汇集到一个专供分析的库中，避免分析查询拖慢线上业务。<b>数据湖</b>存放原始文件（如对象存储上的 Parquet），由使用方决定如何解释；“湖仓”把两者结合。把数据送回线上系统（推荐结果、特征）称为反向 ETL。',
'<b>记录系统</b>（system of record，事实来源）：数据第一次写入的地方，冲突时以它为准，通常是规范化的。<b>派生数据</b>：由其他数据经过转换得到，丢了可以重新算出来——缓存、搜索索引、物化视图、机器学习特征都是。分清两者，能回答“出错时以谁为准”“这份数据能不能重建”。整门课第三部分都围绕派生数据展开。',
'<b>云服务与自托管</b>：云服务把运维交给厂商、按用量付费、弹性伸缩，但成本可能难以预测、可控性和可观察性下降、受限于厂商功能。<b>云原生</b>架构的典型特征是存储与计算分离：数据放在对象存储或共享存储服务中，计算节点无状态、可以随时增减。',
'<b>分布式还是单机</b>：需要分布式的理由——容错与高可用、可扩展性、降低全球用户的延迟、弹性、使用专用硬件、法律要求数据驻留某地。代价——网络故障与部分失效（第 21 课）、一致性难题、排查困难。单机的能力往往比想象的大：先确认真的需要分布式。<b>微服务</b>按团队边界拆分服务、各自拥有数据库，换来独立部署，代价是跨服务的数据一致性；<b>Serverless</b> 进一步把扩缩容交给平台。',
'<b>数据、法律与社会</b>：GDPR 等法规赋予用户删除权、访问权，要求数据最小化——这与“永不删除的不可变日志”“把所有数据先存下来”的工程习惯直接冲突。从设计之初就要考虑数据存放在哪、能否彻底删除（包括备份与派生数据）。第 27 课会再回到这一点。']
def secs(prac,E):
    return [
('两类负载','同一份订单数据，两种完全不同的访问方式。','<div id="p1"></div>'),
('动手：这是什么数据','判断每个数据存储是记录系统还是派生数据，以及丢失后能否重建。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre-wrap"></pre><div class="msg" id="hm"></div></div>'),
('从记录系统到派生数据','数据如何从业务库流向仓库、索引和缓存。','<div id="p2"></div>'),
('对照：两类查询','在 PostgreSQL 上看两类查询的执行计划。','<div id="t4"></div>'),
('在你的电脑上练习','启动一个 PostgreSQL 容器：<code>docker run -d --name pg -e POSTGRES_PASSWORD=pw postgres:18</code>，然后 <code>docker exec -it pg psql -U postgres</code>。如果你学过 <a href="../postgres/index.html">PostgreSQL 课程</a>，这里的命令都很熟悉。',prac([
 ('生成 100 万条订单（记录系统）。','CREATE TABLE orders(id bigint PRIMARY KEY, user_id int, amount numeric(10,2), created_at timestamptz);\nINSERT INTO orders SELECT g, g % 50000, (g % 997) / 10.0, timestamptz \'2026-01-01\' + (g % 300) * interval \'1 day\' FROM generate_series(1, 1000000) g;','CREATE TABLE\nINSERT 0 1000000'),
 ('事务型查询：按主键取一条。','\\timing on\nEXPLAIN ANALYZE SELECT * FROM orders WHERE id = 424242;','Index Scan using orders_pkey on orders … (actual time=0.02..0.02 rows=1 loops=1)\nExecution Time: 0.05 ms'),
 ('分析型查询：扫描全表按月聚合。','EXPLAIN ANALYZE SELECT date_trunc(\'month\', created_at) m, count(*), sum(amount) FROM orders GROUP BY 1 ORDER BY 1;','… Seq Scan on orders … (actual … rows=1000000 …)\nExecution Time: 300 ms 左右（取决于机器）'),
 ('派生数据：物化视图把聚合结果预先算好。','CREATE MATERIALIZED VIEW monthly AS SELECT date_trunc(\'month\', created_at) m, count(*) n, sum(amount) total FROM orders GROUP BY 1;\nSELECT * FROM monthly ORDER BY m LIMIT 3;','SELECT 10\n           m            |   n    |  total\n------------------------+--------+---------\n 2026-01-01 00:00:00+00 | 103334 | …'),
 ('派生数据会过期：修改记录系统，视图不变，直到刷新。','UPDATE orders SET amount = amount + 1000 WHERE id = 1;\nSELECT total FROM monthly ORDER BY m LIMIT 1;\nREFRESH MATERIALIZED VIEW monthly;\nSELECT total FROM monthly ORDER BY m LIMIT 1;','（第一次：旧值）\n（刷新后：增加了 1000）'),
 ('派生数据可以删除后重建；记录系统不行。','DROP MATERIALIZED VIEW monthly;   -- 随时可以重新 CREATE\n-- DROP TABLE orders 则数据永久丢失（除非有备份）','DROP MATERIALIZED VIEW')],
 ('为一家在线教育公司划分数据系统','这家公司有：课程与订单数据库（PostgreSQL）、学习行为埋点（每天 2 亿条）、站内搜索（Elasticsearch）、首页推荐、给管理层的周报。请：① 指出每个数据存储是记录系统还是派生数据；② 说明哪些负载是 OLTP、哪些是 OLAP，应该放在哪里；③ 当搜索结果与课程库不一致时以谁为准、如何修复；④ 一位用户要求删除个人数据，需要在哪些地方删除。',
 '<ol><li>记录系统：课程与订单库；埋点原始事件（写入后不再修改，作为行为事实的来源，通常进对象存储/Kafka）。派生数据：Elasticsearch 索引、推荐结果、周报、数据仓库中清洗后的表、各类缓存。</li><li>OLTP：下单、查课程、学习进度更新——放在 PostgreSQL。OLAP：周报、行为分析、推荐模型训练——放在数据仓库或湖仓，通过 ETL/CDC 从业务库和埋点同步；不要在业务库上跑大扫描。</li><li>以课程库为准。修复方式：从记录系统重新生成索引（全量重建，或从 CDC 位置重放增量），而不是手工改索引。</li><li>业务库中的用户行与订单（按法规可能需要匿名化而非删除财务记录）、埋点原始数据、数据仓库各层表、搜索索引、推荐特征与模型输入、缓存、备份（到期删除或加密后销毁密钥）。派生数据如果能从记录系统重建，删除源头后重建即可；这也说明了为什么要清楚地知道每份派生数据的来源。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
