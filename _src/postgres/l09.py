TITLE='缓冲区与 I/O：shared_buffers 与操作系统缓存';DESC='PostgreSQL 读写数据页都要经过共享缓冲区，而共享缓冲区下面还有操作系统的页缓存。本课讲一次读页请求怎样命中或未命中、clock-sweep 如何选择要淘汰的页、脏页由谁写回、shared_buffers 和 effective_cache_size 怎么设，以及如何用 EXPLAIN (BUFFERS) 和 pg_stat 视图判断查询的 I/O。';NEXT='B-tree 索引内部';MIN=55
SUM=['所有页的读写都经过<b>共享缓冲区</b>（<code>shared_buffers</code>，默认 128 MB，太小）。未命中时向操作系统发出读请求，操作系统的页缓存可能命中，否则才真正读盘——所以存在“双重缓存”。',
'常见起点：专用数据库服务器上 <code>shared_buffers ≈ 内存的 25%</code>，其余留给操作系统缓存和查询内存。<code>effective_cache_size ≈ 50%–75%</code> 只是告诉规划器总缓存大概多大，不分配内存。',
'淘汰用 <b>clock-sweep</b>：每个缓冲区有使用计数（最多 5），时钟指针转一圈逐个减一，减到 0 且未被固定（pin）的就被替换。热页计数高，留得久。大表顺序扫描和 VACUUM 使用小的环形缓冲区，不会冲掉整个缓存。',
'脏页由三方写回：<b>检查点进程</b>（周期性全部写回）、<b>后台写进程</b> bgwriter（提前写一部分）、以及后端进程自己（找不到干净缓冲区时被迫写，最差）。',
'<code>EXPLAIN (ANALYZE, BUFFERS)</code> 显示 <code>shared hit</code>（缓冲区命中）、<code>read</code>（向操作系统读，可能来自页缓存或磁盘）、<code>dirtied</code>、<code>written</code>。<code>track_io_timing = on</code> 后能看到 I/O 实际耗时，区分页缓存命中和真读盘。',
'命中率 <code>blks_hit / (blks_hit + blks_read)</code> 在 OLTP 系统通常应高于 99%。命中率低时先看是否缺索引导致大扫描，再考虑加内存。PostgreSQL 18 引入了异步 I/O（<code>io_method</code>），顺序扫描、VACUUM 等可以并发预读。']
def secs(prac,E):
    return [
('一次读页','从共享缓冲区到磁盘的三层。','<div id="p1"></div>'),
('clock-sweep 淘汰','缓冲区满了，替换哪一页。','<div id="p2"></div>'),
('动手：读 BUFFERS 输出','同一个查询在不同情况下的 EXPLAIN (ANALYZE, BUFFERS, TIMING)。选择一种情况，判断数据来自哪里。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','查看缓冲区与 I/O 统计。','<div id="t4"></div>'),
('在你的电脑上练习','使用 shop 库的 orders 表（约 11 MB）。',prac([
 ('当前设置。','SHOW shared_buffers; SHOW effective_cache_size;',' shared_buffers\n----------------\n 128MB\n effective_cache_size\n----------------------\n 4GB'),
 ('第一次执行（重启容器后）：大部分是 read。','\\! docker restart pg\nEXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM orders;',' Aggregate  (actual time=18.402..18.403 rows=1 loops=1)\n   Buffers: shared read=1370\n   ->  Seq Scan on orders  (actual time=0.512..13.920 rows=100000 loops=1)\n         Buffers: shared read=1370'),
 ('再执行一次：全部命中。','EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM orders;',' Aggregate  (actual time=7.212..7.213 rows=1 loops=1)\n   Buffers: shared hit=1370'),
 ('用 pg_buffercache 看 orders 占了多少缓冲区。','CREATE EXTENSION pg_buffercache;\nSELECT c.relname, count(*) AS buffers, pg_size_pretty(count(*) * 8192) AS size\nFROM pg_buffercache b JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)\nWHERE b.reldatabase = (SELECT oid FROM pg_database WHERE datname = current_database())\nGROUP BY c.relname ORDER BY 2 DESC LIMIT 3;','     relname     | buffers |  size\n-----------------+---------+--------\n orders          |    1370 | 11 MB\n orders_pkey     |     276 | 2208 kB\n pg_attribute    |      38 | 304 kB'),
 ('数据库级命中率。','SELECT datname, round(blks_hit * 100.0 / nullif(blks_hit + blks_read, 0), 2) AS hit_pct FROM pg_stat_database WHERE datname = \'shop\';',' datname | hit_pct\n---------+---------\n shop    |   98.71'),
 ('打开 I/O 计时，看真实耗时。','SET track_io_timing = on;\nSELECT pg_buffercache_evict_relation(\'orders\');\nEXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM orders;','   Buffers: shared read=1370\n   I/O Timings: shared read=1.912')],
 ('定位一个“慢但没缺索引”的查询','某接口偶尔慢：<code>SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20</code>。已有索引 (user_id, created_at)。慢的时候 EXPLAIN 显示 <code>Buffers: shared hit=3 read=21</code>、<code>I/O Timings: shared read=38.5</code>，快的时候 <code>shared hit=24</code>。解释原因，给出两种改进方向。',
 '<p>计划本身没问题，都是 24 个页。慢的那次有 21 页不在共享缓冲区，需要从操作系统读；38.5 ms 的读耗时说明它们也不在页缓存里，是真的读盘（每页约 2 ms，典型的云盘随机读）。冷门用户的订单分散在很多堆页上，每一行都在不同的页。</p><p>方向一：减少要读的页。用覆盖索引 <code>CREATE INDEX ON orders (user_id, created_at DESC) INCLUDE (amount, status)</code> 并只查需要的列，配合可见性映射走 Index Only Scan，几乎不读堆页；或者按 user_id 定期 <code>CLUSTER</code>（需锁表，通常用 pg_repack）让同一用户的行相邻。</p><p>方向二：让更多数据留在内存——工作集放不下时增大内存和 shared_buffers，或换随机读延迟更低的存储。先做方向一，代价小、效果确定。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
