const P=(t,c='sig')=>({cls:'pill '+c,html:t});const B=(t,c='',w=80,h=36)=>({w,h,cls:'blk '+c,html:t});
const e={};for(let i=0;i<8;i++)e['t'+i]=B(i%3===1?'死':'活','',60);e.ix=B('索引条目 → 死元组','',170);e.hz=P('最老快照 xmin = 1012：比它更新的死元组不能清理','sig');e.s1=P('① 扫描堆，收集可删除的 TID','sig');e.s2=P('② 扫描每个索引，删除指向这些 TID 的条目','sig');e.s3=P('③ 回到堆，标记行指针可复用，更新 FSM 和可见性映射','ok');e.sz=P('文件大小不变，空间留给之后的插入和更新','mute');
const tp=(m={})=>{const o={};for(let i=0;i<8;i++)o['t'+i]=[i*70,0,m[i]?{cls:'blk '+m[i]}:{cls:'blk '+(i%3===1?'bad':'')}];return o};
Player(document.getElementById('p1'),{els:e,scenes:[
 {t:'死元组',p:'UPDATE 和 DELETE 留下的旧版本对新事务不可见，但仍占据页空间，索引也仍指向它们。',set:{...tp(),ix:[0,50]}},
 {t:'收集',p:'VACUUM 先确定视界：所有会话中最老的快照。只有比它更早结束的事务删除的元组才是真正的“死”。',d:4000,set:{...tp(),hz:[0,50],s1:[0,95]}},
 {t:'清理索引',p:'对每个索引执行一遍批量删除。索引越多，VACUUM 越慢。死元组 TID 放不进内存时，要多轮扫描索引。',d:4000,set:{...tp(),s1:[0,50],s2:[0,95]}},
 {t:'回收',p:'把堆中的行指针标为可用，页内空间整理，记录到空闲空间映射。全部可见的页在可见性映射中置位，之后 VACUUM 可以跳过、Index Only Scan 可以不回表。',d:4400,set:{...tp({1:'mute',4:'mute',7:'mute'}),s3:[0,50],sz:[0,95]}}]});
const e2={ring:{w:200,h:200,cls:'frame',html:'<i>xid 环（2³² ≈ 43 亿）</i>'},me:P('当前 xid','sig'),past:P('过去 20 亿：可见','ok'),fut:P('未来 20 亿：不可见','mute'),old:P('一个 25 亿前的元组 → 落到“未来”半圈 → 突然消失','bad'),fr:P('冻结：标记为“比任何事务都老”，不再参与比较','ok'),wa:P('age(datfrozenxid) > 2 亿：强制防回卷 VACUUM','sig'),st:P('剩余 < 300 万：拒绝分配新 xid，只读','bad')};
Player(document.getElementById('p2'),{els:e2,scenes:[
 {t:'环形比较',p:'事务 ID 是 32 位，用完会从头开始。比较两个 xid 时看它们在环上的相对位置：前面一半是过去，后面一半是未来。',set:{ring:[0,0],me:[220,10],past:[220,50],fut:[220,90]}},
 {t:'回卷的危险',p:'如果一个元组的 xmin 比当前事务早了 20 亿以上，它会被当作“未来”的事务创建的，于是对所有人不可见：数据看起来丢失了。',d:4400,set:{ring:[0,0],me:[220,10],old:[220,50]}},
 {t:'冻结',p:'VACUUM 把足够老的元组标记为冻结，它们对所有事务永久可见，不再需要比较 xmin。全部冻结的页在冻结映射中置位，下次可以跳过。',d:4200,set:{ring:[0,0],me:[220,10],fr:[220,50]}},
 {t:'保护机制',p:'表的最老未冻结 xid 太老时，autovacuum 强制运行（日志中显示 to prevent wraparound），而且不能被取消。再拖下去，数据库会停止接受写入。',d:4400,set:{ring:[0,0],me:[220,10],wa:[220,50],st:[220,90]}}]});
