TITLE='分区表';DESC='一张表到了几亿行、几百 GB 时，维护（VACUUM、建索引、删除旧数据）会越来越痛苦。分区把一张逻辑表拆成多张物理表，查询只访问相关的分区，过期数据可以整块删除。本课讲声明式分区的三种方式、分区裁剪、分区上的索引和约束、ATTACH / DETACH，以及什么时候不该分区。';NEXT='连接池：PgBouncer';MIN=60
SUM=['声明式分区：<code>CREATE TABLE events (…) PARTITION BY RANGE (created_at)</code>，再为每个范围建分区 <code>CREATE TABLE events_2026_10 PARTITION OF events FOR VALUES FROM (\'2026-10-01\') TO (\'2026-11-01\')</code>。父表本身不存数据。还有 <code>LIST</code>（按地区、租户）和 <code>HASH</code>（均匀打散）。',
'<b>分区裁剪</b>：WHERE 中有分区键的条件时，规划阶段（常量）或执行阶段（参数、子查询结果）跳过不相关的分区。查询不带分区键时要扫描所有分区，比不分区还慢。',
'在父表上建索引会自动在每个分区上建；<b>主键和唯一约束必须包含分区键</b>，因为唯一性只能在每个分区内部检查。所以按时间分区时，主键往往是 <code>(id, created_at)</code>。',
'删除旧数据：<code>ALTER TABLE events DETACH PARTITION events_2025_01 CONCURRENTLY</code> 后 DROP，瞬间完成，没有死元组也没有 VACUUM 压力。加载数据：先建好独立的表、导入并建索引，再 <code>ATTACH PARTITION</code>（预先加一个匹配的 CHECK 约束可以避免扫描验证）。',
'设一个 <code>DEFAULT</code> 分区接收不匹配任何范围的行，但要监控它：它有数据时，新建与之重叠的分区需要扫描它。新分区要提前创建，通常用 pg_partman 或定时任务。',
'不要过早分区：几千万行、索引得当的表通常不需要。分区数量保持在几百以内；太多分区会让规划时间和锁开销上升。分区键应该是绝大多数查询都会带上的列。']
def secs(prac,E):
    return [
('分区裁剪','查询只访问需要的分区。','<div id="p1"></div>'),
('滚动删除旧数据','DELETE 与 DROP PARTITION。','<div id="p2"></div>'),
('动手：这个查询扫描哪些分区','events 按月分区（2026 年 1–12 月）。选择查询，看计划。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','管理分区。','<div id="t4"></div>'),
('在你的电脑上练习','在 shop 库中建一张按月分区的 events 表。',prac([
 ('建分区表和三个月的分区。','CREATE TABLE events (id bigint GENERATED ALWAYS AS IDENTITY, created_at timestamptz NOT NULL, user_id int, kind text,\n  PRIMARY KEY (id, created_at)) PARTITION BY RANGE (created_at);\nCREATE TABLE events_2026_08 PARTITION OF events FOR VALUES FROM (\'2026-08-01\') TO (\'2026-09-01\');\nCREATE TABLE events_2026_09 PARTITION OF events FOR VALUES FROM (\'2026-09-01\') TO (\'2026-10-01\');\nCREATE TABLE events_2026_10 PARTITION OF events FOR VALUES FROM (\'2026-10-01\') TO (\'2026-11-01\');\nCREATE INDEX ON events (user_id);','CREATE TABLE\nCREATE TABLE\nCREATE TABLE\nCREATE TABLE\nCREATE INDEX'),
 ('插入数据：行自动路由到对应分区。','INSERT INTO events (created_at, user_id, kind)\nSELECT timestamptz \'2026-08-01\' + random() * interval \'91 days\', (random() * 1000)::int, \'click\' FROM generate_series(1, 300000);\nSELECT tableoid::regclass, count(*) FROM events GROUP BY 1 ORDER BY 1;','    tableoid    | count\n----------------+--------\n events_2026_08 | 101983\n events_2026_09 |  98810\n events_2026_10 |  99207'),
 ('分区裁剪。','EXPLAIN SELECT count(*) FROM events WHERE created_at >= \'2026-10-01\';',' Aggregate\n   ->  Seq Scan on events_2026_10 events\n         Filter: (created_at >= \'2026-10-01 00:00:00+08\'::timestamp with time zone)'),
 ('没有分区键：扫描所有分区。','EXPLAIN SELECT * FROM events WHERE user_id = 42;',' Append\n   ->  Bitmap Heap Scan on events_2026_08 events_1 …\n   ->  Bitmap Heap Scan on events_2026_09 events_2 …\n   ->  Bitmap Heap Scan on events_2026_10 events_3 …'),
 ('超出范围的行被拒绝；加默认分区后可以插入。','INSERT INTO events (created_at, kind) VALUES (\'2026-12-05\', \'x\');\nCREATE TABLE events_default PARTITION OF events DEFAULT;\nINSERT INTO events (created_at, kind) VALUES (\'2026-12-05\', \'x\');','ERROR:  no partition of relation "events" found for row\nDETAIL:  Partition key of the failing row contains (created_at) = (2026-12-05 00:00:00+08).\nCREATE TABLE\nINSERT 0 1'),
 ('删除最老的一个月。','ALTER TABLE events DETACH PARTITION events_2026_08 CONCURRENTLY;\nDROP TABLE events_2026_08;','ALTER TABLE\nDROP TABLE')],
 ('把一张大表在线改成分区表','现有 events 表 6 亿行、未分区，持续写入。要改为按月分区，不能停机。描述可行的迁移步骤。',
 '<p>PostgreSQL 不能把现有表直接转换为分区表，但可以把它整个挂成一个分区：</p><pre class="cmd">BEGIN;\nSET lock_timeout = \'3s\';\nALTER TABLE events RENAME TO events_legacy;\nCREATE TABLE events (LIKE events_legacy INCLUDING DEFAULTS INCLUDING CONSTRAINTS)\n  PARTITION BY RANGE (created_at);\n-- 事先在 events_legacy 上加好 CHECK (created_at &lt; \'2026-11-01\') NOT VALID，再 VALIDATE（不阻塞写入）\nALTER TABLE events ATTACH PARTITION events_legacy FOR VALUES FROM (MINVALUE) TO (\'2026-11-01\');\nCREATE TABLE events_2026_11 PARTITION OF events FOR VALUES FROM (\'2026-11-01\') TO (\'2026-12-01\');\nCOMMIT;</pre><p>预先存在的 CHECK 约束证明了所有行都在范围内，ATTACH 不需要再扫描 6 亿行，整个事务只需要短暂的排他锁。新数据从此写进按月的新分区。旧数据留在 legacy 分区里，随着时间推移，可以按月从 legacy 中搬出（INSERT 到新的月份分区再从 legacy 删除，分批进行），或者干脆等它整体过期后一次 DETACH + DROP。注意：主键必须包含 created_at；序列/identity 列、外键引用、视图依赖都要事先处理；应用中引用表名的地方不变。也可以用逻辑复制或触发器双写同步到一张新的分区表再切换，适合需要同时重新组织旧数据的情况。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
