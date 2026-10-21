TITLE='查询规划器与 EXPLAIN';DESC='同一条 SQL 有很多种执行方式，规划器估算每种方式的代价并选最便宜的。本课讲一条查询从解析到执行的过程、计划树的读法、cost 的含义和代价参数、EXPLAIN ANALYZE 的各个字段，以及估算行数与实际行数相差很大时意味着什么。';NEXT='统计信息、连接算法与慢查询';MIN=60
SUM=['一条查询依次经过：<b>解析</b>（语法树）→ <b>分析/重写</b>（解析名字、展开视图和规则）→ <b>规划</b>（生成候选路径，估代价，选最便宜的）→ <b>执行</b>（按计划树从上到下拉取行）。',
'计划是一棵树，从最里层（缩进最深）的节点开始读。每个节点向父节点逐行提供数据。<code>cost=启动代价..总代价</code>，单位是抽象的“顺序读一页”的倍数；<code>rows</code> 是估算的输出行数，<code>width</code> 是平均行宽。',
'代价参数：<code>seq_page_cost = 1</code>、<code>random_page_cost = 4</code>（SSD 上通常调到 1.1–1.5）、<code>cpu_tuple_cost = 0.01</code>、<code>cpu_operator_cost = 0.0025</code>。Seq Scan 代价 ≈ 页数 × 1 + 行数 × 0.01 + 过滤条件的运算代价。',
'<code>EXPLAIN ANALYZE</code> 会<b>真正执行</b>语句（对 UPDATE/DELETE 要放在 BEGIN … ROLLBACK 中）。<code>actual time=首行..末行</code> 毫秒，按每次循环计；<code>loops</code> 是执行次数，总耗时 ≈ 时间 × loops。PostgreSQL 18 的 EXPLAIN ANALYZE 默认带 BUFFERS。',
'先比较每个节点的<b>估算 rows 与实际 rows</b>：相差 10 倍以上，后续的连接方式和顺序就可能选错。常见原因：统计信息过期、多列相关、表达式或函数无法估算（第 13 课）。',
'不要用 <code>enable_seqscan = off</code> 这类开关“修复”生产查询，它们只用于诊断：确认另一种计划确实更快后，去解决估算或索引问题。PostgreSQL 没有内置的查询提示（hint）。']
def secs(prac,E):
    return [
('从 SQL 到结果','规划器如何选出一个计划。','<div id="p1"></div>'),
('读一棵计划树','从内到外，从下到上。','<div id="p2"></div>'),
('动手：读 EXPLAIN ANALYZE','点击计划中的一行，看这一行说明了什么。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','EXPLAIN 的选项和代价参数。','<div id="t4"></div>'),
('在你的电脑上练习','使用 shop 库的 users（1000 行）和 orders（10 万行）。',prac([
 ('只估算，不执行。','EXPLAIN SELECT * FROM orders WHERE amount > 900;',' Seq Scan on orders  (cost=0.00..2137.00 rows=10050 width=29)\n   Filter: (amount > \'900\'::numeric)'),
 ('验证代价公式：1370 页 × 1.0 + 100000 行 × 0.01 + 100000 × 0.0025。','SELECT relpages, reltuples, relpages * 1.0 + reltuples * 0.01 + reltuples * 0.0025 AS cost FROM pg_class WHERE relname = \'orders\';',' relpages | reltuples |  cost\n----------+-----------+---------\n     1370 |    100000 | 2620.00'),
 ('估算与实际。','EXPLAIN ANALYZE SELECT * FROM orders WHERE amount > 900;',' Seq Scan on orders  (cost=0.00..2137.00 rows=10050 width=29) (actual time=0.015..12.801 rows=9981 loops=1)\n   Filter: (amount > \'900\'::numeric)\n   Rows Removed by Filter: 90019\n   Buffers: shared hit=1370\n Planning Time: 0.081 ms\n Execution Time: 13.212 ms'),
 ('连接查询的计划树。','EXPLAIN ANALYZE SELECT u.name, count(*) FROM users u JOIN orders o ON o.user_id = u.id WHERE u.id < 10 GROUP BY u.name;',' HashAggregate  (actual time=0.512..0.514 rows=9 loops=1)\n   Group Key: u.name\n   ->  Nested Loop  (actual time=0.031..0.441 rows=1012 loops=1)\n         ->  Index Scan using users_pkey on users u  (actual time=0.009..0.014 rows=9 loops=1)\n               Index Cond: (id < 10)\n         ->  Index Scan using orders_user_id_idx on orders o  (actual time=0.004..0.038 rows=112 loops=9)\n               Index Cond: (user_id = u.id)'),
 ('对写语句用 ANALYZE 时放进事务回滚。','BEGIN;\nEXPLAIN ANALYZE UPDATE orders SET amount = amount + 1 WHERE user_id = 42;\nROLLBACK;',' Update on orders  (actual time=0.612..0.613 rows=0 loops=1)\n   ->  Bitmap Heap Scan on orders  (actual time=0.041..0.198 rows=118 loops=1)\n …\nROLLBACK'),
 ('诊断：关掉顺序扫描，看索引计划的代价和真实耗时。','SET enable_seqscan = off;\nEXPLAIN ANALYZE SELECT * FROM orders WHERE user_id > 10;\nRESET enable_seqscan;',' Bitmap Heap Scan on orders  (cost=1897.40..4021.12 rows=98890 …) (actual time=4.8..21.6 rows=98880 loops=1)\n …\n Execution Time: 25.010 ms')],
 ('解释一个反直觉的计划','<code>SELECT * FROM orders WHERE user_id = 42 ORDER BY id LIMIT 1</code> 有 user_id 索引，但计划却是 <code>Limit → Index Scan using orders_pkey</code>，Filter: (user_id = 42)，实际耗时 40 ms。只查 <code>user_id = 999</code>（该用户没有订单）时更是要几百毫秒。解释规划器的想法和问题所在，给出两种修复。',
 '<p>规划器的推理：按主键顺序扫描，第一条满足 user_id = 42 的行就能结束。它估计 42 号用户有 111 行、均匀分布在 10 万行中，平均扫描 100000 / 111 ≈ 900 行就会遇到一个，代价很低，还省掉了排序。</p><p>问题在“均匀分布”的假设：如果 42 号用户的订单都是最近才产生的（id 很大），就要扫描几乎整个表才能遇到第一条；没有订单的用户则会扫完全表。LIMIT 让规划器对“提前结束”过于乐观。</p><p>修复一（推荐）：建复合索引 <code>(user_id, id)</code>，直接定位 user_id = 42 并按 id 有序，读一个条目就结束，任何用户都很快。修复二：改写让规划器不能用 pkey 的顺序，例如 <code>ORDER BY id + 0</code>，或先在 CTE/子查询中取出该用户的行（PostgreSQL 12+ 需加 <code>MATERIALIZED</code>），代价是需要排序。修复一更稳定。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
