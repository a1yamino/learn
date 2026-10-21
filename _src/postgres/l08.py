TITLE='WAL：预写日志与检查点';DESC='PostgreSQL 修改数据页时并不立即写回数据文件，而是先把“做了什么”写进预写日志（WAL）。本课讲 WAL 如何保证提交不丢、LSN 是什么、崩溃恢复怎么从检查点开始重放、full-page writes 为什么存在，以及 checkpoint 和 max_wal_size 的调优。WAL 也是复制（第 18 课）和 PITR（第 23 课）的基础。';NEXT='缓冲区与 I/O：shared_buffers 与操作系统缓存';MIN=60
SUM=['<b>预写规则</b>：数据页被写回磁盘之前，描述这次修改的 WAL 记录必须先落盘。提交时只需顺序写并 fsync WAL，数据页可以在之后慢慢写，随机写变顺序写。',
'WAL 是一串记录，位置用 <b>LSN</b>（如 <code>0/1A3C2F8</code>，字节偏移）表示，存放在 <code>pg_wal/</code> 下 16 MB 的段文件中。每个数据页头记录最后修改它的 LSN。',
'<b>检查点</b>把所有脏页写回数据文件并记录一个位置。崩溃后从最近的检查点开始重放 WAL 到末尾，就恢复到崩溃前已提交的状态。检查点之前的 WAL 段可以回收（除非复制槽或归档还需要）。',
'检查点由 <code>checkpoint_timeout</code>（默认 5 min）或 WAL 量达到 <code>max_wal_size</code>（默认 1 GB）触发。<code>checkpoint_completion_target = 0.9</code> 把写入摊开。日志中频繁出现 “checkpoints are occurring too frequently” 说明 max_wal_size 太小。',
'<b>full_page_writes</b>：检查点后某页第一次被修改时，WAL 中写入整页镜像，防止断电造成的半页写（torn page）无法恢复。这也是检查点越频繁、WAL 越多的原因。',
'<code>synchronous_commit = off</code> 让 COMMIT 不等 WAL 刷盘：崩溃时可能丢最近几百毫秒的已提交事务，但不会损坏数据。可以按事务设置，适合可丢的日志类写入。<code>fsync = off</code> 则可能损坏整个库，生产不要用。']
def secs(prac,E):
    return [
('先写日志，再写数据','一次 UPDATE 和 COMMIT 背后的写入顺序。','<div id="p1"></div>'),
('崩溃恢复','从检查点开始重放。','<div id="p2"></div>'),
('动手：在这里断电会怎样','选择一个时刻让服务器断电，看重启后的结果。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:70px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('相关命令','观察 WAL 与检查点。','<div id="t4"></div>'),
('在你的电脑上练习','使用 shop 库，需要超级用户。',prac([
 ('当前 WAL 位置和所在段文件。','SELECT pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn());',' pg_current_wal_lsn |     pg_walfile_name\n--------------------+--------------------------\n 0/1A3C2F8          | 000000010000000000000001'),
 ('一次批量更新产生了多少 WAL。','SELECT pg_current_wal_lsn() AS before \\gset\nUPDATE orders SET amount = amount;\nSELECT pg_size_pretty(pg_current_wal_lsn() - :\'before\'::pg_lsn);','UPDATE 100000\n pg_size_pretty\n----------------\n 24 MB'),
 ('段文件。','docker exec pg ls /var/lib/postgresql/18/docker/pg_wal | head -4','000000010000000000000001\n000000010000000000000002\n000000010000000000000003\narchive_status'),
 ('用 pg_waldump 看 WAL 记录。','docker exec -u postgres pg pg_waldump -n 5 /var/lib/postgresql/18/docker/pg_wal/000000010000000000000002','rmgr: Heap   len (rec/tot): 72/72, tx: 830, lsn: 0/02000028, desc: HOT_UPDATE off: 4 …, blkref #0: rel 1663/16384/16401 blk 12\nrmgr: Heap   len (rec/tot): 72/72, tx: 830, lsn: 0/02000070, desc: HOT_UPDATE …\n…'),
 ('手动检查点，看检查点统计（PostgreSQL 17+ 在 pg_stat_checkpointer）。','CHECKPOINT;\nSELECT num_timed, num_requested, buffers_written FROM pg_stat_checkpointer;',' num_timed | num_requested | buffers_written\n-----------+---------------+-----------------\n        14 |             3 |            2981'),
 ('模拟崩溃：kill -9 主进程，重启后看日志中的恢复过程。','docker exec pg bash -c \'kill -9 $(head -1 /var/lib/postgresql/18/docker/postmaster.pid)\'\ndocker start pg && docker logs pg 2>&1 | tail -5','LOG:  database system was interrupted; last known up at 2026-10-22 10:41:02\nLOG:  database system was not properly shut down; automatic recovery in progress\nLOG:  redo starts at 0/3A21F40\nLOG:  redo done at 0/3B10C28 …\nLOG:  database system is ready to accept connections')],
 ('估算 max_wal_size','某服务在高峰期每分钟产生约 300 MB WAL，日志里频繁出现 “checkpoints are occurring too frequently (24 seconds apart)”。希望检查点约每 15 分钟一次。给出 checkpoint_timeout 和 max_wal_size 的设置，并说明调大的代价。',
 '<pre class="cmd">ALTER SYSTEM SET checkpoint_timeout = \'15min\';\nALTER SYSTEM SET max_wal_size = \'8GB\';\nSELECT pg_reload_conf();</pre><p>15 分钟 × 300 MB ≈ 4.5 GB。max_wal_size 是两次检查点之间允许的 WAL 量的软上限（大致对应 1 + completion_target 个检查点周期），设到 8 GB 左右，让检查点主要由时间触发。收益：检查点少了，full-page writes 显著减少，WAL 量和 I/O 都下降。代价：pg_wal 需要更多磁盘空间（峰值可能超过设置）；崩溃恢复需要重放更多 WAL，恢复时间变长（重放通常比生成快，几 GB 一般在一两分钟内）。两个参数都只需 reload。</p>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
