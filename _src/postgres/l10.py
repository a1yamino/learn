TITLE='B-tree 索引内部';DESC='第 4 课从使用者角度讲了索引，本课打开 B-tree 看结构：元页、根页、内部页和叶子页，键如何在页内有序存放，查找和范围扫描怎么走，插入时页分裂，以及去重、索引膨胀、Index Only Scan 与可见性映射。';NEXT='GIN、GiST、BRIN 与表达式、部分索引';MIN=60
SUM=['PostgreSQL 的 B-tree（Lehman-Yao 变体）由 8 KB 的页组成：第 0 页是<b>元页</b>，记录根页位置；<b>根页</b>和<b>内部页</b>存“分隔键 → 下层页”，<b>叶子页</b>存“键 → 堆元组 ctid”。同层页通过左右指针连成双向链表。',
'查找从根往下，每层在页内二分查找，树高通常只有 3–4 层：一亿行的索引一次查找也只读 3–4 个索引页。范围扫描找到起点后沿叶子链表向右（或向左，支持 DESC）走。',
'叶子页满时<b>页分裂</b>：分一半到新页，并向父页插入新的分隔键，父页满了再向上分裂；根分裂时树长高一层。单调递增的键（自增 id、时间戳）总在最右页插入，PostgreSQL 会做不对半的“最右分裂”，页几乎填满。',
'PostgreSQL 13+ 的<b>去重</b>把相同键的多个 ctid 合并到一个条目（posting list），重复值多的索引小很多。删除和更新留下的死条目由 VACUUM 清理，或在页将要分裂前被“自底向上删除”提前清掉。',
'<b>Index Only Scan</b>：所需列都在索引中（可用 <code>INCLUDE</code> 附加列），且堆页在<b>可见性映射</b>中标记为全部可见时，可以不访问堆。EXPLAIN 的 <code>Heap Fetches</code> 显示仍需回表的次数，VACUUM 越及时越少。',
'随机 UUID（v4）作为主键会让插入分散到整棵树，频繁分裂、缓存命中差；按时间有序的 UUIDv7（PostgreSQL 18 提供 <code>uuidv7()</code>）或 bigint 自增更友好。索引膨胀时用 <code>REINDEX CONCURRENTLY</code> 重建。']
def secs(prac,E):
    return [
('B-tree 的结构与查找','从根到叶子。','<div id="p1"></div>'),
('插入与页分裂','叶子页满了以后。','<div id="p2"></div>'),
('动手：这次查找读几页','orders 有 1000 万行，user_id 索引高 3 层。选择查询，看访问路径和读的页数。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','用 pageinspect 和 pgstattuple 看索引。','<div id="t4"></div>'),
('在你的电脑上练习','使用 shop 库，需要 pageinspect 和 pgstattuple 扩展。',prac([
 ('元页：根页号和树高。','CREATE EXTENSION IF NOT EXISTS pageinspect;\nSELECT root, level, fastroot FROM bt_metap(\'orders_pkey\');',' root | level | fastroot\n------+-------+----------\n    3 |     1 |        3'),
 ('根页内容：分隔键指向叶子页。','SELECT itemoffset, ctid, data FROM bt_page_items(\'orders_pkey\', 3) LIMIT 4;',' itemoffset |  ctid  |          data\n------------+--------+-------------------------\n          1 | (1,0)  |\n          2 | (2,1)  | 6f 01 00 00 00 00 00 00\n          3 | (4,1)  | dd 02 00 00 00 00 00 00\n          4 | (5,1)  | 4b 04 00 00 00 00 00 00'),
 ('叶子页：键和堆 ctid。','SELECT itemoffset, ctid, data FROM bt_page_items(\'orders_pkey\', 1) LIMIT 3;',' itemoffset | ctid  |          data\n------------+-------+-------------------------\n          1 | (2,1) | 6f 01 00 00 00 00 00 00\n          2 | (0,1) | 01 00 00 00 00 00 00 00\n          3 | (0,2) | 02 00 00 00 00 00 00 00'),
 ('去重的效果：低基数列上的索引。','CREATE INDEX orders_status_idx ON orders (status);\nCREATE INDEX orders_status_nodedup ON orders (status) WITH (deduplicate_items = off);\nSELECT relname, pg_size_pretty(pg_relation_size(oid)) FROM pg_class WHERE relname LIKE \'orders_status%\';','        relname        | pg_size_pretty\n-----------------------+----------------\n orders_status_idx     | 696 kB\n orders_status_nodedup | 2208 kB'),
 ('Index Only Scan 与 Heap Fetches。','CREATE INDEX orders_user_amt ON orders (user_id) INCLUDE (amount);\nVACUUM orders;\nEXPLAIN (ANALYZE) SELECT sum(amount) FROM orders WHERE user_id = 42;','   ->  Index Only Scan using orders_user_amt on orders (actual rows=118 loops=1)\n         Index Cond: (user_id = 42)\n         Heap Fetches: 0'),
 ('随机 UUID 与 UUIDv7：插入 100 万行后的索引大小。','CREATE TABLE u4 (id uuid PRIMARY KEY DEFAULT gen_random_uuid());\nCREATE TABLE u7 (id uuid PRIMARY KEY DEFAULT uuidv7());\n\\timing on\nINSERT INTO u4 SELECT FROM generate_series(1,1000000);\nINSERT INTO u7 SELECT FROM generate_series(1,1000000);\nSELECT pg_size_pretty(pg_relation_size(\'u4_pkey\')), pg_size_pretty(pg_relation_size(\'u7_pkey\'));','Time: 4521.7 ms\nTime: 2104.3 ms\n pg_size_pretty | pg_size_pretty\n----------------+----------------\n 38 MB          | 30 MB')],
 ('诊断一个膨胀的索引','一个只追加、每天删除 30 天前数据的 events 表，主键 bigint 自增。半年后 events_pkey 从 2 GB 涨到 9 GB，而行数基本不变。用 pgstattuple 确认并解释原因，给出处理方法。',
 '<pre class="cmd">SELECT avg_leaf_density, leaf_fragmentation FROM pgstatindex(\'events_pkey\');</pre><pre class="out"> avg_leaf_density | leaf_fragmentation\n------------------+--------------------\n            21.30 |              48.20</pre><p>叶子页平均只有 21% 是满的。键单调递增：新行总插在最右边，旧行在最左边被删除。VACUUM 能删除死条目，但只有<b>完全空</b>的页才能被回收并放入空闲列表；删除往往留下大量稀疏的页，而新键永远不会插回左边去填它们。</p><p>处理：<code>REINDEX INDEX CONCURRENTLY events_pkey;</code> 立即恢复到约 90% 填充。根治：按天或按月分区（第 20 课），过期数据直接 <code>DROP</code>/<code>DETACH</code> 分区，没有删除也就没有膨胀；同时确保 autovacuum 及时运行。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
