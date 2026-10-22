TITLE='写偏斜、幻读与可串行化';DESC='快照隔离防住了脏读、读偏差和（在 PostgreSQL 中）丢失更新，但还有一类更隐蔽的异常：两个事务读取同一批数据，各自根据读到的结果修改了不同的对象，合起来却破坏了不变式——写偏斜。本课用值班医生、会议室预订、用户名注册等例子讲写偏斜与幻读，然后讲实现可串行化的三种方法：真正的串行执行、两阶段锁（2PL）和可串行化快照隔离（SSI）。';NEXT='分布式事务：两阶段提交与精确一次';MIN=70
SUM=['<b>写偏斜</b>：医院要求任何时候至少有一名医生值班。两名值班医生同时请假：各自的事务都检查“当前值班人数 ≥ 2”，都成立，于是各自把<b>自己</b>的记录改为不值班——两个事务修改的是不同的行，所以既不是脏写也不是丢失更新，但提交后没人值班了。模式：① SELECT 检查条件；② 根据结果决定；③ 写入，而这次写入改变了 ① 的结果。',
'<b>更多例子</b>：会议室预订（检查时间段无冲突后插入）、多人游戏中两个玩家把棋子移到同一格、用户名注册（检查不存在后插入，可用唯一约束解决）、防止重复花费（余额检查）。',
'<b>幻读</b>：一个事务中的写入改变了另一个事务中某个<b>查询条件</b>的结果。当检查的是“不存在满足条件的行”时（会议室没有冲突的预订），<code>SELECT FOR UPDATE</code> 无行可锁。<b>物化冲突</b>：人为创建可以加锁的行（例如为每个会议室的每 15 分钟时段预先建一行），把幻读变成行锁冲突——容易出错，是最后的手段。',
'<b>真正的串行执行</b>：在单个线程上逐个执行事务，根本不存在并发（VoltDB、Redis 的 Lua 脚本与 MULTI）。前提：事务短小，整个事务以<b>存储过程</b>形式一次性提交（不能与用户交互等待），数据集能放进内存，写吞吐一个 CPU 核扛得住（或者能按分片划分，跨分片事务很少）。',
'<b>两阶段锁（2PL）</b>：读需要共享锁，写需要排他锁，锁一直持有到事务结束（第一阶段获取、第二阶段全部释放）。写者阻塞读者、读者也阻塞写者。为了防止幻读还需要<b>谓词锁</b>（锁住满足某个条件的所有行，包括还不存在的）——实际用<b>索引范围锁</b>近似。代价：吞吐量和响应时间明显变差，死锁频繁。MySQL InnoDB 的 SERIALIZABLE、SQL Server 使用 2PL。',
'<b>可串行化快照隔离（SSI）</b>：乐观的方法——事务照常在快照上执行，提交时检查是否可能违反可串行化：① 读取了已被其他事务修改、但修改在快照时尚未提交的数据（读到了过时的前提）；② 写入影响了其他事务之前的读取（通过记录读过的索引范围）。检测到冲突就中止，由应用重试。没有阻塞，只读事务从不需要等待；代价是冲突率高时大量中止。PostgreSQL 的 SERIALIZABLE、CockroachDB、FoundationDB 都基于这类思想。']
def secs(prac,E):
    return [
('值班医生的写偏斜','两个事务各自修改了不同的行。','<div id="p1"></div>'),
('动手：三种隔离方式','对同一个写偏斜场景，比较可重复读、2PL 和 SSI。','<div class="chal"><div class="cmds" id="hq"></div><pre class="log" id="hp" style="height:auto;min-height:130px;white-space:pre;overflow-x:auto"></pre><div class="msg" id="hm"></div></div>'),
('SSI 如何发现冲突','读到过时前提的事务在提交时被中止。','<div id="p2"></div>'),
('Redis 中的串行执行','单线程执行的 Lua 脚本天然可串行化。','<div id="t4"></div>'),
('在你的电脑上练习','两个 psql 窗口 T1、T2。',prac([
 ('准备数据：两名值班医生。','CREATE TABLE doctors(name text PRIMARY KEY, on_call bool);\nINSERT INTO doctors VALUES (\'alice\', true), (\'bob\', true), (\'carol\', false);','CREATE TABLE\nINSERT 0 3'),
 ('T1 与 T2 都以可重复读开始，并检查值班人数。','BEGIN ISOLATION LEVEL REPEATABLE READ;\nSELECT count(*) FROM doctors WHERE on_call;',' count\n-------\n     2'),
 ('T1 让 alice 下班；T2 让 bob 下班；先后提交。','-- T1:\nUPDATE doctors SET on_call = false WHERE name = \'alice\'; COMMIT;\n-- T2:\nUPDATE doctors SET on_call = false WHERE name = \'bob\'; COMMIT;','UPDATE 1\nCOMMIT\nUPDATE 1\nCOMMIT'),
 ('不变式被破坏：没人值班。','SELECT count(*) FROM doctors WHERE on_call;',' count\n-------\n     0'),
 ('恢复数据后，改用 SERIALIZABLE 重做步骤 2–3。','UPDATE doctors SET on_call = true WHERE name IN (\'alice\', \'bob\');\n-- T1 与 T2：\nBEGIN ISOLATION LEVEL SERIALIZABLE;\nSELECT count(*) FROM doctors WHERE on_call;\n-- T1:\nUPDATE doctors SET on_call = false WHERE name = \'alice\'; COMMIT;\n-- T2:\nUPDATE doctors SET on_call = false WHERE name = \'bob\'; COMMIT;','（T1）COMMIT\n（T2）ERROR:  could not serialize access due to read/write dependencies among transactions\nHINT:  The transaction might succeed if retried.\n（错误可能出现在 T2 的 UPDATE 或 COMMIT 上）'),
 ('T2 重试：此时只剩 1 人值班，检查不通过，应用拒绝请假。','BEGIN ISOLATION LEVEL SERIALIZABLE;\nSELECT count(*) FROM doctors WHERE on_call;\nROLLBACK;',' count\n-------\n     1'),
 ('会议室预订的另一种解法：PostgreSQL 的排他约束直接禁止重叠区间（不依赖隔离级别）。','CREATE EXTENSION IF NOT EXISTS btree_gist;\nCREATE TABLE bookings(room int, during tstzrange, EXCLUDE USING gist (room WITH =, during WITH &&));\nINSERT INTO bookings VALUES (1, \'[2026-10-23 10:00, 2026-10-23 11:00)\');\nINSERT INTO bookings VALUES (1, \'[2026-10-23 10:30, 2026-10-23 12:00)\');','CREATE TABLE\nINSERT 0 1\nERROR:  conflicting key value violates exclusion constraint "bookings_room_during_excl"')],
 ('识别并修复写偏斜','一个优惠券系统：每个用户每天最多领 3 张券。代码：<pre style="overflow-x:auto">BEGIN;  -- 读已提交\nSELECT count(*) FROM claims WHERE user_id = $1 AND day = current_date;\n-- 若 &lt; 3：\nINSERT INTO claims(user_id, day, coupon_id) VALUES ($1, current_date, $2);\nCOMMIT;</pre>用户用脚本并发请求，领到了 7 张。请：① 解释为什么这是写偏斜/幻读；② 给出至少三种修复方式及其取舍。',
 '<ol><li>每个并发事务都读到 count &lt; 3，然后各自插入<b>新行</b>——它们修改的不是同一行，行锁冲突不存在；检查的是“满足条件的行数”，新插入的行正好改变了其他事务查询的结果，是幻读导致的写偏斜。<code>SELECT … FOR UPDATE</code> 也不行：它只锁已有的行。</li><li><b>SERIALIZABLE</b>：把事务改为可串行化，SSI 会中止其中冲突的事务，应用重试。改动最小；需要重试逻辑，热点用户冲突多。</li><li><b>物化冲突 / 锁一个父行</b>：在 <code>user_daily(user_id, day, n)</code> 中维护计数，<code>UPDATE user_daily SET n = n + 1 WHERE user_id = $1 AND day = current_date AND n &lt; 3</code>，影响 0 行则拒绝——原子操作 + 行锁，简单高效；也可以先 <code>SELECT … FROM users WHERE id = $1 FOR UPDATE</code> 串行化同一用户的请求。</li><li><b>约束</b>：增加 <code>slot smallint CHECK (slot BETWEEN 1 AND 3)</code> 并建唯一约束 <code>(user_id, day, slot)</code>，插入时依次尝试 slot 1、2、3，冲突即换下一个——用唯一约束表达上限。</li><li>咨询锁 <code>pg_advisory_xact_lock(user_id)</code> 也可以串行化同一用户的事务，但只在所有代码路径都使用它时有效。</li></ol>'))),
('自测','选完显示解释。答错可以再选。','<div id="qs"></div>')]
