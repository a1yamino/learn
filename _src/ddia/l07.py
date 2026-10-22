TITLE='B 树、二级索引与内存数据库';DESC='第 4 章第二部分。B 树是半个世纪以来最常用的索引结构，PostgreSQL、MySQL InnoDB 的主键与普通索引都是 B 树。本课讲 B 树的页、分支因子与深度，原地更新如何通过 WAL 保证崩溃安全，B 树与 LSM 树在写放大、读性能、空间与可预测性上的比较，然后讲多列索引、二级索引、聚集索引与覆盖索引，最后讨论内存数据库为什么快。';NEXT='分析型存储：列存、向量化与物化视图';MIN=60
SUM=['<b>B 树</b>把数据分成固定大小的<b>页</b>（PostgreSQL 为 8 KB），每页包含若干键和指向子页的引用，键之间的区间对应一个子页。查找从根页出发逐层向下，直到叶子页。每页的子引用数叫<b>分支因子</b>，通常几百；分支因子 500、深度 4 的 B 树可以容纳约 250 TB 数据，所以大部分查找只需要读 3–4 个页，而上层页几乎总在缓存里。',
'<b>写入</b>：找到键所在的叶子页，原地修改；页满了就<b>分裂</b>成两页，并更新父页。一次插入可能修改好几个页，若中途崩溃，树就损坏了。所以 B 树配合<b>预写日志（WAL）</b>：先把要做的修改顺序写入 WAL，崩溃后重放。另一种做法是写时复制（LMDB）：修改写到新页，再原子地切换父引用。并发访问需要页级的轻量锁（latch）。',
'<b>B 树与 LSM 比较</b>：LSM 的写入是顺序的，写吞吐通常更高、压缩后空间更小；但后台合并会与前台请求争抢磁盘，导致尾延迟不稳定，同一个键可能存在于多个段，读取要查多处。B 树每个键只在一处，读取可预测，便于实现事务的范围锁；但每次写至少写一个整页（写放大），还会有页内碎片。实际选择要用自己的负载做测试。',
'<b>二级索引</b>：主键之外按其他列建立的索引，值可以重复。索引中存什么？要么是行的引用（PostgreSQL 的堆元组位置），要么是主键（InnoDB 的二级索引，再回主键索引查一次）。<b>聚集索引</b>把整行直接存在索引里（InnoDB 主键）。<b>覆盖索引</b>额外存放某些列（<code>INCLUDE</code>），查询只读索引就能得到答案（Index Only Scan）。',
'<b>多列索引</b>：<code>(last_name, first_name)</code> 按拼接后的顺序排序，能高效回答“姓 = 张”和“姓 = 张且名 = 三”，不能高效回答只按名查询——最左前缀原则。多维范围查询（经纬度同时取范围）需要 R 树、GiST 等空间索引（第 8 课）。',
'<b>内存数据库</b>（Redis、VoltDB、SAP HANA 等）快，主要不是因为“不读磁盘”——磁盘数据库的热数据也在页缓存里——而是因为省去了把内存数据结构编码成磁盘格式的开销，并且可以使用难以在磁盘上实现的数据结构（Redis 的有序集合、HyperLogLog）。持久化通过日志、快照或复制完成（见 <a href="../redis/index.html">Redis 课程</a>的 RDB 与 AOF）。']
def secs(prac,E):
    return [
('B 树查找与分裂','从根到叶的一次查找，以及页满时的分裂。','<div id="p1"></div>'),
('动手：B 树有多深','选择数据量与分支因子，看需要读几个页。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:90px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('二级索引与覆盖索引','索引里存什么，决定还要不要回表。','<div id="p2"></div>'),
('查看真实的 B 树','用 pageinspect 看 PostgreSQL 的索引结构。','<div id="t4"></div>'),
('在你的电脑上练习','使用第 1 课的 <code>pg</code> 容器与 <code>orders</code> 表（100 万行）。<a href="../postgres/index.html">PostgreSQL 课程</a>的索引课有更多细节。',prac([
 ('查看主键 B 树的深度。','CREATE EXTENSION IF NOT EXISTS pageinspect;\nSELECT root, level FROM bt_metap(\'orders_pkey\');',' root | level\n------+-------\n  412 |     2'),
 ('level 2 表示根之下还有两层：一次查找读 3 个页。查看索引大小与页数。','SELECT pg_size_pretty(pg_relation_size(\'orders_pkey\')), pg_relation_size(\'orders_pkey\') / 8192 AS pages;',' pg_size_pretty | pages\n----------------+-------\n 21 MB          |  2745'),
 ('二级索引：按 user_id 查询。','CREATE INDEX orders_user ON orders(user_id);\nEXPLAIN SELECT amount FROM orders WHERE user_id = 42;','Bitmap Heap Scan on orders …\n  ->  Bitmap Index Scan on orders_user …\n        Index Cond: (user_id = 42)'),
 ('覆盖索引：把 amount 放进索引，不再回表。','CREATE INDEX orders_user_cov ON orders(user_id) INCLUDE (amount);\nVACUUM orders;\nEXPLAIN SELECT amount FROM orders WHERE user_id = 42;','Index Only Scan using orders_user_cov on orders …\n  Index Cond: (user_id = 42)'),
 ('多列索引与最左前缀。','CREATE INDEX orders_uc ON orders(user_id, created_at);\nEXPLAIN SELECT * FROM orders WHERE created_at > \'2026-10-01\';','Seq Scan on orders …\n  Filter: (created_at > …)\n（只按第二列查询用不上这个索引）')],
 ('为一张消息表设计索引','表 <code>messages(id bigint PK, chat_id bigint, sender_id bigint, sent_at timestamptz, body text, deleted bool)</code>，5 亿行。高频查询：Q1 某个会话按时间倒序分页取 50 条未删除消息；Q2 某个会话里某人发的消息数；Q3 按 id 取一条。写入：每秒 2 万条，很少更新。请设计索引，说明每个查询如何使用它们，并讨论这张表更适合 B 树还是 LSM 存储引擎。',
 '<ol><li>Q3 用主键 B 树。Q1：<code>CREATE INDEX ON messages (chat_id, sent_at DESC) WHERE NOT deleted;</code>——部分索引排除已删除消息，多列顺序满足“等值 + 排序”，分页用 <code>WHERE chat_id = $1 AND sent_at &lt; $last ORDER BY sent_at DESC LIMIT 50</code>（键集分页，而不是 OFFSET）。若列表页只显示摘要，可以 <code>INCLUDE (sender_id)</code> 做到只读索引。</li><li>Q2：<code>(chat_id, sender_id)</code> 上的索引，配合 VACUUM 后的可见性映射可以做 Index Only Scan 计数；如果非常高频，维护一张计数表（派生数据）更好。</li><li>每个索引都会增加写入成本：每秒 2 万次插入 × 3 个二级索引，B 树的随机页写入与 WAL 量会很可观。写多读少、几乎不更新、按 (chat_id, 时间) 顺序读取——这是 LSM 的典型场景（例如 Cassandra/ScyllaDB 以 chat_id 为分区键、sent_at 为聚簇键，Discord 的消息存储就是这样设计的）。如果留在 PostgreSQL，可以按时间分区表，并控制索引数量。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
