TITLE='统计信息、连接算法与慢查询';DESC='规划器的判断全靠统计信息。本课讲 ANALYZE 收集了什么（空值比例、不同值个数、最常见值、直方图、相关性），多列相关时如何用扩展统计修正估算，三种连接算法 Nested Loop、Hash Join、Merge Join 各自适合什么情况，最后给出一套定位和修复慢查询的步骤。';NEXT='事务隔离级别';MIN=65
SUM=['<code>ANALYZE</code> 随机抽样（默认 <code>default_statistics_target = 100</code>，约 3 万行），在 <code>pg_stats</code> 中为每列记录：<code>null_frac</code>、<code>n_distinct</code>、<code>most_common_vals/freqs</code>（最多 100 个）、<code>histogram_bounds</code>（其余值的等频分桶）、<code>correlation</code>。autovacuum 在表变化约 10% 后自动 ANALYZE。',
'规划器默认假设各列<b>相互独立</b>：<code>city = \'台北\' AND zip = \'100\'</code> 的选择率被估为两者相乘，严重低估。<code>CREATE STATISTICS … (dependencies, ndistinct, mcv) ON city, zip FROM t</code> 让它知道列之间的关系。',
'<b>Nested Loop</b>：外层每行查一次内层，内层有索引且外层行少时最好，启动快。<b>Hash Join</b>：用较小的一边建哈希表，扫描另一边探测，适合大表等值连接，需要 work_mem。<b>Merge Join</b>：两边都按连接键有序（索引或排序）后归并，适合两个大的有序输入和范围外的等值连接。',
'估算偏低是最危险的情况：规划器以为外层只有几行而选了 Nested Loop，实际有几十万行，内层被执行几十万次。',
'慢查询排查顺序：① 用 <code>pg_stat_statements</code> 找出总耗时最多的语句（第 22 课）；② <code>EXPLAIN (ANALYZE, BUFFERS)</code>；③ 找估算与实际偏差最大、耗时最多的节点；④ 依次考虑：缺索引、统计过期或不足、写法让索引用不上、work_mem 不够、确实需要的数据量太大（改需求或预计算）。',
'常见写法问题：对索引列做运算或隐式类型转换；<code>OR</code> 跨列（可改写为 UNION）；<code>NOT IN (子查询)</code> 遇到 NULL 语义问题且难以优化（用 <code>NOT EXISTS</code>）；<code>OFFSET 100000</code> 深分页（用键集分页 <code>WHERE id &gt; $last ORDER BY id LIMIT 20</code>）。']
def secs(prac,E):
    return [
('统计信息如何变成估算','从 pg_stats 到 rows=。','<div id="p1"></div>'),
('三种连接算法','同一个连接，不同的做法。','<div id="p2"></div>'),
('动手：修好这条慢查询','一个慢查询的几个版本。选择一个版本，看计划和耗时。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','统计信息和连接控制。','<div id="t4"></div>'),
('在你的电脑上练习','在 shop 库中建一张地址表，体验相关列导致的估算错误。',prac([
 ('city 与 zip 强相关：每个 zip 只属于一个 city。','CREATE TABLE addr AS SELECT i AS id, \'c\' || (i % 100) AS city, \'z\' || (i % 1000) AS zip FROM generate_series(1, 1000000) i;\nANALYZE addr;','SELECT 1000000\nANALYZE'),
 ('每列的统计信息。','SELECT attname, n_distinct, null_frac FROM pg_stats WHERE tablename = \'addr\';',' attname | n_distinct | null_frac\n---------+------------+-----------\n id      |         -1 |         0\n city    |        100 |         0\n zip     |       1000 |         0'),
 ('估算：1/100 × 1/1000 × 100 万 = 10 行，实际 1000 行。','EXPLAIN ANALYZE SELECT * FROM addr WHERE city = \'c7\' AND zip = \'z107\';',' Seq Scan on addr  (cost=0.00..20406.00 rows=10 width=…) (actual rows=1000 loops=1)'),
 ('加扩展统计后估算正确。','CREATE STATISTICS addr_cz (dependencies, mcv) ON city, zip FROM addr;\nANALYZE addr;\nEXPLAIN SELECT * FROM addr WHERE city = \'c7\' AND zip = \'z107\';',' Seq Scan on addr  (cost=0.00..20406.00 rows=1003 width=…)'),
 ('看三种连接：调整开关观察规划器的替代选择（仅诊断）。','EXPLAIN SELECT * FROM users u JOIN orders o ON o.user_id = u.id;\nSET enable_hashjoin = off;\nEXPLAIN SELECT * FROM users u JOIN orders o ON o.user_id = u.id;\nRESET enable_hashjoin;',' Hash Join  (cost=32.50..2433.56 rows=100000 …)\n   Hash Cond: (o.user_id = u.id)\n   ->  Seq Scan on orders o\n   ->  Hash\n         ->  Seq Scan on users u\n Merge Join  (cost=0.57..5130.80 rows=100000 …)\n   Merge Cond: (u.id = o.user_id)'),
 ('深分页与键集分页。','EXPLAIN ANALYZE SELECT * FROM orders ORDER BY id OFFSET 90000 LIMIT 20;\nEXPLAIN ANALYZE SELECT * FROM orders WHERE id > 90000 ORDER BY id LIMIT 20;',' Limit (actual time=14.9..14.9 rows=20 loops=1)\n   ->  Index Scan using orders_pkey … (actual rows=90020 loops=1)\n Limit (actual time=0.02..0.03 rows=20 loops=1)\n   ->  Index Scan using orders_pkey … (actual rows=20 loops=1)')],
 ('优化“最近活跃用户”报表','查询：<code>SELECT u.id, u.name, max(o.created_at) FROM users u JOIN orders o ON o.user_id = u.id WHERE o.created_at &gt; now() - interval \'7 days\' GROUP BY u.id, u.name ORDER BY 3 DESC LIMIT 50</code>。orders 有 5000 万行，最近 7 天约 50 万行，只有 user_id 索引，耗时 30 秒。给出分析过程和改法。',
 '<p>先 <code>EXPLAIN (ANALYZE, BUFFERS)</code>：很可能是 orders 的 Parallel Seq Scan 读完 5000 万行，Rows Removed by Filter 约 4950 万，再 Hash Join users、HashAggregate、Top-N 排序。耗时集中在扫描。</p><pre class="cmd">CREATE INDEX CONCURRENTLY orders_created_at_idx ON orders (created_at) INCLUDE (user_id);</pre><p>有了时间索引，只读最近 7 天的 50 万个条目；INCLUDE user_id 并且表 VACUUM 及时时可以 Index Only Scan，不回表。如果计划仍不对，检查 <code>created_at</code> 的统计是否过期：大量新数据刚写入、ANALYZE 还没运行时，直方图上界还停留在过去，规划器会以为最近 7 天几乎没有数据——对只追加的大表可以调低 <code>autovacuum_analyze_scale_factor</code>。</p><p>如果报表频繁被调用，进一步用预聚合：在 users 上维护 <code>last_order_at</code> 列（下单时更新），加索引后变成 <code>ORDER BY last_order_at DESC LIMIT 50</code>，毫秒级。代价是每次下单多一次更新。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
