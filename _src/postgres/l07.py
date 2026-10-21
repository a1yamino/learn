TITLE='存储：页、堆元组与 TOAST';DESC='从这一课开始进入内部原理。表在磁盘上是一组文件，文件由 8 KB 的页组成，页里存放带头部信息的元组。本课讲数据目录的结构、页的布局、元组头里的 xmin / xmax、ctid 是什么，以及超过约 2 KB 的大字段如何被 TOAST 压缩和切片存放。';NEXT='WAL：预写日志与检查点';MIN=60
SUM=['数据目录 <code>PGDATA</code>（容器里是 <code>/var/lib/postgresql/18/docker</code>）下，<code>base/&lt;数据库 OID&gt;/&lt;relfilenode&gt;</code> 就是一张表的文件。超过 1 GB 切成 <code>.1</code>、<code>.2</code> 段；<code>_fsm</code> 是空闲空间映射，<code>_vm</code> 是可见性映射。',
'表文件（堆）由 8 KB 的<b>页</b>组成。页头之后是<b>行指针数组</b>（line pointer，向后增长），元组从页尾向前存放，中间是空闲空间。',
'<code>ctid = (页号, 行指针号)</code> 是元组的物理位置，索引条目存的就是它。UPDATE 会生成新版本、ctid 改变，所以 ctid 不能当作稳定的行标识。',
'每个元组有约 23 字节的头：<code>xmin</code>（插入它的事务）、<code>xmax</code>（删除或锁定它的事务）、infomask 标志位、NULL 位图。列按类型对齐存放，列顺序会影响填充字节（把 8 字节的列放前面能省空间）。',
'元组不能跨页。一行超过约 2 KB（<code>TOAST_TUPLE_THRESHOLD</code>）时，变长字段先被压缩（默认 pglz，可设为 lz4），仍然太大就切成约 2 KB 的块存进该表专属的 <b>TOAST 表</b>，主元组里只留一个指针。',
'<code>SELECT *</code> 会把 TOAST 字段读出并解压；只查需要的列，大字段不读就不付出代价。频繁更新大 jsonb 字段的一小部分，代价是整个值重写。']
def secs(prac,E):
    return [
('一个页的内部','8 KB 的页如何存放元组。','<div id="p1"></div>'),
('TOAST：大字段放在哪里','超过约 2 KB 的行。','<div id="p2"></div>'),
('动手：看看这一页','用 pageinspect 读 accounts 表的第 0 页。选择一个操作，看页中的行指针和元组头怎么变化。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','定位文件、查看大小与页内容。','<div id="t4"></div>'),
('在你的电脑上练习','使用 shop 库。pageinspect 扩展随官方镜像提供，需要超级用户。',prac([
 ('表对应的文件。','SELECT pg_relation_filepath(\'accounts\');',' pg_relation_filepath\n----------------------\n base/16384/16422'),
 ('在容器里看这个文件：两行数据也占一整页。','docker exec pg ls -l /var/lib/postgresql/18/docker/base/16384/16422','-rw------- 1 postgres postgres 8192 Oct 22 10:20 /var/lib/postgresql/18/docker/base/16384/16422'),
 ('查看行的物理位置和插入事务。','SELECT ctid, xmin, xmax, * FROM accounts;',' ctid  | xmin | xmax | name | balance\n-------+------+------+------+---------\n (0,3) |  790 |    0 | A    |      70\n (0,4) |  790 |    0 | B    |     140'),
 ('UPDATE 后 ctid 变了。','UPDATE accounts SET balance = balance WHERE name = \'A\';\nSELECT ctid, xmin, name FROM accounts;',' ctid  | xmin | name\n-------+------+------\n (0,4) |  790 | B\n (0,5) |  815 | A'),
 ('用 pageinspect 看页里的全部元组，包括旧版本。','CREATE EXTENSION pageinspect;\nSELECT lp, lp_off, lp_len, t_xmin, t_xmax, t_ctid FROM heap_page_items(get_raw_page(\'accounts\', 0));',' lp | lp_off | lp_len | t_xmin | t_xmax | t_ctid\n----+--------+--------+--------+--------+--------\n  1 |   8152 |     35 |    788 |    790 | (0,3)\n  2 |   8112 |     35 |    788 |    790 | (0,4)\n  3 |   8072 |     35 |    790 |    815 | (0,5)\n  4 |   8032 |     35 |    790 |      0 | (0,4)\n  5 |   7992 |     35 |    815 |      0 | (0,5)'),
 ('TOAST：插入一个大文本，看主表和 TOAST 表的大小。','CREATE TABLE docs (id int, body text);\nINSERT INTO docs SELECT 1, string_agg(md5(i::text), \'\') FROM generate_series(1, 20000) i;\nSELECT pg_size_pretty(pg_relation_size(\'docs\')) AS heap,\n       pg_size_pretty(pg_relation_size(reltoastrelid)) AS toast,\n       pg_column_size(body) AS stored, octet_length(body) AS raw\nFROM pg_class, docs WHERE relname = \'docs\';',' heap  | toast  | stored | raw\n-------+--------+--------+--------\n 8192 bytes | 352 kB | 352424 | 640000')],
 ('列顺序与对齐','创建两张列相同但顺序不同的表：<code>(a boolean, b bigint, c boolean, d bigint)</code> 和 <code>(b bigint, d bigint, a boolean, c boolean)</code>，各插入 100 万行，比较表大小。解释差异来自哪里。',
 '<pre class="cmd">CREATE TABLE t_bad (a boolean, b bigint, c boolean, d bigint);\nCREATE TABLE t_good (b bigint, d bigint, a boolean, c boolean);\nINSERT INTO t_bad SELECT true, i, false, i FROM generate_series(1,1000000) i;\nINSERT INTO t_good SELECT i, i, true, false FROM generate_series(1,1000000) i;\nSELECT relname, pg_size_pretty(pg_relation_size(oid)) FROM pg_class WHERE relname LIKE \'t\\_%\';</pre><pre class="out"> relname | pg_size_pretty\n---------+----------------\n t_bad   | 50 MB\n t_good  | 42 MB</pre><p>bigint 要求 8 字节对齐。t_bad 中 boolean（1 字节）后面紧跟 bigint，要补 7 个填充字节，两处共 14 字节浪费；t_good 把两个 bigint 放在前面，两个 boolean 紧挨在后面。每行再加上 23 字节头（对齐到 24）和 4 字节行指针，差距约 16%。对宽表和大表值得在建表时把定长的宽类型放前面、变长类型放后面；对已有表通常不值得为此重建。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
