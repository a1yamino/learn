TITLE='MVCC：元组版本与快照可见性';DESC='上一课的隔离级别都建立在 MVCC（多版本并发控制）之上：写不阻塞读，读不阻塞写。本课讲事务 ID 与 pg_xact、快照的三个组成部分 xmin / xmax / xip，一个元组版本对某个快照是否可见的判断规则、提示位，以及 HOT 更新如何避免修改索引。';NEXT='VACUUM、autovacuum 与事务 ID 回卷';MIN=65
SUM=['每个写事务分配一个递增的 32 位<b>事务 ID</b>（xid）。事务的最终状态（进行中、已提交、已中止）记录在 <code>pg_xact</code>（原来叫 clog）中，每个事务 2 位。',
'每个元组版本带 <code>xmin</code>（创建它的事务）和 <code>xmax</code>（删除它或用新版本替换它的事务，0 表示仍有效）。UPDATE = 把旧版本的 xmax 设为自己 + 插入一个 xmin 为自己的新版本。',
'<b>快照</b> = <code>xmin:xmax:xip_list</code>。小于 xmin 的事务都已结束；大于等于 xmax 的事务在快照之后才开始，一律不可见；xip_list 是取快照时仍在进行的事务，也不可见。',
'可见性规则（简化）：一个版本可见，当且仅当 <b>xmin 已提交且对快照可见</b>，并且 <b>xmax 为空、或 xmax 已中止、或 xmax 对快照不可见</b>。自己事务的修改另有命令号（cmin/cmax）规则。',
'查 pg_xact 有开销，第一次确认后在元组的 infomask 中设置<b>提示位</b>（如 XMIN_COMMITTED），之后不用再查。这就是只读查询也会让页变脏的原因（第 9 课）。',
'<b>HOT 更新</b>（heap-only tuple）：如果没有修改任何被索引的列，且同一页里有空间放新版本，新版本只在页内用链连接，不新增索引条目。降低表的 <code>fillfactor</code> 给页内留空间，可以提高 HOT 比例。']
def secs(prac,E):
    return [
('版本链','UPDATE 和 DELETE 之后，页里有什么。','<div id="p1"></div>'),
('快照判断可见性','同一个元组，不同的事务看到不同的结果。','<div id="p2"></div>'),
('动手：这个版本对我可见吗','我的快照是 <code>100:104:{101,103}</code>（101 和 103 仍在进行，102 已提交，99 已中止）。选择一个元组版本，判断是否可见。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','查看事务 ID、快照与元组的系统列。','<div id="t4"></div>'),
('在你的电脑上练习','两个 psql 窗口，使用 accounts 表。',prac([
 ('窗口 1：当前事务 ID 和快照。','BEGIN;\nSELECT pg_current_xact_id(), pg_current_snapshot();',' pg_current_xact_id | pg_current_snapshot\n--------------------+---------------------\n                951 | 951:951:'),
 ('窗口 1：修改一行但不提交。','UPDATE accounts SET balance = 1 WHERE name = \'A\';\nSELECT xmin, xmax, ctid, * FROM accounts;',' xmin | xmax | ctid  | name | balance\n------+------+-------+------+---------\n  790 |    0 | (0,4) | B    |     140\n  951 |    0 | (0,6) | A    |       1'),
 ('窗口 2：看到的是旧版本，它的 xmax 是窗口 1 的事务。','SELECT pg_current_snapshot();\nSELECT xmin, xmax, ctid, * FROM accounts;',' pg_current_snapshot\n---------------------\n 951:953:951\n xmin | xmax | ctid  | name | balance\n------+------+-------+------+---------\n  790 |    0 | (0,4) | B    |     140\n  815 |  951 | (0,5) | A    |      70'),
 ('窗口 1 回滚后，窗口 2 再看：xmax 还在，但 951 已中止，所以版本依然有效。','-- 窗口 1\nROLLBACK;\n-- 窗口 2\nSELECT xmin, xmax, ctid, * FROM accounts WHERE name = \'A\';',' xmin | xmax | ctid  | name | balance\n------+------+-------+------+---------\n  815 |  951 | (0,5) | A    |      70'),
 ('pageinspect 看提示位（t_infomask）。','SELECT lp, t_xmin, t_xmax, t_infomask & 256 > 0 AS xmin_committed, t_infomask & 2048 > 0 AS xmax_invalid\nFROM heap_page_items(get_raw_page(\'accounts\', 0)) WHERE lp >= 5;',' lp | t_xmin | t_xmax | xmin_committed | xmax_invalid\n----+--------+--------+----------------+--------------\n  5 |    815 |    951 | t              | t\n  6 |    951 |      0 | f              | t'),
 ('HOT 更新：只改未建索引的列。','SELECT n_tup_upd, n_tup_hot_upd FROM pg_stat_user_tables WHERE relname = \'accounts\';\nUPDATE accounts SET balance = balance + 1 WHERE name = \'B\';\nSELECT n_tup_upd, n_tup_hot_upd FROM pg_stat_user_tables WHERE relname = \'accounts\';',' n_tup_upd | n_tup_hot_upd\n-----------+---------------\n        12 |            10\n n_tup_upd | n_tup_hot_upd\n-----------+---------------\n        13 |            11')],
 ('为什么 HOT 比例这么低','orders 表每笔订单平均被 UPDATE 5 次（status 流转），<code>pg_stat_user_tables</code> 显示 n_tup_hot_upd / n_tup_upd 只有 8%，索引膨胀严重。表上有索引 (user_id)、(status)、(created_at)、(updated_at)。分析原因并给出改进。',
 '<p>HOT 的两个条件：不修改任何被索引的列；同一页有空间放新版本。这里每次 UPDATE 都会改 <code>status</code> 和 <code>updated_at</code>，两者都有索引，所以 HOT 不可能发生，每次更新都要在 4 个索引中各插一个新条目。</p><ul><li>评估这两个索引是否必要：<code>updated_at</code> 索引常常只是“可能有用”，用 <code>idx_scan</code> 确认后删除。<code>status</code> 基数低，通常改为部分索引 <code>(created_at) WHERE status = \'pending\'</code>——注意部分索引的谓词列也算被索引的列，改 status 时仍不能 HOT，但只有进出 pending 时才需要改这个小索引。</li><li>剩下的索引都不含被频繁修改的列后，把 <code>fillfactor</code> 调到 80–90（<code>ALTER TABLE orders SET (fillfactor = 85)</code>，对新页生效，可用 pg_repack 重写旧页），给页内留出放新版本的空间。</li></ul><p>预期 HOT 比例会升到 80% 以上，索引写入和膨胀明显下降，VACUUM 也更轻松：HOT 链的旧版本可以在页内被“剪枝”（读取时就能清理），不需要等 VACUUM。PostgreSQL 16 起修改 BRIN 索引列也不再阻止 HOT。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
