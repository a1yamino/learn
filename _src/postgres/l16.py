TITLE='VACUUM、autovacuum 与事务 ID 回卷';DESC='MVCC 的代价是死元组：被删除和被替换的旧版本会一直留在表里，直到 VACUUM 确认没有任何快照还需要它们。本课讲 VACUUM 做的几件事、可见性映射和冻结映射、autovacuum 何时触发以及如何调优、什么在阻止清理，以及 32 位事务 ID 用尽时的回卷保护。';NEXT='锁：行锁、表锁与死锁';MIN=65
SUM=['普通 <code>VACUUM</code>：扫描表，找出对所有事务都不可见的死元组，删除指向它们的索引条目，标记堆中的空间可复用（更新 FSM），更新<b>可见性映射</b>（VM）和统计信息。它不阻塞读写，但通常<b>不会把文件变小</b>（只截断表尾的空页）。',
'<code>VACUUM FULL</code> 重写整张表和索引，回收全部空间，但持有 ACCESS EXCLUSIVE 锁、需要额外一份空间。生产上用 <code>pg_repack</code> 或 <code>pg_squeeze</code> 在线重写。',
'<b>autovacuum</b> 在死元组数超过 <code>autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor × reltuples</code>（默认 50 + 20%）时触发；插入量达到阈值也会触发（让 VM 和冻结跟上）。大表的 20% 太大，应按表调小 scale_factor。<code>autovacuum_vacuum_cost_limit</code> 控制节流，默认偏保守。',
'VACUUM 只能清理比所有会话的最老快照（<b>xmin 视界</b>）更旧的死元组。长事务、<code>idle in transaction</code>、废弃的复制槽、开启 hot_standby_feedback 的副本上的长查询、未提交的两阶段事务都会让视界停住，表就持续膨胀。',
'xid 是 32 位，比较按模 2<sup>32</sup> 的“环”进行，只能区分前后约 20 亿个事务。为防止回卷后旧数据“变成未来”，VACUUM 会把足够老的元组<b>冻结</b>（标记为对所有人可见）。<code>age(relfrozenxid)</code> 超过 <code>autovacuum_freeze_max_age</code>（2 亿）时强制进行防回卷 VACUUM，即使 autovacuum 被关闭。',
'剩余 xid 少于约 300 万时，数据库拒绝分配新事务 ID，只能停机维护。监控 <code>age(datfrozenxid)</code>，远在此之前就要找出阻止冻结的原因。']
def secs(prac,E):
    return [
('VACUUM 做了什么','从死元组到可复用空间。','<div id="p1"></div>'),
('事务 ID 回卷与冻结','20 亿的视野。','<div id="p2"></div>'),
('动手：为什么表还在膨胀','autovacuum 一直在运行，表却越来越大。选择一个排查查询，看结果说明了什么。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','监控与调优 VACUUM。','<div id="t4"></div>'),
('在你的电脑上练习','使用 shop 库。先关闭一张测试表的 autovacuum，手动观察。',prac([
 ('准备：一张 100 万行的表。','CREATE TABLE bloat (id int PRIMARY KEY, v text) WITH (autovacuum_enabled = off);\nINSERT INTO bloat SELECT i, md5(i::text) FROM generate_series(1, 1000000) i;\nSELECT pg_size_pretty(pg_relation_size(\'bloat\'));',' pg_size_pretty\n----------------\n 65 MB'),
 ('全表更新一次：大小翻倍，一半是死元组。','UPDATE bloat SET v = v || \'x\';\nSELECT pg_size_pretty(pg_relation_size(\'bloat\')), n_live_tup, n_dead_tup FROM pg_stat_user_tables WHERE relname = \'bloat\';',' pg_size_pretty | n_live_tup | n_dead_tup\n----------------+------------+------------\n 130 MB         |    1000000 |    1000000'),
 ('VACUUM：死元组清掉，文件大小不变，但空间可以复用。','VACUUM (VERBOSE) bloat;\nSELECT pg_size_pretty(pg_relation_size(\'bloat\')), n_dead_tup FROM pg_stat_user_tables WHERE relname = \'bloat\';','INFO:  vacuuming "shop.public.bloat"\nINFO:  finished vacuuming "shop.public.bloat": index scans: 1\npages: 0 removed, 16667 remain …\ntuples: 1000000 removed, 1000000 remain, 0 are dead but not yet removable\n pg_size_pretty | n_dead_tup\n----------------+------------\n 130 MB         |          0'),
 ('再更新一次：复用了空闲空间，大小没有继续增长。','UPDATE bloat SET v = v || \'y\';\nSELECT pg_size_pretty(pg_relation_size(\'bloat\'));',' pg_size_pretty\n----------------\n 131 MB'),
 ('长事务阻止清理：窗口 2 开一个 REPEATABLE READ 事务读一次，窗口 1 更新并 VACUUM。','-- 窗口 2\nBEGIN ISOLATION LEVEL REPEATABLE READ; SELECT count(*) FROM bloat;\n-- 窗口 1\nUPDATE bloat SET v = v || \'z\' WHERE id <= 100000;\nVACUUM (VERBOSE) bloat;','tuples: 0 removed, 1100000 remain, 100000 are dead but not yet removable\nremovable cutoff: 1012, which was 3 XIDs old when operation ended'),
 ('数据库和表的事务 ID 年龄。','SELECT datname, age(datfrozenxid) FROM pg_database;\nSELECT relname, age(relfrozenxid) FROM pg_class WHERE relkind = \'r\' ORDER BY 2 DESC LIMIT 3;',' datname  |  age\n----------+-------\n shop     |  1040\n postgres |  1040\n relname | age\n---------+------\n bloat   | 1040\n …')],
 ('给大表调 autovacuum','events 表 8 亿行，每天更新约 500 万行。现在 autovacuum 大约每 30 天才处理它一次，每次运行 10 小时，期间查询变慢，表已膨胀到 2 倍。给出表级配置并解释每一项。',
 '<pre class="cmd">ALTER TABLE events SET (\n  autovacuum_vacuum_scale_factor = 0.005,   -- 约 400 万死元组触发\n  autovacuum_vacuum_threshold = 10000,\n  autovacuum_vacuum_insert_scale_factor = 0.01,\n  autovacuum_analyze_scale_factor = 0.005,\n  autovacuum_vacuum_cost_limit = 2000        -- 放宽这张表的节流\n);\n-- 全局：ALTER SYSTEM SET autovacuum_vacuum_cost_delay = \'2ms\'; maintenance_work_mem 或 autovacuum_work_mem = \'1GB\'</pre><p>默认 20% 意味着 1.6 亿个死元组才触发，一次要处理的量巨大。把阈值降到 0.5%，大约每天一次，每次处理的量小、时间短，死元组在膨胀之前就被复用。放宽 cost_limit 让单次运行更快完成；足够大的 <code>autovacuum_work_mem</code> 让死元组 TID 一次装下（PostgreSQL 17 起用更紧凑的结构），索引只需扫描一遍。已有的膨胀不会因此消失：用 pg_repack 在线重写一次。同时检查是否有长事务或废弃复制槽阻挡 xmin 视界，否则怎么调都没用。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