(()=>{const Q=[['长事务',"SELECT pid, state, now() - xact_start AS age, backend_xmin, left(query, 40)\nFROM pg_stat_activity WHERE backend_xmin IS NOT NULL ORDER BY xact_start LIMIT 3;\n\n  pid  |        state        |   age    | backend_xmin | left\n-------+---------------------+----------+--------------+------------------------\n 22811 | idle in transaction | 3 days   |     88123401 | SELECT * FROM report_…\n  1873 | active              | 00:00:02 |     91022010 | UPDATE orders SET …",'bad','一个空闲事务开了 3 天，xmin 视界停在 3 天前。期间所有表的死元组都无法清理。pg_terminate_backend(22811)，并设置 idle_in_transaction_session_timeout。'],
['复制槽',"SELECT slot_name, active, xmin, catalog_xmin,\n       pg_size_pretty(pg_current_wal_lsn() - restart_lsn) AS behind\nFROM pg_replication_slots;\n\n  slot_name   | active | xmin | catalog_xmin |  behind\n--------------+--------+------+--------------+---------\n debezium_old | f      |      |     71200345 | 412 GB",'bad','废弃的逻辑复制槽：catalog_xmin 阻止清理系统表，还让 412 GB 的 WAL 无法回收。确认没人使用后 pg_drop_replication_slot(\'debezium_old\')。17+ 可设 idle_replication_slot_timeout（18）或 max_slot_wal_keep_size 兜底。'],
['副本反馈',"SELECT application_name, backend_xmin FROM pg_stat_replication;\n\n application_name | backend_xmin\n------------------+--------------\n replica-analytics|     80011230",'sig','副本开启了 hot_standby_feedback，它上面一个跑了几个小时的分析查询通过反馈让主库保留旧版本。可以关掉反馈（代价是副本查询可能被取消），或把分析放到单独的、不反馈的副本。'],
['autovacuum 进度',"SELECT relid::regclass, phase, heap_blks_scanned, heap_blks_total, index_vacuum_count\nFROM pg_stat_progress_vacuum;\n\n relid  |       phase       | heap_blks_scanned | heap_blks_total | index_vacuum_count\n--------+-------------------+-------------------+-----------------+--------------------\n events | vacuuming indexes |          31002144 |       104857600 |                  6",'sig','已经第 6 次扫描索引：autovacuum_work_mem 太小，放不下全部死元组 TID，每装满一次就要扫一遍所有索引。调大 autovacuum_work_mem，并降低大表的 scale_factor 让每次处理的量变少。'],
['死元组统计',"SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, autovacuum_count\nFROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 3;\n\n relname | n_live_tup | n_dead_tup |      last_autovacuum       | autovacuum_count\n---------+------------+------------+----------------------------+-----------------\n events  |  800000000 |  140000000 | 2026-09-24 03:12:01+08     |               4",'bad','1.4 亿死元组还没到默认 20% 的阈值（1.6 亿），上次 autovacuum 是 4 周前。表级调低 autovacuum_vacuum_scale_factor。'],
['两阶段事务',"SELECT gid, prepared, owner FROM pg_prepared_xacts;\n\n     gid      |           prepared            | owner\n--------------+-------------------------------+-------\n tx-8812-a    | 2026-08-02 11:20:13.1+08      | app",'bad','一个两阶段提交事务 PREPARE 后协调者再也没有 COMMIT/ROLLBACK，它会一直持有锁和 xmin，重启也不会消失。确认后 ROLLBACK PREPARED \'tx-8812-a\'。不用 2PC 就保持 max_prepared_transactions = 0。']];
 const q=document.getElementById('hq'),p=document.getElementById('hp'),m=document.getElementById('hm');
 Q.forEach(([t],i)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.addEventListener('click',()=>{q.querySelectorAll('.btn').forEach(x=>x.classList.toggle('pri',x===b));p.textContent=Q[i][1];m.className='msg '+Q[i][2];m.innerHTML=Q[i][3]});q.appendChild(b)});
 m.className='msg';m.innerHTML='VACUUM VERBOSE 显示“dead but not yet removable”很多，或 n_dead_tup 持续增长。'})();
Term(document.getElementById('t4'),[
['SELECT name, setting FROM pg_settings WHERE name LIKE \'autovacuum%scale_factor\' OR name IN (\'autovacuum_max_workers\',\'autovacuum_vacuum_cost_limit\',\'autovacuum_freeze_max_age\');','                 name                  |  setting\n---------------------------------------+-----------\n autovacuum_analyze_scale_factor       | 0.1\n autovacuum_freeze_max_age             | 200000000\n autovacuum_max_workers                | 3\n autovacuum_vacuum_cost_limit          | -1\n autovacuum_vacuum_insert_scale_factor | 0.2\n autovacuum_vacuum_scale_factor        | 0.2','cost_limit = -1 表示使用 vacuum_cost_limit（200）。'],
['SELECT pid, datname, relid::regclass, phase FROM pg_stat_progress_vacuum;','…','正在进行的 VACUUM 进度。'],
['VACUUM (VERBOSE, ANALYZE, PARALLEL 4) orders;','INFO: …','手动 VACUUM，并行清理索引。'],
['VACUUM (FREEZE) orders;','VACUUM','主动冻结，用于在低峰期提前处理即将达到防回卷阈值的表。'],
['SELECT datname, age(datfrozenxid), 2^31 - age(datfrozenxid) AS remaining FROM pg_database ORDER BY 2 DESC;',' datname |   age    |  remaining\n---------+----------+------------\n shop    | 18233401 | 2129250247','回卷监控：age 超过 10 亿就该报警。'],
['SELECT * FROM pgstattuple(\'orders\');',' table_len | tuple_count | … | dead_tuple_percent | free_percent\n-----------+-------------+---+--------------------+-------------\n  11231232 |      100000 |   |               0.12 |        21.30','精确测量膨胀（会扫全表）。pgstattuple_approx 更快。']]);
Quiz(document.getElementById('qs'),[
['普通 VACUUM 之后表文件会变小吗？',['通常不会，空间被标记为可复用','会，回到最小','会，但锁表'],0,''],
['大表默认 autovacuum 太迟，应调？',['autovacuum_vacuum_scale_factor','shared_buffers','max_connections'],0,''],
['VACUUM 报 dead but not yet removable，首先查？',['长事务、复制槽、副本反馈','磁盘空间','索引类型'],0,''],
['冻结是为了解决？',['膨胀','事务 ID 回卷','死锁'],1,''],
['VACUUM FULL 的主要问题？',['不回收空间','持有排他锁，阻塞读写','只处理索引'],1,'']]);
