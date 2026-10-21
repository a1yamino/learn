TITLE='索引入门：什么时候用、怎么建';DESC='索引是让查询变快最常用的手段，也是最常被滥用的。本课从使用者角度讲：没有索引时数据库怎么找数据、B-tree 索引能帮什么、复合索引的列顺序为什么重要、索引的写入代价，以及如何用 EXPLAIN 确认索引被用上了。内部结构留到第 10 课。';NEXT='事务基础：ACID 与 BEGIN / COMMIT';MIN=55
SUM=['没有合适的索引时只能 <b>顺序扫描</b>（Seq Scan）：读出表的每一页逐行判断。表越大越慢。',
'B-tree 索引按键值排序存储（键 → 行位置 ctid），支持 <code>=</code>、范围（<code>&lt; &gt; BETWEEN</code>）、<code>ORDER BY</code>、前缀 <code>LIKE \'abc%\'</code>（需要 C 排序规则或 text_pattern_ops）。主键和 UNIQUE 约束自动创建 B-tree 索引；<b>外键不会</b>。',
'复合索引 <code>(a, b)</code> 先按 a 排序、a 相同再按 b：能用于 <code>a = ?</code>、<code>a = ? AND b = ?</code>、<code>a = ? ORDER BY b</code>，但单独 <code>b = ?</code> 基本用不上。经验：等值条件的列在前，范围或排序的列在后。',
'索引不是越多越好：每次 INSERT / UPDATE / DELETE 都要维护所有相关索引，占用磁盘和缓存。用 <code>pg_stat_user_indexes.idx_scan</code> 找出从未使用的索引。',
'规划器可能故意不用索引：要返回的行占表的很大比例时，顺序扫描反而更快。对列做函数运算（<code>lower(email)</code>、<code>created_at::date</code>）或类型不一致时，普通索引也用不上，需要表达式索引（第 11 课）。',
'生产环境建索引用 <code>CREATE INDEX CONCURRENTLY</code>：不阻塞写入，代价是更慢，且失败时会留下一个 INVALID 索引需要删除重建。']
def secs(prac,E):
    return [
('顺序扫描与索引扫描','在 10 万行中找一个用户的订单。','<div id="p1"></div>'),
('索引的代价','每次写入都要更新所有索引。','<div id="p2"></div>'),
('动手：这个索引用得上吗','orders 上有一个复合索引 <code>(user_id, status, created_at)</code>。选择查询，看规划器能怎样使用这个索引。','<div class="chal"><div class="cmds" id="iq"></div><pre class="log" id="ip" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="im"></div></div>'),
('相关命令','创建、查看和评估索引。','<div id="t4"></div>'),
('在你的电脑上练习','使用第 3 课生成的 10 万笔订单。用 <code>\\timing on</code> 对比耗时。',prac([
 ('没有索引：按用户查订单是顺序扫描。','\\timing on\nEXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42;',' Seq Scan on orders  (cost=0.00..2137.00 rows=111 width=…) (actual time=0.031..9.812 rows=118 loops=1)\n   Filter: (user_id = 42)\n   Rows Removed by Filter: 99882\n Planning Time: 0.102 ms\n Execution Time: 9.851 ms'),
 ('建索引后：索引扫描。','CREATE INDEX orders_user_id_idx ON orders (user_id);\nEXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42;',' Bitmap Heap Scan on orders  (cost=5.15..318.20 rows=111 width=…) (actual time=0.052..0.214 rows=118 loops=1)\n   Recheck Cond: (user_id = 42)\n   Heap Blocks: exact=114\n   ->  Bitmap Index Scan on orders_user_id_idx  (cost=0.00..5.12 rows=111 width=0) (actual time=0.029..0.029 rows=118 loops=1)\n         Index Cond: (user_id = 42)\n Execution Time: 0.251 ms'),
 ('返回大部分行时，规划器仍选择顺序扫描。','EXPLAIN SELECT * FROM orders WHERE user_id > 10;',' Seq Scan on orders  (cost=0.00..2137.00 rows=98890 width=…)\n   Filter: (user_id > 10)'),
 ('对列做运算，索引用不上。','EXPLAIN SELECT * FROM orders WHERE user_id + 0 = 42;',' Seq Scan on orders  (cost=0.00..2387.00 rows=500 width=…)\n   Filter: ((user_id + 0) = 42)'),
 ('索引的大小和使用次数。','SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) AS size, idx_scan\nFROM pg_stat_user_indexes WHERE relname = \'orders\';','    indexrelname    |  size   | idx_scan\n--------------------+---------+----------\n orders_pkey        | 2208 kB |        0\n orders_user_id_idx | 712 kB  |        2'),
 ('写入代价：有索引和没有索引时插入 10 万行。','CREATE TABLE t1 (a int, b int, c text);\nCREATE TABLE t2 (a int, b int, c text);\nCREATE INDEX ON t2 (a); CREATE INDEX ON t2 (b); CREATE INDEX ON t2 (c);\nINSERT INTO t1 SELECT i, random()*1e6, md5(i::text) FROM generate_series(1,100000) i;\nINSERT INTO t2 SELECT i, random()*1e6, md5(i::text) FROM generate_series(1,100000) i;\nDROP TABLE t1, t2;','INSERT 0 100000\nTime: 98.410 ms\nINSERT 0 100000\nTime: 412.733 ms')],
 ('给常见查询设计索引','接口“我的订单”执行：<code>SELECT id, amount, status, created_at FROM orders WHERE user_id = $1 AND status &lt;&gt; \'cancelled\' ORDER BY created_at DESC LIMIT 20</code>。设计一个索引让它不需要排序就能直接按顺序取出前 20 行，并用 EXPLAIN 验证。说明为什么不把 status 放在索引第二列。',
 '<pre class="cmd">CREATE INDEX orders_user_created_idx ON orders (user_id, created_at DESC);\nEXPLAIN ANALYZE SELECT id, amount, status, created_at FROM orders\nWHERE user_id = 42 AND status &lt;&gt; \'cancelled\' ORDER BY created_at DESC LIMIT 20;</pre><pre class="out"> Limit  (actual time=0.031..0.064 rows=20 loops=1)\n   ->  Index Scan using orders_user_created_idx on orders  (actual time=0.030..0.061 rows=20 loops=1)\n         Index Cond: (user_id = 42)\n         Filter: (status &lt;&gt; \'cancelled\'::text)\n         Rows Removed by Filter: 3\n Execution Time: 0.081 ms</pre><p>索引按 user_id 分组、组内按 created_at 降序，于是扫描到第 20 个满足条件的行就停止，没有 Sort 节点。status 用的是不等条件（<code>&lt;&gt;</code>），放在第二列会把 created_at 的顺序拆成多段，规划器就不能直接按时间顺序读，需要额外排序。被排除的取消订单很少，作为 Filter 逐行跳过即可。这里可以把建好的单列 user_id 索引删掉：新索引的第一列就是 user_id，能覆盖它的所有用途。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
